// A tile group's list draws what is below a tile's line from its name, beside the icon, with
// `indent: true` (off by default): as written, passed to the tiles, drawn and edited.
import { afterEach, describe, expect, it } from "vitest";
// (the group hosts tile cards: their element is defined)
import "../../src/tile-card.ts";
import { TileGroupCard } from "../../src/tile-group-card.ts";
import { normalizeTileGroupConfig } from "../../src/tile-group/config.ts";
import { TileGroupCardEditor, tileGroupSchema } from "../../src/tile-group/editor.ts";
import { normalizeTileConfig } from "../../src/tile/config.ts";
import { snapshot } from "../../docs/.vitepress/theme/ha-shim/hass.ts";
import type { CardConfigBase, HaFormSchema } from "../../src/shared/ha.ts";

const TILES = ["light.kitchen", { entity: "sensor.phone_battery", visual: "bar" }];
const norm = (o: Record<string, unknown>) => normalizeTileGroupConfig({ tiles: TILES, ...o });
const fails = (o: Record<string, unknown>, msg: string) => expect(() => norm(o)).toThrow(msg);

const cards: HTMLElement[] = [];
afterEach(() => {
  for (const c of cards.splice(0)) c.remove();
});
// the tiles' cards of a group as drawn
const tileCards = (o: Record<string, unknown>) => {
  const el = new TileGroupCard();
  el.setConfig({ type: "custom:tile-group-card-pro", tiles: TILES, ...o });
  document.body.appendChild(el);
  el.hass = snapshot() as never;
  cards.push(el);
  return [...(el.shadowRoot as ShadowRoot).querySelectorAll("tile-card-pro")].map(
    (t) => t.shadowRoot?.querySelector("ha-card") as HTMLElement,
  );
};

describe("a tile group's indent", () => {
  it("is off by default, and passed to a list's tiles where the group says so", () => {
    for (const o of [{}, { indent: false }]) {
      const g = norm(o);
      expect(g.indent).toBe(false);
      for (const t of g.tiles) expect(t.config).not.toHaveProperty("indent");
    }
    const on = norm({ layout: "list", indent: true });
    expect(on.indent).toBe(true);
    for (const t of on.tiles) expect(t.config).toMatchObject({ vertical: false, indent: true });
    // never on a row's or a table's tiles
    for (const layout of ["row", "table"])
      for (const t of norm({ layout }).tiles) expect(t.config).not.toHaveProperty("indent");
  });

  it("is the list's alone and the group's, never a tile's", () => {
    for (const layout of ["row", "table"])
      fails({ layout, indent: true }, "indent is the list's: layout: list");
    fails({ indent: "yes" }, "indent takes true or false");
    fails(
      { tiles: [{ entity: "light.kitchen", indent: false }] },
      "tiles[0]: indent is the group's (layout: list)",
    );
  });

  it("indents a tile only as the group's flag says, never a vertical tile or a table's row", () => {
    const tile = (o: Record<string, unknown>) =>
      normalizeTileConfig({ type: "custom:tile-card-pro", entity: "light.kitchen", ...o });
    expect(tile({}).indent).toBe(false);
    expect(tile({ indent: true }).indent).toBe(true);
    expect(tile({ indent: true, vertical: true }).indent).toBe(false);
    expect(tile({ indent: true, table: true }).indent).toBe(false);
  });

  it("marks the tiles' cards of a list with indent: true, and none without", () => {
    for (const card of tileCards({ indent: true }))
      expect(card.classList.contains("tindent")).toBe(true);
    for (const card of tileCards({})) expect(card.classList.contains("tindent")).toBe(false);
    for (const card of tileCards({ layout: "row" }))
      expect(card.classList.contains("tindent")).toBe(false);
  });
});

describe("the tile group's editor and indent", () => {
  const names = (schema: HaFormSchema[]): string[] =>
    schema.flatMap((s) => [s.name, ...(s.schema ? names(s.schema) : [])]).filter(Boolean);
  const hass = snapshot() as never;

  it("shows indent for a list only", () => {
    expect(names(tileGroupSchema(hass, {}))).toContain("indent");
    expect(names(tileGroupSchema(hass, { layout: "list" }))).toContain("indent");
    expect(names(tileGroupSchema(hass, { layout: "row" }))).not.toContain("indent");
    expect(names(tileGroupSchema(hass, { layout: "table" }))).not.toContain("indent");
  });

  it("writes indent: true alone, and drops it with the list", () => {
    const ed = new TileGroupCardEditor();
    const prev = { type: "custom:tile-group-card-pro", tiles: TILES } as CardConfigBase;
    const form = ed._optionsToForm(prev);
    expect(form).toMatchObject({ indent: false });
    // the default writes nothing
    expect(ed._optionsFromForm(form, prev)).toEqual(prev);
    const on = ed._optionsFromForm({ ...form, indent: true }, prev);
    expect(on).toMatchObject({ indent: true });
    const row = ed._optionsFromForm({ ...ed._optionsToForm(on), layout: "row" }, on);
    expect(row).not.toHaveProperty("indent");
    // a written default stays as written while the form leaves it alone
    const off = { ...prev, indent: false } as CardConfigBase;
    expect(ed._optionsFromForm(ed._optionsToForm(off), off)).toEqual(off);
  });
});
