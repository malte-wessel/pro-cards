/*
 * tile-group-card-pro – several tiles on one card, under the entity group card's header.
 *
 *   type: custom:tile-group-card-pro
 *   layout: list                           # list (tiles one under the other) | row (vertical tiles side by side)
 *   title: Kitchen                         # template allowed
 *   icon: mdi:silverware-fork-knife        # the header's icon; template allowed
 *   title_tap_action                       # the title (and its icon)
 *   badges:                                # the header's badges (plain and small unless they say otherwise)
 *     - sensor.kitchen_temperature
 *   tiles:                                 # entity ids or tiles (tile-card-pro's keys, without type,
 *     - light.kitchen                      #   grid_options and vertical: the layout decides it)
 *     - { entity: switch.coffee_machine, status_badge: true, visibility: [...] }
 *
 * The tiles are tile cards of their own, hosted flat on the group's surface: everything a tile does
 * (kinds, controls, status, badges) works the same in a group.
 */
import { registerCard } from "./shared/card.ts";
import { childKey, reconcile } from "./shared/cards/children.ts";
import { EntityCardBase, type VisState } from "./shared/entity/base.ts";
import type { CardConfigBase, GridOptions, HomeAssistant } from "./shared/ha.ts";
import { t } from "./shared/i18n.ts";
import type { Visibility } from "./shared/visibility.ts";
import {
  CARD_TYPE,
  normalizeTileGroupConfig,
  TILE_TYPE,
  type TileGroupConfig,
} from "./tile-group/config.ts";
import { STYLE_TILE_GROUP_CARD } from "./tile-group/styles.ts";

// a hosted tile card
interface TileEl extends HTMLElement {
  setConfig(config: CardConfigBase): void;
  hass?: HomeAssistant;
  getGridOptions?(): GridOptions;
}
interface Tile {
  key: string;
  el: TileEl;
  // the tile's place in the layout, hidden by the tile's visibility
  wrap: HTMLElement;
  visibility: Visibility;
}

// a grid column's width in a sections view (the row layout's least width per tile)
const COLUMN_PX = 40;

export class TileGroupCard extends EntityCardBase {
  static cardType = CARD_TYPE;
  _tiles: Tile[] = [];

  static getStubConfig(hass: HomeAssistant | undefined, entities?: string[]) {
    return { title: t(hass, "group.stub_title"), tiles: (entities || []).slice(0, 3) };
  }
  _normalize(raw: unknown) {
    const cfg = normalizeTileGroupConfig(raw);
    this._syncTiles(cfg);
    return cfg;
  }
  _styles() {
    return STYLE_TILE_GROUP_CARD;
  }

  // the tile cards for a config: a tile whose config is the same keeps its element (wherever it
  // moved), an edited one is configured again; a tile's error is the group's, naming the tile
  _syncTiles(cfg: TileGroupConfig) {
    const ctor = customElements.get(TILE_TYPE);
    if (!ctor) throw new Error(`${CARD_TYPE}: ${TILE_TYPE} is not loaded`);
    const keys = cfg.tiles.map((x) => childKey(x.config));
    const prev = this._tiles;
    const reuse = reconcile(
      prev.map((x) => x.key),
      keys,
    );
    this._tiles = cfg.tiles.map((x, i) => {
      const old = reuse[i] === null ? null : prev[reuse[i] as number];
      const el = old?.el ?? (document.createElement(TILE_TYPE) as TileEl);
      if (!old || old.key !== keys[i]) {
        try {
          el.setConfig(x.config);
        } catch (e) {
          const msg = String((e as Error)?.message ?? e).replace(`${TILE_TYPE}: `, "");
          throw new Error(`${CARD_TYPE}: tiles[${i}]: ${msg}`, { cause: e });
        }
      }
      if (this._hass && !old) el.hass = this._hass;
      const wrap = old?.wrap ?? document.createElement("div");
      wrap.className = "tile";
      if (wrap.firstChild !== el) wrap.replaceChildren(el);
      return { key: keys[i], el, wrap, visibility: x.visibility };
    });
  }

  _setHass(hass: HomeAssistant) {
    super._setHass(hass);
    for (const x of this._tiles) x.el.hass = hass;
  }

  // the tiles' conditions are the group's to evaluate (a tile card leaves its own to Home
  // Assistant): they hide a tile in place, the body keeps its tiles
  _visibilityTrees(): Visibility[] {
    return [...super._visibilityTrees(), ...this._tiles.map((x) => x.visibility)];
  }
  _bodyShown(_vis: VisState): boolean {
    return this._tiles.some((x) => this._shown(x.visibility));
  }
  _buildBody(body: HTMLElement) {
    const tiles = document.createElement("div");
    tiles.className = `tiles layout-${(this._config as TileGroupConfig).layout}`;
    // the row's columns: as wide as the widest tile needs at least (wide controls: more)
    const min = Math.max(0, ...this._tiles.map((x) => x.el.getGridOptions?.().min_columns ?? 0));
    if (min) tiles.style.setProperty("--tg-col", `${min * COLUMN_PX}px`);
    for (const x of this._tiles) tiles.appendChild(x.wrap);
    body.appendChild(tiles);
  }
  _render() {
    for (const x of this._tiles) x.wrap.hidden = !this._shown(x.visibility);
    super._render();
  }

  getCardSize() {
    const cfg = this._config as TileGroupConfig | undefined;
    if (!cfg) return 2;
    return this._headerRows() + (cfg.layout === "row" ? 2 : this._tiles.length);
  }
  getGridOptions(): GridOptions {
    const cfg = this._config as TileGroupConfig | undefined;
    const columns = cfg?.layout === "row" ? 12 : 6;
    return { columns, rows: "auto", min_columns: 6 };
  }
}

registerCard(TileGroupCard, {
  name: "Tile Group Card Pro",
  description: "Several tiles on one card under a header, one under the other or side by side",
});
