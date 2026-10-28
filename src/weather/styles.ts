// CSS of the weather card on top of the entity layer's styles. Theme tokens only; the
// temperature colour (--fe-color of the temperature rule) drives bars and lines.
import { font, fs, fw, type } from "../shared/typography.ts";
import { STYLE_GROUP_CARD, STYLE_TILE } from "../shared/entity/render/styles.ts";
import { STYLE_TREND } from "../shared/trend/styles.ts";
import { RANGE_BAR_H, DAY_COLUMN_H } from "./constants.ts";

const STYLE_WEATHER = `
  .row.wtile { flex: 1; justify-content: center; }
  .whero .big b { ${type(40, 44)} letter-spacing: -1px; }
  .whero .big span { font-size: ${fs(16)}; }
  .whero .primary { font-size: ${fs(15)}; }
  .whero .secondary { white-space: normal; }
  .whero .secondary .accent { color: var(--fe-temp, var(--fe-color)); font-weight: ${fw("medium")}; }
  /* the poster: the temperature's label and its curve in the temperature's colour */
  .row.poster .secondary .accent { color: var(--fe-temp, var(--fe-color)); font-weight: ${fw("medium")}; }
  .row.poster .plot.ptrend { --fe-color: var(--fe-temp); }
  .wsec { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
  .whead { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; min-width: 0; }
  .whead .wtitle { ${type(14, 20)} font-weight: ${fw("medium")}; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .whead .wsub { flex: none; ${type(12, 16)} color: var(--secondary-text-color); white-space: nowrap; }
  .wempty { ${font(10)} color: var(--secondary-text-color); padding: 8px 0; }

  /* the Home Assistant weather pictures and image icons */
  .wpic { display: block; width: var(--fe-icon, 100%); height: var(--fe-icon, 100%); object-fit: contain; }
  .lead.picture .shape { background: transparent; }
  .lead.picture .wpic { width: 100%; height: 100%; }
  .wpic .rain { fill: var(--weather-icon-rain-color, #30b3ff); }
  .wpic .sun { fill: var(--weather-icon-sun-color, #fdd93c); }
  .wpic .moon { fill: var(--weather-icon-moon-color, #fcf497); }
  .wpic .cloud-back { fill: var(--weather-icon-cloud-back-color, #d4d4d4); }
  .wpic .cloud-front { fill: var(--weather-icon-cloud-front-color, #f9f9f9); }
  .wpic .snow { fill: var(--weather-icon-snow-color, #f9f9f9); stroke: var(--weather-icon-snow-stroke-color, #d4d4d4); stroke-width: 1; paint-order: stroke; }

  /* the trend plot (multi trend card look) inside a section */
  .wsec .legend { padding: 0; }
  /* a taller card: a trend grows like the entity plots (STYLE_PLOT), down to a floor */
  .wsec .trend { margin: 0; flex: 1 1 auto; min-height: 48px; }
  :is(.body, .wsec):has(.trend) { flex: var(--grow, 1) 1 auto; min-height: 0; }

  /* forecast rows: one grid for the whole list (rows are subgrids) so the columns line up */
  .wfc.layout-vertical { display: grid; grid-template-columns: 3.4em var(--fe-icon, 22px) minmax(0, 1fr); column-gap: 10px; row-gap: 6px; min-width: 0; }
  .wfc.layout-vertical.with-rain { grid-template-columns: 3.4em var(--fe-icon, 22px) auto minmax(0, 1fr); }
  .frow { display: grid; grid-column: 1 / -1; grid-template-columns: subgrid; align-items: center; min-width: 0; }
  .frow .fname { font-size: ${fs(13)}; font-weight: ${fw("medium")}; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
  .frow.today .fname { color: var(--fe-color); }
  .ficon { display: flex; align-items: center; justify-content: center; width: var(--fe-icon, 22px); height: var(--fe-icon, 22px); color: var(--fe-cond, var(--secondary-text-color)); }
  .ficon ha-icon { --mdc-icon-size: var(--fe-icon, 22px); }
  .frow .rain { ${type(11, 14)} color: var(--secondary-text-color); white-space: nowrap; min-width: 3.2em; font-variant-numeric: tabular-nums; }
  .frow .range { display: grid; grid-template-columns: 2.6em minmax(0, 1fr) 2.6em; align-items: center; gap: 6px; font-size: ${fs(12)}; color: var(--secondary-text-color); font-variant-numeric: tabular-nums; }
  .frow .range .hi { color: var(--primary-text-color); font-weight: ${fw("medium")}; }
  .frow .range .lo { text-align: right; }
  .frow .ftemp { font-size: ${fs(13)}; font-weight: ${fw("medium")}; color: var(--primary-text-color); text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .track { position: relative; height: ${RANGE_BAR_H}px; border-radius: ${RANGE_BAR_H / 2}px; background: color-mix(in srgb, var(--primary-text-color) 8%, transparent); overflow: hidden; }
  .track .fill { position: absolute; top: 0; bottom: 0; border-radius: ${RANGE_BAR_H / 2}px; background: var(--fe-color); }

  /* forecast columns */
  .wfc.layout-horizontal { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 4px; min-width: 0; }
  .fcol { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 0; font-size: ${fs(12)}; color: var(--secondary-text-color); font-variant-numeric: tabular-nums; }
  .fcol .fname { font-weight: ${fw("medium")}; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .fcol.today .fname { color: var(--fe-color); }
  .fcol .hi { color: var(--primary-text-color); font-weight: ${fw("medium")}; white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
  .fcol .vtrack { position: relative; width: ${RANGE_BAR_H}px; height: ${DAY_COLUMN_H}px; border-radius: ${RANGE_BAR_H / 2}px; background: color-mix(in srgb, var(--primary-text-color) 8%, transparent); }
  .fcol .vtrack .fill { position: absolute; left: 0; right: 0; border-radius: ${RANGE_BAR_H / 2}px; background: var(--fe-color); }
  .fcol .rain { font-size: ${fs(11)}; white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
`;

export const STYLE_WEATHER_CARD = STYLE_GROUP_CARD + STYLE_TILE + STYLE_TREND + STYLE_WEATHER;
