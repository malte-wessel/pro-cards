// CSS of the entity cards, in pieces so every card ships only what it renders.
// Colours come from HA theme tokens; --fe-color is set per row from the resolved look.
import { AXIS_FONT } from "../../constants.ts";

export const STYLE_BASE = `
  :host { display: block; min-width: 0; }
  ha-card { height: 100%; box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden; contain: inline-size; --fe-tint: transparent; }
  ha-card.tinted { background: color-mix(in srgb, var(--fe-tint) 12%, var(--ha-card-background, var(--card-background-color))); }
  .body { display: flex; flex-direction: column; gap: 14px; padding: 12px 16px 14px 16px; min-width: 0; }
  .divider { height: 1px; background: var(--divider-color); }
`;
export const STYLE_TILE = `
  .layout-tile .body { padding: 8px 12px; gap: 8px; flex: 1; justify-content: center; }
`;
export const STYLE_HEADER = `
  .header { display: flex; align-items: center; gap: 10px; padding: 12px 16px 0 16px; min-width: 0; }
  .header ha-icon { flex: none; color: var(--secondary-text-color); --mdc-icon-size: 20px; }
  .header .title { flex: 1; min-width: 0; font-size: 16px; font-weight: 500; line-height: 20px; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .header .range { flex: none; font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; }
  .header .hvals { display: flex; align-items: center; gap: 10px; flex: 0 1 auto; min-width: 0; max-width: 60%; }
  .header .hvals:empty { display: none; }
  .row.hval { flex: 0 1 auto; flex-direction: row; align-items: center; gap: 4px; border-radius: 6px; min-width: 0; }
  .hval .state, .hval .secondary { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .hval ha-icon, .hval ha-state-icon { --mdc-icon-size: 18px; color: var(--fe-color); }
  .hval .state, .hval .pill { font-size: 13px; line-height: 16px; }
  .hval .secondary { font-size: 12px; }
`;
export const STYLE_ROW = `
  .row { --fe-color: var(--primary-color); --fe-soft: color-mix(in srgb, var(--fe-color) 20%, transparent); }
  .row { display: flex; flex-direction: column; gap: 10px; min-width: 0; border-radius: 8px; outline: none; }
  .row.actionable { cursor: pointer; position: relative; }
  .row.actionable:focus-visible { box-shadow: 0 0 0 2px var(--fe-color); }
  .top { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .lead { position: relative; flex: none; width: var(--lead, 40px); height: var(--lead, 40px); }
  .lead svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  .lead .shape { position: absolute; inset: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--fe-color); background: var(--fe-soft); --mdc-icon-size: calc(var(--lead, 40px) * .55); font-size: calc(var(--lead, 40px) * .24); font-weight: 500; line-height: 1; white-space: nowrap; overflow: hidden; font-variant-numeric: tabular-nums; }
  .lead .shape.value { color: var(--primary-text-color); background: transparent; }
  .lead.ring .shape { inset: 16%; --mdc-icon-size: calc(var(--lead, 40px) * .42); }
  .lead .track { fill: none; stroke: var(--fe-soft); }
  .lead .prog { fill: none; stroke: var(--fe-color); stroke-linecap: round; transition: stroke-dashoffset .4s; }
  .main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
  .line { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .texts { flex: 1 1 0; min-width: 24px; display: flex; flex-direction: column; gap: 2px; }
  .primary { font-size: 14px; font-weight: 500; line-height: 20px; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .secondary { font-size: 12px; line-height: 16px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .secondary.accent { color: var(--fe-color); font-weight: 500; }
  .end { flex: 0 1 auto; min-width: 0; max-width: 60%; display: flex; align-items: center; gap: 8px; }
  .end:empty { display: none; }
  .state { font-size: 14px; font-weight: 500; color: var(--primary-text-color); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .pill { font-size: 12px; font-weight: 500; line-height: 16px; padding: 4px 10px; border-radius: 999px; color: var(--fe-color); background: var(--fe-soft); white-space: nowrap; letter-spacing: .02em; min-width: 0; max-width: 100%; box-sizing: border-box; overflow: hidden; text-overflow: ellipsis; }
  .big { display: flex; align-items: baseline; gap: 6px; white-space: nowrap; min-width: 0; max-width: 100%; }
  .big b { font-size: 32px; font-weight: 500; line-height: 36px; letter-spacing: -.6px; color: var(--primary-text-color); font-variant-numeric: tabular-nums; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .big span { font-size: 14px; color: var(--secondary-text-color); }
`;
// the controls (render/controls.ts): every size and colour comes from the library the cards draw
// (the 8 px bar, the round lead, the pill), coloured by --fe-color like the visuals
export const STYLE_CONTROLS = `
  .ctl, .toggle { --fe-track: color-mix(in srgb, var(--primary-text-color) 8%, transparent); }
  .ctl button, .ctl-chip, .ctl-hold, .toggle { font: inherit; }
  /* an icon keeps its box while Home Assistant still loads it, so a control never changes width */
  /* a line with a control: the control keeps its size, the value text and the name give way */
  .end:has(> .ctl), .val:has(> .ctl) { max-width: none; flex: 0 1 auto; min-width: 0; }
  .end:has(> .ctl) > .state, .val:has(> .ctl) > .state { flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .end > .ctl-segments, .val > .ctl-segments { flex: 0 1 auto; min-width: 0; overflow: hidden; }
  .ctl ha-icon, .ctl ha-state-icon { display: inline-flex; flex: none; width: var(--mdc-icon-size, 24px); height: var(--mdc-icon-size, 24px); }
  .ctl.disabled, .lead.tap.disabled { opacity: .4; pointer-events: none; }
  .ctl button:disabled { opacity: .38; cursor: default; }
  .ctl:focus-visible, .ctl button:focus-visible, .ctl select:focus-visible, .toggle:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--fe-color); }
  .toggle { flex: none; width: 48px; height: 28px; border: 0; border-radius: 14px; padding: 0; position: relative; cursor: pointer; background: var(--switch-unchecked-track-color, rgba(128,128,128,.4)); }
  .toggle.on { background: var(--fe-color); }
  .toggle i { position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%; background: #fff; transition: left .2s; box-shadow: 0 1px 3px rgba(0,0,0,.3); }
  .toggle.on i { left: 23px; }
  .toggle.sm { width: 36px; height: 20px; border-radius: 10px; }
  .toggle.sm i { top: 2px; left: 2px; width: 16px; height: 16px; }
  .toggle.sm.on i { left: 18px; }
  .toggle.pending { background: color-mix(in srgb, var(--fe-color) 45%, transparent); }
  .toggle.pending i { left: 13px; animation: ctl-pulse 1s ease-in-out infinite; }
  .toggle.sm.pending i { left: 10px; }
  .lead.tap { cursor: pointer; border-radius: 50%; outline: none; }
  .lead.tap:focus-visible .shape { box-shadow: 0 0 0 2px var(--fe-color); }
  .lead.tap.off .shape { color: var(--secondary-text-color); background: var(--fe-track); }
  .lead.tap.pending .shape { animation: ctl-pulse 1s ease-in-out infinite; }
  .ctl-slider { display: flex; align-items: center; height: 24px; flex: 1 1 auto; width: 100%; min-width: 0; touch-action: pan-y; cursor: pointer; outline: none; border-radius: 12px; }
  .end .ctl-slider, .val .ctl-slider { flex: 0 1 120px; width: 120px; min-width: 64px; }
  .ctl-slider .track { position: relative; flex: 1; height: 8px; border-radius: 4px; background: var(--fe-track); }
  .ctl-slider.sm .track { height: 6px; }
  .ctl-slider .fill { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 4px; background: var(--fe-color); }
  .ctl-slider .knob { position: absolute; top: 50%; width: 20px; height: 20px; margin: -10px 0 0 -10px; border-radius: 50%; box-sizing: border-box; background: var(--ha-card-background, var(--card-background-color)); box-shadow: 0 1px 3px rgba(0,0,0,.3), inset 0 0 0 2px var(--fe-color); }
  .ctl-slider.sm .knob { width: 16px; height: 16px; margin: -8px 0 0 -8px; }
  .ctl-slider.dragging .knob { width: 24px; height: 24px; margin: -12px 0 0 -12px; box-shadow: 0 1px 3px rgba(0,0,0,.3), inset 0 0 0 2px var(--fe-color), 0 0 0 7px var(--fe-soft); }
  .ctl-slider .bubble { display: none; position: absolute; bottom: 18px; transform: translateX(-50%); padding: 3px 8px; border-radius: 999px; background: var(--primary-text-color); color: var(--ha-card-background, var(--card-background-color)); font-size: 12px; line-height: 14px; font-weight: 500; white-space: nowrap; text-decoration: none; font-variant-numeric: tabular-nums; z-index: 1; pointer-events: none; }
  .ctl-slider.dragging .bubble { display: block; }
  .ctl-slider.pending .fill { opacity: .55; }
  .ctl-slider.pending .knob { background: transparent; box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--fe-color) 55%, transparent); animation: ctl-pulse 1s ease-in-out infinite; }
  .ctl .round { flex: none; position: relative; width: 32px; height: 32px; border: 0; padding: 0; border-radius: 50%; background: var(--fe-track); color: var(--primary-text-color); display: flex; align-items: center; justify-content: center; cursor: pointer; --mdc-icon-size: 20px; }
  .ctl .round.s { width: 30px; height: 30px; --mdc-icon-size: 18px; }
  .ctl.sm .round { width: 28px; height: 28px; --mdc-icon-size: 16px; }
  .ctl .round.f { background: var(--fe-color); color: var(--text-primary-color, #fff); }
  .ctl .round.pending { animation: ctl-pulse 1s ease-in-out infinite; }
  .ctl-buttons { display: flex; align-items: center; gap: 6px; flex: none; }
  .ctl-stepper { display: flex; align-items: center; gap: 4px; flex: none; }
  .ctl-stepper .val { min-width: 48px; text-align: center; font-size: 14px; font-weight: 500; line-height: 20px; color: var(--primary-text-color); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .ctl-stepper.sm .val { min-width: 40px; font-size: 13px; }
  .ctl-stepper.pending .val { color: var(--fe-color); }
  .ctl-segments { display: flex; padding: 3px; gap: 2px; border-radius: 999px; background: var(--fe-track); flex: none; max-width: 100%; box-sizing: border-box; }
  .ctl-segments .seg { flex: 0 0 auto; height: 30px; border: 0; padding: 0 10px; border-radius: 999px; background: transparent; color: var(--secondary-text-color); display: flex; align-items: center; justify-content: center; gap: 4px; font-size: 12px; font-weight: 500; white-space: nowrap; cursor: pointer; overflow: hidden; --mdc-icon-size: 18px; }
  /* in the block slot the segments share the width */
  .row > .ctl-segments, .main > .ctl-segments, .cell > .ctl-segments { align-self: stretch; }
  .row > .ctl-segments .seg, .main > .ctl-segments .seg, .cell > .ctl-segments .seg { flex: 1 1 0; min-width: 0; }
  .ctl-segments .seg span { overflow: hidden; text-overflow: ellipsis; }
  .ctl-segments .seg.on { background: var(--fe-soft); color: var(--fe-color); }
  .ctl-segments .seg.pending { box-shadow: inset 0 0 0 1px var(--fe-color); animation: ctl-pulse 1s ease-in-out infinite; }
  .ctl-segments.sm .seg { height: 24px; padding: 0 8px; --mdc-icon-size: 16px; }
  .ctl-select { position: relative; display: inline-flex; align-items: center; height: 28px; border-radius: 999px; background: var(--fe-track); padding: 0 4px 0 12px; max-width: 100%; box-sizing: border-box; flex: 0 1 auto; min-width: 0; }
  .ctl-select select { appearance: none; -webkit-appearance: none; border: 0; background: transparent; color: var(--primary-text-color); font: inherit; font-size: 12px; font-weight: 500; line-height: 28px; height: 28px; padding: 0 22px 0 0; cursor: pointer; min-width: 0; max-width: 100%; outline: none; text-overflow: ellipsis; }
  .ctl-select ha-icon { position: absolute; right: 4px; pointer-events: none; color: var(--secondary-text-color); --mdc-icon-size: 18px; }
  .ctl-select.pending select { color: var(--fe-color); }
  .ctl-chip { flex: none; display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 14px 0 10px; border: 0; border-radius: 999px; background: var(--fe-soft); color: var(--fe-color); font-size: 13px; font-weight: 500; white-space: nowrap; cursor: pointer; --mdc-icon-size: 18px; }
  .ctl-chip.sm { height: 28px; font-size: 12px; padding: 0 12px 0 8px; }
  .ctl-chip.done { background: var(--fe-color); color: var(--text-primary-color, #fff); }
  .ctl-chip.round { width: 40px; height: 40px; padding: 0; justify-content: center; border-radius: 50%; --mdc-icon-size: 22px; }
  .ctl-hold { position: relative; flex: none; width: 36px; height: 36px; border: 0; padding: 0; border-radius: 50%; background: var(--fe-soft); color: var(--fe-color); display: flex; align-items: center; justify-content: center; cursor: pointer; --mdc-icon-size: 20px; touch-action: none; -webkit-user-select: none; user-select: none; }
  .ctl-hold.sm { width: 30px; height: 30px; --mdc-icon-size: 18px; }
  .ctl-hold.lead-size { width: 40px; height: 40px; --mdc-icon-size: 22px; }
  .ctl-hold svg { position: absolute; inset: -4px; width: calc(100% + 8px); height: calc(100% + 8px); overflow: visible; pointer-events: none; }
  .ctl-hold .prog { fill: none; stroke: var(--fe-color); stroke-width: 2.5; stroke-linecap: round; stroke-dashoffset: var(--c); transition: none; }
  .ctl-hold.holding .prog { stroke-dashoffset: 0; transition: stroke-dashoffset 1s linear; }
  .ctl-hold.pending { animation: ctl-pulse 1s ease-in-out infinite; }
  @keyframes ctl-pulse { 50% { opacity: .45; } }
  @media (prefers-reduced-motion: reduce) { .ctl, .ctl *, .toggle i, .lead.tap .shape { animation: none !important; transition: none !important; } }
`;
export const STYLE_GROUP = `
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
  .cell .big b { font-size: 22px; line-height: 26px; letter-spacing: -.3px; }
  .cell .big.fit b { font-size: var(--fit, 22px); }
  .cell .lead { margin-bottom: 2px; }
  .cell .gtop { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 0; margin-bottom: 2px; }
  .cell .gtop .lead { margin-bottom: 0; }
  .cell .gtop .end { max-width: none; }
`;
export const STYLE_ITEM = `
  .row.item { flex-direction: column; align-items: center; gap: 4px; max-width: 100%; text-align: center; }
  .item .iname { font-size: 13px; line-height: 18px; font-weight: 500; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  /* the value stacks under the name as a plain line; one that does not fit clips with an ellipsis */
  .item .state { font-size: 12px; line-height: 16px; font-weight: 400; color: var(--secondary-text-color); overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .item .state.lone { font-size: 13px; line-height: 18px; font-weight: 500; color: var(--primary-text-color); }
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
  .item .ctl-chip.round, .item .ctl-hold.lead-size { margin: 0 auto; }
  .item:focus-visible { box-shadow: none; }
  .item:focus-visible .lead .shape { box-shadow: 0 0 0 2px var(--fe-color); }
`;
export const STYLE_TABLE = `
  .section.layout-table { gap: 8px; }
  .row.field { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 12px; }
  .section.with-icon .row.field { grid-template-columns: auto minmax(0, 1fr) auto; }
  .field .key { font-size: 11px; line-height: 16px; letter-spacing: .08em; text-transform: uppercase; font-weight: 500; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
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
  .gauge .val { font: 500 17px Roboto, system-ui, sans-serif; fill: var(--primary-text-color); font-variant-numeric: tabular-nums; }
  .gauge .sub { font: ${AXIS_FONT}; fill: var(--secondary-text-color); }
`;
export const STYLE_PLOT = `
  .plot { position: relative; width: 100%; min-width: 0; touch-action: pan-y; }
  svg.abs { position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: visible; }
  .plot .line { fill: none; stroke: var(--fe-color); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
  .plot .area { fill: var(--fe-color); opacity: .12; }
  .plot .dot { fill: var(--fe-color); stroke: var(--ha-card-background, var(--card-background-color)); stroke-width: 2; }
  .plot .hair { stroke: var(--secondary-text-color); stroke-width: 1; opacity: .6; }
  .plot .col { fill: var(--fe-color); }
  .plot .hl { fill: none; stroke: var(--primary-text-color); stroke-width: 1.5; }
  .hover { display: none; } .hover.on { display: block; }
  .label { position: absolute; font: ${AXIS_FONT}; line-height: 12px; color: var(--secondary-text-color); white-space: nowrap; pointer-events: none; font-variant-numeric: tabular-nums; }
  .label.right { transform: translateX(-100%); }
  .tip {
    position: absolute; top: 4px; pointer-events: none; display: none; z-index: 1; box-sizing: border-box; max-width: calc(100% - 8px);
    background: var(--ha-card-background, var(--card-background-color)); color: var(--primary-text-color);
    border: 1px solid var(--divider-color); border-radius: 8px; padding: 6px 8px; font-size: 12px; line-height: 16px;
    box-shadow: var(--ha-card-box-shadow, 0 2px 6px rgba(0,0,0,.2)); white-space: nowrap;
  }
  .tip.on { display: block; }
  .tip .time { color: var(--secondary-text-color); }
  .tip b { font-weight: 600; font-variant-numeric: tabular-nums; }
  .tip .lbl { color: var(--secondary-text-color); }
`;

export const STYLE_ENTITY_CARD =
  STYLE_BASE + STYLE_TILE + STYLE_ROW + STYLE_CONTROLS + STYLE_BLOCKS + STYLE_PLOT;
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
  STYLE_PLOT;
