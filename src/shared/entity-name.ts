// An entity's name as Home Assistant composes it: `name` a text (or a template), or the parts of
// its name in Home Assistant's registries – `[{ type: area }, { type: entity }]`, a part of your
// own `{ type: text, text: … }` – as its own cards take them (since 2026.11 an entity's friendly
// name is its device's and its own). The parts are joined by Home Assistant's
// `hass.formatEntityName`, so a card writes what its tile would.
import type { HassEntity, HomeAssistant } from "./ha.ts";

export const NAME_TYPES = ["floor", "area", "parent_device", "device", "entity"] as const;
export type NameItem = { type: (typeof NAME_TYPES)[number] } | { type: "text"; text: string };
// a name as a card keeps it: a text (or a template), or its parts
export type EntityName = string | NameItem[];

const isItem = (v: unknown): v is NameItem => {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const o = v as Record<string, unknown>;
  if (o.type === "text") return typeof o.text === "string";
  return (NAME_TYPES as readonly unknown[]).includes(o.type);
};

// `name` as written: a text stays, an item is a list of one, a list its items; anything else is
// an error naming where it is (`where`: "custom:tile-card-pro: the card")
export const normalizeName = (raw: unknown, where: string): EntityName | null => {
  if (raw === undefined || raw === null) return null;
  if (typeof raw === "string") return raw;
  if (typeof raw === "number") return String(raw);
  const list = Array.isArray(raw) ? raw : [raw];
  const bad = list.find((i) => !isItem(i));
  if (bad !== undefined)
    throw new Error(
      `${where}: name must be a text, a template or Home Assistant's parts of a name ` +
        `({ type: ${[...NAME_TYPES, "text"].join(" | ")} }, a text with its text), ` +
        `not ${JSON.stringify(bad)}`,
    );
  return list as NameItem[];
};

// the name a series or a node draws: its own (a text, or its parts composed), else the entity's
// friendly name, else `fallback` (its id)
export const nameFor = (
  hass: HomeAssistant | undefined,
  st: HassEntity | undefined,
  name: EntityName | null | undefined,
  fallback: string,
): string =>
  (Array.isArray(name) ? composedName(hass, st, name) : name) ||
  String(st?.attributes?.friendly_name ?? "") ||
  fallback;
// the parts of a name joined: by Home Assistant where it has the entity, else the parts of your
// own alone, else null (the card's default name stands)
export const composedName = (
  hass: HomeAssistant | undefined,
  st: HassEntity | undefined,
  parts: NameItem[],
): string | null => {
  if (st && typeof hass?.formatEntityName === "function") {
    try {
      const s = hass.formatEntityName(st, parts);
      if (s) return s;
    } catch {
      // the parts of your own below
    }
  }
  const own = parts.flatMap((p) => (p.type === "text" ? [p.text] : []));
  return own.length === parts.length && own.length ? own.join(" ") : null;
};
