// Layout Card Pro: which column each card of a masonry layout goes to (pure). Sizes are the cards'
// own getCardSize() (as Home Assistant's masonry view does), never their measured height: a height
// that changes the distribution would change the heights again.

// Pinned cards go to their column first (clamped to the columns there are), then every other card
// in order to the shortest column, the leftmost on a tie. -1 for a card that is not shown.
export const distribute = (
  items: { size: number; pin: number | null; shown: boolean }[],
  columns: number,
): number[] => {
  const n = Math.max(1, columns);
  const heights = new Array<number>(n).fill(0);
  const out = items.map(() => -1);
  const size = (s: number) => (Number.isFinite(s) && s > 0 ? s : 1);
  items.forEach((it, i) => {
    if (!it.shown || it.pin === null) return;
    out[i] = Math.min(n - 1, Math.max(0, it.pin - 1));
    heights[out[i]] += size(it.size);
  });
  items.forEach((it, i) => {
    if (!it.shown || it.pin !== null) return;
    let best = 0;
    for (let c = 1; c < n; c++) if (heights[c] < heights[best]) best = c;
    out[i] = best;
    heights[best] += size(it.size);
  });
  return out;
};

export const tallest = (items: { size: number }[], cols: number[], columns: number): number => {
  const h = new Array<number>(Math.max(1, columns)).fill(0);
  items.forEach((it, i) => {
    if (cols[i] >= 0) h[cols[i]] += it.size > 0 ? it.size : 1;
  });
  return Math.max(0, ...h);
};
