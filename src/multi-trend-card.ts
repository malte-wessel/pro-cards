/*
 * multi-trend-card
 * Tile-style trend card for several sensors with a hover/touch crosshair tooltip.
 * Dependency-free (plain web component, inline SVG). Includes a visual editor (ha-form).
 *
 * Config:
 *   type: custom:multi-trend-card
 *   title: Temperature & dew point    # optional (default: first entity name)
 *   icon: mdi:thermometer             # optional
 *   color: primary                    # optional icon color (HA color token or hex)
 *   hours_to_show: 6                  # default 6
 *   layout: auto | overlay | lanes    # auto = overlay when all units match, else lanes
 *   show_legend: true
 *   x_axis: false                     # time labels + vertical gridlines
 *   y_axis: false                     # value labels + horizontal gridlines (per lane)
 *   entities:
 *     - entity: sensor.a
 *       name: A                       # optional
 *       color: red                    # optional (HA named color or hex)
 */
import { fireAction, registerCard } from "./shared/card.ts";
import type { GridOptions, HomeAssistant } from "./shared/ha.ts";
import type { MultiTrendCardConfig, TrendConfig, TrendPoint } from "./multi-trend/config.ts";
import { cssColor } from "./shared/color.ts";
import { DEVICE_CLASS_ICON, REFRESH_MS } from "./shared/constants.ts";
import { fmtNumber, langOf } from "./shared/format.ts";
import { fetchHistory, type Point } from "./shared/history.ts";
import { hideHover } from "./shared/hover.ts";
import { decimalsOf, isNum, qs } from "./shared/util.ts";
import { MultiTrendCardEditor } from "./multi-trend/editor.ts";
import { DEFAULT_HOURS, PALETTE } from "./shared/trend/scale.ts";
import {
  drawTrend,
  trendPlotEl,
  showTrendHover,
  trendTimeAt,
  type TrendPlotEl,
  type TrendSpec,
} from "./shared/trend/plot.ts";
import { STYLE } from "./multi-trend/styles.ts";

const CARD_TYPE = "multi-trend-card";

customElements.define(`${CARD_TYPE}-editor`, MultiTrendCardEditor);

export class MultiTrendCard extends HTMLElement {
  static cardType = CARD_TYPE;

  _config!: TrendConfig;
  _hass?: HomeAssistant;
  _root?: HTMLElement;
  _plot?: TrendPlotEl;
  _series: TrendPoint[][] = [];
  _hoverT: number | null = null;
  _fetched = false;
  _fetching = false;
  _timer?: ReturnType<typeof setInterval>;
  _ro?: ResizeObserver;

  static getConfigElement() {
    return document.createElement(`${CARD_TYPE}-editor`);
  }

  static getStubConfig(hass: HomeAssistant | undefined, entities?: string[]) {
    const sensors = (entities || [])
      .filter((e) => e.startsWith("sensor.") && hass?.states[e] && isNum(hass.states[e].state))
      .slice(0, 2);
    return { entities: sensors.map((entity) => ({ entity })), hours_to_show: DEFAULT_HOURS };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._onPointer = this._onPointer.bind(this);
    this._onLeave = this._onLeave.bind(this);
    this._onDocPointer = this._onDocPointer.bind(this);
  }

  setConfig(config: MultiTrendCardConfig) {
    if (!config || !Array.isArray(config.entities) || config.entities.length === 0) {
      throw new Error("multi-trend-card: 'entities' must be a non-empty list");
    }
    const entities = config.entities.map((e, i) => {
      const o = typeof e === "string" ? { entity: e } : { ...e };
      if (!o.entity) throw new Error(`multi-trend-card: entities[${i}] has no 'entity'`);
      return { ...o, colorCss: cssColor(o.color, cssColor(PALETTE[i % PALETTE.length]) ?? "") };
    });
    this._config = {
      hours_to_show: DEFAULT_HOURS,
      layout: "auto",
      show_legend: true,
      x_axis: false,
      y_axis: false,
      ...config,
      entities,
    };
    this._series = entities.map(() => []);
    this._fetched = false;
    if (this._root) this._buildDom();
  }

  set hass(hass: HomeAssistant) {
    const prev = this._hass;
    this._hass = hass;
    if (!this._root) this._buildDom();
    if (!this._fetched && !this._fetching) {
      this._fetchHistory();
      return;
    }
    // Live append of new states between refreshes; a new language re-renders the axis times
    let changed = langOf(prev) !== langOf(hass);
    this._config.entities.forEach((e, i) => {
      const st = hass.states[e.entity];
      const pst = prev?.states[e.entity];
      if (st && st !== pst && isNum(st.state)) {
        const t = new Date(st.last_updated).getTime();
        const s = this._series[i];
        if (s.length === 0 || t > s[s.length - 1].t) {
          s.push({ t, v: Number(st.state) });
          changed = true;
        }
      }
    });
    if (changed || !prev) this._render();
  }

  connectedCallback() {
    this._timer = setInterval(() => this._fetchHistory(), REFRESH_MS);
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
    return this._layout() === "lanes" ? 2 + this._config.entities.length : 3;
  }

  getGridOptions(): GridOptions {
    const rows = this._layout() === "lanes" ? 2 + this._config.entities.length : 3;
    return { columns: 12, rows, min_columns: 6, min_rows: 2 };
  }

  // ---------- helpers ----------

  _state(i: number) {
    return this._hass?.states[this._config.entities[i].entity];
  }

  _unit(i: number): string {
    return this._state(i)?.attributes.unit_of_measurement || "";
  }

  _name(i: number): string {
    const e = this._config.entities[i];
    return e.name || this._state(i)?.attributes.friendly_name || e.entity;
  }

  _layout(): "overlay" | "lanes" {
    const l = this._config.layout;
    if (l === "overlay" || l === "lanes") return l;
    const units = new Set(this._config.entities.map((_, i) => this._unit(i)));
    return units.size <= 1 ? "overlay" : "lanes";
  }

  // a value of entity i with the entity's decimals and unit
  _fmt(i: number, v: number) {
    const n = fmtNumber(this._hass, v, decimalsOf(this._state(i)?.state ?? ""));
    const u = this._unit(i);
    return u ? `${n} ${u}` : n;
  }

  async _fetchHistory() {
    if (!this._hass || !this._config) return;
    this._fetching = true;
    try {
      const ids = this._config.entities.map((e) => e.entity);
      const res = await fetchHistory(this._hass, ids, this._config.hours_to_show);
      this._series = ids.map((id) =>
        (res.get(id) || []).filter((p): p is Point & { v: number } => p.v !== null),
      );
      this._fetched = true;
    } catch (err) {
      console.error("multi-trend-card: history fetch failed", err);
    } finally {
      this._fetching = false;
      this._render();
    }
  }

  // ---------- DOM ----------

  _buildDom() {
    const root = this.shadowRoot as ShadowRoot;
    root.innerHTML = "";
    const style = document.createElement("style");
    style.textContent = STYLE;
    root.appendChild(style);

    const card = document.createElement("ha-card");
    card.innerHTML = `
      <div class="header" role="button" tabindex="0">
        <div class="shape"><ha-icon></ha-icon></div>
        <div class="info"><div class="primary"></div><div class="secondary"></div></div>
        <div class="range"></div>
      </div>
      <div class="legend"></div>`;
    card.appendChild(trendPlotEl());
    root.appendChild(card);
    this._root = card;

    const header = qs(card, ".header");
    header.addEventListener("click", () => this._moreInfo());
    header.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        this._moreInfo();
      }
    });
    const plot = qs<TrendPlotEl>(card, ".plot");
    this._plot = plot;
    plot.addEventListener("pointermove", this._onPointer);
    plot.addEventListener("pointerdown", this._onPointer);
    plot.addEventListener("pointerleave", this._onLeave);
    this._ro?.observe(plot);

    card.style.setProperty("--tile-color", cssColor(this._config.color, "var(--state-icon-color)"));
    qs(card, ".range").textContent = `${this._config.hours_to_show} h`;

    this._render();
  }

  _moreInfo() {
    fireAction(this, this._config.entities[0].entity, { action: "more-info" }, "tap");
  }

  _render() {
    if (!this._root || !this._hass) return;
    const card = this._root;
    const st0 = this._state(0);

    // Header text
    qs(card, ".primary").textContent = this._config.title || this._name(0);
    const icon = qs(card, "ha-icon");
    icon.setAttribute(
      "icon",
      this._config.icon ||
        st0?.attributes.icon ||
        DEVICE_CLASS_ICON[st0?.attributes.device_class ?? ""] ||
        "mdi:chart-line-variant",
    );

    const sec = qs(card, ".secondary");
    sec.textContent = "";
    this._config.entities.forEach((e, i) => {
      const st = this._state(i);
      if (i > 0) {
        const s = document.createElement("span");
        s.className = "sep";
        s.textContent = "·";
        sec.appendChild(s);
      }
      const txt = st && isNum(st.state) ? this._fmt(i, Number(st.state)) : st ? st.state : "—";
      sec.appendChild(document.createTextNode(txt));
    });

    // Legend: only for >=2 overlaid series (lanes carry their own labels)
    const legend = qs(card, ".legend");
    legend.textContent = "";
    const showLegend =
      this._config.show_legend && this._config.entities.length > 1 && this._layout() === "overlay";
    legend.style.display = showLegend ? "" : "none";
    if (showLegend) {
      this._config.entities.forEach((e, i) => {
        const span = document.createElement("span");
        const bar = document.createElement("i");
        bar.style.setProperty("--c", e.colorCss);
        const nm = document.createElement("em");
        nm.textContent = this._name(i);
        span.append(bar, nm);
        legend.appendChild(span);
      });
    }

    drawTrend(this._plot as TrendPlotEl, this._spec());
    if (this._hoverT !== null && !showTrendHover(this._plot as TrendPlotEl, this._hoverT))
      this._hideHover();
  }

  // what the plot draws: the history window and one series per entity
  _spec(): TrendSpec {
    const now = Date.now();
    return {
      hass: this._hass,
      t0: now - this._config.hours_to_show * 3600e3,
      t1: now,
      layout: this._layout(),
      xAxis: this._config.x_axis,
      yAxis: this._config.y_axis,
      series: this._config.entities.map((e, i) => ({
        pts: this._series[i],
        color: e.colorCss,
        name: this._name(i),
        fmt: (v) => this._fmt(i, v),
      })),
    };
  }

  // ---------- interaction ----------

  _onPointer(ev: PointerEvent) {
    const plot = this._plot;
    if (!plot) return;
    const t = trendTimeAt(plot, ev);
    if (t === null) return;
    this._hoverT = t;
    if (!showTrendHover(plot, t)) this._hideHover();
  }

  _onLeave(ev: PointerEvent) {
    if (ev.pointerType === "touch") return; // keep tooltip after tap
    this._hideHover();
  }

  _onDocPointer(ev: PointerEvent) {
    if (!ev.composedPath().includes(this)) this._hideHover();
  }

  _hideHover() {
    this._hoverT = null;
    hideHover(this._root);
  }
}

registerCard(MultiTrendCard, {
  name: "Multi Trend Card",
  description: "Tile-style trend graph for several sensors with hover tooltip",
});
