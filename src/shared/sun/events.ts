// The sun's events (pure): their names, the next sunrise or sunset, and how a time is written
// (the sun path card, the poster's sun kind).
import type { HomeAssistant } from "../ha.ts";
import { fmtTime } from "../format.ts";
import { t } from "../i18n.ts";
import type { SolarDay } from "../solar.ts";

export const SUN_EVENTS = ["sunrise", "sunset", "dawn", "noon", "dusk"] as const;
export type SunEvent = (typeof SUN_EVENTS)[number];
export type SunLabels = Record<SunEvent, string>;
// the default label of an event in the user's language
export const defaultLabel = (hass: HomeAssistant | null | undefined, key: SunEvent) =>
  t(hass, `sun.label.${key}`);

// an event's time, a dash when the day has none (a polar day or night)
export const fmtEvent = (hass: HomeAssistant | undefined, t: number | null | undefined) =>
  t == null ? "–" : fmtTime(hass, t);

// the next sunrise or sunset after `t`: the day's, else the next day's sunrise; a polar day or
// night has neither, then the poster names the solar noon to come (the next day's once it passed)
export const nextEvent = (
  day: SolarDay,
  nextDay: () => SolarDay,
  t: number,
): { key: SunEvent; t: number } => {
  if (day.sunrise !== null && day.sunrise > t) return { key: "sunrise", t: day.sunrise };
  if (day.sunset !== null && day.sunset > t) return { key: "sunset", t: day.sunset };
  const next = nextDay();
  if (next.sunrise !== null) return { key: "sunrise", t: next.sunrise };
  return { key: "noon", t: day.noon > t ? day.noon : next.noon };
};
