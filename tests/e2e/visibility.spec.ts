import { test, expect, mount, setState, setUser, card } from "./util.ts";
import type { Locator } from "@playwright/test";
import type { CardElement } from "../harness/harness.ts";

const G = "custom:entity-group-card-pro",
  S = "custom:entity-sections-card-pro";
// shown while the kitchen light is on (it starts off)
const kitchenOn = [{ condition: "state", entity: "light.kitchen", state: "on" }];
const idxs = (loc: Locator) => loc.evaluateAll((els) => els.map((e) => e.dataset.idx));
const size = (loc: Locator) => loc.evaluate((el) => (el as CardElement).getCardSize());

test.describe("visibility: rows", () => {
  test("shows a row only while its conditions hold", async ({ page }) => {
    await mount(page, {
      type: G,
      title: "Lights",
      entities: [
        "light.living_room",
        { entity: "light.dining_table", visibility: kitchenOn },
        "light.office",
      ],
    });
    const rows = card(page).locator(".row.list");
    expect(await idxs(rows)).toEqual(["0", "2"]);
    const before = await size(card(page));
    await setState(page, "light.kitchen", "on");
    await expect(rows).toHaveCount(3);
    expect(await idxs(rows)).toEqual(["0", "1", "2"]);
    expect(await size(card(page))).toBe(before + 1);
    await setState(page, "light.kitchen", "off");
    await expect(rows).toHaveCount(2);
  });

  test("falls back to the row's own entity", async ({ page }) => {
    await mount(page, {
      type: G,
      entities: [
        "light.living_room",
        { entity: "light.kitchen", visibility: [{ condition: "state", state: "on" }] },
      ],
    });
    const rows = card(page).locator(".row.list");
    await expect(rows).toHaveCount(1);
    await setState(page, "light.kitchen", "on");
    await expect(rows).toHaveCount(2);
  });

  test("lets the first shown item lead a hero, without a stray divider", async ({ page }) => {
    await mount(page, {
      type: G,
      layout: "hero",
      entities: [
        { entity: "sensor.living_room_temperature", visibility: kitchenOn },
        "light.living_room",
        "light.office",
      ],
    });
    const c = card(page);
    expect(await idxs(c.locator(".row.hero"))).toEqual(["1"]);
    expect(await idxs(c.locator(".row.list"))).toEqual(["2"]);
    await expect(c.locator(".section > .divider")).toHaveCount(1);
    await setState(page, "light.kitchen", "on");
    await expect(c.locator(".row.hero")).toHaveAttribute("data-idx", "0");
    expect(await idxs(c.locator(".row.list"))).toEqual(["1", "2"]);
  });

  test("draws a table's icon column only while a shown item has an icon", async ({ page }) => {
    await mount(page, {
      type: G,
      layout: "table",
      show_icon: false,
      entities: [
        { entity: "light.living_room", show_icon: true, visibility: kitchenOn },
        "light.office",
      ],
    });
    const table = card(page).locator(".section.layout-table");
    await expect(table).not.toHaveClass(/with-icon/);
    await setState(page, "light.kitchen", "on");
    await expect(table).toHaveClass(/with-icon/);
  });

  test("never tints the card from a hidden row", async ({ page }) => {
    await mount(page, {
      type: G,
      entities: [
        "light.office",
        {
          entity: "light.living_room",
          visibility: kitchenOn,
          rules: [{ state: "on", color: "red", tint_card: true }],
        },
      ],
    });
    const haCard = card(page).locator("ha-card");
    await expect(haCard).not.toHaveClass(/tinted/);
    await setState(page, "light.kitchen", "on");
    await expect(haCard).toHaveClass(/tinted/);
  });

  test("keeps the focus on its control when a row above disappears", async ({ page }) => {
    await mount(page, {
      type: G,
      entities: [
        { entity: "light.dining_table", visibility: kitchenOn },
        { entity: "light.office", control: "toggle" },
      ],
    });
    await setState(page, "light.kitchen", "on");
    const toggle = card(page).locator('.row[data-idx="1"] .toggle');
    await toggle.focus();
    await setState(page, "light.kitchen", "off");
    await expect(card(page).locator(".row.list")).toHaveCount(1);
    const focused = await card(page).evaluate(
      (el) => (el.shadowRoot!.activeElement as HTMLElement | null)?.className ?? null,
    );
    expect(focused).toMatch(/toggle/);
  });
});

test.describe("visibility: during a gesture", () => {
  test("waits for a slider drag to end before the body changes", async ({ page }) => {
    await mount(
      page,
      {
        type: G,
        entities: [
          { entity: "light.dining_table", visibility: kitchenOn },
          { entity: "cover.office_blinds", control: "slider" },
        ],
      },
      { liveClock: true },
    );
    await setState(page, "light.kitchen", "on");
    const rows = card(page).locator(".row.list");
    await expect(rows).toHaveCount(2);
    const track = card(page).locator(".ctl-slider .track");
    const b = (await track.boundingBox())!;
    await page.mouse.move(b.x + b.width * 0.4, b.y + b.height / 2);
    await page.mouse.down();
    await expect(card(page).locator(".ctl-slider")).toHaveClass(/dragging/);
    await setState(page, "light.kitchen", "off");
    await page.waitForTimeout(100);
    // the dragged row (and its slider) stays put; the hidden row hides in place meanwhile
    await expect(card(page).locator(".ctl-slider")).toHaveClass(/dragging/);
    await expect(rows.first()).toBeHidden();
    await page.mouse.up();
    await expect(rows).toHaveCount(1);
    expect(await idxs(rows)).toEqual(["1"]);
  });
});

test.describe("visibility: sections and header", () => {
  test("hides a section with its divider; dividers stay only between shown ones", async ({
    page,
  }) => {
    await mount(page, {
      type: S,
      sections: [
        { visibility: kitchenOn, entities: ["light.living_room"] },
        { divider: true, entities: ["light.office"] },
        { divider: true, visibility: kitchenOn, entities: ["light.bedroom"] },
        { divider: true, entities: ["light.hallway"] },
      ],
    });
    const body = card(page).locator(".body");
    await expect(body.locator(":scope > .section")).toHaveCount(2);
    // office, divider, hallway: nothing above the first shown section
    expect(
      await body.evaluate((b) => [...b.children].map((c) => c.className.split(" ")[0])),
    ).toEqual(["section", "divider", "section"]);
    await setState(page, "light.kitchen", "on");
    await expect(body.locator(":scope > .section")).toHaveCount(4);
    await expect(body.locator(":scope > .divider")).toHaveCount(3);
  });

  test("hides a section whose items are all hidden", async ({ page }) => {
    await mount(page, {
      type: S,
      sections: [
        { entities: ["light.office"] },
        { divider: true, entities: [{ entity: "light.bedroom", visibility: kitchenOn }] },
      ],
    });
    await expect(card(page).locator(".body > .section")).toHaveCount(1);
    await expect(card(page).locator(".body > .divider")).toHaveCount(0);
  });

  test("hides header items in place, the header when nothing is left, the card when empty", async ({
    page,
  }) => {
    await mount(page, {
      type: G,
      header_entities: [{ entity: "sensor.living_room_temperature", visibility: kitchenOn }],
      entities: [{ entity: "light.office", visibility: kitchenOn }],
    });
    const c = card(page);
    await expect(c.locator("ha-card")).toBeHidden();
    await setState(page, "light.kitchen", "on");
    await expect(c.locator("ha-card")).toBeVisible();
    await expect(c.locator(".header")).toBeVisible();
    await expect(c.locator(".row.hval")).toBeVisible();
    await setState(page, "light.kitchen", "off");
    await expect(c.locator("ha-card")).toBeHidden();
  });
});

test.describe("visibility: empty cards", () => {
  test("a card without a header shows nothing once everything is hidden", async ({ page }) => {
    await mount(page, {
      type: "custom:weather-card-pro",
      entity: "weather.home",
      sections: [{ type: "hero", visibility: kitchenOn }],
    });
    await expect(card(page).locator("ha-card")).toBeHidden();
    await setState(page, "light.kitchen", "on");
    await expect(card(page).locator("ha-card")).toBeVisible();
  });

  test("a row of buttons alone goes when all its buttons are hidden", async ({ page }) => {
    await mount(page, {
      type: G,
      entities: [
        "light.office",
        {
          name: "Scenes",
          control: "buttons",
          control_options: [{ entity: "light.living_room", visibility: kitchenOn }],
        },
      ],
    });
    const rows = card(page).locator(".row.list");
    await expect(rows).toHaveCount(1);
    await setState(page, "light.kitchen", "on");
    await expect(rows).toHaveCount(2);
  });
});

test.describe("visibility: custom buttons", () => {
  test("leaves a hidden button out and keeps the others' calls on the right button", async ({
    page,
  }) => {
    await mount(page, {
      type: G,
      entities: [
        {
          name: "Lights",
          control: "buttons",
          control_options: [
            { entity: "light.living_room", label: "Living", visibility: kitchenOn },
            { entity: "light.hallway", label: "Hall" },
          ],
        },
      ],
    });
    const buttons = card(page).locator(".ctl-buttons.custom > button");
    await expect(buttons).toHaveCount(1);
    await expect(buttons.first()).toHaveText("Hall");
    await page.evaluate(() => window.pc.holdCalls(true));
    await buttons.first().click();
    await expect(buttons.first()).toHaveClass(/pending/);
    await setState(page, "light.kitchen", "on");
    await expect(buttons).toHaveCount(2);
    // the call in flight is still the hall's
    await expect(buttons.nth(1)).toHaveClass(/pending/);
    await expect(buttons.nth(0)).not.toHaveClass(/pending/);
  });
});

test.describe("visibility: conditions", () => {
  test("screen: follows the viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 800 });
    await mount(page, {
      type: G,
      entities: [
        "light.office",
        {
          entity: "light.bedroom",
          visibility: [{ condition: "screen", media_query: "(min-width: 900px)" }],
        },
      ],
    });
    const rows = card(page).locator(".row.list");
    await expect(rows).toHaveCount(2);
    await page.setViewportSize({ width: 600, height: 800 });
    await expect(rows).toHaveCount(1);
    await page.setViewportSize({ width: 1000, height: 800 });
    await expect(rows).toHaveCount(2);
  });

  test("user and location: the logged-in user and where their person is", async ({ page }) => {
    await mount(page, {
      type: G,
      entities: [
        "light.office",
        { entity: "light.bedroom", visibility: [{ condition: "user", users: ["demo-alex"] }] },
        {
          entity: "light.hallway",
          visibility: [{ condition: "location", locations: ["home"] }],
        },
      ],
    });
    const rows = card(page).locator(".row.list");
    expect(await idxs(rows)).toEqual(["0", "1", "2"]);
    await setState(page, "person.alex", "not_home");
    await expect(rows).toHaveCount(2);
    expect(await idxs(rows)).toEqual(["0", "1"]);
    // Sam is away (person.sam), and not on the user list
    await setUser(page, "demo-sam");
    await expect(rows).toHaveCount(1);
    await setUser(page, null);
    await expect(rows).toHaveCount(1);
  });

  test("template: shown once the template renders true", async ({ page }) => {
    await mount(page, {
      type: G,
      entities: [
        "light.office",
        {
          entity: "light.bedroom",
          visibility: [
            { condition: "template", value_template: "{{ is_state('light.kitchen', 'on') }}" },
          ],
        },
      ],
    });
    const rows = card(page).locator(".row.list");
    await expect(rows).toHaveCount(1);
    await setState(page, "light.kitchen", "on");
    await expect(rows).toHaveCount(2);
  });

  test("time: shown from the window's start, without a state change", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-06-21T11:59:30") });
    await mount(
      page,
      {
        type: G,
        entities: [
          "light.office",
          {
            entity: "light.bedroom",
            visibility: [{ condition: "time", after: "12:00", before: "13:00" }],
          },
        ],
      },
      { liveClock: true },
    );
    const rows = card(page).locator(".row.list");
    await expect(rows).toHaveCount(1);
    await page.clock.runFor(31_000);
    await expect(rows).toHaveCount(2);
  });
});

test.describe("visibility: weather sections", () => {
  const W = "custom:weather-card-pro";
  test("hides sections of every kind, with dividers only between shown ones", async ({ page }) => {
    await mount(page, {
      type: W,
      entity: "weather.home",
      sections: [
        { type: "hero", visibility: kitchenOn },
        { type: "row", divider: true, entities: ["humidity"] },
        { type: "forecast", mode: "daily", divider: true, visibility: kitchenOn },
        { type: "trend", mode: "hourly", divider: true },
      ],
    });
    const body = card(page).locator(".body");
    const secs = body.locator(":scope > [data-sec]");
    const shown = () => secs.evaluateAll((els) => els.map((e) => e.dataset.sec));
    expect(await shown()).toEqual(["1", "3"]);
    expect(
      await body.evaluate((b) => [...b.children].map((c) => (c as HTMLElement).dataset.sec ?? "|")),
    ).toEqual(["1", "|", "3"]);
    await setState(page, "light.kitchen", "on");
    await expect(secs).toHaveCount(4);
    expect(await shown()).toEqual(["0", "1", "2", "3"]);
    await expect(body.locator(":scope > .divider")).toHaveCount(3);
    // the forecast that came back draws its days, the hero its condition
    await expect(secs.nth(2)).not.toBeEmpty();
    await expect(secs.nth(0).locator(".row.whero")).toBeVisible();
  });

  test("a section's condition reads the weather entity by default", async ({ page }) => {
    await mount(page, {
      type: W,
      entity: "weather.home",
      sections: [
        { type: "hero" },
        {
          type: "row",
          divider: true,
          entities: ["precipitation"],
          visibility: [{ condition: "state", state: "rainy" }],
        },
      ],
    });
    const secs = card(page).locator(".body > [data-sec]");
    await expect(secs).toHaveCount(1);
    await setState(page, "weather.home", "rainy");
    await expect(secs).toHaveCount(2);
  });
});

test.describe("visibility: power flow nodes", () => {
  const P = "custom:power-flow-card-pro";
  test("hides consumers and sources; their watts go to other, the tree shrinks", async ({
    page,
  }) => {
    await mount(page, {
      type: P,
      home: "sensor.power_consumption",
      sources: [
        { type: "solar", entity: "sensor.solar_power" },
        { type: "battery", power: "sensor.battery_power", visibility: kitchenOn },
        { type: "grid", power: "sensor.grid_power" },
      ],
      consumers: [
        { entity: "sensor.heat_pump_power", name: "Heat pump" },
        { entity: "sensor.washer_power", name: "Washer", visibility: kitchenOn },
        { entity: "sensor.office_power", name: "Office" },
      ],
    });
    for (const [id, s] of Object.entries({
      "sensor.solar_power": "0",
      "sensor.battery_power": "0",
      "sensor.grid_power": "1000",
      "sensor.power_consumption": "1000",
      "sensor.heat_pump_power": "400",
      "sensor.washer_power": "300",
      "sensor.office_power": "100",
    }))
      await setState(page, id, s);
    const c = card(page);
    const node = (id: string) => c.locator(`.pnode[data-node="${id}"]`);
    const label = (id: string) => c.locator(`.plabel[data-node="${id}"]`);
    const diagH = () =>
      c.locator(".pdiag").evaluate((e) => parseFloat(e.style.getPropertyValue("--diag-h")));
    await expect(node("c1")).toBeHidden();
    await expect(label("c1")).toBeHidden();
    await expect(node("s1")).toBeHidden();
    // the washer's 300 W are part of "other": 1000 − 400 − 100
    await expect(label("other")).toHaveText(/^500 W/);
    const small = await diagH();
    await setState(page, "light.kitchen", "on");
    await expect(node("c1")).toBeVisible();
    await expect(node("s1")).toBeVisible();
    await expect(label("c1")).toHaveText(/300 W\s*Washer/);
    await expect(label("other")).toHaveText(/^200 W/);
    expect(await diagH()).toBeGreaterThan(small);
    await setState(page, "light.kitchen", "off");
    await expect(node("c1")).toBeHidden();
    expect(await diagH()).toBe(small);
  });
});

test.describe("visibility: multi trend series", () => {
  const M = "custom:multi-trend-card-pro";
  test("draws only the shown series, keeps their colours, survives none", async ({ page }) => {
    await mount(page, {
      type: M,
      title: "Temperatures",
      entities: [
        { entity: "sensor.living_room_temperature", name: "Living" },
        { entity: "sensor.kitchen_temperature", name: "Kitchen", visibility: kitchenOn },
        { entity: "sensor.bedroom_temperature", name: "Bedroom" },
      ],
    });
    const c = card(page);
    const legend = c.locator(".legend span");
    await expect(legend).toHaveCount(2);
    await expect(c.locator(".legend")).not.toContainText("Kitchen");
    await expect(c.locator(".secondary .sep")).toHaveCount(1);
    const bedroom = await legend
      .nth(1)
      .locator("i")
      .evaluate((e) => e.style.getPropertyValue("--c"));
    await setState(page, "light.kitchen", "on");
    await expect(legend).toHaveCount(3);
    await expect(legend.nth(1)).toContainText("Kitchen");
    // the bedroom keeps its colour whether the kitchen is drawn or not
    expect(
      await legend
        .nth(2)
        .locator("i")
        .evaluate((e) => e.style.getPropertyValue("--c")),
    ).toBe(bedroom);
    await expect(c.locator(".secondary .sep")).toHaveCount(2);
  });

  test("shows the header and an empty plot when every series is hidden", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await mount(page, {
      type: M,
      title: "Kitchen",
      entities: [{ entity: "sensor.kitchen_temperature", visibility: kitchenOn }],
    });
    const c = card(page);
    await expect(c.locator(".primary")).toHaveText("Kitchen");
    await expect(c.locator(".legend")).toBeHidden();
    await setState(page, "light.kitchen", "on");
    await expect(c.locator(".secondary")).not.toBeEmpty();
    expect(errors).toEqual([]);
  });
});

test.describe("hide_consumers_below", () => {
  test("hides an idle consumer, without blinking around the threshold", async ({ page }) => {
    await mount(page, {
      type: "custom:power-flow-card-pro",
      home: "sensor.power_consumption",
      sources: [{ type: "grid", power: "sensor.grid_power" }],
      hide_consumers_below: 10,
      consumers: [
        { entity: "sensor.heat_pump_power", name: "Heat pump" },
        { entity: "sensor.washer_power", name: "Washer" },
      ],
    });
    const set = async (washer: string) => {
      for (const [id, s] of Object.entries({
        "sensor.grid_power": "500",
        "sensor.power_consumption": "500",
        "sensor.heat_pump_power": "400",
        "sensor.washer_power": washer,
      }))
        await setState(page, id, s);
    };
    const washer = card(page).locator('.pnode[data-node="c1"]');
    const other = card(page).locator('.plabel[data-node="other"]');
    await set("3");
    await expect(washer).toBeHidden();
    await expect(other).toHaveText(/^100 W/);
    // above the threshold, not clearly: stays hidden
    await set("11");
    await expect(washer).toBeHidden();
    await set("12");
    await expect(washer).toBeVisible();
    await expect(other).toHaveText(/^88 W/);
    // back under the threshold, not under 10: stays shown
    await set("10.5");
    await expect(washer).toBeVisible();
    await set("9");
    await expect(washer).toBeHidden();
  });
});
