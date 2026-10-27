// Layout Card Pro: the resolved options and the children → the CSS of the layout and of each card
// (pure). The element applies the plan as a diff; nothing here reads the page.
import { pick } from "./breakpoints.ts";
import type { ChildPlace, LayoutOptions, Responsive } from "./config.ts";
import type { GridOptions } from "../shared/ha.ts";
import { distribute, tallest } from "./masonry.ts";
import { themeGap } from "../shared/cards/units.ts";
import { trackCountOf, trackList } from "./units.ts";

// one row of Home Assistant's sections grid: a card that asks for rows gets them in this unit
export const ROW_HEIGHT = "var(--ha-section-grid-row-height, 56px)";

export interface KidState {
  place: ChildPlace;
  visible: boolean; // Home Assistant's verdict (the child's `visibility`, a card that hides itself)
  size: number; // getCardSize()
  grid?: GridOptions; // the child's getGridOptions() with its grid_options
}
export type Style = Record<string, string>;
export interface ItemPlan {
  style: Style;
  shown: boolean;
  column: number; // masonry: the column, else -1
  gridLayout: boolean; // hui-card.layout = "grid": the card has fixed rows and fills them
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

const surfacePad = (o: LayoutOptions): Style =>
  o.card_style === "seamless" && o.padding ? { padding: o.padding.join(" ") } : {};

// `columns`: the view columns the layout spans (the breakpoint its cards' maps are read at)
export const planLayout = (o: LayoutOptions, kids: KidState[], columns: number): Plan => {
  const gap = gapsOf(o);
  const shown = kids.map((k) => k.visible);
  const p = <T>(v: Responsive<T>) => pick(v, columns);

  const root: Style = {
    // seamless: the padding is inside the surface, around the cards; otherwise around the layout
    padding: o.padding && o.card_style !== "seamless" ? o.padding.join(" ") : "0",
    "--pl-row-gap": gap.row,
    "--pl-col-gap": gap.col,
  };
  const rootClass = [`layout-${o.layout}`];
  if (o.card_style === "seamless") rootClass.push("seamless");

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
    column: -1,
    gridLayout: false,
    ...extra,
  });

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
    const sp = p(k.place.span) ?? { cols: 1, rows: null };
    // rows: the card's span, else the rows its own grid options ask for, as in a section
    const rows = sp.rows ?? (typeof k.grid?.rows === "number" ? k.grid.rows : null);
    // a span wider than the grid shrinks to it, a start column moves so the card fits
    const n = sp.cols === "full" ? null : Math.min(sp.cols, known);
    let start = p(k.place.column) ?? null;
    if (start !== null) start = Math.max(1, Math.min(start, known - (n ?? known) + 1));
    s["grid-column"] =
      n === null ? "1 / -1" : start !== null ? `${start} / span ${n}` : `span ${n}`;
    if (rows) {
      s["grid-row"] = `span ${rows}`;
      s.height = `calc(${rows} * ${ROW_HEIGHT} + ${rows - 1} * ${gap.row})`;
    }
    // HA's "grid" mode makes a card fill its cell: only a card with fixed rows gets it (in an
    // auto row a core tile would take a height of its own instead of its content's)
    return item(i, s, { gridLayout: !!rows });
  });
  return { rootClass, root, body, columns: 0, sequence: [], items };
};

// getCardSize of the whole layout (1 unit is about 50 px), an estimate from the cards' own sizes
// (rows of `columns` cards, spans not counted)
export const cardSize = (o: LayoutOptions, kids: KidState[], plan: Plan): number => {
  const shown = kids.filter((_, i) => plan.items[i].shown);
  const sz = (k: KidState) => (k.size > 0 ? k.size : 1);
  if (o.layout === "masonry")
    return tallest(
      kids.map((k) => ({ size: sz(k) })),
      plan.items.map((it) => (it.shown ? it.column : -1)),
      plan.columns,
    );
  const per = Math.max(1, trackCountOf(o.columns));
  let n = 0;
  for (let i = 0; i < shown.length; i += per) n += Math.max(...shown.slice(i, i + per).map(sz));
  return n;
};
