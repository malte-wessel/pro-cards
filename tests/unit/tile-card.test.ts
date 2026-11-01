import { afterEach, describe, it, expect, vi } from "vitest";
import { TileCard } from "../../src/tile-card.ts";
import { iconBadgeOf } from "../../src/tile/badge.ts";
import { normalizeTileConfig } from "../../src/tile/config.ts";
import { placementsOf } from "../../src/shared/entity/control.ts";
import { snapshot } from "../../docs/.vitepress/theme/ha-shim/hass.ts";

const T = "tile-card-pro";
const norm = (cfg: Record<string, unknown>) => normalizeTileConfig(cfg, snapshot() as never);
const kinds = (list: { kind: string; position: string }[]) =>
  list.map((p) => `${p.kind}@${p.position}`);

afterEach(() => vi.restoreAllMocks());

describe("tile-card config", () => {
  it("is registered and checks its config", () => {
    expect(customElements.get(T)).toBe(TileCard);
    expect(window.customCards?.some((c) => c.type === T)).toBe(true);
    expect(() => norm(null as never)).toThrow(`${T}: invalid config`);
    expect(() => norm({ entity: "light.kitchen", poster: "wind" })).toThrow(
      `${T}: the wind poster reads a wind_speed sensor or a weather entity`,
    );
  });

  it("names the tile's own keys in place of the entity card's", () => {
    const e = "sensor.living_room_temperature";
    expect(() => norm({ entity: e, visual: "ring" })).toThrow(
      `${T}: visual: ring is icon_ring: true on the tile card`,
    );
    expect(() => norm({ entity: "light.desk_lamp", toggle: true })).toThrow(
      `${T}: toggle is control: toggle on the tile card`,
    );
    expect(() => norm({ entity: e, visual: "icon" })).toThrow(`${T}: visual: icon is the tile's`);
    expect(() => norm({ entity: e, visual: "badge" })).toThrow(`${T}: visual: badge is gone`);
  });

  it("is one tile with its kind, its rules and its inputs", () => {
    const c = norm({ entity: "sensor.living_room_co2" });
    expect(c.kind.name).toBe("carbon_dioxide");
    expect(c.groups).toEqual([expect.objectContaining({ layout: "tile", idxs: [0] })]);
    expect(c.entities[0].rules.length).toBeGreaterThan(0);
    const w = norm({ entity: "sensor.wind_speed" });
    expect(Object.keys(w.inputs).sort()).toEqual(["direction", "gust"]);
    expect(norm({ entity: "sensor.living_room_temperature" }).statusIdx).not.toBeNull();
    expect(norm({ entity: "sensor.living_room_temperature", status: false }).statusIdx).toBeNull();
    expect(
      norm({ entity: "sensor.living_room_temperature", status: "{{ 'a' }}" }).statusText,
    ).toEqual({ kind: "template", template: "{{ 'a' }}" });
  });

  it("draws a kind's controls at the line's end only, unless the card names one below", () => {
    const light = norm({ entity: "light.desk_lamp" }).entities[0];
    expect(kinds(placementsOf(light, "tile"))).toEqual(["toggle@end"]);
    const cover = norm({ entity: "cover.living_room_blinds" }).entities[0];
    expect(kinds(placementsOf(cover, "tile"))).toEqual(["buttons@end"]);
    const slider = norm({ entity: "light.desk_lamp", control: "slider" }).entities[0];
    expect(kinds(placementsOf(slider, "tile"))).toEqual(["slider@block"]);
    expect(norm({ entity: "light.desk_lamp", control: false }).entities[0].control).toBeNull();
  });

  it("answers the pointer and toggles from its icon by default, as Home Assistant's tile", () => {
    expect(norm({ entity: "sensor.living_room_temperature" }).entities[0].hover).toBe(true);
    expect(norm({ entity: "sensor.living_room_temperature", hover: false }).entities[0].hover).toBe(
      false,
    );
    const tap = (entity: string, o: Record<string, unknown> = {}) =>
      norm({ entity, ...o }).iconActions.tap?.action ?? null;
    for (const e of [
      "light.desk_lamp",
      "switch.coffee_machine",
      "fan.bedroom",
      "scene.movie_night",
    ])
      expect(tap(e), e).toBe("toggle");
    // what has no toggle, and a lock's hold of its own
    for (const e of ["sensor.living_room_temperature", "cover.office_blinds", "lock.front_door"])
      expect(tap(e), e).toBeNull();
    expect(norm({ entity: "lock.front_door" }).iconActions.hold?.action).toBe("toggle");
    expect(tap("light.desk_lamp", { icon_tap_action: "none" })).toBeNull();
    expect(tap("light.desk_lamp", { icon_tap_action: { action: "more-info" } })).toBe("more-info");
  });

  it("keeps the status on the line unless it is asked for as a badge", () => {
    const badges = ["sensor.living_room_temperature", { attribute: "unit_of_measurement" }];
    const line = norm({ entity: "sensor.living_room_co2", badges });
    expect(line.statusBadge).toBe(false);
    expect(line.groups[0].badgeIdxs).not.toContain(line.statusIdx);
    expect(line.groups[0].badgeIdxs).toHaveLength(2);
    // a badge without an entity reads the tile's
    expect(line.entities[line.groups[0].badgeIdxs![1]].entity).toBe("sensor.living_room_co2");
    // status_badge: first among the badges, a tag
    const badge = norm({ entity: "sensor.living_room_co2", status_badge: true, badges });
    expect(badge.statusBadge).toBe(true);
    expect(badge.groups[0].badgeIdxs?.[0]).toBe(badge.statusIdx);
    expect(badge.entities[badge.statusIdx!].badge).toEqual({ style: "tag", size: "s" });
    // `status` in the list places it, and asks for it
    const placed = norm({ entity: "sensor.living_room_co2", badges: ["sensor.a", "status"] });
    expect(placed.statusBadge).toBe(true);
    expect(placed.groups[0].badgeIdxs?.at(-1)).toBe(placed.statusIdx);
    expect(
      norm({ entity: "sensor.living_room_co2", status: false, status_badge: true }).groups[0]
        .badgeIdxs,
    ).toEqual([]);
  });

  it("takes the icon's badge as Home Assistant's, none or its own", () => {
    const e = "sensor.wind_speed";
    expect(norm({ entity: e }).iconBadge).toBe("auto");
    expect(norm({ entity: e, icon_badge: "auto" }).iconBadge).toBe("auto");
    expect(norm({ entity: e, icon_badge: false }).iconBadge).toBe(false);
    expect(
      norm({ entity: e, icon_badge: { icon: "mdi:alert", color: "{{ 'red' }}" } }).iconBadge,
    ).toEqual({
      icon: { kind: "text", text: "mdi:alert" },
      color: { kind: "template", template: "{{ 'red' }}" },
    });
    expect(() => norm({ entity: e, icon_badge: 3 })).toThrow(
      "tile-card-pro: icon_badge takes auto, false or { icon, color }",
    );
  });

  it("draws Home Assistant's badge on the icon: an action, a zone, unavailable", () => {
    const hass = snapshot() as never;
    const st = (entity_id: string, state: string, attributes: Record<string, unknown> = {}) =>
      ({ entity_id, state, attributes }) as never;
    const heat = iconBadgeOf(hass, st("climate.a", "heat", { hvac_action: "heating" }));
    expect(heat?.icon).toBe("mdi:fire");
    expect(heat?.color).toContain("--state-climate-heat-color");
    expect(iconBadgeOf(hass, st("climate.a", "cool", { hvac_action: "cooling" }))?.icon).toBe(
      "mdi:snowflake",
    );
    expect(iconBadgeOf(hass, st("climate.a", "off", { hvac_action: "off" }))).toBeNull();
    expect(iconBadgeOf(hass, st("humidifier.a", "on", { action: "drying" }))?.icon).toBe(
      "mdi:arrow-down-bold",
    );
    expect(iconBadgeOf(hass, st("person.a", "home"))?.icon).toBe("mdi:home");
    expect(iconBadgeOf(hass, st("person.a", "not_home"))?.icon).toBe("mdi:home-export-outline");
    expect(iconBadgeOf(hass, st("light.a", "unavailable"))?.icon).toBe("mdi:exclamation-thick");
    expect(iconBadgeOf(hass, st("light.a", "unknown"))).toBeNull();
    expect(iconBadgeOf(hass, st("sensor.a", "21"))).toBeNull();
    // a zone of its own: the zone's icon
    const withZone = {
      ...(hass as object),
      states: {
        "zone.work": st("zone.work", "0", { friendly_name: "Work", icon: "mdi:briefcase" }),
      },
    } as never;
    expect(iconBadgeOf(withZone, st("person.a", "Work"))?.icon).toBe("mdi:briefcase");
  });

  it("takes one row unless something below the line needs a second", () => {
    const grid = (cfg: Record<string, unknown>) => {
      const el = new TileCard();
      el.setConfig(cfg);
      return el.getGridOptions();
    };
    expect(grid({ entity: "sensor.living_room_temperature" })).toEqual({
      columns: 6,
      rows: "auto",
      min_columns: 3,
      min_rows: 1,
    });
    expect(grid({ entity: "sensor.living_room_temperature", visual: "sparkline" })).toMatchObject({
      min_rows: 2,
    });
    expect(grid({ entity: "weather.home", show_picture: true })).toMatchObject({ min_rows: 2 });
    expect(grid({ entity: "cover.living_room_blinds" })).toMatchObject({ min_rows: 1 });
    // vertical: as narrow as its controls let it be, two rows at least
    expect(grid({ entity: "sensor.living_room_temperature", vertical: true })).toEqual({
      columns: 3,
      rows: "auto",
      min_columns: 3,
      min_rows: 2,
    });
    // a control under the name takes a third row
    expect(grid({ entity: "light.desk_lamp", vertical: true })).toMatchObject({
      min_columns: 3,
      min_rows: 3,
    });
    expect(grid({ entity: "fan.living_room", vertical: true })).toMatchObject({
      columns: 6,
      min_columns: 6,
    });
    expect(grid({ entity: "cover.living_room_blinds", vertical: true })).toMatchObject({
      min_columns: 6,
    });
    expect(grid({ entity: "climate.living_room", vertical: true })).toMatchObject({
      min_columns: 6,
    });
    expect(
      grid({ entity: "sensor.outdoor_temperature", visual: "sparkline", vertical: true }),
    ).toMatchObject({ min_rows: 3 });
    // badges take a row of their own above the icon
    expect(
      grid({ entity: "sensor.living_room_co2", vertical: true, status_badge: true }),
    ).toMatchObject({
      min_rows: 3,
    });
  });
});
