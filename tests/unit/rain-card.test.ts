import { afterEach, describe, it, expect } from "vitest";
import { RainCard } from "../../src/rain-card.ts";
import { normalizeRainCardConfig } from "../../src/rain/config.ts";
import { collectTemplates } from "../../src/shared/entity/config.ts";
import type { HassEntity, HomeAssistant } from "../../src/shared/ha.ts";
import { snapshot, world } from "../../docs/.vitepress/theme/ha-shim/hass.ts";
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
  toMm,
  toMmH,
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
    // icon_style belongs to the rate, the lead's item
    expect(normalizeRainCardConfig({ entity: R }).entities[0].iconStyle).toBe("circle");
    expect(normalizeRainCardConfig({ entity: R, icon_style: "plain" }).entities[0].iconStyle).toBe(
      "plain",
    );
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
    expect(needsRebuild({ n: 3, wet: true }, { n: 6, wet: true })).toBe(true);
    expect(needsRebuild({ n: 3, wet: true }, { n: 5, wet: true })).toBe(false);
  });
});

describe("rain units", () => {
  it("converts Home Assistant's rate and depth units to mm/h and mm", () => {
    expect(toMmH(2, "mm/h")).toBe(2);
    expect(toMmH(0.1, "in/h")).toBeCloseTo(2.54);
    expect(toMmH(24, "mm/d")).toBeCloseTo(1);
    expect(toMmH(24, "in/d")).toBeCloseTo(25.4);
    expect(toMmH(3, "")).toBe(3);
    expect(toMmH(3, undefined)).toBe(3);
    expect(toMm(0.5, "in")).toBeCloseTo(12.7);
    expect(toMm(1.2, "cm")).toBeCloseTo(12);
    expect(toMm(4, "mm")).toBe(4);
  });

  it("animates an in/h sensor by its rate in mm/h and fills the gauge from inches", () => {
    const rate = world.get(R)!,
      today = world.get("sensor.rain_today")!;
    world.set(R, "0.08", { unit_of_measurement: "in/h" });
    world.set("sensor.rain_today", "0.5", { unit_of_measurement: "in" });
    try {
      const el = new RainCard();
      el.setConfig({ entity: R, today: "sensor.rain_today", layout: "hero", style: "fill" });
      el.hass = snapshot();
      const row = el.shadowRoot!.querySelector<HTMLElement>(".row.whero")!;
      // 0.08 in/h is about 2 mm/h: it rains
      expect(row.classList.contains("dry")).toBe(false);
      // 0.5 in is 12.7 mm: more than the 12 mm that fill the gauge
      expect(row.style.getPropertyValue("--lv")).toBe(`${(levelOf(12.7) * 100).toFixed(1)}%`);
      // the texts keep the sensor's unit
      expect(row.textContent).toContain("in/h");
    } finally {
      world.set(R, rate.state, rate.attributes);
      world.set("sensor.rain_today", today.state, today.attributes);
    }
  });
});

describe("hover", () => {
  it("is the lead row's, off by default", () => {
    const lead = (raw: object) => {
      const c = normalizeRainCardConfig({ entity: "sensor.rain_rate", ...raw });
      return c.entities[c.leadIdx].hover;
    };
    expect(lead({})).toBe(false);
    expect(lead({ hover: true })).toBe(true);
  });
});

describe("rain-card poster", () => {
  it("is a layout; the flow poster shows the icon, the hero keeps its lead", () => {
    const c = normalizeRainCardConfig({ entity: R, layout: "poster" });
    expect(c).toMatchObject({ layout: "poster", visual: "icon", lead: "animated" });
    expect(normalizeRainCardConfig({ entity: R, layout: "poster", lead: "icon" }).lead).toBe(
      "icon",
    );
    expect(normalizeRainCardConfig({ entity: R, layout: "poster", visual: "flow" }).lead).toBe(
      "icon",
    );
    expect(
      normalizeRainCardConfig({ entity: R, layout: "poster", visual: "flow", lead: "animated" })
        .lead,
    ).toBe("icon");
    expect(
      normalizeRainCardConfig({ entity: R, layout: "hero", visual: "flow", lead: "icon" }).lead,
    ).toBe("icon");
    expect(() => normalizeRainCardConfig({ entity: R, layout: "x" })).toThrow(
      "rain-card-pro: layout must be one of tile | hero | poster",
    );
  });
  it("is three rows high, two at least", () => {
    const el = new RainCard();
    el.setConfig({ entity: R, layout: "poster" });
    expect(el.getGridOptions()).toEqual({ columns: 6, rows: 3, min_columns: 3, min_rows: 2 });
    expect(el.getCardSize()).toBe(3);
    el.setConfig({ entity: R, layout: "poster", title: "Rain" });
    expect(el.getCardSize()).toBe(4);
  });

  const st = (id: string, state: string, attributes: Record<string, unknown>) =>
    ({ entity_id: id, state, attributes }) as unknown as HassEntity;
  const hass = () =>
    ({
      states: {
        [R]: st(R, "2.4", { friendly_name: "Roof", unit_of_measurement: "mm/h" }),
        "sensor.rain_today": st("sensor.rain_today", "5.2", { unit_of_measurement: "mm" }),
      },
      locale: { language: "en" },
      config: {},
      formatEntityState: (s: HassEntity) => `${s.state} ${s.attributes.unit_of_measurement}`,
    }) as unknown as HomeAssistant;
  const cards: RainCard[] = [];
  afterEach(() => {
    for (const c of cards.splice(0)) c.remove();
  });
  const mount = (cfg: Record<string, unknown>) => {
    const el = new RainCard();
    el.setConfig({ entity: R, today: "sensor.rain_today", layout: "poster", ...cfg });
    document.body.appendChild(el);
    el.hass = hass();
    cards.push(el);
    return el.shadowRoot as ShadowRoot;
  };
  it("draws the entity poster's parts with the label in the pill", () => {
    const r = mount({ rules: [{ above: 1, label: "Showers" }] });
    expect(r.querySelector("ha-card")!.classList.contains("layout-poster")).toBe(true);
    const row = r.querySelector<HTMLElement>(".row")!;
    expect([...row.classList]).toEqual(expect.arrayContaining(["row", "wposter", "poster"]));
    expect(row.classList.contains("flow")).toBe(false);
    // the animated lead at the poster's size
    const lead = row.querySelector<HTMLElement>(":scope > .ptop > .plead > .lead.wlead")!;
    expect(lead.style.getPropertyValue("--lead")).toBe("40px");
    const pill = row.querySelector<HTMLElement>(".plabel")!;
    expect(pill.textContent).toBe("Showers");
    expect(pill.hidden).toBe(false);
    expect(row.querySelector(".pname")!.textContent).toBe("Roof");
    expect(row.querySelector(".pvalue .big b")!.textContent).toBe("2.4");
    expect(row.querySelector(".pvalue .big span")!.textContent).toBe("mm/h");
    // the secondary line: today's total, not the label (the pill has it)
    const sec = row.querySelector(".pbody > .secondary")!.textContent!;
    expect(sec).toContain("5.2 mm");
    expect(sec).not.toContain("Showers");
  });
  it("hides the pill without a matching rule", () => {
    const pill = mount({}).querySelector<HTMLElement>(".plabel")!;
    expect(pill.hidden).toBe(true);
  });
  it("with visual: flow puts the band behind the poster and the icon in the lead", () => {
    const r = mount({ visual: "flow" });
    const row = r.querySelector<HTMLElement>(".row.wposter")!;
    expect(row.classList.contains("flow")).toBe(true);
    expect(row.querySelector(":scope > .wflow.bg")).not.toBeNull();
    // the plain icon, not the animated lead (the band animates)
    expect(row.querySelector(".plead > .lead")).not.toBeNull();
    expect(row.querySelector(".plead .wlead")).toBeNull();
  });
});
