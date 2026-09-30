// The trend plot: several series as smooth lines with a soft area, overlaid on one scale or in
// lanes with one scale each, optional time / value axes with gridlines and a crosshair tooltip.
// Used by the multi trend card (history) and the weather card (forecasts). Layout results the
// hover needs (scales, x mapping, gutter) stay on the plot element.
import { fmtNumber, fmtTime, textWidth } from "../format.ts";
import type { HomeAssistant } from "../ha.ts";
import { bucketMean, clampedSeries, smoothPath, type MeanBucket } from "../history.ts";
import { nearestPoint, placeTip } from "../hover.ts";
import { clockTicks, timeStep } from "../ticks.ts";
import { qs } from "../util.ts";
import {
  LANE_LABEL_H,
  LANE_PLOT_H,
  OVERLAY_PLOT_H,
  X_AXIS_H,
  decimalsForStep,
  mkScale,
  niceStep,
  rangeOf,
  type Scale,
} from "./scale.ts";

export interface TrendPoint {
  t: number;
  v: number;
}
export type SampledPoint = TrendPoint | MeanBucket;
export interface TrendSeries {
  pts: TrendPoint[];
  color: string; // a CSS colour
  name: string;
  fmt: (v: number) => string;
  lane?: number; // lanes layout: series with the same lane share one (default: its own)
}
export interface TrendSpec {
  hass: HomeAssistant | undefined;
  t0: number;
  t1: number;
  layout: "overlay" | "lanes";
  xAxis: boolean;
  yAxis: boolean;
  series: TrendSeries[];
  timeFmt?: (t: number) => string; // tooltip time (default: clock, with the weekday if not today)
}
export interface TrendPlotEl extends HTMLDivElement {
  _spec?: TrendSpec;
  _sampled?: SampledPoint[][];
  _scales?: Scale[]; // one per lane (overlay: one)
  _laneOf?: number[]; // series index → lane index
  _xOf?: (t: number) => number;
  _gutter?: number;
  _plotW?: number;
}

// the plot element; the multi trend card keeps the `plot` class it always had, a card that also
// draws entity plots (which are `.plot` too) passes `trend` alone
export const trendPlotEl = (className = "plot trend"): TrendPlotEl => {
  const el = document.createElement("div") as TrendPlotEl;
  el.className = className;
  el.innerHTML = `<svg preserveAspectRatio="none"></svg><div class="lanes"></div><div class="axes"></div><div class="tip"></div>`;
  return el;
};

const fmtDay = (hass: HomeAssistant | undefined, t: number) =>
  fmtTime(hass, t, { weekday: "short" });
// time of day; with the weekday when `t` is not today (tooltips), never for axis labels (`short`)
const fmtClock = (hass: HomeAssistant | undefined, t: number, short?: boolean) => {
  const d = new Date(t);
  const sameDay = short || d.toDateString() === new Date().toDateString();
  return fmtTime(
    hass,
    t,
    sameDay
      ? { hour: "2-digit", minute: "2-digit" }
      : { weekday: "short", hour: "2-digit", minute: "2-digit" },
  );
};

// the lane of every series: overlay → all 0; lanes → by `lane` key in order of appearance
const lanesOf = (spec: TrendSpec): number[] => {
  if (spec.layout === "overlay") return spec.series.map(() => 0);
  const keys: number[] = [];
  return spec.series.map((s, i) => {
    const k = s.lane ?? -1 - i;
    let li = keys.indexOf(k);
    if (li < 0) {
      keys.push(k);
      li = keys.length - 1;
    }
    return li;
  });
};

export const drawTrend = (plot: TrendPlotEl, spec: TrendSpec) => {
  const { hass, t0, t1: now, series } = spec;
  const svg = qs<SVGSVGElement>(plot, "svg");
  const laneOf = lanesOf(spec);
  const n = Math.max(1, ...laneOf.map((l) => l + 1));
  const lanes = spec.layout === "lanes";
  const W = Math.max(plot.clientWidth, 10);
  const laneH = lanes ? LANE_PLOT_H : OVERLAY_PLOT_H;
  const plotH = laneH * n;
  const showX = spec.xAxis,
    showY = spec.yAxis;
  const H = plotH + (showX ? X_AXIS_H : 0);
  plot.style.height = `${H}px`;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  plot._spec = spec;
  plot._laneOf = laneOf;
  // The plot grows with the card (a tall grid cell stretches it) and the SVG stretches along,
  // so vertical positions of the HTML labels are percentages of H, not pixels
  const pct = (y: number) => `${((y / H) * 100).toFixed(3)}%`;

  // Clamp to the window so line and fill always start and end exactly at the plot edges, then
  // downsample to ~1 point per 2px (bucket mean) when there are more points than buckets
  const nb = Math.max(1, Math.floor(W / 2));
  const sampled = series.map((s) => {
    const pts = clampedSeries(s.pts, t0, now);
    return pts.length <= nb ? pts : bucketMean(pts, t0, now, nb);
  });
  plot._sampled = sampled;

  // Scales: one per lane over the series it holds
  const scales: Scale[] = [];
  for (let li = 0; li < n; li++) {
    const mine = sampled.filter((_, i) => laneOf[i] === li);
    scales.push(
      lanes
        ? mkScale(...rangeOf(mine), li * laneH, laneH, LANE_LABEL_H)
        : mkScale(...rangeOf(mine), 0, laneH, 6),
    );
  }
  plot._scales = scales;

  // Y ticks (per scale) and the left gutter needed for their labels
  const yTicks = showY
    ? scales.map((sc) => {
        const step = niceStep(sc.max - sc.min, lanes ? 2 : 3);
        const dec = decimalsForStep(step);
        const ticks: { v: number; y: number; label: string }[] = [];
        for (let v = Math.ceil(sc.min / step) * step; v <= sc.max + 1e-9; v += step) {
          const y = sc.y(v);
          if (y < sc.top + sc.topPad - 1 || y > sc.top + sc.h - 5) continue; // stay inside the drawable band
          ticks.push({ v, y, label: fmtNumber(hass, v === 0 ? 0 : v, dec) });
        }
        return ticks;
      })
    : [];
  let gutter = 0;
  yTicks.forEach((ts) =>
    ts.forEach((tk) => {
      gutter = Math.max(gutter, textWidth(tk.label));
    }),
  );
  if (showY) gutter = Math.ceil(gutter) + 8;
  const PW = W - gutter;
  const xOf = (t: number) => gutter + ((t - t0) / (now - t0)) * PW;
  plot._xOf = xOf;
  plot._gutter = gutter;
  plot._plotW = PW;

  // Build SVG
  let html = "";
  if (lanes)
    for (let li = 1; li < n; li++)
      html += `<line class="lane-sep" x1="${gutter}" x2="${W}" y1="${li * laneH + 0.5}" y2="${li * laneH + 0.5}"/>`;
  // Axes: recessive hairline gridlines in the SVG, labels as HTML
  const axes = qs(plot, ".axes");
  axes.textContent = "";
  const addLabel = (cls: string, txt: string, left: number, top: string, width?: number) => {
    const el = document.createElement("div");
    el.className = `axis-label ${cls}`;
    el.textContent = txt;
    el.style.left = `${left}px`;
    el.style.top = top;
    if (width) el.style.width = `${width}px`;
    axes.appendChild(el);
  };
  if (showY) {
    yTicks.forEach((ts) =>
      ts.forEach((tk) => {
        const y = Math.round(tk.y) + 0.5;
        html += `<line class="grid" x1="${gutter}" x2="${W}" y1="${y}" y2="${y}"/>`;
        addLabel("y", tk.label, 0, pct(tk.y), gutter - 6);
      }),
    );
  }
  if (showX) {
    const hours = (now - t0) / 3600e3;
    const step = timeStep(hours);
    const xTicks: { t: number; x: number }[] = [];
    for (const t of clockTicks(t0, now, step)) {
      const x = xOf(t);
      if (x - gutter < -0.5) continue;
      xTicks.push({ t, x });
      if (x - gutter < 1) continue; // a gridline on the plot's edge is invisible
      const xr = Math.round(x) + 0.5;
      html += `<line class="grid" x1="${xr}" x2="${xr}" y1="0" y2="${plotH}"/>`;
    }
    const dayStep = step >= 24 * 3600e3;
    let lastShownX = -Infinity;
    xTicks.forEach((tk) => {
      const label = dayStep ? fmtDay(hass, tk.t) : fmtClock(hass, tk.t, true);
      const w = textWidth(label);
      if (tk.x - lastShownX < w + 8) return; // would collide with the previous label
      let cls = "x";
      if (tk.x - w / 2 < gutter) cls += " first";
      else if (tk.x + w / 2 > W) cls += " last";
      addLabel(cls, label, tk.x, `calc(${pct(plotH)} + 3px)`);
      lastShownX = tk.x;
    });
  }
  sampled.forEach((pts, i) => {
    const sc = scales[laneOf[i]];
    const col = series[i].color;
    const xy = pts.map((p) => [+xOf(p.t).toFixed(1), +sc.y(p.v).toFixed(1)]);
    if (xy.length === 0) return;
    const d = smoothPath(xy);
    const base = sc.top + sc.h;
    const area = `${d} L${xy[xy.length - 1][0]},${base} L${xy[0][0]},${base} Z`;
    html += `<path class="area" d="${area}" fill="${col}"/>`;
    html += `<path class="line" d="${d}" stroke="${col}"/>`;
  });
  // Hover layer
  html += `<g class="hover"><line class="hair" y1="0" y2="${plotH}"/>`;
  series.forEach((s) => {
    html += `<circle class="dot" r="4" fill="${s.color}"/>`;
  });
  html += `</g>`;
  svg.innerHTML = html;

  // Lane labels as HTML so long names clip with an ellipsis inside their lane
  const laneEls = qs(plot, ".lanes");
  laneEls.textContent = "";
  if (lanes)
    for (let li = 0; li < n; li++) {
      const lbl = document.createElement("div");
      lbl.className = "lane-label";
      lbl.style.top = `calc(${pct(li * laneH)} + 3px)`;
      lbl.style.left = `${gutter + 4}px`;
      lbl.style.maxWidth = `calc(100% - ${gutter + 8}px)`;
      lbl.textContent = series
        .filter((_, i) => laneOf[i] === li)
        .map((s) => s.name)
        .join(" / ");
      laneEls.appendChild(lbl);
    }
};

// the window time under a pointer event on the plot
export const trendTimeAt = (plot: TrendPlotEl, ev: PointerEvent): number | null => {
  const spec = plot._spec;
  if (!spec || !plot._sampled || !plot._xOf) return null;
  const rect = plot.getBoundingClientRect();
  const x = ev.clientX - rect.left - (plot._gutter || 0);
  return spec.t0 + (x / (plot._plotW || rect.width)) * (spec.t1 - spec.t0);
};

// crosshair, dots and tooltip at window time t; `head` adds a line under the time. Returns false
// when there is nothing to show
export const showTrendHover = (
  plot: TrendPlotEl,
  t: number,
  head?: (t: number) => string | null,
): boolean => {
  const spec = plot._spec,
    scales = plot._scales,
    laneOf = plot._laneOf,
    xOf = plot._xOf;
  const svg = qs<SVGSVGElement>(plot, "svg");
  const g = svg.querySelector<SVGGElement>(".hover");
  const tip = qs(plot, ".tip");
  if (!spec || !g || !plot._sampled || !scales || !laneOf || !xOf) return true;

  // Snap x to the nearest point across all series
  let snapT: number | null = null,
    best = Infinity;
  const picks = plot._sampled.map((pts) => nearestPoint(pts, t));
  picks.forEach((p) => {
    if (p && Math.abs(p.t - t) < best) {
      best = Math.abs(p.t - t);
      snapT = p.t;
    }
  });
  if (snapT === null) return false;
  const xs = xOf(snapT);

  g.classList.add("on");
  const hair = qs(g, ".hair");
  hair.setAttribute("x1", String(xs));
  hair.setAttribute("x2", String(xs));
  const dots = g.querySelectorAll<SVGCircleElement>(".dot");
  picks.forEach((p, i) => {
    const dot = dots[i];
    if (!p) {
      dot.style.display = "none";
      return;
    }
    const sc = scales[laneOf[i]];
    dot.style.display = "";
    dot.setAttribute("cx", xOf(p.t).toFixed(1));
    dot.setAttribute("cy", sc.y(p.v).toFixed(1));
  });

  // Tooltip content
  tip.textContent = "";
  const time = document.createElement("div");
  time.className = "time";
  time.textContent = spec.timeFmt ? spec.timeFmt(snapT) : fmtClock(spec.hass, snapT);
  tip.appendChild(time);
  const h = head?.(snapT);
  if (h) {
    const el = document.createElement("div");
    el.className = "head";
    el.textContent = h;
    tip.appendChild(el);
  }
  picks.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "row";
    const key = document.createElement("i");
    key.style.setProperty("--c", spec.series[i].color);
    const val = document.createElement("b");
    val.textContent = p ? spec.series[i].fmt(p.v) : "—";
    const name = document.createElement("span");
    name.textContent = spec.series[i].name;
    row.append(key, val, name);
    tip.appendChild(row);
  });
  tip.classList.add("on");
  placeTip(plot, tip, xs, plot._gutter || 0);
  return true;
};
