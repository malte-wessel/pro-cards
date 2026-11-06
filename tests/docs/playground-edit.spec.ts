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
      "- type: custom:rain-card-pro",
      "  entity: sensor.rain_rate_roof",
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
  // (every example has an editor; the deprecated cards have none)
  await openPlayground(page);
  await typeYaml(page, "type: custom:rain-card-pro\nentity: sensor.rain_rate_roof\n");
  await expect(tab(page, "Visual")).toBeDisabled();
  await expect(tab(page, "Visual")).toHaveAttribute("title", /edits tiles, posters, tile groups/);
  await expect(previewCard(page)).toHaveJSProperty("tagName", "RAIN-CARD-PRO");
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

test("lists what the card warns of, and nothing once it is fixed", async ({ page }) => {
  await openPlayground(page);
  // a ring does nothing on the wind's animation: the card draws, and says so
  await typeYaml(
    page,
    "type: custom:poster-card-pro\nentity: sensor.wind_speed\nicon: { ring: true }\n",
  );
  const warnings = page.locator(".pg-warnings");
  await expect(warnings).toContainText("poster-card-pro:");
  await expect(warnings).toContainText("ring");
  await expect(previewCard(page)).toBeAttached();
  await typeYaml(page, "type: custom:poster-card-pro\nentity: sensor.wind_speed\n");
  await expect(warnings).toHaveCount(0);
});

test("marks what the schema does not take, where it is written", async ({ page }) => {
  await openPlayground(page);
  await typeYaml(page, "type: custom:tile-card-pro\nentity: light.living_room\ncolour: red\n");
  // the unknown key underlined on its line, its message in the gutter's mark
  const mark = page.locator(".pg-yaml .cm-lintRange-error");
  await expect(mark).toHaveText("colour: red");
  await page.locator(".pg-yaml .cm-lint-marker-error").hover();
  await expect(page.locator(".cm-tooltip-lint")).toContainText('unknown key "colour"');
  await typeYaml(page, "type: custom:tile-card-pro\nentity: light.living_room\ncolor: red\n");
  await expect(mark).toHaveCount(0);
});

test("offers the keys and values the schema takes", async ({ page }) => {
  await openPlayground(page);
  await typeYaml(page, "type: custom:tile-card-pro\nentity: light.living_room\n");
  await page.keyboard.type("vis", { delay: 30 });
  const options = page.locator(".cm-tooltip-autocomplete li");
  await expect(options.filter({ hasText: "visual" })).toHaveCount(1);
  await options.filter({ hasText: /^visual/ }).click();
  await expectYaml(page, "type: custom:tile-card-pro\nentity: light.living_room\nvisual:");
  // a value, taken by Enter
  await typeYaml(page, "type: custom:tile-card-pro\nentity: light.living_room\nvisual: ");
  await page.keyboard.type("spark", { delay: 30 });
  await expect(options.filter({ hasText: "sparkline" })).toHaveAttribute("aria-selected", "true");
  // (CodeMirror takes no Enter for a moment after its list opens, so a key typed on is not lost)
  await page.waitForTimeout(200);
  await page.keyboard.press("Enter");
  await expectYaml(
    page,
    "type: custom:tile-card-pro\nentity: light.living_room\nvisual: sparkline",
  );
  // an entity: the demo home's
  await typeYaml(page, "type: custom:tile-card-pro\nentity: light.liv");
  await page.keyboard.press("Control+Space");
  await expect(options.filter({ hasText: "light.living_room" })).toHaveCount(1);
});

test("a heading opens in its own form", async ({ page }) => {
  await openPlayground(page);
  const menu = await openMenu(page, "Examples");
  await menu.getByRole("button", { name: "Heading card", exact: true }).click();
  await expect(tab(page, "Visual")).toBeEnabled();
  await tab(page, "Visual").click();
  await field(page, "style").locator("select").selectOption("big");
  await expect.poll(() => yamlText(page)).toContain("style: big");
  await expect(previewCard(page)).toHaveJSProperty("tagName", "HEADING-CARD-PRO");
});

test("a sun azimuth card opens in its own form", async ({ page }) => {
  await openPlayground(page);
  const menu = await openMenu(page, "Examples");
  await menu.getByRole("button", { name: "Sun azimuth card", exact: true }).click();
  await tab(page, "Visual").click();
  await field(page, "view").locator("select").selectOption("dial");
  await expect.poll(() => yamlText(page)).toContain("view: dial");
  await expect(previewCard(page)).toHaveJSProperty("tagName", "SUN-AZIMUTH-CARD-PRO");
});

test("a weather card opens in its own form, its sections in tabs", async ({ page }) => {
  await openPlayground(page);
  const menu = await openMenu(page, "Examples");
  await menu.getByRole("button", { name: "Weather card", exact: true }).click();
  await tab(page, "Visual").click();
  const editor = page.locator(".pg-visual weather-card-pro-editor");
  await expect(editor.locator(".tab")).toHaveText(["1Lead", "2Entities", "3Trend", "4Forecast"]);
  await editor.locator(".tab").nth(3).click();
  const section = editor.locator("weather-card-pro-section-editor ha-form");
  await fill(section.locator('[data-name="days"] input'), "5");
  await expect.poll(() => yamlText(page)).toMatch(/type: forecast[\s\S]*days: 5/);
  await expect(previewCard(page)).toHaveJSProperty("tagName", "WEATHER-CARD-PRO");
});

test("a power flow card opens in its own form, its sources in tabs", async ({ page }) => {
  await openPlayground(page);
  const menu = await openMenu(page, "Examples");
  await menu.getByRole("button", { name: "Power flow card", exact: true }).click();
  await tab(page, "Visual").click();
  const editor = page.locator(".pg-visual power-flow-card-pro-editor");
  await expect(editor.locator(".tab")).toHaveText(["1Solar", "2Battery", "3Grid"]);
  await editor.locator("summary", { hasText: "Drawing" }).first().click();
  await editor.locator('[data-name="flow_style"] select').first().selectOption("arrows");
  // the sources stay where they were written, before the consumers
  await expect
    .poll(() => yamlText(page))
    .toMatch(/sources:[\s\S]*consumers:[\s\S]*flow_style: arrows/);
  await expect(previewCard(page)).toHaveJSProperty("tagName", "POWER-FLOW-CARD-PRO");
});

test("an energy flow card opens in its own form", async ({ page }) => {
  await openPlayground(page);
  const menu = await openMenu(page, "Examples");
  await menu.getByRole("button", { name: "Energy flow card", exact: true }).click();
  await tab(page, "Visual").click();
  await field(page, "period").locator("select").selectOption("week");
  await expect.poll(() => yamlText(page)).toContain("period: week");
  await expect(previewCard(page)).toHaveJSProperty("tagName", "ENERGY-FLOW-CARD-PRO");
});
