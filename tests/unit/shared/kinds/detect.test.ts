import { describe, it, expect } from "vitest";
import {
  canRead,
  detectKind,
  parseKind,
  resolveKind,
  unusedKeys,
} from "../../../../src/shared/kinds/detect.ts";
import { KINDS } from "../../../../src/shared/kinds/registry.ts";
import type { HassEntity } from "../../../../src/shared/ha.ts";

const T = "poster-card-pro";
const st = (id: string, attributes: Record<string, unknown> = {}, state = "1") =>
  ({ entity_id: id, state, attributes }) as unknown as HassEntity;
const kind = (raw: unknown) => parseKind(raw, T);

describe("parseKind", () => {
  it("reads nothing or a kind's name", () => {
    expect(kind(undefined)).toBeNull();
    expect(kind(null)).toBeNull();
    expect(kind("wind")).toBe("wind");
    expect(kind("entity")).toBe("entity");
    // covers and appliances have kinds of their own
    expect(kind("garage")).toBe("garage");
    expect(kind("washer")).toBe("washer");
  });

  it("names the kinds when one is unknown", () => {
    expect(() => kind("room")).toThrow(
      `${T}: kind must be one of entity | battery | carbon_dioxide`,
    );
    expect(() => kind("room")).toThrow(/, not "room"$/);
    expect(() => kind({ type: "wind" })).toThrow(/kind must be one of/);
    expect(() => kind(3)).toThrow(/not 3/);
  });
});

describe("detectKind", () => {
  it("goes by the domain, then the entity id, then the device class", () => {
    expect(detectKind("light.kitchen", st("light.kitchen")).name).toBe("light");
    expect(detectKind("weather.home", undefined).name).toBe("weather");
    expect(detectKind("sun.sun", undefined).name).toBe("sun");
    expect(detectKind("lawn_mower.garden", undefined).name).toBe("lawn_mower");
    // a cover is the generic cover kind, drawn by its device class; its own kinds are only named
    expect(detectKind("cover.garage", st("cover.garage", { device_class: "garage" })).name).toBe(
      "cover",
    );
    const dc = (device_class: string) =>
      detectKind("sensor.x", st("sensor.x", { device_class })).name;
    expect(dc("wind_speed")).toBe("wind");
    expect(dc("precipitation_intensity")).toBe("rain");
    expect(dc("battery")).toBe("battery");
    expect(dc("carbon_dioxide")).toBe("carbon_dioxide");
    expect(dc("pm25")).toBe("pm25");
    expect(dc("aqi")).toBe("aqi");
  });

  it("falls back to entity, and never detects a role kind", () => {
    expect(detectKind(null, undefined).name).toBe("entity");
    expect(detectKind("sensor.x", undefined).name).toBe("entity");
    expect(detectKind("sensor.x", st("sensor.x", { device_class: "temperature" })).name).toBe(
      "entity",
    );
    // grid, solar, car, appliance and trend have no domain and no device class of their own
    expect(detectKind("sensor.x", st("sensor.x", { device_class: "power" })).name).toBe("entity");
    expect(detectKind("sensor.x", st("sensor.x", { device_class: "energy" })).name).toBe("entity");
  });

  it("goes by the device class only for a domain the type reads", () => {
    const b = "binary_sensor.phone_battery_low";
    expect(detectKind(b, st(b, { device_class: "battery" })).name).toBe("entity");
    const n = "number.co2_target";
    expect(detectKind(n, st(n, { device_class: "carbon_dioxide" })).name).toBe("carbon_dioxide");
  });
});

describe("canRead", () => {
  it("checks the entity's domain, or whether the kind draws without one", () => {
    expect(canRead(KINDS.wind, "sensor.wind_speed")).toBe(true);
    expect(canRead(KINDS.wind, "weather.home")).toBe(true);
    expect(canRead(KINDS.wind, "light.kitchen")).toBe(false);
    expect(canRead(KINDS.person, "device_tracker.ev")).toBe(true);
    expect(canRead(KINDS.entity, "light.kitchen")).toBe(true);
    expect(canRead(KINDS.entity, null)).toBe(true);
    expect(canRead(KINDS.sun, null)).toBe(true);
    expect(canRead(KINDS.grid, null)).toBe(true);
    expect(canRead(KINDS.light, null)).toBe(false);
  });
});

describe("resolveKind", () => {
  const resolve = (name: string | null, entity: string | null, s?: HassEntity) =>
    resolveKind(name, entity, s, T).name;

  it("takes the written type, checked against the entity", () => {
    expect(resolve("grid", "sensor.grid_power")).toBe("grid");
    expect(resolve("cover", "cover.garage_door")).toBe("cover");
    expect(resolve("garage", "cover.garage_door")).toBe("garage");
    expect(() => resolve("garage", "sensor.x")).toThrow(`${T}: the garage kind reads a cover`);
    expect(resolve("entity", "weather.home")).toBe("entity");
    expect(resolve("sun", null)).toBe("sun");
    expect(() => resolve("wind", "light.kitchen")).toThrow(
      `${T}: the wind kind reads a wind_speed sensor or a weather entity (wind_speed, wind_bearing, wind_gust_speed), not light.kitchen`,
    );
    expect(() => resolve("light", null)).toThrow(
      `${T}: the light kind reads a light, not a card without an entity`,
    );
  });

  it("detects the type when none is written", () => {
    expect(resolve(null, "light.kitchen")).toBe("light");
    expect(resolve(null, null)).toBe("entity");
    const speed = st("sensor.wind_speed", { device_class: "wind_speed" });
    expect(resolve(null, "sensor.wind_speed", speed)).toBe("wind");
  });
});

describe("unusedKeys", () => {
  it("lists the keys of other types the card sets", () => {
    expect(unusedKeys(KINDS.rain, { entity: "sensor.r", gust: "sensor.g", today: false })).toEqual([
      "gust",
    ]);
    expect(unusedKeys(KINDS.entity, { import: "sensor.a", series: ["sensor.b"] })).toEqual([
      "import",
      "series",
    ]);
    expect(unusedKeys(KINDS.garage, { kind: "garage", running_above: 3 })).toEqual([
      "running_above",
    ]);
    expect(unusedKeys(KINDS.washer, { kind: "washer", running_above: 3 })).toEqual([]);
    // the card's own keys are never another type's
    expect(unusedKeys(KINDS.light, { entity: "light.x", name: "A", color: "red" })).toEqual([]);
    expect(
      unusedKeys(KINDS.wind, {
        visual: { type: "flow", style: "lines" },
        direction: false,
        gust: undefined,
      }),
    ).toEqual([]);
  });
});
