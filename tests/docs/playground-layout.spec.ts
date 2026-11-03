// The Playground's page: the editor alone under the docs' nav bar, as tall as the screen, as wide
// as the nav bar's container; on a phone one pane at a time and a one-row top bar.
import type { Page } from "@playwright/test";
import {
  test,
  expect,
  bar,
  expectYaml,
  nameField,
  openMenu,
  openPlayground,
  preview,
  previewCard,
  savedCards,
  tab,
  toast,
} from "./util.ts";

const boxOf = (page: Page) =>
  page.locator(".pg").evaluate((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      x: Math.round(r.x),
      top: Math.round(r.top),
      width: Math.round(r.width),
      bottom: Math.round(r.bottom),
      border: cs.borderLeftWidth,
      scroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

test("the nav bar links to it, and the guide does not list it", async ({ page }) => {
  await page.goto("guide/getting-started");
  const nav = page.locator(".VPNavBar");
  await nav.getByRole("link", { name: "Playground", exact: true }).click();
  await expect(page).toHaveURL(/\/playground$/);
  await expect(preview(page).locator(".ha-grid > .cell").first()).toBeAttached({ timeout: 20_000 });
  // the sidebar's guide has no Playground
  await page.goto("guide/getting-started");
  await expect(page.locator(".VPSidebar").getByRole("link", { name: "Playground" })).toHaveCount(0);
});

test("the page is the editor alone, as tall as the screen under the nav bar", async ({ page }) => {
  await openPlayground(page);
  await expect(page.locator(".VPFooter")).toHaveCount(0);
  await expect(page.locator(".VPDocFooter")).toHaveCount(0);
  // no heading, no paragraph: the page's content is the Playground
  await expect(page.locator(".vp-doc > div > *")).toHaveCount(1);
  await expect(page.locator(".vp-doc > div > *")).toHaveClass(/\bpg\b/);
  const nav = await page.locator(".VPNav").evaluate((el) => el.getBoundingClientRect().bottom);
  const box = await boxOf(page);
  expect(box.top).toBe(Math.round(nav));
  expect(box.bottom).toBe(800);
  // nothing to scroll
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(800);
});

for (const [width, expected] of [
  [1280, { x: 0, width: 1280, border: "0px" }],
  [1376, { x: 0, width: 1376, border: "0px" }],
  [1600, { x: 112, width: 1376, border: "1px" }],
  [1920, { x: 272, width: 1376, border: "1px" }],
] as const)
  test(`at ${width} px it is as wide as the nav bar's container`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openPlayground(page);
    expect(await boxOf(page)).toMatchObject({ ...expected, scroll: 0 });
  });

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("one pane at a time, by the view tabs", async ({ page }) => {
    await openPlayground(page);
    expect(await boxOf(page)).toMatchObject({ x: 0, width: 390, border: "0px", scroll: 0 });
    await expect(page.getByRole("separator")).toHaveCount(0);
    await expect(page.getByRole("tab")).toHaveText(["Visual", "YAML", "Preview"]);
    // the visual editor first, the preview hidden
    await expect(page.locator(".pg-visual ha-form").first()).toBeVisible();
    await expect(preview(page)).toBeHidden();
    await tab(page, "Preview").tap();
    await expect(preview(page)).toBeVisible();
    await expect(previewCard(page).locator(".primary")).toHaveText("Living room");
    await expect(page.locator(".pg-visual")).toBeHidden();
    // the tabs stay, so the way back does
    await tab(page, "YAML").tap();
    await expect(page.locator(".pg-yaml .cm-content")).toBeVisible();
    await expect(preview(page)).toBeHidden();
    await tab(page, "Visual").tap();
    await expect(page.locator(".pg-visual ha-form").first()).toBeVisible();
  });

  test("the top bar keeps to one row, the rest in ⋯", async ({ page }) => {
    await openPlayground(page);
    const buttons = bar(page).locator(":scope > *");
    const tops = await buttons.evaluateAll((els) =>
      els
        // the name has a row of its own above the buttons; the spacer has no height
        .filter((e) => e.getBoundingClientRect().height > 0 && !e.matches(".pg-name, .grow"))
        .map((e) => Math.round(e.getBoundingClientRect().top)),
    );
    expect(new Set(tops).size).toBe(1);
    await expect(bar(page).getByRole("button", { name: "Save", exact: true })).toHaveCount(0);
    await expect(bar(page).getByRole("button", { name: "Copy YAML" })).toHaveCount(0);
    await expect(bar(page).getByRole("button", { name: "Share" })).toBeVisible();

    const more = await openMenu(page, "⋯");
    await expect(more.getByRole("button")).toHaveText(["Save", "New", "Copy YAML"]);
    // within the screen
    const r = (await more.boundingBox())!;
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.x + r.width).toBeLessThanOrEqual(390);
    await page.keyboard.press("Escape");

    await nameField(page).fill("Phone tile");
    await (await openMenu(page, "⋯")).getByRole("button", { name: "Save" }).click();
    await expect(toast(page)).toHaveText("Saved “Phone tile”");
    expect((await savedCards(page)).map((s) => s.name)).toEqual(["Phone tile"]);

    await (await openMenu(page, "⋯")).getByRole("button", { name: "New" }).click();
    await expect(nameField(page)).toHaveValue("");
    await expectYaml(page, "type: custom:tile-card-pro\nentity: light.living_room");
  });

  test("Preview goes back to an editor on a wide screen", async ({ page }) => {
    await openPlayground(page);
    await tab(page, "Preview").tap();
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByRole("tab")).toHaveText(["Visual", "YAML"]);
    await expect(tab(page, "Visual")).toHaveAttribute("aria-selected", "true");
    await expect(preview(page)).toBeVisible();
  });
});
