// Constants of the weather card.

export const CARD_TYPE = "weather-card-pro";

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

export const DEFAULTS = {
  hours: 12,
  maxHours: 48,
  days: 7,
  maxDays: 10,
  forecastLayout: "vertical",
  tileIconSize: 36,
  heroIconSize: 56,
  posterIconSize: 40,
  // the poster's curve: the next hours of the hourly forecast's temperature
  posterHours: 12,
  forecastIconSize: 22,
  trendShow: ["temperature", "precipitation"],
  rainFigures: ["probability"],
} as const;

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
