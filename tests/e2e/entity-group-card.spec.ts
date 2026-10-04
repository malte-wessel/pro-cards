import { test, expect, mount, calls, events, state, setState, card } from "./util.ts";
import type { Locator } from "@playwright/test";
import type { EntityGroupCard } from "../../src/entity-group-card.ts";

const T = "custom:entity-group-card-pro";
const feColor = (loc: Locator) =>
  loc.evaluate((e) => e.style.getPropertyValue("--fe-color").trim());
const style = (loc: Locator, prop: string) =>
  loc.evaluate((e, p) => getComputedStyle(e)[p as keyof CSSStyleDeclaration], prop);
const right = async (loc: Locator) => {
  const b = (await loc.boundingBox())!;
  return b.x + b.width;
};

test.describe("layouts", () => {
  test("list is the default: one row per entity with a header", async ({ page }) => {
    await mount(page, {
      type: T,
      title: "Rooms",
      icon: "mdi:home",
      entities: [
        "sensor.kitchen_temperature",
        "sensor.bedroom_temperature",
        { entity: "light.kitchen", toggle: true },
      ],
    });
    const c = card(page);
    await expect(c.locator("ha-card")).toHaveClass(/layout-list/);
    await expect(c.locator(".header .title")).toHaveText("Rooms");
    await expect(c.locator(".header ha-icon").first()).toHaveAttribute("icon", "mdi:home");
    await expect(c.locator(".row.list")).toHaveCount(3);
    await expect(c.locator(".row").nth(0).locator(".primary")).toHaveText("Kitchen temperature");
    await expect(c.locator(".row").nth(0).locator(".end .state")).toHaveText(/°C$/);
    await expect(c.locator(".row").nth(2).locator(".end .toggle")).toBeVisible();
  });
  test("grid renders cells and shrinks values that would overflow", async ({ page }) => {
    await mount(page, {
      type: T,
      layout: "grid",
      columns: 2,
      entities: [
        { entity: "sensor.living_room_co2", visual: "gauge", min: 400, max: 2000 },
        { entity: "sensor.robot_battery", visual: "ring" },
        { entity: "sensor.energy_today", name: "A long value", value: "12345678", unit: "kWh" },
        "sensor.solar_power",
      ],
    });
    const c = card(page);
    await expect(c.locator(".grid .row.cell")).toHaveCount(4);
    await expect(c.locator(".grid .row.cell").nth(0).locator(".gauge path.prog")).toBeAttached();
    await expect(
      c.locator(".grid .row.cell").nth(1).locator(".lead.ring circle.prog"),
    ).toBeAttached();
    const fits = c.locator(".grid .row.cell .big.fit b");
    await expect(fits).toHaveCount(2);
    const sizes = await fits.evaluateAll((els) =>
      els.map((e) => parseFloat(getComputedStyle(e).fontSize)),
    );
    expect(sizes[0]).toBeLessThan(22);
    expect(sizes[1]).toBe(22);
    for (const b of await fits.all())
      expect(await b.evaluate((e) => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(1);
  });
  test("hero has a lead with a sparkline and list rows for the rest", async ({ page }) => {
    await mount(page, {
      type: T,
      layout: "hero",
      title: "Weather",
      hours_to_show: 24,
      entities: [
        { entity: "sensor.outdoor_temperature", visual: "sparkline", decimals: 1 },
        { entity: "sensor.outdoor_humidity", visual: "badge" },
        { entity: "sensor.wind_speed", visual: "badge" },
        { entity: "sensor.uv_index", visual: "bar", min: 0, max: 11 },
        "sensor.pressure",
      ],
    });
    const c = card(page);
    await expect(c.locator(".header .range")).toHaveText("24 h");
    await expect(c.locator(".row.hero .big b")).toHaveText(/^\d+\.\d$/);
    await expect(c.locator(".row.hero .plot svg path").first()).toHaveAttribute("d", /^M/);
    await expect(c.locator(".row.list")).toHaveCount(4);
    await expect(c.locator(".row.list .end .pill")).toHaveCount(2);
    await expect(c.locator(".row.list .bar i")).toHaveCount(1);
  });
  test("row lays entities out side by side as name-above-icon items", async ({ page }) => {
    await mount(page, {
      type: T,
      layout: "row",
      title: "Kitchen",
      entities: [
        { entity: "light.kitchen", name: "Light" },
        { entity: "light.dining_table", name: "Dining" },
        { entity: "sensor.kitchen_temperature", name: "Temp", show_value: true },
        { entity: "vacuum.robot", visual: "badge", show_value: true, show_name: false },
        { entity: "sensor.pressure", name: "Plot", visual: "sparkline", name_position: "above" },
      ],
    });
    const c = card(page);
    const sec = c.locator(".section.layout-row");
    await expect(sec).toHaveClass(/align-start/);
    const items = sec.locator(".row.item");
    await expect(items).toHaveCount(5);
    await expect(items.nth(0).locator(".iname")).toHaveText("Light");
    await expect(items.nth(0).locator(".ibody .lead .shape ha-state-icon")).toHaveCount(1);
    await expect(items.nth(0).locator(".state")).toHaveCount(0);
    await expect(items.nth(0).locator(":scope > .ibody + .iname")).toHaveCount(1); // name below by default
    await expect(items.nth(4).locator(":scope > .iname + .ibody")).toHaveCount(1); // name above
    await expect(items.nth(2).locator(".ibody .state")).toHaveText(/°C$/);
    await expect(items.nth(3).locator(".iname")).toHaveCount(0);
    await expect(items.nth(3).locator(".ibody .pill")).toHaveText(/Cleaning/i);
    await expect(items.nth(4).locator(".plot")).toHaveCount(0);
    const b0 = (await items.nth(0).boundingBox())!,
      b1 = (await items.nth(1).boundingBox())!;
    expect(b1.x).toBeGreaterThan(b0.x + b0.width - 1);
    expect(Math.abs(b1.y - b0.y)).toBeLessThan(2);
  });
  test("row align spreads or centres the items", async ({ page }) => {
    await mount(page, {
      type: T,
      layout: "row",
      align: "space-between",
      entities: ["light.kitchen", "light.dining_table", "light.hallway"],
    });
    const sec = card(page).locator(".section.layout-row");
    expect(await style(sec, "justifyContent")).toBe("space-between");
    expect(
      Math.abs((await right(sec.locator(".row.item").nth(2))) - (await right(sec))),
    ).toBeLessThan(2);
    await mount(page, { type: T, layout: "row", align: "center", entities: ["light.kitchen"] });
    expect(await style(card(page).locator(".section.layout-row"), "justifyContent")).toBe("center");
  });
  test("column stacks items on the right by default", async ({ page }) => {
    await mount(page, {
      type: T,
      layout: "column",
      title: "Bedroom",
      show_name: false,
      entities: ["light.bedroom", "cover.bedroom_blinds", "climate.bedroom"],
    });
    const sec = card(page).locator(".section.layout-column");
    expect(await style(sec, "alignItems")).toBe("flex-end");
    const items = sec.locator(".row.item");
    await expect(items).toHaveCount(3);
    await expect(items.locator(".iname")).toHaveCount(0);
    const b0 = (await items.nth(0).boundingBox())!,
      b1 = (await items.nth(1).boundingBox())!;
    expect(b1.y).toBeGreaterThan(b0.y + b0.height - 1);
    expect(Math.abs((await right(items.nth(0))) - (await right(sec)))).toBeLessThan(2);
    await mount(page, { type: T, layout: "column", align: "start", entities: ["light.bedroom"] });
    expect(await style(card(page).locator(".section.layout-column"), "alignItems")).toBe(
      "flex-start",
    );
  });
  test("table shows uppercase keys with right-aligned values and an optional icon column", async ({
    page,
  }) => {
    await mount(page, {
      type: T,
      layout: "table",
      title: "Robot",
      entities: [
        { entity: "vacuum.robot", name: "Status", attribute: "status" },
        { entity: "sensor.robot_battery", name: "Battery" },
        { entity: "light.kitchen", name: "Light", toggle: true, show_value: false },
      ],
    });
    const sec = card(page).locator(".section.layout-table");
    await expect(sec).toHaveClass(/align-end/);
    await expect(sec).not.toHaveClass(/with-icon/);
    const fields = sec.locator(".row.field");
    await expect(fields).toHaveCount(3);
    await expect(fields.nth(0).locator(".key")).toHaveText("Status");
    expect(await style(fields.nth(0).locator(".key"), "textTransform")).toBe("uppercase");
    await expect(fields.nth(0).locator(".val .state")).toHaveText("Cleaning");
    await expect(fields.nth(1).locator(".val .state")).toHaveText(/%$/);
    await expect(fields.nth(0).locator(".lead")).toHaveCount(0);
    expect(
      Math.abs((await right(fields.nth(0).locator(".val"))) - (await right(fields.nth(0)))),
    ).toBeLessThan(2);
    await expect(fields.nth(2).locator(".val .state")).toHaveCount(0);
    await expect(fields.nth(2).locator(".val .toggle")).toBeVisible();
    await mount(page, {
      type: T,
      layout: "table",
      align: "start",
      show_icon: true,
      entities: ["sensor.robot_battery", { entity: "sensor.robot_current_room", show_icon: false }],
    });
    const sec2 = card(page).locator(".section.layout-table");
    await expect(sec2).toHaveClass(/with-icon/);
    await expect(sec2.locator(".row.field .lead")).toHaveCount(2);
    await expect(sec2.locator(".row.field").nth(0).locator(".lead .shape")).toHaveCount(1);
    await expect(sec2.locator(".row.field").nth(1).locator(".lead .shape")).toHaveCount(0);
    const f0 = sec2.locator(".row.field").nth(0);
    const kb = (await f0.locator(".key").boundingBox())!,
      vb = (await f0.locator(".val").boundingBox())!;
    expect(vb.x).toBeLessThan(kb.x + kb.width + 16); // right after the key, not at the far edge
  });
});

test.describe("values and header entities", () => {
  test("attribute, template, text, prefix and suffix values in list rows", async ({ page }) => {
    await mount(page, {
      type: T,
      entities: [
        { entity: "cover.office_blinds", attribute: "current_position", unit: "%" },
        {
          entity: "light.living_room",
          value: "{{ states.light | selectattr('state', 'eq', 'on') | list | count }} lights",
          name: "Lights",
        },
        { entity: "scene.bright", value: "Activate" },
        { entity: "sensor.pressure", prefix: "~", suffix: " hPa", unit: "", decimals: 0 },
      ],
    });
    const rows = card(page).locator(".row");
    await expect(rows.nth(0).locator(".end .state")).toHaveText("40 %");
    await expect(rows.nth(1).locator(".end .state")).toHaveText(/^\d lights$/);
    await expect(rows.nth(2).locator(".end .state")).toHaveText("Activate");
    await expect(rows.nth(3).locator(".end .state")).toHaveText(/^~1,?01\d hPa$/);
    const n = parseInt((await rows.nth(1).locator(".end .state").textContent())!);
    await setState(page, "light.garden", "on");
    await expect(rows.nth(1).locator(".end .state")).toHaveText(`${n + 1} lights`);
  });
  test("header entities sit on the title line as icon + value and are tappable", async ({
    page,
  }) => {
    await mount(page, {
      type: T,
      title: "Kitchen",
      icon: "mdi:silverware-fork-knife",
      header_entities: [
        {
          entity: "sensor.kitchen_temperature",
          decimals: 1,
          rules: [
            { below: 100, color: "purple" },
            { above: 100, color: "red" },
          ],
        },
        { entity: "sensor.kitchen_humidity", show_icon: false },
        { entity: "vacuum.robot", visual: "badge", show_name: true },
      ],
      entities: [{ entity: "sensor.pressure", visual: "sparkline" }, "light.kitchen"],
    });
    const c = card(page);
    const hv = c.locator(".header .hvals .row.hval");
    await expect(hv).toHaveCount(3);
    await expect(hv.nth(0).locator(".state")).toHaveText(/^\d+\.\d °C$/);
    await expect(hv.nth(0).locator(":scope > ha-state-icon, :scope > ha-icon")).toHaveCount(1);
    expect(await feColor(hv.nth(0))).toBe("var(--purple-color)");
    await expect(hv.nth(1).locator(":scope > ha-state-icon, :scope > ha-icon")).toHaveCount(0);
    await expect(hv.nth(1).locator(".state")).toHaveText(/%$/);
    await expect(hv.nth(2).locator(".secondary")).toHaveText("Robot vacuum");
    await expect(hv.nth(2).locator(".pill")).toBeVisible();
    await expect(c.locator(".header .range")).toHaveText("24 h");
    const tb = (await c.locator(".header .title").boundingBox())!,
      hb = (await hv.nth(0).boundingBox())!;
    expect(hb.x).toBeGreaterThan(tb.x);
    expect(Math.abs(hb.y + hb.height / 2 - (tb.y + tb.height / 2))).toBeLessThan(6);
    await hv.nth(0).click();
    expect(await events(page)).toEqual([
      { type: "more-info", entityId: "sensor.kitchen_temperature" },
    ]);
    await mount(page, {
      type: T,
      header_entities: ["sensor.kitchen_humidity"],
      entities: ["light.kitchen"],
    });
    await expect(card(page).locator(".header")).toBeVisible();
    await expect(card(page).locator(".header .title")).toHaveText("");
  });
});

test.describe("actions", () => {
  test("tap opens more-info by default; navigate, toggle and none are honoured", async ({
    page,
  }) => {
    await mount(page, {
      type: T,
      entities: [
        "sensor.pressure",
        {
          entity: "sensor.pressure",
          tap_action: { action: "navigate", navigation_path: "/lovelace/weather" },
        },
        { entity: "sensor.pressure", tap_action: { action: "none" } },
        { entity: "light.office", tap_action: { action: "toggle" } },
      ],
    });
    const rows = card(page).locator(".row");
    await rows.nth(0).click();
    expect(await events(page)).toEqual([{ type: "more-info", entityId: "sensor.pressure" }]);
    await rows.nth(1).click();
    expect((await events(page)).at(-1)).toEqual({
      type: "location-changed",
      path: "/lovelace/weather",
    });
    await rows.nth(2).click();
    expect((await events(page)).length).toBe(2);
    const before = await state(page, "light.office");
    await rows.nth(3).click();
    expect(await state(page, "light.office")).not.toBe(before);
    expect((await calls(page)).at(-1)).toMatchObject({
      domain: "homeassistant",
      service: "toggle",
      data: { entity_id: "light.office" },
    });
  });
});

test.describe("config errors", () => {
  test("setConfig rejects bad configs with a readable message", async ({ page }) => {
    await mount(page, { type: T, entities: ["light.kitchen"] });
    const msgs = await page.evaluate(() => {
      const el = document.createElement("entity-group-card-pro") as EntityGroupCard;
      const tryCfg = (c: unknown) => {
        try {
          el.setConfig(c);
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      };
      return [
        tryCfg({ layout: "list" }),
        tryCfg({ entities: [{ name: "x" }] }),
        tryCfg({ layout: "tile", entities: ["light.a"] }),
        tryCfg(null),
      ];
    });
    expect(msgs[0]).toMatch(/entity-group-card-pro: 'entities' must be a non-empty list/);
    expect(msgs[1]).toMatch(/entities\[0\] needs 'entity' or 'value'/);
    expect(msgs[2]).toMatch(/layout must be one of/);
    expect(msgs[3]).toMatch(/invalid config/);
  });
});
