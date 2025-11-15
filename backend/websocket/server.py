"""
WebSocket Server for Frontend Communication
Streams orderbook, trades, and processed data to connected clients
"""
import asyncio
import json
from typing import Set
from fastapi import WebSocket, WebSocketDisconnect
from backend.cache.redis_manager import redis_manager
from backend.processors.heatmap_processor import process_orderbook
from backend.processors.liquidation_processor import process_liquidations
from backend.processors.footprint_processor import process_footprint
from backend.utils.logger import setup_logger

logger = setup_logger(__name__)


class ConnectionManager:
    """Manages WebSocket connections to frontend clients"""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.previous_walls = None

    async def connect(self, websocket: WebSocket):
        """Accept and store new WebSocket connection"""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection"""
        self.active_connections.discard(websocket)
        logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """
        Broadcast message to all connected clients

        Args:
            message: Message to broadcast
        """
        if not self.active_connections:
            return

        # Convert to JSON once
        message_json = json.dumps(message)

        # Send to all clients concurrently
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(message_json)
            except Exception as e:
                logger.error(f"Error sending to client: {e}")
                disconnected.add(connection)

        # Remove disconnected clients
        self.active_connections -= disconnected

    async def send_personal(self, message: dict, websocket: WebSocket):
        """
        Send message to specific client

        Args:
            message: Message to send
            websocket: Target WebSocket connection
        """
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")


# Global connection manager
manager = ConnectionManager()


async def stream_orderbook_updates():
    """Stream processed orderbook updates to all clients"""

    async def handle_orderbook_update(data: dict):
        """Handle orderbook update from Redis"""
        try:
            # Process orderbook data
            processed = process_orderbook(data)

            # Track wall changes
            from backend.processors.heatmap_processor import track_wall_changes
            wall_changes = track_wall_changes(
                processed.get("walls", {}),
                manager.previous_walls or {}
            )
            manager.previous_walls = processed.get("walls", {})

            # Send to clients
            await manager.broadcast({
                "type": "orderbook",
                "data": processed,
                "wall_changes": wall_changes
            })

        except Exception as e:
            logger.error(f"Error processing orderbook update: {e}")

    # Subscribe to Redis channel
    await redis_manager.subscribe("orderbook_updates", handle_orderbook_update)


async def stream_trade_updates():
    """Stream trade updates to all clients"""

    async def handle_trade_update(data: dict):
        """Handle trade update from Redis"""
        try:
            await manager.broadcast({
                "type": "trade",
                "data": data
            })
        except Exception as e:
            logger.error(f"Error processing trade update: {e}")

    await redis_manager.subscribe("trade_updates", handle_trade_update)


async def stream_footprint_updates():
    """Stream footprint updates to all clients"""

    async def handle_footprint_update(data: dict):
        """Handle footprint update from Redis"""
        try:
            await manager.broadcast({
                "type": "footprint",
                "data": data
            })
        except Exception as e:
            logger.error(f"Error processing footprint update: {e}")

    await redis_manager.subscribe("footprint_updates", handle_footprint_update)


async def stream_liquidation_updates():
    """Periodically calculate and stream liquidation data"""
    while True:
        try:
            await asyncio.sleep(5)  # Update every 5 seconds

            # Get current orderbook
            orderbook = await redis_manager.get_orderbook()
            if not orderbook:
                continue

            # Calculate mid price
            bids = orderbook.get("bids", [])
            asks = orderbook.get("asks", [])
            if not bids or not asks:
                continue

            mid_price = (bids[0][0] + asks[0][0]) / 2

            # Process liquidations
            liquidation_data = process_liquidations(mid_price, orderbook)

            # Broadcast
            await manager.broadcast({
                "type": "liquidations",
                "data": liquidation_data
            })

        except Exception as e:
            logger.error(f"Error streaming liquidation updates: {e}")
            await asyncio.sleep(1)


async def stream_candle_updates():
    """Stream candle updates to all clients"""

    async def handle_candle_update(data: dict):
        """Handle candle update from Redis"""
        try:
            await manager.broadcast({
                "type": "candle",
                "data": data
            })
        except Exception as e:
            logger.error(f"Error processing candle update: {e}")

    await redis_manager.subscribe("candle_updates", handle_candle_update)


async def handle_client_message(websocket: WebSocket, message: str):
    """
    Handle incoming message from client

    Args:
        websocket: Client WebSocket connection
        message: Message from client
    """
    try:
        data = json.loads(message)
        msg_type = data.get("type")

        if msg_type == "ping":
            # Respond to ping
            await manager.send_personal({"type": "pong"}, websocket)

        elif msg_type == "subscribe":
            # Handle subscription request
            channels = data.get("channels", [])
            logger.info(f"Client subscribed to: {channels}")
            await manager.send_personal({
                "type": "subscribed",
                "channels": channels
            }, websocket)

        elif msg_type == "request_snapshot":
            # Send current state snapshot
            orderbook = await redis_manager.get_orderbook()
            trades = await redis_manager.get_trades()
            walls = await redis_manager.get_walls()

            await manager.send_personal({
                "type": "snapshot",
                "data": {
                    "orderbook": process_orderbook(orderbook) if orderbook else None,
                    "trades": trades,
                    "walls": walls
                }
            }, websocket)

        else:
            logger.warning(f"Unknown message type: {msg_type}")

    except json.JSONDecodeError:
        logger.error(f"Invalid JSON from client: {message}")
    except Exception as e:
        logger.error(f"Error handling client message: {e}")


async def websocket_endpoint(websocket: WebSocket):
    """
    Main WebSocket endpoint handler

    Args:
        websocket: WebSocket connection
    """
    await manager.connect(websocket)

    try:
        # Send initial snapshot
        orderbook = await redis_manager.get_orderbook()
        if orderbook:
            processed = process_orderbook(orderbook)
            await manager.send_personal({
                "type": "initial_snapshot",
                "data": processed
            }, websocket)

        # Listen for client messages
        while True:
            message = await websocket.receive_text()
            await handle_client_message(websocket, message)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("Client disconnected normally")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)
