// The heading card in a browser: where its badges start without a title.
import type { Locator } from "@playwright/test";
import { test, expect, mount, card } from "./util.ts";

const rect = (loc: Locator) =>
  loc.evaluate((e) => {
    const r = e.getBoundingClientRect();
    return { left: r.left, right: r.right, w: r.width };
  });

test.describe("heading card", () => {
  test("badges without a title start at the card's edge", async ({ page }) => {
    await mount(page, {
      type: "custom:heading-card-pro",
      style: "subtitle",
      badge_position: "inline",
      badges: ["sensor.outdoor_temperature", "sensor.outdoor_humidity"],
    });
    const c = card(page);
    await expect(c.locator(".htx")).toBeHidden();
    const header = await rect(c.locator(".header"));
    const first = await rect(c.locator(".hvals > .row.hval").first());
    const pad = await c
      .locator(".header")
      .evaluate((e) => parseFloat(getComputedStyle(e).paddingLeft));
    expect(first.left - header.left).toBeCloseTo(pad, 0);
  });

  // with badges at the end and no title, the title's column takes no room
  test("badges at the end without a title get the whole line", async ({ page }) => {
    await mount(
      page,
      {
        type: "custom:heading-card-pro",
        badges: [
          "sensor.outdoor_temperature",
          "sensor.outdoor_humidity",
          "sensor.pressure",
          "sensor.wind_speed",
          "sensor.uv_index",
          "sensor.dew_point",
        ],
      },
      { width: 500 },
    );
    const c = card(page);
    const header = await rect(c.locator(".header"));
    const hvals = await rect(c.locator(".hvals"));
    const pad = await c
      .locator(".header")
      .evaluate((e) => parseFloat(getComputedStyle(e).paddingLeft));
    expect(hvals.left - header.left).toBeCloseTo(pad, 0);
  });

  test("a section heading without a title keeps its line before the badges", async ({ page }) => {
    await mount(
      page,
      {
        type: "custom:heading-card-pro",
        style: "section",
        badges: ["sensor.outdoor_temperature", "sensor.outdoor_humidity"],
      },
      { width: 500 },
    );
    const c = card(page);
    await expect(c.locator(".htx")).toBeHidden();
    const header = await rect(c.locator(".header"));
    const line = await rect(c.locator(".hline"));
    const hvals = await rect(c.locator(".hvals"));
    const pad = await c
      .locator(".header")
      .evaluate((e) => parseFloat(getComputedStyle(e).paddingLeft));
    expect(line.left - header.left).toBeCloseTo(pad, 0);
    expect(line.w).toBeGreaterThan(100);
    expect(hvals.left - line.right).toBeCloseTo(10, 0);
  });
});
