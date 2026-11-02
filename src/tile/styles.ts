// CSS of the tile card on top of the entity layer's tile: the icon slot (kept through fills, so a
// kind's animated lead runs on) and the kinds' leads.
import { PLOT_H } from "../shared/entity/constants.ts";
import { STYLE_ENTITY_CARD } from "../shared/entity/render/styles.ts";
import { STYLE_FLOW, STYLE_FLOW_MOTION } from "../shared/flow/styles.ts";
import { CARD_BG, iconBg } from "../shared/constants.ts";
import { STYLE_KIND_BACKDROP, STYLE_KIND_CARD_FOCUS, STYLE_KINDS } from "../shared/kinds/styles.ts";
import { STYLE_RAIN } from "../shared/rain/styles.ts";
import { STYLE_SUN_CURVE } from "../shared/sun/styles.ts";
import { STYLE_TREND } from "../shared/trend/styles.ts";
import { STYLE_WEATHER_PICTURES } from "../shared/weather/styles.ts";
import { STYLE_WIND } from "../shared/wind/styles.ts";

const STYLE_TILE_CARD = `
  /* 8 px above and below: a one-row tile is its 56 px (38 px of texts, a border up to 2 px) with
     the icon 10 px from its top, and a taller tile (a plot, controls under the line) starts its
     icon there too, not nearer the top than a one-row tile beside it */
  ha-card.layout-tile:not(.tvertical) .body { padding-block: 8px; }
  .tlead { flex: none; display: flex; }
  .tlead[hidden] { display: none; }
  /* the icon's picture fades in when it is a new one (the next song's cover) */
  @keyframes tfade { from { opacity: 0; } }
  .tlead img.picture.pwait { opacity: 0; }
  .tlead img.picture.pfade { animation: tfade .7s ease both; }
  @media (prefers-reduced-motion: reduce) { .tlead img.picture.pfade { animation: none; } }
  /* what is behind the texts (backdrop.ts: a picture, the kind's drawing, a glow) fills the tile
     under the content and its layers. A glow (a light's) is the tile's colour from its bottom
     edge, as strong as its level; over a kind's drawing the icon keeps a solid circle */
  ha-card.layout-tile > .body:has(> .pback:not([hidden])) { isolation: isolate; }
  ha-card.layout-tile .pglow { background: radial-gradient(90% 140% at 50% 150%, color-mix(in srgb, var(--glow) 50%, transparent) 0%, transparent 80%); }
  @media (prefers-reduced-motion: reduce) { .pglow { transition: none; } }
  ha-card.pdraw .tlead .lead .shape { background: ${iconBg("var(--fe-color)", CARD_BG)}; }
  ha-card.pdraw .tlead .lead.plain .shape { background: transparent; }
  /* a kind's curve below the line (show_picture: the sun's day, a trend's lines) is as tall as a
     tile's sparkline; on a poster it reaches up behind the texts, here it keeps below them */
  .row.tile > .pcurve { position: relative; flex: 1 1 auto; height: ${PLOT_H.sparkline}px; min-height: 40px; min-width: 0; margin: 0; touch-action: pan-y; }
  .row.actionable > .pcurve { pointer-events: auto; }
  /* a plot below the line (a sparkline, columns, a kind's curve) runs to the tile's edges under the
     body's padding, as on a poster; the card's corners clip it. A strip (blocks and their time
     labels) keeps the padding; columns run a little past the edges, so the card cuts the first and
     the last bar and none shows its rounded foot; a placeholder (no data, loading) keeps the
     padding */
  ha-card.layout-tile .row.tile > :is(.plot, .pcurve) { width: auto; margin: 0 -12px -8px; }
  ha-card.layout-tile .row.tile > .plot[data-kind="strip"] { margin: 0; }
  ha-card.layout-tile .row.tile > .plot[data-kind="columns"] { margin: 0 -14px -12px; }
  ha-card.tvertical .row.tile > :is(.plot, .pcurve) { margin: 0 -12px -12px; }
  ha-card.tvertical .row.tile > .plot[data-kind="strip"] { margin: 0; }
  ha-card.tvertical .row.tile > .plot[data-kind="columns"] { margin: 0 -14px -16px; }
  ha-card.layout-tile .row.tile > .plot .label.placeholder { margin-left: 12px; }
  ha-card.layout-tile .row.tile > .plot[data-kind="columns"] .label.placeholder { margin-left: 14px; }
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
  ha-card.tvertical .row.tile .line > .tinfo { flex: none; display: block; }
  ha-card.tvertical .row.tile .line > .end { max-width: none; justify-content: center; }
  /* a tile with no room for its controls under the line (TileCard._fitControls) keeps them on
     the line beside the name, else leaves them out */
  ha-card.layout-tile .row.tile.tkeep > .top > .main > .line { flex-wrap: nowrap; }
  ha-card.layout-tile .row.tile.tdrop > .top > .main > .line > .end, ha-card.layout-tile .row.tile.tdrop > .ctl { display: none; }
  /* a gauge below the line at its drawing's own size (120 px): its value no larger than the
     name above it, which the line already says */
  ha-card.layout-tile .row.tile > .gauge { max-width: 120px; }
  /* the badges beside the texts (the status among them with status_badge), always all of them:
     the name and the line give way (and the controls wrap under the line where even their least
     does not fit). They centre on the texts, the icon's middle, and have no height of their own
     (a pill is taller than the name's line), so a one-row tile keeps its 56 px */
  .row.tile .line > .tinfo { flex: 1 1 0; display: flex; align-items: center; gap: 8px; }
  /* the texts count only as their least (size containment): the badges keep their width, the
     name and the line take what is left */
  .row.tile .tinfo > .texts { flex: 1 1 auto; min-width: 24px; contain: inline-size; }
  .row.tile .line:has(> .end > .ctl) > .tinfo > .texts { min-width: 40px; }
  .tcorner { flex: none; height: 0; display: flex; align-items: center; justify-content: flex-end; gap: 4px; }
  .tcorner > .row.hval { flex: none; pointer-events: auto; }
  .row.hval.pstatus.empty { display: none; }
  /* nothing to show (a status with nothing to say alone): no room taken, not even the gap */
  .tcorner:not(:has(> .row.hval:not(.empty, [hidden]))) { display: none; }
  /* vertical: the corner at the top right, beside the icon, as a poster's */
  /* vertical: the badges in a row of their own at the top right, above the icon (the body makes
     room for them), never over it */
  ha-card.tvertical .tcorner { position: absolute; top: 12px; right: 12px; height: var(--b-h, 24px); }
  ha-card.tvertical > .body:has(.tcorner > .row.hval:not(.empty, [hidden])) { padding-top: 44px; }
  /* the badge on the icon, as Home Assistant's tile: 16 px over the circle's top right */
  .tlead { position: relative; }
  .tibadge { position: absolute; top: -3px; right: -3px; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--tibadge); color: var(--white-color, #fff); --mdc-icon-size: 12px; line-height: 0; pointer-events: none; transition: background-color 280ms ease-in-out; }
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
  STYLE_KIND_BACKDROP +
  STYLE_KIND_CARD_FOCUS +
  STYLE_TILE_CARD +
  STYLE_FLOW_MOTION;
