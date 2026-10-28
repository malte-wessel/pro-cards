// The sun path card's poster: the event it names (pure).
import type { SolarDay } from "../shared/solar.ts";
import type { SunEvent } from "./constants.ts";

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
