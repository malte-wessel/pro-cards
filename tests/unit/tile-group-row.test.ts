// A tile group's row options (where its tiles go when they do not fit, where they sit, the most on
// a line) and padding: false (the tiles flush with the card), as written, drawn and edited.
import { afterEach, describe, expect, it } from "vitest";
// (the group hosts tile cards: their element is defined)
import "../../src/tile-card.ts";
import { TileGroupCard } from "../../src/tile-group-card.ts";
import { normalizeTileGroupConfig } from "../../src/tile-group/config.ts";
import { TileGroupCardEditor, tileGroupSchema } from "../../src/tile-group/editor.ts";
import { fadesOf } from "../../src/tile-group/scroll.ts";
import { snapshot } from "../../docs/.vitepress/theme/ha-shim/hass.ts";
import type { CardConfigBase, HaFormSchema } from "../../src/shared/ha.ts";

const TILES = ["light.kitchen", "light.living_room"];
const norm = (o: Record<string, unknown>) => normalizeTileGroupConfig({ tiles: TILES, ...o });
const fails = (o: Record<string, unknown>, msg: string) => expect(() => norm(o)).toThrow(msg);

const cards: HTMLElement[] = [];
afterEach(() => {
  for (const c of cards.splice(0)) c.remove();
});
const draw = (o: Record<string, unknown>) => {
  const el = new TileGroupCard();
  el.setConfig({ type: "custom:tile-group-card-pro", tiles: TILES, ...o });
  document.body.appendChild(el);
  el.hass = snapshot() as never;
  cards.push(el);
  const root = el.shadowRoot as ShadowRoot;
  return {
    body: root.querySelector(".body") as HTMLElement,
    tiles: root.querySelector(".tiles") as HTMLElement,
  };
};

describe("a tile group's row options", () => {
  it("default to today's row: wrapping, the tiles sharing the width, padded", () => {
    expect(norm({ layout: "row" })).toMatchObject({
      overflow: "wrap",
      rowAlign: "stretch",
      rowColumns: null,
      padding: true,
    });
    // (`columns` stays the entity layer's own)
    expect(norm({ layout: "row", columns: 3 })).toMatchObject({ rowColumns: 3, columns: 1 });
  });

  it("take their values and name what is wrong", () => {
    expect(norm({ layout: "row", overflow: "scroll", align: "center" })).toMatchObject({
      overflow: "scroll",
      rowAlign: "center",
    });
    fails({ layout: "row", overflow: "hide" }, "overflow must be one of wrap | shrink | scroll");
    fails({ layout: "row", align: "left" }, "align must be one of start | center | end");
    fails({ layout: "row", columns: 0 }, "columns is the most tiles on a line: a whole number");
    fails({ layout: "row", columns: 2.5 }, "a whole number from 1 to 12");
    fails(
      { layout: "row", columns: 3, overflow: "scroll" },
      "columns is the most tiles on a line: overflow: scroll keeps them on one",
    );
    fails({ layout: "row", overflow: "shrink", columns: 2 }, "overflow: shrink keeps them on one");
    fails({ padding: 0 }, "padding takes true or false");
  });

  it("are the row's alone; padding is every layout's", () => {
    for (const k of ["overflow", "align", "columns"])
      for (const layout of [undefined, "list", "table"])
        fails({ layout, [k]: k === "columns" ? 2 : "start" }, `${k} is the row's: layout: row`);
    for (const layout of ["list", "row", "table"])
      expect(norm({ layout, padding: false }).padding).toBe(false);
  });

  it("draw the row's classes, its most on a line, and no padding as a flush body", () => {
    const row = draw({ layout: "row", overflow: "shrink", align: "end" });
    expect([...row.tiles.classList]).toEqual(
      expect.arrayContaining(["layout-row", "ov-shrink", "al-end"]),
    );
    expect(row.body.classList.contains("flush")).toBe(false);
    const cols = draw({ layout: "row", columns: 3, padding: false });
    expect(cols.tiles.classList.contains("cols")).toBe(true);
    expect(cols.tiles.style.getPropertyValue("--tg-cols")).toBe("3");
    expect(cols.body.classList.contains("flush")).toBe(true);
    // a list takes none of the row's classes
    const list = draw({ padding: false });
    expect([...list.tiles.classList]).toEqual(["tiles", "layout-list"]);
    expect(list.body.classList.contains("flush")).toBe(true);
  });
});

describe("a scrolling row's fades", () => {
  it("show on the side where more tiles are", () => {
    expect(fadesOf(0, 300, false)).toEqual({ left: false, right: true });
    expect(fadesOf(150, 300, false)).toEqual({ left: true, right: true });
    expect(fadesOf(300, 300, false)).toEqual({ left: true, right: false });
    // a snapped position a fraction short of an end counts as there
    expect(fadesOf(299.5, 300, false)).toEqual({ left: true, right: false });
  });
  it("swap sides in a right-to-left language, its scroll position negative", () => {
    expect(fadesOf(0, 300, true)).toEqual({ left: true, right: false });
    expect(fadesOf(-300, 300, true)).toEqual({ left: false, right: true });
  });
  it("show nowhere while the tiles fit", () => {
    expect(fadesOf(0, 0, false)).toEqual({ left: false, right: false });
    expect(fadesOf(0, 1, true)).toEqual({ left: false, right: false });
  });
});

describe("the tile group's editor", () => {
  const names = (schema: HaFormSchema[]): string[] =>
    schema.flatMap((s) => [s.name, ...(s.schema ? names(s.schema) : [])]).filter(Boolean);
  const hass = snapshot() as never;

  it("shows the row's options for a row, its most on a line while it wraps", () => {
    expect(names(tileGroupSchema(hass, { layout: "list" }))).not.toContain("overflow");
    expect(names(tileGroupSchema(hass, { layout: "list" }))).toContain("padding");
    expect(names(tileGroupSchema(hass, { layout: "row", overflow: "wrap" }))).toEqual(
      expect.arrayContaining(["overflow", "align", "columns", "padding"]),
    );
    expect(names(tileGroupSchema(hass, { layout: "row", overflow: "scroll" }))).not.toContain(
      "columns",
    );
  });

  it("writes what differs from the defaults, and drops what the layout does not take", () => {
    const ed = new TileGroupCardEditor();
    const prev = {
      type: "custom:tile-group-card-pro",
      layout: "row",
      tiles: TILES,
    } as CardConfigBase;
    const form = ed._optionsToForm(prev);
    expect(form).toMatchObject({ overflow: "wrap", align: "stretch", padding: true });
    // the defaults write nothing
    expect(ed._optionsFromForm(form, prev)).toEqual(prev);
    const set = ed._optionsFromForm({ ...form, overflow: "scroll", padding: false }, prev);
    expect(set).toMatchObject({ overflow: "scroll", padding: false });
    // a row on one line has no most on a line; another layout takes none of the row's keys
    const withCols = { ...prev, columns: 3 } as CardConfigBase;
    expect(
      ed._optionsFromForm({ ...ed._optionsToForm(withCols), overflow: "shrink" }, withCols),
    ).not.toHaveProperty("columns");
    const rowKeys = { ...prev, overflow: "scroll", align: "center" } as CardConfigBase;
    const list = ed._optionsFromForm({ ...ed._optionsToForm(rowKeys), layout: "list" }, rowKeys);
    expect(list).not.toHaveProperty("overflow");
    expect(list).not.toHaveProperty("align");
  });
});
