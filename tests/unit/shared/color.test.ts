import { describe, it, expect } from "vitest";
import {
  stateActive,
  stateColorCss,
  stateColorProperties,
  domainOf,
} from "../../../src/shared/color.ts";
import type { HassEntity } from "../../../src/shared/ha.ts";

const st = (entity_id: string, state: string, attributes: Record<string, unknown> = {}) =>
  ({ entity_id, state, attributes }) as unknown as HassEntity;

describe("Home Assistant state colours", () => {
  it("knows which states are active per domain", () => {
    expect(stateActive(st("light.a", "on"))).toBe(true);
    expect(stateActive(st("light.a", "off"))).toBe(false);
    expect(stateActive(st("light.a", "unavailable"))).toBe(false);
    expect(stateActive(st("lock.a", "locked"))).toBe(false);
    expect(stateActive(st("lock.a", "unlocked"))).toBe(true);
    expect(stateActive(st("cover.a", "closed"))).toBe(false);
    expect(stateActive(st("person.a", "not_home"))).toBe(false);
    expect(stateActive(st("person.a", "home"))).toBe(true);
    expect(stateActive(st("vacuum.a", "docked"))).toBe(false);
    expect(stateActive(st("media_player.a", "standby"))).toBe(false);
    expect(stateActive(st("media_player.a", "playing"))).toBe(true);
    expect(stateActive(st("alert.a", "off"))).toBe(true);
    expect(stateActive(st("alert.a", "idle"))).toBe(false);
    expect(stateActive(st("scene.a", "2026-01-01T00:00:00"))).toBe(true);
    expect(stateActive(st("timer.a", "idle"))).toBe(false);
    expect(stateActive(st("light.a", "on"), "off")).toBe(false); // state override
    expect(domainOf("binary_sensor.x")).toBe("binary_sensor");
  });
  it("lists the theme properties most specific first", () => {
    expect(stateColorProperties(st("light.a", "on"))).toEqual([
      "--state-light-on-color",
      "--state-light-active-color",
      "--state-active-color",
    ]);
    expect(stateColorProperties(st("binary_sensor.a", "on", { device_class: "moisture" }))).toEqual(
      [
        "--state-binary_sensor-moisture-on-color",
        "--state-binary_sensor-on-color",
        "--state-binary_sensor-active-color",
        "--state-active-color",
      ],
    );
    expect(stateColorProperties(st("lock.a", "locked"))).toEqual([
      "--state-lock-locked-color",
      "--state-lock-inactive-color",
      "--state-inactive-color",
    ]);
    expect(stateColorProperties(st("sun.sun", "above_horizon"))?.[0]).toBe(
      "--state-sun-above_horizon-color",
    );
  });
  it("colours batteries by level and leaves plain sensors alone", () => {
    const bat = (v: string) => stateColorProperties(st("sensor.b", v, { device_class: "battery" }));
    expect(bat("85")).toEqual(["--state-sensor-battery-high-color"]);
    expect(bat("30")).toEqual(["--state-sensor-battery-medium-color"]);
    expect(bat("12")).toEqual(["--state-sensor-battery-low-color"]);
    expect(bat("unknown")).toBe(null);
    expect(stateColorProperties(st("sensor.t", "21.5", { device_class: "temperature" }))).toBe(
      null,
    );
    expect(stateColorProperties(st("sensor.t", "on"))).toBe(null);
    expect(stateColorProperties(null as unknown as undefined)).toBe(null);
  });
  it("builds a nested var() chain and handles unavailable", () => {
    expect(stateColorCss(st("light.a", "on"))).toBe(
      "var(--state-light-on-color, var(--state-light-active-color, var(--state-active-color)))",
    );
    expect(stateColorCss(st("light.a", "unavailable"))).toBe("var(--state-unavailable-color)");
    expect(stateColorCss(st("sensor.a", "5"))).toBe(null);
    // the state can be overridden, e.g. for a history bucket
    expect(stateColorCss(st("light.a", "on"), "off")).toBe(
      "var(--state-light-off-color, var(--state-light-inactive-color, var(--state-inactive-color)))",
    );
  });
});
