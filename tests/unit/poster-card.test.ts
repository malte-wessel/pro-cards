import { afterEach, describe, it, expect, vi } from "vitest";
import { PosterCard } from "../../src/poster-card.ts";
import { normalizePosterConfig, type PosterConfig } from "../../src/poster/config.ts";
import { parseImage } from "../../src/shared/kinds/config.ts";
import { IMAGE_BLUR, resolvePlaces } from "../../src/shared/kinds/places.ts";
import { imageUrl, statusText } from "../../src/shared/kinds/render.ts";
import { cssColor } from "../../src/shared/color.ts";
import { placementsOf } from "../../src/shared/entity/control.ts";
import { normalizeEntityCardConfig } from "../../src/entity-card.ts";
import { modelOf } from "../../src/shared/entity/model.ts";
import { BATTERY_RULES, toRule, WIND_RULES } from "../../src/shared/kinds/rules.ts";
import { snapshot, world } from "../../docs/.vitepress/theme/ha-shim/hass.ts";
import type { HassEntity, HomeAssistant } from "../../src/shared/ha.ts";

const T = "poster-card-pro";
const norm = (cfg: Record<string, unknown>, hass?: HomeAssistant) =>
  normalizePosterConfig(cfg, hass);
const kinds = (list: { kind: string; position: string }[]) =>
  list.map((p) => `${p.kind}@${p.position}`);
const st = (id: string, state: string, attributes: Record<string, unknown> = {}) =>
  ({ entity_id: id, state, attributes }) as unknown as HassEntity;
const withStates = (states: Record<string, HassEntity>) =>
  ({ states, locale: { language: "en" } }) as unknown as HomeAssistant;
// what the poster's places draw while no rule matches: the kind's default under the card's
const drawn = (c: PosterConfig) =>
  resolvePlaces([{ icon: c.kind.icon, visual: c.kind.visual }, c.places]);

afterEach(() => vi.restoreAllMocks());

describe("poster-card config", () => {
  it("is registered and checks its config", () => {
    expect(customElements.get(T)).toBe(PosterCard);
    expect(window.customCards?.some((c) => c.type === T)).toBe(true);
    expect(() => norm(null as never)).toThrow(`${T}: invalid config`);
    expect(() => norm({ entity: "light.kitchen", kind: "room" })).toThrow(
      /kind must be one of none \| battery/,
    );
    expect(() => norm({ entity: "light.kitchen", kind: "wind" })).toThrow(
      `${T}: the wind kind reads a wind_speed sensor or a weather entity`,
    );
  });

  it("names the new spelling of every key the places replaced", () => {
    const E = "sensor.living_room_temperature";
    const fails = (o: Record<string, unknown>, msg: string) =>
      expect(() => norm({ entity: E, ...o })).toThrow(`${T}: ${msg}`);
    fails({ poster: "solar" }, "poster: solar is kind: solar");
    fails({ name_position: "below" }, "name_position is gone: the name is above the value");
    fails({ image: "/local/a.jpg" }, "image is visual: { type: image, src: /local/a.jpg }");
    fails({ image: false }, "image: false is visual: false");
    fails({ image_opacity: 0.5 }, "image_opacity is visual: { type: image, opacity: 0.5 }");
    fails({ image_tint: "blue" }, "image_tint is visual: { type: image, tint: blue }");
    fails({ image_blur: 4 }, "image_blur is visual: { type: image, blur: 4 }");
    fails({ icon_image: "/local/a.png" }, "icon_image is icon: { type: image, src: /local/a.png }");
    fails({ show_entity_picture: true }, "show_entity_picture: true is icon: { type: image }");
    fails({ icon_ring: true }, "icon_ring: true is icon: { ring: true }");
    fails({ icon_style: "plain" }, "icon_style: plain is icon: { style: plain }");
    fails({ show_picture: true }, "show_picture is gone");
    fails({ hours_to_show: 6 }, "hours_to_show is visual: { hours: 6 }");
    fails({ bucket_minutes: 15 }, "bucket_minutes is visual: { bucket: 15 }");
    fails({ smoothing_minutes: 15 }, "smoothing_minutes is visual: { smoothing: 15 }");
    // variant: a flow's or a cover's drawing is the visual's, an appliance is its kind
    fails({ variant: "lines" }, "variant: lines is visual: { type: flow, variant: lines }");
    fails({ variant: "drops" }, "variant: drops is visual: { type: flow, variant: drops }");
    fails({ variant: "garage" }, "variant: garage is visual: { type: cover, variant: garage }");
    fails({ variant: "washer" }, "variant: washer is kind: washer");
    // the same keys in a rule, named by the rule
    fails(
      { rules: [{ state: "on" }, { above: 5, image: "/a.jpg" }] },
      "rules[1]: image is visual:",
    );
    fails(
      { rules: [{ state: "on", icon_style: "plain" }] },
      "rules[0]: icon_style: plain is icon:",
    );
    // a key left undefined is no key
    expect(norm({ entity: E, image: undefined }).kind.name).toBe("none");
  });

  it("names the new spelling of the flat control, icon action and badge keys", () => {
    const E = "light.living_room";
    const fails = (o: Record<string, unknown>, msg: string) =>
      expect(() => norm({ entity: E, ...o })).toThrow(`${T}: ${msg}`);
    fails({ control_position: "block" }, "control_position is control: { position: block }");
    fails({ control_attribute: "preset_mode" }, "control_attribute is control: { attribute:");
    fails({ control_step: 5 }, "control_step is control: { step: 5 }");
    fails({ control_options: ["a"] }, "control_options is control: { options: [ … ] }");
    fails({ control_confirm: true }, "control_confirm is control: { confirm: true }");
    fails({ icon_tap_action: "toggle" }, "icon_tap_action is icon: { tap_action: … }");
    fails({ icon_hold_action: "none" }, "icon_hold_action is icon: { hold_action: … }");
    fails(
      { icon_double_tap_action: "none" },
      "icon_double_tap_action is icon: { double_tap_action: … }",
    );
    fails({ icon_badge: false }, "icon_badge is icon: { badge: false }");
    fails(
      { status_badge: true },
      "a poster's status is always the badge in its corner: leave out status_badge",
    );
    fails(
      { status_badge: false },
      "a poster's status is always the badge in its corner: leave out status_badge",
    );
    fails({ rules: [{ state: "on", icon_badge: false }] }, "rules[0]: icon_badge is icon:");
  });

  it("takes the control's options in one object, as the entity card's flat keys", () => {
    const flat = (cfg: Record<string, unknown>) =>
      normalizeEntityCardConfig(cfg).entities[0].control;
    const C = "climate.living_room";
    expect(
      norm({
        entity: C,
        control: {
          type: "segments",
          position: "block",
          attribute: "preset_mode",
          step: 10,
          confirm: true,
        },
      }).entities[0].control,
    ).toEqual(
      flat({
        entity: C,
        control: "segments",
        control_position: "block",
        control_attribute: "preset_mode",
        control_step: 10,
        control_confirm: true,
      }),
    );
    const S = "input_select.house_mode";
    const options = ["Home", { value: "Away", icon: "mdi:car" }];
    expect(norm({ entity: S, control: { type: "segments", options } }).entities[0].control).toEqual(
      flat({ entity: S, control: "segments", control_options: options }),
    );
    const buttons = [{ entity: "scene.movie_night" }, { entity: "script.check_windows" }];
    const b = norm({ entity: S, control: { type: "buttons", options: buttons } }).entities[0];
    expect(b.control).toEqual(flat({ entity: S, control: "buttons", control_options: buttons }));
    expect(b.control?.buttons).toHaveLength(2);
    // a name is the type alone
    expect(norm({ entity: S, control: "segments" }).entities[0].control).toEqual(
      norm({ entity: S, control: { type: "segments" } }).entities[0].control,
    );
    expect(() => norm({ entity: S, control: { type: "segments", size: 2 } })).toThrow(
      `${T}: control takes type, position, attribute, step, options, confirm, not size`,
    );
  });

  it("changes the kind's own controls with a control object that names no type", () => {
    const E = "light.living_room";
    const plain = norm({ entity: E }).entities[0].control;
    const stepped = norm({ entity: E, control: { step: 10 } }).entities[0].control;
    expect(stepped).toEqual({ ...plain, step: 10 });
    // confirm makes the kind's toggle a hold, as control_confirm on the entity card's auto control
    const confirmed = norm({ entity: E, control: { confirm: true } }).entities[0];
    expect(kinds(placementsOf(confirmed, "poster"))).toEqual(["hold@end", "slider@block"]);
  });

  it("takes the icon's actions in the icon, never from a rule", () => {
    expect(
      norm({ entity: "lock.front_door", icon: { name: "mdi:door", tap_action: "more-info" } }),
    ).toMatchObject({
      iconActions: { tap: { action: "more-info" }, hold: { action: "toggle" } },
      places: { icon: { type: "icon", name: "mdi:door" } },
    });
    for (const k of ["tap_action", "hold_action", "double_tap_action"])
      expect(() =>
        norm({ entity: "lock.front_door", rules: [{ state: "locked", icon: { [k]: "none" } }] }),
      ).toThrow(`${T}: rules[0].icon: a rule sets no ${k}`);
  });

  it("has no badge on its icon, and its status is always a badge", () => {
    const E = "sensor.living_room_temperature";
    const msg = `${T}: a poster's icon has no badge (its corner has the badges)`;
    expect(() => norm({ entity: E, icon: { badge: false } })).toThrow(msg);
    expect(() => norm({ entity: E, rules: [{ above: 0, icon: { badge: "auto" } }] })).toThrow(msg);
    // the status is the first badge, a tag without an icon or a name
    const plain = norm({ entity: E });
    expect(plain.groups[0].badgeIdxs?.[0]).toBe(plain.statusIdx);
    expect(plain.entities[plain.statusIdx!].badge).toEqual({ style: "tag", size: "s" });
    expect(plain.entities[plain.statusIdx!].item).toMatchObject({
      showIcon: false,
      showName: false,
    });
    // status: badge is no keyword: just the text "badge"
    expect(norm({ entity: E, status: "badge" }).statusText).toEqual({
      kind: "text",
      text: "badge",
    });
  });

  it("is one poster: its item, then the status badge first in the corner", () => {
    const c = norm({ entity: "sensor.living_room_temperature", name: "Living room" });
    expect(c.kind.name).toBe("none");
    expect(c.entities.map((e) => e.entity)).toEqual([
      "sensor.living_room_temperature",
      "sensor.living_room_temperature",
    ]);
    expect(c.statusIdx).toBe(1);
    expect(c.groups).toEqual([expect.objectContaining({ layout: "poster", idxs: [0] })]);
    expect(c.groups[0].badgeIdxs).toEqual([1]);
    expect(c.entities[1].badge).toEqual({ style: "tag", size: "s" });
  });

  it("takes the kind's item defaults unless the card sets the value", () => {
    const w = norm({ entity: "weather.home" });
    expect(w.kind.name).toBe("weather");
    expect(w.entities[0].valueSrc).toEqual({ kind: "attribute", key: "temperature" });
    // the condition's picture in the icon, its sparkline (the forecast) below the texts
    expect(drawn(w)).toEqual({ icon: { type: "image" }, visual: { type: "sparkline" } });
    expect(
      norm({ entity: "weather.home", attribute: "humidity" }).entities[0].valueSrc,
    ).toMatchObject({ key: "humidity" });
    expect(norm({ entity: "weather.home", value: "{{ 1 }}" }).entities[0].valueSrc.kind).toBe(
      "template",
    );
    expect(drawn(norm({ entity: "weather.home", icon: { type: "icon" } })).icon).toEqual({
      type: "icon",
    });
    expect(norm({ entity: "climate.living_room" }).entities[0].valueSrc).toMatchObject({
      key: "current_temperature",
    });
  });

  it("brings the kind's rules unless the card has its own; the status reads the same", () => {
    const battery = withStates({
      "sensor.phone_battery": st("sensor.phone_battery", "50", { device_class: "battery" }),
    });
    const own = norm({ entity: "sensor.phone_battery" }, battery);
    expect(own.kind.name).toBe("battery");
    expect(own.entities[0].rules).toEqual(BATTERY_RULES.map(toRule));
    expect(own.entities[own.statusIdx!].rules).toBe(own.entities[0].rules);
    const mine = norm(
      { entity: "sensor.phone_battery", rules: [{ below: 50, status: "Charge" }] },
      battery,
    );
    expect(mine.entities[0].rules.map((r) => r.label)).toEqual(["Charge"]);
    expect(norm({ entity: "sensor.phone_battery", rules: [] }, battery).entities[0].rules).toEqual(
      [],
    );
    // the wind rules are written in km/h: the value is converted before they match
    const wind = norm({ entity: "sensor.wind_speed", kind: "wind" });
    expect(wind.entities[0].rules).toEqual(WIND_RULES.map(toRule));
    expect(wind.entities[0].ruleUnit).toBe("km/h");
    expect(wind.entities[wind.statusIdx!].ruleUnit).toBe("km/h");
    expect(
      norm({ entity: "sensor.wind_speed", kind: "wind", rules: [] }).entities[0].ruleUnit,
    ).toBeUndefined();
  });

  it("draws the kind's controls by default; control: false drops them, a name picks another", () => {
    const light = norm({ entity: "light.living_room" });
    expect(kinds(placementsOf(light.entities[0], "poster"))).toEqual([
      "toggle@end",
      "slider@block",
    ]);
    expect(norm({ entity: "light.living_room", control: false }).entities[0].control).toBeNull();
    const named = norm({ entity: "light.living_room", control: "slider" }).entities[0];
    expect(kinds(placementsOf(named, "poster"))).toEqual(["slider@block"]);
  });

  it("holds a lock and an alarm panel on its icon, an alarm panel that wants a code not", () => {
    const toggle = { action: "toggle" };
    const lock = norm({ entity: "lock.front_door" });
    expect(lock.iconActions).toEqual({ tap: null, hold: toggle, dbl: null });
    // the hold is the icon's, not a control
    expect(placementsOf(lock.entities[0], "poster")).toEqual([]);
    const A = "alarm_control_panel.home";
    const free = norm({ entity: A }, withStates({ [A]: st(A, "disarmed") }));
    expect(free.iconActions.hold).toEqual(toggle);
    for (const attrs of [{ code_format: "number" }, { code_arm_required: true }]) {
      const coded = norm({ entity: A }, withStates({ [A]: st(A, "disarmed", attrs) }));
      expect(coded.iconActions).toEqual({ tap: null, hold: null, dbl: null });
      expect(coded.entities[0].control).toBeNull();
    }
    // other posters' icons have no action of their own
    expect(norm({ entity: "switch.coffee_machine" }).iconActions).toEqual({
      tap: null,
      hold: null,
      dbl: null,
    });
  });

  it("takes the icon's actions as written over the type's, none dropping one", () => {
    const c = norm({
      entity: "lock.front_door",
      icon: {
        tap_action: "more-info",
        hold_action: { action: "navigate", navigation_path: "/doors" },
        double_tap_action: { action: "toggle" },
      },
    });
    expect(c.iconActions).toEqual({
      tap: { action: "more-info" },
      hold: { action: "navigate", navigation_path: "/doors" },
      dbl: { action: "toggle" },
    });
    // a written one replaces only its own gesture: the lock keeps its hold beside a tap
    const tap = norm({ entity: "lock.front_door", icon: { tap_action: "toggle" } });
    expect(tap.iconActions).toEqual({
      tap: { action: "toggle" },
      hold: { action: "toggle" },
      dbl: null,
    });
    expect(
      norm({ entity: "lock.front_door", icon: { hold_action: "none" } }).iconActions.hold,
    ).toBeNull();
    // an object without an action is more-info, as tap_action
    expect(
      norm({ entity: "switch.coffee_machine", icon: { tap_action: { entity: "light.kitchen" } } })
        .iconActions.tap,
    ).toEqual({ action: "more-info", entity: "light.kitchen" });
  });

  it("keeps the visual as written in its place, the item drawing none of its own", () => {
    const H = "sensor.living_room_humidity";
    const glow = norm({ entity: H, visual: "glow" });
    expect(glow.places.visual).toEqual({ type: "glow" });
    expect(glow.entities[0].visual).toBe("icon");
    const none = norm({ entity: H, visual: false });
    expect(none.places.visual).toBe(false);
    expect(none.entities[0].visual).toBe("icon");
    const bar = norm({ entity: H, visual: "bar" });
    expect(bar.places.visual).toEqual({ type: "bar" });
    expect(bar.entities[0].visual).toBe("icon");
    expect(drawn(norm({ entity: H })).visual).toBe(false);
    // the light's default visual is its glow; another visual or false replaces it
    expect(drawn(norm({ entity: "light.living_room" })).visual).toEqual({ type: "glow" });
    for (const visual of [false, "bar"])
      expect(drawn(norm({ entity: "light.living_room", visual })).visual).not.toEqual({
        type: "glow",
      });
  });

  it("gives every kind its default places", () => {
    const of = (cfg: Record<string, unknown>) => drawn(norm(cfg));
    expect(of({ entity: "climate.living_room" }).visual).toEqual({ type: "glow" });
    expect(of({ entity: "alarm_control_panel.home" }).visual).toEqual({ type: "glow" });
    expect(of({ entity: "sensor.wind_speed", kind: "wind" })).toEqual({
      icon: { type: "flow", variant: "dots" },
      visual: false,
    });
    expect(of({ entity: "sensor.rain_rate", kind: "rain" }).icon).toEqual({
      type: "flow",
      variant: "drops",
    });
    for (const entity of ["person.malte", "media_player.living_room_speaker"])
      expect(of({ entity })).toEqual({
        icon: { type: "image" },
        visual: { type: "image", blur: IMAGE_BLUR },
      });
    expect(of({ entity: "cover.living_room_blinds" }).visual).toEqual({ type: "cover" });
    expect(of({ entity: "cover.garage_door" }).visual).toEqual({ type: "cover" });
    expect(of({ entity: "cover.workshop_door", visual: { variant: "garage" } }).visual).toEqual({
      type: "cover",
      variant: "garage",
    });
    expect(of({ entity: "vacuum.robot" }).visual).toEqual({ type: "path" });
    expect(of({ entity: "lawn_mower.garden" }).visual).toEqual({ type: "path" });
    expect(of({ entity: "sensor.grid_power", kind: "grid" }).visual).toEqual({ type: "line" });
    expect(of({ entity: "sensor.solar_power", kind: "solar" }).visual).toEqual({
      type: "sparkline",
      hours: "today",
    });
    expect(of({ entity: "sensor.phone_battery", kind: "battery" }).visual).toEqual({
      type: "segments",
    });
    expect(of({ entity: "sun.sun" }).visual).toEqual({ type: "sun" });
    expect(of({ kind: "trend", series: ["sensor.outdoor_temperature"] }).visual).toEqual({
      type: "sparkline",
    });
    // the plain kind draws the icon and nothing else
    expect(of({ entity: "sensor.living_room_temperature" })).toEqual({
      icon: { type: "icon" },
      visual: false,
    });
  });

  it("merges an object without a type onto the kind's default, one with a type replaces it", () => {
    const S = "sensor.solar_power";
    expect(drawn(norm({ entity: S, kind: "solar", visual: { hours: 6 } })).visual).toEqual({
      type: "sparkline",
      hours: 6,
    });
    expect(drawn(norm({ entity: S, kind: "solar", visual: { type: "columns" } })).visual).toEqual({
      type: "columns",
    });
    expect(drawn(norm({ entity: "person.malte", visual: { blur: false } })).visual).toEqual({
      type: "image",
      blur: 0,
    });
    // nothing to merge onto: nothing drawn
    expect(drawn(norm({ entity: "sensor.x", visual: { hours: 6 } })).visual).toBe(false);
    // a string is the icon's name: it makes the place an icon (over a photo too)
    expect(norm({ entity: "sensor.x", icon: "mdi:sofa" }).places.icon).toEqual({
      type: "icon",
      name: "mdi:sofa",
    });
    expect(norm({ entity: "sensor.x", icon: "mdi:sofa" }).entities[0].icon).toBe("mdi:sofa");
    expect(drawn(norm({ entity: "person.malte", icon: { ring: true } })).icon).toEqual({
      type: "image",
      ring: true,
    });
  });

  it("draws the animation in one place", () => {
    const W = "sensor.wind_speed";
    expect(() =>
      norm({ entity: W, kind: "wind", icon: { type: "flow" }, visual: { type: "flow" } }),
    ).toThrow(`${T}: the animation goes in one place: icon or visual, not both`);
    // a flow behind the card makes the wind's icon the still one
    expect(
      drawn(norm({ entity: W, kind: "wind", visual: { type: "flow", variant: "lines" } })),
    ).toEqual({ icon: { type: "icon" }, visual: { type: "flow", variant: "lines" } });
    // the icon's animation in another drawing, and without its circle
    expect(
      drawn(
        norm({
          entity: W,
          kind: "wind",
          icon: { type: "flow", variant: "swoosh", style: "plain" },
        }),
      ).icon,
    ).toEqual({ type: "flow", variant: "swoosh", style: "plain" });
    // a flow's drawing is its variant now: style is the circle or none
    expect(() =>
      norm({ entity: W, kind: "wind", visual: { type: "flow", style: "lines" } }),
    ).toThrow(`${T}: visual: flow takes variant, not style`);
    expect(() => norm({ entity: W, kind: "wind", icon: { type: "flow", style: "lines" } })).toThrow(
      `${T}: icon: style must be one of circle, plain`,
    );
  });

  it("takes a ring around the icon as the icon's option", () => {
    const H = "sensor.living_room_humidity";
    expect(norm({ entity: H, icon: { ring: true } }).places.icon).toEqual({ ring: true });
    expect(
      norm({ entity: H, icon: { type: "icon", name: "mdi:water", ring: true } }).places.icon,
    ).toEqual({ type: "icon", name: "mdi:water", ring: true });
    expect(norm({ entity: H }).places.icon).toBeUndefined();
    // the badges keep their own visual
    const c = norm({ entity: H, icon: { ring: true }, badges: [{ entity: H, visual: "ring" }] });
    expect(c.entities.at(-1)?.visual).toBe("ring");
    expect(c.entities.at(-1)?.iconRing).toBeUndefined();
  });

  it("names the poster's own keys in place of visual: ring and control: { position: lead }", () => {
    expect(() => norm({ entity: "sensor.living_room_humidity", visual: "ring" })).toThrow(
      `${T}: visual: ring is icon: { ring: true } on the poster card`,
    );
    expect(() =>
      norm({ entity: "switch.coffee_machine", control: { type: "toggle", position: "lead" } }),
    ).toThrow(
      `${T}: the icon's own actions are icon: { tap_action, hold_action }, not control: { position: lead }`,
    );
  });

  it("reads inputs set on the card, a weather entity's attributes or found on the device", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const set = norm({
      entity: "sensor.wind_speed",
      kind: "wind",
      inputs: { direction: "sensor.wind_direction", gust: false },
    });
    expect(Object.keys(set.inputs)).toEqual(["direction"]);
    expect(set.entities[set.inputs.direction].entity).toBe("sensor.wind_direction");
    expect(set.kindOpts).toEqual({ direction: "sensor.wind_direction", gust: false });
    // without hass nothing is found yet
    expect(norm({ entity: "sensor.wind_speed", kind: "wind" }).inputs).toEqual({});

    const weather = norm({ entity: "weather.home", kind: "wind" });
    expect(weather.entities[0].valueSrc).toMatchObject({ key: "wind_speed" });
    const gust = weather.entities[weather.inputs.gust];
    expect(gust.valueSrc).toMatchObject({ kind: "attribute", key: "wind_gust_speed" });
    expect(gust.unitAttr).toBe("wind_speed_unit");

    const found = norm({ entity: "sensor.wind_speed" }, snapshot());
    expect(found.kind.name).toBe("wind");
    const ids = Object.fromEntries(
      Object.entries(found.inputs).map(([k, i]) => [k, found.entities[i].entity]),
    );
    expect(ids).toEqual({ direction: "sensor.wind_direction", gust: "sensor.wind_gust" });
    expect(info).toHaveBeenCalledWith(
      `${T}: wind: gust from sensor.wind_gust (same device as sensor.wind_speed); set inputs: { gust } to choose another`,
    );
    // the inputs are read, never drawn
    expect(found.groups[0].idxs).toEqual([0]);
    expect(found.groups[0].badgeIdxs).toEqual([found.statusIdx]);
    // false drops a found one, an id replaces it
    const own = norm(
      { entity: "sensor.wind_speed", inputs: { gust: false, direction: "sensor.x" } },
      snapshot(),
    );
    expect(Object.keys(own.inputs)).toEqual(["direction"]);
    expect(own.entities[own.inputs.direction].entity).toBe("sensor.x");
  });

  it("takes one spelling for each part: a rule's status, icon: false, control: auto", () => {
    const E = "sensor.living_room_temperature";
    // a rule's text is the status, as the card's; a word YAML read as a boolean is an error
    expect(() => norm({ entity: E, rules: [{ below: 10, label: "Low" }] })).toThrow(
      `${T}: rules[0]: label is status on the poster card`,
    );
    expect(() => norm({ entity: E, rules: [{ state: "off", status: false }] })).toThrow(
      `${T}: rules[0].status takes a text, not false (a word such as Off or No is read as false unless quoted: "Off")`,
    );
    expect(() => norm({ entity: E, value: false })).toThrow(
      `${T}: value takes a text, not false (to hide the value: show_value: false; a word such as Off or No`,
    );
    expect(() => norm({ entity: E, name: true })).toThrow(`${T}: name takes a text, not true`);
    expect(() => norm({ entity: E, show_icon: false })).toThrow(
      `${T}: show_icon: false is icon: false`,
    );
    expect(() => norm({ entity: E, control: true })).toThrow(
      `${T}: control: true is control: auto`,
    );
    expect(() => norm({ entity: E, control: { type: "auto", step: 2 } })).toThrow(
      `${T}: control: { type: auto, … } is control: { … }`,
    );
    expect(() => norm({ entity: E, control: "none" })).toThrow(
      `${T}: control: none is control: false`,
    );
  });

  it("takes the kind's inputs in inputs and its other keys on the card, and only the kind's", () => {
    const speed = withStates({
      "sensor.wind_speed": st("sensor.wind_speed", "12", { device_class: "wind_speed" }),
    });
    const wind = norm(
      { entity: "sensor.wind_speed", inputs: { gust: false, today: "sensor.t" } },
      speed,
    );
    expect(wind.kind.name).toBe("wind");
    expect(wind.kindOpts).toEqual({ gust: false });
    // a written kind decides it from the config alone: a key it does not read is an error
    expect(() =>
      norm({ entity: "sensor.wind_speed", kind: "wind", inputs: { today: "sensor.t" } }),
    ).toThrow(`${T}: the wind kind reads no inputs: today (its inputs: direction, gust)`);
    expect(() => norm({ kind: "sun", running_above: 3 })).toThrow(
      `${T}: the sun kind reads no running_above`,
    );
    // an input is a key of inputs, never of the card; inputs takes inputs only
    expect(() => norm({ entity: "sensor.wind_speed", gust: false })).toThrow(
      `${T}: gust is inputs: { gust: … }`,
    );
    expect(() => norm({ entity: "sensor.wind_speed", inputs: "sensor.x" })).toThrow(
      `${T}: inputs takes the kind's entities by their names`,
    );
    expect(() => norm({ entity: "sensor.washer_power", inputs: { running_above: 3 } })).toThrow(
      `${T}: inputs: running_above goes on the card, not in inputs`,
    );
    expect(() => norm({ entity: "sensor.wind_speed", inputs: { bearing: "sensor.x" } })).toThrow(
      `${T}: inputs: bearing is no kind's input`,
    );
    expect(() => norm({ entity: "sensor.wind_speed", inputs: { gust: 3 } })).toThrow(
      `${T}: inputs: gust takes an entity id or false`,
    );
    // an appliance's look is a kind of its own, a cover's is its visual's variant
    const cover = norm({ entity: "cover.garage_door", visual: { type: "cover", variant: "gate" } });
    expect(cover.kind.name).toBe("cover");
    expect(cover.kindOpts).toEqual({});
    expect(() => norm({ entity: "cover.garage_door", kind: "garage" })).toThrow(
      `${T}: kind: garage is visual: { type: cover, variant: garage }`,
    );
    const washer = norm({ entity: "sensor.washer_power", kind: "washer", running_above: 10 });
    expect(washer.kind.name).toBe("washer");
    expect(washer.kindOpts).toEqual({ running_above: 10 });
    // the keys never decide the type: a grid's meters on a sensor of no class draw an entity
    const plain = norm({
      entity: "sensor.grid_power",
      inputs: { import: "sensor.a", export: "sensor.b" },
    });
    expect(plain.kind.name).toBe("none");
    expect(plain.kindOpts).toEqual({});
    expect(plain.inputs).toEqual({});
  });

  it("turns every default off with kind: none", () => {
    const own = norm({ entity: "weather.home", kind: "none" });
    expect(own.kind.name).toBe("none");
    expect(own.entities[0].valueSrc).toEqual({ kind: "state" });
    expect(own.inputs).toEqual({});
    expect(drawn(own)).toEqual({ icon: { type: "icon" }, visual: false });
    const light = norm({ entity: "light.kitchen", kind: "none" });
    expect(light.entities[0].control).toBeFalsy();
    expect(drawn(light).visual).toBe(false);
  });

  it("takes the status as a text, a template or false, its look the poster's", () => {
    const E = "sensor.living_room_temperature";
    expect(norm({ entity: E, status: "Cosy" }).statusText).toEqual({ kind: "text", text: "Cosy" });
    expect(norm({ entity: E, status: "{{ 'x' }}" }).statusText).toMatchObject({
      kind: "template",
    });
    const look = `${T}: status takes a text, a template or false (its look is the card's: a tag in its colour)`;
    for (const status of [
      { value: "Cosy", icon: "mdi:sofa", style: "filled" },
      { badge: true },
      { rules: [{ below: 20, label: "Cool" }] },
      true,
      3,
    ])
      expect(() => norm({ entity: E, status })).toThrow(look);
    // the card's rules, as a tag without an icon
    const own = norm({ entity: E, status: "Cosy", rules: [{ below: 30, status: "Poster" }] });
    const badge = own.entities[own.statusIdx!];
    expect(badge.rules.map((r) => r.label)).toEqual(["Poster"]);
    expect(badge.badge).toEqual({ style: "tag", size: "s" });
    expect(badge.item).toMatchObject({ showIcon: false, showName: false });
    const none = norm({ entity: E, status: false });
    expect(none.statusIdx).toBeNull();
    expect(none.groups[0].badgeIdxs).toEqual([]);
  });

  it("puts the status first, then the badges in the written order", () => {
    const E = "weather.home";
    const first = norm({ entity: E, badges: ["sensor.outdoor_humidity"] });
    expect(first.groups[0].badgeIdxs).toEqual([1, 2]);
    expect(first.entities[2].entity).toBe("sensor.outdoor_humidity");
    expect(first.entities[2].badge).toEqual({ style: "outline", size: "s" });
    // `status` is no entry of the list
    for (const badges of [["sensor.outdoor_humidity", "status"], ["status"]])
      expect(() => norm({ entity: E, badges })).toThrow(
        `${T}: status is no badge of the list: the status comes first (on a tile: status_badge: true)`,
      );
    expect(
      norm({ entity: E, status: false, badges: ["sensor.outdoor_humidity"] }).groups[0].badgeIdxs,
    ).toEqual([1]);
  });

  it("lets a badge without an entity read the poster's", () => {
    const c = norm({ entity: "weather.home", badges: [{ attribute: "humidity" }, {}] });
    const [humidity, again] = c.groups[0].badgeIdxs!.slice(1).map((i) => c.entities[i]);
    expect(humidity.entity).toBe("weather.home");
    expect(humidity.valueSrc).toMatchObject({ kind: "attribute", key: "humidity" });
    // the weather attribute's own unit
    expect(humidity.unit).toBe("%");
    // nothing named: the poster's value again
    expect(again.entity).toBe("weather.home");
    expect(again.valueSrc).toMatchObject({ kind: "attribute", key: "temperature" });
  });

  it("draws without an entity: its name, no tap, the kinds that read none", () => {
    const c = norm({ name: "Hello", value: "World" });
    expect(c.kind.name).toBe("none");
    expect(c.tap).toEqual({ action: "none" });
    expect(c.hold).toEqual({ action: "none" });
    expect(norm({ name: "Hello", tap_action: { action: "navigate" } }).tap.action).toBe("navigate");
    expect(norm({ name: "Hello" }).entities[0].valueSrc).toEqual({ kind: "text", text: "" });
    expect(norm({ kind: "sun" }).kind.name).toBe("sun");
    // a grid without an entity opens its import meter; a trend's first series is its entity
    const grid = norm({
      kind: "grid",
      inputs: { import: "sensor.grid_import", export: "sensor.grid_export" },
    });
    expect(grid.kind.name).toBe("grid");
    expect(grid.entities[0].entity).toBe("sensor.grid_import");
    const trend = norm({
      kind: "trend",
      series: [{ entity: "sensor.outdoor_temperature", name: "Out" }, "sensor.x"],
    });
    expect(trend.entities[0]).toMatchObject({ entity: "sensor.outdoor_temperature", name: "Out" });
    expect(trend.kind.history?.(trend.kindOpts, trend.entities[0].entity)).toEqual([
      "sensor.outdoor_temperature",
      "sensor.x",
    ]);
    // a series is named by its place in errors
    expect(() => norm({ kind: "trend", series: [{ entity: "sensor.x", visibility: 3 }] })).toThrow(
      `${T}: 'series[0].visibility'`,
    );
  });

  it("reads the history's window, bucket and smoothing from the visual", () => {
    const E = "sensor.outdoor_temperature";
    const of = (c: PosterConfig) => [c.hoursSet, c.hours, c.bucketMin, c.smoothMin];
    expect(of(norm({ entity: "weather.home" }))).toEqual([null, 24, 60, null]);
    expect(of(norm({ entity: "weather.home", visual: { hours: 12 } }))).toEqual([12, 12, 60, null]);
    expect(
      of(norm({ entity: E, visual: { type: "sparkline", hours: 48, bucket: 15, smoothing: 30 } })),
    ).toEqual([48, 48, 15, 30]);
    // today is no number of hours: a day of history
    expect(of(norm({ entity: E, visual: { type: "sparkline", hours: "today" } }))).toEqual([
      null,
      24,
      60,
      null,
    ]);
    expect(of(norm({ entity: "sensor.solar_power", kind: "solar" }))).toEqual([null, 24, 60, null]);
    expect(() => norm({ entity: E, visual: { type: "sparkline", hours: 0 } })).toThrow(
      "visual: hours must be a number of hours or today",
    );
    expect(() => norm({ entity: E, visual: { type: "bar", hours: 6 } })).toThrow(
      "visual: bar takes no options, not hours",
    );
  });
});

describe("poster-card image and status", () => {
  it("parses the image as a URL, a template or an entity's picture", () => {
    expect(parseImage(false)).toBe(false);
    expect(parseImage(undefined)).toBeNull();
    expect(parseImage("")).toBeNull();
    expect(parseImage(3)).toBeNull();
    expect(parseImage("/local/garden.jpg")).toEqual({ kind: "url", url: "/local/garden.jpg" });
    expect(parseImage("https://x.org/a.png")).toEqual({ kind: "url", url: "https://x.org/a.png" });
    expect(parseImage("camera.garden")).toEqual({
      kind: "entity",
      entity: "camera.garden",
    });
    expect(parseImage("{{ 'a' }}")).toEqual({ kind: "template", template: "{{ 'a' }}" });
    // a file name is a picture, not an entity
    expect(parseImage("garden.jpg")).toEqual({ kind: "url", url: "garden.jpg" });
    expect(parseImage("plan.svg")).toEqual({ kind: "url", url: "plan.svg" });
  });

  it("blurs the image by true, a number of px, or not by false; unset is the kind's", () => {
    const blur = (v: unknown) =>
      (norm({ entity: "sensor.x", visual: { type: "image", blur: v } }).places.visual || {}).blur;
    expect(blur(true)).toBe(IMAGE_BLUR);
    expect(blur(8)).toBe(8);
    expect(blur(0)).toBe(0);
    expect(blur(false)).toBe(0);
    expect(blur(undefined)).toBeUndefined();
    expect(() => blur("soft")).toThrow("visual: blur must be true, false or a number of px");
    expect(() => blur(-2)).toThrow(/visual: blur/);
    // a person's photo behind the card is blurred unless the card says not
    expect(drawn(norm({ entity: "person.malte" })).visual).toMatchObject({ blur: IMAGE_BLUR });
    expect(drawn(norm({ entity: "person.malte", visual: { blur: 4 } })).visual).toMatchObject({
      blur: 4,
    });
  });

  it("takes the shade's opacity and tint; a bad opacity names the option", () => {
    const cfg = norm({
      entity: "sensor.x",
      visual: { type: "image", src: "/local/a.jpg", opacity: 0.6, tint: "blue" },
    });
    expect(cfg.places.visual).toEqual({
      type: "image",
      src: "/local/a.jpg",
      opacity: 0.6,
      tint: "blue",
    });
    expect(() => norm({ entity: "sensor.x", visual: { type: "image", opacity: 2 } })).toThrow(
      "visual: opacity must be a number from 0 to 1",
    );
  });

  it("keeps what a rule writes of the icon and the visual, by rule", () => {
    const cfg = norm({
      entity: "sensor.x",
      rules: [
        {
          state: "on",
          icon: { type: "image", src: "person.malte", ring: true, style: "plain" },
          visual: { type: "image", src: "camera.garden", blur: true, opacity: 0.5, tint: "amber" },
        },
        { above: 5, visual: false, icon: "mdi:fire" },
        { below: 0, color: "blue" },
      ],
    });
    const [on, hot, cold] = cfg.entities[0].rules;
    expect(cfg.rulePlaces.get(on)).toEqual({
      icon: { type: "image", src: "person.malte", ring: true, style: "plain" },
      visual: {
        type: "image",
        src: "camera.garden",
        blur: IMAGE_BLUR,
        opacity: 0.5,
        tint: "amber",
      },
    });
    // false: nothing there while it matches; a name is the rule's icon
    expect(cfg.rulePlaces.get(hot)).toEqual({
      icon: { type: "icon", name: "mdi:fire" },
      visual: false,
    });
    expect(hot.icon).toBe("mdi:fire");
    // an object's name is the rule's icon too
    const named = norm({ entity: "sensor.x", rules: [{ state: "on", icon: { name: "mdi:x" } }] });
    expect(named.entities[0].rules[0].icon).toBe("mdi:x");
    // a rule that writes neither has its places left out
    expect(cfg.rulePlaces.get(cold)).toEqual({ icon: undefined, visual: undefined });
    // the kind's own rules have none
    const battery = norm({ entity: "sensor.phone_battery", kind: "battery" });
    expect(battery.rulePlaces.size).toBe(0);
  });

  it("never lets a rule fetch another history", () => {
    const E = "sensor.outdoor_temperature";
    const rule = (visual: unknown) => norm({ entity: E, rules: [{ above: 5, visual }] });
    expect(() => rule({ hours: 6 })).toThrow(
      `rules[0].visual: a rule sets no hours (it is the card's: a rule must not fetch history)`,
    );
    expect(() => rule({ type: "sparkline", bucket: 15 })).toThrow(/a rule sets no bucket/);
    expect(() => rule({ type: "sparkline", smoothing: 15 })).toThrow(/a rule sets no smoothing/);
    expect(() => rule({ type: "sparkline", src: "sensor.x" })).toThrow(
      "rules[0].visual: a rule sets no src of a plot (it is the card's history)",
    );
    // a plot without data of its own, and an image's src, are a rule's to set
    expect(rule({ type: "columns", axis: true }).rulePlaces.size).toBe(1);
    expect(rule({ type: "image", src: "camera.garden" }).rulePlaces.size).toBe(1);
  });

  it("takes a picture for the icon as a URL, a template or an entity's", () => {
    for (const src of ["/local/a.png", "person.malte", "{{ x }}"])
      expect(norm({ icon: { type: "image", src } }).places.icon).toEqual({ type: "image", src });
    // without a src: the entity's own picture
    expect(norm({ entity: "sensor.x", icon: { type: "image" } }).places.icon).toEqual({
      type: "image",
    });
    expect(() => norm({ icon: { type: "image", src: "" } })).toThrow("icon: src must be a text");
    expect(norm({ name: "x" }).places.icon).toBeUndefined();
  });

  it("shows a person's and a player's picture in the icon unless the card says not", () => {
    for (const entity of ["person.malte", "media_player.living_room_speaker"]) {
      expect(drawn(norm({ entity })).icon).toEqual({ type: "image" });
      expect(drawn(norm({ entity, icon: { type: "icon" } })).icon).toEqual({ type: "icon" });
    }
    expect(drawn(norm({ entity: "sensor.x" })).icon).toEqual({ type: "icon" });
  });

  it("reads the image now", () => {
    const hass = withStates({
      "camera.garden": st("camera.garden", "idle", { entity_picture: "/api/cam?t=1" }),
    });
    const ctx = { hass, tplResult: new Map<string, unknown>([["{{ 'a' }}", "/local/a.jpg"]]) };
    expect(imageUrl(ctx as never, null)).toBeNull();
    expect(imageUrl(ctx as never, false)).toBeNull();
    expect(imageUrl(ctx as never, { kind: "url", url: "/x.jpg" })).toBe("/x.jpg");
    expect(imageUrl(ctx as never, { kind: "template", template: "{{ 'a' }}" })).toBe(
      "/local/a.jpg",
    );
    expect(imageUrl(ctx as never, { kind: "entity", entity: "camera.garden" })).toBe(
      "/api/cam?t=1",
    );
  });

  it("says the card's status, else the matching rule's, else the kind's", () => {
    const E = "sensor.x";
    const hass = withStates({ [E]: st(E, "5") });
    const ctx = { hass, tplResult: new Map<string, unknown>([["{{ s }}", "Rendered"]]) };
    const cfg = norm({ entity: E, rules: [{ below: 10, status: "Low" }] });
    const m = modelOf(ctx, cfg.entities[0]);
    expect(statusText(ctx as never, cfg, m, null)).toBe("Low");
    // a matching rule's status wins over the kind's (the sun's next event, a trend's window)
    expect(statusText(ctx as never, cfg, m, "Kind's")).toBe("Low");
    const none = norm({ entity: E, rules: [{ above: 10, status: "High" }] });
    expect(statusText(ctx as never, none, modelOf(ctx, none.entities[0]), "Kind's")).toBe("Kind's");
    expect(
      statusText(ctx as never, { ...cfg, statusText: { kind: "text", text: "Own" } }, m, "K"),
    ).toBe("Own");
    expect(
      statusText(
        ctx as never,
        { ...cfg, statusText: { kind: "template", template: "{{ s }}" } },
        m,
        null,
      ),
    ).toBe("Rendered");
  });
});

describe("poster-card element", () => {
  const cards: PosterCard[] = [];
  afterEach(() => {
    for (const c of cards.splice(0)) c.remove();
  });
  const mount = (cfg: Record<string, unknown>) => {
    const el = new PosterCard();
    el.setConfig(cfg);
    document.body.appendChild(el);
    cards.push(el);
    return el;
  };

  it("is half a section wide and three rows high, and that at least", () => {
    const el = mount({ entity: "sensor.living_room_temperature" });
    expect(el.getGridOptions()).toEqual({ columns: 6, rows: 3, min_columns: 6, min_rows: 3 });
    expect(el.getCardSize()).toBe(3);
    el.setConfig({ entity: "climate.living_room" });
    expect(el.getGridOptions().min_columns).toBe(6);
  });

  it("resolves its kind again once hass tells the device class and the registry", () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const el = mount({ entity: "sensor.wind_speed" });
    // no hass yet: a sensor of no known class
    expect(el._config?.kind.name).toBe("none");
    expect(el._config?.inputs).toEqual({});
    const hass = snapshot();
    el.hass = hass;
    expect(el._config?.kind.name).toBe("wind");
    expect(Object.keys(el._config!.inputs).sort()).toEqual(["direction", "gust"]);
    // a new hass with the same registry normalises nothing again
    const before = el._config;
    el.hass = { ...hass };
    expect(el._config).toBe(before);
    const row = el.shadowRoot!.querySelector(".row.poster");
    expect(row).not.toBeNull();
    // a new registry that finds the same inputs normalises nothing again either
    el.hass = { ...hass, entities: { ...hass.entities } };
    expect(el._config).toBe(before);
    // one that finds other inputs does
    const entities = { ...hass.entities };
    delete entities["sensor.wind_gust"];
    el.hass = { ...hass, entities };
    expect(el._config).not.toBe(before);
    expect(Object.keys(el._config!.inputs)).toEqual(["direction"]);
  });

  it("resolves its icon's actions again from the state hass brings", () => {
    const A = "alarm_control_panel.home";
    const el = mount({ entity: A });
    // no state yet: the hold arms
    expect(el._config?.iconActions.hold).toEqual({ action: "toggle" });
    const hass = snapshot();
    const coded = {
      ...hass.states[A],
      attributes: { ...hass.states[A].attributes, code_format: "number" },
    };
    el.hass = { ...hass, states: { ...hass.states, [A]: coded } };
    expect(el._config?.iconActions.hold).toBeNull();
    // and back, once the panel no longer wants a code
    el.hass = hass;
    expect(el._config?.iconActions.hold).toEqual({ action: "toggle" });
  });

  it("takes hass before its config", () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const el = new PosterCard();
    el.hass = snapshot();
    el.setConfig({ entity: "sensor.wind_speed" });
    document.body.appendChild(el);
    cards.push(el);
    expect(el._config?.kind.name).toBe("wind");
    el.hass = snapshot();
    expect(el.shadowRoot!.querySelector(".row.poster")).not.toBeNull();
  });

  it("warns once about another kind's keys, once a detected kind is known", () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = mount({ entity: "sensor.rain_rate", inputs: { gust: "sensor.wind_gust" } });
    // no state yet: the device class may still make it a wind poster
    expect(warn).not.toHaveBeenCalled();
    const hass = snapshot();
    el.hass = hass;
    expect(el._config?.kind.name).toBe("rain");
    expect(warn).toHaveBeenCalledWith(
      `${T}: the rain poster reads no inputs: gust (its inputs: today, wind, direction); left out`,
    );
    el.hass = { ...hass };
    expect(warn).toHaveBeenCalledTimes(1);
    // a written kind is a config error instead; a config with nothing stray says nothing
    expect(() => el.setConfig({ kind: "sun", inputs: { today: "sensor.x" } })).toThrow(
      `${T}: the sun kind reads no inputs: today`,
    );
    el.setConfig({ kind: "sun" });
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

// the poster as the card draws it (happy-dom, the demo home): its skeleton, the badges in its
// corner, the name and the big value, the controls beside the value and its visuals. Fitting the
// value to the card needs a real layout and lives in the integration and visual tests.
describe("poster-card drawing", () => {
  const cards: PosterCard[] = [];
  const saved = new Map<string, HassEntity>();
  afterEach(() => {
    for (const c of cards.splice(0)) c.remove();
    for (const [id, s] of saved) world.states[id] = s;
    saved.clear();
  });
  // a state for this test (put back afterwards); every card gets a fresh hass
  const set = (id: string, state: string | number, attributes: Record<string, unknown> = {}) => {
    if (!saved.has(id)) saved.set(id, world.get(id)!);
    world.set(id, state, attributes);
    for (const c of cards) c.hass = snapshot();
  };
  const draw = (cfg: Record<string, unknown>) => {
    const el = new PosterCard();
    el.setConfig(cfg);
    document.body.appendChild(el);
    el.hass = snapshot();
    cards.push(el);
    return el.shadowRoot as ShadowRoot;
  };
  const q = (r: ParentNode, sel: string) => {
    const el = r.querySelector<HTMLElement>(sel);
    if (!el) throw new Error(`no element for ${sel}`);
    return el;
  };
  // the classes of the poster body's children, in order
  // the body's parts in order, the text block's own spelled out
  const bodyParts = (r: ParentNode) =>
    [...q(r, ".pbody").children].flatMap((c) =>
      c.classList.contains("pmain")
        ? [...q(c, ".ptext").children].map((t) => t.className)
        : [c.className],
    );
  const TEMP = "sensor.living_room_temperature";

  it("has the lead and the corner on top and the body below, no label pill", () => {
    const r = draw({ entity: TEMP });
    const row = q(r, ".body > .row.poster");
    expect(row.querySelector(":scope > .ptop > .plead > .lead")).not.toBeNull();
    expect(row.querySelector(":scope > .ptop > .corner")).not.toBeNull();
    expect(row.querySelector(":scope > .pbody")).not.toBeNull();
    // the status is a badge like the others: no pill of the v2 poster's
    expect(row.querySelector(".plabel")).toBeNull();
    // the action layer stays first
    expect(row.firstElementChild?.classList.contains("hit")).toBe(true);
  });

  it("draws the status and the badges as rows of their own in the corner", () => {
    set("sensor.living_room_humidity", 55);
    set("sensor.living_room_co2", 640);
    const r = draw({
      entity: TEMP,
      badges: [
        "sensor.living_room_humidity",
        { entity: "sensor.living_room_co2", style: "filled" },
      ],
    });
    const kids = [...q(r, ".row.poster .corner").children] as HTMLElement[];
    expect(kids.every((b) => b.classList.contains("row") && b.classList.contains("hval"))).toBe(
      true,
    );
    // the status first, then the badges as written
    expect(kids[0].classList.contains("pstatus")).toBe(true);
    const badges = kids.slice(1);
    expect(badges.map((b) => b.dataset.idx)).toEqual(["2", "3"]);
    expect(badges[0].classList.contains("b-outline")).toBe(true);
    expect(badges[1].classList.contains("b-filled")).toBe(true);
    expect(badges[0].textContent).toContain("55");
    expect(badges[1].textContent).toContain("640");
  });

  it("leaves out a status that repeats the value", () => {
    const L = "light.living_room";
    set(L, "on", { brightness: 204 });
    const r = draw({ entity: L });
    const status = () => q(r, ".corner > .pstatus");
    expect(status().classList.contains("empty")).toBe(false);
    expect(status().textContent).toContain("On");
    // off: the value says Off, the corner nothing
    set(L, "off", {});
    expect(q(r, ".pvalue").textContent).toContain("Off");
    expect(status().classList.contains("empty")).toBe(true);
    set(L, "on", { brightness: 204 });
    expect(status().classList.contains("empty")).toBe(false);
  });

  it("keeps its badges when the poster is filled again, and fills a badge in place", () => {
    set(TEMP, 21.4);
    set("sensor.living_room_humidity", 55);
    const r = draw({ entity: TEMP, badges: ["sensor.living_room_humidity"] });
    const badge = q(r, ".corner > .row.hval:not(.pstatus)");
    set(TEMP, 23.5);
    expect(q(r, ".pvalue .big b").textContent).toBe("23.5");
    expect(q(r, ".corner > .row.hval:not(.pstatus)")).toBe(badge);
    expect(r.querySelectorAll(".corner > .row.hval:not(.pstatus)")).toHaveLength(1);
    set("sensor.living_room_humidity", 61);
    expect(q(r, ".corner > .row.hval:not(.pstatus)")).toBe(badge);
    expect(badge.textContent).toContain("61");
    expect(q(r, ".pvalue .big b").textContent).toBe("23.5");
  });

  it("shows the name and the big value with its unit", () => {
    set(TEMP, 21.4);
    const r = draw({ entity: TEMP });
    expect(q(r, ".pbody > .pname").textContent).toBe("Living room temperature");
    expect(q(r, ".pvalue > .big > b").textContent).toBe("21.4");
    expect(q(r, ".pvalue > .big > span").textContent).toBe("°C");
    expect(q(r, ".pvalue > .big").classList.contains("word")).toBe(false);
    expect(bodyParts(r)).toEqual(["pname", "pvalue"]);
  });

  it("draws a word smaller than a number", () => {
    const r = draw({ entity: "input_select.house_mode", control: false });
    expect(q(r, ".pvalue > .big").classList.contains("word")).toBe(true);
    expect(q(r, ".pvalue > .big > b").textContent).toBe("Home");
  });

  it("adds the secondary line under the value, the name above them", () => {
    const r = draw({ entity: TEMP, name: "Living room", secondary: "Feels like 20" });
    expect(bodyParts(r)).toEqual(["pname", "pvalue", "secondary"]);
    expect(q(r, ".pname").textContent).toBe("Living room");
    expect(q(r, ".ptext > .secondary").textContent).toBe("Feels like 20");
  });

  it("lets a stepper that shows the very same number take the value's place", () => {
    const same = draw({
      entity: "climate.living_room",
      kind: "none",
      attribute: "temperature",
      control: "stepper",
    });
    expect(same.querySelector(".pvalue .big")).toBeNull();
    expect(same.querySelector(".pmain > .end > .ctl-stepper")).not.toBeNull();
    // the climate kind's own: the current temperature beside the target's stepper
    const own = draw({ entity: "climate.living_room" });
    expect(q(own, ".pvalue > .big > b").textContent).toBe("21.6");
    expect(own.querySelector(".pmain > .end > .ctl-stepper")).not.toBeNull();
  });

  it("keeps the value beside segments, a select and a button", () => {
    const seg = draw({
      entity: "climate.living_room",
      kind: "none",
      attribute: "hvac_mode",
      control: "segments",
    });
    expect(seg.querySelector(".pvalue > .big")).not.toBeNull();
    expect(seg.querySelector(".pmain > .end > .ctl-segments")).not.toBeNull();
    const sel = draw({ entity: "input_select.house_mode", control: "auto" });
    expect(q(sel, ".pvalue > .big > b").textContent).toBe("Home");
    expect(sel.querySelector(".pmain > .end > .ctl-select")).not.toBeNull();
    const run = draw({ entity: "script.check_windows", control: "auto" });
    expect(run.querySelector(".pvalue > .big")).not.toBeNull();
    expect(run.querySelector(".pmain > .end > .ctl-chip")).not.toBeNull();
    // no control, no end slot
    expect(draw({ entity: TEMP }).querySelector(".pmain > .end")).toBeNull();
  });

  it("draws a gauge as its picture: the arc first, no big value", () => {
    const H = "sensor.living_room_humidity";
    const r = draw({ entity: H, visual: "gauge" });
    expect(q(r, ".pbody").classList.contains("pgauge")).toBe(true);
    expect(r.querySelector(".pbody .big")).toBeNull();
    expect(bodyParts(r)).toEqual(["gauge", "pname"]);
    // any other visual leaves the body as it is
    const bar = draw({ entity: H, visual: "bar" });
    expect(q(bar, ".pbody").classList.contains("pgauge")).toBe(false);
    expect(bodyParts(bar)).toEqual(["pname", "pvalue", "bar"]);
  });

  it("lights visual: glow from below as strong as its level, the same element at every level", () => {
    const H = "sensor.living_room_humidity";
    set(H, 50);
    const r = draw({ entity: H, visual: "glow", min: 0, max: 100 });
    const glow = q(r, ".body > .pback > .pglow");
    expect(glow.style.opacity).toBe("0.650");
    expect(glow.style.getPropertyValue("--glow")).not.toBe("");
    set(H, 100);
    expect(glow.style.opacity).toBe("1.000");
    set(H, 0);
    expect(glow.style.opacity).toBe("0");
    expect(q(r, ".pback > .pglow")).toBe(glow);
    // the glow is the picture: none along the bottom
    expect(bodyParts(r)).toEqual(["pname", "pvalue"]);
    // without a number: on or off
    set("switch.coffee_machine", "off");
    const sw = draw({ entity: "switch.coffee_machine", visual: "glow" });
    expect(q(sw, ".pglow").style.opacity).toBe("0");
    set("switch.coffee_machine", "on");
    expect(q(sw, ".pglow").style.opacity).toBe("1.000");
  });

  it("glows a light in its colour by its brightness; another visual drops the glow", () => {
    const L = "light.living_room";
    set(L, "on", { brightness: 255, rgb_color: [255, 200, 100] });
    const r = draw({ entity: L });
    const glow = q(r, ".pback > .pglow");
    expect(glow.style.opacity).toBe("1.000");
    // the poster's colour, which fades to a new one (the body's --pc-tint)
    expect(glow.style.getPropertyValue("--glow")).toBe("var(--pc-tint)");
    expect((glow.closest(".body") as HTMLElement).style.getPropertyValue("--pc-tint")).toBe(
      "rgb(255, 200, 100)",
    );
    set(L, "on", { brightness: 0.4 * 255 });
    expect(glow.style.opacity).toBe("0.580");
    set(L, "off");
    expect(glow.style.opacity).toBe("0");
    expect(q(r, ".pback > .pglow")).toBe(glow);
    for (const visual of [false, "bar"])
      expect(draw({ entity: L, visual }).querySelector(".pglow")).toBeNull();
  });

  it("draws a picture behind the texts under its shade, blurred and tinted as the visual says", () => {
    const r = draw({
      entity: "sensor.living_room_humidity",
      visual: { type: "image", src: "/local/garden.jpg", opacity: 0.6, tint: "blue", blur: 8 },
    });
    const back = q(r, ".body > .pback");
    expect(back.hidden).toBe(false);
    expect(back.classList.contains("scrim")).toBe(true);
    expect(back.classList.contains("blur")).toBe(true);
    expect(back.style.getPropertyValue("--pblur")).toBe("8px");
    expect(back.style.getPropertyValue("--pc-shade")).toBe("0.4");
    expect(back.style.getPropertyValue("--pc-shade-color")).toContain("var(--blue-color) 50%");
    expect([...back.children].map((c) => c.getAttribute("src"))).toEqual(["/local/garden.jpg"]);
    // the default shade, no blur, no tint
    const plain = q(draw({ entity: TEMP, visual: { type: "image", src: "/a.jpg" } }), ".pback");
    expect(plain.classList.contains("blur")).toBe(false);
    expect(plain.style.getPropertyValue("--pc-shade")).toBe("0.7");
    // a person's photo, blurred
    const person = q(draw({ entity: "person.malte" }), ".pback");
    expect(person.style.getPropertyValue("--pblur")).toBe(`${IMAGE_BLUR}px`);
    // no visual: an empty layer, hidden
    expect(q(draw({ entity: TEMP }), ".pback").hidden).toBe(true);
  });

  it("puts a matching rule's picture behind the texts while it matches", () => {
    set(TEMP, 21);
    const r = draw({
      entity: TEMP,
      rules: [{ above: 25, visual: { type: "image", src: "/hot.jpg" } }],
    });
    expect(q(r, ".pback").hidden).toBe(true);
    set(TEMP, 30);
    expect(q(r, ".pback > img").getAttribute("src")).toBe("/hot.jpg");
    set(TEMP, 20);
    expect(q(r, ".pback").hidden).toBe(true);
  });

  it("lets a matching rule's colour and icon win over the card's", () => {
    set(TEMP, 21);
    const r = draw({
      entity: TEMP,
      color: "red",
      icon: "mdi:sofa",
      rules: [{ above: 25, color: "blue", icon: "mdi:fire" }],
    });
    const icon = () => q(r, ".plead ha-icon").getAttribute("icon");
    expect(icon()).toBe("mdi:sofa");
    set(TEMP, 30);
    expect(icon()).toBe("mdi:fire");
    const cfg = (r.host as PosterCard)._config!;
    const m = modelOf({ hass: snapshot(), tplResult: new Map() }, cfg.entities[0]);
    expect(m.look.color).toBe("blue");
  });

  it("draws a picture of its own in the icon", () => {
    const r = draw({ entity: TEMP, icon: { type: "image", src: "/local/a.png" } });
    expect(q(r, ".plead > .lead img.picture").getAttribute("src")).toBe("/local/a.png");
    // a person's own photo, unless the icon is the icon
    expect(draw({ entity: "person.malte" }).querySelector(".plead img.picture")).not.toBeNull();
    const plain = draw({ entity: "person.malte", icon: { type: "icon" } });
    expect(plain.querySelector(".plead img.picture")).toBeNull();
    expect(plain.querySelector(".plead ha-icon")).not.toBeNull();
  });

  it("animates the wind in the icon, or behind the texts with the arrow in the icon", () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const W = "sensor.wind_speed";
    const lead = draw({ entity: W });
    expect(lead.querySelector(".plead > .wlead")).not.toBeNull();
    expect(q(lead, ".pback").hidden).toBe(true);
    const behind = draw({ entity: W, visual: { type: "flow", variant: "lines" } });
    expect(behind.querySelector(".plead > .wlead")).toBeNull();
    expect(behind.querySelector(".plead ha-icon.arrow")).not.toBeNull();
    expect(q(behind, ".pback").dataset.key).toBe("lines");
    expect(behind.querySelector(".pback > .wflow")).not.toBeNull();
    // the icon's style stays when the flow moves behind the texts: the arrow without its circle
    const plain = draw({ entity: W, icon: { style: "plain" }, visual: { type: "flow" } });
    expect(q(plain, ".plead > .lead").classList.contains("plain")).toBe(true);
    expect(q(behind, ".plead > .lead").classList.contains("plain")).toBe(false);
  });

  it("draws a cover in its device class's variant, or in the one its visual names", () => {
    // garage: the door's panels; no device class: a window pane
    expect(
      draw({ entity: "cover.garage_door" }).querySelector(".pback > .pcov.garage"),
    ).not.toBeNull();
    expect(
      draw({ entity: "cover.workshop_door" }).querySelector(".pback > .pcov.window"),
    ).not.toBeNull();
    // a written variant wins over the device class, with or without the visual's type
    const named = draw({
      entity: "cover.workshop_door",
      visual: { type: "cover", variant: "garage" },
    });
    expect(named.querySelector(".pback > .pcov.garage")).not.toBeNull();
    expect(named.querySelector(".pback > .pcov.window")).toBeNull();
    expect(
      draw({ entity: "cover.garage_door", visual: { variant: "gate" } }).querySelector(
        ".pback > .pcov.gate",
      ),
    ).not.toBeNull();
    // a curtain's two halves
    expect(
      draw({ entity: "cover.garage_door", visual: { variant: "curtain" } }).querySelectorAll(
        ".pback > .pcov.curtain > .half",
      ).length,
    ).toBe(2);
  });

  it("leaves out a thing its kind does not draw, said once", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const r = draw({ entity: TEMP, visual: "sun" });
    expect(q(r, ".pback").hidden).toBe(true);
    expect(r.querySelector(".pbody > .plot")).toBeNull();
    expect(warn).toHaveBeenCalledWith(`${T}: a card without a kind draws no visual: sun; left out`);
    const calls = warn.mock.calls.length;
    set(TEMP, 22);
    expect(warn.mock.calls.length).toBe(calls);
  });

  it("says once which options do nothing on what the detected kind draws", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    draw({ entity: "light.kitchen", visual: { hours: 12 } });
    const msg = `${T}: visual: a light poster's visual is glow, which takes no options, not hours`;
    const said = () => warn.mock.calls.filter((c) => String(c[0]).startsWith(msg)).length;
    expect(said()).toBe(1);
    set("light.kitchen", "off");
    expect(said()).toBe(1);
    // a written kind decides it from the config alone: an error
    expect(() => norm({ entity: "light.kitchen", kind: "light", visual: { hours: 12 } })).toThrow(
      msg,
    );
  });

  it("draws a ring around the icon", () => {
    const r = draw({ entity: "sensor.living_room_humidity", icon: { ring: true } });
    expect(q(r, ".plead > .lead").classList.contains("ring")).toBe(true);
    expect(r.querySelector(".plead > .lead svg .track")).not.toBeNull();
    // an animated lead gives way to the ring, the card's or the matching rule's
    const fan = draw({ entity: "fan.living_room", icon: { ring: true } });
    expect(q(fan, ".plead > .lead").classList.contains("ring")).toBe(true);
    expect(fan.querySelector(".plead > .pfan")).toBeNull();
    set("fan.living_room", "on", { percentage: 66 });
    const ruled = draw({
      entity: "fan.living_room",
      rules: [{ state: "off", icon: { ring: true } }],
    });
    expect(ruled.querySelector(".plead > .pfan")).not.toBeNull();
    set("fan.living_room", "off", { percentage: 0 });
    expect(ruled.querySelector(".plead > .pfan")).toBeNull();
    expect(q(ruled, ".plead > .lead").classList.contains("ring")).toBe(true);
  });

  it("builds an animated lead again for a new icon or icon style, keeps it otherwise", () => {
    set("fan.living_room", "on", { percentage: 66 });
    const r = draw({
      entity: "fan.living_room",
      rules: [{ state: "off", icon: { name: "mdi:fan-off", style: "plain" } }],
    });
    const lead = q(r, ".plead > .pfan");
    expect(lead.classList.contains("plain")).toBe(false);
    set("fan.living_room", "on", { percentage: 33 });
    expect(q(r, ".plead > .pfan")).toBe(lead);
    set("fan.living_room", "off", { percentage: 0 });
    const off = q(r, ".plead > .pfan");
    expect(off).not.toBe(lead);
    expect(off.classList.contains("plain")).toBe(true);
    expect(off.querySelector("ha-icon")?.getAttribute("icon")).toBe("mdi:fan-off");
  });

  it("draws the status in the card's colour", () => {
    const r = draw({ entity: "sensor.living_room_temperature", status: "Cosy", color: "red" });
    const status = q(r, ".corner > .row.pstatus");
    expect(q(r, ".body").style.getPropertyValue("--pc-tint")).toBe(cssColor("red", ""));
    expect(status.style.getPropertyValue("--fe-color")).toBe("var(--pc-tint)");
    expect(status.textContent).toContain("Cosy");
    expect(status.querySelector("ha-icon")).toBeNull();
  });

  // the card with its calls and actions recorded
  const drawCalls = (cfg: Record<string, unknown>) => {
    const r = draw(cfg);
    const calls: string[] = [];
    const fired: Record<string, unknown>[] = [];
    (r.host as PosterCard).hass = {
      ...snapshot(),
      callService: (d: string, s: string) => {
        calls.push(`${d}.${s}`);
        return Promise.resolve();
      },
    } as unknown as HomeAssistant;
    r.host.addEventListener("hass-action", (e) =>
      fired.push((e as CustomEvent).detail.config as Record<string, unknown>),
    );
    return { r, calls, fired };
  };

  it("holds a lock on its icon, which takes its own gestures", () => {
    vi.useFakeTimers();
    try {
      set("lock.front_door", "locked");
      const { r, calls, fired } = drawCalls({ entity: "lock.front_door" });
      const hold = q(r, ".plead > button.ctl-hold.lead-size");
      expect(hold.getAttribute("aria-label")).toBe("Hold to unlock");
      hold.dispatchEvent(new PointerEvent("pointerdown", { button: 0, bubbles: true }));
      vi.advanceTimersByTime(1100);
      expect(calls).toEqual(["lock.unlock"]);
      expect(fired).toEqual([]);
      // beside a tap action of its own: a press let go early is a tap
      const tap = drawCalls({ entity: "lock.front_door", icon: { tap_action: "more-info" } });
      const both = q(tap.r, ".plead > button.ctl-hold");
      both.dispatchEvent(new PointerEvent("pointerdown", { button: 0, bubbles: true }));
      vi.advanceTimersByTime(200);
      both.dispatchEvent(new PointerEvent("pointerup", { button: 0, bubbles: true }));
      expect(tap.fired).toEqual([
        { entity: "lock.front_door", tap_action: { action: "more-info" } },
      ]);
      expect(tap.calls).toEqual([]);
      // icon: { hold_action: none } leaves the plain icon
      expect(
        draw({ entity: "lock.front_door", icon: { hold_action: "none" } }).querySelector(
          ".plead > .lead:not(.tap)",
        ),
      ).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("makes the icon a switch with icon: { tap_action: toggle }", () => {
    set("switch.coffee_machine", "off");
    const { r, calls, fired } = drawCalls({
      entity: "switch.coffee_machine",
      icon: { tap_action: "toggle" },
    });
    const lead = q(r, ".plead > .lead.tap");
    expect(lead.getAttribute("role")).toBe("switch");
    expect(lead.classList.contains("off")).toBe(true);
    lead.click();
    expect(calls).toEqual(["homeassistant.toggle"]);
    expect(fired).toEqual([]);
  });

  it("runs any other icon action through Home Assistant, a double tap on its own", () => {
    vi.useFakeTimers();
    try {
      const { r, calls, fired } = drawCalls({
        entity: "sensor.living_room_humidity",
        icon: {
          tap_action: { action: "navigate", navigation_path: "/climate" },
          double_tap_action: "more-info",
        },
      });
      const lead = q(r, ".plead > .lead.tap.act");
      expect(lead.getAttribute("role")).toBe("button");
      // a single tap waits for a second one
      lead.click();
      expect(fired).toEqual([]);
      vi.advanceTimersByTime(300);
      expect(fired).toEqual([
        {
          entity: "sensor.living_room_humidity",
          tap_action: { action: "navigate", navigation_path: "/climate" },
        },
      ]);
      lead.click();
      lead.click();
      vi.advanceTimersByTime(300);
      expect(fired.slice(1)).toEqual([
        { entity: "sensor.living_room_humidity", double_tap_action: { action: "more-info" } },
      ]);
      // a key runs the tap at once
      lead.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      expect(fired).toHaveLength(3);
      expect(calls).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("closes the body with a plot that names what it draws", () => {
    for (const kind of ["sparkline", "columns", "strip"]) {
      const r = draw({ entity: TEMP, visual: kind });
      const plot = q(r, ".pbody > .plot");
      expect(plot.dataset.kind).toBe(kind);
      expect(q(r, ".pbody").lastElementChild).toBe(plot);
    }
  });
});
