import { test, expect, mount, events, card, setLanguage } from "./util.ts";
import type { WeatherCard } from "../../src/weather-card.ts";
import type { Locator, Page } from "@playwright/test";

const T = "custom:weather-card-pro";
const W = "weather.home";
const cssVar = (loc: Locator, name: string) =>
  loc.evaluate((e, n) => e.style.getPropertyValue(n).trim(), name);
// the clock label of the current hour + `offset` in the page's own time zone (CI runs in UTC)
const hourLabel = (page: Page, offset: number) =>
  page.evaluate((o) => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + o);
    return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(d);
  }, offset);

test.describe("weather card", () => {
  test("renders a tile without sections, sized like an entity card", async ({ page }) => {
    await mount(page, { type: T, entity: W, icons: "mdi" });
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
    // a title adds the header and a second row
    await mount(page, { type: T, entity: W, title: "Home" });
    await expect(card(page).locator(".header .title")).toHaveText("Home");
    const titled = await page.evaluate(() =>
      (window.pc.card(0) as unknown as WeatherCard).getGridOptions(),
    );
    expect(titled.rows).toBe(2);
  });

  test("hero: condition, big temperature, high / low, overrides, tap opens more-info", async ({
    page,
  }) => {
    await mount(page, {
      type: T,
      entity: W,
      title: "Home",
      secondary: "feels like {{ state_attr('weather.home', 'apparent_temperature') }}°",
      sections: [
        { type: "hero", divider: true },
        {
          type: "hero",
          divider: true,
          title: "Garden",
          name: "Garden",
          secondary: "{{ state_attr('weather.home', 'humidity') }} % humid",
        },
      ],
    });
    const c = card(page);
    await expect(c.locator("ha-card")).toHaveClass(/layout-sections/);
    await expect(c.locator(".header .title")).toHaveText("Home");
    const heroes = c.locator(".row.whero");
    await expect(heroes).toHaveCount(2);
    await expect(heroes.nth(0).locator(".primary")).toHaveText("Partly cloudy");
    await expect(heroes.nth(0).locator(".big b")).toHaveText("17.4");
    await expect(heroes.nth(0).locator(".big span")).toHaveText("°C");
    await expect(heroes.nth(0).locator(".secondary")).toHaveText("feels like 16.1°");
    await expect(c.locator(".wsec").nth(1).locator(".wtitle")).toHaveText("Garden");
    await expect(heroes.nth(1).locator(".primary")).toHaveText("Garden");
    await expect(heroes.nth(1).locator(".secondary")).toHaveText("71 % humid");
    await expect(c.locator(".body > .divider")).toHaveCount(1); // never above the first
    await heroes.nth(0).click();
    expect(await events(page)).toEqual([{ type: "more-info", entityId: W }]);
  });

  test("hero without a secondary shows the labels and today's high / low", async ({ page }) => {
    await mount(page, {
      type: T,
      entity: W,
      temperature_rules: [
        { below: 12, color: "blue", label: "Cool" },
        { above: 12, color: "green", label: "Mild" },
      ],
      sections: [{ type: "hero" }],
    });
    const hero = card(page).locator(".row.whero");
    await expect(hero.locator(".secondary")).toHaveText(/^Mild · \d+° \/ \d+°$/);
    await expect(hero.locator(".secondary .accent")).toHaveText("Mild");
    expect(await cssVar(hero, "--fe-temp")).toBe("var(--green-color)");
  });

  test("group sections: attribute names become translated items, entities keep their options", async ({
    page,
  }) => {
    await mount(page, {
      type: T,
      entity: W,
      sections: [
        {
          type: "row",
          entities: ["humidity", "wind_speed", { entity: "sensor.uv_index", name: "UV" }],
        },
        { layout: "table", title: "More", entities: ["pressure", { attribute: "visibility" }] },
        {
          type: "list",
          divider: true,
          entities: ["apparent_temperature", "sensor.outdoor_humidity"],
        },
        { type: "grid", entities: ["humidity", "cloud_coverage"] },
        { type: "column", entities: ["dew_point"] },
      ],
    });
    const c = card(page);
    const items = c.locator(".section.layout-row .row.item");
    await expect(items).toHaveCount(3);
    await expect(items.nth(0).locator(".iname")).toHaveText("Humidity");
    await expect(items.nth(0).locator(".state")).toHaveText("71 %");
    await expect(items.nth(1).locator(".state")).toHaveText("9.4 km/h");
    await expect(items.nth(2).locator(".iname")).toHaveText("UV");
    await expect(c.locator(".wsec").nth(1).locator(".wtitle")).toHaveText("More");
    const fields = c.locator(".section.layout-table .row.field");
    await expect(fields.nth(0).locator(".key")).toHaveText("Pressure");
    await expect(fields.nth(0).locator(".state")).toHaveText("1,016.3 hPa");
    await expect(fields.nth(1).locator(".state")).toHaveText("14 km");
    const rows = c.locator(".section.layout-list .row.list");
    await expect(rows.nth(0).locator(".primary")).toHaveText("Feels like");
    await expect(rows.nth(0).locator(".state")).toHaveText("16.1 °C");
    await expect(rows.nth(1).locator(".primary")).toHaveText("Outdoor humidity");
    await expect(c.locator(".section.layout-grid .row.cell")).toHaveCount(2);
    await expect(c.locator(".body > .divider")).toHaveCount(1);
    await expect(c.locator(".section.layout-column .row.item .iname")).toHaveText("Dew point");
    await setLanguage(page, "de");
    await expect(items.nth(0).locator(".iname")).toHaveText("Luftfeuchtigkeit");
  });

  test("trend: hourly lanes and legend, daily highs and lows, tooltip with the condition", async ({
    page,
  }) => {
    await mount(page, {
      type: T,
      entity: W,
      sections: [
        { type: "trend", mode: "hourly", hours: 12 },
        {
          type: "trend",
          mode: "hourly",
          show: ["temperature", { quantity: "wind", name: "Breeze", color: "teal" }],
          layout: "overlay",
          y_axis: true,
        },
        { type: "trend", mode: "daily", days: 5, show: ["temperature", "precipitation"] },
      ],
    });
    const c = card(page);
    const lanes = c.locator(".wsec").nth(0);
    await expect(lanes.locator(".wtitle")).toHaveText("Next 12 hours");
    await expect(lanes.locator(".trend .lane-label")).toHaveText(["Temperature", "Rain"]);
    await expect(lanes.locator(".trend svg path.line")).toHaveCount(2);
    await expect(lanes.locator(".legend")).toBeHidden();
    expect(await lanes.locator(".trend .axis-label.x").count()).toBeGreaterThan(3);
    const box = await lanes.locator(".trend").boundingBox();
    await page.mouse.move(box!.x + box!.width * 0.7, box!.y + 20);
    const tip = lanes.locator(".trend .tip");
    await expect(tip).toHaveClass(/on/);
    await expect(tip.locator(".head")).toHaveText(/Partly cloudy|Sunny|Rainy|Clear night|Cloudy/);
    await expect(tip.locator(".row")).toHaveCount(2);
    await expect(tip.locator(".row").nth(0).locator("b")).toHaveText(/°C$/);
    const overlay = c.locator(".wsec").nth(1);
    await expect(overlay.locator(".legend span em")).toHaveText(["Temperature", "Breeze"]);
    await expect(overlay.locator(".trend .lane-label")).toHaveCount(0);
    expect(await overlay.locator(".trend .axis-label.y").count()).toBeGreaterThan(1);
    await expect(overlay.locator(".trend svg path.line").nth(1)).toHaveAttribute(
      "stroke",
      "var(--teal-color)",
    );
    const daily = c.locator(".wsec").nth(2);
    await expect(daily.locator(".wtitle")).toHaveText("5 days");
    await expect(daily.locator(".trend .lane-label")).toHaveText(["High / Low", "Rain"]);
    await expect(daily.locator(".trend svg path.line")).toHaveCount(3);
  });

  test("forecast: daily rows with range bars, columns, hourly rows and columns", async ({
    page,
  }) => {
    await mount(page, {
      type: T,
      entity: W,
      sections: [
        { type: "forecast", mode: "daily", days: 5, show: ["probability", "precipitation"] },
        { type: "forecast", mode: "daily", layout: "horizontal", days: 3, show: [] },
        { type: "forecast", mode: "hourly", hours: 3 },
        {
          type: "forecast",
          mode: "hourly",
          layout: "horizontal",
          hours: 4,
          title: "Soon",
          divider: true,
        },
      ],
    });
    const c = card(page);
    const daily = c.locator(".wsec").nth(0);
    await expect(daily.locator(".wtitle")).toHaveText("5 days");
    await expect(daily.locator(".wsub")).toHaveText(/^\d+ – \d+ °C$/);
    const rows = daily.locator(".frow");
    await expect(rows).toHaveCount(5);
    await expect(rows.nth(0)).toHaveClass(/today/);
    await expect(rows.nth(0).locator(".fname")).toHaveText("Today");
    await expect(rows.nth(0).locator(".rain")).toHaveText("85 % · 3.6 mm");
    await expect(rows.nth(1).locator(".fname")).toHaveText("Mon");
    await expect(rows.nth(0).locator(".range .hi")).toHaveText(/^\d+°$/);
    await expect(rows.nth(0).locator(".track .fill")).toBeVisible();
    const cols = c.locator(".wsec").nth(1).locator(".fcol");
    await expect(cols).toHaveCount(3);
    await expect(cols.nth(0).locator(".rain")).toHaveCount(0);
    await expect(cols.nth(0).locator(".vtrack .fill")).toBeVisible();
    const hours = c.locator(".wsec").nth(2).locator(".frow");
    await expect(hours).toHaveCount(3);
    await expect(hours.nth(0)).toHaveClass(/today/);
    await expect(hours.nth(0).locator(".fname")).toHaveText(await hourLabel(page, 0));
    await expect(hours.nth(0).locator(".ftemp")).toHaveText(/°C$/);
    await expect(hours.nth(0).locator(".range")).toHaveCount(0);
    const soon = c.locator(".wsec").nth(3);
    await expect(soon.locator(".wtitle")).toHaveText("Soon");
    await expect(c.locator(".body > .divider")).toHaveCount(1);
    await expect(soon.locator(".fcol")).toHaveCount(4);
    await expect(soon.locator(".fcol").nth(1).locator(".fname")).toHaveText(
      await hourLabel(page, 1),
    );
    await expect(soon.locator(".fcol").nth(1).locator(".hi")).toHaveText(/°C$/);
  });

  test("rules per section replace the card's; the card's tint still applies", async ({ page }) => {
    await mount(page, {
      type: T,
      entity: W,
      icons: "mdi",
      rules: [{ state: "partlycloudy", color: "amber", label: "Card", tint_card: true }],
      temperature_rules: [{ above: 0, color: "green", label: "Card temp" }],
      sections: [
        { type: "hero" },
        {
          type: "hero",
          rules: [{ state: "partlycloudy", color: "purple", icon: "mdi:emoticon", label: "Own" }],
          temperature_rules: [{ above: 0, color: "red", label: "Own temp" }],
        },
        {
          type: "forecast",
          mode: "daily",
          days: 3,
          rules: [{ state: "rainy", color: "blue", icon: "mdi:umbrella" }],
          temperature_rules: [{ above: 0, color: "orange" }],
        },
        { type: "forecast", mode: "daily", days: 3 },
        {
          type: "trend",
          mode: "hourly",
          hours: 6,
          show: ["temperature"],
          temperature_rules: [{ above: 0, color: "pink" }],
        },
      ],
    });
    const c = card(page);
    await expect(c.locator("ha-card")).toHaveClass(/tinted/);
    const heroes = c.locator(".row.whero");
    await expect(heroes.nth(0).locator(".secondary")).toContainText("Card · Card temp");
    expect(await cssVar(heroes.nth(0), "--fe-color")).toBe("var(--amber-color)");
    await expect(heroes.nth(1).locator(".secondary")).toContainText("Own · Own temp");
    expect(await cssVar(heroes.nth(1), "--fe-color")).toBe("var(--purple-color)");
    expect(await cssVar(heroes.nth(1), "--fe-temp")).toBe("var(--red-color)");
    await expect(heroes.nth(1).locator("ha-icon")).toHaveAttribute("icon", "mdi:emoticon");
    await expect(heroes.nth(0).locator(".lead")).not.toHaveClass(/picture/);
    const own = c.locator(".wsec").nth(2).locator(".frow"),
      card2 = c.locator(".wsec").nth(3).locator(".frow");
    expect(await cssVar(own.nth(0), "--fe-color")).toBe("var(--orange-color)");
    expect(await cssVar(card2.nth(0), "--fe-color")).toBe("var(--green-color)");
    await expect(own.nth(2).locator("ha-icon")).toHaveAttribute("icon", "mdi:umbrella");
    expect(await cssVar(own.nth(2), "--fe-cond")).toBe("var(--blue-color)");
    await expect(card2.nth(2).locator("ha-icon")).toHaveAttribute("icon", "mdi:weather-rainy");
    await expect(c.locator(".wsec").nth(4).locator(".trend svg path.line")).toHaveAttribute(
      "stroke",
      "var(--pink-color)",
    );
  });

  test("icons: the hass pictures, a map of icons and images, rule icons, sizes", async ({
    page,
  }) => {
    await mount(page, [
      { type: T, entity: W, icon_size: 48 },
      {
        type: T,
        entity: W,
        icons: "mdi",
        sections: [
          { type: "hero", icon_size: 72, icons: "hass" },
          {
            type: "forecast",
            mode: "daily",
            days: 4,
            icon_size: 30,
            icons: "hass",
            rules: [{ state: "pouring", icon: "mdi:umbrella" }],
          },
        ],
      },
      {
        type: T,
        entity: W,
        icons: "mdi",
        sections: [
          { type: "hero", icons: { partlycloudy: "mdi:emoticon-happy" } },
          { type: "forecast", mode: "daily", days: 4, icons: { rainy: "/local/rain.svg" } },
          {
            type: "forecast",
            mode: "daily",
            days: 4,
            icons: { rainy: "mdi:umbrella" },
            title: "Mixed",
          },
        ],
      },
    ]);
    const tile = card(page, 0).locator(".row.wtile .lead");
    await expect(tile).toHaveClass(/picture/);
    await expect(tile.locator("svg.wpic path.sun")).toHaveCount(1);
    await expect(tile.locator("svg.wpic path.cloud-front")).toHaveCount(1);
    expect(await cssVar(tile, "--lead")).toBe("48px");
    const c1 = card(page, 1);
    const lead = c1.locator(".row.whero .lead");
    expect(await cssVar(lead, "--lead")).toBe("72px");
    await expect(lead.locator("svg.wpic")).toHaveCount(1);
    const rows = c1.locator(".frow");
    await expect(rows.nth(0).locator(".ficon svg.wpic path.cloud-back")).toHaveCount(1);
    await expect(rows.nth(1).locator(".ficon svg.wpic path.sun")).toHaveCount(1);
    await expect(rows.nth(2).locator(".ficon svg.wpic path.rain")).toHaveCount(4);
    await expect(rows.nth(3).locator(".ficon ha-icon")).toHaveAttribute("icon", "mdi:umbrella");
    expect(await cssVar(c1.locator(".wfc"), "--fe-icon")).toBe("30px");
    const c2 = card(page, 2);
    await expect(c2.locator(".row.whero .lead ha-icon")).toHaveAttribute(
      "icon",
      "mdi:emoticon-happy",
    );
    await expect(c2.locator(".row.whero .lead")).not.toHaveClass(/picture/);
    const rows2 = c2.locator(".frow");
    await expect(rows2.nth(2).locator(".ficon img.wpic")).toHaveAttribute("src", "/local/rain.svg");
    await expect(rows2.nth(1).locator(".ficon ha-icon")).toHaveAttribute(
      "icon",
      "mdi:weather-sunny",
    );
  });

  test("shows a missing entity, no forecast for an entity without one, and follows the language", async ({
    page,
  }) => {
    await mount(page, [
      { type: T, entity: "weather.nowhere" },
      { type: T, entity: W, sections: [{ type: "forecast" }, { type: "trend", mode: "hourly" }] },
    ]);
    await expect(card(page, 0).locator(".row.wtile .secondary")).toHaveText(
      "weather.nowhere not found",
    );
    await page.evaluate(() =>
      window.pc.world.set("weather.home", undefined, { supported_features: 0 }),
    );
    const c = card(page, 1);
    await expect(c.locator(".wempty")).toHaveText(["no forecast", "no forecast"]);
    await setLanguage(page, "de");
    await expect(c.locator(".wsec .wtitle")).toHaveText(["7 Tage", "Nächste 12 Stunden"]);
    await expect(c.locator(".wempty").first()).toHaveText("keine Vorhersage");
  });
});
