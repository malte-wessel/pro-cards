// The container cards (layout, swipe): how many view columns a card spans (pure). A view column is
// the unit Home Assistant's sections view places sections in: one on a phone or in a section of
// `column_span: 1`, more in a wider section; outside a section it is counted from the width.

// the widest a card can be: Home Assistant's sections view shows at most this many columns
export const MAX_VIEW_COLUMNS = 12;
// Home Assistant's sections view: a column is at most this wide, with this gap between columns
// (its --ha-view-sections-column-max-width / -column-gap defaults)
export const SECTION_COLUMN_MAX = 500;
export const SECTION_COLUMN_GAP = 32;
// how far below a column count's width the card may shrink before it drops to fewer columns: a
// card that grows taller can bring up the page's scrollbar, which narrows the card a little,
// and without the margin the smaller layout would take the scrollbar away again, and so on
export const HYSTERESIS_PX = 24;

// the narrowest width that takes `n` view columns: wider than n - 1 columns at their widest
const widthFor = (n: number, max: number, gap: number) => (n - 1) * (max + gap) - gap + 1;

// The view columns of a card that is not in a section (a panel view, a stack, another layout
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

// The view columns the card spans: in a sections view, its section's `--column-span`, which
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
