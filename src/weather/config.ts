// Config normalisation of the weather card (pure). The card is a list of sections like the
// entity sections card: the weather lead (`hero`), entity groups (`row`, `list`, `table`,
// `grid`, `column`) whose entries may name attributes of the weather entity, forecast rows or
// columns (`forecast`) and the multi trend plot of the forecast (`trend`). The result is an
// entity-card config (the base element renders header, rows, tint and templates from it) plus
// the weather-specific items and sections.
import {
  clampColumns,
  normalizeActionDefaults,
  normalizeEntity,
  normalizeGroup,
  normalizeHeaderEntities,
  normalizeHistoryOptions,
  type EntityCardConfig,
  type EntityItem,
  type Group,
  type RawEntity,
  type RawEntityCardBase,
  type RawGroup,
} from "../shared/entity/config.ts";
import { DEFAULTS as ENTITY_DEFAULTS } from "../shared/entity/constants.ts";
import { numOrNull, oneOf } from "../shared/util.ts";
import {
  ATTRIBUTES,
  CARD_TYPE,
  DEFAULTS,
  FORECAST_LAYOUTS,
  FORECAST_MODES,
  GROUP_TYPES,
  QUANTITIES,
  RAIN_FIGURES,
  SECTION_TYPES,
  TREND_LAYOUTS,
  type ForecastLayout,
  type ForecastMode,
  type Quantity,
  type RainFigure,
  type TrendLayoutOption,
} from "./constants.ts";

// ----- the raw config as written in YAML -----

export interface RawWeatherSection extends RawGroup {
  type?: unknown;
  title?: string | null;
  name?: string | null;
  secondary?: string | null;
  mode?: unknown;
  hours_to_show?: unknown;
  days?: unknown;
  show?: unknown;
  x_axis?: unknown;
  y_axis?: unknown;
  show_legend?: unknown;
  rules?: unknown;
  temperature_rules?: unknown;
}
export interface RawWeatherCardConfig extends RawEntityCardBase {
  entity?: string | null;
  name?: string | null;
  secondary?: string | null;
  color?: string | null;
  rules?: unknown;
  temperature_rules?: unknown;
  decimals?: unknown;
  sections?: unknown;
}

// ----- the normalised config -----

// one line of a trend section, like an entity of the multi trend card
export interface TrendEntry {
  quantity: Quantity;
  name: string | null;
  color: string | null;
}
// the items a weather section reads: the card's condition and temperature items, or the
// section's own pair when it sets `rules` / `temperature_rules`
export interface SectionItems {
  condIdx: number;
  tempIdx: number;
}
export type WeatherSection =
  | ({
      kind: "hero";
      title: string | null;
      name: string | null;
      secondary: string | null;
    } & SectionItems)
  | { kind: "entities"; group: Group; title: string | null }
  | ({
      kind: "forecast";
      mode: ForecastMode;
      layout: ForecastLayout;
      count: number; // hours or days
      show: RainFigure[];
      title: string | null;
    } & SectionItems)
  | ({
      kind: "trend";
      mode: ForecastMode;
      count: number;
      show: TrendEntry[];
      layout: TrendLayoutOption;
      xAxis: boolean;
      yAxis: boolean;
      showLegend: boolean;
      title: string | null;
    } & SectionItems);

export interface WeatherConfig extends EntityCardConfig {
  layout: "tile" | "sections";
  entity: string;
  condIdx: number; // the condition item: the entity's state, `rules`
  tempIdx: number; // the temperature item: the `temperature` attribute, `temperature_rules`
  precipIdx: number; // precipitation, probability and wind items: unit and formatting of forecast values
  probIdx: number;
  windIdx: number;
  sections: WeatherSection[];
}

const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const clampInt = (v: unknown, fallback: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.round(numOrNull(v) ?? fallback)));
const bool = (v: unknown, d: boolean) => (v === undefined || v === null ? d : !!v);
const text = (v: unknown): string | null => (typeof v === "string" && v ? v : null);

// `show` of a trend: quantity names or { quantity, name, color } objects (the multi trend
// `entities` shape); unknown quantities are dropped, duplicates keep the first
const trendEntries = (v: unknown): TrendEntry[] => {
  const dflt = () => DEFAULTS.trendShow.map((q) => ({ quantity: q, name: null, color: null }));
  if (!Array.isArray(v)) return dflt();
  const out: TrendEntry[] = [];
  for (const e of v) {
    const o =
      typeof e === "string"
        ? { quantity: e }
        : e && typeof e === "object"
          ? (e as Record<string, unknown>)
          : {};
    const q = o.quantity;
    if (!oneOf(QUANTITIES, q) || out.some((x) => x.quantity === q)) continue;
    out.push({ quantity: q, name: text(o.name), color: text(o.color) });
  }
  return out.length ? out : dflt();
};
// `show` of a forecast: the rain figures per row; `[]` hides them
const rainFigures = (v: unknown): RainFigure[] => {
  if (!Array.isArray(v)) return [...DEFAULTS.rainFigures];
  return [...new Set(v.filter((x): x is RainFigure => oneOf(RAIN_FIGURES, x)))];
};
const modeOf = (sec: RawWeatherSection, label: string): ForecastMode => {
  const mode = sec.mode ?? "daily";
  if (!oneOf(FORECAST_MODES, mode))
    throw new Error(`${CARD_TYPE}: ${label}.mode must be one of ${FORECAST_MODES.join(" | ")}`);
  return mode;
};
const countOf = (sec: RawWeatherSection, mode: ForecastMode) =>
  mode === "hourly"
    ? clampInt(sec.hours_to_show, DEFAULTS.hours, 1, DEFAULTS.maxHours)
    : clampInt(sec.days, DEFAULTS.days, 1, DEFAULTS.maxDays);

// an entry of an entity group: an attribute name of the weather entity becomes an attribute
// item with the translated name, icon and unit; an object without `entity` reads the weather
// entity; anything else is a normal entity item
const withWeatherEntity = (e: unknown, entity: string): unknown => {
  if (typeof e === "string" && !e.includes(".")) {
    const def = ATTRIBUTES[e];
    return def
      ? { entity, attribute: e, icon: def.icon, unit: def.unit, decimals: def.decimals }
      : { entity, attribute: e, name: e };
  }
  if (e && typeof e === "object") {
    const o = e as RawEntity;
    return o.entity || o.value !== undefined ? o : { ...o, entity };
  }
  return e;
};
const markAttribute = (item: EntityItem, raw: unknown) => {
  const def = typeof raw === "string" ? ATTRIBUTES[raw] : undefined;
  if (!def) return;
  item.nameKey = def.nameKey;
  if (def.unitAttr) item.unitAttr = def.unitAttr;
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

  // the condition: the state with the card's rules; the temperature: an attribute with its own;
  // rain, rain chance and wind: items that know the units and formatting of forecast values
  const cond = normalizeEntity(
    { entity, name: raw.name, secondary: raw.secondary, color: raw.color, rules: raw.rules },
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

  // a section with its own rules, name or secondary gets its own condition / temperature items
  // (so its templates are collected and subscribed like every other item's)
  const sectionItems = (sec: RawWeatherSection, label: string): SectionItems => {
    if (
      sec.rules === undefined &&
      sec.temperature_rules === undefined &&
      sec.name == null &&
      sec.secondary == null
    )
      return { condIdx: 0, tempIdx: 1 };
    const c = normalizeEntity(
      {
        entity,
        name: sec.name ?? raw.name,
        secondary: sec.secondary ?? raw.secondary,
        color: raw.color,
        rules: sec.rules ?? raw.rules,
      },
      ctx,
      label,
    );
    const tt = normalizeEntity(
      {
        entity,
        attribute: "temperature",
        rules: sec.temperature_rules ?? raw.temperature_rules,
        decimals: raw.decimals,
      },
      ctx,
      `${label}.temperature`,
    );
    entities.push(c, tt);
    return { condIdx: entities.length - 2, tempIdx: entities.length - 1 };
  };

  const sections: WeatherSection[] = [];
  const groups: Group[] = [];
  list(raw.sections).forEach((s, i) => {
    const sec = s && typeof s === "object" ? (s as RawWeatherSection) : {};
    const label = `sections[${i}]`;
    const type = sec.type;
    if (!oneOf(SECTION_TYPES, type))
      throw new Error(`${CARD_TYPE}: ${label}.type must be one of ${SECTION_TYPES.join(" | ")}`);
    const title = sec.title ?? null;
    if (type === "hero") {
      sections.push({
        kind: "hero",
        title,
        name: sec.name ?? null,
        secondary: sec.secondary ?? null,
        ...sectionItems(sec, label),
      });
    } else if (oneOf(GROUP_TYPES, type)) {
      const rawEntities = list(sec.entities);
      // row items show their value (the entity cards' row items show only icon + name) unless
      // the section or the card says otherwise
      const defaults =
        type === "row" && sec.show_value == null && raw.show_value == null
          ? { ...sec, show_value: true }
          : sec;
      const r = normalizeGroup(
        {
          ...defaults,
          layout: type,
          entities: rawEntities.map((e) => withWeatherEntity(e, entity)),
        },
        ctx,
        raw,
        label,
        entities.length,
      );
      r.entities.forEach((item, k) => markAttribute(item, rawEntities[k]));
      if (type === "row" && sec.align === undefined && raw.align === undefined)
        r.group.align = "stretch";
      entities.push(...r.entities);
      groups.push(r.group);
      sections.push({ kind: "entities", group: r.group, title });
    } else if (type === "forecast") {
      const mode = modeOf(sec, label);
      const layout = sec.layout ?? DEFAULTS.forecastLayout;
      if (!oneOf(FORECAST_LAYOUTS, layout))
        throw new Error(
          `${CARD_TYPE}: ${label}.layout must be one of ${FORECAST_LAYOUTS.join(" | ")}`,
        );
      sections.push({
        kind: "forecast",
        mode,
        layout,
        count: countOf(sec, mode),
        show: rainFigures(sec.show),
        title,
        ...sectionItems(sec, label),
      });
    } else {
      const mode = modeOf(sec, label);
      const layout = sec.layout ?? "auto";
      if (!oneOf(TREND_LAYOUTS, layout))
        throw new Error(
          `${CARD_TYPE}: ${label}.layout must be one of ${TREND_LAYOUTS.join(" | ")}`,
        );
      sections.push({
        kind: "trend",
        mode,
        count: countOf(sec, mode),
        show: trendEntries(sec.show),
        layout,
        xAxis: bool(sec.x_axis, true),
        yAxis: bool(sec.y_axis, false),
        showLegend: bool(sec.show_legend, true),
        title,
        ...sectionItems(sec, label),
      });
    }
  });

  const header = normalizeHeaderEntities(raw.header_entities, ctx);
  const headerIdxs = header.map((_, i) => entities.length + i);
  entities.push(...header);

  return {
    layout: sections.length ? "sections" : "tile",
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
    sections,
  };
};

// the forecast types the sections need (before the entity says which it supports): the hero
// and the tile show today's high / low from the daily forecast
export const wantedForecasts = (cfg: WeatherConfig) => {
  const modes = cfg.sections.flatMap((s) =>
    s.kind === "forecast" || s.kind === "trend" ? [s.mode] : [],
  );
  return {
    hourly: modes.includes("hourly"),
    daily:
      cfg.layout === "tile" ||
      cfg.sections.some((s) => s.kind === "hero") ||
      modes.includes("daily"),
  };
};
