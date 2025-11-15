"""
Binance Orderbook WebSocket Collector
Connects to Binance WebSocket API and streams orderbook updates
"""
import asyncio
import json
import websockets
from typing import Optional
import aiohttp
from backend.config import (
    BINANCE_WS_URL,
    BINANCE_REST_URL,
    SYMBOL_LOWER,
    ORDERBOOK_UPDATE_SPEED,
    HEARTBEAT_INTERVAL_SECONDS,
)
from backend.cache.redis_manager import redis_manager
from backend.utils.logger import setup_logger
from backend.utils.reconnect import ReconnectManager

logger = setup_logger(__name__)


class BinanceOrderbookCollector:
    """Collects orderbook data from Binance WebSocket"""

    def __init__(self):
        self.ws: Optional[websockets.WebSocketClientProtocol] = None
        self.reconnect_manager = ReconnectManager()
        self.is_running = False
        self.last_update_id = 0

    async def get_snapshot(self) -> Optional[dict]:
        """
        Get initial orderbook snapshot from REST API

        Returns:
            Orderbook snapshot or None
        """
        url = f"{BINANCE_REST_URL}/depth?symbol={SYMBOL_LOWER.upper()}&limit=1000"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        logger.info(f"Retrieved orderbook snapshot, lastUpdateId: {data.get('lastUpdateId')}")
                        return data
                    else:
                        logger.error(f"Failed to get snapshot: HTTP {response.status}")
                        return None
        except Exception as e:
            logger.error(f"Error getting snapshot: {e}")
            return None

    async def connect(self) -> bool:
        """
        Establish WebSocket connection to Binance

        Returns:
            True if successful, False otherwise
        """
        stream_name = f"{SYMBOL_LOWER}@depth@{ORDERBOOK_UPDATE_SPEED}"
        url = f"{BINANCE_WS_URL}/{stream_name}"

        try:
            self.ws = await websockets.connect(url)
            logger.info(f"Connected to Binance WebSocket: {stream_name}")
            self.reconnect_manager.reset()
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Binance WebSocket: {e}")
            return False

    async def on_message(self, message: str) -> None:
        """
        Handle incoming WebSocket message

        Args:
            message: Raw WebSocket message
        """
        try:
            data = json.loads(message)

            # Extract orderbook update
            if "e" in data and data["e"] == "depthUpdate":
                orderbook_data = {
                    "type": "orderbook",
                    "timestamp": data["E"],
                    "symbol": data["s"],
                    "firstUpdateId": data["U"],
                    "finalUpdateId": data["u"],
                    "bids": [[float(price), float(qty)] for price, qty in data["b"]],
                    "asks": [[float(price), float(qty)] for price, qty in data["a"]],
                }

                # Store in Redis
                await redis_manager.set_orderbook(orderbook_data)

                # Publish to subscribers
                await redis_manager.publish("orderbook_updates", orderbook_data)

                self.last_update_id = data["u"]

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse message: {e}")
        except Exception as e:
            logger.error(f"Error processing message: {e}")

    async def heartbeat(self) -> None:
        """Send periodic heartbeat to keep connection alive"""
        while self.is_running:
            try:
                if self.ws and self.ws.open:
                    await self.ws.ping()
                    logger.debug("Heartbeat sent")
                await asyncio.sleep(HEARTBEAT_INTERVAL_SECONDS)
            except Exception as e:
                logger.error(f"Heartbeat error: {e}")

    async def start(self) -> None:
        """Start collecting orderbook data"""
        self.is_running = True

        # Get initial snapshot
        snapshot = await self.get_snapshot()
        if snapshot:
            snapshot_data = {
                "type": "orderbook_snapshot",
                "timestamp": 0,
                "symbol": SYMBOL_LOWER.upper(),
                "lastUpdateId": snapshot["lastUpdateId"],
                "bids": [[float(price), float(qty)] for price, qty in snapshot["bids"]],
                "asks": [[float(price), float(qty)] for price, qty in snapshot["asks"]],
            }
            await redis_manager.set_orderbook(snapshot_data)
            self.last_update_id = snapshot["lastUpdateId"]

        # Start heartbeat task
        heartbeat_task = asyncio.create_task(self.heartbeat())

        while self.is_running:
            try:
                # Connect to WebSocket
                if not await self.connect():
                    if await self.reconnect_manager.wait():
                        continue
                    else:
                        logger.error("Max reconnection attempts reached, stopping collector")
                        break

                # Listen for messages
                async for message in self.ws:
                    await self.on_message(message)

            except websockets.exceptions.ConnectionClosed:
                logger.warning("WebSocket connection closed")
                if await self.reconnect_manager.wait():
                    continue
                else:
                    break
            except Exception as e:
                logger.error(f"Unexpected error: {e}")
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
        logger.info("Orderbook collector stopped")


# Global collector instance
orderbook_collector = BinanceOrderbookCollector()
