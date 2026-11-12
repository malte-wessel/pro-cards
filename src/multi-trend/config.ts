// Config types of the multi trend card: the raw YAML shape and the normalised one the card keeps.
import { renamedKey } from "../shared/card.ts";
import type { CardConfigBase } from "../shared/ha.ts";
import { normalizeSmoothing } from "../shared/history.ts";
import { numOrNull } from "../shared/util.ts";
import { DEFAULT_HOURS } from "../shared/trend/scale.ts";
import { normalizeSeries, type TrendSeries } from "../shared/trend/series.ts";

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
  // the window and the averaging as a tile's plot has them (`visual: { hours, smoothing }`)
  hours?: number;
  smoothing?: number;
  // deprecated, gone in 4.0: hours and smoothing
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
  hours: number;
  // averaging bucket of the lines in minutes (null: one point per LINE_POINT_PX)
  smoothing: number | null;
  layout: TrendLayout;
  show_legend: boolean;
  x_axis: boolean;
  y_axis: boolean;
  entities: TrendEntity[];
}
export type { TrendPoint } from "../shared/trend/plot.ts";

// the card's config as it draws it: its entities as series, the window and the averaging read from
// `hours` and `smoothing`, else (until 4.0, with a console warning) `hours_to_show` and
// `smoothing_minutes`
export const normalizeTrendConfig = (config: MultiTrendCardConfig, type: string): TrendConfig => {
  if (!config || !Array.isArray(config.entities) || config.entities.length === 0) {
    throw new Error(`${type}: 'entities' must be a non-empty list`);
  }
  const entities = config.entities.map((e, i) => {
    const s = normalizeSeries(e, i, type, `entities[${i}]`);
    if (!s) throw new Error(`${type}: entities[${i}] has no 'entity'`);
    return s;
  });
  const raw = config as unknown as Record<string, unknown>;
  const hours = renamedKey(raw, type, "hours", "hours_to_show", "the-multi-trend-card");
  const smoothing = renamedKey(raw, type, "smoothing", "smoothing_minutes", "the-multi-trend-card");
  const rest = { ...config };
  delete rest.hours_to_show;
  delete rest.smoothing_minutes;
  return {
    layout: "auto",
    show_legend: true,
    x_axis: false,
    y_axis: false,
    ...rest,
    hours: (numOrNull(hours) ?? 0) > 0 ? (numOrNull(hours) as number) : DEFAULT_HOURS,
    smoothing: normalizeSmoothing(smoothing),
    entities,
  };
};
