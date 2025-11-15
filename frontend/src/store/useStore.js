/**
 * Zustand Global State Store
 */
import { create } from 'zustand';

const useStore = create((set, get) => ({
  // Connection State
  isConnected: false,
  connectionError: null,
  setConnectionState: (isConnected, error = null) =>
    set({ isConnected, connectionError: error }),

  // Price Data
  currentPrice: 0,
  priceChange24h: 0,
  spread: 0,
  midPrice: 0,
  setPriceData: (data) =>
    set({
      currentPrice: data.currentPrice || get().currentPrice,
      priceChange24h: data.priceChange24h || 0,
      spread: data.spread || 0,
      midPrice: data.midPrice || 0,
    }),

  // Orderbook Data
  bids: [],
  asks: [],
  aggregatedBids: [],
  aggregatedAsks: [],
  totalBidLiquidity: 0,
  totalAskLiquidity: 0,
  imbalance: { bid_percentage: 50, ask_percentage: 50 },
  setOrderbook: (data) =>
    set({
      bids: data.bids?.raw || [],
      asks: data.asks?.raw || [],
      aggregatedBids: data.bids?.aggregated || [],
      aggregatedAsks: data.asks?.aggregated || [],
      totalBidLiquidity: data.bids?.total_liquidity || 0,
      totalAskLiquidity: data.asks?.total_liquidity || 0,
      imbalance: data.imbalance || { bid_percentage: 50, ask_percentage: 50 },
      spread: data.spread || 0,
      midPrice: data.mid_price || 0,
    }),

  // Walls
  walls: { bid_walls: [], ask_walls: [], total_walls: 0 },
  wallChanges: { new: [], absorbed: [], pulled: [], moved: [] },
  setWalls: (walls, changes = null) =>
    set({
      walls,
      wallChanges: changes || get().wallChanges,
    }),

  // Trades
  recentTrades: [],
  setRecentTrades: (trades) => set({ recentTrades: trades }),

  // Footprint
  footprint: [],
  cumulativeDelta: 0,
  absorptions: [],
  vwap: 0,
  totalBuyVolume: 0,
  totalSellVolume: 0,
  netDelta: 0,
  setFootprint: (data) =>
    set({
      footprint: data.footprint || [],
      cumulativeDelta: data.cumulative_delta || 0,
      absorptions: data.absorptions || [],
      vwap: data.vwap || 0,
      totalBuyVolume: data.total_buy_volume || 0,
      totalSellVolume: data.total_sell_volume || 0,
      netDelta: data.net_delta || 0,
    }),

  // Liquidations
  liquidations: {
    long_liquidations: [],
    short_liquidations: [],
    clusters: [],
  },
  setLiquidations: (data) =>
    set({
      liquidations: {
        long_liquidations: data.heatmap?.long_liquidations || [],
        short_liquidations: data.heatmap?.short_liquidations || [],
        clusters: data.clusters || [],
      },
    }),

  // Settings
  orderbookDepth: 50,
  updateInterval: 100,
  showLiquidations: true,
  showFootprint: true,
  showWalls: true,
  setSettings: (settings) => set(settings),
}));

export default useStore;
