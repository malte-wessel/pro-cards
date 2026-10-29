import { afterEach, describe, it, expect, vi } from "vitest";
import {
  canRead,
  detectKind,
  parseKind,
  resolveKind,
} from "../../../../src/shared/kinds/detect.ts";
import { KINDS } from "../../../../src/shared/kinds/registry.ts";
import type { HassEntity } from "../../../../src/shared/ha.ts";

const T = "poster-card-pro";
const st = (id: string, attributes: Record<string, unknown> = {}, state = "1") =>
  ({ entity_id: id, state, attributes }) as unknown as HassEntity;
const spec = (raw: unknown) => parseKind(raw, T);

afterEach(() => vi.restoreAllMocks());

describe("parseKind", () => {
  it("reads nothing, a name or an object with an optional type", () => {
    expect(spec(undefined)).toEqual({ type: null, opts: {} });
    expect(spec(null)).toEqual({ type: null, opts: {} });
    expect(spec("wind")).toEqual({ type: "wind", opts: {} });
    expect(spec({ type: "cover", style: "garage" })).toEqual({
      type: "cover",
      opts: { style: "garage" },
    });
    expect(spec({ flow: "lines" })).toEqual({ type: null, opts: { flow: "lines" } });
  });

  it("names the kinds when one is unknown", () => {
    expect(() => spec("room")).toThrow(/kind must be one of entity \| battery .* not 'room'/);
    expect(() => spec({ type: "room" })).toThrow(/kind.type must be one of/);
    expect(() => spec(["wind"])).toThrow(/kind must be a name or an object/);
    expect(() => spec(3)).toThrow(/kind must be a name or an object/);
  });
});

describe("detectKind", () => {
  it("goes by the domain, then the entity id, then the device class", () => {
    expect(detectKind("light.kitchen", st("light.kitchen")).name).toBe("light");
    expect(detectKind("weather.home", undefined).name).toBe("weather");
    expect(detectKind("sun.sun", undefined).name).toBe("sun");
    expect(detectKind("lawn_mower.garden", undefined).name).toBe("lawn_mower");
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
  const resolve = (raw: unknown, entity: string | null, s?: HassEntity) =>
    resolveKind(spec(raw), entity, s, T).name;

  it("takes the written kind, checked against the entity and its keys", () => {
    expect(resolve("grid", "sensor.grid_power")).toBe("grid");
    expect(resolve({ type: "cover", style: "garage" }, "cover.garage_door")).toBe("cover");
    expect(() => resolve("wind", "light.kitchen")).toThrow(
      /kind 'wind' reads a wind_speed sensor or a weather entity .*, not light.kitchen/,
    );
    expect(() => resolve("light", null)).toThrow(/not a card without an entity/);
    expect(() => resolve({ type: "cover", flow: "lines" }, "cover.garage_door")).toThrow(
      /kind 'cover' takes style, not flow/,
    );
    expect(() => resolve({ type: "light", style: "x" }, "light.kitchen")).toThrow(
      /kind 'light' takes no keys, not style/,
    );
  });

  it("detects the kind when none is written", () => {
    expect(resolve(undefined, "light.kitchen")).toBe("light");
    expect(resolve(undefined, null)).toBe("entity");
    const speed = st("sensor.wind_speed", { device_class: "wind_speed" });
    expect(resolve({ flow: "lines" }, "sensor.wind_speed", speed)).toBe("wind");
  });

  it("finds the one kind whose keys the object names", () => {
    expect(resolve({ import: "sensor.a", export: "sensor.b" }, "sensor.grid_power")).toBe("grid");
    expect(resolve({ import: "sensor.a" }, null)).toBe("grid");
    expect(resolve({ running_above: 5 }, "sensor.washer_power")).toBe("appliance");
  });

  it("leaves out keys the detected kind does not take, with a warning once the state is known", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // `today` is solar's and rain's: no one kind fits, so the detected one stays
    expect(resolve({ today: "sensor.t" }, "sensor.p")).toBe("entity");
    expect(warn).not.toHaveBeenCalled();
    expect(resolve({ today: "sensor.t" }, "sensor.p", st("sensor.p"))).toBe("entity");
    expect(warn).toHaveBeenCalledWith(`${T}: kind 'entity' takes no today; left out`);
    // a trend is never inferred (it reads any entity): it is written
    expect(resolve({ entities: ["sensor.a"] }, null)).toBe("entity");
    expect(warn).toHaveBeenLastCalledWith(`${T}: kind 'entity' takes no entities; left out`);
  });
});
