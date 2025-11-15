"""
Binance Trades WebSocket Collector
Collects individual trades for volume footprint analysis
"""
import asyncio
import json
import websockets
from typing import Optional
from collections import defaultdict
import time
from backend.config import (
    BINANCE_WS_URL,
    SYMBOL_LOWER,
    HEARTBEAT_INTERVAL_SECONDS,
    FOOTPRINT_TIME_WINDOW,
)
from backend.cache.redis_manager import redis_manager
from backend.utils.logger import setup_logger
from backend.utils.reconnect import ReconnectManager

logger = setup_logger(__name__)


class BinanceTradesCollector:
    """Collects trade data from Binance WebSocket"""

    def __init__(self):
        self.ws: Optional[websockets.WebSocketClientProtocol] = None
        self.reconnect_manager = ReconnectManager()
        self.is_running = False
        self.trades_buffer = []
        self.volume_by_price = defaultdict(lambda: {"buy": 0.0, "sell": 0.0, "count": 0})

    async def connect(self) -> bool:
        """
        Establish WebSocket connection to Binance

        Returns:
            True if successful, False otherwise
        """
        stream_name = f"{SYMBOL_LOWER}@trade"
        url = f"{BINANCE_WS_URL}/{stream_name}"

        try:
            self.ws = await websockets.connect(url)
            logger.info(f"Connected to Binance Trades WebSocket: {stream_name}")
            self.reconnect_manager.reset()
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Binance Trades WebSocket: {e}")
            return False

    async def on_message(self, message: str) -> None:
        """
        Handle incoming trade message

        Args:
            message: Raw WebSocket message
        """
        try:
            data = json.loads(message)

            if "e" in data and data["e"] == "trade":
                # Determine if buy or sell
                # m = true means buyer is maker (sell order hit bid)
                # m = false means buyer is taker (buy order hit ask)
                is_buy = not data["m"]

                trade_data = {
                    "timestamp": data["E"],
                    "trade_id": data["t"],
                    "price": float(data["p"]),
                    "quantity": float(data["q"]),
                    "is_buy": is_buy,
                    "is_maker": data["m"]
                }

                # Add to buffer
                self.trades_buffer.append(trade_data)

                # Update volume by price level
                price_rounded = round(trade_data["price"], 0)  # Round to nearest dollar
                if is_buy:
                    self.volume_by_price[price_rounded]["buy"] += trade_data["quantity"]
                else:
                    self.volume_by_price[price_rounded]["sell"] += trade_data["quantity"]
                self.volume_by_price[price_rounded]["count"] += 1

                # Clean old trades (keep only last time window)
                current_time = time.time() * 1000
                self.trades_buffer = [
                    t for t in self.trades_buffer
                    if current_time - t["timestamp"] < FOOTPRINT_TIME_WINDOW * 1000
                ]

                # Store in Redis
                await redis_manager.set_trades(self.trades_buffer)

                # Publish trade event
                await redis_manager.publish("trade_updates", trade_data)

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse trade message: {e}")
        except Exception as e:
            logger.error(f"Error processing trade message: {e}")

    async def aggregate_footprint(self) -> None:
        """Periodically aggregate and publish volume footprint data"""
        while self.is_running:
            try:
                await asyncio.sleep(1)  # Aggregate every second

                # Calculate delta for each price level
                footprint_data = []
                for price, volumes in self.volume_by_price.items():
                    delta = volumes["buy"] - volumes["sell"]
                    footprint_data.append({
                        "price": price,
                        "buy_volume": volumes["buy"],
                        "sell_volume": volumes["sell"],
                        "delta": delta,
                        "trade_count": volumes["count"]
                    })

                # Sort by price descending
                footprint_data.sort(key=lambda x: x["price"], reverse=True)

                # Publish footprint data
                await redis_manager.publish("footprint_updates", {
                    "timestamp": time.time() * 1000,
                    "footprint": footprint_data[:100]  # Top 100 levels
                })

                # Clean old data
                current_time = time.time() * 1000
                for price in list(self.volume_by_price.keys()):
                    # Remove if no recent activity
                    if self.volume_by_price[price]["count"] == 0:
                        del self.volume_by_price[price]
                    else:
                        # Decay volume over time
                        self.volume_by_price[price]["buy"] *= 0.99
                        self.volume_by_price[price]["sell"] *= 0.99

            except Exception as e:
                logger.error(f"Error aggregating footprint: {e}")

    async def heartbeat(self) -> None:
        """Send periodic heartbeat to keep connection alive"""
        while self.is_running:
            try:
                if self.ws and self.ws.open:
                    await self.ws.ping()
                    logger.debug("Trades heartbeat sent")
                await asyncio.sleep(HEARTBEAT_INTERVAL_SECONDS)
            except Exception as e:
                logger.error(f"Trades heartbeat error: {e}")

    async def start(self) -> None:
        """Start collecting trades data"""
        self.is_running = True

        # Start background tasks
        heartbeat_task = asyncio.create_task(self.heartbeat())
        aggregation_task = asyncio.create_task(self.aggregate_footprint())

        while self.is_running:
            try:
                # Connect to WebSocket
                if not await self.connect():
                    if await self.reconnect_manager.wait():
                        continue
                    else:
                        logger.error("Max reconnection attempts reached, stopping trades collector")
                        break

                # Listen for messages
                async for message in self.ws:
                    await self.on_message(message)

            except websockets.exceptions.ConnectionClosed:
                logger.warning("Trades WebSocket connection closed")
                if await self.reconnect_manager.wait():
                    continue
                else:
                    break
            except Exception as e:
                logger.error(f"Unexpected error in trades collector: {e}")
                if await self.reconnect_manager.wait():
                    continue
                else:
                    break

        # Cleanup
        heartbeat_task.cancel()
        aggregation_task.cancel()
        if self.ws:
            await self.ws.close()

    async def stop(self) -> None:
        """Stop the collector"""
        self.is_running = False
        if self.ws:
            await self.ws.close()
        logger.info("Trades collector stopped")


# Global collector instance
trades_collector = BinanceTradesCollector()
