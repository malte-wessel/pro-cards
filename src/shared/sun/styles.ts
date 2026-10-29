// The sun curve inside a card's `.psun` plot (the poster's sun kind): the washes, the horizon and
// the ticks, the curve (the hours to come lighter), the sun now, and the tooltip's crosshair.
import { CARD_BG } from "../constants.ts";
import { tipStyle } from "../hover.ts";

export const STYLE_SUN_CURVE = `
  .psun svg { position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: visible; }
  .psun :is(.horizon, .tick) { stroke: var(--divider-color); stroke-width: 1; }
  .psun .curve { fill: none; stroke-width: 2; stroke-linejoin: round; stroke-linecap: butt; }
  .psun .curve.future { opacity: .35; }
  .psun .wash { opacity: .12; }
  .psun .sun { stroke: ${CARD_BG}; stroke-width: 2; }
  .psun .hair { stroke: var(--divider-color); stroke-width: 1; }
  .psun .dot { stroke: ${CARD_BG}; stroke-width: 2; }
  ${tipStyle(".psun ")}
  .psun .tip .time { color: var(--secondary-text-color); margin-bottom: 2px; }
  .psun .tip .row { display: flex; align-items: center; gap: 6px; }
  .psun .tip .row b { font-weight: 600; font-variant-numeric: tabular-nums; }
  .psun .tip .row span { color: var(--secondary-text-color); }
`;
