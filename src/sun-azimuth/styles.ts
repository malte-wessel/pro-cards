// Styles of the sun azimuth card. --saz-sun / --saz-night / --saz-sky are set on the card from
// the config colours; --c is the colour of a lead or row (the sun's while it is up).
import { AXIS_FONT } from "../shared/constants.ts";
import { CHIP_FONT } from "./constants.ts";

const CARD_BG = "var(--ha-card-background, var(--card-background-color))";

export const STYLE = `
  :host { display: block; min-width: 0; }
  ha-card { height: 100%; box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden; contain: inline-size; container-type: inline-size; }
  .header { display: flex; align-items: center; gap: 10px; padding: 12px 16px 0 16px; min-width: 0; }
  .header ha-icon { flex: none; color: var(--secondary-text-color); --mdc-icon-size: 20px; }
  .header .title { flex: 1; min-width: 0; font-size: 16px; font-weight: 500; line-height: 20px; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .body { padding: 12px 16px 14px 16px; flex: 1; display: flex; flex-direction: column; gap: 14px; min-width: 0; }
  .divider { height: 1px; background: var(--divider-color); flex: none; }
  .top { display: flex; align-items: center; gap: 12px; min-width: 0; --c: var(--saz-sun); }
  .lead { position: relative; flex: none; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--c); background: color-mix(in srgb, var(--c) 20%, transparent); --mdc-icon-size: 22px; }
  .lead.xl { width: 56px; height: 56px; --mdc-icon-size: 30px; }
  .lead.s36 { width: 36px; height: 36px; --mdc-icon-size: 20px; }
  .lead.s32 { width: 32px; height: 32px; --mdc-icon-size: 18px; }
  .lead ha-icon { display: block; }
  .rot { display: flex; transition: transform .6s; }
  .texts { flex: 1 1 0; min-width: 24px; display: flex; flex-direction: column; gap: 2px; }
  .primary { font-size: 14px; font-weight: 500; line-height: 20px; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .secondary { font-size: 12px; line-height: 16px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .secondary .accent { color: var(--c); font-weight: 500; }
  .big { display: flex; align-items: baseline; gap: 6px; white-space: nowrap; min-width: 0; }
  .big b { font-size: 32px; font-weight: 500; line-height: 36px; letter-spacing: -.6px; color: var(--primary-text-color); font-variant-numeric: tabular-nums; }
  .big span { font-size: 14px; color: var(--secondary-text-color); }
  .main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
  .line { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .pill { flex: none; font-size: 12px; font-weight: 500; line-height: 16px; padding: 4px 10px; border-radius: 999px; color: var(--c); background: color-mix(in srgb, var(--c) 20%, transparent); white-space: nowrap; letter-spacing: .02em; max-width: 45%; overflow: hidden; text-overflow: ellipsis; }
  .key { font-size: 11px; line-height: 16px; letter-spacing: .08em; text-transform: uppercase; font-weight: 500; color: var(--secondary-text-color); white-space: nowrap; }
  .sechead { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  /* the lead ring of the ring view */
  .ringrow { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; min-width: 0; --c: var(--saz-sun); }
  .lead.ring { width: 132px; height: 132px; background: transparent; }
  .lead.ring svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
  .lead.ring .track { fill: none; stroke: color-mix(in srgb, var(--c) 20%, transparent); stroke-width: 3; }
  .lead.ring .arc { fill: none; stroke: var(--saz-sun); stroke-width: 3; stroke-linecap: round; }
  .lead.ring .dot { fill: var(--c); stroke: ${CARD_BG}; stroke-width: 1.2; }
  .lead.ring .in { position: absolute; inset: 16%; border-radius: 50%; background: color-mix(in srgb, var(--c) 20%, transparent); display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--primary-text-color); }
  .lead.ring .az { font-size: 26px; font-weight: 500; line-height: 1; font-variant-numeric: tabular-nums; }
  .lead.ring .cp { font-size: 12px; color: var(--secondary-text-color); margin-top: 3px; }
  .lines { flex: 1 1 180px; min-width: 0; display: flex; flex-direction: column; gap: 10px; }
  .lead.rise { --c: var(--saz-sun); }
  .lead.noon { --c: var(--orange-color); }
  .lead.set { --c: var(--saz-night); }
  /* the pictures */
  .visual { display: flex; justify-content: center; min-width: 0; }
  .visual svg { display: block; width: 100%; overflow: visible; }
  svg.dial { max-width: 300px; }
  svg.scene { max-width: 416px; }
  svg text { font: ${AXIS_FONT}; font-weight: 500; fill: var(--secondary-text-color); text-anchor: middle; dominant-baseline: central; }
  .dial .disc { fill: color-mix(in srgb, var(--saz-sky) 5%, transparent); stroke: var(--divider-color); stroke-width: 2; }
  .dial .grid { fill: none; stroke: var(--divider-color); stroke-width: 1; stroke-dasharray: 3 4; }
  .dial .ticks, .scene .gticks { stroke: var(--secondary-text-color); stroke-width: 1.5; opacity: .55; }
  .dial .dayarc { fill: none; stroke: var(--saz-sun); stroke-width: 4; stroke-linecap: round; opacity: .3; }
  .dial .beam { fill: none; stroke: var(--saz-sun); stroke-width: 1.5; stroke-dasharray: 2 4; opacity: .7; }
  .future { fill: none; stroke: var(--saz-sun); stroke-width: 2; stroke-dasharray: 4 4; opacity: .45; }
  .past { fill: none; stroke: var(--saz-sun); stroke-width: 2.5; stroke-linecap: round; }
  .dial .footprint, .scene .roof { fill: ${CARD_BG}; }
  .dial .edge, .scene .redge { stroke: var(--divider-color); stroke-width: 2; stroke-linecap: round; }
  .dial .edge.lit { stroke: var(--saz-sun); stroke-width: 4; }
  .scene .redge { stroke-width: 1.5; }
  .scene .redge.lit { stroke: var(--saz-sun); stroke-width: 3; }
  .dial .mark { fill: ${CARD_BG}; stroke-width: 2; }
  .dial .mark.rise { stroke: var(--saz-sun); }
  .dial .mark.set { stroke: var(--saz-night); }
  .sun { fill: var(--saz-sun); stroke: ${CARD_BG}; stroke-width: 3; }
  .sun.down { fill: var(--saz-night); }
  .pulse { fill: none; stroke: var(--saz-sun); stroke-width: 2; transform-box: fill-box; transform-origin: center; animation: saz-pulse 2.4s ease-out infinite; }
  .pulse.down { stroke: var(--saz-night); }
  @keyframes saz-pulse { 0% { transform: scale(.8); opacity: .6; } 100% { transform: scale(2.2); opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .pulse { animation: none; opacity: 0; } .rot { transition: none; } }
  .scene .sky0 { stop-color: var(--saz-sky); stop-opacity: .02; }
  .scene .sky1 { stop-color: var(--saz-sky); stop-opacity: .14; }
  .scene .domearc { fill: none; stroke: var(--divider-color); stroke-width: 1.5; }
  .scene .ground { fill: color-mix(in srgb, ${CARD_BG} 70%, var(--saz-sky) 8%); opacity: .9; }
  .scene .horizon { fill: none; stroke: var(--secondary-text-color); stroke-width: 1.5; opacity: .7; }
  .scene .horizon.back { stroke-width: 1.2; opacity: .4; }
  .scene .pole { fill: none; stroke: var(--secondary-text-color); stroke-width: 1.2; opacity: .6; }
  .scene .past.back { opacity: .85; }
  .scene .future.back { opacity: .45; }
  .scene .shadow { fill: var(--primary-text-color); opacity: .12; }
  .scene .ray { fill: none; stroke: var(--saz-sun); stroke-width: 1.5; opacity: .6; }
  .cardinals { fill: none; stroke: var(--secondary-text-color); stroke-width: 1; stroke-dasharray: 2 3; opacity: .6; }
  .azarc { fill: none; stroke: var(--secondary-text-color); stroke-width: 1.2; opacity: .45; }
  .scene .face { fill: color-mix(in srgb, var(--blue-grey-color) 22%, ${CARD_BG}); stroke: ${CARD_BG}; stroke-width: 1; stroke-linejoin: round; }
  .scene .face.lit { fill: color-mix(in srgb, var(--saz-sun) var(--inc, 50%), ${CARD_BG}); }
  .scene .drop { fill: none; stroke: var(--saz-sun); stroke-width: 1.5; stroke-dasharray: 3 3; }
  .scene .poletop { fill: var(--secondary-text-color); }
  .scene .gdot { fill: var(--saz-sun); }
  .chip rect { fill: color-mix(in srgb, ${CARD_BG} 80%, transparent); }
  .chip text { font: ${CHIP_FONT}; fill: var(--primary-text-color); font-variant-numeric: tabular-nums; }
  /* the camera slider of the 3D view: a bar like the footer's, a round thumb, compass points below */
  .control { display: flex; flex-direction: column; gap: 2px; min-width: 0; margin-top: -4px; }
  .control .row { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .control input { flex: 1; min-width: 0; margin: 0; height: 20px; appearance: none; -webkit-appearance: none; background: transparent; cursor: pointer; touch-action: none; }
  .control input:focus { outline: none; }
  .control input::-webkit-slider-runnable-track { height: 6px; border-radius: 3px; background: color-mix(in srgb, var(--primary-text-color) 8%, transparent); }
  .control input::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; margin-top: -5px; border-radius: 50%; box-sizing: border-box; background: var(--saz-sun); border: 2px solid ${CARD_BG}; }
  .control input::-moz-range-track { height: 6px; border-radius: 3px; background: color-mix(in srgb, var(--primary-text-color) 8%, transparent); }
  .control input::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; box-sizing: border-box; background: var(--saz-sun); border: 2px solid ${CARD_BG}; }
  .control input:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 3px color-mix(in srgb, var(--saz-sun) 35%, transparent); }
  .control input:focus-visible::-moz-range-thumb { box-shadow: 0 0 0 3px color-mix(in srgb, var(--saz-sun) 35%, transparent); }
  .control .cv { flex: none; width: 4ch; text-align: right; font-size: 12px; line-height: 16px; color: var(--secondary-text-color); font-variant-numeric: tabular-nums; white-space: nowrap; }
  /* the points sit under the thumb's centre: 8 px in from either end of the track */
  .caxis { position: relative; height: 12px; margin-right: calc(4ch + 12px); }
  .caxis span { position: absolute; top: 0; transform: translateX(-50%); font: ${AXIS_FONT}; line-height: 12px; color: var(--secondary-text-color); white-space: nowrap; }
  .caxis span:nth-child(1) { left: 8px; }
  .caxis span:nth-child(2) { left: calc(8px + (100% - 16px) * .25); }
  .caxis span:nth-child(3) { left: calc(8px + (100% - 16px) * .5); }
  .caxis span:nth-child(4) { left: calc(8px + (100% - 16px) * .75); }
  .caxis span:nth-child(5) { left: calc(100% - 8px); }
  /* sunrise / noon / sunset */
  .items { display: flex; justify-content: space-between; gap: 8px; }
  .item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 0; }
  .ribody { display: flex; align-items: center; gap: 6px; }
  .item .v { font-size: 14px; font-weight: 500; line-height: 18px; color: var(--primary-text-color); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .item .n { font-size: 12px; line-height: 16px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  /* the sides of the house */
  .sides { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
  .side { align-items: flex-start; }
  .side .pill { color: var(--blue-grey-color); background: color-mix(in srgb, var(--blue-grey-color) 20%, transparent); }
  .side .pill.on { color: var(--saz-sun); background: color-mix(in srgb, var(--saz-sun) 20%, transparent); }
  .lbar { height: 8px; border-radius: 4px; background: color-mix(in srgb, var(--primary-text-color) 8%, transparent); position: relative; }
  .lbar i { position: absolute; top: 0; bottom: 0; border-radius: 4px; background: var(--saz-sun); }
  .lbar b { position: absolute; top: 50%; width: 6px; height: 6px; margin: -5px 0 0 -5px; border-radius: 50%; background: ${CARD_BG}; border: 2px solid var(--primary-text-color); }
  .axis { display: flex; justify-content: space-between; padding-left: 52px; margin-top: -4px; font: ${AXIS_FONT}; line-height: 12px; color: var(--secondary-text-color); font-variant-numeric: tabular-nums; }
  /* a narrow column: the rows keep their words, the small leads go (after .axis: same specificity) */
  @container (max-width: 340px) { .item .lead, .side .lead { display: none; } .axis { padding-left: 0; } }
`;
