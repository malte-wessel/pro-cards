// Config normalisation of the weather card (pure). The result is an entity-card config (the
// base element renders header, rows, tint and templates from it) plus what is weather-specific:
// which entity items are the condition and the temperature, the attributes group and the
// forecast / entity sections.
import {
  clampColumns,
  normalizeActionDefaults,
  normalizeEntity,
  normalizeGroup,
  normalizeHeaderEntities,
  normalizeHistoryOptions,
  normalizeItemOptions,
  type EntityCardConfig,
  type EntityItem,
  type Group,
  type RawEntity,
  type RawEntityCardBase,
  type RawGroup,
} from "../shared/entity/config.ts";
import { DEFAULTS as ENTITY_DEFAULTS, ITEM_DEFAULTS } from "../shared/entity/constants.ts";
import { numOrNull, oneOf } from "../shared/util.ts";
import {
  ATTRIBUTES,
  ATTRIBUTE_LAYOUTS,
  CARD_TYPE,
  DAILY_LAYOUTS,
  DAILY_SHOW,
  DEFAULTS,
  HOURLY_SHOW,
  HOURLY_VISUALS,
  LAYOUTS,
  SECTION_TYPES,
  type AttributeLayout,
  type DailyLayout,
  type DailyShow,
  type HourlyShow,
  type HourlyVisual,
  type WeatherLayout,
} from "./constants.ts";

// ----- the raw config as written in YAML -----

export interface RawWeatherSection extends RawGroup {
  type?: unknown;
  title?: string | null;
  hours_to_show?: unknown;
  bucket_minutes?: unknown;
  visual?: unknown;
  show?: unknown;
  days?: unknown;
}
export interface RawWeatherCardConfig extends RawEntityCardBase {
  entity?: string | null;
  name?: string | null;
  secondary?: string | null;
  color?: string | null;
  layout?: unknown;
  rules?: unknown;
  temperature_rules?: unknown;
  decimals?: unknown;
  attributes?: unknown;
  attributes_layout?: unknown;
  sections?: unknown;
}

// ----- the normalised config -----

export type WeatherSection =
  // a `type: hourly` section (lanes per `show`) or one quantity as its own section
  // (`type: temperature | precipitation | probability | wind`: one lane, `quantity` set, own title)
  | {
      kind: "hourly";
      hours: number;
      bucketMin: number;
      visual: HourlyVisual;
      show: HourlyShow[];
      quantity: HourlyShow | null;
      title: string | null;
    }
  | { kind: "daily"; days: number; layout: DailyLayout; show: DailyShow[] }
  | { kind: "entities"; group: Group; title: string | null };

export interface WeatherConfig extends EntityCardConfig {
  layout: WeatherLayout;
  entity: string;
  condIdx: number; // the condition item: the entity's state, `rules`
  tempIdx: number; // the temperature item: the `temperature` attribute, `temperature_rules`
  precipIdx: number; // precipitation, probability and wind items: unit and formatting of forecast values
  probIdx: number;
  windIdx: number;
  attrGroup: Group | null;
  sections: WeatherSection[];
}

const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const clampInt = (v: unknown, fallback: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.round(numOrNull(v) ?? fallback)));
const pick = <T extends string>(v: unknown, all: readonly T[], fallback: readonly T[]): T[] => {
  if (!Array.isArray(v)) return [...fallback];
  const out = v.filter((x): x is T => oneOf(all, x));
  return out.length ? [...new Set(out)] : [...fallback];
};

export const normalizeWeatherCardConfig = (input: unknown): WeatherConfig => {
  if (!input || typeof input !== "object") throw new Error(`${CARD_TYPE}: invalid config`);
  const raw = input as RawWeatherCardConfig;
  const entity = raw.entity;
  if (typeof entity !== "string" || !entity.startsWith("weather."))
    throw new Error(`${CARD_TYPE}: 'entity' must be a weather entity (weather.*)`);
  const ctx = {
    type: CARD_TYPE,
    ...normalizeActionDefaults(raw),
    columns: clampColumns(raw.columns, ENTITY_DEFAULTS.columns),
  };
  const entities: EntityItem[] = [];

  // the condition: the state with the card's rules; the temperature: an attribute with its own
  const cond = normalizeEntity(
    {
      entity,
      name: raw.name,
      secondary: raw.secondary,
      color: raw.color,
      rules: raw.rules,
    },
    ctx,
    "the card",
  );
  const temp = normalizeEntity(
    { entity, attribute: "temperature", rules: raw.temperature_rules, decimals: raw.decimals },
    ctx,
    "temperature",
  );
  const precip = normalizeEntity({ entity, attribute: "precipitation" }, ctx, "precipitation");
  const prob = normalizeEntity(
    { entity, attribute: "precipitation_probability", unit: "%", decimals: 0 },
    ctx,
    "probability",
  );
  const wind = normalizeEntity({ entity, attribute: "wind_speed" }, ctx, "wind");
  entities.push(cond, temp, precip, prob, wind);

  // attributes: a key of the weather entity (translated name, icon and unit known) or any entity
  let attrGroup: Group | null = null;
  const attrs = list(raw.attributes);
  if (attrs.length) {
    const layout = raw.attributes_layout ?? DEFAULTS.attributesLayout;
    if (!oneOf(ATTRIBUTE_LAYOUTS, layout))
      throw new Error(
        `${CARD_TYPE}: attributes_layout must be one of ${ATTRIBUTE_LAYOUTS.join(" | ")}`,
      );
    const base = (layout === "row" && ITEM_DEFAULTS.row) || ITEM_DEFAULTS.other;
    // row items show their value (the entity cards' row items show only icon + name)
    const itemDefaults = normalizeItemOptions(raw, {
      showName: base.showName,
      showValue: true,
      showIcon: base.showIcon,
      namePosition: base.namePosition,
    });
    const items = attrs.map((a, i) => {
      const label = `attributes[${i}]`;
      if (typeof a === "string") {
        const def = ATTRIBUTES[a];
        const item = normalizeEntity(
          def
            ? { entity, attribute: a, icon: def.icon, unit: def.unit, decimals: def.decimals }
            : { entity, attribute: a, name: a },
          ctx,
          label,
          itemDefaults,
        );
        if (def) {
          item.nameKey = def.nameKey;
          if (def.unitAttr) item.unitAttr = def.unitAttr;
        }
        return item;
      }
      const o = a && typeof a === "object" ? (a as RawEntity) : {};
      const withEntity = o.entity || o.value !== undefined ? o : { ...o, entity };
      return normalizeEntity(withEntity, ctx, label, itemDefaults);
    });
    attrGroup = {
      layout: layout as AttributeLayout,
      idxs: items.map((_, i) => entities.length + i),
      align: layout === "row" ? "stretch" : "start",
      columns: ctx.columns,
      divider: false,
      hasIcon: false,
    };
    entities.push(...items);
  }

  // sections: hourly / daily forecasts or entity groups (the entity-sections-card shape)
  const sections: WeatherSection[] = [];
  const groups: Group[] = attrGroup ? [attrGroup] : [];
  list(raw.sections).forEach((s, i) => {
    const sec = s && typeof s === "object" ? (s as RawWeatherSection) : {};
    const label = `sections[${i}]`;
    const type = sec.type ?? "entities";
    if (!oneOf(SECTION_TYPES, type) && !oneOf(HOURLY_SHOW, type))
      throw new Error(
        `${CARD_TYPE}: ${label}.type must be one of ${[...SECTION_TYPES, ...HOURLY_SHOW].join(" | ")}`,
      );
    if (type === "hourly" || oneOf(HOURLY_SHOW, type)) {
      const visual = sec.visual ?? DEFAULTS.hourlyVisual;
      if (!oneOf(HOURLY_VISUALS, visual))
        throw new Error(
          `${CARD_TYPE}: ${label}.visual must be one of ${HOURLY_VISUALS.join(" | ")}`,
        );
      const quantity = oneOf(HOURLY_SHOW, type) ? type : null;
      sections.push({
        kind: "hourly",
        hours: clampInt(sec.hours_to_show, DEFAULTS.hours, 1, DEFAULTS.maxHours),
        bucketMin: Math.max(60, numOrNull(sec.bucket_minutes) ?? DEFAULTS.bucketMin),
        visual,
        show: quantity ? [quantity] : pick(sec.show, HOURLY_SHOW, DEFAULTS.hourlyShow),
        quantity,
        title: quantity ? (sec.title ?? null) : null,
      });
    } else if (type === "daily") {
      const layout = sec.layout ?? DEFAULTS.dailyLayout;
      if (!oneOf(DAILY_LAYOUTS, layout))
        throw new Error(
          `${CARD_TYPE}: ${label}.layout must be one of ${DAILY_LAYOUTS.join(" | ")}`,
        );
      sections.push({
        kind: "daily",
        days: clampInt(sec.days, DEFAULTS.days, 1, DEFAULTS.maxDays),
        layout,
        show: pick(sec.show, DAILY_SHOW, DEFAULTS.dailyShow),
      });
    } else {
      const r = normalizeGroup(sec, ctx, raw, label, entities.length);
      entities.push(...r.entities);
      groups.push(r.group);
      sections.push({ kind: "entities", group: r.group, title: sec.title ?? null });
    }
  });

  const header = normalizeHeaderEntities(raw.header_entities, ctx);
  const headerIdxs = header.map((_, i) => entities.length + i);
  entities.push(...header);

  // the layout: a tile unless asked for more (a title, attributes or sections)
  let layout: WeatherLayout;
  if (raw.layout === undefined || raw.layout === null)
    layout = attrGroup || sections.length || raw.title || header.length ? "hero" : "tile";
  else if (oneOf(LAYOUTS, raw.layout)) layout = raw.layout;
  else throw new Error(`${CARD_TYPE}: layout must be one of ${LAYOUTS.join(" | ")}`);

  return {
    layout,
    entity,
    title: raw.title ?? null,
    icon: raw.icon ?? null,
    ...normalizeHistoryOptions(raw),
    ...ctx,
    entities,
    groups,
    headerIdxs,
    hasHeader: !!(raw.title || raw.icon || header.length),
    condIdx: 0,
    tempIdx: 1,
    precipIdx: 2,
    probIdx: 3,
    windIdx: 4,
    attrGroup,
    sections,
  };
};

// the forecast types the sections need (before the entity says which it supports)
export const wantedForecasts = (cfg: WeatherConfig) => ({
  hourly: cfg.sections.some((s) => s.kind === "hourly"),
  daily: cfg.layout === "hero" || cfg.sections.some((s) => s.kind === "daily"),
});
