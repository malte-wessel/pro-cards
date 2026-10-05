import { test, expect, mount, card, calls, events, setState, type MountOpts } from "./util";
import type { Page } from "@playwright/test";

const T = "custom:entity-card-pro";
const G = "custom:entity-group-card-pro";
const live: MountOpts = { liveClock: true };
// the class of the element that holds the focus inside the first card's shadow root
const focused = (page: Page) =>
  page.evaluate(() => {
    const el = document.querySelector("#root .cell > *") as HTMLElement;
    const a = el.shadowRoot?.activeElement as HTMLElement | null;
    return a ? a.className : null;
  });
const domainCalls = (page: Page) =>
  calls(page).then((c) => c.map((x) => `${x.domain}.${x.service}`));

test.describe("controls: focus and gestures", () => {
  test("the slider keeps the focus across keyboard steps and commits each one", async ({
    page,
  }) => {
    await mount(page, { type: T, entity: "light.living_room", control: "slider" }, live);
    const c = card(page);
    const s = c.locator(".ctl-slider");
    await s.focus();
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => calls(page)).toHaveLength(1);
    expect((await calls(page))[0]).toMatchObject({
      domain: "light",
      service: "turn_on",
      data: { entity_id: "light.living_room", brightness_pct: 72 },
    });
    await expect.poll(() => focused(page)).toMatch(/ctl-slider/);
    await expect(s).toHaveAttribute("aria-valuenow", "72");
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => calls(page)).toHaveLength(2);
    expect((await calls(page))[1].data).toMatchObject({ brightness_pct: 73 });
    await expect.poll(() => focused(page)).toMatch(/ctl-slider/);
  });

  test("the toggle keeps the focus after Space and has switch semantics", async ({ page }) => {
    await mount(page, { type: T, entity: "light.kitchen", control: "toggle" }, live);
    const c = card(page);
    const t = c.locator(".toggle");
    await expect(t).toHaveAttribute("role", "switch");
    await expect(t).toHaveAttribute("aria-checked", "false");
    await t.focus();
    await page.keyboard.press("Space");
    await expect.poll(() => domainCalls(page)).toEqual(["homeassistant.toggle"]);
    await expect(t).toHaveAttribute("aria-checked", "true");
    await expect.poll(() => focused(page)).toMatch(/toggle/);
  });

  test("the lead toggle is a switch too", async ({ page }) => {
    await mount(
      page,
      { type: T, entity: "light.living_room", control: "toggle", control_position: "lead" },
      live,
    );
    const lead = card(page).locator(".lead.tap");
    await expect(lead).toHaveAttribute("role", "switch");
    await expect(lead).toHaveAttribute("aria-checked", "true");
    await lead.click();
    await expect.poll(() => domainCalls(page)).toEqual(["homeassistant.toggle"]);
    await expect(lead).toHaveAttribute("aria-checked", "false");
  });

  test("a hold survives a state change of another entity in the card", async ({ page }) => {
    await mount(
      page,
      {
        type: G,
        entities: [{ entity: "lock.front_door", control: "hold" }, { entity: "sensor.pressure" }],
      },
      live,
    );
    const h = card(page).locator(".ctl-hold");
    await expect(h).toHaveAttribute("aria-label", "Hold to unlock");
    const box = (await h.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(300);
    await setState(page, "sensor.pressure", "1005");
    await expect(h).toHaveClass(/holding/);
    await expect.poll(() => domainCalls(page), { timeout: 3000 }).toEqual(["lock.unlock"]);
    await page.mouse.up();
    // letting go early cancels
    await expect
      .poll(() => page.evaluate(() => window.pc.world.get("lock.front_door")?.state))
      .toBe("unlocked");
    await page.mouse.down();
    await page.waitForTimeout(300);
    await page.mouse.up();
    await page.waitForTimeout(1200);
    expect(await domainCalls(page)).toEqual(["lock.unlock"]);
  });

  test("a hold with the keyboard works and the button keeps the focus", async ({ page }) => {
    await mount(page, { type: T, entity: "lock.front_door", control: "hold" }, live);
    const h = card(page).locator(".ctl-hold");
    await h.focus();
    await page.keyboard.down("Space");
    await expect.poll(() => domainCalls(page), { timeout: 3000 }).toEqual(["lock.unlock"]);
    await page.keyboard.up("Space");
    await expect.poll(() => focused(page)).toMatch(/ctl-hold/);
  });

  test("a screen reader's click arms the hold, a second one within five seconds runs it", async ({
    page,
  }) => {
    await mount(page, { type: T, entity: "lock.front_door", control: "hold" }, live);
    const h = card(page).locator(".ctl-hold");
    await h.dispatchEvent("click");
    await expect(h).toHaveClass(/armed/);
    await expect(h).toHaveAttribute("aria-label", "Press again to unlock");
    expect(await calls(page)).toEqual([]);
    await h.dispatchEvent("click");
    await expect.poll(() => domainCalls(page)).toEqual(["lock.unlock"]);
    await expect(h).not.toHaveClass(/armed/);
  });
});

test.describe("controls: confirmed buttons", () => {
  test("every button of a confirmed group needs a hold; a click does nothing", async ({ page }) => {
    await mount(
      page,
      { type: T, entity: "cover.office_blinds", control: "buttons", control_confirm: true },
      live,
    );
    const open = card(page).locator(".ctl-buttons .round").nth(0);
    await expect(open).toHaveAttribute("aria-label", "Hold to Open");
    await expect(card(page).locator(".ctl-buttons .ring")).toHaveCount(3);
    await open.click();
    await page.waitForTimeout(200);
    expect(await calls(page)).toEqual([]);
    const box = (await open.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await expect(open).toHaveClass(/holding/);
    await expect.poll(() => domainCalls(page), { timeout: 3000 }).toEqual(["cover.open_cover"]);
    await page.mouse.up();
  });
});

test.describe("controls: the row's own action", () => {
  test("lives on a hit layer behind the content, not on the row that holds the controls", async ({
    page,
  }) => {
    await mount(page, { type: T, entity: "light.kitchen", control: "toggle" }, live);
    const c = card(page);
    const row = c.locator(".row");
    await expect(row).not.toHaveAttribute("role", /.+/);
    const hit = row.locator("> .hit");
    await expect(hit).toHaveAttribute("role", "button");
    await expect(hit).toHaveAttribute("tabindex", "0");
    await expect(hit).toHaveAttribute("aria-label", "Kitchen");
    // a control click never reaches the row's action
    await c.locator(".toggle").click();
    await expect.poll(() => domainCalls(page)).toEqual(["homeassistant.toggle"]);
    expect((await events(page)).filter((e) => e.type === "more-info")).toEqual([]);
    // a tap on the text opens more-info; so does Enter on the hit
    const box = (await c.locator(".primary").boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect
      .poll(() => events(page).then((e) => e.filter((x) => x.type === "more-info")))
      .toEqual([{ type: "more-info", entityId: "light.kitchen" }]);
    await hit.focus();
    await page.keyboard.press("Enter");
    await expect
      .poll(() => events(page).then((e) => e.filter((x) => x.type === "more-info").length))
      .toBe(2);
  });
});

test.describe("controls: segments, stepper, select", () => {
  test("segments are one tab stop and the arrows move and choose", async ({ page }) => {
    await mount(page, { type: T, entity: "fan.living_room", control: "segments" }, live);
    const segs = card(page).locator(".seg");
    await expect(segs).toHaveCount(4);
    await expect(segs.nth(2)).toHaveAttribute("aria-checked", "true");
    await expect(segs.nth(2)).toHaveAttribute("tabindex", "0");
    await expect(segs.nth(0)).toHaveAttribute("tabindex", "-1");
    await segs.nth(2).focus();
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => calls(page)).toHaveLength(1);
    expect((await calls(page))[0]).toMatchObject({
      service: "set_percentage",
      data: { percentage: 100 },
    });
    await expect(segs.nth(3)).toHaveAttribute("aria-checked", "true");
    await expect.poll(() => focused(page)).toMatch(/seg/);
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => domainCalls(page)).toEqual(["fan.set_percentage", "fan.turn_off"]);
    await expect(segs.nth(0)).toHaveAttribute("aria-checked", "true");
  });

  test("the stepper stops at the bounds", async ({ page }) => {
    await mount(page, { type: T, entity: "climate.living_room", control: "stepper" }, live);
    await setState(page, "climate.living_room", "heat", { temperature: 30 });
    const inc = card(page).locator(".ctl-stepper button").nth(1);
    const dec = card(page).locator(".ctl-stepper button").nth(0);
    await expect(inc).toBeDisabled();
    await dec.click();
    await expect.poll(() => calls(page)).toHaveLength(1);
    expect((await calls(page))[0]).toMatchObject({
      service: "set_temperature",
      data: { temperature: 29.5 },
    });
    await expect(inc).toBeEnabled();
  });

  test("the select calls select_option", async ({ page }) => {
    await mount(page, { type: T, entity: "input_select.house_mode", control: "select" }, live);
    await card(page).locator("select").selectOption("Away");
    await expect
      .poll(() => calls(page))
      .toEqual([
        {
          domain: "input_select",
          service: "select_option",
          data: { entity_id: "input_select.house_mode", option: "Away" },
          target: null,
        },
      ]);
  });
});

test.describe("controls: pending and failure", () => {
  test("shows the asked value as a ghost until the entity answers", async ({ page }) => {
    await mount(page, { type: T, entity: "light.kitchen", control: "toggle" }, live);
    await page.evaluate(() => window.pc.holdCalls(true));
    const t = card(page).locator(".toggle");
    await t.click();
    await expect(t).toHaveClass(/pending/);
    await expect(t).toHaveAttribute("aria-checked", "true");
    await page.evaluate(() => window.pc.release());
    await expect(t).not.toHaveClass(/pending/);
    await expect(t).toHaveClass(/on/);
  });

  test("a failed call drops the ghost, fires a failure haptic and a notification", async ({
    page,
  }) => {
    await mount(page, { type: T, entity: "light.kitchen", control: "toggle" }, live);
    await page.evaluate(() => window.pc.failCalls(true));
    const t = card(page).locator(".toggle");
    await t.click();
    await expect(t).not.toHaveClass(/pending/);
    await expect(t).not.toHaveClass(/on/);
    const ev = await events(page);
    expect(ev).toContainEqual({ type: "haptic", kind: "failure" });
    expect(ev.find((e) => e.type === "notification")).toMatchObject({
      message: "homeassistant.toggle: boom",
    });
  });
});
