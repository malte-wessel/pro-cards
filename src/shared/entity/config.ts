// Config normalisation (pure) shared by the entity cards.
//
// Every card ends up with the same normalised shape (`EntityCardConfig`):
//   { type, title, icon, hours, bucketMin, smoothMin, columns, tap, hold, dbl,
//     entities: [Entity], groups: [{ layout, idxs, align, columns, divider, visibility }], headerIdxs, hasHeader }
// `entities` is one flat list; groups and header entities point into it by index.
import {
  ALIGNS,
  BADGE_FORMATS,
  BADGE_SIZES,
  BADGE_STYLES,
  BLOCK_VISUALS,
  DEFAULTS,
  GROUP_LAYOUTS,
  HEADER_ONLY_VISUALS,
  HEADER_VISUALS,
  ICON_STYLES,
  ITEM_DEFAULTS,
  ITEM_LAYOUTS,
  VISUALS,
  type Align,
  type BadgeFormat,
  type BadgeSize,
  type BadgeStyle,
  type GroupLayout,
  type IconStyle,
  type ItemDefaults,
  type NamePosition,
  type Visual,
} from "./constants.ts";
import type { ActionConfig, CardConfigBase, HassEntity } from "../ha.ts";
import type { StringKey } from "../i18n.ts";
import { normalizeSmoothing } from "../history.ts";
import { isTemplate, numOrNull, oneOf } from "../util.ts";
import { normalizeVisibility, type Visibility } from "../visibility.ts";
import type { ImageSrc } from "./image.ts";
import { domainOf } from "../color.ts";
import {
  buttonIdsOf,
  defaultPlacements,
  ITEM_CONTROLS,
  normalizeControl,
  placementsOf,
  type ButtonId,
  type ControlConfig,
  type CustomButton,
} from "./control.ts";

// ----- the raw config as written in YAML -----

// an action as written in YAML: a bare action name or an action object (HA reads its keys)
export type RawAction = string | (Partial<ActionConfig> & Record<string, unknown>) | null;
export interface RawActionDefaults {
  tap_action?: RawAction;
  hold_action?: RawAction;
  double_tap_action?: RawAction;
  hover?: boolean | null;
}
export interface RawHistoryOptions {
  hours_to_show?: unknown;
  bucket_minutes?: unknown;
  smoothing_minutes?: unknown;
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
  // header badges: the pill while the rule matches, and a pulse around it
  style?: unknown;
  pulse?: boolean;
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
  icon_style?: unknown;
  show_entity_picture?: boolean | null;
  min?: unknown;
  max?: unknown;
  rules?: unknown;
  // controls: `control` (a kind, `true` = auto) and its options; `toggle` is the old spelling
  control?: unknown;
  control_position?: unknown;
  control_attribute?: unknown;
  control_step?: unknown;
  control_options?: unknown;
  control_confirm?: boolean;
  control_variant?: unknown;
  toggle?: boolean;
  visibility?: unknown;
  // header badges: the pill and its size, how the value is written, when it counts as stale (minutes
  // or "2h"), the window of the trend visual
  style?: unknown;
  size?: unknown;
  format?: unknown;
  stale_after?: unknown;
  trend_hours?: unknown;
}
export type RawEntityInput = string | RawEntity;
export interface RawGroup extends RawItemOptions {
  hover?: boolean | null;
  layout?: unknown;
  entities?: unknown;
  align?: unknown;
  columns?: unknown;
  divider?: boolean;
  visibility?: unknown;
}
// keys every entity card accepts at the top level
export interface RawEntityCardBase
  extends CardConfigBase, RawActionDefaults, RawHistoryOptions, RawItemOptions {
  title?: string | null;
  // what tapping the title (or its icon) does, e.g. navigate to the room's dashboard
  title_tap_action?: RawAction;
  icon?: string | null;
  align?: unknown;
  columns?: unknown;
  header_entities?: unknown;
  // the group and sections cards: where the body sits in a card taller than its content
  vertical_align?: unknown;
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
  style: BadgeStyle | null;
  pulse: boolean;
  // a card's own rule (the poster's predefined ones): its label is ours, translated at render time
  labelKey?: StringKey;
  // the rule as written: a card reads keys of its own from it (the poster's icon and backdrop)
  src?: Readonly<Record<string, unknown>>;
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
  // Home Assistant's hover and press layers on the row and its controls (STYLE_HOVER)
  hover: boolean;
  // `hover: false` on the card: header badges, which answer by default, keep still too
  hoverOff?: boolean;
}
// a plot's own options (the v3 cards' `visual: { hours, bucket, smoothing, axis, src }`)
export interface PlotOptions {
  hours?: number | "today";
  bucket?: number;
  smoothing?: number;
  axis?: boolean;
  src?: string;
  // a strip as a ribbon along the card's bottom edge
  edge?: boolean;
}
// a badge of the v3 cards (the poster's, the tile's, the tile group's and the heading's badges,
// src/shared/kinds/badge.ts): its icon place, its visual after the value, and what its kind gives
// it. The entity cards' badges have none (their old keys draw them)
export interface BadgeIcon {
  // the icon, a picture (its src, else the entity's), a dot in its place, or nothing
  type: "icon" | "image" | "dot" | "none";
  // a ring of the value (min to max) around it
  ring: boolean;
  src: ImageSrc | null;
}
export interface BadgeKindLook {
  // the kind's rules (no texts: a badge shows its value) in their unit, and its colour from the
  // state (a light's own, a thermostat's while it heats)
  rules: Rule[];
  ruleUnit?: RuleUnit;
  color: string | null;
}
export interface BadgeParts {
  icon: BadgeIcon;
  // the icon a matching rule switches to (its place merged over the badge's)
  ruleIcons: Map<Rule, BadgeIcon>;
  // the window of a sparkline or a trend
  hours: number | "today";
  // `rules` written (even none): the kind's are not used
  ownRules: boolean;
  // the badge's kind for the entity's state now (null: none)
  kindOf: (st: HassEntity | undefined) => BadgeKindLook | null;
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
  iconStyle: IconStyle;
  // a ring of the value around the icon whatever the visual (the poster's `icon_ring`)
  iconRing?: boolean;
  // the entity's picture (a person's photo) in place of its icon, where it has one
  picture: boolean;
  // the matching rule's colour and icon win over the item's own (the v3 cards: the item's are the
  // defaults); left out, the item's are fixed and beat the rules (the entity cards)
  ruleWins?: boolean;
  // a plot's own window, bucket, smoothing, axes and entity (the v3 cards' visual), over the card's
  plot?: PlotOptions;
  min: number | null;
  max: number | null;
  rules: Rule[];
  // the control (null: none; the old `toggle: true` is `control: toggle`)
  control: ControlConfig | null;
  item: ItemOptions;
  // drawn only while its conditions hold (null: always)
  visibility: Visibility;
  // as a header badge: its pill and size, how the value is written, the minutes after which an
  // entity that has not reported counts as stale (null: never), the hours the trend looks back
  badge: { style: BadgeStyle; size: BadgeSize };
  format: BadgeFormat;
  staleMin: number | null;
  trendHours: number;
  // set by cards that build items themselves: the unit a card's own rules are written in (the
  // value is converted to it before they match; a user's rules read the sensor's own unit)
  ruleUnit?: RuleUnit;
  // a v3 card's badge (left out: the entity cards' badges and every other item)
  pill?: BadgeParts;
}
// the units a card's own rules can be written in
export type RuleUnit = "km/h" | "mm/h";
export interface Group {
  layout: GroupLayout | "tile" | "poster";
  idxs: number[];
  // a poster's badges: drawn in its corner, hidden in place (not part of the body's structure)
  badgeIdxs?: number[];
  align: Align | undefined;
  columns: number;
  divider: boolean;
  // drawn only while its conditions hold and one of its items is shown (null: the items decide)
  visibility: Visibility;
}
// ctx carries the card type (for error messages) and the action and hover defaults
export interface NormalizeCtx extends ActionDefaults {
  type: string;
  columns?: number;
}
export interface EntityCardConfig extends ActionDefaults {
  type: string;
  layout: GroupLayout | "tile" | "poster" | "sections" | "heading";
  title: string | null;
  // the action of the title and its icon (null: they are plain text)
  titleTap: ActionConfig | null;
  icon: string | null;
  // the heading card: the line under the title, the icon's colour and the icon's own action (all
  // optional, the other cards leave them out)
  subtitle?: string | null;
  iconColor?: string | null;
  iconTap?: ActionConfig | null;
  hours: number;
  // the history fetched, in hours, where the card's badges need more than its window (left out:
  // `hours`)
  fetchHours?: number;
  bucketMin: number;
  // bucket size of the sparkline in minutes (null: one point per LINE_POINT_PX)
  smoothMin: number | null;
  columns: number;
  entities: EntityItem[];
  groups: Group[];
  headerIdxs: number[];
  hasHeader: boolean;
  // where the body sits in a card taller than its content (the tile group, and the deprecated group
  // and sections cards; the header stays on top): unset is the top; `stretch` (the tile group's
  // alone) grows the body's lines to fill it
  valign?: GroupAlign;
}

export const normalizeAction = (a: RawAction | undefined, fallback: ActionConfig): ActionConfig => {
  if (a === undefined || a === null) return fallback;
  if (typeof a === "string") return { action: a };
  return { action: "more-info", ...a };
};
// `title_tap_action`: null when unset or `none`, so the title stays plain text
export const normalizeTitleAction = (raw: { title_tap_action?: RawAction }) => {
  const a = raw.title_tap_action;
  if (a === undefined || a === null) return null;
  const action = normalizeAction(a, { action: "none" });
  return action.action === "none" ? null : action;
};
export const normalizeActionDefaults = (raw: RawActionDefaults): ActionDefaults => ({
  tap: normalizeAction(raw.tap_action, { action: "more-info" }),
  hold: normalizeAction(raw.hold_action, { action: "more-info" }),
  dbl: normalizeAction(raw.double_tap_action, { action: "none" }),
  hover: raw.hover === true,
  hoverOff: raw.hover === false,
});
export const normalizeHistoryOptions = (raw: RawHistoryOptions) => ({
  hours: Math.max(1, numOrNull(raw.hours_to_show) ?? DEFAULTS.hours_to_show),
  bucketMin: Math.max(5, numOrNull(raw.bucket_minutes) ?? DEFAULTS.bucket_minutes),
  smoothMin: normalizeSmoothing(raw.smoothing_minutes),
});
export const VERTICAL_ALIGNS = ["top", "center", "bottom"] as const;
export type VerticalAlign = (typeof VERTICAL_ALIGNS)[number];
// a group of tiles may also stretch them over the height it is given (the tile group)
export const GROUP_ALIGNS = [...VERTICAL_ALIGNS, "stretch"] as const;
export type GroupAlign = (typeof GROUP_ALIGNS)[number];
// `vertical_align`: top (the default), center or bottom, or one of the values the card names
export function normalizeVerticalAlign(v: unknown, type: string): VerticalAlign;
export function normalizeVerticalAlign<T extends string>(
  v: unknown,
  type: string,
  values: readonly T[],
): T;
export function normalizeVerticalAlign(
  v: unknown,
  type: string,
  values: readonly string[] = VERTICAL_ALIGNS,
): string {
  if (v === undefined || v === null) return "top";
  if (!oneOf(values, v))
    throw new Error(`${type}: vertical_align must be one of ${values.join(" | ")}`);
  return v;
}
export const clampColumns = (v: unknown, fallback: number) =>
  Math.max(1, Math.min(4, Math.round(numOrNull(v) ?? fallback)));

// `value` is plain text or a template; null when not set
export const normalizeValue = (v: unknown): ValueSrc | null => {
  if (v === undefined || v === null) return null;
  const s = String(v);
  return isTemplate(s) ? { kind: "template", template: s } : { kind: "text", text: s };
};
// `control_options` of `control: buttons` that name the domain's own buttons (`[lock, unlock]`):
// those ids, checked against the entity's domain; null for your own buttons (entries with an
// entity or an action)
export const buttonIdsFrom = (
  list: unknown,
  entity: string | null,
  ctx: NormalizeCtx,
  label: string,
  // a name that is not one of the domain's is an error (false: no buttons, nothing said)
  strict = true,
): ButtonId[] | null => {
  // (names only, on an entity whose domain has buttons; anything else is your own buttons, where
  // a name is an entry without an entity, left out with a warning as ever)
  if (!Array.isArray(list) || !list.length || !list.every((x) => typeof x === "string"))
    return null;
  const domain = entity ? domainOf(entity) : null;
  const own = domain ? buttonIdsOf(domain) : [];
  if (!own.length) return null;
  for (const id of list as string[])
    if (!own.includes(id as ButtonId)) {
      if (!strict) return null;
      throw new Error(
        `${ctx.type}: ${label}.control_options: ${id} is not a button of a ${domain} (${own.join(" | ")})`,
      );
    }
  return list as ButtonId[];
};
// the `control_options` of `control: buttons`: entries with an entity or an action (parsed as any
// other action: a bare name, or an object that defaults to more-info); null when none is usable
export const normalizeButtons = (
  list: unknown,
  ctx: NormalizeCtx,
  label: string,
  // the row's entity: what a button's conditions look at when neither names one
  rowEntity: string | null = null,
): CustomButton[] | null => {
  if (!Array.isArray(list)) return null;
  const out: CustomButton[] = [];
  const str = (v: unknown) => (typeof v === "string" && v ? v : null);
  list.forEach((x, i) => {
    const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
    const a = o.action;
    const action =
      a === undefined || a === null || a === ""
        ? null
        : normalizeAction(a as RawAction, { action: "none" });
    const entity = str(o.entity);
    if (!entity && !action) {
      console.warn(`${ctx.type}: ${label}.control_options[${i}] needs 'entity' or 'action'`);
      return;
    }
    const visibility = normalizeVisibility(o.visibility, {
      type: ctx.type,
      label: `${label}.control_options[${i}]`,
      entity: entity ?? rowEntity,
    });
    out.push({
      entity,
      icon: str(o.icon),
      label: str(o.label),
      color: str(o.color),
      action,
      visibility,
    });
  });
  return out.length ? out : null;
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
      style: oneOf(BADGE_STYLES, x.style) ? x.style : null,
      pulse: !!x.pulse,
      src: x as Readonly<Record<string, unknown>>,
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
  // where the item sits: whether custom buttons are drawn there (only then does an item of buttons
  // alone stand without an entity or a value), else the place, for the error; `header` for a
  // header badge, the only place the badge visuals draw
  place: { buttons: true } | { buttons: false; name?: string; header?: boolean } = {
    buttons: false,
  },
): EntityItem => {
  const o: RawEntity = typeof raw === "string" ? { entity: raw } : { ...(raw || {}) };
  let valueSrc: ValueSrc;
  if (o.attribute !== undefined && o.attribute !== null && o.attribute !== "") {
    if (o.value !== undefined)
      console.warn(`${ctx.type}: ${label} sets both 'attribute' and 'value'; using the attribute`);
    valueSrc = { kind: "attribute", key: String(o.attribute) };
  } else valueSrc = normalizeValue(o.value) ?? { kind: "state" };
  const control = normalizeControl(o, ctx, label);
  if (control?.kind === "buttons") {
    const ids = buttonIdsFrom(o.control_options, o.entity || null, ctx, label);
    if (ids) control.buttonIds = ids;
    else control.buttons = normalizeButtons(o.control_options, ctx, label, o.entity || null);
  } else if (control?.kind === "auto") {
    // the kind's own controls: names that are all the domain's buttons pick its buttons (a
    // robot's stop and locate); anything else stays the options of its segments
    const ids = buttonIdsFrom(o.control_options, o.entity || null, ctx, label, false);
    if (ids) {
      control.buttonIds = ids;
      control.options = null;
    }
  }
  const onlyButtons = !o.entity && valueSrc.kind === "state" && !!control?.buttons;
  // a row of custom buttons needs nothing else: a name and the buttons
  if (onlyButtons && place.buttons) valueSrc = { kind: "text", text: "" };
  if (!o.entity && valueSrc.kind !== "template" && valueSrc.kind !== "text") {
    const where = onlyButtons && !place.buttons && place.name;
    throw new Error(
      `${ctx.type}: ${label} needs 'entity' or 'value'${where ? ` (buttons are not drawn in ${where})` : ""}`,
    );
  }
  const dec = numOrNull(o.decimals);
  let visual: Visual = oneOf(VISUALS, o.visual) ? o.visual : "icon";
  if (HEADER_ONLY_VISUALS.has(visual) && !("header" in place && place.header)) {
    console.warn(`${ctx.type}: visual '${visual}' is drawn in header badges only; using icon`);
    visual = "icon";
  }
  const trend = numOrNull(o.trend_hours);
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
    visual,
    iconStyle: oneOf(ICON_STYLES, o.icon_style) ? o.icon_style : "circle",
    picture: !!o.show_entity_picture,
    min: numOrNull(o.min),
    max: numOrNull(o.max),
    rules: normalizeRules(o.rules),
    control,
    tap: normalizeAction(o.tap_action, ctx.tap),
    hold: normalizeAction(o.hold_action, ctx.hold),
    dbl: normalizeAction(o.double_tap_action, ctx.dbl),
    hover: typeof o.hover === "boolean" ? o.hover : ctx.hover,
    item: normalizeItemOptions(o, itemDefaults),
    visibility: normalizeVisibility(o.visibility, {
      type: ctx.type,
      label,
      entity: o.entity || null,
    }),
    badge: {
      style: oneOf(BADGE_STYLES, o.style) ? o.style : "plain",
      size: oneOf(BADGE_SIZES, o.size) ? o.size : "s",
    },
    format: oneOf(BADGE_FORMATS, o.format) ? o.format : "auto",
    staleMin: minutesOf(o.stale_after),
    trendHours: trend !== null && trend > 0 ? trend : 1,
  };
};

// a span as minutes: a number of minutes, or a number with a unit ("90s", "30min", "2h", "1d");
// null when unset or not positive
export const minutesOf = (v: unknown): number | null => {
  if (typeof v === "number") return v > 0 ? v : null;
  if (typeof v !== "string") return null;
  const m = /^\s*(\d+(?:\.\d+)?)\s*(s|m|min|h|d)?\s*$/i.exec(v);
  if (!m) return null;
  const n =
    Number(m[1]) * ({ s: 1 / 60, m: 1, min: 1, h: 60, d: 1440 }[m[2]?.toLowerCase() ?? "m"] ?? 1);
  return n > 0 ? n : null;
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
  // `hover` cascades as the actions do: card → group → entity
  const gctx = typeof g.hover === "boolean" ? { ...ctx, hover: g.hover } : ctx;
  const entities = (list as (RawEntityInput | null | undefined)[]).map((e, i) => {
    const ent = normalizeEntity(
      e,
      gctx,
      `${entLabel}[${i}]`,
      itemDefaults,
      layout === "row" ? { buttons: false, name: "a row" } : { buttons: true },
    );
    if (isItem && BLOCK_VISUALS.has(ent.visual)) {
      console.warn(`${ctx.type}: visual '${ent.visual}' is not drawn in a ${layout}; using icon`);
      ent.visual = "icon";
    }
    if (isItem && ent.control && !ITEM_CONTROLS[layout]?.has(ent.control.kind)) {
      const kind = ent.control.kind;
      ent.control = { ...ent.control, kind: "auto", buttons: null };
      const fits = placementsOf(ent, layout === "row" ? "item-row" : "item-column").length > 0;
      console.warn(
        `${ctx.type}: control '${kind}' is not drawn in a ${layout}; ${fits ? "using the domain default" : "the domain default does not fit either, no control is drawn"}`,
      );
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
      visibility: normalizeVisibility(g.visibility, { type: ctx.type, label, entity: null }),
    },
    entities,
  };
};

// header_entities (the heading card's badges): compact items on the title line. `defaults` is the
// card's pill and size for badges that name none: plain and small (an icon and a value, as the
// header always drew them) unless the card says otherwise. The old `visual: badge` is a soft pill
// unless a style is given. A switch is the one control a badge holds.
export const normalizeHeaderEntities = (
  raw: unknown,
  ctx: NormalizeCtx,
  label = "header_entities",
  defaults: { style: BadgeStyle; size: BadgeSize } = { style: "plain", size: "s" },
): EntityItem[] => {
  if (!Array.isArray(raw)) return [];
  return (raw as (RawEntityInput | null | undefined)[]).map((e, i) =>
    normalizeBadge(e, ctx, `${label}[${i}]`, defaults),
  );
};
// one badge: a header entity, or a pill in a poster's corner (`where` names the place in warnings)
export const normalizeBadge = (
  e: RawEntityInput | null | undefined,
  ctx: NormalizeCtx,
  label: string,
  defaults: { style: BadgeStyle; size: BadgeSize },
  where = "the header",
): EntityItem => {
  const ent = normalizeEntity(e, ctx, label, ITEM_DEFAULTS.header, {
    buttons: false,
    name: where,
    header: true,
  });
  if (!HEADER_VISUALS.has(ent.visual)) {
    console.warn(`${ctx.type}: visual '${ent.visual}' is not drawn in ${where}; using icon`);
    ent.visual = "icon";
  }
  const o: RawEntity = e && typeof e === "object" ? e : {};
  // a badge is a button, as Home Assistant's: it answers the pointer unless the badge or the card
  // says hover: false (one without an action has no layer to show)
  if (typeof o.hover !== "boolean") ent.hover = ctx.hover || !ctx.hoverOff;
  const style = oneOf(BADGE_STYLES, o.style) ? o.style : null;
  ent.badge = {
    style: style ?? (ent.visual === "badge" ? "soft" : defaults.style),
    size: oneOf(BADGE_SIZES, o.size) ? o.size : defaults.size,
  };
  // a badge visual with a style of its own is the new pill around the icon and the value
  if (ent.visual === "badge" && style) ent.visual = "icon";
  const c = ent.control;
  if (c && c.kind !== "toggle") {
    if (c.kind === "auto" && defaultPlacements(ent).some((p) => p.kind === "toggle"))
      ent.control = { ...c, kind: "toggle", buttons: null };
    else {
      console.warn(`${ctx.type}: a switch is the only control drawn in ${where}`);
      ent.control = null;
    }
  }
  return ent;
};

// every visibility condition tree of the config: items, their custom buttons and groups (cards
// with parts of their own add theirs)
export const visibilityTrees = (cfg: EntityCardConfig): Visibility[] => [
  ...cfg.entities.flatMap((e) => [
    e.visibility,
    ...(e.control?.buttons ?? []).map((b) => b.visibility),
  ]),
  ...cfg.groups.map((g) => g.visibility),
];

// the templates of one item: its name, secondary line, icon, colour and value
export const itemTemplates = (e: EntityItem): string[] =>
  [
    e.name,
    e.secondary,
    e.icon,
    e.color,
    e.valueSrc.kind === "template" ? e.valueSrc.template : null,
    // a badge's rules write their text as a value (a template too), and its picture
    ...(e.pill ? e.rules.map((r) => r.label) : []),
    ...(e.pill ? [e.pill.icon, ...e.pill.ruleIcons.values()] : []).map((i) =>
      i.src?.kind === "template" ? i.src.template : null,
    ),
  ].filter((x): x is string => isTemplate(x));
export const collectTemplates = (cfg: EntityCardConfig): Set<string> => {
  const s = new Set<string>();
  for (const x of [cfg.title, cfg.icon, cfg.subtitle, cfg.iconColor]) if (isTemplate(x)) s.add(x);
  for (const e of cfg.entities) for (const x of itemTemplates(e)) s.add(x);
  return s;
};
