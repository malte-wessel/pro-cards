// A schedule's week: Home Assistant's shape and back, where the week stands, the block that runs,
// the next change across days and the week's turn, and the windows a lane draws.
import { describe, expect, it } from "vitest";
import {
  aheadWindow,
  clockOf,
  currentBlock,
  dayWindow,
  nextChange,
  parseClock,
  parseWeek,
  rotate,
  sameWeek,
  toHaWeek,
  unrotate,
  weekPos,
  type Week,
} from "../../../../src/shared/schedule/model.ts";

const B = (from: string, to: string, data?: Record<string, unknown>) => ({ from, to, data });
const week = (days: Partial<Record<string, ReturnType<typeof B>[]>>): Week => parseWeek(days);

describe("a schedule's times", () => {
  it("reads Home Assistant's clock times, the end of the day too", () => {
    expect(parseClock("06:30:00")).toBe(390);
    expect(parseClock("06:30")).toBe(390);
    expect(parseClock("24:00:00")).toBe(1440);
    // (Home Assistant's answer for the end of the day)
    expect(parseClock("23:59:59.999999")).toBe(1440);
    expect(parseClock("23:59:00")).toBe(1439);
    expect(parseClock("25:00:00")).toBeNull();
    expect(parseClock("noon")).toBeNull();
    expect(clockOf(390)).toBe("06:30:00");
    expect(clockOf(1440)).toBe("24:00:00");
  });

  it("reads a week, sorted, without blocks it cannot read, and writes it back", () => {
    const w = week({
      monday: [B("17:00:00", "22:30:00"), B("06:00:00", "08:30:00", { temperature: 21 })],
      tuesday: [B("08:00:00", "07:00:00"), B("x", "09:00:00")],
    });
    expect(w[0].map((b) => [b.from, b.to])).toEqual([
      [360, 510],
      [1020, 1350],
    ]);
    expect(w[0][0].data).toEqual({ temperature: 21 });
    expect(w[1]).toEqual([]);
    const ha = toHaWeek(w);
    expect(Object.keys(ha)).toHaveLength(7);
    expect(ha.monday).toEqual([
      { from: "06:00:00", to: "08:30:00", data: { temperature: 21 } },
      { from: "17:00:00", to: "22:30:00" },
    ]);
    expect(ha.sunday).toEqual([]);
    expect(sameWeek(parseWeek(ha), w)).toBe(true);
  });

  it("turns the week to start on another day, and back", () => {
    const days = [0, 1, 2, 3, 4, 5, 6];
    expect(rotate(days, 6)).toEqual([6, 0, 1, 2, 3, 4, 5]);
    expect(unrotate(rotate(days, 6), 6)).toEqual(days);
  });

  it("knows the weekday and the minute in a zone", () => {
    // Sunday 21 June 2026, 12:00 in Berlin
    const t = Date.parse("2026-06-21T10:00:00Z");
    expect(weekPos(t, "Europe/Berlin")).toEqual({ day: 6, min: 720 });
    expect(weekPos(t, "America/New_York")).toEqual({ day: 6, min: 360 });
  });
});

describe("where a schedule stands", () => {
  const w = week({
    monday: [B("06:00:00", "08:30:00"), B("17:00:00", "24:00:00")],
    tuesday: [B("00:00:00", "01:00:00")],
    sunday: [B("22:00:00", "24:00:00")],
  });

  it("finds the block that runs", () => {
    expect(currentBlock(w, { day: 0, min: 400 })?.from).toBe(360);
    expect(currentBlock(w, { day: 0, min: 510 })).toBeNull();
  });

  it("finds when it turns off, a block running on past midnight as one", () => {
    expect(nextChange(w, { day: 0, min: 1100 })).toEqual({ on: true, in: 400, day: 1, min: 60 });
  });

  it("finds when it turns on next, across days and the week's turn", () => {
    expect(nextChange(w, { day: 0, min: 600 })).toEqual({ on: false, in: 420, day: 0, min: 1020 });
    expect(nextChange(w, { day: 3, min: 0 })).toMatchObject({ on: false, day: 6, min: 1320 });
    expect(nextChange(w, { day: 6, min: 1380 })).toEqual({ on: true, in: 60, day: 0, min: 0 });
  });

  it("joins Sunday's last block to Monday's first across the week's turn", () => {
    const wrap = week({ monday: [B("00:00:00", "02:00:00")], sunday: [B("23:00:00", "24:00:00")] });
    expect(nextChange(wrap, { day: 6, min: 1400 })).toEqual({
      on: true,
      in: 160,
      day: 0,
      min: 120,
    });
    expect(nextChange(wrap, { day: 0, min: 60 })).toMatchObject({ on: true, day: 0, min: 120 });
  });

  it("changes where a block's data does, though the next block follows at once", () => {
    const two = week({
      monday: [
        B("08:00:00", "13:00:00", { temperature: 21 }),
        B("13:00:00", "22:30:00", { temperature: 18 }),
      ],
    });
    expect(nextChange(two, { day: 0, min: 720 })).toEqual({ on: true, in: 60, day: 0, min: 780 });
    expect(nextChange(two, { day: 0, min: 800 })).toMatchObject({ on: true, min: 1350 });
    // the same data on both sides: one run
    const one = week({
      monday: [
        B("08:00:00", "13:00:00", { temperature: 21 }),
        B("13:00:00", "22:30:00", { temperature: 21 }),
      ],
    });
    expect(nextChange(one, { day: 0, min: 720 })).toMatchObject({ on: true, min: 1350 });
    // and across the week's turn
    const wrap = week({
      monday: [B("00:00:00", "02:00:00", { temperature: 18 })],
      sunday: [B("23:00:00", "24:00:00", { temperature: 21 })],
    });
    expect(nextChange(wrap, { day: 6, min: 1400 })).toMatchObject({ on: true, day: 0, min: 0 });
  });

  it("has no change on a week always on, or never", () => {
    expect(nextChange(week({}), { day: 0, min: 0 })).toBeNull();
    const all = week(
      Object.fromEntries(
        ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((d) => [
          d,
          [B("00:00:00", "24:00:00")],
        ]),
      ),
    );
    expect(nextChange(all, { day: 2, min: 100 })).toBeNull();
  });

  it("places a day's blocks, and those of the next 24 hours across midnight", () => {
    expect(dayWindow(w, 0).map((p) => [p.from, p.to])).toEqual([
      [360, 510],
      [1020, 1440],
    ]);
    const ahead = aheadWindow(w, { day: 0, min: 1200 });
    expect(ahead.map((p) => [p.from, p.to, p.day])).toEqual([
      [0, 240, 0],
      [240, 300, 1],
    ]);
    // from Sunday evening into Monday
    expect(aheadWindow(w, { day: 6, min: 1380 }).map((p) => [p.from, p.to, p.day])).toEqual([
      [0, 60, 6],
      [420, 570, 0],
      [1080, 1440, 0],
    ]);
  });
});
