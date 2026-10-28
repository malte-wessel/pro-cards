import { describe, it, expect, vi, afterEach } from "vitest";
import { buildRow, leadSize, rowBuilt, setRate } from "../../../src/shared/flow/dom.ts";
import { BAND, LAYOUTS } from "../../../src/shared/flow/constants.ts";
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
    // a scale: force 4 (moderate breeze) is about 24 km/h, force 10 about 95
    expect(toKmh(4, "Beaufort")).toBeCloseTo(24.08, 1);
    expect(toKmh(10, "Beaufort")).toBeCloseTo(95.17, 1);
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

describe("setRate", () => {
  afterEach(() => vi.unstubAllGlobals());
  // an element whose running animations are the given objects
  const withAnimations = (anims: { playbackRate: number }[]) => {
    const el = document.createElement("div");
    el.getAnimations = (() => anims) as unknown as typeof el.getAnimations;
    return el;
  };

  it("scales the animations, not for a change of less than half a percent", () => {
    const a = { playbackRate: 1 };
    const el = withAnimations([a]);
    setRate(el, 1.2);
    expect(a.playbackRate).toBe(1.2);
    expect(el.dataset.rate).toBe("1.200");
    setRate(el, 1.203);
    expect(a.playbackRate).toBe(1.2);
    setRate(el, 1.21);
    expect(a.playbackRate).toBe(1.21);
  });

  it("leaves transitions at their own pace", () => {
    class FakeTransition {
      playbackRate = 1;
    }
    vi.stubGlobal("CSSTransition", FakeTransition);
    const anim = { playbackRate: 1 },
      turn = new FakeTransition();
    setRate(withAnimations([anim, turn]), 2);
    expect(anim.playbackRate).toBe(2);
    expect(turn.playbackRate).toBe(1);
  });
});

describe("the poster's row", () => {
  it("is a layout of the flow cards, with a 40 px lead", () => {
    expect(LAYOUTS).toEqual(["tile", "hero", "poster"]);
    expect(leadSize("poster")).toBe(40);
    // the tile's and the flow tile's are the same, the hero's the largest
    expect(leadSize("tile")).toBe(BAND.tileLead);
    expect(leadSize("flowtile")).toBe(BAND.tileLead);
    expect(leadSize("hero")).toBe(BAND.heroLead);
  });
  it("is the entity poster's skeleton: the lead and the pill on top, the texts below", () => {
    const row = document.createElement("div");
    const lead = document.createElement("div");
    lead.className = "lead";
    expect(rowBuilt(row)).toBe(false);
    buildRow(row, "poster", lead);
    expect(rowBuilt(row)).toBe(true);
    expect([...row.children].map((c) => c.className)).toEqual(["ptop", "pbody"]);
    expect(row.querySelector(":scope > .ptop > .plead > .lead")).toBe(lead);
    const pill = row.querySelector<HTMLElement>(":scope > .ptop > .corner > .plabel")!;
    expect(pill.classList.contains("pill")).toBe(true);
    const body = row.querySelector(":scope > .pbody")!;
    expect([...body.children].map((c) => c.className)).toEqual(["pname", "pvalue", "secondary"]);
    expect(body.querySelector(":scope > .pvalue > .big > b")).not.toBeNull();
    // no tile parts
    expect(row.querySelector(".top, .primary, .end")).toBeNull();
  });
  it("counts a tile's or a hero's skeleton as built too, not a nested one", () => {
    const tile = document.createElement("div");
    buildRow(tile, "tile", document.createElement("div"));
    expect(rowBuilt(tile)).toBe(true);
    const outer = document.createElement("div");
    outer.appendChild(tile);
    expect(rowBuilt(outer)).toBe(false);
  });
});
