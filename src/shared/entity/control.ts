// Controls (pure): what `control: …` means per entity, where a control sits in each row kind,
// the value range, the option list and the service a control calls. No DOM here; the builders
// in render/controls.ts draw what these functions decide.
import { domainOf, stateActive } from "../color.ts";
import type { ActionConfig, ActionKind, HapticType, HassEntity, HomeAssistant } from "../ha.ts";
import type { StringKey } from "../i18n.ts";
import { isNum, numOrNull, oneOf } from "../util.ts";
import type { EntityItem, NormalizeCtx, RawEntity } from "./config.ts";
import { OFF_STATES } from "./constants.ts";
import { numAttr, scaleOf } from "./look.ts";

export const CONTROLS = [
  "auto",
  "toggle",
  "slider",
  "stepper",
  "segments",
  "buttons",
  "button",
  "select",
  "hold",
  "none",
] as const;
export type ControlName = (typeof CONTROLS)[number];
export type ControlKind = Exclude<ControlName, "auto" | "none">;
export const CONTROL_POSITIONS = ["end", "block", "lead"] as const;
export type ControlPosition = (typeof CONTROL_POSITIONS)[number];
// the mode a segments / select control sets on a climate or fan entity (`control_attribute`)
export const CONTROL_ATTRIBUTES = ["hvac_mode", "preset_mode", "fan_mode"] as const;
export type ControlAttribute = (typeof CONTROL_ATTRIBUTES)[number];

export interface ControlOption {
  value: string;
  label: string | null;
  icon: string | null;
}
// the control as written in YAML, after normalisation (`auto` is resolved at render time)
export interface ControlConfig {
  kind: "auto" | ControlKind;
  position: ControlPosition | null;
  // what the control targets on a climate / fan: `control_attribute`, else the displayed
  // attribute when it is a mode, else the domain's main mode
  attribute: ControlAttribute | null;
  step: number | null;
  options: ControlOption[] | null;
  confirm: boolean;
}
// one drawn control: its kind, slot and size; `confirm` makes every button of a group a hold
export interface Placement {
  kind: ControlKind;
  position: ControlPosition;
  small: boolean;
  confirm?: boolean;
}
// the row kinds the fill functions draw (the `.row` classes; items split by their layout)
export type RowKind =
  "tile" | "list" | "hero" | "cell" | "item-row" | "item-column" | "field" | "hval";
export interface ServiceCall {
  domain: string;
  service: string;
  data: Record<string, unknown>;
}
export interface Range {
  min: number;
  max: number;
  step: number;
  value: number | null;
  unit: string;
}
export type ButtonId = "open" | "stop" | "close" | "previous" | "play_pause" | "next";
export interface ControlButton {
  id: ButtonId;
  icon: string;
  labelKey: StringKey;
  primary: boolean;
}
export type ControlInput =
  | { type: "toggle" }
  | { type: "value"; value: number }
  | { type: "step"; dir: 1 | -1; from: number }
  | { type: "option"; value: string }
  | { type: "button"; id: ButtonId }
  | { type: "press" }
  | { type: "hold" };

// a service call in flight: the control shows `value` as a ghost until the entity's state object
// changes or `until` passes; a sticky entry only expires (the chip's "Done")
export interface Pending {
  until: number;
  value?: number | string;
  sticky?: boolean;
}
// what the control builders need from the card element
export interface ControlHost {
  pending: ReadonlyMap<number, Pending>;
  // hold buttons armed by a first press (screen readers), by entity index: until when
  armed: Map<number, number>;
  readonly dragging: number | null;
  call(
    el: HTMLElement,
    idx: number,
    ent: EntityItem,
    svc: ServiceCall | null,
    pending?: Pending,
    haptic?: HapticType,
  ): void;
  beginDrag(idx: number): void;
  endDrag(idx: number): void;
  runAction(ent: EntityItem, a: ActionConfig | undefined, kind: ActionKind): void;
}

export const HOLD_CONFIRM_MS = 1000;
export const ARM_MS = 5000;
export const PENDING_MS = 5000;
export const DONE_MS = 1500;

export const HVAC_ICON: Record<string, string> = {
  off: "mdi:power",
  heat: "mdi:fire",
  cool: "mdi:snowflake",
  auto: "mdi:thermostat-auto",
  heat_cool: "mdi:sun-snowflake-variant",
  dry: "mdi:water-percent",
  fan_only: "mdi:fan",
};

// ----- config -----

const normalizeOptions = (list: unknown): ControlOption[] | null => {
  if (!Array.isArray(list)) return null;
  const out: ControlOption[] = [];
  for (const x of list) {
    if (x === null || x === undefined) continue;
    if (typeof x === "object") {
      const o = x as { value?: unknown; label?: unknown; icon?: unknown };
      if (o.value === undefined || o.value === null) continue;
      out.push({
        value: String(o.value),
        label: typeof o.label === "string" ? o.label : null,
        icon: typeof o.icon === "string" ? o.icon : null,
      });
    } else out.push({ value: String(x), label: null, icon: null });
  }
  return out.length ? out : null;
};

// `control` (a name, `true` = auto, `none` = nothing) with its `control_*` options;
// `toggle: true` is the old spelling of `control: toggle`
export const normalizeControl = (
  raw: RawEntity,
  ctx: NormalizeCtx,
  label: string,
): ControlConfig | null => {
  let kind: ControlName | null = null;
  const c = raw.control;
  if (c === true) kind = "auto";
  else if (c === false || c === "none") kind = null;
  else if (c !== undefined && c !== null) {
    if (!oneOf(CONTROLS, c))
      throw new Error(`${ctx.type}: ${label}.control must be one of ${CONTROLS.join(" | ")}`);
    kind = c;
  } else if (raw.toggle) kind = "toggle";
  if (kind === null || kind === "none") return null;
  const pos = raw.control_position;
  if (pos !== undefined && pos !== null && !oneOf(CONTROL_POSITIONS, pos))
    throw new Error(
      `${ctx.type}: ${label}.control_position must be one of ${CONTROL_POSITIONS.join(" | ")}`,
    );
  const ca = raw.control_attribute;
  if (ca !== undefined && ca !== null && !oneOf(CONTROL_ATTRIBUTES, ca))
    throw new Error(
      `${ctx.type}: ${label}.control_attribute must be one of ${CONTROL_ATTRIBUTES.join(" | ")}`,
    );
  const shown = raw.attribute;
  const step = numOrNull(raw.control_step);
  return {
    kind,
    position: oneOf(CONTROL_POSITIONS, pos) ? pos : null,
    attribute: oneOf(CONTROL_ATTRIBUTES, ca) ? ca : oneOf(CONTROL_ATTRIBUTES, shown) ? shown : null,
    step: step !== null && step > 0 ? step : null,
    options: normalizeOptions(raw.control_options),
    confirm: !!raw.control_confirm,
  };
};

// ----- placement -----

const BLOCK_ROWS: ReadonlySet<RowKind> = new Set(["tile", "list", "hero", "cell"]);
const SMALL_ROWS: ReadonlySet<RowKind> = new Set(["cell", "item-column", "field", "hval"]);
// kinds that can stand in for the lead of a row item
const LEAD_KINDS: ReadonlySet<ControlKind> = new Set(["toggle", "button", "hold"]);
// kinds a row / column / table item can hold at all (checked at config time, see normalizeGroup)
export const ITEM_CONTROLS: Record<string, ReadonlySet<ControlName>> = {
  row: new Set(["auto", "toggle", "button", "hold"]),
  column: new Set([
    "auto",
    "toggle",
    "slider",
    "stepper",
    "segments",
    "buttons",
    "button",
    "select",
    "hold",
  ]),
  table: new Set([
    "auto",
    "toggle",
    "slider",
    "stepper",
    "segments",
    "buttons",
    "button",
    "select",
    "hold",
  ]),
};

const modeAttr = (ent: EntityItem) => ent.control?.attribute ?? null;

// the domain default of `control: auto`, as (kind, position) pairs
export const defaultPlacements = (ent: EntityItem): Placement[] => {
  const p = (kind: ControlKind, position: ControlPosition): Placement => ({
    kind,
    position,
    small: false,
  });
  switch (domainOf(ent.entity)) {
    case "light":
      return [p("toggle", "end"), p("slider", "block")];
    case "switch":
    case "input_boolean":
      return [p("toggle", "end")];
    case "fan":
      return modeAttr(ent) === "preset_mode"
        ? [p("segments", "end")]
        : [p("toggle", "end"), p("segments", "end")];
    case "cover":
      return [p("buttons", "end"), p("slider", "block")];
    case "climate": {
      const a = modeAttr(ent);
      return a === "hvac_mode" || a === "preset_mode" || a === "fan_mode"
        ? [p("segments", "end")]
        : [p("stepper", "end")];
    }
    case "lock":
      return [p("hold", "end")];
    case "script":
    case "scene":
    case "button":
    case "input_button":
      return [p("button", "end")];
    case "input_select":
    case "select":
      return [p("select", "end")];
    case "input_number":
    case "number":
      return [p("slider", "block")];
    case "media_player":
      return [p("buttons", "end"), p("slider", "block")];
    default:
      return [];
  }
};

const defaultPosition = (kind: ControlKind, row: RowKind): ControlPosition => {
  if (row === "item-row") return "lead";
  if (kind === "slider") return BLOCK_ROWS.has(row) ? "block" : "end";
  return "end";
};

// the controls drawn for `ent` in a row of kind `row`: the explicit kind at its position, or the
// domain defaults; placements the row cannot hold are moved to the end slot or dropped
export const placementsOf = (ent: EntityItem, row: RowKind): Placement[] => {
  const c = ent.control;
  if (!c || row === "hval") return [];
  let list: Placement[] =
    c.kind === "auto"
      ? defaultPlacements(ent)
      : [{ kind: c.kind, position: c.position ?? defaultPosition(c.kind, row), small: false }];
  if (c.confirm) {
    // hold to confirm replaces the primary (toggle / button / hold); every button of a group
    // becomes a hold of its own; the slider stays
    const i = list.findIndex((x) => LEAD_KINDS.has(x.kind) || x.kind === "buttons");
    if (i >= 0)
      list[i] =
        list[i].kind === "buttons" ? { ...list[i], confirm: true } : { ...list[i], kind: "hold" };
    else if (list.length === 0) list = [{ kind: "hold", position: "end", small: false }];
  }
  const out: Placement[] = [];
  for (const x of list) {
    const { kind } = x;
    let { position } = x;
    if (position === "lead" && !LEAD_KINDS.has(kind)) position = "end";
    if (position === "block" && !BLOCK_ROWS.has(row)) position = "end";
    if (row === "item-row") {
      if (!LEAD_KINDS.has(kind)) continue;
      position = "lead";
    }
    if (out.some((o) => o.position === position && position !== "end")) continue;
    out.push({
      kind,
      position,
      small: SMALL_ROWS.has(row),
      ...(x.confirm ? { confirm: true } : {}),
    });
  }
  return out;
};
// whether the entity draws a control below its line in a tile (for the card height)
// whether a control on the line shows the row's own value itself (segments and a select show the
// mode, a Run chip is the value, a stepper shows the number it sets), so the text beside it would
// repeat it
export const controlShowsValue = (ent: EntityItem, p: Placement): boolean => {
  if (p.kind === "segments" || p.kind === "select" || p.kind === "button") return true;
  if (p.kind !== "stepper") return false;
  const v = ent.valueSrc;
  switch (domainOf(ent.entity)) {
    case "climate":
      return v.kind === "attribute" && v.key === "temperature";
    case "number":
    case "input_number":
      return v.kind === "state";
    default:
      return false;
  }
};
export const hasBlockControl = (ent: EntityItem) =>
  placementsOf(ent, "tile").some((p) => p.position === "block");

// ----- state helpers -----

export const isOn = (st: HassEntity | undefined): boolean => {
  if (!st || st.state === "unavailable" || st.state === "unknown") return false;
  return stateActive(st) && !OFF_STATES.has(st.state);
};
// an on/off light without brightness, a cover without a position …: the slider has no value
export const sliderApplies = (ent: EntityItem, st: HassEntity | undefined): boolean => {
  const d = domainOf(ent.entity);
  if (d === "light") {
    const modes = st?.attributes?.supported_color_modes;
    return !(Array.isArray(modes) && modes.length > 0 && modes.every((m) => m === "onoff"));
  }
  if (d === "cover") return numAttr(st, "current_position") !== null;
  if (d === "fan") return numAttr(st, "percentage") !== null || st?.state === "off";
  return true;
};

const round = (v: number, step: number) => {
  const dec = Math.min(4, (String(step).split(".")[1] || "").length);
  return Number((Math.round(v / step) * step).toFixed(dec));
};
export const clampStep = (v: number, r: Range) =>
  Math.min(r.max, Math.max(r.min, round(v, r.step)));

// the slider / stepper range of the entity: value, bounds, step and unit by domain
export const rangeOf = (
  ent: EntityItem,
  st: HassEntity | undefined,
  hass?: HomeAssistant,
): Range => {
  const step = ent.control?.step;
  const d = domainOf(ent.entity);
  const pct = (value: number | null, s: number | null) => ({
    min: ent.min ?? 0,
    max: ent.max ?? 100,
    step: step ?? s ?? 1,
    value,
    unit: "%",
  });
  switch (d) {
    case "light": {
      const b = numAttr(st, "brightness");
      return pct(st?.state === "off" ? 0 : b === null ? null : Math.round((b / 255) * 100), null);
    }
    case "cover":
      return pct(numAttr(st, "current_position"), null);
    case "media_player": {
      const v = numAttr(st, "volume_level");
      return pct(v === null ? null : Math.round(v * 100), null);
    }
    case "fan":
      return pct(
        st?.state === "off" ? 0 : numAttr(st, "percentage"),
        numAttr(st, "percentage_step"),
      );
    case "climate": {
      const unit = hass?.config?.unit_system?.temperature ?? "°C";
      return {
        min: ent.min ?? numAttr(st, "min_temp") ?? 7,
        max: ent.max ?? numAttr(st, "max_temp") ?? 35,
        step: step ?? numAttr(st, "target_temp_step") ?? 0.5,
        value: numAttr(st, "temperature"),
        unit,
      };
    }
    default: {
      const { min, max } = scaleOf(ent, st);
      const u = st?.attributes?.unit_of_measurement;
      return {
        min,
        max,
        step: step ?? numAttr(st, "step") ?? 1,
        value: st && isNum(st.state) ? Number(st.state) : null,
        unit: typeof u === "string" ? u : "",
      };
    }
  }
};

const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x) => x !== null && x !== undefined).map(String) : [];
// fan speeds from percentage_step: 0 (off), then every step up to 100
const fanSpeeds = (st: HassEntity | undefined): ControlOption[] => {
  const s = numAttr(st, "percentage_step");
  if (s === null || s <= 0) return [];
  const n = Math.max(1, Math.round(100 / s));
  const out: ControlOption[] = [{ value: "0", label: "", icon: "mdi:power" }];
  for (let i = 1; i <= n; i++)
    out.push({ value: String(Math.round((100 * i) / n)), label: String(i), icon: null });
  return out;
};

// the options of segments / select: the config list, else the entity's own modes
export const optionsOf = (ent: EntityItem, st: HassEntity | undefined): ControlOption[] => {
  if (ent.control?.options) return ent.control.options;
  const d = domainOf(ent.entity),
    a = modeAttr(ent);
  const plain = (vals: string[]) => vals.map((v) => ({ value: v, label: null, icon: null }));
  if (d === "climate") {
    if (a === "preset_mode") return plain(strList(st?.attributes?.preset_modes));
    if (a === "fan_mode") return plain(strList(st?.attributes?.fan_modes));
    return strList(st?.attributes?.hvac_modes).map((v) => ({
      value: v,
      label: null,
      icon: HVAC_ICON[v] ?? null,
    }));
  }
  if (d === "fan") {
    if (a === "preset_mode") return plain(strList(st?.attributes?.preset_modes));
    return fanSpeeds(st);
  }
  return plain(strList(st?.attributes?.options));
};
// the option that is active now
export const currentOptionOf = (ent: EntityItem, st: HassEntity | undefined): string | null => {
  if (!st) return null;
  const d = domainOf(ent.entity),
    a = modeAttr(ent);
  if (d === "fan" && a !== "preset_mode") {
    // the speed segment nearest to the fan's percentage
    if (st.state === "off") return "0";
    const p = numAttr(st, "percentage");
    if (p === null) return null;
    let best: ControlOption | null = null;
    for (const o of fanSpeeds(st))
      if (best === null || Math.abs(Number(o.value) - p) < Math.abs(Number(best.value) - p))
        best = o;
    return best?.value ?? String(p);
  }
  // the climate's hvac mode is its state; presets and fan modes are attributes
  if (a && a !== "hvac_mode") {
    const v = st.attributes?.[a];
    return v === null || v === undefined ? null : String(v);
  }
  return st.state;
};

export const buttonsOf = (ent: EntityItem): ControlButton[] => {
  switch (domainOf(ent.entity)) {
    case "cover":
      return [
        { id: "open", icon: "mdi:arrow-up", labelKey: "control.open", primary: false },
        { id: "stop", icon: "mdi:stop", labelKey: "control.stop", primary: false },
        { id: "close", icon: "mdi:arrow-down", labelKey: "control.close", primary: false },
      ];
    case "media_player":
      return [
        { id: "previous", icon: "mdi:skip-previous", labelKey: "control.previous", primary: false },
        { id: "play_pause", icon: "mdi:play-pause", labelKey: "control.play_pause", primary: true },
        { id: "next", icon: "mdi:skip-next", labelKey: "control.next", primary: false },
      ];
    default:
      return [];
  }
};

// ----- services -----

// the service a control calls for `input`, or null when the domain has none that fits
export const serviceFor = (
  ent: EntityItem,
  st: HassEntity | undefined,
  input: ControlInput,
): ServiceCall | null => {
  const id = ent.entity;
  if (!id) return null;
  const d = domainOf(id),
    a = modeAttr(ent);
  const call = (domain: string, service: string, data: Record<string, unknown> = {}) => ({
    domain,
    service,
    data: { entity_id: id, ...data },
  });
  switch (input.type) {
    case "toggle":
      return call("homeassistant", "toggle");
    case "value":
    case "step": {
      const r = rangeOf(ent, st);
      const v =
        input.type === "value"
          ? clampStep(input.value, r)
          : clampStep(input.from + input.dir * r.step, r);
      switch (d) {
        case "light":
          return v <= 0
            ? call("light", "turn_off")
            : call("light", "turn_on", { brightness_pct: Math.round(v) });
        case "cover":
          return call("cover", "set_cover_position", { position: Math.round(v) });
        case "media_player":
          return call("media_player", "volume_set", { volume_level: v / 100 });
        case "fan":
          return v <= 0
            ? call("fan", "turn_off")
            : call("fan", "set_percentage", { percentage: Math.round(v) });
        case "climate":
          return call("climate", "set_temperature", { temperature: v });
        case "number":
        case "input_number":
          return call(d, "set_value", { value: v });
        default:
          return null;
      }
    }
    case "option": {
      const o = input.value;
      switch (d) {
        case "climate":
          if (a === "preset_mode") return call("climate", "set_preset_mode", { preset_mode: o });
          if (a === "fan_mode") return call("climate", "set_fan_mode", { fan_mode: o });
          return call("climate", "set_hvac_mode", { hvac_mode: o });
        case "fan":
          if (a === "preset_mode") return call("fan", "set_preset_mode", { preset_mode: o });
          return Number(o) <= 0
            ? call("fan", "turn_off")
            : call("fan", "set_percentage", { percentage: Number(o) });
        case "select":
        case "input_select":
          return call(d, "select_option", { option: o });
        default:
          return null;
      }
    }
    case "button":
      switch (input.id) {
        case "open":
          return call("cover", "open_cover");
        case "stop":
          return call("cover", "stop_cover");
        case "close":
          return call("cover", "close_cover");
        case "previous":
          return call("media_player", "media_previous_track");
        case "play_pause":
          return call("media_player", "media_play_pause");
        case "next":
          return call("media_player", "media_next_track");
      }
      return null;
    case "press":
      switch (d) {
        case "script":
        case "scene":
          return call(d, "turn_on");
        case "button":
        case "input_button":
          return call(d, "press");
        default:
          return null;
      }
    case "hold":
      switch (d) {
        case "lock":
          return st?.state === "locked" ? call("lock", "unlock") : call("lock", "lock");
        case "cover":
          return call("cover", "toggle");
        case "script":
        case "scene":
        case "button":
        case "input_button":
          return serviceFor(ent, st, { type: "press" });
        case "light":
        case "switch":
        case "input_boolean":
        case "fan":
        case "media_player":
          return call("homeassistant", "toggle");
        default:
          return null;
      }
  }
};
