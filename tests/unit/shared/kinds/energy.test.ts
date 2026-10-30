import { describe, it, expect } from "vitest";
import { segments } from "../../../../src/shared/kinds/energy.ts";

describe("battery segments", () => {
  it("fills whole segments to the charge, the next one by what is left", () => {
    expect(segments(42)).toEqual([1, 1, 1, 1, expect.closeTo(0.2), 0, 0, 0, 0, 0]);
    expect(segments(72).slice(6, 8)).toEqual([1, expect.closeTo(0.2)]);
  });

  it("has no segment partly full on a whole ten", () => {
    expect(segments(40)).toEqual([1, 1, 1, 1, 0, 0, 0, 0, 0, 0]);
    expect(segments(0)).toEqual(Array(10).fill(0));
    expect(segments(100)).toEqual(Array(10).fill(1));
  });

  it("keeps a charge out of range or unknown within the strip", () => {
    expect(segments(-5)).toEqual(Array(10).fill(0));
    expect(segments(130)).toEqual(Array(10).fill(1));
    expect(segments(null)).toEqual(Array(10).fill(0));
    expect(segments(50, 4)).toEqual([1, 1, 0, 0]);
  });
});
