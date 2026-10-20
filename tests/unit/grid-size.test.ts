import { describe, it, expect } from "vitest";
import {
  cellSize,
  configGridOptions,
  migrateLayoutOptions,
} from "../../docs/.vitepress/theme/grid.ts";
import { EntityCard } from "../../src/entity-card.ts";
import { EntityGroupCard } from "../../src/entity-group-card.ts";
import { IlluminanceCard } from "../../src/illuminance-card.ts";
import { MultiTrendCard } from "../../src/multi-trend-card.ts";
import { PowerFlowCard } from "../../src/power-flow-card.ts";
import { SunAzimuthCard } from "../../src/sun-azimuth-card.ts";
import { SunPathCard } from "../../src/sun-path-card.ts";
import { RainCard } from "../../src/rain-card.ts";
import { WeatherCard } from "../../src/weather-card.ts";
import { WindCard } from "../../src/wind-card.ts";

describe("the cell a card gets in the sections grid (docs grid, test harness)", () => {
  it("migrates the old layout_options as Home Assistant does", () => {
    expect(migrateLayoutOptions({ grid_columns: 2, grid_rows: 3, grid_min_rows: 2 })).toEqual({
      columns: 6,
      rows: 3,
      min_rows: 2,
    });
    expect(migrateLayoutOptions({ grid_columns: "full", grid_rows: "auto" })).toEqual({
      columns: "full",
      rows: "auto",
    });
  });
  it("takes grid_options over layout_options", () => {
    expect(
      configGridOptions({ grid_options: { rows: 2 }, layout_options: { grid_rows: 5 } }),
    ).toEqual({ rows: 2 });
    expect(configGridOptions({ layout_options: { grid_rows: 5 } })).toEqual({ rows: 5 });
    expect(configGridOptions({})).toEqual({});
  });
  it("clamps a numeric row count and the columns to the card's own min / max", () => {
    const own = { columns: 6, rows: "auto" as const, min_columns: 3, min_rows: 2 };
    expect(cellSize(own, {})).toEqual({ columns: 6, rows: "auto" });
    expect(cellSize(own, { grid_options: { rows: 1, columns: 2 } })).toEqual({
      columns: 3,
      rows: 2,
    });
    expect(cellSize({ rows: 3 }, { grid_options: { rows: "auto" } })).toEqual({
      columns: 12,
      rows: "auto",
    });
  });
});

describe("tiles size to their content", () => {
  it("a plain tile, and the weather, wind and rain tiles, take one row (two with a header)", () => {
    const tiles: [HTMLElement & { setConfig(c: unknown): void }, unknown, number][] = [
      [new EntityCard(), { entity: "sensor.a" }, 1],
      [new WeatherCard(), { entity: "weather.a" }, 1],
      [new WeatherCard(), { entity: "weather.a", title: "Weather" }, 2],
      [new WindCard(), { entity: "sensor.wind" }, 1],
      [new RainCard(), { entity: "sensor.rain", title: "Rain" }, 2],
    ];
    for (const [el, cfg, rows] of tiles) {
      el.setConfig(cfg);
      const g = (el as unknown as { getGridOptions(): object }).getGridOptions();
      expect(g, el.localName).toMatchObject({ rows: "auto", min_rows: rows });
      expect(g, el.localName).not.toHaveProperty("max_rows");
    }
  });
});

describe("the height a card takes", () => {
  it("fills by default; fill_height: false sets keep-height, from the config alone", () => {
    const cards: [HTMLElement & { setConfig(c: unknown): void }, object][] = [
      [new EntityCard(), { entity: "sensor.a" }],
      [new EntityGroupCard(), { entities: ["sensor.a"] }],
      [new MultiTrendCard(), { entities: ["sensor.a"] }],
      [new IlluminanceCard(), { entity: "sensor.a", mode: "trend" }],
      [new SunPathCard(), {}],
      [new SunAzimuthCard(), {}],
      [new PowerFlowCard(), { sources: [{ type: "grid", power: "sensor.a" }] }],
      [new WeatherCard(), { entity: "weather.a" }],
      [new WindCard(), { entity: "sensor.wind", layout: "hero" }],
    ];
    for (const [el, cfg] of cards) {
      el.setConfig(cfg);
      expect(el.hasAttribute("keep-height"), el.localName).toBe(false);
      el.setConfig({ ...cfg, fill_height: false, grid_options: { rows: 4 } });
      expect(el.hasAttribute("keep-height"), el.localName).toBe(true);
      el.setConfig(cfg);
      expect(el.hasAttribute("keep-height"), el.localName).toBe(false);
    }
    // a card that takes no config keeps no stale opt-out
    const sun = new SunPathCard();
    sun.setConfig({ fill_height: false });
    sun.setConfig(null);
    expect(sun.hasAttribute("keep-height")).toBe(false);
  });
  it("the multi trend card sizes to its content like every card", () => {
    const el = new MultiTrendCard();
    el.setConfig({ entities: ["sensor.a", "sensor.b"], layout: "lanes" });
    expect(el.getGridOptions()).toEqual({ columns: 12, rows: "auto", min_columns: 6, min_rows: 2 });
  });
});

describe("the visual editors' fill_height", () => {
  it("shows it on by default and writes fill_height: false only when it is off", async () => {
    const editors = [
      [await import("../../src/multi-trend/editor.ts"), { entities: ["sensor.a"] }],
      [await import("../../src/sun-path/editor.ts"), {}],
      [await import("../../src/illuminance/editor.ts"), { entity: "sensor.a" }],
    ] as const;
    for (const [ed, cfg] of editors) {
      const toForm = ed.configToForm as (c: object) => Record<string, unknown>;
      const toConfig = ed.formToConfig as (d: object, prev: object) => Record<string, unknown>;
      const data = toForm(cfg);
      expect(data.fill_height).toBe(true);
      expect(toConfig(data, cfg)).not.toHaveProperty("fill_height");
      expect(toConfig({ ...data, fill_height: false }, cfg).fill_height).toBe(false);
      expect(toForm({ ...cfg, fill_height: false }).fill_height).toBe(false);
    }
  });
});
