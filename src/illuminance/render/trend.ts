// Mode "trend": the log-scale history line over the zone bands.
import { textWidth } from "../../shared/format.ts";
import { bucketMean, clampedSeries, smoothPath } from "../../shared/history.ts";
import { qs } from "../../shared/util.ts";
import type { IlluminanceHost } from "../config.ts";
import { posOf, scaleTop, yLabels } from "../zones.ts";
import { addLabel, plotShell, windowOf, xTicks } from "./plot.ts";

const LABEL_H = 12; // line height of the axis and zone labels

export const renderTrend = (card: IlluminanceHost, body: HTMLElement, v: number | null) => {
  const cfg = card._config,
    zones = cfg.zonesList;
  const plotH = 160,
    xAxisH = 18;
  const plot = plotShell(card, body, v, plotH + xAxisH);
  const svg = qs<SVGSVGElement>(plot, "svg"),
    labels = qs(plot, ".labels");
  const W = Math.max(plot.clientWidth, 10);
  svg.setAttribute("viewBox", `0 0 ${W} ${plotH + xAxisH}`);
  const { now, t0 } = windowOf(card);
  // series: clamp to window, downsample to ~2 px buckets
  const pts = clampedSeries(card._series, t0, now);
  // the scale spans [min_lx, max_lx], grown to a nice ceiling when the window's peak is higher
  let peak = 0;
  for (const p of pts) if (p.v > peak) peak = p.v;
  const top = scaleTop(cfg.max_lx, peak);
  // y gutter for the threshold labels (1 / 100 / 10k / 30k)
  const yTicks = yLabels(zones, cfg.min_lx, top);
  let gutter = 0;
  yTicks.forEach((tk) => {
    gutter = Math.max(gutter, textWidth(tk.txt));
  });
  gutter = Math.ceil(gutter) + 8;
  const PW = W - gutter;
  if (PW < 20) return; // not laid out yet; the ResizeObserver re-renders once the width is known
  const xOf = (t: number) => gutter + ((t - t0) / (now - t0)) * PW;
  const yOf = (val: number) => plotH - posOf(val, cfg.min_lx, top) * plotH;
  let html = "";
  // zone bands + threshold gridlines + zone labels (right aligned, centred in the band)
  let lo = cfg.min_lx;
  zones.forEach((z, i) => {
    const hi = i === zones.length - 1 ? top : Math.min(z.max, top);
    if (hi <= lo) return;
    const y1 = yOf(hi),
      y2 = yOf(lo);
    html += `<rect x="${gutter}" y="${y1.toFixed(1)}" width="${PW}" height="${(y2 - y1).toFixed(1)}" fill="${z.css}" opacity=".12"/>`;
    if (i > 0)
      html += `<line class="grid" x1="${gutter}" x2="${W}" y1="${Math.round(y2) + 0.5}" y2="${Math.round(y2) + 0.5}"/>`;
    if (y2 - y1 >= LABEL_H) {
      const el = document.createElement("div");
      el.className = "label zone";
      el.textContent = z.label;
      el.style.right = "14px"; // clear of the dot at "now"
      el.style.top = `${(y1 + y2) / 2}px`;
      labels.appendChild(el);
    }
    lo = hi;
  });
  html += `<line class="grid" x1="${gutter}" x2="${W}" y1="${plotH - 0.5}" y2="${plotH - 0.5}"/>`;
  // threshold labels in the gutter; one that would touch the previous one is left out
  let lastY = Infinity;
  yTicks.forEach((tk) => {
    const y = yOf(tk.val);
    if (lastY - y < LABEL_H) return;
    addLabel(labels, "y", tk.txt, 0, y, gutter - 6);
    lastY = y;
  });
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
