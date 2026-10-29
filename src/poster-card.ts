/*
 * poster-card-pro – one entity (or none) as a poster, drawn the way its kind says.
 *
 *   type: custom:poster-card-pro
 *   entity: sensor.living_room_co2         # optional; its domain and device class pick the kind
 *   kind: carbon_dioxide                   # or { type, …the kind's keys }; detected when left out
 *   name / icon / value / secondary / color   # the slots, plain text or templates
 *   status: "{{ … }}"                      # the status badge's text, an object of badge keys, or false
 *   badges: [sensor.x, { attribute: humidity }, status]   # the corner; `status` places the status
 *   image: camera.front_door               # the backdrop: a URL, a template or an entity's picture
 *   rules: [...]                           # replace the kind's own rules as a whole
 *   visual / control / tap_action / hold_action / double_tap_action / hover / hours_to_show
 */
import { registerCard } from "./shared/card.ts";
import { cssColor } from "./shared/color.ts";
import { EntityCardBase } from "./shared/entity/base.ts";
import type { EntityCardConfig, EntityItem } from "./shared/entity/config.ts";
import { tileMinColumns } from "./shared/entity/control.ts";
import type { EntityModel, RenderCtx } from "./shared/entity/model.ts";
import { fillPosterSlots, type PosterSlots } from "./shared/entity/render/fill.ts";
import { secondaryEl } from "./shared/entity/render/lead.ts";
import type { GridOptions, HomeAssistant, WeatherForecastType } from "./shared/ha.ts";
import { hideHover } from "./shared/hover.ts";
import { detectKind, parseKind } from "./shared/kinds/detect.ts";
import type { KindCtx, KindHost } from "./shared/kinds/types.ts";
import type { SunCurveHost } from "./shared/sun/curve.ts";
import type { Visibility } from "./shared/visibility.ts";
import { ForecastFeed } from "./shared/weather/feed.ts";
import { dailyTypeOf, supportsForecast } from "./shared/weather/forecast.ts";
import { normalizePosterConfig, type PosterConfig } from "./poster/config.ts";
import { CARD_TYPE } from "./poster/constants.ts";
import {
  fillStatus,
  imageUrl,
  posterCardParts,
  statusText,
  updateBackdrop,
} from "./poster/render.ts";
import { STYLE_POSTER_CARD_ALL } from "./poster/styles.ts";

export class PosterCard extends EntityCardBase {
  static cardType = CARD_TYPE;
  static getStubConfig(hass: HomeAssistant | undefined, entities?: string[]) {
    return { entity: (entities || [])[0] || Object.keys(hass?.states || {})[0] || "" };
  }

  declare _config?: PosterConfig;
  // the config as written: normalised again once hass tells the device class and the registries
  _raw: unknown;
  // what the last normalisation read of hass (the kind it resolved and the registries it saw)
  _resolvedFrom: unknown[] = [];
  // the hass a normalisation reads (the one arriving, before the base takes it)
  _nextHass?: HomeAssistant;
  // a weather entity's forecasts (the weather kind)
  _feed = new ForecastFeed(() => this._render(), CARD_TYPE);
  // the sun curve's state for its tooltip; the time a kind's tooltip is at
  _sunHost: SunCurveHost = { _day: null };
  _kindHoverT: number | null = null;
  _host: KindHost;

  constructor() {
    super();
    const hoverT = () => this._kindHoverT;
    this._host = {
      forecast: (type: WeatherForecastType) => this._feed.forecast[type],
      sun: this._sunHost,
      hover: (plot, timeAt, show) => {
        const at = (ev: PointerEvent) => {
          const t = timeAt(ev);
          if (t === null) return;
          this._kindHoverT = t;
          if (!show(t)) this._hideHover();
        };
        plot.addEventListener("pointermove", at);
        plot.addEventListener("pointerdown", at);
        plot.addEventListener("pointerleave", () => this._hideHover());
        // a tap on the curve is the tooltip's, not the poster's action
        plot.addEventListener("click", (ev) => ev.stopPropagation());
      },
      get hoverT() {
        return hoverT();
      },
      shown: (v: Visibility) => this._shown(v),
      redraw: () => {
        this._fillEpoch++;
        this._render();
      },
    };
  }

  _normalize(raw: unknown) {
    return normalizePosterConfig(raw, this._nextHass ?? this._hass);
  }
  _styles() {
    return STYLE_POSTER_CARD_ALL;
  }
  setConfig(config: unknown) {
    this._raw = config;
    this._feed.reset();
    super.setConfig(config);
    this._resolvedFrom = this._resolveInputs(this._hass);
    this._afterConfig();
  }
  // what the kind adds once its config is in: the minute timer, the forecasts
  _afterConfig() {
    const cfg = this._config as PosterConfig;
    if (cfg.kind.timed && !this._timed) {
      this._timed = true;
      this._armMinute();
    }
    this._syncForecast();
  }
  // what the kind is resolved from: the detected kind (the device class arrives with the first
  // state) and the registries' identities
  _resolveInputs(hass: HomeAssistant | undefined): unknown[] {
    const raw = (this._raw ?? {}) as { entity?: string; kind?: unknown };
    let kind: string | null = null;
    try {
      const spec = parseKind(raw.kind, CARD_TYPE);
      kind = spec.type ?? detectKind(raw.entity || null, hass?.states[raw.entity ?? ""]).name;
    } catch {
      // setConfig reports it
    }
    return [kind, hass?.entities, hass?.devices, hass?.areas];
  }
  _setHass(hass: HomeAssistant) {
    const now = this._resolveInputs(hass);
    const changed = now.some((v, i) => v !== this._resolvedFrom[i]);
    if (changed && this._raw !== undefined) {
      this._resolvedFrom = now;
      this._nextHass = hass;
      try {
        super.setConfig(this._raw);
      } catch (e) {
        console.warn(`${CARD_TYPE}:`, e);
      } finally {
        this._nextHass = undefined;
      }
    }
    const prev = this._hass;
    super._setHass(hass);
    if (prev && prev.connection !== hass.connection) this._feed.reset();
    if (changed) this._afterConfig();
    else this._syncForecast();
  }
  connectedCallback() {
    super.connectedCallback();
    this._syncForecast();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._feed.unsubscribe();
  }
  // the forecast types the kind reads and the entity offers
  _syncForecast() {
    const cfg = this._config,
      conn = this._hass?.connection;
    const entity = cfg?.entities[0].entity;
    if (!cfg?.kind.forecast || !conn || !entity || !this.isConnected) return;
    const st = this._hass?.states[entity];
    const daily = dailyTypeOf(st);
    const wanted = cfg.kind.forecast.filter((t) =>
      t === "hourly" ? supportsForecast(st, "hourly") : t === daily,
    );
    this._feed.sync(conn, entity, wanted);
  }

  // ----- what the card reads beyond its items -----
  _extraTemplates(cfg: EntityCardConfig): string[] {
    const c = cfg as PosterConfig;
    const out = c.kind.templates?.(c.kindOpts) ?? [];
    if (c.image && c.image.kind === "template") out.push(c.image.template);
    if (c.statusText?.kind === "template") out.push(c.statusText.template);
    return out;
  }
  _extraWatchIds(cfg: EntityCardConfig): string[] {
    const c = cfg as PosterConfig;
    return [
      ...(c.kind.watch ?? []),
      ...(c.kind.history?.(c.kindOpts, c.entities[0].entity) ?? []),
      ...(c.image && c.image.kind === "entity" ? [c.image.entity] : []),
    ];
  }
  _extraHistoryIds(cfg: EntityCardConfig): string[] {
    const c = cfg as PosterConfig;
    return c.kind.history?.(c.kindOpts, c.entities[0].entity) ?? [];
  }
  _visibilityTrees(): Visibility[] {
    const cfg = this._config as PosterConfig;
    return [...super._visibilityTrees(), ...(cfg.kind.visibility?.(cfg.kindOpts) ?? [])];
  }

  // what the kind reads now
  _kindCtx(ctx: RenderCtx): KindCtx {
    const cfg = this._config as PosterConfig;
    this._sunHost._hass = ctx.hass;
    return {
      ctx,
      ent: cfg.entities[0],
      m: this._modelAt(ctx, 0),
      opts: cfg.kindOpts,
      input: (key) => {
        const i = cfg.inputs[key];
        return i === undefined ? null : { ent: cfg.entities[i], m: this._modelAt(ctx, i) };
      },
      hours: cfg.hoursSet,
      host: this._host,
    };
  }
  // the places the kind fills, less those the card sets itself
  _slots(c: KindCtx): PosterSlots {
    const cfg = this._config as PosterConfig;
    const raw = (this._raw ?? {}) as Record<string, unknown>;
    const o: PosterSlots = { ...(cfg.kind.slots?.(c) ?? {}) };
    if (raw.icon !== undefined) delete o.lead;
    if (raw.name !== undefined) delete o.name;
    if (raw.value !== undefined || raw.attribute !== undefined) {
      delete o.value;
      delete o.word;
    }
    if (raw.secondary !== undefined) delete o.secondary;
    if (raw.visual !== undefined) delete o.picture;
    return o;
  }
  _userIcon() {
    return ((this._raw ?? {}) as Record<string, unknown>).icon !== undefined;
  }

  // ----- DOM -----
  _buildBody(body: HTMLElement) {
    const cfg = this._config as PosterConfig;
    const row = this._row(0, "poster");
    const { corner } = posterCardParts(row);
    for (const i of cfg.groups[0].badgeIdxs ?? [])
      corner.appendChild(this._row(i, i === cfg.statusIdx ? "hval pstatus" : "hval"));
    body.appendChild(row);
  }
  _fill(ctx: RenderCtx, row: HTMLElement, ent: EntityItem, idx: number, m: EntityModel) {
    const cfg = this._config as PosterConfig;
    if (idx === cfg.statusIdx && row.classList.contains("hval")) {
      const kc = this._kindCtx(ctx);
      fillStatus(ctx, row, ent, idx, m, statusText(ctx, cfg, kc.m, cfg.kind.status?.(kc) ?? null));
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
      // an animated lead is built once (per key) and kept through fills: its animation runs on
      const lead = cfg.kind.lead,
        plead = row.querySelector<HTMLElement>(":scope > .ptop > .plead");
      if (lead && plead && !this._userIcon()) {
        const key = lead.key(kc);
        if (plead.dataset.key !== key) {
          plead.replaceChildren(lead.build(kc));
          plead.dataset.key = key;
        }
        slots.lead = "keep";
      } else if (plead) delete plead.dataset.key;
      fillPosterSlots(ctx, row, ent, idx, m, slots);
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
    const own = Object.values(cfg.inputs).map((i) => this._modelAt(ctx, i));
    const extra = cfg.kind.extra?.(kc) ?? [];
    if (idx === cfg.statusIdx)
      return [
        ...inputs,
        kc.m,
        ...own,
        ...extra,
        statusText(ctx, cfg, kc.m, cfg.kind.status?.(kc) ?? null),
      ];
    return [...inputs, ...own, ...extra];
  }
  // the kind's colour where neither the card nor a rule names one
  _rowColor(row: HTMLElement, ent: EntityItem, m: EntityModel) {
    const cfg = this._config as PosterConfig;
    const idx = Number(row.dataset.idx);
    if ((idx === 0 || idx === cfg.statusIdx) && cfg.kind.color && this._hass) {
      const main = cfg.entities[0];
      const kc = this._kindCtx(this._ctx());
      if (!main.color && !kc.m.look.rule?.color) {
        const c = cfg.kind.color(kc);
        if (c) return cssColor(c, "var(--primary-color)");
      }
    }
    return super._rowColor(row, ent, m);
  }
  _render() {
    super._render();
    const cfg = this._config,
      card = this._root,
      body = card?.querySelector<HTMLElement>(":scope > .body"),
      row = body?.querySelector<HTMLElement>(":scope > .row.poster");
    if (!cfg || !card || !body || !row || !this._hass) return;
    const ctx = this._ctx(),
      kc = this._kindCtx(ctx);
    // the lead's and the backdrop's motion follow every render (a new speed, a new direction)
    const lead = cfg.kind.lead,
      leadEl = row.querySelector<HTMLElement>(":scope > .ptop > .plead[data-key] > *");
    if (lead?.update && leadEl) lead.update(leadEl, kc, row);
    const url =
      imageUrl(ctx, cfg.image) ?? (cfg.image === false ? null : (cfg.kind.image?.(kc) ?? null));
    const back = cfg.image === false ? null : cfg.kind.backdrop;
    const key = !url && back ? back.key(kc) : "";
    const part = updateBackdrop(
      body,
      ctx,
      url,
      key && back ? { key, build: () => back.build(kc) } : null,
    );
    const pback = body.querySelector<HTMLElement>(":scope > .pback");
    pback?.style.setProperty("--fe-color", row.style.getPropertyValue("--fe-color"));
    card.classList.toggle("pflow", !!part);
    if (part && back?.update) back.update(part, kc, row);
    // a part over the action layer (a drag handle), built once per key in the body
    const handle = cfg.kind.handle;
    let hEl = body.querySelector<HTMLElement>(":scope > .phandle");
    const hKey = handle && !url ? handle.key(kc) : "";
    if (!hKey) hEl?.remove();
    else {
      if (!hEl || hEl.dataset.key !== hKey) {
        hEl?.remove();
        hEl = handle!.build(kc);
        hEl.classList.add("phandle");
        hEl.dataset.key = hKey;
        body.appendChild(hEl);
      }
      handle!.update?.(hEl, kc, row);
    }
    // what follows the clock or the size (a curve) checks itself whether it changed
    cfg.kind.live?.(kc, row);
    this._fitHeight(card, row);
  }

  // the value's size for the room the card has: a poster whose content is taller than the card
  // (controls on a line of their own beside a narrow value) draws its value smaller, down to 60 % of
  // its styled size, so the top keeps its room; where even that is not enough, its slider below the
  // value goes (a media player's volume: more-info has it) and the value is fitted again. What was
  // found holds until the card's own size changes: a new value may make it smaller, never larger,
  // so nothing jumps back and forth
  _valueFit: { size: string; px: number | null; base: number | null; drop: boolean } | null = null;
  _fitHeight(card: HTMLElement, row: HTMLElement) {
    const big = row.querySelector<HTMLElement>(":scope > .pbody > .pvalue > .big");
    const top = row.querySelector<HTMLElement>(":scope > .ptop"),
      body = row.querySelector<HTMLElement>(":scope > .pbody");
    const b = big?.querySelector("b");
    if (!big || !b || !top || !body) return;
    const sliders = body.querySelectorAll<HTMLElement>(":scope > .ctl-slider");
    const drop = (on: boolean) => sliders.forEach((el) => el.classList.toggle("pfit-out", on));
    const size = `${card.clientWidth}x${card.clientHeight}`;
    if (this._valueFit?.size !== size) {
      big.classList.remove("hfit");
      drop(false);
      this._valueFit = { size, px: null, base: null, drop: false };
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
    if (short() <= 0.5) return;
    // the styled size, in a number's size (a word is drawn at 0.7 of it), found once per card size
    if (fit.base === null) {
      big.classList.remove("hfit");
      const drawn = parseFloat(getComputedStyle(b).fontSize);
      fit.base = big.classList.contains("word") ? drawn / 0.7 : drawn;
    }
    const base = fit.base;
    const min = Math.round(base * 0.6);
    const shrink = (from: number) => {
      let px = from;
      apply(px);
      while (short() > 0.5 && px > min) {
        px = Math.max(min, px - 2);
        apply(px);
      }
      return px;
    };
    let px = shrink(fit.px ?? base);
    if (short() > 0.5 && !fit.drop && sliders.length) {
      fit.drop = true;
      drop(true);
      px = shrink(base);
    }
    fit.px = px;
  }
  _hideHover() {
    super._hideHover();
    this._kindHoverT = null;
    if (this._root) hideHover(this._root);
  }

  getGridOptions(): GridOptions {
    const main = this._config?.entities[0];
    // three rows, two at least; its content anchored to the bottom
    return {
      columns: 6,
      rows: 3,
      min_columns: main ? tileMinColumns(main, "poster") : 3,
      min_rows: 2,
    };
  }
  getCardSize() {
    return 3;
  }
}

registerCard(PosterCard, {
  name: "Poster Card Pro",
  description:
    "One entity as a poster drawn the way its kind says: weather, wind, rain, sun, media, covers, locks, lights, rooms and more",
});
