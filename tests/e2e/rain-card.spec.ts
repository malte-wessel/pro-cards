import { test, expect, mount, events, card, setState, setLanguage } from "./util.ts";
import type { RainCard } from "../../src/rain-card.ts";
import type { Locator } from "@playwright/test";

const T = "custom:rain-card";
const R = "sensor.rain_rate_roof",
  D = "sensor.rain_today",
  W = "sensor.wind_speed",
  B = "sensor.wind_direction";
const cssVar = (loc: Locator, name: string) =>
  loc.evaluate((e, n) => e.style.getPropertyValue(n).trim(), name);
const rules = [
  { below: 0.1, color: "blue-grey", label: "Dry" },
  { below: 2.5, color: "light-blue", label: "Light rain" },
  { below: 7.6, color: "blue", label: "Moderate rain" },
  { below: 50, color: "indigo", label: "Heavy rain" },
  { above: 50, color: "deep-purple", label: "Violent rain", tint_card: true },
];
// the demo world drifts its sensors; pin the rain to the documented values
const pin = async (page: Parameters<typeof card>[0]) => {
  await setState(page, R, "2.4");
  await setState(page, D, "3.6");
  await setState(page, W, "9.4");
  await setState(page, B, "225");
};
const fall = (rate: number) => Math.max(0.38, 0.95 - rate * 0.01);
const grid = (page: Parameters<typeof card>[0]) =>
  page.evaluate(() => (window.pc.card(0) as unknown as RainCard).getGridOptions());

test.describe("rain card", () => {
  test("tile: name, rate and today's total, rule label and colour, grid rows", async ({ page }) => {
    await mount(page, { type: T, entity: R, today: D, rules });
    await pin(page);
    const c = card(page);
    await expect(c.locator("ha-card")).toHaveClass(/layout-tile/);
    await expect(c.locator(".row.wtile .primary")).toHaveText("Roof rain rate");
    await expect(c.locator(".row.wtile .secondary")).toHaveText("2.4 mm/h · 3.6 mm today");
    await expect(c.locator(".row.wtile .pill")).toHaveText("Light rain");
    expect(await cssVar(c.locator(".row.wtile"), "--fe-color")).toBe("var(--light-blue-color)");
    await expect(c.locator(".lead.wlead .dr")).toHaveCount(5);
    await expect(c.locator(".row.wtile")).not.toHaveClass(/dry/);
    expect((await grid(page)).rows).toBe(1);
    // without a total or rules, with a title: just the rate, no pill, two rows
    await mount(page, { type: T, entity: R, title: "Rain" });
    await pin(page);
    const p = card(page);
    await expect(p.locator(".row.wtile .secondary")).toHaveText("2.4 mm/h");
    await expect(p.locator(".pill")).toHaveCount(0);
    expect((await grid(page)).rows).toBe(2);
  });

  test("flow tile: drops slanted by the wind; rate changes re-time, rebuild or dry the field", async ({
    page,
  }) => {
    await mount(page, {
      type: T,
      entity: R,
      today: D,
      wind: W,
      direction: B,
      visual: "flow",
      rules,
    });
    await pin(page);
    const c = card(page);
    const row = c.locator(".row.wtile");
    const band = row.locator(".wflow.bg");
    await expect(row).toHaveClass(/flow/);
    await expect(band.locator(".dr")).toHaveCount(28);
    const splashes = await band.locator(".sp").count();
    expect(splashes).toBeGreaterThan(0);
    expect(splashes).toBeLessThanOrEqual(28);
    expect(await cssVar(band, "--sl")).toBe("-8.46deg");
    expect(await cssVar(band, "--t")).toBe("0.1487");
    await expect(row.locator(".lead ha-icon")).toHaveAttribute("icon", "mdi:weather-pouring");
    await expect(row.locator(".secondary:not(.narrow)")).toHaveText("Light rain · 3.6 mm today");
    await expect(row.locator(".secondary.narrow")).toHaveText("2.4 mm/h · 3.6 mm today");
    await expect(row.locator(".end .big b")).toHaveText("2.4");
    await expect(band.locator(".chip")).toBeHidden();
    // a small rate change scales the running animation; the drops are kept
    const first = band.locator(".dr").first();
    await first.evaluate((e) => ((e as HTMLElement).dataset.mark = "1"));
    await setState(page, R, "3");
    await expect(row.locator(".secondary.narrow")).toHaveText("3 mm/h · 3.6 mm today");
    await expect(band).toHaveAttribute("data-rate", (fall(2.4) / fall(3)).toFixed(3));
    await expect(band.locator(".dr").first()).toHaveAttribute("data-mark", "1");
    // the direction turns the slant without a rebuild
    await setState(page, B, "90");
    expect(await cssVar(band, "--sl")).toBe("8.46deg");
    await expect(band.locator(".dr").first()).toHaveAttribute("data-mark", "1");
    // a downpour: many more drops, a new field built for the new rate
    await setState(page, R, "20");
    await expect(band.locator(".dr")).toHaveCount(140);
    await expect(band.locator(".dr").first()).not.toHaveAttribute("data-mark", "1");
    await expect(band).toHaveAttribute("data-rate", "1.000");
    await expect(row.locator(".secondary:not(.narrow)")).toHaveText("Heavy rain · 3.6 mm today");
    await setState(page, R, "60");
    await expect(c.locator("ha-card")).toHaveClass(/tinted/);
    expect(await cssVar(c.locator("ha-card"), "--fe-tint")).toBe("var(--deep-purple-color)");
    // dry: no drops, the dry class
    await setState(page, R, "0");
    await expect(band.locator(".dr")).toHaveCount(0);
    await expect(band).toHaveClass(/dry/);
    await expect(row).toHaveClass(/dry/);
    await expect(row.locator(".secondary:not(.narrow)")).toHaveText("Dry · 3.6 mm today");
  });

  test("hero with ripples: band, chip, lead, size, tap opens more-info", async ({ page }) => {
    await mount(page, {
      type: T,
      entity: R,
      today: D,
      title: "Rain",
      header_entities: [{ entity: D }],
      layout: "hero",
      flow: { style: "ripples", height: 140 },
      rules,
    });
    await pin(page);
    const c = card(page);
    await expect(c.locator("ha-card")).toHaveClass(/layout-hero/);
    expect(await cssVar(c.locator(".wflow.band"), "--band-h")).toBe("140px");
    await expect(c.locator(".wflow.band .rp")).toHaveCount(24); // 12 ripples, two rings each
    await expect(c.locator(".wflow .chip")).toHaveText("3.6 mm today");
    await expect(c.locator(".row.whero .big b")).toHaveText("2.4");
    await expect(c.locator(".row.whero .secondary")).toHaveText("Light rain · 3.6 mm today");
    await expect(c.locator(".lead.wlead .rp")).toHaveCount(2);
    await expect(c.locator(".lead.wlead ha-icon")).toHaveAttribute("icon", "mdi:water");
    expect(await grid(page)).toMatchObject({ columns: 12, rows: "auto" });
    const size = await page.evaluate(() =>
      (window.pc.card(0) as unknown as RainCard).getCardSize(),
    );
    expect(size).toBe(1 + 2 + Math.ceil(156 / 56));
    await c.locator(".row.whero").click();
    expect(await events(page)).toEqual([{ type: "more-info", entityId: R }]);
  });

  test("fill: the gauge rises with today's total", async ({ page }) => {
    await mount(page, { type: T, entity: R, today: D, layout: "hero", flow: { style: "fill" } });
    await pin(page);
    const c = card(page);
    const band = c.locator(".wflow.band");
    expect(await cssVar(band, "--lv")).toBe("30.2%");
    await expect(band.locator(".water")).toHaveCount(1);
    await expect(band.locator(".wtop path")).toHaveAttribute("d", /^M0,8 Q15,/);
    await expect(band.locator(".dr")).toHaveCount(9);
    await expect(c.locator(".lead.wlead .water")).toHaveCount(1);
    await setState(page, D, "12");
    expect(await cssVar(band, "--lv")).toBe("82.0%");
    await expect(c.locator(".wflow .chip")).toHaveText("12 mm today");
    // no total: the gauge stays at its floor and the chip is hidden
    await mount(page, { type: T, entity: R, layout: "hero", flow: { style: "fill" } });
    await pin(page);
    const p = card(page);
    expect(await cssVar(p.locator(".wflow.band"), "--lv")).toBe("8.0%");
    await expect(p.locator(".wflow.band")).toHaveClass(/notoday/);
    await expect(p.locator(".wflow .chip")).toBeHidden();
    await expect(p.locator(".row.whero .secondary")).toBeHidden();
  });

  test("every style has its own field and lead", async ({ page }) => {
    for (const [style, field, lead] of [
      ["drops", ".dr", ".dr"],
      ["ripples", ".rp", ".rp"],
      ["fill", ".water", ".water"],
    ] as const) {
      await mount(page, { type: T, entity: R, today: D, layout: "hero", flow: { style } });
      await pin(page);
      const c = card(page);
      expect(await c.locator(`.wflow ${field}`).count(), style).toBeGreaterThan(0);
      expect(await c.locator(`.lead.wlead ${lead}`).count(), style).toBeGreaterThan(0);
    }
    await mount(page, { type: T, entity: R, lead: "icon" });
    await expect(card(page).locator(".lead ha-icon")).toHaveAttribute(
      "icon",
      "mdi:weather-pouring",
    );
  });

  test("speaks the profile language and pauses with reduced motion", async ({ page }) => {
    await mount(page, { type: T, entity: R, today: D, layout: "hero", rules });
    await pin(page);
    const c = card(page);
    await setLanguage(page, "de");
    await expect(c.locator(".row.whero .secondary")).toHaveText(/^Light rain · 3[.,]6 mm heute$/);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const dr = c.locator(".wflow .dr").first();
    expect(await dr.evaluate((e) => getComputedStyle(e).animationPlayState)).toBe("paused");
    // the still frame is populated: the drops sit at their phase along the fall
    const spread = await c
      .locator(".wflow .dr")
      .evaluateAll((els) => new Set(els.map((e) => getComputedStyle(e).transform)).size);
    expect(spread).toBeGreaterThan(10);
  });
});
