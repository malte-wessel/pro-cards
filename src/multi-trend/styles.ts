// Styles of the multi trend card: the header on top of the shared trend plot styles.
import { STYLE_ICONS } from "../shared/constants.ts";
import { STYLE_TREND } from "../shared/trend/styles.ts";

export const STYLE =
  STYLE_TREND +
  `
  ${STYLE_ICONS}
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
`;
