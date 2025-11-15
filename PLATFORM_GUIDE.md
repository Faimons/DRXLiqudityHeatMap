# DRX Trading Platform - Complete Guide

## 🎯 Overview

A professional, multi-view trading platform with **real-time Binance data** featuring:

### 📊 Three Dedicated Views:

1. **Liquidity Heatmap** - Advanced orderbook depth visualization
2. **Price Chart** - Candlestick chart with orderbook overlay & liquidation levels
3. **DOM Trading** - Depth of Market orderbook with real-time updates

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**
- **Python 3.11+**
- **Redis** (or use Docker)

### Option 1: Full Setup (Backend + Frontend)

#### 1. Start Backend (FastAPI + Binance WebSocket)

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start Redis (separate terminal)
redis-server

# Run backend
python -m backend.main
# Backend runs on http://localhost:8000
```

#### 2. Start Frontend (React + Vite)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Frontend runs on http://localhost:5173
```

### Option 2: Docker (Recommended)

```bash
# Copy environment file
cp .env.example .env

# Start everything with Docker Compose
cd docker
docker-compose up -d

# Access:
# - Frontend: http://localhost
# - Backend: http://localhost:8000
# - API Docs: http://localhost:8000/docs
```

---

## 📱 Platform Features

### 1. 📊 Liquidity Heatmap View

**Professional orderbook visualization with:**
- Real-time depth rendering
- Volume profile on the right
- Configurable depth levels (25, 50, 100, 200)
- Adjustable price aggregation ($1, $5, $10, $25, $50)
- Mid-price indicator
- Large order highlighting
- Bid/Ask imbalance metrics

**Controls:**
- **Depth**: Choose how many price levels to display
- **Aggregation**: Group orders by price increments
- **Live Stats**: Spread, mid-price, total liquidity, imbalance

### 2. 📈 Price Chart View

**TradingView-style candlestick chart with:**
- Multiple timeframes (1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 12h, 1d)
- Orderbook overlay (like Bookmap/TradingLite)
- Liquidation level markers
- Interactive controls
- Historical data loading

**Features:**
- Toggle orderbook overlay on/off
- Toggle liquidation levels
- Smooth canvas rendering
- Auto-scaling

### 3. 📖 DOM Trading View

**Professional Depth of Market with:**
- Split bid/ask orderbook
- Cumulative volume display
- Visual liquidity bars
- Real-time order flow
- Configurable levels (20, 50, 100, 200)
- Price grouping options
- Large order highlighting

**Displays:**
- Best Bid/Ask prices
- Spread metrics
- Order flow imbalance
- Total bid/ask liquidity
- Mid-price indicator

---

## 🔗 Binance API Integration

All views are fed with **live Binance data** via WebSocket:

### Backend Data Sources:
- **Orderbook**: Level 2 depth updates (50+ levels)
- **Trades**: Real-time trade stream
- **Candles**: Historical OHLCV data
- **Liquidations**: Estimated liquidation clusters

### WebSocket Messages:
```javascript
// The backend sends these message types:
{
  type: 'orderbook',      // Orderbook updates
  type: 'trade',          // Individual trades
  type: 'footprint',      // Volume footprint
  type: 'liquidations',   // Liquidation data
  type: 'candle'          // Candle updates
}
```

---

## 🎨 Navigation & UI

### Tab Navigation
- **📊 Liquidity Heatmap** - Full-screen heatmap view
- **📈 Price Chart** - Full-screen chart view
- **📖 DOM Trading** - Full-screen DOM view

### Connection Status
- **Green pulsing dot** = Connected to Binance
- **Red dot** = Disconnected

### Professional Design
- Dark theme optimized for trading
- Monospace fonts for numbers
- Color-coded bid/ask (green/red)
- Smooth transitions
- Responsive layout

---

## ⚙️ Configuration

### Backend Environment Variables (`.env`)

```env
# Binance API
BINANCE_WS_URL=wss://stream.binance.com:9443/ws
SYMBOL=BTCUSDT

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Settings
ORDERBOOK_DEPTH=500
WALL_THRESHOLD_BTC=100.0
LOG_LEVEL=INFO
```

### Frontend Environment Variables

```env
# WebSocket & API URLs
VITE_WS_URL=ws://localhost:8000/ws
VITE_API_URL=http://localhost:8000/api
```

---

## 🛠️ Development

### File Structure

```
DRXLiqudityHeatMap/
├── backend/
│   ├── collectors/          # Binance data collectors
│   ├── processors/          # Data processing
│   ├── websocket/           # WebSocket server
│   ├── cache/              # Redis management
│   └── main.py             # FastAPI app
│
├── frontend/
│   ├── src/
│   │   ├── views/          # Main views (Heatmap, Chart, DOM)
│   │   ├── components/     # Reusable components
│   │   │   └── Navigation/ # Tab navigation
│   │   ├── hooks/          # Custom React hooks
│   │   │   ├── useWebSocket.js
│   │   │   └── useOrderbook.js
│   │   ├── store/          # Zustand state management
│   │   └── App.jsx         # Main app with tab system
│   └── package.json
│
├── DOMTRADING/             # Legacy DOM tool (for reference)
└── PLATFORM_GUIDE.md       # This file
```

### Key Components

**Views:**
- `HeatmapView.jsx` - Full-screen liquidity heatmap
- `ChartView.jsx` - Candlestick chart wrapper
- `DOMView.jsx` - DOM orderbook display

**Navigation:**
- `TabNavigation.jsx` - Professional tab system

**Hooks:**
- `useWebSocket.js` - Manages Binance connection
- `useOrderbook.js` - Provides orderbook data & calculations

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Manual Testing
1. Check connection status indicator
2. Switch between all 3 tabs
3. Verify real-time updates in each view
4. Test depth/aggregation controls
5. Check responsiveness

---

## 📊 Performance

### Optimizations Applied:
- **Canvas rendering** (not SVG) for heatmap
- **Efficient state management** with Zustand
- **WebSocket throttling** (100ms updates)
- **React.memo** for expensive components
- **RequestAnimationFrame** for smooth rendering

### Target Metrics:
- **Latency**: <100ms from Binance to UI
- **FPS**: 60 FPS rendering
- **Updates**: 10+ updates/second without lag

---

## 🐛 Troubleshooting

### WebSocket Won't Connect

**Problem**: "Disconnected" status or connection errors

**Solutions**:
1. Ensure backend is running on `http://localhost:8000`
2. Check Redis is running: `redis-cli ping` (should return PONG)
3. Verify Binance API is accessible
4. Check browser console for errors

### Heatmap Not Rendering

**Problem**: Blank canvas or no data

**Solutions**:
1. Check WebSocket connection status
2. Verify orderbook data in Redux/Zustand store (use React DevTools)
3. Check browser console for errors
4. Try refreshing the page

### Chart Not Loading

**Problem**: Loading indicator stuck or chart empty

**Solutions**:
1. Ensure backend API is accessible: `curl http://localhost:8000/health`
2. Check network tab for `/candles` endpoint response
3. Verify timeframe selection
4. Clear browser cache

### Performance Issues

**Problem**: Laggy updates or slow rendering

**Solutions**:
1. Reduce depth levels (try 25 or 50 instead of 200)
2. Increase aggregation level
3. Check CPU usage in browser DevTools
4. Ensure GPU acceleration is enabled in browser

---

## 🔐 Security Notes

- **No authentication required** (demo/development mode)
- **Read-only access** to Binance (public data streams)
- **No order placement** functionality (pure visualization)
- For production: Add authentication, rate limiting, HTTPS

---

## 🚧 Future Enhancements

### Planned Features:
- [ ] Multi-symbol support (ETH, SOL, etc.)
- [ ] Historical data playback
- [ ] Custom alerts system
- [ ] Technical indicators
- [ ] CSV/PDF export
- [ ] User layout preferences
- [ ] Dark/Light theme toggle
- [ ] Mobile responsive design

### Advanced Features:
- [ ] Machine learning predictions
- [ ] Cross-exchange aggregation
- [ ] Institutional flow tracking
- [ ] Order flow imbalance detector

---

## 📞 Support

### Issues & Questions:
- Check logs: `backend/logs/` and browser console
- Review API docs: `http://localhost:8000/docs`
- Check this guide for common issues

### Development:
- Follow React best practices
- Keep components modular
- Document complex logic
- Test before committing

---

## 📄 License

MIT License - See LICENSE file for details

---

**Version**: 2.0.0
**Last Updated**: 2025-11-15
**Built with**: React 18, FastAPI, Binance WebSocket, TradingView Charts, D3.js

---

## 🎓 Quick Tips

1. **Start with Heatmap view** to see overall liquidity distribution
2. **Switch to Chart view** for price action with context
3. **Use DOM view** for detailed order-by-order analysis
4. **Adjust depth/aggregation** based on your trading style
5. **Watch the imbalance metric** for market sentiment

**Happy Trading!** 🚀
