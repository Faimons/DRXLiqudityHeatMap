/**
 * Tab Navigation Component
 * Professional multi-view navigation system
 */
import React from 'react';
import useStore from '../../store/useStore';

const TabNavigation = ({ activeTab, onTabChange }) => {
  const { isConnected } = useStore();

  const tabs = [
    {
      id: 'heatmap',
      label: 'Liquidity Heatmap',
      icon: '📊',
      description: 'Live orderbook depth visualization'
    },
    {
      id: 'chart',
      label: 'Price Chart',
      icon: '📈',
      description: 'Candlestick chart with overlays'
    },
    {
      id: 'dom',
      label: 'DOM Trading',
      icon: '📖',
      description: 'Depth of market orderbook'
    }
  ];

  return (
    <div className="bg-background-tertiary border-b border-gray-800">
      <div className="flex items-center h-14 px-4">
        {/* Logo/Title */}
        <div className="flex items-center space-x-3 mr-8">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">DRX</span>
          </div>
          <h1 className="text-xl font-bold text-white">Trading Platform</h1>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 flex-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  group relative flex items-center space-x-2 px-4 py-2 rounded-t-lg
                  transition-all duration-200
                  ${isActive
                    ? 'bg-background-primary text-white border-t-2 border-blue-500'
                    : 'bg-transparent text-gray-400 hover:text-white hover:bg-background-secondary'
                  }
                `}
              >
                <span className={`text-lg ${isActive ? '' : 'opacity-60'}`}>{tab.icon}</span>
                <span className="text-sm font-medium">{tab.label}</span>

                {/* Tooltip */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-gray-700">
                  {tab.description}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-4 border-transparent border-b-gray-900" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Connection Status */}
        <div className="flex items-center space-x-2 ml-auto">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-400">
            {isConnected ? 'Binance Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;
