// The 3D view as one SVG as wide as the column (px units, so the labels keep their size; the
// lines and dots follow the sphere's size through --k).
import type { SunAzimuthHost } from "../config.ts";
import type { PositionedDay } from "../config.ts";
import type { SunSample } from "../day.ts";
import { sceneGeometry } from "../scene.ts";
import type { Side } from "../sides.ts";
import { chipSvg, chipWidth, compass, deg, timeChip } from "./text.ts";

const f1 = (v: number) => v.toFixed(1);

export const renderScene = (
  card: SunAzimuthHost,
  host: HTMLElement,
  day: PositionedDay,
  now: SunSample,
  sides: Side[],
  camera: number,
  width: number,
  height = Infinity,
  timeLabel?: string, // a preview's time, in a chip above the sun
) => {
  const cfg = card._config,
    hass = card._hass;
  const tx = card._text;
  const g = sceneGeometry(
    day,
    now,
    day.lat,
    cfg.front,
    camera,
    sides,
    width,
    cfg.roof,
    height,
    tx?.scale,
  );
  const uid = card._uid || (card._uid = Math.random().toString(36).slice(2, 8));
  const k = g.k;
  let html = `<svg class="scene" viewBox="0 0 ${g.w} ${g.h}" style="--k: ${k.toFixed(2)}">
    <defs><radialGradient id="sky-${uid}" cx="38%" cy="32%" r="75%"><stop offset="0" class="sky0"/><stop offset="1" class="sky1"/></radialGradient></defs>
    <path class="dome" fill="url(#sky-${uid})" d="${g.dome}"/><path class="domearc" d="${g.domeArc}"/>`;
  if (g.pathBackFuture) html += `<path class="future back" d="${g.pathBackFuture}"/>`;
  if (g.pathBackPast) html += `<path class="past back" d="${g.pathBackPast}"/>`;
  html += `<path class="ground" d="${g.ground}"/><path class="horizon back" d="${g.horizonBack}"/><path class="gticks" d="${g.groundTicks}"/>`;
  if (g.shadow) html += `<path class="shadow" d="${g.shadow}"/>`;
  if (g.ray) html += `<path class="ray" d="${g.ray}"/>`;
  html += `<path class="cardinals" d="${g.cardinalLines}"/>`;
  if (g.azArc) html += `<path class="azarc" d="${g.azArc}"/>`;
  // each surface: the sun's colour by how directly it hits, over a grey by how it turns away
  // from the soft light; the roof a darker grey than the walls
  for (const f of g.faces) {
    const inc = f.lit ? Math.round(30 + f.incidence * 50) : 0,
      shade = Math.round((f.roof ? 38 : 10) + f.shade * 30);
    html += `<path class="face${f.roof ? " roof" : ""}${f.lit ? " lit" : ""}" style="--inc: ${inc}%; --shade: ${shade}%" d="${f.d}"/>`;
  }
  html += `<path class="horizon front" d="${g.horizonFront}"/>`;
  html += `<path class="pole" d="${g.pole}"/>`;
  if (g.drop) html += `<path class="drop" d="${g.drop}"/>`;
  if (g.pathFrontFuture) html += `<path class="future" d="${g.pathFrontFuture}"/>`;
  if (g.pathFrontPast) html += `<path class="past" d="${g.pathFrontPast}"/>`;
  html += `<circle class="poletop" cx="${f1(g.poleTop[0])}" cy="${f1(g.poleTop[1])}" r="${f1(3 * k)}"/>`;
  for (const c of g.cardinals)
    html += `<text class="cl" x="${f1(c.x)}" y="${f1(c.y)}">${compass(hass, c.bearing)}</text>`;
  if (g.groundDot)
    html += `<circle class="gdot" cx="${f1(g.groundDot[0])}" cy="${f1(g.groundDot[1])}" r="${f1(3 * k)}"/>`;
  if (g.azChip) html += chipSvg(deg(hass, now.az), g.azChip[0], g.azChip[1], tx);
  if (g.chip) {
    const label = deg(hass, now.el),
      w = chipWidth(label, tx);
    // right of the drop line, or left of it where the right edge would cut it
    const right = g.chip[0] + 8 + w / 2;
    html += chipSvg(label, right + w / 2 > g.w ? g.chip[0] - 8 - w / 2 : right, g.chip[1], tx);
  }
  if (g.sun)
    // the pulse marks now: a preview (redrawn as the pointer moves) shows the sun without it
    html +=
      (timeLabel
        ? ""
        : `<circle class="pulse" cx="${f1(g.sun[0])}" cy="${f1(g.sun[1])}" r="${f1(9 * k)}"/>`) +
      `<circle class="sun" cx="${f1(g.sun[0])}" cy="${f1(g.sun[1])}" r="${f1(7 * k)}"/>`;
  if (timeLabel && g.sun) html += timeChip(timeLabel, g.sun[0], g.sun[1] - 9 * k, g.w, tx);
  html += "</svg>";
  host.innerHTML = html;
  return g.track;
};
