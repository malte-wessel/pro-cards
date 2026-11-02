// CSS of what the kinds draw on a poster: a fan's turning blades, a thermostat's
// warm or cool backdrop, an alarm's red pulse. Every animation has a paused frame
// (prefers-reduced-motion, the visual tests): the blades stand at an angle, the pulse is still.
import { CARD_BG } from "../constants.ts";

// focus on a card that is one button, as Home Assistant's tile: the card's border in its colour
// (--card-tint, set by the card) with a 1 px ring outside it, in place of a ring inside the card.
// The ring is an outline (always there, transparent until focused, so it fades): a box shadow
// would have to list the theme's own, and a theme's `none` would drop the whole declaration
export const STYLE_KIND_CARD_FOCUS = `
  ha-card:is(.layout-tile, .layout-poster) { outline: 1px solid transparent; transition: border-color 180ms ease-in-out, outline-color 180ms ease-in-out; }
  ha-card:is(.layout-tile, .layout-poster):has(> .body > .row > .hit:focus-visible) { border-color: var(--card-tint); outline-color: var(--card-tint); }
  ha-card:is(.layout-tile, .layout-poster) .row > .hit:focus-visible { box-shadow: none; }
`;

// what a card that draws a kind puts behind its texts (backdrop.ts): a picture under its scrim, a
// kind's drawing (its flow field, cover, path or line), a glow; behind the row and its action
// layer, never taking the pointer
export const STYLE_KIND_BACKDROP = `
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
  /* visual: glow: the card's colour from its bottom edge, as strong as its level (its opacity, set
     by the card: a new level fades as switching does); nothing at 0. The last part of the layer:
     over a kind's drawing, under an image's scrim */
  .pglow { position: absolute; inset: 0; background: radial-gradient(120% 90% at 50% 105%, color-mix(in srgb, var(--glow) 60%, transparent) 0%, transparent 72%); opacity: 0; transition: opacity .6s; }
  /* a kind's field (wind, rain): the band fills the card */
  .pback > .wflow.bg { position: absolute; inset: 0; border-radius: 0; }
`;

export const STYLE_KINDS = `
  /* fan: one turn a second as built (the speed scales the playback rate) */
  .lead.pfan :is(ha-icon, ha-state-icon) { transform: rotate(20deg); }
  .lead.pfan.spin :is(ha-icon, ha-state-icon) { animation: pfan-spin 1s linear infinite; }
  @keyframes pfan-spin { from { transform: rotate(20deg); } to { transform: rotate(380deg); } }

  /* climate: warm while heating, cool while cooling */
  .pclimate { position: absolute; inset: 0; opacity: 0; transition: opacity .6s; }
  .pclimate.heating { opacity: 1; background: radial-gradient(120% 90% at 50% 105%, color-mix(in srgb, var(--state-climate-heat-color, var(--deep-orange-color)) 30%, transparent), transparent 72%); }
  .pclimate.cooling { opacity: 1; background: radial-gradient(120% 90% at 50% 105%, color-mix(in srgb, var(--state-climate-cool-color, var(--blue-color)) 30%, transparent), transparent 72%); }

  /* alarm: a red pulse from the edges while triggered */
  .palarm { position: absolute; inset: 0; opacity: 0; }
  .palarm.on { opacity: 1; box-shadow: inset 0 0 0 2px var(--error-color, var(--red-color)); background: radial-gradient(130% 100% at 50% 50%, transparent 40%, color-mix(in srgb, var(--error-color, var(--red-color)) 30%, transparent)); animation: palarm 1.4s ease-in-out infinite; }
  @keyframes palarm { 50% { opacity: .45; } }

  /* media player: the progress along the card's bottom edge, running on its own while it plays */
  .pbody > .pprog { position: absolute; left: 0; right: 0; bottom: 0; height: 4px; background: color-mix(in srgb, var(--fe-color) 22%, transparent); }
  .pprog > i { display: block; height: 100%; width: calc(var(--f0, 0) * 100%); background: var(--fe-color); }
  @keyframes pprog { from { width: calc(var(--f0, 0) * 100%); } to { width: 100%; } }

  /* cover: the window drawn at its position (--p: 0 closed, 100 open), the slats or panels of its
     device class, sliding while it moves */
  .pcov { position: absolute; inset: 0; --slat: color-mix(in srgb, var(--fe-color) 26%, ${CARD_BG}); --gap: color-mix(in srgb, var(--fe-color) 12%, ${CARD_BG}); }
  .pcov .sheet, .pcov .half { position: absolute; transition: height .8s ease, width .8s ease; box-shadow: 0 2px 6px rgba(0, 0, 0, .12); }
  /* on its way it glides from one reported position to the next at an even speed */
  .pcov.moving :is(.sheet, .half) { transition-duration: 1s; transition-timing-function: linear; }
  .pcov:is(.shutter, .blind, .garage) .sheet { left: 0; right: 0; top: 0; height: calc((100 - var(--p, 0)) * 1%); }
  .pcov.shutter .sheet { background: repeating-linear-gradient(to bottom, var(--slat) 0 11px, var(--gap) 11px 13px); }
  /* a blind's slats turn with its tilt: the gaps between them open */
  .pcov.blind .sheet { background: repeating-linear-gradient(to bottom, var(--slat) 0 calc(8px - var(--tilt, 50) * 0.05px), transparent calc(8px - var(--tilt, 50) * 0.05px) 8px); }
  .pcov.garage .sheet { background: repeating-linear-gradient(to bottom, var(--slat) 0 26px, var(--gap) 26px 28px); }
  .pcov.gate .sheet { left: 0; top: 0; bottom: 0; width: calc((100 - var(--p, 0)) * 1%); background: repeating-linear-gradient(to right, var(--slat) 0 6px, transparent 6px 18px); box-shadow: none; }
  .pcov.curtain .half { top: 0; bottom: 0; width: calc((100 - var(--p, 0)) * 0.5%); background: repeating-linear-gradient(to right, var(--slat) 0 9px, var(--gap) 9px 14px); }
  .pcov.curtain .half.l { left: 0; }
  .pcov.curtain .half.r { right: 0; }
  .pcov.awning .sheet { left: 0; right: 0; top: 0; height: calc(var(--p, 0) * 0.6%); background: repeating-linear-gradient(90deg, var(--slat) 0 18px, var(--gap) 18px 36px); }
  .pcov.window .pane { position: absolute; inset: 14% 18%; border: 3px solid var(--slat); border-radius: 4px; background: linear-gradient(to bottom, color-mix(in srgb, var(--fe-color) calc(var(--p, 0) * 0.2%), transparent), transparent); }
  .pcov.unknown { opacity: .4; }

  /* vacuum and lawn mower: the path drawing itself while it works (half drawn when still), the
     dock while it rests; on grass for a mower */
  .ppath { position: absolute; inset: 0; }
  .ppath.lawn { background: repeating-linear-gradient(90deg, color-mix(in srgb, var(--green-color) 10%, transparent) 0 22px, color-mix(in srgb, var(--green-color) 5%, transparent) 22px 44px); }
  /* the route keeps to the largest room the icon, the badges, the texts and the controls leave
     (placed by the robot kind, in px) */
  .ppath svg { position: absolute; overflow: visible; }
  .ppath :is(.route, .done) { fill: none; stroke: var(--fe-color); stroke-width: 2; stroke-linecap: square; vector-effect: non-scaling-stroke; }
  .ppath .route { opacity: .12; }
  .ppath .done { opacity: .6; }
  .ppath .reveal { fill: none; stroke: #fff; stroke-width: 8; stroke-dasharray: 100; stroke-dashoffset: 50; }
  .ppath.working .reveal { animation: ptrail 16s linear infinite; }
  @keyframes ptrail { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
  .ppath:not(.working) svg { opacity: .35; }
  .ppath .pdock { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); --mdc-icon-size: 56px; color: var(--fe-color); opacity: 0; }
  .ppath.docked .pdock { opacity: .18; }
  .ppath.docked svg { opacity: 0; }
  .lead.probot.working :is(ha-icon, ha-state-icon) { animation: probot 2.4s ease-in-out infinite; }
  @keyframes probot { 25% { transform: translateX(-3px) rotate(-6deg); } 75% { transform: translateX(3px) rotate(6deg); } }

  /* a power line: dots crossing it (3 s as built, the power scales the rate), back when it flows
     out; still while nothing flows. Each dot carries its phase, so a paused frame shows them */
  .pline { position: absolute; height: 2px; background: color-mix(in srgb, var(--fe-color) 25%, transparent); }
  .pline > i { position: absolute; top: -2px; left: calc(var(--p0) * 100%); width: 6px; height: 6px; margin-left: -3px; border-radius: 50%; background: var(--fe-color); animation: pline 3s linear infinite; animation-delay: calc(var(--p0) * -3s); }
  .pline.back > i { animation-direction: reverse; }
  .pline.idle > i { animation: none; opacity: .35; }
  @keyframes pline { from { left: 0%; } to { left: 100%; } }
  .pline.grid { left: 0; right: 0; top: 46%; }

  /* battery: a strip of ten segments under the charge, filled to it, with a battery's tip; while
     power flows (a home battery) the first segment not full pulses */
  :is(.pbody, .row.tile) > .pstrip { display: flex; align-items: center; gap: 3px; margin-top: 8px; }
  /* the strip's height comes from the room between the icon and the name, not from the value */
  .row.poster:has(> .pbody > .pstrip) { gap: 6px; }
  .pstrip > i { flex: 1 1 0; min-width: 0; height: 10px; border-radius: 3px; position: relative; overflow: hidden; background: color-mix(in srgb, var(--fe-color) 22%, transparent); }
  .pstrip > i.part { background: color-mix(in srgb, var(--fe-color) 34%, transparent); }
  .pstrip > i::after { content: ""; position: absolute; inset: 0 auto 0 0; width: calc(var(--f, 0) * 100%); background: var(--fe-color); }
  .pstrip > .tip { flex: none; width: 3px; height: 5px; border-radius: 0 2px 2px 0; background: color-mix(in srgb, var(--fe-color) 22%, transparent); }
  .pstrip.flow > i.part { animation: pstrip 1.6s ease-in-out infinite; }
  @keyframes pstrip { 50% { opacity: .55; } }

  @media (prefers-reduced-motion: reduce) {
    .pline > i,
    .lead.pfan.spin :is(ha-icon, ha-state-icon), .palarm.on, .ppath.working .reveal,
    .lead.probot.working :is(ha-icon, ha-state-icon), .pprog > i, .pstrip.flow > i.part { animation: none; }
  }
`;
