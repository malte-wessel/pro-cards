import { describe, it, expect } from "vitest";
import { clockTicks, timeStep } from "../../../src/shared/ticks.ts";

describe("time ticks", () => {
  it("chooses time tick intervals per window", () => {
    const h = 3600e3;
    expect(timeStep(2)).toBe(0.5 * h);
    expect(timeStep(6)).toBe(h);
    expect(timeStep(12)).toBe(2 * h);
    expect(timeStep(24)).toBe(4 * h);
    expect(timeStep(48)).toBe(12 * h);
    expect(timeStep(168)).toBe(24 * h);
  });
  it("snaps ticks to local clock boundaries inside the window", () => {
    const h = 3600e3;
    const t0 = new Date(2026, 8, 28, 16, 39).getTime();
    const now = t0 + 24 * h;
    const ticks = clockTicks(t0, now, 4 * h);
    expect(ticks.length).toBe(6);
    expect(new Date(ticks[0]).getHours()).toBe(20);
    expect(new Date(ticks[0]).getMinutes()).toBe(0);
    expect(ticks.every((t) => t >= t0 && t <= now)).toBe(true);
    expect(ticks.every((t) => new Date(t).getHours() % 4 === 0)).toBe(true);
    // a window that starts on a boundary includes it
    const t1 = new Date(2026, 8, 28, 12, 0).getTime();
    expect(clockTicks(t1, t1 + 2 * h, h)[0]).toBe(t1);
  });
  it("keeps the ticks on clock boundaries across a DST change", () => {
    const h = 3600e3;
    // a week ending after the autumn change (25 Oct 2026, 03:00 → 02:00 in Berlin)
    const now = new Date(2026, 9, 28, 12, 0).getTime();
    const days = clockTicks(now - 168 * h, now, 24 * h);
    expect(days.length).toBe(7);
    for (const t of days) {
      expect(new Date(t).getHours()).toBe(0);
      expect(new Date(t).getMinutes()).toBe(0);
    }
    // a day across the change: every 4 h tick on an hour divisible by 4 (24 h from 20:30 end at
    // 19:30 on the clock, the hour 02:00–03:00 runs twice: 00, 04, 08, 12, 16)
    const t0 = new Date(2026, 9, 24, 20, 30).getTime();
    const fours = clockTicks(t0, t0 + 24 * h, 4 * h);
    expect(fours.map((t) => new Date(t).getHours())).toEqual([0, 4, 8, 12, 16]);
    expect(fours.every((t) => new Date(t).getHours() % 4 === 0)).toBe(true);
    // the spring change (29 Mar 2026, 02:00 → 03:00): no tick twice, every one on the half hour
    const s0 = new Date(2026, 2, 29, 1, 0).getTime();
    const halves = clockTicks(s0, s0 + 2 * h, 0.5 * h);
    expect(new Set(halves).size).toBe(halves.length);
    expect(halves.every((t, i) => i === 0 || t > halves[i - 1])).toBe(true);
    expect(halves.every((t) => new Date(t).getMinutes() % 30 === 0)).toBe(true);
  });
});
