// The rain kind: a rain rate sensor. The animated lead rains at the rate, slanted by the wind;
// `flow` fills the whole poster with rain (with the rain icon as its lead). Today's total is
// found on the rate sensor's device; the wind and its direction are set in `kind`.
import { buildBand, builtLead, setRate, vars } from "../flow/dom.ts";
import { secondaryEl } from "../entity/render/lead.ts";
import { oneOf } from "../util.ts";
import { CHIP_ICON, RAIN_STYLES, type RainStyle } from "../rain/constants.ts";
import { fieldEl, updateBand } from "../rain/field.ts";
import { animatedLead, rainIcon, rainLead } from "../rain/lead.ts";
import { rainNow } from "../rain/now.ts";
import { fallRate, isWet, leadFall, levelOf, tanOf } from "../rain/rain.ts";
import { RAIN_RULES } from "./rules.ts";
import type { Kind, KindCtx } from "./types.ts";

const LEAD = 40;
const flowOf = (c: KindCtx): RainStyle | null =>
  oneOf(RAIN_STYLES, c.opts.flow) ? c.opts.flow : null;
const nowOf = (c: KindCtx) =>
  rainNow(c.ctx, { ent: c.ent, m: c.m }, c.input("today"), c.input("wind"), c.input("direction"));

export const RAIN: Kind = {
  name: "rain",
  deviceClasses: ["precipitation_intensity"],
  reads: ["sensor", "input_number", "number"],
  readsText: "a precipitation_intensity sensor (mm/h or in/h)",
  keys: ["today", "wind", "direction", "flow"],
  rules: RAIN_RULES,
  ruleUnit: "mm/h",
  inputs: [
    {
      key: "today",
      find: {
        domains: ["sensor"],
        deviceClasses: ["precipitation"],
        translationKey: /today|daily|day/i,
        needsKey: true,
      },
    },
    { key: "wind" },
    { key: "direction" },
  ],
  slots: (c) => {
    const chip = nowOf(c).chip;
    return { secondary: chip ? secondaryEl([{ text: chip }]) : null };
  },
  lead: {
    key: (c) => (flowOf(c) ? "icon" : "animated"),
    build: (c) => (flowOf(c) ? rainLead(LEAD) : animatedLead("drops", LEAD)),
    // the row slants the drops (--t, --sl) and times them; a new rate scales their rate
    update: (el, c, row) => {
      const now = nowOf(c);
      const level = levelOf(now.today);
      vars(row, {
        "--t": tanOf(now.slant).toFixed(4),
        "--sl": `${(-now.slant).toFixed(2)}deg`,
        "--lv": `${(level * 100).toFixed(1)}%`,
        "--H": `${LEAD}px`,
      });
      const built = builtLead(row, "rate0", now.rate, leadFall(now.rate));
      // dry first: a dry lead's drops are not drawn and have no animations to scale
      row.classList.toggle("dry", !isWet(now.rate));
      if (!isWet(now.rate)) delete el.dataset.rate;
      else setRate(el, fallRate(now.rate, built));
    },
  },
  backdrop: {
    key: (c) => flowOf(c) ?? "",
    build: () => buildBand("bg", rainIcon(CHIP_ICON), fieldEl()),
    update: (el, c) => {
      const now = nowOf(c);
      updateBand(el, {
        style: flowOf(c) ?? "drops",
        rate: now.rate,
        today: now.today,
        slant: now.slant,
        chip: now.chip,
      });
    },
  },
};
