// Config types of the multi trend card: the raw YAML shape and the normalised one the card keeps.
import type { CardConfigBase } from "../shared/ha.ts";
import type { TrendSeries } from "../shared/trend/series.ts";

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
// the entity with its palette colour, its colour rules and its conditions (shared/trend/series.ts)
export type TrendEntity = TrendSeries;
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
