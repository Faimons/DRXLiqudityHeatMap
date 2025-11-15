/**
 * Advanced Price Chart Component with Orderbook Overlay
 * Like TradingLite/Bookmap - shows orderbook depth directly on chart
 */
import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { chartOptions, candlestickOptions } from './chartConfig';
import useStore from '../../store/useStore';
import { API_URL } from '../../utils/constants';

const TIMEFRAMES = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d'];

const PriceChart = () => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const orderbookOverlayRef = useRef(null);

  const [timeframe, setTimeframe] = useState('15m');
  const [showOrderbook, setShowOrderbook] = useState(true);
  const [showLiquidations, setShowLiquidations] = useState(true);
  const [loading, setLoading] = useState(true);

  const {
    bids,
    asks,
    liquidations,
  } = useStore();

  // Load historical candle data
  useEffect(() => {
    const loadHistoricalData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/candles/${timeframe}?limit=500`);
        const data = await response.json();

        if (data.candles && candlestickSeriesRef.current) {
          candlestickSeriesRef.current.setData(data.candles);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading historical data:', error);
        setLoading(false);
      }
    };

    if (candlestickSeriesRef.current) {
      loadHistoricalData();
    }
  }, [timeframe]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    chartRef.current = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    // Add candlestick series
    candlestickSeriesRef.current = chartRef.current.addCandlestickSeries(candlestickOptions);

    // Handle resize
    resizeObserverRef.current = new ResizeObserver((entries) => {
      if (!entries.length || !chartRef.current) return;
      const { width, height } = entries[0].contentRect;
      chartRef.current.applyOptions({ width, height });
    });

    resizeObserverRef.current.observe(chartContainerRef.current);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, []);

  // Draw orderbook overlay (like Bookmap)
  useEffect(() => {
    if (!chartRef.current || !showOrderbook) return;

    const chart = chartRef.current;
    const timeScale = chart.timeScale();
    const priceScale = chart.priceScale('right');

    // Create orderbook overlay
    const drawOrderbookOverlay = () => {
      if (!chartContainerRef.current) return;

      const container = chartContainerRef.current;
      let canvas = orderbookOverlayRef.current;

      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '1';
        container.appendChild(canvas);
        orderbookOverlayRef.current = canvas;
      }

      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Get visible price range
      const visibleRange = timeScale.getVisibleLogicalRange();
      if (!visibleRange) return;

      // Draw orderbook levels as horizontal bars
      const maxBidSize = bids.length > 0 ? Math.max(...bids.map(b => b[1])) : 1;
      const maxAskSize = asks.length > 0 ? Math.max(...asks.map(a => a[1])) : 1;

      // Draw bids (green)
      bids.slice(0, 50).forEach(([price, size]) => {
        const y = priceScale.priceToCoordinate(price);
        if (y === null) return;

        const barWidth = (size / maxBidSize) * 150; // Max 150px wide
        const alpha = Math.min(0.6, (size / maxBidSize) * 0.8);

        ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
        ctx.fillRect(0, y - 2, barWidth, 4);
      });

      // Draw asks (red)
      asks.slice(0, 50).forEach(([price, size]) => {
        const y = priceScale.priceToCoordinate(price);
        if (y === null) return;

        const barWidth = (size / maxAskSize) * 150;
        const alpha = Math.min(0.6, (size / maxAskSize) * 0.8);

        ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
        ctx.fillRect(0, y - 2, barWidth, 4);
      });
    };

    // Draw on every update
    const intervalId = setInterval(drawOrderbookOverlay, 100);

    return () => {
      clearInterval(intervalId);
      if (orderbookOverlayRef.current) {
        orderbookOverlayRef.current.remove();
        orderbookOverlayRef.current = null;
      }
    };
  }, [bids, asks, showOrderbook]);

  // Draw liquidation levels
  useEffect(() => {
    if (!chartRef.current || !showLiquidations || !candlestickSeriesRef.current) return;

    // Remove old liquidation lines
    // TODO: Implement price lines for liquidation levels

    const { long_liquidations, short_liquidations } = liquidations;

    // Draw long liquidation levels (below price - red)
    long_liquidations.forEach((liq) => {
      try {
        candlestickSeriesRef.current.createPriceLine({
          price: liq.price,
          color: '#ff000080',
          lineWidth: 1,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: `Liq ${liq.leverage}x`,
        });
      } catch (error) {
        // Ignore if price line creation fails
      }
    });

    // Draw short liquidation levels (above price - green)
    short_liquidations.forEach((liq) => {
      try {
        candlestickSeriesRef.current.createPriceLine({
          price: liq.price,
          color: '#00ff0080',
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: `Liq ${liq.leverage}x`,
        });
      } catch (error) {
        // Ignore
      }
    });
  }, [liquidations, showLiquidations]);

  return (
    <div className="w-full h-full bg-background-secondary relative">
      {/* Toolbar */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-background-tertiary border-b border-gray-800 p-2 flex items-center space-x-4">
        {/* Timeframe Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">Timeframe:</span>
          <div className="flex space-x-1">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 text-xs rounded ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle Controls */}
        <div className="flex items-center space-x-4 ml-auto">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOrderbook}
              onChange={(e) => setShowOrderbook(e.target.checked)}
              className="form-checkbox h-4 w-4 text-blue-600"
            />
            <span className="text-xs text-white">Orderbook Overlay</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showLiquidations}
              onChange={(e) => setShowLiquidations(e.target.checked)}
              className="form-checkbox h-4 w-4 text-blue-600"
            />
            <span className="text-xs text-white">Liquidation Levels</span>
          </label>
        </div>
      </div>

      {/* Chart Container */}
      <div
        ref={chartContainerRef}
        className="w-full h-full"
        style={{ paddingTop: '45px' }}
      />

      {/* Loading Indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
          <div className="text-white text-lg">Loading {timeframe} data...</div>
        </div>
      )}
    </div>
  );
};

export default PriceChart;
