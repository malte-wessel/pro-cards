// The kinds' own rules (pure): colour and label by value, quiet (a pulse only at the extreme, no
// tint). A card's `rules` replace them as a whole; they are written in one unit (Kind.ruleUnit)
// and their labels are translated.
import type { Rule } from "../entity/config.ts";
import type { KindRule } from "./types.ts";

// the four air quality bands as below / below / below / above
const air = (a: number, b: number, c: number): KindRule[] => [
  { below: a, color: "green", labelKey: "kind.level.good" },
  { below: b, color: "amber", labelKey: "kind.level.fair" },
  { below: c, color: "orange", labelKey: "kind.level.poor" },
  { above: c, color: "red", labelKey: "kind.level.very_poor" },
];

export const BATTERY_RULES: readonly KindRule[] = [
  { below: 10, color: "red", labelKey: "kind.level.critical" },
  { below: 20, color: "orange", labelKey: "kind.level.low" },
];
export const CO2_RULES: readonly KindRule[] = [
  { below: 800, color: "green", labelKey: "kind.level.good" },
  { below: 1200, color: "amber", labelKey: "kind.level.moderate" },
  { below: 2000, color: "orange", labelKey: "kind.level.poor" },
  { above: 2000, color: "red", labelKey: "kind.level.bad" },
];
// WHO / EU bands, µg/m³
export const PM25_RULES: readonly KindRule[] = air(10, 25, 50);
export const PM10_RULES: readonly KindRule[] = air(20, 50, 100);
// the US EPA index
export const AQI_RULES: readonly KindRule[] = [
  { below: 51, color: "green", labelKey: "kind.level.good" },
  { below: 101, color: "amber", labelKey: "kind.level.moderate" },
  { below: 151, color: "orange", labelKey: "kind.level.unhealthy_sensitive" },
  { below: 201, color: "red", labelKey: "kind.level.unhealthy" },
  { below: 301, color: "purple", labelKey: "kind.level.very_unhealthy" },
  { above: 301, color: "deep-purple", labelKey: "kind.level.hazardous", pulse: true },
];

// the Beaufort bands in km/h
export const WIND_RULES: readonly KindRule[] = [
  { below: 2, color: "blue-grey", labelKey: "kind.wind.calm" },
  { below: 12, color: "light-blue", labelKey: "kind.wind.light_breeze" },
  { below: 29, color: "teal", labelKey: "kind.wind.moderate_breeze" },
  { below: 39, color: "green", labelKey: "kind.wind.fresh_breeze" },
  { below: 62, color: "amber", labelKey: "kind.wind.strong" },
  { below: 89, color: "orange", labelKey: "kind.wind.gale" },
  { above: 89, color: "red", labelKey: "kind.wind.storm", pulse: true },
];
// mm/h
export const RAIN_RULES: readonly KindRule[] = [
  { below: 0.1, color: "blue-grey", labelKey: "kind.rain.dry" },
  { below: 2.5, color: "light-blue", labelKey: "kind.rain.light" },
  { below: 7.6, color: "blue", labelKey: "kind.rain.moderate" },
  { below: 50, color: "indigo", labelKey: "kind.rain.heavy" },
  { above: 50, color: "deep-purple", labelKey: "kind.rain.violent", pulse: true },
];
// colours only: the condition is the status (its name, translated)
export const WEATHER_RULES: readonly KindRule[] = (
  [
    ["sunny", "amber"],
    ["clear-night", "indigo"],
    ["partlycloudy", "light-blue"],
    ["cloudy", "blue-grey"],
    ["fog", "grey"],
    ["windy", "teal"],
    ["windy-variant", "teal"],
    ["rainy", "blue"],
    ["pouring", "indigo"],
    ["snowy", "light-blue"],
    ["snowy-rainy", "light-blue"],
    ["hail", "deep-purple"],
    ["lightning", "deep-orange"],
    ["lightning-rainy", "deep-orange"],
  ] as const
)
  .map(([state, color]): KindRule => ({ state, color }))
  .concat([{ state: "exceptional", color: "red", pulse: true }]);
// Home Assistant's state names and colours; a pulse where something needs attention
export const attention = (state: string): readonly KindRule[] => [
  { state, color: "red", pulse: true },
];

// a kind's rule as the entity layer keeps rules
export const toRule = (r: KindRule): Rule => ({
  state: r.state ?? null,
  below: r.below ?? null,
  above: r.above ?? null,
  color: r.color ?? null,
  icon: r.icon ?? null,
  label: null,
  tintCard: false,
  style: null,
  pulse: !!r.pulse,
  ...(r.labelKey ? { labelKey: r.labelKey } : {}),
});
