// The swipe card in a browser: its cards side by side in a strip that scrolls and snaps, the
// dots that follow the page and jump to it, Home Assistant's visibility, and unfolding into a
// grid at the view columns of its section.
import type { Page } from "@playwright/test";
import { test, expect, mount, setLanguage, setState } from "./util";

const SW = "custom:swipe-card-pro";
const ec = (entity: string, extra: Record<string, unknown> = {}) => ({
  type: "custom:entity-card-pro",
  entity,
  ...extra,
});
const ROOMS = ["living_room", "kitchen", "bedroom", "office"].map((r) =>
  ec(`sensor.${r}_temperature`),
);
const LIGHTS = ["living_room", "kitchen", "dining_table", "office", "bedroom", "hallway"].map((r) =>
  ec(`light.${r}`),
);

// the strip: its scroll, its size and its items' boxes (0 wide for a hidden one)
const strip = (page: Page) =>
  page.evaluate(() => {
    const el = window.pc.card(0);
    const body = el.shadowRoot!.querySelector<HTMLElement>(".body")!;
    const b = body.getBoundingClientRect();
    return {
      left: body.scrollLeft,
      max: body.scrollWidth - body.clientWidth,
      x: Math.round(b.x),
      w: Math.round(b.width),
      items: [...body.querySelectorAll<HTMLElement>(".item")].map((it) => {
        const r = it.getBoundingClientRect();
        return {
          x: Math.round(r.x),
          y: Math.round(r.y),
          w: Math.round(r.width),
          h: Math.round(r.height),
          at: it.offsetLeft,
        };
      }),
    };
  });
// the dots: "●" for the current one, "○" for the others; "" when they are hidden
const dots = (page: Page) =>
  page.evaluate(() => {
    const box = window.pc.card(0).shadowRoot!.querySelector<HTMLElement>(".dots")!;
    if (box.hidden) return "";
    return [...box.querySelectorAll(".dot")]
      .map((d) => (d.classList.contains("on") ? "●" : "○"))
      .join("");
  });
const scrollTo = (page: Page, left: number) =>
  page.evaluate((x) => {
    const body = window.pc.card(0).shadowRoot!.querySelector<HTMLElement>(".body")!;
    body.scrollTo({ left: x, behavior: "instant" });
  }, left);
const resize = async (page: Page, width: number) => {
  await page.evaluate((w) => (window.pc.root.style.width = `${w}px`), width);
  await page.waitForTimeout(150);
};

test.describe("swipe-card-pro", () => {
  test.beforeEach(async ({ page }) => {
    // a tapped dot scrolls at once, not smoothly
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("shows a card and the start of the next, a dot per card", async ({ page }) => {
    await mount(page, { type: SW, gap: 8, cards: ROOMS }, { width: 400 });
    const s = await strip(page);
    const [a, b] = s.items;
    // one card, the gap and 0.15 of the next fill the strip
    expect(Math.abs(a.w - (s.w - 8) / 1.15)).toBeLessThanOrEqual(1);
    expect(b.x).toBe(a.x + a.w + 8);
    expect(b.x).toBeLessThan(s.x + s.w);
    expect(await dots(page)).toBe("●○○○");
    await expect(page.locator("swipe-card-pro .dot").first()).toHaveAttribute(
      "aria-label",
      "Page 1 of 4",
    );
    await expect(page.locator("swipe-card-pro .dot").first()).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  test("the current dot follows the scroll", async ({ page }) => {
    await mount(page, { type: SW, cards: ROOMS }, { width: 400 });
    const { items } = await strip(page);
    await scrollTo(page, items[2].at);
    await expect.poll(() => dots(page)).toBe("○○●○");
    // halfway between two cards: the nearer one
    await scrollTo(page, items[1].at - 10);
    await expect.poll(() => dots(page)).toBe("○●○○");
  });

  test("a tapped dot scrolls to its card", async ({ page }) => {
    await mount(page, { type: SW, cards: ROOMS }, { width: 400 });
    const { items } = await strip(page);
    await page.locator("swipe-card-pro .dot").nth(1).click();
    await expect.poll(async () => (await strip(page)).left).toBe(items[1].at);
    await expect.poll(() => dots(page)).toBe("○●○○");
    // the last card cannot reach the start: its dot is the end of the strip
    await page.locator("swipe-card-pro .dot").nth(3).click();
    const end = await strip(page);
    await expect.poll(async () => (await strip(page)).left).toBe(end.max);
    await expect.poll(() => dots(page)).toBe("○○○●");
  });

  test("fits small cards two and a half to a page, the last ones sharing the last dot", async ({
    page,
  }) => {
    await mount(page, { type: SW, per_page: 2.5, gap: 8, cards: LIGHTS }, { width: 400 });
    const s = await strip(page);
    expect(Math.abs(s.items[0].w - (s.w - 16) / 2.5)).toBeLessThanOrEqual(1);
    // six cards, two and a half on a page: stops at the first four and the end
    expect(await dots(page)).toBe("●○○○○");
  });

  test("shows no dots when every card fits on one page; fewer cards fill the strip", async ({
    page,
  }) => {
    await mount(page, { type: SW, per_page: 3, gap: 8, cards: LIGHTS.slice(0, 2) }, { width: 400 });
    const s = await strip(page);
    expect(Math.abs(s.items[0].w - (s.w - 8) / 2)).toBeLessThanOrEqual(1);
    expect(s.max).toBe(0);
    expect(await dots(page)).toBe("");
    // nothing to scroll: no tab stop of its own
    await expect(page.getByRole("region", { name: "Cards" })).toHaveCount(0);
    expect(await page.locator("swipe-card-pro .root > .body").getAttribute("tabindex")).toBeNull();
    // no dots, yet the strip scrolls: it takes the focus
    await mount(page, { type: SW, indicator: "none", cards: ROOMS }, { width: 400 });
    expect(await dots(page)).toBe("");
    await expect(page.getByRole("region", { name: "Cards" })).toHaveCount(1);
  });

  test("centres the current card for snap: center", async ({ page }) => {
    await mount(page, { type: SW, per_page: 1.3, snap: "center", cards: LIGHTS }, { width: 400 });
    await page.locator("swipe-card-pro .dot").nth(2).click();
    await expect
      .poll(async () => {
        const s = await strip(page);
        const c = s.items[2];
        return Math.abs(c.x + c.w / 2 - (s.x + s.w / 2));
      })
      .toBeLessThanOrEqual(1);
    await expect.poll(() => dots(page)).toBe("○○●○○○");
  });

  test("insets the strip by its padding, where a card also stops", async ({ page }) => {
    await mount(page, { type: SW, padding: [0, 16], cards: ROOMS }, { width: 400 });
    const s = await strip(page);
    expect(s.items[0].x).toBe(s.x + 16);
    await page.locator("swipe-card-pro .dot").nth(1).click();
    await expect.poll(async () => (await strip(page)).items[1].x).toBe(s.x + 16);
  });

  test("makes every card as tall as the tallest unless height: auto", async ({ page }) => {
    const cards = [ec("light.kitchen"), ec("sensor.outdoor_temperature", { visual: "sparkline" })];
    await mount(page, { type: SW, per_page: 2, cards }, { width: 400 });
    const [a, b] = (await strip(page)).items;
    expect(a.h).toBe(b.h);
    await mount(page, { type: SW, per_page: 2, height: "auto", cards }, { width: 400 });
    const [c, d] = (await strip(page)).items;
    expect(c.h).toBeLessThan(d.h);
  });

  test("a hidden card leaves the strip and takes its dot", async ({ page }) => {
    // the kitchen light is off in the demo world
    const cards = [...ROOMS];
    cards[1] = ec("light.kitchen", {
      visibility: [{ condition: "state", entity: "light.kitchen", state: "on" }],
    });
    await mount(page, { type: SW, cards }, { width: 400 });
    expect(await dots(page)).toBe("●○○");
    await setState(page, "light.kitchen", "on");
    await expect.poll(() => dots(page)).toBe("●○○○");
    await setState(page, "light.kitchen", "off");
    await expect.poll(() => dots(page)).toBe("●○○");
  });

  test("takes more cards per page at a breakpoint, and the dots follow", async ({ page }) => {
    const cfg = { type: SW, gap: 8, breakpoints: { 2: { per_page: 2.5 } }, cards: LIGHTS };
    await mount(page, cfg, { width: 400 });
    expect(await dots(page)).toBe("●○○○○○");
    await resize(page, 1000);
    // two view columns: two and a half cards to a page, six cards stop at the first four and the end
    await expect.poll(() => dots(page)).toBe("●○○○○");
    const s = await strip(page);
    expect(Math.abs(s.items[0].w - (s.w - 16) / 2.5)).toBeLessThanOrEqual(1);
  });

  test("unfolds into a grid at a breakpoint", async ({ page }) => {
    await mount(
      page,
      { type: SW, breakpoints: { 2: { unfold: 4 } }, cards: ROOMS },
      { width: 1000 },
    );
    const wide = await strip(page);
    expect(new Set(wide.items.map((i) => i.y)).size).toBe(1);
    expect(wide.max).toBe(0);
    expect(await dots(page)).toBe("");
    await resize(page, 400);
    await expect.poll(() => dots(page)).toBe("●○○○");
    const narrow = await strip(page);
    expect(narrow.max).toBeGreaterThan(0);
  });

  test("the strip takes the keyboard focus and scrolls with the arrow keys", async ({ page }) => {
    await mount(page, { type: SW, cards: ROOMS }, { width: 400 });
    const body = page.getByRole("region", { name: "Cards" });
    await body.focus();
    await page.keyboard.press("ArrowRight");
    await expect.poll(async () => (await strip(page)).left).toBeGreaterThan(0);
    await expect.poll(() => dots(page)).toBe("○●○○");
  });

  test("scrolls from the right in a right-to-left language", async ({ page }) => {
    await mount(page, { type: SW, cards: [] });
    await page.evaluate(() => (window.pc.root.dir = "rtl"));
    await mount(page, { type: SW, cards: ROOMS }, { width: 400 });
    const s = await strip(page);
    // the first card at the right edge, the next peeking in on the left
    expect(s.items[0].x + s.items[0].w).toBe(s.x + s.w);
    expect(s.items[1].x).toBeLessThan(s.items[0].x);
    expect(await dots(page)).toBe("●○○○");
    await page.locator("swipe-card-pro .dot").nth(2).click();
    await expect
      .poll(async () => {
        const t = await strip(page);
        return t.items[2].x + t.items[2].w - (t.x + t.w);
      })
      .toBe(0);
    expect((await strip(page)).left).toBeLessThan(0);
    await expect.poll(() => dots(page)).toBe("○○●○");
  });

  test("shows its dots again after Home Assistant hid it and it was laid out meanwhile", async ({
    page,
  }) => {
    // in a layout card, whose hui-card hides it by its own visibility
    const nested = () =>
      page.evaluate(() => {
        const hui = window.pc.card(0).shadowRoot!.querySelector("hui-card")!;
        const box = hui.firstElementChild!.shadowRoot!.querySelector<HTMLElement>(".dots")!;
        return box.hidden ? "" : String(box.querySelectorAll(".dot").length);
      });
    // the kitchen light is off in the demo world: the swipe card shows
    await mount(
      page,
      {
        type: "custom:layout-card-pro",
        cards: [
          {
            type: SW,
            cards: ROOMS,
            visibility: [{ condition: "state", entity: "light.kitchen", state: "off" }],
          },
        ],
      },
      { width: 400 },
    );
    expect(await nested()).toBe("4");
    await setState(page, "light.kitchen", "on");
    // a relayout while hidden (the language) measures nothing
    await setLanguage(page, "de");
    await page.waitForTimeout(100);
    await setState(page, "light.kitchen", "off");
    await expect.poll(nested).toBe("4");
  });
});
