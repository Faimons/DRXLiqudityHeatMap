# BTC Liquidity Heatmap Dashboard

A professional, real-time trading dashboard for BTC/USDT with orderbook heatmap, liquidation zones, and volume footprint visualization - comparable to TradingLite.

![Dashboard Preview](https://via.placeholder.com/1200x600?text=BTC+Liquidity+Heatmap+Dashboard)

## Features

### Core Features
- **Live Orderbook Heatmap** - Binance Level 2 depth visualization with D3.js canvas rendering
- **Price Chart** - Candlestick chart with TradingView Lightweight Charts
- **Liquidation Heatmap** - Estimated liquidation clusters overlay
- **Volume Footprint** - Buy/Sell delta per price level
- **Wall Tracker** - Large order tracking (absorbed/pulled/moved)

### Performance
- **Latency**: <100ms from Binance to UI
- **FPS**: 60 FPS rendering
- **Updates**: 10+ updates/second without lag
- **Scalability**: Up to 1000 orderbook levels simultaneously

## Technology Stack

### Backend
- **FastAPI** - High-performance async Python web framework
- **Redis** - In-memory cache for real-time data
- **WebSockets** - Low-latency bi-directional communication
- **Python 3.11+** - Type hints, async/await

### Frontend
- **React 18** - Modern component-based UI
- **Vite** - Fast development and optimized production builds
- **TradingView Lightweight Charts** - Professional financial charts
- **D3.js v7** - Canvas-based heatmap visualization
- **Zustand** - Lightweight state management
- **Tailwind CSS** - Utility-first styling

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Redis (or use Docker)

### Option 1: Docker (Recommended)

```bash
# Clone repository
git clone <repository-url>
cd btc-liquidity-heatmap

# Copy environment file
cp .env.example .env

# Start with Docker Compose
cd docker
docker-compose up -d

# Access application
# Frontend: http://localhost
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Option 2: Local Development

#### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start Redis (in separate terminal)
redis-server

# Run backend
python -m backend.main
# Or with uvicorn:
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:5173
```

## Project Structure

```
btc-liquidity-heatmap/
├── backend/
│   ├── collectors/          # Binance WebSocket collectors
│   ├── processors/          # Data processing logic
│   ├── websocket/           # WebSocket server
│   ├── cache/              # Redis management
│   ├── utils/              # Utilities
│   └── main.py             # FastAPI application
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── store/          # Zustand store
│   │   ├── utils/          # Utilities
│   │   └── App.jsx         # Main app
│   └── package.json
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
└── README.md
```

## Configuration

### Backend Environment Variables

See `.env.example` for all available options:

```env
BINANCE_WS_URL=wss://stream.binance.com:9443/ws
SYMBOL=BTCUSDT
REDIS_HOST=localhost
REDIS_PORT=6379
ORDERBOOK_DEPTH=500
WALL_THRESHOLD_BTC=100.0
LOG_LEVEL=INFO
```

## API Documentation

### REST Endpoints

Once running, visit `http://localhost:8000/docs` for interactive API documentation.

- `GET /` - API information
- `GET /health` - Health check
- `GET /api/orderbook` - Current orderbook snapshot
- `GET /api/trades` - Recent trades
- `GET /api/walls` - Detected walls
- `GET /api/footprint` - Volume footprint
- `GET /api/liquidations` - Liquidation estimates

### WebSocket

Connect to `ws://localhost:8000/ws` to receive real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'orderbook':
      // Handle orderbook update
      break;
    case 'trade':
      // Handle trade update
      break;
    case 'footprint':
      // Handle footprint update
      break;
    case 'liquidations':
      // Handle liquidations update
      break;
  }
};
```

## Development

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Building for Production

```bash
# Frontend build
cd frontend
npm run build

# Backend is production-ready as-is
# Use uvicorn with --workers for production:
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Performance Optimization

### Backend
- Redis connection pooling
- Async operations throughout
- Efficient data aggregation
- WebSocket message batching

### Frontend
- Canvas rendering (not SVG) for heatmap
- requestAnimationFrame throttling
- React.memo for expensive components
- Zustand for efficient state updates
- Lazy loading for large datasets

## Troubleshooting

### WebSocket Connection Issues

**Problem**: "WebSocket connection failed"

**Solution**:
1. Check Binance server status
2. Verify network connection
3. Check rate limits (max 5 connections per IP)
4. Review backend logs for errors

### Redis Connection Issues

**Problem**: "Could not connect to Redis"

**Solution**:
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# If not, start Redis
redis-server
```

### Performance Issues

**Problem**: "Heatmap laggy on updates"

**Solution**:
1. Check if canvas rendering is enabled (not SVG)
2. Reduce ORDERBOOK_DEPTH in config
3. Increase UPDATE_INTERVAL_MS
4. Check browser DevTools Performance tab

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [TradingView Lightweight Charts](https://www.tradingview.com/lightweight-charts/)
- [D3.js](https://d3js.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Binance API](https://binance-docs.github.io/apidocs/)

## Roadmap

### Phase 2 Features
- [ ] Multi-symbol support (ETH, SOL, etc.)
- [ ] Historical playback
- [ ] Alerts system
- [ ] Custom indicators
- [ ] CSV export

### Advanced Features
- [ ] Machine learning integration
- [ ] Order flow imbalance detector
- [ ] Institutional activity tracking
- [ ] Cross-exchange aggregation
- [ ] Mobile app (React Native)

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Documentation: [Full docs](./docs/)

---

**Built with by [Your Name]**
**Version**: 1.0.0
**Last Updated**: 2024-11-15
