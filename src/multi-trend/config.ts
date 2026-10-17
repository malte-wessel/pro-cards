// Config types of the multi trend card: the raw YAML shape and the normalised one the card keeps.
import type { CardConfigBase } from "../shared/ha.ts";
import type { Rule } from "../shared/entity/config.ts";
import type { Visibility } from "../shared/visibility.ts";

export type TrendLayout = "auto" | "overlay" | "lanes";
export interface MultiTrendEntity {
  entity: string;
  name?: string;
  color?: string;
  rules?: unknown;
  visibility?: unknown;
}
export interface MultiTrendCardConfig extends CardConfigBase {
  title?: string;
  icon?: string;
  color?: string;
  hours_to_show?: number;
  smoothing_minutes?: number;
  layout?: TrendLayout;
  show_legend?: boolean;
  x_axis?: boolean;
  y_axis?: boolean;
  entities?: (string | MultiTrendEntity)[];
}
// the entity with its palette colour (CSS, by config position), its colour rules and its
// conditions (null: always drawn); the drawn colour is resolved at render time (`seriesColor`)
export interface TrendEntity extends Omit<MultiTrendEntity, "rules" | "visibility"> {
  fallbackCss: string;
  rules: Rule[];
  visibility: Visibility;
}
export interface TrendConfig extends CardConfigBase {
  title?: string;
  icon?: string;
  color?: string;
  hours_to_show: number;
  // averaging bucket of the lines in minutes (null: one point per LINE_POINT_PX)
  smoothing_minutes: number | null;
  layout: TrendLayout;
  show_legend: boolean;
  x_axis: boolean;
  y_axis: boolean;
  entities: TrendEntity[];
}
export type { TrendPoint } from "../shared/trend/plot.ts";
