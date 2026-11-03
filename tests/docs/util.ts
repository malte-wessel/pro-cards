// The Playground in the built docs site: open it, read and write its YAML, find its parts. Every
// test has a page of its own, so it starts from an empty localStorage (no draft, nothing saved).
import { expect, type Locator, type Page } from "@playwright/test";

export { test, expect } from "@playwright/test";

// the Playground with a hash (a share or Edit link), once its card is in the preview
export const openPlayground = async (page: Page, hash = "") => {
  await page.goto(`playground${hash}`);
  await expect(preview(page).locator(".ha-grid > .cell").first()).toBeAttached({ timeout: 20_000 });
};

export const bar = (page: Page) => page.locator(".pg-bar");
export const nameField = (page: Page) => page.getByLabel("Name of this card");
export const tab = (page: Page, name: "Visual" | "YAML" | "Preview") =>
  page.getByRole("tab", { name, exact: true });
// the preview's section, and the cards in it
export const preview = (page: Page) => page.locator(".stage");
export const previewCard = (page: Page, i = 0) =>
  preview(page).locator(".ha-grid > .cell").nth(i).locator(":scope > *");
// the visual editor's form (the card's own editor, its ha-form)
export const form = (page: Page) => page.locator(".pg-visual ha-form").first();
export const field = (page: Page, name: string) =>
  form(page).locator(`[data-name="${name}"]`).first();
export const errorLine = (page: Page) => page.locator(".pg-error");
export const toast = (page: Page) => page.locator(".pg-toast");

// a menu of the top bar opened, its panel
export const openMenu = async (page: Page, label: string | RegExp) => {
  await bar(page).getByRole("button", { name: label }).first().click();
  const panel = bar(page).getByRole("menu");
  await expect(panel).toBeVisible();
  return panel;
};

// the YAML editor's text (switches to the YAML view: CodeMirror draws only what it shows)
export const yamlText = async (page: Page) => {
  await tab(page, "YAML").click();
  const lines = await page.locator(".pg-yaml .cm-line").allInnerTexts();
  return lines.map((l) => l.replace(/\n$/, "")).join("\n");
};
export const expectYaml = async (page: Page, expected: string | RegExp) => {
  await tab(page, "YAML").click();
  const read = async () =>
    (await page.locator(".pg-yaml .cm-line").allInnerTexts())
      .map((l) => l.replace(/\n$/, ""))
      .join("\n")
      .trimEnd();
  // (CodeMirror loads with the YAML view: longer than a moment on a busy machine)
  const poll = expect.poll(read, { timeout: 15_000 });
  if (typeof expected === "string") await poll.toBe(expected.trimEnd());
  else await poll.toMatch(expected);
};
// the whole YAML replaced, as typed (one edit, without CodeMirror's auto-indent)
export const typeYaml = async (page: Page, text: string) => {
  await tab(page, "YAML").click();
  const content = page.locator(".pg-yaml .cm-content");
  await content.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.insertText(text);
};

// what the draft holds in localStorage
export const draft = (page: Page) =>
  page.evaluate(() => {
    const raw = localStorage.getItem("pro-cards:playground:draft");
    return raw ? (JSON.parse(raw) as { name: string; yaml: string; id?: string }) : null;
  });
export const savedCards = (page: Page) =>
  page.evaluate(() => {
    const raw = localStorage.getItem("pro-cards:playground:saved");
    return raw ? (JSON.parse(raw) as { id: string; name: string; yaml: string }[]) : [];
  });

// a text field of the visual editor set, as a person types it and leaves it
export const fill = async (input: Locator, value: string) => {
  await input.fill(value);
  await input.press("Tab");
};
