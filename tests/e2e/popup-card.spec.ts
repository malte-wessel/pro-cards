// The pop-up card in a browser: hidden on the dashboard, opened by a navigate action to its hash,
// a dialog on a wide screen and a sheet on a phone, closed by ✕, Esc, the scrim, the back button
// and a drag; the sheet grows to the full height when dragged up; a drag never taps the card it
// starts on.
import type { Page } from "@playwright/test";
import { test, expect, mount, actions, setState } from "./util";

const PU = "custom:popup-card-pro";
const tile = (entity: string, extra: Record<string, unknown> = {}) => ({
  type: "custom:tile-card-pro",
  entity,
  ...extra,
});
const opener = (hash: string) =>
  tile("light.living_room", {
    name: `Open ${hash}`,
    tap_action: { action: "navigate", navigation_path: `#${hash}` },
  });
const popup = (extra: Record<string, unknown> = {}) => ({
  type: PU,
  hash: "living-room",
  title: "Living room",
  cards: [tile("light.living_room"), tile("light.kitchen"), tile("fan.living_room")],
  ...extra,
});

// the open pop-up: where its sheet is, whether it rests at the full height, the address's hash
const state = (page: Page) =>
  page.evaluate(() => {
    const hosts = [...document.querySelectorAll<HTMLElement>(".pro-cards-popup")].filter(
      (h) => h.isConnected,
    );
    const sheet = hosts[0]?.shadowRoot?.querySelector<HTMLElement>(".sheet");
    const r = sheet?.getBoundingClientRect();
    return {
      open: hosts.length,
      hash: location.hash,
      top: r ? Math.round(r.top) : null,
      height: r ? Math.round(r.height) : null,
      tall: !!sheet?.classList.contains("tall"),
      mode: hosts[0]?.shadowRoot?.querySelector(".wrap")?.classList.contains("as-sheet")
        ? "sheet"
        : hosts.length
          ? "dialog"
          : null,
    };
  });
// a navigate action to `hash` ("" leaves it)
const go = (page: Page, hash: string) =>
  page.evaluate((h) => {
    history.pushState(null, "", h || location.pathname);
    window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
  }, hash);
const openBy = async (page: Page, hash = "living-room") => {
  await page.getByRole("button", { name: `Open ${hash}` }).click();
  await expect.poll(async () => (await state(page)).open).toBe(1);
};

test.describe("popup-card-pro", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("takes no room on the dashboard while closed", async ({ page }) => {
    await mount(page, [opener("living-room"), popup()], { width: 400 });
    const host = page.locator("popup-card-pro");
    await expect(host).toBeHidden();
    expect(await state(page)).toMatchObject({ open: 0, hash: "" });
  });

  test("opens as a dialog on a navigate action to its hash; Esc closes it and takes the hash off", async ({
    page,
  }) => {
    await mount(page, [opener("living-room"), popup()], { width: 400 });
    await openBy(page);
    expect(await state(page)).toMatchObject({ hash: "#living-room", mode: "dialog" });
    const sheet = page.locator(".pro-cards-popup .sheet");
    await expect(sheet.getByRole("button", { name: "Close" })).toBeFocused();
    await expect(sheet.locator("tile-card-pro")).toHaveCount(3);
    await expect(sheet.locator("heading-card-pro")).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect.poll(async () => (await state(page)).open).toBe(0);
    expect((await state(page)).hash).toBe("");
  });

  test("closes with ✕, the scrim and the back button", async ({ page }) => {
    await mount(page, [opener("living-room"), popup()], { width: 400 });
    await openBy(page);
    await page.locator(".pro-cards-popup .x").click();
    await expect.poll(async () => (await state(page)).open).toBe(0);
    await openBy(page);
    await page.mouse.click(10, 10);
    await expect.poll(async () => (await state(page)).open).toBe(0);
    await openBy(page);
    await page.goBack();
    await expect.poll(async () => (await state(page)).open).toBe(0);
    expect((await state(page)).hash).toBe("");
  });

  test("opens at once on a link with its hash, and closing replaces the address", async ({
    page,
  }) => {
    await mount(page, [], { width: 400 });
    const before = await page.evaluate(() => {
      history.replaceState(null, "", "#living-room");
      return history.length;
    });
    await mount(page, [popup()], { width: 400 });
    await expect.poll(async () => (await state(page)).open).toBe(1);
    await page.keyboard.press("Escape");
    await expect.poll(async () => (await state(page)).open).toBe(0);
    expect(await page.evaluate(() => [location.hash, history.length])).toEqual(["", before]);
  });

  test("shows one pop-up at a time: another's hash closes the first", async ({ page }) => {
    await mount(page, [popup(), popup({ hash: "kitchen", title: "Kitchen" })], { width: 400 });
    await page.evaluate(() => {
      history.pushState(null, "", "#living-room");
      window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
    });
    await expect.poll(async () => (await state(page)).open).toBe(1);
    await page.evaluate(() => {
      history.pushState(null, "", "#kitchen");
      window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
    });
    await expect
      .poll(() =>
        page.evaluate(() =>
          [...document.querySelectorAll(".pro-cards-popup")]
            .filter((h) => h.isConnected)
            .map((h) => h.shadowRoot!.querySelector(".sheet")!.getAttribute("aria-label")),
        ),
      )
      .toEqual(["Kitchen"]);
  });

  test("shows inline in the editor's preview; Open leaves the address alone", async ({ page }) => {
    await mount(page, [popup()], { width: 400 });
    await page.evaluate(
      () => ((window.pc.card(0) as unknown as { preview: boolean }).preview = true),
    );
    const host = page.locator("popup-card-pro");
    await expect(host).toBeVisible();
    await expect(host.locator(".inline tile-card-pro")).toHaveCount(3);
    await host.getByRole("button", { name: "Open" }).click();
    await expect.poll(async () => (await state(page)).open).toBe(1);
    expect((await state(page)).hash).toBe("");
    await page.keyboard.press("Escape");
    await expect.poll(async () => (await state(page)).open).toBe(0);
    await expect(host.locator(".inline tile-card-pro")).toHaveCount(3);
  });

  test("going from one pop-up to another and closing it gives the page its scroll back", async ({
    page,
  }) => {
    const overflow = () => page.evaluate(() => document.documentElement.style.overflow);
    await mount(page, [popup(), popup({ hash: "kitchen", title: "Kitchen" })], { width: 400 });
    await go(page, "#living-room");
    await expect.poll(overflow).toBe("hidden");
    await go(page, "#kitchen");
    await expect.poll(async () => (await state(page)).open).toBe(1);
    expect(await overflow()).toBe("hidden");
    // closing the kitchen goes back to the living room, as the back button does
    await page.keyboard.press("Escape");
    await expect.poll(async () => (await state(page)).hash).toBe("#living-room");
    await expect.poll(async () => (await state(page)).open).toBe(1);
    expect(await overflow()).toBe("hidden");
    await page.keyboard.press("Escape");
    await expect.poll(async () => (await state(page)).open).toBe(0);
    expect(await overflow()).toBe("");
  });

  test("keeps the focus: Esc after a click on its background, Tab around its controls", async ({
    page,
  }) => {
    await mount(page, [opener("living-room"), popup()], { width: 400 });
    await openBy(page);
    // in the dialog, where nothing takes the focus
    const box = (await page.locator(".pro-cards-popup .scroll").boundingBox())!;
    await page.mouse.click(box.x + 4, box.y + box.height - 4);
    await page.keyboard.press("Escape");
    await expect.poll(async () => (await state(page)).open).toBe(0);
    await openBy(page);
    // where the focus is: in the pop-up or not
    const inside = () =>
      page.evaluate(() => {
        let el = document.activeElement;
        while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
        const host = document.querySelector(".pro-cards-popup")!;
        const path: Node[] = [];
        for (let n: Node | null = el; n; n = n.parentNode ?? (n as ShadowRoot).host ?? null)
          path.push(n);
        return path.includes(host);
      });
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      expect(await inside(), `Tab ${i + 1}`).toBe(true);
    }
    await page.keyboard.press("Shift+Tab");
    expect(await inside()).toBe(true);
  });

  test("does not open while its visibility does not hold", async ({ page }) => {
    const vis = [{ condition: "state", entity: "light.kitchen", state: "on" }];
    await mount(page, [opener("living-room"), popup({ visibility: vis })], { width: 400 });
    // the kitchen light is off in the demo world
    await page.getByRole("button", { name: "Open living-room" }).click();
    await page.waitForTimeout(300);
    expect(await state(page)).toMatchObject({ open: 0, hash: "#living-room" });
    await go(page, "");
    await setState(page, "light.kitchen", "on");
    await openBy(page);
  });

  test("reopened by the back button, closing stays on the page", async ({ page }) => {
    await mount(page, [], { width: 400 });
    await page.evaluate(() => history.replaceState(null, "", "#living-room"));
    // opened by the address the page had: nothing behind it to go back to
    await mount(page, [popup(), popup({ hash: "kitchen", title: "Kitchen" })], { width: 400 });
    await expect.poll(async () => (await state(page)).open).toBe(1);
    const length = await page.evaluate(() => history.length);
    await go(page, "#kitchen");
    await expect.poll(async () => (await state(page)).hash).toBe("#kitchen");
    // ✕ on the kitchen goes back to the living room, which opens again
    await page.locator(".pro-cards-popup .x").first().click();
    await expect.poll(async () => (await state(page)).hash).toBe("#living-room");
    await expect.poll(async () => (await state(page)).open).toBe(1);
    await page.keyboard.press("Escape");
    await expect.poll(async () => (await state(page)).open).toBe(0);
    expect(await page.evaluate(() => [location.pathname, location.hash, history.length])).toEqual([
      "/",
      "",
      length + 1,
    ]);
  });

  test("shows a section of a dashboard: its heading as the header, its cards, then its own", async ({
    page,
  }) => {
    const section = { dashboard: "dashboard-rooms", view: "rooms", title: "Kitchen" };
    await mount(
      page,
      [opener("kitchen"), { type: PU, hash: "kitchen", section, cards: [tile("light.office")] }],
      { width: 400 },
    );
    await openBy(page, "kitchen");
    const sheet = page.locator(".pro-cards-popup .sheet");
    await expect(sheet).toHaveAttribute("aria-label", "Kitchen");
    await expect(sheet.locator(".heading hui-heading-card")).toHaveCount(1);
    const entities = () =>
      page.evaluate(() =>
        [
          ...document
            .querySelector(".pro-cards-popup")!
            .shadowRoot!.querySelectorAll(".body > .item hui-card"),
        ].map(
          (h) =>
            (h.firstElementChild as unknown as { _config?: { entities?: { entity: string }[] } })
              ?._config?.entities?.[0]?.entity,
        ),
      );
    await expect
      .poll(entities)
      .toEqual([
        "light.kitchen",
        "sensor.kitchen_temperature",
        "climate.kitchen",
        "media_player.kitchen_speaker",
        "light.office",
      ]);
  });

  test("says so when its section is not there", async ({ page }) => {
    const section = { dashboard: "dashboard-rooms", view: "rooms", title: "Garage" };
    await mount(page, [opener("garage"), { type: PU, hash: "garage", title: "Garage", section }], {
      width: 400,
    });
    await openBy(page, "garage");
    await expect(page.locator(".pro-cards-popup .note")).toHaveText(
      "No section “Garage” on that dashboard and view",
    );
    await page.keyboard.press("Escape");
    await mount(
      page,
      [opener("x"), { type: PU, hash: "x", title: "X", section: { dashboard: "nope", index: 0 } }],
      { width: 400 },
    );
    await openBy(page, "x");
    await expect(page.locator(".pro-cards-popup .note")).toHaveText(
      "That dashboard could not be read",
    );
  });

  test("height: full opens the dialog as tall as it may be", async ({ page }) => {
    await mount(page, [opener("living-room"), popup({ height: "full" })], { width: 400 });
    await openBy(page);
    const s = await state(page);
    expect(s.tall).toBe(true);
    // 86 % of the 800 px window
    expect(s.height).toBe(688);
  });
});

test.describe("popup-card-pro on a phone", () => {
  // (touch alone: a mobile browser without a viewport meta tag, as the harness is, lays out 980 px wide)
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  // a finger from y0 by dy, slowly, held still before it lets go (no flick)
  const drag = async (page: Page, y0: number, dy: number, x = 200) => {
    const cdp = await page.context().newCDPSession(page);
    const touch = (type: "touchStart" | "touchMove" | "touchEnd", y?: number) =>
      cdp.send("Input.dispatchTouchEvent", {
        type,
        touchPoints: y === undefined ? [] : [{ x, y }],
      });
    await touch("touchStart", y0);
    for (let i = 1; i <= 20; i++) {
      await touch("touchMove", y0 + (dy * i) / 20);
      await page.waitForTimeout(16);
    }
    await page.waitForTimeout(150);
    await touch("touchEnd");
    await page.waitForTimeout(200);
  };

  test("is a sheet as tall as its cards, dragged up to the full height and down to close", async ({
    page,
  }) => {
    await mount(page, [opener("living-room"), popup()]);
    await openBy(page);
    let s = await state(page);
    expect(s.mode).toBe("sheet");
    expect(s.tall).toBe(false);
    expect(s.top! + s.height!).toBe(844);
    // up by the handle and the header: the full height, a gap left at the top
    await drag(page, s.top! + 30, -400);
    s = await state(page);
    expect(s).toMatchObject({ tall: true, top: 48 });
    // down a little: it stays; down further: its cards' height again
    await drag(page, s.top! + 30, 150);
    expect(await state(page)).toMatchObject({ tall: true, top: 48 });
    await drag(page, s.top! + 30, 450);
    s = await state(page);
    expect(s.tall).toBe(false);
    expect(s.top).toBeGreaterThan(300);
    // a short pull down springs back, a long one closes it
    await drag(page, s.top! + 30, 40);
    expect((await state(page)).open).toBe(1);
    await drag(page, s.top! + 30, 300);
    await expect.poll(async () => (await state(page)).open).toBe(0);
    expect((await state(page)).hash).toBe("");
  });

  test("a drag that starts on a card moves the sheet, never taps the card", async ({ page }) => {
    await mount(page, [opener("living-room"), popup()]);
    await openBy(page);
    const before = (await actions(page)).length;
    const s = await state(page);
    const card = await page.locator(".pro-cards-popup tile-card-pro").nth(2).boundingBox();
    // pushed up on the fan's tile, held past a hold
    await drag(page, card!.y + card!.height / 2, -400, card!.x + card!.width / 2);
    expect(await state(page)).toMatchObject({ tall: true, top: 48 });
    expect((await actions(page)).length).toBe(before);
    // a tap on it still taps
    await page.locator(".pro-cards-popup tile-card-pro").nth(2).tap();
    await expect.poll(async () => (await actions(page)).length).toBe(before + 1);
    expect(s.open).toBe(1);
  });

  // the browser's click after a tap would land on the open pop-up: on its scrim (closing it at
  // once) or on one of its cards; the opener under the scrim, then under the sheet
  for (const [where, above] of [
    ["the scrim", 0],
    ["the sheet", 18],
  ] as const)
    test(`a tap opens it and leaves it open, its click not on ${where}`, async ({ page }) => {
      const fill = Array.from({ length: above }, () => tile("sensor.kitchen_temperature"));
      await mount(page, [...fill, opener("living-room"), popup()]);
      const b = (await page.getByRole("button", { name: "Open living-room" }).boundingBox())!;
      await page.evaluate(() => {
        const w = window as unknown as { clicks: number };
        w.clicks = 0;
        document.addEventListener(
          "click",
          (e) => {
            if (e.composedPath().some((n) => (n as Element).classList?.contains("pro-cards-popup")))
              w.clicks++;
          },
          true,
        );
      });
      await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
      await page.waitForTimeout(500);
      const s = await state(page);
      expect(s).toMatchObject({ open: 1, hash: "#living-room" });
      // (where the finger was: above the sheet, or on it)
      expect(b.y + b.height / 2 > s.top!).toBe(above > 0);
      expect(await page.evaluate(() => (window as unknown as { clicks: number }).clicks)).toBe(0);
    });
});
