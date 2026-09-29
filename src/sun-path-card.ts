/*
 * sun-path-card
 * Sun elevation over the current day with sunrise/sunset, dawn/noon/dusk and the
 * current sun position. Dependency-free (plain web component, inline SVG).
 * Times are computed locally (NOAA solar position) from hass.config latitude/longitude,
 * because sun.sun only exposes the *next* events.
 *
 * Config:
 *   type: custom:sun-path-card
 *   title: Sun path               # optional; omit → no header
 *   show_dawn_dusk: true          # bottom row with dawn / solar noon / dusk
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
import { registerCard } from "./shared/card.ts";
import type { GridOptions, HomeAssistant } from "./shared/ha.ts";
import { qs } from "./shared/util.ts";
import type {
  PositionedDay,
  SunPathCardConfig,
  SunPathConfig,
  SunPathHost,
} from "./sun-path/config.ts";
import { DEFAULTS, DEFAULT_LABELS, type SunLabels } from "./sun-path/constants.ts";
import { SunPathCardEditor } from "./sun-path/editor.ts";
import { drawCurve, drawEvents, fmtEvent } from "./sun-path/plot.ts";
import { solarDay } from "./sun-path/solar.ts";
import { STYLE } from "./sun-path/styles.ts";

const CARD_TYPE = "sun-path-card";

customElements.define(`${CARD_TYPE}-editor`, SunPathCardEditor);

export class SunPathCard extends HTMLElement implements SunPathHost {
  static cardType = CARD_TYPE;

  _config!: SunPathConfig;
  _labels!: SunLabels;
  _hass?: HomeAssistant;
  _root?: HTMLElement;
  _uid?: string;
  _day: PositionedDay | null = null;
  _lastMinute?: number;
  _timer?: ReturnType<typeof setInterval>;
  _ro?: ResizeObserver;

  static getConfigElement() {
    return document.createElement(`${CARD_TYPE}-editor`);
  }
  static getStubConfig() {
    return { title: "Sun path" };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config: SunPathCardConfig | null | undefined) {
    this._config = { ...DEFAULTS, ...(config || {}) };
    this._labels = { ...DEFAULT_LABELS, ...(config?.labels || {}) };
    this._day = null;
    if (this._root) this._buildDom();
  }

  set hass(hass: HomeAssistant) {
    this._hass = hass;
    if (!this._root) this._buildDom();
    const minute = Math.floor(Date.now() / 60000);
    if (minute !== this._lastMinute) {
      this._lastMinute = minute;
      this._render();
    }
  }

  connectedCallback() {
    this._timer = setInterval(() => this._render(), 60000);
    this._ro = new ResizeObserver(() => this._render());
    if (this._root) this._ro.observe(qs(this._root, ".plot"));
  }

  disconnectedCallback() {
    clearInterval(this._timer);
    this._ro?.disconnect();
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
    if (this._config.title) card.setAttribute("header", this._config.title);
    card.innerHTML = `
      <div class="body">
        <div class="row">
          <div class="ev"><div class="lbl"></div><div class="val"></div></div>
          <div class="ev right"><div class="lbl"></div><div class="val"></div></div>
        </div>
        <div class="plot"><svg preserveAspectRatio="none"></svg></div>
        <div class="events"></div>
      </div>`;
    root.appendChild(card);
    this._root = card;
    const [rise, set] = card.querySelectorAll(".row .ev");
    qs(rise, ".lbl").textContent = this._labels.sunrise;
    qs(set, ".lbl").textContent = this._labels.sunset;
    if (!this._config.show_dawn_dusk) qs(card, ".events").style.display = "none";
    this._ro?.observe(qs(card, ".plot"));
    this._render();
  }

  // today's solar day for the home's position, recomputed at midnight or when the position changes
  _dayOf(now: Date, lat: number, lon: number): PositionedDay {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const d = this._day;
    if (!d || d.start !== dayStart.getTime() || d.lat !== lat || d.lon !== lon)
      this._day = { ...solarDay(dayStart, lat, lon), lat, lon };
    return this._day as PositionedDay;
  }

  _render() {
    if (!this._root || !this._hass) return;
    const lat = this._hass.config?.latitude,
      lon = this._hass.config?.longitude;
    if (typeof lat !== "number" || typeof lon !== "number") return;
    const now = new Date();
    const day = this._dayOf(now, lat, lon);

    // Top row
    const [rise, set] = this._root.querySelectorAll(".row .ev");
    qs(rise, ".val").textContent = fmtEvent(this._hass, day.sunrise);
    qs(set, ".val").textContent = fmtEvent(this._hass, day.sunset);

    const { xOf, W } = drawCurve(this, day, now);
    drawEvents(this, day, xOf, W);
  }
}

registerCard(SunPathCard, {
  name: "Sun Path Card",
  description: "Today's sun path: sunrise, sunset, dawn, dusk and the current position of the sun",
});
