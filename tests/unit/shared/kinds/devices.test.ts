import { describe, it, expect } from "vitest";
import { routeOf } from "../../../../src/shared/kinds/devices.ts";

// the lanes of a route: the y of every horizontal run, in order
const lanes = (d: string) => {
  const ys: number[] = [];
  let y = 0;
  for (const [, cmd, args] of d.matchAll(/([MHV])([^MHV]*)/g)) {
    const n = args
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (cmd === "M") y = n[1];
    if (cmd === "V") y = n[0];
    if (cmd === "H" && !ys.includes(y)) ys.push(y);
  }
  return ys;
};

describe("a robot's route", () => {
  it("runs as many lanes as fit, 12 px apart, from the top down", () => {
    const ys = lanes(routeOf(100, 40).path);
    expect(ys).toHaveLength(4);
    expect(ys.slice(1).map((y, i) => y - ys[i])).toEqual([12, 12, 12]);
    expect(ys[0]).toBeLessThan(ys[3]);
    // centred in the box
    expect(ys[0] + ys[3]).toBe(40);
  });

  it("keeps one lane in a box too low for two, from left to right", () => {
    expect(routeOf(80, 10).path).toBe("M4 5 H76");
  });

  it("draws its squares on a grid: the same x in every lane, 6 px apart, one in each step", () => {
    const pts = [...routeOf(100, 40).dots.matchAll(/M(\S+) (\S+)h0/g)].map((m) => [
      Number(m[1]),
      Number(m[2]),
    ]);
    const ys = [...new Set(pts.map(([, y]) => y))];
    const xsAt = (y: number) => pts.filter(([, py]) => py === y).map(([x]) => x);
    // four lanes and a dot halfway down each of the three turns between them
    expect(ys).toHaveLength(7);
    const lane = xsAt(ys[0]);
    expect(lane.slice(1).map((x, i) => x - lane[i])).toEqual(lane.slice(1).map(() => 6));
    for (const y of [ys[2], ys[4], ys[6]]) expect(xsAt(y)).toEqual(lane);
    // the steps go straight down from the lanes' last dots: at the right, the left, the right
    expect([ys[1], ys[3], ys[5]].map((y) => xsAt(y))).toEqual([
      [lane[lane.length - 1]],
      [lane[0]],
      [lane[lane.length - 1]],
    ]);
  });
});
