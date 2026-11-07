// The poster's and the tile's editor (pure): the card's config as the form's flat data and back.
// A place is a thing and its options in the form (`icon_thing` + `icon_ring` …); written back, it
// is the shortest YAML that draws the same: nothing for the kind's default, a name for a thing
// without options, `{ type, … }` else. Keys the form does not show are kept as written.
import { setOrDrop } from "../editor.ts";
import type { ControlKind } from "../entity/control.ts";
import type { CardConfigBase, HaFormData } from "../ha.ts";
import { isObj, placeDefaults } from "./config.ts";
import { canRead, INPUT_KEYS, kindKeysOf, unusedKeys } from "./detect.ts";
import { KINDS } from "./registry.ts";
import {
  ICON_OPTIONS,
  KIND_THINGS,
  VISUAL_OPTIONS,
  type IconThing,
  type VisualThing,
} from "./places.ts";
import type { Kind } from "./types.ts";

type Raw = Record<string, unknown>;
// the card the form edits: a poster, a tile, or a row of a tile group's table (a tile without its
// icon, its secondary and its badges, a badge's visual or a control after its value)
export type CardThing = "poster" | "tile" | "row";

// the select value of a place, a control or the kind the card leaves to its kind (written: nothing)
export const DEFAULT = "default";
export const DETECTED = "detected";
// a badge's, a rule's and a series' keys the list dialogs edit; the rest stays as written in
// their "more" field (YAML)
export const BADGE_KEYS = [
  "entity",
  "attribute",
  "value",
  "name",
  "kind",
  "icon",
  "icon_type",
  "icon_src",
  "icon_ring",
  "color",
  "visual",
  "hours",
  "control",
  "style",
  "size",
  "show_name",
  // how its value is written, its range, its actions
  "show_value",
  "format",
  "unit",
  "decimals",
  "prefix",
  "suffix",
  "min",
  "max",
  "tap_action",
  "hold_action",
  "double_tap_action",
  "hover",
] as const;
// the kinds whose colours a badge takes (the rest draw texts and places a badge has not)
export const BADGE_KINDS = [
  "battery",
  "carbon_dioxide",
  "pm25",
  "pm10",
  "aqi",
  "illuminance",
  "safety",
  "wind",
  "rain",
  "light",
  "climate",
  "weather",
] as const;
// a badge's icon place in its dialog: what it draws
export const BADGE_ICONS = ["icon", "image", "dot", "none"] as const;
export const RULE_KEYS = [
  "state",
  "above",
  "below",
  "color",
  "icon",
  "status",
  "tint_card",
  "style",
  "pulse",
] as const;
// an entity layer's rule (the weather's, the power and energy flows' home): its status is `label`
export const ENTITY_RULE_KEYS = [
  "state",
  "above",
  "below",
  "color",
  "icon",
  "label",
  "tint_card",
  "style",
  "pulse",
] as const;
// a badge's rule: when (state, above, below), then its colour, icon, a text in place of its value,
// its pill's style and a pulse
export const BADGE_RULE_KEYS = [
  "state",
  "above",
  "below",
  "color",
  "icon",
  "value",
  "style",
  "pulse",
] as const;
export const SERIES_KEYS = ["entity", "name", "color"] as const;
// a segments' or a select's option, and one of your own buttons
export const OPTION_KEYS = ["value", "label", "icon"] as const;
export const BUTTON_KEYS = ["entity", "label", "icon", "color", "action"] as const;
// the content keys, written as they are
const TEXTS = ["attribute", "value", "secondary", "unit", "prefix", "suffix"] as const;
const ACTIONS = ["tap_action", "hold_action", "double_tap_action"] as const;
// an action as the form's action picker takes it: a bare name (`tap_action: toggle`) as its object
const actionToForm = (v: unknown) => (typeof v === "string" ? { action: v } : v);

// what the kind draws in each place on this card, by default
export const defaultIcon = (kind: Kind): IconThing => kind.icon?.type ?? "icon";
export const defaultVisual = (kind: Kind, thing: CardThing): VisualThing | null => {
  // (a row draws a visual only where it names one)
  if (thing === "row") return null;
  const v = placeDefaults(kind, thing).visual;
  return v && v.type ? v.type : null;
};

// what `auto` draws for a domain where the kind brings no controls of its own
export const DOMAIN_AUTO: Record<string, readonly ControlKind[]> = {
  switch: ["toggle"],
  input_boolean: ["toggle"],
  lock: ["hold"],
  number: ["slider"],
  input_number: ["slider"],
  select: ["select"],
  input_select: ["select"],
  script: ["button"],
  scene: ["button"],
  button: ["button"],
  input_button: ["button"],
};
// the controls an entity's domain takes besides your own buttons, which any entity can carry
export const DOMAIN_CONTROLS: Record<string, readonly ControlKind[]> = {
  light: ["toggle", "slider", "hold"],
  switch: ["toggle", "hold"],
  input_boolean: ["toggle", "hold"],
  fan: ["toggle", "segments", "select", "slider"],
  cover: ["buttons", "slider", "hold"],
  climate: ["stepper", "segments", "select"],
  lock: ["hold", "toggle"],
  media_player: ["buttons", "slider", "toggle"],
  number: ["slider", "stepper"],
  input_number: ["slider", "stepper"],
  select: ["select", "segments"],
  input_select: ["select", "segments"],
  script: ["button", "hold"],
  scene: ["button", "hold"],
  button: ["button", "hold"],
  input_button: ["button", "hold"],
  vacuum: ["buttons"],
  lawn_mower: ["buttons"],
};
// what segments and a select set where the card names nothing: a thermostat's mode, a fan's speed
export const DEFAULT_ATTRIBUTE: Record<string, string> = { climate: "hvac_mode", fan: "speed" };
// the kind's own controls on this card (a tile's are those at the line's end)
// what `auto` draws for the card's entity where the kind brings no controls of its own: an object
// without a type means it too
const autoOf = (c: CardConfigBase, kind: Kind, thing: CardThing): readonly ControlKind[] =>
  typeof c.entity === "string" && !ownControls(kind, thing, c.entity).length
    ? (DOMAIN_AUTO[c.entity.split(".")[0]] ?? [])
    : [];
// (a row has no icon: what a tile controls with it, a switch, a lock, a select, is the domain's
// control at the row's end)
export const ownControls = (kind: Kind, thing: CardThing, entity?: unknown) => {
  const all = kind.controls ?? [];
  const own = all.filter((c) => thing === "poster" || c.position === "end");
  if (thing !== "row" || own.length) return own;
  // (a row's first control goes to its end where none is there)
  if (all.length) return [{ ...all[0], position: "end" as const }];
  if (typeof entity !== "string") return own;
  return (DOMAIN_AUTO[entity.split(".")[0]] ?? []).map((k) => ({
    kind: k,
    position: "end" as const,
  }));
};
// what a visual thing takes on this card (a row's are a badge's)
const ROW_VISUAL_OPTIONS: Record<string, readonly string[]> = {
  bar: [],
  sparkline: ["hours"],
  trend: ["hours"],
};
export const visualOptionsOf = (thing: CardThing): Record<string, readonly string[]> =>
  thing === "row" ? ROW_VISUAL_OPTIONS : VISUAL_OPTIONS;

const filled = (v: unknown) => v !== undefined && v !== null && v !== "";
// a select set to something other than its default
const chosen = (v: unknown) => filled(v) && v !== DEFAULT;

// the selects' values where the form has none: a cleared select is back at its default
const SELECT_DEFAULTS: Record<string, string> = {
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
  control_variant: DEFAULT,
  rules_from: DEFAULT,
};
export const withDefaults = (data: HaFormData): HaFormData => {
  const d = { ...data };
  for (const [k, v] of Object.entries(SELECT_DEFAULTS)) if (!filled(d[k])) d[k] = v;
  return d;
};
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

// an item of a list as written (an entity id, or an object) → the dialog's item: its keys, the
// others under `more`
const itemToForm = (x: unknown, keys: readonly string[], id = "entity"): Raw => {
  const o: Raw = typeof x === "string" ? { [id]: x } : isObj(x) ? { ...x } : {};
  const item: Raw = {};
  const more: Raw = {};
  for (const [k, v] of Object.entries(o)) {
    // an icon or a visual as an object (a place, a window) is the item's YAML
    const inForm = keys.includes(k) && !((k === "icon" || k === "visual") && typeof v !== "string");
    (inForm ? item : more)[k] = v;
  }
  if (Object.keys(more).length) item.more = more;
  return item;
};
// the dialog's item → the item as written; its `id` key alone (an entity, an option's value) is
// written as that value where `id` is given
const itemFromForm = (item: Raw, keys: readonly string[], id: string | null): unknown => {
  const { more, ...rest } = item;
  const o: Raw = {};
  for (const k of keys) if (filled(rest[k])) o[k] = rest[k];
  if (isObj(more)) for (const [k, v] of Object.entries(more)) if (!(k in o)) o[k] = v;
  const ks = Object.keys(o);
  return id && ks.length === 1 && ks[0] === id ? o[id] : o;
};
// a badge as written → its dialog's item: the icon place and the visual as flat fields (a picture's
// src, a window of today and the rest under `more`), the kind, the switch
const BADGE_PLAIN = [
  "entity",
  "attribute",
  "value",
  "name",
  "color",
  "style",
  "size",
  "show_name",
  "format",
  "unit",
  "decimals",
  "prefix",
  "suffix",
  "min",
  "max",
  "tap_action",
  "hold_action",
  "double_tap_action",
];
// (the value and the hover effect show unless turned off: only `false` is written)
const BADGE_ON = ["show_value", "hover"];
export const badgeToForm = (x: unknown): Raw => {
  const o: Raw = typeof x === "string" ? { entity: x } : isObj(x) ? { ...x } : {};
  const item: Raw = { kind: DETECTED, icon_type: "icon", show_value: true, hover: true };
  const more: Raw = {};
  const only = (v: Raw, keys: string[]) => Object.keys(v).every((k) => keys.includes(k));
  for (const [k, v] of Object.entries(o)) {
    if (k === "icon" && v === false) item.icon_type = "none";
    else if (k === "icon" && typeof v === "string") item.icon = v;
    else if (k === "icon" && isObj(v) && only(v, ["type", "name", "ring", "src"])) {
      if (typeof v.type === "string") item.icon_type = v.type;
      if (typeof v.name === "string") item.icon = v.name;
      if (v.ring === true) item.icon_ring = true;
      // (a picture's source, as written: a URL, a template or an entity)
      if (typeof v.src === "string") item.icon_src = v.src;
    } else if (k === "visual" && typeof v === "string") item.visual = v;
    else if (k === "visual" && isObj(v) && only(v, ["type", "hours"]) && v.hours !== "today") {
      item.visual = v.type;
      if (v.hours !== undefined) item.hours = v.hours;
    } else if (k === "control" && (v === "toggle" || (isObj(v) && only(v, ["type"]))))
      item.control = true;
    else if (k === "kind" && typeof v === "string") item.kind = v;
    else if (BADGE_ON.includes(k) && typeof v === "boolean") item[k] = v;
    // its rules as a list of their own (each in its form)
    else if (k === "rules" && Array.isArray(v)) item.rules = listToForm(v, BADGE_RULE_KEYS);
    else if (BADGE_PLAIN.includes(k)) item[k] = v;
    else more[k] = v;
  }
  if (Object.keys(more).length) item.more = more;
  return item;
};
// the dialog's item → the badge as written, the shortest spelling of what it says
export const badgeFromForm = (item: Raw): unknown => {
  const { more, kind, icon, icon_type, icon_src, icon_ring, visual, hours, control, rules } = item;
  const o: Raw = {};
  for (const k of BADGE_PLAIN) if (filled(item[k])) o[k] = item[k];
  // a kind that cannot read the badge's entity is left out (the entity's own is drawn): the card
  // would not take it
  const entity = typeof item.entity === "string" ? item.entity : null;
  if (
    filled(kind) &&
    kind !== DETECTED &&
    (kind === "none" || !KINDS[kind as string] || canRead(KINDS[kind as string], entity))
  )
    o.kind = kind;
  const type = filled(icon_type) ? icon_type : "icon";
  const name = filled(icon) ? { name: icon } : {};
  const ring = icon_ring === true && (type === "icon" || type === "image") ? { ring: true } : {};
  if (type === "none") o.icon = false;
  else if (type === "dot") o.icon = { type: "dot" };
  else if (type === "image")
    o.icon = { type: "image", ...name, ...ring, ...(filled(icon_src) ? { src: icon_src } : {}) };
  else if (icon_ring === true) o.icon = { ...name, ring: true };
  else if (filled(icon)) o.icon = icon;
  if (filled(visual))
    o.visual = num(hours) !== undefined && visual !== "bar" ? { type: visual, hours } : visual;
  if (control === true) o.control = "toggle";
  for (const k of BADGE_ON) if (item[k] === false) o[k] = false;
  if (Array.isArray(rules) && rules.length) o.rules = listFromForm(rules, BADGE_RULE_KEYS, null);
  if (isObj(more)) for (const [k, v] of Object.entries(more)) if (!(k in o)) o[k] = v;
  const ks = Object.keys(o);
  return ks.length === 1 && ks[0] === "entity" ? o.entity : o;
};
// ----- visibility: a list of conditions, each in its form -----
// the fields a condition's form has, by its type; the rest of it (another type's: user, location,
// and / or / not; a list of states) is its YAML
export const CONDITION_FIELDS: Record<string, readonly string[]> = {
  state: ["entity", "attribute", "state", "state_not"],
  numeric_state: ["entity", "attribute", "above", "below"],
  screen: ["media_query"],
  time: ["after", "before", "weekdays"],
  template: ["value_template"],
};
// a condition as written → its form: its type, the fields of that type it says as one value
export const conditionToForm = (x: unknown): Raw => {
  const o: Raw = isObj(x) ? { ...x } : {};
  const type = typeof o.condition === "string" ? o.condition : "state";
  const fields = CONDITION_FIELDS[type] ?? [];
  const item: Raw = { condition: type };
  const more: Raw = {};
  for (const [k, v] of Object.entries(o)) {
    if (k === "condition") continue;
    const plain =
      typeof v === "string" ||
      typeof v === "number" ||
      (k === "weekdays" && Array.isArray(v) && v.every((d) => typeof d === "string"));
    (fields.includes(k) && plain ? item : more)[k] = v;
  }
  if (Object.keys(more).length) item.more = more;
  return item;
};
export const conditionFromForm = (item: Raw): Raw => {
  const { condition, more, ...rest } = item;
  const o: Raw = { condition: typeof condition === "string" ? condition : "state" };
  for (const k of CONDITION_FIELDS[o.condition as string] ?? [])
    if (filled(rest[k]) && !(Array.isArray(rest[k]) && !(rest[k] as unknown[]).length))
      o[k] = rest[k];
  if (isObj(more)) for (const [k, v] of Object.entries(more)) if (!(k in o)) o[k] = v;
  return o;
};
// a visibility as written (one condition or a list) → its conditions' forms, and back as a list
export const conditionsToForm = (v: unknown): Raw[] =>
  (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]).map(conditionToForm);
export const conditionsFromForm = (v: unknown): Raw[] =>
  Array.isArray(v) ? (v as Raw[]).map(conditionFromForm) : [];
// a condition that says nothing beyond its type
export const conditionIsEmpty = (item: Raw): boolean => {
  const o = conditionFromForm(item);
  return Object.keys(o).length === 1;
};

// ----- a trend's lines: each in its form, its rules (when, its colour) and its visibility as
// lists of their own -----
export const LINE_RULE_KEYS = ["state", "above", "below", "color"] as const;
export const seriesToForm = (v: unknown): Raw[] =>
  Array.isArray(v)
    ? v.map((x) => {
        const o: Raw = typeof x === "string" ? { entity: x } : isObj(x) ? { ...x } : {};
        const { rules, visibility, ...rest } = o;
        const item = itemToForm(rest, SERIES_KEYS);
        item.rules = listToForm(rules, LINE_RULE_KEYS);
        item.visibility = conditionsToForm(visibility);
        return item;
      })
    : [];
export const seriesFromForm = (v: unknown): unknown[] =>
  Array.isArray(v)
    ? (v as Raw[]).map((item) => {
        const { rules, visibility, ...rest } = item;
        const line = itemFromForm(rest, SERIES_KEYS, null) as Raw;
        const r = listFromForm(rules, LINE_RULE_KEYS, null);
        if (r.length) line.rules = r;
        const shown = conditionsFromForm(visibility);
        if (shown.length) line.visibility = shown;
        const ks = Object.keys(line);
        return ks.length === 1 && ks[0] === "entity" ? line.entity : line;
      })
    : [];

// the same value, whatever order its keys come in
const sameValue = (a: unknown, b: unknown): boolean => {
  if (isObj(a) && isObj(b)) {
    const ka = Object.keys(a).filter((k) => a[k] !== undefined);
    const kb = Object.keys(b).filter((k) => b[k] !== undefined);
    return ka.length === kb.length && ka.every((k) => sameValue(a[k], b[k]));
  }
  if (Array.isArray(a) && Array.isArray(b))
    return a.length === b.length && a.every((x, i) => sameValue(x, b[i]));
  return a === b;
};
// the badges as written → the dialog's items
export const badgesToForm = (v: unknown): Raw[] => (Array.isArray(v) ? v.map(badgeToForm) : []);
// the dialog's badges → the badges as written: one whose fields are as a written one's keeps
// its spelling (wherever it moved), the others are written from their fields
export const badgesFromForm = (v: unknown, written: unknown): unknown[] => {
  const was = Array.isArray(written) ? written : [];
  const forms: (Raw | null)[] = was.map(badgeToForm);
  return (Array.isArray(v) ? (v as Raw[]) : []).map((item) => {
    const i = forms.findIndex((f) => f && sameValue(f, item));
    if (i < 0) return badgeFromForm(item);
    forms[i] = null;
    return was[i];
  });
};
export const listToForm = (v: unknown, keys: readonly string[], id = "entity") =>
  Array.isArray(v) ? v.map((x) => itemToForm(x, keys, id)) : [];
export const listFromForm = (v: unknown, keys: readonly string[], id: string | null) =>
  Array.isArray(v) ? (v as Raw[]).map((x) => itemFromForm(x, keys, id)) : [];

// the control's type in the form: none, the kind's own (also `auto` where the kind has controls),
// the domain's (`auto`, and options without a type where the kind has none) or the one named
const controlTypeOf = (c: CardConfigBase, kind: Kind, thing: CardThing): string => {
  const ctl = c.control;
  if (ctl === false) return "none";
  if (ctl === "auto" && kind.controls?.length) return DEFAULT;
  const type = typeof ctl === "string" ? ctl : isObj(ctl) ? ctl.type : undefined;
  if (typeof type === "string") return sameAsOwn(type, kind, thing) ? DEFAULT : type;
  return isObj(ctl) && autoOf(c, kind, thing).length ? "auto" : DEFAULT;
};
// the drawing a visual thing has unless told: the rain's drops, the wind's dots (a cover's follows
// its device class: none here)
export const visualVariant = (visual: string | null, kind: Kind, thing: CardThing) => {
  if (visual === "flow") return kind.name === "rain" ? "drops" : "dots";
  if (visual !== "strip") return undefined;
  // a strip: the kind's own drawing of it on this card (a door's along the edge), else a timeline
  const own = thing === "row" ? null : placeDefaults(kind, thing).visual;
  return (own && own.type === "strip" && own.variant) || "timeline";
};
// a control named that is all the kind draws itself (a cover's buttons): the kind's own
export const sameAsOwn = (type: string, kind: Kind, thing: CardThing) => {
  const own = ownControls(kind, thing);
  return own.length === 1 && own[0].kind === type;
};
// where the controls drawn sit unless told: the kind's first own control's place, else under the
// value for a slider and beside it for the rest
export const defaultPosition = (type: string, entity: unknown, kind: Kind, thing: CardThing) => {
  const first = type === DEFAULT ? ownControls(kind, thing, entity)[0]?.position : undefined;
  return first ?? (drawnControls(type, entity, kind, thing)[0] === "slider" ? "block" : "end");
};

// `kindRules`: the kind's rules as the card would write them (writtenRules: in the user's language
// and the sensor's unit), shown in the list while the card has none of its own
export const configToForm = (
  config: CardConfigBase,
  kind: Kind,
  thing: CardThing,
  kindRules: readonly Raw[] = [],
): HaFormData => {
  const c = config as Raw;
  const d: HaFormData = {
    entity: c.entity ?? "",
    kind: typeof c.kind === "string" ? c.kind : DETECTED,
    name: c.name ?? "",
    icon: "",
    color: c.color ?? "",
    decimals: num(c.decimals),
    min: num(c.min),
    max: num(c.max),
    show_name: c.show_name !== false,
    show_value: c.show_value !== false,
    hover: c.hover !== false,
    fill_height: c.fill_height !== false,
  };
  for (const k of TEXTS) d[k] = c[k] ?? "";
  for (const k of ACTIONS) if (c[k] !== undefined) d[k] = actionToForm(c[k]);

  // the icon: its thing, its options, its own actions and (a tile's) badge
  const icon = c.icon;
  let iconThing: string = DEFAULT;
  if (icon === false) iconThing = "none";
  else if (typeof icon === "string") {
    iconThing = "icon";
    d.icon = icon;
  } else if (isObj(icon)) {
    iconThing =
      typeof icon.type === "string" ? icon.type : icon.name !== undefined ? "icon" : DEFAULT;
    if (typeof icon.name === "string") d.icon = icon.name;
    d.icon_ring = icon.ring === true;
    d.icon_style = icon.style ?? "";
    d.icon_src = icon.src ?? "";
    d.icon_variant = icon.variant === kind.icon?.variant ? "" : (icon.variant ?? "");
    for (const k of ACTIONS) if (icon[k] !== undefined) d[`icon_${k}`] = actionToForm(icon[k]);
    const b = icon.badge;
    if (b === false || b === "none") d.icon_badge = "none";
    else if (isObj(b)) {
      d.icon_badge = "custom";
      d.icon_badge_icon = b.icon ?? "";
      d.icon_badge_color = b.color ?? "";
    }
  }
  d.icon_thing = iconThing === defaultIcon(kind) ? DEFAULT : iconThing;

  // the visual: its thing and its options
  const v = c.visual;
  let visualThing: string = DEFAULT;
  if (v === false) visualThing = "none";
  else if (typeof v === "string") visualThing = v;
  else if (isObj(v)) {
    visualThing = typeof v.type === "string" ? v.type : DEFAULT;
    d.visual_today = v.hours === "today";
    d.visual_hours = num(v.hours);
    d.visual_bucket = num(v.bucket);
    d.visual_smoothing = num(v.smoothing);
    d.visual_axis = v.axis === true;
    d.visual_src = v.src ?? "";
    d.visual_opacity = num(v.opacity);
    d.visual_tint = v.tint ?? "";
    d.visual_blur = v.blur === true ? 20 : v.blur === false ? 0 : num(v.blur);
    const drawn = visualThing === DEFAULT ? defaultVisual(kind, thing) : visualThing;
    d.visual_variant = v.variant === visualVariant(drawn, kind, thing) ? "" : (v.variant ?? "");
  }
  d.visual_thing = visualThing === defaultVisual(kind, thing) ? DEFAULT : visualThing;

  // the entities the kind reads besides the card's own, and its other keys
  const inputs = isObj(c.inputs) ? c.inputs : {};
  for (const def of kind.inputs ?? [])
    d[`input_${def.key}`] = typeof inputs[def.key] === "string" ? inputs[def.key] : "";
  d.running_above = num(c.running_above);
  d.series = seriesToForm(c.series);

  // the control: its thing (the kind's, none, auto or a control) and its options
  const ctl = c.control;
  d.control_type = controlTypeOf(c, kind, thing);
  if (isObj(ctl)) {
    // (the place it has anyway, written, is the default)
    d.control_position =
      ctl.position === undefined ||
      ctl.position === defaultPosition(d.control_type as string, c.entity, kind, thing)
        ? DEFAULT
        : ctl.position;
    d.control_step = num(ctl.step);
    // (the mode set by default, written, is the default)
    const domain = typeof c.entity === "string" ? c.entity.split(".")[0] : "";
    d.control_attribute =
      ctl.attribute === undefined || ctl.attribute === DEFAULT_ATTRIBUTE[domain]
        ? DEFAULT
        : ctl.attribute;
    d.control_confirm = ctl.confirm === true;
    // (the bar, written, is the default)
    d.control_variant = ctl.variant === "line" ? "line" : DEFAULT;
    // buttons' options as buttons, also on the kind's own (a cover's, written as Buttons)
    const drawn = drawnControls(d.control_type as string, c.entity, kind, thing);
    if (drawn.includes("buttons")) d.control_buttons = listToForm(ctl.options, BUTTON_KEYS);
    else d.control_options = listToForm(ctl.options, OPTION_KEYS, "value");
  }

  // the status, the badges, the rules
  if (c.status === false) d.hide_status = true;
  else d.status = c.status ?? "";
  d.status_badge = c.status_badge === true;
  d.badges = badgesToForm(c.badges);
  // the rules: the kind's (predefined) while the card writes none, else its own
  const predefined = c.rules === undefined && kindRules.length > 0;
  d.rules_from = predefined ? DEFAULT : "own";
  d.rules = listToForm(predefined ? kindRules : c.rules, RULE_KEYS);
  if (thing === "tile") {
    d.vertical = c.vertical === true;
    d.vertical_align = typeof c.vertical_align === "string" ? c.vertical_align : "center";
  }
  return withDefaults(d);
};

// each part of the config from the form: undefined leaves it out (the kind's default)
const iconFromForm = (data: HaFormData, kind: Kind, thing: CardThing): unknown => {
  if (data.icon_thing === "none") return false;
  const iconThing = (
    data.icon_thing === DEFAULT ? defaultIcon(kind) : data.icon_thing
  ) as IconThing;
  const takes = ICON_OPTIONS[iconThing] ?? [];
  const o: Raw = {};
  if (takes.includes("name") && filled(data.icon)) o.name = data.icon;
  if (takes.includes("ring") && data.icon_ring === true) o.ring = true;
  if (takes.includes("style") && data.icon_style === "plain") o.style = "plain";
  if (takes.includes("src") && filled(data.icon_src)) o.src = data.icon_src;
  if (takes.includes("variant") && chosen(data.icon_variant)) o.variant = data.icon_variant;
  for (const k of ACTIONS) if (isObj(data[`icon_${k}`])) o[k] = data[`icon_${k}`];
  if (thing === "tile" && data.icon_badge === "none") o.badge = false;
  else if (thing === "tile" && data.icon_badge === "custom") {
    const b: Raw = {};
    if (filled(data.icon_badge_icon)) b.icon = data.icon_badge_icon;
    if (filled(data.icon_badge_color)) b.color = data.icon_badge_color;
    o.badge = b;
  }
  // a thing other than the kind's, or a name on a picture (a name alone makes an icon)
  if (iconThing !== defaultIcon(kind) || (o.name !== undefined && iconThing !== "icon"))
    o.type = iconThing;
  // a name alone is always an icon: written as the name, whatever the kind draws there
  // (an icon where the kind draws something else keeps its type when nothing else says so)
  const ks = Object.keys(o).filter(
    (k) => !(k === "type" && o.type === "icon" && Object.keys(o).length > 1),
  );
  return !ks.length ? undefined : ks.length === 1 && ks[0] === "name" ? o.name : o;
};

const visualFromForm = (data: HaFormData, kind: Kind, thing: CardThing): unknown => {
  const byDefault = defaultVisual(kind, thing);
  if (data.visual_thing === "none") return byDefault ? false : undefined;
  const visualThing = (
    data.visual_thing === DEFAULT ? byDefault : data.visual_thing
  ) as VisualThing | null;
  if (!visualThing) return undefined;
  const takes = visualOptionsOf(thing)[visualThing] ?? [];
  const o: Raw = {};
  if (takes.includes("hours") && data.visual_today === true) o.hours = "today";
  else if (takes.includes("hours") && num(data.visual_hours) !== undefined)
    o.hours = data.visual_hours;
  for (const k of ["bucket", "smoothing", "opacity"] as const)
    if (takes.includes(k) && num(data[`visual_${k}`]) !== undefined) o[k] = data[`visual_${k}`];
  if (takes.includes("axis") && data.visual_axis === true) o.axis = true;
  for (const k of ["src", "tint", "variant"] as const)
    if (takes.includes(k) && chosen(data[`visual_${k}`])) o[k] = data[`visual_${k}`];
  if (takes.includes("blur") && num(data.visual_blur) !== undefined)
    o.blur = data.visual_blur === 0 ? false : data.visual_blur;
  const has = Object.keys(o).length > 0;
  if (visualThing === byDefault) return has ? o : undefined;
  return has ? { type: visualThing, ...o } : visualThing;
};

// an entity per input, else `false` as written (the form has no place for it); keys of another
// kind stay as written
const inputsFromForm = (data: HaFormData, kind: Kind, written: Raw): unknown => {
  const own = new Set((kind.inputs ?? []).map((d) => d.key));
  const out: Raw = {};
  for (const [k, v] of Object.entries(written)) if (!own.has(k)) out[k] = v;
  for (const def of kind.inputs ?? []) {
    const v = data[`input_${def.key}`];
    if (filled(v)) out[def.key] = v;
    else if (written[def.key] === false) out[def.key] = false;
  }
  return Object.keys(out).length ? out : undefined;
};

// the controls a control's type draws: the kind's own, the domain's (auto), or the one named
export const drawnControls = (
  type: string,
  entity: unknown,
  kind: Kind,
  thing: CardThing,
): readonly string[] =>
  type === DEFAULT
    ? ownControls(kind, thing, entity).map((c) => c.kind)
    : type === "auto"
      ? autoOf({ entity } as CardConfigBase, kind, thing)
      : type === "none"
        ? []
        : [type];

// only the options what it draws takes (a slider's step goes when it becomes a toggle)
const controlFromForm = (data: HaFormData, kind: Kind, thing: CardThing): unknown => {
  const type = data.control_type as string;
  if (type === "none") return false;
  const drawn = drawnControls(type, data.entity, kind, thing);
  const draws = (...ks: string[]) => drawn.some((c) => ks.includes(c));
  const o: Raw = {};
  if (drawn.length && chosen(data.control_position)) o.position = data.control_position;
  if (draws("slider", "stepper") && num(data.control_step) !== undefined)
    o.step = data.control_step;
  if (draws("segments", "select") && chosen(data.control_attribute))
    o.attribute = data.control_attribute;
  if (draws("toggle", "button", "buttons") && data.control_confirm === true) o.confirm = true;
  if (draws("slider") && chosen(data.control_variant)) o.variant = data.control_variant;
  const opts = draws("buttons")
    ? listFromForm(data.control_buttons, BUTTON_KEYS, null)
    : draws("segments", "select")
      ? listFromForm(data.control_options, OPTION_KEYS, "value")
      : [];
  if (opts.length) o.options = opts;
  const has = Object.keys(o).length > 0;
  // an object without a type changes the kind's own controls (or the domain's: auto)
  if (type === DEFAULT || type === "auto") return has ? o : type === "auto" ? "auto" : undefined;
  return has ? { type, ...o } : type;
};

// a config whose entity changed in the form, cut to what the new one takes: rules only for the
// same kind, an attribute it has
// (`attrs`, null while not known), a control its domain draws (your own buttons fit any), and the
// options of a place written without a thing that the kind's thing there takes (a wind's
// `variant` on a light's icon goes)
export const fitEntity = (
  config: CardConfigBase,
  kind: Kind,
  thing: CardThing,
  attrs: readonly string[] | null,
  // the kind before: rules are written for one kind's values (a wind's km/h, a light's on), so
  // another kind's own come in their place
  was: Kind = kind,
): CardConfigBase => {
  const c: Raw = { ...config };
  if (was.name !== kind.name) delete c.rules;
  const domain = typeof c.entity === "string" ? c.entity.split(".")[0] : "";
  if (typeof c.attribute === "string" && attrs && !attrs.includes(c.attribute)) delete c.attribute;
  const ctl = c.control;
  const type = typeof ctl === "string" ? ctl : isObj(ctl) ? ctl.type : undefined;
  if (
    typeof type === "string" &&
    type !== "auto" &&
    type !== "buttons" &&
    !(DOMAIN_CONTROLS[domain] ?? []).includes(type as ControlKind)
  )
    delete c.control;
  const places = {
    icon: [defaultIcon(kind), ICON_OPTIONS],
    visual: [defaultVisual(kind, thing), visualOptionsOf(thing)],
  } as const;
  for (const [place, [byDefault, options]] of Object.entries(places)) {
    const p = c[place];
    if (!isObj(p) || p.type !== undefined) continue;
    const takes: readonly string[] = byDefault
      ? ((options as Record<string, readonly string[]>)[byDefault] ?? [])
      : [];
    const kept = Object.fromEntries(Object.entries(p).filter(([k]) => takes.includes(k)));
    if (Object.keys(kept).length) c[place] = kept;
    else delete c[place];
  }
  return c as CardConfigBase;
};

export const formToConfig = (
  written: HaFormData,
  prev: CardConfigBase,
  kind: Kind,
  thing: CardThing,
  // the kind the config had: another one drops the keys and inputs only it read
  was: Kind = kind,
  // the kind's rules as the card would write them (configToForm's kindRules), for the config before
  // (its kind and entity) and now
  kindRules: { before: readonly Raw[]; now: readonly Raw[] } = { before: [], now: [] },
): CardConfigBase => {
  const data = withDefaults(written);
  const c: Raw = { ...prev };
  const p = prev as Raw;
  const put = (key: string, v: unknown) => {
    if (v === undefined) delete c[key];
    else c[key] = v;
  };
  // a part whose fields are as the config had them keeps its spelling as written: the editor
  // rewrites only what was changed
  // (the form shows the config as the kind it had read it: a kind changed since keeps the places
  // and controls written for the one before, where the new one draws them)
  const before = configToForm(prev, was, thing, kindRules.before);
  const changed = (prefix: string, also: readonly string[] = []) =>
    Object.keys({ ...before, ...data })
      .filter((k) => k.startsWith(prefix) || also.includes(k))
      .some((k) => JSON.stringify(before[k]) !== JSON.stringify(data[k]));

  setOrDrop(c, "entity", data.entity, !data.entity);
  setOrDrop(c, "kind", data.kind, !data.kind || data.kind === DETECTED);
  setOrDrop(c, "name", data.name, !data.name);
  setOrDrop(c, "color", data.color, !data.color);
  // (a text written empty stays while its field is: `unit: ""` hides the unit)
  for (const k of TEXTS) setOrDrop(c, k, data[k], !filled(data[k]) && !(p[k] === "" && !data[k]));
  // numbers as their fields have them (one written as text, `min: "10"`, stays until its field
  // changes)
  for (const k of ["decimals", "min", "max", "running_above"])
    if (changed(k)) setOrDrop(c, k, data[k], num(data[k]) === undefined);
  setOrDrop(c, "show_name", false, data.show_name !== false);
  setOrDrop(c, "show_value", false, data.show_value !== false);
  setOrDrop(c, "hover", false, data.hover !== false);
  setOrDrop(c, "fill_height", false, data.fill_height !== false);
  // (an action left as it was keeps its spelling: a bare name stays one)
  for (const k of ACTIONS)
    if (JSON.stringify(data[k]) !== JSON.stringify(actionToForm(p[k])))
      setOrDrop(c, k, data[k], !isObj(data[k]));
  if (changed("icon_", ["icon"])) put("icon", iconFromForm(data, kind, thing));
  if (changed("visual_")) put("visual", visualFromForm(data, kind, thing));
  if (changed("input_")) put("inputs", inputsFromForm(data, kind, isObj(p.inputs) ? p.inputs : {}));
  if (changed("series")) {
    const series = seriesFromForm(data.series);
    put("series", series.length ? series : undefined);
  }
  if (changed("control_")) put("control", controlFromForm(data, kind, thing));
  // a row draws a control or a visual: one chosen leaves the control out
  if (thing === "row" && chosen(data.visual_thing) && data.visual_thing !== "none")
    delete c.control;
  if (data.hide_status === true) c.status = false;
  else setOrDrop(c, "status", data.status, !filled(data.status));
  if (thing === "tile") setOrDrop(c, "status_badge", true, data.status_badge !== true);
  if (changed("badges")) {
    const badges = badgesFromForm(data.badges, p.badges);
    put("badges", badges.length ? badges : undefined);
  }
  // the rules: back to the kind's (predefined), or the list as the card's own, a copy of the
  // kind's on its first change; none of them (all deleted) is `rules: []` where the kind has some
  const same = (k: string) => JSON.stringify(before[k]) === JSON.stringify(data[k]);
  const list = () => {
    const rules = listFromForm(data.rules, RULE_KEYS, null);
    return rules.length ? rules : kindRules.now.length ? [] : undefined;
  };
  if (!same("rules_from")) put("rules", data.rules_from === DEFAULT ? undefined : list());
  else if (!same("rules")) put("rules", list());
  if (thing === "tile") setOrDrop(c, "vertical", true, data.vertical !== true);
  // (centre, the default, writes nothing; one left as written keeps its spelling)
  if (thing === "tile" && changed("vertical_align"))
    setOrDrop(
      c,
      "vertical_align",
      data.vertical_align,
      !chosen(data.vertical_align) || data.vertical_align === "center",
    );
  if (was.name !== kind.name) dropUnused(c, kind, was);
  return c as CardConfigBase;
};

// the keys and inputs `was` read and `kind` does not, and a place's thing only `was` draws (a
// config error on a written kind); others stay as written
const dropUnused = (c: Raw, kind: Kind, was: Kind) => {
  for (const place of ["icon", "visual"] as const) {
    const p = c[place];
    const type = typeof p === "string" ? p : isObj(p) ? p.type : undefined;
    if (typeof type === "string" && KIND_THINGS.includes(type) && !kind.draws?.includes(type))
      delete c[place];
  }
  const inputs: Raw = isObj(c.inputs) ? { ...c.inputs } : {};
  for (const k of unusedKeys(kind, kindKeysOf(c)).filter((k) => was.keys.includes(k))) {
    if (INPUT_KEYS.has(k)) delete inputs[k];
    else delete c[k];
  }
  if (isObj(c.inputs)) {
    if (Object.keys(inputs).length) c.inputs = inputs;
    else delete c.inputs;
  }
};
