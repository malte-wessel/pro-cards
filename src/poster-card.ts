/*
 * poster-card-pro – one entity (or none) as a poster, drawn the way its poster type says.
 *
 *   type: custom:poster-card-pro
 *   entity: sensor.living_room_co2         # optional; its domain and device class pick the kind
 *   kind: carbon_dioxide                   # what the entity is; detected when left out
 *   direction / gust / today / …           # the kind's own keys, flat on the card
 *   name / value / secondary / color       # the slots, plain text or templates
 *   icon: mdi:sofa | { type: icon | image | flow, name, ring, style, src }   # the icon's place
 *   visual: glow | { type: image | flow | sparkline | …, … } | false        # what fills the card
 *   status: "{{ … }}"                      # the status: a text, a template, or false (first in the corner)
 *   badges: [sensor.x, { attribute: humidity }]   # the corner, after the status
 *   rules: [...]                           # replace the kind's own rules as a whole; set places too
 *   icon: { tap_action, hold_action, double_tap_action }   # the icon's own actions
 *   control / tap_action / hold_action / double_tap_action / hover
 */
import { registerCard } from "./shared/card.ts";
import { overflows } from "./shared/entity/base.ts";
import type { EntityCardConfig, EntityItem } from "./shared/entity/config.ts";
import type { EntityModel, RenderCtx } from "./shared/entity/model.ts";
import { fillPosterSlots } from "./shared/entity/render/fill.ts";
import { posterParts, secondaryEl } from "./shared/entity/render/lead.ts";
import type { GridOptions, HomeAssistant } from "./shared/ha.ts";
import { hideHover } from "./shared/hover.ts";
import { KindCardBase } from "./shared/kinds/card.ts";
import { fillStatus, imageUrl, statusText } from "./shared/kinds/render.ts";
import { normalizePosterConfig, type PosterConfig } from "./poster/config.ts";
import { CARD_TYPE } from "./poster/constants.ts";
import { STYLE_POSTER_CARD_ALL } from "./poster/styles.ts";

export class PosterCard extends KindCardBase {
  static cardType = CARD_TYPE;
  static thing = "poster" as const;
  static leadSize = 40;
  static getStubConfig(hass: HomeAssistant | undefined, entities?: string[]) {
    return { entity: (entities || [])[0] || Object.keys(hass?.states || {})[0] || "" };
  }

  declare _config?: PosterConfig;

  _normalize(raw: unknown) {
    return normalizePosterConfig(raw, this._nextHass ?? this._hass);
  }
  _styles() {
    return STYLE_POSTER_CARD_ALL;
  }

  // ----- what the card reads beyond its items: the status's template -----
  _extraTemplates(cfg: EntityCardConfig): string[] {
    const c = cfg as PosterConfig;
    const out = super._extraTemplates(c);
    if (c.statusText?.kind === "template") out.push(c.statusText.template);
    return out;
  }

  // ----- DOM -----
  _buildBody(body: HTMLElement) {
    const cfg = this._config as PosterConfig;
    const row = this._row(0, "poster");
    const { corner } = posterParts(row);
    for (const i of cfg.groups[0].badgeIdxs ?? [])
      corner.appendChild(this._row(i, i === cfg.statusIdx ? "hval pstatus" : "hval"));
    body.appendChild(row);
  }
  _fill(ctx: RenderCtx, row: HTMLElement, ent: EntityItem, idx: number, m: EntityModel) {
    const cfg = this._config as PosterConfig;
    if (idx === cfg.statusIdx && row.classList.contains("hval")) {
      const kc = this._kindCtx(ctx);
      fillStatus(ctx, row, ent, idx, m, statusText(ctx, cfg, m, cfg.kind.status?.(kc) ?? null));
      return;
    }
    if (idx === 0 && row.classList.contains("poster")) {
      const kc = this._kindCtx(ctx);
      const slots = this._slots(kc);
      // a kind's line under the value keeps its room while it has nothing to say (gusts gone, a
      // forecast still loading), so the name and the value never move
      if (slots.secondary === null) slots.secondary = secondaryEl([{ text: "\u00a0" }]);
      // a poster without an entity or a value has its name alone
      if (
        slots.value === undefined &&
        !ent.entity &&
        ent.valueSrc.kind === "text" &&
        ent.valueSrc.text === ""
      )
        slots.value = null;
      // the icon place's picture while it has one, else the icon; the icon's style and ring, and
      // the visual the item draws below the texts, as the places say now
      const pic = imageUrl(ctx, this._iconLook(kc).iconImage);
      const icon = this._drawItem(kc, ent);
      const plead = row.querySelector<HTMLElement>(":scope > .ptop > .plead");
      if (this._keepLead(kc, plead, icon)) slots.lead = "keep";
      fillPosterSlots(
        ctx,
        row,
        icon,
        idx,
        pic ? { ...m, look: { ...m.look, picture: pic } } : m,
        slots,
      );
      this._fadePicture(plead);
      this._placeControls(row);
      return;
    }
    super._fill(ctx, row, ent, idx, m);
  }
  // the poster reads its inputs and what its kind says; the status its text and the kind's
  _rowInputs(ctx: RenderCtx, row: HTMLElement, idx: number, m: EntityModel) {
    const inputs = super._rowInputs(ctx, row, idx, m);
    const cfg = this._config as PosterConfig;
    if (!inputs || (idx !== 0 && idx !== cfg.statusIdx)) return inputs;
    const kc = this._kindCtx(ctx);
    const kind = this._kindInputs(kc);
    if (idx === cfg.statusIdx)
      return [...inputs, kc.m, ...kind, statusText(ctx, cfg, m, cfg.kind.status?.(kc) ?? null)];
    return [...inputs, ...kind, imageUrl(ctx, this._iconLook(kc).iconImage)];
  }
  // the kind's colour where neither the item (the poster, the status badge) nor its rule names one.
  // The poster's own colour is the body's --pc-tint, a registered colour, so a new one fades (the
  // next song's cover); the status badge reads it too while it has the same colour
  _tint: string | null = null;
  _rowColor(row: HTMLElement, ent: EntityItem, m: EntityModel) {
    const cfg = this._config as PosterConfig;
    const idx = Number(row.dataset.idx);
    let color = super._rowColor(row, ent, m);
    if (idx === 0 || idx === cfg.statusIdx) color = this._kindColor(ent, m) ?? color;
    const body = row.closest<HTMLElement>(".body");
    if (idx === 0 && body) {
      body.style.setProperty("--pc-tint", color);
      // and on the card: its focus ring (STYLE_KIND_CARD_FOCUS)
      this._root?.style.setProperty("--card-tint", color);
      this._tint = color;
      return "var(--pc-tint)";
    }
    return idx === cfg.statusIdx && color === this._tint ? "var(--pc-tint)" : color;
  }
  _render() {
    // a new card size finds the value's size and the controls' place again (_fitValue)
    const root = this._root,
      fit = this._valueFit;
    if (root && fit && fit.width !== root.clientWidth) {
      fit.place = null;
      const poster = root.querySelector<HTMLElement>(":scope > .body > .row.poster");
      if (poster) this._placeControls(poster);
    }
    super._render();
    const cfg = this._config,
      card = this._root,
      body = card?.querySelector<HTMLElement>(":scope > .body"),
      row = body?.querySelector<HTMLElement>(":scope > .row.poster");
    if (!cfg || !card || !body || !row || !this._hass) return;
    const ctx = this._ctx(),
      kc = this._kindCtx(ctx);
    // the lead's and the backdrop's motion follow every render (a new speed, a new direction)
    this._updateLead(kc, row, row.querySelector<HTMLElement>(":scope > .ptop > .plead"));
    this._drawBehind(body, row, kc);
    // what follows the clock or the size (a curve) checks itself whether it changed
    cfg.kind.live?.(kc, row);
    this._fitValue(card, row);
    cfg.kind.placed?.(kc, row);
  }

  // the value's size for the room the card has, one size for every value (a word as a number, so
  // the gaps between the name, the value and its line never change): a value wider than its line
  // or content taller than the card draws it smaller, down to 45 % of its styled size. Controls
  // stay beside the value while it fits there (a number at 80 % of its size at least), else they
  // go under it and the value keeps its size; where even that
  // is too tall, the slider below the value goes (a media player's volume: more-info has it). What
  // was found holds until the card's own size changes: a new value may make it smaller, never
  // larger, so nothing jumps back and forth
  // the value's fit changes the card's height where it is as tall as its content (rows: auto)
  _resizeLater = true;
  _valueFit: {
    size: string;
    width: number;
    px: number | null;
    base: number | null;
    drop: boolean;
    place: "beside" | "under" | null;
  } | null = null;
  // where the controls go, beside the value or under it: decided once per card size (_fitValue),
  // so a value that gets wider (Cleaning, Returning) is drawn smaller rather than pushing them down,
  // and one that gets narrower does not pull them back up
  _placeControls(row: HTMLElement) {
    const main = row.querySelector<HTMLElement>(":scope > .pbody > .pmain");
    const place = this._valueFit?.place ?? null;
    if (!main) return;
    main.classList.toggle("beside", place === "beside");
    main.classList.toggle("under", place === "under");
  }
  _fitValue(card: HTMLElement, row: HTMLElement) {
    const big = row.querySelector<HTMLElement>(
      ":scope > .pbody > .pmain > .ptext > .pvalue > .big",
    );
    const top = row.querySelector<HTMLElement>(":scope > .ptop"),
      body = row.querySelector<HTMLElement>(":scope > .pbody");
    const b = big?.querySelector("b");
    if (!big || !b || !top || !body) return;
    const sliders = body.querySelectorAll<HTMLElement>(":scope > .ctl-slider");
    const drop = (on: boolean) => sliders.forEach((el) => el.classList.toggle("pfit-out", on));
    const end = body.querySelector<HTMLElement>(":scope > .pmain > .end");
    const size = `${card.clientWidth}x${card.clientHeight}`;
    if (this._valueFit?.size !== size) {
      big.classList.remove("hfit");
      drop(false);
      // the controls' place follows the width only: a card as tall as its content (rows: auto)
      // grows when they go under the value, and must not try them beside it again then
      const width = card.clientWidth;
      const kept = this._valueFit?.width === width ? this._valueFit.place : null;
      // controls try beside the value first
      const place = kept ?? (end ? "beside" : null);
      this._valueFit = { size, width, px: null, base: null, drop: false, place };
      this._placeControls(row);
    }
    const fit = this._valueFit;
    const apply = (px: number) => {
      big.style.setProperty("--hfit", `${px}px`);
      big.classList.add("hfit");
    };
    if (fit.px !== null) apply(fit.px);
    // a row filled again has its slider back
    if (fit.drop) drop(true);
    // what is missing: content taller than the row packs to its bottom and pushes the top line out
    // above it; in a body that shrinks with its picture, a part reaches past the body's bottom
    // (counting its margins: a picture reaches to the card's edge on purpose; a part placed on its
    // own, a media player's progress along the edge, is not in the flow)
    const short = () => {
      const bottom = body.getBoundingClientRect().bottom;
      let past = 0;
      for (const el of body.children) {
        const r = el.getBoundingClientRect();
        if (r.height === 0 || getComputedStyle(el).position === "absolute") continue;
        past = Math.max(past, r.bottom + parseFloat(getComputedStyle(el).marginBottom) - bottom);
      }
      return Math.max(row.getBoundingClientRect().top - top.getBoundingClientRect().top, past);
    };
    const misses = () => overflows(b) || short() > 0.5;
    if (!misses()) return;
    // the styled size, found once per card size
    if (fit.base === null) {
      big.classList.remove("hfit");
      fit.base = parseFloat(getComputedStyle(b).fontSize);
    }
    const base = fit.base;
    const min = Math.round(base * 0.45);
    // beside the controls a number gives up less of its size: one that would have to get smaller
    // than this to fit beside them keeps its size, and the controls go under it (a closed cover's
    // 0 % as large as an open one's 100 %); a word (Cleaning) is drawn smaller anyway and keeps
    // them beside it
    const besideMin = big.classList.contains("word") ? min : Math.round(base * 0.8);
    const shrink = (from: number, least = min) => {
      let px = from;
      apply(px);
      while (misses() && px > least) {
        px = Math.max(least, px - 2);
        apply(px);
      }
      return px;
    };
    let px = shrink(fit.px ?? base, fit.place === "beside" ? besideMin : min);
    // too wide beside the controls at that size: the controls go under it (for this width); a
    // value that fits beside them but lacks height still shrinks there, down to its least
    if (overflows(b) && fit.place === "beside") {
      fit.place = "under";
      this._placeControls(row);
      px = shrink(base);
    } else if (fit.place === "beside") px = shrink(px);
    if (short() > 0.5 && !fit.drop && sliders.length) {
      fit.drop = true;
      drop(true);
      px = shrink(base);
    }
    fit.px = px;
  }
  _hideHover() {
    super._hideHover();
    if (this._root) hideHover(this._root);
  }

  getGridOptions(): GridOptions {
    // half a section and three rows, and that at least in a sections grid (a smaller entity is a
    // tile's); a card around it (a swipe card, a stack) may still give it less, and the poster
    // fits its content into that (_fitValue). Its content anchored to the bottom
    return { columns: 6, rows: 3, min_columns: 6, min_rows: 3 };
  }
  getCardSize() {
    return 3;
  }
}

registerCard(PosterCard, {
  name: "Poster Card Pro",
  description:
    "One entity as a poster drawn the way its poster type says: weather, wind, rain, sun, media, covers, locks, lights and more",
});
