// Styles of the swipe card: the container cards' (src/shared/cards/styles.ts), the strip that
// scrolls sideways and its dots. The sizes, gaps and padding are set on the body (swipe-card.ts).
import { CARDS_STYLE } from "../shared/cards/styles.ts";

export const STYLE = `
  ${CARDS_STYLE}
  /* the strip: one row of cards that scrolls sideways and snaps to each card. Off-screen cards
     stay laid out (never display: none), so a card that measures its width always has one. The
     strip is the cards' offsetParent: their offsetLeft is their place along it */
  .strip .body {
    position: relative; display: grid; grid-auto-flow: column; grid-auto-columns: var(--sw-slide);
    overflow-x: auto; overflow-y: hidden; overscroll-behavior-x: contain;
    scroll-snap-type: x mandatory; scrollbar-width: none;
  }
  .strip .body::-webkit-scrollbar { display: none; }
  .strip .body:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; border-radius: var(--ha-card-border-radius, 12px); }
  .strip .item { scroll-snap-align: start; }
  .strip.center .item { scroll-snap-align: center; }
  .strip.free .body { scroll-snap-type: none; }

  /* the dots below the strip: one per page, the current one a wider pill; each a button whose
     hit area is larger than the dot it draws */
  .dots { flex: none; display: flex; flex-wrap: wrap; justify-content: center; margin-top: 2px; }
  .dots[hidden] { display: none; }
  .dot {
    display: flex; margin: 0; padding: 6px 3px; border: 0; background: none; cursor: pointer;
    border-radius: 6px; -webkit-tap-highlight-color: transparent;
  }
  .dot::before {
    content: ""; width: 6px; height: 6px; border-radius: 3px; background: var(--divider-color);
    transition: width 0.2s ease, background-color 0.2s ease;
  }
  .dot.on::before { width: 16px; background: var(--secondary-text-color); }
  .dot:focus-visible { outline: 2px solid var(--primary-color); outline-offset: -1px; }
  @media (prefers-reduced-motion: reduce) {
    .dot::before { transition: none; }
  }
`;
