// Config normalisation of the power flow card (pure). The result is an entity-card-pro config (the
// base element renders header, header entities, tint and templates from it) whose items are the
// home, every source's sensors and every consumer; `sources` and `consumers` point into that flat
// list by index, so rules, templates, actions and formatting come from the entity layer.
import {
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
import { enumOf } from "../shared/flow/config.ts";
import { numOrNull, oneOf } from "../shared/util.ts";
import {
  CARD_TYPE,
  CONSUMER_STYLES,
  DEFAULT_ANIMATION,
  DEFAULT_UNITS,
  DIRECTIONS,
  FLOW_STYLES,
  ICONS,
  IDLE_LINKS,
  SOURCE_KINDS,
  type Animation,
  type ConsumerStyle,
  type Direction,
  type FlowStyle,
  type IdleLinks,
  type Units,
} from "./constants.ts";

// ----- the raw config as written in YAML -----

export interface RawSource extends RawEntity {
  type?: unknown;
  power?: string | null; // battery (+ discharging) / grid (+ import), signed
  charge?: string | null; // battery pair
  discharge?: string | null;
  import?: string | null; // grid pair
  export?: string | null;
  soc?: string | null; // battery state of charge (%)
  price?: string | null; // grid price sensor
  offline?: string | { entity?: string | null; state?: string | null } | null;
  generator?: string | null; // grid: the generator's power while offline
  fossil?: string | null; // grid: fossil fuel percentage of the grid's power
  non_fossil?: string | null; // grid: low-carbon percentage instead
  invert?: boolean | null;
}
export interface RawConsumer extends RawEntity {
  group?: string | null;
  entities?: unknown;
  invert?: boolean | null;
}
export interface RawPowerFlowConfig extends RawEntityCardBase {
  sources?: unknown;
  home?: string | RawEntity | null;
  consumers?: unknown;
  direction?: unknown;
  flow_style?: unknown;
  consumer_style?: unknown;
  idle_links?: unknown;
  other?: boolean | null;
  rules?: unknown;
  expensive_above?: unknown;
  kw_above?: unknown;
  decimals?: unknown;
  animation?: unknown;
}

// ----- the normalised config -----

export interface SolarSource {
  kind: "solar";
  idx: number;
}
export interface BatterySource {
  kind: "battery";
  idx: number; // signed power (+ = discharging), or the charge item of a pair
  secondIdx: number | null; // the discharge item of a pair
  socIdx: number | null;
  invert: boolean;
}
export interface GridSource {
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
  invert: boolean;
}
export interface ConsumerGroup {
  kind: "group";
  id: string;
  name: string;
  icon: string | null;
  items: ConsumerItem[];
}
export interface OtherConsumer {
  kind: "other";
  id: string;
}
export type Consumer = ConsumerItem | ConsumerGroup | OtherConsumer;

export interface PowerFlowConfig extends EntityCardConfig {
  direction: Direction;
  flowStyle: FlowStyle;
  consumerStyle: ConsumerStyle;
  idleLinks: IdleLinks;
  homeIdx: number;
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
  const ent = normalizeEntity({ ...raw, visual: "icon" }, ctx, label);
  ent.visual = "icon"; // never a history visual: the tree draws every item itself
  return ent;
};
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
    price,
    offline,
    generator,
    fossil,
    non_fossil,
    invert,
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
  const subOf = (v: unknown, key: string) => {
    const id = entityId(v, `${label}.${key}`);
    return id ? sub(id, `${label}.${key}`) : null;
  };
  if (type === "solar") {
    if (!base.entity && base.value === undefined)
      throw new Error(`${CARD_TYPE}: ${label} needs 'entity'`);
    return { kind: "solar", idx: push(base, label, "power.solar") };
  }
  if (type === "battery") {
    const p = entityId(power, `${label}.power`),
      c = entityId(charge, `${label}.charge`),
      d = entityId(discharge, `${label}.discharge`);
    if (p ? c || d : !(c && d))
      throw new Error(`${CARD_TYPE}: ${label} needs 'power' or both 'charge' and 'discharge'`);
    const idx = push({ ...base, entity: p ?? c }, label, "power.battery");
    return {
      kind: "battery",
      idx,
      secondIdx: p ? null : sub(d as string, `${label}.discharge`),
      socIdx: subOf(soc, "soc"),
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

const normalizeConsumers = (
  raw: unknown,
  ctx: NormalizeCtx,
  entities: EntityItem[],
): Consumer[] => {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw new Error(`${CARD_TYPE}: 'consumers' must be a list`);
  const leaf = (e: unknown, id: string, label: string): ConsumerItem => {
    const o: RawConsumer =
      typeof e === "string" ? { entity: e } : e && typeof e === "object" ? { ...e } : {};
    const { invert, ...ent } = o;
    const idx = entities.push(item(ent, ctx, label)) - 1;
    return { kind: "item", id, idx, invert: !!invert };
  };
  return raw.map((c, i): Consumer => {
    const label = `consumers[${i}]`;
    const o: RawConsumer =
      typeof c === "string" ? { entity: c } : c && typeof c === "object" ? c : {};
    if (o.group !== undefined && o.group !== null) {
      const { group, entities: list, icon } = o;
      if (!Array.isArray(list) || list.length === 0)
        throw new Error(`${CARD_TYPE}: '${label}.entities' must be a non-empty list`);
      const items = list.map((e, j) => leaf(e, `c${i}.${j}`, `${label}.entities[${j}]`));
      return { kind: "group", id: `g${i}`, name: String(group), icon: icon ?? null, items };
    }
    return leaf(c, `c${i}`, label);
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
  const homeRaw: RawEntity =
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

  const consumers = normalizeConsumers(raw.consumers, ctx, entities);
  const other = raw.other === undefined || raw.other === null ? consumers.length > 0 : !!raw.other;
  if (other && consumers.length) consumers.push({ kind: "other", id: "other" });

  const header = normalizeHeaderEntities(raw.header_entities, ctx);
  const headerIdxs = header.map((_, i) => entities.length + i);
  entities.push(...header);

  return {
    layout: "hero",
    title: raw.title ?? null,
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
    homeIdx,
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
