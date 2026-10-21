// Layout Card Pro: the resolved options and the children → the CSS of the layout and of each card
// (pure). The element applies the plan as a diff; nothing here reads the page.
import { pick, shownAt } from "./breakpoints.ts";
import type { ChildPlace, LayoutOptions, Span } from "./config.ts";
import type { GridOptions } from "../shared/ha.ts";
import { distribute, tallest } from "./masonry.ts";
import { themeGap, trackCountOf, trackList } from "./units.ts";

export interface KidState {
  place: ChildPlace;
  visible: boolean; // Home Assistant's verdict (the child's `visibility`, a card that hides itself)
  size: number; // getCardSize()
  grid?: GridOptions; // the child's getGridOptions() with its grid_options
}
export interface PlanCtx {
  active: string;
  order: string[];
  preview: boolean; // the dashboard editor: everything shows, what would not is faded
}
export type Style = Record<string, string>;
export interface ItemPlan {
  style: Style;
  shown: boolean;
  ghost: boolean;
  column: number; // masonry: the column, else -1
  gridLayout: boolean; // hui-card.layout = "grid" (fixed rows): the card fills its cell
}
export interface Plan {
  rootClass: string[];
  root: Style;
  body: Style;
  columns: number; // masonry columns, else 0
  sequence: number[]; // masonry: the cards in placement order
  items: ItemPlan[];
}

const gapsOf = (o: LayoutOptions) => {
  const seamless = o.card_style === "seamless";
  return {
    row: o.row_gap ?? (seamless ? "0px" : themeGap("row")),
    col: o.column_gap ?? (seamless ? "0px" : themeGap("column")),
  };
};

// 12 columns: the cards' own grid options size them as in a sections grid (12 when a card names
// none, within its min / max columns); any other grid: one column each
const defaultSpan = (o: LayoutOptions, grid?: GridOptions): Span => {
  if (o.layout !== "grid" || o.columns !== 12) return { cols: 1, rows: null };
  if (grid?.columns === "full") return { cols: "full", rows: null };
  let cols = Number(grid?.columns) || 12;
  if (typeof grid?.min_columns === "number") cols = Math.max(cols, grid.min_columns);
  if (typeof grid?.max_columns === "number") cols = Math.min(cols, grid.max_columns);
  return { cols: Math.min(12, Math.max(1, cols)), rows: null };
};

const surfacePad = (o: LayoutOptions): Style =>
  o.card_style === "seamless" && o.padding ? { padding: o.padding.join(" ") } : {};

export const planLayout = (o: LayoutOptions, kids: KidState[], ctx: PlanCtx): Plan => {
  const gap = gapsOf(o);
  const atBp = kids.map((k) => shownAt(k.place, ctx.active, ctx.order));
  const base = kids.map((k, i) => k.visible && atBp[i]);
  const shown = kids.map((_, i) => ctx.preview || base[i]);
  const ghost = kids.map((_, i) => ctx.preview && !atBp[i]);
  const p = <T>(v: { all?: T; by: Record<string, T> }) => pick(v, ctx.active, ctx.order);

  const root: Style = {
    // seamless: the padding is inside the surface, around the cards; otherwise around the layout
    padding: o.padding && o.card_style !== "seamless" ? o.padding.join(" ") : "0",
    "--pl-row-gap": gap.row,
    "--pl-col-gap": gap.col,
  };
  const rootClass = [`layout-${o.layout}`];
  if (o.card_style === "seamless") rootClass.push("seamless");
  if (o.layout === "stack" && o.direction === "across") rootClass.push("across");

  // what every layout does with a card's own options
  const common = (k: KidState): Style => {
    const s: Style = {};
    const order = p(k.place.order);
    if (order !== undefined) s.order = String(order);
    const align = p(k.place.align);
    if (align) s["align-self"] = align;
    return s;
  };
  const item = (i: number, style: Style, extra: Partial<ItemPlan> = {}): ItemPlan => ({
    style,
    shown: shown[i],
    ghost: ghost[i],
    column: -1,
    gridLayout: false,
    ...extra,
  });

  if (o.layout === "stack") {
    const across = o.direction === "across";
    const body: Style = {
      display: "flex",
      "flex-direction": across ? "row" : "column",
      "row-gap": gap.row,
      "column-gap": gap.col,
      "align-items": o.align_items,
      ...surfacePad(o),
    };
    const items = kids.map((k, i) => {
      const s = common(k);
      if (!across) s.flex = "0 0 auto";
      else {
        const sp = p(k.place.span);
        // a span is the card's share of the width ("full" counts as one share: one line)
        const grow = sp && sp.cols !== "full" ? sp.cols : 1;
        s.flex = `${grow} 1 0px`;
      }
      return item(i, s);
    });
    return { rootClass, root, body, columns: 0, sequence: [], items };
  }

  if (o.layout === "masonry") {
    const n = trackCountOf(o.columns);
    const body: Style = {
      display: "grid",
      "grid-template-columns": trackList(o.columns),
      "column-gap": gap.col,
      "align-items": "start",
      ...surfacePad(o),
    };
    // the order option sorts the cards before they are dealt out to the columns
    const sequence = kids
      .map((k, i) => ({ i, order: p(k.place.order) ?? 0 }))
      .sort((a, b) => a.order - b.order || a.i - b.i)
      .map((x) => x.i);
    const cols = distribute(
      sequence.map((i) => ({
        size: kids[i].size,
        pin: p(kids[i].place.column) ?? null,
        shown: shown[i],
      })),
      n,
    );
    const colOf = new Array<number>(kids.length).fill(-1);
    sequence.forEach((i, j) => (colOf[i] = cols[j]));
    const items = kids.map((k, i) => {
      const s = common(k);
      delete s.order; // the sequence already has it
      return item(i, s, { column: colOf[i] });
    });
    return { rootClass, root, body, columns: n, sequence, items };
  }

  // grid
  const known = trackCountOf(o.columns);
  const body: Style = {
    display: "grid",
    "grid-template-columns": trackList(o.columns),
    "grid-auto-rows": "auto",
    "row-gap": gap.row,
    "column-gap": gap.col,
    "align-items": o.align_items,
    ...surfacePad(o),
  };
  const items = kids.map((k, i) => {
    const s = common(k);
    const sp = p(k.place.span) ?? defaultSpan(o, k.grid);
    const ownRows = o.row_height && typeof k.grid?.rows === "number" ? k.grid.rows : null;
    const rows = sp.rows ?? ownRows;
    // a span wider than the grid shrinks to it, a start column moves so the card fits
    const n = sp.cols === "full" ? null : Math.min(sp.cols, known);
    let start = p(k.place.column) ?? null;
    if (start !== null) start = Math.max(1, Math.min(start, known - (n ?? known) + 1));
    s["grid-column"] =
      n === null ? "1 / -1" : start !== null ? `${start} / span ${n}` : `span ${n}`;
    if (rows) s["grid-row"] = `span ${rows}`;
    if (rows && o.row_height)
      s.height = `calc(${rows} * ${o.row_height} + ${rows - 1} * ${gap.row})`;
    // HA's "grid" mode makes a card fill its cell: only a card the fixed rows give a height gets
    // it (in an auto row a core tile would take a height of its own instead of its content's)
    return item(i, s, { gridLayout: !!(rows && o.row_height) });
  });
  return { rootClass, root, body, columns: 0, sequence: [], items };
};

// getCardSize of the whole layout (1 unit is about 50 px), an estimate from the cards' own sizes
// (rows of `columns` cards, spans not counted)
export const cardSize = (o: LayoutOptions, kids: KidState[], plan: Plan): number => {
  const shown = kids.filter((_, i) => plan.items[i].shown);
  const sz = (k: KidState) => (k.size > 0 ? k.size : 1);
  let n = 0;
  if (o.layout === "masonry")
    n = tallest(
      kids.map((k) => ({ size: sz(k) })),
      plan.items.map((it) => (it.shown ? it.column : -1)),
      plan.columns,
    );
  else if (o.layout === "stack" && o.direction === "down") n = shown.reduce((a, k) => a + sz(k), 0);
  else if (o.layout === "stack") n = Math.max(0, ...shown.map(sz));
  else {
    const per = Math.max(1, trackCountOf(o.columns));
    for (let i = 0; i < shown.length; i += per) n += Math.max(...shown.slice(i, i + per).map(sz));
  }
  return n;
};
