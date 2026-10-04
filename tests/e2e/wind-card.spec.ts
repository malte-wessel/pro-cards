import { test, expect, mount, events, card, setState, setLanguage } from "./util.ts";
import type { WindCard } from "../../src/wind-card.ts";
import type { Locator } from "@playwright/test";

const T = "custom:wind-card-pro";
const S = "sensor.wind_speed",
  D = "sensor.wind_direction",
  G = "sensor.wind_gust";
const cssVar = (loc: Locator, name: string) =>
  loc.evaluate((e, n) => e.style.getPropertyValue(n).trim(), name);
const rules = [
  { below: 5, color: "blue-grey", label: "Calm" },
  { below: 20, color: "teal", label: "Light breeze" },
  { below: 35, color: "amber", label: "Fresh" },
  { above: 35, color: "red", label: "Storm", tint_card: true },
];
// the demo world drifts its sensors; pin the wind to the documented values
const pin = async (page: Parameters<typeof card>[0]) => {
  await setState(page, S, "9.4");
  await setState(page, G, "18.2");
  await setState(page, D, "225");
};
const grid = (page: Parameters<typeof card>[0]) =>
  page.evaluate(() => (window.pc.card(0) as unknown as WindCard).getGridOptions());

test.describe("wind card", () => {
  test("tile: name, speed and direction, rule label and colour, grid rows", async ({ page }) => {
    await mount(page, { type: T, entity: S, direction: D, rules });
    await pin(page);
    const c = card(page);
    await expect(c.locator("ha-card")).toHaveClass(/layout-tile/);
    await expect(c.locator(".row.wtile .primary")).toHaveText("Wind speed");
    await expect(c.locator(".row.wtile .secondary")).toHaveText("9.4 km/h · SW");
    await expect(c.locator(".row.wtile .pill")).toHaveText("Light breeze");
    expect(await cssVar(c.locator(".row.wtile"), "--fe-color")).toBe("var(--teal-color)");
    expect(await cssVar(c.locator(".row.wtile"), "--rot")).toBe("315deg");
    expect(await cssVar(c.locator(".row.wtile"), "--arrow")).toBe("45deg");
    await expect(c.locator(".lead.wlead .ld")).toHaveCount(6);
    expect((await grid(page)).rows).toBe(1);
    // without a direction sensor: no compass point, the field flows to the right
    await mount(page, { type: T, entity: S, title: "Wind" });
    await pin(page);
    const p = card(page);
    await expect(p.locator(".row.wtile .secondary")).toHaveText("9.4 km/h");
    await expect(p.locator(".row.wtile")).toHaveClass(/nodir/);
    await expect(p.locator(".pill")).toHaveCount(0);
    expect((await grid(page)).rows).toBe(2);
  });

  test("reads a weather entity's wind attributes", async ({ page }) => {
    await mount(page, { type: T, entity: "weather.home", layout: "hero", rules });
    const c = card(page);
    await expect(c.locator(".row.whero .primary")).toHaveText("Wind");
    await expect(c.locator(".row.whero .big b")).toHaveText("9.4");
    await expect(c.locator(".row.whero .big span")).toHaveText("km/h");
    await expect(c.locator(".row.whero .secondary")).toHaveText(
      "Light breeze · from SW · gusts 18.2 km/h",
    );
    await expect(c.locator(".wflow .chip")).toHaveText("SW 225°");
    // a speed in m/s drives the animation like the km/h it equals: the field, built for some
    // speed, plays at the ratio of the travel speeds
    await setState(page, "weather.home", undefined, { wind_speed: 5, wind_speed_unit: "m/s" });
    await expect(c.locator(".row.whero .big")).toHaveText("5m/s");
    const built = Number(await c.locator(".wflow").getAttribute("data-kmh"));
    expect(Number.parseFloat(await cssVar(c.locator(".wflow"), "--dur"))).toBeCloseTo(
      480 / (16 + built * 5),
      2,
    );
    await expect(c.locator(".wflow")).toHaveAttribute(
      "data-rate",
      ((16 + 18 * 5) / (16 + built * 5)).toFixed(3),
    );
  });

  test("flow tile: the field behind arrow, texts and big value; storm tints the card", async ({
    page,
  }) => {
    await mount(page, { type: T, entity: S, direction: D, gust: G, visual: "flow", rules });
    await pin(page);
    const c = card(page);
    const row = c.locator(".row.wtile");
    await expect(row).toHaveClass(/flow/);
    await expect(row.locator(".wflow.bg .field .lane")).toHaveCount(18);
    await expect(row.locator(".wflow.bg .pt")).toHaveCount(270);
    await expect(row.locator(".wflow.bg .gs")).toHaveCount(2);
    await expect(row.locator(".lead ha-icon.arrow")).toHaveAttribute("icon", "mdi:navigation");
    await expect(row.locator(".secondary:not(.narrow)")).toHaveText(
      "Light breeze · gusts 18.2 km/h",
    );
    await expect(row.locator(".secondary.narrow")).toHaveText("9.4 km/h · SW");
    await expect(row.locator(".end .big b")).toHaveText("9.4");
    await expect(row.locator(".wflow .chip")).toBeHidden();
    // a state update scales the running animation's playback rate; the field is kept, even
    // for a storm, and so is the position of every particle
    const first = row.locator(".pt").first();
    await first.evaluate((e) => ((e as HTMLElement).dataset.mark = "1"));
    const dur = await cssVar(row.locator(".wflow"), "--dur");
    const rate = (kmh: number) => ((16 + kmh * 5) / (16 + 9.4 * 5)).toFixed(3);
    await setState(page, S, "14");
    await expect(row.locator(".secondary.narrow")).toHaveText("14 km/h · SW");
    await expect(row.locator(".wflow")).toHaveAttribute("data-rate", rate(14));
    expect(await first.evaluate((e) => e.getAnimations()[0]?.playbackRate)).toBeCloseTo(
      Number(rate(14)),
      3,
    );
    await setState(page, S, "60");
    await expect(row.locator(".secondary:not(.narrow)")).toHaveText("Storm · gusts 18.2 km/h");
    await expect(c.locator("ha-card")).toHaveClass(/tinted/);
    expect(await cssVar(c.locator("ha-card"), "--fe-tint")).toBe("var(--red-color)");
    await expect(row.locator(".wflow")).toHaveAttribute("data-rate", rate(60));
    await expect(row.locator(".pt").first()).toHaveAttribute("data-mark", "1");
    expect(await cssVar(row.locator(".wflow"), "--dur")).toBe(dur);
    // a new direction turns the field the short way round, keeping the particles
    await setState(page, D, "350");
    await expect(row.locator(".wflow")).toHaveAttribute("data-rot", "440");
    expect(await cssVar(row.locator(".wflow"), "--rot")).toBe("440deg");
    expect(await cssVar(row, "--arrow")).toBe("170deg");
    await setState(page, D, "10");
    expect(await cssVar(row.locator(".wflow"), "--rot")).toBe("460deg");
    expect(await cssVar(row, "--arrow")).toBe("190deg");
    await expect(row.locator(".pt").first()).toHaveAttribute("data-mark", "1");
    await setState(page, D, "225");
    // gusts drifting by a few km/h keep the field too
    await setState(page, G, "22");
    await expect(row.locator(".secondary:not(.narrow)")).toHaveText("Storm · gusts 22 km/h");
    await expect(row.locator(".pt").first()).toHaveAttribute("data-mark", "1");
    // much stronger gusts raise the waves: a redraw with more streaks, built for the new speed
    await setState(page, G, "95");
    await expect(row.locator(".wflow.bg .gs")).toHaveCount(6);
    await expect(row.locator(".pt").first()).not.toHaveAttribute("data-mark", "1");
    await expect(row.locator(".wflow")).toHaveAttribute("data-rate", "1.000");
  });

  test("hero: band height, card size, tap opens more-info on the lead row", async ({ page }) => {
    await mount(page, {
      type: T,
      entity: S,
      direction: D,
      gust: G,
      title: "Wind",
      layout: "hero",
      flow: { style: "vectors", height: 140, density: "sparse" },
    });
    const c = card(page);
    await expect(c.locator("ha-card")).toHaveClass(/layout-hero/);
    expect(await cssVar(c.locator(".wflow.band"), "--band-h")).toBe("140px");
    await expect(c.locator(".wflow.band .fa")).toHaveCount(36); // 12 lanes × 3 arrows
    await expect(c.locator(".lead.wlead .la")).toHaveCount(3);
    const g = await grid(page);
    expect(g).toMatchObject({ columns: 12, rows: "auto" });
    const size = await page.evaluate(() =>
      (window.pc.card(0) as unknown as WindCard).getCardSize(),
    );
    expect(size).toBe(1 + 2 + Math.ceil(156 / 56));
    await c.locator(".row.whero").click();
    expect(await events(page)).toEqual([{ type: "more-info", entityId: S }]);
  });

  test("every style has its own field and lead", async ({ page }) => {
    for (const [style, field, lead] of [
      ["dots", ".pt", ".ld"],
      ["lines", "path.sl", ".ls"],
      ["swoosh", "path.swp", "path.lsw"],
      ["vectors", ".fa", ".la"],
    ] as const) {
      await mount(page, { type: T, entity: S, direction: D, layout: "hero", flow: { style } });
      const c = card(page);
      expect(await c.locator(`.wflow ${field}`).count(), style).toBeGreaterThan(0);
      expect(await c.locator(`.lead.wlead ${lead}`).count(), style).toBeGreaterThan(0);
    }
    await mount(page, { type: T, entity: S, direction: D, lead: "arrow" });
    await expect(card(page).locator(".lead ha-icon.arrow")).toHaveCount(1);
  });

  test("speaks the profile language and pauses with reduced motion", async ({ page }) => {
    await mount(page, { type: T, entity: S, direction: D, gust: G, layout: "hero", rules });
    await pin(page);
    const c = card(page);
    await setLanguage(page, "de");
    await expect(c.locator(".row.whero .secondary")).toHaveText(
      /^Light breeze · aus SW · Böen 18[.,]2 km\/h$/,
    );
    await setState(page, D, "90");
    await expect(c.locator(".wflow .chip")).toHaveText("O 90°");
    await page.emulateMedia({ reducedMotion: "reduce" });
    const pt = c.locator(".wflow .pt").first();
    expect(await pt.evaluate((e) => getComputedStyle(e).animationPlayState)).toBe("paused");
    // the still frame is populated: particles sit at their phase along the path
    const spread = await c
      .locator(".wflow .pt")
      .evaluateAll((els) => new Set(els.map((e) => getComputedStyle(e).offsetDistance)).size);
    expect(spread).toBeGreaterThan(10);
  });
});
