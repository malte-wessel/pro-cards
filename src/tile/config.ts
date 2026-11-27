// Config of the tile card (pure): the raw YAML shape and the normalised one. The card is one
// entity (or none) as a tile, filled the way its kind says (src/shared/kinds/config.ts): the icon,
// the name, one line under it, controls at its end; its icon and its visual as its places say
// (src/shared/kinds/places.ts). A visual below the line (a plot, the sun's day) and a slider below
// take a second row.
import {
  normalizeValue,
  normalizeVerticalAlign,
  type ValueSrc,
  type VerticalAlign,
} from "../shared/entity/config.ts";
import { domainOf } from "../shared/color.ts";
import type { HomeAssistant } from "../shared/ha.ts";
import { defaultPlacements, normalizeControl, type Placement } from "../shared/entity/control.ts";
import { parseBadgeVisual } from "../shared/kinds/badge.ts";
import {
  isObj,
  kindConfigOf,
  normalizeCorner,
  normalizeKindItem,
  shapeControl,
  TILE_ICON_TOGGLES,
  type KindConfig,
  type RawKindCardConfig,
} from "../shared/kinds/config.ts";
import { CARD_TYPE } from "./constants.ts";

export interface RawTileCardConfig extends RawKindCardConfig {
  status?: unknown;
  status_badge?: unknown;
  badges?: unknown;
  vertical?: unknown;
  vertical_align?: unknown;
  // a row of a tile group's table (the group's, never written on a tile)
  table?: unknown;
  // a tile of a tile group's list, indented (the group's, never written on a tile)
  indent?: unknown;
}

// what a table row draws after its value instead of a control (a badge's visuals, its window)
export interface TableRow {
  visual: "bar" | "sparkline" | "trend" | null;
  hours: number | "today";
}

export interface TileConfig extends KindConfig {
  // the status's item (null: `status: false`) and its text as written (null: the kind's, else the
  // matching rule's status): on the line after the value, or a badge before the badges where the
  // card says so (`status_badge: true`)
  statusIdx: number | null;
  statusText: ValueSrc | null;
  statusBadge: boolean;
  // the icon on top, the name and the line centred under it, the controls under them
  vertical: boolean;
  // where the content sits in a tile taller than it (null: as written nowhere, centred, or as the
  // tile group's row lays its tiles out)
  vAlign: VerticalAlign | null;
  // a row of a tile group's table: the name, the value and one control or visual after it; no
  // icon, no badges, no secondary, nothing behind the texts
  table: TableRow | null;
  // a tile of a tile group's list (`indent`, the group's): what is below the line (a visual, a
  // kind's picture, block controls) starts at the name, beside the icon
  indent: boolean;
}

// the badge on the icon (`icon: { badge }`, the card's or a rule's): Home Assistant's (auto), none
// (false), or one of the card's own, its icon and colour each text or a template (an empty icon:
// none; no colour: the tile's)
export type IconBadgeConfig = "auto" | false | { icon: ValueSrc | null; color: ValueSrc | null };
export const parseIconBadge = (v: unknown): IconBadgeConfig => {
  if (v === undefined || v === null || v === true || v === "auto") return "auto";
  if (v === false || v === "none") return false;
  if (isObj(v)) return { icon: normalizeValue(v.icon), color: normalizeValue(v.color) };
  throw new Error(`${CARD_TYPE}: icon: { badge } takes auto, false or { icon, color }`);
};

// the entity card's visuals the tile draws no more, and what takes their place
const GONE: Record<string, string> = {
  icon: "visual: icon is the tile's own: leave it out",
  badge: "visual: badge is gone: the status is on the line under the name",
};

// the controls at the line's end; for a table's row, else the first one moved there (a number's
// slider)
const endOrFirst = (list: readonly Placement[], table: boolean): Placement[] => {
  const end = list.filter((p) => p.position === "end");
  return end.length || !table || !list.length ? end : [{ ...list[0], position: "end" }];
};
// the keys a table row cannot draw
const TABLE_GONE: Record<string, string> = {
  icon: "draws no icon",
  secondary: "draws no secondary",
  badges: "draws no badges",
  status_badge: "draws no badges: the status follows the value",
  vertical: "is a line of its own",
};
// a table row as written: a visual after the value (a badge's: bar, sparkline, trend) or a control
const tableOf = (written: RawTileCardConfig): TableRow => {
  for (const k of Object.keys(TABLE_GONE))
    if ((written as Record<string, unknown>)[k] !== undefined)
      throw new Error(`${CARD_TYPE}: in a table, a tile ${TABLE_GONE[k]} (${k})`);
  const v = parseBadgeVisual(written.visual, `${CARD_TYPE}: in a table, visual`, null);
  if (v && written.control !== undefined && written.control !== false)
    throw new Error(`${CARD_TYPE}: in a table, a tile draws a control or a visual, not both`);
  return { visual: v?.type ?? null, hours: v?.hours ?? (v?.type === "trend" ? 1 : 24) };
};
// the history a table row's visual draws, in hours
const tableHours = (t: TableRow | null) =>
  t && (t.visual === "sparkline" || t.visual === "trend")
    ? t.hours === "today"
      ? 24
      : t.hours
    : 0;

export const normalizeTileConfig = (input: unknown, hass?: HomeAssistant): TileConfig => {
  if (!isObj(input)) throw new Error(`${CARD_TYPE}: invalid config`);
  const written = input as RawTileCardConfig;
  if (written.toggle !== undefined)
    throw new Error(`${CARD_TYPE}: toggle is control: toggle on the tile card`);
  if (typeof written.visual === "string" && GONE[written.visual])
    throw new Error(`${CARD_TYPE}: ${GONE[written.visual]}`);
  const table = written.table === true ? tableOf(written) : null;
  // a table row draws no icon and no visual of the kind's: its own after the value
  const k = normalizeKindItem(
    table ? ({ ...written, icon: false, visual: false } as unknown as RawTileCardConfig) : written,
    hass,
    CARD_TYPE,
    "tile card",
  );
  const main = k.entities[0];
  // the icon toggles what switches and presses what runs, unless the card or the type says else
  const iconTap = k.places.icon ? k.places.icon.tap_action : undefined;
  if (
    iconTap === undefined &&
    !k.iconActions.tap &&
    k.entity &&
    TILE_ICON_TOGGLES.has(domainOf(k.entity))
  )
    k.iconActions.tap = { action: "toggle" };
  // a kind's controls below the line need a second row: only those at the end of the line are
  // drawn unless the card names them (`control: slider`)
  // (a table's row has no room below either: where none is at the end, its first goes there)
  if (main.control?.defaults) {
    const end = endOrFirst(main.control.defaults, !!table);
    main.control = end.length ? { ...main.control, defaults: end } : null;
  }
  if (table) {
    // one thing after the value: the visual where the row names one, else the control (the
    // kind's, or a lock's hold, which a tile has on its icon)
    if (table.visual) {
      main.control = null;
      main.visual = table.visual;
    } else if (!main.control && written.control === undefined) {
      // no icon to tap or hold (a switch's, a lock's): the domain's control at the line's end
      const end = endOrFirst(defaultPlacements(main), true);
      const auto = end.length ? normalizeControl({ control: "auto" }, k.ctx, "the card") : null;
      main.control = auto && { ...auto, defaults: end };
    }
  }
  shapeControl(main);
  // the badges at the end of the first row, and the status among them where the card says so
  const {
    statusIdx,
    statusText,
    corner: all,
    badgeHours,
  } = normalizeCorner(k, CARD_TYPE, "a tile's badges");
  const kc = kindConfigOf(k);
  if (written.status_badge !== undefined && typeof written.status_badge !== "boolean")
    throw new Error(`${CARD_TYPE}: status_badge takes true or false`);
  const statusBadge = written.status_badge === true;
  // the icon's badge, the card's and its rules', checked now
  for (const p of [k.places, ...k.rulePlaces.values()]) if (p.icon) parseIconBadge(p.icon.badge);
  const corner = statusBadge ? all : all.filter((i) => i !== statusIdx);
  return {
    layout: "tile",
    title: null,
    titleTap: null,
    icon: null,
    columns: 1,
    ...k.ctx,
    type: CARD_TYPE,
    entities: k.entities,
    groups: [
      {
        layout: "tile",
        idxs: [0],
        badgeIdxs: corner,
        align: "start",
        columns: 1,
        divider: false,
        visibility: null,
      },
    ],
    headerIdxs: [],
    hasHeader: false,
    ...kc,
    // (a kind's own window, today's low and high, is a poster's)
    ...(Math.max(badgeHours, tableHours(table)) > kc.hours
      ? { fetchHours: Math.max(badgeHours, tableHours(table)) }
      : {}),
    statusIdx,
    statusText,
    statusBadge,
    vertical: written.vertical === true,
    indent: written.indent === true && written.vertical !== true && !table,
    vAlign:
      written.vertical_align === undefined
        ? null
        : normalizeVerticalAlign(written.vertical_align, CARD_TYPE),
    table,
  };
};
