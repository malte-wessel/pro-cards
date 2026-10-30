import { describe, it, expect } from "vitest";
import { routeOf } from "../../../../src/shared/kinds/devices.ts";

// the lanes of a route: the y of every horizontal run, in order
const lanes = (d: string) => {
  const ys: number[] = [];
  let y = 0;
  for (const [, cmd, args] of d.matchAll(/([MHVQ])([^MHVQ]*)/g)) {
    const n = args
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (cmd === "M") y = n[1];
    if (cmd === "Q") y = n[3];
    if (cmd === "V") y = n[0];
    if (cmd === "H" && !ys.includes(y)) ys.push(y);
  }
  return ys;
};

describe("a robot's route", () => {
  it("runs as many lanes as fit, 12 px apart, from the top down", () => {
    const ys = lanes(routeOf(100, 40));
    expect(ys).toHaveLength(4);
    expect(ys.slice(1).map((y, i) => y - ys[i])).toEqual([12, 12, 12]);
    expect(ys[0]).toBeLessThan(ys[3]);
    // centred in the box
    expect(ys[0] + ys[3]).toBeCloseTo(40, 5);
  });

  it("keeps one lane in a box too low for two, from left to right", () => {
    expect(routeOf(80, 10)).toBe("M2 5 H78");
  });
});
