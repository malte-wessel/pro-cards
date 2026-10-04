import { describe, it, expect } from "vitest";
import { WindCard } from "../../src/wind-card.ts";
import { normalizeWindCardConfig } from "../../src/wind/config.ts";
import { collectTemplates } from "../../src/shared/entity/config.ts";
import {
  amplitude,
  arrowRotation,
  fieldKey,
  needsRedraw,
  rateOf,
  fieldRotation,
  fieldSize,
  fieldSpec,
  gustCount,
  leadDuration,
  pxps,
  wavePath,
} from "../../src/wind/flow.ts";

const S = "sensor.wind_speed";

describe("wind-card config", () => {
  it("is registered and needs a sensor or weather entity", () => {
    expect(customElements.get("wind-card-pro")).toBe(WindCard);
    expect(window.customCards?.some((c) => c.type === "wind-card-pro")).toBe(true);
    expect(() => normalizeWindCardConfig(null)).toThrow(/invalid config/);
    expect(() => normalizeWindCardConfig({})).toThrow(/sensor or weather entity/);
    expect(() => normalizeWindCardConfig({ entity: "light.a" })).toThrow(/sensor or weather/);
    expect(() => normalizeWindCardConfig({ entity: S, direction: "weather.home" })).toThrow(
      /'direction' must be a sensor/,
    );
    expect(() => normalizeWindCardConfig({ entity: S, gust: "x" })).toThrow(/'gust'/);
  });

  it("builds the speed, direction and gust items from sensors", () => {
    const c = normalizeWindCardConfig({
      entity: S,
      direction: "sensor.wind_direction",
      gust: "sensor.wind_gust",
      name: "Garden",
      rules: [{ below: 20, color: "teal", label: "Light" }],
      decimals: 0,
    });
    expect(c).toMatchObject({
      layout: "tile",
      visual: "icon",
      lead: "animated",
      source: "sensor",
      speedIdx: 0,
      dirIdx: 1,
      gustIdx: 2,
      hasHeader: false,
      groups: [],
      flow: { style: "dots", density: "normal", height: 120 },
    });
    expect(c.entities.map((e) => [e.entity, e.valueSrc.kind])).toEqual([
      [S, "state"],
      ["sensor.wind_direction", "state"],
      ["sensor.wind_gust", "state"],
    ]);
    expect(c.entities[0]).toMatchObject({ name: "Garden", decimals: 0 });
    expect(c.entities[0].rules[0]).toMatchObject({ below: 20, color: "teal", label: "Light" });
    expect(c.entities[1].nameKey).toBe("weather.attr.wind_bearing");
  });

  it("leaves direction and gusts out when no sensor names them", () => {
    const c = normalizeWindCardConfig({ entity: S });
    expect(c.entities).toHaveLength(1);
    expect(c.dirIdx).toBeNull();
    expect(c.gustIdx).toBeNull();
  });

  it("reads a weather entity's attributes, sensors overriding them", () => {
    const c = normalizeWindCardConfig({ entity: "weather.home" });
    expect(c.source).toBe("weather");
    expect(c.entities.map((e) => e.valueSrc)).toEqual([
      { kind: "attribute", key: "wind_speed" },
      { kind: "attribute", key: "wind_bearing" },
      { kind: "attribute", key: "wind_gust_speed" },
    ]);
    expect(c.entities[0].nameKey).toBe("weather.attr.wind_speed");
    expect(c.entities[1]).toMatchObject({ unit: "°", decimals: 0 });
    expect(c.entities[2].unitAttr).toBe("wind_speed_unit");
    const d = normalizeWindCardConfig({ entity: "weather.home", direction: "sensor.dir" });
    expect(d.entities[1]).toMatchObject({ entity: "sensor.dir", valueSrc: { kind: "state" } });
    expect(d.entities[1].unitAttr).toBeUndefined();
  });

  it("checks layout, visual, lead and flow options", () => {
    expect(() => normalizeWindCardConfig({ entity: S, layout: "compass" })).toThrow(
      /layout must be one of tile \| hero/,
    );
    expect(() => normalizeWindCardConfig({ entity: S, visual: "dots" })).toThrow(/visual/);
    expect(() => normalizeWindCardConfig({ entity: S, lead: "icon" })).toThrow(/lead/);
    expect(() => normalizeWindCardConfig({ entity: S, flow: { style: "waves" } })).toThrow(
      /flow.style must be one of dots \| lines \| swoosh \| vectors/,
    );
    expect(() => normalizeWindCardConfig({ entity: S, flow: { density: "max" } })).toThrow(
      /flow.density/,
    );
    expect(() => normalizeWindCardConfig({ entity: S, flow: "dots" })).toThrow(/'flow'/);
    const c = normalizeWindCardConfig({
      entity: S,
      layout: "hero",
      lead: "arrow",
      flow: { style: "swoosh", density: "dense", height: 1000 },
    });
    expect(c).toMatchObject({
      layout: "hero",
      lead: "arrow",
      flow: { style: "swoosh", density: "dense", height: 400 },
    });
    expect(normalizeWindCardConfig({ entity: S, flow: { height: 3 } }).flow.height).toBe(40);
    // the flow tile always shows the arrow
    expect(normalizeWindCardConfig({ entity: S, visual: "flow" }).lead).toBe("arrow");
    expect(normalizeWindCardConfig({ entity: S, layout: "hero", visual: "flow" }).lead).toBe(
      "animated",
    );
  });

  it("collects header entities and templates", () => {
    const c = normalizeWindCardConfig({
      entity: S,
      title: "Wind",
      secondary: "{{ states('sensor.wind_gust') }} gusts",
      header_entities: [{ entity: "sensor.wind_gust", color: "orange" }],
    });
    expect(c.hasHeader).toBe(true);
    expect(c.headerIdxs).toEqual([1]);
    expect([...collectTemplates(c)]).toEqual(["{{ states('sensor.wind_gust') }} gusts"]);
  });
});

describe("wind flow maths", () => {
  it("turns the field and the arrow with the bearing", () => {
    expect(fieldRotation(225)).toBe(315);
    expect(fieldRotation(300)).toBe(30);
    expect(arrowRotation(225)).toBe(45);
  });

  it("maps the wind to motion", () => {
    expect(pxps(0)).toBe(16);
    expect(pxps(20)).toBe(116);
    expect(pxps(-5)).toBe(16);
    expect(amplitude(0, null)).toBe(3);
    expect(amplitude(10, 20)).toBeCloseTo(3 + 6 + 1.5);
    expect(amplitude(10, 5)).toBeCloseTo(4.5); // gusts below the speed add nothing
    expect(amplitude(100, 200)).toBe(19); // capped
    expect(leadDuration(pxps(0))).toBeCloseTo(5.625);
    expect(leadDuration(pxps(80))).toBe(0.35);
    expect(gustCount(null)).toBe(0);
    expect(gustCount(12)).toBe(0);
    expect(gustCount(18)).toBe(2);
    expect(gustCount(90)).toBe(6);
  });

  it("is deterministic and draws waves across the field", () => {
    const d = wavePath(100, 200, 5, 0, -40, 520);
    expect(d.startsWith("M-40,")).toBe(true);
    const xs = [...d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
    expect(xs.at(-1)![0]).toBeGreaterThanOrEqual(480); // crosses the whole field
    for (const [, y] of xs) expect(Math.abs(y - 100)).toBeLessThanOrEqual(6); // amplitude 5 plus the curve's overshoot;
    expect(fieldSpec("dots", "normal", 480, 8, 18, 9)).toEqual(
      fieldSpec("dots", "normal", 480, 8, 18, 9),
    );
  });

  it("sizes the field to cover the band and keys the rebuild", () => {
    expect(fieldSize(482, 88)).toBe(520);
    expect(fieldSize(100, 40)).toBe(480);
    expect(fieldSize(1000, 120)).toBe(960);
    const k = fieldKey("dots", "normal", 480);
    expect(fieldKey("lines", "normal", 480)).not.toBe(k);
    expect(fieldKey("dots", "dense", 480)).not.toBe(k);
    expect(fieldKey("dots", "normal", 520)).not.toBe(k);
    // waves: sensor noise never redraws, a real change does
    const built = { amp: 9.7, gusts: 2 };
    expect(needsRedraw(null, built)).toBe(true);
    expect(needsRedraw(built, { amp: 12.5, gusts: 3 })).toBe(false);
    expect(needsRedraw(built, { amp: 6.9, gusts: 1 })).toBe(false);
    expect(needsRedraw(built, { amp: 13.7, gusts: 2 })).toBe(true);
    expect(needsRedraw(built, { amp: 9.7, gusts: 4 })).toBe(true);
    expect(needsRedraw(built, { amp: 9.7, gusts: 0 })).toBe(true);
    expect(needsRedraw({ amp: 4, gusts: 0 }, { amp: 5, gusts: 1 })).toBe(true);
    // a speed change scales the playback rate of the field as built
    expect(rateOf(9.4, 9.4)).toBe(1);
    expect(rateOf(60, 9.4)).toBeCloseTo((16 + 300) / (16 + 47));
    expect(rateOf(0, 20)).toBeCloseTo(16 / 116);
  });

  it("lays out every style at every density", () => {
    const dots = fieldSpec("dots", "normal", 480, 8, 18, 9);
    if (dots.style !== "dots") throw new Error("style");
    expect(dots.lanes).toHaveLength(18);
    expect(dots.lanes[0].parts).toHaveLength(15); // 5 packets of 3 dots
    expect(dots.streaks).toHaveLength(2);
    for (const l of dots.lanes)
      for (const p of l.parts) {
        expect(p.p0).toBeGreaterThanOrEqual(0);
        expect(p.p0).toBeLessThan(1);
        expect(p.k).toBeGreaterThanOrEqual((560 / 480) * 0.85);
        expect(p.k).toBeLessThanOrEqual((560 / 480) * 1.15);
      }
    const sparse = fieldSpec("dots", "sparse", 480, 8, null, 2);
    if (sparse.style !== "dots") throw new Error("style");
    expect(sparse.lanes).toHaveLength(12);
    expect(sparse.lanes[0].parts).toHaveLength(9);
    expect(sparse.streaks).toHaveLength(0);
    const dense = fieldSpec("vectors", "dense", 480, 8, 88, 62);
    if (dense.style !== "vectors") throw new Error("style");
    expect(dense.lanes).toHaveLength(22);
    expect(dense.lanes[0].parts).toHaveLength(6);
    expect(dense.streaks).toHaveLength(6);
    const lines = fieldSpec("lines", "normal", 480, 8, 18, 9);
    if (lines.style !== "lines") throw new Error("style");
    expect(lines.lines).toHaveLength(44); // 22 lanes × 2 dashes
    const swoosh = fieldSpec("swoosh", "normal", 480, 8, 18, 9);
    if (swoosh.style !== "swoosh") throw new Error("style");
    expect(swoosh.strokes).toHaveLength(9);
    // a bigger field carries more lanes
    const wide = fieldSpec("dots", "normal", 960, 8, 18, 9);
    if (wide.style !== "dots") throw new Error("style");
    expect(wide.lanes).toHaveLength(36);
  });
});
