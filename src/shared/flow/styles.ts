// CSS shared by the flow cards: the tile / hero typography, the animated lead's circle, the band,
// the flow tile (the band behind the texts, with a narrow and a wide text variant), the chip and
// the reduced-motion pause. The `w` prefix of the class names is historical (the wind card came
// first); the rain card uses the same ones. Each card appends its own particles and keyframes.
import { BAND } from "./constants.ts";
import { ICON_RADIUS, iconBg } from "../constants.ts";
import { fs, fw, type } from "../typography.ts";

export const STYLE_FLOW = `
  .row.wtile { flex: 1; justify-content: center; }
  .whero .big b { ${type(40, 44)} letter-spacing: -1px; }
  .whero .big span { font-size: ${fs(16)}; }
  .whero .primary { font-size: ${fs(15)}; }
  .whero .secondary { white-space: normal; }
  .secondary .accent { color: var(--fe-color); font-weight: ${fw("medium")}; }

  /* the animated lead: whatever the card draws, clipped to the icon's soft shape */
  .lead.wlead { overflow: hidden; border-radius: ${ICON_RADIUS}; }

  /* the band: the animation behind a chip */
  .wflow { position: relative; overflow: hidden; border-radius: 10px; background: color-mix(in srgb, var(--fe-color) 7%, transparent); contain: layout paint; }
  /* the hero's band: flow.height is its height and its basis; a taller card gives it the room the
     lead leaves, down to the smallest band (the field follows the band's measured box) */
  .wflow.band { flex: 1 1 auto; height: var(--band-h, 120px); min-height: ${BAND.minBandH}px; }
  .body:has(> .wflow.band) { flex: 1 1 auto; min-height: 0; }
  .row.wtile.flow { position: relative; container-type: inline-size; }
  .wflow.bg .chip { display: none; }
  /* a narrow flow tile shows the plain tile's line; a wide one the label line and the big value */
  .row.wtile.flow .secondary:not(.narrow), .row.wtile.flow .end { display: none; }
  @container (min-width: 340px) {
    .row.wtile.flow .secondary:not(.narrow) { display: block; }
    .row.wtile.flow .secondary.narrow { display: none; }
    .row.wtile.flow .end { display: flex; }
  }
  .row.wtile.flow .wflow.bg { position: absolute; inset: -6px -12px; border-radius: 0; }
  .row.wtile.flow > .hit { inset: -6px -12px; }
  .row.wtile.flow .top { position: relative; }
  .row.wtile.flow .lead .shape { background: ${iconBg("var(--fe-color)", "var(--ha-card-background, var(--card-background-color))")}; }
  .row.wtile.flow .lead.plain .shape { background: transparent; }
  .row.wtile.flow .end .big b { ${type(26, 30)} }

  /* the chip on the band */
  .chip { position: absolute; left: 8px; top: 8px; display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px 2px 4px; border-radius: 999px; background: color-mix(in srgb, var(--ha-card-background, var(--card-background-color)) 80%, transparent); ${type(12, 16)} font-weight: ${fw("medium")}; color: var(--primary-text-color); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .chip ha-icon { --mdc-icon-size: 14px; color: var(--fe-color); }
`;
// appended last by every flow card: the `animation` shorthands of the particles would reset the
// play state if this came before them
export const STYLE_FLOW_MOTION = `
  @media (prefers-reduced-motion: reduce) { .wflow *, .lead.wlead * { animation-play-state: paused; } }
`;
