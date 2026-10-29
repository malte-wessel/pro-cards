import { afterEach, describe, it, expect, vi } from "vitest";
import { EntityCard, normalizeEntityCardConfig } from "../../src/entity-card.ts";
import { EntityGroupCard, normalizeEntityGroupCardConfig } from "../../src/entity-group-card.ts";
import {
  EntitySectionsCard,
  normalizeEntitySectionsCardConfig,
} from "../../src/entity-sections-card.ts";
import type { HomeAssistant } from "../../src/shared/ha.ts";

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

// the cards on the page (happy-dom): what their ha-card is marked with, the listeners they keep
describe("the group and sections cards drawn", () => {
  const cards: HTMLElement[] = [];
  const hass = () =>
    ({
      states: {
        "sensor.t": {
          entity_id: "sensor.t",
          state: "21.4",
          attributes: { friendly_name: "Temperature", unit_of_measurement: "°C" },
          last_changed: "2026-06-21T10:00:00Z",
          last_updated: "2026-06-21T10:00:00Z",
        },
      },
      locale: { language: "en" },
      config: { unit_system: { temperature: "°C" } },
      callService: () => Promise.resolve(),
      callWS: () => new Promise(() => {}),
    }) as unknown as HomeAssistant;
  const mount = <T extends EntityCard | EntityGroupCard | EntitySectionsCard>(
    el: T,
    cfg: Record<string, unknown>,
  ) => {
    el.setConfig(cfg);
    document.body.appendChild(el);
    el.hass = hass();
    cards.push(el);
    return el;
  };
  afterEach(() => {
    for (const c of cards.splice(0)) c.remove();
    vi.restoreAllMocks();
  });
  const haCard = (el: HTMLElement) => el.shadowRoot!.querySelector("ha-card")!;

  it("marks the card for vertical_align center and bottom, nothing for the top", () => {
    const cls = (cfg: Record<string, unknown>) =>
      [...haCard(mount(new EntityGroupCard(), { entities: ["sensor.t"], ...cfg })).classList]
        .filter((c) => c.startsWith("valign-"))
        .join(" ");
    expect(cls({})).toBe("");
    expect(cls({ vertical_align: "top" })).toBe("");
    expect(cls({ vertical_align: "center" })).toBe("valign-center");
    expect(cls({ vertical_align: "bottom" })).toBe("valign-bottom");
    const sections = mount(new EntitySectionsCard(), {
      vertical_align: "bottom",
      sections: [{ entities: ["sensor.t"] }],
    });
    expect(haCard(sections).classList.contains("valign-bottom")).toBe(true);
  });

  describe("web fonts", () => {
    // happy-dom has no document.fonts: a stand-in that records its listeners
    const stubFonts = () => {
      const listeners = new Set<EventListener>();
      const fonts = {
        ready: Promise.resolve(),
        addEventListener: vi.fn((type: string, fn: EventListener) => {
          if (type === "loadingdone") listeners.add(fn);
        }),
        removeEventListener: vi.fn((type: string, fn: EventListener) => {
          if (type === "loadingdone") listeners.delete(fn);
        }),
      };
      Object.defineProperty(document, "fonts", { value: fonts, configurable: true });
      return { fonts, listeners };
    };
    afterEach(() => {
      delete (document as unknown as { fonts?: unknown }).fonts;
    });
    it("fits the values again when a font arrives, while the card is on the page", () => {
      const { fonts, listeners } = stubFonts();
      const el = mount(new EntityCard(), { entity: "sensor.t" });
      expect(fonts.addEventListener).toHaveBeenCalledWith("loadingdone", el._onFonts);
      expect(listeners.has(el._onFonts)).toBe(true);
      const fit = vi.spyOn(el, "_fitCells");
      for (const fn of listeners) fn(new Event("loadingdone"));
      expect(fit).toHaveBeenCalledWith([el._root]);
      el.remove();
      expect(fonts.removeEventListener).toHaveBeenCalledWith("loadingdone", el._onFonts);
      expect(listeners.size).toBe(0);
    });
  });
});
