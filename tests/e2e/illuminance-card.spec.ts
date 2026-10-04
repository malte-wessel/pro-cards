import { test, expect, mount, setState, card, setLanguage } from "./util.ts";

const cfg = (mode: string, extra: Record<string, unknown> = {}) => ({
  type: "custom:illuminance-card-pro",
  entity: "sensor.illuminance",
  mode,
  name: "Light",
  zones: {
    night: { label: "Night" },
    twilight: { label: "Twilight" },
    overcast: { label: "Overcast" },
    day: { label: "Day" },
    sun: { label: "Sun" },
  },
  ...extra,
});

test("trend mode draws zones, the series and the current zone pill", async ({ page }) => {
  await setState(page, "sensor.illuminance", "24600").catch(() => {});
  await mount(page, cfg("trend"));
  const c = card(page);
  await expect(c.locator(".primary")).toHaveText("Light");
  await expect(c.locator(".valrow .big b")).toHaveText("24,600");
  await expect(c.locator(".valrow .pill")).toHaveText("Day");
  await expect(c.locator("svg rect")).toHaveCount(5);
  await expect(c.locator("svg path.line")).toHaveCount(1);
  await expect(c.locator(".label.zone")).toContainText([
    "Night",
    "Twilight",
    "Overcast",
    "Day",
    "Sun",
  ]);
  await expect(c.locator(".label.y")).toContainText(["1", "100", "10k", "30k"]);
  await expect(c.locator(".label.x").first()).toHaveText(/:00$/);
  await expect(c.locator(".label.x.last")).toHaveText("now");
  await setState(page, "sensor.illuminance", "50");
  await expect(c.locator(".valrow .pill")).toHaveText("Twilight");
});

test("arc mode draws five segments and a marker", async ({ page }) => {
  await mount(page, cfg("arc"));
  const c = card(page);
  await expect(c.locator(".arcwrap svg path")).toHaveCount(5);
  await expect(c.locator(".arcwrap svg .zl")).toHaveCount(5);
  await expect(c.locator(".arcwrap svg .mark")).toBeAttached();
  await expect(c.locator(".arcwrap .bigv")).toHaveText(/^[\d,]+$/);
  await expect(c.locator(".arcwrap .pill")).toBeVisible();
});

test("band mode has one block per bucket and a gradient legend", async ({ page }) => {
  await mount(page, cfg("band", { hours_to_show: 12, bucket_minutes: 30 }));
  const c = card(page);
  await expect(c.locator(".plot svg rect:not(.hl)")).toHaveCount(24);
  await expect(c.locator(".legend")).toContainText("lx");
  const plot = c.locator(".plot");
  const box = (await plot.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.6, box.y + 10);
  await expect(c.locator(".tip")).toHaveClass(/on/);
  await expect(c.locator(".tip .time")).toHaveText(/\d\d:\d\d–\d\d:\d\d/);
  await expect(c.locator(".tip b")).toHaveText(/lx$/);
});

test("default zone names and axis words follow the Home Assistant language", async ({ page }) => {
  await mount(page, {
    type: "custom:illuminance-card-pro",
    entity: "sensor.illuminance",
    mode: "trend",
    zones: { sun: { label: "Bright" } },
  });
  const c = card(page);
  await expect(c.locator(".valrow .pill")).toHaveText("Day");
  await expect(c.locator(".label.x.last")).toHaveText("now");
  await setLanguage(page, "de");
  await expect(c.locator(".valrow .pill")).toHaveText("Tag");
  await expect(c.locator(".label.x.last")).toHaveText("jetzt");
  await expect(c.locator(".label.zone")).toContainText([
    "Nacht",
    "Dämmerung",
    "Bedeckt",
    "Tag",
    "Bright",
  ]);
  await expect(c.locator(".secondary")).toHaveText(/^Max\. /);
  await mount(page, { type: "custom:illuminance-card-pro", entity: "sensor.nope" });
  await setLanguage(page, "de");
  await expect(card(page).locator(".empty")).toHaveText("sensor.nope nicht gefunden");
});

test("reports a missing entity instead of crashing", async ({ page }) => {
  await mount(page, cfg("trend", { entity: "sensor.nope" }));
  await expect(card(page).locator(".empty")).toContainText("sensor.nope");
});
