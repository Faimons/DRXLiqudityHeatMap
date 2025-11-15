/**
 * Heatmap View - Full Screen Liquidity Heatmap
 * Professional view showing orderbook depth visualization
 */
import React, { useEffect, useRef, useMemo, useState } from 'react';
import useOrderbook from '../hooks/useOrderbook';
import useStore from '../store/useStore';
import { createBidColorScale, createAskColorScale } from '../components/OrderbookHeatmap/colorScales';
import * as d3 from 'd3';

const HeatmapView = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [depth, setDepth] = useState(50);
  const [aggregationLevel, setAggregationLevel] = useState(10);

  const {
    aggregatedBids,
    aggregatedAsks,
    midPrice,
    spread,
    totalBidLiquidity,
    totalAskLiquidity,
    imbalance,
  } = useOrderbook();

  const { isConnected } = useStore();

  // Get top N levels for each side
  const topBids = useMemo(() => aggregatedBids.slice(0, depth), [aggregatedBids, depth]);
  const topAsks = useMemo(() => aggregatedAsks.slice(0, depth), [aggregatedAsks, depth]);

  // Calculate max sizes for color scaling
  const maxBidSize = useMemo(() =>
    topBids.length > 0 ? Math.max(...topBids.map(b => b.size)) : 100,
    [topBids]
  );

  const maxAskSize = useMemo(() =>
    topAsks.length > 0 ? Math.max(...topAsks.map(a => a.size)) : 100,
    [topAsks]
  );

  // Render enhanced heatmap
  const renderHeatmap = () => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size
    const width = container.clientWidth;
    const height = container.clientHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Calculate dimensions
    const margin = { top: 60, right: 250, bottom: 40, left: 120 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Combine bids and asks for unified scale
    const allLevels = [...topAsks.map(a => ({ ...a, side: 'ask' })), ...topBids.map(b => ({ ...b, side: 'bid' }))];

    if (allLevels.length === 0) return;

    // Create scales
    const priceExtent = d3.extent(allLevels, d => d.price);
    const yScale = d3.scaleLinear()
      .domain(priceExtent)
      .range([chartHeight, 0]);

    const maxSize = Math.max(maxBidSize, maxAskSize);
    const xScale = d3.scaleLinear()
      .domain([0, maxSize])
      .range([0, chartWidth]);

    // Color scales
    const bidColor = d3.scaleLinear()
      .domain([0, maxBidSize])
      .range(['rgba(0, 255, 0, 0.1)', 'rgba(0, 255, 0, 0.9)']);

    const askColor = d3.scaleLinear()
      .domain([0, maxAskSize])
      .range(['rgba(255, 0, 0, 0.1)', 'rgba(255, 0, 0, 0.9)']);

    // Draw grid
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 0.5;

    // Horizontal grid lines
    const yTicks = yScale.ticks(20);
    yTicks.forEach(tick => {
      const y = margin.top + yScale(tick);
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(width - margin.right, y);
      ctx.stroke();
    });

    // Draw asks (top half - red)
    topAsks.forEach((level) => {
      const y = margin.top + yScale(level.price);
      const barWidth = xScale(level.size);
      const barHeight = Math.max(2, chartHeight / depth);

      ctx.fillStyle = askColor(level.size);
      ctx.fillRect(margin.left, y - barHeight / 2, barWidth, barHeight);

      // Draw border for large orders
      if (level.size > maxAskSize * 0.7) {
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(margin.left, y - barHeight / 2, barWidth, barHeight);
      }
    });

    // Draw bids (bottom half - green)
    topBids.forEach((level) => {
      const y = margin.top + yScale(level.price);
      const barWidth = xScale(level.size);
      const barHeight = Math.max(2, chartHeight / depth);

      ctx.fillStyle = bidColor(level.size);
      ctx.fillRect(margin.left, y - barHeight / 2, barWidth, barHeight);

      // Draw border for large orders
      if (level.size > maxBidSize * 0.7) {
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(margin.left, y - barHeight / 2, barWidth, barHeight);
      }
    });

    // Draw mid price line
    if (midPrice > 0) {
      const y = margin.top + yScale(midPrice);
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(width - margin.right, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Mid price label
      ctx.fillStyle = '#ffff00';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Mid: $${midPrice.toFixed(2)}`, margin.left + 10, y - 8);
    }

    // Draw Y-axis (price labels)
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    yTicks.forEach(tick => {
      const y = margin.top + yScale(tick);
      ctx.fillText(`$${tick.toFixed(2)}`, margin.left - 10, y + 4);
    });

    // Draw X-axis (volume labels)
    ctx.textAlign = 'center';
    const xTicks = xScale.ticks(5);
    xTicks.forEach(tick => {
      const x = margin.left + xScale(tick);
      ctx.fillText(tick.toFixed(0), x, height - margin.bottom + 20);
    });

    // Draw volume profile on the right
    const profileWidth = 150;
    const profileX = width - margin.right + 20;

    // Asks profile
    topAsks.forEach((level) => {
      const y = margin.top + yScale(level.price);
      const barWidth = (level.size / maxSize) * profileWidth;
      const barHeight = Math.max(2, chartHeight / depth);

      ctx.fillStyle = askColor(level.size);
      ctx.fillRect(profileX, y - barHeight / 2, barWidth, barHeight);
    });

    // Bids profile
    topBids.forEach((level) => {
      const y = margin.top + yScale(level.price);
      const barWidth = (level.size / maxSize) * profileWidth;
      const barHeight = Math.max(2, chartHeight / depth);

      ctx.fillStyle = bidColor(level.size);
      ctx.fillRect(profileX, y - barHeight / 2, barWidth, barHeight);
    });

    // Draw labels
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Liquidity Depth', margin.left, margin.top - 35);
    ctx.fillText('Volume Profile', profileX, margin.top - 35);

    // Draw axis labels
    ctx.font = '12px monospace';
    ctx.fillText('Price ($)', 10, margin.top - 10);
    ctx.textAlign = 'center';
    ctx.fillText('Volume (BTC)', margin.left + chartWidth / 2, height - 5);
  };

  // Render on data change
  useEffect(() => {
    renderHeatmap();
  }, [topBids, topAsks, midPrice, depth, aggregationLevel]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => renderHeatmap();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [topBids, topAsks, midPrice, depth, aggregationLevel]);

  return (
    <div className="w-full h-full bg-background-primary flex flex-col">
      {/* Header with Controls */}
      <div className="bg-background-tertiary border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h2 className="text-xl font-bold text-white">Liquidity Heatmap</h2>

            {/* Stats */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">Mid Price:</span>
                <span className="text-white font-mono">${midPrice?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">Spread:</span>
                <span className="text-white font-mono">${spread?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">Imbalance:</span>
                <span className={`font-mono ${imbalance > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {(imbalance * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">Depth:</label>
              <select
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
                className="bg-gray-700 text-white text-sm px-3 py-1 rounded border border-gray-600"
              >
                <option value={25}>25 levels</option>
                <option value={50}>50 levels</option>
                <option value={100}>100 levels</option>
                <option value={200}>200 levels</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">Aggregation:</label>
              <select
                value={aggregationLevel}
                onChange={(e) => setAggregationLevel(Number(e.target.value))}
                className="bg-gray-700 text-white text-sm px-3 py-1 rounded border border-gray-600"
              >
                <option value={1}>$1</option>
                <option value={5}>$5</option>
                <option value={10}>$10</option>
                <option value={25}>$25</option>
                <option value={50}>$50</option>
              </select>
            </div>

            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-400">{isConnected ? 'Live' : 'Disconnected'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Canvas */}
      <div ref={containerRef} className="flex-1 relative">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Legend */}
      <div className="bg-background-tertiary border-t border-gray-800 p-3">
        <div className="flex items-center justify-center space-x-8 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-r from-green-900 to-green-500 rounded" />
            <span className="text-gray-400">Bid Liquidity</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-r from-red-900 to-red-500 rounded" />
            <span className="text-gray-400">Ask Liquidity</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded" />
            <span className="text-gray-400">Mid Price</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">Total Bid:</span>
            <span className="text-green-500 font-mono">{totalBidLiquidity?.toFixed(2) || '0.00'} BTC</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">Total Ask:</span>
            <span className="text-red-500 font-mono">{totalAskLiquidity?.toFixed(2) || '0.00'} BTC</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapView;
