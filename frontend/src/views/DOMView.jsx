/**
 * DOM View - Depth of Market Trading View
 * Professional DOM/Orderbook visualization
 */
import React, { useEffect, useRef, useState } from 'react';
import useOrderbook from '../hooks/useOrderbook';
import useStore from '../store/useStore';
import { formatNumber } from '../utils/formatters';

const DOMView = () => {
  const containerRef = useRef(null);
  const [visibleLevels, setVisibleLevels] = useState(50);
  const [grouping, setGrouping] = useState(1);

  const {
    bids,
    asks,
    bestBid,
    bestAsk,
    spread,
    midPrice,
    largestBid,
    largestAsk,
    totalBidLiquidity,
    totalAskLiquidity,
    imbalance,
  } = useOrderbook();

  const { isConnected } = useStore();

  // Get visible levels
  const visibleBids = bids.slice(0, Math.floor(visibleLevels / 2));
  const visibleAsks = asks.slice(0, Math.floor(visibleLevels / 2));

  // Calculate max volumes for bar rendering
  const maxBidVolume = visibleBids.length > 0 ? Math.max(...visibleBids.map(b => b[1])) : 1;
  const maxAskVolume = visibleAsks.length > 0 ? Math.max(...visibleAsks.map(a => a[1])) : 1;
  const maxVolume = Math.max(maxBidVolume, maxAskVolume);

  // Calculate cumulative volumes
  const bidsWithCumulative = visibleBids.map((bid, index) => {
    const cumulative = visibleBids.slice(0, index + 1).reduce((sum, [, size]) => sum + size, 0);
    return {
      price: bid[0],
      size: bid[1],
      cumulative,
      percentage: (bid[1] / maxVolume) * 100,
    };
  });

  const asksWithCumulative = visibleAsks.map((ask, index) => {
    const cumulative = visibleAsks.slice(0, index + 1).reduce((sum, [, size]) => sum + size, 0);
    return {
      price: ask[0],
      size: ask[1],
      cumulative,
      percentage: (ask[1] / maxVolume) * 100,
    };
  });

  return (
    <div className="w-full h-full bg-background-primary flex flex-col">
      {/* Header */}
      <div className="bg-background-tertiary border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h2 className="text-xl font-bold text-white">DOM Trading</h2>

            {/* Stats */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">Best Bid:</span>
                <span className="text-green-500 font-mono">${bestBid?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">Best Ask:</span>
                <span className="text-red-500 font-mono">${bestAsk?.toFixed(2) || '0.00'}</span>
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
              <label className="text-sm text-gray-400">Levels:</label>
              <select
                value={visibleLevels}
                onChange={(e) => setVisibleLevels(Number(e.target.value))}
                className="bg-gray-700 text-white text-sm px-3 py-1 rounded border border-gray-600"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">Grouping:</label>
              <select
                value={grouping}
                onChange={(e) => setGrouping(Number(e.target.value))}
                className="bg-gray-700 text-white text-sm px-3 py-1 rounded border border-gray-600"
              >
                <option value={0.01}>$0.01</option>
                <option value={0.1}>$0.10</option>
                <option value={1}>$1.00</option>
                <option value={5}>$5.00</option>
                <option value={10}>$10.00</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-400">{isConnected ? 'Live' : 'Disconnected'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* DOM Content */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden">
        {/* Asks Side */}
        <div className="w-1/2 border-r border-gray-800 flex flex-col">
          <div className="bg-gray-900 border-b border-gray-800 px-4 py-2">
            <div className="grid grid-cols-3 gap-4 text-xs font-semibold text-gray-400">
              <div className="text-right">Cumulative</div>
              <div className="text-right">Size (BTC)</div>
              <div className="text-right">Price ($)</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col-reverse">
              {asksWithCumulative.map((ask, index) => (
                <div
                  key={`ask-${index}`}
                  className="relative px-4 py-1 hover:bg-gray-900 cursor-pointer border-b border-gray-900"
                  style={{
                    background: `linear-gradient(to left, rgba(239, 68, 68, 0.15) ${ask.percentage}%, transparent ${ask.percentage}%)`
                  }}
                >
                  <div className="grid grid-cols-3 gap-4 text-sm font-mono">
                    <div className="text-right text-gray-400">{ask.cumulative.toFixed(4)}</div>
                    <div className="text-right text-white">{ask.size.toFixed(4)}</div>
                    <div className="text-right text-red-500 font-semibold">{ask.price.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ask Summary */}
          <div className="bg-gray-900 border-t border-gray-800 px-4 py-2 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Total Ask Volume:</span>
              <span className="text-red-500 font-mono">{totalAskLiquidity?.toFixed(4) || '0.0000'} BTC</span>
            </div>
          </div>
        </div>

        {/* Bids Side */}
        <div className="w-1/2 flex flex-col">
          <div className="bg-gray-900 border-b border-gray-800 px-4 py-2">
            <div className="grid grid-cols-3 gap-4 text-xs font-semibold text-gray-400">
              <div className="text-left">Price ($)</div>
              <div className="text-left">Size (BTC)</div>
              <div className="text-left">Cumulative</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {bidsWithCumulative.map((bid, index) => (
              <div
                key={`bid-${index}`}
                className="relative px-4 py-1 hover:bg-gray-900 cursor-pointer border-b border-gray-900"
                style={{
                  background: `linear-gradient(to right, rgba(34, 197, 94, 0.15) ${bid.percentage}%, transparent ${bid.percentage}%)`
                }}
              >
                <div className="grid grid-cols-3 gap-4 text-sm font-mono">
                  <div className="text-left text-green-500 font-semibold">{bid.price.toFixed(2)}</div>
                  <div className="text-left text-white">{bid.size.toFixed(4)}</div>
                  <div className="text-left text-gray-400">{bid.cumulative.toFixed(4)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Bid Summary */}
          <div className="bg-gray-900 border-t border-gray-800 px-4 py-2 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Total Bid Volume:</span>
              <span className="text-green-500 font-mono">{totalBidLiquidity?.toFixed(4) || '0.0000'} BTC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spread Indicator */}
      <div className="bg-background-tertiary border-t border-gray-800 px-4 py-3">
        <div className="flex items-center justify-center space-x-6">
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">Mid Price</div>
            <div className="text-lg font-mono text-yellow-500 font-bold">${midPrice?.toFixed(2) || '0.00'}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">Spread</div>
            <div className="text-lg font-mono text-white font-bold">${spread?.toFixed(2) || '0.00'}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">Order Flow</div>
            <div className={`text-lg font-mono font-bold ${imbalance > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {imbalance > 0 ? '↑' : '↓'} {Math.abs(imbalance * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DOMView;
