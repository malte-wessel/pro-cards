/*
 * illuminance-card
 * Outdoor illuminance in three looks: gauge arc (arc), 24 h log-scale trend over zone bands
 * (trend), or a 24 h colour band (band). Dependency-free (plain web component, inline SVG).
 *
 * Config:
 *   type: custom:illuminance-card
 *   entity: sensor.xyz_illuminance   # required
 *   mode: band                       # arc | trend | band
 *   name: Outdoor light              # optional (default: friendly name)
 *   hours_to_show: 24                # trend / band
 *   bucket_minutes: 30               # band
 *   min_lx: 0.1
 *   max_lx: 100000
 *   zones:                           # optional overrides per key: { label, max, color }
 *     day: { label: Daylight, max: 30000, color: amber }   # color = HA colour name or hex
 */
import { registerCard } from "./shared/card.ts";
import type { GridOptions, HomeAssistant } from "./shared/ha.ts";
import type { MeanBucket, Point } from "./shared/history.ts";
import type {
  IlluminanceCardConfig,
  IlluminanceConfig,
  IlluminanceHost,
  LxPoint,
  SampledLx,
} from "./illuminance/config.ts";
import { cssColor, resolveHex } from "./shared/color.ts";
import { REFRESH_MS } from "./shared/constants.ts";
import { fmtTime, langOf } from "./shared/format.ts";
import { fetchHistory } from "./shared/history.ts";
import { hideHover } from "./shared/hover.ts";
import { t } from "./shared/i18n.ts";
import { isNum, oneOf, qs } from "./shared/util.ts";
import { DEFAULTS, MODES } from "./illuminance/constants.ts";
import { IlluminanceCardEditor } from "./illuminance/editor.ts";
import { renderArc } from "./illuminance/render/arc.ts";
import { renderBand } from "./illuminance/render/band.ts";
import { fmtLx, showHover, timeAt, windowOf } from "./illuminance/render/plot.ts";
import { renderTrend } from "./illuminance/render/trend.ts";
import { STYLE } from "./illuminance/styles.ts";
import { mergeZones } from "./illuminance/zones.ts";

const CARD_TYPE = "illuminance-card";

customElements.define(`${CARD_TYPE}-editor`, IlluminanceCardEditor);

export class IlluminanceCard extends HTMLElement implements IlluminanceHost {
  static cardType = CARD_TYPE;

  _config!: IlluminanceConfig;
  _hass?: HomeAssistant;
  _root?: HTMLElement;
  _series: LxPoint[] = [];
  _mode?: "trend" | "band";
  _sampled?: SampledLx[];
  _buckets?: (MeanBucket | null)[];
  _xOf?: (t: number) => number;
  _yOf?: (v: number) => number;
  _bw?: number;
  _gutter?: number;
  _plotW?: number;
  _hoverT: number | null = null;
  _fetched = false;
  _fetching = false;
  _timer?: ReturnType<typeof setInterval>;
  _ro?: ResizeObserver;

  static getConfigElement() {
    return document.createElement(`${CARD_TYPE}-editor`);
  }
  static getStubConfig(hass: HomeAssistant | undefined, entities?: string[]) {
    const e =
      (entities || []).find(
        (id) =>
          id.startsWith("sensor.") && hass?.states[id]?.attributes.device_class === "illuminance",
      ) || (entities || []).find((id) => id.startsWith("sensor."));
    return { entity: e || "", mode: "band" };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._onPointer = this._onPointer.bind(this);
    this._onLeave = this._onLeave.bind(this);
    this._onDocPointer = this._onDocPointer.bind(this);
  }

  setConfig(config: IlluminanceCardConfig | null | undefined) {
    if (!config?.entity) throw new Error("illuminance-card: 'entity' is required");
    const { mode, ...rest } = config;
    this._config = {
      ...DEFAULTS,
      ...rest,
      entity: config.entity,
      mode: oneOf(MODES, mode) ? mode : DEFAULTS.mode,
      zonesList: mergeZones(config.zones, this._hass),
    };
    this._series = [];
    this._fetched = false;
    this._hoverT = null;
    if (this._root) this._buildDom();
  }

  set hass(hass: HomeAssistant) {
    const prev = this._hass;
    this._hass = hass;
    if (!this._root) this._buildDom();
    if (this._config.mode !== "arc" && !this._fetched && !this._fetching) {
      this._fetchHistory();
      return;
    }
    const st = hass.states[this._config.entity],
      pst = prev?.states[this._config.entity];
    if (st !== pst) {
      if (st && isNum(st.state)) {
        const t = new Date(st.last_updated).getTime();
        const s = this._series;
        if (s.length === 0 || t > s[s.length - 1].t) s.push({ t, v: Number(st.state) });
      }
      this._render();
    } else if (!prev || langOf(prev) !== langOf(hass)) this._render();
  }

  connectedCallback() {
    this._timer = setInterval(() => {
      if (this._config?.mode !== "arc") this._fetchHistory();
      else this._render();
    }, REFRESH_MS);
    this._ro = new ResizeObserver(() => this._render());
    if (this._root) this._ro.observe(qs(this._root, ".body"));
    document.addEventListener("pointerdown", this._onDocPointer);
  }
  disconnectedCallback() {
    clearInterval(this._timer);
    this._ro?.disconnect();
    document.removeEventListener("pointerdown", this._onDocPointer);
  }

  getCardSize() {
    return 4;
  }
  getGridOptions(): GridOptions {
    return { columns: 12, rows: "auto", min_columns: 6 };
  }

  // ----- helpers -----
  _state() {
    return this._hass?.states[this._config.entity];
  }
  _value() {
    const st = this._state();
    return st && isNum(st.state) ? Number(st.state) : null;
  }

  async _fetchHistory() {
    if (!this._hass || !this._config) return;
    this._fetching = true;
    try {
      const id = this._config.entity;
      const res = await fetchHistory(this._hass, [id], this._config.hours_to_show);
      this._series = (res.get(id) || []).filter((p): p is Point & { v: number } => p.v !== null);
      this._fetched = true;
    } catch (err) {
      console.error("illuminance-card: history fetch failed", err);
    } finally {
      this._fetching = false;
      this._render();
    }
  }

  // ----- DOM -----
  _buildDom() {
    const root = this.shadowRoot as ShadowRoot;
    root.innerHTML = "";
    const style = document.createElement("style");
    style.textContent = STYLE;
    root.appendChild(style);
    const card = document.createElement("ha-card");
    card.innerHTML = `
      <div class="header">
        <div class="shape"><ha-icon icon="mdi:white-balance-sunny"></ha-icon></div>
        <div class="info"><div class="primary"></div><div class="secondary"></div></div>
      </div>
      <div class="body"></div>`;
    root.appendChild(card);
    this._root = card;
    this._ro?.observe(qs(card, ".body"));
    this._render();
  }

  _render() {
    if (!this._root || !this._hass) return;
    const card = this._root,
      cfg = this._config;
    // default labels in the user's language, then the zone colours against the live theme:
    // css (token var) for fills, hex for blending
    cfg.zonesList = mergeZones(cfg.zones, this._hass);
    cfg.zonesList.forEach((z) => {
      z.css = cssColor(z.color, "#888888");
      z.hex = resolveHex(z.color, this);
    });
    const st = this._state();
    qs(card, ".primary").textContent = cfg.name || st?.attributes.friendly_name || cfg.entity;
    const body = qs(card, ".body");
    if (!st) {
      body.innerHTML = `<div class="empty"></div>`;
      qs(body, ".empty").textContent = t(this._hass, "common.not_found", { entity: cfg.entity });
      return;
    }
    const v = this._value();
    const sec = qs(card, ".secondary");
    if (cfg.mode === "arc") sec.textContent = fmtTime(this._hass, Date.now());
    else {
      const { t0 } = windowOf(this);
      let best: LxPoint | null = null;
      for (const p of this._series) if (p.t >= t0 && (!best || p.v > best.v)) best = p;
      sec.textContent = best
        ? `${t(this._hass, "illuminance.max")} ${fmtLx(this._hass, best.v)} lx · ${fmtTime(this._hass, best.t)}`
        : `${cfg.hours_to_show} h`;
    }
    if (cfg.mode === "arc") renderArc(this, body, v);
    else if (cfg.mode === "trend") renderTrend(this, body, v);
    else renderBand(this, body, v);
    if (cfg.mode !== "arc" && this._hoverT !== null && !showHover(this, this._hoverT))
      this._hideHover();
  }

  // ----- hover -----
  _onPointer(ev: PointerEvent) {
    if (!this._xOf || this._config.mode === "arc") return;
    this._hoverT = timeAt(this, ev);
    if (!showHover(this, this._hoverT)) this._hideHover();
  }
  _onLeave(ev: PointerEvent) {
    if (ev.pointerType === "touch") return;
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

registerCard(IlluminanceCard, {
  name: "Illuminance Card",
  description: "Illuminance as a gauge arc, a trend with zones or a colour band",
});
