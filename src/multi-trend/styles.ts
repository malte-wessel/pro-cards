// Styles of the multi trend card: the header on top of the shared trend plot styles.
import { ICON_RADIUS, STYLE_HOST, STYLE_ICONS, iconBg } from "../shared/constants.ts";
import { STYLE_TREND } from "../shared/trend/styles.ts";
import { TILE_PRIMARY, TILE_SECONDARY, fs } from "../shared/typography.ts";

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
`;
