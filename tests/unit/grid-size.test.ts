import { describe, it, expect } from "vitest";
import {
  cellSize,
  configGridOptions,
  migrateLayoutOptions,
} from "../../docs/.vitepress/theme/grid.ts";
import { EntityCard } from "../../src/entity-card.ts";
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
