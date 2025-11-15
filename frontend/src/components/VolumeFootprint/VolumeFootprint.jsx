/**
 * Volume Footprint Component
 * Displays buy/sell volume delta
 */
import React from 'react';
import useStore from '../../store/useStore';
import { formatVolume, formatNumber } from '../../utils/formatters';

const VolumeFootprint = () => {
  const {
    footprint,
    cumulativeDelta,
    totalBuyVolume,
    totalSellVolume,
    netDelta,
    vwap,
  } = useStore();

  const topLevels = footprint.slice(0, 20);

  return (
    <div className="w-full h-full bg-background-secondary overflow-hidden flex flex-col">
      <div className="p-2 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-white">Volume Footprint</h3>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 p-2 text-xs border-b border-gray-800">
        <div>
          <div className="text-gray-400">VWAP</div>
          <div className="text-white font-semibold">${formatNumber(vwap)}</div>
        </div>
        <div>
          <div className="text-gray-400">Cumulative Δ</div>
          <div className={`font-semibold ${cumulativeDelta >= 0 ? 'text-trading-bid' : 'text-trading-ask'}`}>
            {formatVolume(cumulativeDelta, 2)}
          </div>
        </div>
        <div>
          <div className="text-gray-400">Buy Volume</div>
          <div className="text-trading-bid font-semibold">{formatVolume(totalBuyVolume, 2)}</div>
        </div>
        <div>
          <div className="text-gray-400">Sell Volume</div>
          <div className="text-trading-ask font-semibold">{formatVolume(totalSellVolume, 2)}</div>
        </div>
      </div>

      {/* Footprint Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-background-tertiary">
            <tr className="text-gray-400">
              <th className="p-1 text-left">Price</th>
              <th className="p-1 text-right">Buy</th>
              <th className="p-1 text-right">Sell</th>
              <th className="p-1 text-right">Δ</th>
            </tr>
          </thead>
          <tbody>
            {topLevels.map((level, index) => {
              const deltaClass = level.delta >= 0 ? 'text-trading-bid' : 'text-trading-ask';
              const imbalanceWidth = Math.abs((level.imbalance_ratio - 0.5) * 200);
              const imbalanceColor = level.imbalance_ratio > 0.5 ? '#00ff0020' : '#ff000020';

              return (
                <tr
                  key={index}
                  className="border-t border-gray-800 hover:bg-background-tertiary"
                  style={{
                    background: `linear-gradient(to right, ${imbalanceColor} ${imbalanceWidth}%, transparent ${imbalanceWidth}%)`
                  }}
                >
                  <td className="p-1 text-white font-semibold">{formatNumber(level.price)}</td>
                  <td className="p-1 text-right text-trading-bid">{formatVolume(level.buy_volume, 2)}</td>
                  <td className="p-1 text-right text-trading-ask">{formatVolume(level.sell_volume, 2)}</td>
                  <td className={`p-1 text-right font-semibold ${deltaClass}`}>
                    {formatVolume(level.delta, 2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VolumeFootprint;
