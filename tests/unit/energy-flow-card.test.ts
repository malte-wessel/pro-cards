import { describe, expect, it } from "vitest";
import { EnergyFlowCard } from "../../src/energy-flow-card.ts";
import { collectionKey, findCollection, followedRange } from "../../src/energy-flow/collection.ts";
import {
  meterIdsOf,
  normalizeEnergyFlowConfig,
  type EnergyFlowConfig,
} from "../../src/energy-flow/config.ts";
import {
  allocate,
  allocateBucket,
  bucketsOf,
  energyNow,
  energySummary,
  fmtEnergy,
  periodSeries,
  shareMotion,
  sumOf,
  type EnergyIn,
} from "../../src/energy-flow/model.ts";
import { COLORS } from "../../src/shared/flow-tree/constants.ts";
import { layoutTree } from "../../src/shared/flow-tree/layout.ts";
import type { HomeAssistant } from "../../src/shared/ha.ts";

const T = "energy-flow-card-pro";
const SRC = [
  { type: "solar", entity: "sensor.solar" },
  { type: "battery", charge: "sensor.charge", discharge: "sensor.discharge", soc: "sensor.soc" },
  { type: "grid", import: "sensor.import", export: "sensor.export" },
];
const cfgOf = (extra: Record<string, unknown> = {}) =>
  normalizeEnergyFlowConfig({ sources: SRC, ...extra });
const HASS = { locale: { language: "en" } } as unknown as HomeAssistant;

// the period's kWh per meter (by entity), all in one bucket, as the card reads them
const nowOf = (cfg: EnergyFlowConfig, kwh: Record<string, number>) =>
  energyNow(
    cfg,
    (idx) => {
      const id = cfg.entities[idx].entity;
      return id && id in kwh ? kwh[id] : null;
    },
    () => 64,
  );
const bucketOf = (cfg: EnergyFlowConfig, kwh: Record<string, number>): EnergyIn => {
  const at = (idx: number | null) => (idx === null ? 0 : (kwh[cfg.entities[idx].entity!] ?? 0));
  return {
    src: cfg.sources.map((s) => ({ a: at(s.idx), b: s.kind === "solar" ? 0 : at(s.secondIdx) })),
    home: cfg.homeEntity ? at(cfg.homeIdx) : null,
  };
};
const edge = (f: ReturnType<typeof allocate>, from: string, to: string) =>
  f.edges.find((e) => e.from === from && e.to === to)?.w;

describe("energy-flow-card config", () => {
  it("is registered and needs sources", () => {
    expect(customElements.get(T)).toBe(EnergyFlowCard);
    expect(() => normalizeEnergyFlowConfig({})).toThrow(/sources/);
  });

  it("reads energy meters: a battery's charge and discharge, a grid's import and export", () => {
    const cfg = cfgOf();
    const [solar, battery, grid] = cfg.sources;
    expect(solar).toMatchObject({ kind: "solar", peak: null });
    expect(battery).toMatchObject({ kind: "battery", chargeFrom: "any" });
    expect(grid).toMatchObject({ kind: "grid", bothWays: false, priceIdx: null });
    // every pair counts both ways over a period
    expect(cfg.gross).toBe(true);
    expect(meterIdsOf(cfg)).toEqual([
      "sensor.solar",
      "sensor.charge",
      "sensor.discharge",
      "sensor.import",
      "sensor.export",
    ]);
  });

  it("rejects what describes a moment, and a battery or grid without its meters", () => {
    const one = (s: Record<string, unknown>) => () => normalizeEnergyFlowConfig({ sources: [s] });
    expect(one({ type: "battery", power: "sensor.b" })).toThrow(/power flow option/);
    expect(one({ type: "grid", import: "sensor.i", price: "sensor.p" })).toThrow(/price/);
    expect(one({ type: "solar", entity: "sensor.s", peak: 8000 })).toThrow(/peak/);
    expect(one({ type: "battery", charge: "sensor.c" })).toThrow(/'charge' and 'discharge'/);
    expect(one({ type: "grid", export: "sensor.e" })).toThrow(/'import'/);
  });

  it("starts on today with the picker, in kWh, and always has a header", () => {
    const cfg = cfgOf();
    expect(cfg).toMatchObject({ period: "today", picker: true, hasHeader: true, idleBelow: 0.05 });
    expect(cfg.units).toEqual({ mwhAbove: 1000, decKwh: 1, decMwh: 2 });
    expect(cfgOf({ period: "month", period_picker: false })).toMatchObject({
      period: "month",
      picker: false,
      hasHeader: true,
    });
    expect(() => cfgOf({ period: "decade" })).toThrow(/period/);
    expect(cfgOf({ decimals: { kwh: 2, mwh: 3 } }).units).toMatchObject({ decKwh: 2, decMwh: 3 });
  });

  it("follows the dashboard's energy period without a picker of its own", () => {
    expect(cfgOf()).toMatchObject({ follow: null });
    expect(cfgOf({ period: "dashboard" })).toMatchObject({
      period: "today",
      picker: false,
      follow: { key: null },
    });
    expect(cfgOf({ period: "dashboard", collection_key: "energy_upstairs" })).toMatchObject({
      follow: { key: "energy_upstairs" },
    });
    expect(() => cfgOf({ period: "dashboard", collection_key: "upstairs" })).toThrow(/energy_/);
    expect(() => cfgOf({ collection_key: "energy_upstairs" })).toThrow(/period: dashboard/);
  });

  it("reads its thresholds in kWh", () => {
    expect(() => cfgOf({ hide_consumers_below: -1 })).toThrow(/kWh/);
    const cfg = cfgOf({ consumers: [{ entity: "sensor.ev", hide_below: 0.5 }] });
    expect(cfg.consumers[0]).toMatchObject({ kind: "item", hideBelow: 0.5 });
  });
});

describe("energy-flow-card: a meter's period", () => {
  const H = 3600e3,
    start = 0;
  const rows = [
    { start: 0, end: H, change: 1 },
    { start: H, end: 2 * H, change: 2 },
  ];

  it("puts what the meter counted since the last compiled hour after it", () => {
    // 5 h in: the hours up to 2 h are compiled, the meter read 10 then, 10.5 now
    const s = periodSeries({ rows, base: 10 }, 10.5, 5 * H, start)!;
    expect([...s]).toEqual([
      [0, 1],
      [H, 2],
      [2 * H, 0.5],
    ]);
    expect(sumOf(s)).toBe(3.5);
  });

  it("adds it to the running bucket of a merged day", () => {
    const day = [{ start: 0, end: 24 * H, change: 4 }];
    expect([...periodSeries({ rows: day, base: 4 }, 5, 10 * H, start)!]).toEqual([[0, 5]]);
  });

  it("knows nothing of a meter not fetched, and nothing beyond the rows without a reading", () => {
    expect(periodSeries(undefined, 3, 5 * H, start)).toBeNull();
    expect(sumOf(periodSeries({ rows, base: 10 }, null, 5 * H, start))).toBe(3);
    // a period not compiled yet: the tail from the reading at its start
    expect([...periodSeries({ rows: [], base: 7 }, 8, H / 2, start)!]).toEqual([[0, 1]]);
  });
});

describe("energy-flow-card: the split", () => {
  it("splits a bucket the way Home Assistant's energy dashboard does", () => {
    const cfg = cfgOf();
    // S = 20, C = 8, D = 7, I = 5, E = 6: the home took 18
    const b = bucketOf(cfg, {
      "sensor.solar": 20,
      "sensor.charge": 8,
      "sensor.discharge": 7,
      "sensor.import": 5,
      "sensor.export": 6,
    });
    const s = allocateBucket(cfg, b);
    expect(s.U).toBe(18);
    // solar charged the battery and covered the export, the home took its rest
    expect(s.toBatt[0][1]).toBe(8);
    expect(s.toGrid[0][2]).toBe(6);
    expect(s.toHome).toEqual([6, 7, 5]);
    // the grid charged nothing: solar covered the charge
    expect(s.toBatt[2][1]).toBe(0);
  });

  it("charges the battery from the grid with what the home did not take", () => {
    const cfg = cfgOf({ home: "sensor.home" });
    const s = allocateBucket(
      cfg,
      bucketOf(cfg, { "sensor.home": 2, "sensor.import": 5, "sensor.charge": 3 }),
    );
    expect(s.toBatt[2][1]).toBe(3);
    expect(s.toHome[2]).toBe(2);
  });

  it("never charges a battery its panels feed from the grid", () => {
    const cfg = normalizeEnergyFlowConfig({
      sources: [
        SRC[0],
        { ...SRC[1], charge_from: "solar" },
        { type: "grid", import: "sensor.import" },
      ],
    });
    const s = allocateBucket(
      cfg,
      bucketOf(cfg, { "sensor.solar": 1, "sensor.charge": 3, "sensor.import": 6 }),
    );
    expect(s.toBatt[0][1]).toBe(1);
    expect(s.toBatt[2][1]).toBe(0);
  });

  it("sums the buckets: an hour of export at noon does not hide the import at night", () => {
    const cfg = cfgOf();
    const noon = bucketOf(cfg, { "sensor.solar": 6, "sensor.export": 4 });
    const night = bucketOf(cfg, { "sensor.import": 3 });
    const now = nowOf(cfg, { "sensor.solar": 6, "sensor.import": 3, "sensor.export": 4 });
    const f = allocate(cfg, now, [noon, night]);
    expect(f.H).toBe(5);
    expect(f.sH).toBe(2);
    expect(f.gH).toBe(3);
    expect(f.sG).toBe(4);
    expect(edge(f, "s0", "s2")).toBe(4);
    expect(edge(f, "s2", "home")).toBe(3);
    expect(f.selfSufficiency).toBeCloseTo(0.4);
  });

  it("is self-sufficient only of a grid: a tree without one says nothing of it", () => {
    const heat = normalizeEnergyFlowConfig({
      sources: [{ type: "solar", entity: "sensor.heat" }],
      consumers: ["sensor.floor"],
    });
    const kwh = { "sensor.heat": 5, "sensor.floor": 3 };
    const f = allocate(heat, nowOf(heat, kwh), [bucketOf(heat, kwh)]);
    expect(f.H).toBe(5);
    expect(f.selfSufficiency).toBeNull();
  });

  it("computes a bucket's home from the sources where its meter has nothing", () => {
    const cfg = cfgOf({ home: "sensor.home" });
    const [solar, , grid] = cfg.sources;
    const series = new Map([
      [
        solar.idx,
        new Map([
          [0, 2],
          [1, 3],
        ]),
      ],
      [grid.idx, new Map([[1, 1]])],
      // the home meter has the first bucket only
      [cfg.homeIdx, new Map([[0, 2]])],
    ]);
    const b = bucketsOf(cfg, series);
    expect(b.map((x) => x.home)).toEqual([2, null]);
    expect(b[1].src[0].a).toBe(3);
    expect(allocate(cfg, nowOf(cfg, {}), b).H).toBe(6);
    // without statistics, or as a fixed value, the home is computed throughout
    expect(bucketsOf(cfg, new Map([...series, [cfg.homeIdx, null]])).map((x) => x.home)).toEqual([
      null,
      null,
    ]);
    const fixed = cfgOf({ home: { value: 5 } });
    expect(bucketsOf(fixed, new Map([[fixed.sources[0].idx, new Map([[0, 2]])]]))[0].home).toBe(
      null,
    );
  });

  it("gives every consumer its period and Other the rest", () => {
    const cfg = cfgOf({ consumers: ["sensor.ev", "sensor.washer"] });
    const kwh = { "sensor.import": 10, "sensor.ev": 6, "sensor.washer": 1 };
    const f = allocate(cfg, nowOf(cfg, kwh), [bucketOf(cfg, kwh)]);
    expect(f.leafW.get("c0")).toBe(6);
    expect(f.leafW.get("other")).toBe(3);
  });

  it("keeps the links of one config whatever the values", () => {
    const cfg = cfgOf();
    const a = allocate(cfg, nowOf(cfg, {}), []),
      b = allocate(cfg, nowOf(cfg, { "sensor.solar": 3 }), [bucketOf(cfg, { "sensor.solar": 3 })]);
    expect(b.edges.map((e) => `${e.from}>${e.to}`)).toEqual(
      a.edges.map((e) => `${e.from}>${e.to}`),
    );
  });
});

describe("energy-flow-card: what it says", () => {
  it("reads kWh, MWh from 1000", () => {
    expect(fmtEnergy(HASS, 12.34)).toBe("12.3 kWh");
    expect(fmtEnergy(HASS, 1234)).toBe("1.23 MWh");
    expect(fmtEnergy(HASS, -2)).toBe("2.0 kWh");
    expect(fmtEnergy(HASS, null)).toBe("–");
    expect(fmtEnergy(HASS, 1.234, undefined, 2)).toBe("1.23 kWh");
  });

  it("names the period, the import and the export, in the colour of what covered most", () => {
    const cfg = cfgOf();
    const kwh = { "sensor.solar": 2, "sensor.import": 6, "sensor.export": 1 };
    const now = nowOf(cfg, kwh);
    const f = allocate(cfg, now, [bucketOf(cfg, kwh)]);
    const s = energySummary(HASS, cfg, now, f, "Today");
    expect(s.parts.map((p) => p.text)).toEqual(["Today", "imported 6.0 kWh", "exported 1.0 kWh"]);
    expect(s.color).toBe(COLORS.gridIn);
    expect(s.tint).toBe(false);
    // the picker names the period: the summary does not
    expect(energySummary(HASS, cfg, now, f).parts[0].text).toBe("imported 6.0 kWh");
  });

  it("moves the links by their share of the home", () => {
    const cfg = cfgOf();
    const kwh = { "sensor.solar": 3, "sensor.import": 1 };
    const f = allocate(cfg, nowOf(cfg, kwh), [bucketOf(cfg, kwh)]);
    const m = shareMotion(f);
    expect(m.of(f.H)).toBe(1000);
    expect(m.of(1)).toBe(250);
    expect(m.a).toEqual({ slowBelow: 0, fastAbove: 1000 });
  });
});

describe("energy-flow-card: the lanes into the home", () => {
  it("runs the source nearest the home's height straight in, without a step", () => {
    // the pairs' two values make their labels a line taller: the battery sits a pixel off the
    // home's centre line, a step that rounded into a crack
    const cfg = cfgOf({ consumers: ["sensor.a", "sensor.b", "sensor.c", "sensor.d"] });
    const kwh = {
      "sensor.solar": 3,
      "sensor.charge": 1,
      "sensor.discharge": 1,
      "sensor.import": 1,
      "sensor.export": 1,
    };
    const f = allocate(cfg, nowOf(cfg, kwh), [bucketOf(cfg, kwh)]);
    for (const width of [340, 416, 640]) {
      const l = layoutTree(cfg, width, f.edges);
      const home = l.nodes.find((n) => n.id === "home")!;
      const battery = l.edges.find((e) => e.from === "s1" && e.to === "home")!;
      // one straight leg, from the battery to the home's circle
      expect(battery.pts).toHaveLength(2);
      expect(battery.pts[0][1]).toBe(battery.pts[1][1]);
      const end = battery.pts[1];
      expect(Math.hypot(end[0] - home.x, end[1] - home.y)).toBeCloseTo(home.d / 2, 5);
    }
  });
});

describe("hover", () => {
  it("is the default of every node on the card; a source, the home or a consumer overrides it", () => {
    const c = normalizeEnergyFlowConfig({
      hover: true,
      home: "sensor.home_energy",
      sources: [
        { type: "solar", entity: "sensor.solar_energy", hover: false },
        { type: "grid", import: "sensor.grid_import_energy", export: "sensor.grid_export_energy" },
      ],
      consumers: [{ entity: "sensor.ev_energy", hover: false }, { entity: "sensor.washer_energy" }],
    });
    expect(Object.fromEntries(c.entities.map((e) => [e.entity, e.hover]))).toMatchObject({
      "sensor.home_energy": true,
      "sensor.solar_energy": false,
      "sensor.grid_import_energy": true,
      "sensor.grid_export_energy": true,
      "sensor.ev_energy": false,
      "sensor.washer_energy": true,
    });
    const off = normalizeEnergyFlowConfig({
      sources: [{ type: "solar", entity: "sensor.solar_energy" }],
    });
    expect(off.entities.every((e) => !e.hover)).toBe(true);
  });
});

describe("energy-flow-card: the dashboard's energy period", () => {
  const TZ = "Europe/Berlin";
  const at = (iso: string) => new Date(iso);
  // a period as Home Assistant's picker sets it: from a day's start to the last instant of a day
  const ha = (from: string, to?: string) => ({
    start: at(`${from}T00:00:00+01:00`),
    end: to ? new Date(at(`${to}T00:00:00+01:00`).getTime() - 1) : undefined,
  });
  const NOW = at("2026-03-12T10:00:00+01:00").getTime();

  it("looks only where Home Assistant keeps it: the collection key, else the dashboard's", () => {
    expect(collectionKey("dashboard-energy", null)).toBe("_energy_dashboard-energy");
    expect(collectionKey("lovelace", "energy_upstairs")).toBe("_energy_upstairs");
    expect(collectionKey(undefined, null)).toBe("_energy");
  });

  it("finds a collection by its period and subscription, nothing else", () => {
    const coll = { start: new Date(), subscribe: () => () => {} };
    expect(findCollection({ _energy_x: coll }, "_energy_x")).toBe(coll);
    // another dashboard's never stands in
    expect(findCollection({ _energy: coll }, "_energy_x")).toBeNull();
    expect(findCollection({ _energy: { start: "today" } }, "_energy")).toBeNull();
    expect(findCollection({ _energy: { subscribe: () => {} } }, "_energy")).toBeNull();
  });

  it("takes a day, week, month or year as that period", () => {
    const today = followedRange(ha("2026-03-12", "2026-03-13"), NOW, TZ);
    expect(today).toMatchObject({ open: true, granularity: "hour" });
    expect(today.key).toMatch(/^day:/);
    expect(followedRange(ha("2026-03-11", "2026-03-12"), NOW, TZ)).toMatchObject({ open: false });
    expect(followedRange(ha("2026-03-09", "2026-03-16"), NOW, TZ).key).toMatch(/^week:/);
    expect(followedRange(ha("2026-03-01", "2026-04-01"), NOW, TZ).key).toMatch(/^month:/);
    expect(followedRange(ha("2026-01-01", "2027-01-01"), NOW, TZ)).toMatchObject({
      granularity: "month",
    });
  });

  it("takes any other run of days as such, and a period without an end as its first day", () => {
    const r = followedRange(ha("2026-03-01", "2026-03-11"), NOW, TZ);
    expect(r.key).toMatch(/^range:/);
    expect((r.end - r.start) / 86400e3).toBe(10);
    expect(followedRange(ha("2026-03-05"), NOW, TZ).key).toMatch(/^day:/);
  });

  it("keeps a day of a clock change whole, and names the days of a picker in another zone", () => {
    // the clocks go forward on 29 March: a day of 23 hours
    const r = followedRange(ha("2026-03-29", "2026-03-30"), NOW, TZ);
    expect(r.key).toMatch(/^day:/);
    expect(r.end - r.start).toBe(23 * 3600e3);
    // midnight in London is 01:00 in Berlin: still the same day
    const london = { start: at("2026-03-05T00:00:00Z"), end: at("2026-03-05T23:59:59.999Z") };
    expect(followedRange(london, NOW, TZ).start).toBe(at("2026-03-05T00:00:00+01:00").getTime());
  });
});
