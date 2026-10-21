// Layout Card Pro: config types and normalization (pure). The breakpoints are view columns, the
// unit Home Assistant's sections view places sections in: the top-level options apply in one view
// column (a phone, or a section of `column_span: 1`), each breakpoint under `breakpoints` (2, 3 …)
// lists only what changes once the layout's section spans that many view columns. Each child
// card's own placement lives in its `view_layout`, which Home Assistant's card editors keep (a key
// of their own would make them refuse the config); per-child values may be maps by view columns.
import type { CardConfigBase } from "../shared/ha.ts";
import { boxSides, cssLength, trackTokens } from "./units.ts";

export const CARD_TYPE = "layout-card-pro";
export const LAYOUTS = ["grid", "masonry"] as const;
export const ITEM_ALIGNS = ["start", "center", "end", "stretch"] as const;
export const CARD_STYLES = ["cards", "seamless"] as const;
// the widest a breakpoint can be: Home Assistant's sections view shows at most this many columns
export const MAX_VIEW_COLUMNS = 12;

export type LayoutType = (typeof LAYOUTS)[number];
export type ItemAlign = (typeof ITEM_ALIGNS)[number];
export type Sides = [string, string, string, string];

// everything a breakpoint may change
export interface LayoutOptions {
  layout: LayoutType;
  columns: number | string[]; // a count, or CSS tracks (fr already as minmax(0, Nfr))
  align_items: ItemAlign;
  row_gap: string | null; // from `gap`; null: the theme's gap
  column_gap: string | null;
  padding: Sides | null;
  card_style: (typeof CARD_STYLES)[number];
}
export type Overrides = Partial<LayoutOptions>;

export interface Breakpoint {
  columns: number; // the view columns it applies from (2 …)
  overrides: Overrides;
}

// a per-child value: one for every width, or a map by view columns (inherited upwards)
export interface Responsive<T> {
  all?: T;
  by: Record<number, T>;
}
export interface Span {
  cols: number | "full";
  rows: number | null;
}
export interface ChildPlace {
  span: Responsive<Span>;
  column: Responsive<number>;
  order: Responsive<number>;
  align: Responsive<ItemAlign>;
}
export interface ChildConfig {
  config: CardConfigBase;
  place: ChildPlace;
}
export interface LayoutConfig {
  base: LayoutOptions;
  breakpoints: Breakpoint[]; // ascending by view columns
  children: ChildConfig[];
}

export const DEFAULT_OPTIONS: LayoutOptions = {
  layout: "grid",
  columns: 1,
  align_items: "stretch",
  row_gap: null,
  column_gap: null,
  padding: null,
  card_style: "cards",
};

const OPTION_KEYS = [...Object.keys(DEFAULT_OPTIONS), "gap"] as readonly string[];
const PLACE_KEYS = ["span", "column", "order", "align"] as const;
// keys of view_layout that belong to Home Assistant's views or other layouts: kept, not ours
const FOREIGN_PLACE_KEYS = ["position", "grid-area", "grid-column", "grid-row", "show"];

const err = (msg: string) => new Error(`${CARD_TYPE}: ${msg}`);
const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

const pickOf = <T extends string>(list: readonly T[], v: unknown, at: string): T => {
  if (typeof v === "string" && (list as readonly string[]).includes(v)) return v as T;
  throw err(`'${at}' must be one of ${list.join(", ")}`);
};
const int = (v: unknown, at: string, min: number, max = Infinity) => {
  if (typeof v !== "number" || !Number.isInteger(v) || v < min || v > max)
    throw err(
      `'${at}' must be a whole number${max === Infinity ? ` of at least ${min}` : ` from ${min} to ${max}`}`,
    );
  return v;
};
// a key of a breakpoint map: a number of view columns ("2" in YAML's { 2: … } is a string here)
const viewColumns = (key: string, at: string, min: number): number => {
  const n = /^\d+$/.test(key) ? Number(key) : NaN;
  if (!(n >= min && n <= MAX_VIEW_COLUMNS))
    throw err(
      `${at} is keyed by view columns, ${min} to ${MAX_VIEW_COLUMNS} (how many columns of the view the section spans), not '${key}'`,
    );
  return n;
};

// the options of one level (the base or a breakpoint): only the keys it sets
export const parseOptions = (raw: Record<string, unknown>, at: string): Overrides => {
  const o: Overrides = {};
  const p = (k: string) => (at ? `${at}.${k}` : k);
  for (const [k, v] of Object.entries(raw)) {
    if (v === undefined) continue;
    switch (k) {
      case "layout":
        o.layout = pickOf(LAYOUTS, v, p(k));
        break;
      case "columns":
        o.columns = typeof v === "number" ? int(v, p(k), 1, 24) : trackTokens(v, p(k));
        break;
      case "align_items":
        o.align_items = pickOf(ITEM_ALIGNS, v, p(k));
        break;
      case "gap": {
        const pair = Array.isArray(v) ? v : [v, v];
        if (pair.length !== 2)
          throw err(`'${p(k)}' must be a length (8, 0.5rem, 4%, var(--x)) or [row, column]`);
        o.row_gap = cssLength(pair[0], p(k));
        o.column_gap = cssLength(pair[1], p(k));
        break;
      }
      case "padding":
        o.padding = boxSides(v, p(k));
        break;
      case "card_style":
        o.card_style = pickOf(CARD_STYLES, v, p(k));
        break;
      default:
        if (at) throw err(`'${p(k)}' is not a layout option`);
    }
  }
  return o;
};

const parseBreakpoints = (raw: unknown): Breakpoint[] => {
  if (raw === undefined || raw === null) return [];
  if (!isObj(raw))
    throw err(`'breakpoints' must map view columns to options, as { 2: { columns: 4 } }`);
  return Object.entries(raw)
    .map(([key, v]) => {
      const columns = viewColumns(key, "'breakpoints'", 2);
      if (!isObj(v)) throw err(`'breakpoints.${key}' must be the options that change there`);
      return { columns, overrides: parseOptions(v, `breakpoints.${key}`) };
    })
    .sort((a, b) => a.columns - b.columns);
};

// ----- per child (view_layout) -----

const responsive = <T>(
  v: unknown,
  at: string,
  one: (x: unknown, at: string) => T,
): Responsive<T> => {
  if (v === undefined || v === null) return { by: {} };
  if (!isObj(v)) return { all: one(v, at), by: {} };
  const by: Record<number, T> = {};
  for (const [key, x] of Object.entries(v)) by[viewColumns(key, at, 1)] = one(x, `${at}.${key}`);
  return { by };
};

const span = (v: unknown, at: string): Span => {
  const cols = (c: unknown): number | "full" => (c === "full" ? "full" : int(c, at, 1, 24));
  if (typeof v === "number" || v === "full") return { cols: cols(v), rows: null };
  if (Array.isArray(v) && v.length === 2) return { cols: cols(v[0]), rows: int(v[1], at, 1, 48) };
  throw err(`${at} must be a number, [columns, rows] or full`);
};

export const normalizeViewLayout = (raw: unknown, label: string): ChildPlace => {
  const at = (k: string) => `${label}.view_layout.${k}`;
  const v = isObj(raw) ? raw : {};
  if (raw !== undefined && raw !== null && !isObj(raw))
    throw err(`${label}.view_layout must be an object`);
  for (const k of Object.keys(v))
    if (!(PLACE_KEYS as readonly string[]).includes(k) && !FOREIGN_PLACE_KEYS.includes(k))
      throw err(`${at(k)} is not a placement option (${PLACE_KEYS.join(", ")})`);
  const r = <T>(k: string, one: (x: unknown, at: string) => T) => responsive(v[k], at(k), one);
  return {
    span: r("span", span),
    column: r("column", (x, a) => int(x, a, 1, 24)),
    order: r("order", (x, a) => {
      if (typeof x !== "number" || !Number.isInteger(x)) throw err(`${a} must be a whole number`);
      return x;
    }),
    align: r("align", (x, a) => pickOf(ITEM_ALIGNS, x, a)),
  };
};

// ----- the whole card -----

export const normalizeLayoutConfig = (raw: unknown): LayoutConfig => {
  if (!isObj(raw)) throw err("the config must be an object");
  const cards = raw.cards ?? [];
  if (!Array.isArray(cards)) throw err("'cards' must be a list of card configs");
  const children = cards.map((c, i): ChildConfig => {
    if (!isObj(c) || typeof c.type !== "string" || !c.type)
      throw err(`cards[${i}] must be a card config with a 'type'`);
    return {
      config: c as CardConfigBase,
      place: normalizeViewLayout(c.view_layout, `cards[${i}]`),
    };
  });
  const own: Record<string, unknown> = {};
  for (const k of OPTION_KEYS) if (raw[k] !== undefined) own[k] = raw[k];
  return {
    base: { ...DEFAULT_OPTIONS, ...parseOptions(own, "") },
    breakpoints: parseBreakpoints(raw.breakpoints),
    children,
  };
};
