// Config normalisation (pure) shared by the entity cards.
//
// Every card ends up with the same normalised shape (`EntityCardConfig`):
//   { type, title, icon, hours, bucketMin, columns, tap, hold, dbl,
//     entities: [Entity], groups: [{ layout, idxs, align, columns, divider, hasIcon }], headerIdxs, hasHeader }
// `entities` is one flat list; groups and header entities point into it by index.
import {
  ALIGNS,
  BLOCK_VISUALS,
  DEFAULTS,
  GROUP_LAYOUTS,
  HEADER_VISUALS,
  ITEM_DEFAULTS,
  ITEM_LAYOUTS,
  VISUALS,
  type Align,
  type GroupLayout,
  type ItemDefaults,
  type NamePosition,
  type Visual,
} from "./constants.ts";
import type { ActionConfig, CardConfigBase } from "../ha.ts";
import type { StringKey } from "../i18n.ts";
import { isTemplate, numOrNull, oneOf } from "../util.ts";

// ----- the raw config as written in YAML -----

// an action as written in YAML: a bare action name or an action object (HA reads its keys)
export type RawAction = string | (Partial<ActionConfig> & Record<string, unknown>) | null;
export interface RawActionDefaults {
  tap_action?: RawAction;
  hold_action?: RawAction;
  double_tap_action?: RawAction;
}
export interface RawHistoryOptions {
  hours_to_show?: unknown;
  bucket_minutes?: unknown;
}
export interface RawItemOptions {
  show_name?: boolean | null;
  show_value?: boolean | null;
  show_icon?: boolean | null;
  name_position?: string | null;
}
export interface RawRule {
  state?: unknown;
  below?: unknown;
  above?: unknown;
  color?: string | null;
  icon?: string | null;
  label?: string | null;
  tint_card?: boolean;
}
export interface RawEntity extends RawItemOptions, RawActionDefaults {
  entity?: string | null;
  name?: string | null;
  secondary?: string | null;
  icon?: string | null;
  color?: string | null;
  attribute?: string | null;
  value?: unknown;
  unit?: string | null;
  decimals?: unknown;
  prefix?: string;
  suffix?: string;
  visual?: string;
  min?: unknown;
  max?: unknown;
  rules?: unknown;
  toggle?: boolean;
}
export type RawEntityInput = string | RawEntity;
export interface RawGroup extends RawItemOptions {
  layout?: unknown;
  entities?: unknown;
  align?: unknown;
  columns?: unknown;
  divider?: boolean;
}
// keys every entity card accepts at the top level
export interface RawEntityCardBase
  extends CardConfigBase, RawActionDefaults, RawHistoryOptions, RawItemOptions {
  title?: string | null;
  icon?: string | null;
  align?: unknown;
  columns?: unknown;
  header_entities?: unknown;
}

// ----- the normalised config -----

export type ValueSrc =
  | { kind: "state" }
  | { kind: "text"; text: string }
  | { kind: "template"; template: string }
  | { kind: "attribute"; key: string };
export interface Rule {
  state: string | null;
  below: number | null;
  above: number | null;
  color: string | null;
  icon: string | null;
  label: string | null;
  tintCard: boolean;
}
export interface ItemOptions {
  showName: boolean;
  showValue: boolean;
  showIcon: boolean;
  namePosition: NamePosition;
}
export interface ActionDefaults {
  tap: ActionConfig;
  hold: ActionConfig;
  dbl: ActionConfig;
}
export interface EntityItem extends ActionDefaults {
  entity: string | null;
  name: string | null;
  // set by cards that build items themselves: a translated default name and the attribute
  // that holds the unit (`temperature_unit` for a weather entity's apparent_temperature)
  nameKey?: StringKey;
  unitAttr?: string;
  secondary: string | null;
  icon: string | null;
  color: string | null;
  valueSrc: ValueSrc;
  unit: string | null;
  decimals: number | null;
  prefix: string;
  suffix: string;
  visual: Visual;
  min: number | null;
  max: number | null;
  rules: Rule[];
  toggle: boolean;
  item: ItemOptions;
}
export interface Group {
  layout: GroupLayout | "tile";
  idxs: number[];
  align: Align | undefined;
  columns: number;
  divider: boolean;
  hasIcon: boolean;
}
// ctx carries the card type (for error messages) and the action defaults
export interface NormalizeCtx extends ActionDefaults {
  type: string;
  columns?: number;
}
export interface EntityCardConfig extends ActionDefaults {
  type: string;
  layout: GroupLayout | "tile" | "sections";
  title: string | null;
  icon: string | null;
  hours: number;
  bucketMin: number;
  columns: number;
  entities: EntityItem[];
  groups: Group[];
  headerIdxs: number[];
  hasHeader: boolean;
}

export const normalizeAction = (a: RawAction | undefined, fallback: ActionConfig): ActionConfig => {
  if (a === undefined || a === null) return fallback;
  if (typeof a === "string") return { action: a };
  return { action: "more-info", ...a };
};
export const normalizeActionDefaults = (raw: RawActionDefaults): ActionDefaults => ({
  tap: normalizeAction(raw.tap_action, { action: "more-info" }),
  hold: normalizeAction(raw.hold_action, { action: "more-info" }),
  dbl: normalizeAction(raw.double_tap_action, { action: "none" }),
});
export const normalizeHistoryOptions = (raw: RawHistoryOptions) => ({
  hours: Math.max(1, numOrNull(raw.hours_to_show) ?? DEFAULTS.hours_to_show),
  bucketMin: Math.max(5, numOrNull(raw.bucket_minutes) ?? DEFAULTS.bucket_minutes),
});
export const clampColumns = (v: unknown, fallback: number) =>
  Math.max(1, Math.min(4, Math.round(numOrNull(v) ?? fallback)));

// `value` is plain text or a template; null when not set
export const normalizeValue = (v: unknown): ValueSrc | null => {
  if (v === undefined || v === null) return null;
  const s = String(v);
  return isTemplate(s) ? { kind: "template", template: s } : { kind: "text", text: s };
};
// rules: [{ state | below | above, color, icon, label, tint_card }], kept in author order
export const normalizeRules = (list: unknown): Rule[] => {
  if (!Array.isArray(list)) return [];
  return list
    .filter((x): x is RawRule => !!x && typeof x === "object")
    .map((x) => ({
      state: x.state === undefined || x.state === null ? null : String(x.state),
      below: numOrNull(x.below),
      above: numOrNull(x.above),
      color: x.color ?? null,
      icon: x.icon ?? null,
      label: x.label ?? null,
      tintCard: !!x.tint_card,
    }))
    .filter((r) => r.state !== null || r.below !== null || r.above !== null);
};
// item options (row / column / table items, header entities): raw keys override the defaults
export const normalizeItemOptions = (
  raw: RawItemOptions | null | undefined,
  defaults: ItemOptions,
): ItemOptions => {
  const o = raw && typeof raw === "object" ? raw : {};
  const bool = (v: boolean | null | undefined, d: boolean) =>
    v === undefined || v === null ? d : !!v;
  return {
    showName: bool(o.show_name, defaults.showName),
    showValue: bool(o.show_value, defaults.showValue),
    showIcon: bool(o.show_icon, defaults.showIcon),
    namePosition:
      o.name_position === "above" || o.name_position === "below"
        ? o.name_position
        : defaults.namePosition,
  };
};

export const normalizeEntity = (
  raw: RawEntityInput | null | undefined,
  ctx: NormalizeCtx,
  label: string,
  itemDefaults: ItemDefaults = ITEM_DEFAULTS.other,
): EntityItem => {
  const o: RawEntity = typeof raw === "string" ? { entity: raw } : { ...(raw || {}) };
  let valueSrc: ValueSrc;
  if (o.attribute !== undefined && o.attribute !== null && o.attribute !== "") {
    if (o.value !== undefined)
      console.warn(`${ctx.type}: ${label} sets both 'attribute' and 'value'; using the attribute`);
    valueSrc = { kind: "attribute", key: String(o.attribute) };
  } else valueSrc = normalizeValue(o.value) ?? { kind: "state" };
  if (!o.entity && valueSrc.kind !== "template" && valueSrc.kind !== "text")
    throw new Error(`${ctx.type}: ${label} needs 'entity' or 'value'`);
  const dec = numOrNull(o.decimals);
  return {
    entity: o.entity || null,
    name: o.name ?? null,
    secondary: o.secondary ?? null,
    icon: o.icon ?? null,
    color: o.color ?? null,
    valueSrc,
    unit: o.unit ?? null,
    decimals: dec === null ? null : Math.max(0, Math.min(3, Math.round(dec))),
    prefix: o.prefix ?? "",
    suffix: o.suffix ?? "",
    visual: oneOf(VISUALS, o.visual) ? o.visual : "icon",
    min: numOrNull(o.min),
    max: numOrNull(o.max),
    rules: normalizeRules(o.rules),
    toggle: !!o.toggle,
    tap: normalizeAction(o.tap_action, ctx.tap),
    hold: normalizeAction(o.hold_action, ctx.hold),
    dbl: normalizeAction(o.double_tap_action, ctx.dbl),
    item: normalizeItemOptions(o, itemDefaults),
  };
};

// One group of entities with a layout. Returns { group, entities }; the caller appends the
// entities to the flat list, group.idxs already point at their final positions (offset + i).
// Item options cascade: layout defaults → card keys → group keys → entity keys.
export const normalizeGroup = (
  rawGroup: unknown,
  ctx: NormalizeCtx,
  cardRaw: RawEntityCardBase,
  label: string,
  offset: number,
): { group: Group; entities: EntityItem[] } => {
  const g: RawGroup = rawGroup && typeof rawGroup === "object" ? (rawGroup as RawGroup) : {};
  const layout = g.layout === undefined ? DEFAULTS.layout : g.layout;
  if (!oneOf(GROUP_LAYOUTS, layout))
    throw new Error(
      `${ctx.type}: ${label === "entities" ? "layout" : `${label}.layout`} must be one of ${GROUP_LAYOUTS.join(" | ")}`,
    );
  const list = g.entities;
  const entLabel = label === "entities" ? "entities" : `${label}.entities`;
  if (!Array.isArray(list) || list.length === 0)
    throw new Error(`${ctx.type}: '${entLabel}' must be a non-empty list`);
  const base = ITEM_DEFAULTS[layout] || ITEM_DEFAULTS.other;
  const itemDefaults = normalizeItemOptions(g, normalizeItemOptions(cardRaw, base));
  const isItem = ITEM_LAYOUTS.has(layout);
  const entities = (list as (RawEntityInput | null | undefined)[]).map((e, i) => {
    const ent = normalizeEntity(e, ctx, `${entLabel}[${i}]`, itemDefaults);
    if (isItem && BLOCK_VISUALS.has(ent.visual)) {
      console.warn(`${ctx.type}: visual '${ent.visual}' is not drawn in a ${layout}; using icon`);
      ent.visual = "icon";
    }
    return ent;
  });
  const align = g.align ?? cardRaw.align;
  return {
    group: {
      layout,
      idxs: entities.map((_, i) => offset + i),
      align: oneOf(ALIGNS, align) ? align : base.align,
      columns: clampColumns(g.columns, ctx.columns ?? DEFAULTS.columns),
      divider: !!g.divider,
      hasIcon: layout === "table" && entities.some((e) => e.item.showIcon),
    },
    entities,
  };
};

// header_entities: compact icon + value items on the title line; only icon / badge draw there
export const normalizeHeaderEntities = (raw: unknown, ctx: NormalizeCtx): EntityItem[] => {
  if (!Array.isArray(raw)) return [];
  return (raw as (RawEntityInput | null | undefined)[]).map((e, i) => {
    const ent = normalizeEntity(e, ctx, `header_entities[${i}]`, ITEM_DEFAULTS.header);
    if (!HEADER_VISUALS.has(ent.visual)) {
      console.warn(`${ctx.type}: visual '${ent.visual}' is not drawn in the header; using icon`);
      ent.visual = "icon";
    }
    return ent;
  });
};

export const collectTemplates = (cfg: EntityCardConfig): Set<string> => {
  const s = new Set<string>();
  const add = (x: unknown) => {
    if (isTemplate(x)) s.add(x);
  };
  add(cfg.title);
  add(cfg.icon);
  for (const e of cfg.entities) {
    add(e.name);
    add(e.secondary);
    add(e.icon);
    add(e.color);
    if (e.valueSrc.kind === "template") add(e.valueSrc.template);
  }
  return s;
};
