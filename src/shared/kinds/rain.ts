// The rain kind: a rain rate sensor. The animation (`flow`, in its style) rains at the rate,
// slanted by the wind, in the icon (its default) or behind the whole card, with the rain icon in
// the icon then (the animation is drawn in one place). Today's total is
// found on the rate sensor's device; the wind and its direction are set on the card (`wind`, `direction`).
import { buildBand, builtLead, setRate, vars } from "../flow/dom.ts";
import { secondaryEl } from "../entity/render/lead.ts";
import { oneOf } from "../util.ts";
import { CHIP_ICON, RAIN_STYLES } from "../rain/constants.ts";
import { fieldEl, updateBand } from "../rain/field.ts";
import { animatedLead, rainIcon, rainLead } from "../rain/lead.ts";
import { rainNow } from "../rain/now.ts";
import { fallRate, isWet, leadFall, levelOf, tanOf } from "../rain/rain.ts";
import { RAIN_RULES } from "./rules.ts";
import type { Kind, KindCtx } from "./types.ts";

// the animation's drawing in a place (its variant; null: the place draws no flow)
const flowIn = (p: { type?: string; variant?: unknown } | false) =>
  p && p.type === "flow" ? (oneOf(RAIN_STYLES, p.variant) ? p.variant : "drops") : null;
const nowOf = (c: KindCtx) =>
  rainNow(c.ctx, { ent: c.ent, m: c.m }, c.input("today"), c.input("wind"), c.input("direction"));

export const RAIN: Kind = {
  name: "rain",
  deviceClasses: ["precipitation_intensity"],
  reads: ["sensor", "input_number", "number"],
  readsText: "a precipitation_intensity sensor (mm/h or in/h)",
  keys: ["today", "wind", "direction"],
  rules: RAIN_RULES,
  icon: { type: "flow", variant: "drops" },
  draws: ["flow"],
  ruleUnit: "mm/h",
  inputs: [
    {
      key: "today",
      find: {
        domains: ["sensor"],
        deviceClasses: ["precipitation"],
        translationKey: /today|daily|(?<!yester)day/i,
        needsKey: true,
      },
    },
    { key: "wind" },
    { key: "direction" },
  ],
  slots: (c) => {
    const chip = nowOf(c).chip;
    if (!c.input("today")) return {};
    return { secondary: chip ? secondaryEl([{ text: chip }]) : null };
  },
  lead: {
    key: (c) => flowIn(c.place.icon) ?? "icon",
    build: (c) => {
      const style = flowIn(c.place.icon);
      if (style) {
        // its circle, or none (style: plain)
        const el = animatedLead(style, c.leadSize);
        el.classList.toggle("plain", c.place.icon.style === "plain");
        return el;
      }
      return rainLead(c.leadSize, c.place.icon.style === "plain" ? "plain" : "circle");
    },
    // the row slants the drops (--t, --sl) and times them; a new rate scales their rate
    update: (el, c, row) => {
      const now = nowOf(c);
      const level = levelOf(now.today);
      vars(row, {
        "--t": tanOf(now.slant).toFixed(4),
        "--sl": `${(-now.slant).toFixed(2)}deg`,
        "--lv": `${(level * 100).toFixed(1)}%`,
        "--H": `${c.leadSize}px`,
      });
      const built = builtLead(row, "rate0", now.rate, leadFall(now.rate));
      // dry first: a dry lead's drops are not drawn and have no animations to scale
      row.classList.toggle("dry", !isWet(now.rate));
      if (!isWet(now.rate)) delete el.dataset.rate;
      else setRate(el, fallRate(now.rate, built));
    },
  },
  backdrop: {
    key: (c) => flowIn(c.place.visual) ?? "",
    build: () => buildBand("bg", rainIcon(CHIP_ICON), fieldEl()),
    update: (el, c) => {
      const now = nowOf(c);
      updateBand(el, {
        style: flowIn(c.place.visual) ?? "drops",
        rate: now.rate,
        today: now.today,
        slant: now.slant,
        chip: now.chip,
      });
    },
  },
};
