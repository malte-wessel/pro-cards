// The forecast section: one row (vertical) or one column (horizontal) per day or hour. Days
// carry a low → high bar on a scale every day shares; hours show their temperature.
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
import { isNight } from "../conditions.ts";
import { conditionEl } from "./icon.ts";
import { dailyRange, hourStart, isToday, type ForecastRow } from "../forecast.ts";
import { emptyEl, sectionShell, setTitle } from "./section.ts";

export type ForecastSection = Extract<WeatherSection, { kind: "forecast" }>;

export const forecastTitle = (ctx: RenderCtx, sec: ForecastSection) =>
  sec.title ??
  (sec.mode === "hourly"
    ? t(ctx.hass, "weather.next_hours", { n: sec.count })
    : t(ctx.hass, "weather.days", { n: sec.count }));

export const buildForecast = (ctx: RenderCtx, sec: ForecastSection) => {
  const el = sectionShell(forecastTitle(ctx, sec));
  const body = document.createElement("div");
  body.className = `wfc layout-${sec.layout} mode-${sec.mode}`;
  el.appendChild(body);
  return el;
};

export const drawForecast = (
  ctx: RenderCtx,
  el: HTMLElement,
  cfg: WeatherConfig,
  sec: ForecastSection,
  rows: ForecastRow[] | null | undefined,
) => {
  setTitle(el, forecastTitle(ctx, sec));
  el.querySelector(".wempty")?.remove();
  const body = el.querySelector<HTMLElement>(".wfc");
  if (!body) return;
  const list = (rows || []).slice(0, sec.count);
  const sub = el.querySelector<HTMLElement>(".wsub");
  if (!list.length) {
    body.style.display = "none";
    if (sub) sub.textContent = "";
    el.appendChild(
      emptyEl(t(ctx.hass, rows === undefined ? "common.loading" : "weather.no_forecast")),
    );
    return;
  }
  body.style.display = "";
  const daily = sec.mode === "daily";
  const tempEnt = cfg.entities[sec.tempIdx],
    condEnt = cfg.entities[sec.condIdx],
    precipEnt = cfg.entities[cfg.precipIdx],
    probEnt = cfg.entities[cfg.probIdx];
  const st = ctx.hass?.states[cfg.entity];
  const tplGet = tplGetter(ctx);
  const range = dailyRange(list);
  const unit = unitOf(tempEnt, st);
  if (sub)
    sub.textContent = range
      ? `${fmtNum(ctx.hass, range.min, 0)} – ${fmtNum(ctx.hass, range.max, 0)}${unit ? ` ${unit}` : ""}`
      : "";
  const colorOf = (r: ForecastRow) =>
    cssColor(
      r.hi === null
        ? modelOf(ctx, tempEnt).look.color
        : resolveLook(tempEnt, { num: r.hi, raw: String(r.hi), avail: true }, st, tplGet).color,
      "var(--primary-color)",
    );
  // the condition rules of the section pick the row's icon and icon colour
  const condLook = (r: ForecastRow) =>
    r.condition
      ? resolveLook(condEnt, { num: null, raw: r.condition, avail: true }, st, tplGet)
      : null;
  const night = isNight(ctx.hass);
  const setCondition = (el: HTMLElement, r: ForecastRow) => {
    const look = condLook(r);
    qs(el, ".ficon").replaceChildren(conditionEl(sec.icons, r.condition, night, look?.icon));
    const c = look?.rule?.color;
    el.style.setProperty(
      "--fe-cond",
      c ? cssColor(c, "var(--secondary-text-color)") : "var(--secondary-text-color)",
    );
  };
  const deg = (v: number | null) => (v === null ? "–" : `${fmtNum(ctx.hass, v, 0)}°`);
  const temp = (v: number | null) => (v === null ? "–" : fmtNumber(ctx, tempEnt, v, st));
  const rainText = (r: ForecastRow) => {
    const parts: string[] = [];
    if (sec.show.includes("probability") && r.probability !== null)
      parts.push(fmtNumber(ctx, probEnt, r.probability, st));
    if (sec.show.includes("precipitation") && r.precipitation !== null && r.precipitation > 0)
      parts.push(fmtNumber(ctx, precipEnt, r.precipitation, st));
    return parts.join(" · ");
  };
  const label = (r: ForecastRow) =>
    daily
      ? isToday(r.t, ctx.now)
        ? t(ctx.hass, "weather.today")
        : fmtTime(ctx.hass, r.t, { weekday: "short" })
      : fmtTime(ctx.hass, r.t);
  const isNow = (r: ForecastRow) => (daily ? isToday(r.t, ctx.now) : r.t === hourStart(ctx.now));
  const span = range ? range.max - range.min : 1;
  const pct = (v: number) => `${(((v - (range?.min ?? 0)) / span) * 100).toFixed(1)}%`;
  const showRain = sec.show.length > 0;
  body.replaceChildren();
  body.classList.toggle("with-rain", showRain);
  body.style.setProperty("--fe-icon", `${sec.iconSize}px`);

  if (sec.layout === "vertical") {
    for (const r of list) {
      const row = document.createElement("div");
      row.className = "frow";
      if (isNow(r)) row.classList.add("today");
      row.style.setProperty("--fe-color", colorOf(r));
      row.innerHTML = daily
        ? `<div class="fname"></div><div class="ficon"></div>${showRain ? `<div class="rain"></div>` : ""}<div class="range"><span class="lo"></span><div class="track"><div class="fill"></div></div><span class="hi"></span></div>`
        : `<div class="fname"></div><div class="ficon"></div>${showRain ? `<div class="rain"></div>` : ""}<div class="ftemp"></div>`;
      qs(row, ".fname").textContent = label(r);
      setCondition(row, r);
      if (showRain) qs(row, ".rain").textContent = rainText(r);
      if (daily) {
        qs(row, ".lo").textContent = deg(r.lo);
        qs(row, ".hi").textContent = deg(r.hi);
        const fill = qs<HTMLElement>(row, ".fill");
        if (r.lo !== null && r.hi !== null && range) {
          fill.style.left = pct(r.lo);
          fill.style.width = `${Math.max(2, ((r.hi - r.lo) / span) * 100).toFixed(1)}%`;
        } else fill.style.display = "none";
      } else qs(row, ".ftemp").textContent = temp(r.hi);
      body.appendChild(row);
    }
    return;
  }
  for (const r of list) {
    const col = document.createElement("div");
    col.className = "fcol";
    if (isNow(r)) col.classList.add("today");
    col.style.setProperty("--fe-color", colorOf(r));
    col.innerHTML = daily
      ? `<div class="fname"></div><div class="ficon"></div><span class="hi"></span><div class="vtrack"><div class="fill"></div></div><span class="lo"></span>${showRain ? `<span class="rain"></span>` : ""}`
      : `<div class="fname"></div><div class="ficon"></div><span class="hi"></span>${showRain ? `<span class="rain"></span>` : ""}`;
    qs(col, ".fname").textContent = label(r);
    setCondition(col, r);
    qs(col, ".hi").textContent = daily ? deg(r.hi) : temp(r.hi);
    if (showRain) qs(col, ".rain").textContent = rainText(r);
    if (daily) {
      qs(col, ".lo").textContent = deg(r.lo);
      const fill = qs<HTMLElement>(col, ".fill");
      if (r.lo !== null && r.hi !== null && range) {
        fill.style.bottom = pct(r.lo);
        fill.style.height = `${Math.max(2, ((r.hi - r.lo) / span) * 100).toFixed(1)}%`;
      } else fill.style.display = "none";
    }
    body.appendChild(col);
  }
};
