/*
 * sun-path-card-pro
 * Sun elevation over the current day with sunrise/sunset, dawn/noon/dusk and the
 * current sun position. Dependency-free (plain web component, inline SVG).
 * Times are computed locally (NOAA solar position) from hass.config latitude/longitude,
 * because sun.sun only exposes the *next* events.
 *
 * Config:
 *   type: custom:sun-path-card-pro
 *   layout: card                  # card | poster (the next sunrise or sunset large, the curve below)
 *   title: Sun path               # optional; omit → no header
 *   show_dawn_dusk: true          # bottom row with dawn / solar noon / dusk
 *   (the plot is a 24 h window centred on solar noon; ticks mark sunrise, noon and sunset)
 *   show_tooltip: true            # time + elevation tooltip when hovering / tapping the curve
 *   day_color: light-blue         # HA color token or hex
 *   night_color: indigo
 *   sun_color: amber
 *   labels:                       # optional overrides
 *     sunrise: Rise
 *     sunset: Set
 *     dawn: Civil dawn
 *     noon: Noon
 *     dusk: Civil dusk
 */
import { defineElement, syncKeepHeight, registerCard, freshShadow } from "./shared/card.ts";
import { cssColor } from "./shared/color.ts";
import { fmtRelative, langOf } from "./shared/format.ts";
import type { GridOptions, HomeAssistant } from "./shared/ha.ts";
import { qs } from "./shared/util.ts";
import type {
  PositionedDay,
  SunPathCardConfig,
  SunPathConfig,
  SunPathHost,
} from "./sun-path/config.ts";
import { DEFAULTS, defaultLabel, type SunEvent } from "./sun-path/constants.ts";
import { SunPathCardEditor } from "./sun-path/editor.ts";
import { hideHover, leaveHides, outsideHides } from "./shared/hover.ts";
import { t } from "./shared/i18n.ts";
import { drawCurve, drawEvents, fmtEvent, showHover, timeAt } from "./sun-path/plot.ts";
import { nextEvent } from "./sun-path/poster.ts";
import {
  SUNRISE_ELEV,
  solarDay,
  solarDayAround,
  solarElevation,
  type SolarDay,
} from "./shared/solar.ts";
import { STYLE } from "./sun-path/styles.ts";
import { TextCache, themeChanged } from "./shared/typography.ts";

const CARD_TYPE = "sun-path-card-pro";

defineElement(`${CARD_TYPE}-editor`, SunPathCardEditor);

export class SunPathCard extends HTMLElement implements SunPathHost {
  // the card's text styles, measured once per theme (typography.ts)
  _textCache = new TextCache();
  static cardType = CARD_TYPE;

  _config!: SunPathConfig;
  _hass?: HomeAssistant;
  _root?: HTMLElement;
  _uid?: string;
  _day: PositionedDay | null = null;
  // the poster's next day (its sunrise after today's sunset), for the day it follows
  _next: { after: PositionedDay; day: SolarDay } | null = null;
  _xOf?: (t: number) => number;
  _yOf?: (e: number) => number;
  _plotW?: number;
  _hoverT: number | null = null;
  _lastMinute?: number;
  _timer?: ReturnType<typeof setInterval>;
  _ro?: ResizeObserver;
  _onPointer = (ev: PointerEvent) => {
    if (!this._day || !this._root) return;
    const plot = qs(this._root, ".plot");
    const rect = plot.getBoundingClientRect();
    this._hoverT = timeAt(this._day, ev.clientX - rect.left, this._plotW || rect.width);
    if (!showHover(this, this._hoverT)) this._hideHover();
  };
  _onLeave = leaveHides(() => this._hideHover());
  _onDocPointer = outsideHides(this, () => this._hideHover());

  static getConfigElement() {
    return document.createElement(`${CARD_TYPE}-editor`);
  }
  static getStubConfig(hass?: HomeAssistant) {
    return { title: t(hass, "sun.stub_title") };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config: SunPathCardConfig | null | undefined) {
    const layout = config?.layout ?? "card";
    if (layout !== "card" && layout !== "poster")
      throw new Error(`${CARD_TYPE}: layout must be one of card | poster`);
    this._config = { ...DEFAULTS, ...(config || {}) };
    this._day = null;
    syncKeepHeight(this, config);
    if (this._root) this._buildDom();
  }

  set hass(hass: HomeAssistant) {
    const prev = this._hass;
    this._hass = hass;
    if (!this._root) this._buildDom();
    const minute = Math.floor(Date.now() / 60000);
    // once a minute, and at once when the language changed (labels, times)
    if (minute !== this._lastMinute || langOf(prev) !== langOf(hass)) {
      this._lastMinute = minute;
      this._render();
    }
    if (themeChanged(prev, hass)) {
      this._textCache.clear();
      requestAnimationFrame(() => this._render());
    }
  }

  connectedCallback() {
    // another place may have another theme (a view's own)
    this._textCache.clear();
    this._timer = setInterval(() => this._render(), 60000);
    this._ro = new ResizeObserver(() => this._render());
    if (this._root) this._ro.observe(qs(this._root, ".plot"));
    document.addEventListener("pointerdown", this._onDocPointer);
  }

  disconnectedCallback() {
    clearInterval(this._timer);
    this._ro?.disconnect();
    document.removeEventListener("pointerdown", this._onDocPointer);
  }

  _poster() {
    return this._config.layout === "poster";
  }
  getCardSize() {
    if (this._poster()) return 3;
    return this._config.show_dawn_dusk ? 6 : 5;
  }
  // rows "auto": the sections grid sizes the card to its content instead of a fixed row count; a
  // poster has a fixed height, its content anchored to the bottom, as the entity card's
  getGridOptions(): GridOptions {
    if (this._poster()) return { columns: 6, rows: 3, min_columns: 3, min_rows: 2 };
    return { columns: 12, rows: "auto", min_columns: 6 };
  }

  _buildDom() {
    const card = freshShadow(this.shadowRoot as ShadowRoot, STYLE);
    // the header is drawn like the entity cards' (icon and title), not HA's card header
    const { title, icon } = this._config;
    const poster = this._poster();
    card.classList.toggle("layout-poster", poster);
    // a poster: the sun's icon and how soon the next event comes on top, the event and its time
    // at the bottom, the curve along the bottom edge
    const body = poster
      ? `
      <div class="body">
        <div class="poster">
          <div class="ptop">
            <div class="lead"><div class="shape"><ha-icon></ha-icon></div></div>
            <span class="pill plabel"></span>
          </div>
          <div class="pbody">
            <div class="pname"></div>
            <div class="big"><b></b></div>
            <div class="plot"><svg preserveAspectRatio="none"></svg><div class="tip"></div></div>
          </div>
        </div>
      </div>`
      : `
      <div class="body">
        <div class="row">
          <div class="ev"><div class="lbl"></div><div class="val"></div></div>
          <div class="ev right"><div class="lbl"></div><div class="val"></div></div>
        </div>
        <div class="plot"><svg preserveAspectRatio="none"></svg><div class="tip"></div></div>
        <div class="events"></div>
      </div>`;
    card.innerHTML = `
      <div class="header"${title || icon ? "" : ' style="display: none"'}>
        <ha-icon${icon ? "" : ' style="display: none"'}></ha-icon>
        <div class="title"></div>
      </div>${body}`;
    qs(card, ".title").textContent = title || "";
    // the icon is the user's string: an attribute, never markup
    if (icon) qs(card, ".header > ha-icon").setAttribute("icon", icon);
    this._root = card;
    this._hoverT = null;
    if (this._config.show_tooltip) {
      const plot = qs(card, ".plot");
      plot.addEventListener("pointermove", this._onPointer);
      plot.addEventListener("pointerdown", this._onPointer);
      plot.addEventListener("pointerleave", this._onLeave);
    }
    if (!poster && !this._config.show_dawn_dusk) qs(card, ".events").style.display = "none";
    this._ro?.observe(qs(card, ".plot"));
    this._render();
  }

  // the solar day (noon-centred window) that contains now, recomputed when now leaves it or the
  // position changes; around midnight that can be the previous or the next calendar day's
  _dayOf(now: Date, lat: number, lon: number): PositionedDay {
    const t = now.getTime();
    const d = this._day;
    if (d && d.lat === lat && d.lon === lon && t >= d.start && t < d.end) return d;
    return (this._day = solarDayAround(now, (start) => ({
      ...solarDay(start, lat, lon),
      lat,
      lon,
    })));
  }

  _label(key: SunEvent) {
    return this._config.labels?.[key] || defaultLabel(this._hass, key);
  }

  // the poster's next day, worked out once per day it follows
  _nextDay(day: PositionedDay): SolarDay {
    if (this._next?.after !== day) {
      const noon = new Date(day.noon);
      const start = new Date(noon.getFullYear(), noon.getMonth(), noon.getDate() + 1);
      this._next = { after: day, day: solarDay(start, day.lat, day.lon) };
    }
    return this._next.day;
  }

  // the poster's texts: the sun's icon, how soon the next event comes, the event and its time
  _fillPoster(day: PositionedDay, now: Date) {
    const root = this._root as HTMLElement,
      hass = this._hass,
      cfg = this._config;
    const ms = now.getTime();
    const ev = nextEvent(day, () => this._nextDay(day), ms);
    const elev = solarElevation(now, day.lat, day.lon);
    const up = elev > SUNRISE_ELEV;
    const poster = qs(root, ".poster");
    poster.style.setProperty(
      "--fe-color",
      up
        ? cssColor(cfg.sun_color, "var(--amber-color)")
        : cssColor(cfg.night_color, "var(--indigo-color)"),
    );
    qs(poster, ".lead ha-icon").setAttribute(
      "icon",
      up ? "mdi:white-balance-sunny" : "mdi:weather-night",
    );
    qs(poster, ".plabel").textContent = fmtRelative(hass, ev.t, ms);
    qs(poster, ".pname").textContent = this._label(ev.key);
    qs(poster, ".big b").textContent = fmtEvent(hass, ev.t);
  }

  _render() {
    if (!this._root || !this._hass) return;
    const poster = this._poster();
    // Top row labels (here, not in _buildDom: they follow the user's language)
    const [rise, set] = this._root.querySelectorAll(".row .ev");
    if (!poster) {
      qs(rise, ".lbl").textContent = this._label("sunrise");
      qs(set, ".lbl").textContent = this._label("sunset");
    }
    const lat = this._hass.config?.latitude,
      lon = this._hass.config?.longitude;
    if (typeof lat !== "number" || typeof lon !== "number") return;
    const now = new Date();
    const day = this._dayOf(now, lat, lon);

    if (poster) this._fillPoster(day, now);
    else {
      qs(rise, ".val").textContent = fmtEvent(this._hass, day.sunrise);
      qs(set, ".val").textContent = fmtEvent(this._hass, day.sunset);
    }

    const { xOf, W } = drawCurve(this, day, now);
    if (!poster) drawEvents(this, day, xOf, W);
    // the tooltip survives the per-minute re-render
    if (this._hoverT !== null && !showHover(this, this._hoverT)) this._hideHover();
  }

  _hideHover() {
    this._hoverT = null;
    hideHover(this._root);
  }
}

registerCard(SunPathCard, {
  name: "Sun Path Card Pro",
  description: "Today's sun path: sunrise, sunset, dawn, dusk and the current position of the sun",
});
