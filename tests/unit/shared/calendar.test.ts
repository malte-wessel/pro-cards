import { describe, expect, it } from "vitest";
import {
  daysRange,
  fmtDays,
  fmtRange,
  kindOf,
  kindOfRange,
  periodRange,
  rangeAt,
  zonedMidnight,
  zonedParts,
} from "../../../src/shared/calendar.ts";

const BERLIN = "Europe/Berlin";
const at = (iso: string) => new Date(iso).getTime();
const iso = (t: number) => new Date(t).toISOString();
const HOUR = 3600e3;

describe("calendar: days in a time zone", () => {
  it("finds a day's first instant, whatever the zone", () => {
    expect(iso(zonedMidnight(2026, 6, 21, BERLIN))).toBe("2026-06-20T22:00:00.000Z");
    expect(iso(zonedMidnight(2026, 1, 15, BERLIN))).toBe("2026-01-14T23:00:00.000Z");
    expect(iso(zonedMidnight(2026, 6, 21, "America/New_York"))).toBe("2026-06-21T04:00:00.000Z");
    expect(iso(zonedMidnight(2026, 6, 21, "UTC"))).toBe("2026-06-21T00:00:00.000Z");
  });

  it("lets days and months overflow into the next or the previous", () => {
    expect(zonedMidnight(2026, 6, 31, BERLIN)).toBe(zonedMidnight(2026, 7, 1, BERLIN));
    expect(zonedMidnight(2026, 1, 0, BERLIN)).toBe(zonedMidnight(2025, 12, 31, BERLIN));
    expect(zonedMidnight(2026, 13, 1, BERLIN)).toBe(zonedMidnight(2027, 1, 1, BERLIN));
  });

  it("gives the days of a clock change their 23 and 25 hours", () => {
    const spring = zonedMidnight(2026, 3, 29, BERLIN),
      autumn = zonedMidnight(2026, 10, 25, BERLIN);
    expect(zonedMidnight(2026, 3, 30, BERLIN) - spring).toBe(23 * HOUR);
    expect(zonedMidnight(2026, 10, 26, BERLIN) - autumn).toBe(25 * HOUR);
  });

  it("starts a day whose midnight the clock skips where the clock lands", () => {
    // Santiago moves its clocks from 00:00 to 01:00 on the first Sunday of September
    const t = zonedMidnight(2026, 9, 6, "America/Santiago");
    expect(zonedParts(t, "America/Santiago")).toMatchObject({ d: 6, h: 1, mi: 0 });
    expect(zonedParts(t - 1, "America/Santiago").d).toBe(5);
  });

  it("reads the wall clock with Monday as the first weekday", () => {
    // 21 June 2026 is a Sunday
    expect(zonedParts(at("2026-06-21T10:00:00Z"), BERLIN)).toMatchObject({
      y: 2026,
      m: 6,
      d: 21,
      h: 12,
      wd: 6,
    });
  });
});

describe("calendar: periods", () => {
  const now = at("2026-06-21T10:00:00Z"); // Sunday, 12:00 in Berlin

  it("finds the day, week, month and year that hold an instant", () => {
    const day = rangeAt("day", now, now, BERLIN),
      week = rangeAt("week", now, now, BERLIN),
      month = rangeAt("month", now, now, BERLIN),
      year = rangeAt("year", now, now, BERLIN);
    expect([day.start, day.end]).toEqual([
      zonedMidnight(2026, 6, 21, BERLIN),
      zonedMidnight(2026, 6, 22, BERLIN),
    ]);
    // the week runs Monday to Sunday
    expect([week.start, week.end]).toEqual([
      zonedMidnight(2026, 6, 15, BERLIN),
      zonedMidnight(2026, 6, 22, BERLIN),
    ]);
    expect([month.start, month.end]).toEqual([
      zonedMidnight(2026, 6, 1, BERLIN),
      zonedMidnight(2026, 7, 1, BERLIN),
    ]);
    expect([year.start, year.end]).toEqual([
      zonedMidnight(2026, 1, 1, BERLIN),
      zonedMidnight(2027, 1, 1, BERLIN),
    ]);
    // the statistics' buckets: hours for a day, days for a week or month, months for a year
    expect([day, week, month, year].map((r) => r.granularity)).toEqual([
      "hour",
      "day",
      "day",
      "month",
    ]);
  });

  it("calls a running period open until its end, a past one closed for good", () => {
    const today = rangeAt("day", now, now, BERLIN);
    expect(today).toMatchObject({ open: true, next: today.end });
    const before = rangeAt("day", today.start - 1, now, BERLIN);
    expect(before).toMatchObject({ open: false, next: Infinity });
    // a new period is a new key; the same period is the same key
    expect(before.key).not.toBe(today.key);
    expect(rangeAt("day", now + HOUR, now, BERLIN).key).toBe(today.key);
  });

  it("reads the configured periods, yesterday turning with today", () => {
    expect(kindOf("today")).toBe("day");
    expect(kindOf("yesterday")).toBe("day");
    expect(kindOf("month")).toBe("month");
    const y = periodRange("yesterday", now, BERLIN);
    expect([y.start, y.end, y.open]).toEqual([
      zonedMidnight(2026, 6, 20, BERLIN),
      zonedMidnight(2026, 6, 21, BERLIN),
      false,
    ]);
    expect(y.next).toBe(zonedMidnight(2026, 6, 22, BERLIN));
    expect(periodRange("week", now, BERLIN).key).toBe(rangeAt("week", now, now, BERLIN).key);
  });

  it("takes any range of days, hourly for a day or two and daily beyond", () => {
    const start = zonedMidnight(2026, 6, 6, BERLIN);
    expect(daysRange(start, zonedMidnight(2026, 6, 8, BERLIN), now, BERLIN)).toMatchObject({
      open: false,
      granularity: "hour",
    });
    const long = daysRange(start, zonedMidnight(2026, 6, 22, BERLIN), now, BERLIN);
    expect(long).toMatchObject({ open: true, granularity: "day" });
  });

  it("knows a range that is exactly a day, a week, a month or a year", () => {
    const mid = (m: number, d: number) => zonedMidnight(2026, m, d, BERLIN);
    expect(kindOfRange(mid(6, 9), mid(6, 10), now, BERLIN)).toBe("day");
    expect(kindOfRange(mid(6, 8), mid(6, 15), now, BERLIN)).toBe("week");
    expect(kindOfRange(mid(5, 1), mid(6, 1), now, BERLIN)).toBe("month");
    expect(kindOfRange(mid(1, 1), zonedMidnight(2027, 1, 1, BERLIN), now, BERLIN)).toBe("year");
    // seven days from a Tuesday are no week
    expect(kindOfRange(mid(6, 9), mid(6, 16), now, BERLIN)).toBeNull();
    expect(kindOfRange(mid(6, 6), mid(6, 11), now, BERLIN)).toBeNull();
  });
});

describe("calendar: labels", () => {
  const now = at("2026-10-25T10:00:00Z");
  // the engines differ in the spaces around a range's dash (thin, plain or none)
  const dash = (s: string) => s.replace(/\s*–\s*/, " – ").replace(/[\u2009\u202f\u00a0]/g, " ");
  const mid = (y: number, m: number, d: number) => zonedMidnight(y, m, d, BERLIN);

  it("names a past period by its dates", () => {
    const r = (kind: "day" | "week" | "month" | "year", y: number, m: number, d: number) =>
      dash(fmtRange(kind, rangeAt(kind, mid(y, m, d), now, BERLIN), BERLIN, "en-GB"));
    expect(r("day", 2026, 10, 23)).toBe("Fri 23 Oct");
    expect(r("week", 2026, 10, 14)).toBe("12 – 18 Oct");
    expect(r("month", 2026, 9, 10)).toBe("September 2026");
    expect(r("year", 2025, 5, 1)).toBe("2025");
    expect(fmtRange("month", rangeAt("month", mid(2026, 3, 1), now, BERLIN), BERLIN, "de")).toBe(
      "März 2026",
    );
  });

  it("names a range of days, with the years when they are not this one", () => {
    const days = (a: number, b: number) => dash(fmtDays(a, b, now, BERLIN, "en-GB"));
    expect(days(mid(2026, 10, 6), mid(2026, 10, 11))).toBe("6 – 10 Oct");
    expect(days(mid(2026, 9, 28), mid(2026, 10, 4))).toBe("28 Sept – 3 Oct");
    expect(days(mid(2025, 12, 20), mid(2026, 1, 7))).toBe("20 Dec 2025 – 6 Jan 2026");
  });
});
