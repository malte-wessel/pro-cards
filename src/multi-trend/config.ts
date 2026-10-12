// Config types of the multi trend card: the raw YAML shape and the normalised one the card keeps.
import type { CardConfigBase } from "../shared/ha.ts";
import type { Visibility } from "../shared/visibility.ts";

export type TrendLayout = "auto" | "overlay" | "lanes";
export interface MultiTrendEntity {
  entity: string;
  name?: string;
  color?: string;
  visibility?: unknown;
}
export interface MultiTrendCardConfig extends CardConfigBase {
  title?: string;
  icon?: string;
  color?: string;
  hours_to_show?: number;
  layout?: TrendLayout;
  show_legend?: boolean;
  x_axis?: boolean;
  y_axis?: boolean;
  entities?: (string | MultiTrendEntity)[];
}
// the entity with its resolved CSS colour and its conditions (null: always drawn)
export interface TrendEntity extends Omit<MultiTrendEntity, "visibility"> {
  colorCss: string;
  visibility: Visibility;
}
export interface TrendConfig extends CardConfigBase {
  title?: string;
  icon?: string;
  color?: string;
  hours_to_show: number;
  layout: TrendLayout;
  show_legend: boolean;
  x_axis: boolean;
  y_axis: boolean;
  entities: TrendEntity[];
}
export type { TrendPoint } from "../shared/trend/plot.ts";
