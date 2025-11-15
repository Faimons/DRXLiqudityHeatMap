/**
 * Canvas-based Heatmap Renderer
 * Pure function for rendering orderbook heatmap
 */

export function renderHeatmap(canvas, bids, asks, bidColorScale, askColorScale, dimensions) {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const { width, height } = dimensions;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Calculate dimensions
  const midY = height / 2;
  const askHeight = asks.length > 0 ? midY / asks.length : 0;
  const bidHeight = bids.length > 0 ? midY / bids.length : 0;
  const barWidth = width - 100; // Leave space for labels

  // Render Asks (top half, reversed)
  asks.forEach((level, index) => {
    const y = midY - (index + 1) * askHeight;
    const size = level.size || level[1];
    const price = level.price || level[0];
    const barLength = (size / Math.max(...asks.map(l => l.size || l[1]))) * barWidth;

    // Draw bar
    ctx.fillStyle = askColorScale(size);
    ctx.fillRect(width - barLength - 80, y, barLength, askHeight - 1);

    // Draw price label
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'right';
    ctx.fillText(price.toFixed(2), width - 5, y + askHeight / 2 + 3);
  });

  // Render Bids (bottom half)
  bids.forEach((level, index) => {
    const y = midY + index * bidHeight;
    const size = level.size || level[1];
    const price = level.price || level[0];
    const barLength = (size / Math.max(...bids.map(l => l.size || l[1]))) * barWidth;

    // Draw bar
    ctx.fillStyle = bidColorScale(size);
    ctx.fillRect(width - barLength - 80, y, barLength, bidHeight - 1);

    // Draw price label
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'right';
    ctx.fillText(price.toFixed(2), width - 5, y + bidHeight / 2 + 3);
  });

  // Draw midline
  ctx.strokeStyle = '#ffff00';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, midY);
  ctx.lineTo(width, midY);
  ctx.stroke();
}
