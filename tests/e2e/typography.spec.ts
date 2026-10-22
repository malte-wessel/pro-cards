import { test, expect, mount, card } from "./util.ts";
import type { Locator } from "@playwright/test";

// The cards size their text by Home Assistant's typography variables: the docs' ha.css defines
// them as Home Assistant does, and its Large text theme raises `--ha-font-size-scale` to 1.25.
const style = (loc: Locator, prop: string) =>
  loc.evaluate((e, p) => getComputedStyle(e).getPropertyValue(p).trim(), prop);
const box = (loc: Locator) => loc.evaluate((e) => e.getBoundingClientRect().toJSON() as DOMRect);

const TILE = { type: "custom:entity-card-pro", entity: "sensor.outdoor_temperature" };
const TREND = {
  type: "custom:multi-trend-card-pro",
  title: "Outdoor",
  layout: "lanes",
  x_axis: true,
  y_axis: true,
  entities: [
    { entity: "sensor.outdoor_temperature", name: "Temperature", color: "red" },
    { entity: "sensor.dew_point", name: "Dew point" },
  ],
};
const FLOW = {
  type: "custom:power-flow-card-pro",
  sources: [
    { type: "solar", entity: "sensor.solar_power" },
    { type: "battery", power: "sensor.battery_power", soc: "sensor.battery_soc" },
    { type: "grid", power: "sensor.grid_power" },
  ],
  home: { entity: "sensor.power_consumption" },
  consumers: [
    { entity: "sensor.heat_pump_power", name: "Heat pump" },
    { entity: "sensor.ev_charger_power", name: "EV" },
    { entity: "sensor.washer_power", name: "Washer" },
  ],
};

test.describe("typography", () => {
  test("at Home Assistant's default sizes a tile's lines keep their px sizes", async ({ page }) => {
    await mount(page, TILE);
    const c = card(page);
    expect(await style(c.locator(".primary"), "font-size")).toBe("14px");
    expect(await style(c.locator(".primary"), "line-height")).toBe("20px");
    expect(await style(c.locator(".primary"), "font-weight")).toBe("500");
    expect(await style(c.locator(".secondary"), "font-size")).toBe("12px");
    expect(await style(c.locator(".secondary"), "line-height")).toBe("16px");
  });

  test("the theme's text scale scales the lines and their line heights", async ({ page }) => {
    await mount(page, TILE, { skin: "large" });
    const c = card(page);
    expect(await style(c.locator(".primary"), "font-size")).toBe("17.5px");
    expect(await style(c.locator(".primary"), "line-height")).toBe("25px");
    expect(await style(c.locator(".secondary"), "font-size")).toBe("15px");
    expect(await style(c.locator(".secondary"), "line-height")).toBe("20px");
  });

  test("the tile card's variables style the name and the secondary line", async ({ page }) => {
    await mount(page, TILE);
    await page.evaluate(() => {
      document.body.style.setProperty("--ha-tile-info-secondary-font-size", "18px");
      document.body.style.setProperty("--ha-tile-info-primary-font-weight", "700");
    });
    const c = card(page);
    expect(await style(c.locator(".secondary"), "font-size")).toBe("18px");
    // the line height follows the size it is given (16 / 12 of it) unless the theme sets one
    expect(await style(c.locator(".secondary"), "line-height")).toBe("24px");
    expect(await style(c.locator(".primary"), "font-weight")).toBe("700");
  });

  test("a trend's axis labels keep inside their strip and gutter at a larger size", async ({
    page,
  }) => {
    for (const skin of [undefined, "large"]) {
      await mount(page, TREND, { skin, width: 360 });
      const c = card(page);
      const plot = await box(c.locator(".trend"));
      const xs = c.locator(".axis-label.x");
      expect(await xs.count()).toBeGreaterThan(0);
      for (const x of await xs.all())
        expect((await box(x)).bottom).toBeLessThanOrEqual(plot.bottom);
      // a value label fits the gutter measured for it
      for (const y of await c.locator(".axis-label.y").all())
        expect(await y.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);
      // a lane's label stays above the lane's line: its strip is as tall as its line
      const lane = await box(c.locator(".lane-label").first());
      const fs = parseFloat(await style(c.locator(".lane-label").first(), "font-size"));
      expect(fs).toBe(skin ? 12.5 : 10);
      expect(lane.height).toBeCloseTo(fs * 1.2, 0);
    }
  });

  test("the power flow's labels do not overlap at a larger size", async ({ page }) => {
    for (const skin of [undefined, "large"]) {
      await mount(page, FLOW, { skin, width: 520 });
      const labels = await card(page)
        .locator(".plabel")
        .evaluateAll((els) =>
          els
            .filter((e) => (e as HTMLElement).offsetParent !== null)
            .map((e) => e.getBoundingClientRect().toJSON() as DOMRect),
        );
      expect(labels.length).toBeGreaterThan(3);
      for (let i = 0; i < labels.length; i++)
        for (let j = i + 1; j < labels.length; j++) {
          const a = labels[i],
            b = labels[j];
          const overlap =
            a.left < b.right - 1 &&
            b.left < a.right - 1 &&
            a.top < b.bottom - 1 &&
            b.top < a.bottom - 1;
          expect(overlap, `labels ${i} and ${j} overlap (${skin ?? "default"})`).toBe(false);
        }
    }
  });
});
