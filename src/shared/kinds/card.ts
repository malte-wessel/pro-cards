// The element base of the cards that draw a poster type (the poster and the tile card): the kind
// resolved again once hass tells the device class and the registry the inputs, the forecasts, the
// minute timer, what the kind reads beyond the card's items, the places it fills, its icon (an
// animated lead kept through fills) and its colour. The card supplies `_normalize` (a KindConfig)
// and draws its places.
import { cssColor } from "../color.ts";
import { EntityCardBase } from "../entity/base.ts";
import type { EntityCardConfig, EntityItem } from "../entity/config.ts";
import type { EntityModel, RenderCtx } from "../entity/model.ts";
import type { KindSlots } from "../entity/render/fill.ts";
import type { HomeAssistant, WeatherForecastType } from "../ha.ts";
import type { SunCurveHost } from "../sun/curve.ts";
import type { Visibility } from "../visibility.ts";
import { ForecastFeed } from "../weather/feed.ts";
import { dailyTypeOf, supportsForecast } from "../weather/forecast.ts";
import {
  foundInputs,
  hasIconActions,
  type IconLook,
  type ImageSrc,
  type KindConfig,
} from "./config.ts";
import { detectKind, parsePoster, unusedKeys } from "./detect.ts";
import { KINDS } from "./registry.ts";
import type { KindCtx, KindHost } from "./types.ts";

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
    const raw = this._raw as { entity?: string; poster?: unknown } | undefined;
    if (!cfg || !raw || this._warnedFor === raw) return;
    if (raw.poster == null && raw.entity && !this._hass?.states[raw.entity]) return;
    this._warnedFor = raw;
    const unused = unusedKeys(cfg.kind, raw as Record<string, unknown>);
    const thing = (this.constructor as typeof KindCardBase).thing;
    if (unused.length)
      console.warn(
        `${this._cardType()}: the ${cfg.kind.name} ${thing} reads no ${unused.join(", ")}; left out`,
      );
  }
  // what the kind is resolved from: the detected kind (the device class arrives with the first
  // state) and the inputs found on the entity's device (Home Assistant replaces its registry on
  // any change anywhere: only a change of what was found counts)
  _resolveInputs(hass: HomeAssistant | undefined): unknown[] {
    const raw = (this._raw ?? {}) as { entity?: string; poster?: unknown };
    let kind: string | null = null;
    try {
      kind =
        parsePoster(raw.poster, this._cardType()) ??
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
  // the pictures the card and its rules name (the icon's)
  _pictures(c: KindConfig): (ImageSrc | false | null | undefined)[] {
    const rules = [...c.ruleLooks.values()];
    return [c.iconImage, ...rules.map((r) => r.iconImage)];
  }
  _extraHistoryIds(cfg: EntityCardConfig): string[] {
    const c = cfg as KindConfig;
    return c.kind.history?.(c.kindOpts, c.entities[0].entity) ?? [];
  }
  _visibilityTrees(): Visibility[] {
    const cfg = this._config as KindConfig;
    return [...super._visibilityTrees(), ...(cfg.kind.visibility?.(cfg.kindOpts) ?? [])];
  }

  // what the kind reads now
  _kindCtx(ctx: RenderCtx): KindCtx {
    const cfg = this._config as KindConfig;
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
    if (raw.visual !== undefined) delete o.picture;
    return o;
  }
  // the card draws its own lead: its `icon` or `icon_image` (the card's or the matching rule's), or
  // an icon with actions of its own (an animated lead gives way to them)
  _userIcon(kc?: KindCtx) {
    const cfg = this._config;
    const image = kc ? this._iconLook(kc).iconImage : cfg?.iconImage;
    return (
      ((this._raw ?? {}) as Record<string, unknown>).icon !== undefined ||
      !!image ||
      (!!cfg && this._actionsTakeLead(cfg))
    );
  }
  // whether the icon's own actions take the place of the kind's lead (the hold button, a button)
  _actionsTakeLead(cfg: KindConfig) {
    return hasIconActions(cfg.iconActions);
  }
  // the matching rule's look of the icon, if any (a rule's key wins: the card's is the default)
  _ruleLook(kc: KindCtx): IconLook {
    const rule = kc.m.look.rule;
    return (rule && (this._config as KindConfig).ruleLooks.get(rule)) || {};
  }
  // the icon as the card writes it, with what the matching rule changes
  _iconLook(kc: KindCtx) {
    const cfg = this._config as KindConfig;
    const r = this._ruleLook(kc);
    return {
      iconStyle: r.iconStyle ?? kc.ent.iconStyle,
      iconRing: r.iconRing ?? !!kc.ent.iconRing,
      iconImage: "iconImage" in r ? (r.iconImage ?? null) : cfg.iconImage,
    };
  }
  // the item as its icon is drawn: the matching rule's style and ring
  _iconItem(kc: KindCtx, ent: EntityItem) {
    const look = this._iconLook(kc);
    return look.iconStyle === ent.iconStyle && look.iconRing === !!ent.iconRing
      ? ent
      : { ...ent, iconStyle: look.iconStyle, iconRing: look.iconRing };
  }
  // an animated lead is built once (per key, the icon and its style) and kept through fills: its
  // animation runs on. A ring around the icon takes its place, as the card's own icon does. True:
  // the lead is the kind's, kept in `slot` (the fill leaves it as it is)
  _keepLead(kc: KindCtx, slot: HTMLElement | null, icon: EntityItem): boolean {
    const lead = (this._config as KindConfig).kind.lead;
    const look = this._iconLook(kc);
    if (!lead || !slot || !kc.ent.item.showIcon || this._userIcon(kc) || look.iconRing) {
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
    return [...own, ...(cfg.kind.extra?.(kc) ?? [])];
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
