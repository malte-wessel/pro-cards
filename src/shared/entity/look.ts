// Value reading and look resolution (pure).
import { safeColor, stateActive, stateColorCss } from "../color.ts";
import { DEVICE_CLASS_ICON } from "../constants.ts";
import type { HassEntity, HomeAssistant } from "../ha.ts";
import { t } from "../i18n.ts";
import { clamp01, isNum, isTemplate } from "../util.ts";
import type { BadgeIcon, EntityItem, Rule } from "./config.ts";
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
  // a v3 card's badge: its icon place now (the matching rule's, else its own)
  badgeIcon?: BadgeIcon;
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

// every matcher a rule has must hold: state on the raw string or the entity's own state (a
// media player shown by its title still matches `playing`), below exclusive, above inclusive
export const matchRule = (rule: Rule, model: ValueModel, state?: string | null) =>
  (rule.state === null ||
    (model.raw !== null && model.raw === rule.state) ||
    (state != null && state === rule.state)) &&
  (rule.below === null || (model.num !== null && model.num < rule.below)) &&
  (rule.above === null || (model.num !== null && model.num >= rule.above));

// the value a rule with its own `attribute` reads: that attribute of the entity now (`hvac_mode`
// is a thermostat's state); a boolean reads as its text, so `state: true` matches it
const attrModel = (st: HassEntity, key: string): ValueModel => {
  const raw =
    key === "hvac_mode" && st.entity_id.startsWith("climate.") ? st.state : st.attributes?.[key];
  if (raw === undefined || raw === null) return { raw: null, num: null, avail: false };
  const s = typeof raw === "object" ? JSON.stringify(raw) : String(raw);
  return { raw: s, num: isNum(s) ? Number(s) : null, avail: true };
};
// whether a rule matches: on the value it reads (`ruleModel`), or on its own attribute of the
// entity now; `now` false (a past bucket of the history) leaves an attribute's rule out, as no
// attribute of then is known
export const ruleMatches = (
  rule: Rule,
  model: ValueModel,
  st: HassEntity | undefined,
  now = true,
): boolean =>
  rule.attribute
    ? now && !!st && matchRule(rule, attrModel(st, rule.attribute))
    : matchRule(rule, model, now ? st?.state : null);

// the entity's picture: the local copy Home Assistant keeps, else the integration's URL
export const pictureOf = (st: HassEntity | undefined): string | null => {
  const a = st?.attributes;
  const url = a?.entity_picture_local || a?.entity_picture;
  return typeof url === "string" && url ? url : null;
};

// the v3 cards' colour, as Home Assistant's tile and badge pick it: a matching rule's; the card's
// own while the entity is active (inactive it falls to the state's); the kind's; Home Assistant's
// colour for the entity's state, whatever value is shown (a thermostat's mode beside its
// temperature); else the state icon colour while active (a badge: the primary, as Home
// Assistant's badge), the inactive colour while not. Active is Home Assistant's rule (off,
// unknown and the domain's own off states), not a list of words.
const v3Color = (
  ent: EntityItem,
  model: ValueModel,
  st: HassEntity | undefined,
  ruleColor: string | null,
  explicit: string | null,
  kind: string | null,
  now: boolean,
): string => {
  // (a past bucket of the history: its own value, not the entity's of now)
  const s = ent.valueSrc.kind === "state" || !now ? (model.raw ?? undefined) : undefined;
  const active = !st || stateActive(st, s);
  const state = st && (now || ent.valueSrc.kind === "state") ? stateColorCss(st, s) : null;
  return (
    ruleColor ||
    (active ? explicit : null) ||
    kind ||
    state ||
    (active ? (ent.pill ? "primary" : "var(--state-icon-color)") : "var(--state-inactive-color)")
  );
};

// { color, icon, fallbackIcon, picture, label, tint, rule }: explicit colour / icon win, then the first
// matching rule (author order), then Home Assistant's state colour for the value (lights amber,
// locks green / red, batteries by level …), then grey for off-like states, else primary
// `ruleModel` is the value the rules read when it differs from the shown one (a card's own rules
// in their unit: modelOf); `now` false: the value is not the entity's of now (a past bucket of
// its history), so a rule's state matches that value alone, never the entity's current state;
// `kindColor` the colour a v3 badge's kind gives it (under the item's and the rule's)
export const resolveLook = (
  ent: EntityItem,
  model: ValueModel,
  st: HassEntity | undefined,
  tplGet: TplGet,
  hass?: HomeAssistant,
  ruleModel: ValueModel = model,
  now = true,
  kindColor: string | null = null,
): Look => {
  // (a rule's own attribute is the v3 cards'; the entity cards' rules read the value as ever)
  const rule =
    ent.rules.find((r) =>
      ent.ruleWins
        ? ruleMatches(r, ruleModel, st, now)
        : matchRule(r, ruleModel, now ? st?.state : null),
    ) ?? null;
  // a v3 badge's and a button's rule writes its text as a value, a template too
  const label =
    ent.valueRules && rule?.label && isTemplate(rule.label)
      ? asText(tplGet(rule.label))
      : (rule?.label ?? null);
  const ruleLabel = rule?.labelKey ? t(hass, rule.labelKey) : label;
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
  // the v3 cards: the item's colour and icon are defaults, a matching rule's win
  const first = ent.ruleWins;
  if (!model.avail) {
    return {
      // (the v3 cards: Home Assistant's unavailable colour, an unknown state its inactive chain)
      color: first
        ? rule?.color ||
          (st ? stateColorCss(st) : null) ||
          (st && st.state !== "unavailable"
            ? "var(--state-inactive-color)"
            : "var(--state-unavailable-color)")
        : explicitColor || "grey",
      icon: (first ? rule?.icon || explicitIcon : explicitIcon || rule?.icon) || null,
      fallbackIcon: fallbackIcon || "mdi:help-circle-outline",
      picture,
      label: ruleLabel || t(hass, "common.unavailable"),
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
    color: first
      ? v3Color(ent, model, st, rule?.color ?? null, explicitColor, safeColor(kindColor), now)
      : explicitColor ||
        rule?.color ||
        safeColor(kindColor) ||
        stateColor ||
        (offish ? "grey" : "primary"),
    icon: (first ? rule?.icon || explicitIcon : explicitIcon || rule?.icon) || null,
    fallbackIcon: fallbackIcon || "mdi:eye",
    picture,
    label: ruleLabel || null,
    tint: !!(rule && rule.tintCard),
    rule,
    style: rule?.style ?? null,
    pulse: !!rule?.pulse,
  };
};

// how long an entity has not reported, in ms, once that is longer than `staleMin` minutes (else
// null): its last report (Home Assistant's last_reported, also for an unchanged value), else its
// last update
export const staleAge = (
  st: HassEntity | undefined,
  staleMin: number | null,
  now: number,
): number | null => {
  if (staleMin === null || !st) return null;
  const at = (st as HassEntity & { last_reported?: string }).last_reported || st.last_updated;
  const t = new Date(at).getTime();
  if (Number.isNaN(t)) return null;
  const age = now - t;
  return age > staleMin * 60e3 ? age : null;
};

// the members of a group entity: the ids in its `entity_id` attribute (a light group, a group)
export const membersOf = (st: HassEntity | undefined): string[] => {
  const ids = st?.attributes?.entity_id;
  return Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string") : [];
};
