// The Playground keeps the card in the browser (the draft), saves cards under a name, and shares
// a card as a link; the docs examples' Edit links open their card here.
import { decodeEdit, encodeEdit } from "../../docs/.vitepress/theme/editable.ts";
import {
  test,
  expect,
  bar,
  draft,
  expectYaml,
  field,
  fill,
  nameField,
  openMenu,
  openPlayground,
  previewCard,
  savedCards,
  tab,
  toast,
  typeYaml,
} from "./util.ts";

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

const clipboard = (page: import("@playwright/test").Page) =>
  page.evaluate(() => navigator.clipboard.readText());

test("keeps the card as you type, and opens it again after a reload", async ({ page }) => {
  await openPlayground(page);
  await nameField(page).fill("Kitchen");
  await typeYaml(page, "type: custom:tile-card-pro\nentity: light.kitchen\n");
  await expect
    .poll(() => draft(page))
    .toEqual({ name: "Kitchen", yaml: "type: custom:tile-card-pro\nentity: light.kitchen\n" });
  await page.reload();
  await expect(nameField(page)).toHaveValue("Kitchen");
  await expect(previewCard(page).locator(".primary")).toHaveText("Kitchen");
  await expectYaml(page, "type: custom:tile-card-pro\nentity: light.kitchen");
});

test("saves a card, lists it, and opens it again", async ({ page }) => {
  await openPlayground(page);
  const empty = await openMenu(page, "Saved");
  await expect(empty).toContainText("Nothing saved yet");
  await page.keyboard.press("Escape");

  await nameField(page).fill("Sofa");
  await bar(page).getByRole("button", { name: "Save", exact: true }).click();
  await expect(toast(page)).toHaveText("Saved “Sofa”");
  expect((await savedCards(page)).map((s) => s.name)).toEqual(["Sofa"]);

  // something else in the editor, then the saved card back from the menu
  await typeYaml(page, "type: custom:tile-card-pro\nentity: light.kitchen\n");
  await nameField(page).fill("Other");
  const menu = await openMenu(page, "Saved");
  const entry = menu.locator(".pg-saved", { hasText: "Sofa" });
  await expect(entry).toHaveClass(/current/);
  await expect(entry.locator("small")).toHaveText("just now");
  await entry.getByRole("button", { name: /Sofa/ }).click();
  await expect(menu).toBeHidden();
  await expect(nameField(page)).toHaveValue("Sofa");
  await expect(previewCard(page).locator(".primary")).toHaveText("Living room");
});

test("Save updates the card it was opened from, under its new name", async ({ page }) => {
  await openPlayground(page);
  await bar(page).getByRole("button", { name: "Save", exact: true }).click();
  const [first] = await savedCards(page);
  expect(first.name).toBe("Tile Card Pro");

  await nameField(page).fill("Living room tile");
  await tab(page, "Visual").click();
  await fill(field(page, "name").locator("input"), "Sofa");
  await bar(page).getByRole("button", { name: "Save", exact: true }).click();
  await expect(toast(page)).toHaveText("Saved “Living room tile”");
  const list = await savedCards(page);
  expect(list).toHaveLength(1);
  expect(list[0]).toMatchObject({ id: first.id, name: "Living room tile" });
  expect(list[0].yaml).toContain("name: Sofa");
});

test("a card without a name is saved under its type", async ({ page }) => {
  await openPlayground(page);
  await bar(page).getByRole("button", { name: "New", exact: true }).click();
  await expect(nameField(page)).toHaveValue("");
  await expect(nameField(page)).toHaveAttribute("placeholder", "Tile");
  await bar(page).getByRole("button", { name: "Save", exact: true }).click();
  await expect(nameField(page)).toHaveValue("Tile");
  expect((await savedCards(page)).map((s) => s.name)).toEqual(["Tile"]);
});

test("New starts a card of its own: Save then adds one", async ({ page }) => {
  await openPlayground(page);
  await bar(page).getByRole("button", { name: "Save", exact: true }).click();
  await typeYaml(page, "type: custom:poster-card-pro\nentity: sensor.wind_speed\n");
  await bar(page).getByRole("button", { name: "New", exact: true }).click();
  await expectYaml(page, "type: custom:tile-card-pro\nentity: light.living_room");
  await tab(page, "Visual").click();
  await expect(tab(page, "Visual")).toHaveAttribute("aria-selected", "true");
  await nameField(page).fill("Second");
  await bar(page).getByRole("button", { name: "Save", exact: true }).click();
  // the poster typed over the saved tile was kept before New replaced it
  expect((await savedCards(page)).map((s) => s.name)).toEqual([
    "Second",
    "Tile Card Pro (unsaved)",
    "Tile Card Pro",
  ]);
});

test("deletes a saved card only when asked twice", async ({ page }) => {
  await openPlayground(page);
  await nameField(page).fill("One");
  await bar(page).getByRole("button", { name: "Save", exact: true }).click();
  await bar(page).getByRole("button", { name: "New", exact: true }).click();
  await nameField(page).fill("Two");
  await bar(page).getByRole("button", { name: "Save", exact: true }).click();

  const menu = await openMenu(page, "Saved");
  await expect(menu.locator(".pg-saved .pg-item span")).toHaveText(["Two", "One"]);
  const one = menu.locator(".pg-saved", { hasText: "One" });
  await one.getByTitle("Delete").click();
  // asked, not yet deleted; the menu stays open
  await expect(one.getByTitle("Click again to delete")).toHaveText("Delete?");
  expect(await savedCards(page)).toHaveLength(2);
  await one.getByTitle("Click again to delete").click();
  await expect(menu.locator(".pg-saved .pg-item span")).toHaveText(["Two"]);
  expect((await savedCards(page)).map((s) => s.name)).toEqual(["Two"]);

  // the card being edited deleted: the next Save makes a new one
  await menu.locator(".pg-saved", { hasText: "Two" }).getByTitle("Delete").click();
  await menu.getByTitle("Click again to delete").click();
  await expect(menu).toContainText("Nothing saved yet");
  await page.keyboard.press("Escape");
  await bar(page).getByRole("button", { name: "Save", exact: true }).click();
  expect((await savedCards(page)).map((s) => s.name)).toEqual(["Two"]);
});

test("copies the YAML", async ({ page }) => {
  await openPlayground(page);
  await bar(page).getByRole("button", { name: "Copy YAML" }).click();
  await expect(toast(page)).toHaveText("YAML copied");
  expect(await clipboard(page)).toBe("type: custom:tile-card-pro\nentity: light.living_room\n");
});

test("shares a card as a link that opens it anywhere", async ({ page, browser, baseURL }) => {
  // the Playground loads three times (here, in another browser, after a reload): beside the other
  // workers that takes longer than one test's time
  test.slow();
  await openPlayground(page);
  await nameField(page).fill("Wind ☀");
  await typeYaml(page, "type: custom:poster-card-pro\nentity: sensor.wind_speed\nname: Böen\n");
  await expect(previewCard(page)).toHaveJSProperty("tagName", "POSTER-CARD-PRO");
  await bar(page).getByRole("button", { name: "Share" }).click();
  await expect(toast(page)).toContainText("Link copied");
  const link = await clipboard(page);
  expect(link).toMatch(/\/pro-cards\/playground#c=[A-Za-z0-9_-]+$/);

  // another browser: the card, its name, an unsaved card; the hash is gone
  const other = await browser.newContext({ baseURL });
  const fresh = await other.newPage();
  await openPlayground(fresh, link.slice(link.indexOf("#")));
  await expect(nameField(fresh)).toHaveValue("Wind ☀");
  await expect(previewCard(fresh)).toHaveJSProperty("tagName", "POSTER-CARD-PRO");
  await expectYaml(fresh, "type: custom:poster-card-pro\nentity: sensor.wind_speed\nname: Böen");
  expect(new URL(fresh.url()).hash).toBe("");
  expect(await savedCards(fresh)).toEqual([]);
  // a reload keeps the edits, not the link's card
  await typeYaml(fresh, "type: custom:tile-card-pro\nentity: light.kitchen\n");
  await expect
    .poll(() => draft(fresh))
    .toMatchObject({ yaml: expect.stringContaining("light.kitchen") });
  await fresh.reload();
  await expect(previewCard(fresh).locator(".primary")).toHaveText("Kitchen");
  await other.close();
});

test("a link wins over the draft", async ({ page }) => {
  await openPlayground(page);
  await typeYaml(page, "type: custom:tile-card-pro\nentity: light.kitchen\n");
  await expect
    .poll(() => draft(page))
    .toMatchObject({ yaml: expect.stringContaining("light.kitchen") });
  await page.goto("about:blank");
  await openPlayground(
    page,
    `#edit=${encodeEdit("type: custom:tile-card-pro\nentity: light.attic\n")}`,
  );
  await expect(previewCard(page).locator(".primary")).toHaveText("Attic");
  // the draft it replaced is kept among the saved cards
  const menu = await openMenu(page, "Saved");
  await expect(menu).toContainText("(unsaved)");
});

test("a link pasted into the open Playground opens its card", async ({ page }) => {
  await openPlayground(page);
  await page.evaluate(
    (hash) => (location.hash = hash),
    `#edit=${encodeEdit("type: custom:tile-card-pro\nentity: light.attic\n")}`,
  );
  await expect(previewCard(page).locator(".primary")).toHaveText("Attic");
  await expect.poll(() => page.evaluate(() => location.hash)).toBe("");
});

test("an example's Edit link opens its card", async ({ page }) => {
  await page.goto("cards/tile-card");
  const edit = page.locator("a.edit-link").first();
  await expect(edit).toBeVisible({ timeout: 20_000 });
  const href = (await edit.getAttribute("href"))!;
  expect(href).toMatch(/^\/pro-cards\/playground#edit=/);
  const yaml = decodeEdit(href.slice(href.indexOf("#")))!;
  expect(yaml).toContain("type: custom:tile-card-pro");
  await edit.click();
  await expect(page).toHaveURL(/\/playground$/);
  await expectYaml(page, yaml);
  // a list of tiles: the first one in the form, the rest in the picker
  await tab(page, "Visual").click();
  await expect(page.locator(".pg-visual tile-card-pro-editor")).toBeAttached();
  await expect(page.getByTitle("The card to edit").locator("option").first()).toHaveText(
    /^1: Tile/,
  );
});

test("an example that is not a Pro card the editor edits has no Edit link", async ({ page }) => {
  await page.goto("cards/rain-card");
  await expect(page.locator(".live").first()).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("a.edit-link")).toHaveCount(0);
});
