// Layout Card Pro: which breakpoint applies and what the options are there (pure).
import {
  BASE,
  type Breakpoint,
  type ChildPlace,
  type LayoutConfig,
  type LayoutOptions,
  type Responsive,
} from "./config.ts";

// how far below a breakpoint's min width the card may shrink before it drops to the smaller one:
// a layout that grows taller can bring up the page's scrollbar, which narrows the card a little,
// and without the margin the smaller layout would take the scrollbar away again, and so on
export const HYSTERESIS_PX = 24;

// the widest breakpoint whose min width the width reaches; `prev` (the breakpoint shown now) is
// kept while the width stays within HYSTERESIS_PX below its min width
export const activeBreakpoint = (width: number, bps: Breakpoint[], prev?: string): string => {
  let name = BASE;
  for (const b of bps) if (width >= b.min) name = b.name;
  if (prev && prev !== name) {
    const p = bps.find((b) => b.name === prev);
    const n = bps.find((b) => b.name === name);
    const narrower = !!p && (n ? n.min < p.min : true);
    if (p && narrower && width >= p.min - HYSTERESIS_PX) return prev;
  }
  return name;
};

// The base options, then every breakpoint up to the active one.
export const resolveOptions = (cfg: LayoutConfig, active: string): LayoutOptions => {
  const o: LayoutOptions = { ...cfg.base };
  const upto = cfg.order.indexOf(active);
  for (const b of cfg.breakpoints)
    if (cfg.order.indexOf(b.name) <= upto) Object.assign(o, b.overrides);
  return o;
};

// a per-child value at the active breakpoint: its own, else the nearest smaller one's, else `all`
export const pick = <T>(v: Responsive<T>, active: string, order: string[]): T | undefined => {
  for (let i = order.indexOf(active); i >= 0; i--) if (order[i] in v.by) return v.by[order[i]];
  return v.all;
};

// whether a child's own breakpoint rules (show_on, hidden_below) let it show
export const shownAt = (p: ChildPlace, active: string, order: string[]): boolean => {
  if (p.show_on && !p.show_on.includes(active)) return false;
  if (p.hidden_below && order.indexOf(active) < order.indexOf(p.hidden_below)) return false;
  return true;
};
