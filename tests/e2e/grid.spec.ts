// The height a card is given: Home Assistant's sections grid gives a cell with fixed rows a
// height, and stretches an auto cell to its grid row; every card takes that height, as Home
// Assistant's own cards do. Where the height follows the content (masonry, a vertical stack) a
// card keeps the height of its content.
import { test, expect, mount, card } from "./util.ts";

type Page = import("@playwright/test").Page;
const cell = (rows: number) => rows * 56 + (rows - 1) * 8;
const height = (page: Page, i: number) =>
  card(page, i)
    .locator("ha-card")
    .boundingBox()
    .then((b) => Math.round(b!.height));

const CARDS = [
  { type: "custom:entity-card-pro", entity: "sensor.power_consumption", visual: "sparkline" },
  { type: "custom:entity-group-card-pro", entities: ["sensor.power_consumption"] },
  { type: "custom:multi-trend-card-pro", entities: ["sensor.outdoor_temperature"] },
  { type: "custom:sun-path-card-pro" },
  { type: "custom:sun-azimuth-card-pro", view: "dial" },
  { type: "custom:illuminance-card-pro", entity: "sensor.illuminance", mode: "trend" },
  {
    type: "custom:power-flow-card-pro",
    sources: [{ type: "grid", power: "sensor.grid_power" }],
    home: "sensor.power_consumption",
  },
  { type: "custom:weather-card-pro", entity: "weather.home", sections: [{ type: "hero" }] },
  { type: "custom:wind-card-pro", entity: "sensor.wind_speed", layout: "hero" },
];
// the rest of the cards and the tiles, for the stretched grid row
const MORE = [
  { type: "custom:entity-card-pro", entity: "sensor.outdoor_temperature" },
  { type: "custom:entity-card-pro", entity: "sensor.robot_battery", visual: "bar" },
  { type: "custom:entity-card-pro", entity: "sensor.power_consumption", visual: "gauge" },
  { type: "custom:entity-card-pro", entity: "light.kitchen", control: "auto" },
  { type: "custom:entity-sections-card-pro", sections: [{ entities: ["light.kitchen"] }] },
  { type: "custom:sun-azimuth-card-pro", view: "3d" },
  { type: "custom:illuminance-card-pro", entity: "sensor.illuminance", mode: "arc" },
  { type: "custom:weather-card-pro", entity: "weather.home" },
  { type: "custom:wind-card-pro", entity: "sensor.wind_speed", visual: "flow" },
  { type: "custom:rain-card-pro", entity: "sensor.rain_rate_roof", layout: "hero" },
];
// a list as tall as most cards: eight rows
const TALL = {
  type: "custom:entity-group-card-pro",
  entities: [
    "sensor.power_consumption",
    "sensor.outdoor_temperature",
    "light.kitchen",
    "sensor.illuminance",
    "sensor.robot_battery",
    "light.living_room",
    "sensor.wind_speed",
    "sensor.grid_power",
  ],
};
const half = <T extends object>(c: T) => ({ ...c, grid_options: { columns: 6 } });

test("with fixed rows every card takes exactly its cell", async ({ page }) => {
  for (const cfg of CARDS) {
    for (const rows of [3, 7]) {
      await mount(page, { ...cfg, grid_options: { columns: 12, rows } });
      expect(await height(page, 0), `${cfg.type} rows ${rows}`).toBe(cell(rows));
    }
  }
});

test("the old layout_options count like grid_options", async ({ page }) => {
  await mount(page, { ...CARDS[1], layout_options: { grid_rows: 4 } });
  expect(await height(page, 0)).toBe(cell(4));
});

test("a card's own numeric rows clamp like Home Assistant's", async ({ page }) => {
  // the multi trend card asks for 3 rows itself; min_rows lifts a smaller count
  await mount(page, CARDS[2]);
  expect(await height(page, 0)).toBe(cell(3));
  await mount(page, { ...CARDS[1], grid_options: { rows: 1, min_rows: 3 } });
  expect(await height(page, 0)).toBe(cell(3));
});

test("in a grid row every card takes the row's height, the tallest keeps its own", async ({
  page,
}) => {
  // each card alone, then beside the tall list: both fill the row, which is as tall as the
  // taller of the two (a card that fills never shrinks its own row: power flow, sun azimuth)
  const alone = async (cfg: object) => {
    await mount(page, [half(cfg)], { fullWidth: false });
    return height(page, 0);
  };
  const tall = await alone(TALL);
  // the multi trend card asks for fixed rows itself: like any card with fixed rows its cell
  // keeps that height
  for (const cfg of [...CARDS, ...MORE].filter((c) => c.type !== "custom:multi-trend-card-pro")) {
    const own = await alone(cfg);
    await mount(page, [half(cfg), half(TALL)], { fullWidth: false });
    const row = Math.max(own, tall);
    expect(await height(page, 0), `${cfg.type} beside the list`).toBe(row);
    expect(await height(page, 1), `the list beside ${cfg.type}`).toBe(row);
  }
});

test("a stretched tile centres its content, a list keeps its rows at the top", async ({ page }) => {
  const middle = (i: number, sel: string) =>
    card(page, i).evaluate((el, s) => {
      const c = el.shadowRoot!.querySelector("ha-card")!.getBoundingClientRect();
      const b = el.shadowRoot!.querySelector(s)!.getBoundingClientRect();
      return { centre: b.top + b.height / 2 - (c.top + c.height / 2), top: b.top - c.top };
    }, sel);
  // a plain tile alone is exactly one row; beside a gauge tile it stretches, centred
  for (const tile of [MORE[0], MORE[1]]) {
    await mount(page, [half(tile)], { fullWidth: false });
    if (tile === MORE[0]) expect(await height(page, 0)).toBe(56);
    await mount(page, [half(tile), half(MORE[2])], { fullWidth: false });
    expect(await height(page, 0)).toBeGreaterThan(56 * 2);
    expect(Math.abs((await middle(0, ".body")).centre)).toBeLessThanOrEqual(1);
  }
  // a list without plots: its first row stays where it is in a card of its own height
  const list = { type: "custom:entity-group-card-pro", entities: ["light.kitchen"] };
  await mount(page, [half(list)], { fullWidth: false });
  const own = await middle(0, ".row");
  await mount(page, [half(list), half(TALL)], { fullWidth: false });
  expect((await middle(0, ".row")).top).toBeCloseTo(own.top, 0);
});

test("masonry views and vertical stacks ignore the rows", async ({ page }) => {
  await mount(page, { ...CARDS[1], grid_options: { rows: 6 } }, { layout: null });
  expect(await height(page, 0)).toBeLessThan(cell(3));
});

test.describe("entity plots fill the cell", () => {
  // the boxes of the card and of its plots, and each plot's drawn height
  const boxes = (page: Page, i = 0) =>
    card(page, i).evaluate((el) => {
      const c = el.shadowRoot!.querySelector("ha-card")!.getBoundingClientRect();
      const plots = [...el.shadowRoot!.querySelectorAll<HTMLElement>(".plot")].map((p) => {
        const b = p.getBoundingClientRect();
        const view = Number(p.querySelector("svg")!.getAttribute("viewBox")?.split(" ")[3]);
        return { top: b.top, bottom: b.bottom, h: b.height, view };
      });
      const rows = [...el.shadowRoot!.querySelectorAll<HTMLElement>(".row")].map(
        (r) => r.getBoundingClientRect().height,
      );
      return { top: c.top, bottom: c.bottom, h: Math.round(c.height), plots, rows };
    });
  const SPARK = { entity: "sensor.power_consumption", visual: "sparkline" };

  test("a tile's sparkline grows into a taller cell and is drawn at its height", async ({
    page,
  }) => {
    await mount(page, { type: "custom:entity-card-pro", ...SPARK, grid_options: { rows: 4 } });
    const b = await boxes(page);
    expect(b.h).toBe(cell(4));
    const [p] = b.plots;
    expect(p.h).toBeGreaterThan(56 * 2);
    expect(b.bottom - p.bottom).toBeLessThanOrEqual(16);
    expect(Math.abs(p.view - p.h)).toBeLessThanOrEqual(1);
  });

  test("a smaller cell shrinks the plot, nothing leaves the card", async ({ page }) => {
    await mount(page, { type: "custom:entity-card-pro", ...SPARK, grid_options: { rows: 2 } });
    const b = await boxes(page);
    expect(b.h).toBe(cell(2));
    const [p] = b.plots;
    expect(p.h).toBeLessThan(56);
    expect(p.h).toBeGreaterThanOrEqual(24);
    expect(p.bottom).toBeLessThanOrEqual(b.bottom);
    // one row would leave no room for the plot: the tile asks for two at least
    await mount(page, { type: "custom:entity-card-pro", ...SPARK, grid_options: { rows: 1 } });
    expect((await boxes(page)).h).toBe(cell(2));
  });

  test("plots in a list share the room evenly, a plain row keeps its height", async ({ page }) => {
    const entities = [
      SPARK,
      { entity: "sensor.outdoor_temperature", visual: "columns" },
      { entity: "light.kitchen" },
    ];
    await mount(page, { type: "custom:entity-group-card-pro", entities });
    const auto = await boxes(page);
    await mount(page, {
      type: "custom:entity-group-card-pro",
      entities,
      grid_options: { rows: 8 },
    });
    const b = await boxes(page);
    expect(b.h).toBe(cell(8));
    const [a, c] = b.plots;
    expect(a.h).toBeGreaterThan(56 * 2);
    expect(Math.abs(a.h - c.h)).toBeLessThanOrEqual(1);
    expect(b.rows[2]).toBeCloseTo(auto.rows[2], 0);
    expect(b.bottom - c.bottom).toBeLessThanOrEqual(16 + b.rows[2] + 14);
  });

  test("hero and grid layouts grow their plots too", async ({ page }) => {
    for (const layout of ["hero", "grid"]) {
      await mount(page, {
        type: "custom:entity-group-card-pro",
        layout,
        entities: [SPARK, { entity: "sensor.outdoor_temperature", visual: "sparkline" }],
        grid_options: { rows: 7 },
      });
      const b = await boxes(page);
      expect(b.h, layout).toBe(cell(7));
      for (const p of b.plots) {
        expect(p.h, layout).toBeGreaterThan(56);
        expect(p.bottom, layout).toBeLessThanOrEqual(b.bottom);
        expect(Math.abs(p.view - p.h), layout).toBeLessThanOrEqual(1);
      }
    }
  });

  test("a strip keeps its height, and rows: auto or masonry keep every plot's", async ({
    page,
  }) => {
    await mount(page, {
      type: "custom:entity-card-pro",
      entity: "sensor.power_consumption",
      visual: "strip",
      grid_options: { rows: 4 },
    });
    expect((await boxes(page)).plots[0].h).toBe(22 + 14);
    await mount(page, { type: "custom:entity-card-pro", ...SPARK });
    expect((await boxes(page)).plots[0].h).toBe(56);
    await mount(
      page,
      { type: "custom:entity-card-pro", ...SPARK, grid_options: { rows: 4 } },
      { layout: null },
    );
    expect((await boxes(page)).plots[0].h).toBe(56);
  });
});

test.describe("trends and bands fill the cell", () => {
  const box = (page: Page, sel: string) =>
    card(page)
      .locator(sel)
      .first()
      .evaluate((e) => {
        const b = e.getBoundingClientRect();
        const host = (e.getRootNode() as ShadowRoot).host;
        const c = host.shadowRoot!.querySelector("ha-card")!.getBoundingClientRect();
        return { h: b.height, w: b.width, gap: c.bottom - b.bottom };
      });

  test("a weather trend grows, drawn at its height", async ({ page }) => {
    const cfg = {
      type: "custom:weather-card-pro",
      entity: "weather.home",
      sections: [{ type: "hero" }, { type: "trend", mode: "hourly", hours: 12 }],
    };
    await mount(page, cfg);
    const natural = (await box(page, ".trend")).h;
    await mount(page, { ...cfg, grid_options: { rows: 8 } });
    const b = await box(page, ".trend");
    expect(b.h).toBeGreaterThan(natural + 100);
    expect(b.gap).toBeLessThanOrEqual(16);
    const view = await card(page)
      .locator(".trend svg")
      .evaluate((s) => Number(s.getAttribute("viewBox")?.split(" ")[3]));
    expect(Math.abs(view - b.h)).toBeLessThanOrEqual(1);
  });

  test("the wind hero's band grows, its field covers it and survives later renders", async ({
    page,
  }) => {
    const cfg = { type: "custom:wind-card-pro", entity: "sensor.wind_speed", layout: "hero" };
    await mount(page, { ...cfg, grid_options: { rows: 7 } });
    const b = await box(page, ".wflow.band");
    expect(b.h).toBeGreaterThan(120 + 100);
    expect(b.gap).toBeLessThanOrEqual(16);
    const field = card(page).locator(".wflow.band .field");
    const size = await field.evaluate((f) => parseFloat(f.style.getPropertyValue("--size")));
    expect(size).toBeGreaterThanOrEqual(Math.hypot(b.w, b.h));
    // mark the field as built; a new speed scales its playback rate instead of rebuilding it
    await field.evaluate((f) => ((f.firstElementChild as HTMLElement).dataset.mark = "1"));
    await page.evaluate(() => window.pc.world.set("sensor.wind_speed", "9.9"));
    await expect(field.locator("[data-mark='1']")).toHaveCount(1);
  });

  test("the rain hero's drops fall the band's whole height", async ({ page }) => {
    const cfg = {
      type: "custom:rain-card-pro",
      entity: "sensor.rain_rate_roof",
      layout: "hero",
    };
    await mount(page, { ...cfg, grid_options: { rows: 7 } });
    const b = await box(page, ".wflow.band");
    expect(b.h).toBeGreaterThan(120 + 100);
    const fall = await card(page)
      .locator(".wflow.band")
      .evaluate((e) => parseFloat(e.style.getPropertyValue("--H")));
    expect(Math.abs(fall - b.h)).toBeLessThanOrEqual(1);
  });
});

test.describe("sun path and illuminance plots fill the cell", () => {
  const plot = (page: Page) =>
    card(page)
      .locator(".plot")
      .first()
      .evaluate((p) => {
        const b = p.getBoundingClientRect();
        const view = Number(p.querySelector("svg")!.getAttribute("viewBox")?.split(" ")[3]);
        return { h: b.height, view };
      });

  for (const [name, cfg, natural] of [
    ["sun path", { type: "custom:sun-path-card-pro" }, 120],
    [
      "illuminance trend",
      { type: "custom:illuminance-card-pro", entity: "sensor.illuminance", mode: "trend" },
      178,
    ],
  ] as const) {
    test(`${name}: grows with fixed rows, drawn at its height; keeps it otherwise`, async ({
      page,
    }) => {
      await mount(page, cfg);
      expect((await plot(page)).h).toBe(natural);
      await mount(page, { ...cfg, grid_options: { rows: 8 } });
      const p = await plot(page);
      expect(p.h).toBeGreaterThan(natural + 100);
      expect(Math.abs(p.view - p.h)).toBeLessThanOrEqual(1);
      // a smaller cell shrinks it, down to its floor
      await mount(page, { ...cfg, grid_options: { rows: 3 } });
      expect((await plot(page)).h).toBeLessThan(natural);
    });
  }

  test("the illuminance band keeps its height", async ({ page }) => {
    const cfg = { type: "custom:illuminance-card-pro", entity: "sensor.illuminance", mode: "band" };
    await mount(page, cfg);
    const natural = (await plot(page)).h;
    await mount(page, { ...cfg, grid_options: { rows: 6 } });
    expect((await plot(page)).h).toBe(natural);
  });
});
