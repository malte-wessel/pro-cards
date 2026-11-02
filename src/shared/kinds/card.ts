// The element base of the cards that draw a kind (the poster and the tile card): the kind resolved
// again once hass tells the device class and the registry the inputs, the forecasts, the minute
// timer, what the kind reads beyond the card's items, the places it fills, its two places resolved
// on every render (the kind's default, the card's, the matching rule's: places.ts), its icon (an
// animated lead kept through fills), what it draws behind the texts and its colour. The card
// supplies `_normalize` (a KindConfig) and draws its places.
import { cssColor } from "../color.ts";
import { CARD_BG } from "../constants.ts";
import { EntityCardBase } from "../entity/base.ts";
import type { EntityCardConfig, EntityItem, PlotOptions } from "../entity/config.ts";
import type { Visual } from "../entity/constants.ts";
import type { EntityModel, RenderCtx } from "../entity/model.ts";
import type { KindSlots } from "../entity/render/fill.ts";
import type { HomeAssistant, WeatherForecastType } from "../ha.ts";
import type { SunCurveHost } from "../sun/curve.ts";
import type { Visibility } from "../visibility.ts";
import { ForecastFeed } from "../weather/feed.ts";
import { dailyTypeOf, supportsForecast } from "../weather/forecast.ts";
import { IMAGE_OPACITY, updateBackdrop } from "./backdrop.ts";
import {
  foundInputs,
  hasIconActions,
  parseImage,
  placeDefaults,
  type ImageSrc,
  type KindConfig,
  type Places,
} from "./config.ts";
import { detectKind, kindKeysOf, parseKind, unusedKeys, unusedText } from "./detect.ts";
import { stripEl } from "./energy.ts";
import {
  BEHIND,
  BELOW,
  HISTORY_THINGS,
  idleOptions,
  KIND_THINGS,
  resolvePlaces,
  type IconPlace,
  type VisualPlace,
} from "./places.ts";
import { KINDS } from "./registry.ts";
import { glowLevel, glowOpacity, imageUrl } from "./render.ts";
import type { Kind, KindCtx, KindHost } from "./types.ts";

// the visuals the item draws itself below the texts (its block: a plot, a bar, a gauge)
const ITEM_VISUALS: readonly string[] = ["sparkline", "columns", "strip", "bar", "gauge"];
// whether the kind draws the visual itself: a thing only it has (the sun's day), or one it draws its
// own way (a trend's and a weather's sparkline: its series, the hours ahead), unless the visual
// plots another entity's history (`src`): that is a plot of its own
const kindDraws = (kind: Kind, v: VisualPlace) =>
  !!v.type &&
  !!kind.draws?.includes(v.type) &&
  !(v.src !== undefined && HISTORY_THINGS.includes(v.type));
// the things behind the texts a kind draws (its backdrop)
const KIND_BEHIND: readonly string[] = ["flow", "cover", "path", "line"];

export abstract class KindCardBase extends EntityCardBase {
  // what the card is called in messages ("the rain poster reads no gust") and in KindCtx; the
  // size of its lead
  static thing: "poster" | "tile";
  static leadSize: number;

  declare _config?: KindConfig;
  // the config as written: normalised again once hass tells the device class and the registry
  _raw: unknown;
  // what the last normalisation read of hass (the kind it resolved and the inputs it found)
  _resolvedFrom: unknown[] = [];
  // the inputs found for a kind in a registry, for a config (looked for again when one is new)
  _found: { kind: string; entities: unknown; raw: unknown; ids: (string | null)[] } | null = null;
  // the hass a normalisation reads (the one arriving, before the base takes it)
  _nextHass?: HomeAssistant;
  // the config whose keys of other poster types have been warned about
  _warnedFor: unknown;
  // a weather entity's forecasts (the weather kind)
  _feed = new ForecastFeed(() => this._render(), this._cardType());
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
        // a tap on the curve is the tooltip's, not the card's action
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

  setConfig(config: unknown) {
    this._raw = config;
    this._feed.reset();
    super.setConfig(config);
    this._resolvedFrom = this._resolveInputs(this._hass);
    this._afterConfig();
  }
  // what the kind adds once its config is in: the minute timer, the forecasts
  _afterConfig() {
    const cfg = this._config;
    // hass before any config: setConfig does it
    if (!cfg) return;
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
    const cfg = this._config;
    const raw = this._raw as { entity?: string; kind?: unknown } | undefined;
    if (!cfg || !raw || this._warnedFor === raw) return;
    if (raw.kind == null && raw.entity && !this._hass?.states[raw.entity]) return;
    this._warnedFor = raw;
    const unused = unusedKeys(cfg.kind, kindKeysOf(raw as Record<string, unknown>));
    const thing = (this.constructor as typeof KindCardBase).thing;
    const who =
      cfg.kind.name === "none" ? `a ${thing} without a kind` : `the ${cfg.kind.name} ${thing}`;
    if (unused.length)
      console.warn(`${this._cardType()}: ${unusedText(cfg.kind, unused, who)}; left out`);
    // options that do nothing on what the detected kind draws (a written kind's are config errors)
    if (raw.kind == null) {
      const c = cfg as KindConfig;
      const idle = idleOptions(
        placeDefaults(c.kind, thing),
        c.places,
        [...c.rulePlaces.values()],
        this._cardType(),
      );
      for (const msg of idle) console.warn(`${msg}; left out`);
    }
  }
  // what the kind is resolved from: the detected kind (the device class arrives with the first
  // state) and the inputs found on the entity's device (Home Assistant replaces its registry on
  // any change anywhere: only a change of what was found counts)
  _resolveInputs(hass: HomeAssistant | undefined): unknown[] {
    const raw = (this._raw ?? {}) as { entity?: string; kind?: unknown };
    let kind: string | null = null;
    try {
      kind =
        parseKind(raw.kind, this._cardType()) ??
        detectKind(raw.entity || null, hass?.states[raw.entity ?? ""]).name;
    } catch {
      // setConfig reports it
    }
    if (kind === null) return [kind];
    const entities = hass?.entities;
    let found = this._found;
    if (!found || found.kind !== kind || found.entities !== entities || this._raw !== found.raw)
      found = this._found = {
        kind,
        entities,
        raw: this._raw,
        ids: foundInputs(KINDS[kind], raw as Record<string, unknown>, hass),
      };
    return [kind, ...found.ids];
  }
  _setHass(hass: HomeAssistant) {
    const now = this._resolveInputs(hass);
    const was = this._resolvedFrom;
    const changed = now.length !== was.length || now.some((v, i) => v !== was[i]);
    if (changed && this._raw !== undefined) {
      this._resolvedFrom = now;
      this._nextHass = hass;
      try {
        super.setConfig(this._raw);
      } catch (e) {
        console.warn(`${this._cardType()}:`, e);
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
    const c = cfg as KindConfig;
    const out = c.kind.templates?.(c.kindOpts) ?? [];
    for (const src of this._pictures(c)) if (src && src.kind === "template") out.push(src.template);
    return out;
  }
  _extraWatchIds(cfg: EntityCardConfig): string[] {
    const c = cfg as KindConfig;
    return [
      ...(c.kind.watch ?? []),
      ...(c.kind.history?.(c.kindOpts, c.entities[0].entity) ?? []),
      ...this._pictures(c).flatMap((src) => (src && src.kind === "entity" ? [src.entity] : [])),
    ];
  }
  // the places the card and its rules write
  _written(c: KindConfig): Places[] {
    return [c.places, ...c.rulePlaces.values()];
  }
  // the pictures the card and its rules name (an icon's, a visual's)
  // the visual the card draws without a rule: the kind's, with the card's merged or in its place
  _baseVisual(c: KindConfig): VisualPlace | false {
    return resolvePlaces([{ icon: undefined, visual: this._kindVisual() }, c.places]).visual;
  }
  // whether a rule's visual merges onto a plot (a type of its own replaces it)
  _ontoPlot(c: KindConfig, v: VisualPlace | false | undefined) {
    const base = this._baseVisual(c);
    return !!v && !v.type && !!base && HISTORY_THINGS.includes(base.type as never);
  }
  _pictures(c: KindConfig): (ImageSrc | false | null | undefined)[] {
    const base = this._baseVisual(c);
    return this._written(c).flatMap((p) => [
      p.icon && p.icon.src ? parseImage(p.icon.src) : null,
      // a picture's: of an image, or merged onto one (another entity's history is a plot's)
      p.visual &&
      p.visual.src &&
      (p.visual.type ? p.visual.type === "image" : !!base && base.type === "image")
        ? parseImage(p.visual.src)
        : null,
    ]);
  }
  // the kind's history, and the plots' entities the card and its rules can draw: the card's own,
  // or another's (`src`); a plot the card replaces or leaves out fetches nothing
  _extraHistoryIds(cfg: EntityCardConfig): string[] {
    const c = cfg as KindConfig;
    const entity = c.entities[0].entity;
    const rules = [...c.rulePlaces.values()].map((p) =>
      p.visual && p.visual.type ? p.visual : null,
    );
    const plots = [this._baseVisual(c), ...rules].flatMap((v) =>
      v && v.type && HISTORY_THINGS.includes(v.type) && !kindDraws(c.kind, v)
        ? [v.src ?? entity]
        : [],
    );
    return [
      ...(c.kind.history?.(c.kindOpts, entity) ?? []),
      ...plots.filter((x): x is string => !!x),
    ];
  }
  _visibilityTrees(): Visibility[] {
    const cfg = this._config as KindConfig;
    return [...super._visibilityTrees(), ...(cfg.kind.visibility?.(cfg.kindOpts) ?? [])];
  }

  // the places now: the kind's default, the card's, the matching rule's. A thing only some kinds
  // draw (a flow, the sun's day) falls back to the kind's own on another, said once
  _warnedPlaces = new Set<string>();
  _placesFor(m: EntityModel): { icon: IconPlace; visual: VisualPlace | false } {
    const cfg = this._config as KindConfig;
    const kind = cfg.kind;
    let rule = m.look.rule ? cfg.rulePlaces.get(m.look.rule) : undefined;
    // a rule sets no plot's data: its src merged onto the card's plot is left out (said once)
    if (rule && rule.visual && rule.visual.src !== undefined && this._ontoPlot(cfg, rule.visual)) {
      const { src: _src, ...rest } = rule.visual;
      void _src;
      rule = { ...rule, visual: rest };
      if (!this._warnedPlaces.has("rule src")) {
        this._warnedPlaces.add("rule src");
        console.warn(
          `${this._cardType()}: a rule sets no src of a plot (it is the card's history); left out`,
        );
      }
    }
    const r = resolvePlaces([
      { icon: kind.icon, visual: this._kindVisual() },
      cfg.places,
      ...(rule ? [rule] : []),
    ]);
    const fits = (t: string) => !KIND_THINGS.includes(t) || !!kind.draws?.includes(t);
    const warn = (what: string) => {
      if (this._warnedPlaces.has(what)) return;
      this._warnedPlaces.add(what);
      const which = kind.name === "none" ? "a card without a kind" : `the ${kind.name} kind`;
      console.warn(`${this._cardType()}: ${which} draws no ${what}; left out`);
    };
    if (r.visual && !fits(r.visual.type as string)) {
      warn(`visual: ${r.visual.type}`);
      r.visual = this._kindVisual() || false;
    }
    if (r.icon.type === "flow" && !fits("flow")) {
      warn("icon: flow");
      r.icon = { ...r.icon, type: "icon", style: undefined };
    }
    return r;
  }

  // the kind's default visual on this card (a tile's may differ: none for a cover)
  _kindVisual(): VisualPlace | false | undefined {
    const kind = (this._config as KindConfig).kind;
    const tile = (this.constructor as typeof KindCardBase).thing === "tile";
    return tile && kind.tileVisual !== undefined ? kind.tileVisual : kind.visual;
  }

  // the visual's window for the kind's own drawing, in hours (null: the kind's own): today is the
  // hours since midnight; a weather's line looks ahead, where today means nothing (said once)
  _hoursOf(v: VisualPlace | false, now: number): number | null {
    if (!v || v.hours === undefined) return null;
    if (typeof v.hours === "number") return v.hours;
    const kind = (this._config as KindConfig).kind;
    if (kind.name === "weather") {
      if (!this._warnedPlaces.has("today")) {
        this._warnedPlaces.add("today");
        console.warn(
          `${this._cardType()}: the weather's line looks ahead: hours: today means nothing there; its own hours are drawn`,
        );
      }
      return null;
    }
    const d = new Date(now);
    const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    return Math.max(1 / 60, (now - midnight) / 3600e3);
  }

  // what the kind reads now
  _kindCtx(ctx: RenderCtx): KindCtx {
    const cfg = this._config as KindConfig;
    this._sunHost._hass = ctx.hass;
    const m = this._modelAt(ctx, 0);
    const place = this._placesFor(m);
    const hours = this._hoursOf(place.visual, ctx.now);
    return {
      ctx,
      ent: cfg.entities[0],
      m,
      opts: cfg.kindOpts,
      input: (key) => {
        const i = cfg.inputs[key];
        return i === undefined ? null : { ent: cfg.entities[i], m: this._modelAt(ctx, i) };
      },
      hours,
      place,
      host: this._host,
      card: (this.constructor as typeof KindCardBase).thing,
      leadSize: (this.constructor as typeof KindCardBase).leadSize,
    };
  }
  // the places the kind fills, less those the card sets itself; the icon's own actions take the
  // lead (the plain icon, or the hold button in its place)
  _slots(c: KindCtx): KindSlots {
    const cfg = this._config as KindConfig;
    const raw = (this._raw ?? {}) as Record<string, unknown>;
    const o: KindSlots = { ...(cfg.kind.slots?.(c) ?? {}), iconActions: cfg.iconActions };
    if (this._userIcon(c)) delete o.lead;
    if (raw.name !== undefined) delete o.name;
    if (raw.value !== undefined || raw.attribute !== undefined) {
      delete o.value;
      delete o.word;
    }
    if (raw.secondary !== undefined) delete o.secondary;
    // the kind's picture below the texts while the visual is one it draws (the sun's day, a
    // trend's lines); a player's progress along the edge is no visual and always stays
    const v = c.place.visual;
    const own = !!v && BELOW.includes(v.type as never) && kindDraws(cfg.kind, v);
    if (!own && !o.picture?.classList.contains("pprog")) delete o.picture;
    // a battery's segments for any value between min and max
    if (v && v.type === "segments" && !own)
      o.picture = stripEl(c.m.progress === null ? null : c.m.progress * 100, false);
    return o;
  }
  // the card draws its own lead: an icon it names (the card's), a picture it names, or an icon
  // with actions of its own (an animated lead gives way to them)
  _userIcon(kc?: KindCtx) {
    const cfg = this._config;
    const named = !!cfg?.places.icon && cfg.places.icon.name !== undefined;
    const icon = kc ? kc.place.icon : cfg?.places.icon || undefined;
    return (
      named ||
      (!!icon && icon.type === "image" && !!icon.src) ||
      (!!cfg && this._actionsTakeLead(cfg))
    );
  }
  // whether the icon's own actions take the place of the kind's lead (the hold button, a button)
  _actionsTakeLead(cfg: KindConfig) {
    return hasIconActions(cfg.iconActions);
  }
  // the icon as its place draws it now: its style, its ring, its picture (an image of its own, or
  // the entity's)
  _iconLook(kc: KindCtx) {
    const i = kc.place.icon;
    const entity = kc.ent.entity;
    const image: ImageSrc | null =
      i.type !== "image"
        ? null
        : i.src
          ? parseImage(i.src) || null
          : entity
            ? { kind: "entity", entity }
            : null;
    return {
      iconStyle: i.style === "plain" || i.style === "circle" ? i.style : kc.ent.iconStyle,
      iconRing: !!i.ring,
      iconImage: image,
    };
  }
  // the item as the card draws it now: its icon's style and ring, and the visual it draws itself
  // below the texts (a plot with its own window, a bar, a gauge; none where the kind draws it)
  _drawItem(kc: KindCtx, ent: EntityItem): EntityItem {
    const look = this._iconLook(kc);
    const v = kc.place.visual;
    const cfg = this._config as KindConfig;
    const block =
      v && ITEM_VISUALS.includes(v.type as string) && !kindDraws(cfg.kind, v)
        ? (v.type as Visual)
        : "icon";
    const plot: PlotOptions | undefined =
      v && block !== "icon"
        ? { hours: v.hours, bucket: v.bucket, smoothing: v.smoothing, axis: v.axis, src: v.src }
        : undefined;
    return {
      ...ent,
      iconStyle: look.iconStyle,
      iconRing: look.iconRing,
      visual: block,
      plot,
      // icon: false (the card's or a matching rule's): no icon
      ...(kc.place.icon.hidden ? { item: { ...ent.item, showIcon: false } } : {}),
    };
  }
  // an animated lead is built once (per key, the icon and its style) and kept through fills: its
  // animation runs on. A ring around the icon takes its place, as the card's own icon does. True:
  // the lead is the kind's, kept in `slot` (the fill leaves it as it is)
  _keepLead(kc: KindCtx, slot: HTMLElement | null, icon: EntityItem): boolean {
    const lead = (this._config as KindConfig).kind.lead;
    const look = this._iconLook(kc);
    if (
      !lead ||
      !slot ||
      !kc.ent.item.showIcon ||
      kc.place.icon.hidden ||
      this._userIcon(kc) ||
      look.iconRing ||
      kc.place.icon.type === "image"
    ) {
      if (slot) delete slot.dataset.key;
      return false;
    }
    const key = `${lead.key(kc)} ${look.iconStyle} ${kc.m.look.icon ?? ""}`;
    if (slot.dataset.key !== key) {
      slot.replaceChildren(lead.build({ ...kc, ent: icon }));
      slot.dataset.key = key;
    } else
      // the state's own icon follows the state in place
      for (const el of slot.querySelectorAll("ha-state-icon")) {
        el.hass = kc.ctx.hass;
        el.stateObj = kc.m.st;
      }
    return true;
  }
  // the kept lead's motion follows every render (a new speed, a new direction)
  _updateLead(kc: KindCtx, row: HTMLElement, slot: HTMLElement | null) {
    const lead = (this._config as KindConfig).kind.lead,
      el = slot?.dataset.key !== undefined ? (slot.firstElementChild as HTMLElement | null) : null;
    if (lead?.update && el) lead.update(el, kc, row);
  }

  // the icon's picture fades in when it is a new one (the next song's cover); a fill with the same
  // picture keeps the element it has, so a fade under way runs on
  _leadImg: HTMLImageElement | null = null;
  _fadePicture(slot: HTMLElement | null) {
    const img = slot?.querySelector<HTMLImageElement>("img.picture") ?? null;
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

  // what the kind's row is filled from beyond its model: its inputs' models and what the kind says
  _kindInputs(kc: KindCtx): unknown[] {
    const cfg = this._config as KindConfig;
    const own = Object.values(cfg.inputs).map((i) => this._modelAt(kc.ctx, i));
    // the places as drawn now (a rule that matches changes them)
    return [...own, JSON.stringify(kc.place), ...(cfg.kind.extra?.(kc) ?? [])];
  }

  // what the card draws behind its texts now: the visual's picture, the kind's drawing (its flow,
  // cover, path or line) or a glow (the kind's own, else the card's colour from its bottom edge, as
  // strong as its level). The icon keeps a solid circle over a drawing or a glow (pflow)
  _drawBehind(body: HTMLElement, row: HTMLElement, kc: KindCtx) {
    const cfg = this._config as KindConfig,
      card = this._root;
    const v = kc.place.visual;
    const behind = v && BEHIND.includes(v.type as never) ? v : null;
    const ctx = kc.ctx;
    let url: string | null = null;
    if (behind?.type === "image") {
      const entity = kc.ent.entity;
      const src: ImageSrc | null = behind.src
        ? parseImage(behind.src) || null
        : entity
          ? { kind: "entity", entity }
          : null;
      url = imageUrl(ctx, src);
    }
    const back = cfg.kind.backdrop,
      glowOwn = cfg.kind.glow;
    const key = behind && back && KIND_BEHIND.includes(behind.type!) ? back.key(kc) : "";
    const ownGlow = behind?.type === "glow" && glowOwn ? glowOwn : null;
    const part = key
      ? { key, build: () => (back as NonNullable<typeof back>).build(kc) }
      : ownGlow
        ? { key: `glow ${ownGlow.key(kc)}`, build: () => ownGlow.build(kc) }
        : null;
    const { part: el, glow } = updateBackdrop(
      body,
      ctx,
      url,
      part,
      behind?.type === "glow" && !ownGlow,
      url && behind ? (behind.blur ?? 0) : 0,
    );
    const pback = body.querySelector<HTMLElement>(":scope > .pback"),
      color = row.style.getPropertyValue("--fe-color");
    pback?.style.setProperty("--fe-color", color);
    // the picture's shade: as much as the picture does not show, the card's surface with its tint
    // mixed in half and half (so the theme's text keeps reading); both fade to a new value
    const tint = behind?.tint ? cssColor(behind.tint, "") : "";
    pback?.style.setProperty("--pc-shade", String(1 - (behind?.opacity ?? IMAGE_OPACITY)));
    pback?.style.setProperty(
      "--pc-shade-color",
      tint ? `color-mix(in srgb, ${tint} 50%, ${CARD_BG})` : CARD_BG,
    );
    if (glow) {
      glow.style.setProperty("--glow", color);
      glow.style.opacity = glowOpacity(glowLevel(cfg.kind, kc));
    }
    card?.classList.toggle("pflow", !!el || !!glow);
    card?.classList.toggle("pdraw", !!el);
    if (el) (key ? back?.update : ownGlow?.update)?.(el, kc, row);
  }
  // the kind's colour where neither the item nor its rule names one (null: none of its own)
  _kindColor(ent: EntityItem, m: EntityModel): string | null {
    const cfg = this._config as KindConfig;
    if (!cfg.kind.color || !this._hass || ent.color || m.look.rule?.color) return null;
    const c = cfg.kind.color(this._kindCtx(this._ctx()));
    return c ? cssColor(c, "var(--primary-color)") : null;
  }
  _hideHover() {
    super._hideHover();
    this._kindHoverT = null;
  }
}
