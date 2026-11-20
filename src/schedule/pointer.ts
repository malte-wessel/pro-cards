// The schedule card's pointer maths (pure): whether a point is on a box or a few pixels off it, and
// how far a dot dragged sideways stretches its row's blocks.

export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

// a pointer within this many pixels of a box is on it
export const NEAR = 8;
export const near = (r: Box, x: number, y: number) =>
  x >= r.left - NEAR && x <= r.right + NEAR && y >= r.top - NEAR && y <= r.bottom + NEAR;

// a dot dragged sideways to `at` (minutes): its row's blocks (sorted) stretch only once the
// pointer is past them, their end (or start) then where it is; between their start and their end
// nothing changes. The minutes the end (> 0) or the start (< 0) moves
export const stretchOf = (blocks: readonly { from: number; to: number }[], at: number) => {
  if (!blocks.length) return 0;
  const from = blocks[0].from,
    to = blocks[blocks.length - 1].to;
  return at > to ? at - to : at < from ? at - from : 0;
};
