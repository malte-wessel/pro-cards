// Hover tooltip helpers shared by the plots of all cards.

// the point of `pts` (ascending t) closest to t, or null for an empty series
export const nearestPoint = <P extends { t: number }>(
  pts: readonly P[] | null | undefined,
  t: number,
): P | null => {
  if (!pts || pts.length === 0) return null;
  let lo = 0,
    hi = pts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (pts[mid].t < t) lo = mid + 1;
    else hi = mid;
  }
  const a = pts[lo],
    b = pts[lo - 1];
  if (!b) return a;
  return Math.abs(a.t - t) < Math.abs(b.t - t) ? a : b;
};

// place the tooltip right of the crosshair at xs, flipped to the left near the plot's right edge
export const placeTip = (plot: HTMLElement, tip: HTMLElement, xs: number, gutter = 0) => {
  const W = plot.clientWidth,
    tw = tip.offsetWidth;
  let left = xs + 10;
  if (left + tw > W - 4) left = xs - tw - 10;
  if (left < gutter + 4) left = gutter + 4;
  tip.style.left = `${left}px`;
};

export const hideHover = (root: ParentNode | null | undefined) => {
  root?.querySelectorAll(".hover.on").forEach((g) => g.classList.remove("on"));
  root?.querySelectorAll(".tip.on").forEach((t) => t.classList.remove("on"));
};
