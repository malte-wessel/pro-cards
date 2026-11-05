// The poster's and the tile's editor form, section by section: what a field writes into the YAML,
// what a field left alone keeps, and that the YAML is the shortest that draws the same.
import { describe, it, expect } from "vitest";
import { snapshot } from "../../../../docs/.vitepress/theme/ha-shim/hass.ts";
import {
  DEFAULT,
  DETECTED,
  badgeFromForm,
  badgeToForm,
  configToForm,
  formToConfig,
  withDefaults,
  type CardThing,
} from "../../../../src/shared/kinds/editor-form.ts";
import { kindsOf } from "../../../../src/shared/kinds/editor.ts";
import { writtenRules } from "../../../../src/shared/kinds/rules.ts";
import { t } from "../../../../src/shared/i18n.ts";
import type { CardConfigBase, HaFormData } from "../../../../src/shared/ha.ts";

const hass = snapshot();
type Raw = Record<string, unknown>;

// the form opened on `cfg`, the fields in `change` set as a user would, written back (the kind
// read from the form's entity and kind, as the editor does)
const edit = (cfg: Raw, change: HaFormData, thing: CardThing = "poster"): Raw => {
  const form = configToForm(cfg as CardConfigBase, kindsOf(cfg, hass).kind, thing);
  const data = { ...form, ...change };
  const [kind, was] = [kindsOf(data, hass).kind, kindsOf(cfg, hass).kind];
  return formToConfig(data, cfg as CardConfigBase, kind, thing, was) as Raw;
};
const formOf = (cfg: Raw, thing: CardThing = "poster") =>
  configToForm(cfg as CardConfigBase, kindsOf(cfg, hass).kind, thing);

const LIGHT = { type: "custom:poster-card-pro", entity: "light.living_room" };
const TILE = { type: "custom:tile-card-pro", entity: "light.living_room" };
const WIND = { type: "custom:poster-card-pro", entity: "sensor.wind_speed" };

describe("the editor form: the top", () => {
  it("leaves the kind to detection unless one is picked", () => {
    expect(formOf(LIGHT).kind).toBe(DETECTED);
    expect(edit(LIGHT, { kind: "fan" })).toEqual({ ...LIGHT, kind: "fan" });
    expect(edit({ ...LIGHT, kind: "fan" }, { kind: DETECTED })).toEqual(LIGHT);
    // a cleared select is back at its default: detected
    expect(edit({ ...LIGHT, kind: "fan" }, { kind: "" })).toEqual(LIGHT);
  });

  it("writes the entity, the name and the colour, and drops them when cleared", () => {
    expect(edit(LIGHT, { name: "Sofa", color: "amber" })).toEqual({
      ...LIGHT,
      name: "Sofa",
      color: "amber",
    });
    expect(edit({ ...LIGHT, name: "Sofa", color: "amber" }, { name: "", color: "" })).toEqual(
      LIGHT,
    );
    expect(edit(LIGHT, { entity: "light.kitchen" })).toEqual({
      ...LIGHT,
      entity: "light.kitchen",
    });
    expect(edit(LIGHT, { entity: "" })).toEqual({ type: LIGHT.type });
  });

  it("keeps what the form does not show", () => {
    const cfg = {
      ...LIGHT,
      grid_options: { columns: 6, rows: 2 },
      visibility: [{ condition: "state", entity: "light.kitchen", state: "on" }],
    };
    expect(edit(cfg, { name: "Sofa" })).toEqual({ ...cfg, name: "Sofa" });
  });
});

describe("the editor form: the content", () => {
  const TEMP = { type: "custom:tile-card-pro", entity: "sensor.living_room_temperature" };

  it("writes the texts as they are and drops the empty ones", () => {
    const texts = {
      attribute: "friendly_name",
      value: "{{ 1 + 1 }}",
      secondary: "Sofa",
      unit: "K",
      prefix: "~",
      suffix: "!",
    };
    expect(edit(TEMP, texts, "tile")).toEqual({ ...TEMP, ...texts });
    const cleared = Object.fromEntries(Object.keys(texts).map((k) => [k, ""]));
    expect(edit({ ...TEMP, ...texts }, cleared, "tile")).toEqual(TEMP);
  });

  it("writes numbers, a zero too, and drops what is not one", () => {
    expect(edit(TEMP, { decimals: 0, min: 0, max: 30 }, "tile")).toEqual({
      ...TEMP,
      decimals: 0,
      min: 0,
      max: 30,
    });
    expect(
      edit(
        { ...TEMP, decimals: 1, min: 0, max: 30 },
        { decimals: undefined, min: Number.NaN, max: undefined },
        "tile",
      ),
    ).toEqual(TEMP);
    // a value that is not a number in the YAML is no number in the form
    expect(formOf({ ...TEMP, min: "low" }).min).toBeUndefined();
  });

  it("keeps a number written as text until its field changes", () => {
    const quoted = { ...TEMP, min: "10", max: "30" };
    expect(edit(quoted, { name: "Room" }, "tile")).toEqual({ ...quoted, name: "Room" });
    expect(edit(quoted, { min: 5 }, "tile")).toEqual({ ...quoted, min: 5 });
  });

  it("writes only the switches turned off", () => {
    expect(formOf(TEMP)).toMatchObject({ show_name: true, show_value: true, hover: true });
    expect(edit(TEMP, { show_name: false, show_value: false, hover: false }, "tile")).toEqual({
      ...TEMP,
      show_name: false,
      show_value: false,
      hover: false,
    });
    expect(
      edit(
        { ...TEMP, show_name: false, show_value: false, hover: false },
        { show_name: true, show_value: true, hover: true },
        "tile",
      ),
    ).toEqual(TEMP);
  });

  it("writes the card's actions, and drops an emptied one", () => {
    const tap = { action: "toggle" };
    expect(edit(LIGHT, { tap_action: tap })).toEqual({ ...LIGHT, tap_action: tap });
    expect(formOf({ ...LIGHT, hold_action: tap }).hold_action).toEqual(tap);
    expect(edit({ ...LIGHT, tap_action: tap }, { tap_action: undefined })).toEqual(LIGHT);
  });
});

describe("the editor form: the icon", () => {
  it("writes a name alone as the name, and options as an object", () => {
    expect(formOf(LIGHT).icon_thing).toBe(DEFAULT);
    expect(edit(LIGHT, { icon: "mdi:lamp" })).toEqual({ ...LIGHT, icon: "mdi:lamp" });
    expect(edit(LIGHT, { icon_ring: true })).toEqual({ ...LIGHT, icon: { ring: true } });
    expect(edit(LIGHT, { icon: "mdi:lamp", icon_ring: true })).toEqual({
      ...LIGHT,
      icon: { name: "mdi:lamp", ring: true },
    });
    // the circle is the default style: only plain is written
    expect(edit(LIGHT, { icon_style: "circle" })).toEqual(LIGHT);
    expect(edit(LIGHT, { icon_style: "plain" })).toEqual({ ...LIGHT, icon: { style: "plain" } });
    expect(edit({ ...LIGHT, icon: { ring: true } }, { icon_ring: false })).toEqual(LIGHT);
  });

  it("reads the icon as written", () => {
    expect(formOf({ ...LIGHT, icon: false }).icon_thing).toBe("none");
    expect(formOf({ ...LIGHT, icon: "mdi:lamp" })).toMatchObject({
      icon_thing: DEFAULT,
      icon: "mdi:lamp",
    });
    expect(formOf({ ...LIGHT, icon: { type: "image", src: "/a.jpg" } })).toMatchObject({
      icon_thing: "image",
      icon_src: "/a.jpg",
    });
    // a person draws a picture by default: an icon's name is another thing there
    const person = { type: LIGHT.type, entity: "person.malte" };
    expect(formOf({ ...person, icon: "mdi:account" }).icon_thing).toBe("icon");
    expect(formOf(person).icon_thing).toBe(DEFAULT);
  });

  it("writes another thing with its type, and none as false", () => {
    expect(edit(LIGHT, { icon_thing: "none" })).toEqual({ ...LIGHT, icon: false });
    expect(edit(LIGHT, { icon_thing: "image", icon_src: "/lamp.jpg" })).toEqual({
      ...LIGHT,
      icon: { type: "image", src: "/lamp.jpg" },
    });
    expect(edit(LIGHT, { icon_thing: "image" })).toEqual({ ...LIGHT, icon: { type: "image" } });
    // a name on a picture is the icon while there is none: the type stays
    expect(edit(LIGHT, { icon_thing: "image", icon: "mdi:lamp" })).toEqual({
      ...LIGHT,
      icon: { type: "image", name: "mdi:lamp" },
    });
    expect(edit({ ...LIGHT, icon: false }, { icon_thing: DEFAULT })).toEqual(LIGHT);
  });

  it("writes only the options the thing takes", () => {
    // a flow has no ring and no name, it has variants
    expect(
      edit(WIND, { icon_ring: true, icon: "mdi:weather-windy", icon_variant: "lines" }),
    ).toEqual({ ...WIND, icon: { variant: "lines" } });
    expect(edit(WIND, { icon_variant: DEFAULT })).toEqual(WIND);
    // a variant on an icon that is no flow is left out
    expect(edit(LIGHT, { icon_variant: "lines" })).toEqual(LIGHT);
    // the wind as a plain icon: a name alone is an icon whatever the kind draws there
    expect(edit(WIND, { icon_thing: "icon", icon: "mdi:weather-windy" })).toEqual({
      ...WIND,
      icon: "mdi:weather-windy",
    });
    expect(edit(WIND, { icon_thing: "icon", icon_ring: true })).toEqual({
      ...WIND,
      icon: { type: "icon", ring: true },
    });
    // the icon alone, where the kind draws a flow or a picture
    expect(edit(WIND, { icon_thing: "icon" })).toEqual({ ...WIND, icon: { type: "icon" } });
    const person = { type: "custom:poster-card-pro", entity: "person.malte" };
    expect(edit(person, { icon_thing: "icon" })).toEqual({ ...person, icon: { type: "icon" } });
    expect(formOf({ ...WIND, icon: { type: "icon" } }).icon_thing).toBe("icon");
  });

  it("carries the icon's actions, and a tile's badge", () => {
    const tap = { action: "more-info" };
    expect(edit(LIGHT, { icon_tap_action: tap })).toEqual({ ...LIGHT, icon: { tap_action: tap } });
    expect(formOf({ ...LIGHT, icon: { hold_action: tap } }).icon_hold_action).toEqual(tap);
    // switching the thing keeps them
    expect(
      edit({ ...LIGHT, icon: { ring: true, tap_action: tap } }, { icon_thing: "image" }),
    ).toEqual({ ...LIGHT, icon: { type: "image", ring: true, tap_action: tap } });

    expect(edit(TILE, { icon_badge: "none" }, "tile")).toEqual({ ...TILE, icon: { badge: false } });
    expect(edit(TILE, { icon_badge: "custom", icon_badge_icon: "mdi:star" }, "tile")).toEqual({
      ...TILE,
      icon: { badge: { icon: "mdi:star" } },
    });
    expect(formOf({ ...TILE, icon: { badge: "none" } }, "tile").icon_badge).toBe("none");
    expect(
      formOf({ ...TILE, icon: { badge: { icon: "mdi:star", color: "red" } } }, "tile"),
    ).toMatchObject({ icon_badge: "custom", icon_badge_icon: "mdi:star", icon_badge_color: "red" });
    // a poster has no badge on its icon
    expect(edit(LIGHT, { icon_badge: "none" })).toEqual(LIGHT);
  });

  it("keeps the icon's spelling while its fields stay as they were", () => {
    const cfg = { ...LIGHT, icon: { type: "icon", ring: true } };
    expect(edit(cfg, { name: "Sofa" })).toEqual({ ...cfg, name: "Sofa" });
    // a change writes the shortest YAML
    expect(edit(cfg, { icon: "mdi:lamp" })).toEqual({
      ...LIGHT,
      icon: { name: "mdi:lamp", ring: true },
    });
  });
});

describe("the editor form: the visual", () => {
  it("writes another thing by its name, with options as an object", () => {
    // a light glows by default
    expect(formOf(LIGHT).visual_thing).toBe(DEFAULT);
    expect(edit(LIGHT, { visual_thing: "sparkline" })).toEqual({ ...LIGHT, visual: "sparkline" });
    expect(edit(LIGHT, { visual_thing: "sparkline", visual_hours: 6, visual_axis: true })).toEqual({
      ...LIGHT,
      visual: { type: "sparkline", hours: 6, axis: true },
    });
    expect(edit(LIGHT, { visual_thing: "columns", visual_today: true, visual_hours: 6 })).toEqual({
      ...LIGHT,
      visual: { type: "columns", hours: "today" },
    });
    expect(
      edit(LIGHT, { visual_thing: "sparkline", visual_smoothing: 10, visual_bucket: 15 }),
    ).toEqual({ ...LIGHT, visual: { type: "sparkline", bucket: 15, smoothing: 10 } });
    expect(
      edit(LIGHT, { visual_thing: "strip", visual_src: "sensor.living_room_temperature" }),
    ).toEqual({ ...LIGHT, visual: { type: "strip", src: "sensor.living_room_temperature" } });
  });

  it("reads a visual's options as written", () => {
    expect(
      formOf({ ...LIGHT, visual: { type: "sparkline", hours: "today", bucket: 10, axis: true } }),
    ).toMatchObject({
      visual_thing: "sparkline",
      visual_today: true,
      visual_hours: undefined,
      visual_bucket: 10,
      visual_axis: true,
    });
    expect(formOf({ ...LIGHT, visual: { type: "image", blur: true } }).visual_blur).toBe(20);
    expect(formOf({ ...LIGHT, visual: { type: "image", blur: false } }).visual_blur).toBe(0);
    expect(formOf({ ...LIGHT, visual: false }).visual_thing).toBe("none");
  });

  it("writes only the options the thing takes", () => {
    // a bar takes no history
    expect(edit(LIGHT, { visual_thing: "bar", visual_hours: 6, visual_axis: true })).toEqual({
      ...LIGHT,
      visual: "bar",
    });
    // a sun's hours, no today
    const sun = { type: LIGHT.type, entity: "sun.sun" };
    expect(edit(sun, { visual_hours: 12 })).toEqual({ ...sun, visual: { hours: 12 } });
    expect(
      edit(LIGHT, {
        visual_thing: "image",
        visual_src: "/sofa.jpg",
        visual_opacity: 0.5,
        visual_tint: "blue",
        visual_blur: 0,
      }),
    ).toEqual({
      ...LIGHT,
      visual: { type: "image", src: "/sofa.jpg", opacity: 0.5, tint: "blue", blur: false },
    });
  });

  it("empties the place with none, where the kind draws something there", () => {
    expect(edit(LIGHT, { visual_thing: "none" })).toEqual({ ...LIGHT, visual: false });
    expect(edit({ ...LIGHT, visual: false }, { visual_thing: DEFAULT })).toEqual(LIGHT);
    // a fan draws nothing there: none is its default, nothing to write
    const fan = { type: LIGHT.type, entity: "fan.living_room" };
    expect(edit(fan, { visual_thing: "none" })).toEqual(fan);
  });

  it("writes a drawing's variant, and the default's options without a type", () => {
    const cover = { type: LIGHT.type, entity: "cover.garage_door" };
    expect(edit(cover, { visual_variant: "gate" })).toEqual({
      ...cover,
      visual: { variant: "gate" },
    });
    expect(edit(WIND, { visual_thing: "flow", visual_variant: "swoosh" })).toEqual({
      ...WIND,
      visual: { type: "flow", variant: "swoosh" },
    });
    expect(edit(WIND, { visual_thing: "flow" })).toEqual({ ...WIND, visual: "flow" });
  });

  it("keeps the visual's spelling while its fields stay as they were", () => {
    const cfg = { ...LIGHT, visual: { type: "sparkline" } };
    expect(edit(cfg, { name: "Sofa" })).toEqual({ ...cfg, name: "Sofa" });
    expect(edit(cfg, { visual_hours: 3 })).toEqual({
      ...LIGHT,
      visual: { type: "sparkline", hours: 3 },
    });
  });
});

describe("the editor form: the other entities", () => {
  it("writes the inputs the form names, under inputs", () => {
    expect(formOf(WIND)).toMatchObject({ input_direction: "", input_gust: "" });
    expect(edit(WIND, { input_gust: "sensor.wind_gust" })).toEqual({
      ...WIND,
      inputs: { gust: "sensor.wind_gust" },
    });
    expect(edit({ ...WIND, inputs: { gust: "sensor.wind_gust" } }, { input_gust: "" })).toEqual(
      WIND,
    );
  });

  it("keeps an input turned off and another kind's inputs as written", () => {
    const cfg = { ...WIND, inputs: { direction: false, today: "sensor.rain_today" } };
    expect(formOf(cfg).input_direction).toBe("");
    expect(edit(cfg, { input_gust: "sensor.wind_gust" })).toEqual({
      ...WIND,
      inputs: { direction: false, today: "sensor.rain_today", gust: "sensor.wind_gust" },
    });
    // untouched: as written
    expect(edit(cfg, { name: "Wind" })).toEqual({ ...cfg, name: "Wind" });
  });

  it("drops what only the old kind read when the kind changes", () => {
    const grid = {
      ...LIGHT,
      entity: "sensor.grid_power",
      kind: "grid",
      inputs: { import: "sensor.grid_import_power", today: "sensor.rain_today" },
    };
    // another kind's input it never read stays; the grid's go with it
    expect(edit(grid, { kind: DETECTED })).toEqual({
      ...LIGHT,
      entity: "sensor.grid_power",
      inputs: { today: "sensor.rain_today" },
    });
    const washer = { ...LIGHT, kind: "washer", entity: "sensor.washer_power", running_above: 5 };
    expect(edit(washer, { kind: "dryer" })).toEqual({ ...washer, kind: "dryer" });
    expect(edit(washer, { kind: "solar" })).toEqual({
      ...LIGHT,
      kind: "solar",
      entity: "sensor.washer_power",
    });
  });

  it("keeps the places written when the kind or the entity changes", () => {
    const glow = { ...LIGHT, visual: "glow" };
    expect(edit(glow, { kind: "none" })).toEqual({ ...glow, kind: "none" });
    expect(edit(glow, { entity: "sensor.living_room_temperature" })).toEqual({
      ...glow,
      entity: "sensor.living_room_temperature",
    });
    // a thing only the old kind draws goes with it
    const flow = { ...WIND, visual: { type: "flow", variant: "lines" } };
    expect(edit(flow, { kind: "none" })).toEqual({ ...WIND, kind: "none" });
  });

  it("writes an appliance's threshold and a trend's series", () => {
    const washer = { type: LIGHT.type, kind: "washer", entity: "sensor.washer_power" };
    expect(edit(washer, { running_above: 5 })).toEqual({ ...washer, running_above: 5 });
    expect(edit({ ...washer, running_above: 5 }, { running_above: undefined })).toEqual(washer);

    const trend = { type: LIGHT.type, kind: "trend", entity: "sensor.outdoor_temperature" };
    expect(
      edit(trend, {
        series: [
          { entity: "sensor.dew_point" },
          { entity: "sensor.living_room_temperature", name: "Inside", color: "red" },
        ],
      }),
    ).toEqual({
      ...trend,
      series: [
        "sensor.dew_point",
        { entity: "sensor.living_room_temperature", name: "Inside", color: "red" },
      ],
    });
    expect(edit({ ...trend, series: ["sensor.dew_point"] }, { series: [] })).toEqual(trend);
  });
});

describe("the editor form: the controls", () => {
  const FAN = { type: "custom:poster-card-pro", entity: "fan.living_room" };
  const CLIMATE = { type: "custom:poster-card-pro", entity: "climate.living_room" };
  const SWITCH = { type: "custom:tile-card-pro", entity: "switch.coffee_machine" };

  it("writes the kind's, none, the entity's own or one named", () => {
    expect(formOf(LIGHT).control_type).toBe(DEFAULT);
    expect(edit(LIGHT, { control_type: "none" })).toEqual({ ...LIGHT, control: false });
    expect(edit({ ...LIGHT, control: false }, { control_type: DEFAULT })).toEqual(LIGHT);
    expect(edit(SWITCH, { control_type: "auto" }, "tile")).toEqual({ ...SWITCH, control: "auto" });
    expect(edit(LIGHT, { control_type: "slider" })).toEqual({ ...LIGHT, control: "slider" });
    expect(formOf({ ...LIGHT, control: { type: "hold" } }).control_type).toBe("hold");
  });

  it("reads auto on a kind with controls of its own as the kind's", () => {
    expect(formOf({ ...LIGHT, control: "auto" }).control_type).toBe(DEFAULT);
    expect(edit({ ...LIGHT, control: "auto" }, { name: "Lamp" })).toEqual({
      ...LIGHT,
      control: "auto",
      name: "Lamp",
    });
  });

  it("reads the mode a control sets by default, written, as the default", () => {
    const cfg = { ...CLIMATE, control: { type: "segments", attribute: "hvac_mode" } };
    expect(formOf(cfg).control_attribute).toBe(DEFAULT);
    // and keeps it as written while the field stays
    expect(edit(cfg, { name: "Hall" })).toEqual({ ...cfg, name: "Hall" });
    expect(
      formOf({ ...CLIMATE, control: { type: "segments", attribute: "preset_mode" } })
        .control_attribute,
    ).toBe("preset_mode");
  });

  it("keeps your own buttons on a kind whose own control is buttons", () => {
    const COVER = { type: "custom:poster-card-pro", entity: "cover.awning" };
    const own = {
      type: "buttons",
      options: [{ entity: "script.check_windows", label: "Morning" }],
    };
    const form = formOf({ ...COVER, control: own });
    // the cover's own control is its buttons: the default, with your buttons in its list
    expect(form.control_type).toBe(DEFAULT);
    expect(form.control_buttons).toEqual([{ entity: "script.check_windows", label: "Morning" }]);
    // untouched: as written; a button added: still the buttons
    expect(edit({ ...COVER, control: own }, { name: "Awning" })).toEqual({
      ...COVER,
      control: own,
      name: "Awning",
    });
    const more = [...(form.control_buttons as object[]), { entity: "script.check_windows" }];
    const out = edit({ ...COVER, control: own }, { control_buttons: more });
    expect((out.control as { options: unknown[] }).options).toHaveLength(2);
  });

  it("reads a place, a variant or a control written as the default as the default", () => {
    expect(formOf({ ...LIGHT, control: { position: "end" } }).control_position).toBe(DEFAULT);
    expect(
      formOf({ ...LIGHT, control: { type: "slider", position: "block" } }).control_position,
    ).toBe(DEFAULT);
    expect(
      formOf({ ...LIGHT, control: { type: "slider", position: "end" } }).control_position,
    ).toBe("end");
    expect(formOf({ ...WIND, icon: { variant: "dots" } }).icon_variant).toBe(DEFAULT);
    expect(formOf({ ...WIND, visual: { type: "flow", variant: "dots" } }).visual_variant).toBe(
      DEFAULT,
    );
    expect(formOf({ ...WIND, visual: { type: "flow", variant: "lines" } }).visual_variant).toBe(
      "lines",
    );
    // and keeps them as written while their fields stay
    const cfg = { ...LIGHT, control: { position: "end" } };
    expect(edit(cfg, { name: "Lamp" })).toEqual({ ...cfg, name: "Lamp" });
  });

  it("writes only the options the control picked now takes", () => {
    const slider = { ...LIGHT, control: { type: "slider", step: 5, confirm: true } };
    expect(edit(slider, { control_type: "toggle" })).toEqual({
      ...LIGHT,
      control: { type: "toggle", confirm: true },
    });
    const select = { ...LIGHT, control: { type: "select", options: [{ value: "a" }] } };
    expect(edit(select, { control_type: "slider" })).toEqual({ ...LIGHT, control: "slider" });
  });

  it("writes a control's options with its type, or on the kind's own without one", () => {
    expect(edit(LIGHT, { control_type: "slider", control_step: 5 })).toEqual({
      ...LIGHT,
      control: { type: "slider", step: 5 },
    });
    expect(edit(LIGHT, { control_position: "block" })).toEqual({
      ...LIGHT,
      control: { position: "block" },
    });
    expect(edit(SWITCH, { control_type: "auto", control_confirm: true }, "tile")).toEqual({
      ...SWITCH,
      control: { confirm: true },
    });
    // and reads it back as the domain's, with its confirm
    expect(formOf({ ...SWITCH, control: { confirm: true } }, "tile")).toMatchObject({
      control_type: "auto",
      control_confirm: true,
    });
    expect(edit(CLIMATE, { control_type: "segments", control_attribute: "preset_mode" })).toEqual({
      ...CLIMATE,
      control: { type: "segments", attribute: "preset_mode" },
    });
    // the defaults of its selects write nothing
    expect(
      edit(LIGHT, {
        control_position: DEFAULT,
        control_attribute: DEFAULT,
        control_step: undefined,
      }),
    ).toEqual(LIGHT);
  });

  it("writes a segments' options by their value, a button as an object", () => {
    expect(
      edit(FAN, {
        control_type: "segments",
        control_options: [{ value: "eco" }, { value: "boost", label: "Boost", icon: "mdi:fan" }],
      }),
    ).toEqual({
      ...FAN,
      control: {
        type: "segments",
        options: ["eco", { value: "boost", label: "Boost", icon: "mdi:fan" }],
      },
    });
    expect(
      formOf({ ...FAN, control: { type: "select", options: ["eco", { value: "boost" }] } })
        .control_options,
    ).toEqual([{ value: "eco" }, { value: "boost" }]);
    // a button is never written as an entity alone
    expect(
      edit(LIGHT, { control_type: "buttons", control_buttons: [{ entity: "scene.bright" }] }),
    ).toEqual({ ...LIGHT, control: { type: "buttons", options: [{ entity: "scene.bright" }] } });
    expect(
      formOf({
        ...LIGHT,
        control: { type: "buttons", options: [{ entity: "scene.bright", label: "Bright" }] },
      }).control_buttons,
    ).toEqual([{ entity: "scene.bright", label: "Bright" }]);
  });

  it("keeps the control's spelling while its fields stay as they were", () => {
    const cfg = { ...LIGHT, control: { type: "toggle" } };
    expect(edit(cfg, { name: "Sofa" })).toEqual({ ...cfg, name: "Sofa" });
    expect(edit(cfg, { control_type: "hold" })).toEqual({ ...LIGHT, control: "hold" });
  });
});

describe("the editor form: the status and the badges", () => {
  it("writes the status, hides it as false", () => {
    expect(edit(LIGHT, { status: "Cosy" })).toEqual({ ...LIGHT, status: "Cosy" });
    expect(edit(LIGHT, { status: "Cosy", hide_status: true })).toEqual({ ...LIGHT, status: false });
    expect(formOf({ ...LIGHT, status: false })).toMatchObject({ hide_status: true });
    expect(edit({ ...LIGHT, status: false }, { hide_status: false })).toEqual(LIGHT);
  });

  it("writes a tile's status badge, never a poster's", () => {
    expect(edit(TILE, { status_badge: true }, "tile")).toEqual({ ...TILE, status_badge: true });
    expect(edit({ ...TILE, status_badge: true }, { status_badge: false }, "tile")).toEqual(TILE);
    expect(edit(LIGHT, { status_badge: true })).toEqual(LIGHT);
  });

  it("writes a badge of an entity alone as its id, else as an object", () => {
    expect(
      edit(LIGHT, {
        badges: [
          { entity: "sensor.living_room_temperature" },
          { entity: "light.kitchen", name: "K" },
        ],
      }),
    ).toEqual({
      ...LIGHT,
      badges: ["sensor.living_room_temperature", { entity: "light.kitchen", name: "K" }],
    });
    expect(edit({ ...LIGHT, badges: ["light.kitchen"] }, { badges: [] })).toEqual(LIGHT);
  });

  it("keeps a badge's other keys in its YAML field", () => {
    const badge = { entity: "light.kitchen", name: "K", tap_action: { action: "toggle" } };
    expect(formOf({ ...LIGHT, badges: [badge] }).badges).toEqual([
      {
        entity: "light.kitchen",
        name: "K",
        kind: "detected",
        icon_type: "icon",
        more: { tap_action: { action: "toggle" } },
      },
    ]);
    // edited in the dialog, its other keys stay
    expect(
      edit(
        { ...LIGHT, badges: [badge] },
        {
          badges: [
            {
              entity: "light.kitchen",
              name: "Kitchen",
              more: { tap_action: { action: "toggle" } },
            },
          ],
        },
      ),
    ).toEqual({ ...LIGHT, badges: [{ ...badge, name: "Kitchen" }] });
    // a key the form shows wins over the same key in the YAML field
    expect(
      edit(LIGHT, { badges: [{ entity: "light.kitchen", name: "A", more: { name: "B" } }] }),
    ).toEqual({ ...LIGHT, badges: [{ entity: "light.kitchen", name: "A" }] });
  });
});

describe("the editor form: a badge's places, kind and switch", () => {
  const field = (badge: unknown) => (formOf({ ...LIGHT, badges: [badge] }).badges as Raw[])[0];
  const written = (item: Raw) =>
    (
      edit(LIGHT, { badges: [{ kind: "detected", icon_type: "icon", ...item }] })
        .badges as unknown[]
    )[0];

  it("reads the icon place, the visual, the kind and the switch into fields", () => {
    expect(field({ entity: "sensor.x", icon: { name: "mdi:x", ring: true } })).toMatchObject({
      icon: "mdi:x",
      icon_type: "icon",
      icon_ring: true,
    });
    expect(field({ entity: "sensor.x", icon: { type: "dot" } }).icon_type).toBe("dot");
    expect(field({ entity: "sensor.x", icon: false }).icon_type).toBe("none");
    expect(field({ entity: "sensor.x", visual: { type: "trend", hours: 6 } })).toMatchObject({
      visual: "trend",
      hours: 6,
    });
    expect(field({ entity: "light.x", control: "toggle", kind: "none" })).toMatchObject({
      control: true,
      kind: "none",
    });
    // a picture's src has its field; what the fields cannot say stays as written (a window of
    // today)
    expect(
      field({ entity: "person.x", icon: { type: "image", src: "/local/m.jpg" } }),
    ).toMatchObject({ icon_type: "image", icon_src: "/local/m.jpg" });
    expect(
      field({ entity: "sensor.x", visual: { type: "sparkline", hours: "today" } }).more,
    ).toEqual({ visual: { type: "sparkline", hours: "today" } });
  });

  it("writes the fields back as the shortest spelling", () => {
    expect(written({ entity: "sensor.x" })).toBe("sensor.x");
    expect(written({ entity: "sensor.x", icon_type: "dot" })).toEqual({
      entity: "sensor.x",
      icon: { type: "dot" },
    });
    expect(written({ entity: "sensor.x", icon_ring: true })).toEqual({
      entity: "sensor.x",
      icon: { ring: true },
    });
    expect(written({ entity: "person.x", icon_type: "image", icon_ring: true })).toEqual({
      entity: "person.x",
      icon: { type: "image", ring: true },
    });
    // a dot takes no ring; none is false
    expect(written({ entity: "sensor.x", icon_type: "dot", icon_ring: true })).toEqual({
      entity: "sensor.x",
      icon: { type: "dot" },
    });
    expect(written({ entity: "sensor.x", icon_type: "none" })).toEqual({
      entity: "sensor.x",
      icon: false,
    });
    expect(written({ entity: "sensor.x", visual: "sparkline", hours: 12 })).toEqual({
      entity: "sensor.x",
      visual: { type: "sparkline", hours: 12 },
    });
    // a bar has no window
    expect(written({ entity: "sensor.x", visual: "bar", hours: 12 })).toEqual({
      entity: "sensor.x",
      visual: "bar",
    });
    expect(written({ entity: "light.x", control: true, kind: "none" })).toEqual({
      entity: "light.x",
      kind: "none",
      control: "toggle",
    });
  });

  it("keeps the spelling of a badge nobody changed, wherever it moved", () => {
    const a = { entity: "sensor.a", icon: { type: "icon", ring: true }, visual: { type: "trend" } };
    const b = { entity: "sensor.b", control: { type: "toggle" } };
    const form = formOf({ ...LIGHT, badges: [a, b] }).badges as Raw[];
    const edited = { ...form[1], name: "B" };
    expect(edit({ ...LIGHT, badges: [a, b] }, { badges: [edited, form[0]] }).badges).toEqual([
      { entity: "sensor.b", name: "B", control: "toggle" },
      a,
    ]);
  });
});

describe("the editor form: the rules", () => {
  it("keeps the rules as written while the list is untouched", () => {
    const rules = [
      { color: "red", state: "on" },
      { below: 10, icon: { name: "mdi:x" } },
    ];
    expect(edit({ ...LIGHT, rules }, { name: "Sofa" })).toEqual({ ...LIGHT, rules, name: "Sofa" });
  });

  it("writes an edited rule with its other keys, and none brings the kind's back", () => {
    const rules = [{ state: "on", status: "Lit", icon: { ring: true }, label: "x" }];
    const form = formOf({ ...LIGHT, rules }).rules as Raw[];
    // a place's icon is YAML, not the icon picker
    expect(form).toEqual([
      { state: "on", status: "Lit", more: { icon: { ring: true }, label: "x" } },
    ]);
    expect(edit({ ...LIGHT, rules }, { rules: [{ ...form[0], status: "Bright" }] })).toEqual({
      ...LIGHT,
      rules: [{ state: "on", status: "Bright", icon: { ring: true }, label: "x" }],
    });
    expect(edit(LIGHT, { rules: [{ above: 50, color: "red" }] })).toEqual({
      ...LIGHT,
      rules: [{ above: 50, color: "red" }],
    });
    expect(edit({ ...LIGHT, rules }, { rules: [] })).toEqual(LIGHT);
  });
});

describe("the editor form: a tile's layout", () => {
  it("writes vertical on a tile only", () => {
    expect(formOf(TILE, "tile").vertical).toBe(false);
    expect(edit(TILE, { vertical: true }, "tile")).toEqual({ ...TILE, vertical: true });
    expect(edit({ ...TILE, vertical: true }, { vertical: false }, "tile")).toEqual(TILE);
    expect(edit(LIGHT, { vertical: true })).toEqual(LIGHT);
    expect(formOf(LIGHT)).not.toHaveProperty("vertical");
  });
});

describe("the editor form's selects", () => {
  it("take their default where the form has none", () => {
    expect(withDefaults({})).toEqual({
      kind: DETECTED,
      icon_thing: DEFAULT,
      icon_style: "circle",
      icon_variant: DEFAULT,
      icon_badge: "auto",
      visual_thing: DEFAULT,
      visual_variant: DEFAULT,
      control_type: DEFAULT,
      control_position: DEFAULT,
      control_attribute: DEFAULT,
      rules_from: DEFAULT,
    });
    expect(withDefaults({ kind: "fan", icon_thing: "", visual_thing: null })).toMatchObject({
      kind: "fan",
      icon_thing: DEFAULT,
      visual_thing: DEFAULT,
    });
  });

  it("write nothing for a config without any, whatever was cleared", () => {
    const cleared = Object.fromEntries(Object.keys(withDefaults({})).map((k) => [k, ""]));
    for (const cfg of [LIGHT, WIND, { type: LIGHT.type, entity: "climate.living_room" }])
      expect(edit(cfg, { ...cleared, entity: cfg.entity })).toEqual(cfg);
  });
});

describe("the editor form: the kind's rules", () => {
  // as the editor does: the kind's rules as the card would write them, before and now
  const rulesOf = (cfg: Raw) => {
    const kind = kindsOf(cfg, hass).kind;
    const st = hass.states[String(cfg.entity ?? "")];
    const unit = st?.attributes.unit_of_measurement;
    return writtenRules(kind, (k) => t(hass, k), typeof unit === "string" ? unit : null);
  };
  const formWith = (cfg: Raw) =>
    configToForm(cfg as CardConfigBase, kindsOf(cfg, hass).kind, "poster", rulesOf(cfg));
  const editWith = (cfg: Raw, change: (form: HaFormData) => HaFormData) => {
    const data = { ...formWith(cfg), ...change(formWith(cfg)) };
    return formToConfig(
      data,
      cfg as CardConfigBase,
      kindsOf(data, hass).kind,
      "poster",
      kindsOf(cfg, hass).kind,
      { before: rulesOf(cfg), now: rulesOf(data) },
    ) as Raw;
  };
  const kindRules = rulesOf(WIND);

  it("are shown, as predefined, while the card has none, and write nothing", () => {
    const form = formWith(WIND);
    expect(form.rules_from).toBe(DEFAULT);
    expect((form.rules as Raw[]).map((r) => r.status)).toEqual([
      "Calm",
      "Breezy",
      "Windy",
      "Strong wind",
      "Stormy",
    ]);
    expect(editWith(WIND, () => ({ name: "Roof" }))).toEqual({ ...WIND, name: "Roof" });
  });

  it("are copied, all of them, when one is changed", () => {
    const out = editWith(WIND, (f) => ({
      rules: (f.rules as Raw[]).map((r, i) => (i === 1 ? { ...r, color: "green" } : r)),
    }));
    expect(out.rules).toEqual(kindRules.map((r, i) => (i === 1 ? { ...r, color: "green" } : r)));
    // the card's own now
    expect(formWith(out).rules_from).toBe("own");
    // all deleted: none at all
    expect(editWith(WIND, () => ({ rules: [] })).rules).toEqual([]);
  });

  it("come back when predefined is picked, and are copied when own is", () => {
    const own = { ...WIND, rules: [{ above: 10, color: "red" }] };
    expect(editWith(own, () => ({ rules_from: DEFAULT }))).toEqual(WIND);
    expect(editWith(WIND, () => ({ rules_from: "own" })).rules).toEqual(kindRules);
    // the card's own stay as written
    expect(editWith(own, () => ({ name: "Roof" }))).toEqual({ ...own, name: "Roof" });
  });

  it("are the card's alone on a kind without rules", () => {
    expect(formWith(LIGHT)).toMatchObject({ rules_from: "own", rules: [] });
    expect(editWith(LIGHT, () => ({ rules: [] }))).toEqual(LIGHT);
    expect(editWith(LIGHT, () => ({ rules: [{ state: "on", color: "amber" }] })).rules).toEqual([
      { state: "on", color: "amber" },
    ]);
  });
});

describe("the editor form: an empty text", () => {
  it("keeps a text written empty while its field stays empty (unit: '' hides the unit)", () => {
    const card = { ...LIGHT, unit: "" };
    expect(edit(card, { name: "Sofa" })).toEqual({ ...card, name: "Sofa" });
    // filled in, it is written
    expect(edit(card, { unit: "lx" })).toEqual({ ...LIGHT, unit: "lx" });
  });
});

describe("the editor form: a row of a tile group's table", () => {
  const ROW = { entity: "sensor.washer_power" };
  it("writes a badge's visual after the value, with its window", () => {
    expect(edit(ROW, { visual_thing: "trend", visual_hours: 2 }, "row")).toEqual({
      ...ROW,
      visual: { type: "trend", hours: 2 },
    });
    expect(edit(ROW, { visual_thing: "sparkline" }, "row")).toEqual({
      ...ROW,
      visual: "sparkline",
    });
    // as written, and back to none
    const spark = { ...ROW, visual: { type: "sparkline", hours: 6 } };
    expect(formOf(spark, "row")).toMatchObject({ visual_thing: "sparkline", visual_hours: 6 });
    expect(edit(spark, { visual_thing: "none" }, "row")).toEqual(ROW);
  });

  it("leaves the control out where it draws a visual", () => {
    const lamp = { entity: "light.desk_lamp", control: "slider" };
    expect(edit(lamp, { visual_thing: "bar" }, "row")).toEqual({
      entity: "light.desk_lamp",
      visual: "bar",
    });
  });
});

describe("the editor form: a badge's picture and kind", () => {
  it("keeps a picture's source through the dialog", () => {
    const pic = { entity: "light.desk", icon: { type: "image", src: "person.malte" } };
    const item = badgeToForm(pic);
    expect(item).toMatchObject({ icon_type: "image", icon_src: "person.malte" });
    expect(item.more).toBeUndefined();
    expect(badgeFromForm(item)).toEqual(pic);
    expect(badgeFromForm({ ...item, icon_ring: true })).toEqual({
      entity: "light.desk",
      icon: { type: "image", ring: true, src: "person.malte" },
    });
  });

  it("leaves out a kind that cannot read the badge's entity", () => {
    expect(badgeFromForm({ entity: "light.desk", kind: "battery" })).toBe("light.desk");
    expect(badgeFromForm({ entity: "sensor.phone_battery", kind: "battery" })).toEqual({
      entity: "sensor.phone_battery",
      kind: "battery",
    });
    expect(badgeFromForm({ entity: "light.desk", kind: "none" })).toEqual({
      entity: "light.desk",
      kind: "none",
    });
  });
});

describe("the editor form: actions", () => {
  it("shows a bare action name in the picker and keeps its spelling while it is left alone", () => {
    const tile = { entity: "light.desk_lamp", tap_action: "toggle" };
    expect(formOf(tile, "tile").tap_action).toEqual({ action: "toggle" });
    expect(edit(tile, { name: "Desk" }, "tile")).toEqual({ ...tile, name: "Desk" });
    expect(edit(tile, { tap_action: { action: "more-info" } }, "tile")).toEqual({
      entity: "light.desk_lamp",
      tap_action: { action: "more-info" },
    });
  });
});
