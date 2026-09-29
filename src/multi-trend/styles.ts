// Styles of the multi trend card.
import { AXIS_FONT } from "../shared/constants.ts";

export const STYLE = `
  :host { display: block; }
  ha-card {
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    --tile-color: var(--state-icon-color);
  }
  .header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 12px 4px 12px;
    cursor: pointer;
    outline: none;
    position: relative;
    border-radius: var(--ha-card-border-radius, 12px);
  }
  .header:focus-visible { box-shadow: inset 0 0 0 2px var(--tile-color); border-radius: var(--ha-card-border-radius, 12px); }
  .shape {
    flex: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--tile-color);
    background: color-mix(in srgb, var(--tile-color) 20%, transparent);
    --mdc-icon-size: 24px;
  }
  .info { min-width: 0; flex: 1; }
  .primary {
    font-size: 14px; font-weight: 500; line-height: 20px;
    color: var(--primary-text-color);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .secondary {
    font-size: 12px; font-weight: 400; line-height: 16px;
    color: var(--secondary-text-color);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .secondary .sep { opacity: .5; margin: 0 4px; }
  .range { flex: none; font-size: 12px; color: var(--secondary-text-color); align-self: flex-start; padding-top: 2px; }
  .legend {
    display: flex; flex-wrap: wrap; gap: 4px 14px;
    padding: 4px 12px 0 12px;
    font-size: 12px; line-height: 16px; color: var(--secondary-text-color);
  }
  .legend span { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; min-width: 0; }
  .legend span em { font-style: normal; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .legend i { flex: none; display: inline-block; width: 14px; height: 2px; border-radius: 1px; background: var(--c); }
  .plot { position: relative; flex: 1; margin: 6px 12px 12px 12px; touch-action: pan-y; }
  svg { display: block; width: 100%; height: 100%; overflow: hidden; border-radius: 4px; }
  svg path.line { fill: none; stroke-width: 2; stroke-linejoin: round; stroke-linecap: butt; }
  svg path.area { opacity: .12; }
  svg .hair { stroke: var(--secondary-text-color); stroke-width: 1; opacity: .6; }
  svg .dot { stroke: var(--ha-card-background, var(--card-background-color)); stroke-width: 2; }
  .lane-label {
    position: absolute; left: 4px; max-width: calc(100% - 8px); box-sizing: border-box;
    padding: 0 3px; border-radius: 3px;
    background: color-mix(in srgb, var(--ha-card-background, var(--card-background-color)) 75%, transparent);
    font-size: 10px; line-height: 12px; color: var(--secondary-text-color);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none;
  }
  svg .lane-sep { stroke: var(--divider-color); stroke-width: 1; }
  svg .grid { stroke: var(--divider-color); stroke-width: 1; }
  .axis-label {
    position: absolute; font: ${AXIS_FONT}; line-height: 12px; color: var(--secondary-text-color);
    white-space: nowrap; pointer-events: none; font-variant-numeric: tabular-nums;
  }
  .axis-label.x { transform: translateX(-50%); }
  .axis-label.x.first { transform: none; }
  .axis-label.x.last { transform: translateX(-100%); }
  .axis-label.y { text-align: right; transform: translateY(-50%); }
  .hover { display: none; }
  .hover.on { display: block; }
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
  .tip .row i { flex: none; display: inline-block; width: 10px; height: 2px; border-radius: 1px; background: var(--c); }
  .tip .row b { flex: none; font-weight: 600; font-variant-numeric: tabular-nums; }
  .tip .row span { color: var(--secondary-text-color); min-width: 0; overflow: hidden; text-overflow: ellipsis; }
`;
