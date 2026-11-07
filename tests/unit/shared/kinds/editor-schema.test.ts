// The poster's and the tile's editor form, as shown: which sections and fields a card gets for its
// entity, its kind and the things it draws, and what their selects offer.
import { describe, it, expect } from "vitest";
import { snapshot } from "../../../../docs/.vitepress/theme/ha-shim/hass.ts";
import {
  badgeToForm,
  configToForm,
  DEFAULT,
  type CardThing,
} from "../../../../src/shared/kinds/editor-form.ts";
import {
  badgeItemSchema,
  editorSchema,
  ruleItemSchema,
} from "../../../../src/shared/kinds/editor-schema.ts";
import { kindsOf, showsOf } from "../../../../src/shared/kinds/editor.ts";
import { KIND_THINGS } from "../../../../src/shared/kinds/places.ts";
import { KINDS } from "../../../../src/shared/kinds/registry.ts";
import type { CardConfigBase, HaFormData, HaFormSchema } from "../../../../src/shared/ha.ts";
import { isNum } from "../../../../src/shared/util.ts";

const hass = snapshot();
type Raw = Record<string, unknown>;

// the schema of a card, with the form's data changed as a user would
const schemaOf = (thing: CardThing, cfg: Raw, change: HaFormData = {}) => {
  const base = configToForm(cfg as CardConfigBase, kindsOf(cfg, hass).kind, thing);
  const data = { ...base, ...change };
  // what it shows: as the editor finds it for these data, unless the change names it
  data.shows ??= showsOf(data, hass);
  const { kind, detected } = kindsOf(data, hass);
  const st = hass.states[String(data.entity ?? "")];
  return editorSchema({ hass, thing, kind, detected, data, numeric: isNum(st?.state), st });
};
const flat = (schema: HaFormSchema[]): HaFormSchema[] =>
  schema.flatMap((s) => [s, ...(s.schema ? flat(s.schema) : [])]);
// (a heading between a section's groups is no field)
const names = (schema: HaFormSchema[]) =>
  flat(schema).flatMap((s) => (s.name && !s.selector?.pro_cards_heading ? [s.name] : []));
const field = (schema: HaFormSchema[], name: string) => flat(schema).find((s) => s.name === name);
const options = (schema: HaFormSchema[], name: string) =>
  (field(schema, name)?.selector as { select: { options: { value: string; label: string }[] } })
    ?.select.options ?? [];
const values = (schema: HaFormSchema[], name: string) => options(schema, name).map((o) => o.value);
const sections = (schema: HaFormSchema[]) =>
  schema.filter((s) => s.type === "expandable").map((s) => s.title);
const sectionOf = (schema: HaFormSchema[], title: string) =>
  names(schema.find((s) => s.title === title)?.schema ?? []);

const LIGHT = { entity: "light.living_room" };
const TEMP = { entity: "sensor.living_room_temperature" };

describe("the editor's sections", () => {
  it("are the card's own, with controls only where they apply", () => {
    expect(sections(schemaOf("poster", LIGHT))).toEqual([
      "Name",
      "Value",
      "Status",
      "Appearance",
      "Layout",
      "Controls",
      "Badges",
      "Rules",
      "Interactions",
    ]);
    // a tile has a layout; a sensor no controls
    expect(sections(schemaOf("tile", { entity: "sensor.wind_speed" }))).toEqual([
      "Name",
      "Value",
      "Status",
      "Appearance",
      "Layout",
      "Badges",
      "Rules",
      "Interactions",
    ]);
    // how it sits in its cell: a tile's direction and alignment, both cards' height
    expect(sectionOf(schemaOf("tile", TEMP), "Layout")).toEqual([
      "vertical",
      "vertical_align",
      "fill_height",
    ]);
    expect(sectionOf(schemaOf("poster", TEMP), "Layout")).toEqual(["fill_height"]);
    // a row has none, a tile in a group takes its group's
    expect(sections(schemaOf("row", TEMP))).not.toContain("Layout");
    // a sensor has no controls unless the form names one
    expect(sections(schemaOf("poster", TEMP))).not.toContain("Controls");
    expect(sections(schemaOf("poster", TEMP, { control_type: "buttons" }))).toContain("Controls");
  });

  it("start with what the card shows, the entity and what else the kind reads", () => {
    const top = (cfg: Raw, change: HaFormData = {}) =>
      names(schemaOf("poster", cfg, change).filter((s) => s.type !== "expandable"));
    expect(top(LIGHT)).toEqual(["shows", "entity"]);
    expect(top({ entity: "sensor.wind_speed" })).toEqual([
      "shows",
      "entity",
      "input_direction",
      "input_gust",
    ]);
    expect(top({})).toEqual(["shows"]);
    expect(top(TEMP, { kind: "trend" })).toEqual(["shows", "entity", "series"]);
  });

  it("open the name, and put the colour and the icon with the look", () => {
    const schema = schemaOf("poster", LIGHT);
    expect(schema.find((s) => s.title === "Name")?.expanded).toBe(true);
    expect(schema.find((s) => s.title === "Value")?.expanded).toBeFalsy();
    expect(sectionOf(schema, "Appearance").slice(0, 3)).toEqual(["color", "icon_thing", "icon"]);
    // an icon of its own only where the place draws an icon or a picture
    expect(names(schemaOf("poster", LIGHT, { icon_thing: "none" }))).not.toContain("icon");
    expect(names(schemaOf("poster", { entity: "sensor.wind_speed" }))).not.toContain("icon");
    expect(names(schemaOf("poster", LIGHT, { icon_thing: "image" }))).toContain("icon");
  });

  it("show the name and how the value is written only while they show", () => {
    const shown = schemaOf("poster", TEMP);
    expect(sectionOf(shown, "Name")).toEqual(["show_name", "name"]);
    expect(sectionOf(shown, "Value")).toEqual(
      expect.arrayContaining(["show_value", "attribute", "value", "unit", "decimals", "prefix"]),
    );
    const hidden = schemaOf("poster", TEMP, { show_name: false, show_value: false });
    expect(sectionOf(hidden, "Name")).toEqual(["show_name"]);
    // what the visual reads too stays, and the line under the value
    expect(sectionOf(hidden, "Value")).toEqual(["show_value", "attribute", "secondary"]);
    // a field filled in stays, so it can be cleared
    expect(
      sectionOf(schemaOf("poster", { ...TEMP, show_name: false, name: "Hi" }), "Name"),
    ).toEqual(["show_name", "name"]);
  });
});

describe("what the editor shows", () => {
  const include = (cfg: Raw, change: HaFormData = {}) =>
    (field(schemaOf("poster", cfg, change), "entity")?.selector as { entity: Raw }).entity
      .include_entities as string[] | undefined;

  it("offers the entity as it is, one of your own, then every kind by its name", () => {
    const opts = options(schemaOf("poster", TEMP), "shows");
    expect(opts.slice(0, 2).map((o) => o.value)).toEqual(["none", "custom"]);
    expect(opts[0].label).toBe("Entity: its state as it is");
    const kinds = opts.slice(2);
    expect(kinds.map((o) => o.value).sort()).toEqual(
      Object.keys(KINDS)
        .filter((k) => k !== "none")
        .sort(),
    );
    const labels = kinds.map((o) => o.label);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)));
    expect(field(schemaOf("poster", TEMP), "shows")?.required).toBe(true);
  });

  it("is the kind written, else the entity's, else your own", () => {
    const shows = (cfg: Raw) => showsOf(cfg, hass);
    expect(shows({ entity: "sensor.wind_speed" })).toBe("wind");
    expect(shows(TEMP)).toBe("temperature");
    expect(shows({ entity: "sensor.pressure" })).toBe("none");
    expect(shows({ ...TEMP, kind: "trend" })).toBe("trend");
    expect(shows({})).toBe("custom");
    expect(shows({ kind: "sun" })).toBe("sun");
  });

  it("offers the entities that fit the kind", () => {
    // (with no entity written: the one written is always offered)
    // a battery: those detected as one, and a sensor without a device class (a template's)
    const battery = include({}, { kind: "battery" })!;
    expect(battery).toEqual(expect.arrayContaining(["sensor.battery_soc", "sensor.phone_battery"]));
    expect(battery).not.toContain("sensor.living_room_temperature");
    // the wind: its sensors and a weather entity, no temperature
    const wind = include({}, { kind: "wind" })!;
    expect(wind).toEqual(expect.arrayContaining(["sensor.wind_speed", "weather.home"]));
    expect(wind).not.toContain("sensor.living_room_temperature");
    // a person: a device tracker too
    expect(include({}, { kind: "person" })).toContain("device_tracker.van");
    // the entity as it is: every entity
    expect(include({ entity: "sensor.pressure" })).toBeUndefined();
    // a door: binary sensors of its classes only; a plug: a switch of its class, or of none
    const opening = include({}, { kind: "opening" })!;
    expect(opening).toEqual(
      expect.arrayContaining(["binary_sensor.door_front", "binary_sensor.window_kitchen"]),
    );
    expect(opening).not.toContain("binary_sensor.motion_hallway");
    const plug = include({}, { kind: "plug" })!;
    expect(plug).toEqual(expect.arrayContaining(["switch.coffee_machine", "switch.garden_pump"]));
    // a sensor without a device class only in the kind's unit (no wind direction), and no
    // setting in that unit (a humidity target)
    expect(battery).not.toContain("sensor.wind_direction");
    expect(battery).not.toContain("input_number.target_humidity");
    // a kind none of the home's entities fit: none offered, not every entity
    expect(include({}, { kind: "pm10" })).toEqual([]);
    // a trend: numbers, no text or time
    const trend = include({}, { kind: "trend" })!;
    expect(trend).toContain("sensor.outdoor_temperature");
    for (const id of ["sensor.washer_status", "sensor.dishwasher_finishes", "light.kitchen"])
      expect(trend, id).not.toContain(id);
    // a kind only ever named: what it measures (a car its battery, solar a power sensor)
    const car = include({}, { kind: "car" })!;
    expect(car).toEqual(expect.arrayContaining(["sensor.battery_soc", "sensor.phone_battery"]));
    expect(car).not.toContain("sensor.solar_power");
    expect(car).not.toContain("sensor.living_room_temperature");
    const solar = include({}, { kind: "solar" })!;
    expect(solar).toContain("sensor.solar_power");
    expect(solar).not.toContain("sensor.battery_soc");
    expect(include({}, { kind: "washer" })).toEqual(solar);
    // your own: no entity
    expect(names(schemaOf("poster", {}))).not.toContain("entity");
  });
});

describe("the editor's kind", () => {
  it("builds the form for the kind picked", () => {
    // a temperature read as a washer: its threshold, as a trend: its series
    expect(names(schemaOf("poster", TEMP, { kind: "washer" }))).toContain("running_above");
    expect(names(schemaOf("poster", TEMP))).not.toContain("running_above");
    expect(names(schemaOf("poster", TEMP, { kind: "trend" }))).toContain("series");
    expect(names(schemaOf("poster", TEMP))).not.toContain("series");
    expect(names(schemaOf("poster", TEMP, { kind: "car" }))).toEqual(
      expect.arrayContaining(["input_range", "input_plugged", "input_charging", "input_location"]),
    );
  });
});

describe("the editor's content", () => {
  it("shows an attribute picker for the entity, unit and decimals for a number", () => {
    const temp = schemaOf("tile", TEMP);
    expect(field(temp, "attribute")?.selector).toEqual({
      attribute: { entity_id: "sensor.living_room_temperature" },
    });
    expect(names(temp)).toEqual(expect.arrayContaining(["unit", "decimals"]));
    expect(names(schemaOf("tile", { name: "Hello" }))).not.toContain("attribute");
    expect(names(schemaOf("tile", { entity: "input_select.house_mode" }))).not.toContain("unit");
  });
});

describe("the editor's icon and visual", () => {
  it("names the kind's own thing as the default", () => {
    const light = schemaOf("poster", LIGHT);
    expect(options(light, "icon_thing")[0]).toEqual({ value: DEFAULT, label: "Icon" });
    expect(options(light, "visual_thing")[0]).toEqual({ value: DEFAULT, label: "Glow" });
    // what draws nothing there by default has no none: the default is none
    const fan = schemaOf("poster", { entity: "fan.living_room" });
    expect(options(fan, "visual_thing")[0]).toEqual({ value: DEFAULT, label: "None" });
    expect(values(fan, "visual_thing")).not.toContain("none");
    expect(values(light, "visual_thing")).toContain("none");
    expect(values(light, "icon_thing")).toEqual([DEFAULT, "image", "none"]);
  });

  it("never offers a drawing the kind does not make", () => {
    for (const kind of Object.values(KINDS))
      for (const thing of ["poster", "tile"] as const) {
        const schema = schemaOf(thing, { kind: kind.name, entity: "sensor.outdoor_temperature" });
        for (const name of ["icon_thing", "visual_thing"])
          for (const v of values(schema, name))
            if (KIND_THINGS.includes(v))
              expect(kind.draws ?? [], `${thing} ${kind.name} ${name}: ${v}`).toContain(v);
        // only its own inputs
        const inputs = names(schema).filter((n) => n.startsWith("input_"));
        expect(inputs, kind.name).toEqual((kind.inputs ?? []).map((d) => `input_${d.key}`));
      }
  });

  it("shows the options of the icon's thing", () => {
    const icon = names(schemaOf("poster", LIGHT));
    expect(icon).toEqual(expect.arrayContaining(["icon_ring", "icon_style"]));
    expect(icon).not.toContain("icon_src");
    expect(icon).not.toContain("icon_variant");
    expect(names(schemaOf("poster", LIGHT, { icon_thing: "image" }))).toContain("icon_src");
    // a flow: its drawings, no ring
    const wind = names(schemaOf("poster", { entity: "sensor.wind_speed" }));
    expect(wind).toContain("icon_variant");
    expect(wind).not.toContain("icon_ring");
    expect(values(schemaOf("poster", { entity: "sensor.rain_rate" }), "icon_variant")).toEqual([
      DEFAULT,
      "ripples",
      "fill",
    ]);
    // none: no options, and no actions of its own
    const none = names(schemaOf("poster", LIGHT, { icon_thing: "none" }));
    expect(none.filter((n) => n.startsWith("icon_") && n !== "icon_thing")).toEqual([]);
  });

  it("shows the options of the visual's thing", () => {
    const visual = (change: HaFormData) =>
      names(schemaOf("poster", LIGHT, change)).filter(
        (n) => n.startsWith("visual_") && n !== "visual_thing",
      );
    expect(visual({})).toEqual([]);
    expect(visual({ visual_thing: "bar" })).toEqual([]);
    expect(visual({ visual_thing: "sparkline" })).toEqual([
      "visual_hours",
      "visual_today",
      "visual_bucket",
      "visual_smoothing",
      "visual_axis",
      "visual_src",
    ]);
    // today takes the place of the hours
    expect(visual({ visual_thing: "columns", visual_today: true })).toEqual([
      "visual_today",
      "visual_bucket",
      "visual_axis",
      "visual_src",
    ]);
    expect(visual({ visual_thing: "strip" })).not.toContain("visual_axis");
    expect(visual({ visual_thing: "image" })).toEqual([
      "visual_src",
      "visual_opacity",
      "visual_tint",
      "visual_blur",
    ]);
    // a plot reads another entity's history, a picture a URL
    const light = schemaOf("poster", LIGHT, { visual_thing: "sparkline" });
    expect(field(light, "visual_src")?.selector).toEqual({ entity: {} });
    expect(
      field(schemaOf("poster", LIGHT, { visual_thing: "image" }), "visual_src")?.selector,
    ).toEqual({ text: {} });
    // the sun's hours, without today
    expect(names(schemaOf("poster", { entity: "sun.sun" }))).toContain("visual_hours");
    expect(names(schemaOf("poster", { entity: "sun.sun" }))).not.toContain("visual_today");
  });

  it("offers a cover's drawings, the device class's by default", () => {
    const cover = schemaOf("poster", { entity: "cover.garage_door" });
    expect(options(cover, "visual_variant")[0].label).toBe("By its device class");
    expect(values(cover, "visual_variant")).toEqual(
      expect.arrayContaining(["shutter", "garage", "gate", "window"]),
    );
    // a wind's flow behind the card
    const wind = schemaOf("poster", { entity: "sensor.wind_speed" }, { visual_thing: "flow" });
    expect(options(wind, "visual_variant")[0].label).toBe("Dots");
  });
});

describe("the wind's and the rain's icon with the animation behind", () => {
  it("names the still drawing, and offers an icon of its own", () => {
    const wind = { entity: "sensor.wind_speed" };
    const labels = (cfg: Raw) => options(schemaOf("poster", cfg), "icon_thing").map((o) => o.label);
    expect(labels(wind)).toEqual(["Animation", "Icon", "Picture", "None"]);
    const behind = { ...wind, visual: { type: "flow" } };
    expect(labels(behind)).toEqual(["Wind direction arrow", "Icon", "Picture", "None"]);
    // the arrow has no variants
    expect(names(schemaOf("poster", behind))).not.toContain("icon_variant");
    expect(names(schemaOf("poster", wind))).toContain("icon_variant");
    expect(labels({ entity: "sensor.rain_rate", visual: { type: "flow" } })[0]).toBe("Rain icon");
  });
});

describe("the editor's other entities", () => {
  it("are the kind's inputs, none for a weather entity", () => {
    expect(names(schemaOf("poster", { entity: "sensor.rain_rate" }))).toEqual(
      expect.arrayContaining(["input_today", "input_wind", "input_direction"]),
    );
    expect(
      names(schemaOf("poster", { entity: "weather.home", kind: "wind" })).filter((n) =>
        n.startsWith("input_"),
      ),
    ).toEqual([]);
    expect(names(schemaOf("poster", LIGHT)).some((n) => n.startsWith("input_"))).toBe(false);
  });
});

describe("the editor's controls", () => {
  const SWITCH = { entity: "switch.garden_pump" };

  it("names the kind's own as the default, a tile's at its line's end only", () => {
    expect(options(schemaOf("poster", LIGHT), "control_type")[0].label).toBe("Switch + Slider");
    expect(options(schemaOf("tile", LIGHT), "control_type")[0].label).toBe("Switch");
    expect(values(schemaOf("poster", LIGHT), "control_type")).toEqual([
      DEFAULT,
      "none",
      "toggle",
      "slider",
      "hold",
      "buttons",
    ]);
  });

  it("offers the entity's own where the kind has none", () => {
    const sw = schemaOf("tile", SWITCH);
    expect(values(sw, "control_type")).toEqual([DEFAULT, "auto", "toggle", "hold", "buttons"]);
    expect(options(sw, "control_type")[0].label).toBe("None");
    expect(options(sw, "control_type")[1].label).toBe("The entity's own: Switch");
    // a thermostat's own stepper is the default, not listed again
    const climate = schemaOf("poster", { entity: "climate.living_room" });
    expect(options(climate, "control_type")[0].label).toBe("Stepper");
    expect(values(climate, "control_type")).toEqual(expect.arrayContaining(["segments", "select"]));
    expect(values(climate, "control_type")).not.toContain("stepper");
  });

  it("shows the options of the controls drawn", () => {
    const ctl = (cfg: Raw, change: HaFormData) =>
      names(schemaOf("poster", cfg, change)).filter(
        (n) => n.startsWith("control_") && n !== "control_type",
      );
    // nothing drawn: no options
    expect(ctl(SWITCH, {})).toEqual([]);
    expect(ctl(LIGHT, { control_type: "none" })).toEqual([]);
    // the light's toggle and slider
    expect(ctl(LIGHT, {})).toEqual([
      "control_position",
      "control_step",
      "control_variant",
      "control_confirm",
    ]);
    expect(ctl(LIGHT, { control_type: "hold" })).toEqual(["control_position"]);
    expect(ctl(SWITCH, { control_type: "auto" })).toEqual([
      "control_position",
      "control_variant",
      "control_confirm",
    ]);
    // a thermostat's modes
    expect(ctl({ entity: "climate.living_room" }, { control_type: "segments" })).toEqual([
      "control_position",
      "control_attribute",
      "control_options",
      "control_variant",
    ]);
    expect(
      values(
        schemaOf("poster", { entity: "climate.living_room" }, { control_type: "select" }),
        "control_attribute",
      ),
    ).toEqual([DEFAULT, "preset_mode", "fan_mode"]);
    // the default named as what it sets: a thermostat's mode, a fan's speed
    const attrLabels = (entity: string) =>
      options(schemaOf("poster", { entity }, { control_type: "select" }), "control_attribute").map(
        (o) => o.label,
      );
    expect(attrLabels("climate.living_room")).toEqual(["Mode", "Preset", "Fan mode"]);
    expect(attrLabels("fan.living_room")).toEqual(["Speed", "Preset"]);
    // a select of its own options has no attribute to pick
    expect(ctl({ entity: "input_select.house_mode" }, { control_type: "select" })).toEqual([
      "control_position",
      "control_options",
    ]);
    expect(ctl(LIGHT, { control_type: "buttons" })).toEqual([
      "control_position",
      "control_buttons",
      "control_variant",
      "control_confirm",
    ]);
    // a switch held to confirm is a hold, which has nothing to fill or tint either
    expect(ctl(SWITCH, { control_type: "auto", control_confirm: true })).not.toContain(
      "control_variant",
    );
    // a stepper and a select have nothing on or chosen to fill or tint
    expect(ctl({ entity: "climate.living_room" }, { control_type: "stepper" })).not.toContain(
      "control_variant",
    );
  });

  it("names where the control sits by default", () => {
    const pos = (thing: CardThing, cfg: Raw, change: HaFormData = {}) =>
      options(schemaOf(thing, cfg, change), "control_position")[0].label;
    // the kind's own: where its first sits
    expect(pos("poster", LIGHT)).toBe("Beside the value");
    // one named: a slider below, anything else at the end
    expect(pos("poster", LIGHT, { control_type: "slider" })).toBe("Below the value");
    expect(pos("poster", LIGHT, { control_type: "hold" })).toBe("Beside the value");
    expect(pos("tile", SWITCH, { control_type: "auto" })).toBe("At the end of the line");
    expect(values(schemaOf("tile", SWITCH, { control_type: "auto" }), "control_position")).toEqual([
      DEFAULT,
      "block",
    ]);
  });
});

describe("the editor's status and badges", () => {
  it("hides the status's text while it is hidden", () => {
    expect(names(schemaOf("poster", LIGHT))).toContain("status");
    expect(names(schemaOf("poster", LIGHT, { hide_status: true }))).not.toContain("status");
  });

  it("gives a tile its status badge and the badge on its icon", () => {
    const tile = names(schemaOf("tile", LIGHT));
    expect(tile).toEqual(expect.arrayContaining(["status_badge", "icon_badge"]));
    expect(tile).not.toContain("icon_badge_icon");
    expect(names(schemaOf("tile", LIGHT, { icon_badge: "custom" }))).toEqual(
      expect.arrayContaining(["icon_badge_icon", "icon_badge_color"]),
    );
    const poster = names(schemaOf("poster", LIGHT));
    expect(poster).not.toContain("status_badge");
    expect(poster).not.toContain("icon_badge");
  });

  it("lists the badges in a list of its own, each badge's form by what it shows", () => {
    expect(field(schemaOf("poster", LIGHT), "badges")?.selector).toEqual({
      pro_cards_badges: { entity: LIGHT.entity, hide_label: true },
    });
    const names = (item: Raw) =>
      flat(badgeItemSchema(hass, badgeToForm(item), "")).map((s) => s.name);
    // a number: its unit and decimals, a format, after it a visual and a ring; no switch
    const battery = names({ entity: "sensor.battery_soc" });
    for (const k of ["format", "unit", "decimals", "visual", "icon_ring", "tap_action", "rules"])
      expect(battery, k).toContain(k);
    expect(battery).not.toContain("control");
    // a bar or a ring: its range
    expect(names({ entity: "sensor.battery_soc", visual: "bar" })).toContain("min");
    expect(battery).not.toContain("min");
    // a light: its switch, no unit or visual
    const light = names({ entity: "light.kitchen" });
    expect(light).toContain("control");
    for (const k of ["unit", "visual", "format"]) expect(light, k).not.toContain(k);
    // one of your own: a text, no entity
    const own = flat(
      badgeItemSchema(hass, { ...badgeToForm({ value: "Open" }), shows: "custom" }, ""),
    );
    expect(own.map((s) => s.name)).not.toContain("entity");
    expect(own.map((s) => s.name)).toContain("value");
    // what it shows: the entity as it is, your own, the kinds whose colours a badge takes
    const shows = flat(badgeItemSchema(hass, badgeToForm({ entity: "light.kitchen" }), "")).find(
      (s) => s.name === "shows",
    )?.selector as { select: { options: { value: string }[] } };
    const values = shows.select.options.map((o) => o.value);
    expect(values.slice(0, 2)).toEqual(["none", "custom"]);
    expect(values).toEqual(expect.arrayContaining(["battery", "wind", "light"]));
    expect(values).not.toContain("washer");
    // its entity picker follows a kind chosen for it, not the one it is detected as
    const picker = (item: Raw) =>
      (
        flat(badgeItemSchema(hass, item, "light.kitchen")).find((s) => s.name === "entity")
          ?.selector as { entity: Raw }
      ).entity.include_entities;
    expect(picker({ ...badgeToForm({}), shows: "light" })).toBeUndefined();
    expect(picker({ ...badgeToForm({}), shows: "battery", chosen: true })).toContain(
      "sensor.battery_soc",
    );
    // its name only while it shows (a badge hides it unless told)
    const named = (item: Raw) =>
      flat(badgeItemSchema(hass, badgeToForm(item), "")).map((s) => s.name);
    expect(named({ entity: "sensor.battery_soc" })).not.toContain("name");
    expect(named({ entity: "sensor.battery_soc", show_name: true })).toContain("name");
    // the value hidden: nothing about how it is written
    const hidden = names({ entity: "sensor.battery_soc", show_value: false });
    for (const k of ["format", "unit", "prefix"]) expect(hidden, k).not.toContain(k);
  });
});

describe("the editor's rules", () => {
  it("pick the kind's or the card's own, where the kind has some", () => {
    const wind = schemaOf("poster", { entity: "sensor.wind_speed" });
    expect(sectionOf(wind, "Rules")).toEqual(["rules_from", "rules"]);
    expect(options(wind, "rules_from").map((o) => o.label)).toEqual([
      "Predefined (Wind)",
      "Your own",
    ]);
    // a light has none: the list alone
    expect(sectionOf(schemaOf("poster", LIGHT), "Rules")).toEqual(["rules"]);
  });

  it("list the rules in a list of its own, each rule's form in the value's unit or the entity's states", () => {
    expect(field(schemaOf("poster", TEMP), "rules")?.selector).toEqual({
      pro_cards_rules: {
        entity: TEMP.entity,
        unit: hass.states["sensor.living_room_temperature"].attributes.unit_of_measurement,
        hide_label: true,
      },
    });
    const ctx = { entity: "sensor.living_room_temperature", unit: "°C", numeric: true };
    const temp = flat(ruleItemSchema(hass, {}, ctx));
    expect(temp.find((s) => s.name === "above")?.selector).toEqual({
      number: { mode: "box", unit_of_measurement: "°C" },
    });
    expect(temp.map((s) => s.name)).not.toContain("state");
    // a state of the entity where its value is no number; a badge's rule writes a value
    const light = flat(
      ruleItemSchema(hass, {}, { entity: "light.kitchen", unit: "", numeric: false, badge: true }),
    );
    expect(light.find((s) => s.name === "state")?.selector).toEqual({
      state: { entity_id: "light.kitchen" },
    });
    expect(light.map((s) => s.name)).toContain("value");
    expect(light.map((s) => s.name)).not.toContain("status");
  });
});

describe("the editor's interactions", () => {
  const defaults = (thing: CardThing, cfg: Raw) =>
    Object.fromEntries(
      flat(schemaOf(thing, cfg))
        .filter((s) => s.name.endsWith("_action"))
        .map((s) => [
          s.name,
          (s.selector as { ui_action: { default_action: string } }).ui_action.default_action,
        ]),
    );

  it("name what a tap does unless told", () => {
    expect(defaults("poster", LIGHT)).toEqual({
      tap_action: "more-info",
      hold_action: "more-info",
      double_tap_action: "none",
      // an icon without actions of its own passes the gesture to the card
      icon_tap_action: "more-info",
      icon_hold_action: "more-info",
      icon_double_tap_action: "none",
    });
    const nav = { action: "navigate", navigation_path: "/lights" };
    expect(defaults("poster", { ...LIGHT, tap_action: nav }).icon_tap_action).toBe("navigate");
    // a tile's icon toggles what it can
    expect(defaults("tile", LIGHT).icon_tap_action).toBe("toggle");
    expect(defaults("tile", TEMP).icon_tap_action).toBe("more-info");
    // nothing to show without an entity
    expect(defaults("poster", { name: "Hello" }).tap_action).toBe("none");
  });
});

describe("the editor's placeholders", () => {
  const shown = (cfg: Raw, change: HaFormData = {}) => {
    const schema = schemaOf("poster", cfg, change);
    return Object.fromEntries(
      ["name", "value", "unit", "decimals"].map((n) => [n, field(schema, n)?.default]),
    );
  };

  it("show what the entity gives where the card writes nothing", () => {
    const st = hass.states["sensor.living_room_temperature"];
    expect(shown(TEMP)).toMatchObject({
      name: st.attributes.friendly_name,
      value: st.state,
      unit: st.attributes.unit_of_measurement,
    });
    // a word, as Home Assistant formats it
    expect(shown({ entity: "switch.coffee_machine" }).value).toBe(
      hass.formatEntityState(hass.states["switch.coffee_machine"]),
    );
    // a thermostat's temperature, not its mode
    const climate = hass.states["climate.living_room"];
    expect(shown({ entity: "climate.living_room" }).value).toBe(
      String(climate.attributes.current_temperature),
    );
    // the attribute written
    expect(shown(LIGHT, { attribute: "brightness" }).value).toBe(
      String(hass.states["light.living_room"].attributes.brightness),
    );
    // nothing without an entity
    expect(shown({ name: "Hello" })).toEqual({
      name: undefined,
      value: undefined,
      unit: undefined,
      decimals: undefined,
    });
  });

  it("name what the card shows where no attribute is picked", () => {
    const attr = (cfg: Raw, change: HaFormData = {}) =>
      field(schemaOf("poster", cfg, change), "attribute")?.default;
    expect(attr(TEMP)).toBe("State");
    // a thermostat's temperature, also while another attribute is picked
    expect(attr({ entity: "climate.living_room" })).toBe("Current temperature");
    expect(attr({ entity: "climate.living_room" }, { attribute: "humidity" })).toBe(
      "Current temperature",
    );
  });

  it("show the entity's icon in the icon picker", () => {
    expect(field(schemaOf("poster", LIGHT), "icon")?.context).toEqual({ icon_entity: "entity" });
  });
});

describe("the editor's selects", () => {
  it("never list one choice twice, for any entity of the demo home", () => {
    const CHANGES: HaFormData[] = [
      {},
      { control_type: "slider" },
      { control_type: "buttons" },
      { control_type: "toggle" },
      { control_type: "segments" },
      { control_type: "auto" },
      { visual_thing: "flow" },
      { visual_thing: "cover" },
      { icon_thing: "flow" },
    ];
    const twice: string[] = [];
    for (const thing of ["poster", "tile"] as const)
      for (const entity of Object.keys(hass.states))
        for (const change of CHANGES)
          for (const f of flat(schemaOf(thing, { entity }, change))) {
            const labels = (
              f.selector as { select?: { options: { label: string }[] } } | undefined
            )?.select?.options.map((o) => o.label);
            const again = labels?.filter((l, i) => labels.indexOf(l) !== i) ?? [];
            if (again.length)
              twice.push(`${thing} ${entity} ${JSON.stringify(change)}: ${f.name} ${again}`);
          }
    expect(twice).toEqual([]);
  }, 30_000);
});

describe("the editor of a row in a tile group's table", () => {
  const ROW = { entity: "sensor.washer_power" };
  it("has no icon, no secondary and no badges, its status a section of its own", () => {
    const row = schemaOf("row", ROW);
    expect(sections(row)).not.toContain("Status and badges");
    expect(sections(row)).not.toContain("Layout");
    const ns = names(row);
    for (const n of [
      "icon",
      "icon_thing",
      "secondary",
      "badges",
      "status_badge",
      "icon_tap_action",
    ])
      expect(ns, n).not.toContain(n);
    expect(sectionOf(row, "Status")).toEqual(expect.arrayContaining(["status", "hide_status"]));
  });

  it("offers a badge's visuals after the value, none by default", () => {
    const row = schemaOf("row", ROW);
    expect(values(row, "visual_thing")).toEqual([DEFAULT, "bar", "sparkline", "trend"]);
    expect(options(row, "visual_thing")[0].label).toBe("None");
    expect(names(schemaOf("row", ROW, { visual_thing: "trend" }))).toContain("visual_hours");
    expect(names(schemaOf("row", ROW, { visual_thing: "bar" }))).not.toContain("visual_hours");
  });

  it("draws the domain's control by default, at the end, and none beside a visual", () => {
    const flag = { entity: "input_boolean.night_mode" };
    expect(options(schemaOf("row", flag), "control_type")[0].label).toBe("Switch");
    expect(names(schemaOf("row", flag))).not.toContain("control_position");
    expect(sections(schemaOf("row", flag, { visual_thing: "bar" }))).not.toContain("Controls");
  });
});

describe("the editor's headings and placeholders", () => {
  // a section's entries in their order, its headings among them
  const entries = (schema: HaFormSchema[], title: string) =>
    flat(schema.find((s) => s.title === title)?.schema ?? []).flatMap((s) =>
      s.name ? [s.name] : [],
    );
  it("head the groups of a big section: the icon and the visual, how a value is written", () => {
    const look = entries(schemaOf("poster", LIGHT), "Appearance");
    expect(look.indexOf("icon_heading")).toBeLessThan(look.indexOf("icon_thing"));
    expect(look.indexOf("visual_heading")).toBeLessThan(look.indexOf("visual_thing"));
    expect(look.indexOf("icon_heading")).toBeGreaterThan(look.indexOf("color"));
    const value = entries(schemaOf("poster", TEMP), "Value");
    expect(value.indexOf("format_heading")).toBeLessThan(value.indexOf("unit"));
    const actions = entries(schemaOf("poster", LIGHT), "Interactions");
    expect(actions.indexOf("icon_actions_heading")).toBeLessThan(
      actions.indexOf("icon_tap_action"),
    );
    // a heading says its group's name
    const heading = flat(schemaOf("poster", LIGHT)).find((s) => s.name === "visual_heading");
    expect(heading?.selector).toEqual({ pro_cards_heading: { text: "Visual" } });
  });
  it("say what the kind draws in a field's place, and show the kind's own icon", () => {
    const sun = schemaOf("poster", { entity: "sun.sun" });
    expect(field(sun, "name")?.default).toBe("Shown by the kind (Sun)");
    const washer = schemaOf("poster", { entity: "sensor.washer_power", kind: "washer" });
    expect(field(washer, "icon")?.selector).toEqual({
      icon: { placeholder: "mdi:washing-machine" },
    });
    // the entity's own where the kind draws nothing in its place
    expect(field(schemaOf("poster", TEMP), "name")?.default).toBe("Living room temperature");
  });
});
