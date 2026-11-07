// Config shared by the cards that draw a kind (pure): the kind and its own keys, the card's item
// with the kind's defaults, rules and controls, the inputs the kind reads, the icon's own actions,
// and the two places (places.ts) as the card and its rules write them. The poster card adds its
// corner, the tile card its line.
import { domainOf } from "../color.ts";
import { oneOf } from "../util.ts";
import {
  normalizeAction,
  normalizeActionDefaults,
  normalizeBadge,
  normalizeEntity,
  normalizeValue,
  type EntityCardConfig,
  type EntityItem,
  type NormalizeCtx,
  type RawAction,
  type RawEntity,
  type RawEntityCardBase,
  type Rule,
  type ValueSrc,
} from "../entity/config.ts";
import { DEFAULTS, ITEM_DEFAULTS, type BadgeSize, type BadgeStyle } from "../entity/constants.ts";
import {
  CONTROL_ATTRIBUTES,
  CONTROL_VARIANTS,
  CONTROL_POSITIONS,
  normalizeControl,
  type IconActions,
} from "../entity/control.ts";
import type { ActionConfig, HassEntity, HomeAssistant } from "../ha.ts";
import { ATTRIBUTES } from "../weather/constants.ts";
import {
  INPUT_KEYS,
  kindKeysOf,
  parseKind,
  resolveKind,
  unusedKeys,
  unusedText,
  writtenInputs,
} from "./detect.ts";
import { deviceSiblings, findInput, logOnce } from "./discover.ts";
import {
  goneKey,
  idleOptions,
  mergePlace,
  parseIcon,
  parseVisual,
  unfitThings,
  type IconPlace,
  type PlaceDefaults,
  type VisualPlace,
  type Written,
} from "./places.ts";
import { badgeHours, normalizePill } from "./badge.ts";
import { toRule } from "./rules.ts";
import type { Kind } from "./types.ts";

export interface RawKindCardConfig extends RawEntityCardBase, RawEntity {
  // what the entity is (a kind's name; detected when left out)
  kind?: unknown;
  // the entities a kind reads besides the card's own: each an id, or false for none
  inputs?: unknown;
  // the appliance's threshold, the trend's entities
  running_above?: unknown;
  series?: unknown;
}

// a picture (src/shared/entity/image.ts: a badge's icon reads one too)
export { parseImage, type ImageSrc } from "../entity/image.ts";

// the two places as written (left out: the layer below's)
export interface Places {
  icon: Written<IconPlace>;
  visual: Written<VisualPlace>;
}

export interface KindConfig extends EntityCardConfig {
  kind: Kind;
  kindOpts: Record<string, unknown>;
  // the kind's inputs: key → item (not drawn as rows: read by the kind)
  inputs: Record<string, number>;
  // the visual's hours as written (null: the kind's window)
  hoursSet: number | null;
  // the places as the card writes them, and as each of its rules does (a rule's win while it
  // matches; the kind's are the defaults under the card's)
  places: Places;
  rulePlaces: Map<Rule, Places>;
  // the icon's own actions: as written, else the kind's (a lock's hold)
  iconActions: IconActions;
}

// the history the card fetches for its plots: the window of the visual it draws without a rule (the
// kind's, with the card's merged or in its place; today: a day), else the default; the card's
// bucket and smoothing where its visual names one
export const historyOf = (kind: Kind, places: Places) => {
  const base = mergePlace(kind.visual, places.visual);
  const h = base && base.hours !== undefined ? base.hours : undefined;
  const v = places.visual || undefined;
  return {
    hours: Math.max(1, h === undefined ? DEFAULTS.hours_to_show : h === "today" ? 24 : h),
    bucketMin: v?.bucket ?? DEFAULTS.bucket_minutes,
    smoothMin: v?.smoothing ?? null,
  };
};

// the input of `def` found on the entity's device, where the card sets none (an id, or false) and
// a weather entity has no attribute for it; null: none found
const foundInput = (
  def: NonNullable<Kind["inputs"]>[number],
  set: unknown,
  entity: string | null,
  hass: HomeAssistant | undefined,
): string | null => {
  if (set === false || (typeof set === "string" && set)) return null;
  if (!entity || !def.find || !hass || (domainOf(entity) === "weather" && def.weather)) return null;
  return findInput(hass, deviceSiblings(hass, entity), def.find);
};
// what the kind's inputs found on the device of the card's entity, as written (null: none): the
// card normalises again when one of them changes
export const foundInputs = (
  kind: Kind,
  written: Readonly<Record<string, unknown>>,
  hass: HomeAssistant | undefined,
): (string | null)[] => {
  const entity = typeof written.entity === "string" && written.entity ? written.entity : null;
  const set = writtenInputs(written);
  return (kind.inputs ?? []).map((def) => foundInput(def, set[def.key], entity, hass));
};

// a text as written: a boolean is a word YAML read as one (Off, No, On, Yes unquoted), an error that
// says so and, for a name and a value (`hides`: the card's or a badge's own), how to hide them
export const textOf = (
  v: unknown,
  key: string,
  type: string,
  hides: "name" | "value" | null = key === "name" || key === "value" ? key : null,
) => {
  if (typeof v !== "boolean") return;
  const hide = hides ? `to hide the ${hides}: show_${hides}: false; ` : "";
  throw new Error(
    `${type}: ${key} takes a text, not ${v} (${hide}a word such as ${v ? "On or Yes" : "Off or No"} is read as ${v} unless quoted: "${v ? "On" : "Off"}")`,
  );
};

// `inputs` as written: the entities a kind reads besides the card's own, each an id or false (not
// looked for on the device). They are keys of `inputs`, never of the card
const parseInputs = (written: Record<string, unknown>, type: string): Record<string, unknown> => {
  for (const k of INPUT_KEYS)
    if (written[k] !== undefined) throw new Error(`${type}: ${k} is inputs: { ${k}: … }`);
  const raw = written.inputs;
  if (raw === undefined || raw === null) return {};
  if (!isObj(raw))
    throw new Error(
      `${type}: inputs takes the kind's entities by their names (inputs: { direction: sensor.x, gust: false })`,
    );
  for (const [k, v] of Object.entries(raw)) {
    if (k === "running_above" || k === "series")
      throw new Error(`${type}: inputs: ${k} goes on the card, not in inputs`);
    if (!INPUT_KEYS.has(k))
      throw new Error(`${type}: inputs: ${k} is no kind's input (${[...INPUT_KEYS].join(", ")})`);
    if (v !== undefined && v !== null && v !== false && (typeof v !== "string" || !v))
      throw new Error(`${type}: inputs: ${k} takes an entity id or false`);
  }
  return raw;
};

// the kind's inputs as items: set on the card (an id; false drops it), else a weather entity's
// attribute, else found on the entity's device (said once in the console); none found: left out
const inputsOf = (
  kind: Kind,
  opts: Record<string, unknown>,
  entity: string | null,
  hass: HomeAssistant | undefined,
  ctx: NormalizeCtx,
  entities: EntityItem[],
): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const def of kind.inputs ?? []) {
    const set = opts[def.key];
    if (set === false) continue;
    let raw: RawEntity | null = null;
    if (typeof set === "string" && set) raw = { entity: set };
    else if (entity && domainOf(entity) === "weather" && def.weather)
      raw = { entity, attribute: def.weather };
    else {
      const found = foundInput(def, set, entity, hass);
      if (found) {
        raw = { entity: found };
        logOnce(
          `${ctx.type}: ${kind.name}: ${def.key} from ${found} (same device as ${entity}); set inputs: { ${def.key} } to choose another`,
        );
      }
    }
    if (!raw) continue;
    const item = normalizeEntity(raw, ctx, def.key);
    // a weather attribute keeps its unit in a sibling attribute (wind_gust_speed: wind_speed_unit)
    const attr = raw.attribute ? ATTRIBUTES[raw.attribute] : undefined;
    if (attr?.unitAttr) item.unitAttr = attr.unitAttr;
    out[def.key] = entities.push(item) - 1;
  }
  return out;
};

// a kind card's control: square unless written otherwise
export const shapeControl = (item: EntityItem) => {
  if (item.control) item.control = { ...item.control, variant: item.control.variant ?? "square" };
};

export const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

// an icon action as written, else the kind's; `none` (or neither) is null
const iconAction = (written: RawAction | undefined, own: ActionConfig | undefined) => {
  const a =
    written === undefined || written === null
      ? (own ?? null)
      : normalizeAction(written, { action: "none" });
  return a && a.action !== "none" ? a : null;
};
// whether the icon has an action of its own
export const hasIconActions = (a: IconActions) => !!(a.tap || a.hold || a.dbl);

// `control` as written: a control's name (as on the entity cards), true or false, or the control and
// its options (`{ type, position, attribute, step, options, confirm, variant }`; without `type` its options
// change the kind's own controls), as the entity cards' flat keys
const CONTROL_KEYS: Record<string, string> = {
  position: "control_position",
  attribute: "control_attribute",
  step: "control_step",
  options: "control_options",
  confirm: "control_confirm",
  variant: "control_variant",
};
const controlOf = (c: unknown, type: string): Partial<RawKindCardConfig> => {
  if (!isObj(c)) return {};
  const out: Record<string, unknown> = { control: c.type ?? "auto" };
  for (const [k, v] of Object.entries(c)) {
    if (k === "type" || v === undefined) continue;
    if (!(k in CONTROL_KEYS))
      throw new Error(
        `${type}: control takes type, ${Object.keys(CONTROL_KEYS).join(", ")}, not ${k}`,
      );
    out[CONTROL_KEYS[k]] = v;
  }
  if (c.position === "lead")
    throw new Error(
      `${type}: the icon's own actions are icon: { tap_action, hold_action }, not control: { position: lead }`,
    );
  // its values checked here, named as written (the entity cards' messages name their flat keys)
  if (c.position !== undefined && !oneOf(CONTROL_POSITIONS, c.position))
    throw new Error(
      `${type}: control: { position } must be one of ${CONTROL_POSITIONS.join(" | ")}`,
    );
  if (c.attribute !== undefined && !oneOf(CONTROL_ATTRIBUTES, c.attribute))
    throw new Error(
      `${type}: control: { attribute } must be one of ${CONTROL_ATTRIBUTES.join(" | ")}`,
    );
  if (c.variant !== undefined && !oneOf(CONTROL_VARIANTS, c.variant))
    throw new Error(`${type}: control: { variant } must be one of ${CONTROL_VARIANTS.join(" | ")}`);
  // (a slider and a switch have one shape; without a type, the kind's own controls take it)
  if (c.variant !== undefined && (c.type === "slider" || c.type === "toggle"))
    throw new Error(`${type}: control: { variant } shapes buttons, not a ${String(c.type)}`);
  return out as Partial<RawKindCardConfig>;
};

// the card's kind and its item, as a card that draws a kind reads them
export interface KindItem {
  kind: Kind;
  opts: Record<string, unknown>;
  // the config as written, with the kind's defaults where it says nothing
  raw: RawKindCardConfig;
  // the card's item as written (its `visibility` left out: Home Assistant's)
  own: RawEntity;
  entity: string | null;
  st: HassEntity | undefined;
  ctx: NormalizeCtx;
  // the card's item first, then the kind's inputs
  entities: EntityItem[];
  inputs: Record<string, number>;
  iconActions: IconActions;
  places: Places;
  rulePlaces: Map<Rule, Places>;
}

// the kind (written, else detected) and the card's item with what the kind gives it: its value
// where the card sets none, its rules, its controls, the icon's actions and the inputs it reads.
// `own` overrides keys of the item as written (a picture the card draws itself). `thing` names
// the card in messages (the poster card)
export const normalizeKindItem = (
  written: RawKindCardConfig,
  hass: HomeAssistant | undefined,
  type: string,
  thing: string,
  ownKeys: Partial<RawEntity> = {},
): KindItem => {
  // the keys the places replaced, on the card and in its rules
  const gone = goneKey(written as Record<string, unknown>);
  if (gone) throw new Error(`${type}: ${gone}`);
  const writtenRules = Array.isArray(written.rules) ? written.rules : [];
  for (const [i, r] of writtenRules.entries()) {
    const g = isObj(r) ? goneKey(r) : null;
    if (g) throw new Error(`${type}: rules[${i}]: ${g}`);
    // a rule's text is the status, as the card's
    if (isObj(r) && r.label !== undefined)
      throw new Error(`${type}: rules[${i}]: label is status on the ${thing}`);
    if (isObj(r)) textOf(r.status, `rules[${i}].status`, type);
  }
  // a text read as a boolean is a word YAML took for one (Off, No): an error, never a hidden part
  textOf(written.name, "name", type);
  textOf(written.value, "value", type);
  // one spelling each: auto (the kind's controls, else the domain's), false for none, an object
  // without a type for the kind's own with other options
  const ctl = written.control;
  if (ctl === true) throw new Error(`${type}: control: true is control: auto`);
  if (isObj(ctl) && ctl.type === "auto")
    throw new Error(
      `${type}: control: { type: auto, … } is control: { … }: without a type it changes the kind's own`,
    );
  if (ctl === "none") throw new Error(`${type}: control: none is control: false`);
  const writtenIn = parseInputs(written as Record<string, unknown>, type);
  // the icon's ring and its own actions are the icon's
  if (written.visual === "ring")
    throw new Error(`${type}: visual: ring is icon: { ring: true } on the ${thing}`);
  const control = controlOf(written.control, type);
  // the places as written, and the rules' (an icon object's name is the rule's icon)
  const places: Places = {
    icon: parseIcon(written.icon, `${type}: icon`),
    visual: parseVisual(written.visual, `${type}: visual`),
  };
  const flow = (p: Written<{ type?: string }>) => !!p && p.type === "flow";
  if (flow(places.icon) && flow(places.visual))
    throw new Error(`${type}: the animation goes in one place: icon or visual, not both`);
  const byRule = new Map<object, Places>();
  const rules = writtenRules.map((r, i) => {
    if (!isObj(r)) return r;
    const at = `${type}: rules[${i}]`;
    const p: Places = {
      icon: parseIcon(r.icon, `${at}.icon`, true),
      visual: parseVisual(r.visual, `${at}.visual`, true),
    };
    const out = {
      ...r,
      icon: p.icon ? p.icon.name : undefined,
      visual: undefined,
      label: r.status,
      status: undefined,
    };
    byRule.set(out, p);
    return out;
  });
  const named = parseKind(written.kind, type);
  const kind = resolveKind(
    named,
    written.entity || null,
    written.entity ? hass?.states[written.entity] : undefined,
    type,
  );
  // options that would do nothing, where the config alone decides it: on a written kind's places,
  // and in a rule over the card's own thing (a detected kind's are said once it is known)
  const ruleLayers = rules.map(
    (r): Places => (isObj(r) && byRule.get(r)) || { icon: undefined, visual: undefined },
  );
  const below = named ? placeDefaults(kind, thing) : null;
  const idle = [
    ...idleOptions(below, places, ruleLayers, type),
    ...(below ? unfitThings(below, places, ruleLayers, type) : []),
  ];
  if (idle.length) throw new Error(idle[0]);
  // keys the kind does not read: an error for a written kind (a detected one's are said once its
  // state is known)
  const unused = unusedKeys(kind, kindKeysOf(written as Record<string, unknown>));
  if (named && unused.length)
    throw new Error(
      `${type}: ${unusedText(kind, unused, kind.name === "none" ? `a ${thing} without a kind` : `the ${kind.name} kind`)}`,
    );
  // the kind's own keys, as written: its inputs in `inputs`, the rest on the card
  const opts: Record<string, unknown> = {};
  for (const k of kind.keys) {
    const v = INPUT_KEYS.has(k) ? writtenIn[k] : (written as Record<string, unknown>)[k];
    if (v !== undefined) opts[k] = v;
  }
  // the kind's defaults for the card's item: what it shows where the card sets neither `value`
  // nor `attribute`, and keys the card leaves out (a trend's first series as the entity)
  const defaults = kind.main?.(written.entity || null, written, opts) ?? {};
  const raw: RawKindCardConfig = {
    ...written,
    ...control,
    ...(Array.isArray(written.rules) ? { rules: rules as RawKindCardConfig["rules"] } : {}),
  };
  for (const [k, v] of Object.entries(defaults)) {
    const key = k as keyof RawEntity;
    if (key === "attribute" || key === "value") {
      if (written.value === undefined && written.attribute === undefined) raw[key] = v as never;
    } else if (raw[key] === undefined) raw[key] = v as never;
  }
  const entity = raw.entity || null;
  // without an entity there is no more-info to open: a tap does nothing unless it is told to. The
  // card answers the pointer as Home Assistant's tile does unless it says hover: false
  const none = { action: "none" };
  const ctx = {
    type,
    ...normalizeActionDefaults({
      ...raw,
      tap_action: raw.tap_action ?? (entity ? undefined : none),
      hold_action: raw.hold_action ?? (entity ? undefined : none),
      hover: raw.hover !== false,
    }),
  };
  // a card-level `visibility` is Home Assistant's (it hides the whole card); a card without an
  // entity or a value still has its name
  // the item draws no visual and no picture of its own: the places say what the card draws (the
  // card resolves them on every render); its icon is the place's name
  const own: RawEntity = {
    ...raw,
    visibility: undefined,
    value: raw.value ?? (entity || raw.attribute ? undefined : ""),
    icon: places.icon ? places.icon.name : undefined,
    visual: undefined,
    // icon: false leaves the icon out, as show_icon: false does
    ...(places.icon === false ? { show_icon: false } : {}),
    ...ownKeys,
  };
  const main = normalizeEntity(own, ctx, "the card", ITEM_DEFAULTS.other, { buttons: true });
  // the card's colour and icon are defaults: a matching rule's win
  main.ruleWins = true;
  const rulePlaces = new Map<Rule, Places>();
  for (const r of main.rules) {
    const p = r.src ? byRule.get(r.src) : undefined;
    if (p) rulePlaces.set(r, p);
  }
  // the kind's own rules, unless the card has its own (`rules: []` drops them)
  if (raw.rules === undefined && kind.rules) {
    main.rules = kind.rules.map(toRule);
    if (kind.ruleUnit) main.ruleUnit = kind.ruleUnit;
  }
  const st = entity ? hass?.states[entity] : undefined;
  // a kind's controls are on by default: `control: false` drops them, a name picks another
  if (
    kind.controls &&
    (raw.control === undefined || raw.control === true || raw.control === "auto")
  ) {
    const c = normalizeControl({ ...own, control: "auto" }, ctx, "the card");
    main.control = c && kind.controls.length ? { ...c, defaults: [...kind.controls] } : null;
  }
  // the poster's and the tile's controls are square unless the card says round (the entity
  // cards' have no variant: their look of before)
  shapeControl(main);

  // the icon's own actions, each as written or else the kind's
  const kindIcon = kind.iconActions?.(st) ?? {};
  const icon = places.icon || {};
  const iconActions: IconActions = {
    tap: iconAction(icon.tap_action as RawAction | undefined, kindIcon.tap),
    hold: iconAction(icon.hold_action as RawAction | undefined, kindIcon.hold),
    dbl: iconAction(icon.double_tap_action as RawAction | undefined, kindIcon.dbl),
  };

  const entities: EntityItem[] = [main];
  const inputs = inputsOf(kind, opts, entity, hass, ctx, entities);
  return {
    kind,
    opts,
    raw,
    own,
    entity,
    st,
    ctx,
    entities,
    inputs,
    iconActions,
    places,
    rulePlaces,
  };
};

// what a kind draws in a card's places where the card says nothing (a tile's visual may differ:
// none for a cover); `thing` names the card (a poster card)
export const placeDefaults = (kind: Kind, thing: string): PlaceDefaults => {
  const card = thing.replace(/ card$/, "");
  return {
    who:
      kind.name === "none"
        ? `a ${card} without a kind`
        : `${/^[aeiou]/.test(kind.name) ? "an" : "a"} ${kind.name} ${card}`,
    icon: kind.icon,
    visual: card === "tile" && kind.tileVisual !== undefined ? kind.tileVisual : kind.visual,
    draws: kind.draws ?? [],
  };
};

// the KindConfig keys a card's item gives, besides its entities and groups, and its history
export const kindConfigOf = (k: KindItem) => {
  const v = k.places.visual;
  return {
    ...historyOf(k.kind, k.places),
    kind: k.kind,
    kindOpts: k.opts,
    inputs: k.inputs,
    hoursSet: v && typeof v.hours === "number" ? v.hours : null,
    iconActions: k.iconActions,
    places: k.places,
    rulePlaces: k.rulePlaces,
  };
};

// the domains whose icon toggles them by default on a tile, as on Home Assistant's tile (its DOMAINS_TOGGLE),
// and those it presses (a toggle runs them: actionServiceFor)
export const TILE_ICON_TOGGLES: ReadonlySet<string> = new Set([
  "fan",
  "input_boolean",
  "light",
  "switch",
  "group",
  "automation",
  "humidifier",
  "valve",
  "button",
  "input_button",
  "scene",
]);

// a badge that names no style or size: an outline pill, small; the status badge: a tag
const BADGE: { style: BadgeStyle; size: BadgeSize } = { style: "outline", size: "s" };
const STATUS: { style: BadgeStyle; size: BadgeSize } = { style: "tag", size: "s" };

// the status and the badges of a card that draws a kind (the poster's corner, the end of a tile's
// name line), added to the card's items: `status` (a text, a template, or false: its look is the
// card's, a tag in its colour) and `badges` (entities or badges of their own). The status comes
// first where it is a badge. `where` names the place in messages
export const normalizeCorner = (k: KindItem, type: string, where: string) => {
  const raw = k.raw as RawKindCardConfig & { status?: unknown; badges?: unknown };
  const { entity, own, ctx, entities } = k;
  const main = entities[0];
  // the badges keep the card's defaults as written: a badge's own entity opens its more-info
  const badgeCtx = { type, ...normalizeActionDefaults(raw) };

  // the status: the card's own value, rules and colour, drawn as a tag with the status text
  if (raw.status !== undefined && raw.status !== false && typeof raw.status !== "string")
    throw new Error(
      `${type}: status takes a text, a template or false (its look is the card's: a tag in its colour)`,
    );
  let statusIdx: number | null = null,
    statusText: ValueSrc | null = null;
  if (raw.status !== false) {
    statusText = typeof raw.status === "string" ? normalizeValue(raw.status) : null;
    const status = normalizeBadge(
      {
        entity: own.entity,
        attribute: own.attribute,
        value: own.value,
        color: own.color,
        unit: own.unit,
        decimals: own.decimals,
      } as RawEntity,
      ctx,
      "status",
      STATUS,
      where,
    );
    // the card's rules (its colour is the card's default too: a matching rule's wins), no name, no
    // icon
    status.rules = main.rules;
    if (main.ruleUnit) status.ruleUnit = main.ruleUnit;
    status.ruleWins = true;
    status.item = { ...status.item, showIcon: false, showName: false };
    statusIdx = entities.push(status) - 1;
  }

  // the badges in the written order, after the status
  if (raw.badges !== undefined && raw.badges !== null && !Array.isArray(raw.badges))
    throw new Error(`${type}: badges must be a list`);
  const list = Array.isArray(raw.badges) ? raw.badges : [];
  const corner: number[] = [];
  list.forEach((b, i) => {
    if (b === "status")
      throw new Error(
        `${type}: status is no badge of the list: the status comes first (on a tile: status_badge: true)`,
      );
    let o: RawEntity | string | null = typeof b === "string" || isObj(b) ? (b as RawEntity) : null;
    // a badge without an entity reads the card's: its attribute, else the card's value again
    if (isObj(o) && !o.entity && entity) {
      const shown = o.attribute !== undefined || o.value !== undefined;
      o = {
        entity,
        ...(shown ? {} : { attribute: own.attribute, value: own.value, unit: own.unit }),
        ...o,
      };
    }
    const ent = normalizePill(o, badgeCtx, `badges[${i}]`, BADGE, where);
    // a weather attribute has its own unit (humidity: %) or keeps it in a sibling attribute
    // (wind_gust_speed: wind_speed_unit)
    const def = ent.valueSrc.kind === "attribute" ? ATTRIBUTES[ent.valueSrc.key] : undefined;
    if (def && ent.unit === null) {
      if (def.unit !== undefined) ent.unit = def.unit;
      else if (def.unitAttr) ent.unitAttr = def.unitAttr;
    }
    corner.push(entities.push(ent) - 1);
  });
  if (statusIdx !== null) corner.unshift(statusIdx);
  // the history its badges draw (the card fetches its own window, or more where they need it)
  const hours = badgeHours(corner.map((i) => entities[i]));
  return { statusIdx, statusText, corner, badgeHours: hours };
};
