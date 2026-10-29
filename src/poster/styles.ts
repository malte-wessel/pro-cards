// CSS of the poster card on top of the entity layer's poster: the backdrop behind the whole card
// (an image, or what a kind draws there) under a scrim that keeps the texts readable, and the
// status badge, which takes no room while it has nothing to say.
import { CARD_BG, iconBg } from "../shared/constants.ts";
import { STYLE_ENTITY_CARD } from "../shared/entity/render/styles.ts";
import { STYLE_FLOW, STYLE_FLOW_MOTION } from "../shared/flow/styles.ts";
import { STYLE_KINDS } from "../shared/kinds/styles.ts";
import { STYLE_RAIN } from "../shared/rain/styles.ts";
import { STYLE_SUN_CURVE } from "../shared/sun/styles.ts";
import { STYLE_TREND } from "../shared/trend/styles.ts";
import { type } from "../shared/typography.ts";
import { STYLE_WEATHER_PICTURES } from "../shared/weather/styles.ts";
import { STYLE_WIND } from "../shared/wind/styles.ts";

const STYLE_POSTER_CARD = `
  /* the card is its own stacking context: the backdrop sits on its background, under the poster's
     action layer (.hit, z-index -1) and the content */
  ha-card.layout-poster { isolation: isolate; container: pcard / inline-size; }
  .pback { position: absolute; inset: 0; z-index: -2; pointer-events: none; overflow: hidden; border-radius: inherit; }
  .pback[hidden] { display: none; }
  .pback > img { width: 100%; height: 100%; object-fit: cover; display: block; }
  /* the scrim: the card's own surface over the whole picture, most of it at the top (lead, badges)
     and the bottom (the texts), so the theme's text reads on any picture */
  .pback.scrim::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to bottom, color-mix(in srgb, ${CARD_BG} 72%, transparent) 0%, color-mix(in srgb, ${CARD_BG} 38%, transparent) 30%, color-mix(in srgb, ${CARD_BG} 55%, transparent) 50%, color-mix(in srgb, ${CARD_BG} 90%, transparent) 100%); }
  .row.hval.pstatus.empty { display: none; }
  /* a corner of three badges or more wraps them into rows from the right, so it keeps to the top */
  .corner:has(> .row.hval:nth-child(3)) { flex-direction: row; flex-wrap: wrap; justify-content: flex-end; align-content: flex-start; }

  /* a kind's field as the backdrop (wind, rain): the band fills the card; the lead keeps a solid
     circle over it */
  .pback > .wflow.bg { position: absolute; inset: 0; border-radius: 0; }
  ha-card.pflow .plead .lead .shape { background: ${iconBg("var(--fe-color)", CARD_BG)}; }
  ha-card.pflow .plead .lead.plain .shape { background: transparent; }

  /* a kind's curve along the bottom (the sun's day, a trend's lines): it takes the room the texts
     leave, out to the card's edges, and reaches up under the value; the texts stay on top and let
     the pointer through to it */
  .pbody:has(> .pcurve) { flex: 1 1 auto; min-height: 0; }
  .pbody:has(> .pcurve) > :not(.pcurve) { position: relative; z-index: 1; pointer-events: none; }
  .pbody:has(> .pcurve) .big b { ${type(32, 36)} }
  .pbody > .pcurve { position: relative; flex: 1 1 auto; min-height: 40px; min-width: 0; margin: -12px -16px -16px; touch-action: pan-y; }
  .row.actionable .pcurve { pointer-events: auto; }
  .pbody > .pcurve.trend { margin: -12px -16px -16px; }
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
