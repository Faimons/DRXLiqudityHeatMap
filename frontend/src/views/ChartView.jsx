/**
 * Chart View - Full Screen Candlestick Chart
 * Professional chart view with orderbook overlay
 */
import React from 'react';
import PriceChart from '../components/PriceChart/PriceChart';

const ChartView = () => {
  return (
    <div className="w-full h-full bg-background-primary">
      <PriceChart />
    </div>
  );
};

export default ChartView;
