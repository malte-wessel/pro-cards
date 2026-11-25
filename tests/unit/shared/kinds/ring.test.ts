import { describe, expect, it } from "vitest";
import {
  parseRing,
  ringColorOf,
  ringOn,
  ringOver,
  ringSourceOf,
} from "../../../../src/shared/kinds/ring.ts";
import { ringProgressOf } from "../../../../src/shared/entity/ring.ts";
import { resolvePlaces } from "../../../../src/shared/kinds/places.ts";
import type { HassEntity } from "../../../../src/shared/ha.ts";

const st = (state: string, attributes: Record<string, unknown> = {}) =>
  ({ entity_id: "sensor.v", state, attributes }) as unknown as HassEntity;

describe("a ring as written", () => {
  it("takes true or false, an entity id, or another entity's options", () => {
    expect(parseRing(true, "icon")).toBe(true);
    expect(parseRing(false, "icon")).toBe(false);
    expect(parseRing("sensor.valve", "icon")).toEqual({ entity: "sensor.valve" });
    expect(
      parseRing(
        { entity: "climate.x", attribute: "valve", min: 0, max: 100, color: "orange" },
        "icon",
      ),
    ).toEqual({ entity: "climate.x", attribute: "valve", min: 0, max: 100, color: "orange" });
    // the card's own value in a colour of its own
    expect(parseRing({ color: "orange" }, "icon")).toEqual({ color: "orange" });
  });
  it("names what is wrong", () => {
    expect(() => parseRing("valve", "icon")).toThrow("icon: ring takes true, false, an entity id");
    expect(() => parseRing({ entity: "sensor.v", size: 2 }, "icon")).toThrow(
      "icon: a ring takes entity, attribute, min, max, color, not size",
    );
    expect(() => parseRing({ entity: "sensor.v", min: "0" }, "icon")).toThrow(
      "icon: a ring's min must be a number",
    );
    expect(() => parseRing({ color: "{{ 'red' }}" }, "icon")).toThrow(
      "icon: a ring's color is a colour (a name or a hex), not a template",
    );
    expect(() => parseRing({ entity: "sensor.v", min: 5, max: 5 }, "icon")).toThrow(
      "icon: a ring's min must be below its max",
    );
    // the card's own value keeps the card's scale
    expect(() => parseRing({ max: 50 }, "icon")).toThrow(
      "a ring's attribute, min and max are another entity's",
    );
  });
  it("lets a rule switch it and colour it, never read another entity", () => {
    expect(parseRing({ color: "red" }, "rules[0].icon", true)).toEqual({ color: "red" });
    expect(parseRing(false, "rules[0].icon", true)).toBe(false);
    expect(() => parseRing("sensor.v", "rules[0].icon", true)).toThrow(
      "a rule's ring reads no other entity",
    );
    expect(() => parseRing({ entity: "sensor.v" }, "rules[0].icon", true)).toThrow(
      "a rule's ring sets its colour alone, not entity",
    );
  });
});

describe("a ring over another", () => {
  const card = { entity: "sensor.valve", color: "orange" };
  it("keeps what the one below reads", () => {
    expect(ringOver(card, true)).toEqual(card);
    expect(ringOver(card, { color: "red" })).toEqual({ entity: "sensor.valve", color: "red" });
    expect(ringOver(card, false)).toBe(false);
    expect(ringOver(card, undefined)).toEqual(card);
    expect(ringOver(undefined, true)).toBe(true);
  });
  it("merges a rule's ring onto the card's in the resolved icon", () => {
    const icon = (rule: unknown) =>
      resolvePlaces([
        { icon: { ring: card }, visual: undefined },
        { icon: rule as never, visual: undefined },
      ]).icon.ring;
    expect(icon({ ring: { color: "red" } })).toEqual({ entity: "sensor.valve", color: "red" });
    // a rule that switches the icon's thing keeps the card's ring
    expect(icon({ type: "image" })).toEqual(card);
    expect(icon({ type: "image", ring: true })).toEqual(card);
    expect(icon({ ring: false })).toBe(false);
  });
  it("says what it reads and its colour", () => {
    expect(ringOn(undefined)).toBe(false);
    expect(ringOn({ color: "red" })).toBe(true);
    expect(ringSourceOf(true)).toBeNull();
    expect(ringSourceOf({ color: "red" })).toBeNull();
    expect(ringSourceOf(card)).toEqual({
      entity: "sensor.valve",
      attribute: null,
      min: null,
      max: null,
    });
    expect(ringColorOf(card)).toBe("orange");
    expect(ringColorOf(true)).toBeNull();
  });
});

describe("how far a ring of another entity is filled", () => {
  const src = (o: object = {}) => ({
    entity: "sensor.v",
    attribute: null,
    min: null,
    max: null,
    ...o,
  });
  it("reads its value on its scale: written, else the entity's own, else 0 to 100", () => {
    expect(ringProgressOf(src(), st("37"))).toBeCloseTo(0.37);
    expect(ringProgressOf(src(), st("30", { min: 0, max: 120 }))).toBeCloseTo(0.25);
    expect(ringProgressOf(src(), st("60", { min_value: 50, max_value: 100 }))).toBeCloseTo(0.2);
    expect(ringProgressOf(src({ min: 10, max: 30 }), st("20", { min: 0, max: 120 }))).toBe(0.5);
    // clamped to the ring
    expect(ringProgressOf(src(), st("140"))).toBe(1);
  });
  it("reads an attribute where it names one", () => {
    expect(ringProgressOf(src({ attribute: "valve" }), st("heat", { valve: 80 }))).toBeCloseTo(0.8);
  });
  it("fills nothing without a number", () => {
    expect(ringProgressOf(src(), undefined)).toBeNull();
    expect(ringProgressOf(src(), st("unavailable"))).toBeNull();
    expect(ringProgressOf(src({ attribute: "valve" }), st("heat"))).toBeNull();
  });
});
