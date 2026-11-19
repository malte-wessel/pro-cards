// CSS of the schedule card: the entity cards' header, the week of lanes under it (the lane's own
// look in src/shared/schedule/styles.ts), and edit mode: the selected blocks ringed, the handles on
// their ends and the dot under them floating over the lanes, the toolbar above the selection, the
// bubble that says where a drag lands. Every hit area is at least 44 px; the card keeps its size.
import { CARD_BG } from "../shared/constants.ts";
import {
  STYLE_BASE,
  STYLE_CONTROLS,
  STYLE_HEADER,
  controlLayer,
} from "../shared/entity/render/styles.ts";
import { tipStyle } from "../shared/hover.ts";
import { STYLE_SCHEDULE_LANE } from "../shared/schedule/styles.ts";
import { fs, fw, type } from "../shared/typography.ts";

const STYLE_WEEK = `
  ha-card { --fe-track: color-mix(in srgb, var(--disabled-color, #bdbdbd) 20%, transparent); }
  .wk { position: relative; display: flex; flex-direction: column; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
  .wrow { display: flex; align-items: center; gap: 10px; height: 22px; margin-bottom: 6px; min-width: 0; }
  .wrow > .slane { flex: 1 1 auto; min-width: 0; }
  .sdn { flex: none; width: var(--sdn, 28px); display: flex; align-items: center; }
  .key { ${type(11, 16)} letter-spacing: .08em; text-transform: uppercase; font-weight: ${fw("medium")}; color: var(--secondary-text-color); white-space: nowrap; }
  .key.today { color: var(--fe-color); }
  .key .n { display: none; }
  @container (max-width: 259px) { .key .s { display: none; } .key .n { display: inline; } }
  .saxisrow { display: flex; gap: 10px; margin-top: -4px; }
  .saxisrow > i { flex: none; width: var(--sdn, 28px); }
  .saxisrow > .saxis { flex: 1 1 auto; min-width: 0; }
  /* view mode: a finger scrolls the page over the lanes; a long press (where the card edits) turns
     edit mode on */
  .slane { touch-action: pan-y; }
  .wk.editable .slane { -webkit-touch-callout: none; }
  ${tipStyle()}
  .wk > .tip { top: auto; transform: translateX(-50%); }
  .wk > .tip .t { color: var(--secondary-text-color); }

  /* the header: when the schedule changes next, the pencil; in edit mode the selection, add, undo
     and done */
  .header .snext { display: flex; align-items: center; gap: 4px; min-width: 0; color: var(--primary-text-color); --mdc-icon-size: 18px; }
  .header .snext > ha-icon { color: var(--fe-color); }
  .header .snext > span { ${type(13, 16)} white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
  .header .sctl { display: flex; align-items: center; gap: 6px; flex: none; margin: -4px -6px -4px 0; }
  .header .sctl:empty { display: none; }
  .sbtn { flex: none; width: 28px; height: 28px; border: 0; padding: 0; border-radius: 8px; background: transparent; color: var(--secondary-text-color); display: flex; align-items: center; justify-content: center; cursor: pointer; --mdc-icon-size: 18px; position: relative; }
  .sbtn::before { content: ""; position: absolute; inset: -8px; }
  .sbtn.track { background: var(--fe-track); color: var(--primary-text-color); }
  .sbtn.on { background: var(--fe-color); color: var(--text-primary-color, #fff); }
  .sbtn:disabled { opacity: .38; cursor: default; }
  .sbtn.done { width: auto; padding: 0 12px; background: var(--fe-color); color: var(--text-primary-color, #fff); font: inherit; ${type(12, 16)} font-weight: ${fw("medium")}; white-space: nowrap; }
  .sbtn.done.saving { animation: ctl-pulse 1s ease-in-out infinite; }
  .sbtn.icon-only { color: var(--secondary-text-color); cursor: default; }
  .spill { flex: 0 1 auto; min-width: 0; display: inline-flex; align-items: center; gap: 2px; height: 24px; box-sizing: border-box; padding: 0 4px 0 8px; border: 1px solid color-mix(in srgb, var(--fe-color) 40%, transparent); border-radius: 999px; background: transparent; color: var(--fe-color); font: inherit; ${type(12, 16)} font-weight: ${fw("medium")}; white-space: nowrap; cursor: pointer; --mdc-icon-size: 14px; }
  .spill > span { overflow: hidden; text-overflow: ellipsis; }
  :is(.sbtn, .spill, .sday):focus-visible { outline: none; box-shadow: 0 0 0 2px var(--fe-color); }
  ${controlLayer(":is(.sbtn:not(.icon-only), .spill)")}

  /* edit mode: blocks are buttons; the lanes take the finger (a drag moves blocks, not the page) */
  .wk.edit .slane { touch-action: none; cursor: crosshair; }
  .sday { flex: none; width: var(--sdn, 28px); height: 22px; border: 0; padding: 0; margin: 0; background: transparent; text-align: start; font: inherit; cursor: pointer; border-radius: 4px; position: relative; }
  .sday::before { content: ""; position: absolute; inset: -11px -8px; }
  .sday[aria-pressed="true"] .key { color: var(--fe-color); }
  .slane > button.sb { border: 0; padding: 0; margin: 0; font: inherit; color: inherit; cursor: grab; touch-action: none; pointer-events: auto; outline: none; }
  .slane > button.sb::before { content: ""; position: absolute; inset: -11px 0; }
  .slane > .sb.sel { opacity: 1; z-index: 1; box-shadow: 0 0 0 2px ${CARD_BG}, 0 0 0 4px var(--fe-color); }
  .slane > button.sb:focus-visible { opacity: 1; z-index: 1; box-shadow: 0 0 0 2px ${CARD_BG}, 0 0 0 4px var(--primary-text-color); }
  .slane > .sb.draft { opacity: 1; z-index: 1; box-shadow: 0 0 0 2px ${CARD_BG}, 0 0 0 4px var(--fe-color); background: color-mix(in srgb, var(--fe-color) 70%, ${CARD_BG}); }
  .sb > .st { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; ${type(10, 12)} font-weight: ${fw("medium")}; color: var(--text-primary-color, #fff); font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; pointer-events: none; }
  /* the slider's handle (a hollow capsule) on a selected block's ends: a 44 px target around it */
  .sknob { position: absolute; top: 3px; bottom: 3px; width: 8px; margin: 0 0 0 -4px; padding: 0; box-sizing: border-box; border: 2px solid var(--text-primary-color, #fff); border-radius: 4px; background: var(--fe-color); box-shadow: 0 0 2px rgba(0,0,0,.35); cursor: ew-resize; touch-action: none; z-index: 2; }
  /* (its target reaches out from the block, never over it: a short block stays draggable) */
  .sknob::before { content: ""; position: absolute; inset: -14px 0; }
  .sknob[data-act="from"]::before { left: -20px; }
  .sknob[data-act="to"]::before { right: -20px; }
  /* the dot under a day's selection: drag it over the days above or below to copy there */
  .sfill { position: absolute; top: 18px; width: 12px; height: 12px; margin: 0 0 0 -6px; padding: 0; box-sizing: border-box; border: 2px solid ${CARD_BG}; border-radius: 50%; background: var(--fe-color); box-shadow: 0 0 2px rgba(0,0,0,.35); cursor: ns-resize; touch-action: none; z-index: 3; }
  /* (its target reaches down and to the sides, not up over the block it belongs to) */
  .sfill::before { content: ""; position: absolute; inset: -2px -16px -18px; }
  .sghost { position: absolute; top: 0; bottom: 0; box-sizing: border-box; border: 2px dashed var(--fe-color); border-radius: 2px; background: color-mix(in srgb, var(--fe-color) 15%, transparent); pointer-events: none; }
  .sbubble { position: absolute; bottom: calc(100% + 6px); transform: translateX(-50%); padding: 3px 8px; border-radius: 999px; background: var(--primary-text-color); color: ${CARD_BG}; ${type(12, 14)} font-weight: ${fw("medium")}; white-space: nowrap; font-variant-numeric: tabular-nums; z-index: 5; pointer-events: none; }
  /* on a touch screen the bubble stands clear of the finger */
  .wk.touch .sbubble { bottom: calc(100% + 30px); }
  /* the selection's toolbar: the tooltip's surface, the small controls in it */
  .sbar { position: absolute; z-index: 4; display: flex; flex-wrap: wrap; align-items: center; gap: 4px; padding: 4px; box-sizing: border-box; max-width: 100%; background: ${CARD_BG}; border: 1px solid var(--divider-color); border-radius: 12px; box-shadow: var(--ha-card-box-shadow, 0 2px 6px rgba(0,0,0,.2)); }
  .sbar .sstep { display: flex; align-items: center; height: 28px; border-radius: 8px; background: var(--fe-track); }
  .sbar .sstep > .sbtn { background: transparent; color: var(--primary-text-color); }
  .sbar .sstep > .val { min-width: 56px; padding: 0 4px; text-align: center; font-size: ${fs(13)}; font-weight: ${fw("medium")}; font-variant-numeric: tabular-nums; white-space: nowrap; }
  @keyframes ctl-pulse { 50% { opacity: .45; } }
  @media (prefers-reduced-motion: reduce) { .sbtn.done.saving { animation: none; } }
`;

export const STYLE_SCHEDULE_CARD =
  STYLE_BASE + STYLE_HEADER + STYLE_CONTROLS + STYLE_SCHEDULE_LANE + STYLE_WEEK;
