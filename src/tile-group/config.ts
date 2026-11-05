// The tile group card's config (pure): the header (title, icon, its badges), the layout and the
// tiles. The group sets nothing on its tiles but their layout (a row's are vertical): each tile
// says everything about itself. The tiles are tile cards of their own (the group hosts them), so
// their configs are tile card configs, checked by the tile card.
import type { CardConfigBase } from "../shared/ha.ts";
import {
  normalizeActionDefaults,
  normalizeTitleAction,
  type EntityCardConfig,
  type RawAction,
} from "../shared/entity/config.ts";
import { badgeWindow, normalizePills } from "../shared/kinds/badge.ts";
import { normalizeVisibility, type Visibility } from "../shared/visibility.ts";

export const CARD_TYPE = "tile-group-card-pro";
export const TILE_TYPE = "tile-card-pro";
export const TILE_GROUP_LAYOUTS = ["list", "row"] as const;
export type TileGroupLayout = (typeof TILE_GROUP_LAYOUTS)[number];

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
}

interface RawTileGroupConfig extends CardConfigBase {
  layout?: unknown;
  title?: string | null;
  title_tap_action?: RawAction;
  icon?: string | null;
  badges?: unknown;
  tiles?: unknown;
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

export const normalizeTileGroupConfig = (input: unknown): TileGroupConfig => {
  if (!isObj(input)) throw new Error(`${CARD_TYPE}: invalid config`);
  const raw = input as RawTileGroupConfig;
  const layout = raw.layout ?? "list";
  if (!TILE_GROUP_LAYOUTS.includes(layout as TileGroupLayout))
    throw new Error(`${CARD_TYPE}: layout takes ${TILE_GROUP_LAYOUTS.join(" or ")}`);
  if (raw.entities !== undefined) throw new Error(`${CARD_TYPE}: entities is tiles`);
  for (const k of Object.keys(raw))
    if (!CARD_KEYS.has(k) && raw[k] !== undefined)
      throw new Error(
        `${CARD_TYPE}: a tile group sets nothing on its tiles: ${k} goes on each tile`,
      );
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
    const { visibility, ...rest } = own;
    const entity = typeof rest.entity === "string" ? rest.entity : null;
    return {
      config: { type: `custom:${TILE_TYPE}`, ...rest, vertical: layout === "row" },
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
  };
};
