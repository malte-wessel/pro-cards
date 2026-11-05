// History plots: sparkline, columns and strip, plus the hover tooltip.
import { cssColor } from "../../color.ts";
import type { HassEntity } from "../../ha.ts";
import {
  bucketLast,
  bucketMean,
  clampedSeries,
  lineBuckets,
  lineMeans,
  smoothPath,
  type LastBucket,
  type MeanBucket,
  type Point,
} from "../../history.ts";
import { nearestPoint, placeTip } from "../../hover.ts";
import { t as tr } from "../../i18n.ts";
import { measure } from "../../typography.ts";
import { qs, startOfDay } from "../../util.ts";
import type { EntityItem } from "../config.ts";
import { PLOT_H, type HistoryVisual } from "../constants.ts";
import { resolveLook } from "../look.ts";
import { fmtNumber, fmtTime, tplGetter, type RenderCtx } from "../model.ts";

// what a plot element knows about itself: entity, index, kind, state and height. The optional
// keys let a card plot something else than the entity's history window (a forecast: its own
// series over a forward window, a fixed bucket count and its own loading state).
export interface PlotCtx {
  ent: EntityItem;
  idx: number;
  kind: HistoryVisual;
  st: HassEntity | undefined;
  window?: { t0: number; t1: number };
  series?: Point[];
  buckets?: number;
  loaded?: boolean;
  // a plot's own window (hours back, or since midnight), bucket and smoothing (the v3 cards'
  // visual), and its axes
  hours?: number | "today";
  bucketMin?: number;
  smoothMin?: number;
  axis?: boolean;
}
// the window a plot draws: the one it brought, else its own hours back (or since midnight), else
// the card's history window
export const windowOf = (ctx: RenderCtx, plot: PlotElement) => {
  const c = plot._ctx;
  if (c.window) return c.window;
  if (c.hours === "today") return { t0: startOfDay(ctx.now), t1: ctx.now };
  if (typeof c.hours === "number") return { t0: ctx.now - c.hours * 3600e3, t1: ctx.now };
  return { t0: ctx.t0, t1: ctx.now };
};
// the plot element carries its render context and the layout results the hover needs
export interface PlotElement extends HTMLDivElement {
  _ctx: PlotCtx;
  _xOf?: (t: number) => number;
  _yOf?: (v: number) => number;
  _W?: number;
  _sampled?: MeanBucket[] | null;
  _buckets?: (MeanBucket | LastBucket | null)[] | null;
  _bw?: number;
  _hlOff?: number; // x offset of the hover highlight inside a bucket slot
  _peak?: number;
  _numeric?: boolean;
}

// a text label over a plot at (left, top), `width` wide when given (a right-aligned y label)
export const addLabel = (
  container: HTMLElement,
  cls: string,
  txt: string,
  left: number,
  top: number,
  width?: number,
) => {
  const el = document.createElement("div");
  el.className = `label ${cls}`;
  el.textContent = txt;
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
  if (width) el.style.width = `${width}px`;
  container.appendChild(el);
};

// the labels' distance from the plot's sides: a plot runs to the card's edges, its labels keep to
// the card's padding
const INSET = 12;
// `axis: true` (the v3 cards' visual): faint lines at the scale's top and bottom with their values
// on the left, the window's start and now on the right (top and bottom). Labels lie over the plot;
// a plot too short for two lines of them shows the top value and now alone
const axisLabels = (
  ctx: RenderCtx,
  plot: PlotElement,
  labels: HTMLElement,
  lines: { v: number; y: number }[],
  W: number,
  H: number,
  t0: number,
  now: number,
): string => {
  if (!plot._ctx.axis) return "";
  const fmt = (v: number) => fmtNumber(ctx, plot._ctx.ent, v, plot._ctx.st);
  const line = measure(ctx.text, labels, ["label"], [10, 12]).line;
  const both = H >= line * 3;
  let html = "";
  lines.forEach(({ v, y }, i) => {
    html += `<line class="grid" x1="0" x2="${W}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
    if (i > 0 && !both) return;
    const top = i === 0 ? y + 1 : y - line - 1;
    addLabel(labels, "axis", fmt(v), INSET, Math.max(0, Math.min(H - line, top)));
  });
  const n = Math.round((now - t0) / 3600e3);
  if (both) addLabel(labels, "axis right", tr(ctx.hass, "common.minus_hours", { n }), W - INSET, 1);
  addLabel(labels, "axis right", tr(ctx.hass, "common.now"), W - INSET, H - line - 2);
  return html;
};

// ctx also needs { cfg, series, fetched, now, t0 }; `size` is the plot's box when the caller
// measured it already (the card reads every plot first, so drawing them costs one layout)
export const drawPlot = (ctx: RenderCtx, plot: PlotElement, size?: { w: number; h: number }) => {
  const { ent, kind } = plot._ctx;
  const svg = qs<SVGSVGElement>(plot, "svg"),
    labels = qs(plot, ".labels");
  const W = Math.max(size?.w ?? plot.clientWidth, 10);
  if (W < 20) return; // not laid out yet; the ResizeObserver re-renders once the width is known
  // a growing plot is drawn at the height it has (its own as the basis, more or less in a cell
  // with fixed rows), never stretched to it: that would turn the dots into ellipses
  const grow = plot.classList.contains("grow");
  const H = (grow && (size?.h ?? plot.clientHeight)) || PLOT_H[kind];
  // a strip keeps its own height: the timeline and its labels below (STRIP_AXIS_CSS), whose line
  // follows the theme's text
  const labelLine = () => measure(ctx.text, labels, ["label"], [10, 12]).line;
  svg.setAttribute("viewBox", `0 0 ${W} ${grow ? H : PLOT_H[kind] + labelLine() + 2}`);
  const { t0, t1: now } = windowOf(ctx, plot);
  const series = plot._ctx.series ?? ((ent.entity && ctx.series.get(ent.entity)) || []);
  const loaded = plot._ctx.loaded ?? ctx.fetched;
  const hours = (now - t0) / 3600e3;
  labels.textContent = "";
  const xOf = (t: number) => ((t - t0) / (now - t0)) * W;
  plot._xOf = xOf;
  plot._W = W;
  const empty = () => {
    svg.innerHTML = "";
    const half = labelLine() / 2;
    addLabel(
      labels,
      "placeholder",
      tr(ctx.hass, loaded ? "common.no_data" : "common.loading"),
      0,
      H / 2 - half,
    );
    plot._sampled = null;
    plot._buckets = null;
  };
  if (kind === "sparkline") {
    const pts = clampedSeries(
      series.filter((p) => p.v !== null),
      t0,
      now,
    );
    const smooth = plot._ctx.smoothMin ?? ctx.cfg.smoothMin;
    const sampled = lineMeans(pts, t0, now, lineBuckets(now - t0, smooth, W));
    if (sampled.length < 2) return empty();
    let lo = Infinity,
      hi = -Infinity;
    for (const p of sampled) {
      if (p.v < lo) lo = p.v;
      if (p.v > hi) hi = p.v;
    }
    if (hi === lo) {
      hi += 1;
      lo -= 1;
    }
    const pad = (hi - lo) * 0.1;
    lo -= pad;
    hi += pad;
    const yOf = (v: number) => 4 + (H - 8) * (1 - (v - lo) / (hi - lo));
    const xy = sampled.map((p) => [+xOf(p.t).toFixed(1), +yOf(p.v).toFixed(1)]);
    const d = smoothPath(xy);
    const last = xy[xy.length - 1];
    const axis = axisLabels(
      ctx,
      plot,
      labels,
      [
        { v: hi - pad, y: yOf(hi - pad) },
        { v: lo + pad, y: yOf(lo + pad) },
      ],
      W,
      H,
      t0,
      now,
    );
    svg.innerHTML =
      axis +
      `<path class="area" d="${d} L${last[0]},${H} L${xy[0][0]},${H} Z"/><path class="line" d="${d}"/><circle class="dot" cx="${last[0]}" cy="${last[1]}" r="3.5"/>` +
      `<g class="hover"><line class="hair" y1="0" y2="${H}"/><circle class="dot" r="4"/></g>`;
    plot._sampled = sampled;
    plot._yOf = yOf;
    plot._buckets = null;
    return;
  }
  // never finer than one bucket per 2 px (as lineBuckets for the sparkline): a week of 5 minute
  // buckets would otherwise draw thousands of bars into a small plot
  const nb = Math.min(
    plot._ctx.buckets ??
      Math.max(1, Math.round((now - t0) / 60e3 / (plot._ctx.bucketMin ?? ctx.cfg.bucketMin))),
    Math.max(1, Math.floor(W / 2)),
  );
  const bw = W / nb;
  plot._bw = bw;
  if (kind === "columns") {
    const pts = clampedSeries(
      series.filter((p) => p.v !== null),
      t0,
      now,
    );
    const buckets = bucketMean(pts, t0, now, nb, true);
    const vals = buckets.filter((b): b is MeanBucket => b !== null).map((b) => b.v);
    if (!vals.length) return empty();
    const vmax = Math.max(0, ...vals),
      vmin = Math.min(0, ...vals),
      range = vmax - vmin || 1;
    const yOf = (v: number) => H * (1 - (v - vmin) / range),
      y0 = yOf(0);
    let peak = -1,
      pv = -Infinity;
    buckets.forEach((b, i) => {
      if (b && b.v > pv) {
        pv = b.v;
        peak = i;
      }
    });
    const gap = Math.min(3, bw * 0.25);
    let html = axisLabels(ctx, plot, labels, [{ v: vmax, y: yOf(vmax) }], W, H, t0, now);
    buckets.forEach((b, i) => {
      if (!b) return;
      const y = Math.min(yOf(b.v), y0),
        h = Math.max(1, Math.abs(y0 - yOf(b.v)));
      const op = i === peak ? 1 : vmax > 0 && b.v >= 0.66 * vmax ? 0.7 : 0.4;
      html += `<rect class="col" x="${(i * bw + gap / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(1, bw - gap).toFixed(1)}" height="${h.toFixed(1)}" rx="2" opacity="${op}"/>`;
    });
    html += `<g class="hover"><rect class="hl" y="-1" width="${(Math.max(1, bw - gap) + 2).toFixed(1)}" height="${H + 2}" rx="3"/></g>`;
    svg.innerHTML = html;
    plot._buckets = buckets;
    plot._sampled = null;
    plot._peak = peak;
    plot._hlOff = gap / 2 - 1;
    return;
  }
  // strip
  const numeric = series.some((p) => p.v !== null);
  const buckets: (MeanBucket | LastBucket | null)[] = numeric
    ? bucketMean(
        clampedSeries(
          series.filter((p) => p.v !== null),
          t0,
          now,
        ),
        t0,
        now,
        nb,
        true,
      )
    : bucketLast(clampedSeries(series, t0, now), t0, now, nb);
  if (!buckets.some(Boolean)) return empty();
  const tplGet = tplGetter(ctx);
  const gap = Math.min(2, bw * 0.2);
  let html = "";
  buckets.forEach((b, i) => {
    if (!b) return;
    const bm =
      numeric || !("s" in b)
        ? { num: b.v, raw: String(b.v), avail: true }
        : { num: null, raw: b.s, avail: b.s !== "unavailable" && b.s !== "unknown" };
    // a past bucket is matched by its own value, not by the entity's state of now
    const col = cssColor(
      resolveLook(ent, bm, plot._ctx.st, tplGet, undefined, bm, false).color,
      "var(--primary-color)",
    );
    const stroke =
      i === buckets.length - 1 ? ` stroke="var(--primary-text-color)" stroke-width="1.5"` : "";
    html += `<rect x="${(i * bw + gap / 2).toFixed(1)}" y="0" width="${Math.max(1, bw - gap).toFixed(1)}" height="${H}" rx="2" fill="${col}" opacity=".7"${stroke}/>`;
  });
  html += `<g class="hover"><rect class="hl" y="0" width="${Math.max(1, bw - gap).toFixed(1)}" height="${H}" rx="2"/></g>`;
  svg.innerHTML = html;
  plot._hlOff = gap / 2;
  // history windows end now, forward windows (forecasts) start now
  const forward = !!plot._ctx.window && t0 >= ctx.now - 3600e3;
  const n = Math.round(hours);
  addLabel(
    labels,
    "",
    forward ? tr(ctx.hass, "common.now") : tr(ctx.hass, "common.minus_hours", { n }),
    0,
    H + 3,
  );
  addLabel(
    labels,
    "right",
    forward ? tr(ctx.hass, "common.plus_hours", { n }) : tr(ctx.hass, "common.now"),
    W,
    H + 3,
  );
  plot._buckets = buckets;
  plot._sampled = null;
  plot._numeric = numeric;
};

// returns false when there is nothing to show at t (the caller then hides the hover)
export const showHover = (ctx: RenderCtx, plot: PlotElement, t: number): boolean => {
  const { ent, kind, st } = plot._ctx;
  const g = plot.querySelector<SVGGElement>(".hover"),
    tip = plot.querySelector<HTMLElement>(".tip");
  if (!g || !tip) return true;
  let xs: number,
    time: string,
    val: number | null = null,
    stateText: string | null = null;
  if (kind === "sparkline") {
    const p = nearestPoint(plot._sampled, t);
    if (!p || !plot._xOf || !plot._yOf) return true;
    xs = plot._xOf(p.t);
    qs(g, ".hair").setAttribute("x1", String(xs));
    qs(g, ".hair").setAttribute("x2", String(xs));
    const dot = qs(g, ".dot");
    dot.setAttribute("cx", xs.toFixed(1));
    dot.setAttribute("cy", plot._yOf(p.v).toFixed(1));
    time = fmtTime(ctx, p.t);
    val = p.v;
  } else {
    const buckets = plot._buckets;
    const bw = plot._bw ?? 0;
    if (!buckets) return true;
    const { t0, t1: now } = windowOf(ctx, plot);
    const i = Math.min(
      buckets.length - 1,
      Math.max(0, Math.floor(((t - t0) / (now - t0)) * buckets.length)),
    );
    const b = buckets[i];
    if (!b) return false;
    xs = i * bw + bw / 2;
    qs(g, ".hl").setAttribute("x", (i * bw + (plot._hlOff ?? 0)).toFixed(1));
    time = `${fmtTime(ctx, b.t1)}–${fmtTime(ctx, b.t2)}`;
    if (b.v !== null && b.v !== undefined) val = b.v;
    else if ("s" in b) stateText = b.s;
    if (kind === "columns" && i === plot._peak) time += ` · ${tr(ctx.hass, "entity.peak")}`;
  }
  const tplGet = tplGetter(ctx);
  // the value under the pointer is matched by itself, not by the entity's state of now
  const vm =
    val !== null
      ? { num: val, raw: String(val), avail: true }
      : { num: null, raw: stateText, avail: true };
  const label = resolveLook(ent, vm, st, tplGet, ctx.hass, vm, false).label;
  const text = val !== null ? fmtNumber(ctx, ent, val, st) : (stateText ?? "–");
  g.classList.add("on");
  tip.textContent = "";
  const tm = document.createElement("div");
  tm.className = "time";
  tm.textContent = time;
  const vv = document.createElement("div");
  const bb = document.createElement("b");
  bb.textContent = text;
  vv.appendChild(bb);
  if (label) {
    const l = document.createElement("span");
    l.className = "lbl";
    l.textContent = ` · ${label}`;
    vv.appendChild(l);
  }
  tip.append(tm, vv);
  tip.classList.add("on");
  placeTip(plot, tip, xs);
  return true;
};
