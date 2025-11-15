/**
 * TradingView Lightweight Charts configuration
 */
import { CHART_COLORS } from '../../utils/constants';

export const chartOptions = {
  layout: {
    background: { color: CHART_COLORS.background },
    textColor: CHART_COLORS.textColor,
  },
  grid: {
    vertLines: { color: CHART_COLORS.gridColor },
    horzLines: { color: CHART_COLORS.gridColor },
  },
  crosshair: {
    mode: 1, // Normal
    vertLine: {
      color: '#758696',
      width: 1,
      style: 3, // Dashed
      labelBackgroundColor: '#4a4a4a',
    },
    horzLine: {
      color: '#758696',
      width: 1,
      style: 3,
      labelBackgroundColor: '#4a4a4a',
    },
  },
  rightPriceScale: {
    borderColor: '#2a2a2a',
  },
  timeScale: {
    borderColor: '#2a2a2a',
    timeVisible: true,
    secondsVisible: false,
  },
};

export const candlestickOptions = {
  upColor: CHART_COLORS.upColor,
  downColor: CHART_COLORS.downColor,
  borderUpColor: CHART_COLORS.borderUpColor,
  borderDownColor: CHART_COLORS.borderDownColor,
  wickUpColor: CHART_COLORS.wickUpColor,
  wickDownColor: CHART_COLORS.wickDownColor,
};

export const volumeOptions = {
  priceFormat: {
    type: 'volume',
  },
  priceScaleId: 'volume',
  scaleMargins: {
    top: 0.8,
    bottom: 0,
  },
};
