/**
 * Orderbook hook
 * Provides orderbook data and calculations
 */
import { useMemo } from 'react';
import useStore from '../store/useStore';

const useOrderbook = () => {
  const {
    bids,
    asks,
    aggregatedBids,
    aggregatedAsks,
    spread,
    midPrice,
    totalBidLiquidity,
    totalAskLiquidity,
    imbalance,
  } = useStore();

  // Get top N levels
  const getTopLevels = useMemo(() => (levels, depth = 20) => {
    return levels.slice(0, depth);
  }, []);

  // Calculate total liquidity in range
  const getLiquidityInRange = useMemo(() => (levels, minPrice, maxPrice) => {
    return levels
      .filter(([price]) => price >= minPrice && price <= maxPrice)
      .reduce((sum, [, size]) => sum + size, 0);
  }, []);

  // Find largest order
  const largestBid = useMemo(() => {
    if (!bids.length) return null;
    return bids.reduce((max, current) =>
      current[1] > max[1] ? current : max
    );
  }, [bids]);

  const largestAsk = useMemo(() => {
    if (!asks.length) return null;
    return asks.reduce((max, current) =>
      current[1] > max[1] ? current : max
    );
  }, [asks]);

  // Calculate best bid/ask
  const bestBid = useMemo(() => bids[0]?.[0] || 0, [bids]);
  const bestAsk = useMemo(() => asks[0]?.[0] || 0, [asks]);

  return {
    bids,
    asks,
    aggregatedBids,
    aggregatedAsks,
    spread,
    midPrice,
    bestBid,
    bestAsk,
    totalBidLiquidity,
    totalAskLiquidity,
    imbalance,
    largestBid,
    largestAsk,
    getTopLevels,
    getLiquidityInRange,
  };
};

export default useOrderbook;
