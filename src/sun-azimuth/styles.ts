// Styles of the sun azimuth card. --saz-sun / --saz-night / --saz-sky are set on the card from
// the config colours; --c is the colour of a lead or row (the sun's while it is up).
import { ICON_RADIUS, STYLE_HOST, STYLE_ICONS, iconBg } from "../shared/constants.ts";
import { STYLE_SLIDER } from "../shared/slider.ts";
import {
  HEADER_TITLE,
  TILE_PRIMARY,
  TILE_SECONDARY,
  font,
  lh,
  fw,
  type,
} from "../shared/typography.ts";

const CARD_BG = "var(--ha-card-background, var(--card-background-color))";
// a stroke width of the pictures: full at full size, thinner as the picture shrinks (--k is set
// on each <svg> from its size); hairlines of 1 px stay as they are
const sw = (px: number) => `calc(${px}px * var(--k, 1))`;
const SUN = "var(--saz-sun)",
  SEC = "var(--secondary-text-color)";
// A faded line is a solid colour mixed into the card, as it would look at that opacity:
// overlapping strokes (the ring and its ticks) stay even, where opacity would darken every
// overlap. The pictures keep light mode's relations in a dark theme (ha-card.dark): the sky a
// little lighter than the ground, the shadow darker, the house a raised grey, and the sun's
// faded tints mixed stronger (--saz-fade) so they stay amber instead of turning olive
const solid = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, ${CARD_BG})`;
const fade = (pct: number) =>
  `color-mix(in srgb, ${SUN} calc(100% - ${100 - pct}% * var(--saz-fade)), ${CARD_BG})`;
const sky = (pct: number) =>
  `color-mix(in srgb, var(--saz-sky) calc(${pct}% * var(--saz-skyk)), ${CARD_BG})`;
// what --divider-color (12 % of the text colour) looks like on the card
const DIVIDER = solid("var(--primary-text-color)", 12);
// the house's walls in shade, and its plain walls and ridge seen from above
const HOUSE = "var(--saz-house)",
  HOUSE_EDGE = `color-mix(in srgb, var(--primary-text-color) 14%, ${HOUSE})`;

export const STYLE = `
  ${STYLE_ICONS}
  ${STYLE_HOST}
  ha-card { height: 100%; box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden; contain: inline-size; container-type: inline-size; }
  ha-card { --saz-fade: 1; --saz-skyk: 1; --saz-shadow: .13; --saz-house: ${CARD_BG}; --saz-sky0: 2%; --saz-sky1: 14%; --saz-ground: 10%; }
  ha-card.dark { --saz-fade: .7; --saz-skyk: 2; --saz-shadow: .4; --saz-house: color-mix(in srgb, var(--primary-text-color) 18%, ${CARD_BG}); --saz-sky0: 14%; --saz-sky1: 20%; --saz-ground: 9%; }
  /* 4 px here and the body's 12 px: the title line sits 16 px above the first row, as on the entity cards */
  .header { display: flex; align-items: center; gap: 10px; padding: 12px 16px 4px 16px; min-width: 0; }
  .header ha-icon { flex: none; color: var(--secondary-text-color); --mdc-icon-size: 20px; }
  .header .title { flex: 1; min-width: 0; ${HEADER_TITLE} color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .body { padding: 12px 16px 14px 16px; flex: 1; display: flex; flex-direction: column; gap: 14px; min-width: 0; }
  /* dividers run from edge to edge, through the body's side padding */
  .divider { height: 1px; margin: 0 -16px; background: var(--divider-color); flex: none; }
  .top { display: flex; align-items: center; gap: 12px; min-width: 0; --c: var(--saz-sun); }
  /* the tile shape of the other cards: 36 px, a 24 px icon */
  .lead { position: relative; flex: none; width: 36px; height: 36px; border-radius: ${ICON_RADIUS}; display: flex; align-items: center; justify-content: center; color: var(--c); background: ${iconBg("var(--c)")}; --mdc-icon-size: 24px; }
  .lead ha-icon { display: block; }
  .rot { display: flex; transition: transform .6s; }
  .texts { flex: 1 1 0; min-width: 24px; display: flex; flex-direction: column; gap: 2px; }
  .primary { ${TILE_PRIMARY} white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .secondary { ${TILE_SECONDARY} white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
  .line { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .pill { flex: none; ${type(12, 16)} font-weight: ${fw("medium")}; padding: 4px 10px; border-radius: 999px; color: var(--c); background: color-mix(in srgb, var(--c) 20%, transparent); white-space: nowrap; letter-spacing: .02em; max-width: 45%; overflow: hidden; text-overflow: ellipsis; }
  .key { ${type(11, 16)} letter-spacing: .08em; text-transform: uppercase; font-weight: ${fw("medium")}; color: var(--secondary-text-color); white-space: nowrap; }
  .sechead { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .lead.rise { --c: var(--saz-sun); }
  .lead.noon { --c: var(--orange-color); }
  .lead.set { --c: var(--saz-night); }
  /* the pictures */
  .visual { display: flex; justify-content: center; min-width: 0; }
  .visual svg { display: block; width: 100%; overflow: visible; }
  /* the picture's own height for its width is the basis (set in render); a taller card gives it
     more room, centred, a smaller one less, and the picture fits into it */
  .body { min-height: 0; }
  .visual { flex: 1 1 auto; min-height: 0; align-items: center; overflow: hidden; }
  svg.dial { max-width: 300px; }
  /* .cl-probe: the compass labels' font where the card reads it (an SVG text cannot be probed) */
  svg text, .cl-probe { ${font(10, undefined, "medium")} fill: var(--secondary-text-color); text-anchor: middle; dominant-baseline: central; }
  /* the horizon ring in the ticks' colour */
  .dial .disc { fill: ${sky(5)}; stroke: ${solid(SEC, 55)}; stroke-width: ${sw(2)}; }
  .dial .grid { fill: none; stroke: ${DIVIDER}; stroke-width: 1; stroke-dasharray: 3 4; }
  .dial .ticks, .scene .gticks { stroke: ${solid(SEC, 55)}; stroke-width: ${sw(1.5)}; }
  .dial .dayarc { fill: none; stroke: ${fade(30)}; stroke-width: ${sw(4)}; stroke-linecap: round; }
  .dial .beam { fill: none; stroke: ${fade(70)}; stroke-width: ${sw(1.5)}; stroke-dasharray: 2 4; }
  .future { fill: none; stroke: ${fade(45)}; stroke-width: ${sw(2)}; stroke-dasharray: 4 4; }
  .past { fill: none; stroke: ${SUN}; stroke-width: ${sw(2.5)}; stroke-linecap: round; }
  /* the house: in the dial its walls are filled bands inside the footprint (no strokes) */
  .dial .footprint { fill: ${HOUSE}; }
  /* the roof seen from above, under the walls so its ends tuck under them */
  .dial .ridge { fill: none; stroke: ${HOUSE_EDGE}; stroke-width: ${sw(1.5)}; stroke-linecap: round; }
  .wall { fill: ${HOUSE_EDGE}; }
  .wall.lit { fill: ${SUN}; }
  .dial .mark { fill: ${CARD_BG}; stroke-width: ${sw(2)}; }
  .dial .mark.rise { stroke: ${SUN}; }
  .dial .mark.set { stroke: var(--saz-night); }
  .sun { fill: ${SUN}; stroke: ${CARD_BG}; stroke-width: ${sw(3)}; }
  .sun.down { fill: var(--saz-night); }
  .pulse { fill: none; stroke: ${SUN}; stroke-width: ${sw(2)}; transform-box: fill-box; transform-origin: center; animation: saz-pulse 2.4s ease-out infinite; }
  .pulse.down { stroke: var(--saz-night); }
  @keyframes saz-pulse { 0% { transform: scale(.8); opacity: .6; } 100% { transform: scale(2.2); opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .pulse { animation: none; opacity: 0; } .rot { transition: none; } }
  /* the dome: lightest at its top left; in a dark theme an even dusk, a little lighter than the ground */
  .scene .sky0 { stop-color: color-mix(in srgb, var(--saz-sky) var(--saz-sky0), ${CARD_BG}); }
  .scene .sky1 { stop-color: color-mix(in srgb, var(--saz-sky) var(--saz-sky1), ${CARD_BG}); }
  .scene .domearc { fill: none; stroke: ${DIVIDER}; stroke-width: ${sw(1.5)}; }
  .scene .ground { fill: color-mix(in srgb, var(--saz-sky) var(--saz-ground), ${CARD_BG}); }
  .scene .horizon { fill: none; stroke: ${solid(SEC, 70)}; stroke-width: ${sw(1.5)}; }
  .scene .horizon.back { stroke: ${solid(SEC, 40)}; stroke-width: ${sw(1.2)}; }
  .scene .pole { fill: none; stroke: ${solid(SEC, 60)}; stroke-width: ${sw(1.2)}; }
  .scene .past.back { stroke: ${fade(85)}; }
  .scene .shadow { fill: var(--black-color); opacity: var(--saz-shadow); }
  .scene .ray { fill: none; stroke: ${fade(60)}; stroke-width: ${sw(1.5)}; }
  .cardinals { fill: none; stroke: ${solid(SEC, 60)}; stroke-width: 1; stroke-dasharray: 2 3; }
  .azarc { fill: none; stroke: ${solid(SEC, 45)}; stroke-width: ${sw(1.2)}; }
  /* the 3D house: no outlines, the surfaces' shades make its edges. The sun's colour by how
     directly it hits (--inc, stronger in a dark theme) over a grey by how the surface turns from
     the soft light (--shade); the stroke in the same colour closes the seams between neighbours */
  .scene .face { --i: 0%; --face: color-mix(in srgb, ${SUN} var(--i), color-mix(in srgb, var(--blue-grey-color) var(--shade, 20%), ${HOUSE})); fill: var(--face); stroke: var(--face); stroke-width: .6; stroke-linejoin: round; }
  .scene .face.lit { --i: calc(100% - (100% - var(--inc, 50%)) * var(--saz-fade)); }
  .scene .drop { fill: none; stroke: ${SUN}; stroke-width: ${sw(1.5)}; stroke-dasharray: 3 3; }
  .scene .poletop { fill: ${SEC}; }
  .scene .gdot { fill: ${SUN}; }
  .chip rect { fill: color-mix(in srgb, ${CARD_BG} 80%, transparent); }
  /* .chip-probe: the chip text's font where the card reads it (an SVG text cannot be probed) */
  .chip text, .chip-probe { ${font(12, 16, "medium")} fill: var(--primary-text-color); font-variant-numeric: tabular-nums; }
  /* the camera slider of the 3D view: the controls' slider in the sun colour, compass points below */
  .control { --fe-color: var(--saz-sun); display: flex; flex-direction: column; gap: 2px; min-width: 0; margin-top: -4px; }
  ${STYLE_SLIDER}
  /* the points sit under the knob's centre, which runs from one end of the track to the other */
  .caxis { position: relative; height: ${lh(10, 12)}; }
  .caxis span { position: absolute; top: 0; transform: translateX(-50%); ${font(10, 12)} color: var(--secondary-text-color); white-space: nowrap; }
  .caxis span:nth-child(1) { left: 0; }
  .caxis span:nth-child(2) { left: 25%; }
  .caxis span:nth-child(3) { left: 50%; }
  .caxis span:nth-child(4) { left: 75%; }
  .caxis span:nth-child(5) { left: 100%; }
  /* the house line: a caption under the plot, quieter than the head */
  .house { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 0; margin-top: -4px; text-align: center; }
  .house .primary { max-width: 100%; ${type(13, 18)} font-weight: ${fw("normal")}; }
  .house .secondary { max-width: 100%; }
  /* sunrise / noon / sunset */
  .items { display: flex; justify-content: space-between; gap: 8px; }
  /* each event as a small tile: the lead, the time and its line under it */
  .item { flex: none; display: flex; align-items: center; gap: 8px; min-width: 0; }
  /* sunrise and sunset keep their short lines; only the noon line (long in some languages) gives way */
  .item:nth-child(2) { flex: 0 1 auto; }
  .itexts { display: flex; flex-direction: column; min-width: 0; }
  .item .v { ${type(14, 18)} font-weight: ${fw("medium")}; color: var(--primary-text-color); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .item .n { ${type(12, 16)} color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  /* the sides of the house */
  .sides { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
  .side { align-items: flex-start; }
  .side .pill { color: var(--blue-grey-color); background: color-mix(in srgb, var(--blue-grey-color) 20%, transparent); }
  .side .pill.on { color: var(--saz-sun); background: color-mix(in srgb, var(--saz-sun) 20%, transparent); }
  .lbar { height: 8px; border-radius: 4px; background: color-mix(in srgb, var(--primary-text-color) 8%, transparent); position: relative; }
  .lbar i { position: absolute; top: 0; bottom: 0; border-radius: 4px; background: var(--saz-sun); }
  .lbar .hair { display: none; position: absolute; top: -4px; bottom: -4px; width: 1px; margin-left: -.5px; background: var(--secondary-text-color); opacity: .6; }
  .sides.scrub .lbar .hair { display: block; }
  /* hover_preview: near the sun's path the plot previews too */
  .visual.near { cursor: crosshair; }
  /* hover_preview: the bar is what previews; its hit area reaches 6 px above and below it */
  .sides.preview .lbar { cursor: crosshair; touch-action: pan-y; }
  .sides.preview .lbar::after { content: ""; position: absolute; inset: -6px 0; }
  .lbar b { position: absolute; top: 50%; width: 6px; height: 6px; margin: -5px 0 0 -5px; border-radius: 50%; background: ${CARD_BG}; border: 2px solid var(--primary-text-color); }
  .axis { display: flex; justify-content: space-between; padding-left: 52px; margin-top: -4px; ${font(10, 12)} color: var(--secondary-text-color); font-variant-numeric: tabular-nums; }
  /* a narrow column: the rows keep their words, the small leads go (after .axis: same specificity) */
  @container (max-width: 340px) { .item .lead, .side .lead { display: none; } .axis { padding-left: 0; } }
`;
