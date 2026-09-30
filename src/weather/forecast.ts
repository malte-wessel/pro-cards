// Forecast helpers (pure): feature checks, windows, series for the plots and per-day summaries.
import type { ForecastEntry, HassEntity, WeatherForecastType } from "../shared/ha.ts";
import type { Point } from "../shared/history.ts";
import { WEATHER_FEATURE } from "./constants.ts";

export const supportsForecast = (st: HassEntity | undefined, type: WeatherForecastType) =>
  ((Number(st?.attributes?.supported_features) || 0) & WEATHER_FEATURE[type]) !== 0;

// the forecast type a daily section subscribes to: daily, else twice daily collapsed to days
export const dailyTypeOf = (st: HassEntity | undefined): "daily" | "twice_daily" | null =>
  supportsForecast(st, "daily")
    ? "daily"
    : supportsForecast(st, "twice_daily")
      ? "twice_daily"
      : null;

export const timeOf = (e: ForecastEntry) => new Date(e.datetime).getTime();
export const hourStart = (t: number) => t - (t % 3600e3);
// the hourly window: from the start of the current hour, `hours` ahead
export const hourlyWindow = (now: number, hours: number) => {
  const t0 = hourStart(now);
  return { t0, t1: t0 + hours * 3600e3 };
};

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v)
    ? v
    : typeof v === "string" && v !== "" && Number.isFinite(Number(v))
      ? Number(v)
      : null;

// one numeric key of the forecast as a series the entity plots can draw
export const forecastPoints = (
  fc: readonly ForecastEntry[] | null | undefined,
  key: keyof ForecastEntry,
): Point[] => {
  if (!fc) return [];
  const out: Point[] = [];
  for (const e of fc) {
    const t = timeOf(e),
      v = num(e[key]);
    if (!Number.isFinite(t) || v === null) continue;
    out.push({ t, v, s: String(v) });
  }
  return out.sort((a, b) => a.t - b.t);
};

// the hourly entries inside [t0, t1)
export const hoursIn = (fc: readonly ForecastEntry[] | null | undefined, t0: number, t1: number) =>
  (fc || [])
    .filter((e) => {
      const t = timeOf(e);
      return t >= t0 && t < t1;
    })
    .sort((a, b) => timeOf(a) - timeOf(b));

export interface Day {
  t: number;
  condition: string | null;
  hi: number | null;
  lo: number | null;
  precipitation: number | null;
  probability: number | null;
  wind: number | null;
}

const dayOf = (e: ForecastEntry): Day => ({
  t: timeOf(e),
  condition: e.condition ?? null,
  hi: num(e.temperature),
  lo: num(e.templow),
  precipitation: num(e.precipitation),
  probability: num(e.precipitation_probability),
  wind: num(e.wind_speed),
});

// the days of a daily forecast; a twice-daily forecast is collapsed per local date (high from
// the day entry, low from the night entry, rain summed, probability the maximum)
export const daysOf = (
  fc: readonly ForecastEntry[] | null | undefined,
  type: "daily" | "twice_daily",
  n: number,
): Day[] => {
  if (!fc) return [];
  const sorted = [...fc].sort((a, b) => timeOf(a) - timeOf(b));
  if (type === "daily") return sorted.map(dayOf).slice(0, n);
  const days = new Map<string, Day>();
  for (const e of sorted) {
    const d = dayOf(e);
    const key = new Date(d.t).toDateString();
    const cur = days.get(key);
    const day = e.is_daytime !== false;
    if (!cur) {
      days.set(key, {
        ...d,
        hi: day ? d.hi : null,
        lo: day ? d.lo : (d.lo ?? d.hi),
      });
      continue;
    }
    if (day) {
      cur.hi = cur.hi === null ? d.hi : Math.max(cur.hi, d.hi ?? cur.hi);
      // the day entry's condition describes the day; a night-first day keeps the night's until then
      cur.condition = d.condition ?? cur.condition;
    } else {
      const lo = d.lo ?? d.hi;
      cur.lo = cur.lo === null ? lo : lo === null ? cur.lo : Math.min(cur.lo, lo);
    }
    if (d.precipitation !== null) cur.precipitation = (cur.precipitation ?? 0) + d.precipitation;
    if (d.probability !== null) cur.probability = Math.max(cur.probability ?? 0, d.probability);
    if (d.wind !== null) cur.wind = Math.max(cur.wind ?? 0, d.wind);
  }
  return [...days.values()].map((d) => ({ ...d, hi: d.hi ?? d.lo, lo: d.lo ?? d.hi })).slice(0, n);
};

// the temperature span the daily bars share
export const dailyRange = (days: readonly Day[]): { min: number; max: number } | null => {
  let min = Infinity,
    max = -Infinity;
  for (const d of days) {
    if (d.lo !== null) min = Math.min(min, d.lo);
    if (d.hi !== null) max = Math.max(max, d.hi);
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  if (max - min < 1) max = min + 1;
  return { min, max };
};

export const isToday = (t: number, now: number) =>
  new Date(t).toDateString() === new Date(now).toDateString();
