/*
 * tile-card-pro – one entity (or none) as a tile, filled the way its poster type says.
 *
 *   type: custom:tile-card-pro
 *   entity: climate.living_room            # optional; its domain and device class pick the type
 *   poster: carbon_dioxide                 # the poster type; detected when left out
 *   variant / direction / gust / today / …  # the type's own keys, flat on the card
 *   name / icon / value / secondary / color   # the places, plain text or templates
 *   status: "{{ … }}"                      # the status on the line after the value, or false
 *   rules: [...]                           # replace the type's own rules as a whole
 *   visual: sparkline                      # sparkline | columns | strip | bar | gauge | none: below
 *   show_picture: true                     # the type's picture below the line (a weather curve)
 *   control: slider                        # the type's controls at the line's end; a slider below
 *   icon_image: person.alex                # a picture in the icon: a URL, a template or an entity's
 *   icon_ring / icon_tap_action / icon_hold_action / icon_double_tap_action   # the icon's own
 *   show_icon / show_name / show_value / tap_action / hold_action / double_tap_action / hover
 *   hours_to_show / bucket_minutes / smoothing_minutes
 */
import { registerCard } from "./shared/card.ts";
import type { GridOptions, HomeAssistant } from "./shared/ha.ts";
import { BLOCK_VISUALS } from "./shared/entity/constants.ts";
import type { EntityItem } from "./shared/entity/config.ts";
import { hasTileControl, tileMinColumns } from "./shared/entity/control.ts";
import type { EntityModel, RenderCtx } from "./shared/entity/model.ts";
import { fillTileSlots, tileLead } from "./shared/entity/render/fill.ts";
import { KindCardBase } from "./shared/kinds/card.ts";
import { div } from "./shared/kinds/dom.ts";
import { glowLevel, glowOpacity, imageUrl, statusText } from "./shared/kinds/render.ts";
import type { KindCtx } from "./shared/kinds/types.ts";
import { isNum } from "./shared/util.ts";
import { normalizeTileConfig, type TileConfig } from "./tile/config.ts";
import { CARD_TYPE } from "./tile/constants.ts";
import { STYLE_TILE_CARD_ALL } from "./tile/styles.ts";

export class TileCard extends KindCardBase {
  static cardType = CARD_TYPE;
  static thing = "tile" as const;
  static leadSize = 36;
  static getStubConfig(hass: HomeAssistant | undefined, entities?: string[]) {
    const e =
      (entities || []).find(
        (id) => id.startsWith("sensor.") && hass?.states[id] && isNum(hass.states[id].state),
      ) ||
      (entities || [])[0] ||
      "";
    return { entity: e };
  }

  declare _config?: TileConfig;

  _normalize(raw: unknown) {
    return normalizeTileConfig(raw, this._nextHass ?? this._hass);
  }
  _styles() {
    return STYLE_TILE_CARD_ALL;
  }
  _extraTemplates(cfg: TileConfig): string[] {
    const out = super._extraTemplates(cfg);
    if (cfg.statusText?.kind === "template") out.push(cfg.statusText.template);
    return out;
  }

  // the status on the line: the card's, else the kind's, else the matching rule's label
  _status(kc: KindCtx) {
    const cfg = this._config as TileConfig;
    return cfg.showStatus ? statusText(kc.ctx, cfg, kc.m, cfg.kind.status?.(kc) ?? null) : null;
  }
  _fill(ctx: RenderCtx, row: HTMLElement, ent: EntityItem, idx: number, m: EntityModel) {
    const cfg = this._config as TileConfig;
    if (idx !== 0 || !row.classList.contains("tile")) return super._fill(ctx, row, ent, idx, m);
    const kc = this._kindCtx(ctx);
    const slots = this._slots(kc);
    slots.status = this._status(kc);
    // the type's picture is a second row: drawn when asked for, unless it runs along the edge (a
    // media player's progress)
    if (!cfg.showPicture && !slots.picture?.classList.contains("pprog")) delete slots.picture;
    // a vertical tile's line is narrow: the value and the status, the type's line left out (one
    // the card writes stays)
    if (cfg.vertical && slots.secondary !== undefined) slots.secondary = null;
    // icon_image: its picture in the icon while it has one, else the icon; the icon's style and
    // ring as the matching rule says
    const pic = imageUrl(ctx, this._iconLook(kc).iconImage);
    const icon = this._iconItem(kc, ent);
    const lead = tileLead(row);
    if (this._keepLead(kc, lead, icon)) slots.lead = "keep";
    fillTileSlots(
      ctx,
      row,
      icon,
      idx,
      pic ? { ...m, look: { ...m.look, picture: pic } } : m,
      slots,
    );
    this._fadePicture(lead);
  }
  // the tile reads its inputs, what its kind says, its status and its icon's picture
  _rowInputs(ctx: RenderCtx, row: HTMLElement, idx: number, m: EntityModel) {
    const inputs = super._rowInputs(ctx, row, idx, m);
    if (!inputs || idx !== 0) return inputs;
    const kc = this._kindCtx(ctx);
    return [
      ...inputs,
      ...this._kindInputs(kc),
      this._status(kc),
      imageUrl(ctx, this._iconLook(kc).iconImage),
    ];
  }
  _rowColor(row: HTMLElement, ent: EntityItem, m: EntityModel) {
    const color = super._rowColor(row, ent, m);
    return Number(row.dataset.idx) === 0 ? (this._kindColor(ent, m) ?? color) : color;
  }
  _render() {
    // vertical: the icon on top, before anything is laid out
    this._root?.classList.toggle("tvertical", !!this._config?.vertical);
    super._render();
    const cfg = this._config,
      body = this._root?.querySelector<HTMLElement>(":scope > .body"),
      row = body?.querySelector<HTMLElement>(":scope > .row.tile");
    if (!cfg || !body || !row || !this._hass) return;
    const kc = this._kindCtx(this._ctx());
    // the kind's lead follows every render (a new speed, a new direction)
    this._updateLead(kc, row, tileLead(row));
    // the glow in the tile's colour, as strong as its level (its opacity: a new level fades)
    let glow = body.querySelector<HTMLElement>(":scope > .tglow");
    if (cfg.glow && !glow) glow = body.insertBefore(div("tglow"), body.firstChild);
    else if (!cfg.glow && glow) {
      glow.remove();
      glow = null;
    }
    if (glow) {
      glow.style.setProperty("--glow", row.style.getPropertyValue("--fe-color"));
      glow.style.opacity = glowOpacity(glowLevel(cfg.kind, kc));
    }
    // what follows the clock or the size (a curve, the progress) checks itself whether it changed
    cfg.kind.live?.(kc, row);
    if (this._root) this._fitControls(this._root, row, cfg.vertical);
  }

  // a tile with no room for its controls (a fixed row, a card around it giving less): they go
  // under the line where they fit there; else they stay on the line beside a name of 40 px at
  // least (not on a vertical tile); else they are left out, and more-info has them, as a poster
  // leaves out its slider. Found once per card size, so nothing flips back and forth; a tile as
  // tall as its content (rows: auto) grows instead and never needs it
  _ctlFit: { size: string; mode: string } | null = null;
  _fitControls(card: HTMLElement, row: HTMLElement, vertical: boolean) {
    if (!row.querySelector(":scope > .ctl, :scope > .top > .main > .line > .end > .ctl")) return;
    const set = (mode: string) => {
      row.classList.toggle("tkeep", mode === "tkeep");
      row.classList.toggle("tdrop", mode === "tdrop");
    };
    const size = `${card.clientWidth}x${card.clientHeight}`;
    if (this._ctlFit?.size !== size) {
      // no control reaches past the card's edges (it clips them); beside the name, none scrolls
      // either (speeds cut at the line's end)
      const fits = (mode: string) => {
        const box = card.getBoundingClientRect();
        return [...row.querySelectorAll<HTMLElement>(".ctl, .toggle")].every((c) => {
          const b = c.getBoundingClientRect();
          if (!b.width) return true;
          if (mode === "tkeep" && c.scrollWidth > c.clientWidth + 0.5) return false;
          return b.right <= box.right + 0.5 && b.bottom <= box.bottom + 0.5;
        });
      };
      const modes = vertical ? ["", "tdrop"] : ["", "tkeep", "tdrop"];
      let mode = "";
      for (mode of modes) {
        set(mode);
        if (fits(mode)) break;
      }
      this._ctlFit = { size, mode };
    }
    set(this._ctlFit.mode);
  }

  getGridOptions(): GridOptions {
    const cfg = this._config;
    if (!cfg) return { columns: 6, rows: "auto" };
    // a tile sizes to its content, so it stretches with its grid row: a plain tile is one 56 px
    // row; a block visual or a control makes it taller (a control on the line wraps under the name
    // when the tile is narrow). A card around it may give it less (a swipe card, a stack)
    const ent = cfg.entities[0];
    const plot = ent.visual === "sparkline" || ent.visual === "columns" || cfg.showPicture;
    // a vertical tile: the icon over two lines of text, as narrow as its controls let it be (a
    // quarter of a section); two rows for those, one more for a control under them, one more for
    // a plot
    if (cfg.vertical) {
      const columns = tileMinColumns(ent, true);
      const rows = 2 + (hasTileControl(ent) ? 1 : 0) + (plot ? 1 : 0);
      return { columns, rows: "auto", min_columns: columns, min_rows: rows };
    }
    if (!BLOCK_VISUALS.has(ent.visual) && !hasTileControl(ent) && !cfg.showPicture)
      return { columns: 6, rows: "auto", min_columns: 3, min_rows: 1 };
    // a plot needs two rows: in one it would have no room at all
    return { columns: 6, rows: "auto", min_columns: tileMinColumns(ent), min_rows: plot ? 2 : 1 };
  }
}

registerCard(TileCard, {
  name: "Tile Card Pro",
  description:
    "One entity as a tile drawn the way its poster type says: an animated icon, its value and status on one line, controls at its end",
});
