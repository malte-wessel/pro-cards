// Which kind a card draws (pure): the poster type as written (`poster`), else detected from the
// entity, first match wins: the domain (or the entity id: sun.sun), the device class, else
// `entity`. An entity has one domain and at most one device class, so detection is never
// ambiguous. The keys a kind takes never decide it.
import { domainOf } from "../color.ts";
import type { HassEntity } from "../ha.ts";
import { KIND_NAMES, KINDS } from "./registry.ts";
import type { Kind } from "./types.ts";

// `poster` as written: a type's name (null: none written, detect it)
export const parsePoster = (raw: unknown, cardType: string): string | null => {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "string" || !(raw in KINDS))
    throw new Error(
      `${cardType}: poster must be one of ${KIND_NAMES.join(" | ")}, not ${JSON.stringify(raw)}`,
    );
  return raw;
};

// the kind the entity is, by its domain, id and device class
export const detectKind = (entity: string | null, st: HassEntity | undefined): Kind => {
  if (!entity) return KINDS.entity;
  const d = domainOf(entity);
  for (const k of Object.values(KINDS))
    if (k.ids?.includes(entity) || k.domains?.includes(d)) return k;
  const dc = st?.attributes?.device_class;
  if (typeof dc === "string")
    for (const k of Object.values(KINDS)) if (k.deviceClasses?.includes(dc)) return k;
  return KINDS.entity;
};

// whether a kind reads the entity (or the lack of one)
export const canRead = (k: Kind, entity: string | null) =>
  k.reads === "any" || (entity ? k.reads.includes(domainOf(entity)) : !!k.entityless);

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
      `${cardType}: the ${kind.name} poster reads ${kind.readsText}, not ${entity ?? "a card without an entity"}`,
    );
  return kind;
};

// every kind's own keys on the card
const ALL_KEYS = new Set(Object.values(KINDS).flatMap((k) => k.keys));

// the keys of other kinds the card sets that `kind` does not take (left out), as written
export const unusedKeys = (kind: Kind, raw: Record<string, unknown>): string[] =>
  Object.keys(raw).filter((k) => ALL_KEYS.has(k) && raw[k] !== undefined && !kind.keys.includes(k));
