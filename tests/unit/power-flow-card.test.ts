import { describe, it, expect } from "vitest";
import { PowerFlowCard } from "../../src/power-flow-card.ts";
import {
  hiddenNodes,
  leavesOf,
  nodeSize,
  twoValued,
  viewConfig,
} from "../../src/shared/flow-tree/config.ts";
import { normalizePowerFlowConfig } from "../../src/power-flow/config.ts";
import type { Visibility } from "../../src/shared/visibility.ts";
import { collectTemplates } from "../../src/shared/entity/config.ts";
import { modelOf, type FormatCtx } from "../../src/shared/entity/model.ts";
import type { HomeAssistant } from "../../src/shared/ha.ts";
import {
  allocate,
  fmtPower,
  isPowerUnit,
  powerNow,
  summaryState,
  wattsOf,
} from "../../src/power-flow/model.ts";
import {
  type EdgeFlow,
  thresholdShown,
  bothFlows,
  edgeColor,
  fmtIn,
  shareOfMax,
  sourceColor,
  treeUnit,
} from "../../src/shared/flow-tree/model.ts";
import {
  arrowLength,
  duration,
  isActive,
  loadOf,
  needsRebuild,
  particles,
  rateOf,
  speed,
} from "../../src/shared/flow-tree/flow.ts";
import {
  arcPath,
  dedupe,
  orthoPath,
  pathLength,
  ringArcs,
} from "../../src/shared/flow-tree/path.ts";
import {
  acrossOf,
  alongDownOf,
  diagramHeight,
  labelHeightOf,
  laneOffsets,
  layoutTree,
  ringWidth,
  sourceRow,
} from "../../src/shared/flow-tree/layout.ts";
import { placeLabels, type PlacedLabel } from "../../src/shared/flow-tree/labels.ts";
import { COLORS, GEOM } from "../../src/shared/flow-tree/constants.ts";
import { DEFAULT_UNITS } from "../../src/power-flow/constants.ts";
import { segmentsOf, type Pt } from "../../src/shared/flow-tree/path.ts";

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
    expect(customElements.get("power-flow-card-pro")).toBe(PowerFlowCard);
    expect(window.customCards?.some((c) => c.type === "power-flow-card-pro")).toBe(true);
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
    expect(() =>
      normalizePowerFlowConfig({
        sources: [{ type: "battery", power: "sensor.b", charge_from: "grid" }],
      }),
    ).toThrow(/charge_from must be one of any \| solar/);
    expect(
      normalizePowerFlowConfig({
        sources: [{ type: "battery", power: "sensor.b", charge_from: "solar" }],
      }).sources[0],
    ).toMatchObject({ kind: "battery", chargeFrom: "solar" });
    expect(
      normalizePowerFlowConfig({ sources: [{ type: "solar", entity: "sensor.s", peak: 6800 }] })
        .sources[0],
    ).toMatchObject({ kind: "solar", peak: 6800 });
    expect(normalizePowerFlowConfig({ sources: SRC }).sources[0]).toMatchObject({ peak: null });
    for (const peak of [0, -1, "lots"])
      expect(() =>
        normalizePowerFlowConfig({ sources: [{ type: "solar", entity: "sensor.s", peak }] }),
      ).toThrow(/peak must be a number of watts above 0/);
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
      { id: "s0", d: 44, visibility: null, kind: "solar", idx: 1, peak: null },
      {
        id: "s1",
        d: 40,
        visibility: null,
        kind: "battery",
        idx: 2,
        secondIdx: 3,
        socIdx: 4,
        chargeFrom: "any",
        panels: null,
        invert: false,
      },
      {
        id: "s2",
        d: 44,
        visibility: null,
        kind: "grid",
        idx: 5,
        secondIdx: 7,
        bothWays: false,
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
        d: 32,
        name: "Laundry",
        icon: "mdi:washing-machine",
        items: [
          {
            kind: "item",
            id: "c0.0",
            idx: 11,
            d: 24,
            rowD: 32,
            invert: false,
            visibility: null,
            hideBelow: null,
          },
          {
            kind: "item",
            id: "c0.1",
            idx: 12,
            d: 24,
            rowD: 32,
            invert: false,
            visibility: null,
            hideBelow: null,
          },
        ],
        visibility: null,
      },
      {
        kind: "item",
        id: "c1",
        idx: 13,
        d: 32,
        rowD: 32,
        invert: true,
        visibility: null,
        hideBelow: null,
      },
      { kind: "other", id: "other", d: 32, rowD: 32 },
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
    // an object shows it at its own size
    const sized = leavesOf(base({ consumers: ["sensor.a"], other: { icon_size: 48 } }))[1];
    expect([sized.kind, sized.d, sized.rowD]).toEqual(["other", 48, GEOM.rowH]);
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

  it("names the panels that feed a battery and lets a grid pair run both ways", () => {
    const sources = (chargeFrom: unknown, grid: Record<string, unknown> = {}) => [
      { type: "solar", entity: "sensor.roof" },
      { type: "solar", entity: "sensor.balcony" },
      { type: "battery", charge: "sensor.bc", discharge: "sensor.bd", charge_from: chargeFrom },
      { type: "grid", power: "sensor.grid", ...grid },
    ];
    const battery = (chargeFrom: unknown) =>
      normalizePowerFlowConfig({ sources: sources(chargeFrom) }).sources[2];
    expect(battery("sensor.balcony")).toMatchObject({ chargeFrom: "solar", panels: ["s1"] });
    expect(battery(["sensor.roof", "sensor.balcony", "sensor.roof"])).toMatchObject({
      chargeFrom: "solar",
      panels: ["s0", "s1"],
    });
    // `solar` and `any` keep their meaning: every panel, or the usual order
    expect(battery("solar")).toMatchObject({ chargeFrom: "solar", panels: null });
    expect(battery(undefined)).toMatchObject({ chargeFrom: "any", panels: null });
    for (const e of ["sensor.grid", "sensor.nowhere"])
      expect(() => battery(e)).toThrow(`sources[2].charge_from: ${e} is not a solar source`);
    for (const bad of [[], "Balcony", 42])
      expect(() => battery(bad)).toThrow(/charge_from must be one of any \| solar/);
    // a bad entry of a list is named
    for (const bad of [[42], ["sensor.roof", "Balcony"]])
      expect(() => battery(bad)).toThrow(/'sources\[2\]\.charge_from\[\d\]' must be an entity id/);

    const grid = (g: Record<string, unknown>) =>
      normalizePowerFlowConfig({ sources: [{ type: "grid", ...g }] }).sources[0];
    expect(grid({ import: "sensor.in", export: "sensor.out", both_ways: true })).toMatchObject({
      bothWays: true,
    });
    expect(grid({ import: "sensor.in", export: "sensor.out" })).toMatchObject({ bothWays: false });
    for (const g of [{ power: "sensor.g" }, { import: "sensor.in" }])
      expect(() => grid({ ...g, both_ways: true })).toThrow(
        /both_ways needs an 'import' \/ 'export' pair/,
      );
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
    // a grid with a fossil sensor running on its generator: the generator's power, not the grid mix
    const genFossil = normalizePowerFlowConfig({
      home: "sensor.home",
      sources: [SRC[0], SRC[1], { ...SRC[2], generator: "sensor.gen", fossil: "sensor.fossil" }],
    });
    const mixed = flowsOf(genFossil, {
      "sensor.solar": "400",
      "sensor.home": "2600",
      "sensor.battery": "0",
      "sensor.grid": "0",
      "binary_sensor.outage": "on",
      "sensor.gen": "2200",
      "sensor.fossil": "40",
    });
    expect(mixed.f).toMatchObject({ gH: 2200, gHGen: 2200, gHClean: 0 });
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

  it("draws both flows of a solar-fed battery given as a pair: the panels fill it while it feeds the home", () => {
    // a plug-in unit reports what the panels put in and what the inverter gives out (simon42, post 55)
    const cfg = normalizePowerFlowConfig({
      sources: [
        { type: "grid", import: "sensor.in", export: "sensor.out" },
        { type: "battery", charge: "sensor.chg", discharge: "sensor.ac", charge_from: "solar" },
        { type: "solar", entity: "sensor.pv" },
      ],
    });
    const day = flowsOf(cfg, {
      "sensor.in": "70",
      "sensor.out": "0",
      "sensor.pv": "374",
      "sensor.chg": "374",
      "sensor.ac": "189",
    });
    // the label keeps the net value, the links carry the gross flows
    expect(day.now.sources[1]).toMatchObject({ w: -185, charge: 374, discharge: 189 });
    expect(day.f).toMatchObject({ H: 259, sB: 374, sH: 0, bH: 189, gH: 70, dB: 0, gB: 0, bG: 0 });
    expect(edge(day.f, "s2", "s1")).toMatchObject({ w: 374, kind: "battIn" });
    expect(edge(day.f, "s1", "home")).toMatchObject({ w: 189, kind: "battOut" });
    expect(edge(day.f, "s2", "home")?.w).toBe(0);
    expect(edge(day.f, "s0", "home")?.w).toBe(70);
    // the panels report less than the battery takes: the rest comes from the grid, the discharge
    // the home does not take is exported, and the battery never charges itself
    const odd = flowsOf(cfg, {
      "sensor.in": "70",
      "sensor.out": "0",
      "sensor.pv": "300",
      "sensor.chg": "374",
      "sensor.ac": "189",
    });
    expect(odd.f).toMatchObject({ H: 185, sB: 300, bH: 185, dB: 0, gB: 74, bG: 4 });
    expect(odd.f.edges.some((e) => e.from === "s1" && e.to === "s1")).toBe(false);
    const sum = (pred: (e: EdgeFlow) => boolean) =>
      odd.f.edges.filter(pred).reduce((a, e) => a + e.w, 0);
    expect(sum((e) => e.to === "s1")).toBeCloseTo(374);
    expect(sum((e) => e.from === "s1")).toBeCloseTo(189);
    // without charge_from the pair is netted, as every other battery, and the default order
    // sends solar to the home first and the grid into the battery
    const net = normalizePowerFlowConfig({
      sources: [
        { type: "grid", import: "sensor.in", export: "sensor.out" },
        { type: "battery", charge: "sensor.pv", discharge: "sensor.ac" },
        { type: "solar", entity: "sensor.pv" },
      ],
    });
    const n = flowsOf(net, {
      "sensor.in": "70",
      "sensor.out": "0",
      "sensor.pv": "374",
      "sensor.ac": "189",
    });
    expect(n.now.sources[1]).toMatchObject({ w: -185, charge: 185, discharge: 0 });
    expect(n.f).toMatchObject({ H: 259, sH: 259, sB: 115, gB: 70, bH: 0 });
    expect(edge(n.f, "s1", "home")?.w).toBe(0);
  });
  it("splits the charge over the giving batteries pro rata, whatever their order", () => {
    const sources = (swap: boolean) => {
      const a = { type: "battery", power: "sensor.b1" },
        b = { type: "battery", power: "sensor.b2" };
      return [
        { type: "solar", entity: "sensor.solar" },
        ...(swap ? [b, a] : [a, b]),
        { type: "battery", power: "sensor.b3" },
        { type: "grid", power: "sensor.grid" },
      ];
    };
    const states = {
      "sensor.solar": "0",
      "sensor.home": "0",
      "sensor.b1": "100",
      "sensor.b2": "100",
      "sensor.b3": "-100",
      "sensor.grid": "-100",
    };
    const { f } = flowsOf(
      normalizePowerFlowConfig({ home: "sensor.home", sources: sources(false) }),
      states,
    );
    expect(f).toMatchObject({ dB: 100, bG: 100, gB: 0, grid: -100 });
    expect(edge(f, "s1", "s3")?.w).toBe(50);
    expect(edge(f, "s2", "s3")?.w).toBe(50);
    expect(edge(f, "s1", "s4")?.w).toBe(50);
    expect(edge(f, "s2", "s4")?.w).toBe(50);
    const swapped = flowsOf(
      normalizePowerFlowConfig({ home: "sensor.home", sources: sources(true) }),
      states,
    ).f;
    expect(edge(swapped, "s1", "s3")?.w).toBe(50);
    expect(edge(swapped, "s2", "s3")?.w).toBe(50);
  });
  it("lets a solar-fed pair's surplus charge another battery, never itself", () => {
    const cfg = normalizePowerFlowConfig({
      home: "sensor.home",
      sources: [
        { type: "solar", entity: "sensor.pv" },
        { type: "battery", charge: "sensor.pv", discharge: "sensor.ac", charge_from: "solar" },
        { type: "battery", power: "sensor.b2" },
        { type: "grid", power: "sensor.grid" },
      ],
    });
    const { f } = flowsOf(cfg, {
      "sensor.pv": "400",
      "sensor.ac": "300",
      "sensor.home": "100",
      "sensor.b2": "-150",
      "sensor.grid": "-50",
    });
    // the pair: 400 in from its panels; 300 out, 100 to the home, 150 to the other battery, 50 exported
    expect(f).toMatchObject({ sB: 400, sH: 0, bH: 100, dB: 150, gB: 0, bG: 50, grid: -50 });
    expect(edge(f, "s0", "s1")?.w).toBe(400);
    expect(edge(f, "s1", "s2")).toMatchObject({ w: 150, kind: "battIn" });
    expect(edge(f, "s2", "s1")?.w).toBe(0);
    expect(f.edges.some((e) => e.from === e.to)).toBe(false);
    const sum = (pred: (e: EdgeFlow) => boolean) =>
      f.edges.filter(pred).reduce((a, e) => a + e.w, 0);
    expect(sum((e) => e.to === "s1")).toBe(400);
    expect(sum((e) => e.from === "s1")).toBe(300);
    expect(sum((e) => e.to === "s2")).toBe(150);
  });
  it("charges a solar-fed battery before the home and never from the grid", () => {
    // a plug-in battery: the panels feed the battery, the battery feeds the home
    const cfg = normalizePowerFlowConfig({
      home: "sensor.home",
      sources: [
        { type: "solar", entity: "sensor.solar" },
        { type: "battery", power: "sensor.battery", charge_from: "solar" },
        { type: "grid", power: "sensor.grid" },
      ],
    });
    // the default order would send 300 W of grid into the battery here
    const day = flowsOf(cfg, {
      "sensor.solar": "800",
      "sensor.home": "500",
      "sensor.battery": "-600",
      "sensor.grid": "300",
    });
    expect(day.f).toMatchObject({ sB: 600, sH: 200, bH: 0, gH: 300, gB: 0, sG: 0, grid: 300 });
    expect(edge(day.f, "s0", "s1")).toMatchObject({ w: 600, kind: "battIn" });
    expect(edge(day.f, "s0", "home")?.w).toBe(200);
    expect(edge(day.f, "s2", "home")?.w).toBe(300);
    expect(edge(day.f, "s2", "s1")?.w).toBe(0);
    // the panels report less than the battery takes: the rest still comes from the grid
    const odd = flowsOf(cfg, {
      "sensor.solar": "400",
      "sensor.home": "500",
      "sensor.battery": "-600",
      "sensor.grid": "700",
    });
    expect(odd.f).toMatchObject({ sB: 400, sH: 0, gH: 500, gB: 200 });
    expect(edge(odd.f, "s2", "s1")?.w).toBe(200);
    // next to an ordinary battery: the solar-fed one is filled first, the other takes the grid
    const two = normalizePowerFlowConfig({
      home: "sensor.home",
      sources: [
        { type: "solar", entity: "sensor.solar" },
        { type: "battery", power: "sensor.b1", charge_from: "solar" },
        { type: "battery", power: "sensor.b2" },
        { type: "grid", power: "sensor.grid" },
      ],
    });
    const { f } = flowsOf(two, {
      "sensor.solar": "1000",
      "sensor.home": "600",
      "sensor.b1": "-800",
      "sensor.b2": "-1000",
      "sensor.grid": "1400",
    });
    // the solar-fed battery first, then the home, nothing is left for the other battery
    expect(f).toMatchObject({ sB: 800, sH: 200, gH: 400, gB: 1000, grid: 1400 });
    expect(edge(f, "s0", "s1")?.w).toBe(800);
    expect(edge(f, "s0", "s2")?.w).toBe(0);
    expect(edge(f, "s3", "s1")?.w).toBe(0);
    expect(edge(f, "s3", "s2")?.w).toBe(1000);
    // every battery's links add up to its label
    for (const b of ["s1", "s2"]) {
      const into = f.edges.filter((e) => e.to === b).reduce((a, e) => a + e.w, 0);
      expect(into).toBe(b === "s1" ? 800 : 1000);
    }
    // several solar sources share the charge pro rata
    const arrays = normalizePowerFlowConfig({
      home: "sensor.home",
      sources: [
        { type: "solar", entity: "sensor.roof" },
        { type: "solar", entity: "sensor.balcony" },
        { type: "battery", power: "sensor.battery", charge_from: "solar" },
        { type: "grid", power: "sensor.grid" },
      ],
    });
    const mixed = flowsOf(arrays, {
      "sensor.roof": "3000",
      "sensor.balcony": "1000",
      "sensor.home": "3000",
      "sensor.battery": "-800",
      "sensor.grid": "-200",
    });
    expect(mixed.f).toMatchObject({ sB: 800, sH: 3000, sG: 200, gB: 0 });
    expect(edge(mixed.f, "s0", "s2")?.w).toBe(600);
    expect(edge(mixed.f, "s1", "s2")?.w).toBe(200);
  });

  it("charges a battery that names its panels from those panels only", () => {
    // two arrays, two batteries: the balcony panels feed only the balcony battery (simon42, post 94)
    const cfg = normalizePowerFlowConfig({
      home: "sensor.home",
      sources: [
        { type: "solar", entity: "sensor.roof" },
        { type: "solar", entity: "sensor.balcony" },
        { type: "battery", power: "sensor.b1" },
        {
          type: "battery",
          charge: "sensor.bc",
          discharge: "sensor.bd",
          charge_from: "sensor.balcony",
        },
        { type: "grid", power: "sensor.grid" },
      ],
    });
    const states = {
      "sensor.roof": "3000",
      "sensor.balcony": "400",
      "sensor.b1": "0",
      "sensor.bc": "400",
      "sensor.bd": "0",
      "sensor.home": "3200",
      "sensor.grid": "200",
    };
    const { f } = flowsOf(cfg, states);
    expect(f).toMatchObject({ sB: 400, sH: 3000, gH: 200, gB: 0, sG: 0 });
    expect(edge(f, "s1", "s3")).toMatchObject({ w: 400, kind: "battIn" });
    expect(edge(f, "s0", "home")?.w).toBe(3000);
    // the roof has no link to the balcony battery at all, but still one to the other battery
    expect(edge(f, "s0", "s3")).toBeUndefined();
    expect(edge(f, "s0", "s2")).toBeDefined();
    // `solar` shares the same charge over both arrays
    const shared = normalizePowerFlowConfig({
      home: "sensor.home",
      sources: [
        { type: "solar", entity: "sensor.roof" },
        { type: "solar", entity: "sensor.balcony" },
        { type: "battery", power: "sensor.b1" },
        { type: "battery", charge: "sensor.bc", discharge: "sensor.bd", charge_from: "solar" },
        { type: "grid", power: "sensor.grid" },
      ],
    });
    expect(edge(flowsOf(shared, states).f, "s0", "s3")?.w).toBeCloseTo(352.94, 1);

    // the panels report less than the battery takes: the grid fills in, never the other array
    const short = flowsOf(cfg, {
      ...states,
      "sensor.balcony": "300",
      "sensor.home": "3000",
      "sensor.grid": "100",
    }).f;
    expect(short).toMatchObject({ sB: 300, sH: 3000, gH: 0, gB: 100 });
    expect(edge(short, "s1", "s3")?.w).toBe(300);
    expect(edge(short, "s4", "s3")?.w).toBe(100);
  });
  it("keeps two batteries on their own arrays", () => {
    const cfg = normalizePowerFlowConfig({
      home: "sensor.home",
      sources: [
        { type: "solar", entity: "sensor.a" },
        { type: "solar", entity: "sensor.b" },
        { type: "battery", charge: "sensor.ac", discharge: "sensor.ad", charge_from: "sensor.a" },
        { type: "battery", power: "sensor.bb", charge_from: ["sensor.b"] },
        { type: "grid", power: "sensor.grid" },
      ],
    });
    const { f } = flowsOf(cfg, {
      "sensor.a": "500",
      "sensor.b": "200",
      "sensor.ac": "300",
      "sensor.ad": "0",
      "sensor.bb": "-400",
      "sensor.home": "1000",
      "sensor.grid": "1000",
    });
    expect(f).toMatchObject({ sB: 500, sH: 200, gH: 800, gB: 200, grid: 1000 });
    expect(edge(f, "s0", "s2")?.w).toBe(300);
    expect(edge(f, "s1", "s3")?.w).toBe(200);
    expect(edge(f, "s0", "home")?.w).toBe(200);
    expect(edge(f, "s4", "s3")?.w).toBe(200);
    expect(edge(f, "s0", "s3")).toBeUndefined();
    expect(edge(f, "s1", "s2")).toBeUndefined();
  });
  it("gives a panel to the battery that has no other before one every panel feeds", () => {
    // the house battery may take any panel, the balcony battery only its own: the roof fills the
    // house battery, nothing runs through the grid that reads 0
    const cfg = normalizePowerFlowConfig({
      home: "sensor.home",
      sources: [
        { type: "solar", entity: "sensor.roof" },
        { type: "solar", entity: "sensor.balcony" },
        { type: "battery", power: "sensor.house", charge_from: "solar" },
        {
          type: "battery",
          charge: "sensor.bc",
          discharge: "sensor.bd",
          charge_from: "sensor.balcony",
        },
        { type: "grid", power: "sensor.grid" },
      ],
    });
    const { now, f } = flowsOf(cfg, {
      "sensor.roof": "3000",
      "sensor.balcony": "400",
      "sensor.house": "-2000",
      "sensor.bc": "400",
      "sensor.bd": "0",
      "sensor.home": "1000",
      "sensor.grid": "0",
    });
    expect(f).toMatchObject({ sB: 2400, sH: 1000, sG: 0, gB: 0, gH: 0 });
    expect(edge(f, "s1", "s3")?.w).toBe(400);
    expect(edge(f, "s0", "s2")?.w).toBe(2000);
    expect(edge(f, "s1", "s2")?.w).toBe(0);
    expect(summaryState(cfg, now, f).key).toBe("power.state.balanced");
    // overlapping lists: the battery with one panel takes it, the other the panel left
    const two = normalizePowerFlowConfig({
      sources: [
        { type: "solar", entity: "sensor.a" },
        { type: "solar", entity: "sensor.b" },
        { type: "battery", power: "sensor.x", charge_from: "sensor.a" },
        { type: "battery", power: "sensor.y", charge_from: ["sensor.a", "sensor.b"] },
      ],
    });
    const o = flowsOf(two, {
      "sensor.a": "500",
      "sensor.b": "500",
      "sensor.x": "-500",
      "sensor.y": "-500",
    }).f;
    expect(o).toMatchObject({ sB: 1000, sG: 0, gB: 0 });
    expect(edge(o, "s0", "s2")?.w).toBe(500);
    expect(edge(o, "s1", "s3")?.w).toBe(500);
    expect(edge(o, "s0", "s3")?.w).toBe(0);
  });
  it("draws a battery that names every panel as one fed by `solar`", () => {
    const cfgOf = (chargeFrom: unknown) =>
      normalizePowerFlowConfig({
        home: "sensor.home",
        sources: [
          { type: "solar", entity: "sensor.roof" },
          { type: "solar", entity: "sensor.balcony" },
          { type: "battery", power: "sensor.battery", charge_from: chargeFrom },
          { type: "battery", power: "sensor.b2" },
          { type: "grid", power: "sensor.grid" },
        ],
      });
    const all = cfgOf(["sensor.roof", "sensor.balcony"]),
      solar = cfgOf("solar");
    for (const states of [
      { "sensor.roof": "3000", "sensor.balcony": "1000", "sensor.battery": "-800" },
      { "sensor.roof": "300", "sensor.balcony": "100", "sensor.battery": "-800" },
      { "sensor.roof": "2000", "sensor.balcony": "0", "sensor.battery": "500" },
    ]) {
      const s = { ...states, "sensor.home": "1500", "sensor.b2": "-300", "sensor.grid": "200" };
      const a = flowsOf(all, s).f,
        b = flowsOf(solar, s).f;
      for (const k of ["sB", "sH", "bH", "gH", "gB", "sG", "bG", "dB", "grid"] as const)
        expect(a[k]).toBeCloseTo(b[k], 6);
      expect(a.edges.map((e) => [e.from, e.to, e.kind])).toEqual(
        b.edges.map((e) => [e.from, e.to, e.kind]),
      );
      a.edges.forEach((e, i) => expect(e.w).toBeCloseTo(b.edges[i].w, 6));
    }
  });
  it("lets a grid with both_ways import and export at once", () => {
    const sources = [
      { type: "solar", entity: "sensor.pv" },
      { type: "grid", import: "sensor.in", export: "sensor.out", both_ways: true },
    ];
    const cfg = normalizePowerFlowConfig({ sources });
    // a meter that does not net its phases: 1000 W in on one, 300 W out on another
    const { now, f } = flowsOf(cfg, {
      "sensor.pv": "800",
      "sensor.in": "1000",
      "sensor.out": "300",
    });
    expect(now.sources[1]).toMatchObject({ w: 700, import: 1000, export: 300 });
    expect(f).toMatchObject({ H: 1500, sG: 300, sH: 500, gH: 1000, grid: 700 });
    expect(edge(f, "s0", "s1")).toMatchObject({ w: 300, kind: "gridOut" });
    expect(edge(f, "s0", "home")?.w).toBe(500);
    expect(edge(f, "s1", "home")).toMatchObject({ w: 1000, kind: "gridIn" });
    // the larger flow names the state; self-sufficiency counts the import
    expect(summaryState(cfg, now, f)).toMatchObject({ key: "power.state.importing", w: 1000 });
    expect(f.selfSufficiency).toBeCloseTo(1 / 3);
    const out = flowsOf(cfg, { "sensor.pv": "2000", "sensor.in": "100", "sensor.out": "1500" });
    expect(summaryState(cfg, out.now, out.f)).toMatchObject({
      key: "power.state.exporting",
      w: 1500,
    });
    // as with every grid, the summary reads the home's import: an import into a battery does
    // not outweigh the export
    const charging = normalizePowerFlowConfig({
      sources: [...sources, { type: "battery", power: "sensor.battery" }],
    });
    const c = flowsOf(charging, {
      "sensor.pv": "800",
      "sensor.in": "1200",
      "sensor.out": "400",
      "sensor.battery": "-1500",
    });
    expect(c.f).toMatchObject({ H: 100, sG: 400, gH: 0, gB: 1200 });
    expect(summaryState(charging, c.now, c.f)).toMatchObject({
      key: "power.state.exporting",
      w: 400,
    });
    // an export no source covers was never the home's: the whole import runs to the home
    const night = flowsOf(cfg, { "sensor.pv": "0", "sensor.in": "1200", "sensor.out": "400" });
    expect(night.f).toMatchObject({ H: 1200, gH: 1200, sG: 0, bG: 0 });
    expect(edge(night.f, "s1", "home")?.w).toBe(1200);
    expect(summaryState(cfg, night.now, night.f)).toMatchObject({
      key: "power.state.importing",
      w: 1200,
    });
    // without both_ways the pair is netted, as before
    const net = normalizePowerFlowConfig({
      sources: [sources[0], { type: "grid", import: "sensor.in", export: "sensor.out" }],
    });
    const n = flowsOf(net, { "sensor.pv": "800", "sensor.in": "1000", "sensor.out": "300" });
    expect(n.now.sources[1]).toMatchObject({ w: 700, import: 700, export: 0 });
    expect(n.f).toMatchObject({ sG: 0, sH: 800, gH: 700 });
  });
  it("takes a two-way grid's export from solar first, then from the batteries", () => {
    const cfg = normalizePowerFlowConfig({
      home: "sensor.home",
      sources: [
        { type: "solar", entity: "sensor.pv" },
        { type: "battery", power: "sensor.battery" },
        {
          type: "grid",
          import: "sensor.in",
          export: "sensor.out",
          both_ways: true,
          offline: "binary_sensor.outage",
        },
      ],
    });
    const states = {
      "sensor.pv": "100",
      "sensor.battery": "500",
      "sensor.in": "600",
      "sensor.out": "300",
      "sensor.home": "900",
      "binary_sensor.outage": "off",
    };
    const { f } = flowsOf(cfg, states);
    expect(f).toMatchObject({ sG: 100, bG: 200, bH: 300, gH: 600, sH: 0, grid: 300 });
    expect(edge(f, "s0", "s2")?.w).toBe(100);
    expect(edge(f, "s1", "s2")?.w).toBe(200);
    expect(edge(f, "s1", "home")?.w).toBe(300);
    // more export than there is to give: what the sources have, no more
    const odd = flowsOf(cfg, { ...states, "sensor.battery": "0", "sensor.out": "2000" }).f;
    expect(odd).toMatchObject({ sG: 100, bG: 0 });
    // offline the grid carries nothing either way, and its sensors' last values are not two flows
    const off = flowsOf(cfg, { ...states, "binary_sensor.outage": "on" });
    expect(off.f).toMatchObject({ sG: 0, bG: 0, gH: 0, gB: 0 });
    expect(off.now.sources[2]).toMatchObject({ w: 300, import: 300, export: 0 });
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
  it("reads idle_below as watts, 20 by default", () => {
    expect(base().idleBelow).toBe(20);
    expect(base({ idle_below: 1 }).idleBelow).toBe(1);
    expect(base({ idle_below: 0 }).idleBelow).toBe(0);
    expect(() => base({ idle_below: -5 })).toThrow(/'idle_below' must be a number of watts/);
    // a trickle below the default is a state and a colour once the threshold is lower
    const states = {
      "sensor.solar": "8",
      "sensor.battery": "0",
      "sensor.grid": "-8",
      "sensor.home": "0",
    };
    const quiet = flowsOf(base(), states);
    expect(summaryState(base(), quiet.now, quiet.f).key).toBe("power.state.balanced");
    expect(sourceColor(quiet.now.sources[0], false)).toBe(COLORS.idle);
    const low = base({ idle_below: 5 });
    const lowF = flowsOf(low, states);
    expect(summaryState(low, lowF.now, lowF.f).key).toBe("power.state.exporting");
    expect(sourceColor(lowF.now.sources[0], false, low.idleBelow)).toBe(COLORS.solar);
    expect(sourceColor(lowF.now.sources[2], false, low.idleBelow)).toBe(COLORS.gridOut);
  });

  it("is idle below 20 W either way and reads the load against the bounds", () => {
    expect(isActive(19)).toBe(false);
    expect(isActive(20)).toBe(true);
    expect(isActive(-300)).toBe(true);
    // idle_below moves the threshold; nothing is never a flow
    expect(isActive(3, 1)).toBe(true);
    expect(isActive(0.5, 1)).toBe(false);
    expect(isActive(0.2, 0)).toBe(true);
    expect(isActive(0, 0)).toBe(false);
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
    // none level, sources on both sides: half a lane off the centre, mirrored
    expect(laneOffsets([20, 60, 100, 140], 80)).toEqual([-12, -4, 4, 12]);
    // none level, all on one side: the nearest takes lane 0
    expect(laneOffsets([20, 60], 100)).toEqual([-8, 0]);
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
    // one pitch for every source, the most any label asks for: two 44 px nodes in a row ask 66
    expect(acrossOf(five)).toBe(42 + 4 * 66 + 42);
    const withSecondary = normalizePowerFlowConfig({
      sources: [{ ...SRC[0], secondary: "roof" }, SRC[1], SRC[2]],
    });
    // a secondary line on the solar label needs no extra pitch below it; one on the battery would
    expect(acrossOf(withSecondary)).toBe(Math.ceil(51 + 64 + 64 + 42)); // a taller first margin
    const batterySecondary = normalizePowerFlowConfig({
      sources: [SRC[0], { ...SRC[1], secondary: "x" }, SRC[2]],
    });
    expect(acrossOf(batterySecondary)).toBe(42 + 75 + 75 + 42); // 22 + 2 + 27.5 + 23.5 above it
    const cons = base({ consumers: ["sensor.a", "sensor.b", "sensor.c", "sensor.d"] }); // + other
    expect(acrossOf(cons)).toBe(34 + 4 * GEOM.consumerPitch + 30); // 32 px nodes, 28 px labels
    const rooms = base({
      consumers: [{ group: "A", entities: ["sensor.a", "sensor.b"] }, "sensor.c"],
    });
    // the first room's label above it (52), then one pitch for every leaf: the most any asks
    // for – here the room column's, the other node's label above it clearing the lone consumer
    // before it (16 + 16 + 32 + 7 = 71 over one leaf)
    expect(acrossOf(rooms)).toBe(52 + 3 * 71 + 30);
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
      // a lane into the home ends on its circle too, off the centre line on a lane of its own
      expect(Math.hypot(b[0] - to.x, b[1] - to.y)).toBeCloseTo(to.d / 2, 5);
      if (e.to === "home") expect(Math.abs(b[1] - to.y)).toBeLessThan(to.d / 2 - 3);
      expect(e.len).toBeGreaterThan(0);
      expect(e.d).toMatch(/^M/);
    }
    // rails run behind the source column; lanes into the home never cross each other
    const rail = l.edges.find((e) => e.kind === "battIn")!;
    expect(rail.pts.some((p) => p[0] === GEOM.railBattery)).toBe(true);
    const lanes = l.edges.filter((e) => e.to === "home");
    expect(crossings(lanes)).toBe(0);
  });

  it("spaces the sources evenly, the middle one straight into the home", () => {
    const pair = {
      type: "battery",
      charge: "sensor.charge",
      discharge: "sensor.discharge",
      soc: "sensor.soc",
      charge_from: "solar",
    };
    for (const sources of [
      [SRC[0], pair, SRC[2]],
      [SRC[0], pair, SRC[2], { type: "solar", entity: "sensor.b" }],
    ]) {
      const cfg = normalizePowerFlowConfig({ sources });
      const { f } = flowsOf(cfg, { "sensor.solar": "800", "sensor.grid": "300" });
      const l = layoutTree(cfg, 400, f.edges);
      const ys = cfg.sources.map((s) => l.nodes.find((n) => n.id === s.id)!.y);
      // one pitch, centre to centre, whatever the labels (the pair's has a line more)
      const gaps = ys.slice(1).map((y, i) => y - ys[i]);
      for (const g of gaps) expect(g).toBeCloseTo(gaps[0], 6);
      const home = l.nodes.find((n) => n.id === "home")!;
      const lanes = l.edges.filter((e) => e.to === "home");
      if (ys.length % 2) {
        // an odd number: the middle one level with the home, one straight leg
        expect(ys[1]).toBeCloseTo(home.y, 6);
        expect(lanes.find((e) => e.from === "s1")!.pts).toHaveLength(2);
      } else {
        // an even number: the home between the middle two, both bend, mirrored
        expect(home.y).toBeCloseTo((ys[1] + ys[2]) / 2, 6);
        const end = (id: string) => lanes.find((e) => e.from === id)!.pts.at(-1)![1] - home.y;
        expect(end("s1")).toBeCloseTo(-end("s2"), 6);
      }
    }
  });

  it("spaces the consumers evenly, every room centred on its devices", () => {
    const cfg = base({
      consumers: [
        { group: "Laundry", entities: ["sensor.a", "sensor.b"] },
        { group: "Kitchen", entities: ["sensor.c"] },
        "sensor.d",
        { group: "Office", entities: ["sensor.e", "sensor.f", "sensor.g"] },
      ],
    });
    const { f } = flowsOf(cfg, { "sensor.solar": "3000", "sensor.home": "2000" });
    for (const width of [340, 416, 640]) {
      const l = layoutTree(cfg, width, f.edges);
      const y = (id: string) => l.nodes.find((n) => n.id === id)!.y;
      // devices, the lone consumer and the other node: one pitch, centre to centre
      const leaves = ["c0.0", "c0.1", "c1.0", "c2", "c3.0", "c3.1", "c3.2", "other"].map(y);
      const gaps = leaves.slice(1).map((v, i) => v - leaves[i]);
      for (const g of gaps) expect(g).toBeCloseTo(gaps[0], 6);
      // a room centred on its devices
      expect(y("g0")).toBeCloseTo((y("c0.0") + y("c0.1")) / 2, 6);
      expect(y("g1")).toBeCloseTo(y("c1.0"), 6);
      expect(y("g3")).toBeCloseTo(y("c3.1"), 6);
    }
  });

  it("keeps the lanes' turns clear of a source label beside the home", () => {
    // three sources: the battery level with the home, its label (87 px) in the home's band;
    // rooms put the home at 38 % of the width, so the label decides where it goes
    const cfg = base({ consumers: [{ group: "A", entities: ["sensor.a", "sensor.b"] }] });
    const { f } = flowsOf(cfg, { "sensor.solar": "800", "sensor.grid": "300" });
    const sizes = new Map([
      ["s0", { w: 60, h: 32 }],
      ["s1", { w: 87, h: 49 }],
      ["s2", { w: 60, h: 32 }],
    ]);
    for (const width of [400, 480, 530]) {
      const l = layoutTree(cfg, width, f.edges, sizes);
      const battery = l.nodes.find((n) => n.id === "s1")!;
      const labelEnd = battery.x + battery.d / 2 + GEOM.labelGap + 87;
      // every vertical leg of a lane into the home lies right of the label, 3 px clear
      for (const e of l.edges.filter((x) => x.to === "home" && x.pts.length === 4))
        expect(e.pts[1][0] - 3).toBeGreaterThan(labelEnd);
      // so the label finds its first place, beside the node above its line
      const placed = placeLabels(
        l,
        [...sizes].map(([id, s]) => ({ id, ...s })),
        "right",
      ).find((p) => p.id === "s1")!;
      expect(placed.align).toBe("l");
      expect(placed.y).toBeLessThan(battery.y);
    }
  });

  it("puts the devices' labels below them where the rooms' labels leave no room beside", () => {
    // two rooms of two devices and a consumer beside them; the battery's label beside the home
    const cfg = base({
      consumers: [
        { group: "A", entities: ["sensor.a", "sensor.b"] },
        { group: "B", entities: ["sensor.c", "sensor.d"] },
        { entity: "sensor.e" },
      ],
    });
    const { f } = flowsOf(cfg, { "sensor.solar": "800", "sensor.grid": "300" });
    const room = { w: 46, h: 32, vw: 36 },
      dev = { w: 63, h: 28, vw: 36 };
    const sizes = new Map<string, { w: number; h: number; vw?: number }>([
      ["s0", { w: 60, h: 32 }],
      ["s1", { w: 87, h: 32, vw: 54 }],
      ["s2", { w: 60, h: 32 }],
      ["home", { w: 56, h: 17 }],
      ["g0", room],
      ["g1", room],
      ["c2", room],
      ["other", room],
      ["c0.0", dev],
      ["c0.1", dev],
      ["c1.0", dev],
      ["c1.1", dev],
    ]);
    const at = (width: number) => {
      const l = layoutTree(cfg, width, f.edges, sizes);
      // as the card renders them: a name cut to its node's room, never the value
      const max = (id: string) => l.nodes.find((n) => n.id === id)?.labelMax ?? Infinity;
      const labels = [...sizes].map(([id, s]) => ({
        id,
        ...s,
        w: Math.min(s.w, Math.max(max(id), s.vw ?? 0)),
      }));
      return { l, placed: placeLabels(l, labels, "right") };
    };
    const box = (p: PlacedLabel) => {
      const left = p.align === "l" ? p.x : p.align === "r" ? p.x - p.w : p.x - p.w / 2;
      const top = p.align === "c" ? p.y : p.y - p.h / 2;
      return [left, top, left + p.w, top + p.h];
    };
    // a narrow card: the rooms' labels and the devices' values do not fit side by side
    const { l, placed } = at(334);
    const devices = l.nodes.filter((n) => n.column === "leaf");
    expect(devices.length).toBe(4);
    for (const d of devices) {
      expect(d.under).toBe(true);
      expect(d.labelMax).toBeGreaterThanOrEqual(dev.vw);
      const p = placed.find((x) => x.id === d.id)!;
      expect(p.align).toBe("c");
      expect(p.y).toBeGreaterThan(d.y);
    }
    // the rooms' labels sit clear of the home's trunk
    const trunk = Math.max(...l.edges.filter((e) => e.from === "home").map((e) => e.pts[1][0]));
    for (const id of ["g0", "g1"])
      expect(box(placed.find((p) => p.id === id)!)[0]).toBeGreaterThan(trunk + 3);
    // and no label overlaps another
    for (const a of placed)
      for (const b of placed) {
        if (a === b) continue;
        const [p, q] = [box(a), box(b)];
        expect(p[0] < q[2] && p[2] > q[0] && p[1] < q[3] && p[3] > q[1]).toBe(false);
      }
    // a wide card keeps them beside their devices
    expect(at(560).l.nodes.some((n) => n.under)).toBe(false);
  });

  it("turns the lanes into the home in one block: same corners, a lane apart, mirrored", () => {
    const cfg = normalizePowerFlowConfig({
      sources: [
        ...SRC,
        { type: "solar", entity: "sensor.b" },
        { type: "solar", entity: "sensor.c" },
      ],
    });
    const { f } = flowsOf(cfg, { "sensor.solar": "800", "sensor.grid": "300" });
    const l = layoutTree(cfg, 416, f.edges);
    const home = l.nodes.find((n) => n.id === "home")!;
    // the vertical leg of every lane that turns: its along position, by its offset from the home
    const legs = l.edges
      .filter((e) => e.to === "home" && e.pts.length === 4)
      .map((e) => ({ x: e.pts[1][0], off: e.pts[3][1] - home.y }));
    expect(legs.length).toBeGreaterThan(1);
    for (const a of legs)
      for (const b of legs) {
        const k = (o: number) => Math.abs(o) / GEOM.lane;
        // a lane further out turns a lane later; above and below the same
        expect(a.x - b.x).toBeCloseTo((k(a.off) - k(b.off)) * GEOM.lane, 6);
      }
    // the last turn leaves room for its corner before the home's circle
    expect(Math.max(...legs.map((g) => g.x))).toBeLessThanOrEqual(
      home.x - home.d / 2 - GEOM.radius,
    );
    expect(crossings(l.edges.filter((e) => e.to === "home"))).toBe(0);
  });

  it("keeps the lanes into the home around its centre, a near source straight in", () => {
    const configs = [
      base(),
      // a solar-fed pair: two values on the battery, the battery a few px off the home's height
      normalizePowerFlowConfig({
        sources: [
          { type: "solar", entity: "sensor.solar" },
          {
            type: "battery",
            charge: "sensor.charge",
            discharge: "sensor.discharge",
            soc: "sensor.soc",
            charge_from: "solar",
          },
          { type: "grid", power: "sensor.grid" },
        ],
      }),
    ];
    for (const cfg of configs)
      for (const width of [340, 400, 640]) {
        const { f } = flowsOf(cfg, { "sensor.solar": "800", "sensor.grid": "300" });
        const l = layoutTree(cfg, width, f.edges);
        const home = l.nodes.find((n) => n.id === "home")!;
        let near = 0;
        for (const e of l.edges.filter((x) => x.to === "home")) {
          const dy = e.pts[e.pts.length - 1][1] - home.y;
          // on a lane of its own (0, ±8, ±16 …), or – one of them – straight in within half a lane
          if (Math.abs(dy - Math.round(dy / GEOM.lane) * GEOM.lane) < 1e-6) continue;
          near++;
          expect(Math.abs(dy)).toBeLessThanOrEqual(GEOM.lane / 2);
          expect(e.pts).toHaveLength(2);
        }
        expect(near).toBeLessThanOrEqual(1);
      }
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

  it("keeps a line for the second value of a source that may run two ways", () => {
    const cfgOf = (battery: Record<string, unknown>, grid: Record<string, unknown> = {}) =>
      normalizePowerFlowConfig({
        sources: [
          SRC[0],
          { type: "battery", charge: "sensor.c", discharge: "sensor.d", ...battery },
          { type: "grid", import: "sensor.i", export: "sensor.e", ...grid },
        ],
      });
    const one = cfgOf({}),
      pair = cfgOf({ charge_from: "solar" }),
      both = cfgOf({ charge_from: "solar" }, { both_ways: true });
    expect(one.sources.map(twoValued)).toEqual([false, false, false]);
    expect(pair.sources.map(twoValued)).toEqual([false, true, false]);
    expect(both.sources.map(twoValued)).toEqual([false, true, true]);
    // the config decides the height, never the values
    expect(acrossOf(pair)).toBeGreaterThan(acrossOf(one));
    // one pitch for every source: the battery's second line already sets it for the grid
    expect(acrossOf(both)).toBeGreaterThanOrEqual(acrossOf(pair));
    // direction: down – a value with its arrow needs more room right of the icon
    const ds = [44, 40, 44];
    expect(sourceRow(ds, [40, 40, 40], 600).slot).toBe("right");
    expect(sourceRow(ds, [40, 40, 40], 600, GEOM.srcValueW, [false, true, false]).slot).toBe(
      "below",
    );
  });

  it("centres the row of sources and puts their labels in one line, right or below", () => {
    const ds = [44, 40, 44];
    // room for every name right of its icon: the labels go there, nothing cut
    const wide = sourceRow(ds, [40, 60, 60], 600);
    expect(wide.slot).toBe("right");
    expect(wide.caps).toEqual([]);
    expect(wide.bs[1]).toBe(300); // centred over the home
    expect(wide.bs[2] - wide.bs[1]).toBe(wide.bs[1] - wide.bs[0]);
    // a name too long for the room right of its icon: every label goes below, the row unchanged
    const long = sourceRow(ds, [40, 110, 60], 600);
    expect(long.slot).toBe("below");
    expect(long.bs).toEqual(wide.bs);
    expect(long.caps).toEqual([undefined, undefined, undefined]);
    // narrow: below, the names that still do not fit are cut to the next source's line
    const narrow = sourceRow(ds, [40, 130, 130], 380);
    expect(narrow.slot).toBe("below");
    expect(narrow.caps[0]).toBeUndefined();
    expect(narrow.caps[1]).toBe(narrow.bs[2] - 6 - (narrow.bs[1] + GEOM.labelGap));
    expect(narrow.caps[2]).toBe(380 - 4 - (narrow.bs[2] + GEOM.labelGap));
    // the value's room counts even for a short name, so a changing value never moves the labels
    const short = sourceRow([44, 44], [10, 10], 200);
    expect(short.slot).toBe(
      200 - 4 - (short.bs[1] + 22 + GEOM.labelGap) >= GEOM.srcValueW ? "right" : "below",
    );
  });

  it("gives a value more room in the row when the theme's text is larger", () => {
    // names that fit beside the default value's room, not beside a value 25 % wider
    const ds = [44, 44];
    expect(sourceRow(ds, [10, 10], 340).slot).toBe("right");
    expect(sourceRow(ds, [10, 10], 340, GEOM.srcValueW * 1.25).slot).toBe("below");
  });

  it("sizes a label by its lines: the theme's where the tree is drawn", () => {
    const cfg = base({ consumers: [{ entity: "sensor.washer", secondary: "Laundry" }] });
    // the default lines: value 17 + name 15, a device's 15 + 13, a secondary line like the name
    expect(labelHeightOf(cfg, cfg.sources[0].idx, false)).toBe(32);
    expect(labelHeightOf(cfg, null, true)).toBe(28);
    const washer = leavesOf(cfg)[0];
    expect(labelHeightOf(cfg, washer.kind === "item" ? washer.idx : null, false)).toBe(47);
    // the theme's lines (25 % larger text)
    const at = (size: number, line: number) => ({ font: `${size}px Roboto`, size, line });
    const lines = {
      value: at(17.5, 21.25),
      name: at(15, 18.75),
      smallValue: at(15, 18.75),
      smallName: at(13.75, 16.25),
    };
    const big = { ...cfg, lines };
    expect(labelHeightOf(big, null, false)).toBe(40);
    expect(labelHeightOf(big, null, true)).toBe(35);
    expect(diagramHeight(big)).toBeGreaterThan(diagramHeight(cfg));
  });

  it("keeps the labels of a narrow consumer row below, cut to their room", () => {
    const consumers = ["sensor.a", "sensor.b", "sensor.c", "sensor.d", "sensor.e", "sensor.f"];
    // one long name, the others short
    const sizes = new Map(
      ["c0", "c1", "c2", "c3", "c4", "c5", "other"].map((id) => [
        id,
        { w: id === "c0" ? 80 : 34, h: 28, vw: 30 },
      ]),
    );
    const cfg = base({ direction: "down", consumers });
    const l = layoutTree(cfg, 360, flowsOf(cfg, { "sensor.home": "1000" }).f.edges, sizes);
    const leaves = l.nodes.filter((n) => n.column === "leaf").sort((p, q) => p.x - q.x);
    expect(leaves.every((n) => n.labelMax !== undefined)).toBe(true);
    const w = (n: (typeof leaves)[number]) => Math.min(sizes.get(n.id)!.w, n.labelMax!);
    for (let k = 1; k < leaves.length; k++) {
      // two neighbours' labels, centred below their nodes, never meet
      const gap = leaves[k].x - leaves[k - 1].x;
      expect(w(leaves[k - 1]) / 2 + w(leaves[k]) / 2).toBeLessThanOrEqual(gap);
    }
    // the long name takes what its short neighbour leaves: more than half the gap
    expect(leaves[0].labelMax!).toBeGreaterThan(leaves[1].x - leaves[0].x);
    // short names side by side: nothing is tight, nothing cut
    const short = new Map([...sizes].map(([id, z]) => [id, { ...z, w: 34 }]));
    const wide = layoutTree(cfg, 1200, flowsOf(cfg, { "sensor.home": "1000" }).f.edges, short);
    expect(wide.nodes.some((n) => n.labelMax !== undefined)).toBe(false);
  });

  it("puts a lone consumer on the home's axis, so its line runs straight", () => {
    const states = { "sensor.home": "1000", "sensor.a": "300" };
    for (const direction of ["right", "down"]) {
      const cfg = base({ direction, consumers: ["sensor.a"], other: false });
      const l = layoutTree(cfg, 400, flowsOf(cfg, states).f.edges);
      const home = l.nodes.find((n) => n.id === "home")!,
        c0 = l.nodes.find((n) => n.id === "c0")!;
      if (direction === "right") expect(c0.y).toBe(home.y);
      else expect(c0.x).toBe(home.x);
    }
  });

  it("spreads the tree to a fixed card height and ignores a smaller one", () => {
    const states = { "sensor.home": "1000", "sensor.a": "300", "sensor.b": "200" };
    const inside = (l: ReturnType<typeof layoutTree>) =>
      l.nodes.every((n) => n.y - n.d / 2 >= 0 && n.y + n.d / 2 <= l.h);
    // right: the tree is as tall as the card, centred on the home
    const right = base({ consumers: ["sensor.a", "sensor.b"] });
    const natural = diagramHeight(right);
    const tall = layoutTree(right, 416, flowsOf(right, states).f.edges, undefined, natural + 120);
    expect(tall.h).toBe(natural + 120);
    expect(tall.nodes.find((n) => n.id === "home")!.y).toBe(tall.h / 2);
    expect(inside(tall)).toBe(true);
    expect(layoutTree(right, 416, [], undefined, natural - 50).h).toBe(natural);
    // down: the levels move apart, by half a pitch at most, the rest centres the tree
    const down = base({ direction: "down", consumers: ["sensor.a", "sensor.b"] });
    const nat = diagramHeight(down);
    const node = (l: ReturnType<typeof layoutTree>, id: string) =>
      l.nodes.find((n) => n.id === id)!;
    const some = layoutTree(down, 400, flowsOf(down, states).f.edges, undefined, nat + 100);
    expect(some.h).toBe(nat + 100);
    expect(node(some, "home").y - node(some, "s0").y).toBe(GEOM.columnPitch + 50);
    expect(node(some, "s0").y).toBe(GEOM.srcAlong);
    const lots = layoutTree(down, 400, flowsOf(down, states).f.edges, undefined, nat + 600);
    expect(node(lots, "home").y - node(lots, "s0").y).toBe(GEOM.columnPitch * 1.5);
    expect(node(lots, "s0").y).toBeGreaterThan(GEOM.srcAlong);
    expect(inside(lots)).toBe(true);
  });

  it("gives every node the circle of its icon_size; the slots follow it", () => {
    expect([nodeSize(undefined, 32), nodeSize(null, 32), nodeSize("x", 32)]).toEqual([32, 32, 32]);
    expect([nodeSize(10, 32), nodeSize("48", 32), nodeSize(40.4, 32), nodeSize(200, 32)]).toEqual([
      16, 48, 40, 96,
    ]);
    // the defaults: each kind its own circle, a room's device smaller
    const plain = base({ consumers: [{ group: "A", entities: ["sensor.a"] }, "sensor.b"] });
    expect(plain.homeD).toBe(GEOM.dHome);
    expect(plain.sources.map((s) => s.d)).toEqual([GEOM.dSolar, GEOM.dBattery, GEOM.dGrid]);
    expect(plain.consumers.map((c) => c.d)).toEqual([GEOM.dGroup, GEOM.dConsumer, GEOM.dConsumer]);
    expect(leavesOf(plain)[0].d).toBe(GEOM.dDevice);
    const cfg = base({
      home: { entity: "sensor.home", icon_size: 60 },
      sources: [{ ...SRC[0], icon_size: 30 }, SRC[1], { ...SRC[2], icon_size: 200 }],
      consumers: [
        {
          group: "A",
          icon_size: 40,
          entities: [{ entity: "sensor.a", icon_size: 30 }, "sensor.b"],
        },
        { entity: "sensor.c", icon_size: "big" },
      ],
    });
    expect(cfg.homeD).toBe(60);
    expect(cfg.sources.map((s) => s.d)).toEqual([30, GEOM.dBattery, 96]);
    expect(cfg.consumers.map((c) => c.d)).toEqual([40, GEOM.dConsumer, GEOM.dConsumer]);
    expect(leavesOf(cfg).map((l) => l.d)).toEqual([
      30,
      GEOM.dDevice,
      GEOM.dConsumer,
      GEOM.dConsumer,
    ]);
    // the layout draws each node at its own size …
    const l = layoutTree(cfg, 416, []);
    const d = (id: string) => l.nodes.find((n) => n.id === id)!.d;
    expect([d("home"), d("s0"), d("s2"), d("g0"), d("c0.0"), d("c0.1")]).toEqual([
      60,
      30,
      96,
      40,
      30,
      GEOM.dDevice,
    ]);
    // a list row draws 32 px, or its icon_size within the 36 px row, and is spaced by that
    expect(leavesOf(plain).map((l) => l.rowD)).toEqual([32, 32, 32]);
    const list = (size?: number) =>
      base({
        consumer_style: "list",
        consumers: [{ entity: "sensor.a", icon_size: size }, "sensor.b"],
      });
    expect(leavesOf(list(96))[0].rowD).toBe(GEOM.rowH);
    expect(leavesOf(list(20))[0].rowD).toBe(20);
    expect(acrossOf(list(96))).toBe(acrossOf(list(GEOM.rowH)));
    // a big source moves the column in, clear of the charging and export rails
    const big = base({
      sources: [SRC[0], { ...SRC[1], icon_size: 80 }, { ...SRC[2], icon_size: 96 }],
    });
    const lb = layoutTree(big, 416, allocate(big, powerNow(big, modelsOf(big, hassOf({})))).edges);
    for (const id of ["s0", "s1", "s2"]) {
      const n = lb.nodes.find((x) => x.id === id)!;
      expect(n.x - n.d / 2).toBeGreaterThan(GEOM.railBattery);
    }
    expect(lb.nodes.find((x) => x.id === "s0")!.x).toBe(GEOM.srcAlong + (96 - GEOM.dSolar) / 2);
    // direction: down – neighbours never overlap, however narrow the card
    const row = sourceRow([80, 80, 44], [0, 0, 0], 160);
    expect(row.bs[1] - row.bs[0]).toBeGreaterThanOrEqual(80);
    // default nodes keep the 44 px least pitch
    expect(sourceRow([44, 40, 44], [0, 0, 0], 160).bs).toEqual([36, 80, 124]);
    // a ring's stroke: 3 px on the kind's own circle, scaled with the node
    expect(ringWidth("solar", GEOM.dSolar)).toBe(3);
    expect(ringWidth("home", GEOM.dHome)).toBe(3);
    expect(ringWidth("battery", 80)).toBe(6);
    // … and gives a bigger node more room across the flow
    const two = (size?: number) =>
      acrossOf(base({ consumers: [{ entity: "sensor.a", icon_size: size }, "sensor.b"] }));
    expect(two(80)).toBeGreaterThan(two());
    expect(two(GEOM.dConsumer)).toBe(two());
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
  it("puts a node's two values in one line where there is room for it", () => {
    const cfg = base();
    const { f } = flowsOf(cfg, {
      "sensor.solar": "3400",
      "sensor.home": "1240",
      "sensor.battery": "-1200",
      "sensor.grid": "-960",
    });
    // the battery shows two values: stacked 90 px wide and three lines, in one line 180 and two
    const sizesOf = (alt: number) => [
      { id: "s0", w: 70, h: 32 },
      { id: "s1", w: 90, h: 49, alt: { w: alt, h: 32 } },
      { id: "s2", w: 70, h: 32 },
      { id: "home", w: 60, h: 17 },
    ];
    const battery = (width: number, alt: number) =>
      placeLabels(layoutTree(cfg, width, f.edges), sizesOf(alt), "right").find(
        (p) => p.id === "s1",
      )!;
    // a wide card: one line, in the line's shape
    expect(battery(640, 180)).toMatchObject({ inline: true, w: 180, h: 32, align: "l" });
    // too wide for the room before the lanes bend: stacked, in its first place
    const narrow = battery(300, 180);
    expect(narrow).toMatchObject({ inline: false, w: 90, h: 49 });
    expect(narrow.align).toBe("l");
  });

  it("shows both flows of a node from the idle threshold on, again only clearly above it", () => {
    // charge, discharge (or export, import) at idle_below 20
    expect(bothFlows(undefined, 30, 30, 20)).toBe(true);
    expect(bothFlows(undefined, 0, 900, 20)).toBe(false);
    expect(bothFlows(true, 20, 900, 20)).toBe(true);
    expect(bothFlows(true, 19, 900, 20)).toBe(false);
    expect(bothFlows(false, 22, 900, 20)).toBe(false);
    expect(bothFlows(false, 25, 900, 20)).toBe(true);
    // idle_below 0: any two real flows, never a missing one
    expect(bothFlows(undefined, 1, 900, 0)).toBe(true);
    expect(bothFlows(undefined, 0, 900, 0)).toBe(false);
  });
});

describe("power flow visibility", () => {
  const never = [{ condition: "state", state: "never" }];
  const cfgOf = () =>
    normalizePowerFlowConfig({
      home: "sensor.home",
      sources: [
        { type: "solar", entity: "sensor.solar", visibility: never },
        { type: "grid", power: "sensor.grid" },
        { type: "battery", power: "sensor.battery" },
      ],
      consumers: [
        {
          group: "Laundry",
          entities: ["sensor.washer", { entity: "sensor.dryer", visibility: never }],
        },
        {
          group: "Garage",
          visibility: [{ condition: "state", entity: "sensor.ev", state: "never" }],
          entities: ["sensor.ev"],
        },
        { entity: "sensor.plug", visibility: never },
        "sensor.lamp",
      ],
    });
  // a condition holds unless it is `never`
  const shown = (v: Visibility) => !v;
  const STATES = {
    "sensor.solar": "800",
    "sensor.home": "3000",
    "sensor.grid": "2200",
    "sensor.battery": "0",
    "sensor.washer": "300",
    "sensor.dryer": "200",
    "sensor.ev": "1000",
    "sensor.plug": "50",
    "sensor.lamp": "40",
  };

  it("parses the conditions of sources, consumers, rooms and devices with their sensor as default", () => {
    const cfg = cfgOf();
    expect(cfg.sources[0]).toMatchObject({ id: "s0", visibility: [{ entity: "sensor.solar" }] });
    expect(cfg.sources[1]).toMatchObject({ id: "s1", visibility: null });
    const [laundry, garage, plug] = cfg.consumers;
    expect(laundry.kind === "group" && laundry.items[1].visibility).toMatchObject([
      { entity: "sensor.dryer" },
    ]);
    expect(garage.kind === "group" && garage.visibility).toBeTruthy();
    expect(plug.kind === "item" && plug.visibility).toMatchObject([{ entity: "sensor.plug" }]);
    // the home's sensor row never carries the node's conditions
    expect(cfg.entities.every((e) => e.visibility === null)).toBe(true);
    // a room has no sensor to fall back to
    expect(() =>
      normalizePowerFlowConfig({
        sources: SRC,
        consumers: [
          { group: "X", entities: ["sensor.a"], visibility: [{ condition: "state", state: "on" }] },
        ],
      }),
    ).toThrow("'consumers[0].visibility[0]' needs 'entity'");
  });

  it("hides sources, consumers and devices, and rooms whose devices are all hidden", () => {
    const cfg = cfgOf();
    expect([...hiddenNodes(cfg, shown)].sort()).toEqual(["c1.0", "c2", "g1", "s0", "c0.1"].sort());
    const allGone = normalizePowerFlowConfig({
      sources: SRC,
      consumers: [{ group: "Laundry", entities: [{ entity: "sensor.washer", visibility: never }] }],
    });
    expect([...hiddenNodes(allGone, shown)].sort()).toEqual(["c0.0", "g0"]);
    // `hide` hides leaves too (the threshold of hide_consumers_below)
    expect([...hiddenNodes(cfgOf(), shown, (leaf) => leaf.id === "c3")]).toContain("c3");
  });

  it("draws the config without the hidden nodes, ids unchanged", () => {
    const cfg = cfgOf();
    const view = viewConfig(cfg, hiddenNodes(cfg, shown));
    expect(view.sources.map((s) => s.id)).toEqual(["s1", "s2"]);
    expect(leavesOf(view).map((l) => l.id)).toEqual(["c0.0", "c3", "other"]);
    expect(view.hasGroups).toBe(true);
    expect(viewConfig(cfg, new Set())).toBe(cfg);
    // with no consumer left, the other node goes too
    const lone = normalizePowerFlowConfig({ sources: SRC, consumers: ["sensor.lamp"] });
    expect(viewConfig(lone, new Set(["c0"])).consumers).toEqual([]);
  });

  it("counts hidden consumers and rooms in other; a room keeps its hidden devices", () => {
    const cfg = cfgOf();
    const hidden = hiddenNodes(cfg, shown);
    const now = powerNow(cfg, modelsOf(cfg, hassOf(STATES)));
    const f = allocate(cfg, now, hidden);
    // Laundry 500 (its hidden dryer included) and the lamp 40 are shown; the EV and the plug not
    expect(f.groupW.get("g0")).toBe(500);
    expect(f.leafW.get("other")).toBe(3000 - 500 - 40);
    // nothing hidden: every consumer counts
    expect(allocate(cfg, now).leafW.get("other")).toBe(3000 - 500 - 1000 - 50 - 40);
    // a hidden source changes no number
    expect(f.H).toBe(3000);
    expect(f.S).toBe(800);
  });

  it("lays out only the shown nodes, reads each link's own flow, and shrinks", () => {
    const cfg = cfgOf();
    const hidden = hiddenNodes(cfg, shown);
    const view = viewConfig(cfg, hidden);
    const now = powerNow(cfg, modelsOf(cfg, hassOf(STATES)));
    const f = allocate(cfg, now, hidden);
    const full = layoutTree(cfg, 600, f.edges);
    const lay = layoutTree(view, 600, f.edges);
    expect(lay.nodes.map((n) => n.id)).not.toContain("s0");
    expect(lay.nodes.map((n) => n.id)).not.toContain("g1");
    // every drawn link still knows its own flow, though links before it were left out
    for (const e of lay.edges) {
      expect(f.edges[e.fi].from).toBe(e.from);
      expect(f.edges[e.fi].to).toBe(e.to);
    }
    expect(lay.edges.length).toBeLessThan(full.edges.length);
    expect(diagramHeight(view)).toBeLessThan(diagramHeight(cfg));
    // a drawn link keeps the id of its flow, whatever else is hidden: its lane stays its own
    for (const e of lay.edges) expect(full.edges.find((x) => x.id === e.id)?.fi).toBe(e.fi);
    // one consumer hidden instead of another: the same count, other nodes
    const ids = (hide: string) =>
      layoutTree(viewConfig(cfg, new Set([hide])), 600, f.edges).nodes.map((n) => n.id);
    expect(ids("c2").length).toBe(ids("c3").length);
    expect(ids("c2")).not.toEqual(ids("c3"));
  });

  it("lays out a tree whose sources are all hidden", () => {
    const cfg = normalizePowerFlowConfig({
      home: "sensor.home",
      sources: [{ type: "solar", entity: "sensor.solar", visibility: never }],
      consumers: ["sensor.lamp"],
    });
    const view = viewConfig(cfg, hiddenNodes(cfg, shown));
    const now = powerNow(cfg, modelsOf(cfg, hassOf(STATES)));
    const lay = layoutTree(view, 600, allocate(cfg, now).edges);
    expect(lay.nodes.map((n) => n.id)).toEqual(["home", "c0", "other"]);
    expect(Number.isFinite(diagramHeight(view))).toBe(true);
  });
});

describe("power flow hide_consumers_below", () => {
  it("cascades card → room → device, 0 never hides, and rejects nonsense", () => {
    const cfg = normalizePowerFlowConfig({
      sources: SRC,
      hide_consumers_below: 10,
      consumers: [
        {
          group: "Laundry",
          hide_below: 50,
          entities: ["sensor.washer", { entity: "sensor.dryer", hide_below: 0 }],
        },
        "sensor.ev",
        { entity: "sensor.plug", hide_below: 5 },
      ],
    });
    const below = leavesOf(cfg).flatMap((l) => (l.kind === "item" ? [[l.id, l.hideBelow]] : []));
    expect(below).toEqual([
      ["c0.0", 50],
      ["c0.1", null],
      ["c1", 10],
      ["c2", 5],
    ]);
    expect(leavesOf(base({ consumers: ["sensor.a"] }))[0]).toMatchObject({ hideBelow: null });
    expect(() => base({ consumers: ["sensor.a"], hide_consumers_below: "lots" })).toThrow(
      "'hide_consumers_below' must be a number of watts",
    );
    expect(() => base({ consumers: [{ entity: "sensor.a", hide_below: -1 }] })).toThrow(
      "'consumers[0].hide_below' must be a number of watts",
    );
  });

  it("hides below the threshold and shows again only clearly above it", () => {
    // first decision: the threshold itself
    expect(thresholdShown(undefined, 9.9, 10)).toBe(false);
    expect(thresholdShown(undefined, 10, 10)).toBe(true);
    // shown: hides below it
    expect(thresholdShown(true, 9, 10)).toBe(false);
    expect(thresholdShown(true, 10.5, 10)).toBe(true);
    // hidden: back from 12 W (20 %), and at least 2 W above for small thresholds
    expect(thresholdShown(false, 11.9, 10)).toBe(false);
    expect(thresholdShown(false, 12, 10)).toBe(true);
    expect(thresholdShown(false, 2.9, 1)).toBe(false);
    expect(thresholdShown(false, 3, 1)).toBe(true);
    expect(thresholdShown(false, 1200, 1000)).toBe(true);
    // a producer counts by its size; unavailable as 0
    expect(thresholdShown(undefined, -400, 10)).toBe(true);
    expect(thresholdShown(true, null, 10)).toBe(false);
  });

  it("reads the threshold in watts whatever the sensor's unit", () => {
    const cfg = normalizePowerFlowConfig({
      home: "sensor.home",
      sources: SRC,
      hide_consumers_below: 500,
      consumers: ["sensor.ev"],
    });
    const now = powerNow(
      cfg,
      modelsOf(cfg, hassOf({ "sensor.ev": ["0.4", { unit_of_measurement: "kW" }] })),
    );
    expect(now.leaves.get("c0")).toBe(400);
    expect(thresholdShown(undefined, now.leaves.get("c0") ?? null, 500)).toBe(false);
  });
});

describe("power-flow-card: self-sufficiency", () => {
  it("is of a grid: a tree without one says nothing of it", () => {
    const cfg = normalizePowerFlowConfig({ sources: [{ type: "solar", entity: "sensor.heat" }] });
    const now = powerNow(cfg, modelsOf(cfg, hassOf({ "sensor.heat": "800" })));
    const f = allocate(cfg, now);
    expect(f.H).toBe(800);
    expect(f.selfSufficiency).toBeNull();
  });
});

describe("power-flow-card: the Other node and a still flow", () => {
  it("names the Other node and gives it an icon of its own", () => {
    const c = base({ consumers: ["sensor.a"], other: { name: "Losses", icon: "mdi:fire" } });
    expect(c.consumers.at(-1)).toMatchObject({ kind: "other", name: "Losses", icon: "mdi:fire" });
    // without them it is the translated Other with its own icon
    const plain = base({ consumers: ["sensor.a"] }).consumers.at(-1);
    expect(plain).not.toHaveProperty("name");
    expect(plain).not.toHaveProperty("icon");
  });

  it("takes a flow style without motion", () => {
    expect(base({ flow_style: "none" }).flowStyle).toBe("none");
    expect(() => base({ flow_style: "sparks" })).toThrow(/flow_style/);
  });
});

describe("power-flow-card: a tree in a unit of its own", () => {
  const water = () =>
    base({
      home: undefined,
      sources: [{ type: "grid", power: "sensor.main" }],
      consumers: ["sensor.bath", "sensor.kitchen"],
    });
  const hassIn = (unit: string, extra: Record<string, string> = {}) =>
    hassOf(
      Object.fromEntries(
        ["sensor.main", "sensor.bath", "sensor.kitchen"].map((id) => [
          id,
          ["1", { unit_of_measurement: extra[id] ?? unit }] as [string, Record<string, unknown>],
        ]),
      ),
    );

  it("counts in W and kW while its sensors are power sensors", () => {
    expect(isPowerUnit("kW")).toBe(true);
    expect(isPowerUnit("L/min")).toBe(false);
    const strays: string[] = [];
    expect(treeUnit(water(), hassIn("W"), isPowerUnit, (id) => strays.push(id))).toBeNull();
    expect(strays).toEqual([]);
  });

  it("takes the unit of its first sensor when that is no power unit", () => {
    const strays: string[] = [];
    expect(treeUnit(water(), hassIn("L/min"), isPowerUnit, (id) => strays.push(id))).toBe("L/min");
    expect(strays).toEqual([]);
  });

  it("names the sensors that count in another unit than the tree", () => {
    const strays: string[] = [];
    treeUnit(water(), hassIn("L/min", { "sensor.kitchen": "W" }), isPowerUnit, (id) =>
      strays.push(id),
    );
    expect(strays).toEqual(["sensor.kitchen"]);
  });

  it("writes a value in the tree's unit, and moves the links by the largest flow", () => {
    expect(fmtIn(undefined, -12.345, "L/min", 1)).toBe("12.3 L/min");
    expect(fmtIn(undefined, null, "L/min", 1)).toBe("–");
    const f = { H: 10, edges: [{ from: "s0", to: "home", w: 10, kind: "gridIn" }] } as Parameters<
      typeof shareOfMax
    >[0];
    const of = shareOfMax(f);
    expect(of(10)).toBe(1000);
    expect(of(2.5)).toBe(250);
  });

  it("holds an idle_below that is given in any unit", () => {
    expect(base().idleSet).toBe(false);
    expect(base({ idle_below: 0.5 })).toMatchObject({ idleSet: true, idleBelow: 0.5 });
  });
});

describe("power-flow-card: thresholds in a tree of its own unit", () => {
  const water = (extra: Record<string, unknown> = {}) => {
    const el = new PowerFlowCard();
    el.setConfig({
      sources: [{ type: "grid", power: "sensor.main" }],
      consumers: [{ entity: "sensor.garden", hide_below: 0.5 }],
      ...extra,
    });
    return el;
  };
  const flows = (garden: string, unit = "L/min") =>
    hassOf({
      "sensor.main": ["10", { unit_of_measurement: unit }],
      "sensor.garden": [garden, { unit_of_measurement: unit }],
    });

  it("has no idle threshold unless the config gives one", () => {
    const el = water();
    el.hass = flows("1");
    expect(el._config?.idleBelow).toBe(0);
    const given = water({ idle_below: 0.5 });
    given.hass = flows("1");
    expect(given._config?.idleBelow).toBe(0.5);
    // in watts the card's own 20 W
    const watts = water();
    watts.hass = flows("1", "W");
    expect(watts._config?.idleBelow).toBe(20);
  });

  it("brings a hidden consumer back 20 % above its threshold, not 2 units", () => {
    const el = water();
    el.hass = flows("0.3");
    expect(el._computed?.hidden.has("c0")).toBe(true);
    el.hass = flows("0.65");
    expect(el._computed?.hidden.has("c0")).toBe(false);
  });
});
