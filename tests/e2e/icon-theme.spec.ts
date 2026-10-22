import { test, expect, mount, card } from "./util.ts";
import type { Locator, Page } from "@playwright/test";

// The icons' shape and soft background follow a theme, as Home Assistant's tile icon does:
// --ha-tile-icon-border-radius and --tile-icon-opacity.
const style = (loc: Locator, prop: string) =>
  loc.evaluate((e, p) => getComputedStyle(e).getPropertyValue(p).trim(), prop);
// a computed colour with no alpha left (Chromium writes a color-mix as color(srgb … / a))
const clear = (c: string) => c === "rgba(0, 0, 0, 0)" || /\/ 0\)$/.test(c);
const theme = (page: Page, vars: Record<string, string>) =>
  page.evaluate((v) => {
    for (const [k, val] of Object.entries(v)) document.body.style.setProperty(k, val);
  }, vars);

const TILE = { type: "custom:entity-card-pro", entity: "sensor.outdoor_temperature" };
const RING = { type: "custom:entity-card-pro", entity: "sensor.robot_battery", visual: "ring" };
const FLOW = {
  type: "custom:power-flow-card-pro",
  sources: [{ type: "solar", entity: "sensor.solar_power" }],
  home: { entity: "sensor.power_consumption" },
  consumers: [{ entity: "sensor.heat_pump_power", name: "Heat pump" }],
};

test.describe("icon theme", () => {
  test("by default an icon sits in a round, soft circle", async ({ page }) => {
    await mount(page, TILE);
    const shape = card(page).locator(".lead .shape");
    expect(await style(shape, "border-radius")).toBe("50%");
    expect(clear(await style(shape, "background-color"))).toBe(false);
  });

  test("the theme's tile icon variables shape the icon and its background", async ({ page }) => {
    await mount(page, TILE);
    await theme(page, { "--ha-tile-icon-border-radius": "8px", "--tile-icon-opacity": "0" });
    const shape = card(page).locator(".lead .shape");
    expect(await style(shape, "border-radius")).toBe("8px");
    expect(clear(await style(shape, "background-color"))).toBe(true);
  });

  test("a ring and a power flow node stay round", async ({ page }) => {
    for (const cfg of [RING, FLOW]) {
      await mount(page, cfg);
      await theme(page, { "--ha-tile-icon-border-radius": "8px" });
      const shapes = card(page).locator(".lead .shape");
      expect(await shapes.count()).toBeGreaterThan(0);
      for (const s of await shapes.all()) expect(await style(s, "border-radius")).toBe("50%");
    }
  });
});
