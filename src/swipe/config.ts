// Swipe Card Pro: config types and normalization (pure). The cards sit side by side in a strip
// that scrolls sideways and snaps to each card; `per_page` says how many fit across (a fraction
// lets the next one peek in); from `unfold.from` view columns on they are a plain grid instead.
import { checks, isObj } from "../shared/cards/checks.ts";
import { lengths, type Sides } from "../shared/cards/units.ts";
import { MAX_VIEW_COLUMNS } from "../shared/cards/view-columns.ts";
import type { CardConfigBase } from "../shared/ha.ts";

export const CARD_TYPE = "swipe-card-pro";
export const SNAPS = ["start", "center", "free"] as const;
export const HEIGHTS = ["equal", "auto"] as const;
export const INDICATORS = ["dots", "none"] as const;
export const MAX_PER_PAGE = 12;

export type Snap = (typeof SNAPS)[number];

export interface Unfold {
  from: number; // the view columns it applies from
  columns: number;
}
export interface SwipeConfig {
  per_page: number;
  gap: string | null; // null: the theme's gap
  padding: Sides | null;
  snap: Snap;
  height: (typeof HEIGHTS)[number];
  indicator: (typeof INDICATORS)[number];
  unfold: Unfold | null;
  cards: CardConfigBase[];
}

export const DEFAULTS: Omit<SwipeConfig, "cards"> = {
  per_page: 1.15,
  gap: null,
  padding: null,
  snap: "start",
  height: "equal",
  indicator: "dots",
  unfold: null,
};

const { err, pickOf, int, cardList } = checks(CARD_TYPE);
const { cssLength, boxSides } = lengths(CARD_TYPE);

const unfoldOf = (v: unknown): Unfold | null => {
  if (v === undefined || v === null) return null;
  if (!isObj(v)) throw err(`'unfold' must be { from: <view columns>, columns: <n> }`);
  for (const k of Object.keys(v))
    if (k !== "from" && k !== "columns")
      throw err(`'unfold.${k}' is not an option (from, columns)`);
  return {
    from: int(v.from, "unfold.from", 1, MAX_VIEW_COLUMNS),
    columns: int(v.columns, "unfold.columns", 1, 12),
  };
};

export const normalizeSwipeConfig = (raw: unknown): SwipeConfig => {
  if (!isObj(raw)) throw err("the config must be an object");
  const perPage = raw.per_page ?? DEFAULTS.per_page;
  if (typeof perPage !== "number" || !(perPage >= 1 && perPage <= MAX_PER_PAGE))
    throw err(
      `'per_page' must be a number from 1 to ${MAX_PER_PAGE} (1.15 lets the next card peek in)`,
    );
  return {
    per_page: perPage,
    gap: raw.gap === undefined ? DEFAULTS.gap : cssLength(raw.gap, "gap"),
    padding: raw.padding === undefined ? DEFAULTS.padding : boxSides(raw.padding, "padding"),
    snap: raw.snap === undefined ? DEFAULTS.snap : pickOf(SNAPS, raw.snap, "snap"),
    height: raw.height === undefined ? DEFAULTS.height : pickOf(HEIGHTS, raw.height, "height"),
    indicator:
      raw.indicator === undefined
        ? DEFAULTS.indicator
        : pickOf(INDICATORS, raw.indicator, "indicator"),
    unfold: unfoldOf(raw.unfold),
    cards: cardList(raw.cards),
  };
};
