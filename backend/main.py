"""
FastAPI Main Application
Orchestrates all components of the BTC Liquidity Heatmap backend
"""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from backend.config import CORS_ORIGINS, WS_SERVER_HOST, WS_SERVER_PORT
from backend.cache.redis_manager import redis_manager
from backend.collectors.binance_orderbook import orderbook_collector
from backend.collectors.binance_trades import trades_collector
from backend.collectors.binance_candles import start_candle_collector, get_historical_candles, TIMEFRAMES
from backend.websocket.server import (
    websocket_endpoint,
    stream_orderbook_updates,
    stream_trade_updates,
    stream_footprint_updates,
    stream_liquidation_updates,
    stream_candle_updates
)
from backend.utils.logger import setup_logger

logger = setup_logger(__name__)


# Background tasks storage
background_tasks = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager
    Handles startup and shutdown events
    """
    # Startup
    logger.info("Starting BTC Liquidity Heatmap Backend...")

    try:
        # Connect to Redis
        await redis_manager.connect()
        logger.info("Redis connected")

        # Start data collectors
        orderbook_task = asyncio.create_task(orderbook_collector.start())
        trades_task = asyncio.create_task(trades_collector.start())
        # Start default candle collector (15m)
        candle_task = asyncio.create_task(start_candle_collector('15m'))
        background_tasks.extend([orderbook_task, trades_task, candle_task])
        logger.info("Data collectors started")

        # Start WebSocket stream processors
        # Note: These subscribe to Redis and will block, so we run them as background tasks
        stream_orderbook_task = asyncio.create_task(stream_orderbook_updates())
        stream_trades_task = asyncio.create_task(stream_trade_updates())
        stream_footprint_task = asyncio.create_task(stream_footprint_updates())
        stream_liquidations_task = asyncio.create_task(stream_liquidation_updates())
        stream_candles_task = asyncio.create_task(stream_candle_updates())
        background_tasks.extend([
            stream_orderbook_task,
            stream_trades_task,
            stream_footprint_task,
            stream_liquidations_task,
            stream_candles_task
        ])
        logger.info("WebSocket stream processors started")

        logger.info("✅ Backend startup complete!")

        yield

    except Exception as e:
        logger.error(f"Error during startup: {e}")
        raise

    finally:
        # Shutdown
        logger.info("Shutting down BTC Liquidity Heatmap Backend...")

        # Stop collectors
        await orderbook_collector.stop()
        await trades_collector.stop()
        logger.info("Data collectors stopped")

        # Cancel background tasks
        for task in background_tasks:
            task.cancel()
        await asyncio.gather(*background_tasks, return_exceptions=True)
        logger.info("Background tasks cancelled")

        # Disconnect from Redis
        await redis_manager.disconnect()
        logger.info("Redis disconnected")

        logger.info("✅ Backend shutdown complete!")


# Create FastAPI application
app = FastAPI(
    title="BTC Liquidity Heatmap API",
    description="Real-time BTC/USDT orderbook heatmap and liquidation analysis",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Routes
@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "name": "BTC Liquidity Heatmap API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "websocket": "/ws",
            "health": "/health",
            "docs": "/docs"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check Redis connection
        await redis_manager.redis_client.ping()
        redis_status = "connected"
    except Exception:
        redis_status = "disconnected"

    return {
        "status": "healthy",
        "redis": redis_status,
        "collectors": {
            "orderbook": orderbook_collector.is_running,
            "trades": trades_collector.is_running
        }
    }


@app.websocket("/ws")
async def websocket_route(websocket: WebSocket):
    """
    WebSocket endpoint for real-time data streaming

    Clients can connect to this endpoint to receive:
    - Orderbook updates
    - Trade updates
    - Liquidation estimates
    - Volume footprint data
    """
    await websocket_endpoint(websocket)


@app.get("/api/orderbook")
async def get_orderbook():
    """Get current orderbook snapshot"""
    from backend.processors.heatmap_processor import process_orderbook

    orderbook = await redis_manager.get_orderbook()
    if not orderbook:
        return {"error": "No orderbook data available"}

    return process_orderbook(orderbook)


@app.get("/api/trades")
async def get_trades():
    """Get recent trades"""
    trades = await redis_manager.get_trades()
    return {"trades": trades, "count": len(trades)}


@app.get("/api/walls")
async def get_walls():
    """Get detected orderbook walls"""
    walls = await redis_manager.get_walls()
    return walls or {"bid_walls": [], "ask_walls": []}


@app.get("/api/footprint")
async def get_footprint():
    """Get volume footprint analysis"""
    from backend.processors.footprint_processor import process_footprint

    trades = await redis_manager.get_trades()
    return process_footprint(trades)


@app.get("/api/liquidations")
async def get_liquidations():
    """Get liquidation estimates"""
    from backend.processors.liquidation_processor import process_liquidations

    orderbook = await redis_manager.get_orderbook()
    if not orderbook or not orderbook.get("bids") or not orderbook.get("asks"):
        return {"error": "No orderbook data available"}

    bids = orderbook.get("bids", [])
    asks = orderbook.get("asks", [])
    mid_price = (bids[0][0] + asks[0][0]) / 2 if bids and asks else 0

    return process_liquidations(mid_price, orderbook)


@app.get("/api/candles/{timeframe}")
async def get_candles(timeframe: str, limit: int = 500):
    """
    Get historical candlestick data

    Args:
        timeframe: One of 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 12h, 1d
        limit: Number of candles (max 1000)
    """
    if timeframe not in TIMEFRAMES:
        return {"error": f"Invalid timeframe. Must be one of: {', '.join(TIMEFRAMES)}"}

    candles = await get_historical_candles(timeframe, limit)
    if not candles:
        return {"error": "Failed to fetch candles"}

    return {
        "timeframe": timeframe,
        "candles": candles,
        "count": len(candles)
    }


@app.get("/api/timeframes")
async def get_timeframes():
    """Get list of supported timeframes"""
    return {
        "timeframes": TIMEFRAMES,
        "default": "15m"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=WS_SERVER_HOST,
        port=WS_SERVER_PORT,
        reload=True,
        log_level="info"
    )
