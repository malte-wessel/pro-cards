// Config shared by the cards that draw a kind (pure): the kind and its own keys, the card's item
// with the kind's defaults, rules and controls, the inputs the kind reads, the icon's own actions,
// and the two places (places.ts) as the card and its rules write them. The poster card adds its
// corner, the tile card its line.
import { domainOf } from "../color.ts";
import { isTemplate, oneOf } from "../util.ts";
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
  CONTROL_POSITIONS,
  normalizeControl,
  type IconActions,
} from "../entity/control.ts";
import type { ActionConfig, HassEntity, HomeAssistant } from "../ha.ts";
import { ATTRIBUTES } from "../weather/constants.ts";
import { parseKind, resolveKind } from "./detect.ts";
import { deviceSiblings, findInput, logOnce } from "./discover.ts";
import {
  goneKey,
  mergePlace,
  parseIcon,
  parseVisual,
  type IconPlace,
  type VisualPlace,
  type Written,
} from "./places.ts";
import { toRule } from "./rules.ts";
import type { Kind } from "./types.ts";

export interface RawKindCardConfig extends RawEntityCardBase, RawEntity {
  // what the entity is (a kind's name; detected when left out)
  kind?: unknown;
  // the entities a type reads besides the card's own: an id, or false for none
  direction?: unknown;
  gust?: unknown;
  today?: unknown;
  wind?: unknown;
  power?: unknown;
  charge?: unknown;
  discharge?: unknown;
  import?: unknown;
  export?: unknown;
  range?: unknown;
  plugged?: unknown;
  charging?: unknown;
  location?: unknown;
  // the appliance's threshold, the trend's entities
  running_above?: unknown;
  series?: unknown;
}

// a picture: an image URL, a template that renders one, or an entity's picture (a camera's
// snapshot, a media player's art, a person's photo)
export type ImageSrc =
  | { kind: "url"; url: string }
  | { kind: "template"; template: string }
  | { kind: "entity"; entity: string };

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

const ENTITY_ID = /^[a-z_]+\.[a-z0-9_]+$/;
// a file name looks like an entity id (garden.jpg): it is a picture's URL
const IMAGE_FILE = /\.(jpe?g|png|gif|webp|svg|avif)$/i;

export const parseImage = (v: unknown): ImageSrc | false | null => {
  if (v === false) return false;
  if (typeof v !== "string" || !v) return null;
  if (isTemplate(v)) return { kind: "template", template: v };
  if (ENTITY_ID.test(v) && !IMAGE_FILE.test(v)) return { kind: "entity", entity: v };
  return { kind: "url", url: v };
};

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
  return (kind.inputs ?? []).map((def) => foundInput(def, written[def.key], entity, hass));
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
          `${ctx.type}: ${kind.name}: ${def.key} from ${found} (same device as ${entity}); set ${def.key} to choose another`,
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
// its options (`{ type, position, attribute, step, options, confirm }`; without `type` its options
// change the kind's own controls), as the entity cards' flat keys
const CONTROL_KEYS: Record<string, string> = {
  position: "control_position",
  attribute: "control_attribute",
  step: "control_step",
  options: "control_options",
  confirm: "control_confirm",
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
  }
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
    const out = { ...r, icon: p.icon ? p.icon.name : undefined, visual: undefined };
    byRule.set(out, p);
    return out;
  });
  const kind = resolveKind(
    parseKind(written.kind, type),
    written.entity || null,
    written.entity ? hass?.states[written.entity] : undefined,
    type,
  );
  // the kind's own keys, as written on the card
  const opts: Record<string, unknown> = {};
  for (const k of kind.keys) {
    const v = (written as Record<string, unknown>)[k];
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
    const ent = normalizeBadge(o, badgeCtx, `badges[${i}]`, BADGE, where);
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
  return { statusIdx, statusText, corner };
};
