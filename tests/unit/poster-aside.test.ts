import { describe, expect, it } from "vitest";
import { normalizeAside } from "../../src/poster/aside.ts";

const ctx = { type: "poster-card-pro" } as Parameters<typeof normalizeAside>[1];
const CARD = "climate.living_room";

describe("a poster's second value", () => {
  it("is an entity, or a badge's value keys; without an entity it reads the card's", () => {
    expect(normalizeAside("sensor.outdoor_temperature", ctx, CARD)).toMatchObject({
      entity: "sensor.outdoor_temperature",
      valueSrc: { kind: "state" },
    });
    expect(normalizeAside({ attribute: "temperature", decimals: 1 }, ctx, CARD)).toMatchObject({
      entity: CARD,
      valueSrc: { kind: "attribute", key: "temperature" },
      decimals: 1,
    });
    expect(normalizeAside({ value: "{{ 3 }}" }, ctx, CARD)).toMatchObject({ entity: null });
    // nothing of its own besides its value
    expect(normalizeAside("sensor.x", ctx, CARD)).toMatchObject({
      visual: "icon",
      rules: [],
      control: null,
    });
  });
  it("is left out, or turned off", () => {
    expect(normalizeAside(undefined, ctx, CARD)).toBeNull();
    expect(normalizeAside(null, ctx, CARD)).toBeNull();
    expect(normalizeAside(false, ctx, CARD)).toBe(false);
  });
  it("never shows the card's own value again, and names what is wrong", () => {
    for (const raw of [{}, { icon: "mdi:target" }, ""])
      expect(() => normalizeAside(raw, ctx, CARD)).toThrow(
        "poster-card-pro: aside needs an entity, or the card's attribute or a value of its own",
      );
    expect(() => normalizeAside(true, ctx, CARD)).toThrow("aside takes an entity id");
    expect(() => normalizeAside({ entity: "sensor.x", color: "red" }, ctx, CARD)).toThrow(
      "aside takes entity, attribute, value, unit, decimals, format, prefix, icon, not color",
    );
  });
});
