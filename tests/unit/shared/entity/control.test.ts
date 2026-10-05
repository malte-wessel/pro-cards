import { describe, it, expect } from "vitest";
import {
  normalizeEntity,
  type NormalizeCtx,
  type RawEntity,
} from "../../../../src/shared/entity/config.ts";
import type { HassEntity, HomeAssistant } from "../../../../src/shared/ha.ts";
import {
  buttonsOf,
  canControl,
  MAX_SPEED_SEGMENTS,
  speedsAsSlider,
  clampStep,
  controlShowsValue,
  currentOptionOf,
  defaultPlacements,
  hasBlockControl,
  HVAC_ICON,
  isOn,
  optionsOf,
  placementsOf,
  rangeOf,
  serviceFor,
  sliderApplies,
} from "../../../../src/shared/entity/control.ts";

const ctx: NormalizeCtx = {
  type: "t",
  tap: { action: "more-info" },
  hold: { action: "more-info" },
  dbl: { action: "none" },
};
const ent = (o: RawEntity) =>
  normalizeEntity({ entity: "light.x", control: "auto", ...o }, ctx, "e");
const st = (state: string | number, attributes: Record<string, unknown> = {}, id = "light.x") =>
  ({ entity_id: id, state: String(state), attributes }) as unknown as HassEntity;
const kinds = (list: { kind: string; position: string }[]) =>
  list.map((p) => `${p.kind}@${p.position}`);

describe("control config", () => {
  it("accepts a name, true for auto and none / false for nothing; toggle: true is the alias", () => {
    expect(ent({ control: true }).control?.kind).toBe("auto");
    expect(ent({ control: "slider" }).control?.kind).toBe("slider");
    expect(ent({ control: "none" }).control).toBeNull();
    expect(ent({ control: false }).control).toBeNull();
    expect(ent({ control: undefined, toggle: true }).control?.kind).toBe("toggle");
    expect(ent({ control: undefined }).control).toBeNull();
  });
  it("rejects unknown names and positions", () => {
    expect(() => ent({ control: "knob" })).toThrow(/control must be one of/);
    expect(() => ent({ control_position: "top" })).toThrow(/control_position must be one of/);
  });
  it("keeps a positive step, drops the rest", () => {
    expect(ent({ control_step: 2.5 }).control?.step).toBe(2.5);
    expect(ent({ control_step: 0 }).control?.step).toBeNull();
    expect(ent({ control_step: "x" }).control?.step).toBeNull();
  });
  it("normalises options to value / label / icon and drops junk", () => {
    const c = ent({
      control_options: [
        "a",
        2,
        null,
        { value: "b", label: "Bee", icon: "mdi:b" },
        { label: "no value" },
      ],
    }).control;
    expect(c?.options).toEqual([
      { value: "a", label: null, icon: null },
      { value: "2", label: null, icon: null },
      { value: "b", label: "Bee", icon: "mdi:b" },
    ]);
    expect(ent({ control_options: [] }).control?.options).toBeNull();
    expect(ent({ control_confirm: true }).control?.confirm).toBe(true);
  });
  it("targets the mode of control_attribute, else the displayed mode attribute", () => {
    expect(ent({ control_attribute: "preset_mode" }).control?.attribute).toBe("preset_mode");
    expect(ent({ attribute: "fan_mode" }).control?.attribute).toBe("fan_mode");
    expect(
      ent({ attribute: "temperature", control_attribute: "hvac_mode" }).control?.attribute,
    ).toBe("hvac_mode");
    expect(ent({ attribute: "current_temperature" }).control?.attribute).toBeNull();
    expect(() => ent({ control_attribute: "swing" })).toThrow(/control_attribute must be one of/);
  });
});

describe("placements", () => {
  it("picks the domain default for auto", () => {
    const d = (entity: string, o: RawEntity = {}) =>
      kinds(defaultPlacements(ent({ entity, ...o })));
    expect(d("light.a")).toEqual(["toggle@end", "slider@block"]);
    expect(d("switch.a")).toEqual(["toggle@end"]);
    expect(d("input_boolean.a")).toEqual(["toggle@end"]);
    expect(d("fan.a")).toEqual(["toggle@end", "segments@end"]);
    expect(d("fan.a", { attribute: "preset_mode" })).toEqual(["segments@end"]);
    expect(d("cover.a")).toEqual(["buttons@end", "slider@block"]);
    expect(d("climate.a")).toEqual(["stepper@end"]);
    expect(d("climate.a", { attribute: "hvac_mode" })).toEqual(["segments@end"]);
    expect(d("climate.a", { attribute: "fan_mode" })).toEqual(["segments@end"]);
    expect(d("lock.a")).toEqual(["hold@end"]);
    expect(d("script.a")).toEqual(["button@end"]);
    expect(d("scene.a")).toEqual(["button@end"]);
    expect(d("input_button.a")).toEqual(["button@end"]);
    expect(d("input_select.a")).toEqual(["select@end"]);
    expect(d("number.a")).toEqual(["slider@block"]);
    expect(d("media_player.a")).toEqual(["buttons@end", "slider@block"]);
    expect(d("sensor.a")).toEqual([]);
  });
  it("draws nothing without a control or in a header value", () => {
    expect(placementsOf(ent({ control: undefined }), "tile")).toEqual([]);
    expect(placementsOf(ent({}), "hval")).toEqual([]);
  });
  it("puts a named control at its default slot per row kind", () => {
    const e = ent({ control: "slider" });
    expect(kinds(placementsOf(e, "tile"))).toEqual(["slider@block"]);
    expect(kinds(placementsOf(e, "list"))).toEqual(["slider@block"]);
    expect(kinds(placementsOf(e, "field"))).toEqual(["slider@end"]);
    expect(kinds(placementsOf(ent({ control: "stepper" }), "tile"))).toEqual(["stepper@end"]);
  });
  it("moves slots the row cannot hold and marks the small rows", () => {
    expect(placementsOf(ent({ control: "slider", control_position: "block" }), "field")).toEqual([
      { kind: "slider", position: "end", small: true },
    ]);
    // only toggle, button and hold can stand in for the lead
    expect(
      kinds(placementsOf(ent({ control: "slider", control_position: "lead" }), "tile")),
    ).toEqual(["slider@end"]);
    expect(
      kinds(placementsOf(ent({ control: "toggle", control_position: "lead" }), "tile")),
    ).toEqual(["toggle@lead"]);
    expect(placementsOf(ent({}), "cell")[0].small).toBe(true);
    expect(placementsOf(ent({}), "item-column")[0].small).toBe(true);
    expect(placementsOf(ent({}), "tile")[0].small).toBe(false);
  });
  it("keeps only lead kinds in a row item, always on the lead", () => {
    expect(kinds(placementsOf(ent({}), "item-row"))).toEqual(["toggle@lead"]);
    expect(kinds(placementsOf(ent({ entity: "cover.a" }), "item-row"))).toEqual([]);
    expect(kinds(placementsOf(ent({ entity: "lock.a" }), "item-row"))).toEqual(["hold@lead"]);
    expect(kinds(placementsOf(ent({ control: "slider" }), "item-row"))).toEqual([]);
  });
  it("confirm turns the primary into hold to confirm and leaves the slider", () => {
    expect(kinds(placementsOf(ent({ control_confirm: true }), "tile"))).toEqual([
      "hold@end",
      "slider@block",
    ]);
    // every button of a group holds on its own: stop stays available
    const cover = placementsOf(ent({ entity: "cover.a", control_confirm: true }), "tile");
    expect(kinds(cover)).toEqual(["buttons@end", "slider@block"]);
    expect(cover[0].confirm).toBe(true);
    expect(cover[1].confirm).toBeUndefined();
    expect(kinds(placementsOf(ent({ entity: "sensor.a", control_confirm: true }), "tile"))).toEqual(
      ["hold@end"],
    );
  });
  it("knows when a control on the line already shows the value", () => {
    const stepper = { kind: "stepper", position: "end", small: false } as const;
    expect(controlShowsValue(ent({ entity: "climate.a", attribute: "temperature" }), stepper)).toBe(
      true,
    );
    expect(
      controlShowsValue(ent({ entity: "climate.a", attribute: "current_temperature" }), stepper),
    ).toBe(false);
    expect(controlShowsValue(ent({ entity: "climate.a" }), stepper)).toBe(false);
    expect(controlShowsValue(ent({ entity: "number.a" }), stepper)).toBe(true);
    expect(controlShowsValue(ent({ entity: "number.a", attribute: "max" }), stepper)).toBe(false);
    expect(controlShowsValue(ent({}), { kind: "segments", position: "end", small: false })).toBe(
      true,
    );
    expect(controlShowsValue(ent({}), { kind: "toggle", position: "end", small: false })).toBe(
      false,
    );
  });
  it("knows when a tile grows by a block control", () => {
    expect(hasBlockControl(ent({}))).toBe(true);
    expect(hasBlockControl(ent({ entity: "switch.a" }))).toBe(false);
    expect(hasBlockControl(ent({ control: "slider", control_position: "end" }))).toBe(false);
  });
});

describe("ranges", () => {
  it("reads brightness, position, volume and fan speed as percentages", () => {
    expect(rangeOf(ent({}), st("on", { brightness: 180 }))).toMatchObject({
      min: 0,
      max: 100,
      step: 1,
      value: 71,
      unit: "%",
    });
    expect(rangeOf(ent({}), st("off")).value).toBe(0);
    expect(rangeOf(ent({}), st("on")).value).toBeNull();
    const cover = ent({ entity: "cover.a" });
    expect(rangeOf(cover, st("open", { current_position: 40 }, "cover.a")).value).toBe(40);
    expect(rangeOf(cover, st("open", {}, "cover.a")).value).toBeNull();
    const mp = ent({ entity: "media_player.a" });
    expect(rangeOf(mp, st("playing", { volume_level: 0.35 }, "media_player.a")).value).toBe(35);
    const fan = ent({ entity: "fan.a" });
    expect(
      rangeOf(fan, st("on", { percentage: 66, percentage_step: 33.333 }, "fan.a")),
    ).toMatchObject({ value: 66, step: 33.333 });
    expect(rangeOf(fan, st("off", { percentage: 50 }, "fan.a")).value).toBe(0);
  });
  it("reads the thermostat's bounds, step, target and unit, with defaults", () => {
    const c = ent({ entity: "climate.a" });
    const hass = { config: { unit_system: { temperature: "°F" } } } as unknown as HomeAssistant;
    expect(
      rangeOf(
        c,
        st(
          "heat",
          { temperature: 21, min_temp: 5, max_temp: 30, target_temp_step: 0.5 },
          "climate.a",
        ),
        hass,
      ),
    ).toEqual({ min: 5, max: 30, step: 0.5, value: 21, unit: "°F" });
    expect(rangeOf(c, st("heat", {}, "climate.a"))).toEqual({
      min: 7,
      max: 35,
      step: 0.5,
      value: null,
      unit: "°C",
    });
  });
  it("reads a number's own scale and unit; the entity's min / max / step win", () => {
    const n = ent({ entity: "number.a" });
    expect(
      rangeOf(n, st(80, { min: 50, max: 100, step: 5, unit_of_measurement: "%" }, "number.a")),
    ).toEqual({ min: 50, max: 100, step: 5, value: 80, unit: "%" });
    const o = ent({ entity: "number.a", min: 10, max: 20, control_step: 2 });
    expect(rangeOf(o, st(15, { min: 0, max: 100, step: 5 }, "number.a"))).toMatchObject({
      min: 10,
      max: 20,
      step: 2,
    });
  });
  it("counts steps from the minimum", () => {
    const r = { min: 1, max: 9, step: 2, value: null, unit: "" };
    expect(clampStep(5, r)).toBe(5);
    expect(clampStep(6, r)).toBe(7);
    expect(clampStep(3.9, r)).toBe(3);
    expect(clampStep(0, r)).toBe(1);
    expect(clampStep(0.75, { min: 0.25, max: 2, step: 0.5, value: null, unit: "" })).toBe(0.75);
    const s = st(3, { min: 1, max: 9, step: 2 }, "input_number.x");
    expect(
      serviceFor(ent({ entity: "input_number.x" }), s, { type: "step", dir: 1, from: 3 }),
    ).toMatchObject({ data: { value: 5 } });
  });
  it("clamps and rounds to the step", () => {
    const r = { min: 0, max: 100, step: 0.5, value: null, unit: "" };
    expect(clampStep(20.3, r)).toBe(20.5);
    expect(clampStep(-4, r)).toBe(0);
    expect(clampStep(140, r)).toBe(100);
    expect(clampStep(7, { ...r, step: 5 })).toBe(5);
  });
  it("knows which entities a slider applies to", () => {
    expect(sliderApplies(ent({}), st("on", { supported_color_modes: ["onoff"] }))).toBe(false);
    expect(sliderApplies(ent({}), st("on", { supported_color_modes: ["brightness"] }))).toBe(true);
    expect(sliderApplies(ent({}), st("on"))).toBe(true);
    const cover = ent({ entity: "cover.a" });
    expect(sliderApplies(cover, st("open", {}, "cover.a"))).toBe(false);
    expect(sliderApplies(cover, st("open", { current_position: 3 }, "cover.a"))).toBe(true);
    const fan = ent({ entity: "fan.a" });
    expect(sliderApplies(fan, st("on", {}, "fan.a"))).toBe(false);
    expect(sliderApplies(fan, st("off", {}, "fan.a"))).toBe(true);
    expect(sliderApplies(ent({ entity: "sensor.a" }), st(1, {}, "sensor.a"))).toBe(true);
  });
  it("treats off states and unavailable as not on", () => {
    expect(isOn(st("on"))).toBe(true);
    expect(isOn(st("off"))).toBe(false);
    expect(isOn(st("closed", {}, "cover.a"))).toBe(false);
    expect(isOn(st("unavailable"))).toBe(false);
    expect(isOn(undefined)).toBe(false);
  });
});

describe("options", () => {
  it("lists hvac modes with icons, presets and fan modes from the attribute", () => {
    const s = st(
      "heat",
      {
        hvac_modes: ["off", "heat"],
        preset_modes: ["eco", "boost"],
        preset_mode: "eco",
        fan_modes: ["low"],
      },
      "climate.a",
    );
    const hvac = ent({ entity: "climate.a", attribute: "hvac_mode" });
    expect(optionsOf(hvac, s)).toEqual([
      { value: "off", label: null, icon: HVAC_ICON.off },
      { value: "heat", label: null, icon: HVAC_ICON.heat },
    ]);
    expect(currentOptionOf(hvac, s)).toBe("heat");
    // the display may show something else: the control still targets the hvac mode
    const shown = ent({
      entity: "climate.a",
      attribute: "current_temperature",
      control: "segments",
    });
    expect(optionsOf(shown, s).map((o) => o.value)).toEqual(["off", "heat"]);
    expect(currentOptionOf(shown, s)).toBe("heat");
    const preset = ent({ entity: "climate.a", attribute: "preset_mode" });
    expect(optionsOf(preset, s).map((o) => o.value)).toEqual(["eco", "boost"]);
    expect(currentOptionOf(preset, s)).toBe("eco");
    expect(optionsOf(ent({ entity: "climate.a", attribute: "fan_mode" }), s)[0].value).toBe("low");
  });
  it("builds fan speeds from percentage_step and picks the nearest", () => {
    const fan = ent({ entity: "fan.a" });
    const s = st("on", { percentage: 66, percentage_step: 33.333 }, "fan.a");
    expect(optionsOf(fan, s).map((o) => o.value)).toEqual(["0", "33", "67", "100"]);
    expect(optionsOf(fan, s)[0]).toMatchObject({ icon: "mdi:power", label: "" });
    expect(currentOptionOf(fan, s)).toBe("67");
    expect(currentOptionOf(fan, st("off", { percentage: 0, percentage_step: 25 }, "fan.a"))).toBe(
      "0",
    );
    expect(optionsOf(fan, st("on", {}, "fan.a"))).toEqual([]);
    const preset = ent({ entity: "fan.a", attribute: "preset_mode" });
    expect(
      optionsOf(preset, st("on", { preset_modes: ["auto"], preset_mode: "auto" }, "fan.a")),
    ).toEqual([{ value: "auto", label: null, icon: null }]);
  });
  it("draws a slider instead of more speed segments than fit", () => {
    const fan = ent({ entity: "fan.a", control: "segments" });
    const fine = st("on", { percentage: 37, percentage_step: 1 }, "fan.a");
    expect(optionsOf(fan, fine)).toEqual([]);
    expect(speedsAsSlider(fan, fine)).toBe(true);
    const six = st("on", { percentage: 50, percentage_step: 100 / 6 }, "fan.a");
    expect(optionsOf(fan, six)).toHaveLength(MAX_SPEED_SEGMENTS + 1);
    expect(speedsAsSlider(fan, six)).toBe(false);
    expect(speedsAsSlider(fan, st("on", { percentage_step: 100 / 7 }, "fan.a"))).toBe(true);
    // own options, presets and other domains never switch
    expect(speedsAsSlider(ent({ entity: "fan.a", control_options: [0, 50] }), fine)).toBe(false);
    expect(speedsAsSlider(ent({ entity: "fan.a", attribute: "preset_mode" }), fine)).toBe(false);
    expect(speedsAsSlider(ent({}), fine)).toBe(false);
  });
  it("matches a fan's own options to its speed", () => {
    const fan = ent({ entity: "fan.a", control: "segments", control_options: [0, 50, 100] });
    const s = (state: string, percentage: number) =>
      st(state, { percentage, percentage_step: 33.333 }, "fan.a");
    expect(currentOptionOf(fan, s("on", 50))).toBe("50");
    expect(currentOptionOf(fan, s("on", 66))).toBe("50");
    expect(currentOptionOf(fan, s("on", 90))).toBe("100");
    expect(currentOptionOf(fan, s("off", 0))).toBe("0");
  });
  it("lists a select's options and the state as current; config options win", () => {
    const sel = ent({ entity: "input_select.a" });
    const s = st("Home", { options: ["Home", "Away"] }, "input_select.a");
    expect(optionsOf(sel, s).map((o) => o.value)).toEqual(["Home", "Away"]);
    expect(currentOptionOf(sel, s)).toBe("Home");
    expect(currentOptionOf(sel, undefined)).toBeNull();
    const own = ent({
      entity: "input_select.a",
      control_options: [{ value: "Away", label: "Out" }],
    });
    expect(optionsOf(own, s)).toEqual([{ value: "Away", label: "Out", icon: null }]);
  });
  it("has transport buttons for covers and media players only", () => {
    expect(buttonsOf(ent({ entity: "cover.a" })).map((b) => b.id)).toEqual([
      "open",
      "stop",
      "close",
    ]);
    expect(buttonsOf(ent({ entity: "media_player.a" })).map((b) => b.id)).toEqual([
      "previous",
      "play_pause",
      "next",
    ]);
    expect(buttonsOf(ent({}))).toEqual([]);
  });
});

describe("services", () => {
  const svc = (
    entity: string,
    o: RawEntity,
    s: HassEntity | undefined,
    input: Parameters<typeof serviceFor>[2],
  ) => serviceFor(ent({ entity, ...o }), s, input);
  it("toggles through homeassistant.toggle and needs an entity", () => {
    expect(svc("switch.a", {}, undefined, { type: "toggle" })).toEqual({
      domain: "homeassistant",
      service: "toggle",
      data: { entity_id: "switch.a" },
    });
    const noEntity = normalizeEntity({ value: "x", control: "hold" }, ctx, "e");
    expect(serviceFor(noEntity, undefined, { type: "toggle" })).toBeNull();
  });
  it("sets a value per domain, clamped, and turns off at zero", () => {
    expect(svc("light.a", {}, st("on"), { type: "value", value: 150 })).toMatchObject({
      service: "turn_on",
      data: { brightness_pct: 100 },
    });
    expect(svc("light.a", {}, st("on"), { type: "value", value: 0 })).toMatchObject({
      domain: "light",
      service: "turn_off",
    });
    expect(svc("cover.a", {}, undefined, { type: "value", value: 40.4 })).toMatchObject({
      service: "set_cover_position",
      data: { position: 40 },
    });
    expect(svc("media_player.a", {}, undefined, { type: "value", value: 50 })).toMatchObject({
      service: "volume_set",
      data: { volume_level: 0.5 },
    });
    expect(svc("fan.a", {}, undefined, { type: "value", value: 0 })).toMatchObject({
      service: "turn_off",
    });
    expect(svc("fan.a", {}, undefined, { type: "value", value: 50 })).toMatchObject({
      service: "set_percentage",
      data: { percentage: 50 },
    });
    expect(svc("climate.a", {}, undefined, { type: "value", value: 21.3 })).toMatchObject({
      service: "set_temperature",
      data: { temperature: 21.5 },
    });
    expect(svc("input_number.a", {}, undefined, { type: "value", value: 3 })).toMatchObject({
      domain: "input_number",
      service: "set_value",
      data: { value: 3 },
    });
    expect(svc("sensor.a", {}, undefined, { type: "value", value: 3 })).toBeNull();
  });
  it("steps from the shown value by the range step", () => {
    const s = st("heat", { target_temp_step: 0.5, max_temp: 30 }, "climate.a");
    expect(svc("climate.a", {}, s, { type: "step", dir: 1, from: 21 })).toMatchObject({
      data: { temperature: 21.5 },
    });
    expect(svc("climate.a", {}, s, { type: "step", dir: 1, from: 30 })).toMatchObject({
      data: { temperature: 30 },
    });
  });
  it("chooses an option per domain", () => {
    expect(
      svc("climate.a", { attribute: "hvac_mode" }, undefined, { type: "option", value: "heat" }),
    ).toMatchObject({
      service: "set_hvac_mode",
      data: { hvac_mode: "heat" },
    });
    expect(
      svc("climate.a", { attribute: "preset_mode" }, undefined, { type: "option", value: "eco" }),
    ).toMatchObject({
      service: "set_preset_mode",
    });
    expect(
      svc("climate.a", { attribute: "fan_mode" }, undefined, { type: "option", value: "low" }),
    ).toMatchObject({
      service: "set_fan_mode",
    });
    expect(svc("fan.a", {}, undefined, { type: "option", value: "0" })).toMatchObject({
      service: "turn_off",
    });
    expect(svc("fan.a", {}, undefined, { type: "option", value: "67" })).toMatchObject({
      service: "set_percentage",
      data: { percentage: 67 },
    });
    expect(
      svc("fan.a", { attribute: "preset_mode" }, undefined, { type: "option", value: "auto" }),
    ).toMatchObject({
      service: "set_preset_mode",
    });
    expect(svc("select.a", {}, undefined, { type: "option", value: "Eco" })).toMatchObject({
      domain: "select",
      service: "select_option",
      data: { option: "Eco" },
    });
    expect(svc("light.a", {}, undefined, { type: "option", value: "x" })).toBeNull();
  });
  it("maps the transport buttons, press and hold", () => {
    expect(svc("cover.a", {}, undefined, { type: "button", id: "stop" })).toMatchObject({
      service: "stop_cover",
    });
    expect(
      svc("media_player.a", {}, undefined, { type: "button", id: "play_pause" }),
    ).toMatchObject({
      service: "media_play_pause",
    });
    expect(svc("script.a", {}, undefined, { type: "press" })).toMatchObject({
      domain: "script",
      service: "turn_on",
    });
    expect(svc("input_button.a", {}, undefined, { type: "press" })).toMatchObject({
      service: "press",
    });
    expect(svc("light.a", {}, undefined, { type: "press" })).toBeNull();
    expect(svc("lock.a", {}, st("locked", {}, "lock.a"), { type: "hold" })).toMatchObject({
      service: "unlock",
    });
    expect(svc("lock.a", {}, st("unlocked", {}, "lock.a"), { type: "hold" })).toMatchObject({
      service: "lock",
    });
    expect(svc("cover.a", {}, undefined, { type: "hold" })).toMatchObject({
      domain: "cover",
      service: "toggle",
    });
    expect(svc("scene.a", {}, undefined, { type: "hold" })).toMatchObject({ service: "turn_on" });
    expect(svc("light.a", {}, undefined, { type: "hold" })).toMatchObject({
      domain: "homeassistant",
      service: "toggle",
    });
    // no silent toggle on a domain without an on / off meaning
    expect(svc("sensor.a", {}, undefined, { type: "hold" })).toBeNull();
    expect(svc("climate.a", {}, undefined, { type: "hold" })).toBeNull();
  });
});

describe("more placements", () => {
  it("moves a control asked for on the icon to the end in a table and on a ring", () => {
    const lead = { control: "toggle", control_position: "lead" };
    expect(kinds(placementsOf(ent(lead), "field"))).toEqual(["toggle@end"]);
    expect(kinds(placementsOf(ent({ ...lead, visual: "ring" }), "cell"))).toEqual(["toggle@end"]);
    expect(kinds(placementsOf(ent(lead), "cell"))).toEqual(["toggle@lead"]);
    expect(kinds(placementsOf(ent({ ...lead, control_confirm: true }), "field"))).toEqual([
      "hold@end",
    ]);
  });
  it("puts each named control at its default slot in every row kind", () => {
    const at = (control: string, row: Parameters<typeof placementsOf>[1], entity = "light.x") =>
      kinds(placementsOf(ent({ entity, control }), row));
    for (const row of ["tile", "list", "hero", "cell"] as const)
      expect(at("slider", row)).toEqual(["slider@block"]);
    for (const row of ["item-column", "field"] as const)
      expect(at("slider", row)).toEqual(["slider@end"]);
    for (const control of ["toggle", "stepper", "segments", "buttons", "button", "select", "hold"])
      expect(at(control, "tile")).toEqual([`${control}@end`]);
    expect(at("button", "item-row", "script.x")).toEqual(["button@lead"]);
    expect(at("hold", "item-row", "lock.x")).toEqual(["hold@lead"]);
  });
  it("lets a button or hold take the lead of a tile, and keeps auto's toggle on the line", () => {
    const lead = (o: RawEntity) =>
      kinds(placementsOf(ent({ control_position: "lead", ...o }), "tile"));
    expect(lead({ entity: "script.x", control: "button" })).toEqual(["button@lead"]);
    expect(lead({ entity: "lock.x", control: "hold" })).toEqual(["hold@lead"]);
    // control_position applies to a named control; auto keeps the domain's own slots
    expect(lead({ control: "auto" })).toEqual(["toggle@end", "slider@block"]);
  });
  it("keeps one control per block or lead slot", () => {
    const list = placementsOf(ent({ control: "slider", control_position: "block" }), "tile");
    expect(list).toHaveLength(1);
  });
  it("marks a confirmed group of buttons for a hold of their own, in every row kind", () => {
    for (const row of ["tile", "list", "cell", "item-column", "field"] as const)
      expect(
        placementsOf(ent({ entity: "cover.x", control: "buttons", control_confirm: true }), row)[0],
      ).toMatchObject({ kind: "buttons", confirm: true });
  });
});

describe("more ranges and services", () => {
  it("keeps the display's min and max out of a percentage control", () => {
    // max: 255 scales a brightness bar; the slider still sends a percentage
    for (const entity of ["light.x", "cover.x", "fan.x", "media_player.x"])
      expect(rangeOf(ent({ entity, min: 10, max: 255 }), undefined)).toMatchObject({
        min: 0,
        max: 100,
      });
    expect(serviceFor(ent({ max: 255 }), st("on"), { type: "value", value: 255 })).toMatchObject({
      data: { brightness_pct: 100 },
    });
  });
  it("lets min and max bound a number and a thermostat", () => {
    expect(rangeOf(ent({ entity: "number.x", min: 10, max: 20 }), undefined)).toMatchObject({
      min: 10,
      max: 20,
    });
    expect(rangeOf(ent({ entity: "climate.x", min: 16, max: 24 }), undefined)).toMatchObject({
      min: 16,
      max: 24,
    });
  });
  it("clamps volume to one and a step to the bounds", () => {
    expect(
      serviceFor(ent({ entity: "media_player.x" }), undefined, { type: "value", value: 140 }),
    ).toMatchObject({ data: { volume_level: 1 } });
    const s = st(5, { min: 5, max: 10, step: 1 }, "number.x");
    expect(
      serviceFor(ent({ entity: "number.x" }), s, { type: "step", dir: -1, from: 5 }),
    ).toMatchObject({ data: { value: 5 } });
  });
  it("turns stringy and numeric options into strings and keeps their order", () => {
    expect(ent({ control_options: [3, "b", 1] }).control?.options?.map((o) => o.value)).toEqual([
      "3",
      "b",
      "1",
    ]);
  });
  it("accepts an unset control_position and control_attribute", () => {
    const c = ent({ control_position: null, control_attribute: null }).control;
    expect(c).toMatchObject({ position: null, attribute: null });
  });
});

describe("availability", () => {
  it("follows the entity's state, never the value the row shows", () => {
    expect(canControl(ent({}), st("on"))).toBe(true);
    expect(canControl(ent({}), st("off"))).toBe(true);
    expect(canControl(ent({ attribute: "brightness" }), st("off"))).toBe(true);
    expect(canControl(ent({ value: "Garage" }), st("unavailable"))).toBe(false);
    expect(canControl(ent({}), undefined)).toBe(false);
  });
  it("keeps a never run script, scene or button usable", () => {
    for (const id of ["script.x", "scene.x", "button.x", "input_button.x"])
      expect(canControl(ent({ entity: id }), st("unknown", {}, id))).toBe(true);
  });
  it("greys out an unknown lock or light and anything unavailable", () => {
    expect(canControl(ent({ entity: "lock.x" }), st("unknown", {}, "lock.x"))).toBe(false);
    expect(canControl(ent({}), st("unknown"))).toBe(false);
    expect(canControl(ent({ entity: "scene.x" }), st("unavailable", {}, "scene.x"))).toBe(false);
  });
  it("counts playing and open as on", () => {
    expect(isOn(st("playing", {}, "media_player.x"))).toBe(true);
    expect(isOn(st("open", {}, "cover.x"))).toBe(true);
  });
});

describe("remaining mappings", () => {
  it("skips to the previous and the next track", () => {
    const mp = ent({ entity: "media_player.x" });
    expect(serviceFor(mp, undefined, { type: "button", id: "previous" })).toMatchObject({
      service: "media_previous_track",
    });
    expect(serviceFor(mp, undefined, { type: "button", id: "next" })).toMatchObject({
      service: "media_next_track",
    });
  });
  it("keeps the value beside a stepper on a domain it does not show", () => {
    const stepper = { kind: "stepper", position: "end", small: false } as const;
    expect(controlShowsValue(ent({}), stepper)).toBe(false);
    expect(controlShowsValue(ent({ entity: "fan.x" }), stepper)).toBe(false);
  });
});
