// Styles of the sun path card.
import { tipStyle } from "../shared/hover.ts";
import { STYLE_HOST, STYLE_ICONS } from "../shared/constants.ts";
import { PLOT_H } from "./constants.ts";
import { HEADER_TITLE, fs, fw, lh, type } from "../shared/typography.ts";

export const STYLE = `
  ${STYLE_ICONS}
  /* min-width/overflow: as a grid item the card must never grow past its column because of long text */
  ${STYLE_HOST}
  ha-card { height: 100%; box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden; contain: inline-size; }
  .header { display: flex; align-items: center; gap: 10px; padding: 12px 16px 0 16px; min-width: 0; }
  .header ha-icon { flex: none; color: var(--secondary-text-color); --mdc-icon-size: 20px; }
  .header .title { flex: 1; min-width: 0; ${HEADER_TITLE} color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .body { padding: 16px 16px 12px 16px; flex: 1; display: flex; flex-direction: column; min-width: 0; }
  .header:not([style*="none"]) + .body { padding-top: 12px; }
  .row { display: flex; justify-content: space-between; gap: 12px; }
  .row .ev { flex: 1 1 0; min-width: 0; overflow: hidden; }
  .ev.right { text-align: right; }
  .lbl {
    ${type(12, 16)} color: var(--secondary-text-color);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .val {
    ${type(24, 32)} font-weight: ${fw("medium")}; color: var(--primary-text-color);
    font-variant-numeric: tabular-nums; white-space: nowrap;
  }
  .plot { position: relative; height: ${PLOT_H}px; margin-top: 4px; min-width: 0; touch-action: pan-y; }
  /* a taller card: the plot takes the room the rest of the card leaves; a smaller one shrinks it,
     down to a floor */
  .body { min-height: 0; }
  .plot { flex: 1 1 auto; min-height: 48px; }
  /* absolutely positioned so the SVG's viewBox never feeds back into the card's intrinsic width */
  svg { position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: visible; }
  .horizon, .tick { stroke: var(--divider-color); stroke-width: 1; }
  .curve { fill: none; stroke-width: 2; stroke-linejoin: round; stroke-linecap: butt; }
  .curve.future { opacity: .35; }
  .wash { opacity: .12; }
  .sun { stroke: var(--ha-card-background, var(--card-background-color)); stroke-width: 2; }
  /* hover: crosshair + dot on the curve, tooltip with time and elevation */
  .hair { stroke: var(--divider-color); stroke-width: 1; }
  .dot { stroke: var(--ha-card-background, var(--card-background-color)); stroke-width: 2; }
  ${tipStyle()}
  .tip .time { color: var(--secondary-text-color); margin-bottom: 2px; }
  .tip .row { display: flex; align-items: center; gap: 6px; }
  .tip .row b { font-weight: 600; font-variant-numeric: tabular-nums; }
  .tip .row span { color: var(--secondary-text-color); }
  /* the label's line and the time's: 38 px at the default text size */
  .events { position: relative; height: calc(${lh(12, 18)} + ${lh(14, 20)}); margin-top: 6px; }
  .events .ev { position: absolute; top: 0; text-align: center; }
  .events .lbl { font-size: ${fs(12)}; }
  .events .sm { ${type(14, 20)} font-weight: ${fw("medium")}; color: var(--primary-text-color); font-variant-numeric: tabular-nums; white-space: nowrap; }
`;
