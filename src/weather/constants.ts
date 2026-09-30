// Constants of the weather card.
import type { StringKey } from "../shared/i18n.ts";

export const CARD_TYPE = "weather-card";

export const SECTION_TYPES = [
  "hero",
  "row",
  "list",
  "table",
  "grid",
  "column",
  "forecast",
  "trend",
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];
export const GROUP_TYPES = ["row", "list", "table", "grid", "column"] as const;
export type GroupType = (typeof GROUP_TYPES)[number];
export const FORECAST_MODES = ["hourly", "daily"] as const;
export type ForecastMode = (typeof FORECAST_MODES)[number];
export const FORECAST_LAYOUTS = ["vertical", "horizontal"] as const;
export type ForecastLayout = (typeof FORECAST_LAYOUTS)[number];
// the quantities of a trend section (the lines) and the rain figures of a forecast section
export const QUANTITIES = ["temperature", "precipitation", "probability", "wind"] as const;
export type Quantity = (typeof QUANTITIES)[number];
export const RAIN_FIGURES = ["probability", "precipitation"] as const;
export type RainFigure = (typeof RAIN_FIGURES)[number];

// weather entity `supported_features` bits
export const WEATHER_FEATURE = { daily: 1, hourly: 2, twice_daily: 4 } as const;

export const DEFAULTS = {
  hours: 12,
  maxHours: 48,
  days: 7,
  maxDays: 10,
  forecastLayout: "vertical",
  trendShow: ["temperature", "precipitation"],
  rainFigures: ["probability"],
} as const;

// the weather entity attributes an `attributes` entry may name: icon, unit (or the attribute
// holding it) and the translated name
export interface AttrDef {
  icon: string;
  nameKey: StringKey;
  unit?: string;
  unitAttr?: string;
  decimals?: number;
}
export const ATTRIBUTES: Record<string, AttrDef> = {
  humidity: { icon: "mdi:water-percent", nameKey: "weather.attr.humidity", unit: "%", decimals: 0 },
  pressure: { icon: "mdi:gauge", nameKey: "weather.attr.pressure" },
  wind_speed: { icon: "mdi:weather-windy", nameKey: "weather.attr.wind_speed" },
  wind_gust_speed: {
    icon: "mdi:weather-windy-variant",
    nameKey: "weather.attr.wind_gust_speed",
    unitAttr: "wind_speed_unit",
  },
  wind_bearing: {
    icon: "mdi:compass-outline",
    nameKey: "weather.attr.wind_bearing",
    unit: "°",
    decimals: 0,
  },
  apparent_temperature: {
    icon: "mdi:thermometer-lines",
    nameKey: "weather.attr.apparent_temperature",
    unitAttr: "temperature_unit",
  },
  dew_point: {
    icon: "mdi:water-thermometer",
    nameKey: "weather.attr.dew_point",
    unitAttr: "temperature_unit",
  },
  uv_index: { icon: "mdi:sun-wireless", nameKey: "weather.attr.uv_index", unit: "", decimals: 1 },
  cloud_coverage: {
    icon: "mdi:cloud-percent",
    nameKey: "weather.attr.cloud_coverage",
    unit: "%",
    decimals: 0,
  },
  visibility: { icon: "mdi:eye", nameKey: "weather.attr.visibility" },
  ozone: { icon: "mdi:molecule", nameKey: "weather.attr.ozone", unit: "DU" },
};

export const TREND_LAYOUTS = ["auto", "overlay", "lanes"] as const;
export type TrendLayoutOption = (typeof TREND_LAYOUTS)[number];
// default colours of the forecast quantities (temperature takes its rule colour)
export const QUANTITY_COLOR: Record<Quantity, string> = {
  temperature: "primary",
  precipitation: "blue",
  probability: "cyan",
  wind: "grey",
};
export const RANGE_BAR_H = 8;
export const DAY_COLUMN_H = 72;
