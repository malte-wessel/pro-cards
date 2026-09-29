import { test, expect, mount, events, card } from "./util.ts";
import type { MultiTrendCard } from "../../src/multi-trend-card.ts";
import type { FormEditorBase } from "../../src/shared/editor.ts";

const two = (extra = {}) => ({
  type: "custom:multi-trend-card",
  title: "Temp",
  entities: [
    { entity: "sensor.outdoor_temperature", name: "Temperature", color: "red" },
    { entity: "sensor.dew_point", name: "Dew point" },
  ],
  hours_to_show: 6,
  ...extra,
});

test("overlays series with the same unit and shows a legend", async ({ page }) => {
  await mount(page, two());
  const c = card(page);
  await expect(c.locator(".primary")).toHaveText("Temp");
  await expect(c.locator(".secondary")).toContainText("°C");
  await expect(c.locator(".legend span")).toHaveCount(2);
  await expect(c.locator(".legend")).toContainText("Dew point");
  await expect(c.locator("svg path.line")).toHaveCount(2);
  await expect(c.locator(".lane-label")).toHaveCount(0);
  await expect(c.locator(".range")).toHaveText("6 h");
});

test("uses lanes for mixed units and honours the layout override", async ({ page }) => {
  await mount(page, [
    two({ entities: [{ entity: "sensor.wind_speed" }, { entity: "sensor.pressure" }] }),
    two({ layout: "lanes" }),
    two({
      layout: "overlay",
      entities: [{ entity: "sensor.wind_speed" }, { entity: "sensor.pressure" }],
    }),
  ]);
  await expect(card(page, 0).locator(".lane-label")).toHaveCount(2);
  await expect(card(page, 0).locator("svg .lane-sep")).toHaveCount(1);
  await expect(card(page, 1).locator(".lane-label")).toHaveCount(2);
  await expect(card(page, 2).locator(".lane-label")).toHaveCount(0);
  const rows = await page.evaluate(() =>
    [0, 1, 2].map((i) => window.pc.card(i).getGridOptions().rows),
  );
  expect(rows).toEqual([4, 4, 3]);
});

test("axes add labels and gridlines", async ({ page }) => {
  await mount(page, two({ x_axis: true, y_axis: true, hours_to_show: 12 }));
  const c = card(page);
  await expect(c.locator(".axis-label.x").first()).toBeVisible();
  expect(await c.locator(".axis-label.x").count()).toBeGreaterThanOrEqual(3);
  expect(await c.locator(".axis-label.y").count()).toBeGreaterThanOrEqual(2);
  expect(await c.locator("svg line.grid").count()).toBeGreaterThanOrEqual(5);
  await expect(c.locator(".axis-label.x").first()).toHaveText(/^\d\d:\d\d$/);
});

test("hover shows a tooltip with every series and the header opens more-info", async ({ page }) => {
  await mount(page, two());
  const c = card(page);
  const plot = c.locator(".plot");
  const box = (await plot.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(c.locator(".tip")).toHaveClass(/on/);
  await expect(c.locator(".tip .row")).toHaveCount(2);
  await expect(c.locator(".tip .row").first()).toContainText("°C");
  await expect(c.locator(".tip .time")).toHaveText(/\d\d:\d\d/);
  await expect(c.locator("svg .hover")).toHaveClass(/on/);
  await page.mouse.move(box.x - 50, box.y - 50);
  await expect(c.locator(".tip")).not.toHaveClass(/on/);
  await c.locator(".header").click();
  expect(await events(page)).toEqual([
    { type: "more-info", entityId: "sensor.outdoor_temperature" },
  ]);
});

test("editor element loads with a form", async ({ page }) => {
  await mount(page, two());
  const ok = await page.evaluate(() => {
    const Card = customElements.get("multi-trend-card") as unknown as typeof MultiTrendCard;
    const ed = Card.getConfigElement() as FormEditorBase;
    ed.setConfig({ entities: [{ entity: "sensor.outdoor_temperature" }] });
    ed.hass = window.pc.snapshot();
    document.body.appendChild(ed);
    const form = ed.querySelector("ha-form");
    return { tag: ed.tagName.toLowerCase(), hasForm: !!form, entities: form?.data?.entities };
  });
  expect(ok).toEqual({
    tag: "multi-trend-card-editor",
    hasForm: true,
    entities: ["sensor.outdoor_temperature"],
  });
});
