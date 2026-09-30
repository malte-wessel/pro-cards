import { describe, it, expect } from "vitest";
import { bandHeight, enumOf, flowObject, sensorId } from "../../../src/shared/flow/config.ts";
import {
  compassIndex,
  parseBearing,
  prng,
  toKmh,
  unwrapAngle,
} from "../../../src/shared/flow/maths.ts";

describe("flow engine maths", () => {
  it("converts speeds to km/h", () => {
    expect(toKmh(10, "km/h")).toBe(10);
    expect(toKmh(10, "m/s")).toBe(36);
    expect(toKmh(10, "mph")).toBeCloseTo(16.09, 2);
    expect(toKmh(10, "kn")).toBeCloseTo(18.52, 2);
    expect(toKmh(10, "ft/s")).toBeCloseTo(10.97, 2);
    expect(toKmh(10, "Beaufort")).toBe(10);
    expect(toKmh(10, null)).toBe(10);
  });

  it("reads bearings as degrees or compass points", () => {
    expect(parseBearing("225")).toBe(225);
    expect(parseBearing(370)).toBe(10);
    expect(parseBearing("-90")).toBe(270);
    expect(parseBearing("sw")).toBe(225);
    expect(parseBearing(" NNW ")).toBe(337.5);
    expect(parseBearing("x")).toBeNull();
    expect(parseBearing("")).toBeNull();
    expect(parseBearing(null)).toBeNull();
    expect(compassIndex(0)).toBe(0);
    expect(compassIndex(348.75)).toBe(0);
    expect(compassIndex(348.7)).toBe(15);
    expect(compassIndex(225)).toBe(10);
    // the transition turns the short way: never back across 0°
    expect(unwrapAngle(null, 315)).toBe(315);
    expect(unwrapAngle(350, 10)).toBe(370);
    expect(unwrapAngle(10, 350)).toBe(-10);
    expect(unwrapAngle(315, 80)).toBe(440);
    expect(unwrapAngle(440, 100)).toBe(460);
    expect(unwrapAngle(100, 100)).toBe(100);
    expect(unwrapAngle(0, 180)).toBe(180);
  });

  it("is deterministic", () => {
    const a = prng(11),
      b = prng(11);
    const va = [a(), a(), a()],
      vb = [b(), b(), b()];
    expect(va).toEqual(vb);
    for (const v of va) expect(v).toBeGreaterThanOrEqual(0);
    for (const v of va) expect(v).toBeLessThan(1);
    expect(prng(5)()).not.toBe(prng(11)());
  });
});

describe("flow engine config checks", () => {
  it("names the card in its messages", () => {
    expect(enumOf("x-card", ["a", "b"] as const, undefined, "layout", "a")).toBe("a");
    expect(enumOf("x-card", ["a", "b"] as const, "b", "layout", "a")).toBe("b");
    expect(() => enumOf("x-card", ["a", "b"] as const, "c", "layout", "a")).toThrow(
      /x-card: layout must be one of a \| b/,
    );
    expect(sensorId("x-card", undefined, "gust")).toBeNull();
    expect(sensorId("x-card", "sensor.a", "gust")).toBe("sensor.a");
    expect(() => sensorId("x-card", "light.a", "gust")).toThrow(/x-card: 'gust' must be a sensor/);
    expect(flowObject("x-card", null)).toEqual({});
    expect(flowObject("x-card", { style: "dots" })).toEqual({ style: "dots" });
    expect(() => flowObject("x-card", "dots")).toThrow(/'flow' must be an object/);
    expect(bandHeight({})).toBe(120);
    expect(bandHeight({ height: 3 })).toBe(40);
    expect(bandHeight({ height: 1000 })).toBe(400);
  });
});
