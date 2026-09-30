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

const CARD_BG = "var(--ha-card-background, var(--card-background-color))";

const STYLE_POWER = `
  .body { gap: 10px; }
  .psummary { --fe-color: var(--primary-color); }
  .psummary .secondary { white-space: normal; }
  .psummary .secondary .accent { color: var(--fe-color); font-weight: 500; }
  .psummary .pill { flex: none; }

  .pdiag { position: relative; width: 100%; min-width: 0; height: var(--diag-h, 190px); contain: layout; }
  .pdiag svg.abs { position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: visible; }
  .link { fill: none; stroke: var(--divider-color); stroke-width: 2; stroke-dasharray: 4 4; stroke-linejoin: round; }
  .link.active { stroke: color-mix(in srgb, var(--pf-c) 45%, ${CARD_BG}); stroke-dasharray: none; }

  .pflow, .lane { position: absolute; inset: 0; pointer-events: none; }
  .pt, .fa { position: absolute; left: 0; top: 0; offset-path: var(--p); offset-distance: calc(var(--p0) * 100%); animation: pfm var(--dur, 3s) linear infinite; animation-delay: calc(-1 * var(--p0) * var(--dur, 3s)); }
  .pt { width: 6px; height: 6px; border-radius: 50%; background: var(--pf-c); box-shadow: 0 0 0 2px ${CARD_BG}; offset-rotate: 0deg; }
  .fa { height: 2px; border-radius: 1px; background: linear-gradient(90deg, transparent, var(--pf-c)); offset-rotate: auto; }
  .fa::after { content: ""; position: absolute; right: -3px; top: -3px; border-left: 6px solid var(--pf-c); border-top: 4px solid transparent; border-bottom: 4px solid transparent; }
  @keyframes pfm { from { offset-distance: 0%; } to { offset-distance: 100%; } }
  .sl { fill: none; stroke: var(--pf-c); stroke-width: 3; stroke-linecap: round; stroke-dasharray: var(--dash) calc(var(--per) - var(--dash)); animation: pfl var(--dur, 3s) linear infinite; }
  @keyframes pfl { from { stroke-dashoffset: var(--per); } to { stroke-dashoffset: 0; } }

  .pdiag .pnode { position: absolute; display: flex; flex-direction: column; transform: translate(-50%, -50%); gap: 0; z-index: 2; }
  .pnode .lead .shape { background: color-mix(in srgb, var(--fe-color) 20%, ${CARD_BG}); }
  .pnode.actionable:focus-visible { box-shadow: none; }
  .pnode.actionable:focus-visible .lead .shape { box-shadow: 0 0 0 2px var(--fe-color); }
  .pnode .lead .prog { transition: stroke-dashoffset .4s, d .4s; }

  .plabel { position: absolute; z-index: 2; white-space: nowrap; line-height: 1.2; pointer-events: none; }
  .plabel .state { display: block; font-size: 14px; line-height: 17px; }
  .plabel .secondary { line-height: 15px; }
  .plabel.small .state { font-size: 12px; line-height: 15px; }
  .plabel.small .secondary { font-size: 11px; line-height: 13px; }
  .plabel.l { transform: translateY(-50%); text-align: left; }
  .plabel.r { transform: translateY(-50%); text-align: right; }
  .plabel.c { transform: translateX(-50%); text-align: center; }

  .pdiag .plist { position: absolute; display: flex; flex-direction: row; align-items: center; gap: 10px; box-sizing: border-box; z-index: 2; }
  .pdiag.narrow .plist .lead { display: none; }
  .plist .texts { gap: 3px; }
  .plist .line { gap: 6px; }
  .plist .primary { font-size: 13px; line-height: 16px; }
  .plist .state { font-size: 13px; }
  .plist .bar { height: 4px; }
  .plist .bar i { border-radius: 2px; }

  @media (prefers-reduced-motion: reduce) { .pflow * { animation-play-state: paused; } .pnode .lead .prog { transition: none; } }
`;

export const STYLE_POWER_FLOW_CARD =
  STYLE_BASE + STYLE_HEADER + STYLE_ROW + STYLE_BLOCKS + STYLE_POWER;
