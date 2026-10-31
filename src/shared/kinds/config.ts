// Config shared by the cards that draw a poster type (pure): the type and its own keys, the card's
// item with the type's defaults, rules and controls, the inputs the type reads, the icon's own
// actions and picture. The poster card adds its corner and backdrop, the tile card its line.
import { domainOf } from "../color.ts";
import { isTemplate, numOrNull, oneOf } from "../util.ts";
import {
  normalizeAction,
  normalizeActionDefaults,
  normalizeEntity,
  type EntityCardConfig,
  type EntityItem,
  type NormalizeCtx,
  type RawAction,
  type RawEntity,
  type RawEntityCardBase,
  type Rule,
} from "../entity/config.ts";
import { ICON_STYLES, ITEM_DEFAULTS, type IconStyle } from "../entity/constants.ts";
import { normalizeControl, type IconActions } from "../entity/control.ts";
import type { ActionConfig, HassEntity, HomeAssistant } from "../ha.ts";
import { ATTRIBUTES } from "../weather/constants.ts";
import { parsePoster, resolveKind } from "./detect.ts";
import { deviceSiblings, findInput, logOnce } from "./discover.ts";
import { toRule } from "./rules.ts";
import type { Kind } from "./types.ts";

export interface RawKindCardConfig extends RawEntityCardBase, RawEntity {
  // the poster type (a kind's name; detected when left out) and how it draws its subject
  poster?: unknown;
  variant?: unknown;
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
  // the lead: a ring of the value around the icon, a picture of its own, the icon's own actions
  icon_ring?: unknown;
  icon_image?: unknown;
  icon_tap_action?: RawAction;
  icon_hold_action?: RawAction;
  icon_double_tap_action?: RawAction;
}

// a picture: an image URL, a template that renders one, or an entity's picture (a camera's
// snapshot, a media player's art, a person's photo)
export type ImageSrc =
  | { kind: "url"; url: string }
  | { kind: "template"; template: string }
  | { kind: "entity"; entity: string };

// what a matching rule changes of the icon; a key it leaves out is the card's (a key it writes
// wins over the card's: the card's is the default)
export interface IconLook {
  iconStyle?: IconStyle;
  iconImage?: ImageSrc | null;
  iconRing?: boolean;
}

export interface KindConfig extends EntityCardConfig {
  kind: Kind;
  kindOpts: Record<string, unknown>;
  // the kind's inputs: key → item (not drawn as rows: read by the kind)
  inputs: Record<string, number>;
  // `hours_to_show` as written (null: the kind's window)
  hoursSet: number | null;
  // a picture of the card's own in the icon (null: the icon's, or the entity's picture)
  iconImage: ImageSrc | null;
  // what each of the card's rules changes of the icon, by rule
  ruleLooks: Map<Rule, IconLook>;
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

// a rule's own keys for the icon, as the card's are read
export const iconLookOf = (src: Readonly<Record<string, unknown>> | undefined): IconLook => {
  const out: IconLook = {};
  if (!src) return out;
  if (oneOf(ICON_STYLES, src.icon_style)) out.iconStyle = src.icon_style;
  if (src.icon_image !== undefined) out.iconImage = parseImage(src.icon_image) || null;
  if (typeof src.icon_ring === "boolean") out.iconRing = src.icon_ring;
  return out;
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
  // the lead's options are the card's own: the ring and the icon's actions
  if (written.visual === "ring")
    throw new Error(`${type}: visual: ring is icon_ring: true on the ${thing}`);
  if (written.control_position === "lead")
    throw new Error(
      `${type}: the icon's own actions are icon_tap_action / icon_hold_action, not control_position: lead`,
    );
  const kind = resolveKind(
    parsePoster(written.poster, type),
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
  const raw: RawKindCardConfig = { ...written };
  for (const [k, v] of Object.entries(defaults)) {
    const key = k as keyof RawEntity;
    if (key === "attribute" || key === "value") {
      if (written.value === undefined && written.attribute === undefined) raw[key] = v as never;
    } else if (raw[key] === undefined) raw[key] = v as never;
  }
  const entity = raw.entity || null;
  // without an entity there is no more-info to open: a tap does nothing unless it is told to
  const none = { action: "none" };
  const ctx = {
    type,
    ...normalizeActionDefaults({
      ...raw,
      tap_action: raw.tap_action ?? (entity ? undefined : none),
      hold_action: raw.hold_action ?? (entity ? undefined : none),
    }),
  };
  // a card-level `visibility` is Home Assistant's (it hides the whole card); a card without an
  // entity or a value still has its name
  const own: RawEntity = {
    ...raw,
    visibility: undefined,
    value: raw.value ?? (entity || raw.attribute ? undefined : ""),
    ...ownKeys,
  };
  const main = normalizeEntity(own, ctx, "the card", ITEM_DEFAULTS.other, { buttons: true });
  if (raw.icon_ring === true) main.iconRing = true;
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
  const iconActions: IconActions = {
    tap: iconAction(raw.icon_tap_action, kindIcon.tap),
    hold: iconAction(raw.icon_hold_action, kindIcon.hold),
    dbl: iconAction(raw.icon_double_tap_action, kindIcon.dbl),
  };

  const entities: EntityItem[] = [main];
  const inputs = inputsOf(kind, opts, entity, hass, ctx, entities);
  return { kind, opts, raw, own, entity, st, ctx, entities, inputs, iconActions };
};

// the KindConfig keys a card's item gives, besides its entities and groups
export const kindConfigOf = (k: KindItem, rules: Rule[]) => ({
  kind: k.kind,
  kindOpts: k.opts,
  inputs: k.inputs,
  hoursSet: numOrNull(k.raw.hours_to_show),
  iconImage: parseImage(k.raw.icon_image) || null,
  iconActions: k.iconActions,
  ruleLooks: new Map<Rule, IconLook>(rules.map((r) => [r, iconLookOf(r.src)])),
});
