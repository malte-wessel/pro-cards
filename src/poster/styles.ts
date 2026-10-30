// CSS of the poster card on top of the entity layer's poster: the backdrop behind the whole card
// (an image, or what a kind draws there) under a scrim that keeps the texts readable, the glow,
// and the status badge, which takes no room while it has nothing to say.
import { CARD_BG, iconBg } from "../shared/constants.ts";
import { STYLE_ENTITY_CARD } from "../shared/entity/render/styles.ts";
import { STYLE_FLOW, STYLE_FLOW_MOTION } from "../shared/flow/styles.ts";
import { STYLE_KINDS } from "../shared/kinds/styles.ts";
import { STYLE_RAIN } from "../shared/rain/styles.ts";
import { STYLE_SUN_CURVE } from "../shared/sun/styles.ts";
import { STYLE_TREND } from "../shared/trend/styles.ts";
import { fs, lh, type } from "../shared/typography.ts";
import { STYLE_WEATHER_PICTURES } from "../shared/weather/styles.ts";
import { STYLE_WIND } from "../shared/wind/styles.ts";

const STYLE_POSTER_CARD = `
  /* the card is its own stacking context: the backdrop sits on its background, under the poster's
     action layer (.hit, z-index -1) and the content */
  ha-card.layout-poster { isolation: isolate; container: pcard / inline-size; }
  /* the poster's colour (PosterCard._rowColor) fades to a new one */
  ha-card.layout-poster > .body { transition: --pc-tint .8s ease; }
  @media (prefers-reduced-motion: reduce) { ha-card.layout-poster > .body { transition: none; } }
  .pback { position: absolute; inset: 0; z-index: -2; pointer-events: none; overflow: hidden; border-radius: inherit; }
  .pback[hidden] { display: none; }
  .pback > img { width: 100%; height: 100%; object-fit: cover; display: block; }
  /* a new picture fades in over the one before (updateBackdrop) */
  .pback > img.pin { position: absolute; inset: 0; opacity: 0; transition: opacity .7s ease; }
  .pback > img.pin.on { opacity: 1; }
  /* the icon's new picture (the next song's cover) fades in once it has loaded */
  .plead img.picture.pwait { opacity: 0; }
  .plead img.picture.pfade { animation: pfade .7s ease both; }
  @keyframes pfade { from { opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .pback > img.pin, .plead img.picture.pfade { transition: none; animation: none; } }
  /* image_blur: drawn larger by twice the blur on every side, so the blur's soft edge (where it
     fades into nothing) lies outside the card, also while a new picture fades in over the last */
  .pback.blur > img { position: absolute; left: calc(var(--pblur) * -2); top: calc(var(--pblur) * -2); width: calc(100% + var(--pblur) * 4); height: calc(100% + var(--pblur) * 4); filter: blur(var(--pblur)); }
  /* the scrim: the card's own surface evenly over the whole picture, so the theme's text reads on
     any picture; as strong as the picture does not show (image_opacity), a tint (image_tint) mixed
     into the surface (PosterCard._render). A new strength or tint fades */
  .pback { transition: --pc-shade .6s ease, --pc-shade-color .6s ease; }
  @media (prefers-reduced-motion: reduce) { .pback { transition: none; } }
  .pback.scrim::after { content: ""; position: absolute; inset: 0; background: color-mix(in srgb, var(--pc-shade-color, ${CARD_BG}) calc(var(--pc-shade, .7) * 100%), transparent); }
  /* over a picture the status badge is filled with the poster's colour, so it reads on any picture */
  ha-card:has(> .body > .pback.scrim) .row.poster > .ptop > .corner > .row.hval.b-tag { --b-ink: var(--text-primary-color, #fff); background: var(--fe-color); border-color: transparent; }
  ha-card:has(> .body > .pback.scrim) .row.poster > .ptop > .corner > .row.hval.b-tag :is(ha-icon, ha-state-icon, .state, .state.accent, .secondary) { color: var(--b-ink); }
  /* visual: glow: the poster's colour from the bottom of the card, as strong as its level (its
     opacity, set by the card: a new level fades as switching does); nothing at 0. The last part
     of the backdrop: over a kind's drawing, under an image's scrim */
  .pglow { position: absolute; inset: 0; background: radial-gradient(120% 90% at 50% 105%, color-mix(in srgb, var(--glow) 60%, transparent) 0%, transparent 72%); opacity: 0; transition: opacity .6s; }
  .row.hval.pstatus.empty { display: none; }
  /* the corner floats over the poster's top right, so the badges take no height from the name,
     the value and the picture (the top line is as tall as the lead); many badges reach down over
     the picture's right. Controls on the value's line keep their room: there the corner stops
     above them */
  ha-card.layout-poster .row.poster { position: static; }
  ha-card.layout-poster .row.poster > .ptop > .corner { position: absolute; z-index: 2; top: 16px; right: 16px; max-width: calc(100% - 88px); }
  ha-card.layout-poster .row.poster:has(> .pbody > .pmain > .end) > .ptop > .corner { max-height: calc(100% - 96px); overflow: hidden; }

  /* a kind's field as the backdrop (wind, rain): the band fills the card; the lead keeps a solid
     circle over it */
  .pback > .wflow.bg { position: absolute; inset: 0; border-radius: 0; }
  ha-card.pflow .plead .lead .shape { background: ${iconBg("var(--fe-color)", CARD_BG)}; }
  ha-card.pflow .plead .lead.plain .shape { background: transparent; }

  /* a kind's curve along the bottom (the sun's day, a trend's lines): it takes the room the texts
     leave, out to the card's edges, a small gap below them; the texts stay on top and let the
     pointer through to it */
  .pbody:has(> .pcurve) { flex: 1 1 auto; min-height: 0; }
  .pbody:has(> .pcurve) > :not(.pcurve) { position: relative; z-index: 1; pointer-events: none; }
  .pbody:has(> .pcurve) .big { --pnum: ${fs(28)}; --plh: ${lh(28, 31)}; }
  .pbody:has(> .pcurve) .big b { ${type(28, 31)} }
  .pbody > .pcurve { position: relative; flex: 1 1 auto; min-height: 40px; min-width: 0; margin: 6px -16px -16px; touch-action: pan-y; }
  /* the sun's day starts behind the time above it by the headroom its arc keeps over a low sun's
     peak (--psun-lift, the sun kind), so no band of nothing is left under the texts */
  .pbody > .pcurve.psun { margin-top: calc(6px - var(--psun-lift, 0px)); }
  /* a sparkline keeps a small gap below the value instead of reaching up under it */
  ha-card.layout-poster .pbody > .pmain:not(:has(> .ptext > .secondary)) + .plot.grow[data-kind="sparkline"] { margin-top: 6px; }
  .row.actionable .pcurve { pointer-events: auto; }
  /* the value drawn smaller where it is too wide for its line or the card too short for it
     (PosterCard._fitValue): the value and its line shrink together */
  ha-card.layout-poster .row.poster .big.hfit { --pnum: var(--hfit); --plh: calc(var(--hfit) * 1.1); }
  ha-card.layout-poster .row.poster .big.hfit b { font-size: var(--hfit); line-height: calc(var(--hfit) * 1.1); }
  ha-card.layout-poster .row.poster .pbody > .ctl-slider.pfit-out { display: none; }
  /* a picture's tooltip opens upward from its bottom, over the texts: the picture is the poster's
     bottom strip, and a tooltip opening downward would be cut by the card's edge */
  ha-card.layout-poster .pbody > :is(.pcurve, .plot) > .tip { top: auto; bottom: 8px; z-index: 3; }
  /* its lines are rows of their own (a colour key, the value, the name): not the poster's entity
     rows, which stack their parts */
  ha-card.layout-poster .tip .row { flex-direction: row; align-items: center; gap: 6px; border-radius: 0; }
`;

export const STYLE_POSTER_CARD_ALL =
  STYLE_ENTITY_CARD +
  STYLE_FLOW +
  STYLE_WIND +
  STYLE_RAIN +
  STYLE_WEATHER_PICTURES +
  STYLE_SUN_CURVE +
  STYLE_TREND +
  STYLE_KINDS +
  STYLE_POSTER_CARD +
  STYLE_FLOW_MOTION;
