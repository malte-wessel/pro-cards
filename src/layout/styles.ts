// Styles of the layout card. It draws no ha-card of its own (as Home Assistant's stacks): no
// border around the cards; the cards inside bring their own.
import { STYLE_HOST } from "../shared/constants.ts";
import { font } from "../shared/typography.ts";

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
  /* what the resize observer watches: the card's width, no height of its own */
  .probe { flex: none; height: 0; }
  /* a layout card inside this one is not its section's width: it counts its view columns from
     its own width (Home Assistant's --column-span inherits from the section otherwise) */
  .body { --column-span: initial; }
  /* a card never widens its column, whatever it holds (the Pro Cards contain their own ha-card,
     core and other cards may not) */
  .item { min-width: 0; contain: inline-size; box-sizing: border-box; display: flex; flex-direction: column; }
  .item > hui-card { display: block; flex: 1 1 auto; min-width: 0; height: 100%; }
  .item.off { display: none; }
  .col { display: flex; flex-direction: column; gap: var(--pl-row-gap); min-width: 0; contain: inline-size; }
  .col > .item > hui-card { height: auto; }

  .seamless .body {
    background: var(--pl-bg);
    border: var(--pl-border-width) solid var(--pl-border-color);
    border-radius: var(--pl-radius);
    box-shadow: var(--pl-shadow);
    overflow: hidden;
    /* the cards inside keep a background, the surface's own: a card may use the variable for
       more than its own surface (a slider's knob, the text of its value bubble), and
       transparent there would let the fill show through the knob */
    --ha-card-background: var(--pl-bg);
    --ha-card-border-width: 0px;
    --ha-card-border-radius: 0px;
    --ha-card-box-shadow: none;
  }
  /* the dividers: a line on the right and the bottom of every card, drawn above the cards next
     to it (their backgrounds are opaque); the surface clips the ones at its edge */
  .seamless .item, .seamless .col { position: relative; }
  .seamless .item::after, .seamless .col::after {
    content: ""; position: absolute; inset: 0 -1px -1px 0; z-index: 1; pointer-events: none;
    border-right: 1px solid var(--divider-color); border-bottom: 1px solid var(--divider-color);
  }
  .seamless .col > .item:last-child::after { border-bottom: none; }
  .seamless .col > .item::after { border-right: none; }

  .note { padding: 16px; text-align: center; color: var(--secondary-text-color); ${font(14, 20)} }
  .note[hidden] { display: none; }
`;
