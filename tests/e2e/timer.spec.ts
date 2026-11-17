// A timer's time left in a browser: it runs down every second without filling its row again (the
// page clock), on a tile, a poster, a badge and a table's row, its bar with it; paused it stands
// and says so. A timestamp counts down where `format` writes it as a span.
// timer.light_bypass has 12:34 left when the page loads, sensor.dishwasher_finishes 38 minutes.
import type { Page } from "@playwright/test";
import { test, expect, mount, card, setState } from "./util.ts";

const TILE = "custom:tile-card-pro";
const POSTER = "custom:poster-card-pro";
const START = new Date("2026-06-21T12:00:00+02:00");

// the page's clock runs only where the test moves it
const at = async (page: Page) => {
  await page.clock.install({ time: START });
};
// marks an element, so a later look can tell whether it is still the same one
const mark = (page: Page, sel: string) =>
  card(page).evaluate((el, s) => {
    (el.shadowRoot!.querySelector(s) as HTMLElement & { _kept?: boolean })._kept = true;
  }, sel);
const kept = (page: Page, sel: string) =>
  card(page).evaluate(
    (el, s) => !!(el.shadowRoot!.querySelector(s) as HTMLElement & { _kept?: boolean })?._kept,
    sel,
  );
const width = (page: Page, sel: string) =>
  card(page).evaluate((el, s) => (el.shadowRoot!.querySelector(s) as HTMLElement).style.width, sel);

test.describe("timer", () => {
  test("a tile runs down every second, its bar with it, its row kept", async ({ page }) => {
    await at(page);
    await mount(page, { type: TILE, entity: "timer.light_bypass" }, { liveClock: true });
    const line = card(page).locator(".secondary");
    await expect(line).toHaveText("12:34");
    // the bar: the share of its 45 minutes left
    expect(parseFloat(await width(page, ".bar > i"))).toBeCloseTo((754 / 2700) * 100, 1);
    await mark(page, ".secondary > span");
    await page.clock.runFor(10_000);
    await expect(line).toHaveText("12:24");
    expect(await kept(page, ".secondary > span")).toBe(true);
    expect(parseFloat(await width(page, ".bar > i"))).toBeCloseTo((744 / 2700) * 100, 1);
  });

  test("paused it stands at what is left and says so", async ({ page }) => {
    await at(page);
    await mount(page, { type: TILE, entity: "timer.light_bypass" }, { liveClock: true });
    await setState(page, "timer.light_bypass", "paused", {
      remaining: "0:10:00",
      finishes_at: null,
    });
    const line = card(page).locator(".secondary");
    await expect(line).toHaveText("10:00 · Paused");
    await page.clock.runFor(3000);
    await expect(line).toHaveText("10:00 · Paused");
  });

  test("idle it says so, and its start button runs it", async ({ page }) => {
    await at(page);
    await mount(
      page,
      { type: TILE, entity: "timer.laundry", control: "buttons" },
      { liveClock: true },
    );
    const line = card(page).locator(".secondary");
    await expect(line).toHaveText("Idle");
    expect(await width(page, ".bar > i")).toBe("0%");
    await card(page).locator(".ctl-buttons button").first().click();
    await expect(line).toHaveText("45:00");
    await page.clock.runFor(2000);
    await expect(line).toHaveText("44:58");
  });

  test("the time now after a refill, and after the card was away", async ({ page }) => {
    await at(page);
    await mount(page, { type: TILE, entity: "timer.light_bypass" }, { liveClock: true });
    const line = card(page).locator(".secondary");
    // past the cards' five-minute refresh, which fills the row again from its model
    await page.clock.runFor(5 * 60e3 + 1000);
    await expect(line).toHaveText("7:33");
    await card(page).evaluate((el) => {
      const parent = el.parentElement!;
      el.remove();
      parent.appendChild(el);
    });
    await page.clock.runFor(2000);
    await expect(line).toHaveText("7:31");
  });

  test("a poster's value runs down; paused, its corner says so", async ({ page }) => {
    await at(page);
    await mount(page, { type: POSTER, entity: "timer.light_bypass" }, { liveClock: true });
    const value = card(page).locator(".pvalue b");
    await expect(value).toHaveText("12:34");
    await expect(card(page).locator(".pstatus")).toHaveClass(/empty/);
    await page.clock.runFor(4000);
    await expect(value).toHaveText("12:30");
    await setState(page, "timer.light_bypass", "paused", {
      remaining: "0:12:30",
      finishes_at: null,
    });
    await expect(card(page).locator(".pstatus")).toHaveText("Paused");
  });

  test("a value written as a span or the time from now", async ({ page }) => {
    await at(page);
    await mount(
      page,
      [
        { type: TILE, entity: "timer.light_bypass", format: "duration" },
        { type: POSTER, entity: "timer.light_bypass", format: "relative" },
      ],
      { liveClock: true },
    );
    await expect(card(page, 0).locator(".secondary")).toHaveText("12m 34s");
    await expect(card(page, 1).locator(".pvalue b")).toHaveText("in 13 minutes");
    await page.clock.runFor(2000);
    await expect(card(page, 0).locator(".secondary")).toHaveText("12m 32s");
  });

  test("visual: false leaves the bar out, a poster draws it too", async ({ page }) => {
    await at(page);
    await mount(
      page,
      [
        { type: TILE, entity: "timer.light_bypass", visual: false },
        { type: POSTER, entity: "timer.light_bypass" },
      ],
      { liveClock: true },
    );
    await expect(card(page, 0).locator(".secondary")).toHaveText("12:34");
    await expect(card(page, 0).locator(".bar")).toHaveCount(0);
    await expect(card(page, 1).locator(".bar")).toHaveCount(1);
  });

  test("a tick draws nothing again; a text that grew fits the value again", async ({ page }) => {
    await at(page);
    // an hour left, written as a span: 1h, then 59m 59s
    await mount(
      page,
      { type: POSTER, entity: "timer.pt_hour", format: "duration" },
      {
        liveClock: true,
        states: {
          "timer.pt_hour": {
            like: "timer.light_bypass",
            attributes: {
              duration: "2:00:00",
              finishes_at: new Date(START.getTime() + 3600e3 + 3000).toISOString(),
            },
          },
        },
      },
    );
    const value = card(page).locator(".pvalue b");
    await expect(value).toHaveText("1h");
    // the card's renders counted from here
    await card(page).evaluate((el) => {
      const c = el as HTMLElement & { _render(): void; renders?: number };
      const render = c._render.bind(c);
      c.renders = 0;
      c._render = () => {
        c.renders!++;
        render();
      };
    });
    const renders = () => card(page).evaluate((el) => (el as { renders?: number }).renders);
    await page.clock.runFor(1000);
    await expect(value).toHaveText("1h");
    expect(await renders()).toBe(0);
    await page.clock.runFor(3000);
    await expect(value).toHaveText("59m 59s");
    expect(await renders()).toBeGreaterThan(0);
  });

  test("badges: a timer's time left, a date's as a clock or a span", async ({ page }) => {
    await at(page);
    await mount(
      page,
      {
        type: TILE,
        entity: "light.hallway",
        badges: [
          "timer.light_bypass",
          { entity: "sensor.dishwasher_finishes", format: "clock" },
          { entity: "sensor.dishwasher_finishes", format: "duration" },
        ],
      },
      { liveClock: true },
    );
    const values = card(page).locator(".hval .state");
    await expect(values).toHaveText(["12:34", "38:00", "38m"]);
    await page.clock.runFor(5000);
    await expect(values).toHaveText(["12:29", "37:55", "37m 55s"]);
  });

  test("a table's row runs down", async ({ page }) => {
    await at(page);
    await mount(
      page,
      {
        type: "custom:tile-group-card-pro",
        layout: "table",
        tiles: [{ entity: "timer.light_bypass" }],
      },
      { liveClock: true },
    );
    const value = card(page).locator("tile-card-pro .end .state");
    await expect(value).toHaveText("12:34");
    await page.clock.runFor(1000);
    await expect(value).toHaveText("12:33");
  });
});
