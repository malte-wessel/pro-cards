// Config types of the multi trend card: the raw YAML shape and the normalised one the card keeps.
import type { CardConfigBase, HomeAssistant } from "../shared/ha.ts";
import type { MeanBucket } from "../shared/history.ts";
import type { Scale } from "./scale.ts";

export type TrendLayout = "auto" | "overlay" | "lanes";
export interface MultiTrendEntity {
  entity: string;
  name?: string;
  color?: string;
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
// the entity with its resolved CSS colour
export interface TrendEntity extends MultiTrendEntity {
  colorCss: string;
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
export interface TrendPoint {
  t: number;
  v: number;
}
export type SampledPoint = TrendPoint | MeanBucket;

// what the plot module reads from the card element and stores on it for the hover
export interface TrendHost {
  _config: TrendConfig;
  _hass?: HomeAssistant;
  _root?: HTMLElement;
  _series: TrendPoint[][];
  _sampled?: SampledPoint[][];
  _scales?: Scale[];
  _xOf?: (t: number) => number;
  _gutter?: number;
  _plotW?: number;
  _layout(): "overlay" | "lanes";
  _name(i: number): string;
  _fmt(i: number, v: number): string;
}
