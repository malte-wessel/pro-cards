import { test, expect, mount, card } from "./util.ts";
import type { Locator } from "@playwright/test";

// The cards read every colour from the theme tokens in scope, so a different Home Assistant
// theme (here Graphite from the docs' ha.css) restyles them without any card code involved.
const style = (loc: Locator, prop: string) =>
  loc.evaluate((e, p) => getComputedStyle(e).getPropertyValue(p).trim(), prop);

test.describe("themes", () => {
  test("Graphite dark recolours surface, text, primary and named colours", async ({ page }) => {
    await mount(
      page,
      {
        type: "custom:entity-card",
        entity: "sensor.outdoor_humidity",
        visual: "ring",
        color: "amber",
      },
      { theme: "dark", skin: "graphite" },
    );
    const c = card(page);
    const haCard = c.locator("ha-card");
    await expect(haCard).toBeVisible();
    expect(await style(haCard, "background-color")).toBe("rgb(35, 36, 43)");
    expect(await style(haCard, "border-top-left-radius")).toBe("20px");
    expect(await style(haCard, "border-top-width")).toBe("0px");
    expect(await style(c, "--primary-color")).toBe("rgb(224, 138, 0)");
    expect(await style(c, "--amber-color")).toBe("rgb(255, 211, 99)");
    // the ring is drawn in the theme's amber, not the HA default amber
    const ring = c.locator(".lead.ring circle.prog");
    expect(await style(ring, "stroke")).toBe("rgb(255, 211, 99)");
  });

  test("Graphite light keeps white cards on a grey page with the orange primary", async ({
    page,
  }) => {
    await mount(
      page,
      { type: "custom:entity-card", entity: "sensor.outdoor_temperature" },
      { theme: "light", skin: "graphite" },
    );
    const c = card(page);
    expect(await style(c.locator("ha-card"), "background-color")).toBe("rgb(255, 255, 255)");
    expect(await style(c, "--primary-color")).toBe("rgb(238, 147, 0)");
    expect(await style(c, "--primary-background-color")).toBe("rgb(234, 235, 238)");
  });

  test("without a skin the Home Assistant default theme applies", async ({ page }) => {
    await mount(
      page,
      { type: "custom:entity-card", entity: "sensor.outdoor_temperature" },
      { theme: "dark" },
    );
    const c = card(page);
    expect(await style(c.locator("ha-card"), "background-color")).toBe("rgb(28, 28, 28)");
    expect(await style(c, "--primary-color")).toBe("#03a9f4");
  });
});
