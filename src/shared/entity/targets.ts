// What a control sets (pure): per domain, the Home Assistant attributes a control can set, each
// with its range (a slider, a stepper), its options and the one chosen (segments, a select) and
// the service that sets it. A control's type says how it is drawn, its `attribute` which of these
// it sets; left out, the displayed attribute where the domain can set it, else the domain's first.
import {
  domainOf,
  hsToRgb,
  hueGradient,
  kelvinGradient,
  kelvinToRgb,
  rgbToHex,
  saturationGradient,
} from "../color.ts";
import type { RegistryOptions } from "../registry-options.ts";
import type { HassEntity, HomeAssistant } from "../ha.ts";
import type { ControlKind, ControlOption, Range, ServiceCall } from "./control.ts";
import type { EntityItem } from "./config.ts";
import { isNum } from "../util.ts";
import { numAttr, scaleOf } from "./look.ts";

export interface Target {
  // the attribute it sets (null: the entity's state, which no `attribute` names)
  key: string | null;
  // the options' value is the entity's state (a thermostat's mode, a select's option)
  state?: boolean;
  // its options are named by Home Assistant's words for the attribute's values (a preset)
  attributeLabels?: boolean;
  // the control types that draw it
  kinds: readonly ControlKind[];
  // a stepper's step where the card names none, when it is not the slider's (a volume's 5 %)
  stepperStep?: number;
  // a slider's track drawn as the colours it sets (a colour temperature, hues): its stops
  gradient?: (ent: EntityItem, st: HassEntity | undefined) => string;
  // a switch for it: whether it is on, and the call that flips it (a fan's oscillation)
  on?: (st: HassEntity | undefined) => boolean;
  toggle?: (ent: EntityItem, st: HassEntity | undefined) => ServiceCall | null;
  // whether the entity has it now (an on/off light has no brightness to slide)
  applies?: (st: HassEntity | undefined) => boolean;
  range?: (ent: EntityItem, st: HassEntity | undefined, hass?: HomeAssistant) => Range;
  // the entity's own options (the card's `options` replace them); `reg` its registry options,
  // where favourites live
  options?: (
    ent: EntityItem,
    st: HassEntity | undefined,
    reg?: RegistryOptions | null,
  ) => ControlOption[];
  // its options are the entity's favourites in the registry (fetched for it)
  favorites?: boolean;
  // its options are buttons that each set one, none of them chosen (a light's favourite colours,
  // a timer's presets): drawn by `type: buttons`
  optionButtons?: boolean;
  // the option chosen now (default: the attribute's value, or the state)
  current?: (ent: EntityItem, st: HassEntity | undefined) => string | null;
  // the call that sets it to a value (a number from a slider or a stepper, an option's value);
  // `dir` a stepper's step, up or down
  set: (
    v: number | string,
    ent: EntityItem,
    st: HassEntity | undefined,
    dir?: 1 | -1,
  ) => ServiceCall | null;
}

export const HVAC_ICON: Record<string, string> = {
  off: "mdi:power",
  heat: "mdi:fire",
  cool: "mdi:snowflake",
  auto: "mdi:thermostat-auto",
  heat_cool: "mdi:sun-snowflake-variant",
  dry: "mdi:water-percent",
  fan_only: "mdi:fan",
};

const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x) => x !== null && x !== undefined).map(String) : [];
const plain = (vals: string[]): ControlOption[] =>
  vals.map((v) => ({ value: v, label: null, icon: null }));
const listOf =
  (attr: string) =>
  (_e: EntityItem, st: HassEntity | undefined): ControlOption[] =>
    plain(strList(st?.attributes?.[attr]));
const call = (
  ent: EntityItem,
  domain: string,
  service: string,
  data: Record<string, unknown> = {},
): ServiceCall => ({ domain, service, data: { entity_id: ent.entity, ...data } });
// brightness, position, volume and speed are percentages: the display's min / max never apply
const pct = (ent: EntityItem, value: number | null, s: number | null = null): Range => ({
  min: 0,
  max: 100,
  step: ent.control?.step ?? s ?? 1,
  value,
  unit: "%",
});

// more speeds than this do not fit a pill group: the fan gets a slider instead
export const MAX_SPEED_SEGMENTS = 6;
export const speedCount = (st: HassEntity | undefined) => {
  const s = numAttr(st, "percentage_step");
  return s === null || s <= 0 ? 0 : Math.max(1, Math.round(100 / s));
};
// fan speeds from percentage_step: 0 (off), then every step up to 100
const fanSpeeds = (st: HassEntity | undefined): ControlOption[] => {
  const n = speedCount(st);
  if (n === 0 || n > MAX_SPEED_SEGMENTS) return [];
  const out: ControlOption[] = [{ value: "0", label: "", icon: "mdi:power" }];
  for (let i = 1; i <= n; i++)
    out.push({ value: String(Math.round((100 * i) / n)), label: String(i), icon: null });
  return out;
};
// a number's own scale: the card's min and max, else the entity's, its step and unit
export const stateRange = (ent: EntityItem, st: HassEntity | undefined): Range => {
  const { min, max } = scaleOf(ent, st);
  const u = st?.attributes?.unit_of_measurement;
  return {
    min,
    max,
    step: ent.control?.step ?? numAttr(st, "step") ?? 1,
    value: st && isNum(st.state) ? Number(st.state) : null,
    unit: typeof u === "string" ? u : "",
  };
};
// the light's colour modes: those that take a colour (hs, xy, rgb …) and a colour temperature
const COLOR_MODES = new Set(["hs", "xy", "rgb", "rgbw", "rgbww"]);
const colorModes = (st: HassEntity | undefined) => strList(st?.attributes?.supported_color_modes);
export const lightTakesColor = (st: HassEntity | undefined) =>
  colorModes(st).some((m) => COLOR_MODES.has(m));
export const lightTakesTemp = (st: HassEntity | undefined) => colorModes(st).includes("color_temp");
const hsOf = (st: HassEntity | undefined): [number | null, number | null] => {
  const hs = st?.attributes?.hs_color;
  return Array.isArray(hs) && isNum(hs[0]) && isNum(hs[1])
    ? [Number(hs[0]), Number(hs[1])]
    : [null, null];
};
// what a colour slider shows while the light is off: the start, so a drag turns it on there
const offAt = (st: HassEntity | undefined, v: number | null, at: number) =>
  v ?? (st?.state === "off" ? at : null);
const fanPct = (st: HassEntity | undefined) =>
  st?.state === "off" ? 0 : numAttr(st, "percentage");

// a climate's mode (its state) or one of its mode attributes, set by its own service
const climateMode = (key: string, service: string, list: string): Target =>
  modeOf("climate", key, service, list);
// a mode attribute and the list it is chosen from, set by its domain's service
const modeOf = (domain: string, key: string, service: string, list: string): Target => ({
  key,
  kinds: ["segments", "select"],
  attributeLabels: true,
  applies: (st) => strList(st?.attributes?.[list]).length > 0,
  options: listOf(list),
  set: (v, ent) => call(ent, domain, service, { [key]: v }),
});
// a percentage attribute set by its domain's service (a position, a tilt); segments of it are the
// favourite positions in the registry (`fav`), else Home Assistant's 0, 25, 75 and 100
const FAVORITE_POSITIONS = [0, 25, 75, 100];
const percentOf = (
  domain: string,
  key: string,
  service: string,
  data: string,
  fav: string,
  // (a cover's buttons travel or tilt it)
  more: readonly ControlKind[] = [],
): Target => ({
  key,
  kinds: ["slider", "stepper", "segments", ...more],
  applies: (st) => numAttr(st, key) !== null,
  range: (ent, st) => pct(ent, numAttr(st, key)),
  favorites: true,
  options: (_e, _st, reg) => {
    const list = reg?.[domain]?.[fav];
    const vals = Array.isArray(list)
      ? [
          ...new Set(
            list.filter(isNum).map((v) => Math.min(100, Math.max(0, Math.round(Number(v))))),
          ),
        ]
      : [];
    return (vals.length ? vals : FAVORITE_POSITIONS).map((v) => ({
      value: String(v),
      label: `${v} %`,
      icon: null,
    }));
  },
  current: (_e, st) => {
    const v = numAttr(st, key);
    return v === null ? null : String(v);
  },
  set: (v, ent) => call(ent, domain, service, { [data]: Math.round(Number(v)) }),
});

// a light's favourite colours: the registry's, else Home Assistant's defaults (four colour
// temperatures across its range, or warm to cool whites as colours, then blue, purple, pink, red)
type Favorite = Record<string, unknown>;
const EXTRA_COLORS: readonly [number, number, number][] = [
  [127, 172, 255],
  [215, 150, 255],
  [255, 158, 243],
  [255, 110, 84],
];
const defaultFavorites = (st: HassEntity | undefined): Favorite[] => {
  const out: Favorite[] = [];
  const colour = lightTakesColor(st);
  if (lightTakesTemp(st)) {
    const min = numAttr(st, "min_color_temp_kelvin") ?? 2700;
    const max = numAttr(st, "max_color_temp_kelvin") ?? 6500;
    for (let i = 0; i < 4; i++)
      out.push({ color_temp_kelvin: Math.round(min + ((max - min) * i) / 3) });
  } else if (colour)
    for (let i = 0; i < 4; i++) out.push({ rgb_color: kelvinToRgb(2000 + (4500 * i) / 3) });
  if (colour) for (const rgb of EXTRA_COLORS) out.push({ rgb_color: [...rgb] });
  return out;
};
const FAVORITE_KEYS = ["color_temp_kelvin", "hs_color", "rgb_color", "rgbw_color", "rgbww_color"];
// a favourite's swatch and its name: a colour temperature in kelvin, a colour as its hex
const swatchOf = (f: Favorite): { color: string; label: string } | null => {
  const k = f.color_temp_kelvin;
  if (isNum(k)) {
    const [r, g, b] = kelvinToRgb(Number(k));
    return { color: `rgb(${r} ${g} ${b})`, label: `${Math.round(Number(k))} K` };
  }
  const hs = f.hs_color;
  const rgb =
    Array.isArray(hs) && isNum(hs[0]) && isNum(hs[1])
      ? hsToRgb(Number(hs[0]), Number(hs[1]))
      : (["rgb_color", "rgbw_color", "rgbww_color"]
          .map((key) => f[key])
          .find((v) => Array.isArray(v) && v.length >= 3 && v.slice(0, 3).every(isNum)) as
          number[] | undefined);
  if (!rgb) return null;
  const [r, g, b] = rgb.slice(0, 3).map(Number);
  return { color: `rgb(${r} ${g} ${b})`, label: rgbToHex(r, g, b) };
};
// a timer's presets in the registry (seconds), as Home Assistant writes them: 5:00, 1:30:00
const durationText = (s: number) => {
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    sec = s % 60;
  const two = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${two(m)}:${two(sec)}` : `${m}:${two(sec)}`;
};
// a target humidity: a humidifier's, a thermostat's
const humidityOf = (domain: string): Target => ({
  key: "humidity",
  kinds: ["stepper", "slider"],
  applies: (st) => numAttr(st, "humidity") !== null,
  range: (ent, st) => ({
    min: ent.min ?? numAttr(st, "min_humidity") ?? 0,
    max: ent.max ?? numAttr(st, "max_humidity") ?? 100,
    step: ent.control?.step ?? numAttr(st, "target_humidity_step") ?? 1,
    value: numAttr(st, "humidity"),
    unit: "%",
  }),
  set: (v, ent) => call(ent, domain, "set_humidity", { humidity: Number(v) }),
});
// what a thermostat's or a water heater's temperatures move in: the card's limits, else the
// entity's, its step and the unit
export const temperatureRange = (
  domain: string,
  ent: EntityItem,
  st: HassEntity | undefined,
  hass: HomeAssistant | undefined,
  value: number | null,
): Range => {
  const unit = hass?.config?.unit_system?.temperature ?? "°C";
  return {
    min: ent.min ?? numAttr(st, "min_temp") ?? 7,
    max: ent.max ?? numAttr(st, "max_temp") ?? 35,
    step:
      ent.control?.step ??
      numAttr(st, "target_temp_step") ??
      (domain === "water_heater" && unit === "°F" ? 1 : 0.5),
    value,
    unit,
  };
};
// a target temperature: a thermostat's, a water heater's
const temperatureOf = (domain: string): Target => ({
  key: "temperature",
  kinds: ["stepper", "slider"],
  range: (ent, st, hass) => temperatureRange(domain, ent, st, hass, numAttr(st, "temperature")),
  set: (v, ent) => call(ent, domain, "set_temperature", { temperature: v }),
});
// a thermostat that holds a range (heat_cool) has a low and a high target and no single one: its
// two targets, else null
export const setpointsOf = (st: HassEntity | undefined): [number, number] | null => {
  if (domainOf(st?.entity_id) !== "climate" || numAttr(st, "temperature") !== null) return null;
  const low = numAttr(st, "target_temp_low"),
    high = numAttr(st, "target_temp_high");
  return low === null || high === null ? null : [low, high];
};
// the call that sets both, as Home Assistant takes them: together
export const setpointsCall = (ent: EntityItem, [low, high]: readonly [number, number]) =>
  call(ent, "climate", "set_temperature", { target_temp_low: low, target_temp_high: high });

// an alarm panel's arm modes by its supported features, Home Assistant's order and icons
const ALARM_MODES: readonly [string, number, string][] = [
  ["armed_home", 1, "mdi:home"],
  ["armed_away", 2, "mdi:lock"],
  ["armed_night", 4, "mdi:weather-night"],
  ["armed_vacation", 32, "mdi:airplane"],
  ["armed_custom_bypass", 16, "mdi:shield"],
];
const alarmModes = (st: HassEntity | undefined): ControlOption[] => {
  const f = numAttr(st, "supported_features") ?? 0;
  return [
    { value: "disarmed", label: null, icon: "mdi:shield-off" },
    ...ALARM_MODES.filter(([, bit]) => f & bit).map(([value, , icon]) => ({
      value,
      label: null,
      icon,
    })),
  ];
};

export const TARGETS: Record<string, readonly Target[]> = {
  light: [
    {
      key: "brightness",
      kinds: ["slider", "stepper"],
      // an on/off light has no brightness
      applies: (st) => {
        const modes = st?.attributes?.supported_color_modes;
        return !(Array.isArray(modes) && modes.length > 0 && modes.every((m) => m === "onoff"));
      },
      range: (ent, st) => {
        const b = numAttr(st, "brightness");
        return pct(ent, st?.state === "off" ? 0 : b === null ? null : Math.round((b / 255) * 100));
      },
      set: (v, ent) =>
        Number(v) <= 0
          ? call(ent, "light", "turn_off")
          : call(ent, "light", "turn_on", { brightness_pct: Math.round(Number(v)) }),
    },
    {
      key: "color_temp_kelvin",
      kinds: ["slider"],
      applies: lightTakesTemp,
      range: (ent, st) => {
        const min = numAttr(st, "min_color_temp_kelvin") ?? 2700;
        return {
          min,
          max: numAttr(st, "max_color_temp_kelvin") ?? 6500,
          step: ent.control?.step ?? 50,
          value: offAt(st, numAttr(st, "color_temp_kelvin"), min),
          unit: "K",
        };
      },
      gradient: (_e, st) =>
        kelvinGradient(
          numAttr(st, "min_color_temp_kelvin") ?? 2700,
          numAttr(st, "max_color_temp_kelvin") ?? 6500,
        ),
      set: (v, ent) => call(ent, "light", "turn_on", { color_temp_kelvin: Math.round(Number(v)) }),
    },
    {
      // the hue, keeping the light's saturation (full from white or a colour temperature)
      key: "hue",
      kinds: ["slider"],
      applies: lightTakesColor,
      range: (ent, st) => ({
        min: 0,
        max: 360,
        step: ent.control?.step ?? 1,
        value: offAt(st, hsOf(st)[0], 0),
        unit: "°",
      }),
      gradient: () => hueGradient(),
      set: (v, ent, st) => {
        const sat = hsOf(st)[1];
        const colour = COLOR_MODES.has(String(st?.attributes?.color_mode));
        return call(ent, "light", "turn_on", {
          hs_color: [Math.round(Number(v)), colour && sat ? sat : 100],
        });
      },
    },
    {
      // the saturation of its hue, from white to the fullest
      key: "saturation",
      kinds: ["slider"],
      applies: lightTakesColor,
      range: (ent, st) => ({
        min: 0,
        max: 100,
        step: ent.control?.step ?? 1,
        value: offAt(st, hsOf(st)[1], 0),
        unit: "%",
      }),
      gradient: (_e, st) => saturationGradient(hsOf(st)[0]),
      set: (v, ent, st) =>
        call(ent, "light", "turn_on", { hs_color: [hsOf(st)[0] ?? 0, Math.round(Number(v))] }),
    },
    {
      key: "favorite_colors",
      kinds: ["buttons"],
      optionButtons: true,
      applies: (st) => lightTakesColor(st) || lightTakesTemp(st),
      favorites: true,
      options: (_e, st, reg) => {
        const list = reg?.light?.favorite_colors;
        const favs = Array.isArray(list) ? (list as Favorite[]) : defaultFavorites(st);
        return favs.flatMap((f) => {
          const sw = f && typeof f === "object" ? swatchOf(f) : null;
          if (!sw) return [];
          // (only the keys a favourite may set)
          const set = Object.fromEntries(FAVORITE_KEYS.filter((k) => k in f).map((k) => [k, f[k]]));
          return [{ value: JSON.stringify(set), label: sw.label, icon: null, color: sw.color }];
        });
      },
      current: () => null,
      set: (v, ent) => {
        try {
          return call(ent, "light", "turn_on", JSON.parse(String(v)) as Record<string, unknown>);
        } catch {
          return null;
        }
      },
    },
    {
      key: "effect",
      kinds: ["select", "segments"],
      attributeLabels: true,
      applies: (st) => strList(st?.attributes?.effect_list).length > 0,
      options: listOf("effect_list"),
      set: (v, ent) => call(ent, "light", "turn_on", { effect: v }),
    },
  ],
  cover: [
    percentOf("cover", "current_position", "set_cover_position", "position", "favorite_positions", [
      "buttons",
    ]),
    percentOf(
      "cover",
      "current_tilt_position",
      "set_cover_tilt_position",
      "tilt_position",
      "favorite_tilt_positions",
      ["buttons"],
    ),
  ],
  valve: [
    percentOf("valve", "current_position", "set_valve_position", "position", "favorite_positions"),
  ],
  timer: [
    {
      // its presets in the registry: a tap starts it for that long
      key: "presets",
      kinds: ["buttons", "select"],
      optionButtons: true,
      favorites: true,
      options: (_e, _st, reg) => {
        const list = reg?.timer?.presets;
        const secs = Array.isArray(list)
          ? [
              ...new Set(
                list
                  .filter(isNum)
                  .map((v) => Math.floor(Number(v)))
                  .filter((v) => v > 0),
              ),
            ]
          : [];
        return secs.map((v) => ({ value: String(v), label: durationText(v), icon: null }));
      },
      current: () => null,
      set: (v, ent) => call(ent, "timer", "start", { duration: Number(v) }),
    },
  ],
  media_player: [
    {
      key: "volume_level",
      kinds: ["slider", "stepper"],
      stepperStep: 5,
      range: (ent, st) => {
        const v = numAttr(st, "volume_level");
        return pct(ent, v === null ? null : Math.round(v * 100));
      },
      set: (v, ent) => call(ent, "media_player", "volume_set", { volume_level: Number(v) / 100 }),
    },
    modeOf("media_player", "source", "select_source", "source_list"),
    modeOf("media_player", "sound_mode", "select_sound_mode", "sound_mode_list"),
  ],
  vacuum: [modeOf("vacuum", "fan_speed", "set_fan_speed", "fan_speed_list")],
  fan: [
    {
      // the speed: a slider, or segments of its steps
      key: "percentage",
      kinds: ["segments", "slider", "select", "stepper"],
      applies: (st) => numAttr(st, "percentage") !== null || st?.state === "off",
      range: (ent, st) => pct(ent, fanPct(st), numAttr(st, "percentage_step")),
      options: (_e, st) => fanSpeeds(st),
      // the segment nearest to the fan's percentage, among the options drawn (own or speeds)
      current: (ent, st) => {
        const p = fanPct(st);
        if (p === null) return null;
        let best: ControlOption | null = null;
        for (const o of optionsOf(ent, st)) {
          const v = Number(o.value);
          if (!Number.isFinite(v)) continue;
          if (best === null || Math.abs(v - p) < Math.abs(Number(best.value) - p)) best = o;
        }
        return best?.value ?? String(p);
      },
      // (a slider's value is rounded, an option's taken as written)
      set: (v, ent) =>
        Number(v) <= 0
          ? call(ent, "fan", "turn_off")
          : call(ent, "fan", "set_percentage", {
              percentage: typeof v === "number" ? Math.round(v) : Number(v),
            }),
    },
    {
      key: "preset_mode",
      kinds: ["segments", "select"],
      attributeLabels: true,
      options: listOf("preset_modes"),
      set: (v, ent) => call(ent, "fan", "set_preset_mode", { preset_mode: v }),
    },
    {
      key: "oscillating",
      kinds: ["toggle"],
      applies: (st) => typeof st?.attributes?.oscillating === "boolean",
      on: (st) => st?.attributes?.oscillating === true,
      toggle: (ent, st) =>
        call(ent, "fan", "oscillate", { oscillating: st?.attributes?.oscillating !== true }),
      set: () => null,
    },
    {
      key: "direction",
      kinds: ["segments", "select"],
      attributeLabels: true,
      applies: (st) => typeof st?.attributes?.direction === "string",
      options: () => [
        { value: "forward", label: null, icon: "mdi:rotate-right" },
        { value: "reverse", label: null, icon: "mdi:rotate-left" },
      ],
      set: (v, ent) => call(ent, "fan", "set_direction", { direction: v }),
    },
  ],
  climate: [
    temperatureOf("climate"),
    {
      key: "hvac_mode",
      state: true,
      kinds: ["segments", "select"],
      options: (_e, st) =>
        strList(st?.attributes?.hvac_modes).map((v) => ({
          value: v,
          label: null,
          icon: HVAC_ICON[v] ?? null,
        })),
      set: (v, ent) => call(ent, "climate", "set_hvac_mode", { hvac_mode: v }),
    },
    climateMode("preset_mode", "set_preset_mode", "preset_modes"),
    climateMode("fan_mode", "set_fan_mode", "fan_modes"),
    climateMode("swing_mode", "set_swing_mode", "swing_modes"),
    climateMode("swing_horizontal_mode", "set_swing_horizontal_mode", "swing_horizontal_modes"),
    humidityOf("climate"),
  ],
  humidifier: [
    humidityOf("humidifier"),
    modeOf("humidifier", "mode", "set_mode", "available_modes"),
  ],
  water_heater: [
    temperatureOf("water_heater"),
    {
      // (its operation mode is its state)
      key: "operation_mode",
      state: true,
      kinds: ["segments", "select"],
      applies: (st) => strList(st?.attributes?.operation_list).length > 0,
      options: listOf("operation_list"),
      set: (v, ent) => call(ent, "water_heater", "set_operation_mode", { operation_mode: v }),
    },
  ],
  alarm_control_panel: [
    {
      key: null,
      state: true,
      kinds: ["segments", "select"],
      options: (_e, st) => alarmModes(st),
      set: (v, ent) =>
        v === "disarmed"
          ? call(ent, "alarm_control_panel", "alarm_disarm")
          : call(ent, "alarm_control_panel", `alarm_arm_${String(v).replace(/^armed_/, "")}`),
    },
  ],
  counter: [
    {
      // a step up increments it, a step down decrements it, by its own step
      key: null,
      kinds: ["stepper"],
      range: (ent, st) => ({
        min: ent.min ?? numAttr(st, "minimum") ?? -1e9,
        max: ent.max ?? numAttr(st, "maximum") ?? 1e9,
        step: numAttr(st, "step") ?? 1,
        value: st && isNum(st.state) ? Number(st.state) : null,
        unit: "",
      }),
      // (by the step's own direction: the state may not have caught up with the step before)
      set: (v, ent, st, dir) =>
        call(
          ent,
          "counter",
          (dir ?? (Number(v) < Number(st?.state) ? -1 : 1)) < 0 ? "decrement" : "increment",
        ),
    },
  ],
  number: [
    {
      key: null,
      kinds: ["slider", "stepper"],
      range: (ent, st) => stateRange(ent, st),
      set: (v, ent) => call(ent, "number", "set_value", { value: v }),
    },
  ],
  input_number: [
    {
      key: null,
      kinds: ["slider", "stepper"],
      range: (ent, st) => stateRange(ent, st),
      set: (v, ent) => call(ent, "input_number", "set_value", { value: v }),
    },
  ],
  select: [
    {
      key: null,
      state: true,
      kinds: ["select", "segments"],
      options: listOf("options"),
      set: (v, ent) => call(ent, "select", "select_option", { option: v }),
    },
  ],
  input_select: [
    {
      key: null,
      state: true,
      kinds: ["select", "segments"],
      options: listOf("options"),
      set: (v, ent) => call(ent, "input_select", "select_option", { option: v }),
    },
  ],
};

// every attribute some domain's control can set (what `control_attribute` may name)
export const TARGET_KEYS: readonly string[] = [
  ...new Set(
    Object.values(TARGETS).flatMap((ts) => ts.map((t) => t.key).filter((k) => k !== null)),
  ),
];
// the attributes a domain's controls can set, its default first
export const targetKeysOf = (domain: string): string[] =>
  (TARGETS[domain] ?? []).map((t) => t.key).filter((k): k is string => k !== null);
// the domain's modes: what a control sets where the card shows it (a thermostat's preset, a
// speaker's source), as the controls always took a shown mode; a level or a position never
export const modeKeysOf = (domain: string): string[] =>
  (TARGETS[domain] ?? [])
    .filter((t) => t.key !== null && t.options && !t.range && !t.favorites && !t.optionButtons)
    .map((t) => t.key as string);
// what a control of these types sets unless it names another: the shown mode where it is one of
// them, else the first (a switch's power, a domain's own buttons)
export const attributeDefault = (
  domain: string,
  drawn: readonly string[],
  shown: unknown,
  ownButtons = false,
): string | undefined => {
  const choices = attributeChoices(domain, drawn, undefined, ownButtons);
  return typeof shown === "string" && modeKeysOf(domain).includes(shown) && choices.includes(shown)
    ? shown
    : choices[0];
};
// what controls of these types can set on the domain, the one they set by default first; a switch's
// own is the entity's power ("power", never written)
export const attributeChoices = (
  domain: string,
  drawn: readonly string[],
  // the entity's state where known: only what it has (a thermostat without swing modes)
  st?: HassEntity,
  // the domain has buttons of its own: buttons draw those unless they name what they set (a
  // timer's, else its presets: "buttons", never written)
  ownButtons = false,
): string[] => {
  const ts = (TARGETS[domain] ?? []).filter(
    (t) =>
      t.key !== null &&
      drawn.some((k) => t.kinds.includes(k as ControlKind)) &&
      (!st || !t.applies || t.applies(st)),
  );
  const out = ts.map((t) => t.key as string);
  if (drawn.includes("toggle") && out.length && !drawn.some((k) => k !== "toggle"))
    return ["power", ...out];
  if (ownButtons && drawn.includes("buttons") && ts.some((t) => t.optionButtons))
    return ["buttons", ...out];
  return out;
};

// what the entity's control sets: its attribute where the domain has it, else the domain's first
// (null: a domain with nothing to set). `need` asks for one that takes that input: a stepper on a
// thermostat whose control names its mode still sets the temperature
// The control's own type picks among them where it names none: segments on a light are its
// favourite colours, a select its effects
export const targetOf = (
  ent: EntityItem,
  need?: "range" | "options",
  kind?: ControlKind,
): Target | null => {
  const ts = ent.entity ? TARGETS[domainOf(ent.entity)] : undefined;
  if (!ts || !ts.length) return null;
  const a = ent.control?.attribute ?? null;
  const fits = (t: Target) => !need || !!t[need];
  const named = a === null ? undefined : ts.find((t) => t.key === a);
  if (named && fits(named)) return named;
  // (a type picks only what it draws: a slider on a counter, which only steps, sets nothing)
  return kind
    ? (ts.find((t) => fits(t) && t.kinds.includes(kind)) ?? null)
    : (ts.find(fits) ?? null);
};
// the attribute the entity's control sets, as its options are read and written (null: none, or
// its state)
export const targetKeyOf = (ent: EntityItem) => targetOf(ent)?.key ?? null;

// the options of segments / select: the config list, else the entity's own
export const optionsOf = (
  ent: EntityItem,
  st: HassEntity | undefined,
  reg?: RegistryOptions | null,
  kind?: ControlKind,
): ControlOption[] => {
  if (ent.control?.options) return ent.control.options;
  const t = targetOf(ent, "options", kind);
  return t?.options ? t.options(ent, st, reg) : plain(strList(st?.attributes?.options));
};
// whether a control of this type reads the entity's favourites in the registry (fetched for it)
export const readsFavorites = (ent: EntityItem, kind?: ControlKind) =>
  !ent.control?.options && !!targetOf(ent, "options", kind)?.favorites;
// the option that is active now
export const currentOptionOf = (
  ent: EntityItem,
  st: HassEntity | undefined,
  kind?: ControlKind,
): string | null => {
  if (!st) return null;
  const t = targetOf(ent, "options", kind);
  if (t?.current) return t.current(ent, st);
  if (t && t.key !== null && !t.state) {
    const v = st.attributes?.[t.key];
    return v === null || v === undefined ? null : String(v);
  }
  return st.state;
};
