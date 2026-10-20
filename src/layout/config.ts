// Layout Card Pro: config types and normalization (pure). The YAML's base options are the
// smallest screen ("phone"); each breakpoint under `breakpoints` lists only what changes from the
// next smaller one, `media` rules apply on top. Each child card's own placement lives in its
// `view_layout`, which Home Assistant's card editors keep (a key of their own would make them
// refuse the config); per-child values may be maps by breakpoint name.
import type { CardConfigBase } from "../shared/ha.ts";
import { boxSides, cssLength, trackTokens } from "./units.ts";

export const CARD_TYPE = "layout-card-pro";
export const BASE = "phone";
export const LAYOUTS = ["grid", "stack", "masonry"] as const;
export const DENSITIES = ["compact", "default", "roomy", "auto"] as const;
export const ALIGNS = ["start", "center", "end"] as const;
export const ITEM_ALIGNS = ["start", "center", "end", "stretch"] as const;
export const DIRECTIONS = ["down", "across"] as const;
export const CARD_STYLES = ["cards", "seamless"] as const;
export const PRIORITIES = ["high", "normal", "low"] as const;
export const DEFAULT_BREAKPOINTS: Record<string, number> = {
  tablet: 600,
  desktop: 1024,
  wide: 1440,
};

export type LayoutType = (typeof LAYOUTS)[number];
export type Density = (typeof DENSITIES)[number];
export type Align = (typeof ALIGNS)[number];
export type ItemAlign = (typeof ITEM_ALIGNS)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Sides = [string, string, string, string];

export interface Fold {
  max_cards: number;
  label: string | null;
}

// everything a breakpoint or a media rule may change
export interface LayoutOptions {
  layout: LayoutType;
  columns: number | string[]; // a count, or CSS tracks (fr already as minmax(0, Nfr))
  min_column_width: string | null; // as many columns as fit, none narrower
  max_columns: number | null;
  max_width: string | null;
  align: Align;
  row_height: string | null; // null: rows as tall as their content
  dense: boolean;
  align_items: ItemAlign;
  direction: (typeof DIRECTIONS)[number];
  wrap: boolean;
  row_gap: string | null; // null: the density's gap
  column_gap: string | null;
  padding: Sides | null;
  margin: Sides | null;
  density: Density;
  card_style: (typeof CARD_STYLES)[number];
  fold: Fold | null;
}
export type Overrides = Partial<LayoutOptions>;

export interface Breakpoint {
  name: string;
  min: number;
  overrides: Overrides;
}
export interface MediaRule {
  query: string;
  merge: boolean;
  overrides: Overrides;
}

// a per-child value: one for every breakpoint, or a map by breakpoint name (inherited upwards)
export interface Responsive<T> {
  all?: T;
  by: Record<string, T>;
}
export interface Span {
  cols: number | "full";
  rows: number | null;
}
export interface ChildPlace {
  span: Responsive<Span>;
  column: Responsive<number>;
  row: Responsive<number>;
  order: Responsive<number>;
  align: Responsive<ItemAlign>;
  sticky: Responsive<string | false>;
  aspect: Responsive<string>;
  min_height: Responsive<string>;
  max_height: Responsive<string>;
  bleed: Responsive<boolean>;
  priority: Priority;
  show_on: string[] | null;
  hidden_below: string | null;
}
export interface ChildConfig {
  config: CardConfigBase;
  place: ChildPlace;
}
export interface LayoutConfig {
  base: LayoutOptions;
  breakpoints: Breakpoint[]; // ascending by min width, without the base
  order: string[]; // every breakpoint name, the base first
  container: boolean; // breakpoints measure the card (true) or the window
  media: MediaRule[];
  children: ChildConfig[];
}

export const DEFAULT_OPTIONS: LayoutOptions = {
  layout: "grid",
  columns: 1,
  min_column_width: null,
  max_columns: null,
  max_width: null,
  align: "center",
  row_height: null,
  dense: false,
  align_items: "stretch",
  direction: "down",
  wrap: false,
  row_gap: null,
  column_gap: null,
  padding: null,
  margin: null,
  density: "default",
  card_style: "cards",
  fold: null,
};

const OPTION_KEYS = [...Object.keys(DEFAULT_OPTIONS), "gap"] as readonly string[];
const PLACE_KEYS = [
  "span",
  "column",
  "row",
  "order",
  "align",
  "sticky",
  "aspect",
  "min_height",
  "max_height",
  "bleed",
  "priority",
  "show_on",
  "hidden_below",
] as const;
// keys of view_layout that belong to Home Assistant's views or other layouts: kept, not ours
const FOREIGN_PLACE_KEYS = ["position", "grid-area", "grid-column", "grid-row", "show"];

const err = (msg: string) => new Error(`${CARD_TYPE}: ${msg}`);
const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const NAME_RE = /^[a-z][a-z0-9_]*$/;

const pickOf = <T extends string>(list: readonly T[], v: unknown, at: string): T => {
  if (typeof v === "string" && (list as readonly string[]).includes(v)) return v as T;
  throw err(`'${at}' must be one of ${list.join(", ")}`);
};
const bool = (v: unknown, at: string) => {
  if (typeof v !== "boolean") throw err(`'${at}' must be true or false`);
  return v;
};
const int = (v: unknown, at: string, min: number, max = Infinity) => {
  if (typeof v !== "number" || !Number.isInteger(v) || v < min || v > max)
    throw err(
      `'${at}' must be a whole number${max === Infinity ? ` of at least ${min}` : ` from ${min} to ${max}`}`,
    );
  return v;
};

// the options of one level (the base, a breakpoint or a media rule): only the keys it sets
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
      case "min_column_width":
        o.min_column_width = v === null ? null : cssLength(v, p(k));
        break;
      case "max_columns":
        o.max_columns = v === null ? null : int(v, p(k), 1, 24);
        break;
      case "max_width":
        o.max_width = v === null ? null : cssLength(v, p(k));
        break;
      case "align":
        o.align = pickOf(ALIGNS, v, p(k));
        break;
      case "row_height":
        o.row_height = v === "auto" || v === null ? null : cssLength(v, p(k));
        break;
      case "dense":
        o.dense = bool(v, p(k));
        break;
      case "align_items":
        o.align_items = pickOf(ITEM_ALIGNS, v, p(k));
        break;
      case "direction":
        o.direction = pickOf(DIRECTIONS, v, p(k));
        break;
      case "wrap":
        o.wrap = bool(v, p(k));
        break;
      case "gap": {
        const pair = Array.isArray(v) ? v : [v, v];
        if (pair.length !== 2)
          throw err(`'${p(k)}' must be a length (8, 0.5rem, 4%, var(--x)) or [row, column]`);
        o.row_gap = cssLength(pair[0], p(k));
        o.column_gap = cssLength(pair[1], p(k));
        break;
      }
      case "row_gap":
      case "column_gap":
        o[k] = cssLength(v, p(k));
        break;
      case "padding":
        o.padding = boxSides(v, p(k), false);
        break;
      case "margin":
        o.margin = boxSides(v, p(k), true);
        break;
      case "density":
        o.density = pickOf(DENSITIES, v, p(k));
        break;
      case "card_style":
        o.card_style = pickOf(CARD_STYLES, v, p(k));
        break;
      case "fold":
        o.fold = parseFold(v, p(k));
        break;
      default:
        if (at) throw err(`'${p(k)}' is not a layout option`);
    }
  }
  // the gap keys are read in any order: row_gap / column_gap win over gap
  for (const k of ["row_gap", "column_gap"] as const)
    if (raw[k] !== undefined) o[k] = cssLength(raw[k], p(k));
  return o;
};

const parseFold = (v: unknown, at: string): Fold | null => {
  if (v === false || v === null) return null;
  if (typeof v === "number") return { max_cards: int(v, at, 0), label: null };
  if (!isObj(v)) throw err(`'${at}' must be { max_cards, label } or false`);
  const label = v.label;
  if (label !== undefined && typeof label !== "string") throw err(`'${at}.label' must be text`);
  return { max_cards: int(v.max_cards, `${at}.max_cards`, 0), label: label ?? null };
};

const parseBreakpoints = (raw: unknown): Breakpoint[] => {
  if (raw !== undefined && raw !== null && !isObj(raw))
    throw err(`'breakpoints' must map names to a min width or { min_width, …options }`);
  const given = (raw || {}) as Record<string, unknown>;
  const names = [...new Set([...Object.keys(DEFAULT_BREAKPOINTS), ...Object.keys(given)])];
  const out: Breakpoint[] = [];
  for (const name of names) {
    const v = given[name];
    if (name === BASE) throw err(`'${BASE}' is the base, put its options at the top level`);
    if (!NAME_RE.test(name))
      throw err(`breakpoint '${name}' needs a name of lower-case letters, digits and _`);
    if (v === false) continue;
    const def = DEFAULT_BREAKPOINTS[name];
    let min: unknown = def;
    let overrides: Overrides = {};
    if (typeof v === "number") min = v;
    else if (isObj(v)) {
      const { min_width, ...rest } = v;
      if (min_width !== undefined) min = min_width;
      overrides = parseOptions(rest, `breakpoints.${name}`);
    } else if (v !== undefined && v !== null)
      throw err(`'breakpoints.${name}' must be a min width, { min_width, …options } or false`);
    if (min === undefined)
      throw err(
        `breakpoint '${name}' needs a min_width (the defaults are ${Object.keys(DEFAULT_BREAKPOINTS).join(", ")})`,
      );
    out.push({ name, min: int(min, `breakpoints.${name}.min_width`, 1), overrides });
  }
  return out.sort((a, b) => a.min - b.min);
};

const parseMedia = (raw: unknown): MediaRule[] => {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw err(`'media' must be a list of { query, …options }`);
  return raw.map((r, i) => {
    const at = `media[${i}]`;
    if (!isObj(r) || typeof r.query !== "string" || !r.query.trim())
      throw err(`'${at}' needs a 'query', a CSS media query such as "(orientation: portrait)"`);
    const { query, merge, ...rest } = r;
    return {
      query: query.trim(),
      merge: merge === undefined ? false : bool(merge, `${at}.merge`),
      overrides: parseOptions(rest, at),
    };
  });
};

// ----- per child (view_layout) -----

const responsive = <T>(
  v: unknown,
  at: string,
  names: string[],
  one: (x: unknown, at: string) => T,
): Responsive<T> => {
  if (v === undefined || v === null) return { by: {} };
  if (!isObj(v)) return { all: one(v, at), by: {} };
  const by: Record<string, T> = {};
  for (const [name, x] of Object.entries(v)) {
    if (!names.includes(name))
      throw err(`${at} names an unknown breakpoint '${name}' (known: ${names.join(", ")})`);
    by[name] = one(x, `${at}.${name}`);
  }
  return { by };
};

const span = (v: unknown, at: string): Span => {
  const cols = (c: unknown): number | "full" => (c === "full" ? "full" : int(c, at, 1, 24));
  if (typeof v === "number" || v === "full") return { cols: cols(v), rows: null };
  if (Array.isArray(v) && v.length === 2) return { cols: cols(v[0]), rows: int(v[1], at, 1, 48) };
  throw err(`${at} must be a number, [columns, rows] or full`);
};
const sticky = (v: unknown, at: string): string | false => {
  if (v === false) return false;
  if (v === true || v === "top") return "var(--header-height, 0px)";
  return cssLength(v, at);
};
const aspect = (v: unknown, at: string): string => {
  if (typeof v === "number" && v > 0) return String(v);
  const m = typeof v === "string" && /^\s*(\d*\.?\d+)\s*(?:[/:]\s*(\d*\.?\d+))?\s*$/.exec(v);
  if (m) return m[2] ? `${m[1]} / ${m[2]}` : m[1];
  throw err(`${at} must be a ratio such as 16/9 or 1.5`);
};
const nameList = (v: unknown, at: string, names: string[]): string[] => {
  const list = Array.isArray(v) ? v : [v];
  for (const n of list)
    if (typeof n !== "string" || !names.includes(n))
      throw err(`${at} names an unknown breakpoint '${String(n)}' (known: ${names.join(", ")})`);
  return list as string[];
};

export const normalizeViewLayout = (raw: unknown, names: string[], label: string): ChildPlace => {
  const at = (k: string) => `${label}.view_layout.${k}`;
  const v = isObj(raw) ? raw : {};
  if (raw !== undefined && raw !== null && !isObj(raw))
    throw err(`${label}.view_layout must be an object`);
  for (const k of Object.keys(v))
    if (!(PLACE_KEYS as readonly string[]).includes(k) && !FOREIGN_PLACE_KEYS.includes(k))
      throw err(`${at(k)} is not a placement option (${PLACE_KEYS.join(", ")})`);
  const r = <T>(k: string, one: (x: unknown, at: string) => T) =>
    responsive(v[k], at(k), names, one);
  return {
    span: r("span", span),
    column: r("column", (x, a) => int(x, a, 1, 24)),
    row: r("row", (x, a) => int(x, a, 1, 48)),
    order: r("order", (x, a) => {
      if (typeof x !== "number" || !Number.isInteger(x)) throw err(`${a} must be a whole number`);
      return x;
    }),
    align: r("align", (x, a) => pickOf(ITEM_ALIGNS, x, a)),
    sticky: r("sticky", sticky),
    aspect: r("aspect", aspect),
    min_height: r("min_height", (x, a) => cssLength(x, a)),
    max_height: r("max_height", (x, a) => cssLength(x, a)),
    bleed: r("bleed", bool),
    priority: v.priority === undefined ? "normal" : pickOf(PRIORITIES, v.priority, at("priority")),
    show_on: v.show_on === undefined ? null : nameList(v.show_on, at("show_on"), names),
    hidden_below:
      v.hidden_below === undefined
        ? null
        : typeof v.hidden_below === "string"
          ? nameList(v.hidden_below, at("hidden_below"), names)[0]
          : (() => {
              throw err(`${at("hidden_below")} must be one breakpoint name`);
            })(),
  };
};

// ----- the whole card -----

export const normalizeLayoutConfig = (raw: unknown): LayoutConfig => {
  if (!isObj(raw)) throw err("the config must be an object");
  const breakpoints = parseBreakpoints(raw.breakpoints);
  const order = [BASE, ...breakpoints.map((b) => b.name)];
  const cards = raw.cards ?? [];
  if (!Array.isArray(cards)) throw err("'cards' must be a list of card configs");
  const children = cards.map((c, i): ChildConfig => {
    if (!isObj(c) || typeof c.type !== "string" || !c.type)
      throw err(`cards[${i}] must be a card config with a 'type'`);
    return {
      config: c as CardConfigBase,
      place: normalizeViewLayout(c.view_layout, order, `cards[${i}]`),
    };
  });
  const container = raw.container === undefined ? true : bool(raw.container, "container");
  const own: Record<string, unknown> = {};
  for (const k of OPTION_KEYS) if (raw[k] !== undefined) own[k] = raw[k];
  return {
    base: { ...DEFAULT_OPTIONS, ...parseOptions(own, "") },
    breakpoints,
    order,
    container,
    media: parseMedia(raw.media),
    children,
  };
};
