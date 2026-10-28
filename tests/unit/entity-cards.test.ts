import { describe, it, expect, vi } from "vitest";
import { EntityCard, normalizeEntityCardConfig } from "../../src/entity-card.ts";
import { EntityGroupCard, normalizeEntityGroupCardConfig } from "../../src/entity-group-card.ts";
import {
  EntitySectionsCard,
  normalizeEntitySectionsCardConfig,
} from "../../src/entity-sections-card.ts";
import type { HomeAssistant } from "../../src/shared/ha.ts";
import { groupCardSize } from "../../src/shared/entity/base.ts";

describe("entity-card-pro", () => {
  it("is registered and normalises the entity keys on the card", () => {
    expect(customElements.get("entity-card-pro")).toBe(EntityCard);
    expect(window.customCards?.some((c) => c.type === "entity-card-pro")).toBe(true);
    const c = normalizeEntityCardConfig({
      entity: "light.a",
      toggle: true,
      hours_to_show: "0",
      bucket_minutes: 1,
    });
    expect(c).toMatchObject({
      type: "entity-card-pro",
      layout: "tile",
      hours: 1,
      bucketMin: 5,
      hasHeader: false,
      headerIdxs: [],
    });
    expect(c.groups).toEqual([
      {
        layout: "tile",
        idxs: [0],
        align: "start",
        columns: 1,
        divider: false,
        visibility: null,
      },
    ]);
    expect(c.entities[0]).toMatchObject({
      entity: "light.a",
      toggle: true,
      visual: "icon",
      rules: [],
    });
    expect(normalizeEntityCardConfig({ name: "Bins", value: "Tuesday" }).entities[0]).toMatchObject(
      { entity: null, valueSrc: { kind: "text", text: "Tuesday" } },
    );
    expect(() => normalizeEntityCardConfig(null)).toThrow(/entity-card-pro: invalid config/);
    expect(() => normalizeEntityCardConfig({ name: "x" })).toThrow(
      /entity-card-pro: the card needs 'entity' or 'value'/,
    );
    // buttons without a usable entry are no buttons: the same message
    expect(() =>
      normalizeEntityCardConfig({ name: "x", control: "buttons", control_options: ["scene.a"] }),
    ).toThrow(/entity-card-pro: the card needs 'entity' or 'value'/);
    expect(
      normalizeEntityCardConfig({
        name: "Scenes",
        control: "buttons",
        control_options: [{ entity: "scene.a" }],
      }).entities[0].valueSrc,
    ).toEqual({ kind: "text", text: "" });
    expect(
      EntityCard.getStubConfig(
        { states: { "sensor.a": { state: "1" } } } as unknown as HomeAssistant,
        ["light.b", "sensor.a"],
      ),
    ).toEqual({ entity: "sensor.a" });
  });
  it("sizes every tile to its content: a plain tile is one row, block visuals more", () => {
    const el = new EntityCard();
    el.setConfig({ entity: "sensor.a" });
    expect(el.getGridOptions()).toEqual({ columns: 6, rows: "auto", min_columns: 3, min_rows: 1 });
    expect(el.getCardSize()).toBe(1);
    el.setConfig({ entity: "sensor.a", visual: "bar" });
    expect(el.getGridOptions()).toMatchObject({ columns: 6, rows: "auto" });
    expect(el.getCardSize()).toBe(2);
    el.setConfig({ entity: "sensor.a", visual: "sparkline" });
    expect(el.getCardSize()).toBe(3);
    expect(el._historyIds).toEqual(["sensor.a"]);
    expect(() => el.setConfig({})).toThrow();
  });
});

describe("entity-group-card-pro", () => {
  it("is registered and normalises one group plus header entities", () => {
    expect(customElements.get("entity-group-card-pro")).toBe(EntityGroupCard);
    const c = normalizeEntityGroupCardConfig({
      title: "Rooms",
      layout: "row",
      entities: ["light.a", { entity: "light.b", show_value: false }],
      header_entities: ["sensor.t"],
      columns: 9,
    });
    expect(c).toMatchObject({
      type: "entity-group-card-pro",
      layout: "row",
      title: "Rooms",
      hasHeader: true,
      columns: 4,
      headerIdxs: [2],
    });
    expect(c.groups).toEqual([
      {
        layout: "row",
        idxs: [0, 1],
        align: "space-between",
        columns: 4,
        divider: false,
        visibility: null,
      },
    ]);
    expect(c.entities.map((e) => e.entity)).toEqual(["light.a", "light.b", "sensor.t"]);
    expect(c.entities[0].item).toMatchObject({ showName: true, showValue: true, showIcon: true });
    expect(c.entities[1].item.showValue).toBe(false);
    expect(c.entities[2].item).toMatchObject({ showName: false, showValue: true, showIcon: true });
    expect(normalizeEntityGroupCardConfig({ entities: ["s.a"] }).layout).toBe("list");
    expect(() => normalizeEntityGroupCardConfig({ layout: "list" })).toThrow(
      /entity-group-card-pro: 'entities' must be a non-empty list/,
    );
    expect(() => normalizeEntityGroupCardConfig({ layout: "tile", entities: ["s.a"] })).toThrow(
      /layout must be one of/,
    );
    expect(() => normalizeEntityGroupCardConfig({ entities: [{ name: "x" }] })).toThrow(
      /entities\[0\] needs 'entity' or 'value'/,
    );
    expect(() => normalizeEntityGroupCardConfig({ sections: [] })).toThrow(/'entities'/);
  });
  it("sizes by layout; a hero grows with every extra row", () => {
    const el = new EntityGroupCard();
    el.setConfig({ layout: "hero", entities: ["sensor.a"] });
    expect(el.getGridOptions()).toMatchObject({
      columns: 12,
      rows: "auto",
      min_columns: 6,
      min_rows: 3,
    });
    const lead = el.getCardSize();
    el.setConfig({
      layout: "hero",
      entities: ["sensor.a", { entity: "sensor.b", visual: "badge" }],
    });
    expect(el.getCardSize()).toBe(lead + 1);
    el.setConfig({ layout: "list", entities: ["sensor.a", "sensor.b"] });
    expect(el.getGridOptions()).toMatchObject({ columns: 12, rows: "auto", min_rows: 2 });
    expect(el.getCardSize()).toBe(3);
    el.setConfig({ layout: "grid", columns: 2, entities: ["s.a", "s.b", "s.c"] });
    expect(el.getCardSize()).toBe(5);
    // a history visual inside a row is coerced to icon, so nothing is fetched for it
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    el.setConfig({ layout: "row", entities: [{ entity: "sensor.a", visual: "sparkline" }] });
    warn.mockRestore();
    expect(el._historyIds).toEqual([]);
    expect(el.getCardSize()).toBe(3);
  });

  it("draws the badge visuals in the header and warns about the block visuals", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const c = normalizeEntityGroupCardConfig({
      entities: ["light.a"],
      header_entities: [
        { entity: "sensor.a", visual: "badge" },
        { entity: "sensor.b", visual: "ring" },
        { entity: "sensor.c", visual: "gauge" },
        { entity: "sensor.d", visual: "columns" },
      ],
    });
    expect(c.entities.slice(1).map((e) => e.visual)).toEqual(["badge", "ring", "icon", "icon"]);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[0][0]).toMatch(/visual 'gauge' is not drawn in the header/);
    warn.mockRestore();
  });
});

describe("entity-sections-card-pro", () => {
  it("is registered and flattens the sections into one entity list", () => {
    expect(customElements.get("entity-sections-card-pro")).toBe(EntitySectionsCard);
    const c = normalizeEntitySectionsCardConfig({
      title: "Living room",
      show_value: true,
      align: "center",
      header_entities: ["sensor.t"],
      sections: [
        { layout: "table", entities: ["sensor.a", { entity: "sensor.b", show_icon: true }] },
        { layout: "row", divider: true, align: "end", entities: ["light.c"] },
        { entities: ["light.d"] },
      ],
    });
    expect(c).toMatchObject({
      type: "entity-sections-card-pro",
      layout: "sections",
      hasHeader: true,
      headerIdxs: [4],
    });
    expect(c.entities.map((e) => e.entity)).toEqual([
      "sensor.a",
      "sensor.b",
      "light.c",
      "light.d",
      "sensor.t",
    ]);
    expect(c.groups.map((g) => [g.layout, g.idxs, g.align, g.divider])).toEqual([
      ["table", [0, 1], "center", false],
      ["row", [2], "end", true],
      ["list", [3], "center", false],
    ]);
    expect(c.entities[2].item.showValue).toBe(true);
    expect(() => normalizeEntitySectionsCardConfig({ title: "x" })).toThrow(
      /entity-sections-card-pro: 'sections' must be a non-empty list/,
    );
    expect(() => normalizeEntitySectionsCardConfig({ sections: [] })).toThrow(/'sections'/);
    expect(() => normalizeEntitySectionsCardConfig({ sections: [{ layout: "row" }] })).toThrow(
      /'sections\[0\].entities' must be a non-empty list/,
    );
    expect(() =>
      normalizeEntitySectionsCardConfig({ sections: [{ layout: "tile", entities: ["s.a"] }] }),
    ).toThrow(/sections\[0\].layout must be one of/);
    expect(() =>
      normalizeEntitySectionsCardConfig({ sections: [{ entities: [{ name: "x" }] }] }),
    ).toThrow(/sections\[0\].entities\[0\] needs 'entity' or 'value'/);
  });
  it("sizes as the sum of its sections", () => {
    const el = new EntitySectionsCard();
    el.setConfig({ sections: [{ layout: "row", entities: ["light.a", "light.b"] }] });
    expect(el.getGridOptions()).toMatchObject({ columns: 12, rows: "auto", min_rows: 2 });
    const one = el.getCardSize();
    el.setConfig({
      sections: [
        { layout: "row", entities: ["light.a", "light.b"] },
        { layout: "hero", entities: ["sensor.a"] },
      ],
    });
    expect(el.getGridOptions()).toMatchObject({ min_rows: 3 });
    expect(el.getCardSize()).toBeGreaterThan(one);
  });
});

describe("card-level visibility", () => {
  // Home Assistant hides the whole card with it; the cards never read it as their item's
  const hidden = [{ condition: "state", entity: "light.a", state: "never" }];
  it("is not the entity card's item visibility", () => {
    const c = normalizeEntityCardConfig({ entity: "light.a", visibility: hidden });
    expect(c.entities[0].visibility).toBeNull();
  });
  it("is not the group card's group visibility", () => {
    const c = normalizeEntityGroupCardConfig({ entities: ["light.a"], visibility: hidden });
    expect(c.groups[0].visibility).toBeNull();
  });
  it("accepts HA's own conditions there without an error", () => {
    expect(() =>
      normalizeEntityGroupCardConfig({
        entities: ["light.a"],
        visibility: [{ condition: "view_columns", min: 2 }],
      }),
    ).not.toThrow();
  });
});

describe("hover", () => {
  const byId = (c: { entities: { entity: string | null; hover: boolean }[] }) =>
    Object.fromEntries(c.entities.map((e) => [e.entity, e.hover]));
  it("is the entity card's own key, off by default", () => {
    expect(normalizeEntityCardConfig({ entity: "light.a" }).entities[0].hover).toBe(false);
    expect(normalizeEntityCardConfig({ entity: "light.a", hover: true }).entities[0].hover).toBe(
      true,
    );
  });
  it("cascades card → entity on the group card, header entities included", () => {
    const c = normalizeEntityGroupCardConfig({
      hover: true,
      header_entities: ["sensor.h"],
      entities: ["light.a", { entity: "light.b", hover: false }],
    });
    expect(byId(c)).toEqual({ "light.a": true, "light.b": false, "sensor.h": true });
  });
  it("cascades card → section → entity on the sections card", () => {
    const c = normalizeEntitySectionsCardConfig({
      sections: [
        { entities: ["light.a", { entity: "light.b", hover: true }] },
        { hover: true, entities: ["light.c", { entity: "light.d", hover: false }] },
      ],
    });
    expect(byId(c)).toEqual({
      "light.a": false,
      "light.b": true,
      "light.c": true,
      "light.d": false,
    });
  });
});

describe("entity-card-pro as a poster", () => {
  it("is one poster group whose badges follow the entity", () => {
    const c = normalizeEntityCardConfig({
      entity: "sensor.t",
      layout: "poster",
      badges: ["sensor.h", { entity: "sensor.co2", style: "soft", size: "m" }],
    });
    expect(c.layout).toBe("poster");
    expect(c.groups).toEqual([
      {
        layout: "poster",
        idxs: [0],
        badgeIdxs: [1, 2],
        align: "start",
        columns: 1,
        divider: false,
        visibility: null,
      },
    ]);
    expect(c.entities.map((e) => e.entity)).toEqual(["sensor.t", "sensor.h", "sensor.co2"]);
    // the badges are pills in its corner: outline and small unless they name their own
    expect(c.entities[1].badge).toEqual({ style: "outline", size: "s" });
    expect(c.entities[2].badge).toEqual({ style: "soft", size: "m" });
    expect(c).toMatchObject({ hasHeader: false, headerIdxs: [] });
  });
  it("keeps a switch on a badge and drops the other controls", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const c = normalizeEntityCardConfig({
      entity: "sensor.t",
      layout: "poster",
      badges: [
        { entity: "switch.pump", control: "toggle" },
        { entity: "cover.blinds", control: "slider" },
      ],
    });
    expect(c.entities[1]).toMatchObject({ control: { kind: "toggle" }, toggle: true });
    expect(c.entities[2]).toMatchObject({ control: null, toggle: false });
    expect(warn).toHaveBeenCalledWith(
      "entity-card-pro: a switch is the only control drawn in the header",
    );
    warn.mockRestore();
  });
  it("is a poster with no badges when none are given", () => {
    const c = normalizeEntityCardConfig({ entity: "sensor.t", layout: "poster" });
    expect(c.entities).toHaveLength(1);
    expect(c.groups[0]).toMatchObject({ layout: "poster", idxs: [0], badgeIdxs: [] });
  });
  it("takes tile or poster only", () => {
    expect(normalizeEntityCardConfig({ entity: "sensor.t", layout: "tile" }).layout).toBe("tile");
    expect(() => normalizeEntityCardConfig({ entity: "sensor.t", layout: "hero" })).toThrow(
      "entity-card-pro: layout must be one of tile | poster",
    );
  });
  it("warns about badges on a tile and draws none", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const c = normalizeEntityCardConfig({ entity: "sensor.t", badges: ["sensor.h"] });
    expect(warn).toHaveBeenCalledWith(
      "entity-card-pro: badges are drawn on a poster only (layout: poster)",
    );
    expect(c.entities).toHaveLength(1);
    expect(c.groups[0]).not.toHaveProperty("badgeIdxs");
    warn.mockRestore();
  });
  it("is three rows high, two at least, and as narrow as its value's controls allow", () => {
    const el = new EntityCard();
    const opts = (cfg: Record<string, unknown>) => {
      el.setConfig({ layout: "poster", ...cfg });
      return el.getGridOptions();
    };
    expect(opts({ entity: "sensor.t" })).toEqual({
      columns: 6,
      rows: 3,
      min_columns: 3,
      min_rows: 2,
    });
    expect(el.getCardSize()).toBe(3);
    // a block visual changes nothing: the poster has a fixed height
    expect(opts({ entity: "sensor.t", visual: "sparkline" })).toMatchObject({ rows: 3 });
    expect(el.getCardSize()).toBe(3);
    // a switch beside the value needs 4 columns, a stepper 6
    expect(opts({ entity: "switch.pump", control: "toggle" }).min_columns).toBe(4);
    expect(opts({ entity: "climate.living", control: "stepper" }).min_columns).toBe(6);
  });
  it("counts three rows for a poster group", () => {
    const c = normalizeEntityGroupCardConfig({
      layout: "poster",
      entities: [{ entity: "sensor.t", visual: "sparkline" }, "sensor.h", "sensor.co2"],
    });
    expect(groupCardSize(c, c.groups[0])).toBe(3);
    const el = new EntityGroupCard();
    el.setConfig({ title: "Air", layout: "poster", entities: ["sensor.t", "sensor.h"] });
    // the header's row and the poster's three
    expect(el.getCardSize()).toBe(4);
  });
});

describe("posters in the group and sections cards", () => {
  it("the group card draws its first entity as the poster, the rest as its badges", () => {
    const c = normalizeEntityGroupCardConfig({
      layout: "poster",
      entities: ["sensor.t", "sensor.h"],
      header_entities: ["sensor.co2"],
    });
    expect(c.groups[0]).toMatchObject({ layout: "poster", idxs: [0], badgeIdxs: [1] });
    expect(c.headerIdxs).toEqual([2]);
    expect(c.entities[1].badge).toEqual({ style: "outline", size: "s" });
    // a header entity keeps the header's plain pill
    expect(c.entities[2].badge).toEqual({ style: "plain", size: "s" });
  });
  it("the sections card points each poster's indices at the flat list", () => {
    const c = normalizeEntitySectionsCardConfig({
      sections: [
        { layout: "row", entities: ["light.a", "light.b"] },
        { layout: "poster", entities: ["sensor.t", "sensor.h", "sensor.co2"] },
        { layout: "poster", entities: ["sensor.p", "sensor.q"] },
        { entities: ["light.c"] },
      ],
    });
    expect(c.groups.map((g) => [g.layout, g.idxs, g.badgeIdxs])).toEqual([
      ["row", [0, 1], undefined],
      ["poster", [2], [3, 4]],
      ["poster", [5], [6]],
      ["list", [7], undefined],
    ]);
    expect(c.entities.map((e) => e.entity)).toEqual([
      "light.a",
      "light.b",
      "sensor.t",
      "sensor.h",
      "sensor.co2",
      "sensor.p",
      "sensor.q",
      "light.c",
    ]);
  });
});

describe("vertical_align on the group and sections cards", () => {
  it("is the top by default and keeps center and bottom", () => {
    expect(normalizeEntityGroupCardConfig({ entities: ["light.a"] }).valign).toBe("top");
    expect(
      normalizeEntityGroupCardConfig({ entities: ["light.a"], vertical_align: "center" }).valign,
    ).toBe("center");
    const sec = (v?: string) =>
      normalizeEntitySectionsCardConfig({
        sections: [{ entities: ["light.a"] }],
        vertical_align: v,
      }).valign;
    expect(sec()).toBe("top");
    expect(sec("bottom")).toBe("bottom");
  });
  it("names the card in its error", () => {
    expect(() =>
      normalizeEntityGroupCardConfig({ entities: ["light.a"], vertical_align: "middle" }),
    ).toThrow("entity-group-card-pro: vertical_align must be one of top | center | bottom");
    expect(() =>
      normalizeEntitySectionsCardConfig({
        sections: [{ entities: ["light.a"] }],
        vertical_align: "up",
      }),
    ).toThrow("entity-sections-card-pro: vertical_align must be one of top | center | bottom");
  });
  it("is no option of the entity card", () => {
    expect(normalizeEntityCardConfig({ entity: "light.a" })).not.toHaveProperty("valign");
  });
});
