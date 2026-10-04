import { test, expect, mount, events, card } from "./util.ts";
import type { EntitySectionsCard } from "../../src/entity-sections-card.ts";

const T = "custom:entity-sections-card-pro";

test.describe("sections", () => {
  test("stack several layouts in one card with flat entity indices", async ({ page }) => {
    await mount(page, {
      type: T,
      title: "Living room",
      sections: [
        {
          layout: "table",
          entities: [
            { entity: "sensor.living_room_temperature", name: "Temperature" },
            { entity: "sensor.living_room_humidity", name: "Humidity" },
          ],
        },
        { layout: "row", entities: ["light.living_room", "media_player.living_room_tv"] },
        { layout: "column", divider: true, entities: ["cover.living_room_blinds"] },
        {
          layout: "hero",
          entities: [
            "sensor.living_room_co2",
            { entity: "vacuum.robot", visual: "badge" },
            "sensor.robot_battery",
          ],
        },
        { entities: ["light.office"] },
      ],
    });
    const c = card(page);
    await expect(c.locator("ha-card")).toHaveClass(/layout-sections/);
    await expect(c.locator(".body > .section")).toHaveCount(5);
    await expect(c.locator(".body > .divider")).toHaveCount(1);
    await expect(c.locator(".section.layout-table .row.field")).toHaveCount(2);
    await expect(c.locator(".section.layout-row .row.item")).toHaveCount(2);
    const col = c.locator(".section.layout-column .row.item");
    await expect(col).toHaveAttribute("data-idx", "4");
    await col.click();
    expect(await events(page)).toEqual([
      { type: "more-info", entityId: "cover.living_room_blinds" },
    ]);
    const hero = c.locator(".section.layout-hero");
    await expect(hero.locator(".row.hero .big b")).toHaveText(/^\d+$/);
    await expect(hero.locator(".row.list")).toHaveCount(2);
    await expect(hero.locator(".row.list .pill")).toHaveCount(1);
    await expect(c.locator(".section.layout-list .row.list")).toHaveCount(1);
  });
  test("cascade card defaults into sections and show header entities", async ({ page }) => {
    await mount(page, {
      type: T,
      title: "Kitchen",
      show_name: false,
      align: "end",
      header_entities: [{ entity: "sensor.kitchen_temperature", decimals: 1 }],
      sections: [
        {
          layout: "row",
          entities: ["light.kitchen", { entity: "light.dining_table", show_name: true }],
        },
        { layout: "row", align: "start", entities: ["switch.coffee_machine"] },
      ],
    });
    const c = card(page);
    await expect(c.locator(".header .hvals .row.hval .state")).toHaveText(/°C$/);
    const rows = c.locator(".section.layout-row");
    await expect(rows.nth(0)).toHaveClass(/align-end/);
    await expect(rows.nth(1)).toHaveClass(/align-start/);
    await expect(rows.nth(0).locator(".row.item").nth(0).locator(".iname")).toHaveCount(0);
    await expect(rows.nth(0).locator(".row.item").nth(1).locator(".iname")).toHaveText(
      "Dining table",
    );
  });
});

test.describe("config errors", () => {
  test("setConfig rejects bad configs with a readable message", async ({ page }) => {
    await mount(page, { type: T, sections: [{ entities: ["light.kitchen"] }] });
    const msgs = await page.evaluate(() => {
      const el = document.createElement("entity-sections-card-pro") as EntitySectionsCard;
      const tryCfg = (c: unknown) => {
        try {
          el.setConfig(c);
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      };
      return [
        tryCfg({ title: "x" }),
        tryCfg({ sections: [{ layout: "row" }] }),
        tryCfg({ sections: [{ layout: "tile", entities: ["light.a"] }] }),
      ];
    });
    expect(msgs[0]).toMatch(/entity-sections-card-pro: 'sections' must be a non-empty list/);
    expect(msgs[1]).toMatch(/'sections\[0\].entities' must be a non-empty list/);
    expect(msgs[2]).toMatch(/sections\[0\].layout must be one of/);
  });
});
