// Constants of the weather card.
import type { StringKey } from "../shared/i18n.ts";

export const CARD_TYPE = "weather-card";

export const LAYOUTS = ["tile", "hero"] as const;
export type WeatherLayout = (typeof LAYOUTS)[number];
export const ATTRIBUTE_LAYOUTS = ["row", "list"] as const;
export type AttributeLayout = (typeof ATTRIBUTE_LAYOUTS)[number];
export const HOURLY_VISUALS = ["chart", "sparkline", "columns"] as const;
export type HourlyVisual = (typeof HOURLY_VISUALS)[number];
export const HOURLY_SHOW = ["temperature", "precipitation", "probability", "wind"] as const;
export type HourlyShow = (typeof HOURLY_SHOW)[number];
export const DAILY_LAYOUTS = ["list", "columns", "chart"] as const;
export type DailyLayout = (typeof DAILY_LAYOUTS)[number];
export const DAILY_SHOW = ["probability", "precipitation"] as const;
export type DailyShow = (typeof DAILY_SHOW)[number];
export const SECTION_TYPES = ["hourly", "daily", "entities"] as const;

// weather entity `supported_features` bits
export const WEATHER_FEATURE = { daily: 1, hourly: 2, twice_daily: 4 } as const;

export const DEFAULTS = {
  hours: 12,
  maxHours: 48,
  bucketMin: 60,
  days: 7,
  maxDays: 10,
  hourlyVisual: "chart",
  hourlyShow: ["temperature", "precipitation"],
  dailyLayout: "list",
  dailyShow: ["probability"],
  attributesLayout: "row",
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

// chart geometry (px)
export const LANE_H: Record<HourlyShow, number> = {
  temperature: 72,
  precipitation: 40,
  probability: 40,
  wind: 40,
};
export const DAILY_CHART_H = 96;
export const X_AXIS_H = 16;
export const RANGE_BAR_H = 8;
export const DAY_COLUMN_H = 72;
