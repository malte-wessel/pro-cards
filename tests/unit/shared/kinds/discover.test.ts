import { afterEach, describe, it, expect, vi } from "vitest";
import {
  deviceSiblings,
  findInput,
  logOnce,
  type Registry,
} from "../../../../src/shared/kinds/discover.ts";
import { snapshot } from "../../../../docs/.vitepress/theme/ha-shim/hass.ts";
import type { HassEntity } from "../../../../src/shared/ha.ts";

afterEach(() => vi.restoreAllMocks());

// a registry of entities on devices: id → [device, attributes, translation key, hidden]
const registry = (
  table: Record<string, [string | null, Record<string, unknown>, string?, boolean?]>,
): Registry => ({
  states: Object.fromEntries(
    Object.entries(table).map(([id, [, attributes]]) => [
      id,
      { entity_id: id, state: "1", attributes } as unknown as HassEntity,
    ]),
  ),
  entities: Object.fromEntries(
    Object.entries(table).map(([id, [device_id, , translation_key, hidden]]) => [
      id,
      {
        entity_id: id,
        device_id,
        translation_key: translation_key ?? null,
        hidden,
      },
    ]),
  ),
});

const station = registry({
  "sensor.speed": ["ws", { device_class: "wind_speed" }],
  "sensor.gust": ["ws", { device_class: "wind_speed" }, "wind_gust"],
  "sensor.bearing": ["ws", { unit_of_measurement: "°" }],
  "sensor.temp": ["ws", { device_class: "temperature" }],
  "sensor.hidden": ["ws", { device_class: "humidity" }, undefined, true],
  "sensor.elsewhere": ["other", { device_class: "wind_direction" }],
  "sensor.loose": [null, { device_class: "wind_direction" }],
});

describe("deviceSiblings", () => {
  it("lists the other shown entities on the same device", () => {
    expect(deviceSiblings(station, "sensor.speed")).toEqual([
      "sensor.gust",
      "sensor.bearing",
      "sensor.temp",
    ]);
  });

  it("finds none for an entity without a device or outside the registry", () => {
    expect(deviceSiblings(station, "sensor.loose")).toEqual([]);
    expect(deviceSiblings(station, "sensor.unknown")).toEqual([]);
    expect(deviceSiblings({ ...station, entities: undefined }, "sensor.speed")).toEqual([]);
  });
});

describe("findInput", () => {
  const ids = deviceSiblings(station, "sensor.speed");

  it("picks the one entity of the device class", () => {
    expect(findInput(station, ids, { domains: ["sensor"], deviceClasses: ["temperature"] })).toBe(
      "sensor.temp",
    );
    expect(findInput(station, ids, { domains: ["binary_sensor"] })).toBeNull();
  });

  it("falls back to the unit for a candidate without a device class", () => {
    const f = { domains: ["sensor"], deviceClasses: ["wind_direction"], unit: "°" };
    expect(findInput(station, ids, f)).toBe("sensor.bearing");
  });

  it("tells candidates apart by translation key, and needs it where asked", () => {
    const gust = {
      domains: ["sensor"],
      deviceClasses: ["wind_speed"],
      translationKey: /gust/i,
      needsKey: true,
    };
    expect(findInput(station, ["sensor.gust", "sensor.speed"], gust)).toBe("sensor.gust");
    // one candidate left, yet its key says nothing: not a gust
    expect(findInput(station, ["sensor.speed"], gust)).toBeNull();
  });

  it("never guesses between two", () => {
    const both = registry({
      "sensor.a": ["d", { device_class: "power" }],
      "sensor.b": ["d", { device_class: "power" }],
    });
    expect(
      findInput(both, ["sensor.a", "sensor.b"], { domains: ["sensor"], deviceClasses: ["power"] }),
    ).toBeNull();
  });

  it("finds the demo home's inputs on their devices", () => {
    const hass = snapshot();
    const near = (id: string) => deviceSiblings(hass, id);
    expect(
      findInput(hass, near("sensor.wind_speed"), {
        domains: ["sensor"],
        deviceClasses: ["wind_speed"],
        translationKey: /gust/i,
        needsKey: true,
      }),
    ).toBe("sensor.wind_gust");
    expect(
      findInput(hass, near("sensor.ev_battery"), {
        domains: ["binary_sensor"],
        deviceClasses: ["plug"],
      }),
    ).toBe("binary_sensor.ev_plugged");
  });
});

describe("logOnce", () => {
  it("says a message once per page", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    logOnce("found a gust (discover.test)");
    logOnce("found a gust (discover.test)");
    logOnce("found a direction (discover.test)");
    expect(info).toHaveBeenCalledTimes(2);
  });
});
