// Shared plot scaffolding of the trend and band modes, plus the value row, formatting and the
// hover tooltip. Functions take the card element; the layout results the hover needs are kept
// on the element (`_mode`, `_sampled`, `_buckets`, `_xOf`, `_yOf`, `_bw`, `_gutter`, `_plotW`).
import { fmtNumber, fmtTime, textWidth } from "../../shared/format.ts";
import type { HomeAssistant } from "../../shared/ha.ts";
import { nearestPoint, placeTip } from "../../shared/hover.ts";
import { clockTicks, timeStep } from "../../shared/ticks.ts";
import { qs } from "../../shared/util.ts";
import type { IlluminanceHost, ThemedZone } from "../config.ts";
import { zoneOf } from "../zones.ts";

// lux with 0 / 1 / 2 decimals depending on magnitude
export const fmtLx = (hass: HomeAssistant | undefined, v: number) =>
  fmtNumber(hass, v, v >= 100 ? 0 : v >= 10 ? 1 : 2);

// the card's window: [t0, now]
export const windowOf = (card: IlluminanceHost) => {
  const now = Date.now();
  return { now, t0: now - card._config.hours_to_show * 3600e3 };
};

export const pillEl = (zone: ThemedZone) => {
  const pill = document.createElement("span");
  pill.className = "pill";
  pill.textContent = zone.label;
  pill.style.setProperty("--pill", zone.css ?? null);
  return pill;
};

// big value with unit and the zone pill on the right
export const valueRow = (card: IlluminanceHost, v: number | null) => {
  const z = v === null ? null : zoneOf(card._config.zonesList, v);
  const row = document.createElement("div");
  row.className = "valrow";
  const big = document.createElement("div");
  big.className = "big";
  const b = document.createElement("b");
  b.textContent = v === null ? "–" : fmtLx(card._hass, v);
  const u = document.createElement("span");
  u.textContent = "lx";
  big.append(b, u);
  row.appendChild(big);
  if (z) row.appendChild(pillEl(z));
  return row;
};

// value row + an empty plot of `height` px wired to the card's pointer handlers
export const plotShell = (
  card: IlluminanceHost,
  body: HTMLElement,
  v: number | null,
  height: number,
) => {
  body.innerHTML = "";
  body.appendChild(valueRow(card, v));
  const plot = document.createElement("div");
  plot.className = "plot";
  plot.style.height = `${height}px`;
  plot.innerHTML = `<svg class="abs" preserveAspectRatio="none"></svg><div class="labels"></div><div class="tip"></div>`;
  plot.addEventListener("pointermove", card._onPointer);
  plot.addEventListener("pointerdown", card._onPointer);
  plot.addEventListener("pointerleave", card._onLeave);
  body.appendChild(plot);
  return plot;
};

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

// time labels at clock boundaries of the window's tick step, plus "now" at the right edge
export const xTicks = (
  card: IlluminanceHost,
  container: HTMLElement,
  xOf: (t: number) => number,
  W: number,
  plotH: number,
  t0: number,
  now: number,
) => {
  const nowLabel = "now",
    nowW = textWidth(nowLabel);
  const x0 = xOf(t0);
  let lastRight = -Infinity;
  for (const t of clockTicks(t0, now, timeStep(card._config.hours_to_show))) {
    const x = xOf(t),
      txt = fmtTime(card._hass, t),
      w = textWidth(txt);
    const first = x - w / 2 < x0;
    const left = first ? x : x - w / 2;
    if (left < lastRight + 8 || left + w > W - nowW - 8) continue;
    addLabel(container, first ? "x first" : "x", txt, x, plotH + 4);
    lastRight = left + w;
  }
  addLabel(container, "x last", nowLabel, W, plotH + 4);
};

// the window time under a pointer event on the plot
export const timeAt = (card: IlluminanceHost, ev: PointerEvent) => {
  const plot = qs(card._root as HTMLElement, ".plot");
  const rect = plot.getBoundingClientRect();
  const x = ev.clientX - rect.left - (card._gutter || 0);
  const { now, t0 } = windowOf(card);
  return t0 + Math.max(0, Math.min(1, x / (card._plotW || rect.width))) * (now - t0);
};

// crosshair / highlight and tooltip at window time t; returns false when there is nothing to show
export const showHover = (card: IlluminanceHost, t: number): boolean => {
  const plot = card._root?.querySelector<HTMLElement>(".plot");
  if (!plot) return true;
  const g = plot.querySelector<SVGGElement>(".hover"),
    tip = plot.querySelector<HTMLElement>(".tip");
  if (!g || !tip) return true; // not laid out yet
  let xs: number, time: string, val: number;
  if (card._mode === "trend") {
    const p = nearestPoint(card._sampled, t);
    if (!p || !card._xOf || !card._yOf) return true;
    xs = card._xOf(p.t);
    qs(g, ".hair").setAttribute("x1", String(xs));
    qs(g, ".hair").setAttribute("x2", String(xs));
    const dot = qs(g, ".dot");
    dot.setAttribute("cx", xs.toFixed(1));
    dot.setAttribute("cy", card._yOf(p.v).toFixed(1));
    time = fmtTime(card._hass, p.t);
    val = p.v;
  } else {
    const buckets = card._buckets || [];
    const bw = card._bw ?? 0;
    const { now, t0 } = windowOf(card);
    const i = Math.min(
      buckets.length - 1,
      Math.max(0, Math.floor(((t - t0) / (now - t0)) * buckets.length)),
    );
    const b = buckets[i];
    if (!b) return false;
    xs = i * bw + bw / 2;
    qs(g, ".hl").setAttribute("x", (i * bw - 1).toFixed(1));
    time = `${fmtTime(card._hass, b.t1)}–${fmtTime(card._hass, b.t2)}`;
    val = b.v;
  }
  g.classList.add("on");
  tip.textContent = "";
  const tm = document.createElement("div");
  tm.className = "time";
  tm.textContent = time;
  const vv = document.createElement("div");
  const bb = document.createElement("b");
  bb.textContent = `${fmtLx(card._hass, val)} lx`;
  const zz = document.createElement("span");
  zz.textContent = ` · ${zoneOf(card._config.zonesList, val).label}`;
  zz.style.color = "var(--secondary-text-color)";
  vv.append(bb, zz);
  tip.append(tm, vv);
  tip.classList.add("on");
  placeTip(plot, tip, xs, card._gutter || 0);
  return true;
};
