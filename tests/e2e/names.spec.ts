// A name as Home Assistant composes it (`name: [{ type: area }, { type: entity }]`) in a browser:
// drawn by its formatEntityName on a tile, a poster, a tile group's tile, a badge and a button,
// drawn again when an area is renamed, and written by the editor's name picker. The demo home's
// stand-in composes it from its registries: sensor.dishwasher_finishes is "Finishes" on the
// Dishwasher in the Kitchen, on the Ground floor.
import { test, expect, mount, card } from "./util.ts";

const E = "sensor.dishwasher_finishes";
const AREA_ENTITY = [{ type: "area" }, { type: "entity" }];

test.describe("names of parts", () => {
  test("are drawn on every card that names an entity", async ({ page }) => {
    await mount(page, [
      { type: "custom:tile-card-pro", entity: E, name: AREA_ENTITY },
      { type: "custom:poster-card-pro", entity: E, name: { type: "entity" } },
      {
        type: "custom:tile-group-card-pro",
        tiles: [{ entity: E, name: [{ type: "floor" }, { type: "device" }] }],
      },
      {
        type: "custom:tile-card-pro",
        entity: "light.kitchen",
        badges: [{ entity: E, show_name: true, name: [{ type: "entity" }] }],
        control: {
          type: "buttons",
          options: [{ entity: E, show_name: true, name: [{ type: "device" }] }],
        },
      },
    ]);
    await expect(card(page, 0).locator(".primary")).toHaveText("Kitchen Finishes");
    await expect(card(page, 1).locator(".pname")).toHaveText("Finishes");
    await expect(card(page, 2).locator("tile-card-pro .primary")).toHaveText(
      "Ground floor Dishwasher",
    );
    await expect(card(page, 3).locator(".hval")).toContainText("Finishes");
    await expect(card(page, 3).locator(".ctl-buttons")).toContainText("Dishwasher");
  });

  test("are drawn again when an area is renamed", async ({ page }) => {
    await mount(page, { type: "custom:tile-card-pro", entity: E, name: AREA_ENTITY });
    const name = card(page).locator(".primary");
    await expect(name).toHaveText("Kitchen Finishes");
    // Home Assistant hands the cards a new area registry, and a formatter that reads it
    await card(page).evaluate((el) => {
      type Hass = {
        areas: Record<string, { name: string }>;
        formatEntityName(st: unknown, name: unknown): string;
      };
      const c = el as HTMLElement & { _hass: Hass; hass: Hass };
      const hass = c._hass;
      c.hass = {
        ...hass,
        areas: { ...hass.areas, kitchen: { ...hass.areas.kitchen, name: "Cuisine" } },
        formatEntityName: (st, name) =>
          hass.formatEntityName(st, name).replace("Kitchen", "Cuisine"),
      };
    });
    await expect(name).toHaveText("Cuisine Finishes");
  });

  test("are written by the editor's name picker", async ({ page }) => {
    await mount(page, { type: "custom:tile-card-pro", entity: "light.kitchen" });
    await page.evaluate((entity) => {
      type Editor = HTMLElement & { setConfig(c: unknown): void; hass: unknown };
      const w = window as unknown as { sent: unknown[] };
      const Card = customElements.get("tile-card-pro") as unknown as {
        getConfigElement(): Editor;
      };
      const ed = Card.getConfigElement();
      ed.setConfig({ type: "custom:tile-card-pro", entity });
      ed.hass = window.pc.snapshot();
      w.sent = [];
      ed.addEventListener("config-changed", (e) => w.sent.push((e as CustomEvent).detail.config));
      document.body.appendChild(ed);
    }, E);
    const field = page.locator('tile-card-pro-editor [data-name="name"]').first();
    await field.locator("select").selectOption("area-entity");
    const sent = await page.evaluate(
      () => (window as unknown as { sent: { name?: unknown }[] }).sent.at(-1)?.name,
    );
    expect(sent).toEqual(AREA_ENTITY);
  });
});
