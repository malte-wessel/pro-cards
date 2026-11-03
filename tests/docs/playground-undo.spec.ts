// The Playground's undo and redo: one history of the card's YAML, whatever changed it (the
// visual editor, typing, an example), by the top bar's buttons or the keys.
import { test, expect, type Page } from "@playwright/test";
import {
  bar,
  expectYaml,
  field,
  fill,
  nameField,
  openMenu,
  openPlayground,
  previewCard,
  tab,
} from "./util.ts";

const undo = (page: Page) => bar(page).getByRole("button", { name: "Undo" });
const redo = (page: Page) => bar(page).getByRole("button", { name: "Redo" });
const TILE = "type: custom:tile-card-pro\nentity: light.living_room";

test("takes a visual edit back and brings it again", async ({ page }) => {
  await openPlayground(page);
  await expect(undo(page)).toBeDisabled();
  await expect(redo(page)).toBeDisabled();
  await fill(field(page, "name").locator("input"), "Sofa");
  await expect(previewCard(page).locator(".primary")).toHaveText("Sofa");
  await undo(page).click();
  await expect(previewCard(page).locator(".primary")).toHaveText("Living room");
  // the form follows
  await tab(page, "Visual").click();
  await expect(field(page, "name").locator("input")).toHaveValue("");
  await expect(redo(page)).toBeEnabled();
  await redo(page).click();
  await expect(previewCard(page).locator(".primary")).toHaveText("Sofa");
  await expect(redo(page)).toBeDisabled();
});

test("takes back what was typed since the last pause, by the keys in the YAML", async ({
  page,
}) => {
  await openPlayground(page);
  await tab(page, "YAML").click();
  const content = page.locator(".pg-yaml .cm-content");
  await content.click();
  await page.keyboard.press("ControlOrMeta+End");
  // (the YAML ends with a line break: the cursor is on the empty last line)
  await page.keyboard.type("name: Desk", { delay: 20 });
  await expectYaml(page, `${TILE}\nname: Desk`);
  await page.keyboard.press("ControlOrMeta+z");
  await expectYaml(page, TILE);
  await page.keyboard.press("ControlOrMeta+Shift+z");
  await expectYaml(page, `${TILE}\nname: Desk`);
});

test("takes an example back, with its name", async ({ page }) => {
  await openPlayground(page);
  await expect(nameField(page)).toHaveValue("Tile Card Pro");
  const menu = await openMenu(page, "Examples");
  await menu.getByRole("button", { name: "Poster Card Pro" }).click();
  await expect(nameField(page)).toHaveValue("Poster Card Pro");
  // the keys anywhere but a field being typed in
  await page.locator(".stage").click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("ControlOrMeta+z");
  await expect(nameField(page)).toHaveValue("Tile Card Pro");
  await expectYaml(page, TILE);
});

test("keeps the browser's own undo in a field being typed in", async ({ page }) => {
  await openPlayground(page);
  await fill(field(page, "name").locator("input"), "Sofa");
  const input = nameField(page);
  await input.click();
  await input.press("End");
  await page.keyboard.type("X");
  await page.keyboard.press("ControlOrMeta+z");
  // the card's name field is the browser's: the visual edit before stays
  await expect(previewCard(page).locator(".primary")).toHaveText("Sofa");
});

test("sits in the ⋯ menu on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPlayground(page);
  await fill(field(page, "name").locator("input"), "Sofa");
  const menu = await openMenu(page, "⋯");
  await menu.getByRole("button", { name: "Undo" }).click();
  await tab(page, "Preview").click();
  await expect(previewCard(page).locator(".primary")).toHaveText("Living room");
});
