// CSS of the weather card on top of the entity layer's styles. Theme tokens only; the
// temperature colour (--fe-color of the temperature rule) drives bars and lines.
import { AXIS_FONT } from "../shared/constants.ts";
import { STYLE_GROUP_CARD, STYLE_TILE } from "../shared/entity/render/styles.ts";
import { STYLE_TREND } from "../shared/trend/styles.ts";
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

  /* the trend plot (multi trend card look) inside a section */
  .wsec .legend { padding: 0; }
  .wsec .trend { margin: 0; flex: none; }

  /* forecast rows: one grid for the whole list (rows are subgrids) so the columns line up */
  .wfc.layout-vertical { display: grid; grid-template-columns: 3.4em 24px minmax(0, 1fr); column-gap: 10px; row-gap: 6px; min-width: 0; }
  .wfc.layout-vertical.with-rain { grid-template-columns: 3.4em 24px auto minmax(0, 1fr); }
  .frow { display: grid; grid-column: 1 / -1; grid-template-columns: subgrid; align-items: center; min-width: 0; }
  .frow .fname { font-size: 13px; font-weight: 500; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
  .frow.today .fname { color: var(--fe-color); }
  .frow ha-icon { --mdc-icon-size: 22px; color: var(--fe-cond, var(--secondary-text-color)); }
  .frow .rain { font-size: 11px; line-height: 14px; color: var(--secondary-text-color); white-space: nowrap; min-width: 3.2em; font-variant-numeric: tabular-nums; }
  .frow .range { display: grid; grid-template-columns: 2.6em minmax(0, 1fr) 2.6em; align-items: center; gap: 6px; font-size: 12px; color: var(--secondary-text-color); font-variant-numeric: tabular-nums; }
  .frow .range .hi { color: var(--primary-text-color); font-weight: 500; }
  .frow .range .lo { text-align: right; }
  .frow .ftemp { font-size: 13px; font-weight: 500; color: var(--primary-text-color); text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .track { position: relative; height: ${RANGE_BAR_H}px; border-radius: ${RANGE_BAR_H / 2}px; background: color-mix(in srgb, var(--primary-text-color) 8%, transparent); overflow: hidden; }
  .track .fill { position: absolute; top: 0; bottom: 0; border-radius: ${RANGE_BAR_H / 2}px; background: var(--fe-color); }

  /* forecast columns */
  .wfc.layout-horizontal { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 4px; min-width: 0; }
  .fcol { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 0; font-size: 12px; color: var(--secondary-text-color); font-variant-numeric: tabular-nums; }
  .fcol .fname { font-weight: 500; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .fcol.today .fname { color: var(--fe-color); }
  .fcol ha-icon { --mdc-icon-size: 22px; color: var(--fe-cond, var(--secondary-text-color)); }
  .fcol .hi { color: var(--primary-text-color); font-weight: 500; white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
  .fcol .vtrack { position: relative; width: ${RANGE_BAR_H}px; height: ${DAY_COLUMN_H}px; border-radius: ${RANGE_BAR_H / 2}px; background: color-mix(in srgb, var(--primary-text-color) 8%, transparent); }
  .fcol .vtrack .fill { position: absolute; left: 0; right: 0; border-radius: ${RANGE_BAR_H / 2}px; background: var(--fe-color); }
  .fcol .rain { font-size: 11px; white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
`;

export const STYLE_WEATHER_CARD = STYLE_GROUP_CARD + STYLE_TILE + STYLE_TREND + STYLE_WEATHER;
