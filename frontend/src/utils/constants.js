/**
 * Application constants
 */

export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const ORDERBOOK_DEPTH = 50;
export const UPDATE_INTERVAL_MS = 100;
export const WALL_THRESHOLD_BTC = 100;
export const PRICE_STEP_SIZE = 10;

export const CHART_COLORS = {
  background: '#0a0a0a',
  textColor: '#ffffff',
  upColor: '#26a69a',
  downColor: '#ef5350',
  borderUpColor: '#26a69a',
  borderDownColor: '#ef5350',
  wickUpColor: '#26a69a',
  wickDownColor: '#ef5350',
  gridColor: '#1e1e1e',
};

export const HEATMAP_COLORS = {
  bid: {
    min: '#0a1e0a',
    max: '#00ff00',
  },
  ask: {
    min: '#1e0a0a',
    max: '#ff0000',
  },
};
