# API Documentation

## REST API Endpoints

Base URL: `http://localhost:8000`

### Health & Info

#### GET /
Get API information

**Response:**
```json
{
  "name": "BTC Liquidity Heatmap API",
  "version": "1.0.0",
  "status": "running",
  "endpoints": {
    "websocket": "/ws",
    "health": "/health",
    "docs": "/docs"
  }
}
```

#### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "redis": "connected",
  "collectors": {
    "orderbook": true,
    "trades": true
  }
}
```

### Data Endpoints

#### GET /api/orderbook
Get current processed orderbook

**Response:**
```json
{
  "timestamp": 1699999999999,
  "symbol": "BTCUSDT",
  "bids": {
    "raw": [[43220.5, 2.5], ...],
    "aggregated": [{"price": 43220, "size": 15.5, ...}],
    "total_liquidity": 1250.5
  },
  "asks": {
    "raw": [[43225.0, 3.2], ...],
    "aggregated": [{"price": 43230, "size": 12.3, ...}],
    "total_liquidity": 980.2
  },
  "walls": {
    "bid_walls": [...],
    "ask_walls": [...],
    "total_walls": 5
  },
  "spread": 4.5,
  "mid_price": 43222.75,
  "imbalance": {
    "bid_percentage": 56.0,
    "ask_percentage": 44.0
  }
}
```

#### GET /api/trades
Get recent trades

**Response:**
```json
{
  "trades": [
    {
      "timestamp": 1699999999999,
      "price": 43225.0,
      "quantity": 0.5,
      "is_buy": true
    }
  ],
  "count": 150
}
```

#### GET /api/footprint
Get volume footprint analysis

**Response:**
```json
{
  "timestamp": 1699999999999,
  "footprint": [
    {
      "price": 43225,
      "buy_volume": 5.5,
      "sell_volume": 3.2,
      "delta": 2.3,
      "trade_count": 15
    }
  ],
  "cumulative_delta": 45.5,
  "vwap": 43220.5,
  "total_buy_volume": 125.5,
  "total_sell_volume": 98.2,
  "net_delta": 27.3
}
```

#### GET /api/liquidations
Get liquidation estimates

**Response:**
```json
{
  "current_price": 43225.0,
  "heatmap": {
    "long_liquidations": [
      {
        "price": 43010.0,
        "leverage": 100,
        "distance_percentage": 0.5
      }
    ],
    "short_liquidations": [...]
  },
  "clusters": [...]
}
```

## WebSocket API

### Connection

Connect to: `ws://localhost:8000/ws`

```javascript
const ws = new WebSocket('ws://localhost:8000/ws');
```

### Message Types

#### Client → Server

**Request Snapshot**
```json
{
  "type": "request_snapshot"
}
```

**Ping**
```json
{
  "type": "ping"
}
```

#### Server → Client

**Initial Snapshot**
```json
{
  "type": "initial_snapshot",
  "data": {
    // Full orderbook data
  }
}
```

**Orderbook Update**
```json
{
  "type": "orderbook",
  "data": {
    "timestamp": 1699999999999,
    "bids": {...},
    "asks": {...},
    "walls": {...}
  },
  "wall_changes": {
    "new": [],
    "absorbed": [],
    "pulled": []
  }
}
```

**Trade Update**
```json
{
  "type": "trade",
  "data": {
    "timestamp": 1699999999999,
    "price": 43225.0,
    "quantity": 0.5,
    "is_buy": true
  }
}
```

**Footprint Update**
```json
{
  "type": "footprint",
  "data": {
    "footprint": [...],
    "cumulative_delta": 45.5
  }
}
```

**Liquidations Update**
```json
{
  "type": "liquidations",
  "data": {
    "heatmap": {...},
    "clusters": [...]
  }
}
```

**Pong**
```json
{
  "type": "pong"
}
```

## Rate Limits

- REST API: No limits (local)
- WebSocket: Max 100 concurrent connections
- Binance API: Respect Binance rate limits (handled automatically)

## Error Handling

All errors return appropriate HTTP status codes and JSON responses:

```json
{
  "error": "Error description"
}
```

Common status codes:
- `200` - Success
- `404` - Not found
- `500` - Internal server error
- `503` - Service unavailable (e.g., Redis down)
