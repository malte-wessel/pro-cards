// The poster layout in a browser: the entity, group and sections cards' poster, and the posters of
// the wind, rain, sun path, weather and multi trend cards; their height in the grid, the content
// anchored to the bottom, the plots out to the card's edges, value fitting, badges and actions.
import type { Locator, Page } from "@playwright/test";
import { test, expect, mount, calls, events, setState, card } from "./util.ts";

const E = "custom:entity-card-pro";
// the poster's height in the harness grid: three 56 px rows and two 8 px gaps
const ROWS3 = 3 * 56 + 2 * 8;

const rect = async (loc: Locator) => {
  const b = await loc.evaluate((e) => {
    const r = e.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: r.width, h: r.height };
  });
  return b;
};
// the box inside the card's border (what the card's corners clip)
const inner = (c: Locator) =>
  c.locator("ha-card").evaluate((e) => {
    const r = e.getBoundingClientRect();
    const s = getComputedStyle(e);
    const bl = parseFloat(s.borderLeftWidth),
      br = parseFloat(s.borderRightWidth),
      bt = parseFloat(s.borderTopWidth),
      bb = parseFloat(s.borderBottomWidth);
    return { left: r.left + bl, right: r.right - br, top: r.top + bt, bottom: r.bottom - bb };
  });
const fontPx = (loc: Locator) => loc.evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
// whether a text's glyphs are wider than its box (an ellipsis would show)
const overflows = (loc: Locator) =>
  loc.evaluate((e) => {
    const range = document.createRange();
    range.selectNodeContents(e);
    return range.getBoundingClientRect().width > e.getBoundingClientRect().width + 0.5;
  });
const mark = (loc: Locator) => loc.evaluate((e) => ((e as HTMLElement).dataset.mark = "1"));
const moreInfo = (entityId: string) => ({ type: "more-info", entityId });
// the more-info events (not the haptics)
const infos = async (page: Page) => (await events(page)).filter((e) => e.type === "more-info");

test.describe("entity card poster", () => {
  test("three rows high, the icon on top and the name and value at the bottom", async ({
    page,
  }) => {
    await mount(page, {
      type: E,
      entity: "sensor.living_room_temperature",
      name: "Living room",
      layout: "poster",
      rules: [
        { below: 20, color: "blue", label: "Cool" },
        { above: 20, color: "orange", label: "Warm" },
      ],
    });
    const c = card(page);
    expect(
      await page.evaluate(() => window.pc.card(0).getGridOptions() as unknown as object),
    ).toMatchObject({ columns: 6, rows: 3, min_rows: 2 });
    await expect(c.locator("ha-card")).toHaveClass(/layout-poster/);
    const box = await inner(c);
    expect(box.bottom - box.top + 2).toBeCloseTo(ROWS3, 0);
    const row = c.locator(".row.poster");
    await expect(row.locator(".pname")).toHaveText("Living room");
    await expect(row.locator(".pvalue .big b")).toHaveText("21.6");
    await expect(row.locator(".pvalue .big span")).toHaveText("°C");
    await expect(row.locator(".plabel")).toHaveText("Warm");
    await expect(row.locator(".plabel")).toHaveCSS("text-transform", "uppercase");
    // the lead at the top left, the pill at the top right
    const top = await rect(row.locator(".ptop"));
    const lead = await rect(row.locator(".plead"));
    const pill = await rect(row.locator(".plabel"));
    expect(top.top - box.top).toBeCloseTo(16, 0);
    expect(lead.left - box.left).toBeCloseTo(16, 0);
    expect(box.right - pill.right).toBeCloseTo(16, 0);
    expect(pill.top).toBeCloseTo(top.top, 0);
    // the body at the bottom: the card's padding below it, room between it and the top line
    const body = await rect(row.locator(".pbody"));
    expect(box.bottom - body.bottom).toBeCloseTo(16, 0);
    expect(body.top - top.bottom).toBeGreaterThan(12);
    // a rule's label follows the value
    await setState(page, "sensor.living_room_temperature", "18.2");
    await expect(row.locator(".plabel")).toHaveText("Cool");
    await expect(row.locator(".pvalue .big b")).toHaveText("18.2");
  });

  test("badges stack in the corner under the label and hide in place", async ({ page }) => {
    await mount(page, {
      type: E,
      entity: "sensor.ev_battery",
      name: "Car",
      layout: "poster",
      rules: [{ above: 20, color: "green", label: "Charged" }],
      badges: [
        "binary_sensor.ev_plugged",
        {
          entity: "sensor.ev_range",
          visibility: [{ condition: "state", entity: "light.kitchen", state: "on" }],
        },
      ],
    });
    await setState(page, "light.kitchen", "on");
    const c = card(page);
    const row = c.locator(".row.poster");
    const corner = row.locator(".ptop > .corner");
    const badges = corner.locator(":scope > .row.hval");
    await expect(corner.locator(":scope > .plabel")).toHaveText("Charged");
    await expect(badges).toHaveCount(2);
    await expect(badges.nth(1)).toBeVisible();
    await expect(badges.nth(1).locator(".state")).toHaveText(/km$/);
    // one column, right-aligned: label, then each badge below the one before
    const label = await rect(corner.locator(".plabel"));
    const a = await rect(badges.nth(0));
    const b = await rect(badges.nth(1));
    expect(a.top).toBeGreaterThanOrEqual(label.bottom);
    expect(b.top).toBeGreaterThanOrEqual(a.bottom);
    expect(a.right).toBeCloseTo(label.right, 0);
    expect(b.right).toBeCloseTo(label.right, 0);
    // the poster's own pill style: outlined
    await expect(badges.nth(0)).toHaveClass(/b-outline/);
    // a hidden badge goes in place: the poster's row and the other badge are the same nodes
    await mark(row);
    await mark(badges.nth(0));
    await setState(page, "light.kitchen", "off");
    await expect(badges.nth(1)).toBeHidden();
    await expect(row).toHaveAttribute("data-mark", "1");
    await expect(badges.nth(0)).toHaveAttribute("data-mark", "1");
    await setState(page, "light.kitchen", "on");
    await expect(badges.nth(1)).toBeVisible();
    await expect(row).toHaveAttribute("data-mark", "1");
  });

  test("a tap on the poster opens its entity, a tap on a badge the badge's", async ({ page }) => {
    await mount(page, {
      type: E,
      entity: "sensor.ev_battery",
      layout: "poster",
      badges: ["sensor.ev_range"],
    });
    const c = card(page);
    // the name sits over the poster's action layer, which takes the click
    await c.locator(".pname").click({ force: true });
    expect(await infos(page)).toEqual([moreInfo("sensor.ev_battery")]);
    await c.locator(".corner .row.hval").click();
    expect(await infos(page)).toEqual([moreInfo("sensor.ev_battery"), moreInfo("sensor.ev_range")]);
  });

  test("a light shows its switch beside the value and a slider below", async ({ page }) => {
    await mount(page, { type: E, entity: "light.kitchen", layout: "poster", control: "auto" });
    await setState(page, "light.kitchen", "off");
    const c = card(page);
    const value = c.locator(".pvalue");
    const toggle = value.locator(".end .toggle");
    await expect(toggle).toBeVisible();
    await expect(c.locator(".pbody > .ctl-slider")).toBeVisible();
    // the switch on the value's line, at the right
    const big = await rect(value.locator(".big"));
    const t = await rect(toggle);
    const box = await inner(c);
    expect(t.left).toBeGreaterThan(big.right);
    expect(box.right - t.right).toBeCloseTo(16, 0);
    expect(t.top).toBeLessThan(big.bottom);
    expect(t.bottom).toBeGreaterThan(big.top);
    await toggle.click();
    expect(await calls(page)).toEqual([
      expect.objectContaining({ service: "toggle", data: { entity_id: "light.kitchen" } }),
    ]);
    await expect(toggle).toHaveClass(/on/);
    // the switch is its own button: no more-info
    expect(await infos(page)).toEqual([]);
  });

  test("segments stay beside the value, and wrap under it on a narrow card", async ({ page }) => {
    const fan = {
      type: E,
      entity: "fan.bedroom",
      layout: "poster",
      attribute: "percentage",
      unit: "%",
      control: "segments",
    };
    await mount(page, fan);
    const c = card(page);
    let big = await rect(c.locator(".pvalue .big"));
    let end = await rect(c.locator(".pvalue > .end"));
    expect(end.left).toBeGreaterThan(big.right);
    expect(end.top).toBeLessThan(big.bottom);
    await mount(page, fan, { width: 150 });
    big = await rect(c.locator(".pvalue .big"));
    end = await rect(c.locator(".pvalue > .end"));
    const segs = await rect(c.locator(".pvalue .ctl-segments"));
    const poster = await rect(c.locator(".row.poster"));
    const box = await inner(c);
    // under the value, inside the poster and the card
    expect(end.top).toBeGreaterThanOrEqual(big.bottom);
    expect(end.right).toBeLessThanOrEqual(poster.right + 0.5);
    expect(segs.right).toBeLessThanOrEqual(poster.right + 0.5);
    expect(segs.left).toBeGreaterThanOrEqual(poster.left - 0.5);
    expect(end.bottom).toBeLessThanOrEqual(box.bottom);
    // the value keeps its size
    await expect(c.locator(".pvalue .big b")).toHaveText("0");
    expect(await overflows(c.locator(".pvalue .big b"))).toBe(false);
  });

  test("a stepper that shows the value takes the big value's place", async ({ page }) => {
    await mount(page, {
      type: E,
      entity: "climate.living_room",
      layout: "poster",
      attribute: "temperature",
      control: "stepper",
    });
    const c = card(page);
    await expect(c.locator(".pvalue .ctl-stepper .val")).toHaveText(/°C$/);
    await expect(c.locator(".pvalue .big")).toHaveCount(0);
    // the thermostat's current temperature as the value: the stepper sits beside it
    await mount(page, {
      type: E,
      entity: "climate.living_room",
      layout: "poster",
      attribute: "current_temperature",
      unit: "°C",
      control: "stepper",
    });
    await expect(c.locator(".pvalue .big")).toHaveCount(1);
    await expect(c.locator(".pvalue .ctl-stepper")).toBeVisible();
  });

  test("content taller than the card gives way at the top, the controls stay", async ({ page }) => {
    // a narrow thermostat: badge, value, stepper and bar need more than three rows
    await mount(
      page,
      {
        type: E,
        entity: "climate.living_room",
        layout: "poster",
        attribute: "current_temperature",
        unit: "°C",
        visual: "bar",
        min: 15,
        max: 28,
        control: "stepper",
        badges: [{ entity: "climate.living_room", attribute: "hvac_action" }],
      },
      { width: 170 },
    );
    const c = card(page);
    const box = await inner(c);
    expect((await rect(c.locator("ha-card"))).h).toBeCloseTo(ROWS3, 0);
    const bar = await rect(c.locator(".pbody > .bar"));
    const stepper = await rect(c.locator(".pvalue .ctl-stepper"));
    expect(bar.bottom).toBeLessThanOrEqual(box.bottom - 15);
    expect(stepper.top).toBeGreaterThanOrEqual(box.top);
    // the top line is what the card cuts
    const top = await rect(c.locator(".ptop"));
    expect(top.top).toBeLessThan(box.top + 16);
  });

  test("a sparkline runs to the card's edges and up under the value", async ({ page }) => {
    await mount(page, [
      { type: E, entity: "sensor.solar_power", layout: "poster", visual: "sparkline" },
      { type: E, entity: "sensor.solar_power", layout: "poster", visual: "columns" },
    ]);
    for (const i of [0, 1]) {
      const c = card(page, i);
      const box = await inner(c);
      const plot = await rect(c.locator(".pbody > .plot"));
      expect(Math.abs(plot.left - box.left)).toBeLessThanOrEqual(1);
      expect(Math.abs(plot.right - box.right)).toBeLessThanOrEqual(1);
      expect(Math.abs(plot.bottom - box.bottom)).toBeLessThanOrEqual(1);
      await expect(c.locator(".pbody > .plot svg :is(path, rect)").first()).toBeAttached();
    }
    // the line reaches up under the value, which stays on top of it
    const line = card(page, 0);
    const value = await rect(line.locator(".pvalue"));
    const plot = await rect(line.locator(".pbody > .plot"));
    expect(plot.top).toBeLessThan(value.bottom);
    await expect(line.locator(".pvalue")).toHaveCSS("z-index", "1");
    await expect(line.locator(".pvalue")).toHaveCSS("position", "relative");
    // columns would cover the value: they start below its line
    const cols = card(page, 1);
    const cv = await rect(cols.locator(".pvalue"));
    const cp = await rect(cols.locator(".pbody > .plot"));
    expect(cp.top).toBeGreaterThanOrEqual(cv.bottom);
  });

  test("a gauge draws the value in its arc, its name under it, centred below the top", async ({
    page,
  }) => {
    // four rows, as the docs' showcase gives a gauge poster: the arc and its name fit
    await mount(page, {
      type: E,
      entity: "sensor.living_room_humidity",
      name: "Humidity",
      layout: "poster",
      visual: "gauge",
      grid_options: { rows: 4 },
    });
    const c = card(page);
    await expect(c.locator(".pvalue")).toHaveCount(0);
    await expect(c.locator(".row.poster .big")).toHaveCount(0);
    const body = c.locator(".pbody");
    await expect(body).toHaveClass(/pgauge/);
    const gauge = await rect(body.locator(".gauge"));
    const name = await rect(body.locator(".pname"));
    await expect(body.locator(".pname")).toHaveText("Humidity");
    expect(name.top).toBeGreaterThanOrEqual(gauge.bottom);
    // centred across under the arc
    expect((name.left + name.right) / 2).toBeCloseTo((gauge.left + gauge.right) / 2, 0);
    // and down in the room under the top line (after the row's 12 px gap, above the padding)
    const top = await rect(c.locator(".ptop"));
    const box = await inner(c);
    const above = gauge.top - (top.bottom + 12);
    const below = box.bottom - 16 - name.bottom;
    expect(above).toBeGreaterThan(4);
    expect(Math.abs(above - below)).toBeLessThanOrEqual(2);
  });

  // a wide gauge keeps its arc small enough that the name stays inside three rows
  test("a gauge poster of three rows keeps its name inside the card", async ({ page }) => {
    await mount(
      page,
      { type: E, entity: "sensor.robot_battery", layout: "poster", visual: "gauge" },
      { width: 260 },
    );
    const c = card(page);
    const box = await inner(c);
    const name = await rect(c.locator(".pbody .pname"));
    expect(name.bottom).toBeLessThanOrEqual(box.bottom - 16);
  });

  test("a long value shrinks to fit the poster, and fits again when a font arrives", async ({
    page,
  }) => {
    await mount(
      page,
      { type: E, entity: "sensor.power_consumption", layout: "poster", unit: "W" },
      { width: 200 },
    );
    await setState(page, "sensor.power_consumption", "123456");
    const c = card(page);
    const b = c.locator(".row.poster .big b");
    await expect(b).toHaveText("123,456");
    await expect(c.locator(".row.poster .big")).toHaveClass(/fit/);
    await expect.poll(() => overflows(b)).toBe(false);
    const fitted = await fontPx(b);
    expect(fitted).toBeLessThan(40);
    expect(fitted).toBeGreaterThanOrEqual(24);
    expect(await b.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);
    // a short value keeps the full size
    await setState(page, "sensor.power_consumption", "12");
    await expect(b).toHaveText("12");
    await expect.poll(() => fontPx(b)).toBe(40);
    // a web font arriving widens the glyphs without resizing the card: the value is fitted again
    await setState(page, "sensor.power_consumption", "12345");
    await expect(b).toHaveText("12,345");
    await expect.poll(() => overflows(b)).toBe(false);
    const before = await fontPx(b);
    await b.evaluate((e) => ((e as HTMLElement).style.letterSpacing = "4px"));
    expect(await overflows(b)).toBe(true);
    await page.evaluate(() => document.fonts.dispatchEvent(new Event("loadingdone")));
    await expect.poll(() => overflows(b)).toBe(false);
    expect(await fontPx(b)).toBeLessThan(before);
  });
});

test.describe("group and sections cards", () => {
  test("a poster section: the first entity as the poster, the rest as badges", async ({ page }) => {
    await mount(page, {
      type: "custom:entity-sections-card-pro",
      title: "Living room",
      sections: [
        {
          layout: "poster",
          entities: [
            {
              entity: "sensor.living_room_temperature",
              name: "Temperature",
              rules: [{ above: 20, label: "Warm" }],
            },
            "sensor.living_room_humidity",
          ],
        },
      ],
    });
    const c = card(page);
    await expect(c.locator(".header .title")).toHaveText("Living room");
    const row = c.locator(".row.poster");
    await expect(row).toHaveCount(1);
    await expect(row.locator(".pname")).toHaveText("Temperature");
    await expect(row.locator(".pvalue .big b")).toHaveText("21.6");
    await expect(row.locator(".corner .plabel")).toHaveText("Warm");
    const badges = row.locator(".corner > .row.hval");
    await expect(badges).toHaveCount(1);
    await expect(badges.locator(".state")).toHaveText("48 %");
    await badges.click();
    expect(await infos(page)).toEqual([moreInfo("sensor.living_room_humidity")]);
  });

  test("vertical_align moves the body in a taller card, the header stays on top", async ({
    page,
  }) => {
    const group = (extra = {}) => ({
      type: "custom:entity-group-card-pro",
      title: "Lights",
      grid_options: { rows: 4 },
      entities: ["light.living_room", "light.kitchen"],
      ...extra,
    });
    const place = async () => {
      const c = card(page);
      return {
        box: await inner(c),
        header: await rect(c.locator(".header")),
        section: await rect(c.locator(".section")),
      };
    };
    await mount(page, group());
    const top = await place();
    // the default: the rows right under the header, the room below them empty
    expect(top.section.top - top.header.bottom).toBeCloseTo(12, 0);
    expect(top.box.bottom - top.section.bottom).toBeGreaterThan(60);

    await mount(page, group({ vertical_align: "bottom" }));
    const bottom = await place();
    expect(bottom.header.top).toBeCloseTo(top.header.top, 0);
    expect(bottom.header.bottom).toBeCloseTo(top.header.bottom, 0);
    expect(bottom.box.bottom - bottom.section.bottom).toBeLessThanOrEqual(16);
    expect(bottom.section.h).toBeCloseTo(top.section.h, 0);

    await mount(page, group({ vertical_align: "center" }));
    const center = await place();
    expect(center.header.bottom).toBeCloseTo(top.header.bottom, 0);
    const above = center.section.top - center.header.bottom;
    const below = center.box.bottom - center.section.bottom;
    expect(Math.abs(above - below)).toBeLessThanOrEqual(2);
    expect(center.section.top).toBeGreaterThan(top.section.top + 20);
    expect(center.section.top).toBeLessThan(bottom.section.top - 20);
  });

  test("vertical_align is checked", async ({ page }) => {
    await mount(page, { type: E, entity: "light.kitchen" });
    const err = await page.evaluate(() => {
      const el = document.createElement("entity-group-card-pro") as unknown as {
        setConfig(c: unknown): void;
      };
      try {
        el.setConfig({ entities: ["light.kitchen"], vertical_align: "middle" });
        return "";
      } catch (e) {
        return (e as Error).message;
      }
    });
    expect(err).toMatch(/vertical_align must be one of top \| center \| bottom/);
  });
});

test.describe("flow card posters", () => {
  const wind = (extra = {}) => ({
    type: "custom:wind-card-pro",
    entity: "sensor.wind_speed",
    direction: "sensor.wind_direction",
    gust: "sensor.wind_gust",
    name: "Wind",
    layout: "poster",
    rules: [
      { below: 5, color: "blue-grey", label: "Calm" },
      { below: 20, color: "teal", label: "Breeze" },
      { above: 20, color: "orange", label: "Strong" },
    ],
    ...extra,
  });
  const pinWind = async (page: Page) => {
    await setState(page, "sensor.wind_speed", "9.4");
    await setState(page, "sensor.wind_gust", "18.2");
    await setState(page, "sensor.wind_direction", "225");
  };

  test("wind: pill, big speed, direction and gusts; an animated lead", async ({ page }) => {
    await mount(page, wind());
    await pinWind(page);
    const c = card(page);
    expect(
      await page.evaluate(() => window.pc.card(0).getGridOptions() as unknown as object),
    ).toMatchObject({ rows: 3 });
    const row = c.locator(".row.wposter.poster");
    await expect(row.locator(".ptop .plabel")).toHaveText("Breeze");
    await expect(row.locator(".pname")).toHaveText("Wind");
    await expect(row.locator(".pvalue .big b")).toHaveText("9.4");
    await expect(row.locator(".pvalue .big span")).toHaveText("km/h");
    await expect(row.locator(".pbody > .secondary")).toHaveText("from SW · gusts 18.2 km/h");
    await expect(row.locator(".plead .lead.wlead .ld")).toHaveCount(6);
    await expect(row.locator(".wflow")).toHaveCount(0);
    const box = await inner(c);
    expect(box.bottom - box.top + 2).toBeCloseTo(ROWS3, 0);
    expect(box.bottom - (await rect(row.locator(".pbody"))).bottom).toBeCloseTo(16, 0);
    await setState(page, "sensor.wind_speed", "30");
    await expect(row.locator(".ptop .plabel")).toHaveText("Strong");
    await row.locator(".pname").click({ force: true });
    expect(await infos(page)).toEqual([moreInfo("sensor.wind_speed")]);
  });

  test("wind with visual: flow fills the card; a new speed keeps the running field", async ({
    page,
  }) => {
    await mount(page, wind({ visual: "flow" }));
    await pinWind(page);
    const c = card(page);
    const row = c.locator(".row.wposter.poster.flow");
    const band = row.locator(".wflow.bg");
    await expect(band.locator(".pt").first()).toBeAttached();
    const box = await inner(c);
    const b = await rect(band);
    expect(Math.abs(b.left - box.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(b.right - box.right)).toBeLessThanOrEqual(1);
    expect(Math.abs(b.top - box.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(b.bottom - box.bottom)).toBeLessThanOrEqual(1);
    // the lead is the arrow; the texts on top of the band
    await expect(row.locator(".plead ha-icon.arrow")).toHaveAttribute("icon", "mdi:navigation");
    await expect(row.locator(".plabel")).toHaveText("Breeze");
    await expect(row.locator(".pvalue .big b")).toHaveText("9.4");
    await expect(row.locator(".pbody > .secondary")).toHaveText("from SW · gusts 18.2 km/h");
    await expect(band.locator(".chip")).toBeHidden();
    // a speed change re-times the running animations: the band and its particles are kept
    await mark(band);
    await mark(band.locator(".pt").first());
    await mark(row.locator(".pvalue"));
    const rate = (kmh: number) => ((16 + kmh * 5) / (16 + 9.4 * 5)).toFixed(3);
    await setState(page, "sensor.wind_speed", "14");
    await expect(row.locator(".pvalue .big b")).toHaveText("14");
    await expect(band).toHaveAttribute("data-rate", rate(14));
    await expect(band).toHaveAttribute("data-mark", "1");
    await expect(band.locator(".pt").first()).toHaveAttribute("data-mark", "1");
    await expect(row.locator(".pvalue")).toHaveAttribute("data-mark", "1");
    // a tap anywhere on the poster opens the speed
    await row.locator(".pname").click({ force: true });
    expect(await infos(page)).toEqual([moreInfo("sensor.wind_speed")]);
  });

  test("rain: pill, big rate and today's total; visual: flow fills the card", async ({ page }) => {
    const rain = (extra = {}) => ({
      type: "custom:rain-card-pro",
      entity: "sensor.rain_rate_roof",
      today: "sensor.rain_today",
      wind: "sensor.wind_speed",
      direction: "sensor.wind_direction",
      name: "Rain",
      layout: "poster",
      rules: [
        { below: 0.1, color: "blue-grey", label: "Dry" },
        { below: 2.5, color: "light-blue", label: "Light" },
        { above: 2.5, color: "blue", label: "Heavy" },
      ],
      ...extra,
    });
    const pin = async () => {
      await setState(page, "sensor.rain_rate_roof", "2.4");
      await setState(page, "sensor.rain_today", "3.6");
      await setState(page, "sensor.wind_speed", "9.4");
      await setState(page, "sensor.wind_direction", "225");
    };
    await mount(page, rain());
    await pin();
    const c = card(page);
    let row = c.locator(".row.wposter.poster");
    await expect(row.locator(".plabel")).toHaveText("Light");
    await expect(row.locator(".pname")).toHaveText("Rain");
    await expect(row.locator(".pvalue .big b")).toHaveText("2.4");
    await expect(row.locator(".pvalue .big span")).toHaveText("mm/h");
    // the label is in the pill, not repeated in the secondary line
    await expect(row.locator(".pbody > .secondary")).toHaveText("3.6 mm today");
    await expect(row.locator(".plead .lead.wlead")).toBeVisible();

    await mount(page, rain({ visual: "flow" }));
    await pin();
    row = c.locator(".row.wposter.poster.flow");
    const band = row.locator(".wflow.bg");
    await expect(band.locator(".dr").first()).toBeAttached();
    await expect(row.locator(".plead ha-icon")).toHaveAttribute("icon", "mdi:weather-pouring");
    const box = await inner(c);
    const b = await rect(band);
    expect(Math.abs(b.left - box.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(b.right - box.right)).toBeLessThanOrEqual(1);
    expect(Math.abs(b.top - box.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(b.bottom - box.bottom)).toBeLessThanOrEqual(1);
    // a small rate change keeps the drops
    await mark(band.locator(".dr").first());
    await setState(page, "sensor.rain_rate_roof", "3");
    await expect(row.locator(".plabel")).toHaveText("Heavy");
    await expect(row.locator(".pvalue .big b")).toHaveText("3");
    await expect(band.locator(".dr").first()).toHaveAttribute("data-mark", "1");
  });
});

test.describe("sun path poster", () => {
  test("names the next event, its time and how soon; the curve along the bottom", async ({
    page,
  }) => {
    await mount(page, { type: "custom:sun-path-card-pro", layout: "poster" });
    const c = card(page);
    expect(
      await page.evaluate(() => window.pc.card(0).getGridOptions() as unknown as object),
    ).toMatchObject({ rows: 3 });
    await expect(c.locator("ha-card")).toHaveClass(/layout-poster/);
    const box = await inner(c);
    expect(box.bottom - box.top + 2).toBeCloseTo(ROWS3, 0);
    // at noon on 21 June the next event is the sunset, around 21:50 CEST
    await expect(c.locator(".pname")).toHaveText("Sunset");
    await expect(c.locator(".poster .big b")).toHaveText(/^21:[45]\d$/);
    await expect(c.locator(".plabel")).toHaveText("in 10 hours");
    await expect(c.locator(".lead ha-icon")).toHaveAttribute("icon", "mdi:white-balance-sunny");
    await expect(c.locator(".events")).toHaveCount(0);
    // the curve runs to the card's edges and reaches up under the time
    const plot = await rect(c.locator(".pbody > .plot"));
    expect(Math.abs(plot.left - box.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(plot.right - box.right)).toBeLessThanOrEqual(1);
    expect(Math.abs(plot.bottom - box.bottom)).toBeLessThanOrEqual(1);
    expect(plot.top).toBeLessThan((await rect(c.locator(".poster .big"))).bottom);
    await expect(c.locator(".plot svg .curve").first()).toBeAttached();
    // the tooltip over the plot
    await page.mouse.move(plot.left + plot.w / 2, plot.bottom - 10);
    await expect(c.locator(".tip")).toHaveClass(/on/);
    await expect(c.locator(".tip .time")).toHaveText(/^1[34]:\d\d$/);
    await expect(c.locator(".tip .row span")).toHaveText("elevation");
  });

  test("after the sunset it names the next day's sunrise, with the night's icon", async ({
    page,
  }) => {
    await mount(
      page,
      { type: "custom:sun-path-card-pro", layout: "poster" },
      { time: new Date("2026-06-21T23:00:00") },
    );
    const c = card(page);
    await expect(c.locator(".pname")).toHaveText("Sunrise");
    await expect(c.locator(".poster .big b")).toHaveText(/^0[45]:\d\d$/);
    await expect(c.locator(".plabel")).toHaveText(/^in [56] hours$/);
    await expect(c.locator(".lead ha-icon")).toHaveAttribute("icon", "mdi:weather-night");
  });
});

test.describe("weather poster", () => {
  test("condition pill, big temperature, high and low, the next hours' curve", async ({ page }) => {
    await mount(page, {
      type: "custom:weather-card-pro",
      entity: "weather.home",
      name: "Outside",
      layout: "poster",
    });
    const c = card(page);
    expect(
      await page.evaluate(() => window.pc.card(0).getGridOptions() as unknown as object),
    ).toMatchObject({ rows: 3 });
    const row = c.locator(".row.poster");
    await expect(row.locator(".plabel")).toHaveText("Partly cloudy");
    await expect(row.locator(".pname")).toHaveText("Outside");
    await expect(row.locator(".pvalue .big b")).toHaveText("17.4");
    await expect(row.locator(".pvalue .big span")).toHaveText("°C");
    await expect(row.locator(".pbody > .secondary")).toHaveText(/^\d+° \/ \d+°$/);
    const plot = row.locator(".plot.ptrend");
    await expect(plot.locator("svg path").first()).toBeAttached();
    const box = await inner(c);
    const p = await rect(plot);
    expect(Math.abs(p.left - box.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(p.right - box.right)).toBeLessThanOrEqual(1);
    expect(Math.abs(p.bottom - box.bottom)).toBeLessThanOrEqual(1);
    // the curve starts below the high and low, never under their text
    const hilo = await rect(row.locator(".pbody > .secondary"));
    expect(p.top).toBeGreaterThanOrEqual(hilo.bottom);
    // the tooltip names an hour's temperature
    await page.mouse.move(p.left + p.w / 2, p.bottom - 8);
    await expect(plot.locator(".tip")).toHaveClass(/on/);
    await expect(plot.locator(".tip")).toContainText(/\d+(\.\d)? ?°C/);
  });

  test("temperature rules colour and label the value", async ({ page }) => {
    await mount(page, {
      type: "custom:weather-card-pro",
      entity: "weather.home",
      layout: "poster",
      temperature_rules: [
        { below: 20, color: "teal", label: "Mild" },
        { above: 20, color: "orange", label: "Warm" },
      ],
    });
    const row = card(page).locator(".row.poster");
    await expect(row.locator(".plabel")).toHaveText("Partly cloudy");
    await expect(row.locator(".pbody > .secondary .accent")).toHaveText("Mild");
    expect(await row.evaluate((e) => e.style.getPropertyValue("--fe-temp").trim())).toBe(
      "var(--teal-color)",
    );
  });
});

test.describe("multi trend poster", () => {
  const power = {
    type: "custom:multi-trend-card-pro",
    title: "Power",
    icon: "mdi:flash",
    hours_to_show: 12,
    layout: "poster",
    entities: [
      { entity: "sensor.power_consumption", name: "Home", color: "amber" },
      { entity: "sensor.heat_pump_power", name: "Heat pump", color: "deep-orange" },
    ],
  };

  test("the first value large, the window in the pill, the lines overlaid", async ({ page }) => {
    await mount(page, power);
    const c = card(page);
    expect(
      await page.evaluate(() => window.pc.card(0).getGridOptions() as unknown as object),
    ).toMatchObject({ rows: 3 });
    await expect(c.locator("ha-card")).toHaveClass(/layout-poster/);
    await expect(c.locator(".pbody .primary")).toHaveText("Power");
    await expect(c.locator(".pbody .big b")).toHaveText("1,240");
    await expect(c.locator(".pbody .big span")).toHaveText("W");
    await expect(c.locator(".ptop .plabel")).toHaveText("12 h");
    await expect(c.locator(".legend")).toHaveCount(0);
    await expect(c.locator("svg path.line")).toHaveCount(2);
    await expect(c.locator(".lane-label")).toHaveCount(0);
    const box = await inner(c);
    const plot = await rect(c.locator(".plot"));
    expect(Math.abs(plot.left - box.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(plot.right - box.right)).toBeLessThanOrEqual(1);
    expect(Math.abs(plot.bottom - box.bottom)).toBeLessThanOrEqual(1);
  });

  test("the texts open more-info, the plot shows its tooltip", async ({ page }) => {
    await mount(page, power);
    const c = card(page);
    const plot = await rect(c.locator(".plot"));
    await page.mouse.move(plot.left + plot.w / 2, plot.bottom - 8);
    await expect(c.locator(".tip")).toHaveClass(/on/);
    await expect(c.locator(".tip .row")).toHaveCount(2);
    await page.mouse.click(plot.left + plot.w / 2, plot.bottom - 8);
    await expect(c.locator(".tip")).toHaveClass(/on/);
    expect(await infos(page)).toEqual([]);
    await c.locator(".ptop .shape").click();
    expect(await infos(page)).toEqual([moreInfo("sensor.power_consumption")]);
    await c.locator(".pbody .primary").click();
    expect(await infos(page)).toHaveLength(2);
  });
});

test.describe("heading card", () => {
  test("badges without a title start at the card's edge", async ({ page }) => {
    await mount(page, {
      type: "custom:heading-card-pro",
      style: "subtitle",
      badges_position: "inline",
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
    expect(hvals.left - header.left).toBeLessThanOrEqual(16);
  });
});

test.describe("layout card with posters", () => {
  test("every cell of a row has the same height", async ({ page }) => {
    const poster = (entity: string, extra = {}) => ({
      type: E,
      entity,
      layout: "poster",
      ...extra,
    });
    await mount(
      page,
      {
        type: "custom:layout-card-pro",
        columns: 4,
        cards: [
          { type: "custom:weather-card-pro", entity: "weather.home", layout: "poster" },
          { type: "custom:sun-path-card-pro", layout: "poster" },
          {
            type: "custom:wind-card-pro",
            entity: "sensor.wind_speed",
            direction: "sensor.wind_direction",
            layout: "poster",
            visual: "flow",
          },
          poster("sensor.ev_battery", { badges: ["sensor.ev_range"] }),
          poster("sensor.solar_power", { visual: "sparkline" }),
          poster("light.kitchen", { control: "auto" }),
          {
            type: "custom:entity-group-card-pro",
            title: "Living room",
            layout: "table",
            vertical_align: "bottom",
            view_layout: { span: [1, 3] },
            entities: [
              { entity: "light.desk_lamp", control: "toggle" },
              { entity: "light.living_room", control: "slider" },
            ],
          },
          {
            type: "custom:multi-trend-card-pro",
            title: "Power",
            layout: "poster",
            entities: [{ entity: "sensor.power_consumption" }],
          },
        ],
      },
      { width: 960 },
    );
    const rows = await page.evaluate(() => {
      const el = window.pc.card(0);
      const out: Record<number, { item: number; card: number }[]> = {};
      for (const it of el.shadowRoot!.querySelectorAll<HTMLElement>(".body .item")) {
        const b = it.getBoundingClientRect();
        const inner = it.querySelector("hui-card")?.firstElementChild as HTMLElement | null;
        const ha = inner?.shadowRoot?.querySelector("ha-card")?.getBoundingClientRect();
        (out[Math.round(b.top)] ??= []).push({
          item: Math.round(b.height),
          card: Math.round(ha?.height ?? -1),
        });
      }
      return Object.values(out);
    });
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row).toHaveLength(4);
      const h = row[0].item;
      expect(h).toBe(ROWS3);
      for (const cell of row) {
        expect(cell.item).toBe(h);
        expect(cell.card).toBe(h);
      }
    }
  });
});
