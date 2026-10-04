import { describe, it, expect } from "vitest";
import { RainCard } from "../../src/rain-card.ts";
import { normalizeRainCardConfig } from "../../src/rain/config.ts";
import { collectTemplates } from "../../src/shared/entity/config.ts";
import {
  countOf,
  dropCount,
  dropSpec,
  fallOf,
  fallRate,
  fillDropCount,
  isWet,
  leadFall,
  levelOf,
  needsRebuild,
  rainSpec,
  rippleCount,
  rippleSpec,
  slantOf,
  tanOf,
  waveAmp,
  wavePathD,
  wavePeriod,
} from "../../src/rain/rain.ts";

const R = "sensor.rain_rate_roof";

describe("rain-card config", () => {
  it("is registered and needs a rain rate sensor", () => {
    expect(customElements.get("rain-card-pro")).toBe(RainCard);
    expect(window.customCards?.some((c) => c.type === "rain-card-pro")).toBe(true);
    expect(() => normalizeRainCardConfig(null)).toThrow(/invalid config/);
    expect(() => normalizeRainCardConfig({})).toThrow(/rain rate sensor/);
    expect(() => normalizeRainCardConfig({ entity: "weather.home" })).toThrow(/sensor\.\*/);
    expect(() => normalizeRainCardConfig({ entity: R, today: "weather.home" })).toThrow(
      /'today' must be a sensor/,
    );
    expect(() => normalizeRainCardConfig({ entity: R, wind: "x" })).toThrow(/'wind'/);
    expect(() => normalizeRainCardConfig({ entity: R, direction: 5 })).toThrow(/'direction'/);
  });

  it("builds the rate, today, wind and direction items", () => {
    const c = normalizeRainCardConfig({
      entity: R,
      today: "sensor.rain_today",
      wind: "sensor.wind_speed",
      direction: "sensor.wind_direction",
      name: "Roof",
      rules: [{ below: 2.5, color: "light-blue", label: "Light rain" }],
      decimals: 0,
    });
    expect(c).toMatchObject({
      layout: "tile",
      visual: "icon",
      lead: "animated",
      leadIdx: 0,
      rateIdx: 0,
      todayIdx: 1,
      windIdx: 2,
      dirIdx: 3,
      hasHeader: false,
      groups: [],
      flow: { style: "drops", height: 120 },
    });
    expect(c.entities.map((e) => e.entity)).toEqual([
      R,
      "sensor.rain_today",
      "sensor.wind_speed",
      "sensor.wind_direction",
    ]);
    expect(c.entities[0]).toMatchObject({ name: "Roof", decimals: 0 });
    expect(c.entities[0].rules[0]).toMatchObject({ below: 2.5, color: "light-blue" });
    expect(c.entities[1].nameKey).toBe("rain.today_name");
    expect(c.entities[2].nameKey).toBe("weather.attr.wind_speed");
    expect(c.entities[3].nameKey).toBe("weather.attr.wind_bearing");
    const bare = normalizeRainCardConfig({ entity: R });
    expect(bare.entities).toHaveLength(1);
    expect([bare.todayIdx, bare.windIdx, bare.dirIdx]).toEqual([null, null, null]);
  });

  it("checks layout, visual, lead and flow options", () => {
    expect(() => normalizeRainCardConfig({ entity: R, layout: "gauge" })).toThrow(
      /rain-card-pro: layout must be one of tile \| hero/,
    );
    expect(() => normalizeRainCardConfig({ entity: R, visual: "drops" })).toThrow(/visual/);
    expect(() => normalizeRainCardConfig({ entity: R, lead: "arrow" })).toThrow(
      /lead must be one of animated \| icon/,
    );
    expect(() => normalizeRainCardConfig({ entity: R, flow: { style: "snow" } })).toThrow(
      /flow.style must be one of drops \| ripples \| fill/,
    );
    expect(() => normalizeRainCardConfig({ entity: R, flow: "drops" })).toThrow(/'flow'/);
    const c = normalizeRainCardConfig({
      entity: R,
      layout: "hero",
      lead: "icon",
      flow: { style: "fill", height: 1000 },
    });
    expect(c).toMatchObject({ layout: "hero", lead: "icon", flow: { style: "fill", height: 400 } });
    // the flow tile always shows the icon
    expect(normalizeRainCardConfig({ entity: R, visual: "flow" }).lead).toBe("icon");
    expect(normalizeRainCardConfig({ entity: R, layout: "hero", visual: "flow" }).lead).toBe(
      "animated",
    );
  });

  it("collects header entities and templates", () => {
    const c = normalizeRainCardConfig({
      entity: R,
      title: "Rain",
      secondary: "{{ states('sensor.rain_today') }} mm so far",
      header_entities: [{ entity: "sensor.rain_today", color: "blue" }],
    });
    expect(c.hasHeader).toBe(true);
    expect(c.headerIdxs).toEqual([1]);
    expect([...collectTemplates(c)]).toEqual(["{{ states('sensor.rain_today') }} mm so far"]);
  });
});

describe("rain maths", () => {
  it("slants the drops with the wind", () => {
    expect(slantOf(225, 9.4)).toBeCloseTo(8.46);
    expect(slantOf(90, 9.4)).toBeCloseTo(-8.46);
    expect(slantOf(null, 50)).toBe(32);
    expect(slantOf(225, null)).toBe(0);
    expect(slantOf(0, 10)).toBeCloseTo(9); // a straight north wind leans right by convention
    expect(tanOf(45)).toBeCloseTo(1);
  });

  it("maps the rate to counts and pace", () => {
    expect(isWet(0.05)).toBe(false);
    expect(isWet(0.1)).toBe(true);
    expect(fallOf(0)).toBe(0.95);
    expect(fallOf(80)).toBe(0.38);
    expect(leadFall(0)).toBeCloseTo(0.5225);
    expect(fallRate(2.4, 2.4)).toBe(1);
    expect(fallRate(20, 2.4)).toBeCloseTo(fallOf(2.4) / fallOf(20));
    expect(dropCount(0.05)).toBe(0);
    expect(dropCount(2.4)).toBe(28);
    expect(dropCount(20)).toBe(140);
    expect(rippleCount(2.4)).toBe(12);
    expect(rippleCount(0)).toBe(0);
    expect(fillDropCount(2.4)).toBe(9);
    expect(countOf("drops", 2.4)).toBe(28);
    expect(countOf("ripples", 2.4)).toBe(12);
    expect(countOf("fill", 2.4)).toBe(9);
  });

  it("fills the gauge with today's total", () => {
    expect(levelOf(null)).toBeCloseTo(0.08);
    expect(levelOf(3.6)).toBeCloseTo(0.302);
    expect(levelOf(30)).toBe(0.82);
    expect(waveAmp(0)).toBe(1.5);
    expect(waveAmp(100)).toBe(6);
    expect(wavePeriod(0)).toBe(3.2);
    expect(wavePeriod(100)).toBe(0.8);
    const d = wavePathD(3);
    expect(d.startsWith("M0,8 Q15,5 30,8 Q45,11 60,8")).toBe(true);
    expect(d.endsWith("600,8 V11 H0 Z")).toBe(true);
  });

  it("lays out drops and ripples deterministically", () => {
    const drops = dropSpec(28, 2.4);
    expect(drops).toHaveLength(28);
    expect(dropSpec(28, 2.4)).toEqual(drops);
    for (const d of drops) {
      expect(d.x).toBeGreaterThanOrEqual(-12);
      expect(d.x).toBeLessThanOrEqual(112);
      expect(d.k).toBeGreaterThanOrEqual(0.85);
      expect(d.k).toBeLessThanOrEqual(1.15);
      expect(d.p0).toBeGreaterThanOrEqual(0);
      expect(d.p0).toBeLessThan(1);
      expect(d.h).toBeGreaterThanOrEqual(7);
      expect(d.h).toBeLessThanOrEqual(14);
      expect(d.w).toBeGreaterThanOrEqual(1.2);
      expect(d.o).toBeGreaterThanOrEqual(0.45);
    }
    expect(drops.some((d) => d.splash)).toBe(true);
    const rips = rippleSpec(12, 2.4);
    expect(rips).toHaveLength(12);
    for (const r of rips) {
      expect(r.x).toBeGreaterThanOrEqual(4);
      expect(r.y).toBeLessThanOrEqual(90);
      expect(r.dur).toBeGreaterThanOrEqual(1.3);
      expect(r.w).toBeGreaterThanOrEqual(16);
      expect(r.h).toBe(Math.round(r.w * 0.42));
    }
    const fill = rainSpec("fill", 2.4, 3.6);
    if (fill.style !== "fill") throw new Error("style");
    expect(fill.drops).toHaveLength(9);
    expect(fill.level).toBeCloseTo(0.302);
    const dry = rainSpec("drops", 0, null);
    if (dry.style !== "drops") throw new Error("style");
    expect(dry.drops).toHaveLength(0);
  });

  it("rebuilds only when the rain really changes", () => {
    const built = { n: 28, wet: true };
    expect(needsRebuild(null, built)).toBe(true);
    expect(needsRebuild(built, { n: 33, wet: true })).toBe(false);
    expect(needsRebuild(built, { n: 24, wet: true })).toBe(false);
    expect(needsRebuild(built, { n: 36, wet: true })).toBe(true);
    expect(needsRebuild(built, { n: 0, wet: false })).toBe(true);
    expect(needsRebuild({ n: 3, wet: true }, { n: 5, wet: true })).toBe(true);
    expect(needsRebuild({ n: 3, wet: true }, { n: 4, wet: true })).toBe(false);
  });
});
