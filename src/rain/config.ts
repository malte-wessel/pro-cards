// Config normalisation of the rain card (pure). The result is an entity-card config whose first
// item is the rain rate; today's total, the wind speed and its direction follow when named.
import {
  clampColumns,
  normalizeActionDefaults,
  normalizeEntity,
  normalizeHeaderEntities,
  normalizeHistoryOptions,
  type EntityItem,
} from "../shared/entity/config.ts";
import { DEFAULTS as ENTITY_DEFAULTS } from "../shared/entity/constants.ts";
import {
  bandHeight,
  enumOf,
  flowObject,
  sensorId,
  type FlowCardConfig,
  type RawFlowCardBase,
} from "../shared/flow/config.ts";
import { LAYOUTS, VISUALS } from "../shared/flow/constants.ts";
import { CARD_TYPE, DEFAULTS, LEADS, RAIN_STYLES, type Lead, type RainStyle } from "./constants.ts";

export interface RawRainCardConfig extends RawFlowCardBase {
  today?: string | null;
  wind?: string | null;
  direction?: string | null;
}

export interface RainConfig extends FlowCardConfig {
  lead: Lead;
  entity: string;
  rateIdx: number; // the rate item (= leadIdx): carries name / secondary / color / rules
  todayIdx: number | null;
  windIdx: number | null;
  dirIdx: number | null;
  flow: { style: RainStyle; height: number };
}

export const normalizeRainCardConfig = (input: unknown): RainConfig => {
  if (!input || typeof input !== "object") throw new Error(`${CARD_TYPE}: invalid config`);
  const raw = input as RawRainCardConfig;
  const entity = raw.entity;
  if (typeof entity !== "string" || !entity.startsWith("sensor."))
    throw new Error(`${CARD_TYPE}: 'entity' must be a rain rate sensor (sensor.*)`);
  const ctx = {
    type: CARD_TYPE,
    ...normalizeActionDefaults(raw),
    columns: clampColumns(raw.columns, ENTITY_DEFAULTS.columns),
  };
  const layout = enumOf(CARD_TYPE, LAYOUTS, raw.layout, "layout", "tile");
  const visual = enumOf(CARD_TYPE, VISUALS, raw.visual, "visual", "icon");
  const lead =
    visual === "flow" && layout === "tile"
      ? "icon"
      : enumOf(CARD_TYPE, LEADS, raw.lead, "lead", "animated");
  const fo = flowObject(CARD_TYPE, raw.flow);
  const flow = {
    style: enumOf(CARD_TYPE, RAIN_STYLES, fo.style, "flow.style", DEFAULTS.style),
    height: bandHeight(fo),
  };

  const entities: EntityItem[] = [];
  const rate = normalizeEntity(
    {
      entity,
      name: raw.name,
      secondary: raw.secondary,
      color: raw.color,
      rules: raw.rules,
      decimals: raw.decimals,
    },
    ctx,
    "the card",
  );
  entities.push(rate);
  const extra = (
    id: string | null,
    label: string,
    nameKey: EntityItem["nameKey"],
  ): number | null => {
    if (!id) return null;
    const item = normalizeEntity({ entity: id }, ctx, label);
    item.nameKey = nameKey;
    return entities.push(item) - 1;
  };
  const todayIdx = extra(sensorId(CARD_TYPE, raw.today, "today"), "today", "rain.today_name");
  const windIdx = extra(sensorId(CARD_TYPE, raw.wind, "wind"), "wind", "weather.attr.wind_speed");
  const dirIdx = extra(
    sensorId(CARD_TYPE, raw.direction, "direction"),
    "direction",
    "weather.attr.wind_bearing",
  );
  const header = normalizeHeaderEntities(raw.header_entities, ctx);
  const headerIdxs = header.map((_, i) => entities.length + i);
  entities.push(...header);

  return {
    layout,
    visual,
    lead,
    entity,
    title: raw.title ?? null,
    icon: raw.icon ?? null,
    ...normalizeHistoryOptions(raw),
    ...ctx,
    entities,
    groups: [],
    headerIdxs,
    hasHeader: !!(raw.title || raw.icon || header.length),
    leadIdx: 0,
    rateIdx: 0,
    todayIdx,
    windIdx,
    dirIdx,
    flow,
  };
};
