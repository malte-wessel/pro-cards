// Styles of the layout card. It draws no ha-card of its own (as Home Assistant's stacks): no
// border around the cards; the cards inside bring their own.
import { STYLE_HOST } from "../shared/constants.ts";

export const STYLE = `
  ${STYLE_HOST}
  :host([hidden]) { display: none; }
  /* the card surface as the theme draws it, read here before the seamless style resets the
     variables for the cards inside */
  :host {
    --pl-bg: var(--ha-card-background, var(--card-background-color));
    --pl-radius: var(--ha-card-border-radius, var(--ha-border-radius-lg, 12px));
    --pl-border-width: var(--ha-card-border-width, 1px);
    --pl-border-color: var(--ha-card-border-color, var(--divider-color));
    --pl-shadow: var(--ha-card-box-shadow, none);
  }
  /* a panel view's only card: the theme's card look is in the --restore-card-* variables (HA's
     panel view resets the --ha-card-* ones), for the cards inside and the seamless surface */
  :host([panel]) {
    --pl-radius: var(--restore-card-border-radius, var(--ha-border-radius-lg, 12px));
    --pl-border-width: var(--restore-card-border-width, 1px);
    --pl-shadow: var(--restore-card-box-shadow, none);
  }
  :host([panel]) .root:not(.seamless) .body {
    --ha-card-border-radius: var(--restore-card-border-radius);
    --ha-card-border-width: var(--restore-card-border-width);
    --ha-card-box-shadow: var(--restore-card-box-shadow);
  }
  /* the root fills the height the host is given; the body keeps its own height as its basis
     (never 0: in a stretched grid row that would drop the layout's share of the row's height) */
  .root { box-sizing: border-box; height: 100%; display: flex; flex-direction: column; min-width: 0; }
  .body { flex: 1 1 auto; min-width: 0; box-sizing: border-box; }
  /* a card never widens its column, whatever it holds (the Pro Cards contain their own ha-card,
     core and other cards may not) */
  .item { min-width: 0; contain: inline-size; box-sizing: border-box; display: flex; flex-direction: column; }
  .item > hui-card { display: block; flex: 1 1 auto; min-width: 0; height: 100%; }
  .item.off { display: none; }
  .item.ghost { opacity: 0.45; }
  .col { display: flex; flex-direction: column; gap: var(--pl-row-gap); min-width: 0; contain: inline-size; }
  .col > .item > hui-card { height: auto; }
  .layout-stack .item > hui-card { height: auto; }
  .layout-stack.across .item > hui-card { height: 100%; }

  .seamless .body {
    background: var(--pl-bg);
    border: var(--pl-border-width) solid var(--pl-border-color);
    border-radius: var(--pl-radius);
    box-shadow: var(--pl-shadow);
    overflow: hidden;
    --ha-card-background: transparent;
    --ha-card-border-width: 0px;
    --ha-card-border-radius: 0px;
    --ha-card-box-shadow: none;
  }
  /* dividers on the right and bottom of every card; the surface clips the ones at its edge */
  .seamless .item, .seamless .col { box-shadow: 1px 0 0 var(--divider-color), 0 1px 0 var(--divider-color); }
  .seamless .col > .item:last-child { box-shadow: none; }

  .note { padding: 16px; text-align: center; color: var(--secondary-text-color); font: 400 14px/20px var(--ha-font-family-body, Roboto, system-ui, sans-serif); }
  .note[hidden] { display: none; }
`;
