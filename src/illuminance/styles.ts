// Styles of the illuminance card.
import { AXIS_FONT } from "../shared/constants.ts";

export const STYLE = `
  :host { display: block; min-width: 0; overflow: hidden; }
  ha-card { height: 100%; box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden; contain: inline-size; }
  .header { display: flex; align-items: center; gap: 12px; padding: 12px 16px 0 16px; min-width: 0; }
  .shape {
    flex: none; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    color: var(--amber-color); background: color-mix(in srgb, var(--amber-color) 20%, transparent); --mdc-icon-size: 24px;
  }
  .info { min-width: 0; flex: 1; }
  .primary { font-size: 14px; font-weight: 500; line-height: 20px; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .secondary { font-size: 12px; line-height: 16px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .body { padding: 8px 16px 14px 16px; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
  .valrow { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; min-width: 0; }
  .big { display: flex; align-items: baseline; gap: 6px; min-width: 0; white-space: nowrap; }
  .big b { font-size: 34px; font-weight: 500; line-height: 40px; letter-spacing: -0.8px; color: var(--primary-text-color); font-variant-numeric: tabular-nums; }
  .big span { font-size: 14px; color: var(--secondary-text-color); }
  .pill {
    flex: none; font-size: 12px; font-weight: 500; line-height: 16px; padding: 4px 12px; border-radius: 999px;
    color: var(--primary-text-color); background: color-mix(in srgb, var(--pill) 12%, transparent); white-space: nowrap;
  }
  .plot { position: relative; min-width: 0; touch-action: pan-y; }
  svg.abs { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
  .hair { stroke: var(--secondary-text-color); stroke-width: 1; opacity: .6; }
  .grid { stroke: var(--primary-text-color); stroke-opacity: .08; stroke-width: 1; }
  .line { fill: none; stroke: color-mix(in srgb, var(--primary-text-color) 80%, transparent); stroke-width: 2; stroke-linejoin: round; stroke-linecap: butt; }
  .dot { stroke: var(--ha-card-background, var(--card-background-color)); stroke-width: 2; fill: var(--primary-text-color); }
  .label { position: absolute; font: ${AXIS_FONT}; line-height: 12px; color: var(--secondary-text-color); white-space: nowrap; pointer-events: none; font-variant-numeric: tabular-nums; }
  .label.zone { font-size: 9px; letter-spacing: .9px; text-transform: uppercase; }
  .label.x { transform: translateX(-50%); }
  .label.x.first { transform: none; }
  .label.x.last { transform: translateX(-100%); }
  .label.y { text-align: right; transform: translateY(-50%); }
  .hover { display: none; } .hover.on { display: block; }
  .tip {
    position: absolute; top: 4px; pointer-events: none; display: none; z-index: 1; box-sizing: border-box; max-width: calc(100% - 8px);
    background: var(--ha-card-background, var(--card-background-color)); color: var(--primary-text-color);
    border: 1px solid var(--divider-color); border-radius: 8px; padding: 6px 8px; font-size: 12px; line-height: 16px;
    box-shadow: var(--ha-card-box-shadow, 0 2px 6px rgba(0,0,0,.2)); white-space: nowrap;
  }
  .tip.on { display: block; }
  .tip .time { color: var(--secondary-text-color); }
  .tip b { font-weight: 600; font-variant-numeric: tabular-nums; }
  /* arc */
  .arcwrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .arcwrap svg { display: block; width: 100%; max-width: 340px; height: auto; overflow: visible; }
  .arcwrap .zl { font-size: 9px; letter-spacing: .9px; fill: var(--secondary-text-color); text-transform: uppercase; }
  .arcwrap .bigv { font-size: 40px; font-weight: 500; letter-spacing: -1px; fill: var(--primary-text-color); font-variant-numeric: tabular-nums; }
  .arcwrap .unit { font-size: 13px; letter-spacing: 1.2px; fill: var(--secondary-text-color); }
  .arcwrap .mark { stroke: var(--ha-card-background, var(--card-background-color)); stroke-width: 4; fill: var(--primary-text-color); }
  /* band */
  .legend { display: flex; align-items: center; gap: 8px; font: ${AXIS_FONT}; color: var(--secondary-text-color); }
  .legend i { display: inline-block; width: 104px; height: 6px; border-radius: 3px; background: var(--grad); opacity: .6; }
  .empty { font-size: 12px; color: var(--secondary-text-color); padding: 8px 0; }
`;
