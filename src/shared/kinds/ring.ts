// The ring around an icon (pure): `ring: true` draws the item's own value between its min and max;
// an entity id, or `{ entity, attribute, min, max, color }`, draws another entity's value on that
// entity's scale (its own min and max attributes, or min_value and max_value, else 0 to 100), in the item's colour unless the
// ring names one. A rule may switch the ring on and off and colour it, never name another entity:
// what the ring reads is the card's (as a rule names no plot's src).
import type { RingSource } from "../entity/ring.ts";

export interface RingPlace {
  entity?: string;
  attribute?: string;
  min?: number;
  max?: number;
  color?: string;
}
export type RingWritten = boolean | RingPlace;

const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const isEntityId = (v: unknown): v is string => typeof v === "string" && /^\w+\.\w+$/.test(v);
const OPTIONS = ["entity", "attribute", "min", "max", "color"];
const isPlace = (r: RingWritten | undefined): r is RingPlace => typeof r === "object" && r !== null;

// `ring` as written: true or false, an entity id, or its options; `at` names it in messages
export const parseRing = (v: unknown, at: string, rule = false): RingWritten => {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    if (!isEntityId(v))
      throw new Error(`${at}: ring takes true, false, an entity id or { entity, … }`);
    if (rule) throw new Error(`${at}: a rule's ring reads no other entity (it is the card's)`);
    return { entity: v };
  }
  if (!isObj(v)) throw new Error(`${at}: ring takes true, false, an entity id or { entity, … }`);
  const out: RingPlace = {};
  for (const [k, x] of Object.entries(v)) {
    if (x === undefined || x === null) continue;
    if (!OPTIONS.includes(k))
      throw new Error(`${at}: a ring takes ${OPTIONS.join(", ")}, not ${k}`);
    if (rule && k !== "color")
      throw new Error(
        `${at}: a rule's ring sets its colour alone, not ${k} (what it reads is the card's)`,
      );
    if (k === "entity") {
      if (!isEntityId(x)) throw new Error(`${at}: a ring's entity must be an entity id`);
      out.entity = x;
    } else if (k === "attribute" || k === "color") {
      if (typeof x !== "string" || !x) throw new Error(`${at}: a ring's ${k} must be a text`);
      if (k === "color" && x.includes("{{"))
        throw new Error(`${at}: a ring's color is a colour (a name or a hex), not a template`);
      out[k] = x;
    } else {
      if (typeof x !== "number" || !Number.isFinite(x))
        throw new Error(`${at}: a ring's ${k} must be a number`);
      out[k as "min" | "max"] = x;
    }
  }
  if (
    !out.entity &&
    (out.attribute !== undefined || out.min !== undefined || out.max !== undefined)
  )
    throw new Error(
      `${at}: a ring's attribute, min and max are another entity's: name it (ring: { entity, … }); the card's own value uses the card's min and max`,
    );
  if (out.min !== undefined && out.max !== undefined && !(out.min < out.max))
    throw new Error(`${at}: a ring's min must be below its max`);
  return out;
};

// a ring over the one below: false turns it off, true keeps what the one below reads (or the
// item's own value), options merge onto it
export const ringOver = (
  base: RingWritten | undefined,
  over: RingWritten | undefined,
): RingWritten | undefined => {
  if (over === undefined) return base;
  if (over === false) return false;
  const below = isPlace(base) ? base : {};
  if (over === true) return isPlace(base) ? base : true;
  return { ...below, ...over };
};

export const ringOn = (r: RingWritten | undefined) => r !== undefined && r !== false;
// the other entity a ring reads (null: the item's own value)
export const ringSourceOf = (r: RingWritten | undefined): RingSource | null =>
  isPlace(r) && r.entity
    ? { entity: r.entity, attribute: r.attribute ?? null, min: r.min ?? null, max: r.max ?? null }
    : null;
export const ringColorOf = (r: RingWritten | undefined): string | null =>
  isPlace(r) && r.color ? r.color : null;
