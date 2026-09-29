// Shared constants of the entity cards (entity-card, entity-group-card, entity-sections-card).

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
] as const;
export type Visual = (typeof VISUALS)[number];
export type HistoryVisual = "sparkline" | "columns" | "strip";
export const HISTORY_VISUALS: ReadonlySet<Visual> = new Set(["sparkline", "columns", "strip"]);
export const BLOCK_VISUALS: ReadonlySet<Visual> = new Set([
  "gauge",
  "bar",
  "sparkline",
  "columns",
  "strip",
]);
export const HEADER_VISUALS: ReadonlySet<Visual> = new Set(["icon", "badge"]);
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
  row: { showName: true, showValue: false, showIcon: true, namePosition: "above", align: "start" },
  column: { showName: true, showValue: false, showIcon: true, namePosition: "above", align: "end" },
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
export const STRIP_AXIS_H = 14;
