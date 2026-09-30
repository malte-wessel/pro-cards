// CSS of the weather card on top of the entity layer's styles. Theme tokens only; the
// temperature colour (--fe-color of the temperature rule) drives bars and lines.
import { AXIS_FONT } from "../shared/constants.ts";
import { STYLE_GROUP_CARD, STYLE_TILE } from "../shared/entity/render/styles.ts";
import { RANGE_BAR_H, DAY_COLUMN_H } from "./constants.ts";

const STYLE_WEATHER = `
  .row.wtile { flex: 1; justify-content: center; }
  .whero .big b { font-size: 40px; line-height: 44px; letter-spacing: -1px; }
  .whero .big span { font-size: 16px; }
  .whero .primary { font-size: 15px; }
  .whero .secondary { white-space: normal; }
  .whero .secondary .accent { color: var(--fe-temp, var(--fe-color)); font-weight: 500; }
  .wsec { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
  .whead { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; min-width: 0; }
  .whead .wtitle { font-size: 14px; font-weight: 500; line-height: 20px; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .whead .wsub { flex: none; font-size: 12px; line-height: 16px; color: var(--secondary-text-color); white-space: nowrap; }
  .wempty { font: ${AXIS_FONT}; color: var(--secondary-text-color); padding: 8px 0; }

  .wchart { position: relative; width: 100%; min-width: 0; touch-action: pan-y; }
  .wchart .grid { stroke: var(--divider-color); stroke-width: 1; }
  .wchart .lane-sep { stroke: var(--divider-color); stroke-width: 1; }
  .wchart .line { fill: none; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
  .wchart .line.dotted { stroke-width: 1.5; stroke-dasharray: 2 4; }
  .wchart .area { opacity: .12; }
  .wchart .col { opacity: .7; }
  .wchart .dot { stroke: var(--ha-card-background, var(--card-background-color)); stroke-width: 2; }
  .wchart .hair { stroke: var(--secondary-text-color); stroke-width: 1; opacity: .6; }
  .wchart .lane-label, .wchart .val-label, .wchart .axis-label {
    position: absolute; font: ${AXIS_FONT}; line-height: 12px; color: var(--secondary-text-color); white-space: nowrap; pointer-events: none; font-variant-numeric: tabular-nums;
  }
  .wchart .lane-label { font-size: 11px; font-weight: 500; }
  .wchart .val-label { transform: translateX(-50%); color: var(--primary-text-color); }
  .wchart .axis-label { transform: translateX(-50%); }
  .wchart .axis-label.first { transform: none; }
  .wchart .axis-label.last { transform: translateX(-100%); }
  .wchart .tip .head { font-weight: 500; }
  .wchart .tip .trow { display: flex; align-items: center; gap: 6px; }
  .wchart .tip .trow i { width: 8px; height: 8px; border-radius: 50%; background: var(--c); flex: none; }
  .wchart .tip .trow span { color: var(--secondary-text-color); }

  .wdaily { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  /* one grid for the whole list (rows are subgrids) so name, rain and bar columns line up */
  .wdaily.layout-list { display: grid; grid-template-columns: 3.4em 24px minmax(0, 1fr); column-gap: 10px; row-gap: 6px; }
  .wdaily.layout-list.with-rain { grid-template-columns: 3.4em 24px auto minmax(0, 1fr); }
  .dayrow { display: grid; grid-column: 1 / -1; grid-template-columns: subgrid; align-items: center; min-width: 0; }
  .dayrow .dname { font-size: 13px; font-weight: 500; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .dayrow.today .dname { color: var(--fe-color); }
  .dayrow ha-icon { --mdc-icon-size: 22px; color: var(--secondary-text-color); }
  .dayrow .rain { font-size: 11px; line-height: 14px; color: var(--secondary-text-color); white-space: nowrap; min-width: 3.2em; font-variant-numeric: tabular-nums; }
  .dayrow .range { display: grid; grid-template-columns: 2.6em minmax(0, 1fr) 2.6em; align-items: center; gap: 6px; font-size: 12px; color: var(--secondary-text-color); font-variant-numeric: tabular-nums; }
  .dayrow .range .hi { color: var(--primary-text-color); font-weight: 500; }
  .dayrow .range .lo { text-align: right; }
  .track { position: relative; height: ${RANGE_BAR_H}px; border-radius: ${RANGE_BAR_H / 2}px; background: color-mix(in srgb, var(--primary-text-color) 8%, transparent); overflow: hidden; }
  .track .fill { position: absolute; top: 0; bottom: 0; border-radius: ${RANGE_BAR_H / 2}px; background: var(--fe-color); }

  .wdaily.layout-columns { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 4px; }
  .daycol { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 0; font-size: 12px; color: var(--secondary-text-color); font-variant-numeric: tabular-nums; }
  .daycol .dname { font-weight: 500; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .daycol.today .dname { color: var(--fe-color); }
  .daycol ha-icon { --mdc-icon-size: 22px; }
  .daycol .hi { color: var(--primary-text-color); font-weight: 500; }
  .daycol .vtrack { position: relative; width: ${RANGE_BAR_H}px; height: ${DAY_COLUMN_H}px; border-radius: ${RANGE_BAR_H / 2}px; background: color-mix(in srgb, var(--primary-text-color) 8%, transparent); }
  .daycol .vtrack .fill { position: absolute; left: 0; right: 0; border-radius: ${RANGE_BAR_H / 2}px; background: var(--fe-color); }
  .daycol .rain { font-size: 11px; white-space: nowrap; }
`;

export const STYLE_WEATHER_CARD = STYLE_GROUP_CARD + STYLE_TILE + STYLE_WEATHER;
