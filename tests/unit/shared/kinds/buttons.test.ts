// The poster's and the tile's own buttons: written as badges are (a name, a value, rules), filled
// while their entity is active, the 3.0 keys read until 4.0.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { resetDeprecatedKeys } from "../../../../src/shared/card.ts";
import type { NormalizeCtx, Rule } from "../../../../src/shared/entity/config.ts";
import {
  buttonFill,
  buttonFillColor,
  type CustomButton,
} from "../../../../src/shared/entity/control.ts";
import type { HassEntity } from "../../../../src/shared/ha.ts";
import { normalizeKindButtons } from "../../../../src/shared/kinds/buttons.ts";

const ctx: NormalizeCtx = {
  type: "poster-card-pro",
  tap: { action: "more-info" },
  hold: { action: "more-info" },
  dbl: { action: "none" },
  hover: true,
};
const norm = (list: unknown[]) => normalizeKindButtons(list, ctx, "sensor.room") ?? [];
const one = (b: Record<string, unknown>) => norm([b])[0];
const st = (id: string, state: string, attributes: Record<string, unknown> = {}) =>
  ({ entity_id: id, state, attributes }) as unknown as HassEntity;
const btn = (entity: string | null) => ({ entity }) as CustomButton;
const rule = (o: Partial<Rule>) => o as Rule;

beforeEach(() => resetDeprecatedKeys());

describe("a kind card's own button", () => {
  it("shows its icon alone unless it says more: a written value shows", () => {
    const b = one({ entity: "cover.blinds" });
    expect(b.item?.item).toMatchObject({ showName: false, showValue: false });
    expect(one({ entity: "cover.blinds", show_value: true }).item?.item.showValue).toBe(true);
    expect(one({ entity: "cover.blinds", value: "Up" }).item?.item.showValue).toBe(true);
    expect(one({ entity: "cover.blinds", name: "Blinds" }).item?.item.showName).toBe(false);
    expect(one({ entity: "cover.blinds", show_name: true }).item?.item.showName).toBe(true);
  });

  it("reads an attribute as Home Assistant writes it, its rules winning over its look", () => {
    const b = one({ entity: "cover.blinds", attribute: "current_position", color: "teal" });
    expect(b.item).toMatchObject({
      valueSrc: { kind: "attribute", key: "current_position" },
      haAttribute: true,
      ruleWins: true,
      valueRules: true,
      color: "teal",
    });
    expect(b.color).toBe("teal");
  });

  it("takes rules on its value or on an attribute, their text as its value", () => {
    const b = one({
      entity: "climate.living_room",
      rules: [
        { attribute: "hvac_action", state: "heating", icon: "mdi:fire", active: true },
        { above: 25, value: "Hot", color: "red", pulse: true },
      ],
    });
    expect(b.item?.rules).toMatchObject([
      { attribute: "hvac_action", state: "heating", icon: "mdi:fire", active: true },
      { above: 25, label: "Hot", color: "red", pulse: true, attribute: null, active: null },
    ]);
  });

  it("reads 3.0's label and action until 4.0, said once", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const b = one({ entity: "scene.dimmed", label: "Dim", action: { action: "toggle" } });
    expect(b.item).toMatchObject({ name: "Dim", item: { showName: true } });
    expect(b.action).toEqual({ action: "toggle" });
    expect(warn.mock.calls.map((c) => String(c[0]))).toEqual([
      expect.stringMatching(/a button's label is deprecated .* write name with show_name: true/),
      expect.stringMatching(/a button's action is deprecated .* write tap_action/),
    ]);
    one({ entity: "scene.dimmed", label: "Dim" });
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it("leaves out with a warning what 3.0 ignored; the new key wins over the old one", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(one({ entity: "scene.a", hold_action: { action: "toggle" } }).action).toBeNull();
    expect(one({ entity: "scene.a", hold_action: { action: "toggle" } }).entity).toBe("scene.a");
    expect(warn.mock.calls.map((c) => String(c[0]))).toEqual([
      expect.stringMatching(/a button's hold_action is left out: a button runs one action/),
    ]);
    expect(one({ entity: "scene.a", label: "Old", name: "New" }).item?.name).toBe("New");
    expect(
      one({ entity: "scene.a", action: { action: "none" }, tap_action: { action: "toggle" } })
        .action,
    ).toEqual({ action: "toggle" });
    // an empty label was no label: the icon alone
    expect(one({ entity: "scene.a", label: "" }).item?.item.showName).toBe(false);
    warn.mockRestore();
  });

  it("says what to write for a key it does not take", () => {
    const err = (b: Record<string, unknown>) => () => one(b);
    expect(err({ entity: "scene.a", icon: { name: "mdi:x" } })).toThrow("icon is an icon's name");
    expect(err({ entity: "scene.a", value: true })).toThrow(/show_value/);
    const ruleErr = (r: Record<string, unknown>) => err({ entity: "scene.a", rules: [r] });
    expect(ruleErr({ state: "on", label: "On" })).toThrow("rules[0]: label is value");
    expect(ruleErr({ state: "on", style: "filled" })).toThrow("active fills it");
    expect(ruleErr({ state: "on", active: "yes" })).toThrow("active is true or false");
    expect(ruleErr({ state: "on", attribute: 3 })).toThrow("attribute is the name");
    expect(err({ entity: "scene.a", rules: { state: "on" } })).toThrow("rules must be a list");
  });

  it("leaves out a button with nothing to show or do, and reads a condition on its entity", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const list = norm([
      { icon: "mdi:x" },
      { name: "Away", show_name: true, tap_action: { action: "navigate", navigation_path: "/a" } },
      { entity: "binary_sensor.door", visibility: [{ condition: "state", state: "on" }] },
    ]);
    expect(list.map((b) => b.entity)).toEqual([null, "binary_sensor.door"]);
    expect(warn).toHaveBeenCalledWith(
      "poster-card-pro: control.options[0] needs 'entity' or 'tap_action'",
    );
    expect(list[1].visibility).toMatchObject([{ entity: "binary_sensor.door" }]);
    warn.mockRestore();
  });
});

describe("a kind card's button filled", () => {
  const fills = (id: string, state: string, attrs: Record<string, unknown> = {}) =>
    buttonFill(btn(id), st(id, state, attrs), null);

  it("while its entity is active, as Home Assistant colours it", () => {
    expect(fills("light.a", "on")).toBe(true);
    expect(fills("light.a", "off")).toBe(false);
    expect(fills("cover.a", "open")).toBe(true);
    expect(fills("cover.a", "closed")).toBe(false);
    expect(fills("lock.a", "unlocked")).toBe(true);
    expect(fills("lock.a", "locked")).toBe(false);
    expect(fills("binary_sensor.window", "on")).toBe(true);
    expect(fills("binary_sensor.window", "off")).toBe(false);
    expect(fills("person.sam", "home")).toBe(true);
    expect(fills("person.sam", "not_home")).toBe(false);
    expect(fills("light.a", "unavailable")).toBe(false);
  });

  it("a thermostat while it heats or cools, never by its mode", () => {
    expect(fills("climate.a", "heat", { hvac_action: "heating" })).toBe(true);
    expect(fills("climate.a", "cool", { hvac_action: "cooling" })).toBe(true);
    expect(fills("climate.a", "heat", { hvac_action: "idle" })).toBe(false);
    expect(fills("climate.a", "heat")).toBe(false);
    expect(fills("climate.a", "off", { hvac_action: "off" })).toBe(false);
    expect(fills("humidifier.a", "on", { action: "humidifying" })).toBe(true);
    expect(fills("humidifier.a", "on", { action: "idle" })).toBe(false);
    expect(fills("humidifier.a", "on")).toBe(true);
  });

  it("never a run, a number or what is always active", () => {
    expect(fills("scene.a", "2026-11-12T08:00:00")).toBe(false);
    expect(fills("script.a", "on")).toBe(false);
    expect(fills("sensor.power", "290")).toBe(false);
    expect(fills("weather.home", "sunny")).toBe(false);
    expect(fills("sun.sun", "above_horizon")).toBe(false);
    expect(buttonFill(btn(null), undefined, null)).toBe(false);
  });

  it("as a matching rule says", () => {
    const s = st("sensor.power", "640");
    expect(buttonFill(btn("sensor.power"), s, rule({ active: true }))).toBe(true);
    expect(buttonFill(btn("light.a"), st("light.a", "on"), rule({ active: false }))).toBe(false);
    expect(buttonFill(btn("light.a"), st("light.a", "on"), rule({ active: null }))).toBe(true);
  });

  it("in a rule's colour, its own, the thermostat's action's or its state's", () => {
    const heat = st("climate.a", "heat", { hvac_action: "heating" });
    expect(buttonFillColor(btn("climate.a"), heat, "red", "teal")).toBe("var(--red-color)");
    expect(buttonFillColor(btn("climate.a"), heat, null, "teal")).toBe("var(--teal-color)");
    expect(buttonFillColor(btn("climate.a"), heat, null, null)).toContain(
      "--state-climate-heat-color",
    );
    expect(buttonFillColor(btn("light.a"), st("light.a", "on"), null, null)).toContain(
      "--state-light",
    );
    expect(buttonFillColor(btn(null), undefined, null, null)).toBeNull();
  });
});
