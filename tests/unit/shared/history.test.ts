import { describe, it, expect, vi } from "vitest";
import {
  bucketMean,
  bucketLast,
  clampedSeries,
  smoothPath,
  fetchHistory,
  lineBuckets,
  lineMeans,
  normalizeSmoothing,
  plotScale,
  pointOf,
  trendOf,
} from "../../../src/shared/history.ts";
import type { HomeAssistant } from "../../../src/shared/ha.ts";

describe("history helpers", () => {
  const pts = [
    { t: 0, v: 1 },
    { t: 10, v: 3 },
    { t: 20, v: 5 },
    { t: 30, v: 7 },
    { t: 90, v: 9 },
  ];
  it("clamps a series to the window", () => {
    const c = clampedSeries(pts, 15, 100);
    expect(c[0]).toEqual({ t: 15, v: 3 });
    expect(c[c.length - 1]).toEqual({ t: 100, v: 9 });
    expect(clampedSeries([], 0, 10)).toEqual([]);
    expect(clampedSeries([{ t: 50, v: 2 }], 0, 100).map((p) => p.t)).toEqual([0, 50, 100]);
  });
  it("averages per bucket and keeps the exact edge points", () => {
    const m = bucketMean(pts, 0, 100, 4);
    expect(m.map((p) => p.v)).toEqual([1, 7, 9]);
    expect(m[0].t).toBe(0);
    expect(m[2].t).toBe(90);
    expect(m[1].t).toBe(30);
    const k = bucketMean(pts, 0, 100, 4, true);
    expect(k.length).toBe(4);
    expect(k.map((p) => p?.v)).toEqual([3, 7, 7, 9]);
    expect(k[1]?.t1).toBe(25);
    expect(bucketMean([], 0, 100, 3)).toEqual([]);
    expect(bucketMean([{ t: 5, v: null }], 0, 100, 2, true)).toEqual([null, null]);
  });
  it("carries the last state into empty buckets", () => {
    const b = bucketLast(
      [
        { t: 5, s: "on" },
        { t: 60, s: "off" },
      ],
      0,
      100,
      5,
    );
    expect(b.map((p) => p?.s)).toEqual(["on", "on", "on", "off", "off"]);
    expect(b[0]).toMatchObject({ t1: 0, t2: 20 });
    expect(bucketLast([{ t: 50, s: "x" }], 0, 100, 4).map((p) => p?.s)).toEqual([
      undefined,
      undefined,
      "x",
      "x",
    ]);
  });
  it("shows an active state that came and went inside a bucket", () => {
    const on = (s: string) => s === "on";
    // a door open for a moment in the second bucket, and open into the fourth
    const pts = [
      { t: 0, s: "off" },
      { t: 30, s: "on" },
      { t: 31, s: "off" },
      { t: 70, s: "on" },
      { t: 85, s: "off" },
    ];
    expect(bucketLast(pts, 0, 100, 5).map((p) => p?.s)).toEqual(["off", "off", "off", "on", "off"]);
    expect(bucketLast(pts, 0, 100, 5, on).map((p) => p?.s)).toEqual([
      "off",
      "on",
      "off",
      "on",
      "on",
    ]);
  });
  it("draws a smooth path that never goes back in x", () => {
    expect(smoothPath([])).toBe("");
    expect(
      smoothPath([
        [0, 0],
        [10, 5],
      ]),
    ).toBe("M0,0 L10,5");
    const d = smoothPath([
      [0, 10],
      [1, 0],
      [50, 20],
      [51, 30],
      [100, 10],
    ]);
    const xs = [...d.matchAll(/C([\d.]+),[\d.]+ ([\d.]+),[\d.]+ ([\d.]+),/g)].flatMap((m) => [
      +m[1],
      +m[2],
      +m[3],
    ]);
    for (let i = 1; i < xs.length; i++) expect(xs[i]).toBeGreaterThanOrEqual(xs[i - 1] - 1e-9);
  });
  it("draws the plain Catmull-Rom curve when unclamped", () => {
    const pts = [
      [0, 10],
      [10, 0],
      [20, 8],
      [30, 20],
    ];
    // the control point after the peak leaves the segment's y-range only when unclamped
    expect(smoothPath(pts, false)).toBe(
      "M0,10 C1.7,8.3 6.7,0.3 10,0 C13.3,-0.3 16.7,4.7 20,8 C23.3,11.3 28.3,18.0 30,20",
    );
    expect(smoothPath(pts)).toBe(
      "M0,10 C1.7,8.3 6.7,0.3 10,0 C13.3,0.0 16.7,4.7 20,8 C23.3,11.3 28.3,18.0 30,20",
    );
  });
  it("spaces history lines by width unless smoothing_minutes is set", () => {
    const day = 24 * 3600e3;
    // default: one point per 12 px
    expect(lineBuckets(day, null, 240)).toBe(20);
    expect(lineBuckets(day, null, 600)).toBe(50);
    // smoothing_minutes: one point per bucket over the window
    expect(lineBuckets(day, 60, 240)).toBe(24);
    expect(lineBuckets(6 * 3600e3, 15, 600)).toBe(24);
    // never finer than one point per 2 px, never fewer than 2
    expect(lineBuckets(day, 5, 240)).toBe(120);
    expect(lineBuckets(3600e3, 60, 240)).toBe(2);
    expect(lineBuckets(day, null, 10)).toBe(2);
  });
  it("draws a smoothed line from bucket means only, stretched to the window", () => {
    // a sensor flipping between two readings: every mean sits between them, the ends too
    const flip = Array.from({ length: 40 }, (_, i) => ({ t: i * 10, v: i % 2 ? 20.1 : 20 }));
    const line = lineMeans(flip, 0, 400, 4);
    expect(line.map((p) => p.t)).toEqual([0, 150, 250, 400]);
    for (const p of line) expect(p.v).toBeCloseTo(20.05, 5);
    // an empty bucket carries the previous mean
    expect(lineMeans(pts, 0, 100, 4).map((p) => p.v)).toEqual([3, 7, 7, 9]);
    expect(lineMeans([], 0, 100, 4)).toEqual([]);
  });
  it("reads smoothing_minutes as null when unset and at least 5 otherwise", () => {
    expect(normalizeSmoothing(undefined)).toBeNull();
    expect(normalizeSmoothing(null)).toBeNull();
    expect(normalizeSmoothing("abc")).toBeNull();
    expect(normalizeSmoothing(0)).toBeNull();
    expect(normalizeSmoothing(-10)).toBeNull();
    expect(normalizeSmoothing(1)).toBe(5);
    expect(normalizeSmoothing("30")).toBe(30);
  });
  it("fetches recorder history and appends the newer current state", async () => {
    const callWS = vi.fn().mockResolvedValue({
      "sensor.a": [{ s: "1", lu: 100 }, { s: "unknown", lu: 200 }, { lu: 300 }],
    });
    const hass = {
      callWS,
      states: {
        "sensor.a": { state: "3", last_updated: new Date(400e3).toISOString() },
        "sensor.b": { state: "off", last_updated: new Date(50e3).toISOString() },
      },
    } as unknown as HomeAssistant;
    const res = await fetchHistory(hass, ["sensor.a", "sensor.b"], 6);
    const req = callWS.mock.calls[0][0];
    expect(req).toMatchObject({
      type: "history/history_during_period",
      entity_ids: ["sensor.a", "sensor.b"],
      minimal_response: true,
    });
    expect(new Date(req.end_time).getTime() - new Date(req.start_time).getTime()).toBe(6 * 3600e3);
    expect(res.get("sensor.a")).toEqual([
      { t: 100e3, v: 1, s: "1" },
      { t: 200e3, v: null, s: "unknown" },
      { t: 400e3, v: 3, s: "3" },
    ]);
    expect(res.get("sensor.b")).toEqual([pointOf(50e3, "off")]);
    expect(pointOf(1, "2.5")).toEqual({ t: 1, v: 2.5, s: "2.5" });
    await expect(
      fetchHistory(
        { callWS: () => Promise.reject(new Error("x")), states: {} } as unknown as HomeAssistant,
        ["sensor.a"],
        1,
      ),
    ).rejects.toThrow("x");
  });
});

describe("plotScale", () => {
  it("fits the data without limits, as a line and as columns", () => {
    // a line: the data's edges, a tenth of the range around them
    expect(plotScale([10, 20], {}, false, 0.1)).toEqual({
      lo: 9,
      hi: 21,
      top: 20,
      bottom: 10,
      base: 9,
      fixed: false,
    });
    // a flat line sits in a range of 2
    expect(plotScale([5, 5], {}, false, 0.1)).toMatchObject({ top: 6, bottom: 4 });
    // columns: from 0 to the highest bucket, growing from 0
    expect(plotScale([3, 17], {}, true, 0)).toEqual({
      lo: 0,
      hi: 17,
      top: 17,
      bottom: 0,
      base: 0,
      fixed: false,
    });
    expect(plotScale([-4, 6], {}, true, 0)).toMatchObject({ lo: -4, hi: 6, base: 0 });
    // a row of zeros: a range of 1, its axis still names 0
    expect(plotScale([0, 0], {}, true, 0)).toMatchObject({ lo: 0, hi: 1, top: 0 });
  });

  it("takes a written limit as that side's edge, without padding", () => {
    expect(plotScale([3, 17], { max: 100 }, true, 0)).toMatchObject({
      lo: 0,
      hi: 100,
      top: 100,
      fixed: true,
    });
    // a line: the written side exact, the other fitted and padded
    expect(plotScale([10, 20], { max: 40 }, false, 0.1)).toMatchObject({
      lo: 7,
      hi: 40,
      top: 40,
      bottom: 10,
    });
    expect(plotScale([10, 20], { min: 0 }, false, 0.1)).toMatchObject({
      lo: 0,
      hi: 22,
      bottom: 0,
      top: 20,
    });
    expect(plotScale([10, 20], { min: 0, max: 50 }, false, 0.1)).toMatchObject({
      lo: 0,
      hi: 50,
    });
  });

  it("keeps a written limit when the data is flat at it", () => {
    // a solar line at night, flat at its written floor: on the floor, the axis naming 0
    expect(plotScale([0, 0, 0], { min: 0 }, false, 0.1)).toMatchObject({
      lo: 0,
      bottom: 0,
      top: 2,
    });
    expect(plotScale([100, 100], { max: 100 }, false, 0.1)).toMatchObject({ hi: 100, top: 100 });
    expect(plotScale([5, 5], { min: 5 }, true, 0)).toMatchObject({ lo: 5, hi: 6, base: 5 });
  });

  it("widens the scale for data beyond a limit, nothing cut off", () => {
    expect(plotScale([20, 55], { max: 40 }, true, 0)).toMatchObject({ hi: 55, top: 55 });
    expect(plotScale([5, 20], { min: 10 }, false, 0.1)).toMatchObject({ lo: 5, bottom: 5 });
  });

  it("grows columns from a min above 0", () => {
    expect(plotScale([40, 60], { min: 30 }, true, 0)).toMatchObject({
      lo: 30,
      hi: 60,
      base: 30,
      fixed: true,
    });
    expect(plotScale([40, 60], { min: 30, max: 100 }, true, 0)).toMatchObject({
      lo: 30,
      hi: 100,
      base: 30,
    });
  });
});

describe("trend", () => {
  const h = 3600e3;
  const series = [
    { t: 0, v: 18 },
    { t: 2 * h, v: 19 },
    { t: 2.5 * h, v: null },
    { t: 3.5 * h, v: 21 },
  ];
  it("is the value now against the last reading at or before the span's start", () => {
    expect(trendOf(series, 4 * h, 0.25, 22)).toBe(1);
    // a gap (null) is no reading: the one before it counts
    expect(trendOf(series, 4 * h, 1, 22)).toBe(3);
    expect(trendOf(series, 4 * h, 2.5, 22)).toBe(4);
  });
  it("takes the first reading when the series starts later, and is null without one", () => {
    expect(trendOf(series, 4 * h, 6, 20)).toBe(2);
    expect(trendOf([], 4 * h, 1, 20)).toBeNull();
    expect(trendOf(undefined, 4 * h, 1, 20)).toBeNull();
    expect(trendOf(series, 4 * h, 1, null)).toBeNull();
  });
});
