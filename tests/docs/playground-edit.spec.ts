// The Playground edits one card: visually, through the card's own editor, or as YAML; the preview
// follows both, and an error is shown without losing the card.
import {
  test,
  expect,
  bar,
  errorLine,
  expectYaml,
  field,
  fill,
  openMenu,
  openPlayground,
  nameField,
  preview,
  previewCard,
  tab,
  typeYaml,
  yamlText,
} from "./util.ts";

test("opens on the first example, edited visually", async ({ page }) => {
  await openPlayground(page);
  await expect(nameField(page)).toHaveValue("Tile Card Pro");
  await expect(tab(page, "Visual")).toHaveAttribute("aria-selected", "true");
  await expect(field(page, "entity")).toBeVisible();
  await expect(previewCard(page).locator(".primary")).toHaveText("Living room");
  await expectYaml(page, "type: custom:tile-card-pro\nentity: light.living_room");
});

test("loads an example from the menu: its name, YAML and preview", async ({ page }) => {
  await openPlayground(page);
  const menu = await openMenu(page, "Examples");
  // grouped by card family
  await expect(menu.locator(".pg-group-title")).toContainText([
    "Tiles & Poster",
    "Layout",
    "Energy",
    "Weather",
    "Entities",
  ]);
  await menu.getByRole("button", { name: "Poster Card Pro", exact: true }).click();
  await expect(menu).toBeHidden();
  await expect(nameField(page)).toHaveValue("Poster Card Pro");
  await expect(previewCard(page)).toHaveJSProperty("tagName", "POSTER-CARD-PRO");
  await expectYaml(page, /^type: custom:poster-card-pro\nentity: sensor\.wind_speed\nname: Wind/);
});

test("the menus close on Escape and on a click outside", async ({ page }) => {
  await openPlayground(page);
  const menu = await openMenu(page, "Examples");
  // the first item takes the focus, the arrows move it, round at the ends
  const items = menu.locator("button");
  await expect(items.first()).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(items.nth(1)).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await expect(items.last()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(bar(page).getByRole("button", { name: "Examples" })).toBeFocused();
  await openMenu(page, "Examples");
  await preview(page).click({ position: { x: 5, y: 5 } });
  await expect(page.locator(".menu > .panel")).toBeHidden();
});

test("a visual edit writes the YAML and redraws the preview", async ({ page }) => {
  await openPlayground(page);
  await fill(field(page, "name").locator("input"), "Sofa light");
  await expect(previewCard(page).locator(".primary")).toHaveText("Sofa light");
  await expectYaml(page, "type: custom:tile-card-pro\nentity: light.living_room\nname: Sofa light");
  // and back in the form, as written
  await tab(page, "Visual").click();
  await expect(field(page, "name").locator("input")).toHaveValue("Sofa light");
});

test("typed YAML redraws the preview and refills the form", async ({ page }) => {
  await openPlayground(page);
  await typeYaml(page, "type: custom:tile-card-pro\nentity: light.kitchen\nname: Worktop\n");
  await expect(previewCard(page).locator(".primary")).toHaveText("Worktop");
  await tab(page, "Visual").click();
  await expect(field(page, "name").locator("input")).toHaveValue("Worktop");
  // another card type: its own editor
  await typeYaml(page, "type: custom:poster-card-pro\nentity: sensor.wind_speed\n");
  await expect(previewCard(page)).toHaveJSProperty("tagName", "POSTER-CARD-PRO");
  await tab(page, "Visual").click();
  await expect(page.locator(".pg-visual poster-card-pro-editor")).toBeAttached();
  await expect(page.locator(".pg-visual tile-card-pro-editor")).toHaveCount(0);
});

test("a YAML error is shown on its line, and the preview keeps the last card", async ({ page }) => {
  await openPlayground(page);
  await typeYaml(page, "type: custom:tile-card-pro\nentity: light.kitchen\nname: [oops\n");
  await expect(errorLine(page)).toContainText(/^Line \d+:/);
  // CodeMirror marks it
  await expect(page.locator(".pg-yaml .cm-lint-marker-error")).toHaveCount(1);
  // the preview still shows the card that parsed last
  await expect(previewCard(page).locator(".primary")).toHaveText("Living room");
  // fixed: the error goes, the preview follows
  await typeYaml(page, "type: custom:tile-card-pro\nentity: light.kitchen\n");
  await expect(errorLine(page)).toBeHidden();
  await expect(page.locator(".pg-yaml .cm-lint-marker-error")).toHaveCount(0);
  await expect(previewCard(page).locator(".primary")).toHaveText("Kitchen");
});

test("a card's config error is shown, and goes when it is fixed", async ({ page }) => {
  await openPlayground(page);
  await typeYaml(page, "type: custom:no-such-card-pro\n");
  await expect(errorLine(page)).toContainText(/^Error:.*unknown card type/);
  await expect(preview(page).locator(".error")).toContainText("unknown card type");
  await typeYaml(page, "type: custom:tile-card-pro\nentity: light.kitchen\n");
  await expect(errorLine(page)).toBeHidden();
  await expect(previewCard(page).locator(".primary")).toHaveText("Kitchen");
});

test("an empty YAML asks for a card", async ({ page }) => {
  await openPlayground(page);
  await typeYaml(page, "");
  await expect(preview(page).locator(".error")).toContainText("No card yet");
  await expect(tab(page, "Visual")).toBeDisabled();
});

test("several cards: a picker chooses the one the form edits", async ({ page }) => {
  await openPlayground(page);
  await typeYaml(
    page,
    [
      "- type: custom:tile-card-pro",
      "  entity: light.kitchen",
      "- type: custom:heading-card-pro",
      "  title: Not edited",
      "- type: custom:poster-card-pro",
      "  entity: sensor.wind_speed",
      "",
    ].join("\n"),
  );
  await expect(preview(page).locator(".ha-grid > .cell")).toHaveCount(3);
  await tab(page, "Visual").click();
  const picker = page.getByTitle("The card to edit");
  // only the cards the visual editor edits
  await expect(picker.locator("option")).toHaveText([
    "1: Tile · light.kitchen",
    "3: Poster · sensor.wind_speed",
  ]);
  await expect(page.locator(".pg-visual tile-card-pro-editor")).toBeAttached();
  await picker.selectOption({ label: "3: Poster · sensor.wind_speed" });
  await expect(page.locator(".pg-visual poster-card-pro-editor")).toBeAttached();
  // an edit lands on the picked card, the list stays a list
  await fill(field(page, "name").locator("input"), "Gusts");
  await expect.poll(() => yamlText(page)).toContain("  name: Gusts");
  const text = await yamlText(page);
  expect(text.startsWith("- type: custom:tile-card-pro")).toBe(true);
  expect(text.indexOf("name: Gusts")).toBeGreaterThan(text.indexOf("custom:poster-card-pro"));
});

test("a card the visual editor does not edit opens in YAML", async ({ page }) => {
  await openPlayground(page);
  const menu = await openMenu(page, "Examples");
  await menu.getByRole("button", { name: "Power flow card", exact: true }).click();
  await expect(tab(page, "YAML")).toHaveAttribute("aria-selected", "true");
  await expect(tab(page, "Visual")).toBeDisabled();
  await expect(tab(page, "Visual")).toHaveAttribute("title", /edits tiles, posters, layout/);
  await expect(previewCard(page)).toHaveJSProperty("tagName", "POWER-FLOW-CARD-PRO");
  // an editable card again: Visual comes back
  await openMenu(page, "Examples").then((m) =>
    m.getByRole("button", { name: "Tile Card Pro", exact: true }).click(),
  );
  await expect(tab(page, "Visual")).toBeEnabled();
});

test("the layout card's editor edits the cards inside it", async ({ page }) => {
  await openPlayground(page);
  const menu = await openMenu(page, "Examples");
  await menu.getByRole("button", { name: "Layout Card Pro", exact: true }).click();
  await tab(page, "Visual").click();
  const editor = page.locator(".pg-visual layout-card-pro-editor");
  await expect(editor.locator(".tab")).toHaveCount(3);
  await editor.locator(".tab").nth(2).click();
  const child = editor.locator("hui-card-element-editor tile-card-pro-editor ha-form").first();
  await fill(child.locator('[data-name="name"] input'), "Worktop");
  await expect
    .poll(() => yamlText(page))
    .toMatch(/- type: custom:tile-card-pro\n(?: {4}.*\n)* {4}name: Worktop/);
  await expect(previewCard(page)).toContainText("Worktop");
});
