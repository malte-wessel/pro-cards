// The colour of a series (pure): the explicit `color` (a template through its rendered result),
// else the first rule the entity's current value matches, else the palette slot. The whole line
// takes the colour of the current value, like the entity card's sparkline, and an unavailable
// value matches no rule (the entity cards' precedence, with the palette in place of grey).
import { cssColor, safeColor } from "../shared/color.ts";
import type { HassEntity } from "../shared/ha.ts";
import { asText, matchRule, type TplGet, type ValueModel } from "../shared/entity/look.ts";
import { isNum, isTemplate } from "../shared/util.ts";
import type { TrendEntity } from "./config.ts";

const valueModelOf = (st: HassEntity | undefined): ValueModel => {
  const raw = st?.state ?? null;
  if (raw === null) return { raw: null, num: null, avail: false };
  return {
    raw,
    num: isNum(raw) ? Number(raw) : null,
    avail: raw !== "unavailable" && raw !== "unknown" && raw !== "",
  };
};

export const seriesColor = (ent: TrendEntity, st: HassEntity | undefined, tplGet: TplGet) => {
  let explicit: string | null = null;
  if (ent.color) {
    if (!isTemplate(ent.color)) return cssColor(ent.color, ent.fallbackCss);
    // a template not rendered yet, empty or no colour token counts as no explicit colour
    const rendered = asText(tplGet(ent.color));
    explicit = safeColor(rendered);
  }
  const model = valueModelOf(st);
  const rule = model.avail ? ent.rules.find((r) => matchRule(r, model)) : null;
  return cssColor(explicit || rule?.color, ent.fallbackCss);
};
