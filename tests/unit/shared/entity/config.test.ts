import { describe, it, expect, vi } from "vitest";
import {
  normalizeRules,
  normalizeValue,
  normalizeItemOptions,
  normalizeEntity,
  normalizeGroup,
  normalizeHeaderEntities,
  normalizeActionDefaults,
  normalizeHistoryOptions,
  collectTemplates,
} from "../../../../src/shared/entity/config.ts";
import { ITEM_DEFAULTS } from "../../../../src/shared/entity/constants.ts";
import type {
  EntityCardConfig,
  NormalizeCtx,
  RawEntity,
} from "../../../../src/shared/entity/config.ts";

const ctx: NormalizeCtx = {
  type: "test-card",
  tap: { action: "more-info" },
  hold: { action: "more-info" },
  dbl: { action: "none" },
  columns: 2,
};
const ent = (o: RawEntity) => normalizeEntity({ entity: "sensor.x", ...o }, ctx, "entities[0]");

describe("rules", () => {
  it("keeps the author order, stringifies states and drops junk", () => {
    const r = normalizeRules([
      { above: 28, color: "red" },
      { below: "17.5", color: "blue", tint_card: true },
      { state: "on", color: "amber", label: "On" },
      { state: 0, icon: "mdi:x" },
      { color: "x" },
      null,
      "str",
    ]);
    expect(r.map((x) => [x.state, x.below, x.above])).toEqual([
      [null, null, 28],
      [null, 17.5, null],
      ["on", null, null],
      ["0", null, null],
    ]);
    expect(r[1].tintCard).toBe(true);
    expect(r[0].tintCard).toBe(false);
    expect(r[2]).toMatchObject({ color: "amber", label: "On", icon: null });
    expect(normalizeRules("nope")).toEqual([]);
  });
});

describe("value and attribute", () => {
  it("normalises value to text or template and attribute to its own source", () => {
    expect(normalizeValue(undefined)).toBeNull();
    expect(normalizeValue("{{ states('a') }}")).toEqual({
      kind: "template",
      template: "{{ states('a') }}",
    });
    expect(normalizeValue("Activate")).toEqual({ kind: "text", text: "Activate" });
    expect(normalizeValue(5)).toEqual({ kind: "text", text: "5" });
    expect(ent({}).valueSrc).toEqual({ kind: "state" });
    expect(ent({ attribute: "current_position" }).valueSrc).toEqual({
      kind: "attribute",
      key: "current_position",
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(ent({ attribute: "a", value: "b" }).valueSrc).toEqual({ kind: "attribute", key: "a" });
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/both 'attribute' and 'value'/));
    warn.mockRestore();
  });
});

describe("entity", () => {
  it("needs an entity unless the value is text or a template", () => {
    expect(() => normalizeEntity({ name: "x" }, ctx, "entities[1]")).toThrow(
      /test-card: entities\[1\] needs 'entity' or 'value'/,
    );
    expect(normalizeEntity({ name: "x", value: "text only" }, ctx, "e")).toMatchObject({
      entity: null,
      valueSrc: { kind: "text", text: "text only" },
    });
    expect(normalizeEntity({ value: "{{ x }}" }, ctx, "e").entity).toBeNull();
    expect(() => normalizeEntity({ attribute: "a" }, ctx, "e")).toThrow(/needs 'entity'/);
  });
  it("applies defaults and clamps", () => {
    expect(normalizeEntity("sensor.a", ctx, "e")).toMatchObject({
      entity: "sensor.a",
      name: null,
      visual: "icon",
      rules: [],
      toggle: false,
      decimals: null,
      prefix: "",
      tap: { action: "more-info" },
      dbl: { action: "none" },
      item: { showName: true, showValue: true, showIcon: true, namePosition: "above" },
    });
    expect(
      ent({ visual: "nope", decimals: 7, tap_action: "toggle", toggle: 1 as unknown as boolean }),
    ).toMatchObject({
      visual: "icon",
      decimals: 3,
      tap: { action: "toggle" },
      toggle: true,
    });
    expect(ent({ tap_action: { navigation_path: "/x" } }).tap).toEqual({
      action: "more-info",
      navigation_path: "/x",
    });
  });
  it("normalises item options and card defaults", () => {
    expect(
      normalizeItemOptions(
        { show_name: 0 as unknown as boolean, name_position: "left" },
        ITEM_DEFAULTS.row!,
      ),
    ).toEqual({ showName: false, showValue: true, showIcon: true, namePosition: "below" });
    expect(normalizeActionDefaults({ tap_action: "toggle" })).toMatchObject({
      tap: { action: "toggle" },
      hold: { action: "more-info" },
      dbl: { action: "none" },
    });
    expect(normalizeHistoryOptions({ hours_to_show: "0", bucket_minutes: 1 })).toEqual({
      hours: 1,
      bucketMin: 5,
    });
    expect(normalizeHistoryOptions({})).toEqual({ hours: 24, bucketMin: 60 });
  });
});

describe("group", () => {
  it("defaults to list, validates the layout and applies per-layout item defaults", () => {
    const { group, entities } = normalizeGroup(
      { entities: ["light.a", "light.b"] },
      ctx,
      {},
      "entities",
      3,
    );
    expect(group).toEqual({
      layout: "list",
      idxs: [3, 4],
      align: "start",
      columns: 2,
      divider: false,
      hasIcon: false,
    });
    expect(entities.map((e) => e.entity)).toEqual(["light.a", "light.b"]);
    const row = normalizeGroup({ layout: "row", entities: ["light.a"] }, ctx, {}, "entities", 0);
    expect(row.entities[0].item).toEqual({
      showName: true,
      showValue: true,
      showIcon: true,
      namePosition: "below",
    });
    expect(
      normalizeGroup({ layout: "column", entities: ["l.a"] }, ctx, {}, "entities", 0).entities[0]
        .item.namePosition,
    ).toBe("above");
    expect(
      normalizeGroup({ layout: "column", entities: ["l.a"] }, ctx, {}, "entities", 0).group.align,
    ).toBe("end");
    const table = normalizeGroup({ layout: "table", entities: ["s.a"] }, ctx, {}, "entities", 0);
    expect(table.group).toMatchObject({ align: "end", hasIcon: false });
    expect(table.entities[0].item).toMatchObject({ showValue: true, showIcon: false });
    expect(() =>
      normalizeGroup({ layout: "tile", entities: ["s.a"] }, ctx, {}, "entities", 0),
    ).toThrow(/test-card: layout must be one of list \| grid \| hero \| row \| column \| table/);
    expect(() =>
      normalizeGroup({ layout: "x", entities: ["s.a"] }, ctx, {}, "sections[1]", 0),
    ).toThrow(/sections\[1\].layout must be one of/);
    expect(() => normalizeGroup({ layout: "row" }, ctx, {}, "entities", 0)).toThrow(
      /'entities' must be a non-empty list/,
    );
    expect(() =>
      normalizeGroup({ layout: "row", entities: [] }, ctx, {}, "sections[0]", 0),
    ).toThrow(/'sections\[0\].entities' must be a non-empty list/);
    expect(() =>
      normalizeGroup({ layout: "row", entities: [{ name: "x" }] }, ctx, {}, "sections[0]", 0),
    ).toThrow(/sections\[0\].entities\[0\] needs 'entity' or 'value'/);
  });
  it("cascades item options card → group → entity and falls back on bad values", () => {
    const card = { show_value: true, show_icon: false, align: "center" };
    const a = normalizeGroup(
      { layout: "row", entities: ["s.a", { entity: "s.b", show_value: false }] },
      ctx,
      card,
      "entities",
      0,
    );
    expect(a.entities[0].item).toMatchObject({
      showValue: true,
      showIcon: false,
      namePosition: "below",
    });
    expect(a.entities[1].item).toMatchObject({ showValue: false, showIcon: false });
    expect(a.group.align).toBe("center");
    const b = normalizeGroup(
      {
        layout: "row",
        show_value: false,
        name_position: "below",
        align: "middle",
        entities: ["s.c", { entity: "s.d", show_value: true, show_icon: true }],
      },
      ctx,
      card,
      "sections[1]",
      2,
    );
    expect(b.entities[0].item).toMatchObject({
      showValue: false,
      showIcon: false,
      namePosition: "below",
    });
    expect(b.entities[1].item).toMatchObject({
      showValue: true,
      showIcon: true,
      namePosition: "below",
    });
    expect(b.group).toMatchObject({ align: "space-between", idxs: [2, 3] });
  });
  it("keeps block visuals out of items and clamps grid columns", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const r = normalizeGroup(
      {
        layout: "row",
        entities: [
          { entity: "s.c", visual: "gauge" },
          { entity: "s.d", visual: "badge" },
        ],
      },
      ctx,
      {},
      "entities",
      0,
    );
    expect(r.entities.map((e) => e.visual)).toEqual(["icon", "badge"]);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/'gauge' is not drawn/));
    warn.mockRestore();
    const hero = normalizeGroup(
      { layout: "hero", entities: [{ entity: "s.f", visual: "bar" }] },
      ctx,
      {},
      "entities",
      0,
    );
    expect(hero.entities[0].visual).toBe("bar");
    expect(
      normalizeGroup({ layout: "grid", columns: 9, entities: ["s.e"] }, ctx, {}, "entities", 0)
        .group.columns,
    ).toBe(4);
    const t = normalizeGroup(
      { layout: "table", show_icon: true, entities: ["s.a", { entity: "s.b", show_icon: false }] },
      ctx,
      {},
      "entities",
      0,
    );
    expect(t.group.hasIcon).toBe(true);
  });
});

describe("header entities and templates", () => {
  it("normalises header entities with header defaults and header-safe visuals", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const h = normalizeHeaderEntities(
      [
        { entity: "sensor.t", visual: "sparkline", name: "{{ a }}" },
        { entity: "sensor.h", visual: "badge", show_icon: false, show_name: true },
      ],
      ctx,
    );
    expect(h[0]).toMatchObject({
      visual: "icon",
      item: { showName: false, showValue: true, showIcon: true },
    });
    expect(h[1]).toMatchObject({ visual: "badge", item: { showName: true, showIcon: false } });
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/not drawn in the header/));
    warn.mockRestore();
    expect(normalizeHeaderEntities(undefined, ctx)).toEqual([]);
    expect(() => normalizeHeaderEntities([{ name: "x" }], ctx)).toThrow(
      /header_entities\[0\] needs 'entity' or 'value'/,
    );
  });
  it("collects every template string once", () => {
    const entities = [
      ent({
        name: "{{ a }}",
        secondary: "{{ b }}",
        color: "{{ c }}",
        value: "{{ d }}",
        suffix: "{{ ignored }}",
      }),
      ent({ name: "{{ a }}" }),
    ];
    expect(
      [
        ...collectTemplates({
          title: "{{ a }}",
          icon: "mdi:x",
          entities,
        } as unknown as EntityCardConfig),
      ].sort(),
    ).toEqual(["{{ a }}", "{{ b }}", "{{ c }}", "{{ d }}"]);
  });
});
