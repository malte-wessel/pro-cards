// The trend section: the multi trend plot of the forecast, one line per quantity over the next
// hours, or over the next days (the temperature as high and low).
import { cssColor } from "../../shared/color.ts";
import { resolveLook } from "../../shared/entity/look.ts";
import {
  fmtNumber,
  modelOf,
  tplGetter,
  unitOf,
  type RenderCtx,
} from "../../shared/entity/model.ts";
import { fmtTime } from "../../shared/format.ts";
import type { ForecastEntry } from "../../shared/ha.ts";
import { t } from "../../shared/i18n.ts";
import {
  drawTrend,
  trendPlotEl,
  type TrendPlotEl,
  type TrendSeries,
} from "../../shared/trend/plot.ts";
import type { TrendEntry, WeatherConfig, WeatherSection } from "../config.ts";
import { conditionText } from "../conditions.ts";
import { QUANTITY_COLOR, type Quantity } from "../constants.ts";
import { forecastPoints, hourlyWindow, hoursIn, timeOf, type Day } from "../forecast.ts";
import { emptyEl, sectionShell, setTitle } from "./section.ts";

export type TrendSection = Extract<WeatherSection, { kind: "trend" }>;
// a forecast plot knows what to say about the point under the pointer (the condition)
export interface ForecastTrendEl extends TrendPlotEl {
  _head?: (t: number) => string | null;
}

const DAY = 86400e3;
const midnight = (t: number) => new Date(new Date(t).toDateString()).getTime();
const KEY: Record<Quantity, keyof ForecastEntry> = {
  temperature: "temperature",
  precipitation: "precipitation",
  probability: "precipitation_probability",
  wind: "wind_speed",
};
export const itemOf = (cfg: WeatherConfig, sec: TrendSection, q: Quantity) =>
  q === "temperature"
    ? sec.tempIdx
    : q === "precipitation"
      ? cfg.precipIdx
      : q === "probability"
        ? cfg.probIdx
        : cfg.windIdx;
const quantityName = (ctx: RenderCtx, q: Quantity) =>
  t(ctx.hass, `weather.${q}` as `weather.${Quantity}`);
const entryName = (ctx: RenderCtx, e: TrendEntry) => e.name ?? quantityName(ctx, e.quantity);
// the colour of a line: its own, else the temperature rule colour / the quantity's default
const colorOf = (ctx: RenderCtx, cfg: WeatherConfig, sec: TrendSection, e: TrendEntry) =>
  cssColor(
    e.color ??
      (e.quantity === "temperature"
        ? modelOf(ctx, cfg.entities[sec.tempIdx]).look.color
        : QUANTITY_COLOR[e.quantity]),
    "var(--primary-color)",
  );
// the legend rows under the head (overlay with several series only, like the multi trend card)
const fillLegend = (legend: HTMLElement, series: TrendSeries[], show: boolean) => {
  legend.textContent = "";
  legend.style.display = show ? "" : "none";
  if (!show) return;
  for (const s of series) {
    const span = document.createElement("span");
    const bar = document.createElement("i");
    bar.style.setProperty("--c", s.color);
    const nm = document.createElement("em");
    nm.textContent = s.name;
    span.append(bar, nm);
    legend.appendChild(span);
  }
};
export const trendTitle = (ctx: RenderCtx, sec: TrendSection) =>
  sec.title ??
  (sec.mode === "hourly"
    ? t(ctx.hass, "weather.next_hours", { n: sec.count })
    : t(ctx.hass, "weather.days", { n: sec.count }));

export const buildTrend = (ctx: RenderCtx, sec: TrendSection) => {
  const el = sectionShell(trendTitle(ctx, sec));
  const legend = document.createElement("div");
  legend.className = "legend";
  el.append(legend, trendPlotEl("trend"));
  return el;
};

// the series of an hourly trend: one per quantity, points on the hours
const hourlySeries = (
  ctx: RenderCtx,
  cfg: WeatherConfig,
  sec: TrendSection,
  entries: ForecastEntry[],
): TrendSeries[] => {
  const st = ctx.hass?.states[cfg.entity];
  return sec.show.map((e) => {
    const ent = cfg.entities[itemOf(cfg, sec, e.quantity)];
    return {
      pts: forecastPoints(entries, KEY[e.quantity]).flatMap((p) =>
        p.v === null ? [] : [{ t: p.t, v: p.v }],
      ),
      color: colorOf(ctx, cfg, sec, e),
      name: entryName(ctx, e),
      fmt: (v) => fmtNumber(ctx, ent, v, st),
    };
  });
};
// the series of a daily trend: the temperature as high and low sharing one lane, the rest one
// line each; points at the days' midnights
const dailySeries = (
  ctx: RenderCtx,
  cfg: WeatherConfig,
  sec: TrendSection,
  days: Day[],
  t0: number,
): TrendSeries[] => {
  const st = ctx.hass?.states[cfg.entity];
  const pts = (of: (d: Day) => number | null) =>
    days.flatMap((d, i) => {
      const v = of(d);
      return v === null ? [] : [{ t: t0 + i * DAY, v }];
    });
  const out: TrendSeries[] = [];
  sec.show.forEach((e, lane) => {
    const ent = cfg.entities[itemOf(cfg, sec, e.quantity)];
    const fmt = (v: number) => fmtNumber(ctx, ent, v, st);
    const color = colorOf(ctx, cfg, sec, e);
    if (e.quantity === "temperature") {
      const name = entryName(ctx, e);
      out.push(
        {
          pts: pts((d) => d.hi),
          color,
          name: e.name ? name : t(ctx.hass, "weather.high"),
          fmt,
          lane,
        },
        {
          pts: pts((d) => d.lo),
          color: "var(--secondary-text-color)",
          name: t(ctx.hass, "weather.low"),
          fmt,
          lane,
        },
      );
    } else if (e.quantity === "precipitation")
      out.push({ pts: pts((d) => d.precipitation), color, name: entryName(ctx, e), fmt, lane });
    else if (e.quantity === "probability")
      out.push({ pts: pts((d) => d.probability), color, name: entryName(ctx, e), fmt, lane });
    else out.push({ pts: pts((d) => d.wind), color, name: entryName(ctx, e), fmt, lane });
  });
  return out;
};

export const drawTrendSection = (
  ctx: RenderCtx,
  el: HTMLElement,
  cfg: WeatherConfig,
  sec: TrendSection,
  hourly: ForecastEntry[] | null | undefined,
  days: Day[] | null | undefined,
) => {
  const chart = el.querySelector<ForecastTrendEl>(".trend"),
    legend = el.querySelector<HTMLElement>(".legend");
  if (!chart || !legend) return;
  setTitle(el, trendTitle(ctx, sec));
  el.querySelector(".wempty")?.remove();
  const st = ctx.hass?.states[cfg.entity];
  const tplGet = tplGetter(ctx);
  const tempEnt = cfg.entities[sec.tempIdx],
    condEnt = cfg.entities[sec.condIdx];
  // the tooltip head: the condition, the condition rule's label and the temperature rule's
  const condLabel = (cond: string | null | undefined, temp: number | null | undefined) => {
    const c = cond ? conditionText(ctx.hass, cond) : null;
    const cl = cond
      ? resolveLook(condEnt, { num: null, raw: cond, avail: true }, st, tplGet).label
      : null;
    const label =
      typeof temp === "number"
        ? resolveLook(tempEnt, { num: temp, raw: String(temp), avail: true }, st, tplGet).label
        : null;
    return [c, cl, label].filter(Boolean).join(" · ") || null;
  };
  let series: TrendSeries[],
    t0: number,
    t1: number,
    loading: boolean,
    timeFmt: ((t: number) => string) | undefined;
  if (sec.mode === "hourly") {
    const w = hourlyWindow(ctx.now, sec.count);
    const entries = hoursIn(hourly, w.t0, w.t1);
    loading = hourly === undefined;
    series = entries.length ? hourlySeries(ctx, cfg, sec, entries) : [];
    t0 = w.t0;
    // the window spans the points themselves: the first hour at the left edge, the last at the right
    t1 = entries.length ? Math.max(timeOf(entries[entries.length - 1]), t0 + 3600e3) : w.t1;
    chart._head = (tt) => {
      const e = entries.find((x) => timeOf(x) === tt);
      return e ? condLabel(e.condition, e.temperature) : null;
    };
  } else {
    const list = (days || []).slice(0, sec.count);
    loading = days === undefined;
    t0 = list.length ? midnight(list[0].t) : ctx.now;
    t1 = t0 + Math.max(1, list.length - 1) * DAY;
    series = list.length ? dailySeries(ctx, cfg, sec, list, t0) : [];
    timeFmt = (tt) => fmtTime(ctx.hass, tt, { weekday: "long", day: "numeric", month: "short" });
    chart._head = (tt) => {
      const d = list[Math.round((tt - t0) / DAY)];
      return d ? condLabel(d.condition, d.hi) : null;
    };
  }
  if (!series.some((s) => s.pts.length)) {
    chart.style.display = "none";
    legend.style.display = "none";
    el.appendChild(emptyEl(t(ctx.hass, loading ? "common.loading" : "weather.no_forecast")));
    return;
  }
  chart.style.display = "";
  // auto: overlay when every shown quantity has the same unit, else lanes (the multi trend rule)
  const units = new Set(
    sec.show.map((e) => unitOf(cfg.entities[itemOf(cfg, sec, e.quantity)], st)),
  );
  const layout = sec.layout === "auto" ? (units.size <= 1 ? "overlay" : "lanes") : sec.layout;
  fillLegend(legend, series, sec.showLegend && sec.show.length > 1 && layout === "overlay");
  drawTrend(chart, {
    hass: ctx.hass,
    t0,
    t1,
    layout,
    xAxis: sec.xAxis,
    yAxis: sec.yAxis,
    series,
    timeFmt,
  });
};
