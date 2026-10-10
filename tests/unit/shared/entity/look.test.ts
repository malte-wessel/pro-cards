import { describe, it, expect } from "vitest";
import {
  normalizeEntity,
  type NormalizeCtx,
  type RawEntity,
  type Rule,
} from "../../../../src/shared/entity/config.ts";
import type { HassEntity, HomeAssistant } from "../../../../src/shared/ha.ts";
import type { ValueModel } from "../../../../src/shared/entity/look.ts";
import {
  asText,
  matchRule,
  readValue,
  progressOf,
  scaleOf,
  resolveLook,
} from "../../../../src/shared/entity/look.ts";

const ctx: NormalizeCtx = {
  type: "t",
  tap: { action: "more-info" },
  hold: { action: "more-info" },
  dbl: { action: "none" },
};
const st = (
  state: string | number,
  attributes: Record<string, unknown> = {},
  id = "sensor.x",
): HassEntity =>
  ({
    entity_id: id,
    state: String(state),
    attributes,
  }) as unknown as HassEntity;
const ent = (o: RawEntity) => normalizeEntity({ entity: "sensor.x", ...o }, ctx, "e");
const tpl = (s: string) => `T(${s})`;
const num = (v: number): ValueModel => ({ raw: String(v), num: v, avail: true });
const txt = (s: string): ValueModel => ({ raw: s, num: null, avail: true });
const rule = (o: Partial<Rule>): Rule => ({
  state: null,
  below: null,
  above: null,
  color: null,
  icon: null,
  label: null,
  tintCard: false,
  ...o,
});

describe("rule matching", () => {
  it("matches below exclusively, above inclusively and state on the raw text", () => {
    const range = rule({ state: null, below: 20, above: 10 });
    expect(matchRule(range, num(10))).toBe(true);
    expect(matchRule(range, num(19.99))).toBe(true);
    expect(matchRule(range, num(20))).toBe(false);
    expect(matchRule(range, num(9.99))).toBe(false);
    expect(matchRule(range, txt("on"))).toBe(false);
    expect(matchRule(rule({ state: "on", below: null, above: null }), txt("on"))).toBe(true);
    expect(matchRule(rule({ state: "on", below: null, above: null }), txt("off"))).toBe(false);
    expect(matchRule(rule({ state: "5", below: null, above: null }), num(5))).toBe(true);
    expect(
      matchRule(rule({ state: "unavailable", below: null, above: null }), {
        raw: "unavailable",
        num: null,
        avail: false,
      }),
    ).toBe(true);
    expect(
      matchRule(rule({ state: "x", below: null, above: null }), {
        raw: null,
        num: null,
        avail: false,
      }),
    ).toBe(false);
  });
  it("first match wins in author order", () => {
    const e = ent({
      rules: [
        { below: 16, label: "cold" },
        { below: 22, label: "ok" },
        { below: 28, label: "warm" },
        { above: 28, label: "hot" },
      ],
    });
    const label = (v: number) => resolveLook(e, num(v), st(v), tpl).label;
    expect([label(15), label(16), label(21.9), label(27), label(28), label(40)]).toEqual([
      "cold",
      "ok",
      "ok",
      "warm",
      "hot",
      "hot",
    ]);
    // written the other way round, the first rule shadows the rest
    const shadow = ent({
      rules: [
        { above: 0, label: "any" },
        { above: 28, label: "hot" },
      ],
    });
    expect(resolveLook(shadow, num(40), st(40), tpl).label).toBe("any");
  });
});

describe("template results as text", () => {
  it("keeps strings, renders truthy values, drops falsy ones", () => {
    expect(asText("x")).toBe("x");
    expect(asText("")).toBe("");
    expect(asText(21.5)).toBe("21.5");
    expect(asText(true)).toBe("true");
    expect([asText(0), asText(false), asText(null), asText(undefined)]).toEqual([
      null,
      null,
      null,
      null,
    ]);
  });
});

describe("value reading", () => {
  it("reads state, attribute, template and text values", () => {
    expect(readValue(ent({}), st("21.5"), tpl)).toEqual({ raw: "21.5", num: 21.5, avail: true });
    expect(readValue(ent({ attribute: "pos" }), st("open", { pos: 40 }), tpl)).toEqual({
      raw: "40",
      num: 40,
      avail: true,
    });
    expect(readValue(ent({ value: "{{ x }}" }), st("1"), tpl)).toEqual({
      raw: "T({{ x }})",
      num: null,
      avail: true,
    });
    expect(readValue(ent({ value: "Run" }), null as unknown as undefined, tpl)).toEqual({
      raw: "Run",
      num: null,
      avail: true,
    });
    expect(readValue(ent({}), st("unavailable"), tpl)).toEqual({
      raw: "unavailable",
      num: null,
      avail: false,
    });
    expect(readValue(ent({}), undefined, tpl)).toEqual({ raw: null, num: null, avail: false });
    // an empty text is blank, with or without an entity
    const blank = { raw: "", num: null, avail: true };
    expect(readValue(ent({ value: "" }), st("on"), tpl)).toEqual(blank);
    expect(readValue(ent({ value: "" }), undefined, tpl)).toEqual(blank);
    expect(readValue(ent({ attribute: "obj" }), st("1", { obj: { a: 1 } }), tpl).raw).toBe(
      '{"a":1}',
    );
  });
  it("computes progress and scale from config, entity attributes or 0..100", () => {
    expect(progressOf(ent({ min: 0, max: 200 }), 50, st("50"))).toBe(0.25);
    expect(progressOf(ent({}), 50, st("50", { min: 0, max: 400 }))).toBe(0.125);
    expect(progressOf(ent({}), 150, st("150"))).toBe(1);
    expect(progressOf(ent({}), null, st("x"))).toBeNull();
    expect(progressOf(ent({ min: 5, max: 5 }), 5, st("5"))).toBeNull();
    expect(scaleOf(ent({}), st("1", { min_value: 10, max_value: 20 }))).toEqual({
      min: 10,
      max: 20,
    });
  });
});

describe("look resolution", () => {
  it("prefers explicit colour and icon, then the matching rule, then defaults", () => {
    const e = ent({ rules: [{ above: 0, color: "red", icon: "mdi:fire", label: "hot" }] });
    expect(resolveLook(e, num(5), st("5"), tpl)).toMatchObject({
      color: "red",
      icon: "mdi:fire",
      label: "hot",
      tint: false,
    });
    const explicit = ent({
      color: "teal",
      icon: "mdi:x",
      rules: [{ above: 0, color: "red", icon: "mdi:fire" }],
    });
    expect(resolveLook(explicit, num(5), st("5"), tpl)).toMatchObject({
      color: "teal",
      icon: "mdi:x",
    });
    expect(
      resolveLook(ent({}), num(5), st("5", { device_class: "temperature" }), tpl),
    ).toMatchObject({
      color: "primary",
      icon: null,
      fallbackIcon: "mdi:thermometer",
      label: null,
      rule: null,
    });
    expect(resolveLook(ent({ color: "{{ c }}" }), num(5), st("5"), tpl).color).toBe("T({{ c }})");
  });
  it("uses state rules for text values and greys out off-like states", () => {
    const e = ent({
      rules: [
        { state: "on", color: "amber", label: "On" },
        { state: "off", color: "grey" },
      ],
    });
    expect(resolveLook(e, txt("on"), st("on", {}, "light.x"), tpl)).toMatchObject({
      color: "amber",
      label: "On",
    });
    expect(resolveLook(e, txt("off"), st("off", {}, "light.x"), tpl)).toMatchObject({
      color: "grey",
      label: null,
    });
    expect(resolveLook(ent({}), txt("closed"), st("closed"), tpl).color).toBe("grey");
    expect(resolveLook(ent({}), txt("playing"), st("playing"), tpl).color).toBe("primary");
  });
  it("defaults to Home Assistant's state colour for state-coloured domains", () => {
    const light = (s: string) => resolveLook(ent({}), txt(s), st(s, {}, "light.x"), tpl).color;
    expect(light("on")).toBe(
      "var(--state-light-on-color, var(--state-light-active-color, var(--state-active-color)))",
    );
    expect(light("off")).toBe(
      "var(--state-light-off-color, var(--state-light-inactive-color, var(--state-inactive-color)))",
    );
    // the value being looked at wins over the entity's current state (history strips)
    expect(resolveLook(ent({}), txt("off"), st("on", {}, "light.x"), tpl).color).toBe(
      "var(--state-light-off-color, var(--state-light-inactive-color, var(--state-inactive-color)))",
    );
    expect(
      resolveLook(ent({}), num(15), st("15", { device_class: "battery" }, "sensor.b"), tpl).color,
    ).toBe("var(--state-sensor-battery-low-color)");
    // explicit colour and rules still win; attribute values do not use the state colour
    expect(resolveLook(ent({ color: "teal" }), txt("on"), st("on", {}, "light.x"), tpl).color).toBe(
      "teal",
    );
    expect(
      resolveLook(
        ent({ rules: [{ state: "on", color: "red" }] }),
        txt("on"),
        st("on", {}, "light.x"),
        tpl,
      ).color,
    ).toBe("red");
    expect(
      resolveLook(ent({ attribute: "mode" }), txt("on"), st("on", { mode: "on" }, "light.x"), tpl)
        .color,
    ).toBe("primary");
    // numeric rules never match text, state rules can match numbers as text
    expect(
      resolveLook(ent({ rules: [{ below: 1, color: "red" }] }), txt("on"), st("on"), tpl).color,
    ).toBe("primary");
    expect(
      resolveLook(ent({ rules: [{ state: "0", color: "red" }] }), num(0), st("0"), tpl).color,
    ).toBe("red");
  });
  it("tints only when the matched rule asks for it", () => {
    const e = ent({ rules: [{ above: 10, tint_card: true }, { below: 10 }] });
    expect(resolveLook(e, num(20), st("20"), tpl).tint).toBe(true);
    expect(resolveLook(e, num(5), st("5"), tpl).tint).toBe(false);
  });
  it("marks unavailable values grey but lets a state rule label them", () => {
    expect(
      resolveLook(ent({}), { raw: "unavailable", num: null, avail: false }, st("unavailable"), tpl),
    ).toMatchObject({
      color: "grey",
      tint: false,
      label: "unavailable",
      fallbackIcon: "mdi:help-circle-outline",
    });
    const offline = ent({
      rules: [
        {
          state: "unavailable",
          icon: "mdi:lan-disconnect",
          label: "Offline",
          color: "red",
          tint_card: true,
        },
      ],
    });
    expect(
      resolveLook(offline, { raw: "unavailable", num: null, avail: false }, st("unavailable"), tpl),
    ).toMatchObject({
      color: "grey",
      icon: "mdi:lan-disconnect",
      label: "Offline",
      tint: false,
    });
    const de = { states: {}, locale: { language: "de-AT" } } as unknown as HomeAssistant;
    expect(
      resolveLook(
        ent({}),
        { raw: "unavailable", num: null, avail: false },
        st("unavailable"),
        tpl,
        de,
      ).label,
    ).toBe("nicht verfügbar");
  });
});
