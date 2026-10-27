// The container cards (layout, swipe): the styles they share. They draw no ha-card of their own (as
// Home Assistant's stacks): no border around the cards; the cards inside bring their own.
import { STYLE_HOST } from "../constants.ts";
import { font } from "../typography.ts";

export const CARDS_STYLE = `
  ${STYLE_HOST}
  :host([hidden]) { display: none; }
  /* a panel view's only card: Home Assistant's panel view resets the --ha-card-* variables, the
     theme's card look is in the --restore-card-* ones; the cards inside get it back (a seamless
     layout draws one surface instead) */
  :host([panel]) .root:not(.seamless) .body {
    --ha-card-border-radius: var(--restore-card-border-radius);
    --ha-card-border-width: var(--restore-card-border-width);
    --ha-card-box-shadow: var(--restore-card-box-shadow);
  }
  /* the root fills the height the host is given; the body keeps its own height as its basis
     (never 0: in a stretched grid row that would drop the card's share of the row's height) */
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

  .note { padding: 16px; text-align: center; color: var(--secondary-text-color); ${font(14, 20)} }
  .note[hidden] { display: none; }
`;
