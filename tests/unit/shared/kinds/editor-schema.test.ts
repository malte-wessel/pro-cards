// The poster's and the tile's editor form, as shown: which sections and fields a card gets for its
// entity, its kind and the things it draws, and what their selects offer.
import { describe, it, expect } from "vitest";
import { snapshot } from "../../../../docs/.vitepress/theme/ha-shim/hass.ts";
import { configToForm, DEFAULT, type CardThing } from "../../../../src/shared/kinds/editor-form.ts";
import { editorSchema } from "../../../../src/shared/kinds/editor-schema.ts";
import { kindsOf } from "../../../../src/shared/kinds/editor.ts";
import { KIND_THINGS } from "../../../../src/shared/kinds/places.ts";
import { canRead } from "../../../../src/shared/kinds/detect.ts";
import { KINDS } from "../../../../src/shared/kinds/registry.ts";
import type { CardConfigBase, HaFormData, HaFormSchema } from "../../../../src/shared/ha.ts";
import { isNum } from "../../../../src/shared/util.ts";

const hass = snapshot();
type Raw = Record<string, unknown>;

// the schema of a card, with the form's data changed as a user would
const schemaOf = (thing: CardThing, cfg: Raw, change: HaFormData = {}) => {
  const base = configToForm(cfg as CardConfigBase, kindsOf(cfg, hass).kind, thing);
  const data = { ...base, ...change };
  const { kind, detected } = kindsOf(data, hass);
  const st = hass.states[String(data.entity ?? "")];
  return editorSchema({ hass, thing, kind, detected, data, numeric: isNum(st?.state), st });
};
const flat = (schema: HaFormSchema[]): HaFormSchema[] =>
  schema.flatMap((s) => [s, ...(s.schema ? flat(s.schema) : [])]);
const names = (schema: HaFormSchema[]) => flat(schema).flatMap((s) => (s.name ? [s.name] : []));
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
  it("are the card's own, with inputs and controls only where they apply", () => {
    expect(sections(schemaOf("poster", LIGHT))).toEqual([
      "Content",
      "Icon and visual",
      "Controls",
      "Status and badges",
      "Rules",
      "Interactions",
    ]);
    // a tile's badges sit beside its texts, and it has a layout
    const tile = sections(schemaOf("tile", { entity: "sensor.wind_speed" }));
    expect(tile).toContain("Other entities");
    expect(tile).toContain("Layout");
    expect(tile).not.toContain("Controls");
    expect(tile.filter((t) => !["Other entities", "Layout"].includes(t ?? ""))).toHaveLength(5);
    // a sensor has no controls unless the form names one
    expect(sections(schemaOf("poster", TEMP))).not.toContain("Controls");
    expect(sections(schemaOf("poster", TEMP, { control_type: "buttons" }))).toContain("Controls");
  });

  it("start with the entity, the kind, the name, the icon and the colour", () => {
    const schema = schemaOf("poster", LIGHT);
    expect(names(schema.filter((s) => s.type !== "expandable"))).toEqual([
      "entity",
      "kind",
      "name",
      "icon",
      "color",
    ]);
    // an icon of its own only where the place draws an icon or a picture
    expect(names(schemaOf("poster", LIGHT, { icon_thing: "none" }))).not.toContain("icon");
    expect(names(schemaOf("poster", { entity: "sensor.wind_speed" }))).not.toContain("icon");
    expect(names(schemaOf("poster", LIGHT, { icon_thing: "image" }))).toContain("icon");
  });
});

describe("the editor's kind", () => {
  it("names the detected kind first, then every kind that reads the entity by its name", () => {
    const opts = options(schemaOf("poster", { entity: "sensor.wind_speed" }), "kind");
    expect(opts[0]).toEqual({ value: "detected", label: "Wind (detected)" });
    const values = opts.slice(1).map((o) => o.value);
    // the detected kind once, as detected
    expect(values.sort()).toEqual(
      Object.keys(KINDS)
        .filter((k) => k !== "wind" && canRead(KINDS[k], "sensor.wind_speed"))
        .sort(),
    );
    expect(values).toContain("trend");
    // a light is no weather and no trend: none, or a light as written
    const light = options(schemaOf("poster", { entity: "light.living_room" }), "kind");
    expect(light.map((o) => o.label)).toEqual(["Light (detected)", "None (the entity as it is)"]);
    // written, the detected kind is listed as written too
    expect(
      options(schemaOf("poster", { entity: "light.living_room" }, { kind: "light" }), "kind").map(
        (o) => o.value,
      ),
    ).toContain("light");
    // a kind written for it shows all the same
    const written = options(
      schemaOf("poster", { entity: "light.living_room" }, { kind: "weather" }),
      "kind",
    );
    expect(written.map((o) => o.value)).toContain("weather");
    const labels = opts.slice(1).map((o) => o.label);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)));
  });

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
  const SWITCH = { entity: "switch.coffee_machine" };

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
    expect(ctl(LIGHT, {})).toEqual(["control_position", "control_step", "control_confirm"]);
    expect(ctl(LIGHT, { control_type: "hold" })).toEqual(["control_position"]);
    expect(ctl(SWITCH, { control_type: "auto" })).toEqual(["control_position", "control_confirm"]);
    // a thermostat's modes
    expect(ctl({ entity: "climate.living_room" }, { control_type: "segments" })).toEqual([
      "control_position",
      "control_attribute",
      "control_options",
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
      "control_confirm",
    ]);
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

  it("edits the badges in a dialog with their other keys as YAML", () => {
    const badges = field(schemaOf("poster", LIGHT), "badges")?.selector as {
      object: { multiple: boolean; fields: Record<string, { label: string }> };
    };
    expect(badges.object.multiple).toBe(true);
    expect(Object.keys(badges.object.fields)).toEqual([
      "entity",
      "name",
      "icon",
      "color",
      "visual",
      "style",
      "size",
      "show_name",
      "more",
    ]);
    expect(badges.object.fields.more.label).toBe("More (YAML)");
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

  it("compare in the value's unit, and pick a state of the entity", () => {
    const fields = (cfg: Raw) =>
      (
        field(schemaOf("poster", cfg), "rules")?.selector as {
          object: { fields: Record<string, { selector: Record<string, Record<string, unknown>> }> };
        }
      ).object.fields;
    const temp = fields(TEMP);
    expect(temp.above.selector.number.unit_of_measurement).toBe(
      hass.states["sensor.living_room_temperature"].attributes.unit_of_measurement,
    );
    expect(temp.state.selector).toEqual({ state: { entity_id: "sensor.living_room_temperature" } });
    // nothing to pick without an entity
    expect(fields({ name: "Hello" }).state.selector).toEqual({ text: {} });
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
