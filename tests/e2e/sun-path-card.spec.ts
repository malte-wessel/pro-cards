import { test, expect, mount, card, setLanguage } from "./util.ts";

test("shows today's events for the frozen summer day", async ({ page }) => {
  await mount(page, {
    type: "custom:sun-path-card",
    title: "Sun",
    labels: { sunrise: "Sunrise", sunset: "Sunset", dawn: "Dawn", noon: "Noon", dusk: "Dusk" },
  });
  const c = card(page);
  await expect(c.locator("ha-card")).toHaveAttribute("header", "Sun");
  const vals = await c.locator(".row .val").allTextContents();
  expect(vals[0]).toMatch(/^0[45]:\d\d$/); // sunrise around 05:15 CEST in Düsseldorf on 21 June
  expect(vals[1]).toMatch(/^21:[45]\d$/); // sunset around 21:50
  await expect(c.locator(".events .ev")).toHaveCount(3);
  await expect(c.locator(".events")).toContainText("Dawn");
  await expect(c.locator(".events")).toContainText("Noon");
  await expect(c.locator(".events .sm").nth(1)).toHaveText(/^13:[23]\d$/);
  await expect(c.locator("svg .curve")).toHaveCount(2);
  await expect(c.locator("svg circle.sun")).toBeAttached();
  await expect(c.locator("svg .tick")).toHaveCount(3);
  // ticks mark sunrise, solar noon and sunset; noon is the centre of the plot
  const W = parseFloat((await c.locator("svg").getAttribute("viewBox"))!.split(" ")[2]);
  const tickXs = await c
    .locator("svg .tick")
    .evaluateAll((els) => els.map((el) => parseFloat(el.getAttribute("x1")!)));
  expect(tickXs[1]).toBeGreaterThan(W / 2 - 2);
  expect(tickXs[1]).toBeLessThan(W / 2 + 2);
  expect(tickXs[1] - tickXs[0]).toBeCloseTo(tickXs[2] - tickXs[1], -1);
  // the dawn / dusk labels stay centred under their positions (not pinned to the card edges)
  const evs = c.locator(".events .ev");
  const dawn = (await evs.nth(0).boundingBox())!,
    dusk = (await evs.nth(2).boundingBox())!,
    plot = (await c.locator(".plot").boundingBox())!;
  expect(dawn.x + dawn.width / 2).toBeCloseTo(plot.x + (tickXs[0] / W) * plot.width, -1.5);
  expect(dusk.x + dusk.width / 2).toBeCloseTo(plot.x + (tickXs[2] / W) * plot.width, -1.5);
});

test("hides the bottom row and uses custom colours", async ({ page }) => {
  await mount(page, {
    type: "custom:sun-path-card",
    show_dawn_dusk: false,
    day_color: "#ff0000",
    labels: { sunrise: "Up" },
  });
  const c = card(page);
  await expect(c.locator(".events")).toBeHidden();
  await expect(c.locator(".row .lbl").first()).toHaveText("Up");
  await expect(c.locator("svg .curve").first()).toHaveAttribute("stroke", "#ff0000");
  await expect(c.locator("ha-card")).not.toHaveAttribute("header");
});

test("hover shows the time and elevation under the pointer", async ({ page }) => {
  await mount(page, { type: "custom:sun-path-card" });
  const c = card(page);
  const plot = c.locator(".plot");
  const box = (await plot.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(c.locator(".tip")).toHaveClass(/on/);
  await expect(c.locator(".tip .time")).toHaveText(/^13:[23]\d$/); // the centre of the plot is solar noon (~13:35 CEST)
  await expect(c.locator(".tip .row b")).toHaveText(/^-?\d+°$/);
  await expect(c.locator(".tip .row span")).toHaveText("elevation");
  await expect(c.locator("svg .hover")).toHaveClass(/on/);
  // the dot sits on the curve, inside the plot
  const cy = parseFloat((await c.locator("svg .hover .dot").getAttribute("cy"))!);
  expect(cy).toBeGreaterThan(0);
  expect(cy).toBeLessThan(120);
  await page.mouse.move(box.x - 50, box.y - 50);
  await expect(c.locator(".tip")).not.toHaveClass(/on/);
  await expect(c.locator("svg .hover")).not.toHaveClass(/on/);
});

test("default labels follow the Home Assistant language, overrides stay", async ({ page }) => {
  await mount(page, { type: "custom:sun-path-card", labels: { dusk: "Civil dusk" } });
  const c = card(page);
  await expect(c.locator(".row .lbl").first()).toHaveText("Sunrise");
  await expect(c.locator(".events .lbl").nth(1)).toHaveText("Solar noon");
  await setLanguage(page, "de-DE");
  await expect(c.locator(".row .lbl").first()).toHaveText("Sonnenaufgang");
  await expect(c.locator(".row .lbl").nth(1)).toHaveText("Sonnenuntergang");
  await expect(c.locator(".events .lbl").nth(0)).toHaveText("Morgendämmerung");
  await expect(c.locator(".events .lbl").nth(1)).toHaveText("Sonnenhöchststand");
  await expect(c.locator(".events .lbl").nth(2)).toHaveText("Civil dusk");
  const box = (await c.locator(".plot").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(c.locator(".tip .row span")).toHaveText("Höhe");
  await setLanguage(page, "fi");
  await expect(c.locator(".row .lbl").first()).toHaveText("Sunrise");
});

test("show_tooltip: false renders no hover layer", async ({ page }) => {
  await mount(page, { type: "custom:sun-path-card", show_tooltip: false });
  const c = card(page);
  const box = (await c.locator(".plot").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(c.locator("svg .hover")).toHaveCount(0);
  await expect(c.locator(".tip")).not.toHaveClass(/on/);
});

test("moves the sun marker with time", async ({ page }) => {
  await mount(page, { type: "custom:sun-path-card" }, { time: new Date("2026-06-21T06:00:00") });
  const early = await card(page).locator("svg circle.sun").getAttribute("cx");
  await page.clock.setFixedTime(new Date("2026-06-21T18:00:00"));
  await page.evaluate(() => window.pc.card(0)._render());
  const late = await card(page).locator("svg circle.sun").getAttribute("cx");
  expect(parseFloat(late!)).toBeGreaterThan(parseFloat(early!) + 100);
});

// the elevation scale is padded so the horizon stays in a band; the padding must never cut the curve
for (const [label, time] of [
  ["summer", "2026-06-21T13:35:00"],
  ["winter", "2026-12-21T12:30:00"],
] as const) {
  test(`keeps the whole curve inside the plot in ${label}`, async ({ page }) => {
    await mount(page, { type: "custom:sun-path-card" }, { time: new Date(time) });
    const c = card(page);
    const cy = parseFloat((await c.locator("svg circle.sun").getAttribute("cy"))!);
    expect(cy).toBeGreaterThanOrEqual(0);
    expect(cy).toBeLessThanOrEqual(120);
    const ys = await c
      .locator("svg .curve")
      .evaluateAll((els) =>
        els.flatMap((el) =>
          [...el.getAttribute("d")!.matchAll(/[ ,](-?[\d.]+)(?=[ C]|$)/g)].map((m) =>
            parseFloat(m[1]),
          ),
        ),
      );
    // every y in the path data (each "x,y" pair ends in the y) stays within the viewBox
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...ys)).toBeLessThanOrEqual(120);
  });
}
