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
