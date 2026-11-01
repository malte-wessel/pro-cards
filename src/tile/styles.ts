// CSS of the tile card on top of the entity layer's tile: the icon slot (kept through fills, so a
// kind's animated lead runs on) and the kinds' leads.
import { PLOT_H } from "../shared/entity/constants.ts";
import { STYLE_ENTITY_CARD } from "../shared/entity/render/styles.ts";
import { STYLE_FLOW, STYLE_FLOW_MOTION } from "../shared/flow/styles.ts";
import { STYLE_KINDS } from "../shared/kinds/styles.ts";
import { STYLE_RAIN } from "../shared/rain/styles.ts";
import { STYLE_SUN_CURVE } from "../shared/sun/styles.ts";
import { STYLE_TREND } from "../shared/trend/styles.ts";
import { STYLE_WEATHER_PICTURES } from "../shared/weather/styles.ts";
import { STYLE_WIND } from "../shared/wind/styles.ts";

const STYLE_TILE_CARD = `
  .tlead { flex: none; display: flex; }
  .tlead[hidden] { display: none; }
  /* the icon's picture fades in when it is a new one (the next song's cover) */
  @keyframes tfade { from { opacity: 0; } }
  .tlead img.picture.pwait { opacity: 0; }
  .tlead img.picture.pfade { animation: tfade .7s ease both; }
  @media (prefers-reduced-motion: reduce) { .tlead img.picture.pfade { animation: none; } }
  /* visual: glow (a light's): the tile's colour from its bottom edge, as strong as its level (its
     opacity, set by the card: a new level fades); nothing at 0. Under the content and its layers */
  ha-card.layout-tile > .body:has(> .tglow) { isolation: isolate; }
  .tglow { position: absolute; inset: 0; z-index: -1; pointer-events: none; background: radial-gradient(90% 140% at 50% 150%, color-mix(in srgb, var(--glow) 50%, transparent) 0%, transparent 80%); opacity: 0; transition: opacity .6s; }
  @media (prefers-reduced-motion: reduce) { .tglow { transition: none; } }
  /* a kind's curve below the line (show_picture: the sun's day, a trend's lines) is as tall as a
     tile's sparkline; on a poster it reaches up behind the texts, here it keeps below them */
  .row.tile > .pcurve { position: relative; flex: 1 1 auto; height: ${PLOT_H.sparkline}px; min-height: 40px; min-width: 0; margin: 0; touch-action: pan-y; }
  .row.actionable > .pcurve { pointer-events: auto; }
  /* a picture's tooltip opens upward from its bottom, over the line: one opening downward would
     be cut by the card's edge */
  ha-card.layout-tile .row.tile > :is(.pcurve, .plot) > .tip { top: auto; bottom: 8px; z-index: 3; }
  ha-card.layout-tile .tip .row { flex-direction: row; align-items: center; gap: 6px; border-radius: 0; }
  /* vertical: the icon on top, the name and the line centred under it (each cut at its end), the
     controls under them across the tile, centred; a picture or a slider below as on a tile */
  ha-card.tvertical .body { padding: 12px; }
  ha-card.tvertical .row.tile > .top, ha-card.tvertical .row.tile > .top:has(> .main > .line > .end > .ctl) { flex-direction: column; align-items: center; gap: 8px; text-align: center; }
  ha-card.tvertical .row.tile > .top > .main { align-self: stretch; }
  /* one column, never wrapped: a wrapping column would size its parts to their content, not to
     the tile, and nothing would be cut */
  ha-card.tvertical .row.tile .line { flex-direction: column; flex-wrap: nowrap; align-items: stretch; gap: 8px; }
  ha-card.tvertical .row.tile .line > .texts { flex: none; }
  ha-card.tvertical .row.tile .line > .end { max-width: none; justify-content: center; }
  /* a tile with no room for its controls under the line (TileCard._fitControls) keeps them on
     the line beside the name, else leaves them out */
  ha-card.layout-tile .row.tile.tkeep > .top > .main > .line { flex-wrap: nowrap; }
  ha-card.layout-tile .row.tile.tdrop > .top > .main > .line > .end, ha-card.layout-tile .row.tile.tdrop > .ctl { display: none; }
  /* a media player's progress runs along the tile's bottom edge, taking no row */
  .row.tile > .pprog { position: absolute; left: 0; right: 0; bottom: 0; height: 4px; background: color-mix(in srgb, var(--fe-color) 22%, transparent); }
`;

export const STYLE_TILE_CARD_ALL =
  STYLE_ENTITY_CARD +
  STYLE_FLOW +
  STYLE_WIND +
  STYLE_RAIN +
  STYLE_WEATHER_PICTURES +
  STYLE_SUN_CURVE +
  STYLE_TREND +
  STYLE_KINDS +
  STYLE_TILE_CARD +
  STYLE_FLOW_MOTION;
