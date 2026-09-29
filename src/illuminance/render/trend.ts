// Mode "trend": the log-scale history line over the zone bands.
import { textWidth } from "../../shared/format.ts";
import { bucketMean, clampedSeries, smoothPath } from "../../shared/history.ts";
import { qs } from "../../shared/util.ts";
import type { IlluminanceHost } from "../config.ts";
import { logOf, posOf } from "../zones.ts";
import { addLabel, plotShell, windowOf, xTicks } from "./plot.ts";

export const renderTrend = (card: IlluminanceHost, body: HTMLElement, v: number | null) => {
  const cfg = card._config,
    zones = cfg.zonesList;
  const plotH = 150,
    xAxisH = 18;
  const plot = plotShell(card, body, v, plotH + xAxisH);
  const svg = qs<SVGSVGElement>(plot, "svg"),
    labels = qs(plot, ".labels");
  const W = Math.max(plot.clientWidth, 10);
  svg.setAttribute("viewBox", `0 0 ${W} ${plotH + xAxisH}`);
  const { now, t0 } = windowOf(card);
  // y gutter for scale labels (1 / 100 / 10k ...)
  const yTicks: { val: number; txt: string }[] = [];
  for (let e = Math.ceil(logOf(cfg.min_lx)); e <= Math.floor(logOf(cfg.max_lx)); e++) {
    if (e % 2 !== 0) continue;
    const val = Math.pow(10, e);
    yTicks.push({ val, txt: val >= 1000 ? `${val / 1000}k` : String(val) });
  }
  let gutter = 0;
  yTicks.forEach((tk) => {
    gutter = Math.max(gutter, textWidth(tk.txt));
  });
  gutter = Math.ceil(gutter) + 8;
  const PW = W - gutter;
  if (PW < 20) return; // not laid out yet; the ResizeObserver re-renders once the width is known
  const xOf = (t: number) => gutter + ((t - t0) / (now - t0)) * PW;
  const yOf = (val: number) => plotH - posOf(val, cfg.min_lx, cfg.max_lx) * plotH;
  let html = "";
  // zone bands + threshold gridlines + zone labels
  let lo = cfg.min_lx;
  zones.forEach((z, i) => {
    const hi = i === zones.length - 1 ? cfg.max_lx : Math.min(z.max, cfg.max_lx);
    if (hi <= lo) return;
    const y1 = yOf(hi),
      y2 = yOf(lo);
    html += `<rect x="${gutter}" y="${y1.toFixed(1)}" width="${PW}" height="${(y2 - y1).toFixed(1)}" fill="${z.css}" opacity=".06"/>`;
    if (i > 0)
      html += `<line class="grid" x1="${gutter}" x2="${W}" y1="${Math.round(y2) + 0.5}" y2="${Math.round(y2) + 0.5}"/>`;
    if (y2 - y1 >= 11) addLabel(labels, "zone", z.label, gutter + 6, y2 - 12);
    lo = hi;
  });
  yTicks.forEach((tk) => addLabel(labels, "y", tk.txt, 0, yOf(tk.val), gutter - 6));
  // series: clamp to window, downsample to ~2 px buckets
  const pts = clampedSeries(card._series, t0, now);
  const nb = Math.max(1, Math.floor(PW / 2));
  const sampled = bucketMean(pts, t0, now, nb);
  card._sampled = sampled;
  card._xOf = xOf;
  card._yOf = yOf;
  card._gutter = gutter;
  card._plotW = PW;
  if (sampled.length > 1) {
    const xy = sampled.map((p) => [+xOf(p.t).toFixed(1), +yOf(p.v).toFixed(1)]);
    html += `<path class="line" d="${smoothPath(xy)}"/>`;
    const last = xy[xy.length - 1];
    html += `<circle class="dot" cx="${last[0]}" cy="${last[1]}" r="4"/>`;
  }
  html += `<g class="hover"><line class="hair" y1="0" y2="${plotH}"/><circle class="dot" r="4"/></g>`;
  svg.innerHTML = html;
  xTicks(card, labels, xOf, W, plotH, t0, now);
  card._mode = "trend";
};
