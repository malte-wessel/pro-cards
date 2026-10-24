import { test, expect, mount, card } from "./util";
import type { Locator, Page } from "@playwright/test";

const T = "custom:entity-card-pro";
const G = "custom:entity-group-card-pro";

// a computed style of an element or of its ::before / ::after
const css = (loc: Locator, prop: string, pseudo: string | null = null) =>
  loc.evaluate((e, [p, ps]) => getComputedStyle(e, ps).getPropertyValue(p as string), [
    prop,
    pseudo,
  ] as const);
// the alpha of a computed colour: rgba(…, a) or color(srgb … / a)
const alpha = async (loc: Locator) => {
  const c = await css(loc, "background-color");
  const m = c.match(/\/\s*([\d.]+)\)$/) || c.match(/,\s*([\d.]+)\)$/);
  return m ? Number(m[1]) : 1;
};
// move the pointer onto the element's centre without Playwright's actionability checks (a row's
// hit layer sits behind its content, which lets the pointer through)
const point = async (page: Page, loc: Locator, dx = 0.5) => {
  const b = await loc.boundingBox();
  if (!b) throw new Error("not visible");
  await page.mouse.move(b.x + b.width * dx, b.y + b.height / 2);
};
const away = (page: Page) => page.mouse.move(1, 1);
// --primary-text-color as a computed colour inside the element's shadow tree
const textColour = (loc: Locator) =>
  loc.evaluate((e) => {
    const probe = document.createElement("i");
    probe.style.color = "var(--primary-text-color)";
    e.parentElement?.appendChild(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  });

test.describe("hover", () => {
  test("is off unless set: no class, no layer, no reaction", async ({ page }) => {
    await mount(page, { type: T, entity: "light.kitchen", control: "toggle" });
    const row = card(page).locator(".row");
    await expect(row).not.toHaveClass(/hover-fx/);
    await point(page, row.locator("> .hit"), 0.3);
    expect(await css(row.locator("> .hit"), "content", "::before")).toBe("none");
    await point(page, card(page).locator(".toggle"));
    expect(await css(card(page).locator(".toggle"), "content", "::after")).toBe("none");
  });

  test("a tile is one button: the layer fills the card, also a taller one, stronger while pressed", async ({
    page,
  }) => {
    await mount(page, [
      { type: T, entity: "light.kitchen", hover: true, grid_options: { columns: 6 } },
      { type: T, entity: "light.hallway", hover: true, grid_options: { columns: 6, rows: 3 } },
      { type: "custom:wind-card-pro", entity: "sensor.wind_speed", hover: true },
    ]);
    for (const i of [0, 1, 2]) {
      const c = card(page, i);
      const hit = c.locator(".row.hover-fx > .hit");
      // the click area is the card inside its border: no gap above, below or at the sides
      const [h, k] = [await hit.boundingBox(), await c.locator("ha-card").boundingBox()];
      if (!h || !k) throw new Error("not visible");
      const border = Number.parseFloat(await css(c.locator("ha-card"), "border-top-width"));
      for (const [a, b] of [
        [h.x, k.x + border],
        [h.y, k.y + border],
        [h.width, k.width - 2 * border],
        [h.height, k.height - 2 * border],
      ])
        expect(Math.abs(a - b), `card ${i}`).toBeLessThan(1);
      expect(await css(hit, "opacity", "::before")).toBe("0");
      // the tile's padding, outside its row, is part of the button: its left and bottom edge
      for (const [x, y] of [
        [k.x + 4, k.y + k.height / 2],
        [k.x + k.width / 2, k.y + k.height - 4],
      ]) {
        await away(page);
        await page.mouse.move(x, y);
        expect(await css(hit, "opacity", "::before"), `card ${i} at ${x},${y}`).toBe("0.04");
      }
      await page.mouse.down();
      expect(await css(hit, "opacity", "::before"), `card ${i}`).toBe("0.12");
      await away(page);
      await page.mouse.up();
      expect(await css(hit, "opacity", "::before")).toBe("0");
    }
  });

  test("list rows, heroes and table fields keep still; cells and header entities answer", async ({
    page,
  }) => {
    await mount(page, [
      {
        type: G,
        hover: true,
        header_entities: ["sensor.outdoor_temperature"],
        entities: ["sensor.living_room_temperature", "sensor.living_room_humidity"],
      },
      { type: G, hover: true, layout: "hero", entities: ["sensor.outdoor_temperature"] },
      { type: G, hover: true, layout: "table", entities: ["sensor.outdoor_humidity"] },
      { type: G, hover: true, layout: "grid", entities: ["sensor.outdoor_humidity"] },
      {
        type: "custom:power-flow-card-pro",
        hover: true,
        home: "sensor.power_consumption",
        sources: [{ type: "solar", entity: "sensor.solar_power" }],
        consumer_style: "list",
        consumers: [{ entity: "sensor.washer_power" }],
      },
      { type: "custom:wind-card-pro", entity: "sensor.wind_speed", layout: "hero", hover: true },
    ]);
    for (const [i, sel] of [
      [0, ".row.list"],
      [1, ".row.hero"],
      [2, ".row.field"],
      [4, ".row.plist"],
      [5, ".row.whero"],
    ] as const)
      expect(await css(card(page, i).locator(`${sel} > .hit`).first(), "content", "::before")).toBe(
        "none",
      );
    const cell = card(page, 3).locator(".row.cell > .hit");
    await point(page, cell, 0.7);
    expect(await css(cell, "opacity", "::before")).toBe("0.04");
    const head = card(page, 0).locator(".row.hval > .hit");
    await point(page, head);
    expect(await css(head, "opacity", "::before")).toBe("0.04");
  });

  test("an icon with its own action brightens by the theme's hover opacity and grows when pressed", async ({
    page,
  }) => {
    await mount(page, {
      type: T,
      entity: "light.hallway",
      control: "toggle",
      control_position: "lead",
      hover: true,
    });
    const lead = card(page).locator(".lead.tap");
    const shape = lead.locator(".shape");
    const rest = await alpha(shape);
    await point(page, lead);
    // HA's tile icon: --tile-icon-opacity (0.2) gives way to --tile-icon-hover-opacity (0.35)
    await expect.poll(async () => (await alpha(shape)) / rest).toBeCloseTo(1.75, 2);
    await card(page).evaluate((el) =>
      (el as HTMLElement).style.setProperty("--tile-icon-hover-opacity", "0.5"),
    );
    await expect.poll(async () => (await alpha(shape)) / rest).toBeCloseTo(2.5, 2);
    await page.mouse.down();
    await expect.poll(() => css(shape, "transform")).toBe("matrix(1.2, 0, 0, 1.2, 0, 0)");
    await page.mouse.up();
  });

  test("controls take a layer over their own colour, the slider a halo; the row gives way", async ({
    page,
  }) => {
    await mount(page, [
      { type: T, entity: "light.kitchen", control: "toggle", hover: true },
      {
        type: G,
        hover: true,
        entities: [
          { entity: "cover.living_room_blinds", control: "buttons" },
          { entity: "light.living_room", control: "slider" },
          { entity: "input_select.house_mode", control: "select" },
        ],
      },
    ]);
    const toggle = card(page, 0).locator(".toggle");
    await point(page, toggle);
    await expect.poll(() => css(toggle, "opacity", "::after")).toBe("0.08");
    // over the control the tile's own layer stays off
    expect(await css(card(page, 0).locator(".row > .hit"), "opacity", "::before")).toBe("0");
    await page.mouse.down();
    await expect.poll(() => css(toggle, "opacity", "::after")).toBe("0.12");
    await away(page);
    await page.mouse.up();
    for (const sel of [".ctl-buttons > button.round", ".ctl-select"]) {
      const el = card(page, 1).locator(sel).first();
      await point(page, el);
      await expect.poll(() => css(el, "opacity", "::after"), sel).toBe("0.08");
    }
    const slider = card(page, 1).locator(".ctl-slider");
    await point(page, slider, 0.2);
    await expect.poll(() => css(slider.locator(".knob"), "box-shadow")).toMatch(/0px 0px 0px 6px/);
  });

  test("the switch and the select take their layer in the text colour", async ({ page }) => {
    // dark: the theme's text is light, the browser's default button text is not
    await mount(
      page,
      {
        type: G,
        hover: true,
        entities: [
          { entity: "light.kitchen", control: "toggle" },
          { entity: "input_select.house_mode", control: "select" },
        ],
      },
      { theme: "dark" },
    );
    for (const sel of [".toggle", ".ctl-select"]) {
      const el = card(page).locator(sel);
      expect(await css(el, "background-color", "::after"), sel).toBe(await textColour(el));
    }
  });

  test("reduced motion: nothing grows, nothing fades", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mount(page, [
      {
        type: T,
        entity: "light.hallway",
        control: "toggle",
        control_position: "lead",
        hover: true,
      },
      {
        type: G,
        hover: true,
        layout: "row",
        entities: [{ entity: "light.kitchen", tap_action: "toggle" }],
      },
      {
        type: G,
        hover: true,
        entities: [
          { entity: "light.living_room", control: "slider" },
          { entity: "light.kitchen", control: "toggle" },
        ],
      },
      {
        type: "custom:power-flow-card-pro",
        hover: true,
        home: "sensor.power_consumption",
        sources: [{ type: "solar", entity: "sensor.solar_power" }],
      },
    ]);
    const lead = card(page, 0).locator(".lead.tap");
    await point(page, lead);
    await page.mouse.down();
    expect(await css(lead.locator(".shape"), "transform")).toBe("none");
    await away(page);
    await page.mouse.up();
    for (const [i, sel] of [
      [0, ".lead.tap .shape"],
      [1, ".row.item .lead .shape"],
      [2, ".ctl-slider .knob"],
      [3, ".pnode .lead .shape"],
    ] as const)
      expect(await css(card(page, i).locator(sel).first(), "transition-duration"), sel).toBe("0s");
    expect(await css(card(page, 2).locator(".toggle"), "transition-duration", "::after")).toBe(
      "0s",
    );
  });

  test("an entity's own hover wins over the card's and the section's", async ({ page }) => {
    await mount(page, [
      {
        type: G,
        hover: true,
        entities: ["light.kitchen", { entity: "light.hallway", hover: false }],
      },
      {
        type: "custom:entity-sections-card-pro",
        sections: [
          { entities: ["light.office", { entity: "light.desk_lamp", hover: true }] },
          { hover: true, entities: ["light.bedroom"] },
        ],
      },
    ]);
    const has = (i: number) =>
      card(page, i)
        .locator(".body .row")
        .evaluateAll((rows) => rows.map((r) => r.classList.contains("hover-fx")));
    expect(await has(0)).toEqual([true, false]);
    expect(await has(1)).toEqual([false, true, true]);
  });
});

test.describe("hover on a touch screen", () => {
  test.use({ hasTouch: true, isMobile: true });

  test("shows the press only, never a hover left behind", async ({ page }) => {
    await mount(page, { type: T, entity: "light.kitchen", hover: true });
    expect(await page.evaluate(() => matchMedia("(hover: hover)").matches)).toBe(false);
    const hit = card(page).locator(".row > .hit");
    await point(page, hit, 0.6);
    expect(await css(hit, "opacity", "::before")).toBe("0");
    await page.mouse.down();
    expect(await css(hit, "opacity", "::before")).toBe("0.12");
    await page.mouse.up();
  });
});
