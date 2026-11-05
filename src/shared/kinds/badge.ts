// A badge of the v3 cards (pure): the poster's corner, the tile's badges, the tile group's and the
// heading card's. It is written as the cards are: an icon place (`icon`: a name, `{ type: icon |
// image | dot, … }` or false), a visual after the value (`visual`: bar, sparkline, trend), a
// switch (`control: toggle`), rules whose colour and icon win over the badge's (their text is a
// `value`), and its entity's kind, of which it takes the colours alone (its rules without their
// texts, where it shows the entity's state, and its colour from the state). The pill order is
// fixed: icon, name, value, visual, switch. The entity cards' badges keep their old keys
// (normalizeBadge in src/shared/entity/config.ts); a key of those here is an error that names the
// new spelling.
import {
  normalizeEntity,
  normalizeRules,
  type BadgeIcon,
  type BadgeKindLook,
  type EntityItem,
  type NormalizeCtx,
  type RawEntity,
  type RawEntityInput,
  type Rule,
} from "../entity/config.ts";
import {
  BADGE_SIZES,
  BADGE_STYLES,
  DEFAULTS,
  ITEM_DEFAULTS,
  type BadgeSize,
  type BadgeStyle,
} from "../entity/constants.ts";
import { parseImage } from "../entity/image.ts";
import type { HassEntity } from "../ha.ts";
import { oneOf } from "../util.ts";
import { textOf } from "./config.ts";
import { detectKind, parseKind, resolveKind } from "./detect.ts";
import { optionsOf } from "./places.ts";
import { KINDS } from "./registry.ts";
import { toRule } from "./rules.ts";
import type { Kind } from "./types.ts";

const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const val = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v) : "…");

// ----- the icon place -----

const ICON_THINGS = ["icon", "image", "dot"] as const;
type IconThing = (typeof ICON_THINGS)[number];
const ICON_OPTIONS: Record<IconThing, readonly string[]> = {
  icon: ["name", "ring"],
  // its name: the icon while there is no picture
  image: ["src", "name", "ring"],
  // a dot in the icon's place, the badge's colour
  dot: [],
};
interface IconWritten {
  type?: IconThing;
  name?: string;
  ring?: boolean;
  src?: string;
}
// `icon` as written: a name, the thing and its options, or false
const parseIcon = (raw: unknown, at: string): IconWritten | false | undefined => {
  if (raw === undefined || raw === null) return undefined;
  if (raw === false) return false;
  if (typeof raw === "string") {
    if (!raw) throw new Error(`${at}: an icon's name must not be empty`);
    return { type: "icon", name: raw };
  }
  if (!isObj(raw)) throw new Error(`${at} takes an icon's name, { type, … } or false`);
  const type = raw.type;
  if (type !== undefined && !oneOf(ICON_THINGS, type))
    throw new Error(
      `${at}: type must be one of ${ICON_THINGS.join(", ")}, not ${JSON.stringify(type)}`,
    );
  const opts = optionsOf(raw, type ? ICON_OPTIONS[type] : ["name", "ring", "src"], at, type, false);
  return { ...(type ? { type } : {}), ...opts } as IconWritten;
};
// an object without a type merges onto the place below: a src only onto a picture
const srcFits = (below: BadgeIcon, over: IconWritten | false | undefined, at: string) => {
  if (over && !over.type && over.src !== undefined && below.type !== "image")
    throw new Error(`${at}: src is a picture's: icon: { type: image, src: ${over.src} }`);
};
const ICON: BadgeIcon = { type: "icon", ring: false, src: null };
// a place over the one below: false empties it, another thing replaces it (a ring stays where the
// new thing draws one), options merge onto it
const iconOver = (base: BadgeIcon, over: IconWritten | false | undefined): BadgeIcon => {
  if (over === undefined) return base;
  if (over === false) return { type: "none", ring: false, src: null };
  const type = over.type ?? (base.type === "none" ? "icon" : base.type);
  const rings = type === "icon" || type === "image";
  const src = over.src !== undefined ? parseImage(over.src) || null : null;
  return {
    type,
    ring: rings && (over.ring ?? base.ring),
    src: type === "image" ? (src ?? (base.type === "image" ? base.src : null)) : null,
  };
};

// ----- the visual -----

const VISUALS = ["bar", "sparkline", "trend"] as const;
type VisualThing = (typeof VISUALS)[number];
const VISUAL_OPTIONS: Record<VisualThing, readonly string[]> = {
  bar: [],
  sparkline: ["hours"],
  trend: ["hours"],
};
// the old words: the icon's now, or a value
const OLD_VISUALS: Record<string, (entity: string | null) => string> = {
  ring: () => "visual: ring is icon: { ring: true }",
  dot: () => "visual: dot is icon: { type: dot }",
  icon: () => "visual: icon is left out: a badge draws its icon unless icon: false",
  badge: () => "visual: badge is style: soft",
  count: (e) =>
    `visual: count is a template in value: "{{ expand('${e ?? "group.…"}') | selectattr('state', 'eq', 'on') | list | count }}"`,
  none: () => "visual: none is false (no visual)",
};
export const parseBadgeVisual = (
  raw: unknown,
  at: string,
  entity: string | null,
): { type: VisualThing; hours?: number | "today" } | null => {
  if (raw === undefined || raw === null || raw === false) return null;
  const word = typeof raw === "string" ? raw : isObj(raw) ? raw.type : undefined;
  if (typeof word === "string" && word in OLD_VISUALS)
    throw new Error(`${at}: ${OLD_VISUALS[word](entity)}`);
  if (typeof raw === "string") {
    if (!oneOf(VISUALS, raw))
      throw new Error(`${at} must be one of ${VISUALS.join(", ")} or false, not ${raw}`);
    return { type: raw };
  }
  if (!isObj(raw)) throw new Error(`${at} takes a visual's name, { type, … } or false`);
  if (!oneOf(VISUALS, raw.type))
    throw new Error(
      `${at}: type must be one of ${VISUALS.join(", ")}, not ${JSON.stringify(raw.type)}`,
    );
  const opts = optionsOf(raw, VISUAL_OPTIONS[raw.type], at, raw.type, false);
  return { type: raw.type, ...(opts as { hours?: number | "today" }) };
};

// ----- the keys a badge no longer takes -----

const GONE: Record<string, (v: unknown) => string> = {
  show_icon: (v) =>
    v === false
      ? "show_icon: false is icon: false"
      : "show_icon is gone: the icon shows unless icon: false",
  show_entity_picture: (v) =>
    v === false
      ? "show_entity_picture is gone: the icon shows unless icon: { type: image }"
      : "show_entity_picture: true is icon: { type: image }",
  icon_style: () => "icon_style is gone: a badge's icon has no circle",
  trend_hours: (v) => `trend_hours: ${val(v)} is visual: { type: trend, hours: ${val(v)} }`,
  toggle: () => "toggle is control: toggle",
  control_position: () => "control_position is gone: a badge's switch sits at its end",
  control_attribute: () => "control_attribute is gone: a badge's control is a switch",
  control_step: () => "control_step is gone: a badge's control is a switch",
  control_options: () => "control_options is gone: a badge's control is a switch",
  control_confirm: () => "control_confirm is gone: a badge's switch does not confirm",
  secondary: () => "secondary is gone: a badge has no second line",
  name_position: () => "name_position is gone: the name is before the value",
  inputs: () => "inputs is the card's: a badge takes its kind's colours alone",
  running_above: () => "running_above is the card's: a badge takes its kind's colours alone",
  series: () => "series is the card's: a badge takes its kind's colours alone",
  status: () => "status is the card's: a badge's rules write its text as value",
};
const RULE_GONE: Record<string, string> = {
  label: "label is value (the text in place of the value)",
  status: "status is value (the text in place of the value)",
  tint_card: "a badge's rule tints no card (the card's own rules do)",
  visual: "a badge's rule sets no visual",
};

// the control: a switch, or none
const parseControl = (raw: unknown, at: string): "toggle" | null => {
  if (raw === undefined || raw === null || raw === false) return null;
  if (raw === "toggle") return "toggle";
  if (isObj(raw) && raw.type === "toggle") {
    if (raw.confirm !== undefined)
      throw new Error(`${at}: a badge's switch does not confirm: control: toggle`);
    const other = Object.keys(raw).find((k) => k !== "type" && raw[k] !== undefined);
    if (other) throw new Error(`${at}: a badge's switch takes no options, not ${other}`);
    return "toggle";
  }
  const what = isObj(raw) ? (raw.type ?? "options") : raw === true ? "auto" : raw;
  throw new Error(
    `${at}: a badge holds only a switch: control takes toggle or false, not ${val(what)}`,
  );
};

// ----- the kind -----

// a kind's rules as a badge takes them: no texts (a badge shows its value), no tint (a badge
// tints no card); one list per kind
const KIND_RULES = new WeakMap<Kind, Rule[]>();
const rulesOf = (k: Kind): Rule[] => {
  let r = KIND_RULES.get(k);
  if (!r) {
    r = (k.rules ?? []).map((x) => {
      const { labelKey: _key, ...rule } = toRule(x);
      void _key;
      return { ...rule, tintCard: false };
    });
    KIND_RULES.set(k, r);
  }
  return r;
};
// the badge's kind for a state: the written one, else the entity's (detected: its device class
// is in the state); none, or one that gives a badge nothing: null
const kindLookOf =
  (written: Kind | null, off: boolean, entity: string | null) =>
  (st: HassEntity | undefined): BadgeKindLook | null => {
    if (off) return null;
    const k = written ?? detectKind(entity, st);
    if (k === KINDS.none) return null;
    const rules = rulesOf(k);
    const color = k.stateColor?.(st) ?? null;
    if (!rules.length && !color) return null;
    return { rules, ...(k.ruleUnit ? { ruleUnit: k.ruleUnit } : {}), color };
  };

// ----- the badge -----

// one badge, its pill and size where it names none from `defaults` (the card's); `label` names it
// in messages (badges[2]), `where` the place in warnings
export const normalizePill = (
  raw: RawEntityInput | null | undefined,
  ctx: NormalizeCtx,
  label: string,
  defaults: { style: BadgeStyle; size: BadgeSize },
  where: string,
): EntityItem => {
  const o: Record<string, unknown> =
    typeof raw === "string" ? { entity: raw } : isObj(raw) ? { ...raw } : {};
  const at = `${ctx.type}: ${label}`;
  for (const k of Object.keys(o))
    if (o[k] !== undefined && k in GONE) throw new Error(`${at}: ${GONE[k](o[k])}`);
  // a word YAML reads as a boolean (On, Off unquoted) is no text
  textOf(o.name, `${label}.name`, ctx.type, "name");
  textOf(o.value, `${label}.value`, ctx.type, "value");
  for (const [k, list] of [
    ["style", BADGE_STYLES],
    ["size", BADGE_SIZES],
  ] as const)
    if (o[k] !== undefined && o[k] !== null && !oneOf(list, o[k]))
      throw new Error(`${at}: ${k} must be one of ${list.join(", ")}, not ${val(o[k])}`);
  const entity = typeof o.entity === "string" && o.entity ? o.entity : null;

  const visual = parseBadgeVisual(o.visual, `${at}.visual`, entity);
  const icon = parseIcon(o.icon, `${at}.icon`);
  const control = parseControl(o.control, `${at}.control`);

  // the rules: each with its icon place merged over the badge's
  srcFits(ICON, icon, `${at}.icon`);
  const base = iconOver(ICON, icon);
  const ruleIcons = new Map<Rule, BadgeIcon>();
  const rules: Rule[] = [];
  if (o.rules !== undefined && !Array.isArray(o.rules))
    throw new Error(`${at}.rules must be a list`);
  ((o.rules as unknown[] | undefined) ?? []).forEach((r, i) => {
    if (!isObj(r))
      throw new Error(`${at}.rules[${i}] must be a rule: { state | above | below, … }`);
    for (const k of Object.keys(r))
      if (r[k] !== undefined && k in RULE_GONE)
        throw new Error(`${at}.rules[${i}]: ${RULE_GONE[k]}`);
    textOf(r.value, `${label}.rules[${i}].value`, ctx.type);
    if (r.style !== undefined && r.style !== null && !oneOf(BADGE_STYLES, r.style))
      throw new Error(
        `${at}.rules[${i}]: style must be one of ${BADGE_STYLES.join(", ")}, not ${val(r.style)}`,
      );
    const place = parseIcon(r.icon, `${at}.rules[${i}].icon`);
    srcFits(base, place, `${at}.rules[${i}].icon`);
    const [rule] = normalizeRules([
      {
        ...r,
        icon: place && place.name ? place.name : null,
        label: r.value === undefined || r.value === null ? null : String(r.value),
      },
    ]);
    if (!rule) return;
    if (place !== undefined) ruleIcons.set(rule, iconOver(base, place));
    rules.push(rule);
  });

  // the kind: the written one (checked against the entity), none, or the entity's
  const kindName = parseKind(o.kind, ctx.type);
  const written =
    kindName && kindName !== "none" ? resolveKind(kindName, entity, undefined, ctx.type) : null;

  const rest: RawEntity = { ...(o as RawEntity) };
  delete rest.visual;
  delete rest.rules;
  delete (rest as Record<string, unknown>).kind;
  rest.icon = icon && icon.name ? icon.name : undefined;
  rest.control = control ?? undefined;
  const ent = normalizeEntity(rest, ctx, label, ITEM_DEFAULTS.header, {
    buttons: false,
    name: where,
    header: true,
  });
  ent.rules = rules;
  ent.ruleWins = true;
  // what the pill draws after the value, over its own window
  const hours = visual?.hours ?? (visual?.type === "trend" ? 1 : 24);
  ent.visual = visual?.type ?? "icon";
  // a badge is a button, as Home Assistant's: it answers the pointer unless the badge or the card
  // says hover: false
  if (typeof o.hover !== "boolean") ent.hover = ctx.hover || !ctx.hoverOff;
  ent.badge = {
    style: (o.style as BadgeStyle | undefined) ?? defaults.style,
    size: (o.size as BadgeSize | undefined) ?? defaults.size,
  };
  ent.pill = {
    icon: base,
    ruleIcons,
    hours,
    ownRules: Array.isArray(o.rules),
    kindOf: kindLookOf(written, kindName === "none", entity),
  };
  return ent;
};

// a card's badges (left out: none)
export const normalizePills = (
  list: unknown,
  ctx: NormalizeCtx,
  label: string,
  defaults: { style: BadgeStyle; size: BadgeSize },
  where: string,
): EntityItem[] => {
  if (list === undefined || list === null) return [];
  if (!Array.isArray(list)) throw new Error(`${ctx.type}: ${label} must be a list`);
  return list.map((b, i) =>
    normalizePill(b as RawEntityInput, ctx, `${label}[${i}]`, defaults, where),
  );
};

// the history the badges draw, in hours (a sparkline's or a trend's window; today: a day); 0: none
export const badgeHours = (items: readonly EntityItem[]): number =>
  Math.max(
    0,
    ...items
      .filter((e) => e.pill && e.entity && (e.visual === "sparkline" || e.visual === "trend"))
      .map((e) => (e.pill?.hours === "today" ? 24 : (e.pill?.hours ?? 0))),
  );

// the history window of a card whose items are badges alone (the heading, the tile group's
// header): the longest a badge draws; each draws its own
export const badgeWindow = (items: readonly EntityItem[]) => ({
  hours: Math.max(1, badgeHours(items)),
  bucketMin: DEFAULTS.bucket_minutes,
  smoothMin: null,
});
