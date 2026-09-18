/** Degrees per segment when the wheel is split into `count` equal slices. */
export function segmentAngle(count: number): number {
  return 360 / count;
}

/**
 * Converts a polar angle to an SVG point. 0deg = 12 o'clock, angles increase
 * clockwise (matches how a physical spin wheel is read).
 */
export function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): { x: number; y: number } {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.sin(angleRad),
    y: cy - r * Math.cos(angleRad),
  };
}

/**
 * Builds an SVG pie-slice path (center -> arc edge -> arc edge -> back to
 * center) covering the clockwise angular span [startDeg, endDeg].
 */
export function describeArc(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);
  const largeArcFlag = endDeg - startDeg > 180 ? 1 : 0;

  return [
    'M', cx, cy,
    'L', end.x, end.y,
    'A', r, r, 0, largeArcFlag, 0, start.x, start.y,
    'Z',
  ].join(' ');
}

/** Segment `index` of `count` is centered at index * segmentAngle(count). */
export function segmentBounds(
  index: number,
  count: number,
): { start: number; end: number; mid: number } {
  const angle = segmentAngle(count);
  const mid = index * angle;
  return {
    start: mid - angle / 2,
    end: mid + angle / 2,
    mid,
  };
}
