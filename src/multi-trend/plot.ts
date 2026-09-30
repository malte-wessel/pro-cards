// The plot of the multi trend card: series, scales, axes, hover tooltip. Every function takes
// the card element and reads its config, series and state; the layout results it needs for the
// hover (scales, x mapping, gutter) are kept on the element.
import { fmtNumber, fmtTime, textWidth } from "../shared/format.ts";
import { bucketMean, clampedSeries, smoothPath } from "../shared/history.ts";
import { nearestPoint, placeTip } from "../shared/hover.ts";
import type { HomeAssistant } from "../shared/ha.ts";
import { clockTicks, timeStep } from "../shared/ticks.ts";
import { qs } from "../shared/util.ts";
import type { TrendHost } from "./config.ts";
import {
  LANE_LABEL_H,
  LANE_PLOT_H,
  OVERLAY_PLOT_H,
  X_AXIS_H,
  decimalsForStep,
  mkScale,
  niceStep,
  rangeOf,
} from "./scale.ts";

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

// window of the card: [t0, now]
const windowOf = (card: TrendHost) => {
  const now = Date.now();
  return { now, t0: now - card._config.hours_to_show * 3600e3 };
};

export const drawPlot = (card: TrendHost) => {
  const cfg = card._config,
    hass = card._hass;
  if (!card._root) return;
  const plot = qs(card._root, ".plot");
  const svg = qs<SVGSVGElement>(plot, "svg");
  const layout = card._layout();
  const n = cfg.entities.length;
  const W = Math.max(plot.clientWidth, 10);
  const laneH = layout === "lanes" ? LANE_PLOT_H : OVERLAY_PLOT_H;
  const plotH = layout === "lanes" ? laneH * n : laneH;
  const showX = !!cfg.x_axis,
    showY = !!cfg.y_axis;
  const H = plotH + (showX ? X_AXIS_H : 0);
  plot.style.height = `${H}px`;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  // The plot grows with the card (a tall grid cell stretches it) and the SVG stretches along,
  // so vertical positions of the HTML labels are percentages of H, not pixels
  const pct = (y: number) => `${((y / H) * 100).toFixed(3)}%`;

  const { now, t0 } = windowOf(card);

  // Clamp to the window so line and fill always start and end exactly at the plot edges, then
  // downsample to ~1 point per 2px (bucket mean) when there are more points than buckets
  const nb = Math.max(1, Math.floor(W / 2));
  const sampled = card._series.map((raw) => {
    const pts = clampedSeries(raw, t0, now);
    return pts.length <= nb ? pts : bucketMean(pts, t0, now, nb);
  });
  card._sampled = sampled;

  // Scales
  const scales =
    layout === "overlay"
      ? [mkScale(...rangeOf(sampled), 0, laneH, 6)]
      : sampled.map((pts, i) => mkScale(...rangeOf([pts]), i * laneH, laneH, LANE_LABEL_H));
  card._scales = scales;

  // Y ticks (per scale) and the left gutter needed for their labels
  const yTicks = showY
    ? scales.map((sc) => {
        const step = niceStep(sc.max - sc.min, layout === "overlay" ? 3 : 2);
        const dec = decimalsForStep(step);
        const ticks: { v: number; y: number; label: string }[] = [];
        for (let v = Math.ceil(sc.min / step) * step; v <= sc.max + 1e-9; v += step) {
          const y = sc.y(v);
          if (y < sc.top + sc.topPad - 1 || y > sc.top + sc.h - 5) continue; // stay inside the drawable band
          ticks.push({ v, y, label: fmtNumber(hass, v, dec) });
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
  card._xOf = xOf;
  card._gutter = gutter;
  card._plotW = PW;

  // Build SVG
  let html = "";
  if (layout === "lanes") {
    cfg.entities.forEach((e, i) => {
      if (i > 0)
        html += `<line class="lane-sep" x1="${gutter}" x2="${W}" y1="${i * laneH + 0.5}" y2="${i * laneH + 0.5}"/>`;
    });
  }
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
    const step = timeStep(cfg.hours_to_show);
    const xTicks: { t: number; x: number }[] = [];
    for (const t of clockTicks(t0, now, step)) {
      const x = xOf(t);
      if (x - gutter < 1) continue;
      xTicks.push({ t, x });
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
    const sc = layout === "overlay" ? scales[0] : scales[i];
    const col = cfg.entities[i].colorCss;
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
  sampled.forEach((_, i) => {
    html += `<circle class="dot" r="4" fill="${cfg.entities[i].colorCss}"/>`;
  });
  html += `</g>`;
  svg.innerHTML = html;

  // Lane labels as HTML so long names clip with an ellipsis inside their lane
  const lanes = qs(plot, ".lanes");
  lanes.textContent = "";
  if (layout === "lanes") {
    cfg.entities.forEach((e, i) => {
      const lbl = document.createElement("div");
      lbl.className = "lane-label";
      lbl.style.top = `calc(${pct(i * laneH)} + 3px)`;
      lbl.style.left = `${gutter + 4}px`;
      lbl.style.maxWidth = `calc(100% - ${gutter + 8}px)`;
      lbl.textContent = card._name(i);
      lanes.appendChild(lbl);
    });
  }
};

// the window time under a pointer event on the plot
export const timeAt = (card: TrendHost, ev: PointerEvent) => {
  const plot = qs(card._root as HTMLElement, ".plot");
  const rect = plot.getBoundingClientRect();
  const x = ev.clientX - rect.left - (card._gutter || 0);
  const { now, t0 } = windowOf(card);
  return t0 + (x / (card._plotW || rect.width)) * (now - t0);
};

// crosshair, dots and tooltip at window time t; returns false when there is nothing to show
export const showHover = (card: TrendHost, t: number): boolean => {
  const plot = qs(card._root as HTMLElement, ".plot");
  const svg = qs<SVGSVGElement>(plot, "svg");
  const g = svg.querySelector<SVGGElement>(".hover");
  const tip = qs(plot, ".tip");
  const scales = card._scales,
    xOf = card._xOf;
  if (!g || !card._sampled || !scales || !xOf) return true;
  const layout = card._layout();

  // Snap x to the nearest point across all series
  let snapT: number | null = null,
    best = Infinity;
  const picks = card._sampled.map((pts) => nearestPoint(pts, t));
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
    const sc = layout === "overlay" ? scales[0] : scales[i];
    dot.style.display = "";
    dot.setAttribute("cx", xOf(p.t).toFixed(1));
    dot.setAttribute("cy", sc.y(p.v).toFixed(1));
  });

  // Tooltip content
  tip.textContent = "";
  const time = document.createElement("div");
  time.className = "time";
  time.textContent = fmtClock(card._hass, snapT);
  tip.appendChild(time);
  picks.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "row";
    const key = document.createElement("i");
    key.style.setProperty("--c", card._config.entities[i].colorCss);
    const val = document.createElement("b");
    val.textContent = p ? card._fmt(i, p.v) : "—";
    const name = document.createElement("span");
    name.textContent = card._name(i);
    row.append(key, val, name);
    tip.appendChild(row);
  });
  tip.classList.add("on");
  placeTip(plot, tip, xs, card._gutter || 0);
  return true;
};
