// CSS of the tile group card: the entity group card's header (title, icon, badges) and the tiles
// flat on the card's surface, as the layout card's seamless style draws its cards.
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
    display: flex; gap: 4px; min-width: 0;
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
  /* table: the rows one under the other, close together */
  .tiles.layout-table { flex-direction: column; gap: 0; }
  /* row: vertical tiles side by side in columns alike, as many as fit at the width the widest
     tile needs at least (--tg-col: its grid columns); a line that is not full keeps the columns'
     width. The tiles of a line are as tall as the tallest, their content at the top, so their
     icons are level */
  .tiles.layout-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--tg-col, 120px)), 1fr)); align-items: stretch; --pro-cards-tile-align: flex-start; }
`;

export const STYLE_TILE_GROUP_CARD =
  STYLE_BASE + STYLE_HEADER + STYLE_ROW + STYLE_CONTROLS + STYLE_HOVER + STYLE_TILES;
