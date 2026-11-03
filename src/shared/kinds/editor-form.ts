// The poster's and the tile's editor (pure): the card's config as the form's flat data and back.
// A place is a thing and its options in the form (`icon_thing` + `icon_ring` …); written back, it
// is the shortest YAML that draws the same: nothing for the kind's default, a name for a thing
// without options, `{ type, … }` else. Keys the form does not show are kept as written.
import { setOrDrop } from "../editor.ts";
import type { ControlKind } from "../entity/control.ts";
import type { CardConfigBase, HaFormData } from "../ha.ts";
import { isObj, placeDefaults } from "./config.ts";
import { INPUT_KEYS, kindKeysOf, unusedKeys } from "./detect.ts";
import {
  ICON_OPTIONS,
  KIND_THINGS,
  VISUAL_OPTIONS,
  type IconThing,
  type VisualThing,
} from "./places.ts";
import type { Kind } from "./types.ts";

type Raw = Record<string, unknown>;
export type CardThing = "poster" | "tile";

// the select value of a place, a control or the kind the card leaves to its kind (written: nothing)
export const DEFAULT = "default";
export const DETECTED = "detected";
// a badge's, a rule's and a series' keys the list dialogs edit; the rest stays as written in
// their "more" field (YAML)
export const BADGE_KEYS = [
  "entity",
  "name",
  "icon",
  "color",
  "visual",
  "style",
  "size",
  "show_name",
] as const;
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
export const SERIES_KEYS = ["entity", "name", "color"] as const;
// a segments' or a select's option, and one of your own buttons
export const OPTION_KEYS = ["value", "label", "icon"] as const;
export const BUTTON_KEYS = ["entity", "label", "icon", "color", "action"] as const;
// the content keys, written as they are
const TEXTS = ["attribute", "value", "secondary", "unit", "prefix", "suffix"] as const;
const ACTIONS = ["tap_action", "hold_action", "double_tap_action"] as const;

// what the kind draws in each place on this card, by default
export const defaultIcon = (kind: Kind): IconThing => kind.icon?.type ?? "icon";
export const defaultVisual = (kind: Kind, thing: CardThing): VisualThing | null => {
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
// what segments and a select set where the card names nothing: a thermostat's mode, a fan's speed
export const DEFAULT_ATTRIBUTE: Record<string, string> = { climate: "hvac_mode", fan: "speed" };
// the kind's own controls on this card (a tile's are those at the line's end)
// what `auto` draws for the card's entity where the kind brings no controls of its own: an object
// without a type means it too
const autoOf = (c: CardConfigBase, kind: Kind, thing: CardThing): readonly ControlKind[] =>
  typeof c.entity === "string" && !ownControls(kind, thing).length
    ? (DOMAIN_AUTO[c.entity.split(".")[0]] ?? [])
    : [];
export const ownControls = (kind: Kind, thing: CardThing) =>
  (kind.controls ?? []).filter((c) => thing === "poster" || c.position === "end");

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
    // a rule's icon as an object (a place) is the rule's YAML
    const inForm = keys.includes(k) && !(k === "icon" && typeof v !== "string");
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
const listToForm = (v: unknown, keys: readonly string[], id = "entity") =>
  Array.isArray(v) ? v.map((x) => itemToForm(x, keys, id)) : [];
const listFromForm = (v: unknown, keys: readonly string[], id: string | null) =>
  Array.isArray(v) ? (v as Raw[]).map((x) => itemFromForm(x, keys, id)) : [];

// the control's type in the form: none, the kind's own (also `auto` where the kind has controls),
// the domain's (`auto`, and options without a type where the kind has none) or the one named
const controlTypeOf = (c: CardConfigBase, kind: Kind, thing: CardThing): string => {
  const ctl = c.control;
  if (ctl === false) return "none";
  if (ctl === "auto" && kind.controls?.length) return DEFAULT;
  if (typeof ctl === "string") return ctl;
  if (isObj(ctl) && typeof ctl.type === "string") return ctl.type;
  return isObj(ctl) && autoOf(c, kind, thing).length ? "auto" : DEFAULT;
};

export const configToForm = (config: CardConfigBase, kind: Kind, thing: CardThing): HaFormData => {
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
  };
  for (const k of TEXTS) d[k] = c[k] ?? "";
  for (const k of ACTIONS) if (c[k] !== undefined) d[k] = c[k];

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
    d.icon_variant = icon.variant ?? "";
    for (const k of ACTIONS) if (icon[k] !== undefined) d[`icon_${k}`] = icon[k];
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
    d.visual_variant = v.variant ?? "";
  }
  d.visual_thing = visualThing === defaultVisual(kind, thing) ? DEFAULT : visualThing;

  // the entities the kind reads besides the card's own, and its other keys
  const inputs = isObj(c.inputs) ? c.inputs : {};
  for (const def of kind.inputs ?? [])
    d[`input_${def.key}`] = typeof inputs[def.key] === "string" ? inputs[def.key] : "";
  d.running_above = num(c.running_above);
  d.series = listToForm(c.series, SERIES_KEYS);

  // the control: its thing (the kind's, none, auto or a control) and its options
  const ctl = c.control;
  d.control_type = controlTypeOf(c, kind, thing);
  if (isObj(ctl)) {
    d.control_position = ctl.position ?? DEFAULT;
    d.control_step = num(ctl.step);
    // (the mode set by default, written, is the default)
    const domain = typeof c.entity === "string" ? c.entity.split(".")[0] : "";
    d.control_attribute =
      ctl.attribute === undefined || ctl.attribute === DEFAULT_ATTRIBUTE[domain]
        ? DEFAULT
        : ctl.attribute;
    d.control_confirm = ctl.confirm === true;
    if (ctl.type === "buttons") d.control_buttons = listToForm(ctl.options, BUTTON_KEYS);
    else d.control_options = listToForm(ctl.options, OPTION_KEYS, "value");
  }

  // the status, the badges, the rules
  if (c.status === false) d.hide_status = true;
  else d.status = c.status ?? "";
  d.status_badge = c.status_badge === true;
  d.badges = listToForm(c.badges, BADGE_KEYS);
  d.rules = listToForm(c.rules, RULE_KEYS);
  if (thing === "tile") d.vertical = c.vertical === true;
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
  const takes = VISUAL_OPTIONS[visualThing] ?? [];
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
    ? ownControls(kind, thing).map((c) => c.kind)
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
  const opts =
    type === "buttons"
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

export const formToConfig = (
  written: HaFormData,
  prev: CardConfigBase,
  kind: Kind,
  thing: CardThing,
  // the kind the config had: another one drops the keys and inputs only it read
  was: Kind = kind,
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
  const before = configToForm(prev, was, thing);
  const changed = (prefix: string, also: readonly string[] = []) =>
    Object.keys({ ...before, ...data })
      .filter((k) => k.startsWith(prefix) || also.includes(k))
      .some((k) => JSON.stringify(before[k]) !== JSON.stringify(data[k]));

  setOrDrop(c, "entity", data.entity, !data.entity);
  setOrDrop(c, "kind", data.kind, !data.kind || data.kind === DETECTED);
  setOrDrop(c, "name", data.name, !data.name);
  setOrDrop(c, "color", data.color, !data.color);
  for (const k of TEXTS) setOrDrop(c, k, data[k], !filled(data[k]));
  // numbers as their fields have them (one written as text, `min: "10"`, stays until its field
  // changes)
  for (const k of ["decimals", "min", "max", "running_above"])
    if (changed(k)) setOrDrop(c, k, data[k], num(data[k]) === undefined);
  setOrDrop(c, "show_name", false, data.show_name !== false);
  setOrDrop(c, "show_value", false, data.show_value !== false);
  setOrDrop(c, "hover", false, data.hover !== false);
  for (const k of ACTIONS) setOrDrop(c, k, data[k], !isObj(data[k]));
  if (changed("icon_", ["icon"])) put("icon", iconFromForm(data, kind, thing));
  if (changed("visual_")) put("visual", visualFromForm(data, kind, thing));
  if (changed("input_")) put("inputs", inputsFromForm(data, kind, isObj(p.inputs) ? p.inputs : {}));
  if (changed("series")) {
    const series = listFromForm(data.series, SERIES_KEYS, "entity");
    put("series", series.length ? series : undefined);
  }
  if (changed("control_")) put("control", controlFromForm(data, kind, thing));
  if (data.hide_status === true) c.status = false;
  else setOrDrop(c, "status", data.status, !filled(data.status));
  if (thing === "tile") setOrDrop(c, "status_badge", true, data.status_badge !== true);
  if (changed("badges")) {
    const badges = listFromForm(data.badges, BADGE_KEYS, "entity");
    put("badges", badges.length ? badges : undefined);
  }
  // no rules of your own brings the kind's back
  if (changed("rules")) {
    const rules = listFromForm(data.rules, RULE_KEYS, null);
    put("rules", rules.length ? rules : undefined);
  }
  if (thing === "tile") setOrDrop(c, "vertical", true, data.vertical !== true);
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
