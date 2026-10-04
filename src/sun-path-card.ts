/*
 * sun-path-card-pro
 * Sun elevation over the current day with sunrise/sunset, dawn/noon/dusk and the
 * current sun position. Dependency-free (plain web component, inline SVG).
 * Times are computed locally (NOAA solar position) from hass.config latitude/longitude,
 * because sun.sun only exposes the *next* events.
 *
 * Config:
 *   type: custom:sun-path-card-pro
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
import { defineElement, registerCard } from "./shared/card.ts";
import { langOf } from "./shared/format.ts";
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
import { hideHover } from "./shared/hover.ts";
import { t } from "./shared/i18n.ts";
import { drawCurve, drawEvents, fmtEvent, showHover, timeAt } from "./sun-path/plot.ts";
import { solarDay } from "./sun-path/solar.ts";
import { STYLE } from "./sun-path/styles.ts";

const CARD_TYPE = "sun-path-card-pro";

defineElement(`${CARD_TYPE}-editor`, SunPathCardEditor);

export class SunPathCard extends HTMLElement implements SunPathHost {
  static cardType = CARD_TYPE;

  _config!: SunPathConfig;
  _hass?: HomeAssistant;
  _root?: HTMLElement;
  _uid?: string;
  _day: PositionedDay | null = null;
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
  _onLeave = (ev: PointerEvent) => {
    if (ev.pointerType === "touch") return; // keep the tooltip after a tap
    this._hideHover();
  };
  _onDocPointer = (ev: PointerEvent) => {
    if (!ev.composedPath().includes(this)) this._hideHover();
  };

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
    this._config = { ...DEFAULTS, ...(config || {}) };
    this._day = null;
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
  }

  connectedCallback() {
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

  getCardSize() {
    return this._config.show_dawn_dusk ? 6 : 5;
  }
  // rows "auto": the sections grid sizes the card to its content instead of a fixed row count
  getGridOptions(): GridOptions {
    return { columns: 12, rows: "auto", min_columns: 6 };
  }

  _buildDom() {
    const root = this.shadowRoot as ShadowRoot;
    root.innerHTML = "";
    const style = document.createElement("style");
    style.textContent = STYLE;
    root.appendChild(style);
    const card = document.createElement("ha-card");
    // the header is drawn like the entity cards' (icon and title), not HA's card header
    const { title, icon } = this._config;
    card.innerHTML = `
      <div class="header"${title || icon ? "" : ' style="display: none"'}>
        <ha-icon${icon ? ` icon="${icon}"` : ' style="display: none"'}></ha-icon>
        <div class="title"></div>
      </div>
      <div class="body">
        <div class="row">
          <div class="ev"><div class="lbl"></div><div class="val"></div></div>
          <div class="ev right"><div class="lbl"></div><div class="val"></div></div>
        </div>
        <div class="plot"><svg preserveAspectRatio="none"></svg><div class="tip"></div></div>
        <div class="events"></div>
      </div>`;
    qs(card, ".title").textContent = title || "";
    root.appendChild(card);
    this._root = card;
    this._hoverT = null;
    if (this._config.show_tooltip) {
      const plot = qs(card, ".plot");
      plot.addEventListener("pointermove", this._onPointer);
      plot.addEventListener("pointerdown", this._onPointer);
      plot.addEventListener("pointerleave", this._onLeave);
    }
    if (!this._config.show_dawn_dusk) qs(card, ".events").style.display = "none";
    this._ro?.observe(qs(card, ".plot"));
    this._render();
  }

  // the solar day (noon-centred window) that contains now, recomputed when now leaves it or the
  // position changes; around midnight that can be the previous or the next calendar day's
  _dayOf(now: Date, lat: number, lon: number): PositionedDay {
    const t = now.getTime();
    const d = this._day;
    if (d && d.lat === lat && d.lon === lon && t >= d.start && t < d.end) return d;
    const dayOf = (offset: number) => {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
      return { ...solarDay(start, lat, lon), lat, lon };
    };
    let day = dayOf(0);
    if (t < day.start) day = dayOf(-1);
    else if (t >= day.end) day = dayOf(1);
    this._day = day;
    return day;
  }

  _label(key: SunEvent) {
    return this._config.labels?.[key] || defaultLabel(this._hass, key);
  }

  _render() {
    if (!this._root || !this._hass) return;
    // Top row labels (here, not in _buildDom: they follow the user's language)
    const [rise, set] = this._root.querySelectorAll(".row .ev");
    qs(rise, ".lbl").textContent = this._label("sunrise");
    qs(set, ".lbl").textContent = this._label("sunset");
    const lat = this._hass.config?.latitude,
      lon = this._hass.config?.longitude;
    if (typeof lat !== "number" || typeof lon !== "number") return;
    const now = new Date();
    const day = this._dayOf(now, lat, lon);

    qs(rise, ".val").textContent = fmtEvent(this._hass, day.sunrise);
    qs(set, ".val").textContent = fmtEvent(this._hass, day.sunset);

    const { xOf, W } = drawCurve(this, day, now);
    drawEvents(this, day, xOf, W);
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
