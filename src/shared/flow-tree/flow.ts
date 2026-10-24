// The animation maths of one link (pure): how many particles it carries, how fast they travel
// and how a changed load re-times a running animation instead of restarting it. The load is
// read against the card's `animation` bounds: at `slowBelow` W and less the flow is slowest, at
// `fastAbove` W and more it is fastest.
import { DEFAULT_ANIMATION, IDLE_W, type Animation } from "./constants.ts";

// How a card's values move its links: `of` maps a link's value to the load the bounds `a` read
// (the power card: its watts; the energy card: its share of the home)
export interface Motion {
  of: (w: number) => number;
  a: Animation;
}

// a link is active when it carries a real load either way: `idle` W or more (the card's
// `idle_below`; a rounding remainder below it still counts), never nothing
export const isActive = (w: number, idle: number = IDLE_W) => w !== 0 && Math.abs(w) >= idle - 1e-9;

// the load between the bounds, 0 … 1
export const loadOf = (w: number, a: Animation = DEFAULT_ANIMATION) =>
  Math.max(0, Math.min(1, (Math.abs(w) - a.slowBelow) / (a.fastAbove - a.slowBelow)));
// particles on a link of length L px: 1 … 10, denser with the load
export const particles = (L: number, w: number, a: Animation = DEFAULT_ANIMATION) =>
  Math.max(1, Math.min(10, Math.round((L / 45) * (0.25 + 0.75 * loadOf(w, a)))));
// travel speed in px/s
export const speed = (w: number, a: Animation = DEFAULT_ANIMATION) => 22 + 150 * loadOf(w, a);
// one crossing of the link in seconds
export const duration = (L: number, w: number, a: Animation = DEFAULT_ANIMATION) =>
  Math.max(0.5, L / speed(w, a));
// playback rate of an animation built for `built` W now carrying `w` W
export const rateOf = (w: number, built: number, a: Animation = DEFAULT_ANIMATION) =>
  speed(w, a) / speed(built, a);
// the dash of the `lines` style in path-length units (pathLength = 100)
export const dashOf = (L: number) => Math.min(40, Math.max(12, (1400 / Math.max(1, L)) * 2.2));
// arrow length for the `arrows` style
export const arrowLength = (w: number, a: Animation = DEFAULT_ANIMATION) =>
  Math.round(9 + 7 * loadOf(w, a));
// a lane is rebuilt when the particle count moved by two or more; a smaller change only re-times
export const needsRebuild = (builtN: number, n: number) => Math.abs(builtN - n) >= 2;
