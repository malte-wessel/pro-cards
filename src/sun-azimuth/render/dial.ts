// The sky dial as one SVG that scales with the column.
import type { SunAzimuthHost } from "../config.ts";
import type { SunDay, SunSample } from "../day.ts";
import { dialGeometry } from "../dial.ts";
import type { Side } from "../sides.ts";
import { compass } from "./text.ts";

const f1 = (v: number) => v.toFixed(1);

export const renderDial = (
  card: SunAzimuthHost,
  host: HTMLElement,
  day: SunDay,
  now: SunSample,
  sides: Side[],
) => {
  const g = dialGeometry(day, now, card._config.rotation, sides);
  const c = g.size / 2;
  const up = now.el > 0;
  let html = `<svg class="dial" viewBox="0 0 ${g.size} ${g.size}">
    <circle class="disc" cx="${c}" cy="${c}" r="${g.r}"/>
    <circle class="grid" cx="${c}" cy="${c}" r="${f1((g.r * 2) / 3)}"/>
    <circle class="grid" cx="${c}" cy="${c}" r="${f1(g.r / 3)}"/>
    <path class="ticks" d="${g.ticks}"/>`;
  if (g.dayArc) html += `<path class="dayarc" d="${g.dayArc}"/>`;
  if (g.beam) html += `<path class="beam" d="${g.beam}"/>`;
  if (g.future) html += `<path class="future" d="${g.future}"/>`;
  if (g.past) html += `<path class="past" d="${g.past}"/>`;
  html += `<path class="footprint" d="${g.housePoly}"/>`;
  for (const e of g.edges) html += `<path class="edge${e.lit ? " lit" : ""}" d="${e.d}"/>`;
  if (g.rise)
    html += `<circle class="mark rise" cx="${f1(g.rise[0])}" cy="${f1(g.rise[1])}" r="4"/>`;
  if (g.set) html += `<circle class="mark set" cx="${f1(g.set[0])}" cy="${f1(g.set[1])}" r="4"/>`;
  for (const l of g.labels)
    html += `<text class="cl" x="${f1(l.x)}" y="${f1(l.y)}">${compass(card._hass, l.bearing)}</text>`;
  const sx = f1(g.sun[0]),
    sy = f1(g.sun[1]);
  html += `<circle class="pulse${up ? "" : " down"}" cx="${sx}" cy="${sy}" r="9"/><circle class="sun${up ? "" : " down"}" cx="${sx}" cy="${sy}" r="7"/></svg>`;
  host.innerHTML = html;
};
