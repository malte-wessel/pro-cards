// A poster's second value (pure): another value beside the card's, smaller and in the secondary
// colour (a thermostat's target beside its temperature). Written as an entity id, or as a badge's
// value keys; without an entity it reads the card's (`aside: { attribute: temperature }`). It is
// an item of the card's own (an index into its entities, drawn in the value's line, not a row),
// so it follows its entity and its template as any item does.
import {
  normalizeEntity,
  type EntityItem,
  type NormalizeCtx,
  type RawEntity,
} from "../shared/entity/config.ts";
import { ITEM_DEFAULTS } from "../shared/entity/constants.ts";
import { isObj } from "../shared/kinds/config.ts";

// what it takes: what it reads and how its value is written; no colour, rules or actions of its
// own (it is the card's quiet companion)
export const ASIDE_KEYS = [
  "entity",
  "attribute",
  "value",
  "unit",
  "decimals",
  "format",
  "prefix",
  "icon",
] as const;

// `aside` as written: false (none, the kind's neither), left out (the kind's, where it has one),
// or the item; `entity` is the card's, read where the aside names none
export const normalizeAside = (
  raw: unknown,
  ctx: NormalizeCtx,
  entity: string | null,
): EntityItem | false | null => {
  const at = `${ctx.type}: aside`;
  if (raw === undefined || raw === null) return null;
  if (raw === false) return false;
  if (raw === true) throw new Error(`${at} takes an entity id, { entity, attribute, … } or false`);
  const o: Record<string, unknown> =
    typeof raw === "string" ? { entity: raw } : isObj(raw) ? { ...raw } : {};
  if (typeof raw !== "string" && !isObj(raw))
    throw new Error(`${at} takes an entity id, { entity, attribute, … } or false`);
  for (const [k, v] of Object.entries(o))
    if (v !== undefined && !(ASIDE_KEYS as readonly string[]).includes(k))
      throw new Error(`${at} takes ${ASIDE_KEYS.join(", ")}, not ${k}`);
  if (o.icon !== undefined && (typeof o.icon !== "string" || !o.icon))
    throw new Error(`${at}: icon must be an icon's name (mdi:…)`);
  // without an entity: the card's attribute, or a value of its own (a template); never the card's
  // own value again
  if (!o.entity && o.attribute === undefined && o.value === undefined)
    throw new Error(`${at} needs an entity, or the card's attribute or a value of its own`);
  if (!o.entity && entity && o.value === undefined) o.entity = entity;
  const ent = normalizeEntity(o as RawEntity, ctx, "aside", ITEM_DEFAULTS.other, {
    buttons: false,
    name: "a poster's aside",
  });
  // nothing of its own besides its value: no visual, rules, control or actions
  ent.visual = "icon";
  ent.rules = [];
  ent.control = null;
  return ent;
};
