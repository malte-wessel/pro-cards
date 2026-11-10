// Controls (pure): what `control: …` means per entity, where a control sits in each row kind,
// the value range, the option list and the service a control calls. No DOM here; the builders
// in render/controls.ts draw what these functions decide.
import { domainOf, stateActive } from "../color.ts";
import type { ActionConfig, ActionKind, HapticType, HassEntity, HomeAssistant } from "../ha.ts";
import type { Visibility } from "../visibility.ts";
import type { StringKey } from "../i18n.ts";
import { numOrNull, oneOf, snapTo } from "../util.ts";
import type { EntityItem, NormalizeCtx, RawEntity } from "./config.ts";
import { OFF_STATES } from "./constants.ts";
import { numAttr } from "./look.ts";
import {
  TARGET_KEYS,
  speedCount,
  stateRange,
  targetKeyOf,
  modeKeysOf,
  targetKeysOf,
  targetOf,
  MAX_SPEED_SEGMENTS,
} from "./targets.ts";

export { currentOptionOf, optionsOf, HVAC_ICON, MAX_SPEED_SEGMENTS } from "./targets.ts";

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
  "date",
  "none",
] as const;
export type ControlName = (typeof CONTROLS)[number];
export type ControlKind = Exclude<ControlName, "auto" | "none">;
export const CONTROL_POSITIONS = ["end", "block", "lead"] as const;
export type ControlPosition = (typeof CONTROL_POSITIONS)[number];
// the Home Assistant attribute a control sets (`control_attribute`): every domain's, in targets.ts
export const CONTROL_ATTRIBUTES = TARGET_KEYS;
export type ControlAttribute = string;
// how a kind card's switch, button, buttons and segments show what is on or chosen: filled in its
// colour with a white icon, or tinted (its colour at 20 %, the icon in its colour)
export const CONTROL_VARIANTS = ["fill", "tinted"] as const;
export type ControlVariant = (typeof CONTROL_VARIANTS)[number];

export interface ControlOption {
  value: string;
  label: string | null;
  icon: string | null;
  // a colour swatch in its place (a light's favourite colour: the label is its name)
  color?: string;
}
// a button of `control: buttons` from `control_options`: runs its entity (or its own action), in its own colour
export interface CustomButton {
  entity: string | null;
  icon: string | null;
  label: string | null;
  color: string | null;
  action: ActionConfig | null;
  // drawn only while its conditions hold (null: always)
  visibility: Visibility;
}
// the control as written in YAML, after normalisation (`auto` is resolved at render time)
export interface ControlConfig {
  kind: "auto" | ControlKind;
  position: ControlPosition | null;
  // the attribute the control sets (targets.ts): `control_attribute`, else the displayed attribute
  // where the domain can set it, else null (the domain's first)
  attribute: ControlAttribute | null;
  step: number | null;
  options: ControlOption[] | null;
  // `control: buttons` with `control_options`: the buttons drawn (null: the domain's own)
  buttons: CustomButton[] | null;
  // `control: buttons` with `control_options` naming the domain's buttons: those, in that order
  buttonIds?: ButtonId[] | null;
  confirm: boolean;
  // what is on or chosen, filled or tinted (null: filled; a kind card's alone)
  variant: ControlVariant | null;
  // drawn as the poster's and the tile's: rounded squares of one height, the switch a button,
  // a slider a bar (the entity cards' keep their look of before)
  square?: boolean;
  // what `auto` draws when a card's kind decides it (the poster's kinds), in place of the domain's
  defaults?: Placement[];
}
// one drawn control: its kind, slot and size; `confirm` makes every button of a group a hold
export interface Placement {
  kind: ControlKind;
  position: ControlPosition;
  small: boolean;
  confirm?: boolean;
  // drawn in a rounded square of the controls' height (a kind card's; a badge's switch round)
  square?: boolean;
  // a slider drawn as a bar (a kind card's)
  thick?: boolean;
  // what is on or chosen tinted rather than filled (`variant: tinted`)
  tinted?: boolean;
}
// the row kinds the fill functions draw (the `.row` classes; items split by their layout)
export type RowKind =
  "tile" | "poster" | "list" | "hero" | "cell" | "item-row" | "item-column" | "field" | "hval";
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
export type ButtonId =
  | "open"
  | "stop"
  | "close"
  | "tilt_open"
  | "tilt_stop"
  | "tilt_close"
  | "previous"
  | "play_pause"
  | "next"
  | "start_pause"
  | "clean_spot"
  | "locate"
  | "dock"
  | "lock"
  | "unlock"
  | "open_door"
  | "decrement"
  | "reset"
  | "increment"
  | "start"
  | "pause"
  | "cancel"
  | "finish"
  | "skip"
  | "install";
export interface ControlButton {
  id: ButtonId;
  icon: string;
  labelKey: StringKey;
  primary: boolean;
  // always a hold, whatever `confirm` says (a lock's door opener)
  confirm?: boolean;
  // the supported_features bit it needs (an entity that reports its features without it: left out)
  feature?: number;
  // greyed out now, as Home Assistant's are (a lock that is locked cannot lock)
  disabled?: (st: HassEntity | undefined) => boolean;
}
export type ControlInput =
  // (`attribute`: a placed switch flips what its control sets, a fan's oscillation; else power)
  | { type: "toggle"; attribute?: boolean }
  | { type: "value"; value: number }
  // (a stepper's own step: a volume's 5 % where its slider moves by 1)
  | { type: "step"; dir: 1 | -1; from: number; step?: number }
  // (the control that chose it: segments on a light set a favourite colour, a select its effect)
  | { type: "option"; value: string; kind?: ControlKind }
  | { type: "button"; id: ButtonId }
  | { type: "press" }
  // a day (YYYY-MM-DD) for a date entity; a date and time's new instant (ISO), its time kept
  | { type: "date"; value: string; datetime?: string }
  | { type: "hold" };

// a service call in flight: the control shows `value` as a ghost until the entity's state object
// changes or `until` passes; a sticky entry only expires (the chip's "Done")
export interface Pending {
  until: number;
  value?: number | string;
  sticky?: boolean;
  // a custom button's own call: its key (`c<i>`) and the entity whose answer ends it
  key?: string;
  entity?: string | null;
}
// the icon's own actions (the poster's `icon_tap_action`, `icon_hold_action`,
// `icon_double_tap_action`; null: none): `toggle` is run by the card, the rest by Home Assistant
export interface IconActions {
  tap: ActionConfig | null;
  hold: ActionConfig | null;
  dbl: ActionConfig | null;
}
// what the control builders need from the card element
export interface ControlHost {
  pending: ReadonlyMap<number, Pending>;
  // the calls of custom buttons, one per button (`index:c<i>`)
  buttonPending: ReadonlyMap<string, Pending>;
  // hold buttons armed by a first press (screen readers): until when, by `index:button` (`hold`,
  // the icon's `icon`, a confirmed group's button id or `c<i>`)
  armed: Map<string, number>;
  call(
    el: HTMLElement,
    idx: number,
    ent: EntityItem,
    svc: ServiceCall | null,
    pending?: Pending,
    haptic?: HapticType,
  ): void;
  beginDrag(idx: number): void;
  // redraws the card (a select that kept its row while it was open)
  redraw(): void;
  endDrag(idx: number): void;
  runAction(ent: EntityItem, a: ActionConfig | undefined, kind: ActionKind): void;
}

export const HOLD_CONFIRM_MS = 1000;
export const ARM_MS = 5000;
export const PENDING_MS = 5000;
export const DONE_MS = 1500;

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
// `toggle: true` is the old spelling of `control: toggle`; `control_options` are the options of
// segments and select, or the buttons of `control: buttons`
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
  // a name no control sets is an error; one another domain's control sets is left out, as ever
  // (the poster's and the tile's config names the entity's own: kinds/config.ts)
  if (
    ca !== undefined &&
    ca !== null &&
    (typeof ca !== "string" || !CONTROL_ATTRIBUTES.includes(ca))
  )
    throw new Error(
      `${ctx.type}: ${label}.control_attribute must be one of ${CONTROL_ATTRIBUTES.join(" | ")}`,
    );
  const domain = typeof raw.entity === "string" && raw.entity ? domainOf(raw.entity) : "";
  const cv = raw.control_variant;
  if (cv !== undefined && cv !== null && !oneOf(CONTROL_VARIANTS, cv))
    throw new Error(
      `${ctx.type}: ${label}.control_variant must be one of ${CONTROL_VARIANTS.join(" | ")}`,
    );
  const shown = raw.attribute;
  const step = numOrNull(raw.control_step);
  return {
    kind,
    position: oneOf(CONTROL_POSITIONS, pos) ? pos : null,
    // (the shown attribute where it is one of the domain's modes: a thermostat showing its preset
    // sets its preset; a tilt or a humidity shown changes nothing a control does)
    attribute:
      typeof ca === "string" && targetKeysOf(domain).includes(ca)
        ? ca
        : typeof shown === "string" && modeKeysOf(domain).includes(shown)
          ? shown
          : null,
    step: step !== null && step > 0 ? step : null,
    options: kind === "buttons" ? null : normalizeOptions(raw.control_options),
    // filled in by normalizeEntity, which parses the actions of the buttons
    buttons: null,
    confirm: !!raw.control_confirm,
    variant: oneOf(CONTROL_VARIANTS, cv) ? cv : null,
  };
};

// ----- placement -----

const BLOCK_ROWS: ReadonlySet<RowKind> = new Set(["tile", "poster", "list", "hero", "cell"]);
const SMALL_ROWS: ReadonlySet<RowKind> = new Set(["cell", "item-column", "field", "hval"]);
// kinds that can stand in for the lead of a row item
const LEAD_KINDS: ReadonlySet<ControlKind> = new Set(["toggle", "button", "hold"]);
// the controls drawn in rounded squares on a kind card: all but the slider (the switch a button
// with the power icon)
export const SQUARE_KINDS: ReadonlySet<ControlKind> = new Set([
  "date",
  "toggle",
  "stepper",
  "segments",
  "buttons",
  "button",
  "select",
  "hold",
]);
// the controls that show something on or chosen, filled or tinted (`variant`)
export const VARIANT_KINDS: ReadonlySet<ControlKind> = new Set([
  "toggle",
  "button",
  "buttons",
  "segments",
]);
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
      return targetKeyOf(ent) === "preset_mode"
        ? [p("segments", "end")]
        : [p("toggle", "end"), p("segments", "end")];
    case "cover":
      return [p("buttons", "end"), p("slider", "block")];
    case "climate":
      // (a mode it names: its segments; else the target temperature)
      return targetOf(ent)?.options ? [p("segments", "end")] : [p("stepper", "end")];
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
    // (the domains without a kind: what `control: auto` draws for them)
    case "humidifier":
      return [p("toggle", "end"), p("slider", "block")];
    case "water_heater":
    case "counter":
      return [p("stepper", "end")];
    case "valve":
      return [p("toggle", "end"), p("slider", "block")];
    case "timer":
    case "update":
      return [p("buttons", "end")];
    case "date":
    case "datetime":
      return [p("date", "end")];
    case "input_datetime":
      return [p("date", "end")];
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
  if (!c) return [];
  // a header badge holds a switch and nothing else (normalizeHeaderEntities); a current card's
  // badge (a pill) a round button, filled while on
  if (row === "hval")
    return c.kind === "toggle"
      ? [{ kind: "toggle", position: "end", small: true, ...(ent.pill ? { square: true } : {}) }]
      : [];
  // auto keeps the domain's own slots; a kind's controls (a poster's, a tile's) put their primary
  // (the first) where the card says: control: { position } changes the kind's own controls
  let list: Placement[] =
    c.kind === "auto"
      ? c.defaults
        ? c.defaults.map((x, i) => (i === 0 && c.position ? { ...x, position: c.position } : x))
        : defaultPlacements(ent)
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
    // a row without room under the line keeps auto's primary control alone (a cover's buttons,
    // not a slider squeezed beside them)
    if (c.kind === "auto" && position === "block" && !BLOCK_ROWS.has(row) && list.length > 1)
      continue;
    if (position === "lead" && !LEAD_KINDS.has(kind)) position = "end";
    if (position === "block" && !BLOCK_ROWS.has(row)) position = "end";
    if (row === "item-row") {
      if (!LEAD_KINDS.has(kind)) continue;
      position = "lead";
    }
    // a table field and a ring cell have no icon to stand in for: the control goes to the end
    if (position === "lead" && (row === "field" || (row === "cell" && ent.visual === "ring")))
      position = "end";
    if (out.some((o) => o.position === position && position !== "end")) continue;
    out.push({
      kind,
      position,
      small: SMALL_ROWS.has(row),
      ...(x.confirm ? { confirm: true } : {}),
      // (one standing in for the icon keeps the icon's circle)
      ...(c.square && SQUARE_KINDS.has(kind) && position !== "lead" ? { square: true } : {}),
      ...(c.square && kind === "slider" ? { thick: true } : {}),
      ...(c.square && c.variant === "tinted" && VARIANT_KINDS.has(kind) ? { tinted: true } : {}),
    });
  }
  return out;
};
// whether the entity draws any control in a tile (its height follows the content then: a control
// on the line wraps under the name when the tile is narrow)
export const hasTileControl = (ent: EntityItem) => placementsOf(ent, "tile").length > 0;
// controls on a tile's line wider than a switch: below 6 columns they do not fit beside the icon
const WIDE_ON_LINE: ReadonlySet<ControlKind> = new Set([
  "stepper",
  "segments",
  "buttons",
  "select",
  "button",
  "slider",
]);
// on a vertical tile, across it under the name: a stepper, a select, buttons and speeds take 6
// columns (a third of a phone's section is less than three buttons), a switch, a hold, a slider or
// a Run chip fit its 3
const WIDE_ACROSS: ReadonlySet<ControlKind> = new Set(["stepper", "select", "buttons", "segments"]);
// the narrowest a tile may get in a sections grid (min_columns): what sits on its line decides
// (a switch or hold needs 4 columns, anything wider 6); controls under the line or on the icon
// need nothing more than the tile itself (3). A vertical tile has its controls under the name
// (WIDE_ACROSS)
export const tileMinColumns = (ent: EntityItem, vertical = false) => {
  const end = placementsOf(ent, "tile").filter((p) => p.position === "end");
  if (vertical) {
    return end.some((p) => WIDE_ACROSS.has(p.kind)) ? 6 : 3;
  }
  if (end.some((p) => WIDE_ON_LINE.has(p.kind))) return 6;
  return end.length ? 4 : 3;
};
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
// whether the entity draws a control below its line in a tile (for the card height)
export const hasBlockControl = (ent: EntityItem) =>
  placementsOf(ent, "tile").some((p) => p.position === "block");

// ----- state helpers -----

// what pressing an entity does, by domain: run it (its state is the time of the last run) or
// switch it (its state says on or off)
const PRESS_KINDS: Record<string, "run" | "switch"> = {
  script: "run",
  scene: "run",
  button: "run",
  input_button: "run",
  light: "switch",
  switch: "switch",
  input_boolean: "switch",
  fan: "switch",
  media_player: "switch",
  cover: "switch",
  lock: "switch",
  alarm_control_panel: "switch",
  group: "switch",
  automation: "switch",
  humidifier: "switch",
  valve: "switch",
};
export const pressKindOf = (id: string | null | undefined) =>
  (id && PRESS_KINDS[domainOf(id)]) || null;
// whether the entity can take a call: its state decides, never the value the row shows (an off
// light shown by its brightness attribute has no value, and is still a light to turn on)
export const canControlId = (id: string | null, st: HassEntity | undefined) =>
  // a script, scene or button that was never run reports `unknown`: no reason to grey it out
  !!st && st.state !== "unavailable" && (st.state !== "unknown" || pressKindOf(id) === "run");
export const canControl = (ent: EntityItem, st: HassEntity | undefined) =>
  canControlId(ent.entity, st);
// whether a switch shows on: the attribute it flips (a fan's oscillation), else the entity
export const onOf = (ent: EntityItem, st: HassEntity | undefined, attribute = false): boolean => {
  const t = attribute ? targetOf(ent) : null;
  return t?.on ? !!st && st.state !== "unavailable" && t.on(st) : isOn(st);
};
// the day a date entity is on (YYYY-MM-DD), as its state says: a date's, an input_datetime's with
// a date (its time after it), a date and time's in the given zone; null when it has none
export const dateOf = (ent: EntityItem, st: HassEntity | undefined, tz?: string): string | null => {
  const s = st?.state ?? "";
  const d = domainOf(ent.entity);
  if (d === "date" || (d === "input_datetime" && st?.attributes?.has_date !== false)) {
    const m = /^(\d{4}-\d{2}-\d{2})/.exec(s);
    return m ? m[1] : null;
  }
  if (d !== "datetime") return null;
  const t = Date.parse(s);
  if (!Number.isFinite(t)) return null;
  try {
    // (en-CA writes a day as YYYY-MM-DD)
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz, dateStyle: "short" }).format(t);
  } catch {
    return new Date(t).toISOString().slice(0, 10);
  }
};
// whether a call wants a code first, as Home Assistant asks for one: a lock with a code format, an
// alarm panel disarmed with one or armed where arming needs it (`target` the option it sets, or a
// lock's or panel's button). The card opens Home Assistant's dialog for it instead
export const wantsCode = (ent: EntityItem, st: HassEntity | undefined, target?: string) => {
  const a = st?.attributes;
  if (!a?.code_format) return false;
  switch (domainOf(ent.entity)) {
    case "lock":
      return true;
    case "alarm_control_panel":
      return target === "disarmed" || target === "disarm" || a.code_arm_required !== false;
    default:
      return false;
  }
};
export const isOn = (st: HassEntity | undefined): boolean => {
  if (!st || st.state === "unavailable" || st.state === "unknown") return false;
  return stateActive(st) && !OFF_STATES.has(st.state);
};
// an on/off light without brightness, a cover without a position …: the slider has no value
export const sliderApplies = (ent: EntityItem, st: HassEntity | undefined): boolean => {
  const t = targetOf(ent, "range");
  return t?.applies ? t.applies(st) : true;
};

// the nearest valid value: steps are counted from the minimum, as Home Assistant counts them
// (min 1, step 2: 1, 3, 5 …), then held inside the bounds
export const clampStep = (v: number, r: Range) => snapTo(v, r.min, r.max, r.step);

// the slider / stepper range of the entity: value, bounds, step and unit of what it sets (a
// number's own scale where the domain sets nothing of its own: a sensor shown on a slider)
export const rangeOf = (
  ent: EntityItem,
  st: HassEntity | undefined,
  hass?: HomeAssistant,
  // the control drawing it: a stepper may step further than a slider (a volume's 5 %)
  kind?: ControlKind,
): Range => {
  const t = targetOf(ent, "range", kind);
  const r = t?.range ? t.range(ent, st, hass) : stateRange(ent, st);
  return kind === "stepper" && t?.stepperStep && ent.control?.step == null
    ? { ...r, step: t.stepperStep }
    : r;
};

// a fan's speed segments would be too many (percentage_step 1 makes 100): draw a slider
export const speedsAsSlider = (ent: EntityItem, st: HassEntity | undefined) =>
  domainOf(ent.entity) === "fan" &&
  targetKeyOf(ent) !== "preset_mode" &&
  !ent.control?.options &&
  speedCount(st) > MAX_SPEED_SEGMENTS;

// whether a custom button shows its entity as on (a scene's state is a time, never "on")
export const buttonActive = (b: CustomButton, st: HassEntity | undefined) =>
  pressKindOf(b.entity) === "switch" && isOn(st);
// the keys that name what a service call acts on, in `target` or in its data
const CALL_TARGET_KEYS = ["entity_id", "device_id", "area_id", "floor_id", "label_id"];
const namesTarget = (o: unknown) =>
  !!o && typeof o === "object" && CALL_TARGET_KEYS.some((k) => k in (o as object));
// the action a custom button runs: its entity is the action's entity (more-info, toggle) and, for
// a service call that names no target of its own, the target
export const actionOf = (b: CustomButton): ActionConfig => {
  const a = { ...(b.action as ActionConfig) };
  if (!b.entity) return a;
  a.entity ??= b.entity;
  // a call that names anything to act on keeps it: the button's entity would be added to it
  if (
    (a.action === "perform-action" || a.action === "call-service") &&
    !a.target &&
    !namesTarget(a.data) &&
    !namesTarget(a.service_data)
  )
    a.target = { entity_id: b.entity };
  return a;
};
// whether pressing a custom button runs something rather than switching it (a "done" flash)
export const buttonRuns = (b: CustomButton) => pressKindOf(b.entity) !== "switch";

const btn = (
  id: ButtonId,
  icon: string,
  o: Partial<Omit<ControlButton, "id" | "icon" | "labelKey">> & { label?: StringKey } = {},
): ControlButton => {
  const { label, ...rest } = o;
  return {
    id,
    icon,
    labelKey: label ?? (`control.button.${id}` as StringKey),
    primary: false,
    ...rest,
  };
};
const numState = (st: HassEntity | undefined) => (st ? Number(st.state) : NaN);
const at = (st: HassEntity | undefined, k: string) => numAttr(st, k);
const updateSkipped = (st: HassEntity | undefined) => {
  const a = st?.attributes;
  return !!a?.skipped_version && a.skipped_version === a.latest_version;
};
// every domain's buttons, in Home Assistant's order; `DEFAULT_BUTTONS` says which a group shows
// unless the card names its own
export const BUTTONS: Record<string, readonly ControlButton[]> = {
  cover: [
    btn("open", "mdi:arrow-up", { label: "control.open" }),
    btn("stop", "mdi:stop", { label: "control.stop" }),
    btn("close", "mdi:arrow-down", { label: "control.close" }),
    btn("tilt_open", "mdi:arrow-top-right", {
      feature: 16,
      disabled: (st) => at(st, "current_tilt_position") === 100,
    }),
    btn("tilt_stop", "mdi:stop", { feature: 64 }),
    btn("tilt_close", "mdi:arrow-bottom-left", {
      feature: 32,
      disabled: (st) => at(st, "current_tilt_position") === 0,
    }),
  ],
  valve: [
    btn("open", "mdi:valve-open", { feature: 1, label: "control.open" }),
    btn("stop", "mdi:stop", { feature: 8, label: "control.stop" }),
    btn("close", "mdi:valve-closed", { feature: 2, label: "control.close" }),
  ],
  media_player: [
    btn("previous", "mdi:skip-previous", { label: "control.previous" }),
    btn("play_pause", "mdi:play-pause", { primary: true, label: "control.play_pause" }),
    btn("next", "mdi:skip-next", { label: "control.next" }),
  ],
  vacuum: [
    btn("start_pause", "mdi:play-pause", { primary: true, label: "control.start_pause" }),
    btn("stop", "mdi:stop", {
      feature: 8,
      label: "control.stop",
      disabled: (st) => ["docked", "off", "idle"].includes(String(st?.state)),
    }),
    btn("clean_spot", "mdi:target-variant", { feature: 1024 }),
    btn("locate", "mdi:map-marker", { feature: 512 }),
    btn("dock", "mdi:home-import-outline", { label: "control.dock" }),
  ],
  lawn_mower: [
    btn("start_pause", "mdi:play-pause", { primary: true, label: "control.start_pause" }),
    btn("dock", "mdi:home-import-outline", { label: "control.dock" }),
  ],
  lock: [
    btn("lock", "mdi:lock", {
      disabled: (st) =>
        !st?.attributes?.assumed_state && ["locked", "locking"].includes(String(st?.state)),
    }),
    btn("unlock", "mdi:lock-open-variant", {
      disabled: (st) =>
        !st?.attributes?.assumed_state && ["unlocked", "unlocking"].includes(String(st?.state)),
    }),
    btn("open_door", "mdi:door-open", { feature: 1, confirm: true }),
  ],
  counter: [
    btn("decrement", "mdi:minus", {
      disabled: (st) => numState(st) <= (at(st, "minimum") ?? -Infinity),
    }),
    btn("reset", "mdi:restore"),
    btn("increment", "mdi:plus", {
      disabled: (st) => numState(st) >= (at(st, "maximum") ?? Infinity),
    }),
  ],
  timer: [
    btn("start", "mdi:play"),
    btn("pause", "mdi:pause", { disabled: (st) => st?.state !== "active" }),
    btn("cancel", "mdi:stop", { disabled: (st) => st?.state === "idle" }),
    btn("finish", "mdi:flag-checkered", { disabled: (st) => st?.state === "idle" }),
  ],
  update: [
    btn("skip", "mdi:cancel", {
      disabled: (st) => st?.state === "off" || updateSkipped(st) || !!st?.attributes?.in_progress,
    }),
    btn("install", "mdi:download", {
      feature: 1,
      disabled: (st) =>
        (st?.state === "off" && !updateSkipped(st)) || !!st?.attributes?.in_progress,
    }),
  ],
};
// what a domain's buttons show unless the card names them (a cover's tilt where its control sets
// the tilt)
const DEFAULT_BUTTONS: Record<string, readonly ButtonId[]> = {
  cover: ["open", "stop", "close"],
  cover_tilt: ["tilt_open", "tilt_stop", "tilt_close"],
  vacuum: ["start_pause", "dock"],
  lock: ["lock", "unlock"],
  timer: ["start", "pause", "cancel"],
};
// the ids a domain's buttons take (`control_options` naming them)
export const buttonIdsOf = (domain: string): ButtonId[] => (BUTTONS[domain] ?? []).map((b) => b.id);
// the ones it shows unless the card names them (a cover's tilt ones where it sets the tilt)
export const defaultButtonIds = (domain: string, tilt = false): ButtonId[] => [
  ...(DEFAULT_BUTTONS[tilt && domain === "cover" ? "cover_tilt" : domain] ?? buttonIdsOf(domain)),
];

// what buttons set instead of being the domain's own: a light's favourite colours (it has no
// buttons of its own), a timer's presets where the control names them
export const optionButtonsOf = (ent: EntityItem) => {
  const t = targetOf(ent, "options", "buttons");
  if (!t?.optionButtons) return null;
  if (ent.control?.attribute === t.key) return t;
  return BUTTONS[domainOf(ent.entity)]?.length ? null : t;
};
// the domain's buttons a control draws: those the card names, else the domain's default; an
// entity that reports its features shows only those it supports
export const buttonsOf = (ent: EntityItem, st?: HassEntity): ControlButton[] => {
  const d = domainOf(ent.entity);
  const all = BUTTONS[d] ?? [];
  const tilt = d === "cover" && targetKeyOf(ent) === "current_tilt_position";
  const ids = ent.control?.buttonIds ?? DEFAULT_BUTTONS[tilt ? "cover_tilt" : d] ?? null;
  const list = ids
    ? ids.map((id) => all.find((b) => b.id === id)).filter((b): b is ControlButton => !!b)
    : [...all];
  const f = numAttr(st, "supported_features");
  return f === null ? list : list.filter((b) => !b.feature || f & b.feature);
};

// ----- services -----

// what pressing an entity does: a run for scripts, scenes and buttons, a lock's next state, a
// cover's travel, power for the rest; null when the domain has nothing to press
export const actionServiceFor = (
  id: string | null,
  st: HassEntity | undefined,
): ServiceCall | null => {
  const kind = pressKindOf(id);
  if (!id || !kind) return null;
  const d = domainOf(id);
  const call = (domain: string, service: string) => ({
    domain,
    service,
    data: { entity_id: id },
  });
  if (kind === "run")
    return d === "script" || d === "scene" ? call(d, "turn_on") : call(d, "press");
  if (d === "lock") return st?.state === "locked" ? call("lock", "unlock") : call("lock", "lock");
  // an alarm panel arms away from disarmed and is disarmed from anything else
  if (d === "alarm_control_panel")
    return st?.state === "disarmed" ? call(d, "alarm_arm_away") : call(d, "alarm_disarm");
  if (d === "cover") return call("cover", "toggle");
  return call("homeassistant", "toggle");
};

// the service a control calls for `input`, or null when the domain has none that fits
export const serviceFor = (
  ent: EntityItem,
  st: HassEntity | undefined,
  input: ControlInput,
): ServiceCall | null => {
  const id = ent.entity;
  if (!id) return null;
  const d = domainOf(id);
  const call = (domain: string, service: string, data: Record<string, unknown> = {}) => ({
    domain,
    service,
    data: { entity_id: id, ...data },
  });
  switch (input.type) {
    case "toggle": {
      // a switch for an attribute flips it (a fan's oscillation), else the entity's power
      const t = input.attribute ? targetOf(ent) : null;
      return t?.toggle ? t.toggle(ent, st) : call("homeassistant", "toggle");
    }
    case "value":
    case "step": {
      const kind = input.type === "step" ? "stepper" : "slider";
      const r = rangeOf(ent, st, undefined, kind);
      const v =
        input.type === "value"
          ? clampStep(input.value, r)
          : clampStep(input.from + input.dir * (input.step ?? r.step), r);
      const t = targetOf(ent, "range", kind);
      return t ? t.set(v, ent, st, input.type === "step" ? input.dir : undefined) : null;
    }
    case "option": {
      const t = targetOf(ent, "options", input.kind);
      return t ? t.set(input.value, ent, st) : null;
    }
    case "button":
      switch (input.id) {
        // a cover's and a valve's travel
        case "open":
          return d === "valve" ? call("valve", "open_valve") : call("cover", "open_cover");
        case "stop":
          if (d === "valve") return call("valve", "stop_valve");
          if (d === "vacuum") return call("vacuum", "stop");
          return call("cover", "stop_cover");
        case "close":
          return d === "valve" ? call("valve", "close_valve") : call("cover", "close_cover");
        case "tilt_open":
          return call("cover", "open_cover_tilt");
        case "tilt_stop":
          return call("cover", "stop_cover_tilt");
        case "tilt_close":
          return call("cover", "close_cover_tilt");
        case "previous":
          return call("media_player", "media_previous_track");
        case "play_pause":
          return call("media_player", "media_play_pause");
        case "next":
          return call("media_player", "media_next_track");
        // a robot that works pauses, one that rests starts
        case "start_pause":
          if (d === "lawn_mower") return call(d, st?.state === "mowing" ? "pause" : "start_mowing");
          return call("vacuum", st?.state === "cleaning" ? "pause" : "start");
        case "dock":
          return d === "lawn_mower" ? call(d, "dock") : call("vacuum", "return_to_base");
        case "clean_spot":
        case "locate":
          return call("vacuum", input.id);
        case "lock":
        case "unlock":
          return call("lock", input.id);
        case "open_door":
          return call("lock", "open");
        case "decrement":
        case "reset":
        case "increment":
          return call("counter", input.id);
        case "start":
        case "pause":
        case "cancel":
        case "finish":
          return call("timer", input.id);
        case "skip":
        case "install":
          return call("update", input.id);
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
      return actionServiceFor(id, st);
    case "date": {
      if (d === "date") return call("date", "set_value", { date: input.value });
      if (d === "input_datetime") return call(d, "set_datetime", { date: input.value });
      if (d !== "datetime") return null;
      return call("datetime", "set_value", {
        datetime: input.datetime ?? `${input.value}T00:00:00`,
      });
    }
  }
};
