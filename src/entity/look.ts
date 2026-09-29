// Value reading and look resolution (pure).
import { stateColorCss } from "../shared/color.ts";
import { DEVICE_CLASS_ICON } from "../shared/constants.ts";
import type { HassEntity } from "../shared/ha.ts";
import { clamp01, isNum, isTemplate } from "../shared/util.ts";
import type { EntityItem, Rule } from "./config.ts";
import { OFF_STATES } from "./constants.ts";

// the rendered result of a template (null until Home Assistant answered)
export type TplGet = (template: string) => unknown;
// a template result as text, falsy results (null, "", 0, false) count as nothing
export const asText = (v: unknown): string | null =>
  typeof v === "string" ? v : v ? String(v) : null;

// the value of an entity: { raw: string|null, num: number|null, avail }
export interface ValueModel {
  raw: string | null;
  num: number | null;
  avail: boolean;
  missing?: boolean;
}
export interface Look {
  color: string;
  icon: string | null;
  fallbackIcon: string;
  label: string | null;
  tint: boolean;
  rule: Rule | null;
}

export const readValue = (
  ent: EntityItem,
  st: HassEntity | undefined,
  tplGet: TplGet,
): ValueModel => {
  const v = ent.valueSrc;
  let raw: unknown;
  if (v.kind === "template") raw = tplGet(v.template);
  else if (v.kind === "text") raw = v.text;
  else if (v.kind === "attribute") raw = st?.attributes?.[v.key];
  else raw = st?.state;
  if (raw === undefined || raw === null) return { raw: null, num: null, avail: false };
  if (typeof raw === "object") {
    raw = JSON.stringify(raw);
    if (typeof raw === "string" && raw.length > 40) raw = raw.slice(0, 39) + "…";
  }
  const s = String(raw);
  if (s === "unavailable" || s === "unknown" || s === "")
    return { raw: s, num: null, avail: false };
  return { raw: s, num: isNum(s) ? Number(s) : null, avail: true };
};
export const numAttr = (st: HassEntity | undefined, k: string): number | null => {
  const v = st?.attributes?.[k];
  return isNum(v) ? Number(v) : null;
};
export const scaleOf = (ent: EntityItem, st: HassEntity | undefined) => ({
  min: ent.min ?? numAttr(st, "min") ?? numAttr(st, "min_value") ?? 0,
  max: ent.max ?? numAttr(st, "max") ?? numAttr(st, "max_value") ?? 100,
});
export const progressOf = (
  ent: EntityItem,
  num: number | null,
  st: HassEntity | undefined,
): number | null => {
  if (num === null) return null;
  const { min, max } = scaleOf(ent, st);
  return max > min ? clamp01((num - min) / (max - min)) : null;
};

// every matcher a rule has must hold: state on the raw string, below exclusive, above inclusive
export const matchRule = (rule: Rule, model: ValueModel) =>
  (rule.state === null || (model.raw !== null && model.raw === rule.state)) &&
  (rule.below === null || (model.num !== null && model.num < rule.below)) &&
  (rule.above === null || (model.num !== null && model.num >= rule.above));

// { color, icon, fallbackIcon, label, tint, rule }: explicit colour / icon win, then the first
// matching rule (author order), then Home Assistant's state colour for the value (lights amber,
// locks green / red, batteries by level …), then grey for off-like states, else primary
export const resolveLook = (
  ent: EntityItem,
  model: ValueModel,
  st: HassEntity | undefined,
  tplGet: TplGet,
): Look => {
  const rule = ent.rules.find((r) => matchRule(r, model)) ?? null;
  const explicitColor = ent.color
    ? isTemplate(ent.color)
      ? asText(tplGet(ent.color))
      : ent.color
    : null;
  const explicitIcon = ent.icon
    ? isTemplate(ent.icon)
      ? asText(tplGet(ent.icon))
      : ent.icon
    : null;
  const fallbackIcon =
    st?.attributes?.icon || DEVICE_CLASS_ICON[st?.attributes?.device_class ?? ""] || null;
  if (!model.avail) {
    return {
      color: explicitColor || "grey",
      icon: explicitIcon || rule?.icon || null,
      fallbackIcon: fallbackIcon || "mdi:help-circle-outline",
      label: rule?.label || "unavailable",
      tint: false,
      rule,
    };
  }
  const fromState = ent.valueSrc.kind === "state" && st;
  const offish = fromState && model.raw !== null && OFF_STATES.has(model.raw);
  const stateColor = fromState ? stateColorCss(st, model.raw ?? undefined) : null;
  return {
    color: explicitColor || rule?.color || stateColor || (offish ? "grey" : "primary"),
    icon: explicitIcon || rule?.icon || null,
    fallbackIcon: fallbackIcon || "mdi:eye",
    label: rule?.label || null,
    tint: !!(rule && rule.tintCard),
    rule,
  };
};
