import { describe, it, expect, vi } from "vitest";
import { composedName, nameFor, normalizeName } from "../../../src/shared/entity-name.ts";
import type { HassEntity, HomeAssistant } from "../../../src/shared/ha.ts";
import { normalizeSeries } from "../../../src/shared/trend/series.ts";
import { formatEntityName } from "../../../docs/.vitepress/theme/ha-shim/registry.ts";

const W = "custom:tile-card-pro: the card";
const st = (entity_id: string, friendly_name: string) =>
  ({ entity_id, state: "on", attributes: { friendly_name } }) as unknown as HassEntity;

describe("normalizeName", () => {
  it("keeps a text, makes one part a list of one, takes a list", () => {
    expect(normalizeName(undefined, W)).toBeNull();
    expect(normalizeName("Desk", W)).toBe("Desk");
    expect(normalizeName("{{ states('x') }}", W)).toBe("{{ states('x') }}");
    expect(normalizeName({ type: "entity" }, W)).toEqual([{ type: "entity" }]);
    expect(
      normalizeName([{ type: "area" }, { type: "text", text: "·" }, { type: "entity" }], W),
    ).toEqual([{ type: "area" }, { type: "text", text: "·" }, { type: "entity" }]);
  });
  it("takes an unquoted YAML On or Off as none, as it always did", () => {
    expect(normalizeName(false, W)).toBeNull();
    expect(normalizeName(true, W)).toBeNull();
  });
  it("leaves out a series' name it cannot read (its entity's name stands)", () => {
    const s = normalizeSeries({ entity: "sensor.x", name: { type: "room" } }, 0, "t", "series[0]");
    expect(s?.name).toBeUndefined();
    const ok = normalizeSeries({ entity: "sensor.x", name: { type: "area" } }, 0, "t", "series[0]");
    expect(ok?.name).toEqual([{ type: "area" }]);
  });
  it("names what it cannot read, and where", () => {
    expect(() => normalizeName({ type: "room" }, W)).toThrow(
      `${W}: name must be a text, a template or Home Assistant's parts of a name`,
    );
    expect(() => normalizeName([{ type: "text" }], W)).toThrow(/not \{"type":"text"\}$/);
    expect(() => normalizeName(["Desk"], W)).toThrow(/not "Desk"$/);
  });
});

describe("composedName", () => {
  const lamp = st("light.desk", "Office Desk lamp");
  it("is Home Assistant's, where it composes names", () => {
    const formatEntityName = vi.fn(() => "Desk lamp");
    const hass = { formatEntityName } as unknown as HomeAssistant;
    expect(composedName(hass, lamp, [{ type: "entity" }])).toBe("Desk lamp");
    expect(formatEntityName).toHaveBeenCalledWith(lamp, [{ type: "entity" }]);
  });
  it("is the parts of your own alone without it, else none", () => {
    expect(composedName(undefined, lamp, [{ type: "text", text: "Lamp" }])).toBe("Lamp");
    expect(composedName(undefined, lamp, [{ type: "entity" }])).toBeNull();
    // nothing composed: the card's default stands
    const empty = { formatEntityName: () => "" } as unknown as HomeAssistant;
    expect(composedName(empty, lamp, [{ type: "area" }])).toBeNull();
  });
  it("names a series: its own, else its entity's friendly name, else its id", () => {
    const hass = { formatEntityName: () => "Desk lamp" } as unknown as HomeAssistant;
    expect(nameFor(hass, lamp, [{ type: "entity" }], "light.desk")).toBe("Desk lamp");
    expect(nameFor(hass, lamp, "Lamp", "light.desk")).toBe("Lamp");
    expect(nameFor(hass, lamp, undefined, "light.desk")).toBe("Office Desk lamp");
    expect(nameFor(hass, undefined, undefined, "light.desk")).toBe("light.desk");
  });
});

describe("the demo home's formatEntityName", () => {
  const finishes = st("sensor.dishwasher_finishes", "Dishwasher finishes");
  it("composes the parts by the registries", () => {
    expect(formatEntityName(finishes)).toBe("Dishwasher finishes");
    expect(formatEntityName(finishes, "Done")).toBe("Done");
    expect(formatEntityName(finishes, [{ type: "entity" }])).toBe("Finishes");
    expect(formatEntityName(finishes, [{ type: "area" }, { type: "device" }])).toBe(
      "Kitchen Dishwasher",
    );
    expect(
      formatEntityName(finishes, [{ type: "floor" }, { type: "area" }, { type: "entity" }], {
        separator: " / ",
      }),
    ).toBe("Ground floor / Kitchen / Finishes");
  });
  it("names an entity without a name of its own after its device", () => {
    const status = st("sensor.dishwasher_status", "Dishwasher");
    expect(formatEntityName(status, [{ type: "entity" }])).toBe("Dishwasher");
    expect(formatEntityName(status, [{ type: "device" }, { type: "entity" }])).toBe("Dishwasher");
  });
});
