// A tile group's list in a browser: with `indent: true`, what is below a tile's line (a bar, a
// slider, a plot) starts at its name, beside the icon; a plot still reaches the tile's end edge, a
// player's progress runs along the whole bottom edge, and a tile without an icon moves nothing.
// By default it all runs under the icon, as on a tile of its own.
import type { Locator, Page } from "@playwright/test";
import { test, expect, mount, card } from "./util.ts";

const G = "custom:tile-group-card-pro";
const TILES = [
  { entity: "sensor.phone_battery", name: "Phone", visual: "bar" },
  { entity: "light.dining_table", name: "Dining table", control: "slider" },
  { entity: "sensor.living_room_temperature", name: "Temperature", visual: "sparkline" },
  { entity: "media_player.living_room_speaker", name: "Player" },
  { entity: "sensor.van_battery", name: "No icon", icon: false, visual: "bar" },
];
const group = (o: Record<string, unknown> = {}) => ({
  type: G,
  tiles: TILES,
  indent: true,
  grid_options: { columns: 12 },
  ...o,
});
const tile = (page: Page, i: number) => card(page).locator("tile-card-pro").nth(i);
const box = async (l: Locator) => (await l.boundingBox())!;
// the start of a tile's name, its icon and its card
const edges = async (t: Locator) => ({
  name: await box(t.locator(".top .texts")),
  card: await box(t.locator("ha-card")),
});

test.describe("tile group indent", () => {
  test("starts a list tile's bar, slider and plot at its name", async ({ page }) => {
    await mount(page, group());
    for (const [i, part] of [
      [0, ".row.tile > .bar"],
      [1, ".row.tile > .ctl-slider"],
      [2, ".row.tile > .plot"],
    ] as const) {
      const t = tile(page, i);
      const e = await edges(t);
      const b = await box(t.locator(part));
      expect(Math.abs(b.x - e.name.x)).toBeLessThanOrEqual(1);
      // inside the card, a plot to its end edge
      expect(b.x + b.width).toBeLessThanOrEqual(e.card.x + e.card.width + 0.5);
      if (i === 2) expect(e.card.x + e.card.width - (b.x + b.width)).toBeLessThanOrEqual(1);
    }
    // a player's progress along the whole bottom edge
    const player = tile(page, 3);
    const p = await box(player.locator(".row.tile > .pprog"));
    const pc = await box(player.locator("ha-card"));
    expect(Math.abs(p.x - pc.x)).toBeLessThanOrEqual(1);
    // no icon: the bar where the name is, at the card's padding
    const bare = tile(page, 4);
    const be = await edges(bare);
    expect(
      Math.abs((await box(bare.locator(".row.tile > .bar"))).x - be.name.x),
    ).toBeLessThanOrEqual(1);
    expect(be.name.x - be.card.x).toBeLessThan(20);
  });

  test("puts a bar right under a name alone: one row, as a name and a value", async ({ page }) => {
    const phone = { entity: "sensor.phone_battery", name: "Phone" };
    await mount(page, group({ tiles: [{ ...phone, visual: "bar", show_value: false }, phone] }));
    const bar = tile(page, 0);
    const name = await box(bar.locator(".top .texts"));
    const b = await box(bar.locator(".row.tile > .bar"));
    expect(b.y - (name.y + name.height)).toBeLessThanOrEqual(12);
    // as tall as the plain tile below it, the icon inside the card
    const h = (await box(bar.locator("ha-card"))).height;
    expect(Math.abs(h - (await box(tile(page, 1).locator("ha-card"))).height)).toBeLessThanOrEqual(
      1,
    );
    const icon = await box(bar.locator(".tlead"));
    const c = await box(bar.locator("ha-card"));
    expect(icon.y + icon.height).toBeLessThanOrEqual(c.y + c.height);
  });

  test("keeps a larger badge beside a name alone inside the card", async ({ page }) => {
    const phone = { entity: "sensor.phone_battery", name: "Phone", show_value: false };
    await mount(
      page,
      group({
        tiles: ["m", "l"].map((size) => ({
          ...phone,
          visual: "bar",
          badges: [{ style: "plain", icon: false, size }],
        })),
      }),
    );
    for (let i = 0; i < 2; i++) {
      const c = await box(tile(page, i).locator("ha-card"));
      const pill = await box(tile(page, i).locator(".tcorner > .row.hval"));
      expect(pill.y - c.y).toBeGreaterThanOrEqual(4);
    }
  });

  test("leaves out what does not fit beside the icon on a narrow tile", async ({ page }) => {
    await mount(
      page,
      group({
        tiles: [
          {
            entity: "cover.living_room_blinds",
            control: { type: "buttons", position: "block" },
          },
          { entity: "sensor.robot_battery", visual: "gauge" },
        ],
      }),
      { width: 200 },
    );
    for (let i = 0; i < 2; i++) {
      const t = tile(page, i);
      const c = await box(t.locator("ha-card"));
      // every button shown inside the card, else the row of them left out
      for (const el of await t.locator(".row.tile > .ctl :is(button, .round):visible").all()) {
        const b = await box(el);
        expect(b.x + b.width).toBeLessThanOrEqual(c.x + c.width + 0.5);
      }
    }
    // the gauge inside the column beside the icon
    const g = tile(page, 1);
    const gauge = await box(g.locator(".row.tile > .gauge"));
    const c = await box(g.locator("ha-card"));
    const name = await box(g.locator(".top .texts"));
    expect(gauge.x).toBeGreaterThanOrEqual(name.x - 0.5);
    expect(gauge.x + gauge.width).toBeLessThanOrEqual(c.x + c.width + 0.5);
  });

  test("runs under the icon by default", async ({ page }) => {
    await mount(page, group({ indent: undefined }));
    for (const [i, part] of [
      [0, ".row.tile > .bar"],
      [1, ".row.tile > .ctl-slider"],
    ] as const) {
      const t = tile(page, i);
      const icon = await box(t.locator(".tlead"));
      expect(Math.abs((await box(t.locator(part))).x - icon.x)).toBeLessThanOrEqual(1);
    }
  });

  test("mirrors in a right-to-left language", async ({ page }) => {
    await mount(page, group({ tiles: [TILES[0]] }));
    await page.evaluate(() => (window.pc.root.dir = "rtl"));
    await mount(page, group({ tiles: [TILES[0]] }));
    const t = tile(page, 0);
    const name = await box(t.locator(".top .texts"));
    const bar = await box(t.locator(".row.tile > .bar"));
    expect(Math.abs(bar.x + bar.width - (name.x + name.width))).toBeLessThanOrEqual(1);
  });
});
