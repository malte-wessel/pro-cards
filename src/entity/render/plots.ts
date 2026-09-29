// History plots: sparkline, columns and strip, plus the hover tooltip.
import { cssColor } from "../../shared/color.ts";
import type { HassEntity } from "../../shared/ha.ts";
import {
  bucketLast,
  bucketMean,
  clampedSeries,
  smoothPath,
  type LastBucket,
  type MeanBucket,
} from "../../shared/history.ts";
import { nearestPoint, placeTip } from "../../shared/hover.ts";
import { qs } from "../../shared/util.ts";
import type { EntityItem } from "../config.ts";
import { PLOT_H, type HistoryVisual } from "../constants.ts";
import { resolveLook } from "../look.ts";
import { fmtNumber, fmtTime, tplGetter, type RenderCtx } from "../model.ts";

// what a plot element knows about itself: entity, index, kind, state and height
export interface PlotCtx {
  ent: EntityItem;
  idx: number;
  kind: HistoryVisual;
  st: HassEntity | undefined;
  h: number;
}
// the plot element carries its render context and the layout results the hover needs
export interface PlotElement extends HTMLDivElement {
  _ctx: PlotCtx;
  _xOf?: (t: number) => number;
  _yOf?: (v: number) => number;
  _W?: number;
  _sampled?: MeanBucket[] | null;
  _buckets?: (MeanBucket | LastBucket | null)[] | null;
  _bw?: number;
  _peak?: number;
  _numeric?: boolean;
}

export const addLabel = (
  container: HTMLElement,
  cls: string,
  txt: string,
  left: number,
  top: number,
) => {
  const el = document.createElement("div");
  el.className = `label ${cls}`;
  el.textContent = txt;
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
  container.appendChild(el);
};

// ctx also needs { cfg, series, fetched, now, t0 }
export const drawPlot = (ctx: RenderCtx, plot: PlotElement) => {
  const { ent, kind } = plot._ctx;
  const svg = qs<SVGSVGElement>(plot, "svg"),
    labels = qs(plot, ".labels");
  const W = Math.max(plot.clientWidth, 10);
  if (W < 20) return; // not laid out yet; the ResizeObserver re-renders once the width is known
  const H = PLOT_H[kind];
  svg.setAttribute("viewBox", `0 0 ${W} ${plot._ctx.h}`);
  const { now, t0 } = ctx;
  const series = (ent.entity && ctx.series.get(ent.entity)) || [];
  labels.textContent = "";
  const xOf = (t: number) => ((t - t0) / (now - t0)) * W;
  plot._xOf = xOf;
  plot._W = W;
  const empty = () => {
    svg.innerHTML = "";
    addLabel(labels, "", ctx.fetched ? "no data" : "loading …", 0, H / 2 - 6);
    plot._sampled = null;
    plot._buckets = null;
  };
  if (kind === "sparkline") {
    const pts = clampedSeries(
      series.filter((p) => p.v !== null),
      t0,
      now,
    );
    const sampled = bucketMean(pts, t0, now, Math.max(1, Math.floor(W / 2)));
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
    svg.innerHTML =
      `<path class="area" d="${d} L${last[0]},${H} L${xy[0][0]},${H} Z"/><path class="line" d="${d}"/><circle class="dot" cx="${last[0]}" cy="${last[1]}" r="3.5"/>` +
      `<g class="hover"><line class="hair" y1="0" y2="${H}"/><circle class="dot" r="4"/></g>`;
    plot._sampled = sampled;
    plot._yOf = yOf;
    plot._buckets = null;
    return;
  }
  const nb = Math.max(1, Math.round((ctx.cfg.hours * 60) / ctx.cfg.bucketMin));
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
    const vmax = Math.max(...vals),
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
    let html = "";
    buckets.forEach((b, i) => {
      if (!b) return;
      const y = Math.min(yOf(b.v), y0),
        h = Math.max(1, Math.abs(y0 - yOf(b.v)));
      const op = i === peak ? 1 : vmax > 0 && b.v >= 0.66 * vmax ? 0.7 : 0.4;
      html += `<rect class="col" x="${(i * bw + gap / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(1, bw - gap).toFixed(1)}" height="${h.toFixed(1)}" rx="2" opacity="${op}"/>`;
    });
    html += `<g class="hover"><rect class="hl" y="-1" width="${bw.toFixed(1)}" height="${H + 2}" rx="3"/></g>`;
    svg.innerHTML = html;
    plot._buckets = buckets;
    plot._sampled = null;
    plot._peak = peak;
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
    const col = cssColor(resolveLook(ent, bm, plot._ctx.st, tplGet).color, "var(--primary-color)");
    const stroke =
      i === buckets.length - 1 ? ` stroke="var(--primary-text-color)" stroke-width="1.5"` : "";
    html += `<rect x="${(i * bw + gap / 2).toFixed(1)}" y="0" width="${Math.max(1, bw - gap).toFixed(1)}" height="${H}" rx="2" fill="${col}" opacity=".7"${stroke}/>`;
  });
  html += `<g class="hover"><rect class="hl" y="-1" width="${bw.toFixed(1)}" height="${H + 2}" rx="3"/></g>`;
  svg.innerHTML = html;
  addLabel(labels, "", `−${ctx.cfg.hours} h`, 0, H + 3);
  addLabel(labels, "right", "now", W, H + 3);
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
    const { now, t0 } = ctx;
    const i = Math.min(
      buckets.length - 1,
      Math.max(0, Math.floor(((t - t0) / (now - t0)) * buckets.length)),
    );
    const b = buckets[i];
    if (!b) return false;
    xs = i * bw + bw / 2;
    qs(g, ".hl").setAttribute("x", (i * bw - 1).toFixed(1));
    time = `${fmtTime(ctx, b.t1)}–${fmtTime(ctx, b.t2)}`;
    if (b.v !== null && b.v !== undefined) val = b.v;
    else if ("s" in b) stateText = b.s;
    if (kind === "columns" && i === plot._peak) time += " · Spitze";
  }
  const tplGet = tplGetter(ctx);
  let text: string, label: string | null;
  if (val !== null) {
    const look = resolveLook(ent, { num: val, raw: String(val), avail: true }, st, tplGet);
    label = look.label;
    text = fmtNumber(ctx, ent, val, st);
  } else {
    const look = resolveLook(ent, { num: null, raw: stateText, avail: true }, st, tplGet);
    label = look.label;
    text = stateText ?? "–";
  }
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
