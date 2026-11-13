// The tile group card's config (pure): the header (title, icon, its badges), the layout and the
// tiles. The group sets nothing on its tiles but their layout (a row's are vertical): each tile
// says everything about itself. The tiles are tile cards of their own (the group hosts them), so
// their configs are tile card configs, checked by the tile card.
import type { CardConfigBase } from "../shared/ha.ts";
import {
  normalizeActionDefaults,
  normalizeTitleAction,
  normalizeVerticalAlign,
  GROUP_ALIGNS,
  type EntityCardConfig,
  type RawAction,
} from "../shared/entity/config.ts";
import { ALIGNS, type Align } from "../shared/entity/constants.ts";
import { badgeWindow, normalizePills } from "../shared/kinds/badge.ts";
import { normalizeVisibility, type Visibility } from "../shared/visibility.ts";

export const CARD_TYPE = "tile-group-card-pro";
export const TILE_TYPE = "tile-card-pro";
export const TILE_GROUP_LAYOUTS = ["list", "row", "table"] as const;
export type TileGroupLayout = (typeof TILE_GROUP_LAYOUTS)[number];
// a row's tiles where they do not fit on a line: onto the next one, shrunk on one, or scrolling
export const TILE_GROUP_OVERFLOWS = ["wrap", "shrink", "scroll"] as const;
export type TileGroupOverflow = (typeof TILE_GROUP_OVERFLOWS)[number];
// the row's own keys: no other layout takes them
const ROW_KEYS = ["overflow", "align", "columns"] as const;

// the card's own keys: the header, the layout, the tiles and Home Assistant's. It sets nothing on
// its tiles but their layout (`row`: vertical): each tile says everything about itself
const CARD_KEYS = new Set([
  "type",
  "layout",
  "title",
  "icon",
  "title_tap_action",
  "badges",
  "tiles",
  "grid_options",
  "visibility",
  "view_layout",
  "layout_options",
  "card_mod",
  "fill_height",
  "vertical_align",
  "overflow",
  "align",
  "columns",
  "padding",
]);

export interface TileGroupTile {
  // the tile card's config: the card's defaults under the tile's own keys
  config: CardConfigBase;
  // the tile's `visibility`, which the group evaluates (it hides the tile in place)
  visibility: Visibility;
}
export interface TileGroupConfig extends EntityCardConfig {
  layout: TileGroupLayout;
  tiles: TileGroupTile[];
  // a row: its tiles where they do not fit on a line, where they sit on it (stretch: they share
  // its width; else each keeps the row's column width), the most of them on a line (null: as many
  // as fit). (`columns` is the entity layer's own)
  overflow: TileGroupOverflow;
  rowAlign: Align;
  rowColumns: number | null;
  // false: the tiles flush with the card and each other, square, without borders
  padding: boolean;
}

interface RawTileGroupConfig extends CardConfigBase {
  layout?: unknown;
  title?: string | null;
  title_tap_action?: RawAction;
  icon?: string | null;
  badges?: unknown;
  tiles?: unknown;
  overflow?: unknown;
  align?: unknown;
  columns?: unknown;
  padding?: unknown;
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

// the entity group card's layouts and keys, and what takes their place
const OLD_LAYOUTS: Record<string, string> = {
  column: "layout: column is list",
  grid: "layout: grid is a layout card of posters (guide/migrating on the docs site)",
  hero: "layout: hero is a layout card of a poster above a tile group (guide/migrating on the docs site)",
};
const OLD_KEYS: Record<string, string> = {
  header_entities: "header_entities is badges",
  name_position: "name_position is gone: a tile's name is above its line",
};

export const normalizeTileGroupConfig = (input: unknown): TileGroupConfig => {
  if (!isObj(input)) throw new Error(`${CARD_TYPE}: invalid config`);
  const raw = input as RawTileGroupConfig;
  const layout = raw.layout ?? "list";
  if (!TILE_GROUP_LAYOUTS.includes(layout as TileGroupLayout))
    throw new Error(
      `${CARD_TYPE}: ${OLD_LAYOUTS[String(layout)] ?? "layout takes list, row or table"}`,
    );
  if (raw.entities !== undefined) throw new Error(`${CARD_TYPE}: entities is tiles`);
  for (const k of Object.keys(raw))
    if (!CARD_KEYS.has(k) && raw[k] !== undefined)
      throw new Error(
        `${CARD_TYPE}: ${OLD_KEYS[k] ?? `a tile group sets nothing on its tiles: ${k} goes on each tile`}`,
      );
  // the row's own keys: where its tiles go when they do not fit, where they sit, how many on a line
  for (const k of ROW_KEYS)
    if (layout !== "row" && raw[k] !== undefined && raw[k] !== null)
      throw new Error(`${CARD_TYPE}: ${k} is the row's: layout: row`);
  const overflow = raw.overflow ?? "wrap";
  if (!TILE_GROUP_OVERFLOWS.includes(overflow as TileGroupOverflow))
    throw new Error(`${CARD_TYPE}: overflow must be one of ${TILE_GROUP_OVERFLOWS.join(" | ")}`);
  const align = raw.align ?? "stretch";
  if (!ALIGNS.includes(align as Align))
    throw new Error(`${CARD_TYPE}: align must be one of ${ALIGNS.join(" | ")}`);
  const columns = raw.columns ?? null;
  if (
    columns !== null &&
    !(Number.isInteger(columns) && (columns as number) >= 1 && (columns as number) <= 12)
  )
    throw new Error(
      `${CARD_TYPE}: columns is the most tiles on a line: a whole number from 1 to 12`,
    );
  if (columns !== null && overflow !== "wrap")
    throw new Error(
      `${CARD_TYPE}: columns is the most tiles on a line: overflow: ${overflow} keeps them on one`,
    );
  const padding = raw.padding ?? true;
  if (typeof padding !== "boolean") throw new Error(`${CARD_TYPE}: padding takes true or false`);
  if (!Array.isArray(raw.tiles) || !raw.tiles.length)
    throw new Error(`${CARD_TYPE}: tiles must be a list of entities or tiles`);
  const tiles = raw.tiles.map((e, i): TileGroupTile => {
    const label = `tiles[${i}]`;
    const own = typeof e === "string" ? { entity: e } : isObj(e) ? e : null;
    if (!own) throw new Error(`${CARD_TYPE}: ${label} must be an entity id or a tile`);
    if (own.type !== undefined || own.grid_options !== undefined)
      throw new Error(`${CARD_TYPE}: ${label}: a tile in a group takes no type or grid_options`);
    // the group's layout decides it: a row's tiles are vertical, a list's are not
    if (own.vertical !== undefined)
      throw new Error(`${CARD_TYPE}: ${label}: vertical is the group's layout (layout: row)`);
    if (own.table !== undefined)
      throw new Error(`${CARD_TYPE}: ${label}: table is the group's layout (layout: table)`);
    const { visibility, ...rest } = own;
    const entity = typeof rest.entity === "string" ? rest.entity : null;
    return {
      config: {
        type: `custom:${TILE_TYPE}`,
        ...rest,
        // a table's rows: the name, the value and one thing after it
        ...(layout === "table" ? { table: true } : { vertical: layout === "row" }),
      },
      visibility: normalizeVisibility(visibility, { type: CARD_TYPE, label, entity }),
    };
  });
  // the header's badges as the group card draws them (plain and small unless they say
  // otherwise), with their own actions
  const ctx = { type: CARD_TYPE, ...normalizeActionDefaults({}) };
  const badges = normalizePills(
    raw.badges,
    ctx,
    "badges",
    { style: "plain", size: "s" },
    "the group's header",
  );
  return {
    layout: layout as TileGroupLayout,
    title: raw.title ?? null,
    titleTap: normalizeTitleAction(raw),
    // where the tiles sit in a card taller than they are: at the top, the centre or the bottom, or
    // stretched to share its height
    valign: normalizeVerticalAlign(raw.vertical_align, CARD_TYPE, GROUP_ALIGNS),
    icon: raw.icon ?? null,
    // the header badges' history: the longest window they draw
    ...badgeWindow(badges),
    ...ctx,
    columns: 1,
    entities: badges,
    groups: [],
    headerIdxs: badges.map((_, i) => i),
    hasHeader: true,
    tiles,
    overflow: overflow as TileGroupOverflow,
    rowAlign: align as Align,
    rowColumns: columns as number | null,
    padding,
  };
};
