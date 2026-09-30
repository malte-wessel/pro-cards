// CSS of the rain card on top of the flow engine's styles. Theme tokens only; --fe-color (the
// rate rule's colour) tints drops, rings, water and the chip. The band sets --fall (one drop's
// fall) for the rate it was built for, --t / --sl (the wind's slant), --H (the fall height),
// --sb (where splashes sit) and --lv (the gauge level); every element carries its phase --p0 and
// its base styles place it at that phase, so a paused frame still shows rain.
import { STYLE_GROUP_CARD, STYLE_TILE } from "../shared/entity/render/styles.ts";
import { STYLE_FLOW, STYLE_FLOW_MOTION } from "../shared/flow/styles.ts";

const STYLE_RAIN = `
  .wflow, .row { --fall: .9s; --wp: 3s; --t: 0; --sl: 0deg; --H: 120px; --sb: 0px; --lv: 8%; }
  .rfield { position: absolute; inset: 0; pointer-events: none; }
  /* the lead: the icon shows on a dry day and always for ripples; the rain is clipped to the circle */
  .lead.wlead .rico { display: none; --mdc-icon-size: calc(var(--lead, 40px) * .36); position: relative; }
  .dry .lead.wlead .rico, .lead.wlead.ripples .rico { display: block; }
  .dry .dr, .dry .sp, .dry .rp { display: none; }

  /* drops: slanted streaks that fall the height of the field and splash at the bottom */
  .dr { position: absolute; top: 0; left: var(--x); width: var(--w); height: var(--h); border-radius: 1px; background: linear-gradient(to bottom, transparent, var(--fe-color)); opacity: var(--o);
        transform: translate(calc(var(--H) * var(--t) * var(--p0)), calc((var(--H) + 24px) * var(--p0) - 24px)) rotate(var(--sl));
        animation: rfall calc(var(--fall) * var(--k, 1)) linear infinite; animation-delay: calc(-1 * var(--p0) * var(--fall) * var(--k, 1)); }
  @keyframes rfall { 0% { transform: translate(0, -24px) rotate(var(--sl)); opacity: 0; } 6% { opacity: var(--o); } 92% { opacity: var(--o); } 100% { transform: translate(calc(var(--H) * var(--t)), var(--H)) rotate(var(--sl)); opacity: 0; } }
  .sp { position: absolute; width: 10px; height: 4px; margin: 0 0 -2px -5px; border-radius: 50%; border: 1px solid var(--fe-color); box-sizing: border-box; left: calc(var(--x) + var(--H) * var(--t)); bottom: var(--sb); opacity: 0; transform: scale(.2);
        animation: rsplash calc(var(--fall) * var(--k, 1)) ease-out infinite; animation-delay: calc(-1 * var(--p0) * var(--fall) * var(--k, 1)); }
  @keyframes rsplash { 0%, 88% { transform: scale(.2); opacity: 0; } 91% { opacity: .8; } 100% { transform: scale(1.5); opacity: 0; } }

  /* ripples: rings spreading where drops land */
  .rp { position: absolute; left: var(--x); top: var(--y); width: var(--w); height: var(--h); border-radius: 50%; border: 1.5px solid var(--fe-color); box-sizing: border-box;
        transform: translate(-50%, -50%) scale(calc(.08 + .92 * var(--p0))); opacity: calc(.9 * (1 - var(--p0)));
        animation: rring var(--dur) ease-out infinite; animation-delay: calc(-1 * var(--p0) * var(--dur)); }
  .rp.second { border-width: 1px; }
  @keyframes rring { 0% { transform: translate(-50%, -50%) scale(.08); opacity: .9; } 100% { transform: translate(-50%, -50%) scale(1); opacity: 0; } }

  /* the gauge: water up to today's total, a waving surface that scrolls one period per cycle */
  .water { position: absolute; left: 0; right: 0; bottom: 0; height: var(--lv); background: color-mix(in srgb, var(--fe-color) 22%, transparent); transition: height .6s; }
  /* the strip's troughs (16 px tall, midline 8, amplitude --wa) sit on the water's top edge */
  .wtop { position: absolute; left: 0; width: 110%; height: 16px; bottom: calc(var(--lv) - 8px + var(--wa, 3px)); transition: bottom .6s; animation: wvm var(--wp) linear infinite; }
  .wtop svg { display: block; width: 100%; height: 16px; }
  .wtop path { fill: color-mix(in srgb, var(--fe-color) 22%, transparent); }
  .lead.wlead .water, .lead.wlead .wtop path { background: color-mix(in srgb, var(--fe-color) 45%, transparent); fill: color-mix(in srgb, var(--fe-color) 45%, transparent); }
  @keyframes wvm { from { transform: translateX(0); } to { transform: translateX(-10%); } }

  .notoday .chip { display: none; }
  @media (prefers-reduced-motion: reduce) { .water, .wtop { transition: none; } }
`;

export const STYLE_RAIN_CARD =
  STYLE_GROUP_CARD + STYLE_TILE + STYLE_FLOW + STYLE_RAIN + STYLE_FLOW_MOTION;
