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
});
