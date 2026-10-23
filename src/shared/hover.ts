// Hover tooltip helpers shared by the plots of all cards.
import { type } from "./typography.ts";

// the crosshair group and the tooltip box of every plot (`scope` narrows them, ".trend " for the
// trend plot); a card adds the rules for what its tooltip holds
export const tipStyle = (scope = "") => `
  ${scope}.hover { display: none; }
  ${scope}.hover.on { display: block; }
  ${scope}.tip {
    position: absolute; top: 4px; pointer-events: none; display: none; z-index: 1; box-sizing: border-box; max-width: calc(100% - 8px);
    background: var(--ha-card-background, var(--card-background-color)); color: var(--primary-text-color);
    border: 1px solid var(--divider-color); border-radius: 8px; padding: 6px 8px; ${type(12, 16)}
    box-shadow: var(--ha-card-box-shadow, 0 2px 6px rgba(0,0,0,.2)); white-space: nowrap;
  }
  ${scope}.tip.on { display: block; }
`;

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

// a plot's pointerleave: a mouse that leaves hides the tooltip, a finger's tap keeps it
export const leaveHides = (hide: () => void) => (ev: PointerEvent) => {
  if (ev.pointerType !== "touch") hide();
};
// a pointerdown anywhere on the page: one outside `host` hides it (a tapped tooltip goes with the
// next tap elsewhere)
export const outsideHides = (host: Element, hide: () => void) => (ev: PointerEvent) => {
  if (!ev.composedPath().includes(host)) hide();
};
