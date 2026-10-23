// CSS of the power flow card on top of the entity layer's styles. Theme tokens only; --pf-c is the
// colour of one link (the energy colour of what flows on it), --fe-color the colour of a node or
// the summary line. Every particle's base styles carry its phase (--p0), so a paused frame
// (prefers-reduced-motion) still shows a populated tree; that rule comes last because the
// `animation` shorthands would reset the play state otherwise.
import {
  STYLE_BASE,
  STYLE_BLOCKS,
  STYLE_HEADER,
  STYLE_ROW,
} from "../shared/entity/render/styles.ts";
import { iconBg } from "../shared/constants.ts";
import { fs, fw, type } from "../shared/typography.ts";

const CARD_BG = "var(--ha-card-background, var(--card-background-color))";

const STYLE_POWER = `
  .body { gap: 10px; }
  .psummary { --fe-color: var(--primary-color); }
  .psummary .secondary { white-space: normal; }
  .psummary .secondary .accent { color: var(--fe-color); font-weight: ${fw("medium")}; }
  .psummary .pill { flex: none; }

  .pdiag { position: relative; width: 100%; min-width: 0; height: var(--diag-h, 190px); contain: layout; }
  .pscale { position: absolute; left: 0; top: 0; width: 100%; height: 100%; transform-origin: 0 0; }
  /* a taller card: the diagram takes the room the rest of the card leaves (the tree's own height
     is its basis, never 0, so the card still counts its height in a grid row); a smaller one
     scales the tree down, into 64 px at least */
  .body { flex: 1 1 auto; min-height: 0; }
  .pdiag { flex: 1 1 auto; min-height: 64px; }
  .pdiag svg.abs { position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: visible; }
  .link { fill: none; stroke: var(--divider-color); stroke-width: 2; stroke-dasharray: 4 4; stroke-linejoin: round; }
  .link.active { stroke: color-mix(in srgb, var(--pf-c) 45%, ${CARD_BG}); stroke-dasharray: none; }
  .pdiag.idle-hidden .link:not(.active) { display: none; }
  .pdiag.idle-faint .link:not(.active) { stroke-dasharray: none; opacity: .35; }

  .pflow, .lane { position: absolute; inset: 0; pointer-events: none; }
  .pt, .fa { position: absolute; left: 0; top: 0; offset-path: var(--p); offset-distance: calc(var(--p0) * 100%); animation: pfm var(--dur, 3s) linear infinite; animation-delay: calc(-1 * var(--p0) * var(--dur, 3s)); }
  .pt { width: 6px; height: 6px; border-radius: 50%; background: var(--pf-c); box-shadow: 0 0 0 2px ${CARD_BG}; offset-rotate: 0deg; }
  .fa { height: 2px; border-radius: 1px; background: linear-gradient(90deg, transparent, var(--pf-c)); offset-rotate: auto; }
  .fa::after { content: ""; position: absolute; right: -3px; top: -3px; border-left: 6px solid var(--pf-c); border-top: 4px solid transparent; border-bottom: 4px solid transparent; }
  @keyframes pfm { from { offset-distance: 0%; } to { offset-distance: 100%; } }
  .sl { fill: none; stroke: var(--pf-c); stroke-width: 3; stroke-linecap: round; stroke-dasharray: var(--dash) calc(var(--per) - var(--dash)); animation: pfl var(--dur, 3s) linear infinite; }
  @keyframes pfl { from { stroke-dashoffset: var(--per); } to { stroke-dashoffset: 0; } }
  /* a consumer that produces: its flow runs back to the home */
  .lane.back .pt, .lane.back .fa, .lane.back .sl { animation-direction: reverse; }
  .lane.back .fa { offset-rotate: reverse; }

  .pdiag .pnode { position: absolute; display: flex; flex-direction: column; transform: translate(-50%, -50%); gap: 0; z-index: 2; }
  /* a node stays round whatever the theme's icon shape: the links meet its circle */
  .pnode .lead .shape { border-radius: 50%; background: ${iconBg("var(--fe-color)", CARD_BG)}; }
  /* a diagram, not a tile: the icons stay lighter than the entity cards' (55 % of the circle, 42 %
     in a ring), so the home and the sources keep the weight; both scale with icon_size */
  :is(.pnode, .plist) .lead:not(.ring) .shape { --mdc-icon-size: calc(var(--lead) * .55); }
  .pnode > .hit:focus-visible { box-shadow: none; }
  .pnode > .hit:focus-visible ~ .lead .shape { box-shadow: 0 0 0 2px var(--fe-color); }
  .pnode .lead .prog { transition: stroke-dashoffset .4s, d .4s; }

  .plabel { position: absolute; z-index: 2; white-space: nowrap; line-height: 1.2; pointer-events: none; }
  .plabel .state, .plabel .v2 { display: block; ${type(14, 17)} }
  /* a label is not a tile: the tile card's variables (spacing, weight) stay out of it, as its
     width is measured without them */
  .plabel .secondary { ${type(12, 15)} font-weight: ${fw("normal")}; letter-spacing: normal; }
  .plabel .sec2 { opacity: .85; }
  .plabel .v2 { display: none; }
  .plabel.two { display: flex; flex-direction: column; }
  .plabel.two .v2 { display: block; }
  .plabel.two .v2.blank { order: 1; }
  .plabel.small .state, .plabel.small .v2 { ${type(12, 15)} }
  .plabel.small .secondary { ${type(11, 13)} }
  .plabel.l { transform: translateY(-50%); text-align: left; }
  .plabel.r { transform: translateY(-50%); text-align: right; }
  .plabel.c { transform: translateX(-50%); text-align: center; }
  .plabel.cut .secondary { display: block; max-width: var(--pl-max); overflow: hidden; text-overflow: ellipsis; }
  .plabel.c.cut .secondary { margin-inline: auto; }

  .pdiag .plist { position: absolute; display: flex; flex-direction: row; align-items: center; gap: 10px; box-sizing: border-box; z-index: 2; }
  .pdiag.narrow .plist .lead { display: none; }
  .plist .texts { gap: 3px; }
  .plist .line { gap: 6px; }
  .plist .primary { ${type(13, 16)} }
  .plist .state { font-size: ${fs(13)}; }
  .plist .secondary { ${type(11, 13)} margin-top: -2px; }
  .plist .bar { height: 4px; }
  .plist .bar i { border-radius: 2px; }

  @media (prefers-reduced-motion: reduce) { .pflow * { animation-play-state: paused; } .pnode .lead .prog { transition: none; } }
`;

export const STYLE_POWER_FLOW_CARD =
  STYLE_BASE + STYLE_HEADER + STYLE_ROW + STYLE_BLOCKS + STYLE_POWER;
