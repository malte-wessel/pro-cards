// Shared constants of the entity cards (entity-card-pro, entity-group-card-pro, entity-sections-card-pro).
import { lh } from "../typography.ts";

export const GROUP_LAYOUTS = ["list", "grid", "hero", "row", "column", "table"] as const;
export type GroupLayout = (typeof GROUP_LAYOUTS)[number];
// layouts whose entities render as compact items (name / icon / value) instead of rows
export const ITEM_LAYOUTS: ReadonlySet<GroupLayout> = new Set(["row", "column", "table"]);
export const ALIGNS = ["start", "center", "end", "stretch", "space-between"] as const;
export type Align = (typeof ALIGNS)[number];
export const VISUALS = [
  "icon",
  "ring",
  "gauge",
  "bar",
  "sparkline",
  "columns",
  "badge",
  "strip",
  "trend",
  "count",
  "dot",
] as const;
export type Visual = (typeof VISUALS)[number];
// the soft circle behind the icon, or the icon alone
export const ICON_STYLES = ["circle", "plain"] as const;
export type IconStyle = (typeof ICON_STYLES)[number];
export type HistoryVisual = "sparkline" | "columns" | "strip";
export const HISTORY_VISUALS: ReadonlySet<Visual> = new Set(["sparkline", "columns", "strip"]);
export const BLOCK_VISUALS: ReadonlySet<Visual> = new Set([
  "gauge",
  "bar",
  "sparkline",
  "columns",
  "strip",
]);
// what a header badge draws: the icon (or picture), a ring around it, a bar or a sparkline beside the
// value, the change over trend_hours, how many members of a group are on, or a dot for the icon;
// `badge` is the old spelling of a soft pill
export const HEADER_VISUALS: ReadonlySet<Visual> = new Set([
  "icon",
  "badge",
  "ring",
  "bar",
  "sparkline",
  "trend",
  "count",
  "dot",
]);
// the visuals only a header badge draws
export const HEADER_ONLY_VISUALS: ReadonlySet<Visual> = new Set(["trend", "count", "dot"]);
// a header badge: its pill (or none) and its height (24 / 30 / 36 px)
export const BADGE_STYLES = ["outline", "soft", "filled", "plain"] as const;
export type BadgeStyle = (typeof BADGE_STYLES)[number];
export const BADGE_SIZES = ["s", "m", "l"] as const;
export type BadgeSize = (typeof BADGE_SIZES)[number];
// how a badge writes its value: as the entity formats it, in W / kW / MW, as a duration, or as
// the time from now of a date
export const BADGE_FORMATS = ["auto", "power", "duration", "relative"] as const;
export type BadgeFormat = (typeof BADGE_FORMATS)[number];
export const DEFAULTS = {
  layout: "list",
  hours_to_show: 24,
  bucket_minutes: 60,
  columns: 2,
} as const;
export type NamePosition = "above" | "below";
export interface ItemDefaults {
  showName: boolean;
  showValue: boolean;
  showIcon: boolean;
  namePosition: NamePosition;
  align?: Align;
}
// item defaults per layout; "header" is for header_entities, "other" for tile / list / grid / hero
export const ITEM_DEFAULTS: { [layout: string]: ItemDefaults | undefined } & {
  header: ItemDefaults;
  other: ItemDefaults;
} = {
  row: {
    showName: true,
    showValue: true,
    showIcon: true,
    namePosition: "below",
    align: "space-between",
  },
  column: {
    showName: true,
    showValue: true,
    showIcon: true,
    namePosition: "above",
    align: "start",
  },
  table: { showName: true, showValue: true, showIcon: false, namePosition: "above", align: "end" },
  header: { showName: false, showValue: true, showIcon: true, namePosition: "above" },
  other: { showName: true, showValue: true, showIcon: true, namePosition: "above", align: "start" },
};
export const HOLD_MS = 500;
export const DOUBLE_MS = 250;
export const OFF_STATES: ReadonlySet<string> = new Set([
  "off",
  "closed",
  "idle",
  "standby",
  "docked",
  "not_home",
  "disarmed",
  "clear",
]);
export const PLOT_H: Record<HistoryVisual, number> = { sparkline: 56, columns: 56, strip: 22 };
// the strip's time labels below it: their line height (STYLE_PLOT `.label`, which grows with the
// theme's text) and 2 px; 14 px at the default size
export const STRIP_AXIS_CSS = `(${lh(10, 12)} + 2px)`;
