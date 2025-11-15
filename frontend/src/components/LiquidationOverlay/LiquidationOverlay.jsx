/**
 * Liquidation Overlay Component
 * Displays estimated liquidation levels
 */
import React from 'react';
import useStore from '../../store/useStore';
import { formatPrice } from '../../utils/formatters';

const LiquidationOverlay = () => {
  const { liquidations, midPrice } = useStore();

  const { long_liquidations, short_liquidations } = liquidations;

  return (
    <div className="w-full h-full bg-background-secondary overflow-hidden flex flex-col">
      <div className="p-2 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-white">Liquidation Levels</h3>
        <div className="text-xs text-gray-400">
          Current: ${formatPrice(midPrice)}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Long Liquidations */}
        <div>
          <div className="text-xs font-semibold text-trading-ask mb-2">
            Long Liquidations (Below)
          </div>
          <div className="space-y-1">
            {long_liquidations.map((liq, index) => (
              <div
                key={index}
                className="flex justify-between items-center text-xs p-2 bg-red-900 bg-opacity-20 rounded"
              >
                <span className="text-gray-400">{liq.leverage}x</span>
                <span className="text-white font-semibold">
                  ${formatPrice(liq.price)}
                </span>
                <span className="text-red-400">
                  -{liq.distance_percentage.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Short Liquidations */}
        <div>
          <div className="text-xs font-semibold text-trading-bid mb-2">
            Short Liquidations (Above)
          </div>
          <div className="space-y-1">
            {short_liquidations.map((liq, index) => (
              <div
                key={index}
                className="flex justify-between items-center text-xs p-2 bg-green-900 bg-opacity-20 rounded"
              >
                <span className="text-gray-400">{liq.leverage}x</span>
                <span className="text-white font-semibold">
                  ${formatPrice(liq.price)}
                </span>
                <span className="text-green-400">
                  +{liq.distance_percentage.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiquidationOverlay;
