// The animation maths of one link (pure): how many particles it carries, how fast they travel
// and how a changed load re-times a running animation instead of restarting it.
import { IDLE_W } from "./constants.ts";

export const isActive = (w: number) => w >= IDLE_W;

// particles on a link of length L px carrying w W: 1 … 10, denser with the load
export const particles = (L: number, w: number) =>
  Math.max(1, Math.min(10, Math.round((L / 45) * Math.min(1, 0.25 + w / 2500))));
// travel speed in px/s
export const speed = (w: number) => 22 + Math.min(150, w / 24);
// one crossing of the link in seconds
export const duration = (L: number, w: number) => Math.max(0.5, L / speed(w));
// playback rate of an animation built for `built` W now carrying `w` W
export const rateOf = (w: number, built: number) => speed(w) / speed(built);
// the dash of the `lines` style in path-length units (pathLength = 100)
export const dashOf = (L: number) => Math.min(40, Math.max(12, (1400 / Math.max(1, L)) * 2.2));
// arrow length for the `arrows` style
export const arrowLength = (w: number) => Math.round(9 + Math.min(7, w / 600));
// a lane is rebuilt when the particle count moved by two or more; a smaller change only re-times
export const needsRebuild = (builtN: number, n: number) => Math.abs(builtN - n) >= 2;
