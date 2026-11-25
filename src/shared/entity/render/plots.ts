// History plots: sparkline, columns and strip, plus the hover tooltip.
import { cssColor } from "../../color.ts";
import type { HassEntity } from "../../ha.ts";
import {
  bucketLast,
  bucketMean,
  clampedSeries,
  lineBuckets,
  lineMeans,
  plotScale,
  smoothPath,
  type LastBucket,
  type MeanBucket,
  type Point,
} from "../../history.ts";
import { nearestPoint, placeTip } from "../../hover.ts";
import { t as tr } from "../../i18n.ts";
import { measure } from "../../typography.ts";
import { textWidth, timeZoneOf } from "../../format.ts";
import { qs, startOfDay } from "../../util.ts";
import type { EntityItem } from "../config.ts";
import { PLOT_H, type HistoryVisual } from "../constants.ts";
import { resolveLook } from "../look.ts";
import { fmtNumber, fmtTime, tplGetter, unitOf, type RenderCtx } from "../model.ts";

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
  // the scale's written limits (the v3 cards' visual, or the card's for its own entity): soft, data
  // beyond them widens the scale
  min?: number;
  max?: number;
  // a strip as a ribbon along the card's bottom edge: no times, its own height
  edge?: boolean;
}
// the window a plot draws: the one it brought, else its own hours back (or since midnight), else
// the card's history window
export const windowOf = (ctx: RenderCtx, plot: PlotElement) => {
  const c = plot._ctx;
  if (c.window) return c.window;
  if (c.hours === "today") return { t0: startOfDay(ctx.now, timeZoneOf(ctx.hass)), t1: ctx.now };
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
// `axis: true` (the v3 cards' visual): a row of labels at the top of the plot's own height, above
// the drawing (the plot never grows for it, and nothing is drawn over the columns or the line): the
// scale as a range on the left, the window on the right; a faint line at the scale's top (and its
// bottom, on a line and on columns whose written scale does not start at 0). The row's height
// follows the theme's text; 0 where no axis is asked for, or where the plot is too short to keep
// 16 px of drawing below it. On a plot too narrow for both labels the window goes, and the range is
// cut with an ellipsis where even it does not fit (STYLE_PLOT)
const axisBand = (ctx: RenderCtx, plot: PlotElement, labels: HTMLElement, H: number) => {
  if (!plot._ctx.axis) return 0;
  const band = Math.ceil(measure(ctx.text, labels, ["label"], [10, 12]).line) + 2;
  return H - band >= 16 ? band : 0;
};
const axisRow = (
  ctx: RenderCtx,
  plot: PlotElement,
  labels: HTMLElement,
  band: number,
  scale: { bottom: number; top: number },
  lines: number[],
  W: number,
  t0: number,
  now: number,
): string => {
  if (!band) return "";
  const { ent, st } = plot._ctx;
  // in the entity's precision, but a scale of whole numbers (written limits, 0 to 100) without
  // the zeros: 0–100 %, not 0.0–100.0 %; decimals written on the card are kept
  const whole =
    ent.decimals === null && Number.isInteger(scale.bottom) && Number.isInteger(scale.top);
  const num = (v: number) => fmtNumber(ctx, whole ? { ...ent, decimals: 0 } : ent, v, st, false);
  const unit = unitOf(ent, st);
  // a range with a negative end keeps its dash apart from the minus
  const sep = scale.bottom < 0 || scale.top < 0 ? " – " : "–";
  const range = `${num(scale.bottom)}${sep}${num(scale.top)}${unit ? ` ${unit}` : ""}`;
  addLabel(labels, "axis", range, INSET, 1);
  // the window: its hours (the right edge is now), or today since midnight; only where it fits
  // beside the range, a label's gap (8 px) apart
  const win =
    plot._ctx.hours === "today"
      ? tr(ctx.hass, "common.today")
      : tr(ctx.hass, "common.hours", { n: Math.round((now - t0) / 3600e3) });
  const { font } = measure(ctx.text, labels, ["label"], [10, 12]);
  if (textWidth(range, font) + 8 + textWidth(win, font) <= W - 2 * INSET)
    addLabel(labels, "axis right", win, W - INSET, 1);
  return lines
    .map((y) => `<line class="grid" x1="0" x2="${W}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/>`)
    .join("");
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
  // a ribbon along the edge: the height its styles give it, no times below it
  const edge = !!plot._ctx.edge;
  const H = ((grow || edge) && (size?.h ?? plot.clientHeight)) || PLOT_H[kind];
  // a strip keeps its own height: the timeline and its labels below (STRIP_AXIS_CSS), whose line
  // follows the theme's text
  const labelLine = () => measure(ctx.text, labels, ["label"], [10, 12]).line;
  svg.setAttribute("viewBox", `0 0 ${W} ${grow || edge ? H : PLOT_H[kind] + labelLine() + 2}`);
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
    const sc = plotScale(
      sampled.map((p) => p.v),
      plot._ctx,
      false,
      0.1,
    );
    const { lo, hi } = sc;
    // below the axis' row, where there is one
    const band = axisBand(ctx, plot, labels, H);
    const yOf = (v: number) => band + 4 + (H - band - 8) * (1 - (v - lo) / (hi - lo));
    const xy = sampled.map((p) => [+xOf(p.t).toFixed(1), +yOf(p.v).toFixed(1)]);
    const d = smoothPath(xy);
    const last = xy[xy.length - 1];
    const axis = axisRow(ctx, plot, labels, band, sc, [yOf(sc.top), yOf(sc.bottom)], W, t0, now);
    svg.innerHTML =
      axis +
      `<path class="area" d="${d} L${last[0]},${H} L${xy[0][0]},${H} Z"/><path class="line" d="${d}"/><circle class="dot" cx="${last[0]}" cy="${last[1]}" r="3.5"/>` +
      `<g class="hover"><line class="hair" y1="${band}" y2="${H}"/><circle class="dot" r="4"/></g>`;
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
    const sc = plotScale(vals, plot._ctx, true, 0);
    const vmax = sc.top,
      range = sc.hi - sc.lo;
    // below the axis' row, where there is one
    const band = axisBand(ctx, plot, labels, H);
    const yOf = (v: number) => band + (H - band) * (1 - (v - sc.lo) / range),
      y0 = yOf(sc.base);
    let peak = -1,
      pv = -Infinity;
    buckets.forEach((b, i) => {
      if (b && b.v > pv) {
        pv = b.v;
        peak = i;
      }
    });
    // with a limit written, a column is as bright as it is tall on the scale; else the window's
    // peak is full and the rest by how near they come to it
    const opOf = (v: number, i: number) => {
      if (sc.fixed) {
        const span = v >= sc.base ? sc.hi - sc.base : sc.base - sc.lo;
        return +(0.4 + (0.6 * Math.abs(v - sc.base)) / (span || 1)).toFixed(2);
      }
      return i === peak ? 1 : vmax > 0 && v >= 0.66 * vmax ? 0.7 : 0.4;
    };
    const gap = Math.min(3, bw * 0.25);
    // a line at the scale's top; a written scale that does not start at 0 marks its bottom too
    const lines = [yOf(vmax)];
    if (sc.fixed && sc.bottom !== 0 && sc.bottom !== sc.top) lines.push(yOf(sc.bottom));
    let html = axisRow(ctx, plot, labels, band, sc, lines, W, t0, now);
    buckets.forEach((b, i) => {
      if (!b) return;
      const y = Math.min(yOf(b.v), y0),
        h = Math.max(1, Math.abs(y0 - yOf(b.v)));
      const op = opOf(b.v, i);
      html += `<rect class="col" x="${(i * bw + gap / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(1, bw - gap).toFixed(1)}" height="${h.toFixed(1)}" rx="2" opacity="${op}"/>`;
    });
    html += `<g class="hover"><rect class="hl" y="${band - 1}" width="${(Math.max(1, bw - gap) + 2).toFixed(1)}" height="${H - band + 2}" rx="3"/></g>`;
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
    : bucketLast(clampedSeries(series, t0, now), t0, now, nb, (s) => s === "on");
  if (!buckets.some(Boolean)) return empty();
  const tplGet = tplGetter(ctx);
  const gap = edge ? 0 : Math.min(2, bw * 0.2);
  let html = "";
  // a ribbon: each run of one colour one block, drawn opaque in a group that takes the opacity, so
  // where two blocks meet no seam shows (two translucent edges would overlap, or leave a hairline)
  const runs: { from: number; to: number; col: string }[] = [];
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
    if (edge) {
      const last = runs[runs.length - 1];
      if (last && last.col === col && last.to === i) last.to = i + 1;
      else runs.push({ from: i, to: i + 1, col });
      return;
    }
    const stroke =
      i === buckets.length - 1 ? ` stroke="var(--primary-text-color)" stroke-width="1.5"` : "";
    html += `<rect x="${(i * bw + gap / 2).toFixed(1)}" y="0" width="${Math.max(1, bw - gap).toFixed(1)}" height="${H}" rx="2" fill="${col}" opacity=".7"${stroke}/>`;
  });
  if (edge) {
    // (each block reaches under the next, which is drawn over it: no gap between them)
    html += `<g opacity=".7">${runs
      .map(
        (r, k) =>
          `<rect x="${(r.from * bw).toFixed(1)}" y="0" width="${((r.to - r.from) * bw + (k < runs.length - 1 ? 1 : 0)).toFixed(1)}" height="${H}" fill="${r.col}"/>`,
      )
      .join("")}</g>`;
  }
  html += `<g class="hover"><rect class="hl" y="0" width="${Math.max(1, bw - gap).toFixed(1)}" height="${H}" rx="${edge ? 0 : 2}"/></g>`;
  svg.innerHTML = html;
  plot._hlOff = gap / 2;
  // history windows end now, forward windows (forecasts) start now
  const forward = !!plot._ctx.window && t0 >= ctx.now - 3600e3;
  const n = Math.round(hours);
  if (!edge) {
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
  }
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
