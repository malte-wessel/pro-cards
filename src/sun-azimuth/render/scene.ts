// The 3D view as one SVG that scales with the column.
import { textWidth } from "../../shared/format.ts";
import type { SunAzimuthHost } from "../config.ts";
import type { PositionedDay } from "../config.ts";
import type { SunSample } from "../day.ts";
import { CHIP_FONT } from "../constants.ts";
import { sceneGeometry } from "../scene.ts";
import type { Side } from "../sides.ts";
import { chipSvg, compass, deg } from "./text.ts";

const f1 = (v: number) => v.toFixed(1);

export const renderScene = (
  card: SunAzimuthHost,
  host: HTMLElement,
  day: PositionedDay,
  now: SunSample,
  sides: Side[],
  camera: number,
) => {
  const cfg = card._config,
    hass = card._hass;
  const g = sceneGeometry(day, now, day.lat, cfg.rotation, camera, sides);
  const uid = card._uid || (card._uid = Math.random().toString(36).slice(2, 8));
  let html = `<svg class="scene" viewBox="0 0 ${g.w} ${g.h}">
    <defs><radialGradient id="sky-${uid}" cx="38%" cy="32%" r="75%"><stop offset="0" class="sky0"/><stop offset="1" class="sky1"/></radialGradient></defs>
    <path class="dome" fill="url(#sky-${uid})" d="${g.dome}"/><path class="domearc" d="${g.domeArc}"/>`;
  if (g.pathBackFuture) html += `<path class="future back" d="${g.pathBackFuture}"/>`;
  if (g.pathBackPast) html += `<path class="past back" d="${g.pathBackPast}"/>`;
  html += `<path class="ground" d="${g.ground}"/><path class="horizon back" d="${g.horizonBack}"/><path class="gticks" d="${g.groundTicks}"/>`;
  if (g.shadow) html += `<path class="shadow" d="${g.shadow}"/>`;
  if (g.ray) html += `<path class="ray" d="${g.ray}"/>`;
  html += `<path class="cardinals" d="${g.cardinalLines}"/>`;
  if (g.azArc) html += `<path class="azarc" d="${g.azArc}"/>`;
  for (const f of g.faces)
    html += `<path class="face${f.lit ? " lit" : ""}" style="--inc: ${Math.round(35 + f.incidence * 45)}%" d="${f.d}"/>`;
  html += `<path class="roof" d="${g.roof}"/>`;
  for (const e of g.roofEdges) html += `<path class="redge${e.lit ? " lit" : ""}" d="${e.d}"/>`;
  html += `<path class="horizon front" d="${g.horizonFront}"/>`;
  html += `<path class="pole" d="${g.pole}"/>`;
  if (g.drop) html += `<path class="drop" d="${g.drop}"/>`;
  if (g.pathFrontFuture) html += `<path class="future" d="${g.pathFrontFuture}"/>`;
  if (g.pathFrontPast) html += `<path class="past" d="${g.pathFrontPast}"/>`;
  html += `<circle class="poletop" cx="${f1(g.poleTop[0])}" cy="${f1(g.poleTop[1])}" r="3"/>`;
  for (const c of g.cardinals)
    html += `<text class="cl" x="${f1(c.x)}" y="${f1(c.y)}">${compass(hass, c.bearing)}</text>`;
  if (g.groundDot)
    html += `<circle class="gdot" cx="${f1(g.groundDot[0])}" cy="${f1(g.groundDot[1])}" r="3"/>`;
  if (g.azChip) html += chipSvg(deg(hass, now.az), g.azChip[0], g.azChip[1]);
  if (g.chip) {
    const label = deg(hass, now.el),
      w = Math.ceil(textWidth(label, CHIP_FONT)) + 16;
    html += chipSvg(label, g.chip[0] + 8 + w / 2, g.chip[1]);
  }
  if (g.sun)
    html += `<circle class="pulse" cx="${f1(g.sun[0])}" cy="${f1(g.sun[1])}" r="9"/><circle class="sun" cx="${f1(g.sun[0])}" cy="${f1(g.sun[1])}" r="7"/>`;
  html += "</svg>";
  host.innerHTML = html;
};
