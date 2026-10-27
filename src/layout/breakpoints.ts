// Layout Card Pro: the options at the view columns the layout spans (pure). The view columns
// themselves are src/shared/cards/view-columns.ts.
import type { LayoutConfig, LayoutOptions, Responsive } from "./config.ts";

// The base options, then every breakpoint up to the view columns there are.
export const resolveOptions = (cfg: LayoutConfig, columns: number): LayoutOptions => {
  const o: LayoutOptions = { ...cfg.base };
  for (const b of cfg.breakpoints) if (b.columns <= columns) Object.assign(o, b.overrides);
  return o;
};

// a per-child value at a column count: the nearest count at or below it, else `all`
export const pick = <T>(v: Responsive<T>, columns: number): T | undefined => {
  let best = -1;
  for (const k of Object.keys(v.by)) {
    const n = Number(k);
    if (n <= columns && n > best) best = n;
  }
  return best >= 0 ? v.by[best] : v.all;
};
