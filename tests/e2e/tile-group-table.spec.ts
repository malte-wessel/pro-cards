// A tile group's table in a browser: one line per tile, the name in small capitals at its start,
// the value at its end with one control or visual after it, and the order a narrow card gives way
// in: the status, then the name, then the control; the value never.
import { test, expect, mount, card, calls } from "./util.ts";

const G = "custom:tile-group-card-pro";
const TILES = [
  { entity: "light.living_room", name: "Ceiling" },
  { entity: "climate.living_room", name: "Thermostat" },
  { entity: "cover.living_room_blinds", name: "Blinds" },
  { entity: "lock.front_door", name: "Front door" },
  { entity: "sensor.phone_battery", name: "Phone", visual: "bar" },
];

test.describe("tile group table", () => {
  test("is one line a tile: the name, the value and one thing at the end", async ({ page }) => {
    await mount(page, { type: G, layout: "table", tiles: TILES, grid_options: { columns: 12 } });
    const rows = card(page).locator("tile-card-pro");
    await expect(rows).toHaveCount(5);
    const name = rows.nth(0).locator(".tname");
    await expect(name).toHaveText("Ceiling");
    await expect(name).toHaveCSS("text-transform", "uppercase");
    for (let i = 0; i < 5; i++) {
      const box = (await rows.nth(i).locator("ha-card").boundingBox())!;
      // one line of 34 px, its value at the end
      expect(box.height).toBeLessThanOrEqual(34);
      const end = (await rows.nth(i).locator(".line > .end").boundingBox())!;
      expect(box.x + box.width - (end.x + end.width)).toBeLessThan(20);
    }
    // no icon anywhere, a slider-less light's switch, the status beside a cover's buttons
    await expect(card(page).locator(".tlead, .lead")).toHaveCount(0);
    await expect(rows.nth(0).locator(".end > .toggle")).toBeVisible();
    await expect(rows.nth(0).locator(".tstatus")).toHaveCount(0);
    await expect(rows.nth(2).locator(".tstatus")).toHaveText("Open");
    await expect(rows.nth(4).locator(".end > .bbar")).toBeVisible();
    // a lock is held at the end, as its icon is on a tile
    await expect(rows.nth(3).locator(".end > .ctl-hold")).toBeVisible();
    // the switch switches, as a tile's
    await rows.nth(0).locator(".end > .toggle").click();
    expect((await calls(page)).map((c) => c.service)).toContain("toggle");
  });

  test("gives way on a narrow card: the status, the name, the control; never the value", async ({
    page,
  }) => {
    await mount(page, { type: G, layout: "table", tiles: TILES }, { width: 220 });
    const row = (i: number) => card(page).locator("tile-card-pro").nth(i);
    // the thermostat: no room for its status beside a whole name and the stepper
    await expect(row(1).locator(".row.tile")).toHaveClass(/tbare|tdrop/);
    for (let i = 0; i < 5; i++) {
      const box = (await row(i).locator("ha-card").boundingBox())!;
      await expect(row(i).locator(".end > .state")).toBeVisible();
      // whatever shows stays inside the row, the value whole
      for (const el of await row(i).locator(".end > :visible").all()) {
        const b = (await el.boundingBox())!;
        expect(b.x + b.width).toBeLessThanOrEqual(box.x + box.width + 0.5);
      }
      const value = row(i).locator(".end > .state");
      expect(await value.evaluate((e) => e.scrollWidth <= e.clientWidth + 0.5)).toBe(true);
    }
  });
});

test.describe("tile group vertical_align: stretch", () => {
  // the card's box, and the room under its header: the body's box, less its 4 px padding
  const fill = async (page: import("@playwright/test").Page, layout: string, n: number) => {
    const tiles = ["light.living_room", "light.kitchen", "light.bedroom"].slice(0, n);
    await mount(page, [
      { type: G, layout, title: "T", tiles, grid_options: { columns: 12, rows: 6 } },
      {
        type: G,
        layout,
        title: "T",
        tiles,
        vertical_align: "stretch",
        grid_options: { columns: 12, rows: 6 },
      },
    ]);
    const out = [];
    for (const i of [0, 1]) {
      const c = card(page, i);
      const body = (await c.locator("ha-card > .body").first().boundingBox())!;
      const box = (await c.boundingBox())!;
      const cards = c.locator("tile-card-pro ha-card");
      const first = (await cards.first().boundingBox())!;
      const last = (await cards.last().boundingBox())!;
      out.push({ body, box, first, last });
    }
    return out;
  };
  for (const [layout, n] of [
    ["list", 2],
    ["table", 3],
    ["row", 3],
  ] as const)
    test(`${layout}: the tiles share the card's height, alike`, async ({ page }) => {
      const [top, stretch] = await fill(page, layout, n);
      // at the top: the tiles end well above the card's bottom
      expect(top.box.y + top.box.height - (top.last.y + top.last.height)).toBeGreaterThan(16);
      // stretched: they reach it, and the first is as tall as the last
      expect(
        Math.abs(stretch.body.y + stretch.body.height - 4 - (stretch.last.y + stretch.last.height)),
      ).toBeLessThan(2);
      expect(Math.abs(stretch.first.height - stretch.last.height)).toBeLessThan(2);
    });
  test("row: wrapped lines grow alike, each tile's content centred", async ({ page }) => {
    const scenes = ["bright", "dimmed", "dinner", "movie_night", "good_night"].map(
      (s) => `scene.${s}`,
    );
    await mount(page, {
      type: G,
      layout: "row",
      title: "Scenes",
      tiles: scenes,
      vertical_align: "stretch",
      grid_options: { columns: 6, rows: 8 },
    });
    const tiles = card(page).locator("tile-card-pro ha-card");
    const first = (await tiles.first().boundingBox())!;
    const last = (await tiles.last().boundingBox())!;
    // two lines at least, as tall as each other
    expect(last.y).toBeGreaterThan(first.y + first.height - 1);
    expect(Math.abs(first.height - last.height)).toBeLessThan(2);
    // the content in the middle of the tile: as much room above it as below it
    const parts = tiles.first().locator(".body > *:visible");
    const top = (await parts.first().boundingBox())!;
    const bottom = (await parts.last().boundingBox())!;
    const above = top.y - first.y;
    const below = first.y + first.height - (bottom.y + bottom.height);
    expect(above).toBeGreaterThan(24);
    expect(Math.abs(above - below)).toBeLessThan(4);
  });
});
