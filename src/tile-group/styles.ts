// CSS of the tile group card: the entity group card's header (title, icon, badges) and the tiles
// flat on the card's surface, as the layout card's seamless style draws its cards.
import { STYLE_KIND_TRACK } from "../shared/kinds/styles.ts";
import { CARD_BG } from "../shared/constants.ts";
import {
  STYLE_BASE,
  STYLE_CONTROLS,
  STYLE_HEADER,
  STYLE_HOVER,
  STYLE_ROW,
} from "../shared/entity/render/styles.ts";

const STYLE_TILES = `
  /* the card's surface as the theme draws it, read here before the tiles' variables are reset */
  :host { --tg-surface: ${CARD_BG}; }
  /* the tiles sit 4 px in from the card's sides and 4 px apart: each tile's hover layer is a
     rounded tile of its own. The header's sides line up its icon with the tiles' (4 px, the tile's
     border, its 12 px); with the body's 4 px, as much below the title as above it */
  .header { padding: 12px 16px 8px; }
  .body { padding: 4px; gap: 0; }
  /* flat: the surface is painted once, the tiles paint no background, border colour or shadow of
     their own; what a tile draws in the surface's colour (a knob, a tooltip) reads it from
     --pro-cards-surface. The border keeps its width (the focus ring colours it) and the corners
     their radius (a tile's hover and press layers take it) */
  .tiles {
    --ha-card-background: transparent;
    --pro-cards-surface: var(--tg-surface);
    --ha-card-border-color: transparent;
    --ha-card-box-shadow: none;
    display: flex; gap: var(--tg-gap); min-width: 0;
    /* the space between the tiles (none without padding) */
    --tg-gap: 4px;
  }
  .tiles > .tile { display: flex; flex-direction: column; min-width: 0; contain: inline-size; }
  .tiles > .tile > * { height: auto; flex: 1 1 auto; }
  /* list: the tiles one under the other */
  .tiles.layout-list { flex-direction: column; }
  /* vertical_align: in a card taller than its tiles the body takes the room under the header and
     puts the tiles at the centre or the bottom */
  ha-card:is(.valign-center, .valign-bottom) > .body { flex: 1 1 auto; }
  ha-card.valign-center > .body { justify-content: center; }
  ha-card.valign-bottom > .body { justify-content: flex-end; }
  /* stretch: the lines share the room equally (a list's or a table's tiles grow alike, a row's grid
     lines are stretched as auto tracks are); each tile places its own content (vertical_align on
     the tile, centred unless told) */
  ha-card.valign-stretch > .body { flex: 1 1 auto; }
  ha-card.valign-stretch .tiles { flex: 1 1 auto; }
  ha-card.valign-stretch .tiles:is(.layout-list, .layout-table) > .tile { flex: 1 1 auto; }
  /* a stretched row centres its tiles' content (their icons level while the tiles say as much) */
  ha-card.valign-stretch .tiles.layout-row { --pro-cards-tile-align: center; }
  /* table: the rows one under the other, close together */
  .tiles.layout-table { flex-direction: column; gap: 0; }
  /* row: vertical tiles side by side in columns alike, as many as fit at the width the widest
     tile needs at least (--tg-col: its grid columns); a line that is not full keeps the columns'
     width. The tiles of a line are as tall as the tallest, their content at the top, so their
     icons are level */
  .tiles.layout-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--tg-col, 120px)), 1fr)); align-items: stretch; --pro-cards-tile-align: flex-start; }
  /* columns: at most so many tiles on a line: a column takes at least the line's share */
  .tiles.layout-row.ov-wrap.al-stretch.cols { grid-template-columns: repeat(auto-fit, minmax(max(min(100%, var(--tg-col, 120px)), calc((100% - (var(--tg-cols) - 1) * var(--tg-gap)) / var(--tg-cols))), 1fr)); }
  /* align: tiles that do not stretch keep the column width and are packed (a tile has no width of
     its own: it is inline-size contained) */
  .tiles.layout-row:not(.al-stretch) { display: flex; flex-wrap: wrap; }
  .tiles.layout-row:not(.al-stretch) > .tile { flex: 0 0 min(100%, var(--tg-col, 120px)); }
  .tiles.layout-row.al-center { justify-content: center; }
  .tiles.layout-row.al-end { justify-content: flex-end; }
  .tiles.layout-row.al-space-between { justify-content: space-between; }
  /* (with columns: the line is as wide as so many columns at most, placed as its tiles are) */
  .tiles.layout-row.ov-wrap.cols:not(.al-stretch) { max-width: calc(var(--tg-cols) * var(--tg-col, 120px) + (var(--tg-cols) - 1) * var(--tg-gap)); width: 100%; }
  .tiles.layout-row.ov-wrap.cols:is(.al-center, .al-space-between) { margin-inline: auto; }
  .tiles.layout-row.ov-wrap.cols.al-end { margin-inline-start: auto; }
  /* shrink: one line; the tiles shrink below their least width (their texts cut, their controls
     dropped where they no longer fit: the tile's own fit) */
  .tiles.layout-row.ov-shrink.al-stretch { grid-template-columns: none; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); }
  .tiles.layout-row.ov-shrink:not(.al-stretch) { flex-wrap: nowrap; }
  .tiles.layout-row.ov-shrink:not(.al-stretch) > .tile { flex: 0 1 var(--tg-col, 120px); }
  /* scroll: one line at the column width that scrolls sideways and snaps to a tile; 4 px around it
     (and as much less margin, a snap stopping as far in) keep the tiles' focus rings uncut */
  .tiles.layout-row.ov-scroll { display: flex; flex-wrap: nowrap; justify-content: flex-start; overflow-x: auto; overflow-y: hidden; overscroll-behavior-x: contain; scroll-snap-type: x mandatory; scrollbar-width: none; padding: 4px; margin: -4px; scroll-padding-inline: 4px; }
  .tiles.layout-row.ov-scroll::-webkit-scrollbar { display: none; }
  .tiles.layout-row.ov-scroll > .tile { flex: 0 0 var(--tg-col, 120px); scroll-snap-align: start; }
  .tiles.layout-row.ov-scroll.al-stretch > .tile { flex-grow: 1; }
  /* (centred, at the end, spread: by spacers that grow while the tiles fit, so a row that scrolls
     still starts at its start, where justify-content would leave its start out of reach) */
  .tiles.layout-row.ov-scroll:is(.al-center, .al-end)::before, .tiles.layout-row.ov-scroll.al-center::after { content: ""; flex: 1 0 0px; }
  /* (a spacer takes back the gap beside it: no row grows by it) */
  .tiles.layout-row.ov-scroll:is(.al-center, .al-end)::before { margin-inline-end: calc(-1 * var(--tg-gap)); }
  .tiles.layout-row.ov-scroll.al-center::after { margin-inline-start: calc(-1 * var(--tg-gap)); }
  .tiles.layout-row.ov-scroll.al-space-between { justify-content: space-between; }
  .tiles.layout-row.ov-scroll:focus-visible { outline: 2px solid var(--primary-color); outline-offset: -2px; border-radius: var(--ha-card-border-radius, 12px); }
  /* the fades on the side where more tiles are (the card follows the scroll: fadesOf) */
  .tiles.layout-row.ov-scroll.fade-right { mask-image: linear-gradient(to right, black calc(100% - 32px), transparent); }
  .tiles.layout-row.ov-scroll.fade-left { mask-image: linear-gradient(to left, black calc(100% - 32px), transparent); }
  .tiles.layout-row.ov-scroll.fade-left.fade-right { mask-image: linear-gradient(to right, transparent, black 32px, black calc(100% - 32px), transparent); }
  /* padding: false: the tiles flush with the card and each other, square and without borders (a
     border's width would leave a line of the card between them); a tile's focus ring inside it,
     where the card's edge cannot cut it; the header in line with the tiles' icons (their 12 px) */
  .body.flush { padding: 0; }
  .body.flush > .tiles { --tg-gap: 0px; --ha-card-border-radius: 0px; --ha-card-border-width: 0px; --pro-cards-focus-width: 2px; --pro-cards-focus-offset: -2px; }
  .body.flush > .tiles.ov-scroll { padding: 0; margin: 0; scroll-padding-inline: 0; }
  ha-card:has(> .body.flush) > .header { padding-inline: 12px; }
`;

export const STYLE_TILE_GROUP_CARD =
  STYLE_BASE +
  STYLE_HEADER +
  STYLE_ROW +
  STYLE_CONTROLS +
  STYLE_HOVER +
  STYLE_TILES +
  STYLE_KIND_TRACK;
