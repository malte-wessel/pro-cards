// Styles of the layout card: the container cards' (src/shared/cards/styles.ts), the masonry
// columns and the seamless surface.
import { CARDS_STYLE } from "../shared/cards/styles.ts";
import { CARD_BG } from "../shared/constants.ts";

export const STYLE = `
  ${CARDS_STYLE}
  /* the card surface as the theme draws it, read here before the seamless style resets the
     variables for the cards inside; --pl-surface is the colour under it, the surface of a
     seamless layout around this one included (whose --ha-card-background is transparent here) */
  :host {
    --pl-bg: var(--ha-card-background, var(--card-background-color));
    --pl-surface: ${CARD_BG};
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
  .col { display: flex; flex-direction: column; gap: var(--pl-row-gap); min-width: 0; contain: inline-size; }
  .col > .item > hui-card { height: auto; }

  .seamless .body {
    background: var(--pl-bg);
    border: var(--pl-border-width) solid var(--pl-border-color);
    border-radius: var(--pl-radius);
    box-shadow: var(--pl-shadow);
    overflow: hidden;
    /* the surface is painted once: the cards inside paint no background of their own (a
       translucent theme colour would stack, each card darker than the surface); what the cards
       draw in the surface colour (a slider's knob, a tooltip, a dot's halo) reads it from
       --pro-cards-surface (CARD_BG) */
    --ha-card-background: transparent;
    --pro-cards-surface: var(--pl-surface);
    --ha-card-border-width: 0px;
    --ha-card-border-radius: 0px;
    --ha-card-box-shadow: none;
  }
  /* the dividers: a line on the right and the bottom of every card, drawn above the cards next
     to it (a card that paints its own background would cover them); the surface clips the ones
     at its edge */
  .seamless .item, .seamless .col { position: relative; }
  .seamless .item::after, .seamless .col::after {
    content: ""; position: absolute; inset: 0 -1px -1px 0; z-index: 1; pointer-events: none;
    border-right: 1px solid var(--divider-color); border-bottom: 1px solid var(--divider-color);
  }
  /* the last card of a column has no line below it: the last one shown, a hidden one after it
     does not count */
  .seamless .col > .item:last-child::after,
  .seamless .col > .item:nth-last-child(1 of :not(.off))::after { border-bottom: none; }
  .seamless .col > .item::after { border-right: none; }
`;
