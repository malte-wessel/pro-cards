// Heading Card Pro: config types and normalization (pure). The card is the entity cards' header
// alone: a title with its icon and subtitle, and the badges (src/shared/kinds/badge.ts) beside or
// below it.
import { BADGE_SIZES, BADGE_STYLES } from "../shared/entity/constants.ts";
import {
  normalizeAction,
  normalizeActionDefaults,
  normalizeTitleAction,
  type EntityCardConfig,
  type RawAction,
  type RawEntityCardBase,
} from "../shared/entity/config.ts";
import { badgeWindow, normalizePills } from "../shared/kinds/badge.ts";
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
export type HeadingStyle = (typeof HEADING_STYLES)[number];

export interface RawHeadingCardConfig extends RawEntityCardBase {
  style?: unknown;
  subtitle?: string | null;
  color?: string | null;
  badges?: unknown;
  badge_position?: unknown;
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
  // the history of the badges is each badge's own window (visual: { type: sparkline, hours })
  for (const k of ["hours_to_show", "bucket_minutes", "smoothing_minutes"] as const)
    if (raw[k] !== undefined)
      throw new Error(
        `${CARD_TYPE}: ${k} is gone: a badge draws its own window (visual: { type: sparkline, hours })`,
      );
  // the 3.0 betas' spelling, named as it is now
  const r = raw as Record<string, unknown>;
  if (r.badges_position !== undefined)
    throw new Error(
      `${CARD_TYPE}: badges_position is badge_position, as badge_style and badge_size`,
    );
  if (r.icon_tap_action !== undefined)
    throw new Error(`${CARD_TYPE}: icon_tap_action is icon: { name, tap_action }, as on the tile`);
  // the icon: its name, or { name, tap_action } (its own tap)
  const icon = raw.icon as unknown;
  let iconName: string | null = null;
  let iconTapRaw: unknown;
  if (typeof icon === "string") iconName = icon;
  else if (icon && typeof icon === "object" && !Array.isArray(icon)) {
    const o = icon as Record<string, unknown>;
    for (const k of Object.keys(o))
      if (k !== "name" && k !== "tap_action")
        throw new Error(`${CARD_TYPE}: icon takes name and tap_action, not ${k}`);
    iconName = typeof o.name === "string" ? o.name : null;
    iconTapRaw = o.tap_action;
  } else if (icon !== undefined && icon !== null)
    throw new Error(`${CARD_TYPE}: icon is an icon's name, or { name, tap_action }`);
  const ctx = { type: CARD_TYPE, ...normalizeActionDefaults(raw) };
  const badges = normalizePills(
    raw.badges,
    ctx,
    "badges",
    {
      style: oneOf(BADGE_STYLES, raw.badge_style) ? raw.badge_style : "outline",
      size: oneOf(BADGE_SIZES, raw.badge_size) ? raw.badge_size : "m",
    },
    "the heading",
  );
  return {
    layout: "heading",
    title: raw.title ?? null,
    titleTap: normalizeTitleAction(raw),
    icon: iconName,
    subtitle: raw.subtitle ?? null,
    iconColor: raw.color ?? null,
    // null: unset, the icon runs the title's action; `none` keeps it still
    iconTap:
      iconTapRaw === undefined || iconTapRaw === null
        ? null
        : normalizeAction(iconTapRaw as RawAction, { action: "none" }),
    ...badgeWindow(badges),
    columns: 1,
    ...ctx,
    entities: badges,
    groups: [],
    headerIdxs: badges.map((_, i) => i),
    hasHeader: true,
    style: oneOf(HEADING_STYLES, raw.style) ? raw.style : "title",
    align: oneOf(HEADING_ALIGNS, raw.align) ? raw.align : "start",
    badgesPosition: oneOf(BADGE_POSITIONS, raw.badge_position) ? raw.badge_position : "end",
    overflow: oneOf(OVERFLOWS, raw.overflow) ? raw.overflow : "wrap",
  };
};
