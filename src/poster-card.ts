/*
 * poster-card-pro – one entity (or none) as a poster, drawn the way its poster type says.
 *
 *   type: custom:poster-card-pro
 *   entity: sensor.living_room_co2         # optional; its domain and device class pick the type
 *   poster: carbon_dioxide                 # the poster type; detected when left out
 *   variant / direction / gust / today / …  # the type's own keys, flat on the card
 *   name / icon / value / secondary / color   # the slots, plain text or templates
 *   status: "{{ … }}"                      # the status badge's text, an object of badge keys, or false
 *   badges: [sensor.x, { attribute: humidity }, status]   # the corner; `status` places the status
 *   image: camera.garden                   # the backdrop: a URL, a template or an entity's picture
 *   image_blur: true                       # the backdrop blurred (px; a person's and a player's are)
 *   rules: [...]                           # replace the type's own rules as a whole
 *   visual: glow                           # sparkline … gauge, glow (lit by its level), none
 *   icon_image: person.malte                # a picture in the icon: a URL, a template or an entity's
 *   icon_ring / icon_tap_action / icon_hold_action / icon_double_tap_action   # the icon's own
 *   control / tap_action / hold_action / double_tap_action / hover / hours_to_show
 */
import { registerCard } from "./shared/card.ts";
import { cssColor } from "./shared/color.ts";
import { CARD_BG } from "./shared/constants.ts";
import { EntityCardBase, overflows } from "./shared/entity/base.ts";
import type { EntityCardConfig, EntityItem } from "./shared/entity/config.ts";
import { tileMinColumns } from "./shared/entity/control.ts";
import type { EntityModel, RenderCtx } from "./shared/entity/model.ts";
import { fillPosterSlots, type PosterSlots } from "./shared/entity/render/fill.ts";
import { posterParts, secondaryEl } from "./shared/entity/render/lead.ts";
import type { GridOptions, HomeAssistant, WeatherForecastType } from "./shared/ha.ts";
import { hideHover } from "./shared/hover.ts";
import { detectKind, parsePoster, unusedKeys } from "./shared/kinds/detect.ts";
import type { KindCtx, KindHost } from "./shared/kinds/types.ts";
import type { SunCurveHost } from "./shared/sun/curve.ts";
import type { Visibility } from "./shared/visibility.ts";
import { ForecastFeed } from "./shared/weather/feed.ts";
import { dailyTypeOf, supportsForecast } from "./shared/weather/forecast.ts";
import {
  hasIconActions,
  IMAGE_BLUR,
  IMAGE_OPACITY,
  normalizePosterConfig,
  type PosterConfig,
  type RuleLook,
} from "./poster/config.ts";
import { CARD_TYPE } from "./poster/constants.ts";
import {
  fillStatus,
  glowLevel,
  glowOpacity,
  imageUrl,
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
  // the config as written: normalised again once hass tells the device class and the registry
  _raw: unknown;
  // what the last normalisation read of hass (the kind it resolved and the registry it saw)
  _resolvedFrom: unknown[] = [];
  // the hass a normalisation reads (the one arriving, before the base takes it)
  _nextHass?: HomeAssistant;
  // the config whose keys of other poster types have been warned about
  _warnedFor: unknown;
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
    this._warnUnused();
  }
  // the keys of other poster types the card sets, said once per config, once the type is known
  // (written, no entity, or its state is in: the device class decides)
  _warnUnused() {
    const cfg = this._config as PosterConfig | undefined;
    const raw = this._raw as { entity?: string; poster?: unknown } | undefined;
    if (!cfg || !raw || this._warnedFor === raw) return;
    if (raw.poster == null && raw.entity && !this._hass?.states[raw.entity]) return;
    this._warnedFor = raw;
    const unused = unusedKeys(cfg.kind, raw as Record<string, unknown>);
    if (unused.length)
      console.warn(
        `${CARD_TYPE}: the ${cfg.kind.name} poster reads no ${unused.join(", ")}; left out`,
      );
  }
  // what the kind is resolved from: the detected kind (the device class arrives with the first
  // state) and the entity registry's identity (the inputs found on the entity's device)
  _resolveInputs(hass: HomeAssistant | undefined): unknown[] {
    const raw = (this._raw ?? {}) as { entity?: string; poster?: unknown };
    let kind: string | null = null;
    try {
      kind =
        parsePoster(raw.poster, CARD_TYPE) ??
        detectKind(raw.entity || null, hass?.states[raw.entity ?? ""]).name;
    } catch {
      // setConfig reports it
    }
    return [kind, hass?.entities];
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
    else {
      this._syncForecast();
      this._warnUnused();
    }
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
    for (const src of this._pictures(c)) if (src && src.kind === "template") out.push(src.template);
    if (c.statusText?.kind === "template") out.push(c.statusText.template);
    return out;
  }
  _extraWatchIds(cfg: EntityCardConfig): string[] {
    const c = cfg as PosterConfig;
    return [
      ...(c.kind.watch ?? []),
      ...(c.kind.history?.(c.kindOpts, c.entities[0].entity) ?? []),
      ...this._pictures(c).flatMap((src) => (src && src.kind === "entity" ? [src.entity] : [])),
    ];
  }
  // the pictures the card and its rules name (the backdrop's and the icon's)
  _pictures(c: PosterConfig) {
    const rules = [...c.ruleLooks.values()];
    return [c.image, c.iconImage, ...rules.flatMap((r) => [r.image, r.iconImage])];
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
  // the places the kind fills, less those the card sets itself; the icon's own actions take the
  // lead (the plain icon, or the hold button in its place)
  _slots(c: KindCtx): PosterSlots {
    const cfg = this._config as PosterConfig;
    const raw = (this._raw ?? {}) as Record<string, unknown>;
    const o: PosterSlots = { ...(cfg.kind.slots?.(c) ?? {}), iconActions: cfg.iconActions };
    if (this._userIcon(c)) delete o.lead;
    if (raw.name !== undefined) delete o.name;
    if (raw.value !== undefined || raw.attribute !== undefined) {
      delete o.value;
      delete o.word;
    }
    if (raw.secondary !== undefined) delete o.secondary;
    if (raw.visual !== undefined) delete o.picture;
    return o;
  }
  // the card draws its own lead: its `icon` or `icon_image` (the card's or the matching rule's), or
  // an icon with actions of its own (an animated lead gives way to them)
  _userIcon(kc?: KindCtx) {
    const cfg = this._config as PosterConfig | undefined;
    const image = kc ? this._look(kc).iconImage : cfg?.iconImage;
    return (
      ((this._raw ?? {}) as Record<string, unknown>).icon !== undefined ||
      !!image ||
      (!!cfg && hasIconActions(cfg.iconActions))
    );
  }
  // the icon and the backdrop as the card writes them, with what the matching rule changes (a
  // rule's key wins: the card's is the default)
  _look(kc: KindCtx) {
    const cfg = this._config as PosterConfig;
    const rule = kc.m.look.rule;
    const r: RuleLook = (rule && cfg.ruleLooks.get(rule)) || {};
    return {
      iconStyle: r.iconStyle ?? kc.ent.iconStyle,
      iconRing: r.iconRing ?? !!kc.ent.iconRing,
      iconImage: "iconImage" in r ? (r.iconImage ?? null) : cfg.iconImage,
      image: "image" in r ? (r.image ?? null) : cfg.image,
      imageBlur: r.imageBlur ?? cfg.imageBlur ?? (cfg.kind.imageBlur ? IMAGE_BLUR : 0),
      imageOpacity: r.imageOpacity ?? cfg.imageOpacity ?? IMAGE_OPACITY,
      imageTint: r.imageTint ?? cfg.imageTint,
    };
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
      if (lead && plead && !this._userIcon(kc)) {
        const key = lead.key(kc);
        if (plead.dataset.key !== key) {
          plead.replaceChildren(lead.build(kc));
          plead.dataset.key = key;
        }
        slots.lead = "keep";
      } else if (plead) delete plead.dataset.key;
      // icon_image: its picture in the icon while it has one, else the icon; the icon's style and
      // ring as the matching rule says
      const look = this._look(kc);
      const pic = imageUrl(ctx, look.iconImage);
      const icon =
        look.iconStyle === ent.iconStyle && look.iconRing === !!ent.iconRing
          ? ent
          : { ...ent, iconStyle: look.iconStyle, iconRing: look.iconRing };
      fillPosterSlots(
        ctx,
        row,
        icon,
        idx,
        pic ? { ...m, look: { ...m.look, picture: pic } } : m,
        slots,
      );
      this._fadePicture(row);
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
    return [...inputs, ...own, ...extra, imageUrl(ctx, this._look(kc).iconImage)];
  }
  // the icon's picture fades in when it is a new one (the next song's cover); a fill with the same
  // picture keeps the element it has, so a fade under way runs on
  _leadImg: HTMLImageElement | null = null;
  _fadePicture(row: HTMLElement) {
    const img = row.querySelector<HTMLImageElement>(":scope > .ptop > .plead img.picture");
    const last = this._leadImg;
    const src = img?.getAttribute("src") ?? null;
    if (!img || !src) {
      this._leadImg = null;
      return;
    }
    if (last && last.getAttribute("src") === src) {
      if (last !== img) img.replaceWith(last);
      return;
    }
    if (last) {
      const show = () => img.classList.replace("pwait", "pfade");
      img.classList.add("pwait");
      if (img.complete) show();
      else {
        img.addEventListener("load", show, { once: true });
        img.addEventListener("error", show, { once: true });
      }
    }
    this._leadImg = img;
  }
  // the kind's colour where neither the card nor a rule names one. The poster's own colour is the
  // body's --pc-tint, a registered colour, so a new one fades (the next song's cover); the status
  // badge reads it too while it has the same colour
  _tint: string | null = null;
  _rowColor(row: HTMLElement, ent: EntityItem, m: EntityModel) {
    const cfg = this._config as PosterConfig;
    const idx = Number(row.dataset.idx);
    let color = super._rowColor(row, ent, m);
    if ((idx === 0 || idx === cfg.statusIdx) && cfg.kind.color && this._hass) {
      const main = cfg.entities[0];
      const kc = this._kindCtx(this._ctx());
      if (!main.color && !kc.m.look.rule?.color) {
        const c = cfg.kind.color(kc);
        if (c) color = cssColor(c, "var(--primary-color)");
      }
    }
    const body = row.closest<HTMLElement>(".body");
    if (idx === 0 && body) {
      body.style.setProperty("--pc-tint", color);
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
    const lead = cfg.kind.lead,
      leadEl = row.querySelector<HTMLElement>(":scope > .ptop > .plead[data-key] > *");
    if (lead?.update && leadEl) lead.update(leadEl, kc, row);
    const look = this._look(kc);
    const url =
      imageUrl(ctx, look.image) ?? (look.image === false ? null : (cfg.kind.image?.(kc) ?? null));
    const back = look.image === false ? null : cfg.kind.backdrop;
    const key = !url && back ? back.key(kc) : "";
    const { part, glow } = updateBackdrop(
      body,
      ctx,
      url,
      key && back ? { key, build: () => back.build(kc) } : null,
      cfg.glow,
      look.imageBlur,
    );
    const pback = body.querySelector<HTMLElement>(":scope > .pback"),
      color = row.style.getPropertyValue("--fe-color");
    pback?.style.setProperty("--fe-color", color);
    // the picture's shade: as much as the picture does not show, the card's surface with its tint
    // mixed in half and half (so the theme's text keeps reading); both fade to a new value
    const tint = look.imageTint ? cssColor(look.imageTint, "") : "";
    pback?.style.setProperty("--pc-shade", String(1 - look.imageOpacity));
    pback?.style.setProperty(
      "--pc-shade-color",
      tint ? `color-mix(in srgb, ${tint} 50%, ${CARD_BG})` : CARD_BG,
    );
    // the glow in the poster's colour, as strong as its level (its opacity: a new level fades)
    if (glow) {
      glow.style.setProperty("--glow", color);
      glow.style.opacity = glowOpacity(glowLevel(cfg.kind, kc));
    }
    card.classList.toggle("pflow", !!part || !!glow);
    if (part && back?.update) back.update(part, kc, row);
    // what follows the clock or the size (a curve) checks itself whether it changed
    cfg.kind.live?.(kc, row);
    this._fitValue(card, row);
  }

  // the value's size for the room the card has, one size for every value (a word as a number, so
  // the gaps between the name, the value and its line never change): a value wider than its line
  // or content taller than the card draws it smaller, down to 45 % of its styled size. Controls
  // stay beside the value while it fits there at that size, else they go under it; where even that
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
    const shrink = (from: number) => {
      let px = from;
      apply(px);
      while (misses() && px > min) {
        px = Math.max(min, px - 2);
        apply(px);
      }
      return px;
    };
    let px = shrink(fit.px ?? base);
    // too wide beside the controls even at its least: the controls go under it (for this width)
    if (overflows(b) && fit.place === "beside") {
      fit.place = "under";
      this._placeControls(row);
      px = shrink(base);
    }
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

// the poster's colour and its backdrop's shade as typed values, so they can fade (once per page;
// another copy of the bundle has done it)
for (const [name, syntax, initialValue] of [
  ["--pc-tint", "<color>", "transparent"],
  ["--pc-shade", "<number>", "0.7"],
  ["--pc-shade-color", "<color>", "transparent"],
]) {
  try {
    CSS.registerProperty({ name, syntax, inherits: true, initialValue });
  } catch {
    // registered already, or no CSS Properties API: the value changes at once
  }
}

registerCard(PosterCard, {
  name: "Poster Card Pro",
  description:
    "One entity as a poster drawn the way its poster type says: weather, wind, rain, sun, media, covers, locks, lights and more",
});
