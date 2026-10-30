// The sun's curve over the day (SVG): the elevation from midnight to midnight, the day and night
// washes, the horizon, ticks at sunrise, noon and sunset, and the sun now; with a crosshair and a
// tooltip under the pointer (the sun path card, the poster's sun kind).
import { fmtNumber, fmtTime } from "../format.ts";
import { smoothPath } from "../history.ts";
import type { HomeAssistant } from "../ha.ts";
import { nearestPoint, placeTip } from "../hover.ts";
import { t as tr } from "../i18n.ts";
import { solarElevation, type SolarDay } from "../solar.ts";
import { qs } from "../util.ts";

export const HORIZON_MIN = 0.45; // horizon never above 45 % of the plot height
export const HORIZON_MAX = 0.7; // ... and never below 70 %
export const CURVE_STEP_MIN = 10;
// the room the curve keeps above and below its range, in px
export const CURVE_TOP = 8;
export const CURVE_BOTTOM = 6;

// the solar day of the home's position
export interface PositionedDay extends SolarDay {
  lat: number;
  lon: number;
}
// what the curve reads from and leaves on the element that draws it (for the tooltip)
export interface SunCurveHost {
  _hass?: HomeAssistant;
  _uid?: string;
  _day: PositionedDay | null;
  _xOf?: (t: number) => number;
  _yOf?: (e: number) => number;
  _plotW?: number;
}
// the curve's colours (CSS colours) and whether it takes a tooltip
export interface CurveLook {
  day: string;
  night: string;
  sun: string;
  tooltip: boolean;
}

// draws the day's curve into `plot` (its svg) at the height the plot has (`fallbackH` while it
// has none yet); returns the x mapping, the width and the headroom: the share of the range left
// empty above the day's peak (a low sun keeps the horizon in its band that way)
export const drawCurve = (
  host: SunCurveHost,
  plot: HTMLElement,
  day: PositionedDay,
  now: Date,
  look: CurveLook,
  fallbackH: number,
) => {
  const svg = qs<SVGSVGElement>(plot, "svg");
  // drawn at the height the plot has: its own, or what a cell with fixed rows gives it
  const W = Math.max(plot.clientWidth, 10),
    H = plot.clientHeight || fallbackH;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const top = CURVE_TOP,
    bottom = H - CURVE_BOTTOM;
  // One linear elevation scale for the whole curve (a split scale would kink it at the horizon).
  // The horizon lands where the data puts it, but the range is padded so it stays within a band.
  let maxE = Math.max(day.maxElev, 5),
    minE = Math.min(day.minElev, -5);
  // Padding only ever widens the range: headroom above the peak when the horizon would sit too
  // high (winter), more depth below when it would sit too low (summer); the curve always fits.
  const hFrac0 = maxE / (maxE - minE);
  if (hFrac0 < HORIZON_MIN) maxE = (-minE * HORIZON_MIN) / (1 - HORIZON_MIN);
  else if (hFrac0 > HORIZON_MAX) minE = maxE - maxE / HORIZON_MAX;
  const hFrac = maxE / (maxE - minE);
  const hY = Math.round(top + hFrac * (bottom - top)) + 0.5;
  const xOf = (t: number) => ((t - day.start) / (day.end - day.start)) * W;
  const yOf = (e: number) => top + ((maxE - e) / (maxE - minE)) * (bottom - top);
  const nowT = Math.min(Math.max(now.getTime(), day.start), day.end);
  const nowE = solarElevation(now, day.lat, day.lon);

  // Curve samples (every CURVE_STEP_MIN) split at now
  const past: number[][] = [],
    future: number[][] = [];
  for (let i = 0; i < day.samples.length; i += CURVE_STEP_MIN) {
    const s = day.samples[i];
    const p = [+xOf(s.t).toFixed(1), +yOf(s.e).toFixed(1)];
    (s.t <= nowT ? past : future).push(p);
  }
  const nowP = [+xOf(nowT).toFixed(1), +yOf(nowE).toFixed(1)];
  past.push(nowP);
  future.unshift(nowP);
  const last = day.samples[day.samples.length - 1];
  const endP = [+xOf(last.t).toFixed(1), +yOf(last.e).toFixed(1)];
  if (future[future.length - 1][0] !== endP[0]) future.push(endP);

  const dayC = look.day,
    nightC = look.night,
    sunC = look.sun;
  const uid = host._uid || (host._uid = Math.random().toString(36).slice(2, 8));
  // the plain (unclamped) curve: the samples are evenly spaced and the clamped variant would flatten the noon peak
  const pastD = smoothPath(past, false),
    futureD = smoothPath(future, false),
    allD = smoothPath([...past, ...future.slice(1)], false);

  let html = `
      <defs>
        <clipPath id="above-${uid}"><rect x="0" y="0" width="${W}" height="${hY}"/></clipPath>
        <clipPath id="below-${uid}"><rect x="0" y="${hY}" width="${W}" height="${H - hY}"/></clipPath>
      </defs>`;
  // night wash: between curve and horizon where the curve is below the horizon (whole day)
  html += `<path class="wash" fill="${nightC}" clip-path="url(#below-${uid})" d="${allD} L${W},0 L0,0 Z"/>`;
  // day wash: between past curve and horizon where above the horizon
  if (past.length > 1)
    html += `<path class="wash" fill="${dayC}" clip-path="url(#above-${uid})" d="${pastD} L${nowP[0]},${H} L0,${H} Z"/>`;
  // ticks at sunrise / solar noon / sunset (top → horizon); noon is the centre of the window
  for (const t of [day.sunrise, day.noon, day.sunset]) {
    if (t == null) continue;
    const x = Math.round(xOf(t)) + 0.5;
    html += `<line class="tick" x1="${x}" x2="${x}" y1="${top}" y2="${hY}"/>`;
  }
  html += `<line class="horizon" x1="0" x2="${W}" y1="${hY}" y2="${hY}"/>`;
  if (futureD) html += `<path class="curve future" stroke="${dayC}" d="${futureD}"/>`;
  if (pastD) html += `<path class="curve" stroke="${dayC}" d="${pastD}"/>`;
  html += `<circle class="sun" r="6" cx="${nowP[0]}" cy="${nowP[1]}" fill="${sunC}"/>`;
  // hover layer: crosshair and a dot on the curve, shown by showHover
  if (look.tooltip)
    html += `<g class="hover"><line class="hair" y1="${top}" y2="${bottom}"/><circle class="dot" r="4" fill="${sunC}"/></g>`;
  svg.innerHTML = html;
  host._xOf = xOf;
  host._yOf = yOf;
  host._plotW = W;
  return { xOf, W, headroom: Math.max(0, (maxE - day.maxElev) / (maxE - minE)) };
};

// the time of the day under plot x (0..W), clamped to the day
export const timeAt = (day: { start: number; end: number }, x: number, W: number) => {
  const f = Math.min(Math.max(x / W, 0), 1);
  return day.start + f * (day.end - day.start);
};

// crosshair, dot and tooltip at time t in `plot`; returns false when there is nothing to show
export const showHover = (host: SunCurveHost, plot: HTMLElement, t: number): boolean => {
  const day = host._day,
    xOf = host._xOf,
    yOf = host._yOf;
  if (!day || !xOf || !yOf) return false;
  const g = plot.querySelector<SVGGElement>("svg .hover");
  const tip = plot.querySelector<HTMLElement>(".tip");
  if (!g || !tip) return false;
  const p = nearestPoint(day.samples, t);
  if (!p) return false;
  const xs = xOf(p.t);

  g.classList.add("on");
  const hair = qs(g, ".hair");
  hair.setAttribute("x1", xs.toFixed(1));
  hair.setAttribute("x2", xs.toFixed(1));
  const dot = qs(g, ".dot");
  dot.setAttribute("cx", xs.toFixed(1));
  dot.setAttribute("cy", yOf(p.e).toFixed(1));

  tip.textContent = "";
  const time = document.createElement("div");
  time.className = "time";
  time.textContent = fmtTime(host._hass, p.t);
  const row = document.createElement("div");
  row.className = "row";
  const val = document.createElement("b");
  val.textContent = `${fmtNumber(host._hass, p.e, 0)}°`;
  const name = document.createElement("span");
  name.textContent = tr(host._hass, "sun.elevation");
  row.append(val, name);
  tip.append(time, row);
  tip.classList.add("on");
  placeTip(plot, tip, xs);
  return true;
};
