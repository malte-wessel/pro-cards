// Styles of the multi trend card: the header on top of the shared trend plot styles.
import { ICON_RADIUS, STYLE_HOST, STYLE_ICONS, iconBg } from "../shared/constants.ts";
import { STYLE_TREND } from "../shared/trend/styles.ts";
import { TILE_PRIMARY, TILE_SECONDARY, fs, fw, type } from "../shared/typography.ts";

export const STYLE =
  STYLE_TREND +
  `
  ${STYLE_ICONS}
  ${STYLE_HOST}
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
    width: 36px;
    height: 36px;
    border-radius: ${ICON_RADIUS};
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--tile-color);
    background: ${iconBg("var(--tile-color)")};
    --mdc-icon-size: 24px;
  }
  .info { min-width: 0; flex: 1; }
  .primary {
    ${TILE_PRIMARY}
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .secondary {
    ${TILE_SECONDARY}
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .secondary .sep { opacity: .5; margin: 0 4px; }
  .range { flex: none; font-size: ${fs(12)}; color: var(--secondary-text-color); align-self: flex-start; padding-top: 2px; }

  /* a poster: the entity poster's look (shared/entity/render/styles.ts, STYLE_POSTER) in the
     card's own DOM, coloured by the card's colour (--tile-color); the lines take the room the
     texts leave, reach up under them and run to the card's edges */
  .header.poster { flex: 1 1 auto; min-height: 0; flex-direction: column; align-items: stretch; gap: 12px; padding: 16px; }
  .poster .ptop { display: flex; align-items: flex-start; gap: 12px; min-width: 0; }
  .poster .shape { width: 40px; height: 40px; }
  .poster .plabel { margin-inline-start: auto; align-self: auto; min-width: 0; box-sizing: border-box; padding: 4px 10px; border-radius: 999px; ${type(12, 16)} font-weight: ${fw("medium")}; letter-spacing: .08em; text-transform: uppercase; color: var(--tile-color); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tile-color) 40%, transparent); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .poster .pbody { flex: 1 1 auto; min-height: 0; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
  .poster .pbody > :not(.plot) { flex: none; position: relative; z-index: 1; pointer-events: none; }
  .poster .primary { ${type(11, 16)} font-weight: ${fw("medium")}; letter-spacing: .1em; text-transform: uppercase; color: var(--secondary-text-color); }
  .poster .big { display: flex; align-items: baseline; gap: 6px; min-width: 0; white-space: nowrap; }
  .poster .big b { ${type(32, 36)} font-weight: ${fw("light")}; letter-spacing: -.02em; color: var(--primary-text-color); font-variant-numeric: tabular-nums; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
  .poster .big span { font-size: ${fs(16)}; color: var(--secondary-text-color); }
  .poster .big span:empty { display: none; }
  .poster .plot.trend { margin: -16px -16px -16px; min-height: 40px; cursor: default; }
`;
