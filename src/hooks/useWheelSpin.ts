/**
 * Picks an index into `weights` with probability proportional to each
 * weight. Weights don't need to sum to any particular total.
 */
export function pickWeightedIndex(weights: number[], random: () => number = Math.random): number {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let remaining = random() * total;
  for (let i = 0; i < weights.length; i++) {
    remaining -= weights[i];
    if (remaining < 0) {
      return i;
    }
  }
  return weights.length - 1;
}

const FULL_TURNS = 5;

function mod360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Target rotation for the wedge layer to land `mid` (a segment's mid-angle)
 * under the fixed pointer at angle 0, spinning forward from `current`.
 * `current` keeps growing across spins (never reset to 0), so `delta` is
 * normalized into [0, 360) first — the result is always `current` plus a
 * clean `fullTurns`-or-more forward rotation, never smaller or negative.
 */
export function computeTargetRotation(current: number, mid: number, fullTurns: number = FULL_TURNS): number {
  const delta = mod360(-mid - current);
  return current + 360 * fullTurns + delta;
}
