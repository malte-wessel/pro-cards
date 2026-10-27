import { describe, it, expect } from "vitest";
import { defineHuiElements } from "../../docs/.vitepress/theme/ha-shim/hui-card.ts";
import { snapshot } from "../../docs/.vitepress/theme/ha-shim/hass.ts";
import { LayoutCard } from "../../src/layout-card.ts";
import "../../src/entity-card.ts";
import { pick, resolveOptions } from "../../src/layout/breakpoints.ts";
import { childKey, reconcile } from "../../src/shared/cards/children.ts";
import {
  activeColumns,
  columnsForWidth,
  HYSTERESIS_PX,
} from "../../src/shared/cards/view-columns.ts";
import { normalizeLayoutConfig, type LayoutConfig } from "../../src/layout/config.ts";
import { distribute, tallest } from "../../src/layout/masonry.ts";
import { cardSize, planLayout, type KidState } from "../../src/layout/place.ts";
import { boxSides, cssLength, trackList, trackTokens } from "../../src/layout/units.ts";
import type { HuiCardElement } from "../../src/shared/ha.ts";

defineHuiElements();

const cfg = (raw: Record<string, unknown>) =>
  normalizeLayoutConfig({ type: "custom:layout-card-pro", ...raw });
const at = (c: LayoutConfig, columns: number) => resolveOptions(c, columns);

describe("layout-card units", () => {
  it("reads lengths", () => {
    expect(cssLength(8, "gap")).toBe("8px");
    expect(cssLength("8", "gap")).toBe("8px");
    expect(cssLength("0.5rem", "gap")).toBe("0.5rem");
    expect(cssLength("var(--ha-space-2)", "gap")).toBe("var(--ha-space-2)");
    expect(() => cssLength(-16, "gap")).toThrow("'gap' must be a length");
    expect(() => cssLength("wide", "gap")).toThrow("layout-card-pro: 'gap' must be a length");
  });
  it("reads sides like the CSS shorthand", () => {
    expect(boxSides(12, "padding")).toEqual(["12px", "12px", "12px", "12px"]);
    expect(boxSides([0, 16], "padding")).toEqual(["0px", "16px", "0px", "16px"]);
    expect(boxSides([1, 2, 3, 4], "padding")).toEqual(["1px", "2px", "3px", "4px"]);
    expect(boxSides({ top: 24 }, "padding")).toEqual(["24px", "0px", "0px", "0px"]);
    expect(() => boxSides([1, 2, 3], "padding")).toThrow("1, 2 or 4 values");
    expect(() => boxSides({ up: 1 }, "padding")).toThrow("'padding.up' is not a side");
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
});

describe("layout-card config", () => {
  it("has its base options in one view column and breakpoints by view columns", () => {
    const c = cfg({ columns: 2, breakpoints: { 3: { columns: 6 }, 2: { columns: 4 } }, cards: [] });
    expect(c.base).toMatchObject({ layout: "grid", columns: 2, card_style: "cards" });
    expect(c.breakpoints).toEqual([
      { columns: 2, overrides: { columns: 4 } },
      { columns: 3, overrides: { columns: 6 } },
    ]);
  });
  it("explains a bad config in English", () => {
    expect(() => cfg({ cards: {} })).toThrow(
      "layout-card-pro: 'cards' must be a list of card configs",
    );
    expect(() => cfg({ columns: 0 })).toThrow("'columns' must be a whole number from 1 to 24");
    // the earlier named breakpoints say what the keys are now
    expect(() => cfg({ breakpoints: { tablet: { columns: 2 } } })).toThrow(
      "'breakpoints' is keyed by view columns, 2 to 12 (how many columns of the view the section spans), not 'tablet'",
    );
    expect(() => cfg({ breakpoints: { 1: { columns: 2 } } })).toThrow("not '1'");
    expect(() => cfg({ breakpoints: { 2: 600 } })).toThrow(
      "'breakpoints.2' must be the options that change there",
    );
    expect(() => cfg({ breakpoints: { 2: { colums: 2 } } })).toThrow(
      "'breakpoints.2.colums' is not a layout option",
    );
    expect(() => cfg({ cards: [{ type: "tile", view_layout: { span: [1, 2, 3] } }] })).toThrow(
      "cards[0].view_layout.span must be a number, [columns, rows] or full",
    );
    expect(() => cfg({ cards: [{ type: "tile", view_layout: { span: { desktop: 2 } } }] })).toThrow(
      "cards[0].view_layout.span is keyed by view columns, 1 to 12",
    );
    expect(() => cfg({ cards: [{ type: "tile", view_layout: { spam: 2 } }] })).toThrow(
      "cards[0].view_layout.spam is not a placement option",
    );
    expect(() => cfg({ cards: ["tile"] })).toThrow("cards[0] must be a card config with a 'type'");
  });
  it("splits gap into its two directions", () => {
    expect(cfg({ gap: [8, 12] }).base).toMatchObject({ row_gap: "8px", column_gap: "12px" });
    expect(cfg({ gap: 8 }).base).toMatchObject({ row_gap: "8px", column_gap: "8px" });
  });
  it("takes none of the options that went", () => {
    for (const gone of [
      { layout: "stack" },
      { direction: "across" },
      { row_height: 56 },
      { dense: true },
    ])
      expect(() => cfg({ breakpoints: { 2: gone } })).toThrow();
    for (const gone of ["show_on", "hidden_below", "row", "sticky"])
      expect(() => cfg({ cards: [{ type: "a", view_layout: { [gone]: 2 } }] })).toThrow(
        `cards[0].view_layout.${gone} is not a placement option`,
      );
  });
  it("reads per-card placement, per view columns where it is a map", () => {
    const c = cfg({
      cards: [
        {
          type: "tile",
          view_layout: {
            span: { 1: "full", 3: [2, 2] },
            position: "main", // Home Assistant's own, kept
          },
        },
      ],
    });
    expect(c.children[0].place.span.by).toEqual({
      1: { cols: "full", rows: null },
      3: { cols: 2, rows: 2 },
    });
  });
});

describe("layout-card view columns", () => {
  const c = cfg({
    columns: 1,
    gap: 6,
    breakpoints: { 2: { columns: 2, gap: 8 }, 3: { columns: 4 } },
  });
  it("takes Home Assistant's column span of the section", () => {
    expect(activeColumns("1", 9999)).toBe(1);
    expect(activeColumns(" 3", 100)).toBe(3);
  });
  it("counts the sections view's widest columns from the width outside a section", () => {
    // a column is at most 500 px, 32 px between them
    expect(activeColumns("", 374)).toBe(1);
    expect(columnsForWidth(500)).toBe(1);
    expect(columnsForWidth(501)).toBe(2);
    expect(columnsForWidth(1032)).toBe(2);
    expect(columnsForWidth(1033)).toBe(3);
    // the theme's own column width
    expect(columnsForWidth(700, undefined, 320, 8)).toBe(3);
  });
  it("keeps more columns while a scrollbar takes a few pixels", () => {
    expect(columnsForWidth(501 - 10, 2)).toBe(2);
    expect(columnsForWidth(501 - HYSTERESIS_PX - 1, 2)).toBe(1);
    // growing is not delayed
    expect(columnsForWidth(501, 1)).toBe(2);
  });
  it("cascades from the base up to the view columns there are", () => {
    expect(at(c, 1)).toMatchObject({ columns: 1, row_gap: "6px" });
    expect(at(c, 2)).toMatchObject({ columns: 2, row_gap: "8px" });
    expect(at(c, 4)).toMatchObject({ columns: 4, row_gap: "8px" });
  });
  it("inherits a card's value from the nearest smaller count", () => {
    expect(pick({ by: { 1: 1, 3: 3 } }, 2)).toBe(1);
    expect(pick({ by: { 1: 1, 3: 3 } }, 4)).toBe(3);
    expect(pick({ by: { 3: 3 } }, 2)).toBeUndefined();
    expect(pick({ all: 2, by: {} }, 3)).toBe(2);
  });
});

describe("layout-card masonry", () => {
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
  it("lays a grid out with spans clamped to the columns", () => {
    const c = cfg({
      columns: 3,
      cards: [
        { type: "a", view_layout: { span: 5 } },
        { type: "b", view_layout: { span: "full" } },
        { type: "c", view_layout: { column: 3, span: 2 } },
      ],
    });
    const plan = planLayout(c.base, [kid(c, 0), kid(c, 1), kid(c, 2)], 1);
    expect(plan.body["grid-template-columns"]).toBe("repeat(3, minmax(0, 1fr))");
    expect(plan.items.map((i) => i.style["grid-column"])).toEqual([
      "span 3",
      "1 / -1",
      "2 / span 2",
    ]);
    // HA's grid mode only where the rows are fixed
    expect(plan.items.every((i) => !i.gridLayout)).toBe(true);
  });
  it("reads a card's span at the view columns there are", () => {
    const c = cfg({
      columns: 4,
      cards: [{ type: "a", view_layout: { span: { 1: "full", 2: 2 } } }],
    });
    expect(planLayout(c.base, [kid(c, 0)], 1).items[0].style["grid-column"]).toBe("1 / -1");
    expect(planLayout(c.base, [kid(c, 0)], 3).items[0].style["grid-column"]).toBe("span 2");
  });
  it("gives a card the rows it asks for in the sections grid's row height", () => {
    const c = cfg({
      columns: 2,
      cards: [{ type: "a", view_layout: { span: [1, 2] } }, { type: "b" }],
    });
    const plan = planLayout(
      c.base,
      [kid(c, 0), kid(c, 1, { grid: { rows: 3 } }), kid(c, 1, { grid: { rows: "auto" } })],
      1,
    );
    expect(plan.items[0].style.height).toBe(
      "calc(2 * var(--ha-section-grid-row-height, 56px) + 1 * var(--ha-section-grid-row-gap, 8px))",
    );
    expect(plan.items[1].style["grid-row"]).toBe("span 3");
    expect(plan.items[2].style["grid-row"]).toBeUndefined();
    // HA's grid mode only for the cards with fixed rows
    expect(plan.items.map((i) => i.gridLayout)).toEqual([true, true, false]);
  });
  it("hides cards without a gap and pads inside a seamless surface", () => {
    const c = cfg({ cards: [{ type: "a" }, { type: "b" }, { type: "c" }] });
    const plan = planLayout(c.base, [kid(c, 0), kid(c, 1, { visible: false }), kid(c, 2)], 1);
    expect(plan.items.map((i) => i.shown)).toEqual([true, false, true]);
    const padded = cfg({ card_style: "seamless", padding: [8, 16], cards: [{ type: "a" }] });
    const pp = planLayout(padded.base, [kid(padded, 0)], 1);
    expect(pp.rootClass).toEqual(["layout-grid", "seamless"]);
    expect(pp.root["--pl-col-gap"]).toBe("0px");
    expect([pp.root.padding, pp.body.padding]).toEqual(["0", "8px 16px 8px 16px"]);
  });
  it("deals masonry cards in their order", () => {
    const c = cfg({
      layout: "masonry",
      columns: 2,
      cards: [{ type: "a" }, { type: "b" }, { type: "c", view_layout: { order: -1 } }],
    });
    const plan = planLayout(c.base, [kid(c, 0, { size: 4 }), kid(c, 1), kid(c, 2)], 1);
    expect(plan.sequence).toEqual([2, 0, 1]);
    expect(plan.items.map((i) => i.column)).toEqual([1, 0, 0]);
    expect(cardSize(c.base, [kid(c, 0, { size: 4 }), kid(c, 1), kid(c, 2)], plan)).toBe(4);
  });
  it("counts the card size by rows of the grid", () => {
    const c = cfg({ columns: 2, cards: [{ type: "a" }, { type: "b" }, { type: "c" }] });
    const kids = [kid(c, 0, { size: 3 }), kid(c, 1, { size: 1 }), kid(c, 2, { size: 2 })];
    expect(cardSize(c.base, kids, planLayout(c.base, kids, 1))).toBe(5);
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
    // a panel view's only card: the cards inside get their border back (--restore-card-*)
    el.layout = "panel";
    expect(el.hasAttribute("panel")).toBe(true);
    el.layout = "grid";
    expect(el.hasAttribute("panel")).toBe(false);
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
});
