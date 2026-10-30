import { describe, it, expect, vi } from "vitest";
import { DEMO_USER, snapshot, world } from "../../docs/.vitepress/theme/ha-shim/hass.ts";
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
  it("logs in the demo user, whose person entity names it", () => {
    expect(hass.user?.id).toBe(DEMO_USER);
    expect(hass.locale.time_zone).toBe("server");
    expect(world.get("person.malte")?.attributes.user_id).toBe(DEMO_USER);
  });
  it("returns a fresh object per snapshot with the same world", () => {
    const a = snapshot(),
      b = snapshot();
    expect(a).not.toBe(b);
    expect(a.states).not.toBe(b.states);
    expect(a.states["light.living_room"]).toBe(b.states["light.living_room"]);
    // one connection for the page's life, as Home Assistant's: a new one means a reconnect
    expect(a.connection).toBe(b.connection);
    expect(a.config.latitude).toBeTypeOf("number");
    expect(a.locale.language).toBe("en-GB");
  });
  it("applies services to the world", async () => {
    world.set("light.garden", "off");
    await hass.callService("homeassistant", "toggle", { entity_id: "light.garden" });
    expect(world.get("light.garden")!.state).toBe("on");
    await hass.callService("light", "turn_off", { entity_id: ["light.garden"] });
    expect(world.get("light.garden")!.state).toBe("off");
    await expect(
      hass.callService("scene", "turn_on", { entity_id: "scene.bright" }),
    ).resolves.toBeUndefined();
  });
  it("moves a cover through its positions, as a real one reports them, and stops it", async () => {
    vi.useFakeTimers();
    try {
      const pos = () => world.get("cover.awning")!.attributes.current_position;
      world.set("cover.awning", "open", { current_position: 70 });
      await hass.callService("cover", "close_cover", { entity_id: "cover.awning" });
      expect(world.get("cover.awning")!.state).toBe("closing");
      vi.advanceTimersByTime(250);
      expect(world.get("cover.awning")).toMatchObject({
        state: "closing",
        attributes: { current_position: 66 },
      });
      // stopped on its way: it stays there, open
      await hass.callService("cover", "stop_cover", { entity_id: "cover.awning" });
      vi.advanceTimersByTime(1000);
      expect(world.get("cover.awning")).toMatchObject({ state: "open" });
      expect(pos()).toBe(66);
      // to a position, then all the way: each run ends where it was sent
      await hass.callService("cover", "set_cover_position", {
        entity_id: "cover.awning",
        position: 80,
      });
      expect(world.get("cover.awning")!.state).toBe("opening");
      vi.advanceTimersByTime(10_000);
      expect(world.get("cover.awning")!.state).toBe("open");
      expect(pos()).toBe(80);
      await hass.callService("cover", "close_cover", {}, { entity_id: "cover.awning" });
      vi.advanceTimersByTime(10_000);
      expect(world.get("cover.awning")).toMatchObject({ state: "closed" });
      expect(pos()).toBe(0);
      // one without a position is on its way for a while, then there
      world.set("cover.garage_door", "closed");
      await hass.callService("cover", "open_cover", { entity_id: "cover.garage_door" });
      expect(world.get("cover.garage_door")!.state).toBe("opening");
      vi.advanceTimersByTime(10_000);
      expect(world.get("cover.garage_door")!.state).toBe("open");
    } finally {
      vi.useRealTimers();
    }
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
