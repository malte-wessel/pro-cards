import { describe, it, expect } from "vitest";
import { defineHuiElements } from "../../docs/.vitepress/theme/ha-shim/hui-card.ts";
import { snapshot } from "../../docs/.vitepress/theme/ha-shim/hass.ts";
import { LayoutCard } from "../../src/layout-card.ts";
import "../../src/entity-card.ts";
import {
  activeBreakpoint,
  HYSTERESIS_PX,
  pick,
  resolveOptions,
  shownAt,
  watchedQueries,
} from "../../src/layout/breakpoints.ts";
import { childKey, reconcile } from "../../src/layout/children.ts";
import { normalizeLayoutConfig, type LayoutConfig } from "../../src/layout/config.ts";
import { foldPlan } from "../../src/layout/fold.ts";
import { distribute, tallest } from "../../src/layout/masonry.ts";
import { cardSize, planLayout, type KidState, type PlanCtx } from "../../src/layout/place.ts";
import {
  autoFitCount,
  autoFitTemplate,
  boxSides,
  cssLength,
  toPx,
  trackCount,
  trackList,
  trackTokens,
} from "../../src/layout/units.ts";
import type { HuiCardElement } from "../../src/shared/ha.ts";

defineHuiElements();

const cfg = (raw: Record<string, unknown>) =>
  normalizeLayoutConfig({ type: "custom:layout-card-pro", ...raw });
const at = (c: LayoutConfig, active: string, media: string[] = [], coarse = false) =>
  resolveOptions(c, { active, media: (q) => media.includes(q), coarse });

describe("layout-card units", () => {
  it("reads lengths", () => {
    expect(cssLength(8, "gap")).toBe("8px");
    expect(cssLength("8", "gap")).toBe("8px");
    expect(cssLength("0.5rem", "gap")).toBe("0.5rem");
    expect(cssLength("var(--ha-space-2)", "gap")).toBe("var(--ha-space-2)");
    expect(cssLength(-16, "margin", { negative: true })).toBe("-16px");
    expect(() => cssLength(-16, "gap")).toThrow("'gap' must be a length");
    expect(() => cssLength("wide", "gap")).toThrow("layout-card-pro: 'gap' must be a length");
  });
  it("reads sides like the CSS shorthand", () => {
    expect(boxSides(12, "padding", false)).toEqual(["12px", "12px", "12px", "12px"]);
    expect(boxSides([0, 16], "padding", false)).toEqual(["0px", "16px", "0px", "16px"]);
    expect(boxSides([1, 2, 3, 4], "padding", false)).toEqual(["1px", "2px", "3px", "4px"]);
    expect(boxSides({ top: 24 }, "padding", false)).toEqual(["24px", "0px", "0px", "0px"]);
    expect(() => boxSides([1, 2, 3], "padding", false)).toThrow("1, 2 or 4 values");
    expect(() => boxSides({ up: 1 }, "padding", false)).toThrow("'padding.up' is not a side");
  });
  it("turns columns into tracks, never sized by the content", () => {
    expect(trackList(3)).toBe("repeat(3, minmax(0, 1fr))");
    expect(trackTokens(["1fr", "2fr", 320, "minmax(200px, 1fr)"], "columns")).toEqual([
      "minmax(0, 1fr)",
      "minmax(0, 2fr)",
      "320px",
      "minmax(200px, 1fr)",
    ]);
    expect(() => trackTokens(["auto", "1fr"], "columns")).toThrow(
      "'columns[0]' must be a length or fr",
    );
    expect(() => trackTokens([], "columns")).toThrow("a list of tracks such as [1fr, 2fr]");
  });
  it("fits as many columns as there is room for", () => {
    expect(autoFitTemplate("180px", null, "8px")).toBe(
      "repeat(auto-fill, minmax(min(100%, 180px), 1fr))",
    );
    expect(autoFitTemplate("180px", 3, "8px")).toContain("calc((100% - 2 * 8px) / 3)");
    expect(autoFitCount(420, 180, 8, null)).toBe(2);
    expect(autoFitCount(560, 180, 8, null)).toBe(3);
    expect(autoFitCount(2000, 180, 8, 4)).toBe(4);
    expect(autoFitCount(100, 180, 8, null)).toBe(1);
    expect(toPx("12rem")).toBe(192);
    expect(toPx("var(--x)")).toBeNull();
    expect(trackCount("120px 120px 120px")).toBe(3);
    expect(trackCount("repeat(auto-fill, minmax(0, 1fr))")).toBeNull();
  });
});

describe("layout-card config", () => {
  it("has a mobile-first base with the default breakpoints", () => {
    const c = cfg({ cards: [] });
    expect(c.order).toEqual(["phone", "tablet", "desktop", "wide"]);
    expect(c.base).toMatchObject({ layout: "grid", columns: 1, card_style: "cards" });
    expect(c.container).toBe(true);
  });
  it("lets breakpoints be renamed, moved and dropped", () => {
    const c = cfg({
      breakpoints: { tablet: 500, wide: false, kiosk: { min_width: 1800, columns: 6 } },
    });
    expect(c.breakpoints.map((b) => [b.name, b.min])).toEqual([
      ["tablet", 500],
      ["desktop", 1024],
      ["kiosk", 1800],
    ]);
    expect(c.breakpoints[2].overrides).toEqual({ columns: 6 });
  });
  it("explains a bad config in English", () => {
    expect(() => cfg({ cards: {} })).toThrow(
      "layout-card-pro: 'cards' must be a list of card configs",
    );
    expect(() => cfg({ columns: 0 })).toThrow("'columns' must be a whole number from 1 to 24");
    expect(() => cfg({ breakpoints: { tabelt: { columns: 2 } } })).toThrow(
      "breakpoint 'tabelt' needs a min_width (the defaults are tablet, desktop, wide)",
    );
    expect(() => cfg({ breakpoints: { phone: { columns: 2 } } })).toThrow("'phone' is the base");
    expect(() => cfg({ breakpoints: { tablet: { colums: 2 } } })).toThrow(
      "'breakpoints.tablet.colums' is not a layout option",
    );
    expect(() => cfg({ media: [{ columns: 1 }] })).toThrow("'media[0]' needs a 'query'");
    expect(() => cfg({ cards: [{ type: "tile", view_layout: { span: [1, 2, 3] } }] })).toThrow(
      "cards[0].view_layout.span must be a number, [columns, rows] or full",
    );
    expect(() => cfg({ cards: [{ type: "tile", view_layout: { show_on: ["desk"] } }] })).toThrow(
      "cards[0].view_layout.show_on names an unknown breakpoint 'desk'",
    );
    expect(() => cfg({ cards: [{ type: "tile", view_layout: { spam: 2 } }] })).toThrow(
      "cards[0].view_layout.spam is not a placement option",
    );
    expect(() => cfg({ cards: ["tile"] })).toThrow("cards[0] must be a card config with a 'type'");
    expect(() =>
      cfg({ cards: [{ type: "tile", view_layout: { hidden_below: ["tablet"] } }] }),
    ).toThrow("cards[0].view_layout.hidden_below must be one breakpoint name");
  });
  it("splits gap into its two directions, row_gap and column_gap winning", () => {
    expect(cfg({ gap: [8, 12] }).base).toMatchObject({ row_gap: "8px", column_gap: "12px" });
    expect(cfg({ row_gap: 4, gap: 8 }).base).toMatchObject({ row_gap: "4px", column_gap: "8px" });
  });
  it("reads per-card placement, per breakpoint where it is a map", () => {
    const c = cfg({
      cards: [
        {
          type: "tile",
          view_layout: {
            span: { phone: 1, desktop: [2, 2] },
            sticky: true,
            aspect: "16/9",
            priority: "low",
            hidden_below: "tablet",
            position: "main", // Home Assistant's own, kept
          },
        },
      ],
    });
    const p = c.children[0].place;
    expect(p.span.by).toEqual({ phone: { cols: 1, rows: null }, desktop: { cols: 2, rows: 2 } });
    expect(p.sticky.all).toBe("var(--header-height, 0px)");
    expect(p.aspect.all).toBe("16 / 9");
    expect(p.priority).toBe("low");
    expect(p.hidden_below).toBe("tablet");
  });
});

describe("layout-card breakpoints", () => {
  const c = cfg({
    columns: 1,
    gap: 6,
    breakpoints: { tablet: { columns: 2, gap: 8 }, desktop: { columns: 4 } },
    media: [
      { query: "(orientation: portrait)", columns: 1 },
      { query: "(pointer: coarse)", density: "roomy" },
    ],
  });
  it("picks the widest breakpoint reached", () => {
    expect(activeBreakpoint(0, c.breakpoints)).toBe("phone");
    expect(activeBreakpoint(600, c.breakpoints)).toBe("tablet");
    expect(activeBreakpoint(1100, c.breakpoints)).toBe("desktop");
    expect(activeBreakpoint(1500, c.breakpoints)).toBe("wide");
  });
  it("keeps the wider breakpoint while a scrollbar takes a few pixels", () => {
    expect(activeBreakpoint(600 - 10, c.breakpoints, "tablet")).toBe("tablet");
    expect(activeBreakpoint(600 - HYSTERESIS_PX - 1, c.breakpoints, "tablet")).toBe("phone");
    // growing is not delayed
    expect(activeBreakpoint(600, c.breakpoints, "phone")).toBe("tablet");
  });
  it("cascades from the base up to the active breakpoint", () => {
    expect(at(c, "phone")).toMatchObject({ columns: 1, row_gap: "6px" });
    expect(at(c, "tablet")).toMatchObject({ columns: 2, row_gap: "8px" });
    expect(at(c, "wide")).toMatchObject({ columns: 4, row_gap: "8px" });
  });
  it("applies the first matching media rule unless it merges", () => {
    expect(at(c, "desktop", ["(orientation: portrait)", "(pointer: coarse)"])).toMatchObject({
      columns: 1,
      density: "default",
    });
    const merged = cfg({
      media: [
        { query: "a", merge: true, columns: 3 },
        { query: "b", gap: 2 },
      ],
    });
    expect(at(merged, "phone", ["a", "b"])).toMatchObject({ columns: 3, row_gap: "2px" });
  });
  it("makes density auto roomy on a touch screen", () => {
    const d = cfg({ density: "auto" });
    expect(at(d, "phone", [], true).density).toBe("roomy");
    expect(at(d, "phone", [], false).density).toBe("default");
    expect(watchedQueries(d)).toEqual(["(pointer: coarse)"]);
    expect(watchedQueries(cfg({ container: false }))).toEqual([
      "(min-width: 600px)",
      "(min-width: 1024px)",
      "(min-width: 1440px)",
    ]);
  });
  it("inherits a card's value from the nearest smaller breakpoint", () => {
    const order = ["phone", "tablet", "desktop"];
    expect(pick({ by: { phone: 1, desktop: 3 } }, "tablet", order)).toBe(1);
    expect(pick({ by: { desktop: 3 } }, "tablet", order)).toBeUndefined();
    expect(pick({ all: 2, by: {} }, "desktop", order)).toBe(2);
  });
  it("shows a card only on its breakpoints", () => {
    const [a, b] = cfg({
      cards: [
        { type: "tile", view_layout: { show_on: ["tablet", "wide"] } },
        { type: "tile", view_layout: { hidden_below: "desktop" } },
      ],
    }).children.map((x) => x.place);
    expect(shownAt(a, "tablet", c.order)).toBe(true);
    expect(shownAt(a, "desktop", c.order)).toBe(false);
    expect(shownAt(b, "tablet", c.order)).toBe(false);
    expect(shownAt(b, "wide", c.order)).toBe(true);
  });
});

describe("layout-card fold and masonry", () => {
  it("folds low before normal from the end, never high", () => {
    const items = (["high", "low", "normal", "low", "normal"] as const).map((priority) => ({
      priority,
      shown: true,
    }));
    expect(foldPlan(items, 3)).toEqual([false, true, false, true, false]);
    expect(foldPlan(items, 2)).toEqual([false, true, false, true, true]);
    expect(foldPlan(items, 0)).toEqual([false, true, true, true, true]);
    expect(foldPlan(items, null)).toEqual([false, false, false, false, false]);
    // hidden cards do not count
    expect(
      foldPlan(
        [
          { priority: "low", shown: false },
          { priority: "low", shown: true },
        ],
        1,
      ),
    ).toEqual([false, false]);
  });
  it("deals cards to the shortest column, pins first", () => {
    const it = (size: number, pin: number | null = null, shown = true) => ({ size, pin, shown });
    expect(distribute([it(3), it(1), it(1), it(1)], 2)).toEqual([0, 1, 1, 1]);
    expect(distribute([it(1), it(1, 2), it(1, 9)], 2)).toEqual([0, 1, 1]);
    expect(distribute([it(1, null, false), it(2)], 2)).toEqual([-1, 0]);
    expect(tallest([{ size: 3 }, { size: 1 }, { size: 1 }], [0, 1, 1], 2)).toBe(3);
  });
});

describe("layout-card plan", () => {
  const kid = (c: LayoutConfig, i: number, over: Partial<KidState> = {}): KidState => ({
    place: c.children[i].place,
    visible: true,
    size: 2,
    ...over,
  });
  const ctx = (over: Partial<PlanCtx> = {}): PlanCtx => ({
    active: "phone",
    order: ["phone", "tablet", "desktop", "wide"],
    preview: false,
    expanded: false,
    width: 400,
    cols: null,
    ...over,
  });
  it("lays a grid out with spans clamped to the columns", () => {
    const c = cfg({
      columns: 3,
      cards: [
        { type: "a", view_layout: { span: 5 } },
        { type: "b", view_layout: { span: "full" } },
        { type: "c", view_layout: { column: 3, span: 2 } },
      ],
    });
    const plan = planLayout(c.base, [kid(c, 0), kid(c, 1), kid(c, 2)], ctx());
    expect(plan.body["grid-template-columns"]).toBe("repeat(3, minmax(0, 1fr))");
    expect(plan.items.map((i) => i.style["grid-column"])).toEqual([
      "span 3",
      "1 / -1",
      "2 / span 2",
    ]);
    // HA's grid mode only where the rows are fixed
    expect(plan.items.every((i) => !i.gridLayout)).toBe(true);
  });
  it("sizes fixed rows like the sections grid", () => {
    const c = cfg({
      columns: 2,
      row_height: 56,
      cards: [{ type: "a", view_layout: { span: [1, 2] } }, { type: "b" }],
    });
    const plan = planLayout(
      c.base,
      [kid(c, 0), kid(c, 1, { grid: { rows: 3 } }), kid(c, 1, { grid: { rows: "auto" } })],
      ctx(),
    );
    expect(plan.items[0].style.height).toBe(
      "calc(2 * 56px + 1 * var(--ha-section-grid-row-gap, 8px))",
    );
    expect(plan.items[1].style["grid-row"]).toBe("span 3");
    // HA's grid mode only for the cards the rows give a height
    expect(plan.items.map((i) => i.gridLayout)).toEqual([true, true, false]);
  });
  it("sizes cards by their own grid options in 12 columns", () => {
    const c = cfg({ columns: 12, cards: [{ type: "tile" }, { type: "heading" }] });
    const plan = planLayout(
      c.base,
      [
        kid(c, 0, { grid: { columns: 6 } }),
        kid(c, 1, { grid: { columns: "full" } }),
        kid(c, 0, { grid: {} }), // none named: the whole row, as in a section
        kid(c, 0, { grid: { columns: 2, min_columns: 4 } }),
      ],
      ctx(),
    );
    expect(plan.items.map((i) => i.style["grid-column"])).toEqual([
      "span 6",
      "1 / -1",
      "span 12",
      "span 4",
    ]);
  });
  it("hides cards without a gap and folds the surplus", () => {
    const c = cfg({
      fold: { max_cards: 2 },
      cards: [
        { type: "a" },
        { type: "b", view_layout: { priority: "low" } },
        { type: "c" },
        { type: "d", view_layout: { hidden_below: "tablet" } },
      ],
    });
    const kids = [kid(c, 0), kid(c, 1), kid(c, 2, { visible: false }), kid(c, 3)];
    const plan = planLayout(c.base, kids, ctx());
    expect(plan.items.map((i) => i.shown)).toEqual([true, true, false, false]);
    expect(plan.folded).toBe(0);
    const three = planLayout(c.base, [kid(c, 0), kid(c, 1), kid(c, 2)], ctx());
    expect(three.items.map((i) => i.shown)).toEqual([true, false, true]);
    expect(three.folded).toBe(1);
    expect(
      planLayout(c.base, [kid(c, 0), kid(c, 1), kid(c, 2)], ctx({ expanded: true })).items.every(
        (i) => i.shown,
      ),
    ).toBe(true);
    // the editor shows everything, faded where it would not show
    const prev = planLayout(c.base, kids, ctx({ preview: true }));
    expect(prev.items.map((i) => [i.shown, i.ghost])).toEqual([
      [true, false],
      [true, false],
      [true, false],
      [true, true],
    ]);
  });
  it("stacks across with equal widths and seamless surfaces", () => {
    const c = cfg({
      layout: "stack",
      direction: "across",
      card_style: "seamless",
      cards: [{ type: "a" }, { type: "b", view_layout: { span: 2 } }],
    });
    const plan = planLayout(c.base, [kid(c, 0), kid(c, 1)], ctx());
    expect(plan.rootClass).toEqual(["layout-stack", "seamless", "across"]);
    expect(plan.body["flex-direction"]).toBe("row");
    expect(plan.items.map((i) => i.style.flex)).toEqual(["1 1 0px", "2 1 0px"]);
    expect(plan.root["--pl-col-gap"]).toBe("0px");
  });
  it("deals masonry cards in their order", () => {
    const c = cfg({
      layout: "masonry",
      columns: 2,
      cards: [{ type: "a" }, { type: "b" }, { type: "c", view_layout: { order: -1 } }],
    });
    const plan = planLayout(c.base, [kid(c, 0, { size: 4 }), kid(c, 1), kid(c, 2)], ctx());
    expect(plan.sequence).toEqual([2, 0, 1]);
    expect(plan.items.map((i) => i.column)).toEqual([1, 0, 0]);
    expect(cardSize(c.base, [kid(c, 0, { size: 4 }), kid(c, 1), kid(c, 2)], plan)).toBe(4);
  });
  it("counts the card size per layout", () => {
    const c = cfg({ columns: 2, cards: [{ type: "a" }, { type: "b" }, { type: "c" }] });
    const kids = [kid(c, 0, { size: 3 }), kid(c, 1, { size: 1 }), kid(c, 2, { size: 2 })];
    expect(cardSize(c.base, kids, planLayout(c.base, kids, ctx()))).toBe(5);
    const s = cfg({ layout: "stack", cards: [{ type: "a" }, { type: "b" }, { type: "c" }] });
    expect(cardSize(s.base, kids, planLayout(s.base, kids, ctx()))).toBe(6);
  });
});

describe("layout-card children", () => {
  it("keys a config without its placement", () => {
    expect(childKey({ type: "tile", entity: "a", view_layout: { span: 2 } })).toBe(
      childKey({ entity: "a", type: "tile" }),
    );
  });
  it("reuses cards across a reorder, an edit, an insert and a removal", () => {
    expect(reconcile(["a", "b", "c"], ["c", "a", "b"])).toEqual([2, 0, 1]);
    expect(reconcile(["a", "b"], ["a", "b2"])).toEqual([0, 1]);
    expect(reconcile(["a", "b"], ["a", "x", "b"])).toEqual([0, null, 1]);
    expect(reconcile(["a", "b", "c"], ["a", "c"])).toEqual([0, 2]);
  });
});

describe("layout-card-pro element", () => {
  const make = (raw: Record<string, unknown>) => {
    const el = document.createElement("layout-card-pro") as LayoutCard;
    el.setConfig({ type: "custom:layout-card-pro", ...raw });
    el.hass = snapshot();
    document.body.appendChild(el);
    return el;
  };
  const huis = (el: LayoutCard) => [...el.shadowRoot!.querySelectorAll<HuiCardElement>("hui-card")];

  it("is registered and sizes itself like a section card", () => {
    expect(customElements.get("layout-card-pro")).toBe(LayoutCard);
    expect(window.customCards?.some((c) => c.type === "layout-card-pro")).toBe(true);
    const el = make({ cards: [] });
    expect(el.getGridOptions()).toEqual({ columns: "full", rows: "auto" });
    expect(el.connectedWhileHidden).toBe(true);
    expect(() => el.setConfig({ type: "custom:layout-card-pro", columns: "x" })).toThrow(
      "layout-card-pro:",
    );
    el.remove();
  });
  it("hosts each card in a hui-card and keeps it through hass and placement changes", () => {
    const tile = { type: "custom:entity-card-pro", entity: "sensor.outdoor_temperature" };
    const el = make({
      columns: 2,
      cards: [tile, { ...tile, entity: "sensor.living_room_humidity" }],
    });
    const before = huis(el);
    expect(before).toHaveLength(2);
    expect(before[0].firstElementChild?.localName).toBe("entity-card-pro");
    el.hass = snapshot();
    el.setConfig({
      type: "custom:layout-card-pro",
      columns: 2,
      cards: [
        { ...tile, view_layout: { span: 2 } },
        { ...tile, entity: "sensor.living_room_humidity" },
      ],
    });
    expect(huis(el)).toEqual(before);
    const item = before[0].parentElement!;
    expect(item.style.getPropertyValue("grid-column")).toBe("span 2");
    el.remove();
  });
  it("reflows when a card's visibility hides it, and hides itself when all are hidden", async () => {
    const el = make({
      cards: [
        {
          type: "custom:entity-card-pro",
          entity: "light.kitchen",
          visibility: [{ condition: "state", entity: "light.kitchen", state: "nope" }],
        },
      ],
    });
    const [hui] = huis(el);
    expect(hui.hidden).toBe(true);
    expect(hui.parentElement!.classList.contains("off")).toBe(true);
    expect(el.hasAttribute("hidden")).toBe(true);
    // the editor shows it anyway
    el.preview = true;
    expect(el.hasAttribute("hidden")).toBe(false);
    el.remove();
  });
  it("folds into a +N more row that opens", () => {
    const card = (e: string) => ({
      type: "custom:entity-card-pro",
      entity: e,
      view_layout: { priority: "low" },
    });
    const el = make({
      fold: { max_cards: 1 },
      cards: [
        card("sensor.outdoor_temperature"),
        card("sensor.living_room_humidity"),
        card("light.kitchen"),
      ],
    });
    const fold = el.shadowRoot!.querySelector<HTMLButtonElement>(".fold")!;
    expect(fold.hidden).toBe(false);
    expect(fold.querySelector("span")!.textContent).toBe("2 more");
    const items = [...el.shadowRoot!.querySelectorAll(".item")];
    expect(items.map((i) => i.classList.contains("off"))).toEqual([false, true, true]);
    // folded cards stay on the page
    expect(huis(el).every((h) => h.isConnected)).toBe(true);
    fold.click();
    expect(fold.querySelector("span")!.textContent).toBe("Show less");
    expect(items.some((i) => i.classList.contains("off"))).toBe(false);
    el.remove();
  });
});
