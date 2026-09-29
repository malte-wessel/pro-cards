import { describe, it, expect } from "vitest";
import { snapshot, world } from "../../docs/.vitepress/theme/ha-shim/hass.ts";
import type { HassEntity } from "../../src/shared/ha.ts";

const st = (id: string, state: string, attributes: Record<string, unknown> = {}) =>
  ({ entity_id: id, state: String(state), attributes }) as unknown as HassEntity;

describe("hass shim", () => {
  const hass = snapshot();
  it("formats numeric states with unit and capped decimals", () => {
    expect(hass.formatEntityState(st("sensor.a", "17.4", { unit_of_measurement: "°C" }))).toBe(
      "17.4 °C",
    );
    expect(hass.formatEntityState(st("sensor.a", "1016.345", { unit_of_measurement: "hPa" }))).toBe(
      "1,016.35 hPa",
    );
    expect(hass.formatEntityState(st("sensor.a", "42"))).toBe("42");
  });
  it("translates common non-numeric states", () => {
    expect(hass.formatEntityState(st("light.a", "on"))).toBe("On");
    expect(hass.formatEntityState(st("person.a", "not_home"))).toBe("Away");
    expect(hass.formatEntityState(st("binary_sensor.w", "on", { device_class: "window" }))).toBe(
      "Open",
    );
    expect(hass.formatEntityState(st("binary_sensor.m", "off", { device_class: "moisture" }))).toBe(
      "Dry",
    );
    expect(hass.formatEntityState(st("scene.x", "2026-09-20T18:12:00+00:00"))).toBe("Scene");
    expect(hass.formatEntityState(st("vacuum.x", "some_state"))).toBe("Some state");
  });
  it("returns a fresh object per snapshot with the same world", () => {
    const a = snapshot(),
      b = snapshot();
    expect(a).not.toBe(b);
    expect(a.states).not.toBe(b.states);
    expect(a.states["light.living_room"]).toBe(b.states["light.living_room"]);
    expect(a.config.latitude).toBeTypeOf("number");
    expect(a.locale.language).toBe("en-GB");
  });
  it("applies services to the world", async () => {
    world.set("light.garden", "off");
    await hass.callService("homeassistant", "toggle", { entity_id: "light.garden" });
    expect(world.get("light.garden")!.state).toBe("on");
    await hass.callService("light", "turn_off", { entity_id: ["light.garden"] });
    expect(world.get("light.garden")!.state).toBe("off");
    await hass.callService("cover", "close_cover", { entity_id: "cover.awning" });
    expect(world.get("cover.awning")).toMatchObject({
      state: "closed",
      attributes: { current_position: 0 },
    });
    await hass.callService("cover", "open_cover", {}, { entity_id: "cover.awning" });
    expect(world.get("cover.awning")!.state).toBe("open");
    await expect(
      hass.callService("scene", "turn_on", { entity_id: "scene.bright" }),
    ).resolves.toBeUndefined();
  });
  it("answers history and template subscriptions", async () => {
    const end = new Date(),
      start = new Date(end.getTime() - 3600e3);
    const res = await hass.callWS<Record<string, unknown[]>>({
      type: "history/history_during_period",
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      entity_ids: ["sensor.outdoor_temperature"],
    });
    expect(res["sensor.outdoor_temperature"].length).toBeGreaterThan(3);
    await expect(hass.callWS({ type: "nope" })).rejects.toThrow();

    const results: string[] = [];
    const unsub = await hass.connection.subscribeMessage<{ result: string }>(
      (m) => results.push(m.result),
      {
        type: "render_template",
        template: "{{ states('light.garden') }}!",
      },
    );
    expect(results).toEqual(["off!"]);
    world.set("light.garden", "on");
    expect(results.at(-1)).toBe("on!");
    unsub();
    world.set("light.garden", "off");
    expect(results.length).toBe(2);
    const bad: string[] = [];
    await hass.connection.subscribeMessage<{ result: string }>((m) => bad.push(m.result), {
      type: "render_template",
      template: "{% if x %}y{% endif %}",
    });
    expect(bad).toEqual(["{% if x %}y{% endif %}"]);
  });
});
