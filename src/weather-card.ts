/*
 * weather-card – current conditions, attributes and the forecast of one weather entity.
 *
 *   type: custom:weather-card
 *   entity: weather.home                   # required
 *   layout: hero                           # tile | hero (default: tile unless there is more to show)
 *   title: Home / icon: mdi:home           # header like the group cards (template allowed)
 *   header_entities: [...]                 # compact icon + value items on the title line
 *   name: Home                             # tile: the name; hero: the first line (default: condition)
 *   secondary: "{{ ... }}"                 # the line under the temperature; template allowed
 *   rules:                                 # on the condition (state: rainy), colour / icon / label / tint_card
 *   temperature_rules:                     # on the temperature (below / above), colour + label of the value
 *   attributes: [humidity, wind_speed, pressure, { entity: sensor.uv_index }]
 *   attributes_layout: row                 # row | list
 *   sections:
 *     - { type: hourly, hours_to_show: 12, visual: chart, show: [temperature, precipitation] }
 *     - { type: daily, days: 7, layout: list, show: [probability] }
 *     - { type: entities, title: Garden, layout: row, entities: [...] }   # an entity group
 *   tap_action / hold_action / double_tap_action   # more-info / more-info / none
 */
import { registerCard } from "./shared/card.ts";
import { EntityCardBase, groupCardSize } from "./shared/entity/base.ts";
import type { EntityItem } from "./shared/entity/config.ts";
import { modelOf, type EntityModel, type RenderCtx } from "./shared/entity/model.ts";
import type {
  ForecastEntry,
  ForecastMessage,
  GridOptions,
  HomeAssistant,
  WeatherForecastType,
} from "./shared/ha.ts";
import { hideHover } from "./shared/hover.ts";
import { t } from "./shared/i18n.ts";
import {
  normalizeWeatherCardConfig,
  wantedForecasts,
  type WeatherConfig,
} from "./weather/config.ts";
import { CARD_TYPE, LANE_H } from "./weather/constants.ts";
import { dailyTypeOf, daysOf, isToday, supportsForecast, type Day } from "./weather/forecast.ts";
import { chartTimeAt, showChartHover } from "./weather/render/chart.ts";
import { fillCurrent } from "./weather/render/current.ts";
import { buildDaily, drawDaily } from "./weather/render/daily.ts";
import {
  buildHourly,
  drawHourly,
  prepareHourlyPlot,
  sectionShell,
  type ForecastChartEl,
} from "./weather/render/hourly.ts";
import { STYLE_WEATHER_CARD } from "./weather/styles.ts";

type Unsubscribe = () => unknown;

export class WeatherCard extends EntityCardBase {
  static cardType = CARD_TYPE;
  static getStubConfig(hass: HomeAssistant | undefined, entities?: string[]) {
    const e =
      (entities || []).find((id) => id.startsWith("weather.")) ||
      Object.keys(hass?.states || {}).find((id) => id.startsWith("weather.")) ||
      "";
    return {
      entity: e,
      title: t(hass, "weather.stub_title"),
      attributes: ["humidity", "wind_speed", "pressure"],
      sections: [{ type: "daily" }],
    };
  }

  declare _config?: WeatherConfig;
  // the forecasts by type: undefined until the first message, null when not available
  _forecast: Partial<Record<WeatherForecastType, ForecastEntry[] | null>> = {};
  _fcUnsub = new Map<WeatherForecastType, Promise<Unsubscribe | null>>();
  _fcToken = new Map<WeatherForecastType, object>(); // identifies the live subscription per type
  _chartHover: { el: ForecastChartEl; t: number } | null = null;
  _chartHandlers = {
    move: this._onChartPointer.bind(this),
    up: (ev: PointerEvent) => ev.stopPropagation(),
    leave: this._onChartLeave.bind(this),
  };

  _normalize(raw: unknown) {
    return normalizeWeatherCardConfig(raw);
  }
  _styles() {
    return STYLE_WEATHER_CARD;
  }
  getGridOptions(): GridOptions {
    if (this._config?.layout === "tile")
      return { columns: 6, rows: 1, min_columns: 3, min_rows: 1, max_rows: 1 };
    return { columns: 12, rows: "auto", min_columns: 6, min_rows: 2 };
  }
  getCardSize() {
    const cfg = this._config;
    if (!cfg) return 2;
    if (cfg.layout === "tile") return 1;
    let rows = (cfg.hasHeader ? 1 : 0) + 2;
    if (cfg.attrGroup) rows += groupCardSize(cfg, cfg.attrGroup);
    for (const s of cfg.sections) {
      if (s.kind === "hourly")
        rows +=
          1 +
          (s.visual === "chart" ? Math.ceil(s.show.reduce((a, k) => a + LANE_H[k], 0) / 56) : 1);
      else if (s.kind === "daily") rows += 1 + (s.layout === "list" ? Math.ceil(s.days / 2) : 2);
      else rows += (s.title ? 1 : 0) + groupCardSize(cfg, s.group);
    }
    return rows;
  }

  // ----- lifecycle: the forecast subscriptions follow config, hass and connection -----
  setConfig(config: unknown) {
    this._unsubscribeForecasts();
    this._forecast = {};
    super.setConfig(config);
    if (this._hass) this._subscribeForecasts();
  }
  _setHass(hass: HomeAssistant) {
    const prev = this._hass;
    super._setHass(hass);
    if (!this._config) return;
    if (prev && prev.connection !== hass.connection) {
      this._unsubscribeForecasts();
      this._forecast = {};
    }
    this._subscribeForecasts();
  }
  connectedCallback() {
    super.connectedCallback();
    if (this._hass && this._config) this._subscribeForecasts();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unsubscribeForecasts();
  }

  // the forecast types the sections need and the entity offers
  _wantedTypes(): WeatherForecastType[] {
    const cfg = this._config,
      st = cfg && this._hass?.states[cfg.entity];
    if (!cfg || !st) return [];
    const want = wantedForecasts(cfg);
    const out: WeatherForecastType[] = [];
    if (want.hourly && supportsForecast(st, "hourly")) out.push("hourly");
    const daily = want.daily ? dailyTypeOf(st) : null;
    if (daily) out.push(daily);
    return out;
  }
  _subscribeForecasts() {
    const conn = this._hass?.connection,
      cfg = this._config;
    if (!conn || !cfg || !this.isConnected) return;
    const wanted = this._wantedTypes();
    for (const [type, p] of [...this._fcUnsub])
      if (!wanted.includes(type)) {
        this._fcUnsub.delete(type);
        this._fcToken.delete(type);
        p.then((u) => u && u()).catch(() => {});
      }
    for (const type of wanted) {
      if (this._fcUnsub.has(type)) continue;
      // a message of a subscription that was replaced meanwhile (new config or connection) is dropped
      const token = {};
      this._fcToken.set(type, token);
      const p: Promise<Unsubscribe | null> = conn
        .subscribeMessage<ForecastMessage>(
          (msg) => {
            if (this._fcToken.get(type) !== token) return;
            this._forecast[type] = msg?.forecast ?? null;
            this._render();
          },
          { type: "weather/subscribe_forecast", forecast_type: type, entity_id: cfg.entity },
        )
        .catch((e) => {
          console.warn(`${CARD_TYPE}: forecast subscription failed`, type, e);
          this._forecast[type] = null;
          this._render();
          return null;
        });
      this._fcUnsub.set(type, p);
    }
  }
  _unsubscribeForecasts() {
    for (const p of this._fcUnsub.values()) p.then((u) => u && u()).catch(() => {});
    this._fcUnsub = new Map();
    this._fcToken = new Map();
  }
  // the days of the daily forecast (undefined while loading, null when there is none)
  _days(n: number): Day[] | null | undefined {
    const cfg = this._config,
      st = cfg && this._hass?.states[cfg.entity];
    const type = dailyTypeOf(st);
    if (!type) return null;
    const fc = this._forecast[type];
    if (fc === undefined) return undefined;
    if (fc === null) return null;
    return daysOf(fc, type, n);
  }

  // ----- DOM -----
  _buildBody(body: HTMLElement) {
    const cfg = this._config as WeatherConfig;
    const ctx = this._ctx();
    body.appendChild(this._row(cfg.condIdx, cfg.layout === "tile" ? "wtile" : "whero"));
    if (cfg.attrGroup) body.appendChild(this._buildGroup(cfg.attrGroup));
    cfg.sections.forEach((sec, i) => {
      let el: HTMLElement;
      if (sec.kind === "hourly") el = buildHourly(ctx, cfg, sec);
      else if (sec.kind === "daily") el = buildDaily(ctx, sec);
      else {
        el = sectionShell(sec.title);
        el.appendChild(this._buildGroup(sec.group));
      }
      el.dataset.sec = String(i);
      const chart = el.querySelector<ForecastChartEl>(".wchart");
      if (chart) {
        chart.addEventListener("pointermove", this._chartHandlers.move);
        chart.addEventListener("pointerdown", this._chartHandlers.move);
        chart.addEventListener("pointerup", this._chartHandlers.up);
        chart.addEventListener("pointerleave", this._chartHandlers.leave);
      }
      body.appendChild(el);
    });
  }
  _fill(ctx: RenderCtx, row: HTMLElement, ent: EntityItem, idx: number, m: EntityModel) {
    const cfg = this._config as WeatherConfig;
    const c = row.classList;
    if (c.contains("wtile") || c.contains("whero")) {
      const days = this._days(1);
      const today = days?.find((d) => isToday(d.t, ctx.now)) ?? null;
      const temp = modelOf(ctx, cfg.entities[cfg.tempIdx]);
      fillCurrent(ctx, row, cfg, { cond: m, temp, today }, c.contains("wtile"));
      return;
    }
    super._fill(ctx, row, ent, idx, m);
  }
  // temperature rules may tint the card too
  _tintColor(ctx: RenderCtx, models: EntityModel[], card: HTMLElement) {
    const base = super._tintColor(ctx, models, card);
    if (base !== null) return base;
    const temp = models[(this._config as WeatherConfig).tempIdx];
    return temp?.look.tint ? temp.look.color : null;
  }
  _render() {
    if (!this._root || !this._hass || !this._config) return;
    const cfg = this._config,
      card = this._root,
      ctx = this._ctx();
    const sections = [...card.querySelectorAll<HTMLElement>("[data-sec]")];
    // hourly plots draw with the base's plots, so hand them their series first
    sections.forEach((el) => {
      const sec = cfg.sections[Number(el.dataset.sec)];
      if (sec?.kind === "hourly" && sec.visual !== "chart")
        prepareHourlyPlot(ctx, el, sec, this._forecast.hourly);
    });
    super._render();
    sections.forEach((el) => {
      const sec = cfg.sections[Number(el.dataset.sec)];
      if (sec?.kind === "hourly" && sec.visual === "chart")
        drawHourly(ctx, el, cfg, sec, this._forecast.hourly);
      else if (sec?.kind === "daily") drawDaily(ctx, el, cfg, sec, this._days(sec.days));
    });
    const h = this._chartHover;
    if (h && h.el.isConnected) showChartHover(h.el, h.t, h.el._content ?? (() => null));
  }

  // ----- chart hover -----
  _onChartPointer(ev: PointerEvent) {
    ev.stopPropagation();
    const el = ev.currentTarget as ForecastChartEl;
    const tt = chartTimeAt(el, ev);
    if (tt === null) return;
    this._chartHover = { el, t: tt };
    if (!showChartHover(el, tt, el._content ?? (() => null))) hideHover(el);
  }
  _onChartLeave(ev: PointerEvent) {
    if (ev.pointerType === "touch") return;
    this._hideHover();
  }
  _hideHover() {
    this._chartHover = null;
    super._hideHover();
  }
}

registerCard(WeatherCard, {
  name: "Weather Card",
  description:
    "Current conditions, attributes and the hourly / daily forecast of a weather entity in the Pro Cards look",
});
