import { describe, it, expect } from "vitest";
import { configGridOptions, fitRows, migrateLayoutOptions } from "../../../src/shared/grid.ts";
import { EntityCard } from "../../../src/entity-card.ts";
import { EntityGroupCard } from "../../../src/entity-group-card.ts";
import { IlluminanceCard } from "../../../src/illuminance-card.ts";
import { MultiTrendCard } from "../../../src/multi-trend-card.ts";
import { PowerFlowCard } from "../../../src/power-flow-card.ts";
import { SunAzimuthCard } from "../../../src/sun-azimuth-card.ts";
import { SunPathCard } from "../../../src/sun-path-card.ts";
import { WeatherCard } from "../../../src/weather-card.ts";
import { WindCard } from "../../../src/wind-card.ts";

describe("fixed rows in the sections grid", () => {
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
  it("fits the rows only in a sections grid with a numeric row count", () => {
    const own = { columns: 12, rows: "auto" as const };
    expect(fitRows("grid", own, { grid_options: { rows: 4 } })).toBe(true);
    expect(fitRows("grid", own, { layout_options: { grid_rows: 4 } })).toBe(true);
    expect(fitRows("grid", own, {})).toBe(false);
    // the card's own numeric default counts, and the config's "auto" overrides it
    expect(fitRows("grid", { rows: 3 }, {})).toBe(true);
    expect(fitRows("grid", { rows: 3 }, { grid_options: { rows: "auto" } })).toBe(false);
    // masonry and panel views and stacks ignore grid_options
    for (const layout of ["masonry", "panel", undefined])
      expect(fitRows(layout, own, { grid_options: { rows: 4 } })).toBe(false);
  });

  it("sets the fit-rows attribute from the layout Home Assistant hands the card", () => {
    const el = new EntityCard();
    el.setConfig({ entity: "sensor.a", visual: "sparkline", grid_options: { rows: 3 } });
    expect(el.hasAttribute("fit-rows")).toBe(false);
    el.layout = "grid";
    expect(el.hasAttribute("fit-rows")).toBe(true);
    el.setConfig({ entity: "sensor.a", visual: "sparkline" });
    expect(el.hasAttribute("fit-rows")).toBe(false);
    el.setConfig({ entity: "sensor.a", visual: "sparkline", grid_options: { rows: 3 } });
    expect(el.hasAttribute("fit-rows")).toBe(true);
    el.layout = "masonry";
    expect(el.hasAttribute("fit-rows")).toBe(false);
  });
  it("counts a card's own numeric rows (a plain tile is one row)", () => {
    const el = new EntityCard();
    el.layout = "grid";
    el.setConfig({ entity: "sensor.a" });
    expect(el.hasAttribute("fit-rows")).toBe(true);
  });
  it("is the same on every card", () => {
    const sun = { grid_options: { rows: 4 } };
    const cards: [HTMLElement & { setConfig(c: unknown): void; layout?: string }, unknown][] = [
      [new EntityGroupCard(), { entities: ["sensor.a"], ...sun }],
      [new MultiTrendCard(), { entities: ["sensor.a"], ...sun }],
      [new IlluminanceCard(), { entity: "sensor.a", mode: "trend", ...sun }],
      [new SunPathCard(), sun],
      [new SunAzimuthCard(), sun],
      [new PowerFlowCard(), { sources: [{ type: "grid", power: "sensor.a" }], ...sun }],
      [new WeatherCard(), { entity: "weather.a", sections: [{ type: "trend" }], ...sun }],
      [new WindCard(), { entity: "sensor.wind", layout: "hero", ...sun }],
    ];
    for (const [el, cfg] of cards) {
      el.setConfig(cfg);
      el.layout = "grid";
      expect(el.hasAttribute("fit-rows"), el.localName).toBe(true);
      el.layout = undefined;
      expect(el.hasAttribute("fit-rows"), el.localName).toBe(false);
    }
  });
});
