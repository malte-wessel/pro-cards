// Styles of the pop-up card. The sheet (its handle, its header, its cards in the section grid) is
// the same in both places it is drawn: inline in the card in the editor's preview, and in the
// portal while open, a sheet from the bottom on a phone, a dialog in the middle on a wide screen.
import { CARDS_STYLE } from "../shared/cards/styles.ts";
import { themeGap } from "../shared/cards/units.ts";
import { font, FONT_FAMILY } from "../shared/typography.ts";
import { GRID_COLUMNS } from "./place.ts";

const SURFACE =
  "var(--ha-dialog-surface-background, var(--mdc-theme-surface, var(--card-background-color)))";

// the sheet wherever it is
const SHEET = `
  .sheet { box-sizing: border-box; display: flex; flex-direction: column; min-width: 0; color: var(--primary-text-color); font-family: ${FONT_FAMILY}; }
  .grab { flex: none; height: 20px; display: grid; place-items: center; touch-action: none; cursor: grab; }
  .grab::before { content: ""; width: 36px; height: 4px; border-radius: 2px; background: var(--secondary-text-color); opacity: 0.4; }
  .head { flex: none; display: flex; align-items: flex-start; gap: 8px; padding: 0 12px 8px 16px; touch-action: none; }
  .head .heading { flex: 1 1 auto; min-width: 0; align-self: center; }
  .head .heading[hidden] { display: none; }
  .head .heading > hui-card { display: block; }
  /* (beside a heading the heading takes the line; without one the buttons go to the end) */
  .head .gap { flex: 1 1 auto; }
  .head .heading:not([hidden]) + .gap { display: none; }
  .x, .open {
    flex: none; display: inline-flex; align-items: center; justify-content: center; gap: 4px;
    margin: 0; border: 0; cursor: pointer; color: var(--primary-text-color);
    background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
    -webkit-tap-highlight-color: transparent;
  }
  .x { width: 40px; height: 40px; padding: 0; border-radius: 50%; }
  .x svg { width: 24px; height: 24px; fill: currentColor; }
  .open { height: 36px; padding: 0 14px; border-radius: 18px; ${font(14, 20, "medium")} }
  .x:hover, .open:hover { background: color-mix(in srgb, var(--primary-text-color) 14%, transparent); }
  .x:focus-visible, .open:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .open[hidden], .x[hidden], .grab[hidden] { display: none; }
  .scroll { flex: 1 1 auto; min-height: 0; overflow: auto; overscroll-behavior: contain; padding: 0 16px 16px; }
  .scroll > .root { height: auto; }
  .body {
    display: grid; grid-template-columns: repeat(${GRID_COLUMNS}, minmax(0, 1fr));
    row-gap: ${themeGap("row")}; column-gap: ${themeGap("column")};
  }
`;

// the card in the grid: hidden while closed (CardsBase), in the editor's preview the sheet as a
// card of its own, with Open in its header
export const STYLE = `
  ${CARDS_STYLE}
  ${SHEET}
  .inline .sheet {
    background: var(--ha-card-background, var(--card-background-color));
    border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color));
    border-radius: var(--ha-card-border-radius, 12px);
    box-shadow: var(--ha-card-box-shadow, none);
    padding-top: 12px;
  }
  .inline .scroll { overflow: visible; }
`;

// the open pop-up: fixed over the page, below Home Assistant's own dialogs (more-info opened from a
// card inside shows above it)
export const PORTAL_STYLE = `
  ${CARDS_STYLE}
  ${SHEET}
  :host { position: fixed; inset: 0; z-index: var(--pro-cards-popup-z-index, 6); display: block; height: auto; }
  .scrim { position: absolute; inset: 0; background: var(--mdc-dialog-scrim-color, rgba(0, 0, 0, 0.32)); -webkit-tap-highlight-color: transparent; }
  .sheet { position: absolute; background: ${SURFACE}; will-change: transform; outline: none; }
  /* a phone: a sheet from the bottom, as tall as its cards, up to below the status bar */
  .wrap.as-sheet { --sheet-max: calc(100% - 48px - env(safe-area-inset-top, 0px)); }
  .wrap.as-sheet .sheet {
    left: 0; right: 0; bottom: 0;
    max-height: var(--sheet-max);
    border-radius: var(--ha-dialog-border-radius, 28px) var(--ha-dialog-border-radius, 28px) 0 0;
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.16);
    padding-left: env(safe-area-inset-left, 0px); padding-right: env(safe-area-inset-right, 0px);
  }
  /* resting at the full height (height: full, or dragged up there): the cards at the top */
  .wrap.as-sheet .sheet.tall { height: var(--sheet-max); }
  .wrap.as-sheet .scroll { padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px)); }
  /* a wide screen: a dialog in the middle */
  .wrap.as-dialog .sheet {
    left: 50%; top: 50%; transform: translate(-50%, -50%);
    width: min(560px, calc(100% - 48px)); max-height: min(86%, 900px);
    border-radius: var(--ha-dialog-border-radius, 28px);
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.28);
    padding-top: 16px;
  }
  .wrap.as-dialog .sheet.tall { height: min(86%, 900px); }
  .wrap.as-dialog.wide .sheet { width: min(1024px, calc(100% - 48px)); }
  .wrap.as-dialog.full .sheet { width: calc(100% - 48px); max-height: calc(100% - 48px); }
  .wrap.as-dialog.full .sheet.tall { height: calc(100% - 48px); }
  .wrap.as-dialog .grab { display: none; }
  .wrap.as-dialog .head { touch-action: auto; }
  .wrap.as-sheet .head { cursor: grab; }
`;
