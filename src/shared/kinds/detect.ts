// Which kind a card draws (pure): `kind` as written, else detected from the entity, first match
// wins: the domain (or the entity id: sun.sun), the device class, else `entity`.
// An entity has one domain and at most one device class, so detection is never ambiguous.
import { domainOf } from "../color.ts";
import type { HassEntity } from "../ha.ts";
import { KIND_NAMES, KINDS } from "./registry.ts";
import type { Kind, KindSpec } from "./types.ts";

// `kind` as written: a name, or an object with an optional `type` and the kind's keys
export const parseKind = (raw: unknown, cardType: string): KindSpec => {
  if (raw === undefined || raw === null) return { type: null, opts: {} };
  const known = (t: unknown): t is string => typeof t === "string" && t in KINDS;
  if (typeof raw === "string") {
    if (!known(raw))
      throw new Error(`${cardType}: kind must be one of ${KIND_NAMES.join(" | ")}, not '${raw}'`);
    return { type: raw, opts: {} };
  }
  if (typeof raw !== "object" || Array.isArray(raw))
    throw new Error(`${cardType}: kind must be a name or an object`);
  const { type, ...opts } = raw as Record<string, unknown>;
  if (type !== undefined && !known(type))
    throw new Error(`${cardType}: kind.type must be one of ${KIND_NAMES.join(" | ")}`);
  return { type: (type as string | undefined) ?? null, opts };
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

// the kind a card draws: the written one (checked against the entity), else the one whose keys
// `kind: { … }` names among those that read the entity, else the detected one. A key the kind does
// not take is left out with a warning (a config error only where the kind is written).
export const resolveKind = (
  spec: KindSpec,
  entity: string | null,
  st: HassEntity | undefined,
  cardType: string,
): Kind => {
  const keys = Object.keys(spec.opts);
  let kind: Kind;
  if (spec.type) {
    kind = KINDS[spec.type];
    if (!canRead(kind, entity))
      throw new Error(
        `${cardType}: kind '${kind.name}' reads ${kind.readsText}, not ${entity ?? "a card without an entity"}`,
      );
    const unknown = keys.filter((k) => !kind.keys.includes(k));
    if (unknown.length)
      throw new Error(
        `${cardType}: kind '${kind.name}' takes ${kind.keys.length ? kind.keys.join(", ") : "no keys"}, not ${unknown.join(", ")}`,
      );
    return kind;
  }
  const detected = detectKind(entity, st);
  if (keys.length && !keys.every((k) => detected.keys.includes(k))) {
    const fits = Object.values(KINDS).filter(
      (k) => k.reads !== "any" && canRead(k, entity) && keys.every((key) => k.keys.includes(key)),
    );
    if (fits.length === 1) return fits[0];
  }
  // before the first state the device class is not known yet: no warning until it is
  const unknown = keys.filter((k) => !detected.keys.includes(k));
  if (unknown.length && (st || !entity))
    console.warn(`${cardType}: kind '${detected.name}' takes no ${unknown.join(", ")}; left out`);
  return detected;
};
