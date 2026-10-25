// Config normalisation of the energy flow card (pure): the flow tree's config (src/shared/flow-tree)
// with energy meters for sources (solar production, a battery's charge and discharge, a grid's
// import and export) and the card's period. Every pair counts both ways (`gross`): over a period a
// battery charges and discharges, a grid imports and exports.
import {
  clampColumns,
  normalizeActionDefaults,
  type EntityItem,
  type NormalizeCtx,
} from "../shared/entity/config.ts";
import { DEFAULTS as ENTITY_DEFAULTS } from "../shared/entity/constants.ts";
import { PERIODS, type CalendarPeriod } from "../shared/calendar.ts";
import { enumOf } from "../shared/flow/config.ts";
import {
  chargeFromOf,
  clampDec,
  normalizeFlowTree,
  sourceParts,
  type FlowTreeConfig,
  type RawFlowTreeConfig,
  type Source,
} from "../shared/flow-tree/config.ts";
import { NODE_D } from "../shared/flow-tree/constants.ts";
import { treeIdxs } from "../shared/flow-tree/model.ts";
import { numOrNull } from "../shared/util.ts";
import { CARD_TYPE, DEFAULT_UNITS, IDLE_KWH, type EnergyUnits } from "./constants.ts";

export interface RawEnergyFlowConfig extends RawFlowTreeConfig {
  period?: unknown;
  period_picker?: unknown;
}

export interface EnergyFlowConfig extends FlowTreeConfig {
  period: CalendarPeriod; // what the card shows until a viewer picks another
  picker: boolean; // the viewer's period picker in the header (`period_picker`)
  units: EnergyUnits;
}

// the energy card's own keys of a source (the rest are the node's entity options)
const SOURCE_KEYS = ["charge", "discharge", "import", "export", "soc", "charge_from"] as const;
// what only the power flow card knows: a period total has no sign, no price and no outage
const POWER_KEYS = [
  "power",
  "both_ways",
  "price",
  "offline",
  "generator",
  "fossil",
  "non_fossil",
  "invert",
  "peak",
] as const;

const normalizeSource = (
  raw: unknown,
  i: number,
  ctx: NormalizeCtx,
  entities: EntityItem[],
): Source => {
  const { o, kind, label, base, push, sub, own, id, subOf } = sourceParts(raw, i, ctx, entities, [
    ...SOURCE_KEYS,
    ...POWER_KEYS,
  ]);
  for (const k of POWER_KEYS)
    if (o[k] !== undefined && o[k] !== null)
      throw new Error(
        `${CARD_TYPE}: ${label}.${k} is a power flow option; the energy flow card reads energy meters`,
      );
  const none = { invert: false };
  if (kind === "solar") {
    if (!base.entity && base.value === undefined)
      throw new Error(`${CARD_TYPE}: ${label} needs 'entity' (its energy meter)`);
    return {
      ...own(base.entity, NODE_D.solar),
      kind: "solar",
      idx: push(base, label, "power.solar"),
      peak: null,
    };
  }
  if (kind === "battery") {
    const c = id(o.charge, "charge"),
      d = id(o.discharge, "discharge");
    if (!(c && d))
      throw new Error(`${CARD_TYPE}: ${label} needs 'charge' and 'discharge' energy meters`);
    const from = chargeFromOf(CARD_TYPE, o.charge_from, label);
    const idx = push({ ...base, entity: c }, label, "power.battery");
    return {
      ...own(c, NODE_D.battery),
      kind: "battery",
      idx,
      secondIdx: sub(d, `${label}.discharge`),
      socIdx: subOf(o.soc, "soc"),
      ...from,
      ...none,
    };
  }
  const im = id(o.import, "import"),
    ex = id(o.export, "export");
  if (!im) throw new Error(`${CARD_TYPE}: ${label} needs 'import' (and 'export') energy meters`);
  const idx = push({ ...base, entity: im }, label, "power.grid");
  return {
    ...own(im, NODE_D.grid),
    kind: "grid",
    idx,
    secondIdx: ex ? sub(ex, `${label}.export`) : null,
    bothWays: false,
    priceIdx: null,
    offlineIdx: null,
    offlineState: "on",
    generatorIdx: null,
    fossilIdx: null,
    fossilKind: null,
    ...none,
  };
};

const normalizeUnits = (raw: RawEnergyFlowConfig): EnergyUnits => {
  const d = raw.decimals;
  if (d !== undefined && d !== null && typeof d === "object") {
    const o = d as { kwh?: unknown; mwh?: unknown };
    return {
      mwhAbove: DEFAULT_UNITS.mwhAbove,
      decKwh: clampDec(o.kwh, DEFAULT_UNITS.decKwh),
      decMwh: clampDec(o.mwh, DEFAULT_UNITS.decMwh),
    };
  }
  const n = numOrNull(d);
  return {
    mwhAbove: DEFAULT_UNITS.mwhAbove,
    decKwh: n === null ? DEFAULT_UNITS.decKwh : clampDec(n, DEFAULT_UNITS.decKwh),
    decMwh: n === null ? DEFAULT_UNITS.decMwh : clampDec(n, DEFAULT_UNITS.decMwh),
  };
};

export const normalizeEnergyFlowConfig = (input: unknown): EnergyFlowConfig => {
  if (!input || typeof input !== "object") throw new Error(`${CARD_TYPE}: invalid config`);
  const raw = input as RawEnergyFlowConfig;
  const ctx = {
    type: CARD_TYPE,
    ...normalizeActionDefaults(raw),
    columns: clampColumns(raw.columns, ENTITY_DEFAULTS.columns),
  };
  const tree = normalizeFlowTree(raw, ctx, {
    source: normalizeSource,
    unit: "kWh",
    idleBelow: IDLE_KWH,
    gross: true,
  });
  const picker = raw.period_picker !== false;
  return {
    ...tree,
    // always a header: the card's name is the title when the config gives none
    hasHeader: true,
    period: enumOf(CARD_TYPE, PERIODS, raw.period, "period", "today"),
    picker,
    units: normalizeUnits(raw),
  };
};

// the items whose values are meters (the home, the sources' meters, the consumers), by index:
// not a battery's charge level, not the header entities
export const meterIdxs = (cfg: EnergyFlowConfig): number[] => treeIdxs(cfg);

// the meters' entity ids, once each (the statistics to fetch)
export const meterIdsOf = (cfg: EnergyFlowConfig): string[] => [
  ...new Set(
    meterIdxs(cfg)
      .map((i) => cfg.entities[i].entity)
      .filter((e): e is string => !!e),
  ),
];
