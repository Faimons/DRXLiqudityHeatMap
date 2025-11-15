"""
Redis connection and operations manager
Handles all Redis interactions for caching and pub/sub
"""
import json
import redis.asyncio as redis
from typing import Optional, Dict, Any, Callable
from backend.config import (
    REDIS_HOST,
    REDIS_PORT,
    REDIS_DB,
    REDIS_PASSWORD,
    REDIS_TTL_ORDERBOOK,
    REDIS_TTL_TRADES,
    REDIS_TTL_WALLS,
)
from backend.utils.logger import setup_logger

logger = setup_logger(__name__)


class RedisManager:
    """Manages Redis connections and operations"""

    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.pubsub: Optional[redis.client.PubSub] = None

    async def connect(self) -> None:
        """Establish connection to Redis"""
        try:
            self.redis_client = await redis.from_url(
                f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}",
                password=REDIS_PASSWORD if REDIS_PASSWORD else None,
                encoding="utf-8",
                decode_responses=True
            )
            await self.redis_client.ping()
            logger.info(f"Connected to Redis at {REDIS_HOST}:{REDIS_PORT}")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise

    async def disconnect(self) -> None:
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("Disconnected from Redis")

    async def set_orderbook(self, data: Dict[str, Any]) -> None:
        """
        Store orderbook data with TTL

        Args:
            data: Orderbook data to store
        """
        from backend.config import REDIS_KEY_ORDERBOOK
        try:
            await self.redis_client.setex(
                REDIS_KEY_ORDERBOOK,
                REDIS_TTL_ORDERBOOK,
                json.dumps(data)
            )
        except Exception as e:
            logger.error(f"Failed to set orderbook: {e}")

    async def get_orderbook(self) -> Optional[Dict[str, Any]]:
        """
        Retrieve orderbook data

        Returns:
            Orderbook data or None if not found
        """
        from backend.config import REDIS_KEY_ORDERBOOK
        try:
            data = await self.redis_client.get(REDIS_KEY_ORDERBOOK)
            return json.loads(data) if data else None
        except Exception as e:
            logger.error(f"Failed to get orderbook: {e}")
            return None

    async def set_trades(self, data: list) -> None:
        """
        Store trades data

        Args:
            data: List of recent trades
        """
        from backend.config import REDIS_KEY_TRADES
        try:
            await self.redis_client.setex(
                REDIS_KEY_TRADES,
                REDIS_TTL_TRADES,
                json.dumps(data)
            )
        except Exception as e:
            logger.error(f"Failed to set trades: {e}")

    async def get_trades(self) -> list:
        """
        Retrieve trades data

        Returns:
            List of trades or empty list
        """
        from backend.config import REDIS_KEY_TRADES
        try:
            data = await self.redis_client.get(REDIS_KEY_TRADES)
            return json.loads(data) if data else []
        except Exception as e:
            logger.error(f"Failed to get trades: {e}")
            return []

    async def set_walls(self, data: Dict[str, Any]) -> None:
        """
        Store detected walls

        Args:
            data: Wall data
        """
        from backend.config import REDIS_KEY_WALLS
        try:
            await self.redis_client.setex(
                REDIS_KEY_WALLS,
                REDIS_TTL_WALLS,
                json.dumps(data)
            )
        except Exception as e:
            logger.error(f"Failed to set walls: {e}")

    async def get_walls(self) -> Optional[Dict[str, Any]]:
        """
        Retrieve wall data

        Returns:
            Wall data or None
        """
        from backend.config import REDIS_KEY_WALLS
        try:
            data = await self.redis_client.get(REDIS_KEY_WALLS)
            return json.loads(data) if data else None
        except Exception as e:
            logger.error(f"Failed to get walls: {e}")
            return None

    async def publish(self, channel: str, message: Dict[str, Any]) -> None:
        """
        Publish message to Redis channel

        Args:
            channel: Channel name
            message: Message to publish
        """
        try:
            await self.redis_client.publish(channel, json.dumps(message))
        except Exception as e:
            logger.error(f"Failed to publish to {channel}: {e}")

    async def subscribe(self, channel: str, callback: Callable) -> None:
        """
        Subscribe to Redis channel

        Args:
            channel: Channel name
            callback: Async callback function to handle messages
        """
        try:
            self.pubsub = self.redis_client.pubsub()
            await self.pubsub.subscribe(channel)
            logger.info(f"Subscribed to Redis channel: {channel}")

            async for message in self.pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    await callback(data)
        except Exception as e:
            logger.error(f"Error in subscription to {channel}: {e}")
        finally:
            if self.pubsub:
                await self.pubsub.unsubscribe(channel)


# Global Redis manager instance
redis_manager = RedisManager()
