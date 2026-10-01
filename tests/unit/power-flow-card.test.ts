import { describe, it, expect } from "vitest";
import { PowerFlowCard } from "../../src/power-flow-card.ts";
import { leavesOf, normalizePowerFlowConfig } from "../../src/power-flow/config.ts";
import { collectTemplates } from "../../src/shared/entity/config.ts";
import { modelOf, type FormatCtx } from "../../src/shared/entity/model.ts";
import type { HomeAssistant } from "../../src/shared/ha.ts";
import {
  allocate,
  edgeColor,
  fmtPower,
  powerNow,
  sourceColor,
  summaryState,
  wattsOf,
} from "../../src/power-flow/model.ts";
import {
  arrowLength,
  duration,
  isActive,
  loadOf,
  needsRebuild,
  particles,
  rateOf,
  speed,
} from "../../src/power-flow/flow.ts";
import { arcPath, dedupe, orthoPath, pathLength, ringArcs } from "../../src/power-flow/path.ts";
import {
  acrossOf,
  alongDownOf,
  diagramHeight,
  laneOffsets,
  layoutTree,
} from "../../src/power-flow/layout.ts";
import { placeLabels } from "../../src/power-flow/labels.ts";
import { COLORS, DEFAULT_UNITS, GEOM } from "../../src/power-flow/constants.ts";
import { segmentsOf, type Pt } from "../../src/power-flow/path.ts";

const SRC = [
  { type: "solar", entity: "sensor.solar" },
  { type: "battery", power: "sensor.battery", soc: "sensor.soc" },
  { type: "grid", power: "sensor.grid", price: "sensor.price", offline: "binary_sensor.outage" },
];
const base = (extra: Record<string, unknown> = {}) =>
  normalizePowerFlowConfig({ home: "sensor.home", sources: SRC, ...extra });

// a hass with the given sensor states (W unless a unit is given) and the models the card renders from
const hassOf = (states: Record<string, string | [string, Record<string, unknown>]>) => {
  const st: Record<string, unknown> = {};
  for (const [id, v] of Object.entries(states)) {
    const [state, attrs] = Array.isArray(v) ? v : [v, {}];
    st[id] = {
      entity_id: id,
      state,
      attributes: { unit_of_measurement: id.startsWith("sensor.") ? "W" : undefined, ...attrs },
      last_changed: "2026-06-21T12:00:00Z",
      last_updated: "2026-06-21T12:00:00Z",
    };
  }
  return { states: st, locale: { language: "en" } } as unknown as HomeAssistant;
};
const modelsOf = (cfg: ReturnType<typeof base>, hass: HomeAssistant) => {
  const ctx: FormatCtx = { hass, tplResult: new Map() };
  return cfg.entities.map((e) => modelOf(ctx, e));
};
const flowsOf = (cfg: ReturnType<typeof base>, states: Parameters<typeof hassOf>[0]) => {
  const now = powerNow(cfg, modelsOf(cfg, hassOf(states)));
  return { now, f: allocate(cfg, now) };
};
const edge = (f: ReturnType<typeof allocate>, from: string, to: string) =>
  f.edges.find((e) => e.from === from && e.to === to);

describe("power-flow-card config", () => {
  it("is registered and needs sources", () => {
    expect(customElements.get("power-flow-card")).toBe(PowerFlowCard);
    expect(window.customCards?.some((c) => c.type === "power-flow-card")).toBe(true);
    expect(() => normalizePowerFlowConfig(null)).toThrow(/invalid config/);
    expect(() => normalizePowerFlowConfig({})).toThrow(/'sources' must be a non-empty list/);
    expect(() => normalizePowerFlowConfig({ sources: [] })).toThrow(/non-empty/);
    expect(() => normalizePowerFlowConfig({ sources: [{ type: "wind" }] })).toThrow(
      /type must be one of solar \| battery \| grid/,
    );
    expect(() => normalizePowerFlowConfig({ sources: [{ type: "solar" }] })).toThrow(
      /needs 'entity'/,
    );
    expect(() => normalizePowerFlowConfig({ sources: [{ type: "battery" }] })).toThrow(
      /'power' or both 'charge' and 'discharge'/,
    );
    expect(() =>
      normalizePowerFlowConfig({
        sources: [{ type: "battery", power: "sensor.b", charge: "sensor.c" }],
      }),
    ).toThrow(/'power' or both/);
    expect(() =>
      normalizePowerFlowConfig({ sources: [{ type: "grid", export: "sensor.e" }] }),
    ).toThrow(/'power' or 'import'/);
    expect(() =>
      normalizePowerFlowConfig({
        sources: [{ type: "grid", power: "sensor.g", fossil: "sensor.f", non_fossil: "sensor.n" }],
      }),
    ).toThrow(/'fossil' or 'non_fossil', not both/);
    expect(() => normalizePowerFlowConfig({ sources: SRC, home: 42 })).toThrow(/'home' must be/);
    expect(() => normalizePowerFlowConfig({ sources: SRC, direction: "up" })).toThrow(
      /direction must be one of right \| down/,
    );
    expect(() => normalizePowerFlowConfig({ sources: SRC, idle_links: "none" })).toThrow(
      /idle_links must be one of/,
    );
    expect(() =>
      normalizePowerFlowConfig({ sources: SRC, animation: { slow_below: 500, fast_above: 400 } }),
    ).toThrow(/fast_above must be greater than slow_below/);
    expect(() => normalizePowerFlowConfig({ sources: SRC, consumers: "x" })).toThrow(
      /'consumers' must be a list/,
    );
    expect(() =>
      normalizePowerFlowConfig({ sources: SRC, consumers: [{ group: "Room", entities: [] }] }),
    ).toThrow(/entities' must be a non-empty list/);
  });

  it("lays the home, the sources' items and the consumers out in one flat list", () => {
    const c = normalizePowerFlowConfig({
      title: "Energy",
      home: "sensor.home",
      sources: [
        { type: "solar", entity: "sensor.solar", name: "Roof" },
        { type: "battery", charge: "sensor.in", discharge: "sensor.out", soc: "sensor.soc" },
        {
          type: "grid",
          import: "sensor.imp",
          export: "sensor.exp",
          price: "sensor.price",
          offline: { entity: "binary_sensor.outage", state: "off" },
          generator: "sensor.gen",
          non_fossil: "sensor.green",
          invert: true,
        },
      ],
      consumers: [
        {
          group: "Laundry",
          icon: "mdi:washing-machine",
          entities: ["sensor.washer", "sensor.dryer"],
        },
        { entity: "sensor.ev", name: "EV", invert: true },
      ],
      header_entities: ["sensor.price"],
      rules: [{ above: 3000, color: "red", label: "Heavy", tint_card: true }],
    });
    expect(c.entities.map((e) => e.entity)).toEqual([
      "sensor.home",
      "sensor.solar",
      "sensor.in",
      "sensor.out",
      "sensor.soc",
      "sensor.imp",
      "binary_sensor.outage",
      "sensor.exp",
      "sensor.price",
      "sensor.gen",
      "sensor.green",
      "sensor.washer",
      "sensor.dryer",
      "sensor.ev",
      "sensor.price",
    ]);
    expect(c.homeIdx).toBe(0);
    expect(c.homeEntity).toBe(true);
    expect(c.entities[0].rules).toHaveLength(1);
    expect(c.entities[0].nameKey).toBe("power.home");
    expect(c.entities[1].name).toBe("Roof");
    expect(c.entities[1].nameKey).toBe("power.solar");
    expect(c.sources).toEqual([
      { kind: "solar", idx: 1 },
      { kind: "battery", idx: 2, secondIdx: 3, socIdx: 4, invert: false },
      {
        kind: "grid",
        idx: 5,
        secondIdx: 7,
        priceIdx: 8,
        offlineIdx: 6,
        offlineState: "off",
        generatorIdx: 9,
        fossilIdx: 10,
        fossilKind: "non_fossil",
        invert: true,
      },
    ]);
    expect(c.consumers).toEqual([
      {
        kind: "group",
        id: "g0",
        name: "Laundry",
        icon: "mdi:washing-machine",
        items: [
          { kind: "item", id: "c0.0", idx: 11, invert: false },
          { kind: "item", id: "c0.1", idx: 12, invert: false },
        ],
      },
      { kind: "item", id: "c1", idx: 13, invert: true },
      { kind: "other", id: "other" },
    ]);
    expect(leavesOf(c).map((l) => l.id)).toEqual(["c0.0", "c0.1", "c1", "other"]);
    expect(c.hasGroups).toBe(true);
    expect(c.headerIdxs).toEqual([14]);
    expect(c.hasHeader).toBe(true);
    // every item is drawn by the tree: never a history visual
    expect(c.entities.every((e) => e.visual === "icon")).toBe(true);
  });

  it("computes the home when none is given and keeps the rules on it", () => {
    const c = normalizePowerFlowConfig({
      sources: SRC,
      rules: [{ below: 500, color: "green", label: "Quiet" }],
    });
    expect(c.homeEntity).toBe(false);
    expect(c.entities[0].entity).toBeNull();
    expect(c.entities[0].valueSrc).toEqual({ kind: "text", text: "0" });
    expect(c.entities[0].rules[0].label).toBe("Quiet");
    expect(c.entities[0].tap).toEqual({ action: "none" });
    expect(c.consumers).toEqual([]);
    // a home object without a sensor: computed, with its own name, icon and rules
    const looks = normalizePowerFlowConfig({
      sources: SRC,
      home: { name: "House", icon: "mdi:home-city", rules: [{ above: 0, color: "teal" }] },
    });
    expect(looks.homeEntity).toBe(false);
    expect(looks.entities[0]).toMatchObject({ name: "House", icon: "mdi:home-city" });
    expect(looks.entities[0].rules[0].color).toBe("teal");
  });

  it("offers a stub the card accepts whatever the home has", () => {
    const hass = (states: Record<string, unknown>) => ({ states }) as unknown as HomeAssistant;
    const st = (dc?: string) => ({ attributes: dc ? { device_class: dc } : {} });
    for (const h of [
      hass({ "sensor.solar_roof": st("power"), "sensor.house": st("power") }),
      hass({ "sensor.house": st("power") }),
      hass({ "sensor.temp": st("temperature") }),
      hass({}),
      undefined,
    ])
      expect(() => normalizePowerFlowConfig(PowerFlowCard.getStubConfig(h))).not.toThrow();
    const full = PowerFlowCard.getStubConfig(
      hass({ "sensor.solar_roof": st("power"), "sensor.house": st("power") }),
    );
    expect(full).toMatchObject({
      home: "sensor.house",
      sources: [{ type: "solar", entity: "sensor.solar_roof" }],
    });
  });

  it("defaults and clamps the options", () => {
    expect(base()).toMatchObject({
      direction: "right",
      flowStyle: "dots",
      consumerStyle: "nodes",
      idleLinks: "dashed",
      expensiveAbove: null,
      units: DEFAULT_UNITS,
      animation: { slowBelow: 0, fastAbove: 3600 },
      hasGroups: false,
      layout: "hero",
    });
    expect(
      base({
        direction: "down",
        flow_style: "arrows",
        consumer_style: "list",
        idle_links: "hidden",
        expensive_above: 0.35,
        kw_above: 0,
        decimals: 1,
        animation: { fast_above: 800 },
      }),
    ).toMatchObject({
      direction: "down",
      flowStyle: "arrows",
      consumerStyle: "list",
      idleLinks: "hidden",
      expensiveAbove: 0.35,
      units: { kwAbove: 0, decW: 1, decKw: 1 },
      animation: { slowBelow: 0, fastAbove: 800 },
    });
    expect(base({ decimals: { w: 5, kw: -1 } }).units).toEqual({
      kwAbove: 1000,
      decW: 3,
      decKw: 0,
    });
    // "other" is on with consumers and can be switched off
    expect(base({ consumers: ["sensor.a"] }).consumers.map((c) => c.kind)).toEqual([
      "item",
      "other",
    ]);
    expect(base({ consumers: ["sensor.a"], other: false }).consumers.map((c) => c.kind)).toEqual([
      "item",
    ]);
  });

  it("collects the templates of names and secondary lines", () => {
    const c = base({
      title: "{{ states('sensor.x') }}",
      consumers: [{ entity: "sensor.a", secondary: "{{ states('sensor.t') }} °C" }],
    });
    expect([...collectTemplates(c)]).toEqual([
      "{{ states('sensor.x') }}",
      "{{ states('sensor.t') }} °C",
    ]);
  });
});

describe("power flow numbers", () => {
  it("reads watts whatever the unit", () => {
    const cfg = base();
    const hass = hassOf({
      "sensor.solar": ["3.4", { unit_of_measurement: "kW" }],
      "sensor.home": "850",
    });
    const models = modelsOf(cfg, hass);
    expect(wattsOf(cfg.entities[1], models[1])).toBe(3400);
    expect(wattsOf(cfg.entities[0], models[0])).toBe(850);
    expect(wattsOf(cfg.entities[2], models[2])).toBeNull(); // no state: unavailable
  });

  it("covers the home with solar first, then the battery, then the grid", () => {
    const cfg = base();
    // noon: solar covers the home, charges the battery and exports the rest
    const noon = flowsOf(cfg, {
      "sensor.solar": "4200",
      "sensor.home": "1300",
      "sensor.battery": "-1500",
      "sensor.grid": "-1400",
      "sensor.soc": "58",
    });
    expect(noon.f).toMatchObject({
      S: 4200,
      H: 1300,
      B: -1500,
      sH: 1300,
      bH: 0,
      gH: 0,
      sB: 1500,
      sG: 1400,
      gB: 0,
      bG: 0,
      grid: -1400,
    });
    expect(noon.f.selfSufficiency).toBe(1);
    expect(edge(noon.f, "s0", "home")?.w).toBe(1300);
    expect(edge(noon.f, "s0", "s1")).toMatchObject({ w: 1500, kind: "battIn" });
    expect(edge(noon.f, "s0", "s2")).toMatchObject({ w: 1400, kind: "gridOut" });
    // evening: the battery covers the home, the grid is idle
    const evening = flowsOf(cfg, {
      "sensor.solar": "0",
      "sensor.home": "2100",
      "sensor.battery": "1600",
      "sensor.grid": "500",
    });
    expect(evening.f).toMatchObject({ sH: 0, bH: 1600, gH: 500, sB: 0, bG: 0 });
    expect(evening.f.selfSufficiency).toBeCloseTo(1600 / 2100, 5);
    // night: the grid runs the home and charges the battery
    const night = flowsOf(cfg, {
      "sensor.solar": "0",
      "sensor.home": "600",
      "sensor.battery": "-1000",
      "sensor.grid": "1600",
    });
    expect(night.f).toMatchObject({ gH: 600, gB: 1000, bH: 0 });
    expect(edge(night.f, "s2", "s1")).toMatchObject({ w: 1000, kind: "battIn" });
    expect(night.f.selfSufficiency).toBe(0);
  });

  it("computes the home from the sources when none is given", () => {
    const cfg = normalizePowerFlowConfig({ sources: SRC });
    const { f } = flowsOf(cfg, {
      "sensor.solar": "3400",
      "sensor.battery": "-1200",
      "sensor.grid": "-960",
    });
    expect(f.H).toBe(1240);
    expect(f.sH).toBe(1240);
  });

  it("splits several arrays and batteries pro rata", () => {
    const cfg = normalizePowerFlowConfig({
      home: "sensor.home",
      sources: [
        { type: "solar", entity: "sensor.east" },
        { type: "solar", entity: "sensor.west" },
        { type: "battery", power: "sensor.b1" },
        { type: "battery", power: "sensor.b2" },
        { type: "grid", power: "sensor.grid" },
      ],
    });
    const { f } = flowsOf(cfg, {
      "sensor.east": "3000",
      "sensor.west": "1000",
      "sensor.home": "2000",
      "sensor.b1": "-600",
      "sensor.b2": "-200",
      "sensor.grid": "-1200",
    });
    expect(edge(f, "s0", "home")?.w).toBeCloseTo(1500);
    expect(edge(f, "s1", "home")?.w).toBeCloseTo(500);
    expect(edge(f, "s0", "s2")?.w).toBeCloseTo(450); // 800 charging × 3/4 solar × 3/4 battery
    expect(edge(f, "s1", "s3")?.w).toBeCloseTo(50);
    expect(edge(f, "s0", "s4")?.w).toBeCloseTo(900);
  });

  it("stops every grid flow during an outage unless a generator runs", () => {
    const cfg = base();
    const off = flowsOf(cfg, {
      "sensor.solar": "900",
      "sensor.home": "2300",
      "sensor.battery": "1400",
      "sensor.grid": "700",
      "binary_sensor.outage": "on",
    });
    expect(off.now.offline).toBe(true);
    expect(off.f).toMatchObject({ sH: 900, bH: 1400, gH: 0, sG: 0, gB: 0, bG: 0, grid: 0 });
    expect(summaryState(cfg, off.now, off.f)).toMatchObject({
      key: "power.state.offline_battery",
      tint: true,
      color: COLORS.offline,
    });
    expect(sourceColor(off.now.sources[2], true)).toBe(COLORS.offline);
    const gen = normalizePowerFlowConfig({
      home: "sensor.home",
      sources: [SRC[0], SRC[1], { ...SRC[2], generator: "sensor.gen" }],
    });
    const on = flowsOf(gen, {
      "sensor.solar": "400",
      "sensor.home": "2600",
      "sensor.battery": "0",
      "sensor.grid": "0",
      "binary_sensor.outage": "on",
      "sensor.gen": "2200",
    });
    expect(on.now.sources[2]).toMatchObject({ generator: true, w: 2200 });
    expect(on.f).toMatchObject({ sH: 400, gH: 2200, gHGen: 2200, sG: 0 });
    expect(edge(on.f, "s2", "home")).toMatchObject({ w: 2200, kind: "generator" });
    expect(summaryState(gen, on.now, on.f)).toMatchObject({
      key: "power.state.generator",
      tint: true,
      color: COLORS.generator,
    });
    expect(sourceColor(on.now.sources[2], true)).toBe(COLORS.generator);
    expect(edgeColor("generator")).toBe(COLORS.generator);
  });

  it("names what the home runs on during an outage", () => {
    const cfg = base();
    const state = (states: Parameters<typeof hassOf>[0]) => {
      const { now, f } = flowsOf(cfg, { "binary_sensor.outage": "on", ...states });
      return summaryState(cfg, now, f).key;
    };
    expect(state({ "sensor.solar": "0", "sensor.home": "800", "sensor.battery": "800" })).toBe(
      "power.state.offline_battery",
    );
    expect(state({ "sensor.solar": "900", "sensor.home": "800", "sensor.battery": "0" })).toBe(
      "power.state.offline_solar",
    );
    expect(state({ "sensor.solar": "0", "sensor.home": "800", "sensor.battery": "0" })).toBe(
      "power.state.offline",
    );
    // a card without a battery never claims to run on one
    const solarGrid = normalizePowerFlowConfig({ home: "sensor.home", sources: [SRC[0], SRC[2]] });
    const { now, f } = flowsOf(solarGrid, {
      "binary_sensor.outage": "on",
      "sensor.solar": "0",
      "sensor.home": "500",
    });
    expect(summaryState(solarGrid, now, f).key).toBe("power.state.offline");
  });

  it("gives an allocated flow to the links of its kind even when their sensors say nothing", () => {
    const cfg = base();
    // the grid sensor is unavailable: the home sensor implies 500 W of import, all on the grid link
    const a = flowsOf(cfg, {
      "sensor.solar": "0",
      "sensor.home": "2100",
      "sensor.battery": "1600",
    });
    expect(a.f.gH).toBe(500);
    expect(edge(a.f, "s2", "home")?.w).toBe(500);
    const b = flowsOf(cfg, {
      "sensor.solar": "0",
      "sensor.home": "600",
      "sensor.battery": "-1000",
    });
    expect(edge(b.f, "s2", "s1")?.w).toBe(1000);
    expect(edge(b.f, "s2", "home")?.w).toBe(600);
    const c = flowsOf(cfg, {
      "sensor.solar": "3000",
      "sensor.home": "1000",
      "sensor.battery": "0",
    });
    expect(edge(c.f, "s0", "s2")?.w).toBe(2000);
  });

  it("lets one battery charge another", () => {
    const cfg = normalizePowerFlowConfig({
      home: "sensor.home",
      sources: [
        { type: "solar", entity: "sensor.solar" },
        { type: "battery", power: "sensor.b1" },
        { type: "battery", power: "sensor.b2" },
        { type: "grid", power: "sensor.grid" },
      ],
    });
    const { f } = flowsOf(cfg, {
      "sensor.solar": "0",
      "sensor.home": "500",
      "sensor.b1": "1000",
      "sensor.b2": "-500",
      "sensor.grid": "0",
    });
    expect(f).toMatchObject({ bH: 500, dB: 500, gH: 0, sB: 0, gB: 0, bG: 0 });
    expect(edge(f, "s1", "home")?.w).toBe(500);
    expect(edge(f, "s1", "s2")).toMatchObject({ w: 500, kind: "battIn" });
    expect(edge(f, "s2", "home")?.w).toBe(0);
    // every link of a battery adds up to its label
    const out = f.edges.filter((e) => e.from === "s1").reduce((a, e) => a + e.w, 0);
    expect(out).toBe(1000);
  });

  it("reads the grid's low-carbon share from a fossil or a non-fossil percentage", () => {
    const fossil = normalizePowerFlowConfig({
      home: "sensor.home",
      sources: [SRC[0], { type: "grid", power: "sensor.grid", fossil: "sensor.f" }],
    });
    const a = flowsOf(fossil, {
      "sensor.solar": "0",
      "sensor.home": "1000",
      "sensor.grid": "1000",
      "sensor.f": ["38", { unit_of_measurement: "%" }],
    });
    expect(a.now.sources[1].lowCarbon).toBeCloseTo(0.62);
    expect(a.f.gHClean).toBeCloseTo(620);
    const green = normalizePowerFlowConfig({
      home: "sensor.home",
      sources: [SRC[0], { type: "grid", power: "sensor.grid", non_fossil: "sensor.n" }],
    });
    const b = flowsOf(green, {
      "sensor.solar": "0",
      "sensor.home": "1000",
      "sensor.grid": "1000",
      "sensor.n": ["25", { unit_of_measurement: "%" }],
    });
    expect(b.now.sources[1].lowCarbon).toBe(0.25);
    expect(b.f.gHClean).toBe(250);
  });

  it("gives consumers their watts, rooms their sum and the rest to other; a producer flows back", () => {
    const cfg = normalizePowerFlowConfig({
      home: "sensor.home",
      sources: SRC,
      consumers: [
        { group: "Laundry", entities: ["sensor.washer", "sensor.dryer"] },
        { entity: "sensor.ev" },
        { entity: "sensor.plug", invert: true },
      ],
    });
    const { now, f } = flowsOf(cfg, {
      "sensor.solar": "0",
      "sensor.home": "2000",
      "sensor.battery": "0",
      "sensor.grid": "2000",
      "sensor.washer": "300",
      "sensor.dryer": "200",
      "sensor.ev": "-1500",
      "sensor.plug": "-400",
    });
    expect(now.leaves.get("c1")).toBe(-1500);
    expect(now.leaves.get("c2")).toBe(400); // inverted
    expect(f.groupW.get("g0")).toBe(500);
    expect(f.leafW.get("other")).toBe(2000 - 500 - 400); // a producer counts for nothing
    expect(edge(f, "home", "c1")?.w).toBe(-1500);
    expect(edge(f, "g0", "c0.0")?.w).toBe(300);
    expect(edgeColor("home", -1500)).toBe(COLORS.solar);
    expect(edgeColor("home", 300)).toBe(COLORS.home);
  });

  it("names the state in order: offline, expensive, exporting, on battery, importing, balanced", () => {
    const cfg = base({ expensive_above: 0.35 });
    const state = (states: Parameters<typeof hassOf>[0]) => {
      const { now, f } = flowsOf(cfg, states);
      return summaryState(cfg, now, f);
    };
    expect(
      state({
        "sensor.solar": "0",
        "sensor.home": "2600",
        "sensor.battery": "0",
        "sensor.grid": "2600",
        "sensor.price": ["0.41", { unit_of_measurement: "€/kWh" }],
      }),
    ).toMatchObject({ key: "power.state.expensive", tint: true });
    expect(
      state({
        "sensor.solar": "0",
        "sensor.home": "2600",
        "sensor.battery": "0",
        "sensor.grid": "2600",
        "sensor.price": ["0.20", { unit_of_measurement: "€/kWh" }],
      }),
    ).toMatchObject({ key: "power.state.importing", w: 2600, tint: false });
    expect(
      state({
        "sensor.solar": "5100",
        "sensor.home": "900",
        "sensor.battery": "0",
        "sensor.grid": "-4200",
      }),
    ).toMatchObject({ key: "power.state.exporting", w: 4200, color: COLORS.gridOut });
    expect(
      state({
        "sensor.solar": "0",
        "sensor.home": "1650",
        "sensor.battery": "1600",
        "sensor.grid": "50",
      }),
    ).toMatchObject({ key: "power.state.battery", color: COLORS.battOut });
    expect(
      state({
        "sensor.solar": "1000",
        "sensor.home": "1000",
        "sensor.battery": "0",
        "sensor.grid": "0",
      }),
    ).toMatchObject({ key: "power.state.balanced", color: COLORS.balanced });
  });

  it("formats watts and kilowatts by the card's units", () => {
    expect(fmtPower(undefined, 850)).toBe("850 W");
    expect(fmtPower(undefined, 999.6)).toBe("1,000 W");
    expect(fmtPower(undefined, 1000)).toBe("1.00 kW");
    expect(fmtPower(undefined, -1234)).toBe("1.23 kW");
    expect(fmtPower(undefined, null)).toBe("–");
    expect(fmtPower(undefined, 850, { kwAbove: 0, decW: 0, decKw: 1 })).toBe("0.9 kW");
    expect(fmtPower(undefined, 1500, { kwAbove: 2000, decW: 1, decKw: 2 })).toBe("1,500.0 W");
    expect(fmtPower(undefined, 1500, DEFAULT_UNITS, 0)).toBe("2 kW"); // an entity's decimals win
  });
});

describe("power flow animation", () => {
  it("is idle below 20 W either way and reads the load against the bounds", () => {
    expect(isActive(19)).toBe(false);
    expect(isActive(20)).toBe(true);
    expect(isActive(-300)).toBe(true);
    expect(loadOf(0)).toBe(0);
    expect(loadOf(1800)).toBeCloseTo(0.5);
    expect(loadOf(9000)).toBe(1);
    expect(loadOf(600, { slowBelow: 200, fastAbove: 1000 })).toBeCloseTo(0.5);
    expect(speed(0)).toBe(22);
    expect(speed(3600)).toBe(172);
    expect(speed(1000, { slowBelow: 0, fastAbove: 800 })).toBe(172);
  });
  it("counts particles by length and load, times a crossing and re-times a running lane", () => {
    expect(particles(45, 0)).toBe(1);
    expect(particles(450, 3600)).toBe(10);
    expect(particles(2000, 3600)).toBe(10);
    expect(particles(180, 1800)).toBe(Math.round(4 * 0.625));
    expect(duration(172, 3600)).toBe(1);
    expect(duration(5, 3600)).toBe(0.5);
    expect(rateOf(3600, 0)).toBeCloseTo(172 / 22);
    expect(rateOf(500, 500)).toBe(1);
    expect(arrowLength(0)).toBe(9);
    expect(arrowLength(3600)).toBe(16);
    expect(needsRebuild(4, 5)).toBe(false);
    expect(needsRebuild(4, 6)).toBe(true);
  });
});

describe("power flow paths", () => {
  it("draws orthogonal lines with rounded corners that shrink on short legs", () => {
    const pts: Pt[] = [
      [0, 0],
      [50, 0],
      [50, 40],
      [100, 40],
    ];
    const d = orthoPath(pts, 12);
    expect(d).toBe("M0 0 L38 0 Q50 0 50 12 L50 28 Q50 40 62 40 L100 40");
    expect(d).not.toMatch(/C|A/);
    expect(
      orthoPath(
        [
          [0, 0],
          [100, 0],
        ],
        12,
      ),
    ).toBe("M0 0 L100 0");
    // a 6 px leg allows only a 3 px radius
    expect(
      orthoPath(
        [
          [0, 0],
          [6, 0],
          [6, 40],
        ],
        12,
      ),
    ).toBe("M0 0 L3 0 Q6 0 6 3 L6 40");
    expect(pathLength(pts)).toBe(140);
    expect(segmentsOf(pts)).toHaveLength(3);
  });
  it("drops repeated and collinear points", () => {
    expect(
      dedupe([
        [0, 0],
        [10, 0],
        [10, 0],
        [20, 0],
        [20, 5],
      ]),
    ).toEqual([
      [0, 0],
      [20, 0],
      [20, 5],
    ]);
  });
  it("splits a ring into arcs with a gap, one full arc without", () => {
    const one = ringArcs([1, 0, 0], 20);
    expect(one).toHaveLength(1);
    expect(one[0].a1 - one[0].a0).toBeCloseTo(2 * Math.PI);
    expect(arcPath(20, 20, 18, one[0].a0, one[0].a1)).toMatch(
      /^M20 2 A18 18 0 1 1 20 38 A18 18 0 1 1 20 2$/,
    );
    const three = ringArcs([0.5, 0.25, 0.25], 20);
    expect(three.map((a) => a.i)).toEqual([0, 1, 2]);
    const gap = 2.2 / 20;
    expect(three[0].a1 - three[0].a0).toBeCloseTo(Math.PI - gap);
    expect(three[1].a0).toBeCloseTo(Math.PI + gap / 2);
    expect(ringArcs([0.001, 0.999], 20).map((a) => a.i)).toEqual([1]);
  });
});

// every pair of segments of two different edges must not cross
const crossings = (edges: { pts: Pt[] }[]) => {
  const segs = edges.flatMap((e, k) => segmentsOf(e.pts).map((s) => ({ s, k })));
  let n = 0;
  for (const a of segs)
    for (const b of segs) {
      if (a.k >= b.k) continue;
      const [p, q] = a.s,
        [r, t] = b.s;
      const horizA = p[1] === q[1],
        horizB = r[1] === t[1];
      if (horizA === horizB) continue; // parallel legs never cross
      const [h, v] = horizA ? [a.s, b.s] : [b.s, a.s];
      const y = h[0][1],
        x = v[0][0];
      const inX = x > Math.min(h[0][0], h[1][0]) && x < Math.max(h[0][0], h[1][0]);
      const inY = y > Math.min(v[0][1], v[1][1]) && y < Math.max(v[0][1], v[1][1]);
      if (inX && inY) n++;
    }
  return n;
};

describe("power flow layout", () => {
  it("gives the nearest source the inner lane and the others their side", () => {
    expect(laneOffsets([34, 95, 156], 95)).toEqual([-8, 0, 8]);
    expect(laneOffsets([20, 60, 100, 140], 80)).toEqual([-8, 0, 8, 16]); // a tie: the upper one is nearer
    expect(laneOffsets([95], 95)).toEqual([0]);
  });

  it("sizes the diagram from the config, never from the width", () => {
    // every source owns a label slot: 42 margin, then 22 + 20 + 6 + 16 and 20 + 22 + 6 + 16
    const three = base();
    expect(acrossOf(three)).toBe(42 + 64 + 64 + 42);
    expect(diagramHeight(three)).toBe(212);
    const five = normalizePowerFlowConfig({
      sources: [
        ...SRC,
        { type: "solar", entity: "sensor.b" },
        { type: "solar", entity: "sensor.c" },
      ],
    });
    expect(acrossOf(five)).toBe(42 + 64 + 64 + 66 + 66 + 42); // two 44 px nodes in a row: 66
    const withSecondary = normalizePowerFlowConfig({
      sources: [{ ...SRC[0], secondary: "roof" }, SRC[1], SRC[2]],
    });
    // a secondary line on the solar label needs no extra pitch below it; one on the battery would
    expect(acrossOf(withSecondary)).toBe(Math.ceil(51 + 64 + 64 + 42)); // a taller first margin
    const batterySecondary = normalizePowerFlowConfig({
      sources: [SRC[0], { ...SRC[1], secondary: "x" }, SRC[2]],
    });
    expect(acrossOf(batterySecondary)).toBe(42 + 75 + 64 + 42); // 22 + 2 + 27.5 + 23.5 above it
    const cons = base({ consumers: ["sensor.a", "sensor.b", "sensor.c", "sensor.d"] }); // + other
    expect(acrossOf(cons)).toBe(34 + 4 * GEOM.consumerPitch + 30); // 32 px nodes, 28 px labels
    const rooms = base({
      consumers: [{ group: "A", entities: ["sensor.a", "sensor.b"] }, "sensor.c"],
    });
    // the first room's label above it (52), devices 44 apart, a room gap of 22 between blocks
    expect(acrossOf(rooms)).toBe(52 + 46 + (52 + 22) + (54 + 22) + 30); // … then the other node
    expect(alongDownOf(three)).toBe(GEOM.minAcross);
    expect(alongDownOf(cons)).toBe(GEOM.srcAlong + 2 * GEOM.columnPitch + 56);
    expect(diagramHeight(base({ direction: "down", consumers: ["sensor.a"] }))).toBe(
      alongDownOf(cons),
    );
    for (const w of [300, 416, 980]) {
      const l = layoutTree(
        three,
        w,
        allocate(three, powerNow(three, modelsOf(three, hassOf({})))).edges,
      );
      expect(l.w).toBe(w);
      expect(l.h).toBe(212);
    }
  });

  it("places the columns and ends every line on a node's edge", () => {
    const cfg = base({ consumers: ["sensor.a", "sensor.b"] });
    const { f } = flowsOf(cfg, {
      "sensor.solar": "3000",
      "sensor.home": "2000",
      "sensor.battery": "500",
      "sensor.grid": "-1500",
      "sensor.a": "600",
      "sensor.b": "400",
    });
    const l = layoutTree(cfg, 416, f.edges);
    const node = (id: string) => l.nodes.find((n) => n.id === id)!;
    expect(node("s0").x).toBe(GEOM.srcAlong);
    expect(node("home")).toMatchObject({ x: 208, y: acrossOf(cfg) / 2, d: GEOM.dHome });
    expect(node("c0").x).toBe(416 - GEOM.dConsumer / 2 - 14);
    expect(node("other").kind).toBe("other");
    expect(l.edges).toHaveLength(f.edges.length);
    for (const e of l.edges) {
      const from = node(e.from),
        to = node(e.to);
      const [a, b] = [e.pts[0], e.pts[e.pts.length - 1]];
      expect(Math.hypot(a[0] - from.x, a[1] - from.y)).toBeCloseTo(from.d / 2, 5);
      if (e.to === "home") {
        // a lane into the home enters on its own lane, up to two lanes off the centre line
        expect(b[0]).toBe(to.x - to.d / 2);
        expect(Math.abs(b[1] - to.y)).toBeLessThanOrEqual(2 * GEOM.lane);
      } else expect(Math.hypot(b[0] - to.x, b[1] - to.y)).toBeCloseTo(to.d / 2, 5);
      expect(e.len).toBeGreaterThan(0);
      expect(e.d).toMatch(/^M/);
    }
    // rails run behind the source column; lanes into the home never cross each other
    const rail = l.edges.find((e) => e.kind === "battIn")!;
    expect(rail.pts.some((p) => p[0] === GEOM.railBattery)).toBe(true);
    const lanes = l.edges.filter((e) => e.to === "home");
    expect(crossings(lanes)).toBe(0);
  });

  it("keeps the lanes into the home free of crossings for many sources", () => {
    for (let n = 1; n <= 6; n++) {
      const sources = Array.from({ length: n }, (_, i) => ({
        type: "solar",
        entity: `sensor.s${i}`,
      }));
      const cfg = normalizePowerFlowConfig({ sources, home: "sensor.home" });
      const states: Record<string, string> = { "sensor.home": "5000" };
      sources.forEach((s) => (states[s.entity] = "1000"));
      const { f } = flowsOf(cfg, states);
      const l = layoutTree(cfg, 416, f.edges);
      expect(crossings(l.edges.filter((e) => e.to === "home"))).toBe(0);
    }
  });

  it("turns the tree for direction: down and puts lone consumers beside the rooms", () => {
    const cfg = base({ direction: "down", consumers: ["sensor.a"] });
    const { f } = flowsOf(cfg, { "sensor.home": "1000", "sensor.a": "300" });
    const l = layoutTree(cfg, 400, f.edges);
    const node = (id: string) => l.nodes.find((n) => n.id === id)!;
    expect(l.w).toBe(400);
    expect(l.h).toBe(alongDownOf(cfg));
    expect(node("s0").y).toBe(GEOM.srcAlong);
    expect(node("home")).toMatchObject({ x: 200, y: GEOM.srcAlong + GEOM.columnPitch });
    expect(node("c0").y).toBeGreaterThan(node("home").y);
    const rooms = base({ consumers: [{ group: "A", entities: ["sensor.a"] }, "sensor.b"] });
    const lr = layoutTree(
      rooms,
      416,
      allocate(rooms, powerNow(rooms, modelsOf(rooms, hassOf({})))).edges,
    );
    const g = lr.nodes.find((n) => n.id === "g0")!,
      lone = lr.nodes.find((n) => n.id === "c1")!,
      device = lr.nodes.find((n) => n.id === "c0.0")!;
    expect(lone.x).toBe(g.x);
    expect(lone.column).toBe("group");
    expect(device.x).toBeGreaterThan(g.x);
    expect(device.d).toBe(GEOM.dDevice);
    // list rows start at the row column, a lone consumer's row at the room column
    const list = base({
      consumers: [{ group: "A", entities: ["sensor.a"] }, "sensor.b"],
      consumer_style: "list",
    });
    const ll = layoutTree(
      list,
      416,
      allocate(list, powerNow(list, modelsOf(list, hassOf({})))).edges,
    );
    expect(ll.rows.map((r) => r.id)).toEqual(["c0.0", "c1", "other"]);
    expect(ll.rows[1].x).toBeLessThan(ll.rows[0].x);
    expect(ll.rows[0].w).toBe(416 - ll.rows[0].x);
  });
});

describe("power flow labels", () => {
  it("places every label off the lines, nodes and other labels, inside the diagram", () => {
    const cfg = base({ consumers: ["sensor.a", "sensor.b", "sensor.c"] });
    const { f } = flowsOf(cfg, {
      "sensor.solar": "3400",
      "sensor.home": "1240",
      "sensor.battery": "-1200",
      "sensor.grid": "-960",
      "sensor.a": "430",
      "sensor.b": "290",
      "sensor.c": "170",
    });
    const l = layoutTree(cfg, 416, f.edges);
    const small = (n: { kind: string }) => n.kind === "consumer" || n.kind === "other";
    const sizes = l.nodes.map((n) => ({ id: n.id, w: small(n) ? 50 : 70, h: small(n) ? 28 : 32 }));
    const placed = placeLabels(l, sizes, "right");
    expect(placed).toHaveLength(sizes.length);
    const box = (p: (typeof placed)[number]): [number, number, number, number] => {
      const left = p.align === "l" ? p.x : p.align === "r" ? p.x - p.w : p.x - p.w / 2;
      const top = p.align === "c" ? p.y : p.y - p.h / 2;
      return [left, top, left + p.w, top + p.h];
    };
    const hit = (a: number[], b: number[]) =>
      a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
    for (const p of placed) {
      const b = box(p);
      expect(b[0]).toBeGreaterThanOrEqual(-2);
      expect(b[2]).toBeLessThanOrEqual(l.w + 2);
      for (const n of l.nodes)
        expect(hit(b, [n.x - n.d / 2, n.y - n.d / 2, n.x + n.d / 2, n.y + n.d / 2])).toBe(false);
      for (const q of placed) if (q !== p) expect(hit(b, box(q))).toBe(false);
    }
    // sources and the home are placed first and take their preferred side
    expect(placed.find((p) => p.id === "home")?.align).toBe("c");
    expect(placed.find((p) => p.id === "s0")?.align).toBe("l");
  });

  it("uses the room of hidden idle links", () => {
    const cfg = base();
    const { f } = flowsOf(cfg, {
      "sensor.solar": "0",
      "sensor.home": "1000",
      "sensor.grid": "1000",
    });
    const l = layoutTree(cfg, 416, f.edges);
    const nd = l.nodes.find((n) => n.id === "s1")!;
    // an idle link drawn right through the battery's slot (right of the node, above its line)
    const slotY = nd.y - nd.d / 2 - 4;
    const fake = {
      ...l.edges[0],
      id: "x",
      pts: [
        [nd.x + nd.d / 2 + 10, slotY],
        [nd.x + 120, slotY],
      ] as Pt[],
    };
    const withFake = { ...l, edges: [...l.edges, fake] };
    const sizes = l.nodes.map((n) => ({ id: n.id, w: 90, h: 32 }));
    const battery = (p: ReturnType<typeof placeLabels>) => p.find((x) => x.id === "s1")!;
    const drawn = battery(placeLabels(withFake, sizes, "right"));
    const hidden = battery(placeLabels(withFake, sizes, "right", new Set(["x"])));
    expect(hidden).toMatchObject({ align: "l", x: nd.x + nd.d / 2 + GEOM.labelGap, y: slotY });
    expect([drawn.x, drawn.y, drawn.align]).not.toEqual([hidden.x, hidden.y, hidden.align]);
  });
});
