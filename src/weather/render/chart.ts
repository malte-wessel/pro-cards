// A lane chart for forecasts: every lane has its own scale and one or more series (a smooth
// line, columns or a dotted line), a time axis below, and one hover tooltip for all lanes.
// Layout results the hover needs (x mapping, lane scales) stay on the element.
import { textWidth } from "../../shared/format.ts";
import { smoothPath } from "../../shared/history.ts";
import { nearestPoint, placeTip } from "../../shared/hover.ts";
import { qs } from "../../shared/util.ts";
import { X_AXIS_H } from "../constants.ts";

const LANE_LABEL_FONT = "500 11px Roboto, system-ui, sans-serif";

export interface ChartPoint {
  t: number;
  v: number;
}
export interface ChartSeries {
  pts: ChartPoint[];
  color: string; // a CSS colour (theme token)
  kind: "line" | "columns" | "dots";
  fmt: (v: number) => string;
  name: string;
  labels?: boolean; // value labels next to the points where they fit
}
export interface ChartLane {
  h: number;
  label: string | null;
  series: ChartSeries[];
  zero?: boolean; // scale starts at 0 (columns)
  max?: number; // fixed scale top (percentages)
}
export interface ChartSpec {
  t0: number;
  t1: number;
  slot: number; // ms one point stands for: points sit on their time, columns are centred on it
  lanes: ChartLane[];
  ticks: { t: number; label: string }[];
  tickLines?: boolean; // vertical gridlines at the ticks (default true)
}
export interface TipContent {
  time: string;
  head?: string | null;
  rows: { color: string; text: string; name: string }[];
}
export interface ChartElement extends HTMLDivElement {
  _spec?: ChartSpec;
  _xOf?: (t: number) => number;
  _yOf?: ((v: number) => number)[];
  _H?: number;
}

export const chartEl = (): ChartElement => {
  const el = document.createElement("div") as ChartElement;
  el.className = "wchart";
  el.innerHTML = `<svg class="abs" preserveAspectRatio="none"></svg><div class="lanes"></div><div class="axes"></div><div class="tip"></div>`;
  return el;
};

const laneScale = (lane: ChartLane, top: number) => {
  let lo = Infinity,
    hi = -Infinity;
  for (const s of lane.series)
    for (const p of s.pts) {
      if (p.v < lo) lo = p.v;
      if (p.v > hi) hi = p.v;
    }
  if (!Number.isFinite(lo)) {
    lo = 0;
    hi = 1;
  }
  if (lane.zero) lo = Math.min(0, lo);
  if (lane.max !== undefined) hi = Math.max(hi, lane.max);
  if (hi - lo < 1e-9) hi = lo + 1;
  const padTop = 16, // room for the lane label and value labels
    padBottom = 6;
  const h = lane.h - padTop - padBottom;
  return (v: number) => top + padTop + h * (1 - (v - lo) / (hi - lo));
};

export const drawChart = (el: ChartElement, spec: ChartSpec) => {
  const svg = qs<SVGSVGElement>(el, "svg"),
    lanes = qs(el, ".lanes"),
    axes = qs(el, ".axes");
  const W = Math.max(el.clientWidth, 10);
  const plotH = spec.lanes.reduce((a, l) => a + l.h, 0);
  const H = plotH + X_AXIS_H;
  el.style.height = `${H}px`;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  el._spec = spec;
  el._H = H;
  if (W < 20) return;
  const { t0, t1, slot } = spec;
  const xOf = (t: number) => ((t - t0) / (t1 - t0)) * W;
  el._xOf = xOf;
  lanes.textContent = "";
  axes.textContent = "";
  const addLabel = (parent: HTMLElement, cls: string, txt: string, left: number, top: number) => {
    const d = document.createElement("div");
    d.className = cls;
    d.textContent = txt;
    d.style.left = `${left}px`;
    d.style.top = `${top}px`;
    parent.appendChild(d);
    return d;
  };
  let html = "";
  // time gridlines and labels
  let lastX = -Infinity;
  for (const tk of spec.ticks) {
    const x = xOf(tk.t);
    if (x < -0.5 || x > W + 0.5) continue;
    const xr = Math.round(x) + 0.5;
    if (spec.tickLines !== false)
      html += `<line class="grid" x1="${xr}" x2="${xr}" y1="0" y2="${plotH}"/>`;
    const w = textWidth(tk.label);
    if (x - lastX < w + 8) continue;
    const lbl = addLabel(axes, "axis-label", tk.label, x, plotH + 3);
    if (x - w / 2 < 0) lbl.classList.add("first");
    else if (x + w / 2 > W) lbl.classList.add("last");
    lastX = x;
  }
  const yOfs: ((v: number) => number)[] = [];
  let top = 0;
  spec.lanes.forEach((lane, li) => {
    if (li > 0)
      html += `<line class="lane-sep" x1="0" x2="${W}" y1="${top + 0.5}" y2="${top + 0.5}"/>`;
    const yOf = laneScale(lane, top);
    yOfs.push(yOf);
    // value labels stay clear of the lane label in the top-left corner
    const labelW = lane.label ? textWidth(lane.label, LANE_LABEL_FONT) + 12 : 0;
    if (lane.label) addLabel(lanes, "lane-label", lane.label, 4, top + 3);
    const bottom = top + lane.h - 6;
    for (const s of lane.series) {
      if (!s.pts.length) continue;
      if (s.kind === "columns") {
        const gap = Math.min(3, (xOf(slot) - xOf(0)) * 0.25);
        for (const p of s.pts) {
          // centred on the point, clipped at the edges of the plot
          const x0 = Math.max(0, xOf(p.t - slot / 2) + gap / 2),
            w = Math.max(1, Math.min(W, xOf(p.t + slot / 2) - gap / 2) - x0);
          const y = Math.min(yOf(p.v), bottom),
            h = Math.max(1, bottom - yOf(p.v));
          html += `<rect class="col" x="${x0.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${s.color}"/>`;
        }
        continue;
      }
      const xy = s.pts.map((p) => [+xOf(p.t).toFixed(1), +yOf(p.v).toFixed(1)]);
      const d = smoothPath(xy);
      if (s.kind === "dots") {
        html += `<path class="line dotted" d="${d}" stroke="${s.color}"/>`;
      } else {
        const first = xy[0],
          last = xy[xy.length - 1];
        html += `<path class="area" d="${d} L${last[0]},${bottom} L${first[0]},${bottom} Z" fill="${s.color}"/>`;
        html += `<path class="line" d="${d}" stroke="${s.color}"/>`;
      }
      if (s.labels) {
        let lx = -Infinity;
        s.pts.forEach((p, i) => {
          const txt = s.fmt(p.v),
            w = textWidth(txt);
          // nudged inside at the edges
          const x = Math.min(W - w / 2, Math.max(w / 2, xy[i][0]));
          const y = Math.max(top + 2, xy[i][1] - 16);
          if (x - lx < w + 10) return;
          if (y < top + 14 && x - w / 2 < labelW) return;
          addLabel(lanes, "val-label", txt, x, y);
          lx = x;
        });
      }
    }
    top += lane.h;
  });
  el._yOf = yOfs;
  // hover layer: a hairline and one dot per line series
  html += `<g class="hover"><line class="hair" y1="0" y2="${plotH}"/>`;
  spec.lanes.forEach((lane, li) =>
    lane.series.forEach((s, si) => {
      if (s.kind !== "columns")
        html += `<circle class="dot" data-lane="${li}" data-series="${si}" r="4" fill="${s.color}"/>`;
    }),
  );
  html += `</g>`;
  svg.innerHTML = html;
};

// the window time under a pointer event
export const chartTimeAt = (el: ChartElement, ev: PointerEvent): number | null => {
  const spec = el._spec;
  if (!spec) return null;
  const rect = el.getBoundingClientRect();
  const f = Math.max(0, Math.min(1, (ev.clientX - rect.left) / (rect.width || 1)));
  return spec.t0 + f * (spec.t1 - spec.t0);
};

// snaps t to the nearest point of the first series, moves hairline and dots and fills the tip
// from `content(t)`; returns false when there is nothing at t
export const showChartHover = (
  el: ChartElement,
  t: number,
  content: (t: number) => TipContent | null,
): boolean => {
  const spec = el._spec,
    xOf = el._xOf,
    yOfs = el._yOf;
  const g = el.querySelector<SVGGElement>(".hover"),
    tip = el.querySelector<HTMLElement>(".tip");
  if (!spec || !xOf || !yOfs || !g || !tip) return true;
  const first = spec.lanes.flatMap((l) => l.series).find((s) => s.pts.length);
  const p = first && nearestPoint(first.pts, t);
  if (!p) return false;
  const snapT = p.t;
  const c = content(snapT);
  if (!c) return false;
  const xs = xOf(snapT);
  g.classList.add("on");
  const hair = qs(g, ".hair");
  hair.setAttribute("x1", xs.toFixed(1));
  hair.setAttribute("x2", xs.toFixed(1));
  for (const dot of g.querySelectorAll<SVGCircleElement>(".dot")) {
    const li = Number(dot.dataset.lane),
      si = Number(dot.dataset.series);
    const s = spec.lanes[li]?.series[si];
    const q = s?.pts.find((x) => x.t === snapT);
    if (!q) {
      dot.style.display = "none";
      continue;
    }
    dot.style.display = "";
    dot.setAttribute("cx", xs.toFixed(1));
    dot.setAttribute("cy", yOfs[li](q.v).toFixed(1));
  }
  tip.textContent = "";
  const time = document.createElement("div");
  time.className = "time";
  time.textContent = c.time;
  tip.appendChild(time);
  if (c.head) {
    const h = document.createElement("div");
    h.className = "head";
    h.textContent = c.head;
    tip.appendChild(h);
  }
  for (const r of c.rows) {
    const row = document.createElement("div");
    row.className = "trow";
    const key = document.createElement("i");
    key.style.setProperty("--c", r.color);
    const val = document.createElement("b");
    val.textContent = r.text;
    const name = document.createElement("span");
    name.textContent = r.name;
    row.append(key, val, name);
    tip.appendChild(row);
  }
  tip.classList.add("on");
  placeTip(el, tip, xs);
  return true;
};
