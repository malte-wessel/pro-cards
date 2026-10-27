// Swipe Card Pro: config types and normalization (pure). The cards sit side by side in a strip
// that scrolls sideways and snaps to each card; `per_page` says how many fit across (a fraction
// lets the next one peek in), `unfold` makes them a grid of that many columns instead. Like the
// layout card's, the top-level options apply in one view column and each breakpoint under
// `breakpoints` (2, 3 …) lists only what changes once the card spans that many view columns.
import { breakpointsOf, type Breakpoint } from "../shared/cards/breakpoints.ts";
import { checks, isObj } from "../shared/cards/checks.ts";
import { lengths, type Sides } from "../shared/cards/units.ts";
import type { CardConfigBase } from "../shared/ha.ts";

export const CARD_TYPE = "swipe-card-pro";
export const SNAPS = ["start", "center", "free"] as const;
export const HEIGHTS = ["equal", "auto"] as const;
export const INDICATORS = ["dots", "none"] as const;
export const MAX_PER_PAGE = 12;

export type Snap = (typeof SNAPS)[number];

// everything a breakpoint may change
export interface SwipeOptions {
  per_page: number;
  gap: string | null; // null: the theme's gap
  padding: Sides | null;
  snap: Snap;
  height: (typeof HEIGHTS)[number];
  indicator: (typeof INDICATORS)[number];
  unfold: number | null; // the grid's columns; null: the strip
}
export interface SwipeConfig {
  base: SwipeOptions;
  breakpoints: Breakpoint<SwipeOptions>[]; // ascending by view columns
  cards: CardConfigBase[];
}

export const DEFAULT_OPTIONS: SwipeOptions = {
  per_page: 1.15,
  gap: null,
  padding: null,
  snap: "start",
  height: "equal",
  indicator: "dots",
  unfold: null,
};

const check = checks(CARD_TYPE);
const { err, pickOf, int, cardList } = check;
const { cssLength, boxSides } = lengths(CARD_TYPE);

// the options of one level (the base or a breakpoint): only the keys it sets
export const parseOptions = (raw: Record<string, unknown>, at: string): Partial<SwipeOptions> => {
  const o: Partial<SwipeOptions> = {};
  const p = (k: string) => (at ? `${at}.${k}` : k);
  for (const [k, v] of Object.entries(raw)) {
    if (v === undefined) continue;
    switch (k) {
      case "per_page":
        if (typeof v !== "number" || !(v >= 1 && v <= MAX_PER_PAGE))
          throw err(
            `'${p(k)}' must be a number from 1 to ${MAX_PER_PAGE} (1.15 lets the next card peek in)`,
          );
        o.per_page = v;
        break;
      case "gap":
        o.gap = cssLength(v, p(k));
        break;
      case "padding":
        o.padding = boxSides(v, p(k));
        break;
      case "snap":
        o.snap = pickOf(SNAPS, v, p(k));
        break;
      case "height":
        o.height = pickOf(HEIGHTS, v, p(k));
        break;
      case "indicator":
        o.indicator = pickOf(INDICATORS, v, p(k));
        break;
      case "unfold":
        // false (or YAML's empty `unfold:`) turns it off, so a breakpoint can go back to the strip
        o.unfold = v === null || v === false ? null : int(v, p(k), 1, 12);
        break;
      default:
        if (at) throw err(`'${p(k)}' is not a swipe option`);
    }
  }
  return o;
};

const OPTION_KEYS = Object.keys(DEFAULT_OPTIONS);

export const normalizeSwipeConfig = (raw: unknown): SwipeConfig => {
  if (!isObj(raw)) throw err("the config must be an object");
  const own: Record<string, unknown> = {};
  for (const k of OPTION_KEYS) if (k in raw) own[k] = raw[k];
  return {
    base: { ...DEFAULT_OPTIONS, ...parseOptions(own, "") },
    breakpoints: breakpointsOf(raw.breakpoints, check, parseOptions, "{ 2: { per_page: 2.2 } }"),
    cards: cardList(raw.cards),
  };
};
