// Calendar periods in a time zone (pure): today, yesterday, this week (from Monday), this month and
// this year, as the instants they start and end at. A day starts at its first instant, so a day
// of a clock change has 23 or 25 hours; the zone is the one `timeZoneOf` reads (the profile's).
export const PERIODS = ["today", "yesterday", "week", "month", "year"] as const;
export type CalendarPeriod = (typeof PERIODS)[number];

export interface PeriodRange {
  key: string; // the period, its start and its zone: a new key is a new period
  start: number; // ms
  end: number; // ms, exclusive
  open: boolean; // the period runs now (its end is in the future)
  next: number; // when the period this config shows changes
  // the statistics' buckets for the period (what Home Assistant's energy panel asks for)
  granularity: "hour" | "day" | "month";
}

const formats = new Map<string, Intl.DateTimeFormat>();
const formatOf = (tz: string) => {
  let fmt = formats.get(tz);
  if (!fmt) {
    const opts: Intl.DateTimeFormatOptions = {
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      weekday: "short",
    };
    try {
      fmt = new Intl.DateTimeFormat("en-US", { ...opts, timeZone: tz });
    } catch {
      fmt = new Intl.DateTimeFormat("en-US", opts); // an unknown zone: the browser's
    }
    formats.set(tz, fmt);
  }
  return fmt;
};
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// the wall clock of an instant in a zone; `wd`: 0 = Monday
export const zonedParts = (t: number, tz: string) => {
  const p = Object.fromEntries(
    formatOf(tz)
      .formatToParts(new Date(t))
      .map((x) => [x.type, x.value]),
  );
  return {
    y: Number(p.year),
    m: Number(p.month),
    d: Number(p.day),
    h: Number(p.hour),
    mi: Number(p.minute),
    s: Number(p.second),
    wd: WEEKDAYS.indexOf(String(p.weekday)),
  };
};

// how far the zone's wall clock is ahead of UTC at an instant (ms)
const offsetAt = (t: number, tz: string) => {
  const p = zonedParts(t, tz);
  const whole = Math.floor(t / 1000) * 1000;
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - whole;
};

// The first instant of a day in a zone. `m` and `d` may overflow (d = 0 is the last day of the
// month before, m = 13 January of the next year). A day whose midnight the clock skips starts
// where the clock lands.
export const zonedMidnight = (y: number, m: number, d: number, tz: string): number => {
  const g = Date.UTC(y, m - 1, d);
  let t = g - offsetAt(g, tz);
  t = g - offsetAt(t, tz);
  const p = zonedParts(t, tz);
  const want = new Date(g);
  // landed on the evening before (the clock jumps over midnight): on to the day's first instant
  if (p.d !== want.getUTCDate()) t += ((24 - p.h) * 3600 - p.mi * 60 - p.s) * 1000;
  return t;
};

export const periodRange = (period: CalendarPeriod, now: number, tz: string): PeriodRange => {
  const { y, m, d, wd } = zonedParts(now, tz);
  const mid = (yy: number, mm: number, dd: number) => zonedMidnight(yy, mm, dd, tz);
  const range = (
    start: number,
    end: number,
    granularity: PeriodRange["granularity"],
    next = end,
  ): PeriodRange => ({
    key: `${period}:${start}:${tz}`,
    start,
    end,
    open: end > now,
    next,
    granularity,
  });
  switch (period) {
    case "yesterday":
      return range(mid(y, m, d - 1), mid(y, m, d), "hour", mid(y, m, d + 1));
    case "week":
      return range(mid(y, m, d - wd), mid(y, m, d - wd + 7), "day");
    case "month":
      return range(mid(y, m, 1), mid(y, m + 1, 1), "day");
    case "year":
      return range(mid(y, 1, 1), mid(y + 1, 1, 1), "month");
    default:
      return range(mid(y, m, d), mid(y, m, d + 1), "hour");
  }
};
