// The sun path card's curve (SVG) and the dawn / noon / dusk row under it.
import { cssColor } from "../shared/color.ts";
import { fmtNumber, fmtTime } from "../shared/format.ts";
import { smoothPath } from "../shared/history.ts";
import type { HomeAssistant } from "../shared/ha.ts";
import { nearestPoint, placeTip } from "../shared/hover.ts";
import { qs } from "../shared/util.ts";
import type { PositionedDay, SunPathHost } from "./config.ts";
import { CURVE_STEP_MIN, HORIZON_MAX, HORIZON_MIN, PLOT_H, type SunEvent } from "./constants.ts";
import { solarElevation } from "./solar.ts";

const fmt = (hass: HomeAssistant | undefined, t: number | null | undefined) =>
  t == null ? "–" : fmtTime(hass, t);

// draws the day's curve into the card's plot; returns the x mapping and width for the events row
export const drawCurve = (card: SunPathHost, day: PositionedDay, now: Date) => {
  const cfg = card._config;
  const plot = qs(card._root as HTMLElement, ".plot");
  const svg = qs<SVGSVGElement>(plot, "svg");
  const W = Math.max(plot.clientWidth, 10),
    H = PLOT_H;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const top = 8,
    bottom = H - 6;
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

  const dayC = cssColor(cfg.day_color, "var(--light-blue-color)");
  const nightC = cssColor(cfg.night_color, "var(--indigo-color)");
  const sunC = cssColor(cfg.sun_color, "var(--amber-color)");
  const uid = card._uid || (card._uid = Math.random().toString(36).slice(2, 8));
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
  // ticks at dawn / noon / dusk (horizon → top)
  for (const t of [day.dawn, day.noon, day.dusk]) {
    if (t == null) continue;
    const x = Math.round(xOf(t)) + 0.5;
    html += `<line class="tick" x1="${x}" x2="${x}" y1="${top}" y2="${hY}"/>`;
  }
  html += `<line class="horizon" x1="0" x2="${W}" y1="${hY}" y2="${hY}"/>`;
  if (futureD) html += `<path class="curve future" stroke="${dayC}" d="${futureD}"/>`;
  if (pastD) html += `<path class="curve" stroke="${dayC}" d="${pastD}"/>`;
  html += `<circle class="sun" r="6" cx="${nowP[0]}" cy="${nowP[1]}" fill="${sunC}"/>`;
  // hover layer: crosshair and a dot on the curve, shown by showHover
  if (cfg.show_tooltip)
    html += `<g class="hover"><line class="hair" y1="${top}" y2="${bottom}"/><circle class="dot" r="4" fill="${sunC}"/></g>`;
  svg.innerHTML = html;
  card._xOf = xOf;
  card._yOf = yOf;
  card._plotW = W;
  return { xOf, W };
};

// the time of the day under plot x (0..W), clamped to the day
export const timeAt = (day: { start: number; end: number }, x: number, W: number) => {
  const f = Math.min(Math.max(x / W, 0), 1);
  return day.start + f * (day.end - day.start);
};

// crosshair, dot and tooltip at time t; returns false when there is nothing to show
export const showHover = (card: SunPathHost, t: number): boolean => {
  const day = card._day,
    xOf = card._xOf,
    yOf = card._yOf;
  if (!card._root || !day || !xOf || !yOf) return false;
  const plot = qs(card._root, ".plot");
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
  time.textContent = fmtTime(card._hass, p.t);
  const row = document.createElement("div");
  row.className = "row";
  const val = document.createElement("b");
  val.textContent = `${fmtNumber(card._hass, p.e, 0)}°`;
  const name = document.createElement("span");
  name.textContent = "elevation";
  row.append(val, name);
  tip.append(time, row);
  tip.classList.add("on");
  placeTip(plot, tip, xs);
  return true;
};

// Bottom row: dawn / noon / dusk positioned under their x
export const drawEvents = (
  card: SunPathHost,
  day: PositionedDay,
  xOf: (t: number) => number,
  W: number,
) => {
  const events = qs(card._root as HTMLElement, ".events");
  events.textContent = "";
  if (!card._config.show_dawn_dusk) return;
  const items = (
    [
      ["dawn", day.dawn],
      ["noon", day.noon],
      ["dusk", day.dusk],
    ] as [SunEvent, number | null][]
  ).filter((it): it is [SunEvent, number] => it[1] != null);
  const xs = items.map(([, t]) => xOf(t));
  // slot boundaries halfway between neighbours; each label may only use its own slot
  const bounds = [0, ...xs.slice(1).map((x, i) => (xs[i] + x) / 2), W];
  items.forEach(([key, t], i) => {
    const el = document.createElement("div");
    el.className = "ev";
    const x = xs[i],
      b0 = bounds[i],
      b1 = bounds[i + 1];
    let maxW: number;
    // keep centred labels inside the card: pin to the edge when too close
    if (x < W * 0.2) {
      el.classList.add("left");
      el.style.left = "0px";
      maxW = b1 - 8;
    } else if (x > W * 0.8) {
      el.classList.add("rightmost");
      el.style.left = `${W}px`;
      maxW = W - b0 - 8;
    } else {
      el.style.left = `${x}px`;
      maxW = 2 * Math.min(x - b0, b1 - x) - 8;
    }
    el.style.maxWidth = `${Math.max(24, Math.floor(maxW))}px`;
    const lbl = document.createElement("div");
    lbl.className = "lbl";
    lbl.textContent = card._labels[key];
    const val = document.createElement("div");
    val.className = "sm";
    val.textContent = fmt(card._hass, t);
    el.append(lbl, val);
    events.appendChild(el);
  });
};

export { fmt as fmtEvent };
