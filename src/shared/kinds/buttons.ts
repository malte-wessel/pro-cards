// The poster's and the tile's own buttons (`control: { type: buttons, options: [ … ] }`): each one
// an item with a badge's keys – its name, its value with unit and decimals, its icon, its colour and
// its rules – that runs or switches its entity, or runs its tap_action. A rule reads the button's
// value or an attribute of its own and sets the icon, the colour, the text (`value`), a pulse, and
// whether the button is filled (`active`). The entity cards keep their buttons of before
// (normalizeButtons in entity/config.ts).
import { warnDeprecatedKey } from "../card.ts";
import {
  normalizeAction,
  normalizeEntity,
  normalizeRules,
  type NormalizeCtx,
  type RawAction,
  type RawEntity,
  type RawRule,
} from "../entity/config.ts";
import { ITEM_DEFAULTS } from "../entity/constants.ts";
import type { CustomButton } from "../entity/control.ts";
import { normalizeVisibility } from "../visibility.ts";
import { isObj, textOf } from "./config.ts";

// the migration guide's section on a button's old keys
const ANCHOR = "button-keys";

// the keys a button does not take, and what to write instead
const GONE: Record<string, string> = {
  hold_action: "a button runs one action: tap_action (control: { confirm: true } holds it)",
  double_tap_action: "a button runs one action: tap_action",
  visual: "a button draws no visual",
  kind: "a button takes its entity's colours: kind is the card's",
};
// the keys a button's rule does not take
const RULE_GONE: Record<string, string> = {
  label: "label is value (the text in place of the value)",
  status: "status is value (the text in place of the value)",
  tint_card: "a button's rule tints no card (the card's own rules do)",
  visual: "a button's rule sets no visual",
  style: "a button has no style: active fills it",
};

const str = (v: unknown) => (typeof v === "string" && v ? v : null);

// a button's rules: `state`, `above`, `below` on its value or on its own `attribute`, each setting
// its icon (a name), colour, text (`value`, a template too), pulse and fill (`active`)
const buttonRules = (list: unknown, at: string, ctx: NormalizeCtx) => {
  if (list === undefined || list === null) return [];
  if (!Array.isArray(list)) throw new Error(`${ctx.type}: ${at}.rules must be a list`);
  const raws: RawRule[] = list.map((r: unknown, j) => {
    const here = `${ctx.type}: ${at}.rules[${j}]`;
    if (!isObj(r)) throw new Error(`${here} must be a rule: { state | above | below, … }`);
    for (const k of Object.keys(r))
      if (r[k] !== undefined && k in RULE_GONE) throw new Error(`${here}: ${RULE_GONE[k]}`);
    textOf(r.value, `${at}.rules[${j}].value`, ctx.type);
    if (r.icon !== undefined && r.icon !== null && typeof r.icon !== "string")
      throw new Error(`${here}: icon is an icon's name (mdi:…)`);
    if (r.active !== undefined && typeof r.active !== "boolean")
      throw new Error(`${here}: active is true or false`);
    if (r.attribute !== undefined && !str(r.attribute))
      throw new Error(`${here}: attribute is the name of one of the entity's attributes`);
    return {
      ...(r as RawRule),
      label: r.value === undefined || r.value === null ? null : String(r.value),
    };
  });
  return normalizeRules(raws);
};

// the buttons as written (null: none usable); `rowEntity` is the card's, which a condition without
// an entity of its own and without the button's reads
export const normalizeKindButtons = (
  list: unknown,
  ctx: NormalizeCtx,
  rowEntity: string | null,
): CustomButton[] | null => {
  if (!Array.isArray(list)) return null;
  const out: CustomButton[] = [];
  list.forEach((x: unknown, i) => {
    const at = `control.options[${i}]`;
    const here = `${ctx.type}: ${at}`;
    if (!isObj(x)) {
      console.warn(`${here} needs 'entity' or 'tap_action'`);
      return;
    }
    for (const k of Object.keys(x))
      if (x[k] !== undefined && k in GONE) throw new Error(`${here}: ${GONE[k]}`);
    // the 3.0 keys, read until 4.0: `label` is a name that shows, `action` the tap's
    const label = x.label === undefined || x.label === null ? null : x.label;
    if (label !== null) {
      if (x.name !== undefined || x.show_name !== undefined)
        throw new Error(`${here}: label is name with show_name: true: write name only`);
      warnDeprecatedKey(ctx.type, "a button's label", "write name with show_name: true", ANCHOR);
    }
    if (x.action !== undefined) {
      if (x.tap_action !== undefined)
        throw new Error(`${here}: action is tap_action: write tap_action only`);
      warnDeprecatedKey(ctx.type, "a button's action", "write tap_action", ANCHOR);
    }
    textOf(x.name ?? label, `${at}.name`, ctx.type, "name");
    textOf(x.value, `${at}.value`, ctx.type, "value");
    if (x.icon !== undefined && x.icon !== null && typeof x.icon !== "string")
      throw new Error(`${here}: icon is an icon's name (mdi:…)`);
    const a = x.tap_action ?? x.action;
    const action =
      a === undefined || a === null || a === ""
        ? null
        : normalizeAction(a as RawAction, { action: "none" });
    const entity = str(x.entity);
    if (!entity && !action) {
      console.warn(`${here} needs 'entity' or 'tap_action'`);
      return;
    }
    const value = x.value === null ? undefined : x.value;
    // a button shows its icon alone unless it says more: a written value shows, as a label did
    const item = normalizeEntity(
      {
        entity,
        name: (x.name ?? label) as string | null | undefined,
        attribute: x.attribute as string | null | undefined,
        // (no entity: a blank value, nothing to read)
        value: value ?? (entity ? undefined : ""),
        unit: x.unit as string | null | undefined,
        decimals: x.decimals,
        prefix: x.prefix,
        suffix: x.suffix,
        icon: str(x.icon),
        color: str(x.color),
        show_name: typeof x.show_name === "boolean" ? x.show_name : label !== null,
        show_value: typeof x.show_value === "boolean" ? x.show_value : value !== undefined,
      } as RawEntity,
      ctx,
      at,
      ITEM_DEFAULTS.button,
    );
    item.rules = buttonRules(x.rules, at, ctx);
    // its colour and icon are defaults: a matching rule's win; a rule's text is its value
    item.ruleWins = true;
    item.valueRules = true;
    // its attribute as Home Assistant writes it ("75 %", "21.6 °C")
    item.haAttribute = true;
    out.push({
      entity,
      icon: str(x.icon),
      label: null,
      color: str(x.color),
      action,
      visibility: normalizeVisibility(x.visibility, {
        type: ctx.type,
        label: at,
        entity: entity ?? rowEntity,
      }),
      item,
    });
  });
  return out.length ? out : null;
};
