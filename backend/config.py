"""
Configuration file for BTC Liquidity Heatmap Backend
All constants and environment variables are defined here
"""
import os
from typing import Final

# Binance WebSocket Configuration
BINANCE_WS_URL: Final[str] = os.getenv(
    "BINANCE_WS_URL",
    "wss://stream.binance.com:9443/ws"
)
BINANCE_REST_URL: Final[str] = os.getenv(
    "BINANCE_REST_URL",
    "https://api.binance.com/api/v3"
)

# Trading Pair Configuration
SYMBOL: Final[str] = os.getenv("SYMBOL", "BTCUSDT")
SYMBOL_LOWER: Final[str] = SYMBOL.lower()

# Orderbook Configuration
ORDERBOOK_DEPTH: Final[int] = int(os.getenv("ORDERBOOK_DEPTH", "500"))
ORDERBOOK_UPDATE_SPEED: Final[str] = "100ms"  # 100ms or 1000ms
PRICE_STEP_SIZE: Final[float] = float(os.getenv("PRICE_STEP_SIZE", "10.0"))

# Wall Detection Configuration
WALL_THRESHOLD_BTC: Final[float] = float(os.getenv("WALL_THRESHOLD_BTC", "100.0"))
WALL_MOVEMENT_TOLERANCE: Final[float] = 0.1  # 10% price tolerance for wall tracking

# Liquidation Configuration
LEVERAGE_LEVELS: Final[list] = [5, 10, 25, 50, 100, 125]
LIQUIDATION_ESTIMATE_DEPTH: Final[int] = 100  # Price levels to estimate

# Volume Footprint Configuration
FOOTPRINT_TIME_WINDOW: Final[int] = 60  # seconds
FOOTPRINT_PRICE_LEVELS: Final[int] = 50

# Redis Configuration
REDIS_HOST: Final[str] = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT: Final[int] = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB: Final[int] = int(os.getenv("REDIS_DB", "0"))
REDIS_PASSWORD: Final[str] = os.getenv("REDIS_PASSWORD", "")

# Redis Keys
REDIS_KEY_ORDERBOOK: Final[str] = f"orderbook:{SYMBOL}"
REDIS_KEY_TRADES: Final[str] = f"trades:{SYMBOL}"
REDIS_KEY_WALLS: Final[str] = f"walls:{SYMBOL}"
REDIS_KEY_LIQUIDATIONS: Final[str] = f"liquidations:{SYMBOL}"
REDIS_KEY_FOOTPRINT: Final[str] = f"footprint:{SYMBOL}"

# Redis TTL (Time To Live)
REDIS_TTL_ORDERBOOK: Final[int] = 10  # seconds
REDIS_TTL_TRADES: Final[int] = 300  # 5 minutes
REDIS_TTL_WALLS: Final[int] = 3600  # 1 hour

# WebSocket Server Configuration
WS_SERVER_HOST: Final[str] = os.getenv("WS_SERVER_HOST", "0.0.0.0")
WS_SERVER_PORT: Final[int] = int(os.getenv("WS_SERVER_PORT", "8000"))

# Update Intervals
UPDATE_INTERVAL_MS: Final[int] = int(os.getenv("UPDATE_INTERVAL_MS", "100"))
HEARTBEAT_INTERVAL_SECONDS: Final[int] = 180  # 3 minutes

# Reconnection Configuration
RECONNECT_INITIAL_DELAY: Final[float] = 1.0  # seconds
RECONNECT_MAX_DELAY: Final[float] = 60.0  # seconds
RECONNECT_BACKOFF_FACTOR: Final[float] = 2.0
MAX_RECONNECT_ATTEMPTS: Final[int] = 10

# Logging Configuration
LOG_LEVEL: Final[str] = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT: Final[str] = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# CORS Configuration
CORS_ORIGINS: Final[list] = [
    "http://localhost:3000",
    "http://localhost:5173",  # Vite default
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

# Performance Configuration
MAX_WEBSOCKET_CONNECTIONS: Final[int] = 100
MESSAGE_QUEUE_SIZE: Final[int] = 1000
