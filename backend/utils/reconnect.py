"""
WebSocket reconnection logic with exponential backoff
"""
import asyncio
from typing import Optional
from backend.config import (
    RECONNECT_INITIAL_DELAY,
    RECONNECT_MAX_DELAY,
    RECONNECT_BACKOFF_FACTOR,
    MAX_RECONNECT_ATTEMPTS
)
from backend.utils.logger import setup_logger

logger = setup_logger(__name__)


class ReconnectManager:
    """Manages reconnection attempts with exponential backoff"""

    def __init__(
        self,
        initial_delay: float = RECONNECT_INITIAL_DELAY,
        max_delay: float = RECONNECT_MAX_DELAY,
        backoff_factor: float = RECONNECT_BACKOFF_FACTOR,
        max_attempts: int = MAX_RECONNECT_ATTEMPTS
    ):
        self.initial_delay = initial_delay
        self.max_delay = max_delay
        self.backoff_factor = backoff_factor
        self.max_attempts = max_attempts
        self.current_attempt = 0
        self.current_delay = initial_delay

    def reset(self) -> None:
        """Reset reconnection state after successful connection"""
        self.current_attempt = 0
        self.current_delay = self.initial_delay
        logger.info("Reconnection state reset")

    async def wait(self) -> bool:
        """
        Wait before next reconnection attempt

        Returns:
            True if should continue reconnecting, False if max attempts reached
        """
        if self.current_attempt >= self.max_attempts:
            logger.error(f"Max reconnection attempts ({self.max_attempts}) reached")
            return False

        self.current_attempt += 1
        wait_time = min(self.current_delay, self.max_delay)

        logger.warning(
            f"Reconnection attempt {self.current_attempt}/{self.max_attempts} "
            f"in {wait_time:.1f}s"
        )

        await asyncio.sleep(wait_time)
        self.current_delay *= self.backoff_factor

        return True

    @property
    def should_reconnect(self) -> bool:
        """Check if should attempt reconnection"""
        return self.current_attempt < self.max_attempts
