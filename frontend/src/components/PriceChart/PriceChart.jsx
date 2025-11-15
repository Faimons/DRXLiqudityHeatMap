/**
 * Price Chart Component
 * Displays candlestick chart using TradingView Lightweight Charts
 */
import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import { chartOptions, candlestickOptions } from './chartConfig';

const PriceChart = () => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const resizeObserverRef = useRef(null);

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

    // Add dummy data for now (will be replaced with real data)
    const dummyData = generateDummyData();
    candlestickSeriesRef.current.setData(dummyData);

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

  return (
    <div ref={chartContainerRef} className="w-full h-full" />
  );
};

// Generate dummy candlestick data
function generateDummyData() {
  const data = [];
  let basePrice = 43000;
  let time = Math.floor(Date.now() / 1000) - 3600 * 24; // 24 hours ago

  for (let i = 0; i < 100; i++) {
    const open = basePrice + (Math.random() - 0.5) * 100;
    const close = open + (Math.random() - 0.5) * 200;
    const high = Math.max(open, close) + Math.random() * 100;
    const low = Math.min(open, close) - Math.random() * 100;

    data.push({
      time: time + i * 60 * 15, // 15-minute candles
      open,
      high,
      low,
      close,
    });

    basePrice = close;
  }

  return data;
}

export default PriceChart;
