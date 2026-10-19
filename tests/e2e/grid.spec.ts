// The sections grid's fixed rows: Home Assistant gives the height to the cell, and every card
// takes it (the fit-rows attribute); elsewhere a card keeps the height of its content.
import { test, expect, mount, card } from "./util.ts";

const cell = (rows: number) => rows * 56 + (rows - 1) * 8;
const height = (page: import("@playwright/test").Page, i: number) =>
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

test("with fixed rows every card takes exactly its cell", async ({ page }) => {
  for (const cfg of CARDS) {
    for (const rows of [3, 7]) {
      await mount(page, { ...cfg, grid_options: { columns: 12, rows } });
      await expect(card(page), cfg.type).toHaveAttribute("fit-rows");
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

test("auto rows: cards side by side keep their own heights", async ({ page }) => {
  await mount(
    page,
    [
      { ...CARDS[1], grid_options: { columns: 6 } },
      {
        type: "custom:entity-group-card-pro",
        entities: ["sensor.power_consumption", "sensor.outdoor_temperature", "light.kitchen"],
        grid_options: { columns: 6 },
      },
    ],
    { fullWidth: false },
  );
  await expect(card(page, 0)).not.toHaveAttribute("fit-rows");
  expect(await height(page, 1)).toBeGreaterThan((await height(page, 0)) + 50);
});

test("masonry, panel views and stacks ignore the rows", async ({ page }) => {
  await mount(page, { ...CARDS[1], grid_options: { rows: 6 } }, { layout: null });
  await expect(card(page)).not.toHaveAttribute("fit-rows");
  expect(await height(page, 0)).toBeLessThan(cell(3));
});

test.describe("entity plots fill the cell", () => {
  type Page = import("@playwright/test").Page;
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
  type Page = import("@playwright/test").Page;
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
  type Page = import("@playwright/test").Page;
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
