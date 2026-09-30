// Styles of the sun path card.
import { PLOT_H } from "./constants.ts";

export const STYLE = `
  /* min-width/overflow: as a grid item the card must never grow past its column because of long text */
  :host { display: block; min-width: 0; }
  ha-card { height: 100%; box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden; contain: inline-size; }
  .body { padding: 0 16px 12px 16px; flex: 1; display: flex; flex-direction: column; min-width: 0; }
  ha-card:not([header]) .body { padding-top: 16px; }
  .row { display: flex; justify-content: space-between; gap: 12px; }
  .row .ev { flex: 1 1 0; min-width: 0; overflow: hidden; }
  .ev.right { text-align: right; }
  .lbl {
    font-size: 12px; line-height: 16px; color: var(--secondary-text-color);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .val {
    font-size: 24px; line-height: 32px; font-weight: 500; color: var(--primary-text-color);
    font-variant-numeric: tabular-nums; white-space: nowrap;
  }
  .plot { position: relative; height: ${PLOT_H}px; margin-top: 4px; min-width: 0; touch-action: pan-y; }
  /* absolutely positioned so the SVG's viewBox never feeds back into the card's intrinsic width */
  svg { position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: visible; }
  .horizon, .tick { stroke: var(--divider-color); stroke-width: 1; }
  .curve { fill: none; stroke-width: 2; stroke-linejoin: round; stroke-linecap: butt; }
  .curve.future { opacity: .35; }
  .wash { opacity: .12; }
  .sun { stroke: var(--ha-card-background, var(--card-background-color)); stroke-width: 2; }
  /* hover: crosshair + dot on the curve, tooltip with time and elevation */
  .hover { display: none; }
  .hover.on { display: block; }
  .hair { stroke: var(--divider-color); stroke-width: 1; }
  .dot { stroke: var(--ha-card-background, var(--card-background-color)); stroke-width: 2; }
  .tip {
    position: absolute; top: 4px;
    pointer-events: none;
    background: var(--ha-card-background, var(--card-background-color));
    color: var(--primary-text-color);
    border: 1px solid var(--divider-color);
    border-radius: 8px;
    padding: 6px 8px;
    font-size: 12px; line-height: 16px;
    box-shadow: var(--ha-card-box-shadow, 0 2px 6px rgba(0,0,0,.2));
    white-space: nowrap;
    max-width: calc(100% - 8px);
    box-sizing: border-box;
    z-index: 1;
    display: none;
  }
  .tip.on { display: block; }
  .tip .time { color: var(--secondary-text-color); margin-bottom: 2px; }
  .tip .row { display: flex; align-items: center; gap: 6px; }
  .tip .row b { font-weight: 600; font-variant-numeric: tabular-nums; }
  .tip .row span { color: var(--secondary-text-color); }
  .events { position: relative; height: 38px; margin-top: 6px; }
  .events .ev { position: absolute; top: 0; text-align: center; }
  .events .lbl { font-size: 12px; }
  .events .sm { font-size: 14px; line-height: 20px; font-weight: 500; color: var(--primary-text-color); font-variant-numeric: tabular-nums; white-space: nowrap; }
`;
