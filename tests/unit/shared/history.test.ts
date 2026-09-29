import { describe, it, expect, vi } from "vitest";
import {
  bucketMean,
  bucketLast,
  clampedSeries,
  smoothPath,
  fetchHistory,
  pointOf,
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
