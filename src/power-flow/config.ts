// Config normalisation of the power flow card (pure). The result is an entity-card-pro config (the
// base element renders header, header entities, tint and templates from it) whose items are the
// home, every source's sensors and every consumer; `sources` and `consumers` point into that flat
// list by index, so rules, templates, actions and formatting come from the entity layer.
import {
  normalizeTitleAction,
  clampColumns,
  normalizeActionDefaults,
  normalizeEntity,
  normalizeHeaderEntities,
  normalizeHistoryOptions,
  type EntityCardConfig,
  type EntityItem,
  type NormalizeCtx,
  type RawEntity,
  type RawEntityCardBase,
} from "../shared/entity/config.ts";
import { DEFAULTS as ENTITY_DEFAULTS } from "../shared/entity/constants.ts";
import { clampInt, enumOf } from "../shared/flow/config.ts";
import { numOrNull, oneOf } from "../shared/util.ts";
import { normalizeVisibility, type Visibility } from "../shared/visibility.ts";
import {
  CARD_TYPE,
  CONSUMER_STYLES,
  DEFAULT_ANIMATION,
  DEFAULT_UNITS,
  DIRECTIONS,
  FLOW_STYLES,
  GEOM,
  ICONS,
  NODE_D,
  IDLE_LINKS,
  IDLE_W,
  SOURCE_KINDS,
  type Animation,
  type ConsumerStyle,
  type Direction,
  type FlowStyle,
  type IdleLinks,
  type Units,
} from "./constants.ts";

// ----- the raw config as written in YAML -----

// every node of the tree: `icon_size` is the diameter of its circle (px)
export interface RawNode {
  icon_size?: unknown;
}
export interface RawSource extends RawEntity, RawNode {
  type?: unknown;
  power?: string | null; // battery (+ discharging) / grid (+ import), signed
  charge?: string | null; // battery pair
  discharge?: string | null;
  import?: string | null; // grid pair
  export?: string | null;
  soc?: string | null; // battery state of charge (%)
  charge_from?: unknown; // battery: "solar" when the panels feed it (default "any")
  price?: string | null; // grid price sensor
  offline?: string | { entity?: string | null; state?: string | null } | null;
  generator?: string | null; // grid: the generator's power while offline
  fossil?: string | null; // grid: fossil fuel percentage of the grid's power
  non_fossil?: string | null; // grid: low-carbon percentage instead
  invert?: boolean | null;
  peak?: unknown; // solar: the panels' peak power (W), drawn as a ring
}
export interface RawConsumer extends RawEntity, RawNode {
  group?: string | null;
  entities?: unknown;
  invert?: boolean | null;
  hide_below?: unknown;
}
export interface RawPowerFlowConfig extends RawEntityCardBase {
  sources?: unknown;
  home?: string | (RawEntity & RawNode) | null;
  consumers?: unknown;
  direction?: unknown;
  flow_style?: unknown;
  consumer_style?: unknown;
  idle_links?: unknown;
  idle_below?: unknown;
  other?: boolean | null;
  rules?: unknown;
  expensive_above?: unknown;
  hide_consumers_below?: unknown;
  kw_above?: unknown;
  decimals?: unknown;
  animation?: unknown;
}

// ----- the normalised config -----

// every source: its node id (s<i>, the config index) and its conditions (null: always drawn)
interface SourceBase {
  id: string;
  d: number; // the node's diameter (px)
  visibility: Visibility;
}
export const CHARGE_FROM = ["any", "solar"] as const;
export type ChargeFrom = (typeof CHARGE_FROM)[number];
export interface SolarSource extends SourceBase {
  kind: "solar";
  idx: number;
  peak: number | null; // W: the ring shows the production against it
}
export interface BatterySource extends SourceBase {
  kind: "battery";
  idx: number; // signed power (+ = discharging), or the charge item of a pair
  secondIdx: number | null; // the discharge item of a pair
  socIdx: number | null;
  chargeFrom: ChargeFrom; // "solar": solar charges it before the home, the grid never does
  invert: boolean;
}
export interface GridSource extends SourceBase {
  kind: "grid";
  idx: number; // signed power (+ = import), or the import item of a pair
  secondIdx: number | null; // the export item of a pair
  priceIdx: number | null;
  offlineIdx: number | null;
  offlineState: string;
  generatorIdx: number | null;
  fossilIdx: number | null;
  fossilKind: "fossil" | "non_fossil" | null; // what the fossil item's percentage counts
  invert: boolean;
}
export type Source = SolarSource | BatterySource | GridSource;

export interface ConsumerItem {
  kind: "item";
  id: string;
  idx: number;
  d: number; // the node's diameter (px): a device in a group is smaller
  rowD: number; // consumer_style: list – the row's circle: 32 px, or the icon_size within the row
  invert: boolean;
  visibility: Visibility; // null: always drawn
  // hidden while its power stays below this many watts (null: never by its power)
  hideBelow: number | null;
}
export interface ConsumerGroup {
  kind: "group";
  id: string;
  d: number;
  name: string;
  icon: string | null;
  items: ConsumerItem[];
  visibility: Visibility; // null: drawn while one of its devices is
}
export interface OtherConsumer {
  kind: "other";
  id: string;
  d: number;
  rowD: number;
}
export type Consumer = ConsumerItem | ConsumerGroup | OtherConsumer;

export interface PowerFlowConfig extends EntityCardConfig {
  direction: Direction;
  flowStyle: FlowStyle;
  consumerStyle: ConsumerStyle;
  idleLinks: IdleLinks;
  idleBelow: number; // W: a flow below it is idle (no motion, no state)
  homeIdx: number;
  homeD: number; // the home node's diameter (px)
  homeEntity: boolean; // false: the home is computed from the sources; the item carries name / icon / rules
  sources: Source[];
  consumers: Consumer[];
  hasGroups: boolean;
  expensiveAbove: number | null;
  units: Units;
  animation: Animation;
}

const entityId = (v: unknown, key: string): string | null => {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v !== "string" || !/^[a-z_]+\.[a-z0-9_]+$/.test(v))
    throw new Error(`${CARD_TYPE}: '${key}' must be an entity id`);
  return v;
};
const item = (raw: RawEntity, ctx: NormalizeCtx, label: string) => {
  // a node's `visibility` is the node's (hidden from the tree), not its sensor row's
  const ent = normalizeEntity({ ...raw, visual: "icon", visibility: undefined }, ctx, label);
  ent.visual = "icon"; // never a history visual: the tree draws every item itself
  return ent;
};
// a node's diameter: its `icon_size` (px, 16 to 96), else its kind's own
export const nodeSize = (v: unknown, dflt: number) => clampInt(v, dflt, 16, 96);
const clampDec = (v: unknown, dflt: number) =>
  Math.max(0, Math.min(3, Math.round(numOrNull(v) ?? dflt)));

const normalizeSource = (
  raw: unknown,
  i: number,
  ctx: NormalizeCtx,
  entities: EntityItem[],
): Source => {
  const label = `sources[${i}]`;
  if (!raw || typeof raw !== "object") throw new Error(`${CARD_TYPE}: ${label} must be an object`);
  const o = raw as RawSource;
  if (!oneOf(SOURCE_KINDS, o.type))
    throw new Error(`${CARD_TYPE}: ${label}.type must be one of ${SOURCE_KINDS.join(" | ")}`);
  const {
    type,
    power,
    charge,
    discharge,
    soc,
    charge_from,
    price,
    offline,
    generator,
    fossil,
    non_fossil,
    invert,
    peak,
    icon_size,
    ...rest
  } = o;
  const base: RawEntity = { ...rest };
  delete (base as RawSource).import;
  delete (base as RawSource).export;
  const push = (e: RawEntity, l: string, key: "power.solar" | "power.battery" | "power.grid") => {
    const ent = item(e, ctx, l);
    ent.nameKey = key;
    return entities.push(ent) - 1;
  };
  const sub = (id: string, l: string) => entities.push(item({ entity: id }, ctx, l)) - 1;
  // the node's conditions; a state condition without an entity reads the source's sensor
  const own = (entity: string | null | undefined, d: number) => ({
    id: `s${i}`,
    d: nodeSize(icon_size, d),
    visibility: normalizeVisibility(o.visibility, {
      type: CARD_TYPE,
      label,
      entity: entity ?? null,
    }),
  });
  const subOf = (v: unknown, key: string) => {
    const id = entityId(v, `${label}.${key}`);
    return id ? sub(id, `${label}.${key}`) : null;
  };
  if (type === "solar") {
    if (!base.entity && base.value === undefined)
      throw new Error(`${CARD_TYPE}: ${label} needs 'entity'`);
    const pk = peak === undefined || peak === null ? null : numOrNull(peak);
    if (pk !== null ? pk <= 0 : peak !== undefined && peak !== null)
      throw new Error(`${CARD_TYPE}: ${label}.peak must be a number of watts above 0`);
    return {
      ...own(base.entity, NODE_D.solar),
      kind: "solar",
      idx: push(base, label, "power.solar"),
      peak: pk,
    };
  }
  if (type === "battery") {
    const p = entityId(power, `${label}.power`),
      c = entityId(charge, `${label}.charge`),
      d = entityId(discharge, `${label}.discharge`);
    if (p ? c || d : !(c && d))
      throw new Error(`${CARD_TYPE}: ${label} needs 'power' or both 'charge' and 'discharge'`);
    const chargeFrom = charge_from ?? "any";
    if (!oneOf(CHARGE_FROM, chargeFrom))
      throw new Error(
        `${CARD_TYPE}: ${label}.charge_from must be one of ${CHARGE_FROM.join(" | ")}`,
      );
    const idx = push({ ...base, entity: p ?? c }, label, "power.battery");
    return {
      ...own(p ?? c, NODE_D.battery),
      kind: "battery",
      idx,
      secondIdx: p ? null : sub(d as string, `${label}.discharge`),
      socIdx: subOf(soc, "soc"),
      chargeFrom,
      invert: !!invert,
    };
  }
  const p = entityId(power, `${label}.power`),
    im = entityId(o.import, `${label}.import`),
    ex = entityId(o.export, `${label}.export`);
  if (p ? im || ex : !im) throw new Error(`${CARD_TYPE}: ${label} needs 'power' or 'import'`);
  const idx = push({ ...base, entity: p ?? im }, label, "power.grid");
  let offlineIdx: number | null = null,
    offlineState = "on";
  if (offline) {
    const off = typeof offline === "string" ? { entity: offline } : offline;
    const id = entityId(off.entity, `${label}.offline`);
    if (!id) throw new Error(`${CARD_TYPE}: ${label}.offline needs 'entity'`);
    offlineIdx = sub(id, `${label}.offline`);
    if (off.state !== undefined && off.state !== null) offlineState = String(off.state);
  }
  if (fossil && non_fossil)
    throw new Error(`${CARD_TYPE}: ${label} takes 'fossil' or 'non_fossil', not both`);
  return {
    ...own(p ?? im, NODE_D.grid),
    kind: "grid",
    idx,
    secondIdx: p ? null : ex ? sub(ex, `${label}.export`) : null,
    priceIdx: subOf(price, "price"),
    offlineIdx,
    offlineState,
    generatorIdx: subOf(generator, "generator"),
    fossilIdx: subOf(fossil ?? non_fossil, fossil ? "fossil" : "non_fossil"),
    fossilKind: fossil ? "fossil" : non_fossil ? "non_fossil" : null,
    invert: !!invert,
  };
};

// `hide_below` / `hide_consumers_below`: watts, 0 (or nothing) never hides
const wattsBelow = (v: unknown, key: string): number | null | undefined => {
  if (v === undefined || v === null) return undefined;
  const n = numOrNull(v);
  if (n === null || n < 0) throw new Error(`${CARD_TYPE}: '${key}' must be a number of watts`);
  return n === 0 ? null : n;
};

const normalizeConsumers = (
  raw: unknown,
  ctx: NormalizeCtx,
  entities: EntityItem[],
  // the card's `hide_consumers_below`
  hideBelow: number | null,
): Consumer[] => {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw new Error(`${CARD_TYPE}: 'consumers' must be a list`);
  // a device's own `hide_below` wins over its room's, which wins over the card's
  const leaf = (
    e: unknown,
    id: string,
    label: string,
    fallback: number | null,
    d: number,
  ): ConsumerItem => {
    const o: RawConsumer =
      typeof e === "string" ? { entity: e } : e && typeof e === "object" ? { ...e } : {};
    const { invert, hide_below, icon_size, ...ent } = o;
    const own = wattsBelow(hide_below, `${label}.hide_below`);
    const idx = entities.push(item(ent, ctx, label)) - 1;
    const visibility = normalizeVisibility(o.visibility, {
      type: CARD_TYPE,
      label,
      entity: ent.entity ?? null,
    });
    const below = own === undefined ? fallback : own;
    return {
      kind: "item",
      id,
      idx,
      d: nodeSize(icon_size, d),
      rowD: Math.min(nodeSize(icon_size, GEOM.dConsumer), GEOM.rowH),
      invert: !!invert,
      visibility,
      hideBelow: below,
    };
  };
  return raw.map((c, i): Consumer => {
    const label = `consumers[${i}]`;
    const o: RawConsumer =
      typeof c === "string" ? { entity: c } : c && typeof c === "object" ? c : {};
    if (o.group !== undefined && o.group !== null) {
      const { group, entities: list, icon } = o;
      if (!Array.isArray(list) || list.length === 0)
        throw new Error(`${CARD_TYPE}: '${label}.entities' must be a non-empty list`);
      const room = wattsBelow(o.hide_below, `${label}.hide_below`);
      const fallback = room === undefined ? hideBelow : room;
      const items = list.map((e, j) =>
        leaf(e, `c${i}.${j}`, `${label}.entities[${j}]`, fallback, GEOM.dDevice),
      );
      const visibility = normalizeVisibility(o.visibility, {
        type: CARD_TYPE,
        label,
        entity: null,
      });
      return {
        kind: "group",
        id: `g${i}`,
        d: nodeSize(o.icon_size, GEOM.dGroup),
        name: String(group),
        icon: icon ?? null,
        items,
        visibility,
      };
    }
    return leaf(c, `c${i}`, label, hideBelow, GEOM.dConsumer);
  });
};

const normalizeUnits = (raw: RawPowerFlowConfig): Units => {
  const kwAbove = Math.max(0, numOrNull(raw.kw_above) ?? DEFAULT_UNITS.kwAbove);
  const d = raw.decimals;
  if (d !== undefined && d !== null && typeof d === "object") {
    const o = d as { w?: unknown; kw?: unknown };
    return {
      kwAbove,
      decW: clampDec(o.w, DEFAULT_UNITS.decW),
      decKw: clampDec(o.kw, DEFAULT_UNITS.decKw),
    };
  }
  const n = numOrNull(d);
  return {
    kwAbove,
    decW: n === null ? DEFAULT_UNITS.decW : clampDec(n, DEFAULT_UNITS.decW),
    decKw: n === null ? DEFAULT_UNITS.decKw : clampDec(n, DEFAULT_UNITS.decKw),
  };
};
const normalizeAnimation = (raw: unknown): Animation => {
  if (raw === undefined || raw === null) return DEFAULT_ANIMATION;
  if (typeof raw !== "object" || Array.isArray(raw))
    throw new Error(`${CARD_TYPE}: 'animation' must be an object`);
  const o = raw as { slow_below?: unknown; fast_above?: unknown };
  const slowBelow = Math.max(0, numOrNull(o.slow_below) ?? DEFAULT_ANIMATION.slowBelow);
  const fastAbove = Math.max(0, numOrNull(o.fast_above) ?? DEFAULT_ANIMATION.fastAbove);
  if (fastAbove <= slowBelow)
    throw new Error(`${CARD_TYPE}: animation.fast_above must be greater than slow_below`);
  return { slowBelow, fastAbove };
};

export const normalizePowerFlowConfig = (input: unknown): PowerFlowConfig => {
  if (!input || typeof input !== "object") throw new Error(`${CARD_TYPE}: invalid config`);
  const raw = input as RawPowerFlowConfig;
  const ctx = {
    type: CARD_TYPE,
    ...normalizeActionDefaults(raw),
    columns: clampColumns(raw.columns, ENTITY_DEFAULTS.columns),
  };
  const direction = enumOf(CARD_TYPE, DIRECTIONS, raw.direction, "direction", "right");
  const flowStyle = enumOf(CARD_TYPE, FLOW_STYLES, raw.flow_style, "flow_style", "dots");
  const consumerStyle = enumOf(
    CARD_TYPE,
    CONSUMER_STYLES,
    raw.consumer_style,
    "consumer_style",
    "nodes",
  );
  const idleLinks = enumOf(CARD_TYPE, IDLE_LINKS, raw.idle_links, "idle_links", "dashed");
  const entities: EntityItem[] = [];

  // the home: a sensor, an entity object, or nothing (computed); the card's rules live on it
  const h = raw.home;
  const { icon_size: homeSize, ...homeRaw }: RawEntity & RawNode =
    typeof h === "string" ? { entity: h } : h && typeof h === "object" ? { ...h } : {};
  if (h !== undefined && h !== null && typeof h !== "string" && typeof h !== "object")
    throw new Error(`${CARD_TYPE}: 'home' must be a sensor entity or an entity object`);
  const homeEntity = !!homeRaw.entity || homeRaw.value !== undefined;
  const home = item(
    {
      ...(homeEntity ? homeRaw : { ...homeRaw, value: "0" }),
      rules: homeRaw.rules ?? raw.rules,
      icon: homeRaw.icon ?? ICONS.home,
    },
    ctx,
    "home",
  );
  home.nameKey = "power.home";
  if (!homeEntity) home.tap = home.hold = home.dbl = { action: "none" };
  const homeIdx = entities.push(home) - 1;

  if (!Array.isArray(raw.sources) || raw.sources.length === 0)
    throw new Error(`${CARD_TYPE}: 'sources' must be a non-empty list`);
  const sources = raw.sources.map((s, i) => normalizeSource(s, i, ctx, entities));

  const consumers = normalizeConsumers(
    raw.consumers,
    ctx,
    entities,
    wattsBelow(raw.hide_consumers_below, "hide_consumers_below") ?? null,
  );
  const other = raw.other === undefined || raw.other === null ? consumers.length > 0 : !!raw.other;
  if (other && consumers.length)
    consumers.push({ kind: "other", id: "other", d: GEOM.dConsumer, rowD: GEOM.dConsumer });

  const header = normalizeHeaderEntities(raw.header_entities, ctx);
  const headerIdxs = header.map((_, i) => entities.length + i);
  entities.push(...header);

  return {
    layout: "hero",
    title: raw.title ?? null,
    titleTap: normalizeTitleAction(raw),
    icon: raw.icon ?? null,
    ...normalizeHistoryOptions(raw),
    ...ctx,
    entities,
    groups: [],
    headerIdxs,
    hasHeader: !!(raw.title || raw.icon || header.length),
    direction,
    flowStyle,
    consumerStyle,
    idleLinks,
    // watts; 0 lets every trickle flow
    idleBelow:
      wattsBelow(raw.idle_below, "idle_below") ??
      (raw.idle_below === undefined || raw.idle_below === null ? IDLE_W : 0),
    homeIdx,
    homeD: nodeSize(homeSize, NODE_D.home),
    homeEntity,
    sources,
    consumers,
    hasGroups: consumers.some((c) => c.kind === "group"),
    expensiveAbove: numOrNull(raw.expensive_above),
    units: normalizeUnits(raw),
    animation: normalizeAnimation(raw.animation),
  };
};

// every consumer leaf (flat items, group members, the other node) in drawing order
export const leavesOf = (cfg: PowerFlowConfig): (ConsumerItem | OtherConsumer)[] =>
  cfg.consumers.flatMap((c) => (c.kind === "group" ? c.items : [c]));

// ----- visibility -----

// every condition tree of the tree's nodes
export const nodeVisibilities = (cfg: PowerFlowConfig): Visibility[] => [
  ...cfg.sources.map((s) => s.visibility),
  ...cfg.consumers.flatMap((c) =>
    c.kind === "group"
      ? [c.visibility, ...c.items.map((it) => it.visibility)]
      : c.kind === "item"
        ? [c.visibility]
        : [],
  ),
];

// The nodes hidden now: sources, consumers and devices whose conditions fail (or that `hide`
// says so), and rooms whose own conditions fail or whose devices are all hidden (a hidden room
// hides its devices). The home and the other node are never hidden here.
export const hiddenNodes = (
  cfg: PowerFlowConfig,
  shown: (v: Visibility) => boolean,
  hide: (leaf: ConsumerItem) => boolean = () => false,
): Set<string> => {
  const hidden = new Set<string>();
  const leafHidden = (it: ConsumerItem) => !shown(it.visibility) || hide(it);
  for (const s of cfg.sources) if (!shown(s.visibility)) hidden.add(s.id);
  for (const c of cfg.consumers) {
    if (c.kind === "item" && leafHidden(c)) hidden.add(c.id);
    if (c.kind !== "group") continue;
    const gone = c.items.filter(leafHidden);
    if (!shown(c.visibility) || gone.length === c.items.length) {
      hidden.add(c.id);
      for (const it of c.items) hidden.add(it.id);
    } else for (const it of gone) hidden.add(it.id);
  }
  return hidden;
};

// The config as the tree draws it: without the hidden nodes (a room keeps its shown devices), and
// without the other node when no consumer is left; the ids stay those of the full config.
export const viewConfig = (cfg: PowerFlowConfig, hidden: ReadonlySet<string>): PowerFlowConfig => {
  if (!hidden.size) return cfg;
  const consumers = cfg.consumers.flatMap((c): Consumer[] => {
    if (hidden.has(c.id)) return [];
    if (c.kind === "group") return [{ ...c, items: c.items.filter((it) => !hidden.has(it.id)) }];
    return [c];
  });
  const real = consumers.some((c) => c.kind !== "other");
  return {
    ...cfg,
    sources: cfg.sources.filter((s) => !hidden.has(s.id)),
    consumers: real ? consumers : [],
    hasGroups: consumers.some((c) => c.kind === "group"),
  };
};
