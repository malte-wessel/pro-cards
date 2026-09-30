/*
 * weather-card – one weather entity as a tile, or as sections composed like the sections card.
 *
 *   type: custom:weather-card
 *   entity: weather.home                   # required
 *   title: Home / icon: mdi:home           # header like the group cards (template allowed)
 *   header_entities: [...]                 # compact icon + value items on the title line
 *   name / secondary / color               # of the lead (tile and hero); templates allowed
 *   rules:                                 # on the condition (state: rainy), colour / icon / label / tint_card
 *   temperature_rules:                     # on the temperature (below / above), colour + label of the value
 *   sections:                              # none → a tile
 *     - { type: hero }                                     # condition, big temperature, high / low
 *     - { type: row, entities: [humidity, wind_speed, { entity: sensor.uv_index, visual: ring }] }
 *     - { type: trend, mode: hourly, hours_to_show: 12, show: [temperature, precipitation] }
 *     - { type: forecast, mode: daily, layout: vertical, days: 7 }
 *     - { type: table, title: More, entities: [pressure, dew_point] }   # row | list | table | grid | column
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
import { CARD_TYPE } from "./weather/constants.ts";
import {
  dailyTypeOf,
  daysOf,
  hoursOf,
  isToday,
  supportsForecast,
  type Day,
} from "./weather/forecast.ts";
import { showTrendHover, trendTimeAt } from "./shared/trend/plot.ts";
import { fillCurrent } from "./weather/render/current.ts";
import { buildForecast, drawForecast } from "./weather/render/forecast.ts";
import { sectionShell } from "./weather/render/section.ts";
import { buildTrend, drawTrendSection, type ForecastTrendEl } from "./weather/render/trend.ts";
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
      sections: [
        { type: "hero" },
        { type: "row", entities: ["humidity", "wind_speed", "pressure"] },
        { type: "forecast", mode: "daily" },
      ],
    };
  }

  declare _config?: WeatherConfig;
  // the forecasts by type: undefined until the first message, null when not available
  _forecast: Partial<Record<WeatherForecastType, ForecastEntry[] | null>> = {};
  _fcUnsub = new Map<WeatherForecastType, Promise<Unsubscribe | null>>();
  _fcToken = new Map<WeatherForecastType, object>(); // identifies the live subscription per type
  _chartHover: { el: ForecastTrendEl; t: number } | null = null;
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
    let rows = cfg.hasHeader ? 1 : 0;
    for (const s of cfg.sections) {
      if (s.kind === "hero") rows += 2;
      else if (s.kind === "trend")
        rows += 1 + (s.layout === "overlay" || s.show.length === 1 ? 2 : 1 + s.show.length);
      else if (s.kind === "forecast")
        rows += 1 + (s.layout === "vertical" ? Math.ceil(s.count / 2) : 3);
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
    if (cfg.layout === "tile") {
      body.appendChild(this._row(cfg.condIdx, "wtile"));
      return;
    }
    cfg.sections.forEach((sec, i) => {
      const divider = sec.kind === "entities" ? sec.group.divider : sec.divider;
      if (divider && i > 0) body.appendChild(this._divider());
      let el: HTMLElement;
      if (sec.kind === "hero") {
        el = sectionShell(sec.title);
        el.appendChild(this._row(sec.condIdx, "whero"));
      } else if (sec.kind === "trend") el = buildTrend(ctx, sec);
      else if (sec.kind === "forecast") el = buildForecast(ctx, sec);
      else {
        el = sectionShell(sec.title);
        el.appendChild(this._buildGroup(sec.group));
      }
      el.dataset.sec = String(i);
      const chart = el.querySelector<ForecastTrendEl>(".trend");
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
      const secEl = row.closest<HTMLElement>("[data-sec]");
      const sec = secEl ? cfg.sections[Number(secEl.dataset.sec)] : undefined;
      const tempIdx = sec?.kind === "hero" ? sec.tempIdx : cfg.tempIdx;
      const temp = modelOf(ctx, cfg.entities[tempIdx]);
      fillCurrent(ctx, row, cfg, { cond: m, temp, today }, c.contains("wtile"));
      return;
    }
    super._fill(ctx, row, ent, idx, m);
  }
  // temperature rules may tint the card too
  _tintColor(ctx: RenderCtx, models: EntityModel[], card: HTMLElement) {
    const base = super._tintColor(ctx, models, card);
    if (base !== null) return base;
    // the temperature items of the tile / the hero sections may tint too
    const cfg = this._config as WeatherConfig;
    const idxs =
      cfg.layout === "tile"
        ? [cfg.tempIdx]
        : cfg.sections.flatMap((s) => (s.kind === "hero" ? [s.tempIdx] : []));
    for (const i of idxs) if (models[i]?.look.tint) return models[i].look.color;
    return null;
  }
  _render() {
    if (!this._root || !this._hass || !this._config) return;
    const cfg = this._config,
      card = this._root,
      ctx = this._ctx();
    const sections = [...card.querySelectorAll<HTMLElement>("[data-sec]")];
    super._render();
    // an entity without an hourly forecast: "no forecast" rather than loading forever
    const st = this._hass.states[cfg.entity];
    const hourly = supportsForecast(st, "hourly") ? this._forecast.hourly : null;
    const hours = (n: number) =>
      hourly === undefined ? undefined : hourly === null ? null : hoursOf(hourly, ctx.now, n);
    sections.forEach((el) => {
      const sec = cfg.sections[Number(el.dataset.sec)];
      if (sec?.kind === "trend")
        drawTrendSection(
          ctx,
          el,
          cfg,
          sec,
          hourly,
          sec.mode === "daily" ? this._days(sec.count) : undefined,
        );
      else if (sec?.kind === "forecast")
        drawForecast(
          ctx,
          el,
          cfg,
          sec,
          sec.mode === "hourly" ? hours(sec.count) : this._days(sec.count),
        );
    });
    const h = this._chartHover;
    if (h && h.el.isConnected) showTrendHover(h.el, h.t, h.el._head);
  }

  // ----- chart hover -----
  _onChartPointer(ev: PointerEvent) {
    ev.stopPropagation();
    const el = ev.currentTarget as ForecastTrendEl;
    const tt = trendTimeAt(el, ev);
    if (tt === null) return;
    this._chartHover = { el, t: tt };
    if (!showTrendHover(el, tt, el._head)) hideHover(el);
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
    "A weather entity as a tile or as sections: hero, attribute rows, forecast rows and trend charts",
});
