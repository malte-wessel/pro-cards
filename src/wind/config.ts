// Config normalisation of the wind card (pure). The result is an entity-card config (the base
// element renders header, rows, tint and templates from it) whose first three items are the wind
// speed, the direction and the gusts: sensor states, or attributes of a weather entity.
import {
  clampColumns,
  normalizeActionDefaults,
  normalizeEntity,
  normalizeHeaderEntities,
  normalizeHistoryOptions,
  type EntityCardConfig,
  type EntityItem,
  type RawEntityCardBase,
} from "../shared/entity/config.ts";
import { DEFAULTS as ENTITY_DEFAULTS } from "../shared/entity/constants.ts";
import { numOrNull, oneOf } from "../shared/util.ts";
import {
  CARD_TYPE,
  DEFAULTS,
  DENSITIES,
  FLOW_STYLES,
  LAYOUTS,
  LEADS,
  VISUALS,
  type Density,
  type FlowStyle,
  type Layout,
  type Lead,
  type WindVisual,
} from "./constants.ts";

// ----- the raw config as written in YAML -----

export interface RawFlowOptions {
  style?: unknown;
  density?: unknown;
  height?: unknown;
}
export interface RawWindCardConfig extends RawEntityCardBase {
  entity?: string | null;
  direction?: string | null;
  gust?: string | null;
  name?: string | null;
  secondary?: string | null;
  color?: string | null;
  rules?: unknown;
  decimals?: unknown;
  layout?: unknown;
  visual?: unknown;
  lead?: unknown;
  flow?: unknown;
}

// ----- the normalised config -----

export interface FlowOptions {
  style: FlowStyle;
  density: Density;
  height: number; // the hero's band; the flow tile's band is DEFAULTS.tileBandH
}
export interface WindConfig extends EntityCardConfig {
  layout: Layout;
  visual: WindVisual; // tile only
  lead: Lead;
  entity: string;
  source: "sensor" | "weather";
  speedIdx: number; // the speed item: state or `wind_speed`; carries name / secondary / color / rules
  dirIdx: number | null; // the direction item: `direction` sensor or `wind_bearing`
  gustIdx: number | null; // the gust item: `gust` sensor or `wind_gust_speed`
  flow: FlowOptions;
}

const clampInt = (v: unknown, fallback: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.round(numOrNull(v) ?? fallback)));
const enumOf = <T extends string>(list: readonly T[], v: unknown, key: string, dflt: T): T => {
  if (v === undefined || v === null) return dflt;
  if (!oneOf(list, v)) throw new Error(`${CARD_TYPE}: ${key} must be one of ${list.join(" | ")}`);
  return v;
};
const sensorId = (v: unknown, key: string): string | null => {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v !== "string" || !v.startsWith("sensor."))
    throw new Error(`${CARD_TYPE}: '${key}' must be a sensor entity (sensor.*)`);
  return v;
};

export const normalizeWindCardConfig = (input: unknown): WindConfig => {
  if (!input || typeof input !== "object") throw new Error(`${CARD_TYPE}: invalid config`);
  const raw = input as RawWindCardConfig;
  const entity = raw.entity;
  if (typeof entity !== "string" || !/^(sensor|weather)\./.test(entity))
    throw new Error(
      `${CARD_TYPE}: 'entity' must be a sensor or weather entity (sensor.* / weather.*)`,
    );
  const source = entity.startsWith("weather.") ? "weather" : "sensor";
  const ctx = {
    type: CARD_TYPE,
    ...normalizeActionDefaults(raw),
    columns: clampColumns(raw.columns, ENTITY_DEFAULTS.columns),
  };
  const layout = enumOf(LAYOUTS, raw.layout, "layout", "tile");
  const visual = enumOf(VISUALS, raw.visual, "visual", "icon");
  const lead =
    visual === "flow" && layout === "tile" ? "arrow" : enumOf(LEADS, raw.lead, "lead", "animated");
  const fo: RawFlowOptions =
    raw.flow && typeof raw.flow === "object" ? (raw.flow as RawFlowOptions) : {};
  if (raw.flow !== undefined && raw.flow !== null && typeof raw.flow !== "object")
    throw new Error(`${CARD_TYPE}: 'flow' must be an object`);
  const flow: FlowOptions = {
    style: enumOf(FLOW_STYLES, fo.style, "flow.style", DEFAULTS.style),
    density: enumOf(DENSITIES, fo.density, "flow.density", DEFAULTS.density),
    height: clampInt(fo.height, DEFAULTS.heroBandH, DEFAULTS.minBandH, DEFAULTS.maxBandH),
  };

  const entities: EntityItem[] = [];
  const dirSensor = sensorId(raw.direction, "direction");
  const gustSensor = sensorId(raw.gust, "gust");
  // the speed: the sensor's state, or the weather entity's wind_speed, with the card's rules
  const speed = normalizeEntity(
    {
      entity,
      attribute: source === "weather" ? "wind_speed" : null,
      name: raw.name,
      secondary: raw.secondary,
      color: raw.color,
      rules: raw.rules,
      decimals: raw.decimals,
    },
    ctx,
    "the card",
  );
  if (source === "weather") speed.nameKey = "weather.attr.wind_speed";
  entities.push(speed);
  let dirIdx: number | null = null,
    gustIdx: number | null = null;
  if (dirSensor || source === "weather") {
    const dir = normalizeEntity(
      dirSensor
        ? { entity: dirSensor }
        : { entity, attribute: "wind_bearing", unit: "°", decimals: 0 },
      ctx,
      "direction",
    );
    dir.nameKey = "weather.attr.wind_bearing";
    dirIdx = entities.push(dir) - 1;
  }
  if (gustSensor || source === "weather") {
    const gust = normalizeEntity(
      gustSensor ? { entity: gustSensor } : { entity, attribute: "wind_gust_speed" },
      ctx,
      "gust",
    );
    gust.nameKey = "weather.attr.wind_gust_speed";
    if (!gustSensor) gust.unitAttr = "wind_speed_unit";
    gustIdx = entities.push(gust) - 1;
  }
  const header = normalizeHeaderEntities(raw.header_entities, ctx);
  const headerIdxs = header.map((_, i) => entities.length + i);
  entities.push(...header);

  return {
    layout,
    visual,
    lead,
    entity,
    source,
    title: raw.title ?? null,
    icon: raw.icon ?? null,
    ...normalizeHistoryOptions(raw),
    ...ctx,
    entities,
    groups: [],
    headerIdxs,
    hasHeader: !!(raw.title || raw.icon || header.length),
    speedIdx: 0,
    dirIdx,
    gustIdx,
    flow,
  };
};
