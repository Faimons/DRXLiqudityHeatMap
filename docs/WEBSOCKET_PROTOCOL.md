# WebSocket Protocol Documentation

## Connection

**URL**: `ws://localhost:8000/ws`

```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onopen = () => {
  console.log('Connected to BTC Heatmap WebSocket');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  handleMessage(message);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket disconnected');
  // Implement reconnection logic
};
```

## Message Format

All messages are JSON objects with a `type` field:

```json
{
  "type": "message_type",
  "data": { ... }
}
```

## Client → Server Messages

### Request Initial Snapshot

Request the current state of all data:

```json
{
  "type": "request_snapshot"
}
```

**Response**: `initial_snapshot` message with complete data

### Ping

Keep connection alive:

```json
{
  "type": "ping"
}
```

**Response**: `pong` message

### Subscribe (Future)

Subscribe to specific channels:

```json
{
  "type": "subscribe",
  "channels": ["orderbook", "trades", "footprint", "liquidations"]
}
```

## Server → Client Messages

### Initial Snapshot

Sent immediately after connection and when explicitly requested:

```json
{
  "type": "initial_snapshot",
  "data": {
    "timestamp": 1699999999999,
    "bids": {
      "raw": [[43220.5, 2.5], ...],
      "aggregated": [{"price": 43220, "size": 15.5, "count": 5}],
      "total_liquidity": 1250.5
    },
    "asks": {
      "raw": [[43225.0, 3.2], ...],
      "aggregated": [{"price": 43230, "size": 12.3, "count": 4}],
      "total_liquidity": 980.2
    },
    "walls": {
      "bid_walls": [
        {
          "price": 43200,
          "size": 150.5,
          "side": "bid",
          "distance_from_mid": 25
        }
      ],
      "ask_walls": [...],
      "total_walls": 3
    },
    "spread": 4.5,
    "mid_price": 43222.75
  }
}
```

### Orderbook Update

Sent every ~100ms with orderbook changes:

```json
{
  "type": "orderbook",
  "data": {
    "timestamp": 1699999999999,
    "symbol": "BTCUSDT",
    "bids": { ... },
    "asks": { ... },
    "walls": { ... },
    "spread": 4.5,
    "mid_price": 43222.75,
    "imbalance": {
      "bid_percentage": 56.0,
      "ask_percentage": 44.0
    }
  },
  "wall_changes": {
    "new": [
      {"price": 43150, "size": 120.5, "side": "bid"}
    ],
    "absorbed": [],
    "pulled": [
      {"price": 43280, "size": 95.0, "side": "ask"}
    ],
    "moved": []
  }
}
```

### Trade Update

Sent for each individual trade:

```json
{
  "type": "trade",
  "data": {
    "timestamp": 1699999999999,
    "trade_id": 12345,
    "price": 43225.0,
    "quantity": 0.5,
    "is_buy": true,
    "is_maker": false
  }
}
```

### Footprint Update

Sent every second with volume delta:

```json
{
  "type": "footprint",
  "data": {
    "timestamp": 1699999999999,
    "footprint": [
      {
        "price": 43225,
        "buy_volume": 5.5,
        "sell_volume": 3.2,
        "delta": 2.3,
        "trade_count": 15,
        "imbalance_ratio": 0.63
      }
    ],
    "cumulative_delta": 45.5,
    "vwap": 43220.5,
    "total_buy_volume": 125.5,
    "total_sell_volume": 98.2,
    "net_delta": 27.3,
    "buy_sell_ratio": 1.28
  }
}
```

### Liquidations Update

Sent every 5 seconds:

```json
{
  "type": "liquidations",
  "data": {
    "timestamp": 1699999999999,
    "current_price": 43225.0,
    "heatmap": {
      "long_liquidations": [
        {
          "price": 43010.0,
          "leverage": 100,
          "type": "long",
          "distance_from_current": 215.0,
          "distance_percentage": 0.50
        },
        {
          "price": 42175.0,
          "leverage": 50,
          "type": "long",
          "distance_from_current": 1050.0,
          "distance_percentage": 2.43
        }
      ],
      "short_liquidations": [
        {
          "price": 43440.0,
          "leverage": 100,
          "type": "short",
          "distance_from_current": 215.0,
          "distance_percentage": 0.50
        }
      ]
    },
    "clusters": [
      {
        "price": 43010.0,
        "intensity": 1.0,
        "leverage": 100,
        "type": "long"
      }
    ]
  }
}
```

### Pong

Response to ping:

```json
{
  "type": "pong"
}
```

## Error Handling

If an error occurs, the server may send:

```json
{
  "type": "error",
  "message": "Error description"
}
```

Common errors:
- Invalid message format
- Unknown message type
- Server internal error

## Connection Lifecycle

1. **Connect**: Client connects to WebSocket
2. **Initial Snapshot**: Server sends current state
3. **Updates**: Server streams real-time updates
4. **Heartbeat**: Client sends ping every 30s
5. **Disconnect**: Connection closed (client or server)

## Reconnection Strategy

Recommended client-side reconnection:

```javascript
class WebSocketManager {
  constructor(url) {
    this.url = url;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    };

    this.ws.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.reconnectDelay *= 2;
          this.connect();
        }, this.reconnectDelay);
      }
    };
  }
}
```

## Performance Considerations

- **Message Rate**: ~10-20 messages/second
- **Message Size**: Average 2-5 KB per message
- **Bandwidth**: ~20-50 KB/s
- **Latency**: <100ms from Binance to client

## Best Practices

1. **Always handle reconnection**
2. **Implement heartbeat (ping/pong)**
3. **Parse messages in try-catch**
4. **Throttle UI updates with requestAnimationFrame**
5. **Store data efficiently (use Map/Set)**
6. **Clean up old data periodically**
