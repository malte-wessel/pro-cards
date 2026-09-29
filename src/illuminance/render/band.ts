// Mode "band": one coloured block per bucket, blended between the zone colours.
import { bucketMean, clampedSeries } from "../../shared/history.ts";
import { qs } from "../../shared/util.ts";
import type { IlluminanceHost } from "../config.ts";
import { colorAnchors, colorAt, posOf } from "../zones.ts";
import { fmtLx, plotShell, windowOf, xTicks } from "./plot.ts";

export const renderBand = (card: IlluminanceHost, body: HTMLElement, v: number | null) => {
  const cfg = card._config,
    zones = cfg.zonesList;
  const barH = 44,
    xAxisH = 20;
  const plot = plotShell(card, body, v, barH + xAxisH);
  const svg = qs<SVGSVGElement>(plot, "svg"),
    labels = qs(plot, ".labels");
  const W = Math.max(plot.clientWidth, 10);
  svg.setAttribute("viewBox", `0 0 ${W} ${barH + xAxisH}`);
  const { now, t0 } = windowOf(card);
  if (W < 20) return; // not laid out yet
  const nb = Math.max(1, Math.round((cfg.hours_to_show * 60) / cfg.bucket_minutes));
  const bw = W / nb,
    gap = 2;
  const anchors = colorAnchors(zones, cfg.min_lx, cfg.max_lx);
  const pts = clampedSeries(card._series, t0, now);
  const buckets = bucketMean(pts, t0, now, nb, true);
  let html = "";
  buckets.forEach((b, i) => {
    if (b === null) return;
    const x = i * bw,
      w = Math.max(1, bw - gap);
    const col = colorAt(anchors, posOf(b.v, cfg.min_lx, cfg.max_lx));
    const stroke =
      i === buckets.length - 1 ? ` stroke="var(--primary-text-color)" stroke-width="1.5"` : "";
    html += `<rect x="${x.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="${barH}" rx="2" fill="${col}" opacity=".6"${stroke}/>`;
  });
  html += `<g class="hover"><rect class="hl" y="-2" width="${bw}" height="${barH + 4}" rx="3" fill="none" stroke="var(--primary-text-color)" stroke-width="1.5"/></g>`;
  svg.innerHTML = html;
  const xOf = (t: number) => ((t - t0) / (now - t0)) * W;
  xTicks(card, labels, xOf, W, barH, t0, now);
  card._buckets = buckets;
  card._bw = bw;
  card._xOf = xOf;
  card._gutter = 0;
  card._plotW = W;
  card._mode = "band";
  // legend
  const legend = document.createElement("div");
  legend.className = "legend";
  const stops = anchors.map((a) => `${a.color} ${(a.p * 100).toFixed(0)}%`).join(", ");
  legend.innerHTML = `<span></span><i></i><span></span>`;
  qs(legend, "i").style.setProperty("--grad", `linear-gradient(90deg, ${stops})`);
  (legend.children[0] as HTMLElement).textContent = `${fmtLx(card._hass, cfg.min_lx)} lx`;
  (legend.children[2] as HTMLElement).textContent = `${fmtLx(card._hass, cfg.max_lx)} lx`;
  body.appendChild(legend);
};
