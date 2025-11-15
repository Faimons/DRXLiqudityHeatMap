/**
 * Wall Tracker Component
 * Displays detected large orders (walls)
 */
import React from 'react';
import useStore from '../../store/useStore';
import { formatPrice, formatVolume } from '../../utils/formatters';

const WallTracker = () => {
  const { walls, wallChanges } = useStore();

  const allWalls = [
    ...walls.bid_walls.map(w => ({ ...w, side: 'bid' })),
    ...walls.ask_walls.map(w => ({ ...w, side: 'ask' })),
  ].sort((a, b) => b.size - a.size).slice(0, 10);

  const recentChanges = [
    ...wallChanges.new.map(w => ({ ...w, change: 'new' })),
    ...wallChanges.absorbed.map(w => ({ ...w, change: 'absorbed' })),
    ...wallChanges.pulled.map(w => ({ ...w, change: 'pulled' })),
  ].slice(0, 10);

  return (
    <div className="w-full h-full bg-background-secondary overflow-hidden flex flex-col">
      <div className="p-2 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-white">Wall Tracker</h3>
        <div className="text-xs text-gray-400">
          {walls.total_walls} active walls
        </div>
      </div>

      {/* Active Walls */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 text-xs font-semibold text-gray-400 border-b border-gray-800">
          Active Walls
        </div>
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-background-tertiary">
            <tr className="text-gray-400">
              <th className="p-1 text-left">Side</th>
              <th className="p-1 text-right">Price</th>
              <th className="p-1 text-right">Size (BTC)</th>
              <th className="p-1 text-right">Distance</th>
            </tr>
          </thead>
          <tbody>
            {allWalls.map((wall, index) => (
              <tr key={index} className="border-t border-gray-800 hover:bg-background-tertiary">
                <td className="p-1">
                  <span className={`px-2 py-1 rounded ${wall.side === 'bid' ? 'bg-green-900 text-trading-bid' : 'bg-red-900 text-trading-ask'}`}>
                    {wall.side.toUpperCase()}
                  </span>
                </td>
                <td className="p-1 text-right text-white font-semibold">
                  ${formatPrice(wall.price)}
                </td>
                <td className="p-1 text-right text-white">
                  {formatVolume(wall.size, 2)}
                </td>
                <td className="p-1 text-right text-gray-400">
                  {wall.distance_from_mid ? `$${formatPrice(wall.distance_from_mid)}` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Recent Changes */}
        {recentChanges.length > 0 && (
          <>
            <div className="p-2 text-xs font-semibold text-gray-400 border-y border-gray-800 mt-2">
              Recent Changes
            </div>
            <div className="space-y-1 p-2">
              {recentChanges.map((change, index) => (
                <div
                  key={index}
                  className="text-xs p-2 rounded bg-background-tertiary"
                >
                  <div className="flex justify-between items-center">
                    <span className={`font-semibold ${
                      change.change === 'new' ? 'text-yellow-500' :
                      change.change === 'absorbed' ? 'text-green-500' :
                      'text-red-500'
                    }`}>
                      {change.change.toUpperCase()}
                    </span>
                    <span className="text-gray-400">
                      ${formatPrice(change.price)} - {formatVolume(change.size, 2)} BTC
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WallTracker;
