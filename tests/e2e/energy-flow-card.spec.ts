import { test, expect, mount, card, FROZEN } from "./util.ts";
import type { Locator, Page } from "@playwright/test";

// The demo world's meters (meters.ts) and their statistics, under the frozen clock: Sunday,
// 21 June 2026, 12:00 in Berlin (playwright.config.ts)
const T = "custom:energy-flow-card-pro";
const SRC = [
  { type: "solar", entity: "sensor.solar_energy" },
  {
    type: "battery",
    charge: "sensor.battery_charge_energy",
    discharge: "sensor.battery_discharge_energy",
    soc: "sensor.battery_soc",
  },
  { type: "grid", import: "sensor.grid_import_energy", export: "sensor.grid_export_energy" },
];
const HOME = "sensor.home_energy";

const title = (c: Locator) => c.locator(".header .title");
const chip = (c: Locator) => c.locator(".ppicker .pchip");
const prev = (c: Locator) => c.locator(".ppicker .prev");
const next = (c: Locator) => c.locator(".ppicker .next");
const home = (c: Locator) => c.locator(".psummary .primary");
const dp = (c: Locator) => c.locator(".dp");
const day = (c: Locator, d: number) =>
  dp(c).locator(".dp-cell:not(.dim)", { hasText: new RegExp(`^${d}$`) });
// the engines differ in the spaces around a range's dash
const label = async (c: Locator) => ((await chip(c).textContent()) ?? "").replace(/\s*–\s*/, " – ");

// what the home meter counted from `start` to `end` (ms after the frozen noon's midnight), by its
// statistics: what the card shows for a closed period
const counted = (page: Page, start: number, end: number) =>
  page.evaluate(
    ([s, e]) => {
      const w = window.pc.world as unknown as {
        statistics: (...a: unknown[]) => Record<string, { change?: number }[]>;
      };
      const rows = w.statistics(["sensor.home_energy"], s, e, "hour", ["change"], "kWh")[
        "sensor.home_energy"
      ];
      return rows.reduce((a, r) => a + (r.change ?? 0), 0);
    },
    [start, end] as const,
  );
const midnight = (d: number) =>
  new Date(`2026-06-${String(d).padStart(2, "0")}T00:00:00`).getTime();

test.describe("energy flow card", () => {
  test("shows today's totals with a picker in the header and a title of its own", async ({
    page,
  }) => {
    await mount(page, { type: T, home: HOME, sources: SRC });
    const c = card(page);
    await expect(title(c)).toHaveText("Energy");
    await expect(chip(c)).toHaveText("Today");
    await expect(next(c)).toBeDisabled();
    await expect(prev(c)).toBeEnabled();
    await expect(home(c)).toHaveText(/^Home · \d+\.\d kWh$/);
    // the button names the period: the summary does not say it again
    await expect(c.locator(".psummary .secondary")).toHaveText(
      /^imported \d+\.\d kWh( · exported \d+\.\d kWh)? · self-sufficient \d+ %$/,
    );
    await expect(c.locator(".plabel[data-node='s1']")).toHaveText(/↓.*↑|kWh/);
  });

  test("steps back and forward, a closed day without what came after it", async ({ page }) => {
    await mount(page, { type: T, home: HOME, sources: SRC });
    const c = card(page);
    const today = await home(c).textContent();
    await prev(c).click();
    await expect(chip(c)).toHaveText("Yesterday");
    await expect(next(c)).toBeEnabled();
    // yesterday is its statistics alone: nothing the meters counted today
    const kwh = await counted(page, midnight(20), midnight(21));
    await expect(home(c)).toHaveText(`Home · ${kwh.toFixed(1)} kWh`);
    await prev(c).click();
    await expect(chip(c)).toHaveText("Fri 19 Jun");
    await next(c).click();
    await next(c).click();
    await expect(chip(c)).toHaveText("Today");
    await expect(next(c)).toBeDisabled();
    await expect(home(c)).toHaveText(today!);
  });

  test("picks a quick period or any range of days in the calendar", async ({ page }) => {
    await mount(page, { type: T, home: HOME, sources: SRC });
    const c = card(page);
    await chip(c).click();
    await expect(dp(c)).toBeVisible();
    await expect(chip(c)).toHaveAttribute("aria-expanded", "true");
    // the quick pick of the period shown: a running week too, although it ends after today
    await expect(dp(c).locator(".dp-preset.on")).toHaveText(["Today"]);
    // nothing after today
    await expect(day(c, 22)).toBeDisabled();
    await expect(day(c, 21)).toHaveAttribute("aria-current", "date");
    await dp(c).locator(".dp-preset", { hasText: "This month" }).click();
    await expect(dp(c)).toHaveCount(0);
    await expect(chip(c)).toHaveText("This month");
    // two clicks: the first day and the last, the band in between while choosing
    await chip(c).click();
    await day(c, 3).click();
    await expect(dp(c).locator(".dp-hint")).toHaveText("Pick the last day");
    await day(c, 5).hover();
    await expect(dp(c).locator(".dp-cell.in.pending")).toHaveCount(3);
    await day(c, 5).click();
    expect(await label(c)).toBe("3 – 5 Jun");
    const kwh = await counted(page, midnight(3), midnight(6));
    await expect(home(c)).toHaveText(`Home · ${kwh.toFixed(1)} kWh`);
    // a range steps by its length
    await prev(c).click();
    expect(await label(c)).toBe("31 May – 2 Jun");
    // the calendar opens on the shown range's month; a range that is a week (Monday to Sunday)
    // is the week, and steps by weeks
    await chip(c).click();
    await expect(dp(c).locator(".dp-title")).toHaveText("May 2026");
    await day(c, 17).click();
    await day(c, 11).click();
    expect(await label(c)).toBe("11 – 17 May");
    await next(c).click();
    expect(await label(c)).toBe("18 – 24 May");
  });

  test("works the calendar with the keyboard and gives the focus back", async ({ page }) => {
    await mount(page, { type: T, home: HOME, sources: SRC });
    const c = card(page);
    await chip(c).click();
    // the focus is on the shown period's first day: today
    await expect(day(c, 21)).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Enter");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Enter");
    expect(await label(c)).toBe("13 – 20 Jun");
    await chip(c).click();
    await page.keyboard.press("Escape");
    await expect(dp(c)).toHaveCount(0);
    await expect(chip(c)).toBeFocused();
    expect(await label(c)).toBe("13 – 20 Jun");
  });

  test("goes back to its period after ten minutes untouched", async ({ page }) => {
    await page.clock.install({ time: FROZEN });
    await mount(page, { type: T, home: HOME, sources: SRC }, { liveClock: true });
    const c = card(page);
    await prev(c).click();
    await expect(chip(c)).toHaveText("Yesterday");
    await page.clock.runFor(9 * 60e3);
    await expect(chip(c)).toHaveText("Yesterday");
    await page.clock.runFor(2 * 60e3);
    await expect(chip(c)).toHaveText("Today");
  });

  test("its default title is a title like any: a button with its name", async ({ page }) => {
    await mount(page, {
      type: T,
      home: HOME,
      sources: SRC,
      title_tap_action: { action: "navigate", navigation_path: "/energy" },
    });
    const c = card(page);
    await expect(title(c)).toHaveText("Energy");
    await expect(title(c)).toHaveAttribute("aria-label", "Energy");
    await expect(title(c)).toHaveAttribute("role", "button");
  });

  test("without the picker, the summary names the configured period", async ({ page }) => {
    await mount(page, {
      type: T,
      title: "Last month",
      period: "month",
      period_picker: false,
      home: HOME,
      sources: SRC,
    });
    const c = card(page);
    await expect(c.locator(".ppicker")).toHaveCount(0);
    await expect(title(c)).toHaveText("Last month");
    await expect(c.locator(".psummary .secondary .accent")).toHaveText("This month");
  });

  test("keeps the picker's buttons in place whatever the period's name", async ({ page }) => {
    await mount(page, { type: T, home: HOME, sources: SRC });
    const c = card(page);
    const boxes = () =>
      c
        .locator(".ppicker")
        .evaluate((p) =>
          [...p.children].map((b) => [b.getBoundingClientRect().left, b.clientWidth]),
        );
    const before = await boxes();
    await prev(c).click();
    await prev(c).click();
    await expect(chip(c)).toHaveText("Fri 19 Jun");
    expect(await boxes()).toEqual(before);
  });
});
