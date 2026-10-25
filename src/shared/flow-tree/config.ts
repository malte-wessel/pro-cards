// Config normalisation shared by the flow tree cards (pure). The result is an entity-card-pro
// config (the base element renders header, header entities, tint and templates from it) whose
// items are the home, every source's sensors and every consumer; `sources` and `consumers` point
// into that flat list by index, so rules, templates, actions and formatting come from the entity
// layer. Each card normalises its own sources (`normalizeFlowTree`'s `source`) with the helpers
// here and adds its own options.
import {
  normalizeTitleAction,
  normalizeEntity,
  normalizeHeaderEntities,
  normalizeHistoryOptions,
  type EntityCardConfig,
  type EntityItem,
  type NormalizeCtx,
  type RawEntity,
  type RawEntityCardBase,
} from "../entity/config.ts";
import type { StringKey } from "../i18n.ts";
import { clampInt, enumOf } from "../flow/config.ts";
import { numOrNull, oneOf } from "../util.ts";
import { normalizeVisibility, type Visibility } from "../visibility.ts";
import {
  CONSUMER_STYLES,
  DIRECTIONS,
  FLOW_STYLES,
  GEOM,
  ICONS,
  NODE_D,
  IDLE_LINKS,
  SOURCE_KINDS,
  type ConsumerStyle,
  type Direction,
  type FlowStyle,
  type IdleLinks,
  type LabelLines,
} from "./constants.ts";

// ----- the raw config as written in YAML -----

// every node of the tree: `icon_size` is the diameter of its circle (px)
export interface RawNode {
  icon_size?: unknown;
}
export interface RawConsumer extends RawEntity, RawNode {
  group?: string | null;
  entities?: unknown;
  invert?: boolean | null;
  hide_below?: unknown;
}
export interface RawFlowTreeConfig extends RawEntityCardBase {
  sources?: unknown;
  home?: string | (RawEntity & RawNode) | null;
  consumers?: unknown;
  direction?: unknown;
  flow_style?: unknown;
  consumer_style?: unknown;
  idle_links?: unknown;
  idle_below?: unknown;
  other?: boolean | (RawNode & { name?: unknown; icon?: unknown }) | null;
  rules?: unknown;
  hide_consumers_below?: unknown;
  decimals?: unknown;
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
  panels: string[] | null; // the solar sources (ids) that feed it (`charge_from: <entities>`); null: every one
  invert: boolean;
}
export interface GridSource extends SourceBase {
  kind: "grid";
  idx: number; // signed power (+ = import), or the import item of a pair
  secondIdx: number | null; // the export item of a pair
  bothWays: boolean; // a pair that may import and export at once (`both_ways`)
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
  // hidden while its value stays below this (null: never by its value)
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
  name?: string; // its own name (default: Other, translated) …
  icon?: string; // … and icon
}
export type Consumer = ConsumerItem | ConsumerGroup | OtherConsumer;

export interface FlowTreeConfig extends EntityCardConfig {
  direction: Direction;
  flowStyle: FlowStyle;
  consumerStyle: ConsumerStyle;
  idleLinks: IdleLinks;
  idleBelow: number; // a flow below it is idle (no motion, no state)
  homeIdx: number;
  homeD: number; // the home node's diameter (px)
  homeEntity: boolean; // false: the home is computed from the sources; the item carries name / icon / rules
  sources: Source[];
  consumers: Consumer[];
  hasGroups: boolean;
  // every pair runs both ways and shows both values (the energy card's period totals); else only
  // a solar-fed battery pair and a grid with `both_ways` (twoValued)
  gross: boolean;
  // `idle_below` given: it holds in any unit; else the card's default, or nothing in a tree that
  // counts in a unit of its own (FlowTreeCardBase)
  idleSet: boolean;
  lines?: LabelLines; // the labels' lines at the theme's text size, set where the tree is drawn
}

const ENTITY_ID = /^[a-z_]+\.[a-z0-9_]+$/;
export const entityId = (type: string, v: unknown, key: string): string | null => {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v !== "string" || !ENTITY_ID.test(v))
    throw new Error(`${type}: '${key}' must be an entity id`);
  return v;
};
export const item = (raw: RawEntity, ctx: NormalizeCtx, label: string) => {
  // a node's `visibility` is the node's (hidden from the tree), not its sensor row's
  const ent = normalizeEntity({ ...raw, visual: "icon", visibility: undefined }, ctx, label);
  ent.visual = "icon"; // never a history visual: the tree draws every item itself
  return ent;
};
// a node's diameter: its `icon_size` (px, 16 to 96), else its kind's own
export const nodeSize = (v: unknown, dflt: number) => clampInt(v, dflt, 16, 96);
export const clampDec = (v: unknown, dflt: number) =>
  Math.max(0, Math.min(3, Math.round(numOrNull(v) ?? dflt)));

// `idle_below`, `hide_below`, `hide_consumers_below`: an amount in the card's unit ("watts",
// "kWh"); 0 (or nothing) never hides
export const amountBelow = (
  type: string,
  v: unknown,
  key: string,
  unit: string,
): number | null | undefined => {
  if (v === undefined || v === null) return undefined;
  const n = numOrNull(v);
  if (n === null || n < 0) throw new Error(`${type}: '${key}' must be a number of ${unit}`);
  return n === 0 ? null : n;
};

// What every source normaliser starts from: the source's label, its entity options without the
// card's own keys (`own`), and the helpers that push its items into the flat list
export const sourceParts = (
  raw: unknown,
  i: number,
  ctx: NormalizeCtx,
  entities: EntityItem[],
  keys: readonly string[],
) => {
  const type = ctx.type;
  const label = `sources[${i}]`;
  if (!raw || typeof raw !== "object") throw new Error(`${type}: ${label} must be an object`);
  const o = raw as RawEntity & RawNode & Record<string, unknown>;
  if (!oneOf(SOURCE_KINDS, o.type))
    throw new Error(`${type}: ${label}.type must be one of ${SOURCE_KINDS.join(" | ")}`);
  const base: Record<string, unknown> = { ...o };
  for (const k of ["type", "icon_size", ...keys]) delete base[k];
  const push = (e: RawEntity, l: string, key: StringKey) => {
    const ent = item(e, ctx, l);
    ent.nameKey = key;
    return entities.push(ent) - 1;
  };
  const sub = (id: string, l: string) => entities.push(item({ entity: id }, ctx, l)) - 1;
  // the node's conditions; a state condition without an entity reads the source's sensor
  const own = (entity: string | null | undefined, d: number) => ({
    id: `s${i}`,
    d: nodeSize(o.icon_size, d),
    visibility: normalizeVisibility(o.visibility, { type, label, entity: entity ?? null }),
  });
  const id = (v: unknown, key: string) => entityId(type, v, `${label}.${key}`);
  const subOf = (v: unknown, key: string) => {
    const e = id(v, key);
    return e ? sub(e, `${label}.${key}`) : null;
  };
  return { o, kind: o.type, label, base: base as RawEntity, push, sub, own, id, subOf };
};

// a battery's `charge_from`: `any`, `solar` or the solar entities that feed it (resolved once
// every source is known, resolvePanels)
export const chargeFromOf = (type: string, cf: unknown, label: string) => {
  cf = cf ?? "any";
  const one = typeof cf === "string" && ENTITY_ID.test(cf) && !oneOf(CHARGE_FROM, cf);
  if (Array.isArray(cf) ? !cf.length : !one && !oneOf(CHARGE_FROM, cf))
    throw new Error(
      `${type}: ${label}.charge_from must be one of ${CHARGE_FROM.join(" | ")} or the entities of solar sources`,
    );
  const listed = Array.isArray(cf)
    ? cf.map((e, k) => {
        const key = `${label}.charge_from[${k}]`;
        const id = entityId(type, e, key);
        if (!id) throw new Error(`${type}: '${key}' must be an entity id`);
        return id;
      })
    : one
      ? [cf as string]
      : null;
  return {
    chargeFrom: listed ? "solar" : (cf as ChargeFrom),
    panels: listed ? [...new Set(listed)] : null,
  };
};

const normalizeConsumers = (
  raw: unknown,
  ctx: NormalizeCtx,
  entities: EntityItem[],
  // the card's `hide_consumers_below`
  hideBelow: number | null,
  below: (v: unknown, key: string) => number | null | undefined,
): Consumer[] => {
  const type = ctx.type;
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw new Error(`${type}: 'consumers' must be a list`);
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
    const own = below(hide_below, `${label}.hide_below`);
    const idx = entities.push(item(ent, ctx, label)) - 1;
    const visibility = normalizeVisibility(o.visibility, {
      type,
      label,
      entity: ent.entity ?? null,
    });
    const hb = own === undefined ? fallback : own;
    return {
      kind: "item",
      id,
      idx,
      d: nodeSize(icon_size, d),
      rowD: Math.min(nodeSize(icon_size, GEOM.dConsumer), GEOM.rowH),
      invert: !!invert,
      visibility,
      hideBelow: hb,
    };
  };
  return raw.map((c, i): Consumer => {
    const label = `consumers[${i}]`;
    const o: RawConsumer =
      typeof c === "string" ? { entity: c } : c && typeof c === "object" ? c : {};
    if (o.group !== undefined && o.group !== null) {
      const { group, entities: list, icon } = o;
      if (!Array.isArray(list) || list.length === 0)
        throw new Error(`${type}: '${label}.entities' must be a non-empty list`);
      const room = below(o.hide_below, `${label}.hide_below`);
      const fallback = room === undefined ? hideBelow : room;
      const items = list.map((e, j) =>
        leaf(e, `c${i}.${j}`, `${label}.entities[${j}]`, fallback, GEOM.dDevice),
      );
      const visibility = normalizeVisibility(o.visibility, { type, label, entity: null });
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

export interface FlowTreeOptions {
  // the card's source normaliser (with sourceParts)
  source: (raw: unknown, i: number, ctx: NormalizeCtx, entities: EntityItem[]) => Source;
  unit: string; // what the thresholds count, for the errors: "watts", "kWh"
  idleBelow: number; // the default `idle_below`
  gross: boolean;
}

// The tree as both cards share it: home, sources, consumers, the other node, header entities and
// the tree's options. The card adds its own options to the result.
export const normalizeFlowTree = (
  raw: RawFlowTreeConfig,
  ctx: NormalizeCtx & { columns: number },
  opts: FlowTreeOptions,
): FlowTreeConfig => {
  const type = ctx.type;
  const below = (v: unknown, key: string) => amountBelow(type, v, key, opts.unit);
  const direction = enumOf(type, DIRECTIONS, raw.direction, "direction", "right");
  const flowStyle = enumOf(type, FLOW_STYLES, raw.flow_style, "flow_style", "dots");
  const consumerStyle = enumOf(
    type,
    CONSUMER_STYLES,
    raw.consumer_style,
    "consumer_style",
    "nodes",
  );
  const idleLinks = enumOf(type, IDLE_LINKS, raw.idle_links, "idle_links", "dashed");
  const entities: EntityItem[] = [];

  // the home: a sensor, an entity object, or nothing (computed); the card's rules live on it
  const h = raw.home;
  const { icon_size: homeSize, ...homeRaw }: RawEntity & RawNode =
    typeof h === "string" ? { entity: h } : h && typeof h === "object" ? { ...h } : {};
  if (h !== undefined && h !== null && typeof h !== "string" && typeof h !== "object")
    throw new Error(`${type}: 'home' must be a sensor entity or an entity object`);
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
    throw new Error(`${type}: 'sources' must be a non-empty list`);
  const sources = raw.sources.map((s, i) => opts.source(s, i, ctx, entities));
  // a battery's `charge_from` entities: the solar sources that carry them
  sources.forEach((s, i) => {
    if (s.kind !== "battery" || !s.panels) return;
    s.panels = s.panels.flatMap((e) => {
      const ids = sources.filter((p) => p.kind === "solar" && entities[p.idx].entity === e);
      if (!ids.length)
        throw new Error(`${type}: sources[${i}].charge_from: ${e} is not a solar source`);
      return ids.map((p) => p.id);
    });
  });

  const consumers = normalizeConsumers(
    raw.consumers,
    ctx,
    entities,
    below(raw.hide_consumers_below, "hide_consumers_below") ?? null,
    below,
  );
  // the other node: on with consumers, `false` leaves it out, an object sizes it (`icon_size`)
  const o = raw.other;
  const other = o === undefined || o === null ? consumers.length > 0 : !!o;
  if (other && consumers.length) {
    const own = typeof o === "object" && o ? o : {};
    const size = own.icon_size;
    consumers.push({
      kind: "other",
      id: "other",
      d: nodeSize(size, GEOM.dConsumer),
      rowD: Math.min(nodeSize(size, GEOM.dConsumer), GEOM.rowH),
      // a name and an icon of its own ("Losses", "Rest of the house")
      ...(typeof own.name === "string" && own.name ? { name: own.name } : {}),
      ...(typeof own.icon === "string" && own.icon ? { icon: own.icon } : {}),
    });
  }

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
    // 0 lets every trickle flow
    idleBelow:
      below(raw.idle_below, "idle_below") ??
      (raw.idle_below === undefined || raw.idle_below === null ? opts.idleBelow : 0),
    homeIdx,
    homeD: nodeSize(homeSize, NODE_D.home),
    homeEntity,
    sources,
    consumers,
    hasGroups: consumers.some((c) => c.kind === "group"),
    gross: opts.gross,
    idleSet: raw.idle_below !== undefined && raw.idle_below !== null,
  };
};

// a source that may run two ways at once and then shows both values: a solar-fed battery given
// as a pair, a grid with `both_ways`
export const twoValued = (s: Source) =>
  (s.kind === "battery" && s.secondIdx !== null && s.chargeFrom === "solar") ||
  (s.kind === "grid" && s.bothWays);
// … in the card's config: with `gross` (period totals) every pair
export const bothWays = (cfg: FlowTreeConfig, s: Source) =>
  cfg.gross ? s.kind !== "solar" && s.secondIdx !== null : twoValued(s);

// every consumer leaf (flat items, group members, the other node) in drawing order
export const leavesOf = (cfg: FlowTreeConfig): (ConsumerItem | OtherConsumer)[] =>
  cfg.consumers.flatMap((c) => (c.kind === "group" ? c.items : [c]));

// ----- visibility -----

// every condition tree of the tree's nodes
export const nodeVisibilities = (cfg: FlowTreeConfig): Visibility[] => [
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
  cfg: FlowTreeConfig,
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
export const viewConfig = <C extends FlowTreeConfig>(cfg: C, hidden: ReadonlySet<string>): C => {
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
