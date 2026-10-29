// Every kind by name (the list is fixed for a major version: a kind added later changes how
// existing cards of its domain look, unasked).
import { AQI_RULES, CO2_RULES, PM10_RULES, PM25_RULES } from "./rules.ts";
import { APPLIANCE, BATTERY, CAR, GRID, SOLAR } from "./energy.ts";
import { COVER, LAWN_MOWER, MEDIA, VACUUM } from "./devices.ts";
import { ALARM, CLIMATE, FAN, LIGHT, LOCK, PERSON } from "./domains.ts";
import { RAIN } from "./rain.ts";
import { SUN } from "./sun.ts";
import { TREND } from "./trend.ts";
import type { Kind, KindRule } from "./types.ts";
import { WEATHER } from "./weather.ts";
import { WIND } from "./wind.ts";

// a kind that only brings its rules, detected by its device class (a number of that class)
const ruleKind = (name: string, rules: readonly KindRule[], unit: string): Kind => ({
  name,
  deviceClasses: [name],
  reads: "any",
  readsText: `a ${name} sensor (${unit})`,
  keys: [],
  rules,
});

export const KINDS: Record<string, Kind> = {
  entity: { name: "entity", reads: "any", readsText: "any entity", keys: [] },
  battery: BATTERY,
  carbon_dioxide: ruleKind("carbon_dioxide", CO2_RULES, "ppm"),
  pm25: ruleKind("pm25", PM25_RULES, "µg/m³"),
  pm10: ruleKind("pm10", PM10_RULES, "µg/m³"),
  aqi: ruleKind("aqi", AQI_RULES, "index"),
  weather: WEATHER,
  sun: SUN,
  wind: WIND,
  rain: RAIN,
  trend: TREND,
  light: LIGHT,
  fan: FAN,
  climate: CLIMATE,
  lock: LOCK,
  alarm_control_panel: ALARM,
  person: PERSON,
  media_player: MEDIA,
  cover: COVER,
  vacuum: VACUUM,
  lawn_mower: LAWN_MOWER,
  grid: GRID,
  solar: SOLAR,
  car: CAR,
  appliance: APPLIANCE,
};

export const KIND_NAMES = Object.keys(KINDS);
