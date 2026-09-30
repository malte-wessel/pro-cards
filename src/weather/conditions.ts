// Weather conditions (pure): Home Assistant's condition states, their icons and names.
import type { HomeAssistant } from "../shared/ha.ts";
import { t, type StringKey } from "../shared/i18n.ts";

export const CONDITIONS = [
  "clear-night",
  "cloudy",
  "exceptional",
  "fog",
  "hail",
  "lightning",
  "lightning-rainy",
  "partlycloudy",
  "pouring",
  "rainy",
  "snowy",
  "snowy-rainy",
  "sunny",
  "windy",
  "windy-variant",
] as const;
export type Condition = (typeof CONDITIONS)[number];

const ICONS: Record<Condition, string> = {
  "clear-night": "mdi:weather-night",
  cloudy: "mdi:weather-cloudy",
  exceptional: "mdi:alert-circle-outline",
  fog: "mdi:weather-fog",
  hail: "mdi:weather-hail",
  lightning: "mdi:weather-lightning",
  "lightning-rainy": "mdi:weather-lightning-rainy",
  partlycloudy: "mdi:weather-partly-cloudy",
  pouring: "mdi:weather-pouring",
  rainy: "mdi:weather-rainy",
  snowy: "mdi:weather-snowy",
  "snowy-rainy": "mdi:weather-snowy-rainy",
  sunny: "mdi:weather-sunny",
  windy: "mdi:weather-windy",
  "windy-variant": "mdi:weather-windy-variant",
};

export const isCondition = (c: unknown): c is Condition =>
  typeof c === "string" && (CONDITIONS as readonly string[]).includes(c);

// the mdi icon of a condition; sunny / partly cloudy get their night variant after sunset
export const conditionIcon = (c: unknown, night = false): string => {
  if (!isCondition(c)) return "mdi:help-circle-outline";
  if (night && c === "sunny") return "mdi:weather-night";
  if (night && c === "partlycloudy") return "mdi:weather-night-partly-cloudy";
  return ICONS[c];
};

export const conditionKey = (c: unknown): StringKey | null =>
  isCondition(c) ? (`weather.condition.${c}` as StringKey) : null;

// the condition in the user's language; anything unknown shows as written
export const conditionText = (hass: HomeAssistant | undefined, c: unknown): string => {
  const key = conditionKey(c);
  return key ? t(hass, key) : c == null ? "" : String(c);
};

// night when the sun entity says so (the weather entity has no notion of day / night)
export const isNight = (hass: HomeAssistant | undefined): boolean =>
  hass?.states["sun.sun"]?.state === "below_horizon";
