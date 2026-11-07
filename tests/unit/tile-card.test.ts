import { afterEach, describe, it, expect, vi } from "vitest";
import { TileCard } from "../../src/tile-card.ts";
import { iconBadgeOf } from "../../src/tile/badge.ts";
import { normalizeTileConfig, parseIconBadge } from "../../src/tile/config.ts";
import { normalizeEntityCardConfig } from "../../src/entity-card.ts";
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
    expect(() => norm({ entity: "light.kitchen", kind: "wind" })).toThrow(
      `${T}: the wind kind reads a wind_speed sensor or a weather entity`,
    );
  });

  it("names the new spelling of the keys the places replaced", () => {
    const e = "sensor.living_room_temperature";
    const fails = (o: Record<string, unknown>, msg: string) =>
      expect(() => norm({ entity: e, ...o })).toThrow(`${T}: ${msg}`);
    fails({ poster: "wind" }, "poster: wind is kind: wind");
    fails({ name_position: "below" }, "name_position is gone");
    fails({ show_picture: false }, "show_picture: false is visual: false");
    fails({ icon_ring: true }, "icon_ring: true is icon: { ring: true }");
    fails({ icon_style: "plain" }, "icon_style: plain is icon: { style: plain }");
    fails({ hours_to_show: 6 }, "hours_to_show is visual: { hours: 6 }");
    fails({ variant: "lines" }, "variant: lines is visual: { type: flow, variant: lines }");
    fails({ variant: "blind" }, "variant: blind is visual: { type: cover, variant: blind }");
    fails({ kind: "garage" }, "kind: garage is visual: { type: cover, variant: garage }");
    expect(() => norm({ entity: e, visual: "none" })).toThrow("visual: none is false (no visual)");
    fails({ rules: [{ state: "on", icon_ring: true }] }, "rules[0]: icon_ring: true is icon:");
  });

  it("names the tile's own keys in place of the entity card's", () => {
    const e = "sensor.living_room_temperature";
    expect(() => norm({ entity: e, visual: "ring" })).toThrow(
      `${T}: visual: ring is icon: { ring: true } on the tile card`,
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
    // control: { position } puts the kind's own primary control there
    const under = norm({ entity: "cover.living_room_blinds", control: { position: "block" } });
    expect(kinds(placementsOf(under.entities[0], "tile"))).toEqual(["buttons@block"]);
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
    expect(tap("light.desk_lamp", { icon: { tap_action: "none" } })).toBeNull();
    expect(tap("light.desk_lamp", { icon: { tap_action: { action: "more-info" } } })).toBe(
      "more-info",
    );
  });

  it("keeps the status on the line unless it is asked for as a badge", () => {
    const badges = ["sensor.living_room_temperature", { attribute: "unit_of_measurement" }];
    const line = norm({ entity: "sensor.living_room_co2", badges });
    expect(line.statusBadge).toBe(false);
    expect(line.groups[0].badgeIdxs).not.toContain(line.statusIdx);
    expect(line.groups[0].badgeIdxs).toHaveLength(2);
    // a badge without an entity reads the tile's
    expect(line.entities[line.groups[0].badgeIdxs![1]].entity).toBe("sensor.living_room_co2");
    // status_badge: true: first among the badges, a tag in the tile's colour
    const badge = norm({ entity: "sensor.living_room_co2", status_badge: true, badges });
    expect(badge.statusBadge).toBe(true);
    expect(badge.statusText).toBeNull();
    expect(badge.groups[0].badgeIdxs).toHaveLength(3);
    expect(badge.groups[0].badgeIdxs?.[0]).toBe(badge.statusIdx);
    expect(badge.entities[badge.statusIdx!].badge).toEqual({ style: "tag", size: "s" });
    // with a text of its own, still first
    const own = norm({
      entity: "sensor.living_room_co2",
      status: "Fresh",
      status_badge: true,
      badges,
    });
    expect(own.statusText).toEqual({ kind: "text", text: "Fresh" });
    expect(own.groups[0].badgeIdxs?.[0]).toBe(own.statusIdx);
    expect(own.entities[own.statusIdx!].badge).toEqual({ style: "tag", size: "s" });
    // status: badge is just the text "badge", on the line
    const word = norm({ entity: "sensor.living_room_co2", status: "badge", badges });
    expect(word.statusBadge).toBe(false);
    expect(word.statusText).toEqual({ kind: "text", text: "badge" });
    expect(word.groups[0].badgeIdxs).not.toContain(word.statusIdx);
    // status_badge: false keeps it on the line; no status, no badge
    expect(norm({ entity: "sensor.living_room_co2", status_badge: false }).statusBadge).toBe(false);
    expect(
      norm({ entity: "sensor.living_room_co2", status: false, status_badge: true, badges })
        .groups[0].badgeIdxs,
    ).toHaveLength(2);
  });

  it("takes the status as a text, a template or false, its look the tile's", () => {
    const e = "sensor.living_room_co2";
    const fails = (o: Record<string, unknown>, msg: string) =>
      expect(() => norm({ entity: e, ...o })).toThrow(`${T}: ${msg}`);
    const look =
      "status takes a text, a template or false (its look is the card's: a tag in its colour)";
    fails({ status: { value: "Fresh" } }, look);
    fails({ status: { badge: true, style: "filled" } }, look);
    fails({ status: true }, look);
    fails({ status: 3 }, look);
    fails(
      { badges: ["sensor.a", "status"] },
      "status is no badge of the list: the status comes first (on a tile: status_badge: true)",
    );
    fails({ status_badge: "yes" }, "status_badge takes true or false");
    fails({ status_badge: 1 }, "status_badge takes true or false");
  });

  it("takes the icon's badge as Home Assistant's, none or its own", () => {
    const e = "sensor.wind_speed";
    const badge = (cfg: Record<string, unknown>) => {
      const c = norm({ entity: e, ...cfg });
      return parseIconBadge(c.places.icon ? c.places.icon.badge : undefined);
    };
    expect(badge({})).toBe("auto");
    expect(badge({ icon: { badge: "auto" } })).toBe("auto");
    expect(badge({ icon: { badge: false } })).toBe(false);
    expect(badge({ icon: { badge: { icon: "mdi:alert", color: "{{ 'red' }}" } } })).toEqual({
      icon: { kind: "text", text: "mdi:alert" },
      color: { kind: "template", template: "{{ 'red' }}" },
    });
    // beside the icon's name and its actions
    expect(norm({ entity: e, icon: { name: "mdi:x", badge: false } }).places.icon).toEqual({
      type: "icon",
      name: "mdi:x",
      badge: false,
    });
    expect(() => norm({ entity: e, icon: { badge: 3 } })).toThrow(
      "tile-card-pro: icon: { badge } takes auto, false or { icon, color }",
    );
    expect(() => norm({ entity: e, rules: [{ above: 0, icon: { badge: 3 } }] })).toThrow(
      "tile-card-pro: icon: { badge } takes auto, false or { icon, color }",
    );
  });

  it("draws the icon's badge of the card, else of the matching rule", () => {
    const tiles: TileCard[] = [];
    const badge = (cfg: Record<string, unknown>) => {
      const el = new TileCard();
      el.setConfig(cfg);
      document.body.appendChild(el);
      el.hass = snapshot() as never;
      tiles.push(el);
      const b = el.shadowRoot?.querySelector(".tibadge > ha-icon");
      return b ? b.getAttribute("icon") : null;
    };
    try {
      const C = "climate.living_room";
      expect(badge({ entity: C })).toBe("mdi:fire");
      expect(badge({ entity: C, icon: { badge: false } })).toBeNull();
      expect(badge({ entity: C, icon: { badge: { icon: "mdi:sofa" } } })).toBe("mdi:sofa");
      // a matching rule's badge wins, one that does not match leaves the card's
      const rule = (above: number) => [{ above, icon: { badge: { icon: "mdi:alert" } } }];
      expect(badge({ entity: C, rules: rule(0) })).toBe("mdi:alert");
      expect(badge({ entity: C, rules: rule(1000) })).toBe("mdi:fire");
      expect(
        badge({
          entity: C,
          icon: { badge: false },
          rules: [{ above: 0, icon: { badge: "auto" } }],
        }),
      ).toBe("mdi:fire");
    } finally {
      for (const t of tiles) t.remove();
    }
  });

  it("names the new spelling of the flat control, icon action and badge keys", () => {
    const e = "light.desk_lamp";
    const fails = (o: Record<string, unknown>, msg: string) =>
      expect(() => norm({ entity: e, ...o })).toThrow(`${T}: ${msg}`);
    fails({ control_step: 5 }, "control_step is control: { step: 5 }");
    fails({ control_position: "end" }, "control_position is control: { position: end }");
    fails({ icon_tap_action: "none" }, "icon_tap_action is icon: { tap_action: … }");
    fails({ icon_badge: false }, "icon_badge is icon: { badge: false }");
    fails({ icon_badge: "auto" }, "icon_badge is icon: { badge: … }");
    // the place it leads to, not a spelling that fails again
    fails(
      { control_position: "lead" },
      "control_position: lead is the icon's own actions: icon: { tap_action, hold_action }",
    );
  });

  it("names where the wind and rain cards' keys went", () => {
    const fails = (o: Record<string, unknown>, msg: string) =>
      expect(() => norm({ entity: "sensor.wind_speed", ...o })).toThrow(`${T}: ${msg}`);
    fails({ flow: { style: "lines" } }, "flow is visual: { type: flow, variant: lines }");
    fails({ layout: "hero" }, "layout: hero is visual: { type: flow }");
    fails({ lead: "icon" }, "lead: icon is icon: mdi:…");
    fails({ title: "Wind" }, "title is a tile group's or a heading's");
    fails(
      { header_entities: ["sensor.wind_gust"] },
      "header_entities is a tile group's or a heading's badges",
    );
  });

  it("takes the control's options in one object, the kind's controls without a type", () => {
    const e = "light.desk_lamp";
    const slider = norm({ entity: e, control: { type: "slider", position: "block", step: 5 } });
    expect(slider.entities[0].control).toEqual({
      ...normalizeEntityCardConfig({
        entity: e,
        control: "slider",
        control_position: "block",
        control_step: 5,
      }).entities[0].control,
      // (square unless written: the entity cards' controls have no variant)
      variant: "square",
    });
    // without a type: the kind's own controls (the toggle at the line's end), its step changed
    const plain = norm({ entity: e }).entities[0].control;
    const stepped = norm({ entity: e, control: { step: 5 } }).entities[0].control;
    expect(stepped).toEqual({ ...plain, step: 5 });
    expect(
      kinds(placementsOf(norm({ entity: e, control: { step: 5 } }).entities[0], "tile")),
    ).toEqual(kinds(placementsOf(norm({ entity: e }).entities[0], "tile")));
  });

  it("takes the icon's actions in the icon, never from a rule", () => {
    const c = norm({
      entity: "light.desk_lamp",
      icon: { hold_action: "more-info", double_tap_action: { action: "toggle" } },
    });
    expect(c.iconActions).toEqual({
      tap: { action: "toggle" },
      hold: { action: "more-info" },
      dbl: { action: "toggle" },
    });
    expect(() =>
      norm({ entity: "light.desk_lamp", rules: [{ state: "on", icon: { tap_action: "none" } }] }),
    ).toThrow(`${T}: rules[0].icon: a rule sets no tap_action`);
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

  it("draws a rule's icon over the card's: false hides it, a name keeps the ring and the style", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const tiles: TileCard[] = [];
    const draw = (cfg: Record<string, unknown>) => {
      const el = new TileCard();
      el.setConfig(cfg);
      document.body.appendChild(el);
      el.hass = snapshot() as never;
      tiles.push(el);
      return el;
    };
    try {
      const T = "sensor.living_room_temperature";
      // a matching rule's icon: false leaves the icon out, as the card's own does
      const hidden = draw({ entity: T, rules: [{ above: 0, icon: false }] });
      expect(hidden.shadowRoot?.querySelector(".tlead .lead")).toBeNull();
      expect(draw({ entity: T }).shadowRoot?.querySelector(".tlead .lead")).not.toBeNull();
      // a rule's name over the card's photo keeps the card's ring and its plain style
      const person = draw({
        entity: "person.malte",
        icon: { ring: true, style: "plain" },
        rules: [{ state: "home", icon: "mdi:home-account" }],
      });
      const lead = person.shadowRoot?.querySelector(".tlead .lead");
      expect(lead?.classList.contains("ring")).toBe(true);
      expect(lead?.classList.contains("plain")).toBe(true);
      expect(lead?.querySelector("img.picture")).toBeNull();
      // a rule's src merged onto the card's plot is no plot data of its own: the card's history
      const plot = draw({
        entity: T,
        visual: { type: "sparkline" },
        rules: [{ above: 0, visual: { src: "sensor.outdoor_temperature" } }],
      });
      expect(plot._historyIds).toEqual([T]);
      // the history is the one the card and its rules can draw: none for no plot (a temperature's
      // own, for today's low and high, aside)
      expect(draw({ entity: T, kind: "none", visual: false })._historyIds).toEqual([]);
      expect(
        draw({ entity: T, kind: "none", visual: false, rules: [{ above: 50, visual: "columns" }] })
          ._historyIds,
      ).toEqual([T]);
      expect(draw({ entity: T, visual: false })._historyIds).toEqual([T]);
      // the window is the plot's: a visual with fewer hours fetches fewer
      expect(draw({ entity: T, visual: { type: "columns", hours: 6 } })._config?.hours).toBe(6);
    } finally {
      for (const t of tiles) t.remove();
    }
  });

  it("draws a flow icon in its variant, plain without its circle", () => {
    const tiles: TileCard[] = [];
    const lead = (cfg: Record<string, unknown>) => {
      const el = new TileCard();
      el.setConfig(cfg);
      document.body.appendChild(el);
      el.hass = snapshot() as never;
      tiles.push(el);
      return el.shadowRoot?.querySelector(".tlead .lead");
    };
    try {
      const W = "sensor.wind_speed";
      expect(
        lead({ entity: W, icon: { type: "flow", variant: "swoosh" } })?.classList,
      ).not.toContain("plain");
      const plain = lead({ entity: W, icon: { type: "flow", variant: "swoosh", style: "plain" } });
      expect(plain?.classList).toContain("wlead");
      expect(plain?.classList).toContain("plain");
      expect(
        lead({
          entity: "sensor.rain_rate",
          icon: { type: "flow", variant: "fill", style: "plain" },
        })?.classList,
      ).toContain("plain");
    } finally {
      for (const t of tiles) t.remove();
    }
  });

  it("draws the wind's arrow with the flow behind, and the entity's icon where the icon is asked", () => {
    const tiles: TileCard[] = [];
    const lead = (cfg: Record<string, unknown>) => {
      const el = new TileCard();
      el.setConfig(cfg);
      document.body.appendChild(el);
      el.hass = snapshot() as never;
      tiles.push(el);
      return el.shadowRoot!.querySelector(".tlead")!;
    };
    try {
      const W = { entity: "sensor.wind_speed", visual: { type: "flow" } };
      expect(lead(W).querySelector("ha-icon.arrow")).not.toBeNull();
      // the entity's own icon
      const icon = lead({ ...W, icon: { type: "icon" } });
      expect(icon.querySelector("ha-icon.arrow")).toBeNull();
      expect(icon.querySelector("ha-icon")?.getAttribute("icon")).toBe("mdi:weather-windy");
      // and the animation in the icon gives way to it the same
      const still = lead({ entity: "sensor.wind_speed", icon: { type: "icon" } });
      expect(still.querySelector(".wlead")).toBeNull();
      expect(still.querySelector("ha-icon")?.getAttribute("icon")).toBe("mdi:weather-windy");
      // one named
      const named = lead({ ...W, icon: { type: "icon", name: "mdi:flag" } });
      expect(named.querySelector("ha-icon")?.getAttribute("icon")).toBe("mdi:flag");
    } finally {
      for (const t of tiles) t.remove();
    }
  });

  it("gives the kinds today as the hours since midnight, the weather its own hours", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const card = (cfg: Record<string, unknown>) => {
      const el = new TileCard();
      el.setConfig(cfg);
      return el;
    };
    const now = new Date(2026, 10, 2, 13, 30).getTime();
    const trend = card({
      kind: "trend",
      visual: { hours: "today" },
      series: [{ entity: "sensor.outdoor_temperature" }],
    });
    expect(trend._hoursOf({ type: "sparkline", hours: "today" }, now)).toBeCloseTo(13.5);
    expect(trend._hoursOf({ type: "sparkline", hours: 6 }, now)).toBe(6);
    // a weather's line looks ahead: today means nothing there, said once
    const weather = card({ entity: "weather.home", visual: { hours: "today" } });
    expect(weather._hoursOf({ type: "sparkline", hours: "today" }, now)).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("today means nothing"));
  });

  it("draws the kind's visual as a poster does, but no drawing that needs a poster's room", () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const tiles: TileCard[] = [];
    const draw = (cfg: Record<string, unknown>) => {
      const el = new TileCard();
      el.setConfig(cfg);
      document.body.appendChild(el);
      el.hass = snapshot() as never;
      tiles.push(el);
      return el.shadowRoot as ShadowRoot;
    };
    try {
      // what's behind the texts is one layer in the body, as on the poster
      expect(
        draw({ entity: "light.living_room" }).querySelector(".body > .pback > .pglow"),
      ).not.toBeNull();
      expect(
        draw({ entity: "climate.living_room" }).querySelector(".pback > .pclimate"),
      ).not.toBeNull();
      expect(
        draw({ entity: "light.living_room", visual: false }).querySelector(".pglow"),
      ).toBeNull();
      expect(draw({ entity: "person.malte" }).querySelector(".pback.scrim > img")).not.toBeNull();
      expect(draw({ entity: "light.living_room" }).querySelector(".tglow")).toBeNull();
      // a cover's drawing, a robot's path and the grid's line only on a poster
      for (const cfg of [
        { entity: "cover.living_room_blinds" },
        { entity: "vacuum.robot" },
        { entity: "sensor.grid_power", kind: "grid" },
      ]) {
        const back = draw(cfg).querySelector<HTMLElement>(".pback");
        expect(back?.hidden ?? true, JSON.stringify(cfg)).toBe(true);
      }
      // unless the card asks for it, in the device class's variant or the one it names
      expect(
        draw({ entity: "cover.living_room_blinds", visual: "cover" }).querySelector(
          ".pback > .pcov.shutter",
        ),
      ).not.toBeNull();
      expect(
        draw({
          entity: "cover.workshop_door",
          visual: { type: "cover", variant: "garage" },
        }).querySelector(".pback > .pcov.garage"),
      ).not.toBeNull();
      // a variant alone merges onto nothing: a tile draws no cover by default
      const bare = draw({ entity: "cover.workshop_door", visual: { variant: "garage" } });
      expect(bare.querySelector(".pback > .pcov")).toBeNull();
    } finally {
      for (const t of tiles) t.remove();
    }
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
    // the kind's visual below the line by default (a weather's forecast, the sun's day, a solar
    // day); visual: false leaves it out
    expect(grid({ entity: "weather.home" })).toMatchObject({ min_rows: 2 });
    expect(grid({ entity: "sun.sun" })).toMatchObject({ min_rows: 2 });
    expect(grid({ entity: "sensor.solar_power", kind: "solar" })).toMatchObject({ min_rows: 2 });
    expect(grid({ entity: "weather.home", visual: false })).toMatchObject({ min_rows: 1 });
    // a cover's drawing and a battery's segments take no row of their own
    expect(grid({ entity: "cover.living_room_blinds" })).toMatchObject({ min_rows: 1 });
    expect(grid({ entity: "sensor.phone_battery" })).toMatchObject({ min_rows: 1 });
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
