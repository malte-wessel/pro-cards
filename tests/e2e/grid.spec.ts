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

test("a numeric row count clamps like Home Assistant's", async ({ page }) => {
  // min_rows lifts a smaller count
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
  for (const cfg of [...CARDS, ...MORE]) {
    const own = await alone(cfg);
    await mount(page, [half(cfg), half(TALL)], { fullWidth: false });
    const row = Math.max(own, tall);
    expect(await height(page, 0), `${cfg.type} beside the list`).toBe(row);
    expect(await height(page, 1), `the list beside ${cfg.type}`).toBe(row);
  }
});

test("fill_height: false keeps a card at its own height; fixed rows still fill", async ({
  page,
}) => {
  const alone = async (cfg: object) => {
    await mount(page, [half(cfg)], { fullWidth: false });
    return height(page, 0);
  };
  const tall = await alone(TALL);
  for (const cfg of [...CARDS, ...MORE]) {
    const own = { ...cfg, fill_height: false };
    const natural = await alone(own);
    if (natural >= tall) continue;
    await mount(page, [half(own), half(TALL)], { fullWidth: false });
    expect(await height(page, 0), `${cfg.type} beside the list`).toBe(natural);
    expect(await height(page, 1), `the list beside ${cfg.type}`).toBe(tall);
    // a cell with fixed rows has that height whatever the card wants
    await mount(page, { ...own, grid_options: { columns: 12, rows: 7 } });
    expect(await height(page, 0), `${cfg.type} in fixed rows`).toBe(cell(7));
  }
});

test("a multi trend card sizes to its content and fills a taller row", async ({ page }) => {
  // about the three rows it used to pin on its own
  await mount(page, [half(CARDS[2])], { fullWidth: false });
  const own = await height(page, 0);
  expect(own).toBeGreaterThan(cell(2));
  expect(own).toBeLessThan(cell(4));
  const trend = await card(page, 0)
    .locator(".trend")
    .boundingBox()
    .then((b) => b!.height);
  // beside a taller card (the weather station's tiles) it fills the row and its plot grows
  await mount(page, [half(CARDS[2]), half(TALL)], { fullWidth: false });
  expect(await height(page, 0)).toBe(await height(page, 1));
  expect(
    await card(page, 0)
      .locator(".trend")
      .boundingBox()
      .then((b) => b!.height),
  ).toBeGreaterThan(trend);
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
    expect(p.h).toBeLessThanOrEqual(56);
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

test.describe("edges of filling", () => {
  test("a tile whose header has nothing to show is one row again", async ({ page }) => {
    // the header holds only a header entity, hidden while the kitchen light is off
    const tile = {
      type: "custom:wind-card-pro",
      entity: "sensor.wind_speed",
      header_entities: [
        {
          entity: "sensor.outdoor_temperature",
          visibility: [{ condition: "state", entity: "light.kitchen", state: "on" }],
        },
      ],
    };
    await page.goto("/");
    await page.evaluate(() => window.pc.world.set("light.kitchen", "off"));
    await mount(page, tile, { layout: null });
    expect(await height(page, 0)).toBe(56);
    await page.evaluate(() => window.pc.world.set("light.kitchen", "on"));
    await expect(card(page).locator(".header")).toBeVisible();
    // ha-card eases its size changes (Home Assistant's transition)
    await expect.poll(() => height(page, 0)).toBe(120);
  });

  test("a tile is one row under a theme without a card border", async ({ page }) => {
    for (const cfg of [MORE[0], { type: "custom:weather-card-pro", entity: "weather.home" }]) {
      await mount(page, cfg, { layout: null, skin: "graphite" });
      expect(await height(page, 0), cfg.type).toBe(56);
    }
  });

  test("power flow in a cell too small for it still draws its tree", async ({ page }) => {
    await mount(page, { ...CARDS[6], grid_options: { columns: 12, rows: 2, min_rows: 1 } });
    const diag = card(page).locator(".pdiag");
    expect((await diag.boundingBox())!.height).toBeGreaterThanOrEqual(64);
    const transform = await card(page)
      .locator(".pscale")
      .evaluate((e) => (e as HTMLElement).style.transform);
    expect(Number(/scale\(([\d.]+)\)/.exec(transform)?.[1])).toBeGreaterThan(0.2);
  });

  test("plots side by side in a grid count as one row of the card's room", async ({ page }) => {
    // a grid section with two sparklines in one row and a list section with one: both rows of
    // plots get the same share
    await mount(page, {
      type: "custom:entity-sections-card-pro",
      sections: [
        {
          layout: "grid",
          columns: 2,
          entities: [
            { entity: "sensor.power_consumption", visual: "sparkline" },
            { entity: "sensor.outdoor_temperature", visual: "sparkline" },
          ],
        },
        { entities: [{ entity: "sensor.power_consumption", visual: "sparkline" }] },
      ],
      grid_options: { columns: 12, rows: 10 },
    });
    const heights = await card(page)
      .locator(".plot")
      .evaluateAll((ps) => ps.map((p) => p.getBoundingClientRect().height));
    expect(heights).toHaveLength(3);
    expect(heights[0]).toBeGreaterThan(80);
    expect(Math.abs(heights[0] - heights[2])).toBeLessThanOrEqual(24);
  });
});
