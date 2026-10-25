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

// the kinds of period a viewer steps through (the card's picker)
export const PERIOD_KINDS = ["day", "week", "month", "year"] as const;
export type PeriodKind = (typeof PERIOD_KINDS)[number];
export const kindOf = (p: CalendarPeriod): PeriodKind =>
  p === "today" || p === "yesterday" ? "day" : p;

// The period of a kind that holds the instant `t`: open while it runs at `now`. A period that
// runs turns at its end; one in the past never does (`next` stays far away).
export const rangeAt = (kind: PeriodKind, t: number, now: number, tz: string): PeriodRange => {
  const { y, m, d, wd } = zonedParts(t, tz);
  const mid = (yy: number, mm: number, dd: number) => zonedMidnight(yy, mm, dd, tz);
  const [start, end] =
    kind === "week"
      ? [mid(y, m, d - wd), mid(y, m, d - wd + 7)]
      : kind === "month"
        ? [mid(y, m, 1), mid(y, m + 1, 1)]
        : kind === "year"
          ? [mid(y, 1, 1), mid(y + 1, 1, 1)]
          : [mid(y, m, d), mid(y, m, d + 1)];
  const open = end > now;
  return {
    key: `${kind}:${start}:${tz}`,
    start,
    end,
    open,
    next: open ? end : Infinity,
    granularity: kind === "year" ? "month" : kind === "day" ? "hour" : "day",
  };
};

// the period a config names, at `now`: yesterday turns with today
export const periodRange = (period: CalendarPeriod, now: number, tz: string): PeriodRange => {
  if (period !== "yesterday") return rangeAt(kindOf(period), now, now, tz);
  const today = rangeAt("day", now, now, tz);
  return { ...rangeAt("day", today.start - 1, now, tz), next: today.end };
};

// A range of whole days: from the first instant of its first day to the first instant after its
// last (a day of a clock change has 23 or 25 hours); hourly buckets for a day or two, daily beyond
export const daysRange = (start: number, end: number, now: number, tz: string): PeriodRange => {
  const open = end > now;
  return {
    key: `range:${start}:${end}:${tz}`,
    start,
    end,
    open,
    next: open ? end : Infinity,
    granularity: end - start <= 2.1 * 86400e3 ? "hour" : "day",
  };
};
// the kind of period a range of days is exactly (a day, a week from Monday, a month, a year)
export const kindOfRange = (
  start: number,
  end: number,
  now: number,
  tz: string,
): PeriodKind | null =>
  PERIOD_KINDS.find((k) => {
    const r = rangeAt(k, start, now, tz);
    return r.start === start && r.end === end;
  }) ?? null;

const labels = new Map<string, Intl.DateTimeFormat>();
const labelFormat = (lang: string, tz: string, opts: Intl.DateTimeFormatOptions) => {
  const key = `${lang}|${tz}|${JSON.stringify(opts)}`;
  let fmt = labels.get(key);
  if (!fmt) {
    try {
      fmt = new Intl.DateTimeFormat(lang, { ...opts, timeZone: tz });
    } catch {
      fmt = new Intl.DateTimeFormat(undefined, opts);
    }
    labels.set(key, fmt);
  }
  return fmt;
};
// A period by its dates, in the language and zone: "Thu, 22 Oct", "19 – 25 Oct", "March 2026",
// "2025"
export const fmtRange = (kind: PeriodKind, r: PeriodRange, tz: string, lang: string): string => {
  if (kind === "year") return labelFormat(lang, tz, { year: "numeric" }).format(r.start);
  if (kind === "month")
    return labelFormat(lang, tz, { month: "long", year: "numeric" }).format(r.start);
  if (kind === "day")
    return labelFormat(lang, tz, { weekday: "short", day: "numeric", month: "short" }).format(
      r.start,
    );
  const fmt = labelFormat(lang, tz, { day: "numeric", month: "short" });
  const last = r.end - 1;
  return typeof fmt.formatRange === "function"
    ? fmt.formatRange(r.start, last)
    : `${fmt.format(r.start)} – ${fmt.format(last)}`;
};
// A range of days by its first and last day: "6 – 10 Oct", "28 Sept – 3 Oct", with the years
// when they are not this one
export const fmtDays = (start: number, end: number, now: number, tz: string, lang: string) => {
  const year = zonedParts(now, tz).y;
  const last = end - 1;
  const other = zonedParts(start, tz).y !== year || zonedParts(last, tz).y !== year;
  const fmt = labelFormat(lang, tz, {
    day: "numeric",
    month: "short",
    ...(other ? { year: "numeric" } : {}),
  });
  return typeof fmt.formatRange === "function"
    ? fmt.formatRange(start, last)
    : `${fmt.format(start)} – ${fmt.format(last)}`;
};
