// The tile group card's config (pure): the header (title, icon, its badges), the layout and the
// tiles. Every key the card does not take itself is a default for every tile; a tile's own value
// wins. The tiles are tile cards of their own (the group hosts them), so their configs are tile
// card configs, checked by the tile card.
import type { CardConfigBase } from "../shared/ha.ts";
import {
  normalizeActionDefaults,
  normalizeHeaderEntities,
  normalizeHistoryOptions,
  normalizeTitleAction,
  type EntityCardConfig,
  type RawAction,
  type RawHistoryOptions,
} from "../shared/entity/config.ts";
import { normalizeVisibility, type Visibility } from "../shared/visibility.ts";

export const CARD_TYPE = "tile-group-card-pro";
export const TILE_TYPE = "tile-card-pro";
export const TILE_GROUP_LAYOUTS = ["list", "row"] as const;
export type TileGroupLayout = (typeof TILE_GROUP_LAYOUTS)[number];

// the card's own keys: the header, the layout, the tiles and Home Assistant's; every other key is
// a default for the tiles
const CARD_KEYS = new Set([
  "type",
  "layout",
  "title",
  "icon",
  "title_tap_action",
  "badges",
  "entities",
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

interface RawTileGroupConfig extends CardConfigBase, RawHistoryOptions {
  layout?: unknown;
  title?: string | null;
  title_tap_action?: RawAction;
  icon?: string | null;
  badges?: unknown;
  entities?: unknown;
  hover?: boolean | null;
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

export const normalizeTileGroupConfig = (input: unknown): TileGroupConfig => {
  if (!isObj(input)) throw new Error(`${CARD_TYPE}: invalid config`);
  const raw = input as RawTileGroupConfig;
  const layout = raw.layout ?? "list";
  if (!TILE_GROUP_LAYOUTS.includes(layout as TileGroupLayout))
    throw new Error(`${CARD_TYPE}: layout takes ${TILE_GROUP_LAYOUTS.join(" or ")}`);
  if (raw.entity !== undefined)
    throw new Error(`${CARD_TYPE}: entity belongs on each tile, under entities`);
  if (!Array.isArray(raw.entities) || !raw.entities.length)
    throw new Error(`${CARD_TYPE}: entities must be a list of entities or tiles`);
  const defaults = Object.fromEntries(Object.entries(raw).filter(([k]) => !CARD_KEYS.has(k)));
  const tiles = raw.entities.map((e, i): TileGroupTile => {
    const label = `entities[${i}]`;
    const own = typeof e === "string" ? { entity: e } : isObj(e) ? e : null;
    if (!own) throw new Error(`${CARD_TYPE}: ${label} must be an entity id or a tile`);
    if (own.type !== undefined || own.grid_options !== undefined)
      throw new Error(`${CARD_TYPE}: ${label}: a tile in a group takes no type or grid_options`);
    const { visibility, ...rest } = own;
    const entity = typeof rest.entity === "string" ? rest.entity : null;
    return {
      config: { type: `custom:${TILE_TYPE}`, vertical: layout === "row", ...defaults, ...rest },
      visibility: normalizeVisibility(visibility, { type: CARD_TYPE, label, entity }),
    };
  });
  // the header's badges as the group card draws them (plain and small unless they say
  // otherwise): their own actions, not the tiles' defaults
  const ctx = { type: CARD_TYPE, ...normalizeActionDefaults({ hover: raw.hover }) };
  const badges = normalizeHeaderEntities(raw.badges, ctx, "badges");
  return {
    layout: layout as TileGroupLayout,
    title: raw.title ?? null,
    titleTap: normalizeTitleAction(raw),
    icon: raw.icon ?? null,
    ...normalizeHistoryOptions(raw),
    ...ctx,
    columns: 1,
    entities: badges,
    groups: [],
    headerIdxs: badges.map((_, i) => i),
    hasHeader: true,
    tiles,
  };
};
