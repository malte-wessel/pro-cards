// Styles of the trend plot (`.plot.trend`) and its legend, shared by the multi trend card and the
// weather card. Theme tokens only.
import { AXIS_FONT } from "../constants.ts";

export const STYLE_TREND = `
  .legend {
    display: flex; flex-wrap: wrap; gap: 4px 14px;
    padding: 4px 12px 0 12px;
    font-size: 12px; line-height: 16px; color: var(--secondary-text-color);
  }
  .legend span { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; min-width: 0; }
  .legend span em { font-style: normal; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .legend i { flex: none; display: inline-block; width: 14px; height: 2px; border-radius: 1px; background: var(--c); }
  /* the drawn height is the basis; a fixed-height card stretches or shrinks it (flex), and
     min-height: 0 keeps the SVG's own size out of the layout, or a draw at the measured height
     would grow the plot that the next draw measures */
  .trend { position: relative; flex: 1 1 auto; min-height: 0; margin: 6px 12px 12px 12px; touch-action: pan-y; }
  .trend svg { display: block; width: 100%; height: 100%; overflow: hidden; border-radius: 4px; }
  .trend svg path.line { fill: none; stroke-width: 2; stroke-linejoin: round; stroke-linecap: butt; }
  .trend svg path.area { opacity: .12; }
  .trend svg .hair { stroke: var(--secondary-text-color); stroke-width: 1; opacity: .6; }
  .trend svg .dot { stroke: var(--ha-card-background, var(--card-background-color)); stroke-width: 2; }
  .trend .lane-label {
    position: absolute; left: 4px; max-width: calc(100% - 8px); box-sizing: border-box;
    padding: 0 3px; border-radius: 3px;
    background: color-mix(in srgb, var(--ha-card-background, var(--card-background-color)) 75%, transparent);
    font-size: 10px; line-height: 12px; color: var(--secondary-text-color);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none;
  }
  .trend svg .lane-sep { stroke: var(--divider-color); stroke-width: 1; }
  .trend svg .grid { stroke: var(--divider-color); stroke-width: 1; }
  .trend .axis-label {
    position: absolute; font: ${AXIS_FONT}; line-height: 12px; color: var(--secondary-text-color);
    white-space: nowrap; pointer-events: none; font-variant-numeric: tabular-nums;
  }
  .trend .axis-label.x { transform: translateX(-50%); }
  .trend .axis-label.x.first { transform: none; }
  .trend .axis-label.x.last { transform: translateX(-100%); }
  .trend .axis-label.y { text-align: right; transform: translateY(-50%); }
  .trend .hover { display: none; }
  .trend .hover.on { display: block; }
  .trend .tip {
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
  .trend .tip.on { display: block; }
  .trend .tip .time { color: var(--secondary-text-color); margin-bottom: 2px; }
  .trend .tip .head { font-weight: 500; margin-bottom: 2px; }
  .trend .tip .row { display: flex; align-items: center; gap: 6px; }
  .trend .tip .row i { flex: none; display: inline-block; width: 10px; height: 2px; border-radius: 1px; background: var(--c); }
  .trend .tip .row b { flex: none; font-weight: 600; font-variant-numeric: tabular-nums; }
  .trend .tip .row span { color: var(--secondary-text-color); min-width: 0; overflow: hidden; text-overflow: ellipsis; }
`;
