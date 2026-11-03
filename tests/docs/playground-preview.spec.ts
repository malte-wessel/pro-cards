// The Playground's preview: a section at a width you pick, the card's grid size, the theme, the
// states of what the card names; and the splitter between the panes.
import {
  test,
  expect,
  expectYaml,
  openMenu,
  openPlayground,
  preview,
  previewCard,
  typeYaml,
} from "./util.ts";

const section = (page: import("@playwright/test").Page) => preview(page).locator(".section");
const widthOf = (page: import("@playwright/test").Page) =>
  section(page).evaluate((el) => Math.round(el.getBoundingClientRect().width));

test("the width presets size the section and set its view columns", async ({ page }) => {
  await openPlayground(page);
  const widths = page.getByRole("group", { name: "Width" });
  await expect(widths.getByRole("button")).toHaveText([
    "Phone",
    "1 section",
    "2 sections",
    "3 sections",
    "Full",
  ]);
  // one section by default
  await expect(widths.getByRole("button", { name: "1 section" })).toHaveClass(/on/);
  expect(await widthOf(page)).toBe(400);
  await expect(section(page)).toHaveCSS("--column-span", "1");

  await widths.getByRole("button", { name: "Phone" }).click();
  expect(await widthOf(page)).toBe(360);
  await widths.getByRole("button", { name: "2 sections" }).click();
  await expect(section(page)).toHaveCSS("--column-span", "2");
  await expect(section(page)).toHaveAttribute("style", /width: 824px/);
  await widths.getByRole("button", { name: "Full" }).click();
  await expect(section(page)).toHaveCSS("--column-span", "4");
  // the whole pane, less the stage's padding
  const stage = await preview(page).evaluate((el) => el.clientWidth);
  expect(await widthOf(page)).toBe(stage - 48);

  // remembered in this browser
  await page.reload();
  await expect(
    page.getByRole("group", { name: "Width" }).getByRole("button", { name: "Full" }),
  ).toHaveClass(/on/);
});

test("a layout card follows the view columns of the width", async ({ page }) => {
  await openPlayground(page);
  await typeYaml(
    page,
    [
      "type: custom:layout-card-pro",
      "columns: 1",
      "breakpoints: { 2: { columns: 2 } }",
      "cards:",
      "  - { type: custom:tile-card-pro, entity: light.kitchen }",
      "  - { type: custom:tile-card-pro, entity: light.attic }",
      "",
    ].join("\n"),
  );
  const tiles = previewCard(page).locator("tile-card-pro");
  await expect(tiles).toHaveCount(2);
  const tops = () =>
    tiles.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
  // one column: one under the other
  await expect.poll(async () => new Set(await tops()).size).toBe(2);
  await page
    .getByRole("group", { name: "Width" })
    .getByRole("button", { name: "2 sections" })
    .click();
  // two view columns: side by side
  await expect.poll(async () => new Set(await tops()).size).toBe(1);
});

test("Columns and Rows write the card's grid_options", async ({ page }) => {
  await openPlayground(page);
  const columns = page.locator(".pv-bar label.field", { hasText: "Columns" }).locator("select");
  const rows = page.locator(".pv-bar label.field", { hasText: "Rows" }).locator("select");
  await expect(columns).toHaveValue("");
  await columns.selectOption("6");
  await expectYaml(
    page,
    "type: custom:tile-card-pro\nentity: light.living_room\ngrid_options:\n  columns: 6",
  );
  // the cell takes six of the twelve columns
  await expect(preview(page).locator(".ha-grid > .cell").first()).toHaveAttribute("data-cols", "6");
  await rows.selectOption("auto");
  await expectYaml(page, /grid_options:\n {2}columns: 6\n {2}rows: auto$/);
  await rows.selectOption("2");
  await expectYaml(page, /grid_options:\n {2}columns: 6\n {2}rows: 2$/);
  await expect(preview(page).locator(".ha-grid > .cell").first()).toHaveClass(/fixed/);
  // back to the defaults: no grid_options left
  await columns.selectOption("");
  await rows.selectOption("");
  await expectYaml(page, "type: custom:tile-card-pro\nentity: light.living_room");
  // the YAML's own grid_options show in the selects
  await typeYaml(
    page,
    "type: custom:tile-card-pro\nentity: light.kitchen\ngrid_options: { columns: 12, rows: 1 }\n",
  );
  await expect(columns).toHaveValue("12");
  await expect(rows).toHaveValue("1");
});

test("the grid size goes to the picked card of several", async ({ page }) => {
  await openPlayground(page);
  await typeYaml(
    page,
    "- type: custom:tile-card-pro\n  entity: light.kitchen\n- type: custom:tile-card-pro\n  entity: light.attic\n",
  );
  await page.getByRole("tab", { name: "Visual" }).click();
  await page.getByTitle("The card to edit").selectOption({ index: 1 });
  await page
    .locator(".pv-bar label.field", { hasText: "Columns" })
    .locator("select")
    .selectOption("4");
  await expectYaml(
    page,
    [
      "- type: custom:tile-card-pro",
      "  entity: light.kitchen",
      "- type: custom:tile-card-pro",
      "  entity: light.attic",
      "  grid_options:",
      "    columns: 4",
    ].join("\n"),
  );
});

test("the mode and the Home Assistant theme", async ({ page }) => {
  await openPlayground(page);
  const mode = preview(page).locator("..").getByRole("button", { name: "Auto" });
  await expect(mode).toBeVisible();
  await mode.click();
  await expect(preview(page)).toHaveClass(/\blight\b/);
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await expect(preview(page)).toHaveClass(/\bdark\b/);
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(preview(page)).not.toHaveClass(/\b(light|dark)\b/);

  await page.getByTitle("Home Assistant theme").selectOption({ label: "Graphite" });
  await expect(preview(page)).toHaveAttribute("data-theme", "graphite");
  // the theme is the site's, kept for every example
  await page.reload();
  await expect(preview(page)).toHaveAttribute("data-theme", "graphite");
});

test("the grid guides can be hidden", async ({ page }) => {
  await openPlayground(page);
  await expect(section(page)).toHaveClass(/guides/);
  await page.locator(".pv-bar").getByRole("checkbox", { name: "Grid" }).uncheck();
  await expect(section(page)).not.toHaveClass(/guides/);
});

test("the States drawer sets what the card names, and puts it back", async ({ page }) => {
  await openPlayground(page);
  const head = page.getByRole("button", { name: "States" });
  await expect(head).toHaveAttribute("aria-expanded", "false");
  await head.click();
  await expect(head).toHaveAttribute("aria-expanded", "true");
  const drawer = page.locator(".drawer-body");
  const row = drawer.locator(".row", { hasText: "light.living_room" });
  await expect(drawer.locator(".row")).toHaveCount(1);
  await expect(row).toContainText("Living room");

  const reset = drawer.getByRole("button", { name: "Reset" });
  await expect(reset).toBeDisabled();
  const secondary = previewCard(page).locator(".secondary");
  await expect(secondary).toContainText("On");
  await row.locator(".switch").click();
  await expect(secondary).toHaveText("Off");
  await expect(reset).toBeEnabled();
  await reset.click();
  await expect(secondary).toContainText("On");
  await expect(reset).toBeDisabled();

  // a number for a numeric state, the unit beside it
  await typeYaml(page, "type: custom:tile-card-pro\nentity: sensor.living_room_co2\n");
  const co2 = drawer.locator(".row", { hasText: "sensor.living_room_co2" });
  await expect(co2.locator('input[type="number"]')).toBeVisible();
  await expect(co2.locator(".unit")).toHaveText("ppm");
  await co2.locator('input[type="number"]').fill("1234");
  await co2.locator('input[type="number"]').press("Enter");
  await expect(previewCard(page).locator(".secondary")).toContainText(/1\D?234/);

  // a select for a thermostat's modes
  await typeYaml(page, "type: custom:tile-card-pro\nentity: climate.living_room\n");
  await expect(
    drawer.locator(".row", { hasText: "climate.living_room" }).locator("select"),
  ).toBeVisible();

  // every entity the config names, a layout's cards and inputs too
  const menu = await openMenu(page, "Examples");
  await menu.getByRole("button", { name: "Layout Card Pro", exact: true }).click();
  await expect(drawer.locator(".row code")).toHaveText([
    "weather.home",
    "climate.living_room",
    "light.kitchen",
  ]);
  // open across reloads
  await page.reload();
  await expect(page.getByRole("button", { name: "States" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
});

test("the demo home can be frozen", async ({ page }) => {
  await openPlayground(page);
  await page.getByRole("button", { name: "States" }).click();
  const freeze = page.getByLabel("Freeze the demo home");
  await expect(freeze).not.toBeChecked();
  await freeze.check();
  await expect(freeze).toBeChecked();
  await freeze.uncheck();
  await expect(freeze).not.toBeChecked();
});

test("the splitter resizes the panes and is remembered", async ({ page }) => {
  await openPlayground(page);
  const split = page.getByRole("separator");
  const body = page.locator(".pg-body");
  await expect(body).toHaveAttribute("style", /grid-template-columns: 50% 6px 1fr/);
  const box = (await body.boundingBox())!;
  const s = (await split.boundingBox())!;
  await page.mouse.move(s.x + s.width / 2, s.y + s.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.3, s.y + s.height / 2, { steps: 5 });
  await page.mouse.up();
  await expect(body).toHaveAttribute("style", /grid-template-columns: 30(\.\d+)?% 6px 1fr/);
  // never narrower than a quarter
  const s2 = (await split.boundingBox())!;
  await page.mouse.move(s2.x + s2.width / 2, s2.y + s2.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 10, s2.y + s2.height / 2, { steps: 5 });
  await page.mouse.up();
  await expect(body).toHaveAttribute("style", /grid-template-columns: 25% 6px 1fr/);
  await page.reload();
  await expect(page.locator(".pg-body")).toHaveAttribute(
    "style",
    /grid-template-columns: 25% 6px 1fr/,
  );
});
