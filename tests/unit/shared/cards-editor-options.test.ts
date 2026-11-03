// The container cards' editors, pure: their options as the form's data and back (tracks, rows,
// lengths, the swipe card's unfold, breakpoints), a card's place in the layout, and their schemas
import { describe, it, expect } from "vitest";
import {
  LENGTHS,
  ROWS,
  TRACKS,
  optionsFromForm,
  optionsToForm,
} from "../../../src/shared/cards/editor-options.ts";
import {
  LAYOUT_CONVS,
  layoutSchema,
  placeByWidth,
  placeFromForm,
  placeSchema,
  placeToForm,
} from "../../../src/layout/editor.ts";
import { SWIPE_CONVS, swipeSchema } from "../../../src/swipe/editor.ts";
import { cardName } from "../../../src/shared/cards/editor.ts";
import { snapshot } from "../../../docs/.vitepress/theme/ha-shim/hass.ts";
import type { CardConfigBase, HaFormData, HaFormSchema } from "../../../src/shared/ha.ts";
import { TILE_GROUP_CONVS, cardToTile, tileToCard } from "../../../src/tile-group/editor.ts";
import { docExamples, withNested } from "../docs-examples.ts";

const hass = snapshot();
const LAYOUT = "custom:layout-card-pro";
const SWIPE = "custom:swipe-card-pro";
const LAYOUT_DEFAULTS = { layout: "grid", card_style: "cards", align_items: "stretch" };
const SWIPE_DEFAULTS = { snap: "start", height: "equal", indicator: "dots" };
const tile = { type: "custom:tile-card-pro", entity: "light.kitchen" } as CardConfigBase;

// the layout's and the swipe card's options through their form, as the editors call it
const layout = {
  toForm: (c: Record<string, unknown>) =>
    optionsToForm({ type: LAYOUT, ...c } as CardConfigBase, LAYOUT_CONVS, LAYOUT_DEFAULTS),
  // the form's data changed by `edit`, written back onto the card
  edit: (c: Record<string, unknown>, edit: (d: HaFormData) => HaFormData) => {
    const prev = { type: LAYOUT, ...c } as CardConfigBase;
    const data = edit(structuredClone(optionsToForm(prev, LAYOUT_CONVS, LAYOUT_DEFAULTS)));
    return optionsFromForm(data, prev, LAYOUT_CONVS, LAYOUT_DEFAULTS);
  },
};
const swipe = {
  toForm: (c: Record<string, unknown>) =>
    optionsToForm({ type: SWIPE, ...c } as CardConfigBase, SWIPE_CONVS, SWIPE_DEFAULTS),
  edit: (c: Record<string, unknown>, edit: (d: HaFormData) => HaFormData) => {
    const prev = { type: SWIPE, ...c } as CardConfigBase;
    const data = edit(structuredClone(optionsToForm(prev, SWIPE_CONVS, SWIPE_DEFAULTS)));
    return optionsFromForm(data, prev, SWIPE_CONVS, SWIPE_DEFAULTS);
  },
};
const set = (k: string, v: unknown) => (d: HaFormData) => ({ ...d, [k]: v });

describe("tracks, rows and lengths as text", () => {
  it("show a count or tracks as text, and read them back", () => {
    expect(TRACKS.toForm(3)).toBe("3");
    expect(TRACKS.toForm(["1fr", "2fr"])).toBe("1fr 2fr");
    expect(TRACKS.toForm(undefined)).toBe("");
    expect(TRACKS.fromForm(" 3 ")).toBe(3);
    expect(TRACKS.fromForm("1fr  2fr")).toEqual(["1fr", "2fr"]);
    expect(TRACKS.fromForm("200px")).toEqual(["200px"]);
    expect(TRACKS.fromForm("")).toBeUndefined();
    expect(TRACKS.fromForm(undefined)).toBeUndefined();
  });

  it("read rows as tracks, always a list", () => {
    expect(ROWS.toForm(["auto", "1fr"])).toBe("auto 1fr");
    expect(ROWS.toForm(null)).toBe("");
    expect(ROWS.fromForm("auto 1fr")).toEqual(["auto", "1fr"]);
    expect(ROWS.fromForm("2")).toEqual(["2"]);
    expect(ROWS.fromForm("   ")).toBeUndefined();
  });

  it("read a length or a pair, numbers as numbers", () => {
    expect(LENGTHS.toForm([8, 16])).toBe("8 16");
    expect(LENGTHS.toForm(12)).toBe("12");
    expect(LENGTHS.toForm(null)).toBe("");
    expect(LENGTHS.fromForm("8")).toBe(8);
    expect(LENGTHS.fromForm("8 16")).toEqual([8, 16]);
    expect(LENGTHS.fromForm("1.5 -2")).toEqual([1.5, -2]);
    expect(LENGTHS.fromForm("1rem 8")).toEqual(["1rem", 8]);
    expect(LENGTHS.fromForm("")).toBeUndefined();
  });
});

describe("the layout card's options in its form", () => {
  it("show the defaults where the card sets nothing", () => {
    expect(layout.toForm({})).toEqual({
      layout: "grid",
      card_style: "cards",
      align_items: "stretch",
      columns: "",
      rows: "",
      gap: "",
      breakpoints: [],
    });
    expect(
      layout.toForm({ layout: "masonry", columns: [1, 2], rows: ["auto"], gap: [4, 8] }),
    ).toMatchObject({ layout: "masonry", columns: "1 2", rows: "auto", gap: "4 8" });
  });

  it("write each option in its shortest spelling", () => {
    expect(layout.edit({}, set("columns", "4"))).toEqual({ type: LAYOUT, columns: 4 });
    expect(layout.edit({}, set("columns", "1fr 2fr"))).toEqual({
      type: LAYOUT,
      columns: ["1fr", "2fr"],
    });
    expect(layout.edit({}, set("rows", "auto 1fr"))).toEqual({
      type: LAYOUT,
      rows: ["auto", "1fr"],
    });
    expect(layout.edit({}, set("gap", "8"))).toEqual({ type: LAYOUT, gap: 8 });
    expect(layout.edit({}, set("gap", "8 16"))).toEqual({ type: LAYOUT, gap: [8, 16] });
    expect(layout.edit({}, set("layout", "masonry"))).toEqual({ type: LAYOUT, layout: "masonry" });
    expect(layout.edit({}, set("card_style", "seamless"))).toEqual({
      type: LAYOUT,
      card_style: "seamless",
    });
    expect(layout.edit({}, set("align_items", "center"))).toEqual({
      type: LAYOUT,
      align_items: "center",
    });
  });

  it("write nothing for a default, and take an option out when it goes back to it", () => {
    expect(layout.edit({}, (d) => d)).toEqual({ type: LAYOUT });
    expect(layout.edit({ layout: "masonry" }, set("layout", "grid"))).toEqual({ type: LAYOUT });
    expect(layout.edit({ card_style: "seamless" }, set("card_style", undefined))).toEqual({
      type: LAYOUT,
    });
    expect(layout.edit({ columns: 3 }, set("columns", ""))).toEqual({ type: LAYOUT });
    expect(layout.edit({ gap: [8, 16] }, set("gap", "  "))).toEqual({ type: LAYOUT });
  });

  it("keep the spelling of the options the form leaves alone", () => {
    // a default written out, a count as a list of one, a length as text: all kept as written
    const c = { layout: "grid", columns: ["2"], gap: "8px", align_items: "stretch" };
    expect(layout.edit(c, set("card_style", "seamless"))).toEqual({
      type: LAYOUT,
      ...c,
      card_style: "seamless",
    });
    // and keys the form does not know
    expect(layout.edit({ padding: 8, cards: [tile] }, set("columns", "2"))).toEqual({
      type: LAYOUT,
      padding: 8,
      cards: [tile],
      columns: 2,
    });
  });

  it("write text it cannot read as tracks as it is (the card's own check names it)", () => {
    expect(layout.edit({}, set("columns", "wide"))).toEqual({ type: LAYOUT, columns: ["wide"] });
    expect(layout.edit({}, set("gap", "a b c"))).toEqual({ type: LAYOUT, gap: ["a", "b", "c"] });
  });
});

describe("the layout card's breakpoints in its form", () => {
  it("show one item per breakpoint, its keys the form has no field for under More", () => {
    const d = layout.toForm({
      breakpoints: { 2: { columns: 3, gap: [4, 8] }, 3: { layout: "masonry", padding: 8 } },
    });
    expect(d.breakpoints).toEqual([
      { at: 2, columns: "3", gap: "4 8" },
      { at: 3, layout: "masonry", more: { padding: 8 } },
    ]);
  });

  it("add, edit and remove breakpoints", () => {
    const base = { columns: 2 };
    const added = layout.edit(base, set("breakpoints", [{ at: 3, columns: "4" }]));
    expect(added).toEqual({ type: LAYOUT, columns: 2, breakpoints: { 3: { columns: 4 } } });
    const edited = layout.edit(added, (d) => ({
      ...d,
      breakpoints: [{ ...(d.breakpoints as HaFormData[])[0], gap: "12", rows: "auto" }],
    }));
    expect(edited.breakpoints).toEqual({ 3: { columns: 4, gap: 12, rows: ["auto"] } });
    expect(layout.edit(edited, set("breakpoints", []))).toEqual({ type: LAYOUT, columns: 2 });
  });

  it("keep a breakpoint's other keys through an edit", () => {
    const c = { breakpoints: { 2: { columns: 3, padding: [4, 8] } } };
    const out = layout.edit(c, (d) => ({
      ...d,
      breakpoints: [{ ...(d.breakpoints as HaFormData[])[0], columns: "5" }],
    }));
    expect(out.breakpoints).toEqual({ 2: { padding: [4, 8], columns: 5 } });
  });

  it("drop a breakpoint below two view columns or without a whole number", () => {
    const out = layout.edit({}, (d) => ({
      ...d,
      breakpoints: [
        { at: 1, columns: "2" },
        { at: 2.5, columns: "2" },
        { columns: "2" },
        { at: 4, columns: "6" },
      ],
    }));
    expect(out.breakpoints).toEqual({ 4: { columns: 6 } });
  });

  it("leave the breakpoints as written while the form leaves them alone", () => {
    // a key as text, a value YAML's empty spelling sets back to the default
    const bps = { "2": { rows: null, gap: null }, 4: { columns: [3] } };
    expect(layout.edit({ breakpoints: bps }, set("columns", "2"))).toEqual({
      type: LAYOUT,
      columns: 2,
      breakpoints: bps,
    });
  });

  it("keep a breakpoint's null while another breakpoint is edited", () => {
    const bps = { 2: { rows: null }, 3: { columns: 2 } };
    const form = layout.toForm({ breakpoints: bps }).breakpoints as Record<string, unknown>[];
    expect(form[0]).toEqual({ at: 2, more: { rows: null } });
    const edited = [form[0], { ...form[1], columns: "4" }];
    expect(layout.edit({ breakpoints: bps }, set("breakpoints", edited)).breakpoints).toEqual({
      2: { rows: null },
      3: { columns: 4 },
    });
    // a value typed in its field wins over the null
    const typed = [{ ...form[0], rows: "auto" }, form[1]];
    expect(layout.edit({ breakpoints: bps }, set("breakpoints", typed)).breakpoints).toEqual({
      2: { rows: ["auto"] },
      3: { columns: 2 },
    });
  });

  it("write a breakpoint's empty item as an empty breakpoint", () => {
    expect(layout.edit({}, set("breakpoints", [{ at: 2 }])).breakpoints).toEqual({ 2: {} });
  });
});

describe("the swipe card's options in its form", () => {
  it("show the defaults where the card sets nothing", () => {
    expect(swipe.toForm({})).toEqual({
      snap: "start",
      height: "equal",
      indicator: "dots",
      gap: "",
      breakpoints: [],
    });
  });

  it("write each option", () => {
    expect(swipe.edit({}, set("per_page", 1.15))).toEqual({ type: SWIPE, per_page: 1.15 });
    expect(swipe.edit({}, set("gap", "8 0"))).toEqual({ type: SWIPE, gap: [8, 0] });
    expect(swipe.edit({}, set("snap", "center"))).toEqual({ type: SWIPE, snap: "center" });
    expect(swipe.edit({}, set("height", "auto"))).toEqual({ type: SWIPE, height: "auto" });
    expect(swipe.edit({}, set("indicator", "none"))).toEqual({ type: SWIPE, indicator: "none" });
    expect(swipe.edit({}, set("unfold", 3))).toEqual({ type: SWIPE, unfold: 3 });
    expect(swipe.edit({ per_page: 2 }, set("per_page", undefined))).toEqual({ type: SWIPE });
    expect(swipe.edit({ snap: "free" }, set("snap", "start"))).toEqual({ type: SWIPE });
  });

  it("show unfold's false as 0 and write 0 back as false", () => {
    expect(swipe.toForm({ unfold: false }).unfold).toBe(0);
    expect(swipe.edit({ unfold: 3 }, set("unfold", 0))).toEqual({ type: SWIPE, unfold: false });
    expect(swipe.edit({ unfold: 3 }, set("unfold", null))).toEqual({ type: SWIPE });
    // a breakpoint back to the strip
    const d = swipe.toForm({ unfold: 2, breakpoints: { 3: { unfold: false } } });
    expect(d.breakpoints).toEqual([{ at: 3, unfold: 0 }]);
    const out = swipe.edit({ unfold: 2 }, set("breakpoints", [{ at: 3, unfold: 0, per_page: 2 }]));
    expect(out.breakpoints).toEqual({ 3: { unfold: false, per_page: 2 } });
  });
});

describe("a card's place in the layout", () => {
  const withPlace = (view_layout: unknown) => ({ ...tile, view_layout }) as CardConfigBase;

  it("shows the span, the column, the order and the alignment", () => {
    expect(placeToForm(tile)).toEqual({
      span_full: false,
      span_cols: undefined,
      span_rows: undefined,
    });
    expect(placeToForm(withPlace({ span: 2, column: 3, order: -1, align: "end" }))).toEqual({
      span_full: false,
      span_cols: 2,
      span_rows: undefined,
      column: 3,
      order: -1,
      align: "end",
    });
    expect(placeToForm(withPlace({ span: [2, 3] }))).toMatchObject({ span_cols: 2, span_rows: 3 });
    expect(placeToForm(withPlace({ span: "full" }))).toMatchObject({
      span_full: true,
      span_cols: undefined,
    });
    expect(placeToForm(withPlace({ span: ["full", 2] }))).toMatchObject({
      span_full: true,
      span_rows: 2,
    });
  });

  it("writes the span in its shortest form", () => {
    expect(placeFromForm({ span_cols: 2 }, tile).view_layout).toEqual({ span: 2 });
    expect(placeFromForm({ span_cols: 2, span_rows: 3 }, tile).view_layout).toEqual({
      span: [2, 3],
    });
    expect(placeFromForm({ span_full: true, span_rows: 2 }, tile).view_layout).toEqual({
      span: ["full", 2],
    });
    // rows alone: one column that many rows high
    expect(placeFromForm({ span_rows: 2 }, tile).view_layout).toEqual({ span: [1, 2] });
    // full width wins over a column count
    expect(placeFromForm({ span_full: true, span_cols: 4 }, tile).view_layout).toEqual({
      span: "full",
    });
  });

  it("writes the column, the order and the alignment, and nothing for an empty place", () => {
    expect(placeFromForm({ column: 2, order: 0, align: "center" }, tile).view_layout).toEqual({
      column: 2,
      order: 0,
      align: "center",
    });
    expect(placeFromForm({ span_full: false, align: "" }, withPlace({ span: 2 }))).toEqual(tile);
    expect(placeFromForm({ span_cols: Number.NaN }, tile)).toEqual(tile);
  });

  it("keeps what changes by view columns and the keys it does not know", () => {
    const card = withPlace({ span: { 1: 1, 3: 2 }, column: 2, other: "kept" });
    expect(placeByWidth(card)).toEqual(["span"]);
    expect(placeToForm(card)).toEqual({ column: 2 });
    expect(placeFromForm({ column: 4, span_cols: 6 }, card).view_layout).toEqual({
      span: { 1: 1, 3: 2 },
      column: 4,
      other: "kept",
    });
    // the other keys of the card stay too
    const c = { ...tile, grid_options: { rows: 2 }, view_layout: { order: 1 } } as CardConfigBase;
    expect(placeFromForm({ order: 2 }, c)).toEqual({ ...c, view_layout: { order: 2 } });
  });

  it("shows only the fields it can write", () => {
    const names = (s: HaFormSchema[]): string[] =>
      s.flatMap((x) => (x.schema ? names(x.schema) : x.name ? [x.name] : []));
    expect(names(placeSchema(hass, tile))).toEqual([
      "span_cols",
      "span_rows",
      "span_full",
      "column",
      "order",
      "align",
    ]);
    // full width: no column count
    expect(names(placeSchema(hass, withPlace({ span: "full" })))).not.toContain("span_cols");
    // what changes by width is YAML, named in a line of its own
    const byWidth = placeSchema(hass, withPlace({ span: { 2: 2 }, align: { 3: "end" } }));
    expect(names(byWidth)).toEqual(["column", "order", "by_width"]);
    expect(byWidth.at(-1)).toMatchObject({ type: "constant", value: "span, align" });
  });
});

describe("the layout's and the swipe card's options form", () => {
  const top = (s: HaFormSchema[]): string[] =>
    s.flatMap((x) => (x.type === "grid" ? top(x.schema ?? []) : [x.name]));
  const fieldsOf = (s: HaFormSchema[]) => {
    const bp = s.find((x) => x.name === "breakpoints")!;
    return (bp.selector as { object: { fields: Record<string, { label: string }> } }).object.fields;
  };

  it("shows the layout's options, rows only for a grid", () => {
    expect(top(layoutSchema(hass, { layout: "grid" }))).toEqual([
      "layout",
      "card_style",
      "columns",
      "align_items",
      "gap",
      "rows",
      "breakpoints",
    ]);
    expect(top(layoutSchema(hass, { layout: "masonry" }))).not.toContain("rows");
    // a breakpoint takes every option, the view columns it starts at and More
    const fields = fieldsOf(layoutSchema(hass, {}));
    expect(Object.keys(fields)).toEqual([
      "at",
      "layout",
      "columns",
      "rows",
      "align_items",
      "gap",
      "card_style",
      "more",
    ]);
    expect(fields.at.label).toBe("From view columns");
    expect(fields.more.label).toBe("More (YAML)");
  });

  it("shows the swipe card's options", () => {
    const s = swipeSchema(hass);
    expect(top(s)).toEqual([
      "per_page",
      "gap",
      "snap",
      "height",
      "indicator",
      "unfold",
      "breakpoints",
    ]);
    expect(Object.keys(fieldsOf(s))).toEqual([
      "at",
      "per_page",
      "gap",
      "snap",
      "height",
      "indicator",
      "unfold",
      "more",
    ]);
    const perPage = s[0].schema![0].selector as {
      number: { min: number; max: number; step: number };
    };
    expect(perPage.number).toMatchObject({ min: 1, max: 12, step: 0.05 });
  });

  it("names every option of their selects in the viewer's language", () => {
    const opts = (s: HaFormSchema[], name: string) => {
      const f = s
        .flatMap((x) => (x.type === "grid" ? x.schema! : [x]))
        .find((x) => x.name === name);
      return (f!.selector as { select: { options: { value: string; label: string }[] } }).select
        .options;
    };
    expect(opts(layoutSchema(hass, {}), "align_items").map((o) => o.label)).toEqual([
      "Top",
      "Centre",
      "Bottom",
      "Stretch",
    ]);
    expect(opts(swipeSchema(hass), "height").map((o) => o.label)).toEqual([
      "Equal",
      "Each its own",
    ]);
    const de = { ...hass, locale: { ...hass.locale, language: "de" }, language: "de" };
    expect(opts(layoutSchema(de, {}), "layout").map((o) => o.label)).not.toEqual([
      "Grid",
      "Masonry",
    ]);
  });
});

describe("a card's name on its tab", () => {
  it("is its type, ours marked Pro", () => {
    expect(cardName({ type: "custom:tile-card-pro" })).toBe("Tile Pro");
    expect(cardName({ type: "custom:tile-group-card-pro" })).toBe("Tile group Pro");
    expect(cardName({ type: "tile" })).toBe("Tile");
    expect(cardName({ type: "vertical-stack" })).toBe("Vertical stack");
    expect(cardName({ type: "custom:mushroom-light-card" })).toBe("Mushroom light");
    expect(cardName({} as CardConfigBase)).toBe("?");
    expect(cardName(undefined)).toBe("?");
  });
});

describe("the tile group's editor", () => {
  it("writes every docs example's header, layout and tiles back as they were", () => {
    let n = 0;
    for (const { file, cfg } of docExamples())
      for (const c of withNested(cfg)) {
        const card = c as CardConfigBase;
        if (card?.type !== "custom:tile-group-card-pro") continue;
        expect(
          optionsFromForm(optionsToForm(card, TILE_GROUP_CONVS), card, TILE_GROUP_CONVS),
          file,
        ).toEqual(card);
        // a tile as the tile's editor takes it, and back (the editor keeps an untouched tile's
        // own spelling: `{ entity }` stays an object)
        for (const tile of (card.tiles as unknown[]) ?? [])
          expect(tileToCard(cardToTile(tileToCard(tile))), file).toEqual(tileToCard(tile));
        n++;
      }
    expect(n).toBeGreaterThan(3);
  });
});
