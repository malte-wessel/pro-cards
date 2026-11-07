// The kinds' own rules (pure): colour and label by value, quiet (a pulse only at the extreme, no
// tint). A card's `rules` replace them as a whole; they are written in one unit (Kind.ruleUnit)
// and their labels are translated.
import type { Rule } from "../entity/config.ts";
import { UNIT_TO_KMH } from "../flow/constants.ts";
import type { StringKey } from "../i18n.ts";
import { RATE_TO_MMH } from "../rain/constants.ts";
import type { Kind, KindRule } from "./types.ts";

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

// the light level in lx: its word and icon, no colour
export const ILLUMINANCE_RULES: readonly KindRule[] = [
  { below: 10, icon: "mdi:brightness-4", labelKey: "kind.light.dark" },
  { below: 200, icon: "mdi:brightness-5", labelKey: "kind.light.dim" },
  { above: 200, icon: "mdi:brightness-7", labelKey: "kind.light.bright" },
];
// five bands of the wind speed in km/h, from calm to a storm (the whole card red)
export const WIND_RULES: readonly KindRule[] = [
  { below: 5, color: "blue-grey", labelKey: "kind.wind.calm" },
  { below: 20, color: "teal", labelKey: "kind.wind.breezy" },
  { below: 35, color: "amber", labelKey: "kind.wind.windy" },
  { below: 50, color: "orange", labelKey: "kind.wind.strong" },
  { above: 50, color: "red", labelKey: "kind.wind.stormy", tintCard: true },
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
  tintCard: !!r.tintCard,
  style: null,
  pulse: !!r.pulse,
  ...(r.labelKey ? { labelKey: r.labelKey } : {}),
});

// a kind's rules as a card writes them, to copy and change: the labels as `status` in the user's
// language, the thresholds from the kind's unit into the sensor's (a card's own rules read the
// value as it is: 5 km/h is 1.39 m/s), rounded to three figures; a unit not known stays as it is
export const writtenRules = (
  kind: Kind,
  label: (key: StringKey) => string,
  unit: string | null | undefined,
): Record<string, unknown>[] => {
  const from = kind.ruleUnit;
  const u = (unit ?? "").trim().toLowerCase();
  const into = (v: number): number => {
    if (!from || !u || u === from) return v;
    let out: number;
    if (from === "km/h" && (u === "beaufort" || u === "bft"))
      out = Math.pow(v / 3.6 / 0.836, 2 / 3);
    else {
      const factor = (from === "km/h" ? UNIT_TO_KMH : RATE_TO_MMH)[u];
      if (!factor) return v;
      out = v / factor;
    }
    return Number(out.toPrecision(3));
  };
  return (kind.rules ?? []).map((r) => {
    const o: Record<string, unknown> = {};
    if (r.state !== undefined) o.state = r.state;
    if (r.above !== undefined) o.above = into(r.above);
    if (r.below !== undefined) o.below = into(r.below);
    if (r.color) o.color = r.color;
    if (r.icon) o.icon = r.icon;
    if (r.labelKey) o.status = label(r.labelKey);
    if (r.tintCard) o.tint_card = true;
    if (r.pulse) o.pulse = true;
    return o;
  });
};
