import { describe, it, expect } from "vitest";
import { extentOf } from "../../../../src/shared/kinds/sensors.ts";

describe("today's low and high", () => {
  it("are the lowest and the highest value, the one now among them", () => {
    expect(extentOf([{ v: 18 }, { v: null }, { v: 23.5 }, { v: 20 }])).toEqual({
      lo: 18,
      hi: 23.5,
    });
    expect(extentOf([{ v: 18 }], 25)).toEqual({ lo: 18, hi: 25 });
    expect(extentOf([], 21)).toEqual({ lo: 21, hi: 21 });
    expect(extentOf([{ v: null }])).toBeNull();
  });
});
