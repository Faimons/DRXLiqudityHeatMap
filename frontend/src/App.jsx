/**
 * Main App Component
 * Layout and composition of all components
 */
import React from 'react';
import useWebSocket from './hooks/useWebSocket';
import Header from './components/Header/Header';
import PriceChart from './components/PriceChart/PriceChart';
import OrderbookHeatmap from './components/OrderbookHeatmap/OrderbookHeatmap';
import VolumeFootprint from './components/VolumeFootprint/VolumeFootprint';
import WallTracker from './components/WallTracker/WallTracker';
import LiquidationOverlay from './components/LiquidationOverlay/LiquidationOverlay';

function App() {
  // Initialize WebSocket connection
  useWebSocket();

  return (
    <div className="h-screen flex flex-col bg-background-primary text-white font-mono">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Chart + Heatmap */}
        <div className="w-2/3 flex flex-col border-r border-gray-800">
          {/* Price Chart */}
          <div className="h-2/3 border-b border-gray-800">
            <PriceChart />
          </div>

          {/* Orderbook Heatmap */}
          <div className="h-1/3">
            <OrderbookHeatmap />
          </div>
        </div>

        {/* Right Side: Info Panels */}
        <div className="w-1/3 flex flex-col">
          {/* Wall Tracker */}
          <div className="h-1/3 border-b border-gray-800">
            <WallTracker />
          </div>

          {/* Volume Footprint */}
          <div className="h-1/3 border-b border-gray-800">
            <VolumeFootprint />
          </div>

          {/* Liquidation Overlay */}
          <div className="h-1/3">
            <LiquidationOverlay />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
