import { describe, it, expect } from "vitest";
import {
  cssColor,
  domainOf,
  resolveHex,
  safeColor,
  stateActive,
  stateColorCss,
  stateColorProperties,
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

describe("colours that reach markup", () => {
  const evil = [
    'red" onload="alert(1)',
    '#fff"><script>alert(1)</script>',
    'rgb(1,2,3)" x="',
    "var(--x); background: red",
    "url(#a)",
    "<b>",
    "red'",
  ];
  it("pass plain colour tokens through", () => {
    for (const c of [
      "amber",
      "deep-purple",
      "#7e57c2",
      "#7e57c280",
      "rgb(1, 2, 3)",
      "rgba(0,0,0,.5)",
    ])
      expect(safeColor(c)).toBe(c);
    expect(safeColor("hsl(200deg 50% 40% / 80%)")).toBe("hsl(200deg 50% 40% / 80%)");
    expect(safeColor("var(--my-color)")).toBe("var(--my-color)");
    expect(safeColor("color-mix(in srgb, var(--red-color) 20%, transparent)")).not.toBe(null);
  });
  it("count anything else as no colour", () => {
    for (const c of evil) {
      expect(safeColor(c)).toBe(null);
      expect(cssColor(c, "var(--primary-color)")).toBe("var(--primary-color)");
      expect(cssColor(c)).toBe(undefined);
      expect(resolveHex(c)).toBe("#888888");
    }
    expect(safeColor(42)).toBe(null);
  });
  it("resolve only well-formed hex values", () => {
    expect(resolveHex("#abc")).toBe("#abc");
    expect(resolveHex("#abcdef")).toBe("#abcdef");
    expect(resolveHex("#ab-cd")).toBe("#888888");
    expect(resolveHex("amber")).toBe("#ffc107");
  });
  it("slug the device class into the theme property name", () => {
    const props = stateColorProperties(
      st("binary_sensor.a", "on", { device_class: 'door") x="1' }),
    );
    expect(props?.[0]).toBe("--state-binary_sensor-door_x_1-on-color");
    expect(
      safeColor(stateColorCss(st("binary_sensor.a", "on", { device_class: '"><b>' }))),
    ).not.toBe(null);
  });
});
