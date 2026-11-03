// The cards' visual editors in the browser, with the docs' stand-ins for Home Assistant's form, card
// editor and card picker (the harness defines them as the docs do)
import { test, expect, mount } from "./util.ts";

type Editor = HTMLElement & { setConfig(c: unknown): void; hass: unknown };

// an editor element of a card type, configured, on the page; what it sends is in window.sent
const openEditor = (type: string, config: Record<string, unknown>) => ({ type, config }) as const;

test("the tile's editor writes the visual it is given", async ({ page }) => {
  await mount(page, { type: "custom:tile-card-pro", entity: "light.living_room" });
  await page.evaluate(
    ({ type, config }) => {
      const Card = customElements.get(type) as unknown as { getConfigElement(): Editor };
      const ed = Card.getConfigElement();
      ed.setConfig(config);
      ed.hass = window.pc.snapshot();
      (window as unknown as { sent: unknown[] }).sent = [];
      ed.addEventListener("config-changed", (e) =>
        (window as unknown as { sent: unknown[] }).sent.push((e as CustomEvent).detail.config),
      );
      document.body.appendChild(ed);
    },
    openEditor("tile-card-pro", { type: "custom:tile-card-pro", entity: "light.living_room" }),
  );
  const form = page.locator("tile-card-pro-editor ha-form").first();
  await form.locator("summary", { hasText: "Icon and visual" }).click();
  await form.locator('[data-name="visual_thing"] select').selectOption("sparkline");
  const last = () => page.evaluate(() => (window as unknown as { sent: unknown[] }).sent.at(-1));
  await expect.poll(last).toEqual({
    type: "custom:tile-card-pro",
    entity: "light.living_room",
    visual: "sparkline",
  });
  // the history's options show for the line, and write it as a thing with options
  await form.locator('[data-name="visual_hours"] input').fill("6");
  await form.locator('[data-name="visual_hours"] input').press("Tab");
  await expect.poll(last).toMatchObject({ visual: { type: "sparkline", hours: 6 } });
});

test("the layout's editor edits a card through that card's own editor", async ({ page }) => {
  const tile = { type: "custom:tile-card-pro", entity: "light.kitchen" };
  await mount(page, tile);
  await page.evaluate(
    ({ type, config }) => {
      const Card = customElements.get(type) as unknown as { getConfigElement(): Editor };
      const ed = Card.getConfigElement();
      ed.setConfig(config);
      ed.hass = window.pc.snapshot();
      (window as unknown as { sent: unknown[] }).sent = [];
      ed.addEventListener("config-changed", (e) =>
        (window as unknown as { sent: unknown[] }).sent.push((e as CustomEvent).detail.config),
      );
      document.body.appendChild(ed);
    },
    openEditor("layout-card-pro", { type: "custom:layout-card-pro", cards: [tile] }),
  );
  const child = page
    .locator("layout-card-pro-editor hui-card-element-editor tile-card-pro-editor ha-form")
    .first();
  await child.locator('[data-name="name"] input').fill("Worktop");
  await child.locator('[data-name="name"] input').press("Tab");
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { sent: unknown[] }).sent.at(-1)))
    .toEqual({ type: "custom:layout-card-pro", cards: [{ ...tile, name: "Worktop" }] });
});
