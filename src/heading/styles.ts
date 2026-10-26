// CSS of the heading card: the entity cards' header on its own, without a card around it (as Home
// Assistant's heading); a tinted heading takes a soft background in the card's shape.
import { ICON_RADIUS, iconBg } from "../shared/constants.ts";
import {
  STYLE_BASE,
  STYLE_CONTROLS,
  STYLE_HEADER,
  STYLE_HOVER,
  STYLE_ROW,
} from "../shared/entity/render/styles.ts";
import { fw, type } from "../shared/typography.ts";

const LEAD = "var(--hd-color, var(--primary-color))";

const STYLE_HEADING = `
  ha-card.layout-heading { background: none; border: none; box-shadow: none; justify-content: center; container-type: inline-size; }
  ha-card.layout-heading.tinted { background: color-mix(in srgb, var(--fe-tint) 14%, transparent); border-radius: var(--ha-card-border-radius, 12px); }
  ha-card.layout-heading > .body { display: none; }
  .layout-heading .header { padding: 8px 4px; gap: 10px; }
  ha-card.layout-heading.tinted .header { padding: 12px 16px; }
  .header > ha-icon { color: var(--hd-color, var(--secondary-text-color)); }
  .header .htx { flex: 1 1 auto; min-width: min(96px, 100%); display: flex; flex-direction: column; gap: 2px; }
  .header .htx > .title { flex: none; }
  .header .subtitle { ${type(14, 20)} color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .header .hline { display: none; }
  /* the badges give way first: they wrap down to their widest badge before the title is cut */
  .layout-heading .header .hvals { flex: 0 16 auto; min-width: min-content; max-width: none; flex-wrap: wrap; justify-content: flex-end; row-gap: 6px; }
  /* icon_tap_action: the icon is a button of its own */
  .header.icon-tap > ha-icon { cursor: pointer; border-radius: ${ICON_RADIUS}; outline: none; }
  .header.icon-tap > ha-icon:focus-visible { box-shadow: 0 0 0 2px var(--primary-color); }

  /* the styles */
  .header.s-section .title { ${type(12, 16)} font-weight: ${fw("medium")}; text-transform: uppercase; letter-spacing: .06em; color: var(--secondary-text-color); }
  .header.s-section > ha-icon { --mdc-icon-size: 16px; }
  .header.s-section .htx { flex: 0 1 auto; }
  .header.s-section .hline { display: block; flex: 1 1 24px; min-width: 24px; height: 1px; background: var(--divider-color); }
  .header.s-subtitle .title { ${type(14, 20)} font-weight: ${fw("medium")}; color: var(--secondary-text-color); }
  .header.s-subtitle > ha-icon { --mdc-icon-size: 18px; }
  .header.s-big > ha-icon { box-sizing: border-box; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: ${ICON_RADIUS}; --mdc-icon-size: 24px; color: ${LEAD}; background: ${iconBg(LEAD)}; }
  .header.s-big .title { ${type(20, 24)} }
  .header.s-hero .title { ${type(28, 34)} font-weight: ${fw("normal")}; letter-spacing: -.3px; }
  .header.s-hero > ha-icon { --mdc-icon-size: 32px; }
  ha-card.layout-heading .header.s-hero { padding-block: 12px; }

  /* where the badges sit. At the end of the line a grid shares it: the title takes its width first
     (cut only down to 96 px), the badges what is left, wrapping in it; a section's line takes what
     the badges leave. (A wrapping flex item keeps the width it was given, not the one its wrapped
     badges need, so in a flex line the title would give up room nobody uses.) The gaps are margins:
     a missing icon or line leaves no gap behind */
  .header.bpos-end:not(.align-center) { display: grid; grid-template-columns: auto minmax(min(96px, 100%), max-content) 0 minmax(min-content, 1fr); column-gap: 0; }
  .header.bpos-end.s-section:not(.align-center) { grid-template-columns: auto minmax(min(96px, 100%), max-content) minmax(24px, 1fr) minmax(min-content, max-content); }
  .header.bpos-end.ov-scroll:not(.align-center) { grid-template-columns: auto minmax(min(96px, 100%), max-content) 0 minmax(0, 1fr); }
  .header.bpos-end.s-section.ov-scroll:not(.align-center) { grid-template-columns: auto minmax(min(96px, 100%), max-content) minmax(24px, 1fr) minmax(0, max-content); }
  .header.bpos-end:not(.align-center) > ha-icon { grid-column: 1; margin-right: 10px; }
  .header.bpos-end:not(.align-center) > .htx { grid-column: 2; min-width: 0; }
  .header.bpos-end:not(.align-center) > .hline { grid-column: 3; margin-left: 10px; }
  .header.bpos-end:not(.align-center) > .hvals { grid-column: 4; margin-left: 10px; }
  .header.bpos-inline .htx { flex: 0 1 auto; }
  .header.bpos-inline .hvals { flex: 1 1 0; justify-content: flex-start; }
  .header.bpos-below { flex-wrap: wrap; }
  .header.bpos-below .hvals { flex: 1 0 100%; justify-content: flex-start; }
  /* a narrow card: the badges at the end move to a line of their own */
  @container (max-width: 300px) {
    .header.bpos-end:not(.align-center) { display: flex; flex-wrap: wrap; }
    .header.bpos-end:not(.align-center) > :is(ha-icon, .hline, .hvals) { margin-left: 0; margin-right: 0; }
    .header.bpos-end .hvals { flex: 1 0 100%; justify-content: flex-start; }
  }
  /* align: center, a panel's or a wall tablet's heading: the text and the badges centred */
  .header.align-center { flex-direction: column; text-align: center; gap: 6px; }
  .header.align-center .htx { flex: none; align-items: center; min-width: 0; max-width: 100%; }
  .header.align-center .hvals { flex: none; justify-content: center; max-width: 100%; }
  .header.align-center .hline { display: none; }
  /* overflow: scroll, one line that scrolls and fades at its edges */
  .header.ov-scroll .hvals { min-width: 0; flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; padding: 4px 8px; margin: -4px 0; mask-image: linear-gradient(to right, transparent, black 8px, black calc(100% - 8px), transparent); }
  .header.ov-scroll .hvals::-webkit-scrollbar { display: none; }
  .header.ov-scroll .row.hval { flex: none; }
  /* a row that overflows starts at its first badge (flex-end would push the start out of reach);
     one that fits still sits at the end */
  .header.ov-scroll .hvals { justify-content: flex-start; }
  .header.ov-scroll:not(.align-center) .hvals > :first-child { margin-left: auto; }
`;

export const STYLE_HEADING_CARD =
  STYLE_BASE + STYLE_HEADER + STYLE_ROW + STYLE_CONTROLS + STYLE_HOVER + STYLE_HEADING;
