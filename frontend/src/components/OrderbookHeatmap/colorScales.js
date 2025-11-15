/**
 * D3 Color Scales for Heatmap
 */
import * as d3 from 'd3';
import { HEATMAP_COLORS } from '../../utils/constants';

export const createBidColorScale = (maxSize) => {
  return d3.scaleSequential()
    .domain([0, maxSize])
    .interpolator(d3.interpolateRgb(HEATMAP_COLORS.bid.min, HEATMAP_COLORS.bid.max));
};

export const createAskColorScale = (maxSize) => {
  return d3.scaleSequential()
    .domain([0, maxSize])
    .interpolator(d3.interpolateRgb(HEATMAP_COLORS.ask.min, HEATMAP_COLORS.ask.max));
};
