import { describe, it, expect } from "vitest";
import { world } from "../../docs/.vitepress/theme/ha-shim/world.ts";

const DAY = 86400e3;

describe("demo world", () => {
  it("has a valid state object for every entity", () => {
    const ids = Object.keys(world.states);
    expect(ids.length).toBeGreaterThanOrEqual(70);
    for (const id of ids) {
      const st = world.states[id];
      expect(st.entity_id).toBe(id);
      expect(typeof st.state).toBe("string");
      expect(st.attributes).toBeTypeOf("object");
      expect(() => new Date(st.last_updated).toISOString()).not.toThrow();
      expect(id).toMatch(/^[a-z_]+\.[a-z0-9_]+$/);
    }
    for (const id of [
      "sensor.outdoor_temperature",
      "light.living_room",
      "person.alex",
      "sun.sun",
      "scene.movie_night",
      "vacuum.robot",
    ])
      expect(world.states[id]).toBeDefined();
  });

  it("generates deterministic history that ends at the current state and respects bounds", () => {
    const end = Date.now(),
      start = end - DAY;
    const a = world.history(
      ["sensor.outdoor_temperature", "sensor.outdoor_humidity", "binary_sensor.rain"],
      start,
      end,
    );
    const b = world.history(
      ["sensor.outdoor_temperature", "sensor.outdoor_humidity", "binary_sensor.rain"],
      start,
      end,
    );
    expect(a).toEqual(b);
    const t = a["sensor.outdoor_temperature"];
    expect(t.length).toBeGreaterThan(100);
    expect(t[0].lu).toBeGreaterThanOrEqual(start / 1000);
    expect(t[t.length - 1].lu).toBeLessThan(end / 1000);
    for (let i = 1; i < t.length; i++) expect(t[i].lu).toBeGreaterThan(t[i - 1].lu);
    for (const p of a["sensor.outdoor_humidity"]) {
      expect(Number(p.s)).toBeGreaterThanOrEqual(20);
      expect(Number(p.s)).toBeLessThanOrEqual(100);
    }
    const rain = a["binary_sensor.rain"];
    expect(new Set(rain.map((p) => p.s))).toEqual(new Set(["on", "off"]));
    expect(rain[rain.length - 1].s).toBe(world.states["binary_sensor.rain"].state);
    expect(world.history(["sensor.nope"], start, end)["sensor.nope"]).toEqual([]);
  });

  it("set() replaces the state object, bumps last_changed only on state change and notifies", () => {
    const before = world.get("light.kitchen")!;
    let calls = 0;
    const off = world.subscribe(() => calls++);
    world.set("light.kitchen", "on", { brightness: 10 });
    const after = world.get("light.kitchen")!;
    expect(after).not.toBe(before);
    expect(after.state).toBe("on");
    expect(after.attributes.brightness).toBe(10);
    expect(after.attributes.friendly_name).toBe("Kitchen");
    expect(after.last_changed).not.toBe(before.last_changed);
    world.set("light.kitchen", undefined, { brightness: 20 });
    expect(world.get("light.kitchen")!.last_changed).toBe(after.last_changed);
    expect(calls).toBe(2);
    off();
    world.set("light.kitchen", "off");
    expect(calls).toBe(2);
    world.set("nope.x", "on");
  });
});
