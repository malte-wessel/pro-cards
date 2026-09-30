import { test, expect, mount, events, card, setLanguage } from "./util.ts";
import type { WeatherCard } from "../../src/weather-card.ts";
import type { Locator } from "@playwright/test";

const cssVar = (loc: Locator, name: string) =>
  loc.evaluate((e, n) => e.style.getPropertyValue(n).trim(), name);

const T = "custom:weather-card";
const W = "weather.home";

test.describe("weather card", () => {
  test("renders a tile with temperature and condition, sized like an entity card", async ({
    page,
  }) => {
    await mount(page, { type: T, entity: W });
    const c = card(page);
    await expect(c.locator("ha-card")).toHaveClass(/layout-tile/);
    await expect(c.locator(".row.wtile .primary")).toHaveText("Home");
    await expect(c.locator(".row.wtile .secondary")).toHaveText("17.4 °C · Partly cloudy");
    await expect(c.locator(".row.wtile ha-icon")).toHaveAttribute(
      "icon",
      "mdi:weather-partly-cloudy",
    );
    const grid = await page.evaluate(() =>
      (window.pc.card(0) as unknown as WeatherCard).getGridOptions(),
    );
    expect(grid.rows).toBe(1);
    await expect(c.locator(".header")).toHaveCount(0);
  });

  test("hero: big temperature, high / low, attribute items, daily list and hourly chart", async ({
    page,
  }) => {
    await mount(page, {
      type: T,
      entity: W,
      title: "Home",
      attributes: ["humidity", "wind_speed", { entity: "sensor.uv_index", name: "UV" }],
      sections: [
        { type: "hourly", hours_to_show: 12 },
        { type: "daily", days: 5 },
      ],
    });
    const c = card(page);
    await expect(c.locator("ha-card")).toHaveClass(/layout-hero/);
    await expect(c.locator(".header .title")).toHaveText("Home");
    const hero = c.locator(".row.whero");
    await expect(hero.locator(".primary")).toHaveText("Partly cloudy");
    await expect(hero.locator(".big b")).toHaveText("17.4");
    await expect(hero.locator(".big span")).toHaveText("°C");
    await expect(hero.locator(".secondary")).toHaveText(/^\d+° \/ \d+°$/);
    const items = c.locator(".section.layout-row .row.item");
    await expect(items).toHaveCount(3);
    await expect(items.nth(0).locator(".iname")).toHaveText("Humidity");
    await expect(items.nth(0).locator(".state")).toHaveText("71 %");
    await expect(items.nth(1).locator(".state")).toHaveText("9.4 km/h");
    await expect(items.nth(2).locator(".iname")).toHaveText("UV");
    // hourly chart
    const hourly = c.locator(".wsec").nth(0);
    await expect(hourly.locator(".wtitle")).toHaveText("Next 12 hours");
    await expect(hourly.locator(".wchart .lane-label")).toHaveText(["Temperature", "Rain"]);
    await expect(hourly.locator(".wchart svg path.line")).toHaveCount(1);
    expect(await hourly.locator(".wchart svg rect.col").count()).toBeGreaterThan(5);
    const box = await hourly.locator(".wchart").boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width * 0.7, box!.y + 20);
    const tip = hourly.locator(".wchart .tip");
    await expect(tip).toHaveClass(/on/);
    await expect(tip.locator(".trow")).toHaveCount(2);
    await expect(tip.locator(".trow").nth(0).locator("span")).toHaveText("Temperature");
    // daily list
    const daily = c.locator(".wsec").nth(1);
    await expect(daily.locator(".wtitle")).toHaveText("5 days");
    await expect(daily.locator(".wsub")).toHaveText(/^\d+ – \d+ °C$/);
    const rows = daily.locator(".dayrow");
    await expect(rows).toHaveCount(5);
    await expect(rows.nth(0)).toHaveClass(/today/);
    await expect(rows.nth(0).locator(".dname")).toHaveText("Today");
    await expect(rows.nth(0).locator(".rain")).toHaveText("85 %");
    await expect(rows.nth(1).locator(".dname")).toHaveText("Mon");
    await expect(rows.nth(0).locator(".range .hi")).toHaveText(/^\d+°$/);
    await expect(rows.nth(0).locator(".track .fill")).toBeVisible();
  });

  test("one quantity as its own section: title line, one lane, any visual, any position", async ({
    page,
  }) => {
    await mount(page, {
      type: T,
      entity: W,
      sections: [
        { type: "temperature", hours_to_show: 12 },
        { type: "daily", days: 3 },
        { type: "probability", visual: "columns", hours_to_show: 24 },
        { type: "wind", visual: "sparkline", title: "Breeze" },
      ],
    });
    const c = card(page);
    const secs = c.locator(".wsec");
    await expect(secs).toHaveCount(4);
    const temp = secs.nth(0);
    await expect(temp.locator(".wtitle")).toHaveText("Temperature");
    await expect(temp.locator(".wsub")).toHaveText("next 12 h");
    await expect(temp.locator(".wchart .lane-label")).toHaveCount(0);
    await expect(temp.locator(".wchart svg path.line")).toHaveCount(1);
    await expect(temp.locator(".wchart svg rect.col")).toHaveCount(0);
    await expect(secs.nth(1).locator(".dayrow")).toHaveCount(3);
    const prob = secs.nth(2);
    await expect(prob.locator(".wtitle")).toHaveText("Rain chance");
    await expect(prob.locator(".wsub")).toHaveText("next 24 h");
    expect(await prob.locator(".plot svg rect.col").count()).toBeGreaterThan(20);
    const wind = secs.nth(3);
    await expect(wind.locator(".wtitle")).toHaveText("Breeze");
    await expect(wind.locator(".plot svg path.line")).toHaveCount(1);
    const box = await temp.locator(".wchart").boundingBox();
    await page.mouse.move(box!.x + box!.width * 0.5, box!.y + 20);
    await expect(temp.locator(".tip .trow")).toHaveCount(1);
    await setLanguage(page, "de");
    await expect(temp.locator(".wtitle")).toHaveText("Temperatur");
    await expect(temp.locator(".wsub")).toHaveText("nächste 12 h");
    await expect(wind.locator(".wtitle")).toHaveText("Breeze");
  });

  test("rules on the condition and temperature colour, label and tint the card", async ({
    page,
  }) => {
    await mount(page, {
      type: T,
      entity: W,
      name: "Garden",
      layout: "hero",
      rules: [{ state: "partlycloudy", color: "amber", label: "Some sun", tint_card: true }],
      temperature_rules: [
        { below: 12, color: "blue", label: "Cool" },
        { above: 12, color: "green", label: "Mild" },
      ],
    });
    const c = card(page);
    await expect(c.locator("ha-card")).toHaveClass(/tinted/);
    const hero = c.locator(".row.whero");
    await expect(hero.locator(".primary")).toHaveText("Garden");
    await expect(hero.locator(".secondary")).toContainText("Partly cloudy · Some sun · Mild");
    await expect(hero.locator(".secondary .accent")).toHaveText("Mild");
    expect(await cssVar(hero, "--fe-color")).toBe("var(--amber-color)");
    expect(await cssVar(hero, "--fe-temp")).toBe("var(--green-color)");
  });

  test("taps open more-info for the weather entity; entity sections and templates work", async ({
    page,
  }) => {
    await mount(page, {
      type: T,
      entity: W,
      secondary: "feels like {{ state_attr('weather.home', 'apparent_temperature') }}°",
      sections: [
        { title: "Garden", layout: "row", entities: ["sensor.outdoor_humidity", "light.kitchen"] },
      ],
    });
    const c = card(page);
    await expect(c.locator(".row.whero .secondary")).toHaveText("feels like 16.1°");
    const sec = c.locator(".wsec");
    await expect(sec.locator(".wtitle")).toHaveText("Garden");
    await expect(sec.locator(".row.item")).toHaveCount(2);
    await c.locator(".row.whero").click();
    expect(await events(page)).toEqual([{ type: "more-info", entityId: W }]);
  });

  test("shows a missing entity, no forecast for an entity without one, and follows the language", async ({
    page,
  }) => {
    await mount(page, [
      { type: T, entity: "weather.nowhere" },
      { type: T, entity: W, sections: [{ type: "daily" }] },
    ]);
    await expect(card(page, 0).locator(".row.wtile .secondary")).toHaveText(
      "weather.nowhere not found",
    );
    await page.evaluate(() =>
      window.pc.world.set("weather.home", undefined, { supported_features: 0 }),
    );
    await expect(card(page, 1).locator(".wempty")).toHaveText("no forecast");
    await setLanguage(page, "de");
    await expect(card(page, 1).locator(".wsec .wtitle")).toHaveText("7 Tage");
    await expect(card(page, 1).locator(".wempty")).toHaveText("keine Vorhersage");
  });
});
