/*
 * tile-group-card-pro – several tiles on one card, under the entity group card's header.
 *
 *   type: custom:tile-group-card-pro
 *   layout: list                           # list (tiles one under the other) | row (vertical tiles side by side) | table (one line each)
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
import { defineElement, registerCard } from "./shared/card.ts";
import { childKey, reconcile } from "./shared/cards/children.ts";
import { EntityCardBase, type VisState } from "./shared/entity/base.ts";
import type { CardConfigBase, GridOptions, HomeAssistant } from "./shared/ha.ts";
import { t } from "./shared/i18n.ts";
import { isTemplate } from "./shared/util.ts";
import type { Visibility } from "./shared/visibility.ts";
import {
  CARD_TYPE,
  normalizeTileGroupConfig,
  TILE_TYPE,
  type TileGroupConfig,
} from "./tile-group/config.ts";
import { TileGroupCardEditor } from "./tile-group/editor.ts";
import { fadesOf } from "./tile-group/scroll.ts";
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

// the key of a tile whose element took a config the group then rejected (matches no config)
const STALE = "";

// a grid column's width in a sections view (the row layout's least width per tile)
const COLUMN_PX = 40;

export class TileGroupCard extends EntityCardBase {
  static cardType = CARD_TYPE;
  _tiles: Tile[] = [];

  static getConfigElement() {
    return document.createElement(`${CARD_TYPE}-editor`);
  }
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
          // the group keeps its tiles of before, but those configured already (this one too) took
          // the rejected config: their keys no longer say what they draw, the next config sets them
          for (let k = 0; k <= i; k++) {
            const j = reuse[k];
            if (j !== null && prev[j].key !== keys[k]) prev[j].key = STALE;
          }
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
    const cfg = this._config as TileGroupConfig;
    const tiles = document.createElement("div");
    tiles.className = `tiles layout-${cfg.layout}`;
    // a row: where its tiles go when they do not fit, where they sit, the most on a line
    if (cfg.layout === "row") tiles.classList.add(`ov-${cfg.overflow}`, `al-${cfg.rowAlign}`);
    if (cfg.layout === "row" && cfg.rowColumns) {
      tiles.classList.add("cols");
      tiles.style.setProperty("--tg-cols", String(cfg.rowColumns));
    }
    // without padding: the tiles flush with the card and each other, square (the header follows)
    body.classList.toggle("flush", !cfg.padding);
    // the row's columns: as wide as the widest tile needs at least (wide controls: more)
    const min = Math.max(0, ...this._tiles.map((x) => x.el.getGridOptions?.().min_columns ?? 0));
    if (min) tiles.style.setProperty("--tg-col", `${min * COLUMN_PX}px`);
    for (const x of this._tiles) tiles.appendChild(x.wrap);
    body.appendChild(tiles);
    // a scrolling row fades on the side where more tiles are, as it scrolls
    this._scroller = cfg.layout === "row" && cfg.overflow === "scroll" ? tiles : null;
    this._scroller?.addEventListener("scroll", this._onScroll, { passive: true });
  }
  _render() {
    for (const x of this._tiles) x.wrap.hidden = !this._shown(x.visibility);
    super._render();
    // (a resize renders: the row may scroll now, or no longer)
    this._syncScroll();
  }

  // ----- a scrolling row -----
  _scroller: HTMLElement | null = null;
  _scrollFrame = 0;
  _onScroll = () => {
    if (this._scrollFrame) return;
    this._scrollFrame = requestAnimationFrame(() => {
      this._scrollFrame = 0;
      this._syncScroll();
    });
  };
  // its fades by where it is, and, while it scrolls, the keyboard's way in (arrow keys scroll it)
  _syncScroll() {
    const row = this._scroller;
    if (!row) return;
    const max = row.scrollWidth - row.clientWidth;
    const rtl = getComputedStyle(row).direction === "rtl";
    const { left, right } = fadesOf(row.scrollLeft, max, rtl);
    row.classList.toggle("fade-left", left);
    row.classList.toggle("fade-right", right);
    if (max > 1) {
      row.tabIndex = 0;
      row.setAttribute("role", "region");
      const title = (this._config as TileGroupConfig).title;
      row.setAttribute(
        "aria-label",
        title && !isTemplate(title) ? title : t(this._hass, "tile_group.tiles"),
      );
    } else {
      row.removeAttribute("tabindex");
      row.removeAttribute("role");
      row.removeAttribute("aria-label");
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    cancelAnimationFrame(this._scrollFrame);
    this._scrollFrame = 0;
  }

  getCardSize() {
    const cfg = this._config as TileGroupConfig | undefined;
    if (!cfg) return 2;
    const n = this._tiles.length;
    // a table's rows are 34 px, a sections row 56
    return (
      this._headerRows() +
      (cfg.layout === "row" ? 2 : cfg.layout === "table" ? Math.ceil((n * 34) / 56) : n)
    );
  }
  getGridOptions(): GridOptions {
    const cfg = this._config as TileGroupConfig | undefined;
    const columns = cfg?.layout === "row" ? 12 : 6;
    return { columns, rows: "auto", min_columns: 6 };
  }
}

registerCard(TileGroupCard, {
  name: "Tile Group Card Pro",
  description:
    "Several tiles on one card under a header, one under the other, side by side or as a table",
});
defineElement(`${CARD_TYPE}-editor`, TileGroupCardEditor);
