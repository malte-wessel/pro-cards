/*
 * tile-card-pro – one entity (or none) as a tile, filled the way its kind says.
 *
 *   type: custom:tile-card-pro
 *   entity: climate.living_room            # optional; its domain and device class pick the kind
 *   kind: carbon_dioxide                   # what the entity is; detected when left out
 *   direction / gust / today / …           # the kind's own keys, flat on the card
 *   name / value / secondary / color       # the texts, plain text or templates
 *   icon: mdi:sofa | { type: icon | image | flow, name, ring, style, src, badge,
 *          tap_action, hold_action, double_tap_action } | false     # the icon's place
 *   visual: sparkline | { type, hours, bucket, axis, src, … } | false  # below the line or behind it
 *   status: "{{ … }}"                      # the status on the line after the value, or false
 *   status_badge: true                     # the status as the first badge instead
 *   badges: [sensor.x, { attribute: humidity }]   # at the line's end, centred on the icon
 *   rules: [...]                           # replace the kind's own rules as a whole; set places too
 *   control: slider | { type, position, attribute, step, options, confirm }   # the kind's, or this
 *   vertical: true                         # the icon on top, the texts centred under it
 *   show_name / show_value / tap_action / hold_action / double_tap_action / hover
 */
import { defineElement, registerCard } from "./shared/card.ts";
import { cssColor, domainOf } from "./shared/color.ts";
import type { GridOptions, HomeAssistant } from "./shared/ha.ts";
import type { EntityItem, ValueSrc } from "./shared/entity/config.ts";
import { hasTileControl, tileMinColumns } from "./shared/entity/control.ts";
import { asText } from "./shared/entity/look.ts";
import { tplOf, type EntityModel, type RenderCtx } from "./shared/entity/model.ts";
import { bindKeptLeadTap, leadTapState } from "./shared/entity/render/controls.ts";
import { inlineVisualEl } from "./shared/entity/render/badge.ts";
import {
  fillTableSlots,
  fillTileSlots,
  tileCorner,
  tileLead,
  tileValueText,
} from "./shared/entity/render/fill.ts";
import { KindCardBase } from "./shared/kinds/card.ts";
import { KindCardEditor } from "./shared/kinds/editor.ts";
import { div } from "./shared/kinds/dom.ts";
import { stateText } from "./shared/kinds/domains.ts";
import { BELOW, resolvePlaces } from "./shared/kinds/places.ts";
import { fillStatus, imageUrl, statusText } from "./shared/kinds/render.ts";
import type { KindCtx } from "./shared/kinds/types.ts";
import { isNum } from "./shared/util.ts";
import { iconBadgeOf, type IconBadge } from "./tile/badge.ts";
import { normalizeTileConfig, parseIconBadge, type TileConfig } from "./tile/config.ts";
import { CARD_TYPE } from "./tile/constants.ts";

// vertical_align as the body's flex alignment
const ALIGN = { top: "flex-start", center: "center", bottom: "flex-end" } as const;
// what can be in a zone (its badge is the zone's icon)
const ZONED = new Set(["person", "device_tracker"]);
import { STYLE_TILE_CARD_ALL } from "./tile/styles.ts";
import { hasKind } from "./shared/suggest.ts";

export class TileCard extends KindCardBase {
  static cardType = CARD_TYPE;
  static thing = "tile" as const;
  static leadSize = 36;
  static getConfigElement() {
    return document.createElement(`${CARD_TYPE}-editor`);
  }
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
    // another config: the controls' and a table row's fit found again
    this._ctlFit = null;
    return normalizeTileConfig(raw, this._nextHass ?? this._hass);
  }
  _styles() {
    return STYLE_TILE_CARD_ALL;
  }
  _extraTemplates(cfg: TileConfig): string[] {
    const out = super._extraTemplates(cfg);
    if (cfg.statusText?.kind === "template") out.push(cfg.statusText.template);
    // the icon's badges of the card and its rules
    for (const p of this._written(cfg)) {
      const b = p.icon ? parseIconBadge(p.icon.badge) : "auto";
      if (b && b !== "auto")
        for (const v of [b.icon, b.color]) if (v?.kind === "template") out.push(v.template);
    }
    return out;
  }

  // the badge on the icon: Home Assistant's, none, or the card's own (its templates rendered; an
  // empty icon: none, no colour: the tile's)
  _iconBadge(ctx: RenderCtx, m: EntityModel): IconBadge | null {
    const b = parseIconBadge(this._placesFor(m).icon.badge);
    if (b === false) return null;
    if (b === "auto") return iconBadgeOf(ctx.hass, m.st);
    const text = (v: ValueSrc | null) => {
      const t =
        v?.kind === "text"
          ? v.text
          : v?.kind === "template"
            ? asText(tplOf(ctx, v.template))
            : null;
      return t?.trim() || null;
    };
    const icon = text(b.icon);
    if (!icon) return null;
    const color = text(b.color);
    return {
      icon,
      color: color ? cssColor(color, "var(--fe-color)") : "var(--fe-color)",
      label: null,
    };
  }

  // the icon's own actions are a toggle tap alone (a light's, a fan's by default): the kind's lead
  // stays (the fan turns on) and takes it
  _plainToggle() {
    const a = this._config?.iconActions;
    return !!a && a.tap?.action === "toggle" && !a.hold && !a.dbl;
  }
  _actionsTakeLead(cfg: TileConfig) {
    return super._actionsTakeLead(cfg) && !this._plainToggle();
  }

  // the status: the card's, else the kind's, else the matching rule's status; none with status:
  // false
  _status(kc: KindCtx) {
    const cfg = this._config as TileConfig;
    if (cfg.statusIdx === null) return null;
    const s = statusText(kc.ctx, cfg, kc.m, cfg.kind.status?.(kc) ?? null);
    // a status badge is asked for: it shows, the entity's state where the type and the rules say
    // nothing (a vacuum's value is its state), even where it repeats the value
    if (cfg.statusBadge) return s ?? stateText(kc);
    // on the line, a status that repeats the value is left out
    return s && s.toLowerCase() === this._lineValue.toLowerCase() ? null : s;
  }
  // the value the tile's line shows (the kind's, else the entity's), found when the row is filled:
  // before its status badge, which is in it
  _lineValue = "";

  // ----- DOM -----
  // the tile's row, and at the end of its first row the badges (the status among them where the
  // card says so)
  _buildBody(body: HTMLElement) {
    const cfg = this._config as TileConfig;
    const row = this._row(0, "tile");
    const badges = cfg.groups[0].badgeIdxs ?? [];
    if (badges.length) {
      const corner = tileCorner(row);
      for (const i of badges)
        corner.appendChild(this._row(i, i === cfg.statusIdx ? "hval pstatus" : "hval"));
    }
    body.appendChild(row);
  }
  _fill(ctx: RenderCtx, row: HTMLElement, ent: EntityItem, idx: number, m: EntityModel) {
    const cfg = this._config as TileConfig;
    if (idx === cfg.statusIdx && row.classList.contains("hval")) {
      fillStatus(ctx, row, ent, idx, m, this._status(this._kindCtx(ctx)));
      return;
    }
    if (idx !== 0 || !row.classList.contains("tile")) return super._fill(ctx, row, ent, idx, m);
    const kc = this._kindCtx(ctx);
    const slots = this._slots(kc);
    if (cfg.table) {
      // a table's row: the name, the value and its status, one control or visual after them
      this._lineValue = ent.item.showValue
        ? tileValueText(slots.value === undefined ? m.fmt : slots.value)
        : "";
      slots.status = this._status(kc);
      const t = cfg.table;
      const inline = t.visual ? inlineVisualEl(ctx, ent, m, t.visual, t.hours) : null;
      fillTableSlots(ctx, row, ent, idx, m, slots, inline);
      return;
    }
    // the status on the line, unless it is a badge
    slots.status = cfg.statusBadge ? null : this._status(kc);
    // a vertical tile's line is narrow: the value and the status, the type's line left out (one
    // the card writes stays)
    if (cfg.vertical && slots.secondary !== undefined) slots.secondary = null;
    // the icon place's picture while it has one, else the icon; the icon's style and ring, and the
    // visual the item draws below the line, as the places say now
    const pic = imageUrl(ctx, this._iconLook(kc).iconImage);
    const icon = this._drawItem(kc, ent);
    this._lineValue = ent.item.showValue
      ? tileValueText(slots.value === undefined ? m.fmt : slots.value)
      : "";
    const lead = tileLead(row);
    const kept = this._keepLead(kc, lead, icon);
    if (kept) slots.lead = "keep";
    fillTileSlots(
      ctx,
      row,
      icon,
      idx,
      pic ? { ...m, look: { ...m.look, picture: pic } } : m,
      slots,
    );
    // a kept lead with the icon's toggle (a fan's turning blades): a switch, its tap bound once
    const el = lead.firstElementChild as HTMLElement | null;
    if (kept && el && this._plainToggle()) {
      leadTapState(el, ctx, icon, idx, m);
      bindKeptLeadTap(el, () => {
        const now = this._ctx();
        return {
          ctx: now,
          ent: (this._config as TileConfig).entities[0],
          idx: 0,
          m: this._modelAt(now, 0),
        };
      });
    }
    this._fadePicture(lead);
    // the badge on the icon, as Home Assistant's tile: what a thermostat does, a person's zone …
    const badge = icon.item.showIcon ? this._iconBadge(ctx, m) : null;
    let b = lead.querySelector<HTMLElement>(":scope > .tibadge");
    if (!badge) b?.remove();
    else {
      if (!b) {
        b = div("tibadge");
        b.appendChild(document.createElement("ha-icon"));
      }
      // after the lead, which a fill may have built anew
      lead.appendChild(b);
      b.style.setProperty("--tibadge", badge.color);
      b.firstElementChild?.setAttribute("icon", badge.icon);
      if (badge.label) {
        b.setAttribute("role", "img");
        b.setAttribute("aria-label", badge.label);
      } else {
        b.removeAttribute("role");
        b.removeAttribute("aria-label");
        b.setAttribute("aria-hidden", "true");
      }
    }
  }
  // the tile reads its inputs, what its kind says, its status and its icon's picture
  _rowInputs(ctx: RenderCtx, row: HTMLElement, idx: number, m: EntityModel) {
    const inputs = super._rowInputs(ctx, row, idx, m);
    const cfg = this._config as TileConfig;
    if (!inputs || (idx !== 0 && idx !== cfg.statusIdx)) return inputs;
    const kc = this._kindCtx(ctx);
    // a table's row: its visual's history too
    if (cfg.table) {
      const v = cfg.table.visual;
      const id = cfg.entities[0].entity;
      const hist = (v === "sparkline" || v === "trend") && id ? ctx.series.get(id) : null;
      return [...inputs, ...this._kindInputs(kc), this._status(kc), hist];
    }
    if (idx === cfg.statusIdx)
      return [...inputs, kc.m, ...this._kindInputs(kc), this._lineValue, this._status(kc)];
    return [
      ...inputs,
      ...this._kindInputs(kc),
      this._status(kc),
      imageUrl(ctx, this._iconLook(kc).iconImage),
      // the badge on the icon, and a person's zone (its icon on Home Assistant's): the zones are
      // looked through only for what is in one
      JSON.stringify(this._iconBadge(ctx, m)),
      ...(ZONED.has(domainOf(m.st?.entity_id ?? ""))
        ? Object.keys(ctx.hass?.states ?? {})
            .filter((id) => id.startsWith("zone."))
            .map((id) => ctx.hass?.states[id])
        : []),
    ];
  }
  _rowColor(row: HTMLElement, ent: EntityItem, m: EntityModel) {
    const color = super._rowColor(row, ent, m);
    const idx = Number(row.dataset.idx);
    // the status badge takes the tile's colour, as on a poster
    if (idx === this._config?.statusIdx) return this._kindColor(ent, m) ?? color;
    if (idx !== 0) return color;
    // the tile's colour on the card too: its focus ring (STYLE_KIND_CARD_FOCUS)
    const own = this._kindColor(ent, m) ?? color;
    this._root?.style.setProperty("--card-tint", own);
    return own;
  }
  _render() {
    // vertical: the icon on top, before anything is laid out; a table's row: one line
    this._root?.classList.toggle("tvertical", !!this._config?.vertical);
    this._root?.classList.toggle("ttable", !!this._config?.table);
    // where the content sits in a taller tile: written, else centred (or the group row's top)
    const align = this._config?.vAlign;
    if (align) this._root?.style.setProperty("--pro-cards-tile-align", ALIGN[align]);
    else this._root?.style.removeProperty("--pro-cards-tile-align");
    super._render();
    const cfg = this._config,
      body = this._root?.querySelector<HTMLElement>(":scope > .body"),
      row = body?.querySelector<HTMLElement>(":scope > .row.tile");
    if (!cfg || !body || !row || !this._hass) return;
    // a table's row has no lead and nothing behind or below its texts
    if (cfg.table) {
      if (this._root) this._fitTable(this._root, row);
      return;
    }
    const kc = this._kindCtx(this._ctx());
    // the kind's lead follows every render (a new speed, a new direction), and what is behind the
    // texts (a glow, a picture, the kind's drawing)
    this._updateLead(kc, row, tileLead(row));
    this._drawBehind(body, row, kc);
    // what follows the clock or the size (a curve, the progress) checks itself whether it changed
    cfg.kind.live?.(kc, row);
    if (this._root) this._fitControls(this._root, row, cfg.vertical);
  }

  // a tile with no room for its controls (a fixed row, a card around it giving less): they go
  // under the line where they fit there; else they stay on the line beside a name of 40 px at
  // least (not on a vertical tile); else they are left out, and more-info has them, as a poster
  // leaves out its slider. Found once per card size, so nothing flips back and forth; a tile as
  // tall as its content (rows: auto) grows instead and never needs it
  // the controls' fit changes the tile's height where it is as tall as its content (rows: auto, a
  // tile group): a resize renders a frame later, not inside the observer's pass
  _resizeLater = true;
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
          // (both edges: in a right-to-left language the card runs out on the left)
          return (
            b.left >= box.left - 0.5 && b.right <= box.right + 0.5 && b.bottom <= box.bottom + 0.5
          );
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

  // a table's row is one line, and gives way in this order: the status, then the name (to 40 px),
  // then the control or the visual (more-info has them). Found once per card size, as a tile's
  // controls
  _fitTable(card: HTMLElement, row: HTMLElement) {
    const set = (mode: string) => {
      row.classList.toggle("tkeep", !mode.startsWith("drop"));
      row.classList.toggle("tdrop", mode.startsWith("drop"));
      row.classList.toggle("tbare", mode.endsWith("bare"));
    };
    const size = `${card.clientWidth}x${card.clientHeight}`;
    if (this._ctlFit?.size !== size) {
      const line = row.querySelector<HTMLElement>(".line");
      const name = row.querySelector<HTMLElement>(".tname");
      const tail = () => [
        ...row.querySelectorAll<HTMLElement>(".end > :is(.ctl, .bbar, .bspark, .btr)"),
      ];
      const has = tail().length > 0;
      // nothing past the line's end (the card's padding), no speeds cut at it (a hold's ring
      // reaches past its button, so only the speeds count as cut)
      // (both edges: in a right-to-left language the line runs out on the left); and the value
      // whole beside them, which is cut only where it does not fit alone
      const fits = () => {
        const l = line?.getBoundingClientRect();
        const value = row.querySelector<HTMLElement>(".end > .state");
        if (value && value.scrollWidth > value.clientWidth + 0.5) return false;
        return tail().every((c) => {
          if (c.classList.contains("ctl-segments") && c.scrollWidth > c.clientWidth + 0.5)
            return false;
          const b = c.getBoundingClientRect();
          return !b.width || !l || (b.left >= l.left - 0.5 && b.right <= l.right + 0.5);
        });
      };
      // the name whole, and the status too (never cut to its first letters)
      const whole = () =>
        [name, row.querySelector<HTMLElement>(".end > .tstatus")].every(
          (e) => !e || e.scrollWidth <= e.clientWidth + 0.5,
        );
      // the status goes where the name would be cut beside it; without it the name may be (to its
      // 40 px), and only then the control goes
      const ok: Record<string, () => boolean> = {
        keep: () => fits() && whole(),
        "keep bare": fits,
        drop: whole,
      };
      let mode = "drop bare";
      for (const m of ["keep", "keep bare", "drop"]) {
        if (m === "drop" && !has) continue;
        set(m);
        if (ok[m]()) {
          mode = m;
          break;
        }
      }
      this._ctlFit = { size, mode };
    }
    set(this._ctlFit.mode);
  }

  // the visual as the card and its kind say, without a rule's (the size never follows a state)
  _writtenVisual() {
    const cfg = this._config as TileConfig;
    return resolvePlaces([{ icon: undefined, visual: this._kindVisual() }, cfg.places]).visual;
  }

  getGridOptions(): GridOptions {
    const cfg = this._config;
    if (!cfg) return { columns: 6, rows: "auto" };
    // a tile sizes to its content, so it stretches with its grid row: a plain tile is one 56 px
    // row; a block visual or a control makes it taller (a control on the line wraps under the name
    // when the tile is narrow). A card around it may give it less (a swipe card, a stack)
    const ent = cfg.entities[0];
    // the visual below the line as the card writes it (or the kind's): a plot or the kind's
    // picture needs a second row, a bar or a gauge takes one too
    const v = this._writtenVisual();
    const below = !!v && BELOW.includes(v.type as never) && v.type !== "segments";
    const plot = below && v.type !== "bar" && v.type !== "gauge";
    // a vertical tile: the icon over two lines of text, as narrow as its controls let it be (a
    // quarter of a section); two rows for those, one more for a control under them, one more for
    // a plot, one more for the badges above the icon
    if (cfg.vertical) {
      const columns = tileMinColumns(ent, true);
      const badges = (cfg.groups[0].badgeIdxs ?? []).length > 0;
      const rows = 2 + (hasTileControl(ent) ? 1 : 0) + (plot ? 1 : 0) + (badges ? 1 : 0);
      return { columns, rows: "auto", min_columns: columns, min_rows: rows };
    }
    if (!below && !hasTileControl(ent))
      return { columns: 6, rows: "auto", min_columns: 3, min_rows: 1 };
    // a plot needs two rows: in one it would have no room at all
    return { columns: 6, rows: "auto", min_columns: tileMinColumns(ent), min_rows: plot ? 2 : 1 };
  }
}

registerCard(TileCard, {
  name: "Tile Card Pro",
  description:
    "One entity as a tile drawn the way its poster type says: an animated icon, its value and status on one line, controls at its end",
  suggest: hasKind,
});

class TileCardEditor extends KindCardEditor {
  static thing = "tile" as const;
}
defineElement(`${CARD_TYPE}-editor`, TileCardEditor);
