import { test, expect, mount, calls, events, actions, state, setState, card } from "./util.ts";
import type { Locator } from "@playwright/test";
import type { EntityCard } from "../../src/entity-card.ts";

const T = "custom:entity-card-pro";
const light = (extra = {}) => ({ type: T, entity: "light.living_room", ...extra });
const feColor = (loc: Locator) =>
  loc.evaluate((e) => e.style.getPropertyValue("--fe-color").trim());

test.describe("tile", () => {
  test("shows one entity with name, value and icon in one grid row", async ({ page }) => {
    await mount(page, { ...light(), name: "Sofa lamp" });
    const c = card(page);
    await expect(c.locator("ha-card")).toHaveClass(/layout-tile/);
    await expect(c.locator(".header")).toHaveCount(0);
    await expect(c.locator(".texts .primary")).toHaveText("Sofa lamp");
    await expect(c.locator(".texts .secondary")).toContainText("On");
    await expect(c.locator(".shape ha-state-icon ha-icon")).toHaveAttribute("icon", /^mdi:/);
    const box = (await c.locator("ha-card").boundingBox())!;
    expect(box.height).toBeLessThanOrEqual(58);
    expect(box.width).toBeGreaterThan(300);
  });
  test("renders text and template values without an entity", async ({ page }) => {
    await mount(page, [
      { type: T, name: "Bins", value: "Paper on Tuesday", icon: "mdi:recycle", color: "green" },
      {
        type: T,
        name: "Lights on",
        value: "{{ states.light | selectattr('state', 'eq', 'on') | list | count }} lights",
      },
    ]);
    await expect(card(page, 0).locator(".primary")).toHaveText("Bins");
    await expect(card(page, 0).locator(".secondary")).toHaveText("Paper on Tuesday");
    expect(await feColor(card(page, 0).locator(".row"))).toBe("var(--green-color)");
    await expect(card(page, 1).locator(".secondary")).toHaveText(/^\d lights$/);
  });
});

test.describe("value drives the look", () => {
  test("numeric rules pick colour, icon, label and card tint and follow state changes", async ({
    page,
  }) => {
    await mount(page, {
      type: T,
      entity: "sensor.office_temperature",
      rules: [
        { below: 20, color: "blue", icon: "mdi:snowflake", label: "Cold" },
        { above: 20, color: "red", icon: "mdi:fire", label: "Hot", tint_card: true },
      ],
    });
    const c = card(page);
    await setState(page, "sensor.office_temperature", "24.8");
    await expect(c.locator(".texts .secondary")).toHaveText("24.8 °C · Hot");
    await expect(c.locator("ha-card")).toHaveClass(/tinted/);
    await expect(c.locator(".shape ha-state-icon ha-icon")).toHaveAttribute("icon", "mdi:fire");
    expect(await feColor(c.locator(".row"))).toBe("var(--red-color)");
    await setState(page, "sensor.office_temperature", "12.0");
    await expect(c.locator(".texts .secondary")).toHaveText("12.0 °C · Cold");
    await expect(c.locator("ha-card")).not.toHaveClass(/tinted/);
    await expect(c.locator(".shape ha-state-icon ha-icon")).toHaveAttribute(
      "icon",
      "mdi:snowflake",
    );
    expect(await feColor(c.locator(".row"))).toBe("var(--blue-color)");
  });
  test("state rules label text states on a badge and update live", async ({ page }) => {
    await mount(page, {
      type: T,
      entity: "vacuum.robot",
      visual: "badge",
      rules: [
        { state: "docked", color: "green", label: "Parked" },
        { state: "cleaning", color: "blue", label: "Busy", tint_card: true },
      ],
    });
    const c = card(page);
    await setState(page, "vacuum.robot", "docked");
    await expect(c.locator(".pill")).toHaveText("Parked");
    await expect(c.locator("ha-card")).not.toHaveClass(/tinted/);
    await setState(page, "vacuum.robot", "cleaning");
    await expect(c.locator(".pill")).toHaveText("Busy");
    await expect(c.locator("ha-card")).toHaveClass(/tinted/);
  });
  test("attribute, prefix and suffix values", async ({ page }) => {
    await mount(page, [
      { type: T, entity: "cover.office_blinds", attribute: "current_position", unit: "%" },
      { type: T, entity: "sensor.pressure", prefix: "~", suffix: " hPa", unit: "", decimals: 0 },
    ]);
    await expect(card(page, 0).locator(".secondary")).toHaveText("40 %");
    await expect(card(page, 1).locator(".secondary")).toHaveText(/^~1,?01\d hPa$/);
  });
  test("secondary renders a template under the name", async ({ page }) => {
    await mount(page, {
      ...light(),
      secondary: "{{ states('sensor.washer_remaining') }} min left",
    });
    await expect(card(page).locator(".texts .secondary")).toHaveText("42 min left");
  });
  test("missing or unavailable entities are greyed, not broken", async ({ page }) => {
    await mount(page, [
      { type: T, entity: "sensor.does_not_exist", name: "Ghost" },
      { type: T, entity: "sensor.office_temperature", visual: "ring" },
    ]);
    await setState(page, "sensor.office_temperature", "unavailable");
    for (const i of [0, 1]) {
      await expect(card(page, i).locator("ha-card")).toBeVisible();
      expect(await feColor(card(page, i).locator(".row"))).toBe("var(--grey-color)");
    }
    await expect(card(page, 0).locator(".primary")).toHaveText("Ghost");
  });
});

test.describe("visuals", () => {
  test("the hover ring of a strip sits exactly on the hovered bar", async ({ page }) => {
    await mount(page, {
      type: T,
      entity: "binary_sensor.rain",
      visual: "strip",
      hours_to_show: 24,
    });
    const c = card(page);
    const box = (await c.locator(".plot").boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.4, box.y + box.height / 2);
    await expect(c.locator(".tip")).toHaveClass(/on/);
    const ring = await c
      .locator(".plot svg .hl")
      .evaluate((e) => e.getBoundingClientRect().toJSON());
    const bars = await c
      .locator(".plot svg rect[fill]")
      .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
    const bar = bars.find((b) => Math.abs(b.x - ring.x) < 1);
    expect(bar).toBeDefined();
    expect(Math.abs(bar!.width - ring.width)).toBeLessThan(0.5);
    expect(Math.abs(bar!.y - ring.y)).toBeLessThan(0.5);
    expect(Math.abs(bar!.height - ring.height)).toBeLessThan(0.5);
  });
  test("history visuals draw from recorded state", async ({ page }) => {
    await mount(page, [
      { type: T, entity: "sensor.outdoor_temperature", visual: "sparkline", hours_to_show: 6 },
      {
        type: T,
        entity: "sensor.wind_gust",
        visual: "columns",
        hours_to_show: 6,
        bucket_minutes: 30,
      },
      {
        type: T,
        entity: "binary_sensor.rain",
        visual: "strip",
        hours_to_show: 12,
        bucket_minutes: 60,
        rules: [
          { state: "on", color: "blue" },
          { state: "off", color: "grey" },
        ],
      },
      {
        type: T,
        entity: "sensor.outdoor_humidity",
        visual: "strip",
        hours_to_show: 12,
        bucket_minutes: 60,
        rules: [
          { below: 50, color: "amber" },
          { above: 50, color: "green" },
        ],
      },
    ]);
    await expect(card(page, 0).locator(".plot svg path").first()).toHaveAttribute(
      "d",
      /^M[\d.]+,[\d.]+ (C|L)/,
    );
    expect(await card(page, 1).locator(".plot svg rect").count()).toBeGreaterThanOrEqual(12);
    const stripFills = await card(page, 2)
      .locator(".plot svg rect[fill]")
      .evaluateAll((r) => r.map((x) => x.getAttribute("fill")));
    expect(stripFills.length).toBeGreaterThanOrEqual(12);
    for (const f of stripFills) expect(["var(--blue-color)", "var(--grey-color)"]).toContain(f);
    const numFills = await card(page, 3)
      .locator(".plot svg rect[fill]")
      .evaluateAll((r) => [...new Set(r.map((x) => x.getAttribute("fill")))]);
    for (const f of numFills) expect(["var(--amber-color)", "var(--green-color)"]).toContain(f);
  });
  test("ring, gauge, bar and badge render their parts", async ({ page }) => {
    await mount(page, [
      { type: T, entity: "sensor.robot_battery", visual: "ring" },
      { type: T, entity: "sensor.power_consumption", visual: "gauge", min: 0, max: 3000 },
      { type: T, entity: "sensor.bathroom_humidity", visual: "bar" },
      {
        type: T,
        entity: "person.alex",
        visual: "badge",
        rules: [{ state: "home", label: "Home" }],
      },
    ]);
    await setState(page, "sensor.robot_battery", "72");
    const ring = card(page, 0).locator(".lead.ring circle.prog");
    const [dash, off] = await ring.evaluate((e) => [
      parseFloat(e.getAttribute("stroke-dasharray")!),
      parseFloat(e.getAttribute("stroke-dashoffset")!),
    ]);
    expect(1 - off / dash).toBeCloseTo(0.72, 1);
    await expect(card(page, 1).locator(".gauge path.prog")).toBeAttached();
    await expect(card(page, 1).locator(".gauge text.sub").nth(1)).toHaveText("3,000");
    await expect(card(page, 1).locator(".gauge text.val")).toHaveText(/W$/);
    await setState(page, "sensor.bathroom_humidity", "68");
    await expect(card(page, 2).locator(".bar i")).toHaveAttribute("style", /width: 68%/);
    await expect(card(page, 3).locator(".pill")).toHaveText("Home");
  });
});

test.describe("actions", () => {
  test("toggle calls homeassistant.toggle and the card follows the new state", async ({ page }) => {
    await mount(page, {
      ...light({ entity: "light.kitchen" }),
      toggle: true,
      rules: [
        { state: "on", label: "On" },
        { state: "off", label: "Off" },
      ],
    });
    const c = card(page);
    await setState(page, "light.kitchen", "off");
    await expect(c.locator(".toggle")).not.toHaveClass(/on/);
    await expect(c.locator(".texts .secondary")).toContainText("Off");
    await c.locator(".toggle").click();
    expect(await calls(page)).toEqual([
      {
        domain: "homeassistant",
        service: "toggle",
        data: { entity_id: "light.kitchen" },
        target: null,
      },
    ]);
    expect(await state(page, "light.kitchen")).toBe("on");
    await expect(c.locator(".toggle")).toHaveClass(/on/);
    await expect(c.locator(".texts .secondary")).toContainText("On");
  });
  test("perform-action asks for confirmation and passes data and target", async ({ page }) => {
    await mount(page, {
      type: T,
      entity: "script.check_windows",
      value: "Run",
      tap_action: {
        action: "perform-action",
        perform_action: "script.turn_on",
        target: { entity_id: "script.check_windows" },
        data: { variables: { room: "kitchen" } },
        confirmation: { text: "Really?" },
      },
    });
    let dialogText = null;
    page.once("dialog", (d) => {
      dialogText = d.message();
      d.dismiss();
    });
    await card(page).locator(".row").click();
    expect(dialogText).toBe("Really?");
    expect(await calls(page)).toEqual([]);
    page.once("dialog", (d) => d.accept());
    await card(page).locator(".row").click();
    expect(await calls(page)).toEqual([
      {
        domain: "script",
        service: "turn_on",
        data: { variables: { room: "kitchen" } },
        target: { entity_id: "script.check_windows" },
      },
    ]);
  });
  test("hold triggers hold_action instead of tap", async ({ page }) => {
    await mount(page, {
      ...light(),
      tap_action: { action: "none" },
      hold_action: { action: "more-info" },
    });
    const box = (await card(page).locator(".row").boundingBox())!;
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.down();
    await page.waitForTimeout(650);
    await page.mouse.up();
    expect(await events(page)).toEqual([{ type: "more-info", entityId: "light.living_room" }]);
  });
  test("hands the raw action and the target entity to Home Assistant", async ({ page }) => {
    await mount(page, {
      ...light(),
      tap_action: { action: "assist", pipeline_id: "kitchen", start_listening: true },
      hold_action: { action: "toggle", entity: "light.kitchen" },
    });
    await card(page).locator(".row").click();
    expect(await actions(page)).toEqual([
      {
        action: "tap",
        config: {
          entity: "light.living_room",
          tap_action: { action: "assist", pipeline_id: "kitchen", start_listening: true },
        },
      },
    ]);
    const box = (await card(page).locator(".row").boundingBox())!;
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.down();
    await page.waitForTimeout(650);
    await page.mouse.up();
    expect((await actions(page))[1]).toEqual({
      action: "hold",
      config: { entity: "light.kitchen", hold_action: { action: "toggle" } },
    });
    expect(await state(page, "light.kitchen")).toBe("on");
    // actionable rows stay clickable but carry no ripple
    expect(await card(page).locator(".row.actionable").count()).toBeGreaterThan(0);
    expect(await card(page).locator(".row ha-ripple").count()).toBe(0);
  });
});

test.describe("config errors", () => {
  test("setConfig rejects bad configs with a readable message", async ({ page }) => {
    await mount(page, light());
    const msgs = await page.evaluate(() => {
      const el = document.createElement("entity-card-pro") as EntityCard;
      const tryCfg = (c: unknown) => {
        try {
          el.setConfig(c);
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      };
      return [tryCfg({ name: "x" }), tryCfg(null), tryCfg({ entity: "light.a" })];
    });
    expect(msgs[0]).toMatch(/entity-card-pro: 'entity' or 'value' is required/);
    expect(msgs[1]).toMatch(/invalid config/);
    expect(msgs[2]).toBeNull();
  });
});
