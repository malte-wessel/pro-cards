// Strings from the config, rendered templates and entity attributes never turn into markup: a
// colour, an icon or a device class with a quote in it stays a value (or counts as none).
import type { Page } from "@playwright/test";
import { test, expect, mount, setState } from "./util.ts";

// closes an attribute and adds one of its own, or closes the element and adds another
const ATTR = 'red" data-pwned="1';
const TAG = '"><b class="pwned"></b><i x="';

// the injected attribute or element anywhere on the page, shadow roots included
const injected = (page: Page) =>
  page.evaluate(() => {
    let n = 0;
    const walk = (root: Document | ShadowRoot) => {
      n += root.querySelectorAll("[data-pwned], .pwned").length;
      for (const el of root.querySelectorAll("*")) if (el.shadowRoot) walk(el.shadowRoot);
    };
    walk(document);
    return n;
  });

for (const payload of [ATTR, TAG]) {
  test.describe(`payload ${JSON.stringify(payload)}`, () => {
    test("sun path and sun azimuth: the icon and the colours", async ({ page }) => {
      await mount(page, [
        {
          type: "custom:sun-path-card-pro",
          title: "Sun",
          icon: payload,
          day_color: payload,
          night_color: payload,
          sun_color: payload,
        },
        {
          type: "custom:sun-azimuth-card-pro",
          title: "Sun",
          icon: payload,
          view: "dial",
          sun_color: payload,
        },
      ]);
      expect(await injected(page)).toBe(0);
      // the icon is still set, as the string it is
      await expect(page.locator(".header > ha-icon").first()).toHaveAttribute("icon", payload);
    });
    test("entity cards: rule and template colours, the device class", async ({ page }) => {
      await mount(page, [
        {
          type: "custom:entity-card-pro",
          entity: "sensor.power_consumption",
          visual: "strip",
          rules: [{ above: 0, color: payload }],
        },
        {
          type: "custom:entity-card-pro",
          entity: "sensor.power_consumption",
          visual: "sparkline",
          color: payload,
        },
        {
          type: "custom:entity-card-pro",
          entity: "binary_sensor.door_front",
          visual: "strip",
        },
      ]);
      // the cards re-render with the integration's attribute
      await setState(page, "binary_sensor.door_front", "off", {
        device_class: payload,
        friendly_name: "Front door",
      });
      await expect(page.locator("#root .cell").nth(2).locator("> *")).toBeAttached();
      expect(await injected(page)).toBe(0);
    });
    test("multi trend and illuminance: series and zone colours", async ({ page }) => {
      await mount(page, [
        {
          type: "custom:multi-trend-card-pro",
          entities: [{ entity: "sensor.power_consumption", color: payload }],
        },
        ...["arc", "band", "trend"].map((mode) => ({
          type: "custom:illuminance-card-pro",
          entity: "sensor.illuminance",
          mode,
          zones: { night: { color: payload }, day: { color: payload } },
        })),
      ]);
      expect(await injected(page)).toBe(0);
    });
  });
}
