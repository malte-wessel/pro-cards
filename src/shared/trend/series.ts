// One series of a trend plot as written (pure): an entity id, or { entity, name, color, rules,
// visibility }. Used by the multi trend card and the poster card's trend kind.
import { cssColor } from "../color.ts";
import { normalizeRules, type Rule } from "../entity/config.ts";
import { normalizeVisibility, type Visibility } from "../visibility.ts";
import { PALETTE } from "./scale.ts";

// a series with its palette colour (CSS, by config position), its colour rules and its conditions
// (null: always drawn); the drawn colour is resolved at render time (color.ts: seriesColor)
export interface TrendSeries {
  entity: string;
  name?: string;
  color?: string;
  rules: Rule[];
  visibility: Visibility;
  fallbackCss: string;
}

// the series at config position `i` (`label` names it in errors, e.g. `entities[0]`); null for an
// entry without an entity, which the card rejects or skips
export const normalizeSeries = (
  raw: unknown,
  i: number,
  type: string,
  label: string,
): TrendSeries | null => {
  const o = (typeof raw === "string" ? { entity: raw } : raw) as Record<string, unknown> | null;
  if (!o || typeof o !== "object" || typeof o.entity !== "string" || !o.entity) return null;
  return {
    entity: o.entity,
    name: typeof o.name === "string" ? o.name : undefined,
    color: typeof o.color === "string" ? o.color : undefined,
    rules: normalizeRules(o.rules),
    visibility: normalizeVisibility(o.visibility, { type, label, entity: o.entity }),
    // the palette colour stays the config position's: a hidden series never shifts the others'
    fallbackCss: cssColor(PALETTE[i % PALETTE.length]) ?? "",
  };
};
