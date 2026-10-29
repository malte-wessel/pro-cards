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
  /* the corner floats over the poster's top right, so the badges take no height from the name,
     the value and the picture (the top line is as tall as the lead); many badges reach down over
     the picture's right. Controls on the value's line keep their room: there the corner stops
     above them */
  ha-card.layout-poster .row.poster { position: static; }
  ha-card.layout-poster .row.poster > .ptop > .corner { position: absolute; z-index: 2; top: 16px; right: 16px; max-width: calc(100% - 88px); }
  ha-card.layout-poster .row.poster:has(> .pbody > .pvalue > .end) > .ptop > .corner { max-height: calc(100% - 96px); overflow: hidden; }

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
  .pbody:has(> .pcurve) .big b { ${type(32, 36)} }
  .pbody > .pcurve { position: relative; flex: 1 1 auto; min-height: 40px; min-width: 0; margin: 6px -16px -16px; touch-action: pan-y; }
  /* a sparkline keeps a small gap below the value instead of reaching up under it */
  ha-card.layout-poster .pbody > .pvalue + .plot.grow[data-kind="sparkline"] { margin-top: 6px; }
  .row.actionable .pcurve { pointer-events: auto; }
  /* a picture's tooltip opens upward from its bottom, over the texts: the picture is the poster's
     bottom strip, and a tooltip opening downward would be cut by the card's edge */
  ha-card.layout-poster .pbody > :is(.pcurve, .plot) > .tip { top: auto; bottom: 8px; z-index: 3; }
  /* its lines are rows of their own (a colour key, the value, the name): not the poster's entity
     rows, which stack their parts */
  ha-card.layout-poster .tip .row { flex-direction: row; align-items: center; gap: 6px; border-radius: 0; }
  .pbody > .pcurve.trend { margin: 6px -16px -16px; }
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
