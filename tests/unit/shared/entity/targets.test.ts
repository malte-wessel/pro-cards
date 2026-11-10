// What a control sets: per domain the attributes a control can set, the one an entity's control
// sets (written, displayed, else the domain's first) and the one that takes an input.
import { describe, expect, it } from "vitest";
import type { NormalizeCtx, RawEntity } from "../../../../src/shared/entity/config.ts";
import { normalizeEntity } from "../../../../src/shared/entity/config.ts";
import {
  TARGET_KEYS,
  readsFavorites,
  targetKeysOf,
  targetOf,
} from "../../../../src/shared/entity/targets.ts";
import {
  buttonsOf,
  currentOptionOf,
  dateOf,
  onOf,
  optionButtonsOf,
  optionsOf,
  placementsOf,
  rangeOf,
  serviceFor,
  sliderApplies,
  wantsCode,
  type ButtonId,
  type ControlInput,
} from "../../../../src/shared/entity/control.ts";
import type { HassEntity } from "../../../../src/shared/ha.ts";
import {
  hueGradient,
  kelvinGradient,
  kelvinToRgb,
  saturationGradient,
} from "../../../../src/shared/color.ts";

const kinds = (list: { kind: string; position: string }[]) =>
  list.map((p) => `${p.kind}@${p.position}`);

const ctx: NormalizeCtx = {
  type: "t",
  tap: { action: "more-info" },
  hold: { action: "more-info" },
  dbl: { action: "none" },
  hover: false,
};
const ent = (entity: string, o: RawEntity = {}) =>
  normalizeEntity({ entity, control: "auto", ...o }, ctx, "e");

describe("what a control sets", () => {
  it("names each domain's attributes, its default first", () => {
    expect(targetKeysOf("light")[0]).toBe("brightness");
    expect(targetKeysOf("climate")).toEqual([
      "temperature",
      "hvac_mode",
      "preset_mode",
      "fan_mode",
      "swing_mode",
      "swing_horizontal_mode",
      "humidity",
    ]);
    expect(targetKeysOf("fan")).toEqual(["percentage", "preset_mode", "oscillating", "direction"]);
    // a select's option and a number's value are their state: no attribute names them
    expect(targetKeysOf("input_select")).toEqual([]);
    expect(targetKeysOf("sensor")).toEqual([]);
    expect(TARGET_KEYS).toContain("hvac_mode");
  });
  it("sets the written attribute, else the displayed one, else the domain's first", () => {
    expect(targetOf(ent("climate.x"))?.key).toBe("temperature");
    expect(targetOf(ent("climate.x", { control_attribute: "preset_mode" }))?.key).toBe(
      "preset_mode",
    );
    expect(targetOf(ent("climate.x", { attribute: "fan_mode" }))?.key).toBe("fan_mode");
    expect(targetOf(ent("sensor.x"))).toBeNull();
  });
  it("takes an input only where it can: a stepper on a thermostat's mode sets its temperature", () => {
    const modes = ent("climate.x", { control_attribute: "hvac_mode" });
    expect(targetOf(modes, "range")?.key).toBe("temperature");
    expect(targetOf(modes, "options")?.key).toBe("hvac_mode");
    // a thermostat's segments without a mode named: its hvac mode
    expect(targetOf(ent("climate.x"), "options")?.key).toBe("hvac_mode");
    expect(targetOf(ent("switch.x"), "options")).toBeNull();
    // a light's buttons are its favourite colours, a select its effects
    expect(targetOf(ent("light.x"), "options", "buttons")?.key).toBe("favorite_colors");
    expect(targetOf(ent("light.x"), "options", "select")?.key).toBe("effect");
  });
});

// ----- the cheap targets: a known drawing, a new attribute and service -----

const st = (id: string, state: string | number, attributes: Record<string, unknown> = {}) =>
  ({ entity_id: id, state: String(state), attributes }) as unknown as HassEntity;
const set = (e: ReturnType<typeof ent>, s: HassEntity, input: ControlInput) => {
  const c = serviceFor(e, s, input);
  return c && `${c.domain}.${c.service} ${JSON.stringify({ ...c.data, entity_id: undefined })}`;
};

describe("the attributes a control sets", () => {
  it("chooses a light's effect from its list", () => {
    const e = ent("light.x", { control: "select", control_attribute: "effect" });
    const s = st("light.x", "on", { effect_list: ["Rainbow", "Candle"], effect: "Candle" });
    expect(optionsOf(e, s).map((o) => o.value)).toEqual(["Rainbow", "Candle"]);
    expect(currentOptionOf(e, s)).toBe("Candle");
    expect(set(e, s, { type: "option", value: "Rainbow" })).toBe(
      'light.turn_on {"effect":"Rainbow"}',
    );
  });
  it("switches a fan's oscillation and turns its direction", () => {
    const osc = ent("fan.x", { control: "toggle", control_attribute: "oscillating" });
    const s = st("fan.x", "on", { oscillating: false, direction: "forward" });
    expect(onOf(osc, s, true)).toBe(false);
    expect(set(osc, s, { type: "toggle", attribute: true })).toBe(
      'fan.oscillate {"oscillating":true}',
    );
    // the icon as a switch stays the fan's power
    expect(onOf(osc, s)).toBe(true);
    expect(set(osc, s, { type: "toggle" })).toBe("homeassistant.toggle {}");
    // a fan's own switch is its power
    expect(onOf(ent("fan.x", { control: "toggle" }), s, true)).toBe(true);
    const dir = ent("fan.x", { control: "segments", control_attribute: "direction" });
    expect(optionsOf(dir, s).map((o) => o.value)).toEqual(["forward", "reverse"]);
    expect(currentOptionOf(dir, s)).toBe("forward");
    expect(set(dir, s, { type: "option", value: "reverse" })).toBe(
      'fan.set_direction {"direction":"reverse"}',
    );
  });
  it("sets a thermostat's swing and its target humidity", () => {
    const s = st("climate.x", "cool", {
      swing_modes: ["off", "vertical"],
      swing_mode: "off",
      swing_horizontal_modes: ["off", "on"],
      humidity: 45,
      min_humidity: 30,
      max_humidity: 60,
    });
    const swing = ent("climate.x", { control: "segments", control_attribute: "swing_mode" });
    expect(currentOptionOf(swing, s)).toBe("off");
    expect(set(swing, s, { type: "option", value: "vertical" })).toBe(
      'climate.set_swing_mode {"swing_mode":"vertical"}',
    );
    const h = ent("climate.x", { control: "stepper", control_attribute: "humidity" });
    expect(rangeOf(h, s)).toMatchObject({ min: 30, max: 60, step: 1, value: 45, unit: "%" });
    expect(set(h, s, { type: "step", dir: 1, from: 45 })).toBe(
      'climate.set_humidity {"humidity":46}',
    );
  });
  it("sets a humidifier's target and mode, a water heater's temperature and operation", () => {
    const hs = st("humidifier.x", "on", {
      humidity: 50,
      available_modes: ["normal", "eco"],
      mode: "eco",
    });
    expect(set(ent("humidifier.x", { control: "slider" }), hs, { type: "value", value: 55 })).toBe(
      'humidifier.set_humidity {"humidity":55}',
    );
    const mode = ent("humidifier.x", { control: "segments" });
    expect(currentOptionOf(mode, hs)).toBe("eco");
    expect(set(mode, hs, { type: "option", value: "normal" })).toBe(
      'humidifier.set_mode {"mode":"normal"}',
    );
    const ws = st("water_heater.x", "eco", {
      operation_list: ["eco", "electric"],
      temperature: 50,
      min_temp: 40,
      max_temp: 65,
    });
    expect(rangeOf(ent("water_heater.x", { control: "stepper" }), ws)).toMatchObject({
      min: 40,
      max: 65,
      step: 0.5,
      value: 50,
    });
    const op = ent("water_heater.x", { control: "segments" });
    // (its operation mode is its state)
    expect(currentOptionOf(op, ws)).toBe("eco");
    expect(set(op, ws, { type: "option", value: "electric" })).toBe(
      'water_heater.set_operation_mode {"operation_mode":"electric"}',
    );
  });
  it("tilts a cover and opens a valve to a position", () => {
    const s = st("cover.x", "open", { current_position: 60, current_tilt_position: 40 });
    const tilt = ent("cover.x", { control: "slider", control_attribute: "current_tilt_position" });
    expect(rangeOf(tilt, s).value).toBe(40);
    expect(set(tilt, s, { type: "value", value: 70 })).toBe(
      'cover.set_cover_tilt_position {"tilt_position":70}',
    );
    // a tilt shown changes nothing: the slider moves the cover, as ever
    expect(
      rangeOf(ent("cover.x", { control: "slider", attribute: "current_tilt_position" }), s).value,
    ).toBe(60);
    const v = st("valve.x", "open", { current_position: 30 });
    expect(set(ent("valve.x", { control: "slider" }), v, { type: "value", value: 80 })).toBe(
      'valve.set_valve_position {"position":80}',
    );
    expect(sliderApplies(ent("valve.x", { control: "slider" }), st("valve.x", "open"))).toBe(false);
  });
  it("steps a speaker's volume by 5 % and picks its source and sound mode", () => {
    const s = st("media_player.x", "playing", {
      volume_level: 0.4,
      source_list: ["TV", "Radio"],
      source: "TV",
      sound_mode_list: ["Movie", "Music"],
      sound_mode: "Music",
    });
    const vol = ent("media_player.x", { control: "stepper" });
    expect(rangeOf(vol, s, undefined, "stepper").step).toBe(5);
    // the slider keeps 1 %, a written step both
    expect(rangeOf(vol, s).step).toBe(1);
    expect(
      rangeOf(
        ent("media_player.x", { control: "stepper", control_step: 2 }),
        s,
        undefined,
        "stepper",
      ).step,
    ).toBe(2);
    expect(set(vol, s, { type: "step", dir: 1, from: 40, step: 5 })).toBe(
      'media_player.volume_set {"volume_level":0.45}',
    );
    const src = ent("media_player.x", { control: "select", control_attribute: "source" });
    expect(currentOptionOf(src, s)).toBe("TV");
    expect(set(src, s, { type: "option", value: "Radio" })).toBe(
      'media_player.select_source {"source":"Radio"}',
    );
    const snd = ent("media_player.x", { control: "select", control_attribute: "sound_mode" });
    expect(set(snd, s, { type: "option", value: "Movie" })).toBe(
      'media_player.select_sound_mode {"sound_mode":"Movie"}',
    );
  });
  it("sets a robot's fan speed", () => {
    const s = st("vacuum.x", "cleaning", { fan_speed_list: ["quiet", "max"], fan_speed: "quiet" });
    const e = ent("vacuum.x", { control: "select" });
    expect(currentOptionOf(e, s)).toBe("quiet");
    expect(set(e, s, { type: "option", value: "max" })).toBe(
      'vacuum.set_fan_speed {"fan_speed":"max"}',
    );
  });
  it("arms an alarm panel in the modes it supports, and disarms it", () => {
    // arm home (1) and away (2)
    const s = st("alarm_control_panel.x", "disarmed", { supported_features: 3 });
    const e = ent("alarm_control_panel.x", { control: "segments" });
    expect(optionsOf(e, s).map((o) => o.value)).toEqual(["disarmed", "armed_home", "armed_away"]);
    expect(currentOptionOf(e, s)).toBe("disarmed");
    expect(set(e, s, { type: "option", value: "armed_away" })).toBe(
      "alarm_control_panel.alarm_arm_away {}",
    );
    expect(
      set(e, st("alarm_control_panel.x", "armed_home"), { type: "option", value: "disarmed" }),
    ).toBe("alarm_control_panel.alarm_disarm {}");
  });
  it("counts a counter up and down by its own step", () => {
    const s = st("counter.x", 4, { step: 2, minimum: 0, maximum: 10 });
    const e = ent("counter.x", { control: "stepper" });
    expect(rangeOf(e, s, undefined, "stepper")).toMatchObject({
      min: 0,
      max: 10,
      step: 2,
      value: 4,
    });
    expect(set(e, s, { type: "step", dir: 1, from: 4 })).toBe("counter.increment {}");
    expect(set(e, s, { type: "step", dir: -1, from: 4 })).toBe("counter.decrement {}");
  });
  it("asks for a code where Home Assistant asks for one", () => {
    const lock = ent("lock.x", { control: "buttons" });
    expect(wantsCode(lock, st("lock.x", "locked", { code_format: "^\\d{4}$" }))).toBe(true);
    expect(wantsCode(lock, st("lock.x", "locked"))).toBe(false);
    const alarm = ent("alarm_control_panel.x", { control: "segments" });
    const coded = (o: Record<string, unknown>) =>
      st("alarm_control_panel.x", "armed_away", { code_format: "number", ...o });
    expect(wantsCode(alarm, coded({ code_arm_required: false }), "disarmed")).toBe(true);
    expect(wantsCode(alarm, coded({ code_arm_required: false }), "armed_home")).toBe(false);
    expect(wantsCode(alarm, coded({ code_arm_required: true }), "armed_home")).toBe(true);
  });
  it("draws auto's controls for the domains without a kind", () => {
    const auto = (id: string) => kinds(placementsOf(ent(id), "tile"));
    expect(auto("humidifier.x")).toEqual(["toggle@end", "slider@block"]);
    expect(auto("water_heater.x")).toEqual(["stepper@end"]);
    expect(auto("counter.x")).toEqual(["stepper@end"]);
    expect(auto("valve.x")).toEqual(["toggle@end", "slider@block"]);
  });
});

describe("a domain's buttons", () => {
  const ids = (e: ReturnType<typeof ent>, s?: HassEntity) => buttonsOf(e, s).map((b) => b.id);
  it("draws the domain's default, or the ones the card names in its order", () => {
    expect(ids(ent("lock.x", { control: "buttons" }))).toEqual(["lock", "unlock"]);
    expect(
      ids(ent("lock.x", { control: "buttons", control_options: ["open_door", "unlock"] })),
    ).toEqual(["open_door", "unlock"]);
    expect(ids(ent("vacuum.x", { control: "buttons" }))).toEqual(["start_pause", "dock"]);
    expect(
      ids(
        ent("vacuum.x", { control: "buttons", control_options: ["start_pause", "stop", "locate"] }),
      ),
    ).toEqual(["start_pause", "stop", "locate"]);
    expect(ids(ent("timer.x", { control: "buttons" }))).toEqual(["start", "pause", "cancel"]);
    expect(ids(ent("counter.x", { control: "buttons" }))).toEqual([
      "decrement",
      "reset",
      "increment",
    ]);
    expect(ids(ent("update.x", { control: "buttons" }))).toEqual(["skip", "install"]);
    expect(ids(ent("valve.x", { control: "buttons" }))).toEqual(["open", "stop", "close"]);
    // a cover whose control sets its tilt: the tilt's buttons
    expect(
      ids(ent("cover.x", { control: "buttons", control_attribute: "current_tilt_position" })),
    ).toEqual(["tilt_open", "tilt_stop", "tilt_close"]);
  });
  it("names the domain's buttons where one is not its own; your own buttons stay as ever", () => {
    expect(() => ent("lock.x", { control: "buttons", control_options: ["locate"] })).toThrow(
      "e.control_options: locate is not a button of a lock (lock | unlock | open_door)",
    );
    const own = ent("lock.x", { control: "buttons", control_options: [{ entity: "scene.a" }] });
    expect(own.control?.buttons).toHaveLength(1);
    expect(own.control?.buttonIds).toBeUndefined();
  });
  it("shows only what an entity that reports its features supports", () => {
    const e = ent("valve.x", { control: "buttons" });
    // open (1) and close (2), no stop (8)
    expect(ids(e, st("valve.x", "open", { supported_features: 3 }))).toEqual(["open", "close"]);
    expect(ids(e, st("valve.x", "open"))).toEqual(["open", "stop", "close"]);
  });
  it("greys out what does nothing now, as Home Assistant's", () => {
    const off = (id: string, e: ReturnType<typeof ent>, s: HassEntity) =>
      buttonsOf(e, s)
        .find((b) => b.id === id)
        ?.disabled?.(s) ?? false;
    const lock = ent("lock.x", { control: "buttons" });
    expect(off("lock", lock, st("lock.x", "locked"))).toBe(true);
    expect(off("unlock", lock, st("lock.x", "locked"))).toBe(false);
    const counter = ent("counter.x", { control: "buttons" });
    expect(off("decrement", counter, st("counter.x", 0, { minimum: 0 }))).toBe(true);
    expect(off("increment", counter, st("counter.x", 0, { minimum: 0 }))).toBe(false);
    const timer = ent("timer.x", { control: "buttons" });
    expect(off("pause", timer, st("timer.x", "idle"))).toBe(true);
    expect(off("pause", timer, st("timer.x", "active"))).toBe(false);
    const update = ent("update.x", { control: "buttons" });
    expect(off("install", update, st("update.x", "on"))).toBe(false);
    expect(off("install", update, st("update.x", "off"))).toBe(true);
  });
  it("calls each button's service", () => {
    const press = (id: string, input: ButtonId, s?: HassEntity) => {
      const c = serviceFor(ent(id, { control: "buttons" }), s, { type: "button", id: input });
      return c && `${c.domain}.${c.service}`;
    };
    expect(press("lock.x", "unlock")).toBe("lock.unlock");
    expect(press("lock.x", "open_door")).toBe("lock.open");
    expect(press("valve.x", "open")).toBe("valve.open_valve");
    expect(press("valve.x", "stop")).toBe("valve.stop_valve");
    expect(press("cover.x", "stop")).toBe("cover.stop_cover");
    expect(press("cover.x", "tilt_close")).toBe("cover.close_cover_tilt");
    expect(press("vacuum.x", "stop")).toBe("vacuum.stop");
    expect(press("vacuum.x", "locate")).toBe("vacuum.locate");
    expect(press("counter.x", "reset")).toBe("counter.reset");
    expect(press("timer.x", "finish")).toBe("timer.finish");
    expect(press("update.x", "install")).toBe("update.install");
  });
  it("set an option instead where they are not the domain's own: favourite colours, presets", () => {
    // a light has no buttons of its own: its favourite colours
    expect(optionButtonsOf(ent("light.x", { control: "buttons" }))?.key).toBe("favorite_colors");
    // a timer's own, unless its control names its presets
    expect(optionButtonsOf(ent("timer.x", { control: "buttons" }))).toBeNull();
    expect(
      optionButtonsOf(ent("timer.x", { control: "buttons", control_attribute: "presets" }))?.key,
    ).toBe("presets");
    // a cover's are its own, its tilt's too
    expect(
      optionButtonsOf(
        ent("cover.x", { control: "buttons", control_attribute: "current_tilt_position" }),
      ),
    ).toBeNull();
  });
  it("holds a lock's door opener always", () => {
    const e = ent("lock.x", { control: "buttons", control_options: ["open_door"] });
    expect(buttonsOf(e)[0].confirm).toBe(true);
  });
});

describe("a light's colour", () => {
  const s = st("light.x", "on", {
    supported_color_modes: ["color_temp", "hs"],
    color_mode: "hs",
    hs_color: [30, 60],
    color_temp_kelvin: null,
    min_color_temp_kelvin: 2000,
    max_color_temp_kelvin: 6500,
  });
  it("slides its colour temperature over its own range, from where it is", () => {
    const e = ent("light.x", { control: "slider", control_attribute: "color_temp_kelvin" });
    const warm = st("light.x", "on", {
      ...s.attributes,
      color_mode: "color_temp",
      color_temp_kelvin: 3000,
    });
    expect(rangeOf(e, warm)).toMatchObject({
      min: 2000,
      max: 6500,
      step: 50,
      value: 3000,
      unit: "K",
    });
    expect(set(e, warm, { type: "value", value: 4010 })).toBe(
      'light.turn_on {"color_temp_kelvin":4000}',
    );
    // off: at the warm end, so a drag turns it on there
    expect(rangeOf(e, st("light.x", "off", s.attributes)).value).toBe(2000);
    expect(sliderApplies(e, st("light.x", "on", { supported_color_modes: ["hs"] }))).toBe(false);
  });
  it("turns its hue keeping its saturation, and its saturation keeping its hue", () => {
    const hue = ent("light.x", { control: "slider", control_attribute: "hue" });
    expect(rangeOf(hue, s)).toMatchObject({ min: 0, max: 360, value: 30, unit: "°" });
    expect(set(hue, s, { type: "value", value: 200 })).toBe('light.turn_on {"hs_color":[200,60]}');
    // from a colour temperature: the full colour
    const fromTemp = st("light.x", "on", { ...s.attributes, color_mode: "color_temp" });
    expect(set(hue, fromTemp, { type: "value", value: 200 })).toBe(
      'light.turn_on {"hs_color":[200,100]}',
    );
    const sat = ent("light.x", { control: "slider", control_attribute: "saturation" });
    expect(rangeOf(sat, s).value).toBe(60);
    expect(set(sat, s, { type: "value", value: 20 })).toBe('light.turn_on {"hs_color":[30,20]}');
    expect(sliderApplies(hue, st("light.x", "on", { supported_color_modes: ["brightness"] }))).toBe(
      false,
    );
  });
});

describe("the colours of a colour slider", () => {
  it("warms below 6600 K and cools above, white between", () => {
    expect(kelvinToRgb(2000)).toEqual([255, 137, 14]);
    expect(kelvinToRgb(6600)[0]).toBe(255);
    const [r, , b] = kelvinToRgb(10000);
    expect(b).toBe(255);
    expect(r).toBeLessThan(220);
  });
  it("draws a range in eleven stops, hues round the circle, a hue from white", () => {
    const k = kelvinGradient(2000, 6500).split(", ");
    expect(k).toHaveLength(11);
    expect(k[0]).toBe("rgb(255 137 14) 0%");
    expect(k[10]).toMatch(/ 100%$/);
    expect(hueGradient().split(", ")).toHaveLength(7);
    expect(saturationGradient(200)).toBe("hsl(200 0% 100%) 0%, hsl(200 100% 50%) 100%");
  });
});

describe("favourites", () => {
  const reg = (o: Record<string, Record<string, unknown>>) => o;
  it("offers a cover's favourite positions, else 0, 25, 75 and 100, the one it is at chosen", () => {
    const e = ent("cover.x", { control: "segments" });
    const s = st("cover.x", "open", { current_position: 75 });
    expect(optionsOf(e, s, null, "segments").map((o) => o.label)).toEqual([
      "0 %",
      "25 %",
      "75 %",
      "100 %",
    ]);
    expect(currentOptionOf(e, s, "segments")).toBe("75");
    const own = optionsOf(
      e,
      s,
      reg({ cover: { favorite_positions: [10, 50, 50, 120] } }),
      "segments",
    );
    expect(own.map((o) => o.value)).toEqual(["10", "50", "100"]);
    expect(set(e, s, { type: "option", value: "50", kind: "segments" })).toBe(
      'cover.set_cover_position {"position":50}',
    );
    // the tilt's own
    const tilt = ent("cover.x", {
      control: "segments",
      control_attribute: "current_tilt_position",
    });
    expect(
      optionsOf(tilt, s, reg({ cover: { favorite_tilt_positions: [0, 50] } }), "segments").map(
        (o) => o.value,
      ),
    ).toEqual(["0", "50"]);
    expect(readsFavorites(e, "segments")).toBe(true);
    expect(
      readsFavorites(
        ent("cover.x", { control: "segments", control_options: [0, 100] }),
        "segments",
      ),
    ).toBe(false);
  });
  it("offers a light's favourite colours as swatch buttons, else Home Assistant's defaults", () => {
    const e = ent("light.x", { control: "buttons" });
    const s = st("light.x", "on", {
      supported_color_modes: ["color_temp", "hs"],
      min_color_temp_kelvin: 2000,
      max_color_temp_kelvin: 6500,
    });
    const defaults = optionsOf(e, s, null, "buttons");
    // four whites across its range, then blue, purple, pink, red
    expect(defaults).toHaveLength(8);
    expect(defaults[0]).toMatchObject({ label: "2000 K", color: "rgb(255 137 14)" });
    expect(JSON.parse(defaults[0].value)).toEqual({ color_temp_kelvin: 2000 });
    const own = optionsOf(
      e,
      s,
      reg({ light: { favorite_colors: [{ hs_color: [240, 100] }, { rgb_color: [255, 0, 0] }] } }),
      "buttons",
    );
    expect(own.map((o) => o.color)).toEqual(["rgb(0 0 255)", "rgb(255 0 0)"]);
    expect(set(e, s, { type: "option", value: own[1].value, kind: "buttons" })).toBe(
      'light.turn_on {"rgb_color":[255,0,0]}',
    );
  });
  it("offers a timer's presets as buttons where its control names them, none without them", () => {
    const e = ent("timer.x", { control: "buttons", control_attribute: "presets" });
    const s = st("timer.x", "idle");
    expect(optionsOf(e, s, null, "buttons")).toEqual([]);
    const own = optionsOf(e, s, reg({ timer: { presets: [300, 5400, 300] } }), "buttons");
    expect(own.map((o) => o.label)).toEqual(["5:00", "1:30:00"]);
    expect(set(e, s, { type: "option", value: "300", kind: "buttons" })).toBe(
      'timer.start {"duration":300}',
    );
  });
});

describe("a date entity's day", () => {
  it("reads the day a date, an input_datetime and a date and time are on", () => {
    expect(dateOf(ent("date.x", { control: "date" }), st("date.x", "2026-11-17"))).toBe(
      "2026-11-17",
    );
    expect(
      dateOf(
        ent("input_datetime.x", { control: "date" }),
        st("input_datetime.x", "2026-11-17 07:30:00", { has_date: true }),
      ),
    ).toBe("2026-11-17");
    // a date and time in the profile's zone: 23:30 UTC is the next day in Berlin
    expect(
      dateOf(
        ent("datetime.x", { control: "date" }),
        st("datetime.x", "2026-11-17T23:30:00+00:00"),
        "Europe/Berlin",
      ),
    ).toBe("2026-11-18");
    expect(dateOf(ent("date.x", { control: "date" }), st("date.x", "unknown"))).toBeNull();
  });
  it("sets the day by its domain's service", () => {
    const day = (id: string, datetime?: string) =>
      set(ent(id, { control: "date" }), st(id, "2026-11-17"), {
        type: "date",
        value: "2026-12-01",
        datetime,
      });
    expect(day("date.x")).toBe('date.set_value {"date":"2026-12-01"}');
    expect(day("input_datetime.x")).toBe('input_datetime.set_datetime {"date":"2026-12-01"}');
    expect(day("datetime.x", "2026-12-01T06:30:00.000Z")).toBe(
      'datetime.set_value {"datetime":"2026-12-01T06:30:00.000Z"}',
    );
    expect(kinds(placementsOf(ent("date.x"), "tile"))).toEqual(["date@end"]);
  });
});

describe("the review's cases", () => {
  it("names the kind's own buttons without a type; other words stay its segments' options", () => {
    // (control: auto, the kind's own)
    const robot = ent("vacuum.x", { control_options: ["stop", "locate"] });
    expect(robot.control?.buttonIds).toEqual(["stop", "locate"]);
    expect(buttonsOf(robot).map((b) => b.id)).toEqual(["stop", "locate"]);
    expect(robot.control?.options).toBeNull();
    const modes = ent("climate.x", { control_options: ["heat", "off"] });
    expect(modes.control?.buttonIds).toBeUndefined();
    expect(modes.control?.options?.map((o) => o.value)).toEqual(["heat", "off"]);
  });
  it("steps a counter by the step's own direction while its state still lags", () => {
    const e = ent("counter.x", { control: "stepper" });
    // + went to 5 → 6, the state still says 5: − from the shown 6 decrements
    expect(set(e, st("counter.x", 5, { step: 1 }), { type: "step", dir: -1, from: 6 })).toBe(
      "counter.decrement {}",
    );
    // a slider on a counter, which only steps, sets nothing
    expect(
      set(ent("counter.x", { control: "slider" }), st("counter.x", 5), { type: "value", value: 9 }),
    ).toBeNull();
  });
});
