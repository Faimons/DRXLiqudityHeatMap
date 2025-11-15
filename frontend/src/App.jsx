/**
 * Main App Component
 * Professional Multi-View Trading Platform
 */
import React, { useState } from 'react';
import useWebSocket from './hooks/useWebSocket';
import TabNavigation from './components/Navigation/TabNavigation';
import HeatmapView from './views/HeatmapView';
import ChartView from './views/ChartView';
import DOMView from './views/DOMView';

function App() {
  // Initialize WebSocket connection
  useWebSocket();

  // Active tab state
  const [activeTab, setActiveTab] = useState('heatmap');

  // Render active view
  const renderActiveView = () => {
    switch (activeTab) {
      case 'heatmap':
        return <HeatmapView />;
      case 'chart':
        return <ChartView />;
      case 'dom':
        return <DOMView />;
      default:
        return <HeatmapView />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background-primary text-white font-mono">
      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Active View */}
      <div className="flex-1 overflow-hidden">
        {renderActiveView()}
      </div>
    </div>
  );
}

export default App;
