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
  normalizeBadge,
  normalizeVerticalAlign,
  minutesOf,
  collectTemplates,
  visibilityTrees,
} from "../../../../src/shared/entity/config.ts";
import {
  GROUP_LAYOUTS,
  ITEM_DEFAULTS,
  POSTER_BADGE,
} from "../../../../src/shared/entity/constants.ts";
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
  hover: false,
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
      iconStyle: "circle",
      picture: false,
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
    expect(ent({ icon_style: "plain" }).iconStyle).toBe("plain");
    expect(ent({ icon_style: "square" }).iconStyle).toBe("circle");
    expect(ent({ show_entity_picture: true }).picture).toBe(true);
    expect(ent({ show_entity_picture: null }).picture).toBe(false);
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
    expect(
      normalizeHistoryOptions({ hours_to_show: "0", bucket_minutes: 1, smoothing_minutes: 2 }),
    ).toEqual({
      hours: 1,
      bucketMin: 5,
      smoothMin: 5,
    });
    expect(normalizeHistoryOptions({ smoothing_minutes: "30" })).toMatchObject({ smoothMin: 30 });
    expect(normalizeHistoryOptions({})).toEqual({ hours: 24, bucketMin: 60, smoothMin: null });
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
      visibility: null,
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
    ).toBe("start");
    const table = normalizeGroup({ layout: "table", entities: ["s.a"] }, ctx, {}, "entities", 0);
    expect(table.group).toMatchObject({ align: "end" });
    expect(table.entities[0].item).toMatchObject({ showValue: true, showIcon: false });
    expect(() =>
      normalizeGroup({ layout: "tile", entities: ["s.a"] }, ctx, {}, "entities", 0),
    ).toThrow(
      /test-card: layout must be one of list \| grid \| hero \| poster \| row \| column \| table/,
    );
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
    // the table draws its icon column while a shown item has an icon
    expect(t.entities.map((e) => e.item.showIcon)).toEqual([true, false]);
  });
});

describe("hover", () => {
  const on: NormalizeCtx = { ...ctx, ...normalizeActionDefaults({ hover: true }) };
  it("is off unless the card turns it on, and only true turns it on", () => {
    expect(normalizeActionDefaults({}).hover).toBe(false);
    expect(normalizeActionDefaults({ hover: true }).hover).toBe(true);
    expect(normalizeActionDefaults({ hover: null }).hover).toBe(false);
    expect(normalizeActionDefaults({ hover: "yes" as unknown as boolean }).hover).toBe(false);
  });
  it("cascades card → entity: the entity's own boolean wins, anything else keeps the default", () => {
    expect(ent({}).hover).toBe(false);
    expect(ent({ hover: true }).hover).toBe(true);
    const n = (o: RawEntity) => normalizeEntity({ entity: "sensor.x", ...o }, on, "entities[0]");
    expect(n({}).hover).toBe(true);
    expect(n({ hover: false }).hover).toBe(false);
    expect(n({ hover: null }).hover).toBe(true);
    expect(n({ hover: 1 as unknown as boolean }).hover).toBe(true);
  });
  it("cascades card → group → entity", () => {
    const list = ["s.a", { entity: "s.b", hover: false }, { entity: "s.c", hover: true }];
    const hovers = (g: object, c: NormalizeCtx) =>
      normalizeGroup({ entities: list, ...g }, c, {}, "entities", 0).entities.map((e) => e.hover);
    expect(hovers({}, ctx)).toEqual([false, false, true]);
    expect(hovers({}, on)).toEqual([true, false, true]);
    expect(hovers({ hover: true }, ctx)).toEqual([true, false, true]);
    expect(hovers({ hover: false }, on)).toEqual([false, false, true]);
  });
  it("reaches header entities from the card", () => {
    const h = normalizeHeaderEntities(["sensor.a", { entity: "sensor.b", hover: false }], on);
    expect(h.map((e) => e.hover)).toEqual([true, false]);
  });
});

describe("header entities and templates", () => {
  it("normalises header entities with header defaults and header-safe visuals", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const h = normalizeHeaderEntities(
      [
        { entity: "sensor.t", visual: "gauge", name: "{{ a }}" },
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
          groups: [],
        } as unknown as EntityCardConfig),
      ].sort(),
    ).toEqual(["{{ a }}", "{{ b }}", "{{ c }}", "{{ d }}"]);
  });
});

describe("visibility", () => {
  const on = [{ condition: "state", state: "on" }];
  it("is parsed on items with the item's entity as the default", () => {
    expect(ent({}).visibility).toBeNull();
    expect(ent({ visibility: on }).visibility).toEqual([
      { kind: "state", entity: "sensor.x", attribute: null, values: ["on"], negate: false },
    ]);
    // without an entity there is nothing to fall back to
    expect(() => normalizeEntity({ value: "x", visibility: on }, ctx, "entities[3]")).toThrow(
      "test-card: 'entities[3].visibility[0]' needs 'entity'",
    );
  });
  it("is parsed on custom buttons, falling back to the button's entity, then the row's", () => {
    const row = ent({
      entity: "light.row",
      control: "buttons",
      control_options: [
        { entity: "scene.a", visibility: on },
        { action: "navigate", label: "Away", visibility: on },
      ],
    });
    const [a, b] = row.control?.buttons ?? [];
    expect(a.visibility).toMatchObject([{ entity: "scene.a" }]);
    expect(b.visibility).toMatchObject([{ entity: "light.row" }]);
  });
  it("is parsed on groups (sections), which have no entity of their own", () => {
    const { group } = normalizeGroup(
      { entities: ["light.a"], visibility: [{ condition: "user", users: ["u"] }] },
      ctx,
      {},
      "sections[1]",
      0,
    );
    expect(group.visibility).toEqual([{ kind: "user", users: ["u"] }]);
    expect(() =>
      normalizeGroup({ entities: ["light.a"], visibility: on }, ctx, {}, "sections[1]", 0),
    ).toThrow("'sections[1].visibility[0]' needs 'entity'");
  });
  it("lists every condition tree: items, their buttons, groups", () => {
    const tpl = "{{ is_state('light.a', 'on') }}";
    const e = ent({ visibility: [{ condition: "template", value_template: tpl }] });
    const cfg = { title: null, icon: null, entities: [e], groups: [{ visibility: null }] };
    const trees = visibilityTrees(cfg as unknown as EntityCardConfig);
    expect(trees).toEqual([e.visibility, null]);
    // the card subscribes their templates itself (with those of its own parts)
    expect([...collectTemplates(cfg as unknown as EntityCardConfig)]).toEqual([]);
  });
});

describe("header badges", () => {
  const warn = () => vi.spyOn(console, "warn").mockImplementation(() => {});
  it("takes the card's pill and size unless the badge names its own; badge is the soft pill", () => {
    const [a, b, c, d] = normalizeHeaderEntities(
      [
        "sensor.t",
        { entity: "sensor.t", style: "filled", size: "l" },
        { entity: "sensor.t", visual: "badge" },
        { entity: "sensor.t", visual: "badge", style: "outline" },
      ],
      ctx,
      "badges",
      { style: "outline", size: "m" },
    );
    expect(a.badge).toEqual({ style: "outline", size: "m" });
    expect(b.badge).toEqual({ style: "filled", size: "l" });
    expect(c).toMatchObject({ visual: "badge", badge: { style: "soft" } });
    // a badge visual with a style of its own is the new pill around the icon and the value
    expect(d).toMatchObject({ visual: "icon", badge: { style: "outline" } });
    // a card's header: plain and small
    expect(normalizeHeaderEntities(["sensor.t"], ctx)[0].badge).toEqual({
      style: "plain",
      size: "s",
    });
  });
  it("draws the badge visuals; the header-only ones fall back to the icon elsewhere", () => {
    const w = warn();
    const visuals = ["ring", "bar", "sparkline", "trend", "count", "dot"];
    const h = normalizeHeaderEntities(
      visuals.map((visual) => ({ entity: "sensor.t", visual })),
      ctx,
    );
    expect(h.map((e) => e.visual)).toEqual(visuals);
    expect(ent({ visual: "trend" }).visual).toBe("icon");
    expect(w).toHaveBeenCalledWith(expect.stringMatching(/drawn in header badges only/));
    w.mockRestore();
  });
  it("keeps a switch, takes a switch for auto where the domain has one, drops other controls", () => {
    const w = warn();
    const [a, b, c] = normalizeHeaderEntities(
      [
        { entity: "switch.pump", control: "toggle" },
        { entity: "light.a", control: "auto" },
        { entity: "cover.blinds", control: "auto" },
      ],
      ctx,
    );
    expect(a).toMatchObject({ control: { kind: "toggle" }, toggle: true });
    expect(b).toMatchObject({ control: { kind: "toggle" }, toggle: true });
    expect(c).toMatchObject({ control: null, toggle: false });
    expect(w).toHaveBeenCalledTimes(1);
    w.mockRestore();
  });
  it("reads format, stale_after and trend_hours", () => {
    const [e] = normalizeHeaderEntities(
      [{ entity: "sensor.t", format: "power", stale_after: "2h", trend_hours: 3 }],
      ctx,
    );
    expect(e).toMatchObject({ format: "power", staleMin: 120, trendHours: 3 });
    expect(ent({ format: "nope", trend_hours: -1 })).toMatchObject({
      format: "auto",
      staleMin: null,
      trendHours: 1,
    });
  });
  it("answers the pointer when it has an action, unless the badge or the card says hover: false", () => {
    const [on, off] = normalizeHeaderEntities(
      ["sensor.t", { entity: "sensor.t", hover: false }],
      ctx,
    );
    expect([on.hover, off.hover]).toEqual([true, false]);
    const cardOff = { ...ctx, ...normalizeActionDefaults({ hover: false }) };
    expect(normalizeHeaderEntities(["sensor.t"], cardOff)[0].hover).toBe(false);
  });
  it("reads a rule's style and pulse", () => {
    expect(
      normalizeRules([
        { above: 1, style: "soft", pulse: true },
        { above: 2, style: "x" },
      ]),
    ).toMatchObject([
      { style: "soft", pulse: true },
      { style: null, pulse: false },
    ]);
  });
});

describe("spans", () => {
  it("reads minutes, or a number with a unit", () => {
    expect(minutesOf(90)).toBe(90);
    expect(minutesOf("90s")).toBe(1.5);
    expect(minutesOf("30min")).toBe(30);
    expect(minutesOf("30 m")).toBe(30);
    expect(minutesOf("2h")).toBe(120);
    expect(minutesOf("1d")).toBe(1440);
    expect(minutesOf("45")).toBe(45);
  });
  it("is null when unset, not positive or not a span", () => {
    expect(minutesOf(undefined)).toBeNull();
    expect(minutesOf(0)).toBeNull();
    expect(minutesOf("-2h")).toBeNull();
    expect(minutesOf("2 weeks")).toBeNull();
  });
});

describe("one badge", () => {
  it("is a header entity by default, with the header's wording in its warnings", () => {
    const w = vi.spyOn(console, "warn").mockImplementation(() => {});
    const b = normalizeBadge(
      { entity: "cover.blinds", visual: "gauge", control: "slider" },
      ctx,
      "badges[0]",
      { style: "plain", size: "s" },
    );
    expect(b).toMatchObject({ visual: "icon", control: null, toggle: false });
    expect(b.badge).toEqual({ style: "plain", size: "s" });
    expect(w.mock.calls.map((c) => c[0])).toEqual([
      "test-card: visual 'gauge' is not drawn in the header; using icon",
      "test-card: a switch is the only control drawn in the header",
    ]);
    w.mockRestore();
  });
  it("names its place in the warnings when it is told where it sits", () => {
    const w = vi.spyOn(console, "warn").mockImplementation(() => {});
    normalizeBadge(
      { entity: "cover.blinds", visual: "columns", control: "slider" },
      ctx,
      "entities[1]",
      POSTER_BADGE,
      "a poster's corner",
    );
    expect(w.mock.calls.map((c) => c[0])).toEqual([
      "test-card: visual 'columns' is not drawn in a poster's corner; using icon",
      "test-card: a switch is the only control drawn in a poster's corner",
    ]);
    w.mockRestore();
  });
  it("names the label in its config errors", () => {
    expect(() => normalizeBadge({ name: "x" }, ctx, "entities[2]", POSTER_BADGE)).toThrow(
      /test-card: entities\[2\] needs 'entity' or 'value'/,
    );
  });
  it("draws the header entities as before", () => {
    const raw = [
      "sensor.t",
      { entity: "sensor.t", style: "soft", size: "l" },
      { entity: "light.a", control: "auto" },
    ];
    const viaHeader = normalizeHeaderEntities(raw, ctx);
    const viaBadge = raw.map((e, i) =>
      normalizeBadge(e, ctx, `header_entities[${i}]`, { style: "plain", size: "s" }),
    );
    expect(viaBadge).toEqual(viaHeader);
  });
});

describe("poster groups", () => {
  it("is one of the group layouts", () => {
    expect(GROUP_LAYOUTS).toContain("poster");
  });
  it("draws the first entity as the poster and the rest as outline pills in its corner", () => {
    const { group, entities } = normalizeGroup(
      {
        layout: "poster",
        entities: [
          { entity: "sensor.t", visual: "sparkline" },
          "sensor.h",
          { entity: "sensor.co2", style: "filled", size: "m" },
        ],
      },
      ctx,
      {},
      "entities",
      0,
    );
    expect(group).toEqual({
      layout: "poster",
      idxs: [0],
      badgeIdxs: [1, 2],
      align: "start",
      columns: 2,
      divider: false,
      visibility: null,
    });
    // the poster is a normal entity: its block visual stays
    expect(entities[0]).toMatchObject({ entity: "sensor.t", visual: "sparkline" });
    // the badges take the poster's pill unless they name their own
    expect(entities[1].badge).toEqual({ style: "outline", size: "s" });
    expect(entities[2].badge).toEqual({ style: "filled", size: "m" });
    expect(POSTER_BADGE).toEqual({ style: "outline", size: "s" });
  });
  it("keeps only a switch on a badge and warns about the corner", () => {
    const w = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { entities } = normalizeGroup(
      {
        layout: "poster",
        entities: [
          { entity: "light.a", control: "auto" },
          { entity: "switch.pump", control: "toggle" },
          { entity: "cover.blinds", control: "slider" },
          { entity: "sensor.t", visual: "gauge" },
        ],
      },
      ctx,
      {},
      "sections[1]",
      0,
    );
    // the poster keeps its controls
    expect(entities[0].control).toMatchObject({ kind: "auto" });
    expect(entities[1]).toMatchObject({ control: { kind: "toggle" }, toggle: true });
    expect(entities[2]).toMatchObject({ control: null, toggle: false });
    expect(entities[3].visual).toBe("icon");
    expect(w.mock.calls.map((c) => c[0])).toEqual([
      "test-card: a switch is the only control drawn in a poster's corner",
      "test-card: visual 'gauge' is not drawn in a poster's corner; using icon",
    ]);
    w.mockRestore();
  });
  it("names the badge's place in its errors", () => {
    expect(() =>
      normalizeGroup(
        { layout: "poster", entities: ["sensor.t", { name: "x" }] },
        ctx,
        {},
        "sections[2]",
        0,
      ),
    ).toThrow(/test-card: sections\[2\].entities\[1\] needs 'entity' or 'value'/);
  });
  it("points its indices past the offset; a poster alone has no badges", () => {
    const a = normalizeGroup(
      { layout: "poster", entities: ["sensor.t", "sensor.h"] },
      ctx,
      {},
      "entities",
      5,
    );
    expect(a.group).toMatchObject({ idxs: [5], badgeIdxs: [6] });
    const b = normalizeGroup({ layout: "poster", entities: ["sensor.t"] }, ctx, {}, "entities", 2);
    expect(b.group).toMatchObject({ idxs: [2], badgeIdxs: [] });
    // other layouts have no badges at all
    const list = normalizeGroup({ entities: ["sensor.t"] }, ctx, {}, "entities", 0);
    expect(list.group).not.toHaveProperty("badgeIdxs");
  });
});

describe("vertical_align", () => {
  it("is the top unless set", () => {
    expect(normalizeVerticalAlign(undefined, "x-card")).toBe("top");
    expect(normalizeVerticalAlign(null, "x-card")).toBe("top");
    expect(normalizeVerticalAlign("top", "x-card")).toBe("top");
    expect(normalizeVerticalAlign("center", "x-card")).toBe("center");
    expect(normalizeVerticalAlign("bottom", "x-card")).toBe("bottom");
  });
  it("names the card and the choices in its error", () => {
    expect(() => normalizeVerticalAlign("middle", "x-card")).toThrow(
      "x-card: vertical_align must be one of top | center | bottom",
    );
    expect(() => normalizeVerticalAlign(1, "x-card")).toThrow(/vertical_align must be one of/);
  });
});
