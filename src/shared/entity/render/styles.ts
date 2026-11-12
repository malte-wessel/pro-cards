// CSS of the entity cards, in pieces so every card ships only what it renders.
// Colours come from HA theme tokens; --fe-color is set per row from the resolved look.
import { tipStyle } from "../../hover.ts";
import { CARD_BG, ICON_RADIUS, STYLE_HOST, STYLE_ICONS, iconBg } from "../../constants.ts";
import {
  FONT_FAMILY,
  HEADER_TITLE,
  TILE_PRIMARY,
  TILE_SECONDARY,
  font,
  fs,
  fw,
  lh,
  type,
} from "../../typography.ts";
import { STYLE_SLIDER } from "../../slider.ts";

export const STYLE_BASE = `
  ${STYLE_ICONS}
  ${STYLE_HOST}
  /* what a visibility condition hides; beats the display of rows, cells and fields */
  [hidden] { display: none !important; }
  ha-card { height: 100%; box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden; contain: inline-size; --fe-tint: transparent; }
  ha-card.tinted { background: color-mix(in srgb, var(--fe-tint) 12%, var(--ha-card-background, var(--card-background-color))); }
  .body { display: flex; flex-direction: column; gap: 14px; padding: 12px 16px 14px 16px; min-width: 0; }
  /* dividers run from edge to edge, through the body's side padding */
  .divider { height: 1px; margin: 0 -16px; background: var(--divider-color); }
`;
export const STYLE_TILE = `
  /* a tile is one 56 px row, two with a header: the floor holds it there whatever the theme's
     border (the 38 px of two text lines beside the 36 px lead, 6 px padding and a border up to
     2 px fit; a calc on the border width would break on a unitless 0); a taller tile (a
     stretched grid row, fixed rows) centres its content, unless the card around it keeps it at
     the top (--pro-cards-tile-align: a tile group's row, its icons level) */
  .layout-tile .body { padding: 6px 12px; gap: 8px; flex: 1; justify-content: var(--pro-cards-tile-align, center); }
  ha-card.layout-tile { min-height: 56px; }
  ha-card.layout-tile:has(> .header:not([hidden])) { min-height: 120px; }
  /* a tile is one button, as Home Assistant's tile: the row's action layer fills the card's body
     (the row stays static, the body holds the layer), so a click anywhere on the tile runs it, also
     when the tile is taller than its row; the focus ring is drawn inside, the card clips outside */
  ha-card.layout-tile .body { position: relative; }
  ha-card.layout-tile .row.actionable:is(.tile, .wtile):not(.flow) { position: static; }
  ha-card.layout-tile .row:is(.tile, .wtile) > .hit { border-radius: var(--ha-card-border-radius, 12px); }
  ha-card.layout-tile:has(> .header:not([hidden])) .row:is(.tile, .wtile) > .hit { border-top-left-radius: 0; border-top-right-radius: 0; }
  ha-card.layout-tile .row:is(.tile, .wtile) > .hit:focus-visible { box-shadow: inset 0 0 0 2px var(--fe-color); }
  /* a gauge is the tile's picture: the icon and name keep the top left, the gauge (and what
     follows it) centres in the room below, across and down */
  .row.tile:has(> .gauge) { flex: 1 1 auto; }
  .row.tile > .gauge { align-self: center; margin-top: auto; }
  .row.tile:has(> .gauge) > :last-child { margin-bottom: auto; }
`;
// the poster's texts: the name in small capitals, the large value in the regular weight
export const POSTER_NAME = `${type(11, 16)} font-weight: ${fw("medium")}; letter-spacing: .1em; text-transform: uppercase; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
const POSTER_VALUE = `font-weight: ${fw("normal")}; letter-spacing: -.02em;`;
// a poster (the poster card's row; fill.ts: fillPosterSlots): the icon and the corner's badges at
// the top, the name, the big value and what follows them anchored to the bottom of whatever height
// it is given (unlike a tile, which centres); its natural height is its content's. A sparkline or
// columns plot takes the room left below the value and runs to the card's edges. Content taller than the
// card gives way at the top: the value and its controls stay, the icon is cut first.
const STYLE_POSTER = `
  ha-card.layout-poster .body { flex: 1 1 auto; min-height: 0; padding: 16px; }
  /* the top line keeps the top (its auto margin takes the room); with no room left, the content
     packs to the bottom and overflows at the top */
  .row.poster { flex: 1 1 auto; min-height: 0; justify-content: flex-end; gap: 12px; }
  .ptop { flex: none; margin-bottom: auto; display: flex; align-items: flex-start; gap: 12px; min-width: 0; }
  .plead { flex: none; }
  .corner { flex: 0 1 auto; min-width: 0; margin-inline-start: auto; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
  /* the badges answer the pointer above the poster's own action layer */
  .row.poster .corner > .row.hval { pointer-events: auto; max-width: 100%; }
  /* the status's words wrap where it has a space, two lines at most (a word too long for the room
     still ends in an ellipsis; a value and its unit never part, so the other badges keep one line):
     the corner floats, so its height moves nothing */
  .row.poster .corner > .row.hval.pb.pstatus { height: auto; min-height: var(--b-h); padding-block: 3px; }
  .row.poster .corner > .row.hval.pb.pstatus .state { white-space: normal; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; text-overflow: ellipsis; }
  .pbody { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .pbody:has(> .plot.grow) { flex: 1 1 auto; min-height: 0; }
  /* the texts keep their lines (clipped text would shrink to nothing); the plot gives way */
  .pbody > :not(.plot) { flex: none; }
  .pname { ${POSTER_NAME} }
  /* the value and the line under it as one block, the controls beside it; where they do not fit
     beside it, under it. The block is as wide as its value (the line under it takes the room it is
     given, cut where it ends) and grows to push the controls to the right. Beside it, the controls
     are centred on the block: a control as tall as the value's line then neither lifts the name
     nor sits above the value (on its baseline it reached 7 px above the value and pushed the name
     up). The block itself sits on its last baseline, where it sits without them */
  .pmain { display: flex; flex-wrap: wrap; align-items: last baseline; gap: 8px 12px; min-width: 0; }
  .pmain > .end { align-self: center; }
  .ptext { flex: 1 1 auto; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .ptext > :is(.pname, .secondary) { contain: inline-size; }
  .pvalue { display: flex; min-width: 0; }
  .pvalue > .big { flex: 0 1 auto; }
  .pmain > .end { min-width: 0; max-width: 100%; }
  /* the place the card found for its size (PosterCard._placeControls) holds: beside, a wider value
     is drawn smaller; under, a narrower one leaves the controls where they are */
  .pmain.beside { flex-wrap: nowrap; }
  .pmain.beside > .end { flex-shrink: 0; }
  .pmain.under > .end { flex-basis: 100%; }
  .row.poster .big { --pnum: ${fs(32)}; --plh: ${lh(32, 35)}; }
  .row.poster .big b { ${type(32, 35)} ${POSTER_VALUE} }
  .row.poster .big span { font-size: ${fs(16)}; }
  /* with a curve the value is smaller: the curve gets the room (a fitted value still takes its own
     size, by order) */
  .pbody:has(> .plot.grow) .big { --pnum: ${fs(28)}; --plh: ${lh(28, 31)}; }
  .pbody:has(> .plot.grow) .big b { ${type(28, 31)} }
  /* a word (Off, Cleaning) is drawn as a number is, at its size and in its line, so the name, the
     value and the line under it keep the same gaps whatever the value; where it is too wide the
     card draws every value smaller (PosterCard._fitValue) */
  .row.poster .big.word b { letter-spacing: 0; }
  .pbody > :is(.bar, .gauge, .ctl-slider, .ctl-segments, .ctl-buttons, .plot) { margin-top: 8px; }
  /* a slider's bar is a control's height: it keeps only the body's gap below the value (whose line
     already leaves room under the digits), so a light's poster at three rows keeps its brightness */
  .pbody > .ctl-slider.thick { margin-top: 0; }
  .pbody > .gauge { align-self: center; }
  /* a gauge poster: the arc and its name centred across; the arc takes the room under the top line,
     from 80 px high (three rows at any width) up to 204 × 136, drawn whole in its box (cropped to
     the drawing, GAUGE_CROP, so the arc fills the height) */
  .row.poster:has(> .pbody.pgauge) > .ptop { margin-bottom: 0; }
  .pbody.pgauge { flex: 1 1 auto; min-height: 0; justify-content: center; align-items: center; text-align: center; }
  .pbody.pgauge > .pmain { align-self: stretch; justify-content: center; }
  .pbody.pgauge > .gauge { margin-top: 0; flex: 1 1 80px; min-height: 80px; max-height: 136px; width: 100%; max-width: 204px; }
  .pbody.pgauge > .gauge svg { height: 100%; }
  /* the poster is one button (its action layer fills the body: the whole card, as a tile's) and
     its plot runs to the card's edges, under the body's padding; the card's corners clip it. A
     strip (blocks and their time labels, like a bar) keeps the padding; columns run a little past
     the edges, so the card cuts the first and the last bar and no bar shows its rounded foot */
  ha-card.layout-poster .body { position: relative; }
  ha-card.layout-poster .row.actionable.poster { position: static; }
  ha-card.layout-poster .row.poster > .hit { border-radius: var(--ha-card-border-radius, 12px); }
  ha-card.layout-poster .row.poster > .hit:focus-visible { box-shadow: inset 0 0 0 2px var(--fe-color); }
  ha-card.layout-poster .pbody > .plot { width: auto; margin: 8px -16px -16px; }
  ha-card.layout-poster .pbody > .plot[data-kind="strip"] { margin: 8px 0 -6px; }
  ha-card.layout-poster .pbody > .plot[data-kind="columns"] { margin: 8px -18px -20px; }
  /* a strip as a ribbon along the card's bottom edge, behind the texts: it takes no room */
  ha-card.layout-poster .pbody > .plot.edge { position: absolute; inset: auto 0 0; height: 6px; margin: 0; }
  ha-card.layout-poster .pbody > .plot.edge > .tip { bottom: 10px; }
  /* a poster's plot runs to the card's edges: its placeholder (no data, loading) keeps the padding */
  ha-card.layout-poster .pbody > .plot .label.placeholder { margin-left: 16px; }
  ha-card.layout-poster .pbody > .plot[data-kind="columns"] .label.placeholder { margin-left: 18px; }
  /* a line right under the value reaches up under it; the texts stay on top of it (columns would
     cover them, and a line under a secondary line would cross its text) */
  ha-card.layout-poster .pbody > .pmain:not(:has(> .ptext > .secondary)) + .plot.grow[data-kind="sparkline"] { margin-top: -16px; }
  ha-card.layout-poster .pbody:has(> .plot.grow) > :not(.plot) { position: relative; z-index: 1; }
`;
// the header badges (render/badge.ts): the row is the pill (.pb) of its style (b-outline, b-soft,
// b-filled, b-tag; b-plain draws none, but keeps its shape) and size (b-s, b-m, b-l: 24 / 30 /
// 36 px high). A filled pill
// draws its glyphs in --b-ink, every other one in the row's colour
const STYLE_BADGES = `
  .row.hval.b-s { --b-h: 24px; --b-ps: 6px; --b-pe: 8px; --b-gap: 4px; --b-icon: 14px; --b-ring: 16px; --b-th: 16px; --b-tw: 28px; }
  .row.hval.b-m { --b-h: 30px; --b-ps: 8px; --b-pe: 10px; --b-gap: 6px; --b-icon: 16px; --b-ring: 20px; --b-th: 22px; --b-tw: 38px; }
  .row.hval.b-l { --b-h: 36px; --b-ps: 10px; --b-pe: 12px; --b-gap: 6px; --b-icon: 18px; --b-ring: 24px; --b-th: 28px; --b-tw: 48px; }
  .row.hval.pb { height: var(--b-h); box-sizing: border-box; padding: 0 var(--b-pe) 0 var(--b-ps); gap: var(--b-gap); border-radius: 999px; }
  .header .hvals:has(> .pb) { gap: 6px; }
  .row.hval.pb > :is(ha-icon, ha-state-icon) { flex: none; --mdc-icon-size: var(--b-icon); }
  .row.hval.pb > img.picture { width: var(--b-icon); height: var(--b-icon); border-radius: 50%; }
  .row.hval.b-s.pb :is(.state, .secondary) { ${type(12, 16)} }
  .row.hval.b-m.pb :is(.state, .secondary) { ${type(13, 16)} }
  .row.hval.b-l.pb :is(.state, .secondary) { ${type(14, 20)} }
  .row.hval.pb .state { color: var(--primary-text-color); }
  .row.hval.pb .state.accent { color: var(--fe-color); }
  /* plain: the pill draws nothing, so it takes no more height than its text and icon (20 px; the
     pill reaches past it, for the hover layer), and the last one at a header's end reaches out by
     its end padding: its value ends where the content does, in line with the rows below it */
  .row.hval.b-plain { margin-block: calc((var(--b-h) - 20px) / -2); }
  /* its glyphs as the header always drew its items, larger at m and l */
  .row.hval.b-plain > :is(ha-icon, ha-state-icon) { --mdc-icon-size: 18px; }
  .row.hval.b-s.b-plain :is(.state, .secondary) { ${type(13, 16)} }
  .row.hval.b-m.b-plain > :is(ha-icon, ha-state-icon) { --mdc-icon-size: 20px; }
  .row.hval.b-m.b-plain :is(.state, .secondary) { ${type(14, 20)} }
  .row.hval.b-l.b-plain > :is(ha-icon, ha-state-icon) { --mdc-icon-size: 22px; }
  .row.hval.b-l.b-plain :is(.state, .secondary) { ${type(16, 20)} }
  .header:not(.bpos-inline, .bpos-below, .align-center) > .hvals > .row.hval.b-plain:last-child { margin-inline-end: calc(-1 * var(--b-pe)); }
  /* outline: Home Assistant's badge, on the card's surface (its background, border and shadow) */
  .row.hval.b-outline { --b-bw: var(--ha-card-border-width, 1px); background: ${CARD_BG}; border: var(--b-bw) solid var(--ha-card-border-color, var(--divider-color)); box-shadow: var(--ha-card-box-shadow, none); backdrop-filter: var(--ha-card-backdrop-filter, none); }
  .row.hval.b-soft { background: var(--fe-soft); }
  .row.hval.b-soft .state { color: var(--fe-color); }
  .row.hval.b-filled { --b-ink: var(--text-primary-color, #fff); background: var(--fe-color); color: var(--b-ink); }
  .row.hval.b-filled :is(ha-icon, ha-state-icon, .state, .state.accent, .secondary) { color: var(--b-ink); }
  /* tag: the poster's status pill, a coloured outline and its text in the row's colour (a border,
     so a rule's pulse keeps it) */
  .row.hval.b-tag { border: 1px solid color-mix(in srgb, var(--fe-color) 40%, transparent); }
  .row.hval.b-tag :is(ha-icon, ha-state-icon, .state, .state.accent, .secondary) { color: var(--fe-color); }
  .row.hval.b-tag :is(.state, .secondary) { font-weight: ${fw("medium")}; }
  /* a switch in a pill sits in its rounded end, the same gap to the edge all round (4 px), sized
     to the pill: 16 × 28 in a small one, 22 × 38 in a medium one, the switch's own 28 × 48 in a
     large one */
  .row.hval.pb > .toggle { width: var(--b-tw); height: var(--b-th); border-radius: calc(var(--b-th) / 2); }
  .row.hval.pb > .toggle i { top: 2px; left: 2px; width: calc(var(--b-th) - 4px); height: calc(var(--b-th) - 4px); }
  .row.hval.pb > .toggle.on i { left: calc(var(--b-tw) - var(--b-th) + 2px); }
  .row.hval.pb > .toggle.pending i { left: calc((var(--b-tw) - var(--b-th) + 4px) / 2); }
  .row.hval.pb:has(> .toggle:last-child) { padding-right: calc((var(--b-h) - var(--b-th)) / 2 - var(--b-bw, 0px)); }
  /* a switch in a filled pill: its track in the ink, as the pill already is the colour */
  .row.hval.b-filled .toggle.on { background: color-mix(in srgb, var(--b-ink) 40%, transparent); }
  /* the tap area is 44 px high whatever the pill's height; the hover layer and the focus ring keep
     to the pill */
  .row.hval.pb > .hit { inset: min(0px, calc((var(--b-h) - 44px) / 2)) -3px; }
  .row.hover-fx.hval.pb > .hit > .ripple { inset: max(0px, calc((44px - var(--b-h)) / 2)) 3px; }
  .row.actionable.hval.pb > .hit:focus-visible { box-shadow: none; }
  .row.hval.pb:has(> .hit:focus-visible) { outline: 2px solid var(--fe-color); outline-offset: 1px; }
  /* what a visual draws: a dot or a sparkline for the icon, a ring around it, a bar, the trend */
  .hval .bdot { flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--b-ink, var(--fe-color)); }
  .hval .bring { position: relative; flex: none; width: var(--b-ring, 20px); height: var(--b-ring, 20px); display: flex; align-items: center; justify-content: center; }
  .hval .bring svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  .hval .bring .track { fill: none; stroke: color-mix(in srgb, var(--b-ink, var(--fe-color)) 22%, transparent); }
  .hval .bring .prog { fill: none; stroke: var(--b-ink, var(--fe-color)); stroke-linecap: round; }
  /* a ring sits in the pill's rounded end, the same gap to the edge all round */
  .row.hval.pb:has(> .bring:first-child, > .hit:first-child + .bring) { padding-left: calc((var(--b-h) - var(--b-ring)) / 2 - var(--b-bw, 0px)); }
  /* the icon inside the ring, clear of its stroke (beats the pill's icon size) */
  .row.hval .bring :is(ha-icon, ha-state-icon) { display: flex; --mdc-icon-size: calc(var(--b-ring, 20px) * .55); }
  .row.hval .bring img.picture { width: 55%; height: 55%; border-radius: 50%; }
  .hval .bbar { flex: none; width: 28px; height: 4px; border-radius: 2px; overflow: hidden; background: color-mix(in srgb, var(--b-ink, var(--fe-color)) 22%, transparent); }
  .hval .bbar > i { display: block; height: 100%; border-radius: inherit; background: var(--b-ink, var(--fe-color)); }
  .hval .bspark { flex: none; display: block; width: calc(var(--b-h, 24px) + 4px); height: calc(var(--b-h, 24px) / 2); }
  .hval .bspark svg { display: block; width: 100%; height: 100%; overflow: visible; }
  .hval .bspark path { fill: none; stroke: var(--b-ink, var(--fe-color)); stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
  .hval .btr { flex: none; display: inline-flex; align-items: center; gap: 1px; ${type(11, 16)} font-weight: ${fw("medium")}; color: var(--b-ink, var(--secondary-text-color)); font-variant-numeric: tabular-nums; }
  .hval .btr :is(ha-icon, ha-state-icon) { --mdc-icon-size: 14px; color: inherit; }
  /* stale_after: grey while the entity has not reported (beats the row's own colour) */
  .row.hval.stale { --fe-color: var(--disabled-text-color, var(--secondary-text-color)) !important; }
  /* a rule's pulse: a ring that grows and fades; with reduced motion a still ring */
  .row.hval.pulse { animation: badge-pulse 2s ease-out infinite; }
  @keyframes badge-pulse {
    0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--fe-color) 50%, transparent); }
    70%, 100% { box-shadow: 0 0 0 8px color-mix(in srgb, var(--fe-color) 0%, transparent); }
  }
  @media (prefers-reduced-motion: reduce) {
    .row.hval.pulse { animation: none; box-shadow: 0 0 0 2px color-mix(in srgb, var(--fe-color) 40%, transparent); }
  }
`;
// a badge (a header entity, a pill in a poster's corner)
const STYLE_HVAL = `
  .row.hval { flex: 0 1 auto; flex-direction: row; align-items: center; gap: 4px; border-radius: 6px; min-width: 0; }
  .hval .state, .hval .secondary { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .hval ha-icon, .hval ha-state-icon { --mdc-icon-size: 18px; color: var(--fe-color); }
  .hval .state, .hval .pill { ${type(13, 16)} }
  /* a header badge carries its icon; with nothing to say it is the icon in a circle */
  .hval .pill.badge { display: inline-flex; align-items: center; gap: 4px; padding-left: 6px; }
  .hval .pill.badge > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .hval .pill.badge ha-icon, .hval .pill.badge ha-state-icon { flex: none; --mdc-icon-size: 16px; }
  .hval .pill.badge.round { flex: none; width: 24px; height: 24px; padding: 0; justify-content: center; }
  /* a picture in the icon's place, at the icon's size and in the icon's shape */
  .hval img.picture { flex: none; width: 18px; height: 18px; border-radius: ${ICON_RADIUS}; object-fit: cover; }
  .hval .pill.badge img.picture { width: 16px; height: 16px; }
  .hval .secondary { font-size: ${fs(12)}; }
  ${STYLE_BADGES}
`;
export const STYLE_HEADER = `
  /* 4 px here and the body's 12 px: the title line sits 16 px above the first row */
  .header { display: flex; align-items: center; gap: 10px; padding: 12px 16px 4px 16px; min-width: 0; }
  .header ha-icon { flex: none; color: var(--secondary-text-color); --mdc-icon-size: 20px; }
  .header .title { flex: 1; min-width: 0; ${HEADER_TITLE} color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .header .hvals { display: flex; align-items: center; gap: 10px; flex: 0 1 auto; min-width: 0; max-width: 60%; }
  .header .hvals:empty { display: none; }
  /* title_tap_action: the title and its icon are the button */
  .header.tappable .title, .header.tappable:not(.icon-own) > ha-icon { cursor: pointer; }
  .header.tappable .title:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; border-radius: 4px; }
  ${STYLE_HVAL}
`;
// the icon in a lead (and in a button in its place) is two thirds of a small lead, at most 24 px
// (Home Assistant's tile: a 24 px icon in a 36 px circle); a bigger lead (the hero's 56 px) keeps 55 %
const LEAD_ICON = "clamp(calc(var(--lead, 36px) * .55), 24px, calc(var(--lead, 36px) * .67))";
export const STYLE_ROW = `
  .row { --fe-color: var(--primary-color); --fe-soft: color-mix(in srgb, var(--fe-color) 20%, transparent); --fe-track: color-mix(in srgb, var(--primary-text-color) 8%, transparent); }
  .row { display: flex; flex-direction: column; gap: 10px; min-width: 0; border-radius: 8px; outline: none; }
  .row.actionable { cursor: pointer; position: relative; isolation: isolate; }
  /* the row's own action: a layer behind the content; the controls (and plots) stay on top of it */
  .hit { position: absolute; inset: 0; z-index: -1; border-radius: inherit; outline: none; }
  .row.actionable > :not(.hit) { pointer-events: none; }
  .row.actionable :is(.ctl, .toggle, .lead.tap, .plot):not(.disabled) { pointer-events: auto; }
  .row.actionable > .hit:focus-visible { box-shadow: 0 0 0 2px var(--fe-color); }
  .top { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .lead { position: relative; flex: none; width: var(--lead, 36px); height: var(--lead, 36px); }
  .lead svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  .lead .shape { position: absolute; inset: 0; border-radius: ${ICON_RADIUS}; display: flex; align-items: center; justify-content: center; color: var(--fe-color); background: ${iconBg("var(--fe-color)")}; --mdc-icon-size: ${LEAD_ICON}; font-size: calc(var(--lead, 36px) * .24); font-weight: ${fw("medium")}; line-height: 1; white-space: nowrap; overflow: hidden; font-variant-numeric: tabular-nums; }
  .lead .shape.value { color: var(--primary-text-color); background: transparent; }
  /* icon_style: plain, the icon without its circle (also a lead toggle that is off) */
  .lead.plain .shape, .lead.plain.tap.off .shape { background: transparent; }
  /* a ring's icon stays round, inside its arc */
  .lead.ring .shape { inset: 16%; border-radius: 50%; --mdc-icon-size: calc(var(--lead, 36px) * .42); }
  /* show_entity_picture: the picture fills the shape (in a ring, the inside of the ring) */
  .lead .shape > img.picture { display: block; width: 100%; height: 100%; object-fit: cover; }
  .lead .track { fill: none; stroke: var(--fe-soft); }
  .lead .prog { fill: none; stroke: var(--fe-color); stroke-linecap: round; transition: stroke-dashoffset .4s; }
  .main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
  .line { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .texts { flex: 1 1 0; min-width: 24px; display: flex; flex-direction: column; gap: 2px; }
  .primary { ${TILE_PRIMARY} white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .secondary { ${TILE_SECONDARY} white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .secondary.accent { color: var(--fe-color); font-weight: ${fw("medium")}; }
  .end { flex: 0 1 auto; min-width: 0; max-width: 60%; display: flex; align-items: center; gap: 8px; }
  .end:empty { display: none; }
  .state { font-size: ${fs(14)}; font-weight: ${fw("medium")}; color: var(--primary-text-color); font-variant-numeric: tabular-nums; white-space: nowrap; }
  /* a rule label in the value's place (items, fields, header entities) takes the rule's colour */
  .state.accent { color: var(--fe-color); font-weight: ${fw("medium")}; }
  .pill { ${type(12, 16)} font-weight: ${fw("medium")}; padding: 4px 10px; border-radius: 999px; color: var(--fe-color); background: var(--fe-soft); white-space: nowrap; letter-spacing: .02em; min-width: 0; max-width: 100%; box-sizing: border-box; overflow: hidden; text-overflow: ellipsis; }
  .big { display: flex; align-items: baseline; gap: 6px; white-space: nowrap; min-width: 0; max-width: 100%; }
  .big b { ${type(32, 36)} font-weight: ${fw("medium")}; letter-spacing: -.6px; color: var(--primary-text-color); font-variant-numeric: tabular-nums; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .big span { font-size: ${fs(14)}; color: var(--secondary-text-color); }
`;
// the controls (render/controls.ts): every size and colour comes from the library the cards draw
// (the 8 px bar, the round lead, the pill), coloured by --fe-color like the visuals
export const STYLE_CONTROLS = `
  .ctl button, .ctl-chip, .ctl-hold, .toggle { font: inherit; }
  /* an icon keeps its box while Home Assistant still loads it, so a control never changes width */
  /* a line with a control: the control keeps its size, the value text and the name give way */
  .end:has(> .ctl), .val:has(> .ctl) { max-width: none; flex: 0 1 auto; min-width: 0; }
  /* when the control and a short name (40 px) do not fit side by side, the control wraps under it:
     a switch or hold button stays on the line of a 6-column tile, buttons, steppers and segments wrap */
  .line:has(> .end > .ctl) { flex-wrap: wrap; row-gap: 8px; }
  .line:has(> .end > .ctl) > .texts { min-width: min(40px, 100%); }
  /* and a value text beside the control goes above it rather than squeeze it out */
  .end:has(> .ctl) { flex-wrap: wrap; row-gap: 6px; }
  /* a tile or hero lead keeps its icon level with the name, also when the control wraps under it
     (as a control under the line already does) */
  .row.tile > .top:has(> .main > .line > .end > .ctl), .row.hero > .top:has(> .main > .line > .end > .ctl) { align-items: flex-start; }
  .end:has(> .ctl) > .state, .val:has(> .ctl) > .state { flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  /* segments shrink to their icons; past that they scroll sideways, so no option is ever cut off */
  .end > .ctl-segments, .val > .ctl-segments { flex: 0 1 auto; min-width: 0; overflow-x: auto; scrollbar-width: none; }
  .end > .ctl-segments::-webkit-scrollbar, .val > .ctl-segments::-webkit-scrollbar { display: none; }
  .ctl ha-icon, .ctl ha-state-icon { display: inline-flex; flex: none; width: var(--mdc-icon-size, 24px); height: var(--mdc-icon-size, 24px); }
  .ctl.disabled, .lead.tap.disabled { opacity: .4; pointer-events: none; }
  .ctl button:disabled { opacity: .38; cursor: default; }
  .ctl:focus-visible, .ctl button:focus-visible, .toggle:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--fe-color); }
  /* a select's ring goes round the whole control, its corners, not the bare select inside it */
  .ctl select:focus-visible { outline: none; }
  .ctl-select:has(> select:focus-visible) { box-shadow: 0 0 0 2px var(--fe-color); }
  .toggle { flex: none; width: 48px; height: 28px; border: 0; border-radius: 14px; padding: 0; position: relative; cursor: pointer; background: var(--switch-unchecked-track-color, rgba(128,128,128,.4)); }
  .toggle.on { background: var(--fe-color); }
  .toggle i { position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%; background: var(--text-primary-color, #fff); transition: left .2s; box-shadow: 0 1px 3px rgba(0,0,0,.3); }
  .toggle.on i { left: 23px; }
  .toggle.sm { width: 36px; height: 20px; border-radius: 10px; }
  .toggle.sm i { top: 2px; left: 2px; width: 16px; height: 16px; }
  .toggle.sm.on i { left: 18px; }
  .toggle.pending { background: color-mix(in srgb, var(--fe-color) 45%, transparent); }
  .toggle.pending i { left: 13px; animation: ctl-pulse 1s ease-in-out infinite; }
  .toggle.sm.pending i { left: 10px; }
  .lead.tap { cursor: pointer; border-radius: ${ICON_RADIUS}; outline: none; }
  .lead.tap:focus-visible .shape { box-shadow: 0 0 0 2px var(--fe-color); }
  .lead.tap.off .shape { color: var(--secondary-text-color); background: ${iconBg("var(--primary-text-color)", "transparent", 0.4)}; }
  .lead.tap.pending .shape { animation: ctl-pulse 1s ease-in-out infinite; }
  ${STYLE_SLIDER}
  .end .ctl-slider, .val .ctl-slider { flex: 0 1 120px; width: 120px; min-width: 64px; }
  .ctl-slider.pending .fill { opacity: .55; }
  /* a slider's bar (a kind card's, a table's too): Home Assistant's, filled to the value
     with a handle in its fill, as tall as the other controls. The track clips the fill (so its
     handle goes with it at the start); the bubble, placed on the slider, shows above it */
  .ctl-slider.thick { position: relative; height: 36px; border-radius: 10px; }
  .ctl-slider.thick .track { position: static; height: 100%; border-radius: 10px; overflow: hidden; background: color-mix(in srgb, var(--fe-color) 20%, transparent); }
  .ctl-slider.thick .fill { position: relative; display: block; height: 100%; border-radius: 0; }
  .ctl-slider.thick .fill::after { content: ""; position: absolute; top: 50%; right: 6px; width: 4px; height: 14px; margin-top: -7px; border-radius: 2px; background: var(--text-primary-color, #fff); }
  .ctl-slider.thick .knob { display: none; }
  .ctl-slider.thick .bubble { bottom: calc(100% + 6px); }
  /* in a table: 28 px, the small controls' height */
  .ctl-slider.thick.sm { height: 28px; border-radius: 8px; }
  /* a colour slider: its track the colours it sets, no fill, the handle ringed to show on white */
  .ctl-slider.grad .track { background: var(--grad); }
  .ctl-slider.grad .fill { background: transparent; }
  /* its handle a hollow capsule the colour shows through (8 × 24, a 2 px white ring with a faint
     shadow so it shows on white too), kept inside the bar at either end (--p: where it is, 0 to 1) */
  .ctl-slider.grad.thick .fill::after { display: none; }
  .ctl-slider.grad.thick .knob, .ctl-slider.grad.thick.dragging .knob { display: block; top: 6px; bottom: 6px; width: 8px; height: auto; margin: 0 0 0 calc(var(--p, 0) * -8px); box-sizing: border-box; border: 2px solid var(--text-primary-color, #fff); border-radius: 4px; background: transparent; box-shadow: 0 0 2px rgba(0,0,0,.35), inset 0 0 2px rgba(0,0,0,.35); animation: none; }
  .ctl-slider.grad.thick.sm .knob { top: 4px; bottom: 4px; }
  .ctl-slider.grad.dim .track { filter: saturate(.5); opacity: .4; }
  .ctl-slider.thick.sm .track { height: 100%; border-radius: 8px; }
  .ctl-slider.thick.sm .fill::after { right: 5px; width: 3px; height: 12px; margin-top: -6px; }
  .ctl-slider.pending .knob { background: transparent; box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--fe-color) 55%, transparent); animation: ctl-pulse 1s ease-in-out infinite; }
  .ctl .round { flex: none; position: relative; width: 32px; height: 32px; border: 0; padding: 0; border-radius: 50%; background: var(--fe-track); color: var(--primary-text-color); display: flex; align-items: center; justify-content: center; cursor: pointer; --mdc-icon-size: 20px; }
  .ctl .round.s { width: 30px; height: 30px; --mdc-icon-size: 18px; }
  .ctl.sm .round { width: 28px; height: 28px; --mdc-icon-size: 16px; }
  .ctl .round.f { background: var(--fe-color); color: var(--text-primary-color, #fff); }
  .ctl .round.pending { animation: ctl-pulse 1s ease-in-out infinite; }
  .ctl-buttons { display: flex; align-items: center; gap: 6px; flex: none; }
  /* custom buttons: each in its own colour (its --fe-color), soft until on, many of them wrap */
  .ctl-buttons.custom { flex: 0 1 auto; flex-wrap: wrap; min-width: 0; }
  .end > .ctl-buttons.custom, .val > .ctl-buttons.custom { justify-content: flex-end; }
  .ctl-buttons.custom > button { background-color: color-mix(in srgb, var(--fe-color) 20%, transparent); color: var(--fe-color); transition: background-color .2s, color .2s; }
  .ctl-buttons.custom > button.on { background-color: var(--fe-color); color: var(--text-primary-color, #fff); }
  .ctl-buttons.custom > button.pending { animation: ctl-pulse 1s ease-in-out infinite; }
  /* buttons that each set an option (a light's favourite colours, a timer's presets): grey with
     the option's name, or the colour itself ringed to show on white; many of them wrap */
  .ctl-buttons.options { flex: 0 1 auto; flex-wrap: wrap; min-width: 0; }
  .end > .ctl-buttons.options, .val > .ctl-buttons.options { justify-content: flex-end; }
  .ctl-buttons.options > button { flex: none; width: 32px; height: 32px; border: 0; padding: 0; border-radius: 50%; background: var(--fe-track); color: var(--primary-text-color); cursor: pointer; font: inherit; }
  .ctl-buttons.options > button.chip { width: auto; padding: 0 12px; border-radius: 999px; font-size: ${fs(13)}; font-weight: ${fw("medium")}; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .ctl-buttons.options > button.swatch { background: var(--swatch); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--divider-color, var(--primary-text-color)) 60%, transparent); }
  .ctl-buttons.options > button.pending { animation: ctl-pulse 1s ease-in-out infinite; }
  /* the poster's and the tile's controls (square): rounded squares, all as tall as a segments
     control (36 px), as Home Assistant's tile features; the entity cards' keep their look of before */
  .ctl-buttons.square > button { border-radius: 10px; }
  /* (4 px apart: three of them fit under a tile's line at half a phone's width) */
  .ctl-buttons.square:not(.sm) { gap: 4px; }
  .ctl-buttons.square:not(.sm) > button { width: 36px; height: 36px; }
  .ctl-buttons.square.sm > button { border-radius: 8px; }
  .ctl-buttons.square > button.chip { border-radius: 10px; }
  .ctl-buttons.square:not(.sm) > button.chip { width: auto; }
  .ctl-buttons.square.sm > button.chip { border-radius: 8px; }
  /* a stepper is one bar: minus, the value and plus in it, the value 4 px clear of each (minus and
     plus 30 px wide, so the bar fits under a tile's line at half a phone's width; 28 px in a
     table) */
  .ctl-stepper.square { gap: 0; border-radius: 10px; background: var(--fe-track); }
  .ctl-stepper.square .round { background: transparent; }
  .ctl-stepper.square:not(.sm) { height: 36px; }
  .ctl-stepper.square:not(.sm) .round { width: 30px; height: 36px; border-radius: 10px; }
  .ctl-stepper.square .val { padding: 0 4px; }
  .ctl-stepper.square.sm { height: 28px; border-radius: 8px; }
  .ctl-stepper.square.sm .round { border-radius: 8px; }
  /* segments without the inset: the chosen one fills the bar's height, every option 2 px wider
     on each side for the inset and the gaps it gave up (the bar as wide as before for two options,
     2 px wider for every one more: never narrower, so a tile's fit keeps them where they were); none
     narrower than the bar is high, so where the bar has no room it scrolls rather than squeezing a
     digit out of its option */
  .ctl-segments.square { padding: 0; gap: 0; border-radius: 10px; }
  .ctl-segments.square .seg { height: 36px; min-width: 36px; padding: 0 12px; border-radius: 10px; }
  .ctl-segments.square.sm { border-radius: 8px; }
  .ctl-segments.square.sm .seg { height: 28px; min-width: 28px; padding: 0 10px; border-radius: 8px; }
  .ctl-select.square { border-radius: 10px; }
  .ctl-select.square:not(.sm) { height: 36px; padding: 0 6px 0 12px; }
  .ctl-select.square:not(.sm) select { height: 36px; line-height: 36px; font-size: ${fs(13)}; }
  .ctl-chip.square { border-radius: 10px; }
  .ctl-chip.square:not(.sm) { height: 36px; }
  .ctl-chip.square.sm { border-radius: 8px; }
  .ctl-hold.square { border-radius: 10px; }
  .ctl-hold.square.sm { border-radius: 8px; }
  /* a square hold fills from the left: a ring is round */
  .ctl-hold.square { --fill: color-mix(in srgb, var(--fe-color) 45%, transparent); background-image: linear-gradient(var(--fill), var(--fill)); background-repeat: no-repeat; background-size: 0 100%; }
  .ctl-hold.square:is(.armed, .holding) { background-size: 100% 100%; }
  .ctl-hold.square.holding { transition: background-size 1s linear; }
  .ctl-buttons.custom > .chip { flex: 0 1 auto; display: inline-flex; align-items: center; gap: 6px; min-width: 0; max-width: 100%; height: 32px; padding: 0 14px 0 10px; border: 0; border-radius: 999px; font-size: ${fs(13)}; font-weight: ${fw("medium")}; white-space: nowrap; cursor: pointer; --mdc-icon-size: 18px; }
  .ctl-buttons.custom > .chip span { overflow: hidden; text-overflow: ellipsis; }
  /* the colour stays on the icon and the tint; the label reads in the text colour until filled */
  .ctl-buttons.custom > .chip:not(.on) span { color: var(--primary-text-color); }
  .ctl-buttons.custom.sm > .chip { height: 28px; font-size: ${fs(12)}; padding: 0 12px 0 8px; --mdc-icon-size: 16px; }
  /* a chip or a square button to hold fills from the left instead of a ring */
  :is(.ctl-buttons.custom > .chip, .ctl-buttons.square > button).hold { --fill: var(--fe-color); background-image: linear-gradient(var(--fill), var(--fill)); background-repeat: no-repeat; background-size: 0 100%; touch-action: none; -webkit-user-select: none; user-select: none; }
  :is(.ctl-buttons.custom > .chip, .ctl-buttons.square > button).hold.on { --fill: color-mix(in srgb, var(--fe-color) 45%, ${CARD_BG}); }
  :is(.ctl-buttons.custom > .chip, .ctl-buttons.square > button).hold.armed { background-size: 100% 100%; --fill: color-mix(in srgb, var(--fe-color) 45%, transparent); }
  :is(.ctl-buttons.custom > .chip, .ctl-buttons.square > button).hold.holding { background-size: 100% 100%; transition: background-size 1s linear; }
  .ctl-stepper { display: flex; align-items: center; gap: 4px; flex: none; }
  .ctl-stepper .val { min-width: 48px; text-align: center; ${type(14, 20)} font-weight: ${fw("medium")}; color: var(--primary-text-color); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .ctl-stepper.sm .val { min-width: 40px; font-size: ${fs(13)}; }
  .ctl-stepper.pending .val { color: var(--fe-color); }
  /* a thermostat holding a range: a stepper for each target side by side (square: a bar each) */
  .ctl-stepper.range { gap: 8px; }
  .ctl-stepper .half { display: flex; align-items: center; gap: 4px; }
  .ctl-stepper.range.square { background: none; }
  .ctl-stepper.range.square .half { gap: 0; height: 100%; border-radius: inherit; background: var(--fe-track); }
  .ctl-segments { display: flex; padding: 3px; gap: 2px; border-radius: 999px; background: var(--fe-track); flex: none; max-width: 100%; box-sizing: border-box; }
  .ctl-segments .seg { flex: 0 1 auto; min-width: 26px; height: 30px; border: 0; padding: 0 10px; border-radius: 999px; background: transparent; color: var(--secondary-text-color); display: flex; align-items: center; justify-content: center; gap: 4px; font-size: ${fs(12)}; font-weight: ${fw("medium")}; white-space: nowrap; cursor: pointer; overflow: hidden; --mdc-icon-size: 18px; }
  /* in the block slot the segments share the width */
  .row > .ctl-segments, .main > .ctl-segments, .cell > .ctl-segments, .pbody > .ctl-segments { align-self: stretch; }
  .row > .ctl-segments .seg, .main > .ctl-segments .seg, .cell > .ctl-segments .seg, .pbody > .ctl-segments .seg { flex: 1 1 0; min-width: 0; }
  .ctl-segments .seg span { overflow: hidden; text-overflow: ellipsis; }
  .ctl-segments .seg.on { background: var(--fe-soft); color: var(--fe-color); }
  .ctl-segments .seg.pending { box-shadow: inset 0 0 0 1px var(--fe-color); animation: ctl-pulse 1s ease-in-out infinite; }
  .ctl-segments.sm .seg { height: 24px; padding: 0 8px; --mdc-icon-size: 16px; }
  .ctl-select { position: relative; display: inline-flex; align-items: center; height: 28px; border-radius: 999px; background: var(--fe-track); padding: 0 4px 0 12px; max-width: 100%; box-sizing: border-box; flex: 0 1 auto; min-width: 0; }
  .ctl-select select { appearance: none; -webkit-appearance: none; border: 0; background: transparent; color: var(--primary-text-color); font: inherit; font-size: ${fs(12)}; font-weight: ${fw("medium")}; line-height: 28px; height: 28px; padding: 0 22px 0 0; cursor: pointer; min-width: 0; max-width: 100%; outline: none; text-overflow: ellipsis; }
  .ctl-select ha-icon { position: absolute; right: 4px; pointer-events: none; color: var(--secondary-text-color); --mdc-icon-size: 18px; }
  .ctl-select.pending select { color: var(--fe-color); }
  .ctl-chip { flex: none; display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 14px 0 10px; border: 0; border-radius: 999px; background: var(--fe-soft); color: var(--fe-color); font-size: ${fs(13)}; font-weight: ${fw("medium")}; white-space: nowrap; cursor: pointer; --mdc-icon-size: 18px; }
  .ctl-chip.sm { height: 28px; font-size: ${fs(12)}; padding: 0 12px 0 8px; }
  .ctl-chip.done { background: var(--fe-color); color: var(--text-primary-color, #fff); }
  .ctl-chip > span { display: inline-flex; flex-direction: column; }
  .ctl-chip > span::after { content: attr(data-alt); height: 0; overflow: hidden; visibility: hidden; }
  .ctl-chip.round { width: var(--lead, 36px); height: var(--lead, 36px); padding: 0; justify-content: center; border-radius: 50%; --mdc-icon-size: ${LEAD_ICON}; }
  .ctl-hold { position: relative; flex: none; width: 36px; height: 36px; border: 0; padding: 0; border-radius: 50%; background: var(--fe-soft); color: var(--fe-color); display: flex; align-items: center; justify-content: center; cursor: pointer; --mdc-icon-size: 20px; touch-action: none; -webkit-user-select: none; user-select: none; }
  .ctl-hold.sm { width: 30px; height: 30px; --mdc-icon-size: 18px; }
  .ctl-hold.lead-size { width: var(--lead, 36px); height: var(--lead, 36px); --mdc-icon-size: ${LEAD_ICON}; }
  .ctl-hold.pending { animation: ctl-pulse 1s ease-in-out infinite; }
  /* the ring of a held button: the hold control, or every button of a confirmed group */
  .ctl .round.hold { touch-action: none; -webkit-user-select: none; user-select: none; }
  .ctl .ring { position: absolute; inset: -4px; width: calc(100% + 8px); height: calc(100% + 8px); overflow: visible; pointer-events: none; }
  .ctl .ring .prog { fill: none; stroke: var(--fe-color); stroke-width: 2.5; stroke-linecap: round; stroke-dashoffset: var(--c); transition: none; }
  .ctl .holding .ring .prog, .ctl.holding .ring .prog { stroke-dashoffset: 0; transition: stroke-dashoffset 1s linear; }
  .ctl .armed, .ctl.armed { box-shadow: 0 0 0 2px var(--fe-soft); }
  .ctl .armed .ring .prog, .ctl.armed .ring .prog { stroke-dashoffset: 0; opacity: .45; }
  /* a kind card's controls (square): at rest grey with the text colour; what is on or chosen
     filled in its colour with a white icon, or tinted (variant: tinted: its colour at 20 %, the
     icon in its colour). The switch is a button with the power icon (a badge's round, sized to its
     pill); the button (Run) has no on, so it rests filled or tinted */
  .toggle.square { width: 36px; height: 36px; border-radius: 10px; background: var(--fe-track); color: var(--primary-text-color); display: flex; align-items: center; justify-content: center; --mdc-icon-size: 20px; transition: background-color .2s, color .2s; }
  .toggle.square.sm { width: 28px; height: 28px; border-radius: 8px; --mdc-icon-size: 16px; }
  .row.hval.pb > .toggle.square { width: var(--b-th); height: var(--b-th); border-radius: 50%; }
  /* (its icon sized on the icon: a badge's icons carry a size of their own) */
  .row.hval.b-s > .toggle.square > ha-icon { --mdc-icon-size: 10px; }
  .row.hval.b-m > .toggle.square > ha-icon { --mdc-icon-size: 14px; }
  .row.hval.b-l > .toggle.square > ha-icon { --mdc-icon-size: 16px; }
  /* a tap area of at least 24 px round a small one, as the icon's own */
  .row.hval.pb > .toggle.square::before { content: ""; position: absolute; inset: min(0px, calc((var(--b-th) - 24px) / 2)); border-radius: 50%; }
  /* (its icon in the button's colour, not the pill's) */
  .row.hval.pb > .toggle.square > ha-icon { color: inherit; }
  .toggle.square.pending { animation: ctl-pulse 1s ease-in-out infinite; }
  .toggle.square.pending:not(.on) { background: var(--fe-track); }
  .ctl-buttons.custom.flat > button, .ctl-hold.square { background-color: var(--fe-track); color: var(--primary-text-color); }
  .ctl-segments.square .seg { color: var(--primary-text-color); }
  .toggle.square.on, .ctl-buttons.custom.flat > button.on, .ctl-buttons.square > .round.f, .ctl-segments.square .seg.on, .ctl-chip.square:not(.round), .ctl-chip.square.done { background-color: var(--fe-color); color: var(--text-primary-color, #fff); }
  .toggle.square.tinted.on, .ctl-buttons.custom.flat.tinted > button.on, .ctl-buttons.square.tinted > .round.f, .ctl-segments.square.tinted .seg.on, .ctl-chip.square.tinted:not(.round, .done) { background-color: color-mix(in srgb, var(--fe-color) 20%, transparent); color: var(--fe-color); }
  /* a badge's switch in a filled pill (the colour already): the pill's ink, the icon in the colour */
  .row.hval.b-filled > .toggle.square.on { background-color: var(--b-ink); color: var(--fe-color); }
  @keyframes ctl-pulse { 50% { opacity: .45; } }
  @media (prefers-reduced-motion: reduce) { .ctl, .ctl *, .toggle, .toggle i, .lead.tap .shape { animation: none !important; transition: none !important; } }
`;
export const STYLE_GROUP = `
  /* vertical_align: in a card taller than its content the body takes the room under the header
     (its own height as the basis) and puts its sections at the centre or the bottom */
  ha-card:is(.valign-center, .valign-bottom) > .body { flex: 1 1 auto; }
  ha-card.valign-center > .body { justify-content: center; }
  ha-card.valign-bottom > .body { justify-content: flex-end; }
  .section { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
  .section.layout-row { flex-direction: row; flex-wrap: wrap; gap: 12px 16px; align-items: flex-start; }
  .section.layout-row.align-start { justify-content: flex-start; }
  .section.layout-row.align-center { justify-content: center; }
  .section.layout-row.align-end { justify-content: flex-end; }
  .section.layout-row.align-space-between { justify-content: space-between; }
  .section.layout-row.align-stretch .item { flex: 1 1 0; }
  .section.layout-column { gap: 10px; }
  .section.layout-column.align-start { align-items: flex-start; }
  .section.layout-column.align-center { align-items: center; }
  .section.layout-column.align-end, .section.layout-column.align-space-between, .section.layout-column.align-stretch { align-items: flex-end; }
`;
export const STYLE_CELL = `
  .grid { display: grid; gap: 10px; grid-template-columns: repeat(var(--cols, 2), minmax(0, 1fr)); }
  .cell { padding: 12px; background: color-mix(in srgb, var(--primary-text-color) 5%, transparent); border-radius: 10px; gap: 6px; min-width: 0; overflow: hidden; }
  .cell .big b { ${type(22, 26)} letter-spacing: -.3px; }
  .cell .big.fit b { font-size: var(--fit, 22px); }
  .cell .lead { margin-bottom: 2px; }
  .cell > .hit:focus-visible { box-shadow: inset 0 0 0 2px var(--fe-color); }
  .cell .gtop { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 0; margin-bottom: 2px; }
  .cell .gtop .lead { margin-bottom: 0; }
  .cell .gtop .end { max-width: none; }
  /* a ring or a gauge is the cell's picture: the cell centres it, with its name and label, also
     in a cell stretched by a taller one beside it */
  .cell:has(> .lead.ring, > .gauge) { align-items: center; justify-content: center; text-align: center; }
  /* centred, a line still ends in an ellipsis and controls shrink or scroll at the cell's edge */
  .cell:has(> .lead.ring, > .gauge) > :is(.secondary, .end, .ctl-buttons) { max-width: 100%; }
  /* a gauge's icon (or the control in its place) stays in the corner, alone or with the small
     controls across the top */
  .cell:has(> .gauge) > :is(.lead, .ctl-chip.round, .ctl-hold.lead-size) { align-self: flex-start; }
  .cell:has(> .gauge) > .gtop { align-self: stretch; }
  /* the icon keeps the top: the gauge and what follows it centre in the room below */
  .cell > .gauge { margin-top: auto; }
  .cell:has(> .gauge) > :last-child { margin-bottom: auto; }
`;
export const STYLE_ITEM = `
  .row.item { flex-direction: column; align-items: center; gap: 4px; max-width: 100%; text-align: center; }
  .item .iname { ${type(13, 18)} font-weight: ${fw("medium")}; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  /* the value stacks under the name as a plain line; one that does not fit clips with an ellipsis */
  .item .state { ${type(12, 16)} font-weight: ${fw("normal")}; color: var(--secondary-text-color); overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .item .state.lone { ${type(13, 18)} font-weight: ${fw("medium")}; color: var(--primary-text-color); }
  .item .state.accent, .item .state.lone.accent { color: var(--fe-color); font-weight: ${fw("medium")}; }
  .item .pill { max-width: 100%; }
  /* a column item is list-like: the icon on the left, the name over the value on the right (name_position is ignored) */
  .section.layout-column .row.item { display: grid; grid-template-columns: auto minmax(0, 1fr); column-gap: 10px; row-gap: 2px; align-items: center; justify-items: start; text-align: left; }
  .section.layout-column .item .lead { grid-column: 1; grid-row: 1 / span 2; }
  .section.layout-column .item .iname { grid-column: 2; grid-row: 1; align-self: end; }
  .section.layout-column .item .state, .section.layout-column .item .pill { grid-column: 2; grid-row: 2; align-self: start; }
  .section.layout-column .item .lone { grid-row: 1 / span 2; align-self: center; }
  .section.layout-column .row.item:not(:has(> .lead)) { grid-template-columns: minmax(0, 1fr); }
  .section.layout-column .row.item:not(:has(> .lead)) > * { grid-column: 1; }
  /* a column item's control sits on the right, spanning both lines */
  .section.layout-column .row.item:has(> .end) { grid-template-columns: auto minmax(0, 1fr) auto; }
  .section.layout-column .row.item:not(:has(> .lead)):has(> .end) { grid-template-columns: minmax(0, 1fr) auto; }
  .section.layout-column .row.item > .end { grid-column: -2 / -1; grid-row: 1 / span 2; align-self: center; max-width: none; }
  /* an item with a control spans the column, so the controls line up on the right */
  .section.layout-column .row.item:has(> .end) { align-self: stretch; }
  /* in a narrow column a wide control goes under the name instead of squeezing it away */
  .section.layout-column { container-type: inline-size; }
  @container (max-width: 300px) {
    .section.layout-column .row.item:has(> .end > :is(.ctl-buttons, .ctl-stepper, .ctl-segments, .ctl-select, .ctl-slider)) { grid-template-columns: auto minmax(0, 1fr); }
    .section.layout-column .row.item:not(:has(> .lead)):has(> .end > :is(.ctl-buttons, .ctl-stepper, .ctl-segments, .ctl-select, .ctl-slider)) { grid-template-columns: minmax(0, 1fr); }
    .section.layout-column .row.item > .end:has(> :is(.ctl-buttons, .ctl-stepper, .ctl-segments, .ctl-select, .ctl-slider)) { grid-column: -2 / -1; grid-row: 3; justify-self: start; }
  }
  .item .ctl-chip.round, .item .ctl-hold.lead-size { margin: 0 auto; }
  .item > .hit:focus-visible { box-shadow: none; }
  .item > .hit:focus-visible ~ .lead .shape { box-shadow: 0 0 0 2px var(--fe-color); }
`;
export const STYLE_TABLE = `
  .section.layout-table { gap: 8px; }
  .row.field { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 12px; }
  .section.with-icon .row.field { grid-template-columns: auto minmax(0, 1fr) auto; }
  .field .key { ${type(11, 16)} letter-spacing: .08em; text-transform: uppercase; font-weight: ${fw("medium")}; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .field .val { display: flex; align-items: center; gap: 8px; min-width: 0; max-width: 100%; justify-self: end; }
  .field .val .state { font-weight: 600; }
  .field .val:empty { display: none; }
  .section.layout-table.align-start .row.field { grid-template-columns: fit-content(60%) minmax(0, 1fr); }
  .section.layout-table.align-start.with-icon .row.field { grid-template-columns: auto fit-content(60%) minmax(0, 1fr); }
  .section.layout-table.align-start .field .val { justify-self: start; }
  .section.layout-table.align-center .row.field { grid-template-columns: minmax(0, 1fr) fit-content(50%) minmax(0, 1fr); }
  .section.layout-table.align-center.with-icon .row.field { grid-template-columns: auto minmax(0, 1fr) fit-content(50%) minmax(0, 1fr); }
`;
export const STYLE_BLOCKS = `
  .bar { height: 8px; border-radius: 4px; background: color-mix(in srgb, var(--primary-text-color) 8%, transparent); overflow: hidden; }
  .bar i { display: block; height: 100%; border-radius: 4px; background: var(--fe-color); transition: width .4s; }
  .gauge { position: relative; width: 100%; max-width: 170px; }
  .gauge svg { display: block; width: 100%; height: auto; overflow: visible; }
  .gauge .track { fill: none; stroke: color-mix(in srgb, var(--primary-text-color) 9%, transparent); stroke-linecap: round; }
  .gauge .prog { fill: none; stroke: var(--fe-color); stroke-linecap: round; transition: stroke-dashoffset .4s; }
  .gauge .val { font: ${fw("medium")} 17px ${FONT_FAMILY}; fill: var(--primary-text-color); font-variant-numeric: tabular-nums; }
  .gauge .sub { font: 10px ${FONT_FAMILY}; fill: var(--secondary-text-color); }
`;
export const STYLE_PLOT = `
  .plot { position: relative; width: 100%; min-width: 0; touch-action: pan-y; }
  /* a card taller than its content (fixed rows, a stretched grid row, a stack): the sparkline and
     columns plots take the room, their own height as the basis, down to a floor; the containers
     that hold one pass it on (a section by its number of plots, --grow), the rest keeps its size */
  :is(.body, .wsec, .section, .row, .top):has(.plot.grow) { flex: var(--grow, 1) 1 auto; min-height: 0; }
  /* a list row's plot sits beside the lead: the lead stays up by its name */
  .top:has(> .main > .plot.grow) { align-items: flex-start; }
  .top:has(> .main > .plot.grow) > .main { align-self: stretch; }
  .plot.grow { flex: 1 1 auto; min-height: 24px; }
  svg.abs { position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: visible; }
  .plot .line { fill: none; stroke: var(--fe-color); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
  .plot .area { fill: var(--fe-color); opacity: .12; }
  .plot .dot { fill: var(--fe-color); stroke: ${CARD_BG}; stroke-width: 2; }
  .plot .hair { stroke: var(--secondary-text-color); stroke-width: 1; opacity: .6; }
  .plot .col { fill: var(--fe-color); }
  .plot .hl { fill: none; stroke: var(--primary-text-color); stroke-width: 1.5; }
  /* axis: true: faint lines at the scale's top and bottom, their values and the window's ends in
     the plot's corners */
  .plot .grid { stroke: var(--divider-color); stroke-width: 1; stroke-dasharray: 2 3; vector-effect: non-scaling-stroke; }
  .label { position: absolute; ${font(10, 12)} color: var(--secondary-text-color); white-space: nowrap; pointer-events: none; font-variant-numeric: tabular-nums; }
  .label.right { transform: translateX(-100%); }
  ${tipStyle()}
  .tip .time { color: var(--secondary-text-color); }
  .tip b { font-weight: 600; font-variant-numeric: tabular-nums; }
  .tip .lbl { color: var(--secondary-text-color); }
`;

// `hover` (on the card, a group or an entity; the row's `hover-fx` class): Home Assistant's state
// layers on what a click runs. A tile, a grid cell or a header entity with an action gets the tile's
// layer in its colour (4 % on hover, 12 % pressed), an icon with its own action the tile icon's (its
// circle from --tile-icon-opacity to --tile-icon-hover-opacity, 20 to 35 % by default; a press
// grows it), the controls Home Assistant's control buttons'. Hover only for a pointer that hovers,
// so a tap leaves nothing behind on a phone. Over a control the row's `.hit` is not hovered: the
// layer shows only where a click runs the row's action.
// Home Assistant's control button layer on the buttons `sel` matches: a layer in the button's text
// colour over its own fill, under its icon and label, so a filled button lightens and a soft one
// deepens; 8 % on hover (only for a pointer that hovers), 12 % pressed, fading in 180 ms (at once
// with reduced motion). The controls take it with `hover`, the energy card's period picker always.
export const controlLayer = (sel: string) => `
  ${sel} { position: relative; isolation: isolate; }
  ${sel}::after { content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit; background: currentColor; opacity: 0; pointer-events: none; transition: opacity 180ms ease-in-out; }
  @media (hover: hover) { ${sel}:not(:disabled):hover::after { opacity: .08; } }
  ${sel}:not(:disabled):active::after { opacity: .12; }
  @media (prefers-reduced-motion: reduce) { ${sel}::after { transition: none; } }
`;
export const STYLE_HOVER = `
  /* only what reads as one button takes the layer: a tile, a grid cell, a header entity. List rows,
     heroes, table fields and the power flow's list rows keep still; an item or a power flow node is
     its icon: the icon answers, as it shows the focus ring */
  /* Home Assistant's ripple (src/shared/ripple.ts: RIPPLE_TARGETS): a layer while hovered, a press
     growing from where it starts; the card in its colour (4 %, 12 %), a control button in the
     secondary text colour (8 %, 12 %), as Home Assistant's tile and control buttons */
  .ripple { position: absolute; inset: 0; border-radius: inherit; overflow: hidden; pointer-events: none; }
  .ripple > span { position: absolute; opacity: 0; }
  .ripple > .rhover { inset: 0; background: var(--ripple-color); transition: opacity 15ms linear, background-color 15ms linear; }
  .ripple.hovered > .rhover { opacity: var(--ripple-hover, .08); }
  .ripple > .rpress { top: 0; left: 0; transform-origin: center center; background: radial-gradient(closest-side, var(--ripple-color) max(100% - 70px, 65%), transparent 100%); transition-property: opacity, transform; transition-duration: 375ms, 450ms; transition-timing-function: linear, cubic-bezier(0.2, 0, 0, 1); }
  .ripple.pressed > .rpress { opacity: var(--ripple-pressed, .12); transition-duration: 105ms, 450ms; }
  .row.hover-fx > .hit { --ripple-color: var(--fe-color); --ripple-hover: .04; --ripple-pressed: .12; }
  .row.hover-fx :is(.ctl-stepper, .ctl-buttons) button, .row.hover-fx button.ctl-chip { position: relative; isolation: isolate; --ripple-color: var(--secondary-text-color); --ripple-hover: .08; --ripple-pressed: .12; }
  .row.hover-fx :is(.ctl-stepper, .ctl-buttons) button > .ripple, .row.hover-fx button.ctl-chip > .ripple { z-index: -1; }
  /* an icon with its own action is hit 6 px around its circle too, as Home Assistant's tile icon */
  .lead.tap::before, .ctl-hold.lead-size::before { content: ""; position: absolute; inset: -6px; border-radius: 50%; }
  .row.hover-fx .lead.tap .shape, .row.hover-fx:is(.item, .pnode) > .hit ~ .lead .shape { transition: background-color 180ms ease-in-out, transform 180ms ease-in-out; }
  @media (hover: hover) {
    /* as Home Assistant's tile icon: the hover opacity takes the place of the icon's, so every
       background drawn with iconBg follows (an off toggle's fainter one, a node's on the card) */
    .row.hover-fx .lead.tap:not(.disabled):hover, .row.hover-fx:is(.item, .pnode) > .hit:hover ~ .lead { --tile-icon-opacity: var(--tile-icon-hover-opacity, 0.35); }
  }
  /* the controls Home Assistant draws without a ripple: the segments, the switch, the select and a
     hold take a light layer (controlLayer); the switch and the select in the text colour: the
     layer's :is() counts as its most specific argument (a class and an element), so this one
     matches its shape to win by order */
  ${controlLayer(".row.hover-fx :is(.ctl-segments button, button.ctl-hold, button.toggle, .ctl-select)")}
  .row.hover-fx :is(button.toggle, div.ctl-select)::after { background: var(--primary-text-color); }
  .row.hover-fx .ctl-slider .knob { transition: box-shadow 180ms ease-in-out; }
  @media (hover: hover) {
    /* the slider: a halo around the knob, lighter than the one while dragging */
    .row.hover-fx .ctl-slider:not(.dragging, .pending):hover .knob { box-shadow: var(--knob-shadow), 0 0 0 6px color-mix(in srgb, var(--fe-color) 12%, transparent); }
    .row.hover-fx .ctl-slider.grad.thick:not(.dragging, .pending):hover .knob { box-shadow: 0 0 2px rgba(0,0,0,.35), inset 0 0 2px rgba(0,0,0,.35); }
  }
  .row.hover-fx .lead.tap:not(.disabled):active .shape { transform: scale(1.2); }
  /* reduced motion: no growing and no fades; each selector repeats the one it overrides */
  @media (prefers-reduced-motion: reduce) {
    .ripple > .rpress { transition-property: opacity; }
    .row.hover-fx .lead.tap:not(.disabled):active .shape { transform: none; }
    .row.hover-fx .lead.tap .shape, .row.hover-fx:is(.item, .pnode) > .hit ~ .lead .shape { transition: none; }
    .row.hover-fx .ctl-slider .knob { transition: none; }
  }
`;

export const STYLE_ENTITY_CARD =
  STYLE_BASE +
  STYLE_TILE +
  STYLE_HVAL +
  STYLE_ROW +
  STYLE_CONTROLS +
  STYLE_POSTER +
  STYLE_BLOCKS +
  STYLE_PLOT +
  STYLE_HOVER;
export const STYLE_GROUP_CARD =
  STYLE_BASE +
  STYLE_HEADER +
  STYLE_ROW +
  STYLE_CONTROLS +
  STYLE_GROUP +
  STYLE_CELL +
  STYLE_ITEM +
  STYLE_TABLE +
  STYLE_BLOCKS +
  STYLE_PLOT +
  STYLE_HOVER;
