// The layout card in a browser: its cards in hui-cards, laid out by the breakpoints of its own
// width, with Home Assistant's visibility, seamless surfaces and fixed rows.
import type { Page } from "@playwright/test";
import { test, expect, mount, setState } from "./util";

const LC = "custom:layout-card-pro";
const ec = (
  entity: string,
  view_layout?: Record<string, unknown>,
  extra: Record<string, unknown> = {},
) => ({
  type: "custom:entity-card-pro",
  entity,
  ...(view_layout ? { view_layout } : {}),
  ...extra,
});
const T = "sensor.outdoor_temperature",
  H = "sensor.outdoor_humidity",
  K = "light.kitchen",
  P = "sensor.pressure";

// the boxes of the layout card's items (0 for a hidden one)
const boxes = (page: Page) =>
  page.evaluate(() => {
    const el = window.pc.card(0);
    return [...el.shadowRoot!.querySelectorAll<HTMLElement>(".body .item")].map((it) => {
      const b = it.getBoundingClientRect();
      return {
        x: Math.round(b.x),
        y: Math.round(b.y),
        w: Math.round(b.width),
        h: Math.round(b.height),
      };
    });
  });
const items = async (page: Page) => (await boxes(page)).filter((b) => b.w > 0);
const resize = async (page: Page, width: number) => {
  await page.evaluate((w) => (window.pc.root.style.width = `${w}px`), width);
  await page.waitForTimeout(150);
};

test.describe("layout-card-pro", () => {
  test("lays cards out in columns and tracks", async ({ page }) => {
    await mount(page, { type: LC, columns: 2, cards: [ec(T), ec(H), ec(K)] }, { width: 432 });
    const [a, b, c] = await items(page);
    expect(a.y).toBe(b.y);
    expect(a.w).toBe(b.w);
    expect(c.y).toBeGreaterThan(a.y);
    await mount(
      page,
      { type: LC, columns: ["1fr", "2fr"], gap: 0, cards: [ec(T), ec(H)] },
      { width: 432 },
    );
    const [x, y] = await items(page);
    expect(Math.abs(y.w - 2 * x.w)).toBeLessThanOrEqual(1);
  });

  test("shrinks a span wider than the grid and moves a start column so the card fits", async ({
    page,
  }) => {
    const cfg = {
      type: LC,
      columns: 2,
      cards: [ec(T, { span: 3 }), ec(H), ec(K, { column: 3 })],
    };
    await mount(page, cfg, { width: 432 });
    const [a, b, c] = await items(page);
    // 400 px inside, two columns: the span of 3 fills the row without overflowing
    expect(a.w).toBe(400);
    expect(b.w).toBe(196);
    // column 3 does not exist: the card goes to the last one
    expect(c.x).toBe(a.x + 196 + 8);
  });

  test("switches its layout at the breakpoints of its own width", async ({ page }) => {
    const cfg = {
      type: LC,
      columns: 1,
      breakpoints: { tablet: { min_width: 500, columns: 3 } },
      cards: [ec(T), ec(H), ec(K)],
    };
    await mount(page, cfg, { width: 432 });
    let r = await items(page);
    expect(new Set(r.map((b) => b.x)).size).toBe(1);
    await resize(page, 700);
    r = await items(page);
    expect(new Set(r.map((b) => b.y)).size).toBe(1);
  });

  test("gives fixed rows a definite height the card fills", async ({ page }) => {
    await mount(
      page,
      { type: LC, columns: 2, row_height: 56, gap: 8, cards: [ec(T, { span: [1, 2] }), ec(H)] },
      { width: 432 },
    );
    const [a] = await items(page);
    expect(a.h).toBe(2 * 56 + 8);
    const card = await page.evaluate(() => {
      const hui = window.pc.card(0).shadowRoot!.querySelector("hui-card")!;
      return Math.round(hui.firstElementChild!.getBoundingClientRect().height);
    });
    expect(card).toBe(120);
  });

  test("stacks down and across", async ({ page }) => {
    await mount(page, { type: LC, layout: "stack", cards: [ec(T), ec(H)] }, { width: 432 });
    let [a, b] = await items(page);
    expect(b.y).toBeGreaterThan(a.y);
    expect(a.w).toBe(b.w);
    await mount(
      page,
      { type: LC, layout: "stack", direction: "across", cards: [ec(T), ec(H, { span: 2 })] },
      { width: 432 },
    );
    [a, b] = await items(page);
    expect(a.y).toBe(b.y);
    expect(Math.abs(b.w - 2 * a.w)).toBeLessThanOrEqual(1);
  });

  test("deals masonry cards to the shortest column, pins first", async ({ page }) => {
    await mount(
      page,
      { type: LC, layout: "masonry", columns: 2, cards: [ec(T), ec(H, { column: 1 }), ec(K)] },
      { width: 432 },
    );
    const cols = await page.evaluate(() =>
      [...window.pc.card(0).shadowRoot!.querySelectorAll(".col")].map((c) => c.children.length),
    );
    expect(cols).toEqual([2, 1]);
  });

  test("leaves no gap for a card Home Assistant hides, and shows it again", async ({ page }) => {
    await setState(page, K, "on").catch(() => {});
    const cfg = {
      type: LC,
      columns: 2,
      cards: [
        ec(K, undefined, { visibility: [{ condition: "state", entity: K, state: "off" }] }),
        ec(T),
        ec(H),
      ],
    };
    await mount(page, cfg, { width: 432 });
    await setState(page, K, "on");
    await page.waitForTimeout(100);
    let r = await items(page);
    expect(r).toHaveLength(2);
    expect(r[0].y).toBe(r[1].y);
    await setState(page, K, "off");
    await page.waitForTimeout(100);
    r = await items(page);
    expect(r).toHaveLength(3);
  });

  test("shows a card only on its breakpoints", async ({ page }) => {
    const cfg = {
      type: LC,
      breakpoints: { tablet: 500 },
      cards: [ec(T), ec(H, { hidden_below: "tablet" }), ec(K, { show_on: ["phone"] })],
    };
    await mount(page, cfg, { width: 432 });
    expect(await items(page)).toHaveLength(2);
    await resize(page, 700);
    expect(await items(page)).toHaveLength(2);
    const shown = await page.evaluate(() =>
      [...window.pc.card(0).shadowRoot!.querySelectorAll(".item")].map(
        (i) => !i.classList.contains("off"),
      ),
    );
    expect(shown).toEqual([true, true, false]);
  });

  test("draws one surface for seamless cards", async ({ page }) => {
    await mount(
      page,
      { type: LC, columns: 2, card_style: "seamless", cards: [ec(T), ec(H)] },
      { width: 432 },
    );
    const look = await page.evaluate(() => {
      const card = window.pc.cards()[0] as HTMLElement;
      const cs = getComputedStyle(card.shadowRoot!.querySelector("ha-card")!);
      return { border: cs.borderTopWidth, bg: cs.backgroundColor };
    });
    expect(look.border).toBe("0px");
    expect(look.bg).toBe("rgba(0, 0, 0, 0)");
    const [a, b] = await items(page);
    expect(b.x).toBe(a.x + a.w); // no gap: the divider sits between them
  });

  test("nests layouts", async ({ page }) => {
    await mount(
      page,
      {
        type: LC,
        columns: 2,
        cards: [ec(T), { type: LC, layout: "stack", cards: [ec(H), ec(K)], view_layout: {} }],
      },
      { width: 432 },
    );
    expect(await page.evaluate(() => window.pc.cards().map((c) => c.localName))).toEqual([
      "entity-card-pro",
      "entity-card-pro",
      "entity-card-pro",
    ]);
  });

  test("hides itself when every card is hidden", async ({ page }) => {
    const cfg = {
      type: LC,
      cards: [ec(K, undefined, { visibility: [{ condition: "state", entity: K, state: "nope" }] })],
    };
    await mount(page, cfg, { width: 432 });
    expect(await page.evaluate(() => window.pc.card(0).hasAttribute("hidden"))).toBe(true);
  });

  test("takes the height of a stretched grid row and of fixed rows, as every card does", async ({
    page,
  }) => {
    const tall = {
      type: "custom:entity-group-card-pro",
      entities: [T, H, K, P, "light.living_room", "light.office"],
      grid_options: { columns: 6 },
    };
    const layout = { type: LC, cards: [ec(T)], grid_options: { columns: 6 } };
    await mount(page, [tall, layout], { width: 432, fullWidth: false });
    const [a, b] = await page.evaluate(() =>
      [0, 1].map((i) => Math.round(window.pc.card(i).getBoundingClientRect().height)),
    );
    expect(b).toBe(a);
    // the card inside fills the layout
    const inner = await page.evaluate(() =>
      Math.round((window.pc.cards()[1] as HTMLElement).getBoundingClientRect().height),
    );
    expect(inner).toBe(a);
    await mount(page, { ...layout, grid_options: { rows: 3 } }, { width: 432 });
    const h = await page.evaluate(() =>
      Math.round(window.pc.cards()[0].getBoundingClientRect().height),
    );
    expect(h).toBe(3 * 56 + 2 * 8);
  });
});
