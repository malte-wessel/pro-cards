// CSS of the energy flow card's period picker, on top of the flow tree's. The picker sits outside
// any row, so it defines the control tokens rows carry for themselves.
import { STYLE_DATEPICKER } from "../shared/datepicker.ts";
import { STYLE_FLOW_TREE } from "../shared/flow-tree/styles.ts";
import { fs, fw } from "../shared/typography.ts";

const STYLE_PICKER = `
  .ppicker { --fe-color: var(--primary-color); --fe-track: color-mix(in srgb, var(--primary-text-color) 8%, transparent); display: flex; align-items: center; gap: 4px; flex: 0 1 auto; min-width: 0; margin-left: auto; }
  .ppicker .round { flex: none; width: 32px; height: 32px; border: 0; padding: 0; border-radius: 50%; background: var(--fe-track); color: var(--primary-text-color); display: flex; align-items: center; justify-content: center; cursor: pointer; --mdc-icon-size: 20px; }
  /* one width whatever the period's name: the header never moves; a long range is cut */
  .pchip { display: inline-flex; align-items: center; justify-content: center; flex: 0 1 auto; width: 9.5em; min-width: 6em; height: 32px; box-sizing: border-box; padding: 0 12px; border: 0; border-radius: 999px; background: var(--fe-track); color: var(--primary-text-color); font: inherit; font-size: ${fs(13)}; font-weight: ${fw("medium")}; cursor: pointer; }
  .pchip .ptext { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: center; }
  .pchip:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--fe-color); }
  .ppicker .round:disabled { opacity: .38; cursor: default; }
  .ppicker ha-icon { display: inline-flex; flex: none; width: var(--mdc-icon-size, 24px); height: var(--mdc-icon-size, 24px); line-height: 0; }
  .ppicker .round ha-icon { color: var(--primary-text-color); }
  .ppicker .round:disabled ha-icon { color: var(--secondary-text-color); }
  .ppicker .round:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--fe-color); }
  /* the title keeps its width (up to half the header); on a narrow card the button gives way,
     by the card's width alone, never by what it names */
  .header .title { flex: 1 0 auto; max-width: 50%; }
  .ppicker { flex: 0 1 auto; }
`;

export const STYLE_ENERGY_FLOW_CARD = STYLE_FLOW_TREE + STYLE_PICKER + STYLE_DATEPICKER;
