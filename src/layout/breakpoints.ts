// Layout Card Pro: how many view columns the layout spans, and its options there (pure).
import type { LayoutConfig, LayoutOptions, Responsive } from "./config.ts";
import { MAX_VIEW_COLUMNS } from "./config.ts";

// Home Assistant's sections view: a column is at most this wide, with this gap between columns
// (its --ha-view-sections-column-max-width / -column-gap defaults)
export const SECTION_COLUMN_MAX = 500;
export const SECTION_COLUMN_GAP = 32;
// how far below a column count's width the layout may shrink before it drops to fewer columns: a
// layout that grows taller can bring up the page's scrollbar, which narrows the card a little,
// and without the margin the smaller layout would take the scrollbar away again, and so on
export const HYSTERESIS_PX = 24;

// the narrowest width that takes `n` view columns: wider than n - 1 columns at their widest
const widthFor = (n: number, max: number, gap: number) => (n - 1) * (max + gap) - gap + 1;

// The view columns of a layout that is not in a section (a panel view, a stack, another layout
// card): as many of the sections view's widest columns as its width needs. `prev` (the count
// shown now) is kept while the width stays within HYSTERESIS_PX below that count's width.
export const columnsForWidth = (
  width: number,
  prev?: number,
  max = SECTION_COLUMN_MAX,
  gap = SECTION_COLUMN_GAP,
): number => {
  const n = Math.min(MAX_VIEW_COLUMNS, Math.max(1, Math.ceil((width + gap) / (max + gap))));
  if (prev && prev > n && width >= widthFor(prev, max, gap) - HYSTERESIS_PX) return prev;
  return n;
};

// The view columns the layout spans: in a sections view, its section's `--column-span`, which
// Home Assistant sets on the section (already capped by the columns the view shows); elsewhere
// counted from the width.
export const activeColumns = (
  columnSpan: string,
  width: number,
  prev?: number,
  max?: number,
  gap?: number,
): number => {
  const span = Number.parseInt(columnSpan, 10);
  if (span >= 1) return Math.min(MAX_VIEW_COLUMNS, span);
  return columnsForWidth(width, prev, max, gap);
};

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
