import { describe, it, expect, vi } from "vitest";
import { EntityCard, normalizeEntityCardConfig } from "../../src/entity-card.ts";
import { EntityGroupCard, normalizeEntityGroupCardConfig } from "../../src/entity-group-card.ts";
import {
  EntitySectionsCard,
  normalizeEntitySectionsCardConfig,
} from "../../src/entity-sections-card.ts";
import type { HomeAssistant } from "../../src/shared/ha.ts";

describe("entity-card", () => {
  it("is registered and normalises the entity keys on the card", () => {
    expect(customElements.get("entity-card")).toBe(EntityCard);
    expect(window.customCards?.some((c) => c.type === "entity-card")).toBe(true);
    const c = normalizeEntityCardConfig({
      entity: "light.a",
      toggle: true,
      hours_to_show: "0",
      bucket_minutes: 1,
    });
    expect(c).toMatchObject({
      type: "entity-card",
      layout: "tile",
      hours: 1,
      bucketMin: 5,
      hasHeader: false,
      headerIdxs: [],
    });
    expect(c.groups).toEqual([
      { layout: "tile", idxs: [0], align: "start", columns: 1, divider: false, hasIcon: false },
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
    expect(() => normalizeEntityCardConfig(null)).toThrow(/entity-card: invalid config/);
    expect(() => normalizeEntityCardConfig({ name: "x" })).toThrow(
      /entity-card: 'entity' or 'value' is required/,
    );
    expect(
      EntityCard.getStubConfig(
        { states: { "sensor.a": { state: "1" } } } as unknown as HomeAssistant,
        ["light.b", "sensor.a"],
      ),
    ).toEqual({ entity: "sensor.a" });
  });
  it("reports one grid row for plain tiles and auto rows for block visuals", () => {
    const el = new EntityCard();
    el.setConfig({ entity: "sensor.a" });
    expect(el.getGridOptions()).toEqual({
      columns: 6,
      rows: 1,
      min_columns: 3,
      min_rows: 1,
      max_rows: 1,
    });
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

describe("entity-group-card", () => {
  it("is registered and normalises one group plus header entities", () => {
    expect(customElements.get("entity-group-card")).toBe(EntityGroupCard);
    const c = normalizeEntityGroupCardConfig({
      title: "Rooms",
      layout: "row",
      entities: ["light.a", { entity: "light.b", show_value: true }],
      header_entities: ["sensor.t"],
      columns: 9,
    });
    expect(c).toMatchObject({
      type: "entity-group-card",
      layout: "row",
      title: "Rooms",
      hasHeader: true,
      columns: 4,
      headerIdxs: [2],
    });
    expect(c.groups).toEqual([
      { layout: "row", idxs: [0, 1], align: "start", columns: 4, divider: false, hasIcon: false },
    ]);
    expect(c.entities.map((e) => e.entity)).toEqual(["light.a", "light.b", "sensor.t"]);
    expect(c.entities[2].item).toMatchObject({ showName: false, showValue: true, showIcon: true });
    expect(normalizeEntityGroupCardConfig({ entities: ["s.a"] }).layout).toBe("list");
    expect(() => normalizeEntityGroupCardConfig({ layout: "list" })).toThrow(
      /entity-group-card: 'entities' must be a non-empty list/,
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

  it("draws only icon and badge in the header and warns about other visuals", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const c = normalizeEntityGroupCardConfig({
      entities: ["light.a"],
      header_entities: [
        { entity: "sensor.a", visual: "badge" },
        { entity: "sensor.b", visual: "ring" },
        { entity: "sensor.c", visual: "sparkline" },
      ],
    });
    expect(c.entities.slice(1).map((e) => e.visual)).toEqual(["badge", "icon", "icon"]);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[0][0]).toMatch(/visual 'ring' is not drawn in the header/);
    warn.mockRestore();
  });
});

describe("entity-sections-card", () => {
  it("is registered and flattens the sections into one entity list", () => {
    expect(customElements.get("entity-sections-card")).toBe(EntitySectionsCard);
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
      type: "entity-sections-card",
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
    expect(c.groups.map((g) => [g.layout, g.idxs, g.align, g.divider, g.hasIcon])).toEqual([
      ["table", [0, 1], "center", false, true],
      ["row", [2], "end", true, false],
      ["list", [3], "center", false, false],
    ]);
    expect(c.entities[2].item.showValue).toBe(true);
    expect(() => normalizeEntitySectionsCardConfig({ title: "x" })).toThrow(
      /entity-sections-card: 'sections' must be a non-empty list/,
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
