// Heading Card Pro: config types and normalization (pure). The card is the entity cards' header
// alone: a title with its icon and subtitle, and the badges (header items) beside or below it.
import { BADGE_SIZES, BADGE_STYLES } from "../shared/entity/constants.ts";
import {
  normalizeActionDefaults,
  normalizeHeaderEntities,
  normalizeHistoryOptions,
  normalizeTitleAction,
  type EntityCardConfig,
  type RawAction,
  type RawEntityCardBase,
} from "../shared/entity/config.ts";
import { oneOf } from "../shared/util.ts";

export const CARD_TYPE = "heading-card-pro";
// section: small caps with a line after it; title and subtitle as Home Assistant's heading; big: a
// larger title beside the icon in a circle; hero: a greeting's size
export const HEADING_STYLES = ["section", "title", "subtitle", "big", "hero"] as const;
export const HEADING_ALIGNS = ["start", "center"] as const;
// where the badges sit: at the end of the line, right after the title, or on a line of their own
export const BADGE_POSITIONS = ["end", "inline", "below"] as const;
// more badges than fit: they wrap onto more lines, or scroll on one
export const OVERFLOWS = ["wrap", "scroll"] as const;
// the history window of the sparkline and trend badges
export const DEFAULT_HOURS = 6;

export type HeadingStyle = (typeof HEADING_STYLES)[number];

export interface RawHeadingCardConfig extends RawEntityCardBase {
  style?: unknown;
  subtitle?: string | null;
  color?: string | null;
  icon_tap_action?: RawAction;
  badges?: unknown;
  badges_position?: unknown;
  overflow?: unknown;
  badge_style?: unknown;
  badge_size?: unknown;
}

export interface HeadingCardConfig extends EntityCardConfig {
  style: HeadingStyle;
  align: (typeof HEADING_ALIGNS)[number];
  badgesPosition: (typeof BADGE_POSITIONS)[number];
  overflow: (typeof OVERFLOWS)[number];
}

export const normalizeHeadingCardConfig = (input: unknown): HeadingCardConfig => {
  if (!input || typeof input !== "object") throw new Error(`${CARD_TYPE}: invalid config`);
  const raw = input as RawHeadingCardConfig;
  const ctx = { type: CARD_TYPE, ...normalizeActionDefaults(raw) };
  const badges = normalizeHeaderEntities(raw.badges, ctx, "badges", {
    style: oneOf(BADGE_STYLES, raw.badge_style) ? raw.badge_style : "outline",
    size: oneOf(BADGE_SIZES, raw.badge_size) ? raw.badge_size : "m",
  });
  return {
    layout: "heading",
    title: raw.title ?? null,
    titleTap: normalizeTitleAction(raw),
    icon: raw.icon ?? null,
    subtitle: raw.subtitle ?? null,
    iconColor: raw.color ?? null,
    iconTap: normalizeTitleAction({ title_tap_action: raw.icon_tap_action }),
    ...normalizeHistoryOptions({ ...raw, hours_to_show: raw.hours_to_show ?? DEFAULT_HOURS }),
    columns: 1,
    ...ctx,
    entities: badges,
    groups: [],
    headerIdxs: badges.map((_, i) => i),
    hasHeader: true,
    style: oneOf(HEADING_STYLES, raw.style) ? raw.style : "title",
    align: oneOf(HEADING_ALIGNS, raw.align) ? raw.align : "start",
    badgesPosition: oneOf(BADGE_POSITIONS, raw.badges_position) ? raw.badges_position : "end",
    overflow: oneOf(OVERFLOWS, raw.overflow) ? raw.overflow : "wrap",
  };
};
