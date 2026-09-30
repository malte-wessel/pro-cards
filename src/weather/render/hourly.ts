// The hourly section: a lane chart (temperature line, rain columns, rain chance, wind) or one
// of the entity plots (temperature sparkline, rain columns) over the next hours.
import { cssColor } from "../../shared/color.ts";
import { fmtNumber, modelOf, tplGetter, type RenderCtx } from "../../shared/entity/model.ts";
import { resolveLook } from "../../shared/entity/look.ts";
import { plotEl } from "../../shared/entity/render/blocks.ts";
import type { PlotElement } from "../../shared/entity/render/plots.ts";
import { fmtTime } from "../../shared/format.ts";
import type { ForecastEntry } from "../../shared/ha.ts";
import { t } from "../../shared/i18n.ts";
import { clockTicks, timeStep } from "../../shared/ticks.ts";
import { qs } from "../../shared/util.ts";
import type { WeatherConfig, WeatherSection } from "../config.ts";
import { conditionText } from "../conditions.ts";
import { LANE_H, type HourlyShow } from "../constants.ts";
import { forecastPoints, hourlyWindow, hoursIn, timeOf } from "../forecast.ts";
import { chartEl, drawChart, type ChartElement, type ChartLane, type TipContent } from "./chart.ts";

export type HourlySection = Extract<WeatherSection, { kind: "hourly" }>;
// a forecast chart knows how to describe the point under the pointer
export interface ForecastChartEl extends ChartElement {
  _content?: (t: number) => TipContent | null;
}

const RAIN = cssColor("blue", "var(--blue-color)"),
  WIND = "var(--secondary-text-color)";
const clock = (ctx: RenderCtx, t: number, dayStep: boolean) =>
  fmtTime(
    ctx.hass,
    t,
    dayStep ? { weekday: "short", hour: "2-digit" } : { hour: "2-digit", minute: "2-digit" },
  );

// the section element with its head line (always for forecast sections, whose title is set at
// render time; for an entity section only when it has a title)
export const sectionShell = (title: string | null, withHead = !!title) => {
  const el = document.createElement("div");
  el.className = "wsec";
  const head = document.createElement("div");
  head.className = "whead";
  head.innerHTML = `<div class="wtitle"></div><div class="wsub"></div>`;
  qs(head, ".wtitle").textContent = title ?? "";
  if (withHead) el.appendChild(head);
  return el;
};
export const setTitle = (el: HTMLElement, title: string, sub = "") => {
  const t = el.querySelector(".wtitle");
  if (t) t.textContent = title;
  const s = el.querySelector(".wsub");
  if (s) s.textContent = sub;
};

// the forecast key and the item (unit, formatting) of a quantity
const KEY: Record<HourlyShow, keyof ForecastEntry> = {
  temperature: "temperature",
  precipitation: "precipitation",
  probability: "precipitation_probability",
  wind: "wind_speed",
};
const itemOf = (cfg: WeatherConfig, q: HourlyShow) =>
  q === "temperature"
    ? cfg.tempIdx
    : q === "precipitation"
      ? cfg.precipIdx
      : q === "probability"
        ? cfg.probIdx
        : cfg.windIdx;
const nameOf = (ctx: RenderCtx, q: HourlyShow) =>
  t(ctx.hass, `weather.${q}` as `weather.${HourlyShow}`);
// the quantity a sparkline / columns plot draws: the section's, else temperature / rain
const plotQuantity = (sec: HourlySection): HourlyShow =>
  sec.quantity ?? (sec.visual === "sparkline" ? "temperature" : "precipitation");
// the head: "Next 12 hours" for the combined section, "Temperature … next 12 h" for a quantity
const setHead = (ctx: RenderCtx, el: HTMLElement, sec: HourlySection) => {
  if (sec.quantity)
    setTitle(
      el,
      sec.title ?? nameOf(ctx, sec.quantity),
      t(ctx.hass, "weather.next_hours_short", { n: sec.hours }),
    );
  else setTitle(el, t(ctx.hass, "weather.next_hours", { n: sec.hours }));
};
export const emptyEl = (text: string) => {
  const d = document.createElement("div");
  d.className = "wempty";
  d.textContent = text;
  return d;
};

// the section element: the head plus a chart or an entity plot
export const buildHourly = (ctx: RenderCtx, cfg: WeatherConfig, sec: HourlySection) => {
  const el = sectionShell(null, true);
  setHead(ctx, el, sec);
  if (sec.visual === "chart") el.appendChild(chartEl());
  else {
    const idx = itemOf(cfg, plotQuantity(sec));
    const ent = cfg.entities[idx];
    el.appendChild(
      plotEl(ctx, ent, idx, modelOf(ctx, ent), {
        kind: sec.visual,
        window: hourlyWindow(ctx.now, sec.hours),
        series: [],
        buckets: Math.max(1, Math.round((sec.hours * 60) / sec.bucketMin)),
        loaded: false,
      }),
    );
  }
  return el;
};

// before the base draws the entity plots: give a plot section its forecast series
export const prepareHourlyPlot = (
  ctx: RenderCtx,
  el: HTMLElement,
  sec: HourlySection,
  fc: ForecastEntry[] | null | undefined,
) => {
  setHead(ctx, el, sec);
  const plot = el.querySelector<PlotElement>(".plot");
  if (!plot) return;
  const window = hourlyWindow(ctx.now, sec.hours);
  const key = KEY[plotQuantity(sec)];
  plot._ctx.window = window;
  plot._ctx.series = forecastPoints(fc, key);
  plot._ctx.loaded = fc !== undefined;
};

// the chart: lanes per `show`, ticks on the clock, tooltip with the condition and the values
export const drawHourly = (
  ctx: RenderCtx,
  el: HTMLElement,
  cfg: WeatherConfig,
  sec: HourlySection,
  fc: ForecastEntry[] | null | undefined,
) => {
  const chart = el.querySelector<ForecastChartEl>(".wchart");
  if (!chart) return;
  setHead(ctx, el, sec);
  el.querySelector(".wempty")?.remove();
  const { t0, t1: end } = hourlyWindow(ctx.now, sec.hours);
  const entries = hoursIn(fc, t0, end);
  if (!entries.length) {
    chart.style.display = "none";
    el.appendChild(
      emptyEl(t(ctx.hass, fc === undefined ? "common.loading" : "weather.no_forecast")),
    );
    return;
  }
  chart.style.display = "";
  const tempEnt = cfg.entities[cfg.tempIdx],
    precipEnt = cfg.entities[cfg.precipIdx],
    probEnt = cfg.entities[cfg.probIdx],
    windEnt = cfg.entities[cfg.windIdx];
  const st = ctx.hass?.states[cfg.entity];
  const tplGet = tplGetter(ctx);
  const tempColor = cssColor(modelOf(ctx, tempEnt).look.color, "var(--primary-color)");
  // the slot one entry stands for (an hour, or whatever the integration delivers)
  let slot = 3600e3;
  for (let i = 1; i < entries.length; i++)
    slot = Math.min(slot, Math.max(60e3, timeOf(entries[i]) - timeOf(entries[i - 1])));
  const pts = (key: keyof ForecastEntry) =>
    forecastPoints(entries, key).flatMap((p) => (p.v === null ? [] : [{ t: p.t, v: p.v }]));
  const fmtTemp = (v: number) => fmtNumber(ctx, tempEnt, v, st),
    fmtRain = (v: number) => fmtNumber(ctx, precipEnt, v, st),
    fmtPct = (v: number) => fmtNumber(ctx, probEnt, v, st),
    fmtWind = (v: number) => fmtNumber(ctx, windEnt, v, st);
  // one lane per quantity; a quantity section names itself in the head, not in the lane
  const lanes: ChartLane[] = sec.show.map((k): ChartLane => {
    const h = LANE_H[k],
      name = nameOf(ctx, k),
      label = sec.quantity ? null : name;
    if (k === "temperature")
      return {
        h,
        label,
        series: [
          {
            pts: pts("temperature"),
            color: tempColor,
            kind: "line",
            fmt: fmtTemp,
            name,
            labels: true,
          },
        ],
      };
    if (k === "precipitation")
      return {
        h,
        label,
        zero: true,
        series: [{ pts: pts("precipitation"), color: RAIN, kind: "columns", fmt: fmtRain, name }],
      };
    if (k === "probability")
      return {
        h,
        label,
        zero: true,
        max: 100,
        series: [
          {
            pts: pts("precipitation_probability"),
            color: RAIN,
            kind: "dots",
            fmt: fmtPct,
            name,
          },
        ],
      };
    return {
      h,
      label,
      zero: true,
      series: [{ pts: pts("wind_speed"), color: WIND, kind: "line", fmt: fmtWind, name }],
    };
  });
  // the window spans the points themselves: the first hour at the left edge, the last at the right
  const t1 = Math.max(timeOf(entries[entries.length - 1]), t0 + slot);
  const step = timeStep(sec.hours),
    dayStep = step >= 12 * 3600e3;
  const ticks = clockTicks(t0, t1, step).map((tk) => ({ t: tk, label: clock(ctx, tk, dayStep) }));
  chart._content = (tt) => {
    const e = entries.find((x) => timeOf(x) === tt);
    if (!e) return null;
    const rows: TipContent["rows"] = [];
    for (const lane of lanes)
      for (const s of lane.series) {
        const p = s.pts.find((x) => x.t === tt);
        if (p) rows.push({ color: s.color, text: s.fmt(p.v), name: s.name });
      }
    const time = fmtTime(ctx.hass, tt, {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    const cond = e.condition ? conditionText(ctx.hass, e.condition) : null;
    const tempAt = typeof e.temperature === "number" ? e.temperature : null;
    const label =
      tempAt === null
        ? null
        : resolveLook(tempEnt, { num: tempAt, raw: String(tempAt), avail: true }, st, tplGet).label;
    return { time, head: [cond, label].filter(Boolean).join(" · ") || null, rows };
  };
  drawChart(chart, { t0, t1, slot, lanes, ticks });
};
