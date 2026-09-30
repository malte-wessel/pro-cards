// CSS of the wind card on top of the entity layer's styles. Theme tokens only; --fe-color (the
// speed rule's colour) drives the particles, the lead and the chip. The animations are CSS
// keyframes: the band sets --dur (one 480 px crossing) from the speed, every element carries its
// duration factor --k and phase --p0, and the base (non-animated) values place each element at
// its phase so a paused frame (prefers-reduced-motion) still shows a populated field.
import { STYLE_GROUP_CARD, STYLE_TILE } from "../shared/entity/render/styles.ts";

const STYLE_WIND = `
  .row.wtile { flex: 1; justify-content: center; }
  .whero .big b { font-size: 40px; line-height: 44px; letter-spacing: -1px; }
  .whero .big span { font-size: 16px; }
  .whero .primary { font-size: 15px; }
  .whero .secondary { white-space: normal; }
  .secondary .accent { color: var(--fe-color); font-weight: 500; }

  /* the arrow: where the wind blows */
  .arrow { display: block; transform: rotate(var(--arrow, 0deg)); transition: transform 1.5s; }
  .nodir .arrow { display: none; }

  /* the animated lead: a rotated field inside the soft circle */
  .lead.wlead { overflow: hidden; border-radius: 50%; }
  .lead.wlead .lfield { position: absolute; inset: -25%; transform: rotate(var(--rot, 0deg)); transition: transform 1.5s; }
  .ld, .la, .ls { position: absolute; top: var(--t); background: var(--fe-color); }
  .ld { width: 5px; height: 5px; margin-top: -2px; border-radius: 50%; left: calc(-12% + var(--p0) * 120%); animation: lam var(--ldur, 1s) linear infinite; animation-delay: calc(-1 * var(--p0) * var(--ldur, 1s)); }
  .ld.trail { opacity: .5; scale: .75; }
  .la { width: 9px; height: 2px; border-radius: 1px; left: calc(-12% + var(--p0) * 120%); animation: lam var(--ldur, 1s) linear infinite; animation-delay: calc(-1 * var(--p0) * var(--ldur, 1s)); }
  .la::after { content: ""; position: absolute; right: -3px; top: -3px; border-left: 5px solid var(--fe-color); border-top: 4px solid transparent; border-bottom: 4px solid transparent; }
  @keyframes lam { from { left: -12%; } to { left: 108%; } }
  .ls { left: 0; width: var(--w); height: var(--h, 2px); border-radius: 1px; transform: translateX(calc(-120% + var(--p0) * 540%)); animation: lsm var(--ldur, 1s) linear infinite; animation-delay: calc(-1 * var(--p0) * var(--ldur, 1s)); }
  @keyframes lsm { from { transform: translateX(-120%); } to { transform: translateX(420%); } }
  .lead.wlead svg { inset: 19%; width: 62%; height: 62%; transform: rotate(var(--rot, 0deg)); transition: transform 1.5s; overflow: visible; }
  .lsw { fill: none; stroke: var(--fe-color); stroke-width: 2; stroke-linecap: round; stroke-dasharray: 100 100; stroke-dashoffset: var(--off); animation: lswm calc(var(--ldur, 1s) * 3.2) ease-in-out infinite; animation-delay: calc(-1 * var(--p0) * var(--ldur, 1s) * 3.2); }
  @keyframes lswm { 0% { stroke-dashoffset: 100; } 45% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -100; } }

  /* the flow band and its field: a square that covers the band at any rotation */
  .wflow { position: relative; overflow: hidden; border-radius: 10px; background: color-mix(in srgb, var(--fe-color) 7%, transparent); contain: layout paint; --dur: 4s; --gdur: 6s; }
  .wflow.band { flex: none; height: var(--band-h, 120px); }
  .row.wtile.flow { position: relative; container-type: inline-size; }
  .wflow.bg .chip { display: none; }
  /* a narrow flow tile shows "speed · direction" like the plain tile; a wide one the label, the gusts and the big value */
  .row.wtile.flow .secondary:not(.narrow), .row.wtile.flow .end { display: none; }
  @container (min-width: 340px) {
    .row.wtile.flow .secondary:not(.narrow) { display: block; }
    .row.wtile.flow .secondary.narrow { display: none; }
    .row.wtile.flow .end { display: flex; }
  }
  .row.wtile.flow .wflow.bg { position: absolute; inset: -8px -12px; border-radius: 0; }
  .row.wtile.flow .top { position: relative; }
  .row.wtile.flow .lead .shape { background: color-mix(in srgb, var(--fe-color) 20%, var(--ha-card-background, var(--card-background-color))); }
  .row.wtile.flow .end .big b { font-size: 26px; line-height: 30px; }
  .field { position: absolute; left: 50%; top: 50%; width: var(--size, 480px); height: var(--size, 480px); margin: calc(var(--size, 480px) / -2) 0 0 calc(var(--size, 480px) / -2); transform: rotate(var(--rot, 0deg)); transition: transform 1.5s; pointer-events: none; }
  .lane { position: absolute; inset: 0; }
  .pt, .fa, .gs { position: absolute; left: 0; top: 0; offset-path: var(--p); }
  .pt, .fa { offset-distance: calc(var(--p0) * 100%); opacity: var(--o); animation: wflow calc(var(--dur) * var(--k)) linear infinite; animation-delay: calc(-1 * var(--p0) * var(--dur) * var(--k)); }
  .pt { border-radius: 50%; background: var(--fe-color); offset-rotate: 0deg; }
  .fa { height: 2px; border-radius: 1px; background: linear-gradient(90deg, transparent, var(--fe-color)); offset-rotate: auto; scale: var(--s, 1); }
  .fa::after { content: ""; position: absolute; right: -3px; top: -3px; border-left: 6px solid var(--fe-color); border-top: 4px solid transparent; border-bottom: 4px solid transparent; }
  @keyframes wflow { 0% { offset-distance: 0%; opacity: 0; } 8% { opacity: var(--o); } 88% { opacity: var(--o); } 100% { offset-distance: 100%; opacity: 0; } }
  .gs { height: 2px; border-radius: 1px; background: linear-gradient(90deg, transparent, var(--fe-color)); offset-rotate: auto; opacity: 0; animation: wgust var(--gdur) ease-in infinite; animation-delay: calc(-1 * var(--p0) * var(--gdur)); }
  @keyframes wgust { 0% { offset-distance: 0%; opacity: 0; } 4% { opacity: .85; } 30% { offset-distance: 100%; opacity: 0; } 100% { offset-distance: 100%; opacity: 0; } }
  .sl { fill: none; stroke: var(--fe-color); stroke-linecap: round; stroke-dashoffset: var(--off); animation: slm calc(var(--dur) * var(--k)) linear infinite; animation-delay: calc(-1 * var(--p0) * var(--dur) * var(--k)); }
  @keyframes slm { from { stroke-dashoffset: var(--from); } to { stroke-dashoffset: -100; } }
  .swp { fill: none; stroke: var(--fe-color); stroke-linecap: round; stroke-dasharray: 34 200; stroke-dashoffset: var(--off); opacity: var(--o); animation: swm calc(var(--dur) * var(--k) + 1.2s) ease-in-out infinite; animation-delay: calc(-1 * var(--p0) * (var(--dur) * var(--k) + 1.2s)); }
  @keyframes swm { 0% { stroke-dashoffset: 34; opacity: 0; } 12% { opacity: var(--o); } 80% { opacity: var(--o); } 100% { stroke-dashoffset: -100; opacity: 0; } }

  /* the direction chip on the band */
  .chip { position: absolute; left: 8px; top: 8px; display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px 2px 4px; border-radius: 999px; background: color-mix(in srgb, var(--ha-card-background, var(--card-background-color)) 80%, transparent); font-size: 12px; line-height: 16px; font-weight: 500; color: var(--primary-text-color); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .chip ha-icon { --mdc-icon-size: 14px; color: var(--fe-color); }
  .nodir .chip { display: none; }

  @media (prefers-reduced-motion: reduce) { .wflow *, .lead.wlead * { animation-play-state: paused; } .field, .lfield, .lead.wlead svg, .arrow { transition: none; } }
`;

export const STYLE_WIND_CARD = STYLE_GROUP_CARD + STYLE_TILE + STYLE_WIND;
