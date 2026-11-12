// The home page's examples open their docs section when tapped; their controls still work there.
import { test, expect } from "@playwright/test";

const features = (page: import("@playwright/test").Page) => page.locator("section.features");

test("a tap on a home page example opens its docs section", async ({ page }) => {
  await page.goto("./");
  const air = features(page).locator("poster-card-pro").filter({ hasText: "Air" }).first();
  await air
    .locator("ha-card")
    .first()
    .click({ position: { x: 20, y: 20 } });
  await expect(page).toHaveURL(/\/pro-cards\/cards\/kinds#air-quality$/);
  await expect(page.locator("h3#air-quality")).toBeInViewport();
});

test("a tile in a group opens the group's section, its title too", async ({ page }) => {
  await page.goto("./");
  await features(page).getByRole("button", { name: "Temperature", exact: true }).first().click();
  await expect(page).toHaveURL(/\/cards\/tile-group-card#tiles-of-their-own$/);
});

test("a control on a home page example still works, and stays on the page", async ({ page }) => {
  await page.goto("./");
  const lamp = features(page).locator("tile-card-pro").filter({ hasText: "Desk lamp" }).first();
  const toggle = lamp.locator("[role=switch], .ctl-toggle, button").first();
  await toggle.click();
  await expect(page).toHaveURL(/\/pro-cards\/$/);
});

test("a link to a section keeps it in view while the examples above it mount", async ({ page }) => {
  await page.goto("cards/kinds#battery");
  await page.waitForTimeout(1500);
  await expect(page.locator("h3#battery")).toBeInViewport();
});
