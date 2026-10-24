// Config normalisation of the power flow card (pure): the flow tree's config (src/shared/flow-tree)
// with the power card's sources (signed power or pairs, price, outage, generator, fossil share,
// peak) and options (units, animation, the expensive price).
import {
  clampColumns,
  normalizeActionDefaults,
  type EntityItem,
  type NormalizeCtx,
} from "../shared/entity/config.ts";
import { DEFAULTS as ENTITY_DEFAULTS } from "../shared/entity/constants.ts";
import {
  amountBelow,
  chargeFromOf,
  clampDec,
  normalizeFlowTree,
  sourceParts,
  type FlowTreeConfig,
  type RawFlowTreeConfig,
  type Source,
} from "../shared/flow-tree/config.ts";
import {
  DEFAULT_ANIMATION,
  IDLE_W,
  NODE_D,
  type Animation,
} from "../shared/flow-tree/constants.ts";
import { numOrNull } from "../shared/util.ts";
import { CARD_TYPE, DEFAULT_UNITS, type Units } from "./constants.ts";

export interface RawPowerFlowConfig extends RawFlowTreeConfig {
  expensive_above?: unknown;
  kw_above?: unknown;
  animation?: unknown;
}

export interface PowerFlowConfig extends FlowTreeConfig {
  expensiveAbove: number | null;
  units: Units;
  animation: Animation;
}

// the power card's own keys of a source (the rest are the node's entity options)
const SOURCE_KEYS = [
  "power", // battery (+ discharging) / grid (+ import), signed
  "charge", // battery pair
  "discharge",
  "import", // grid pair
  "export",
  "both_ways", // grid pair: the meter counts import and export apart, both may run at once
  "soc", // battery state of charge (%)
  "charge_from", // battery: "solar" when the panels feed it, or the solar entities that do (default "any")
  "price", // grid price sensor
  "offline", // grid: an entity whose state says it is down
  "generator", // grid: the generator's power while offline
  "fossil", // grid: fossil fuel percentage of the grid's power
  "non_fossil", // grid: low-carbon percentage instead
  "invert",
  "peak", // solar: the panels' peak power (W), drawn as a ring
] as const;

const normalizeSource = (
  raw: unknown,
  i: number,
  ctx: NormalizeCtx,
  entities: EntityItem[],
): Source => {
  const { o, kind, label, base, push, sub, own, id, subOf } = sourceParts(
    raw,
    i,
    ctx,
    entities,
    SOURCE_KEYS,
  );
  if (kind === "solar") {
    if (!base.entity && base.value === undefined)
      throw new Error(`${CARD_TYPE}: ${label} needs 'entity'`);
    const peak = o.peak;
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
  if (kind === "battery") {
    const p = id(o.power, "power"),
      c = id(o.charge, "charge"),
      d = id(o.discharge, "discharge");
    if (p ? c || d : !(c && d))
      throw new Error(`${CARD_TYPE}: ${label} needs 'power' or both 'charge' and 'discharge'`);
    const from = chargeFromOf(CARD_TYPE, o.charge_from, label);
    const idx = push({ ...base, entity: p ?? c }, label, "power.battery");
    return {
      ...own(p ?? c, NODE_D.battery),
      kind: "battery",
      idx,
      secondIdx: p ? null : sub(d as string, `${label}.discharge`),
      socIdx: subOf(o.soc, "soc"),
      ...from,
      invert: !!o.invert,
    };
  }
  const p = id(o.power, "power"),
    im = id(o.import, "import"),
    ex = id(o.export, "export");
  if (p ? im || ex : !im) throw new Error(`${CARD_TYPE}: ${label} needs 'power' or 'import'`);
  if (o.both_ways && !(im && ex))
    throw new Error(`${CARD_TYPE}: ${label}.both_ways needs an 'import' / 'export' pair`);
  const idx = push({ ...base, entity: p ?? im }, label, "power.grid");
  let offlineIdx: number | null = null,
    offlineState = "on";
  const offline = o.offline as string | { entity?: string | null; state?: string | null } | null;
  if (offline) {
    const off = typeof offline === "string" ? { entity: offline } : offline;
    const e = id(off.entity, "offline");
    if (!e) throw new Error(`${CARD_TYPE}: ${label}.offline needs 'entity'`);
    offlineIdx = sub(e, `${label}.offline`);
    if (off.state !== undefined && off.state !== null) offlineState = String(off.state);
  }
  const { fossil, non_fossil } = o;
  if (fossil && non_fossil)
    throw new Error(`${CARD_TYPE}: ${label} takes 'fossil' or 'non_fossil', not both`);
  return {
    ...own(p ?? im, NODE_D.grid),
    kind: "grid",
    idx,
    secondIdx: p ? null : ex ? sub(ex, `${label}.export`) : null,
    bothWays: !!o.both_ways,
    priceIdx: subOf(o.price, "price"),
    offlineIdx,
    offlineState,
    generatorIdx: subOf(o.generator, "generator"),
    fossilIdx: subOf(fossil ?? non_fossil, fossil ? "fossil" : "non_fossil"),
    fossilKind: fossil ? "fossil" : non_fossil ? "non_fossil" : null,
    invert: !!o.invert,
  };
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

// `hide_below` / `hide_consumers_below` / `idle_below`: watts, 0 (or nothing) never hides
export const wattsBelow = (v: unknown, key: string) => amountBelow(CARD_TYPE, v, key, "watts");

export const normalizePowerFlowConfig = (input: unknown): PowerFlowConfig => {
  if (!input || typeof input !== "object") throw new Error(`${CARD_TYPE}: invalid config`);
  const raw = input as RawPowerFlowConfig;
  const ctx = {
    type: CARD_TYPE,
    ...normalizeActionDefaults(raw),
    columns: clampColumns(raw.columns, ENTITY_DEFAULTS.columns),
  };
  return {
    ...normalizeFlowTree(raw, ctx, {
      source: normalizeSource,
      unit: "watts",
      idleBelow: IDLE_W,
      gross: false,
    }),
    expensiveAbove: numOrNull(raw.expensive_above),
    units: normalizeUnits(raw),
    animation: normalizeAnimation(raw.animation),
  };
};
