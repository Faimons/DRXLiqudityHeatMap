/**
 * Header Component
 * Displays current price, stats, and connection status
 */
import React from 'react';
import useStore from '../../store/useStore';
import { formatPrice, formatVolume, formatPercentage } from '../../utils/formatters';

const Header = () => {
  const {
    isConnected,
    currentPrice,
    midPrice,
    spread,
    priceChange24h,
    totalBidLiquidity,
    totalAskLiquidity,
    imbalance,
  } = useStore();

  const priceChangeClass = priceChange24h >= 0 ? 'text-chart-up' : 'text-chart-down';

  return (
    <div className="bg-background-secondary border-b border-gray-800 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left: Logo & Symbol */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-white">
            BTC/USDT
          </h1>
          <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <span className="text-xs">{isConnected ? 'Live' : 'Disconnected'}</span>
          </div>
        </div>

        {/* Center: Price Info */}
        <div className="flex items-center space-x-8">
          <div>
            <div className="text-xs text-gray-400">Mid Price</div>
            <div className="text-2xl font-bold text-white">
              ${formatPrice(midPrice || currentPrice, 2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400">24h Change</div>
            <div className={`text-lg font-semibold ${priceChangeClass}`}>
              {formatPercentage(priceChange24h)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Spread</div>
            <div className="text-lg font-semibold text-white">
              ${formatPrice(spread, 2)}
            </div>
          </div>
        </div>

        {/* Right: Liquidity Stats */}
        <div className="flex items-center space-x-6">
          <div>
            <div className="text-xs text-gray-400">Bid Liquidity</div>
            <div className="text-lg font-semibold text-trading-bid">
              {formatVolume(totalBidLiquidity, 2)} BTC
            </div>
            <div className="text-xs text-gray-400">
              {imbalance.bid_percentage.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Ask Liquidity</div>
            <div className="text-lg font-semibold text-trading-ask">
              {formatVolume(totalAskLiquidity, 2)} BTC
            </div>
            <div className="text-xs text-gray-400">
              {imbalance.ask_percentage.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
