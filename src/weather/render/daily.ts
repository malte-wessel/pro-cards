// The daily section: one row per day with a low → high bar on a shared scale (list), the same
// as vertical bars (columns), or a chart of highs and lows with rain.
import { cssColor } from "../../shared/color.ts";
import { resolveLook } from "../../shared/entity/look.ts";
import {
  fmtNumber,
  modelOf,
  tplGetter,
  unitOf,
  type RenderCtx,
} from "../../shared/entity/model.ts";
import { fmtNumber as fmtNum, fmtTime } from "../../shared/format.ts";
import { t } from "../../shared/i18n.ts";
import { qs } from "../../shared/util.ts";
import type { WeatherConfig, WeatherSection } from "../config.ts";
import { conditionIcon, conditionText } from "../conditions.ts";
import { DAILY_CHART_H, LANE_H } from "../constants.ts";
import { dailyRange, isToday, type Day } from "../forecast.ts";
import { chartEl, drawChart, type ChartLane, type TipContent } from "./chart.ts";
import { emptyEl, sectionShell, setTitle, type ForecastChartEl } from "./hourly.ts";

export type DailySection = Extract<WeatherSection, { kind: "daily" }>;

const RAIN = cssColor("blue", "var(--blue-color)"),
  LOW = "var(--secondary-text-color)";
const DAY = 86400e3;
const midnight = (t: number) => new Date(new Date(t).toDateString()).getTime();

export const buildDaily = (ctx: RenderCtx, sec: DailySection) => {
  const el = sectionShell(t(ctx.hass, "weather.days", { n: sec.days }));
  if (sec.layout === "chart") el.appendChild(chartEl());
  else {
    const body = document.createElement("div");
    body.className = `wdaily layout-${sec.layout}`;
    el.appendChild(body);
  }
  return el;
};

const dayName = (ctx: RenderCtx, d: Day) =>
  isToday(d.t, ctx.now)
    ? t(ctx.hass, "weather.today")
    : fmtTime(ctx.hass, d.t, { weekday: "short" });

export const drawDaily = (
  ctx: RenderCtx,
  el: HTMLElement,
  cfg: WeatherConfig,
  sec: DailySection,
  days: Day[] | null | undefined,
) => {
  setTitle(el, t(ctx.hass, "weather.days", { n: sec.days }));
  el.querySelector(".wempty")?.remove();
  const body = el.querySelector<HTMLElement>(".wdaily, .wchart");
  if (!body) return;
  const list = (days || []).slice(0, sec.days);
  const sub = el.querySelector<HTMLElement>(".wsub");
  if (!list.length) {
    body.style.display = "none";
    if (sub) sub.textContent = "";
    el.appendChild(
      emptyEl(t(ctx.hass, days === undefined ? "common.loading" : "weather.no_forecast")),
    );
    return;
  }
  body.style.display = "";
  const tempEnt = cfg.entities[cfg.tempIdx],
    precipEnt = cfg.entities[cfg.precipIdx];
  const st = ctx.hass?.states[cfg.entity];
  const tplGet = tplGetter(ctx);
  const range = dailyRange(list);
  const unit = unitOf(tempEnt, st);
  if (sub)
    sub.textContent = range
      ? `${fmtNum(ctx.hass, range.min, 0)} – ${fmtNum(ctx.hass, range.max, 0)}${unit ? ` ${unit}` : ""}`
      : "";
  const colorOf = (d: Day) =>
    cssColor(
      d.hi === null
        ? modelOf(ctx, tempEnt).look.color
        : resolveLook(tempEnt, { num: d.hi, raw: String(d.hi), avail: true }, st, tplGet).color,
      "var(--primary-color)",
    );
  const deg = (v: number | null) => (v === null ? "–" : `${fmtNum(ctx.hass, v, 0)}°`);
  const rainText = (d: Day) => {
    const parts: string[] = [];
    if (sec.show.includes("probability") && d.probability !== null)
      parts.push(`${Math.round(d.probability)} %`);
    if (sec.show.includes("precipitation") && d.precipitation !== null && d.precipitation > 0)
      parts.push(fmtNumber(ctx, precipEnt, d.precipitation, st));
    return parts.join(" · ");
  };
  const span = range ? range.max - range.min : 1;
  const pct = (v: number) => `${(((v - (range?.min ?? 0)) / span) * 100).toFixed(1)}%`;
  const showRain = sec.show.length > 0;

  if (sec.layout === "list") {
    body.replaceChildren();
    body.classList.toggle("with-rain", showRain);
    for (const d of list) {
      const row = document.createElement("div");
      row.className = "dayrow";
      if (isToday(d.t, ctx.now)) row.classList.add("today");
      row.style.setProperty("--fe-color", colorOf(d));
      row.innerHTML = `<div class="dname"></div><ha-icon></ha-icon>${showRain ? `<div class="rain"></div>` : ""}<div class="range"><span class="lo"></span><div class="track"><div class="fill"></div></div><span class="hi"></span></div>`;
      qs(row, ".dname").textContent = dayName(ctx, d);
      qs(row, "ha-icon").setAttribute("icon", conditionIcon(d.condition));
      if (showRain) qs(row, ".rain").textContent = rainText(d);
      qs(row, ".lo").textContent = deg(d.lo);
      qs(row, ".hi").textContent = deg(d.hi);
      const fill = qs<HTMLElement>(row, ".fill");
      if (d.lo !== null && d.hi !== null && range) {
        fill.style.left = pct(d.lo);
        fill.style.width = `${Math.max(2, ((d.hi - d.lo) / span) * 100).toFixed(1)}%`;
      } else fill.style.display = "none";
      body.appendChild(row);
    }
    return;
  }
  if (sec.layout === "columns") {
    body.replaceChildren();
    for (const d of list) {
      const col = document.createElement("div");
      col.className = "daycol";
      if (isToday(d.t, ctx.now)) col.classList.add("today");
      col.style.setProperty("--fe-color", colorOf(d));
      col.innerHTML = `<div class="dname"></div><ha-icon></ha-icon><span class="hi"></span><div class="vtrack"><div class="fill"></div></div><span class="lo"></span>${showRain ? `<span class="rain"></span>` : ""}`;
      qs(col, ".dname").textContent = dayName(ctx, d);
      qs(col, "ha-icon").setAttribute("icon", conditionIcon(d.condition));
      qs(col, ".hi").textContent = deg(d.hi);
      qs(col, ".lo").textContent = deg(d.lo);
      if (showRain) qs(col, ".rain").textContent = rainText(d);
      const fill = qs<HTMLElement>(col, ".fill");
      if (d.lo !== null && d.hi !== null && range) {
        fill.style.bottom = pct(d.lo);
        fill.style.height = `${Math.max(2, ((d.hi - d.lo) / span) * 100).toFixed(1)}%`;
      } else fill.style.display = "none";
      body.appendChild(col);
    }
    return;
  }
  // chart: one point per day at its midnight; highs as a line with area, lows dotted
  const chart = body as ForecastChartEl;
  // one point per day, the first at the left edge and the last at the right
  const t0 = midnight(list[0].t),
    t1 = t0 + Math.max(1, list.length - 1) * DAY;
  const at = (i: number) => t0 + i * DAY;
  const hiPts = list.flatMap((d, i) => (d.hi === null ? [] : [{ t: at(i), v: d.hi }])),
    loPts = list.flatMap((d, i) => (d.lo === null ? [] : [{ t: at(i), v: d.lo }])),
    rainPts = list.flatMap((d, i) =>
      d.precipitation === null ? [] : [{ t: at(i), v: d.precipitation }],
    ),
    probPts = list.flatMap((d, i) =>
      d.probability === null ? [] : [{ t: at(i), v: d.probability }],
    );
  const tempColor = cssColor(modelOf(ctx, tempEnt).look.color, "var(--primary-color)");
  const fmtTemp = (v: number) => fmtNumber(ctx, tempEnt, v, st);
  const lanes: ChartLane[] = [
    {
      h: DAILY_CHART_H,
      label: null,
      series: [
        {
          pts: hiPts,
          color: tempColor,
          kind: "line",
          fmt: fmtTemp,
          name: t(ctx.hass, "weather.high"),
          labels: true,
        },
        {
          pts: loPts,
          color: LOW,
          kind: "dots",
          fmt: fmtTemp,
          name: t(ctx.hass, "weather.low"),
          labels: true,
        },
      ],
    },
  ];
  if (sec.show.includes("precipitation"))
    lanes.push({
      h: LANE_H.precipitation,
      label: t(ctx.hass, "weather.precipitation"),
      zero: true,
      series: [
        {
          pts: rainPts,
          color: RAIN,
          kind: "columns",
          fmt: (v) => fmtNumber(ctx, precipEnt, v, st),
          name: t(ctx.hass, "weather.precipitation"),
        },
      ],
    });
  if (sec.show.includes("probability"))
    lanes.push({
      h: LANE_H.probability,
      label: t(ctx.hass, "weather.probability"),
      zero: true,
      max: 100,
      series: [
        {
          pts: probPts,
          color: RAIN,
          kind: "dots",
          fmt: (v) => `${Math.round(v)} %`,
          name: t(ctx.hass, "weather.probability"),
        },
      ],
    });
  // day names under the points (the middle of each day), no gridlines between the days
  const ticks = list.map((d, i) => ({ t: at(i), label: dayName(ctx, d) }));
  chart._content = (tt) => {
    const i = Math.round((tt - t0) / DAY),
      d = list[i];
    if (!d) return null;
    const rows: TipContent["rows"] = [];
    for (const lane of lanes)
      for (const s of lane.series) {
        const p = s.pts.find((x) => x.t === tt);
        if (p) rows.push({ color: s.color, text: s.fmt(p.v), name: s.name });
      }
    return {
      time: fmtTime(ctx.hass, d.t, { weekday: "long", day: "numeric", month: "short" }),
      head: d.condition ? conditionText(ctx.hass, d.condition) : null,
      rows,
    };
  };
  drawChart(chart, { t0, t1, slot: DAY, lanes, ticks, tickLines: false });
};
