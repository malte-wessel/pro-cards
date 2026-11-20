// The schedule's lane and axis (lane.ts): the strip's look (22 px, blocks at .7, the running one
// outlined), a line at now, dashed lines every six hours. Times run left to right in every
// language. Inside a container (`.sbox`) a narrow one drops the axis' quarter labels.
import { type } from "../typography.ts";

export const STYLE_SCHEDULE_LANE = `
  .sbox { container-type: inline-size; min-width: 0; }
  .slane { position: relative; height: 22px; border-radius: 4px; background: var(--fe-track); direction: ltr; }
  .slane > .sgrid { position: absolute; top: 0; bottom: 0; width: 0; border-left: 1px dashed var(--divider-color); pointer-events: none; }
  .slane > .sb { position: absolute; top: 0; bottom: 0; min-width: 2px; border-radius: 2px; background: var(--fe-color); opacity: .7; pointer-events: none; }
  .slane > .sb.cur { box-shadow: inset 0 0 0 2px var(--primary-text-color); }
  .slane > .snow { position: absolute; top: -3px; bottom: -3px; width: 2px; margin-left: -1px; border-radius: 1px; background: var(--primary-text-color); pointer-events: none; z-index: 1; }
  .saxis { position: relative; height: 12px; margin-top: 2px; direction: ltr; }
  .slbl { position: absolute; top: 0; ${type(10, 12)} color: var(--secondary-text-color); white-space: nowrap; font-variant-numeric: tabular-nums; transform: translateX(-50%); }
  .slbl.l { transform: none; }
  .slbl.r { transform: translateX(-100%); }
  @container (max-width: 259px) { .slbl.q { display: none; } }
  .slane > .sph { position: absolute; left: 8px; top: 5px; ${type(10, 12)} color: var(--secondary-text-color); }
`;
