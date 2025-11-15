/**
 * Orderbook Heatmap Component
 * Displays bid/ask liquidity heatmap using D3 and Canvas
 */
import React, { useEffect, useRef, useMemo } from 'react';
import useOrderbook from '../../hooks/useOrderbook';
import { createBidColorScale, createAskColorScale } from './colorScales';
import { renderHeatmap } from './heatmapRenderer';

const OrderbookHeatmap = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const {
    aggregatedBids,
    aggregatedAsks,
  } = useOrderbook();

  // Get top 25 levels for each side
  const topBids = useMemo(() => aggregatedBids.slice(0, 25), [aggregatedBids]);
  const topAsks = useMemo(() => aggregatedAsks.slice(0, 25).reverse(), [aggregatedAsks]);

  // Calculate max sizes for color scaling
  const maxBidSize = useMemo(() =>
    topBids.length > 0 ? Math.max(...topBids.map(b => b.size)) : 100,
    [topBids]
  );

  const maxAskSize = useMemo(() =>
    topAsks.length > 0 ? Math.max(...topAsks.map(a => a.size)) : 100,
    [topAsks]
  );

  // Create color scales
  const bidColorScale = useMemo(() => createBidColorScale(maxBidSize), [maxBidSize]);
  const askColorScale = useMemo(() => createAskColorScale(maxAskSize), [maxAskSize]);

  // Render heatmap
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;

    // Set canvas size
    const width = container.clientWidth;
    const height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;

    // Render
    renderHeatmap(
      canvas,
      topBids,
      topAsks,
      bidColorScale,
      askColorScale,
      { width, height }
    );
  }, [topBids, topAsks, bidColorScale, askColorScale]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;

      const canvas = canvasRef.current;
      const container = containerRef.current;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;

      renderHeatmap(
        canvas,
        topBids,
        topAsks,
        bidColorScale,
        askColorScale,
        { width: canvas.width, height: canvas.height }
      );
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [topBids, topAsks, bidColorScale, askColorScale]);

  return (
    <div ref={containerRef} className="w-full h-full bg-background-secondary">
      <div className="p-2 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-white">Orderbook Heatmap</h3>
      </div>
      <div className="relative" style={{ height: 'calc(100% - 40px)' }}>
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default OrderbookHeatmap;
