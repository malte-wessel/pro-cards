// The colour of a series (pure): the explicit `color` (a template through its rendered result),
// else the first rule the entity's current value matches, else the palette slot. The whole line
// takes the colour of the current value, like the entity card's sparkline, and an unavailable
// value matches no rule (the entity cards' precedence, with the palette in place of grey).
import { cssColor, safeColor } from "../color.ts";
import type { Rule } from "../entity/config.ts";
import type { HassEntity } from "../ha.ts";
import { asText, matchRule, type TplGet, type ValueModel } from "../entity/look.ts";
import { isNum, isTemplate } from "../util.ts";

// a series as the colour reads it: its explicit colour (a template allowed), its colour rules and
// its palette slot (CSS)
export interface SeriesLook {
  color?: string;
  rules: Rule[];
  fallbackCss: string;
}

const valueModelOf = (st: HassEntity | undefined): ValueModel => {
  const raw = st?.state ?? null;
  if (raw === null) return { raw: null, num: null, avail: false };
  return {
    raw,
    num: isNum(raw) ? Number(raw) : null,
    avail: raw !== "unavailable" && raw !== "unknown" && raw !== "",
  };
};

export const seriesColor = (ent: SeriesLook, st: HassEntity | undefined, tplGet: TplGet) => {
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
