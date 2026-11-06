// Which kind a card draws (pure): the kind as written (`kind`), else detected from the entity,
// first match wins: the domain (or the entity id: sun.sun), the device class, else
// `entity`. An entity has one domain and at most one device class, so detection is never
// ambiguous. The keys a kind takes never decide it.
import { domainOf } from "../color.ts";
import type { HassEntity } from "../ha.ts";
import { KIND_NAMES, KINDS } from "./registry.ts";
import { oneOf } from "../util.ts";
import { COVER_VARIANTS } from "./places.ts";
import type { Kind } from "./types.ts";

// `kind` as written: a kind's name (null: none written, detect it)
export const parseKind = (raw: unknown, cardType: string): string | null => {
  if (raw === undefined || raw === null) return null;
  if (raw === "entity") throw new Error(`${cardType}: kind: entity is kind: none`);
  // a cover's look is its visual's variant
  if (typeof raw === "string" && oneOf(COVER_VARIANTS, raw))
    throw new Error(`${cardType}: kind: ${raw} is visual: { type: cover, variant: ${raw} }`);
  if (typeof raw !== "string" || !(raw in KINDS))
    throw new Error(
      `${cardType}: kind must be one of ${KIND_NAMES.join(" | ")}, not ${JSON.stringify(raw)}`,
    );
  return raw;
};

// whether a kind reads the entity (or the lack of one)
export const canRead = (k: Kind, entity: string | null) =>
  k.reads === "any" || (entity ? k.reads.includes(domainOf(entity)) : !!k.entityless);

// the kind the entity is, by its domain, id and device class (of a domain the kind reads: a
// binary sensor of class battery is no battery poster)
export const detectKind = (entity: string | null, st: HassEntity | undefined): Kind => {
  if (!entity) return KINDS.none;
  const d = domainOf(entity);
  for (const k of Object.values(KINDS))
    if (k.ids?.includes(entity) || k.domains?.includes(d)) return k;
  const dc = st?.attributes?.device_class;
  if (typeof dc === "string")
    for (const k of Object.values(KINDS))
      if (k.deviceClasses?.includes(dc) && canRead(k, entity)) return k;
  return KINDS.none;
};

// the kind a card draws: the written one (checked against the entity), else the detected one
export const resolveKind = (
  name: string | null,
  entity: string | null,
  st: HassEntity | undefined,
  cardType: string,
): Kind => {
  if (!name) return detectKind(entity, st);
  const kind = KINDS[name];
  if (!canRead(kind, entity))
    throw new Error(
      `${cardType}: the ${kind.name} kind reads ${kind.readsText}, not ${entity ?? "a card without an entity"}`,
    );
  return kind;
};

// every kind's own keys on the card
const ALL_KEYS = new Set(Object.values(KINDS).flatMap((k) => k.keys));
// the entities a kind reads besides the card's own: keys of the card's `inputs`; a kind's other
// keys (an appliance's running_above, a trend's series) sit on the card
export const INPUT_KEYS: ReadonlySet<string> = new Set(
  Object.values(KINDS).flatMap((k) => (k.inputs ?? []).map((d) => d.key)),
);
// the card's `inputs` as written (none: empty)
export const writtenInputs = (raw: Readonly<Record<string, unknown>>): Record<string, unknown> => {
  const i = raw.inputs;
  return i && typeof i === "object" && !Array.isArray(i) ? (i as Record<string, unknown>) : {};
};
// the keys a kind reads, as a card writes them: its inputs' among the card's own
export const kindKeysOf = (raw: Readonly<Record<string, unknown>>): Record<string, unknown> => ({
  ...raw,
  ...writtenInputs(raw),
});
// what `who` (the wind kind, a poster without a kind) says of keys it does not read, with the
// inputs it does
export const unusedText = (kind: Kind, unused: readonly string[], who: string) => {
  const own = (kind.inputs ?? []).map((d) => d.key);
  const keys = unused.map((k) => (INPUT_KEYS.has(k) ? `inputs: ${k}` : k));
  return `${who} reads no ${keys.join(", ")}${own.length && unused.some((k) => INPUT_KEYS.has(k)) ? ` (its inputs: ${own.join(", ")})` : ""}`;
};

// the keys of other kinds the card sets that `kind` does not take (left out), as written
export const unusedKeys = (kind: Kind, raw: Record<string, unknown>): string[] =>
  Object.keys(raw).filter((k) => ALL_KEYS.has(k) && raw[k] !== undefined && !kind.keys.includes(k));

// the entity a new card starts on (the card picker's stub): one with a kind of its own (a light, a
// thermostat, the weather …) among those offered, else a number, else the first
const STUB_KINDS = [
  "light",
  "climate",
  "weather",
  "fan",
  "media_player",
  "cover",
  "lock",
  "battery",
];
export const stubEntity = (
  hass: { states: Record<string, HassEntity> } | undefined,
  entities: readonly string[] | undefined,
): string => {
  const ids = entities?.length ? entities : Object.keys(hass?.states ?? {});
  const kindOf = (id: string) => detectKind(id, hass?.states[id]).name;
  for (const k of STUB_KINDS) {
    const found = ids.find((id) => hass?.states[id] && kindOf(id) === k);
    if (found) return found;
  }
  const num = ids.find((id) => {
    const v = hass?.states[id]?.state;
    return id.startsWith("sensor.") && v !== undefined && v !== "" && Number.isFinite(Number(v));
  });
  return num ?? ids[0] ?? "";
};
