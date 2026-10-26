// Value reading and look resolution (pure).
import { safeColor, stateColorCss } from "../color.ts";
import { DEVICE_CLASS_ICON } from "../constants.ts";
import type { HassEntity, HomeAssistant } from "../ha.ts";
import { t } from "../i18n.ts";
import { clamp01, isNum, isTemplate } from "../util.ts";
import type { EntityItem, Rule } from "./config.ts";
import { OFF_STATES, type BadgeStyle } from "./constants.ts";

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
  // the entity's picture in place of the icon (show_entity_picture), null: the icon
  picture: string | null;
  label: string | null;
  tint: boolean;
  rule: Rule | null;
  // a header badge: the matching rule's pill (null or left out: the badge's own) and its pulse
  style?: BadgeStyle | null;
  pulse?: boolean;
}

export const readValue = (
  ent: EntityItem,
  st: HassEntity | undefined,
  tplGet: TplGet,
): ValueModel => {
  const v = ent.valueSrc;
  // an empty text is a blank value, not a missing one (a row of custom buttons without an entity)
  if (v.kind === "text" && v.text === "") return { raw: "", num: null, avail: true };
  let raw: unknown;
  if (v.kind === "template") {
    raw = tplGet(v.template);
    // no result yet: a blank value, not an unavailable one (it is on its way)
    if (raw === undefined) return { raw: "", num: null, avail: true };
  } else if (v.kind === "text") raw = v.text;
  // `attribute: hvac_mode` names the climate state (HA keeps the mode there, not in an attribute)
  else if (v.kind === "attribute")
    raw =
      v.key === "hvac_mode" && st?.entity_id.startsWith("climate.")
        ? st.state
        : st?.attributes?.[v.key];
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

// the entity's picture: the local copy Home Assistant keeps, else the integration's URL
export const pictureOf = (st: HassEntity | undefined): string | null => {
  const a = st?.attributes;
  const url = a?.entity_picture_local || a?.entity_picture;
  return typeof url === "string" && url ? url : null;
};

// { color, icon, fallbackIcon, picture, label, tint, rule }: explicit colour / icon win, then the first
// matching rule (author order), then Home Assistant's state colour for the value (lights amber,
// locks green / red, batteries by level …), then grey for off-like states, else primary
export const resolveLook = (
  ent: EntityItem,
  model: ValueModel,
  st: HassEntity | undefined,
  tplGet: TplGet,
  hass?: HomeAssistant,
): Look => {
  const rule = ent.rules.find((r) => matchRule(r, model)) ?? null;
  // a colour that is no plain colour token (a template rendering markup) counts as none
  const explicitColor = safeColor(
    ent.color ? (isTemplate(ent.color) ? asText(tplGet(ent.color)) : ent.color) : null,
  );
  const explicitIcon = ent.icon
    ? isTemplate(ent.icon)
      ? asText(tplGet(ent.icon))
      : ent.icon
    : null;
  const picture = ent.picture ? pictureOf(st) : null;
  const fallbackIcon =
    st?.attributes?.icon || DEVICE_CLASS_ICON[st?.attributes?.device_class ?? ""] || null;
  if (!model.avail) {
    return {
      color: explicitColor || "grey",
      icon: explicitIcon || rule?.icon || null,
      fallbackIcon: fallbackIcon || "mdi:help-circle-outline",
      picture,
      label: rule?.label || t(hass, "common.unavailable"),
      tint: false,
      rule,
      style: null,
      pulse: false,
    };
  }
  const fromState = ent.valueSrc.kind === "state" && st;
  const offish = fromState && model.raw !== null && OFF_STATES.has(model.raw);
  const stateColor = fromState ? stateColorCss(st, model.raw ?? undefined) : null;
  return {
    color: explicitColor || rule?.color || stateColor || (offish ? "grey" : "primary"),
    icon: explicitIcon || rule?.icon || null,
    fallbackIcon: fallbackIcon || "mdi:eye",
    picture,
    label: rule?.label || null,
    tint: !!(rule && rule.tintCard),
    rule,
    style: rule?.style ?? null,
    pulse: !!rule?.pulse,
  };
};

// the members of a group entity: the ids in its `entity_id` attribute (a light group, a group)
export const membersOf = (st: HassEntity | undefined): string[] => {
  const ids = st?.attributes?.entity_id;
  return Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string") : [];
};
