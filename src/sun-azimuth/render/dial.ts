// The sky dial as one SVG drawn in px at the column's width (at most 300), so the labels keep
// their size and the lines their weight, scaled by the picture's size (--k).
import { f1 } from "../svg.ts";
import type { SunAzimuthHost } from "../config.ts";
import { isUp, type SunDay, type SunSample } from "../day.ts";
import { dialGeometry } from "../dial.ts";
import type { Side } from "../sides.ts";
import { chipSvg, compass, deg, timeChip } from "./text.ts";

export const renderDial = (
  card: SunAzimuthHost,
  host: HTMLElement,
  day: SunDay,
  now: SunSample,
  sides: Side[],
  width: number,
  timeLabel?: string, // a preview's time, in a chip above the sun
) => {
  const tx = card._text;
  const g = dialGeometry(day, now, card._config.front, sides, width, card._config.roof, tx);
  const c = g.size / 2,
    k = g.k;
  // up as the header says it (refraction included): the dot, the beam and the text agree
  const up = isUp(now);
  let html = `<svg class="dial" viewBox="0 0 ${g.size} ${g.size}" style="--k: ${k.toFixed(2)}; width: ${g.size}px">
    <circle class="disc" cx="${c}" cy="${c}" r="${f1(g.r)}"/>
    <circle class="grid" cx="${c}" cy="${c}" r="${f1((g.r * 2) / 3)}"/>
    <circle class="grid" cx="${c}" cy="${c}" r="${f1(g.r / 3)}"/>
    <path class="ticks" d="${g.ticks}"/>`;
  if (g.dayArc) html += `<path class="dayarc" d="${g.dayArc}"/>`;
  html += `<path class="cardinals" d="${g.cardinalLines}"/>`;
  if (g.azArc) html += `<path class="azarc" d="${g.azArc}"/>`;
  if (g.beam) html += `<path class="beam" d="${g.beam}"/>`;
  if (g.future) html += `<path class="future" d="${g.future}"/>`;
  if (g.past) html += `<path class="past" d="${g.past}"/>`;
  html += `<path class="footprint" d="${g.housePoly}"/>`;
  if (g.roofLines) html += `<path class="ridge" d="${g.roofLines}"/>`;
  for (const w of g.walls) html += `<path class="wall${w.lit ? " lit" : ""}" d="${w.d}"/>`;
  if (g.rise)
    html += `<circle class="mark rise" cx="${f1(g.rise[0])}" cy="${f1(g.rise[1])}" r="${f1(4 * k)}"/>`;
  if (g.set)
    html += `<circle class="mark set" cx="${f1(g.set[0])}" cy="${f1(g.set[1])}" r="${f1(4 * k)}"/>`;
  for (const l of g.labels)
    html += `<text class="cl" x="${f1(l.x)}" y="${f1(l.y)}">${compass(card._hass, l.bearing)}</text>`;
  const sx = f1(g.sun[0]),
    sy = f1(g.sun[1]);
  if (g.azChip) html += chipSvg(deg(card._hass, now.az), g.azChip[0], g.azChip[1], tx);
  if (timeLabel) html += timeChip(timeLabel, g.sun[0], g.sun[1] - 9 * k, g.size, tx);
  // the pulse marks now: a preview (redrawn as the pointer moves) shows the sun without it
  if (!timeLabel)
    html += `<circle class="pulse${up ? "" : " down"}" cx="${sx}" cy="${sy}" r="${f1(9 * k)}"/>`;
  html += `<circle class="sun${up ? "" : " down"}" cx="${sx}" cy="${sy}" r="${f1(7 * k)}"/></svg>`;
  host.innerHTML = html;
  return g.track;
};
