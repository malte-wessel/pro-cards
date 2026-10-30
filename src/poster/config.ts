// Config of the poster card (pure): the raw YAML shape and the normalised one. The card is one
// entity (or none) drawn the way its poster type (its kind) says; its items are the poster itself,
// the status badge (a badge like the others, drawn as a tag) and the badges in its corner.
import { domainOf } from "../shared/color.ts";
import { isTemplate, numOrNull } from "../shared/util.ts";
import {
  normalizeActionDefaults,
  normalizeBadge,
  normalizeEntity,
  normalizeHistoryOptions,
  normalizeValue,
  type EntityCardConfig,
  type EntityItem,
  type NormalizeCtx,
  type RawEntity,
  type RawEntityCardBase,
  type ValueSrc,
} from "../shared/entity/config.ts";
import { ITEM_DEFAULTS, type BadgeSize, type BadgeStyle } from "../shared/entity/constants.ts";
import { normalizeControl } from "../shared/entity/control.ts";
import type { HomeAssistant } from "../shared/ha.ts";
import { parsePoster, resolveKind } from "../shared/kinds/detect.ts";
import { deviceSiblings, findInput, logOnce } from "../shared/kinds/discover.ts";
import { toRule } from "../shared/kinds/rules.ts";
import type { Kind } from "../shared/kinds/types.ts";
import { ATTRIBUTES } from "../shared/weather/constants.ts";
import { CARD_TYPE } from "./constants.ts";

export interface RawPosterCardConfig extends RawEntityCardBase, RawEntity {
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
  status?: unknown;
  badges?: unknown;
  image?: unknown;
}

// the backdrop: an image URL, a template that renders one, or an entity's picture (a camera's
// snapshot, a media player's art, a person's photo)
export type ImageSrc =
  | { kind: "url"; url: string }
  | { kind: "template"; template: string }
  | { kind: "entity"; entity: string };

export interface PosterConfig extends EntityCardConfig {
  kind: Kind;
  kindOpts: Record<string, unknown>;
  // the status badge's item (null: `status: false`) and its text as written (null: the kind's,
  // else the matching rule's label)
  statusIdx: number | null;
  statusText: ValueSrc | null;
  // the backdrop as written (false: none, not even the kind's; null: the kind's)
  image: ImageSrc | false | null;
  // the kind's inputs: key → item (not drawn as rows: read by the kind)
  inputs: Record<string, number>;
  // `hours_to_show` as written (null: the kind's window)
  hoursSet: number | null;
}

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
    else if (entity && def.find && hass) {
      const found = findInput(hass, deviceSiblings(hass, entity), def.find);
      if (found) {
        raw = { entity: found };
        logOnce(
          `${CARD_TYPE}: ${kind.name}: ${def.key} from ${found} (same device as ${entity}); set ${def.key} to choose another`,
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

// a badge that names no style or size: an outline pill, small; the status badge: a tag
const BADGE: { style: BadgeStyle; size: BadgeSize } = { style: "outline", size: "s" };
const STATUS: { style: BadgeStyle; size: BadgeSize } = { style: "tag", size: "s" };
const ENTITY_ID = /^[a-z_]+\.[a-z0-9_]+$/;

export const parseImage = (v: unknown): ImageSrc | false | null => {
  if (v === false) return false;
  if (typeof v !== "string" || !v) return null;
  if (isTemplate(v)) return { kind: "template", template: v };
  if (ENTITY_ID.test(v)) return { kind: "entity", entity: v };
  return { kind: "url", url: v };
};

const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

export const normalizePosterConfig = (input: unknown, hass?: HomeAssistant): PosterConfig => {
  if (!isObj(input)) throw new Error(`${CARD_TYPE}: invalid config`);
  const written = input as RawPosterCardConfig;
  const kind = resolveKind(
    parsePoster(written.poster, CARD_TYPE),
    written.entity || null,
    written.entity ? hass?.states[written.entity] : undefined,
    CARD_TYPE,
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
  const raw: RawPosterCardConfig = { ...written };
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
    type: CARD_TYPE,
    ...normalizeActionDefaults({
      ...raw,
      tap_action: raw.tap_action ?? (entity ? undefined : none),
      hold_action: raw.hold_action ?? (entity ? undefined : none),
    }),
  };
  // a card-level `visibility` is Home Assistant's (it hides the whole card); a poster without an
  // entity or a value still has its name
  const own: RawEntity = {
    ...raw,
    visibility: undefined,
    value: raw.value ?? (entity || raw.attribute ? undefined : ""),
  };
  const main = normalizeEntity(own, ctx, "the card", ITEM_DEFAULTS.other, { buttons: true });
  // the kind's own rules, unless the card has its own (`rules: []` drops them)
  if (raw.rules === undefined && kind.rules) {
    main.rules = kind.rules.map(toRule);
    if (kind.ruleUnit) main.ruleUnit = kind.ruleUnit;
  }
  // a kind's controls are on by default: `control: false` drops them, a name picks another
  if (
    kind.controls &&
    (raw.control === undefined || raw.control === true || raw.control === "auto")
  ) {
    const st = entity ? hass?.states[entity] : undefined;
    const defaults = typeof kind.controls === "function" ? kind.controls(st) : kind.controls;
    const c = normalizeControl({ ...own, control: "auto" }, ctx, "the card");
    main.control = c && defaults.length ? { ...c, defaults: [...defaults] } : null;
    main.toggle = false;
  }

  const entities: EntityItem[] = [main];
  const inputs = inputsOf(kind, opts, entity, hass, ctx, entities);

  // the status badge: the poster's own value, rules and colour, drawn as a tag with the status text
  let statusIdx: number | null = null,
    statusText: ValueSrc | null = null;
  if (raw.status !== false) {
    const o = isObj(raw.status) ? raw.status : {};
    statusText =
      typeof raw.status === "string" ? normalizeValue(raw.status) : normalizeValue(o.value);
    const keys = { ...o };
    delete keys.value;
    const status = normalizeBadge(
      {
        entity: own.entity,
        attribute: own.attribute,
        value: own.value,
        color: own.color,
        unit: own.unit,
        decimals: own.decimals,
        ...keys,
      } as RawEntity,
      ctx,
      "status",
      STATUS,
      "a poster's corner",
    );
    status.rules = main.rules;
    if (main.ruleUnit) status.ruleUnit = main.ruleUnit;
    status.item = { ...status.item, showIcon: typeof o.icon === "string", showName: false };
    statusIdx = entities.push(status) - 1;
  }

  // the badges in the written order; `status` places the status badge (first unless placed)
  const list = Array.isArray(raw.badges) ? raw.badges : [];
  const corner: number[] = [];
  let placed = false;
  list.forEach((b, i) => {
    if (b === "status") {
      if (statusIdx !== null && !placed) corner.push(statusIdx);
      placed = true;
      return;
    }
    let o: RawEntity | string | null = typeof b === "string" || isObj(b) ? (b as RawEntity) : null;
    // a badge without an entity reads the poster's: its attribute, else the poster's value again
    if (isObj(o) && !o.entity && entity) {
      const shown = o.attribute !== undefined || o.value !== undefined;
      o = {
        entity,
        ...(shown ? {} : { attribute: own.attribute, value: own.value, unit: own.unit }),
        ...o,
      };
    }
    const ent = normalizeBadge(o, ctx, `badges[${i}]`, BADGE, "a poster's corner");
    // a weather attribute has its own unit (humidity: %) or keeps it in a sibling attribute
    // (wind_gust_speed: wind_speed_unit)
    const def = ent.valueSrc.kind === "attribute" ? ATTRIBUTES[ent.valueSrc.key] : undefined;
    if (def && ent.unit === null) {
      if (def.unit !== undefined) ent.unit = def.unit;
      else if (def.unitAttr) ent.unitAttr = def.unitAttr;
    }
    corner.push(entities.push(ent) - 1);
  });
  if (statusIdx !== null && !placed) corner.unshift(statusIdx);

  return {
    layout: "poster",
    title: null,
    titleTap: null,
    icon: null,
    ...normalizeHistoryOptions(raw),
    columns: 1,
    ...ctx,
    type: CARD_TYPE,
    entities,
    groups: [
      {
        layout: "poster",
        idxs: [0],
        badgeIdxs: corner,
        align: "start",
        columns: 1,
        divider: false,
        visibility: null,
      },
    ],
    headerIdxs: [],
    hasHeader: false,
    kind,
    kindOpts: opts,
    inputs,
    hoursSet: numOrNull(raw.hours_to_show),
    statusIdx,
    statusText,
    image: parseImage(raw.image),
  };
};
