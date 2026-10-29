// Constants of a weather entity (the weather card, the poster's weather kind).
import type { StringKey } from "../i18n.ts";

// weather entity `supported_features` bits
export const WEATHER_FEATURE = { daily: 1, hourly: 2, twice_daily: 4 } as const;

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
