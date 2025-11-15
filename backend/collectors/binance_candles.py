"""
Binance Candle Data Collector
Fetches historical candlestick data and streams real-time klines
"""
import asyncio
import json
import websockets
from typing import Optional, List
import aiohttp
from backend.config import (
    BINANCE_WS_URL,
    BINANCE_REST_URL,
    SYMBOL_LOWER,
    HEARTBEAT_INTERVAL_SECONDS,
)
from backend.cache.redis_manager import redis_manager
from backend.utils.logger import setup_logger
from backend.utils.reconnect import ReconnectManager

logger = setup_logger(__name__)

# Supported timeframes
TIMEFRAMES = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d']


class BinanceCandleCollector:
    """Collects candlestick data from Binance"""

    def __init__(self, timeframe: str = '15m'):
        self.timeframe = timeframe
        self.ws: Optional[websockets.WebSocketClientProtocol] = None
        self.reconnect_manager = ReconnectManager()
        self.is_running = False
        self.candles = []

    async def get_historical_candles(self, limit: int = 500) -> Optional[List]:
        """
        Get historical candlestick data from REST API

        Args:
            limit: Number of candles to fetch (max 1000)

        Returns:
            List of candles or None
        """
        url = f"{BINANCE_REST_URL}/klines"
        params = {
            'symbol': SYMBOL_LOWER.upper(),
            'interval': self.timeframe,
            'limit': min(limit, 1000)
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        # Convert to lightweight-charts format
                        candles = []
                        for kline in data:
                            candles.append({
                                'time': int(kline[0] / 1000),  # Convert to seconds
                                'open': float(kline[1]),
                                'high': float(kline[2]),
                                'low': float(kline[3]),
                                'close': float(kline[4]),
                                'volume': float(kline[5])
                            })
                        logger.info(f"Retrieved {len(candles)} historical candles for {self.timeframe}")
                        return candles
                    else:
                        logger.error(f"Failed to get candles: HTTP {response.status}")
                        return None
        except Exception as e:
            logger.error(f"Error getting historical candles: {e}")
            return None

    async def connect(self) -> bool:
        """
        Establish WebSocket connection to Binance kline stream

        Returns:
            True if successful, False otherwise
        """
        stream_name = f"{SYMBOL_LOWER}@kline_{self.timeframe}"
        url = f"{BINANCE_WS_URL}/{stream_name}"

        try:
            self.ws = await websockets.connect(url)
            logger.info(f"Connected to Binance Kline WebSocket: {stream_name}")
            self.reconnect_manager.reset()
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Binance Kline WebSocket: {e}")
            return False

    async def on_message(self, message: str) -> None:
        """
        Handle incoming kline message

        Args:
            message: Raw WebSocket message
        """
        try:
            data = json.loads(message)

            if 'e' in data and data['e'] == 'kline':
                kline = data['k']
                candle_data = {
                    'time': int(kline['t'] / 1000),  # Convert to seconds
                    'open': float(kline['o']),
                    'high': float(kline['h']),
                    'low': float(kline['l']),
                    'close': float(kline['c']),
                    'volume': float(kline['v']),
                    'is_final': kline['x']  # Is candle closed
                }

                # Store in Redis
                redis_key = f"candles:{SYMBOL_LOWER.upper()}:{self.timeframe}"
                await redis_manager.redis_client.setex(
                    redis_key,
                    300,  # 5 minutes TTL
                    json.dumps(candle_data)
                )

                # Publish update
                await redis_manager.publish('candle_updates', {
                    'timeframe': self.timeframe,
                    'candle': candle_data
                })

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse kline message: {e}")
        except Exception as e:
            logger.error(f"Error processing kline message: {e}")

    async def heartbeat(self) -> None:
        """Send periodic heartbeat to keep connection alive"""
        while self.is_running:
            try:
                if self.ws and self.ws.open:
                    await self.ws.ping()
                    logger.debug(f"Kline heartbeat sent ({self.timeframe})")
                await asyncio.sleep(HEARTBEAT_INTERVAL_SECONDS)
            except Exception as e:
                logger.error(f"Kline heartbeat error: {e}")

    async def start(self) -> None:
        """Start collecting candle data"""
        self.is_running = True

        # Get historical data first
        historical = await self.get_historical_candles()
        if historical:
            self.candles = historical
            # Store in Redis
            redis_key = f"candles_historical:{SYMBOL_LOWER.upper()}:{self.timeframe}"
            await redis_manager.redis_client.setex(
                redis_key,
                3600,  # 1 hour TTL
                json.dumps(historical)
            )

        # Start heartbeat task
        heartbeat_task = asyncio.create_task(self.heartbeat())

        while self.is_running:
            try:
                # Connect to WebSocket
                if not await self.connect():
                    if await self.reconnect_manager.wait():
                        continue
                    else:
                        logger.error(f"Max reconnection attempts reached for {self.timeframe}")
                        break

                # Listen for messages
                async for message in self.ws:
                    await self.on_message(message)

            except websockets.exceptions.ConnectionClosed:
                logger.warning(f"Kline WebSocket connection closed ({self.timeframe})")
                if await self.reconnect_manager.wait():
                    continue
                else:
                    break
            except Exception as e:
                logger.error(f"Unexpected error in candle collector: {e}")
                if await self.reconnect_manager.wait():
                    continue
                else:
                    break

        # Cleanup
        heartbeat_task.cancel()
        if self.ws:
            await self.ws.close()

    async def stop(self) -> None:
        """Stop the collector"""
        self.is_running = False
        if self.ws:
            await self.ws.close()
        logger.info(f"Candle collector stopped ({self.timeframe})")


# Global collectors for different timeframes
candle_collectors = {}


async def start_candle_collector(timeframe: str = '15m'):
    """Start a candle collector for specific timeframe"""
    if timeframe not in TIMEFRAMES:
        logger.error(f"Invalid timeframe: {timeframe}")
        return

    collector = BinanceCandleCollector(timeframe)
    candle_collectors[timeframe] = collector
    await collector.start()


async def get_historical_candles(timeframe: str = '15m', limit: int = 500):
    """Get historical candles for a timeframe"""
    collector = BinanceCandleCollector(timeframe)
    return await collector.get_historical_candles(limit)
