// Layout Card Pro: the options at the view columns the layout spans (pure): its breakpoints are
// the container cards' (src/shared/cards/breakpoints.ts), the view columns themselves
// src/shared/cards/view-columns.ts.
import { resolveAt } from "../shared/cards/breakpoints.ts";
import type { LayoutConfig, LayoutOptions, Responsive } from "./config.ts";

// The base options, then every breakpoint up to the view columns there are.
export const resolveOptions = (cfg: LayoutConfig, columns: number): LayoutOptions =>
  resolveAt(cfg.base, cfg.breakpoints, columns);

// a per-child value at a column count: the nearest count at or below it, else `all`
export const pick = <T>(v: Responsive<T>, columns: number): T | undefined => {
  let best = -1;
  for (const k of Object.keys(v.by)) {
    const n = Number(k);
    if (n <= columns && n > best) best = n;
  }
  return best >= 0 ? v.by[best] : v.all;
};
