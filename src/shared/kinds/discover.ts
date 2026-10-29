// What a kind finds next to its entity (pure): the entities on the same device, and one input
// among them: by device class first, by the integration's `translation_key` where that cannot tell
// two apart. Two candidates left: none, never a guess.
import { domainOf } from "../color.ts";
import type { HomeAssistant } from "../ha.ts";

// the slice of hass discovery reads
export type Registry = Pick<HomeAssistant, "states" | "entities" | "devices" | "areas">;

// how an input is found among the candidates
export interface Finder {
  domains: readonly string[];
  deviceClasses?: readonly string[];
  // the unit a candidate without a device class may report instead (a wind direction in °)
  unit?: string;
  // what the integration's own name for it says (a gust, the day's total)
  translationKey?: RegExp;
  // the key has to match even when one candidate is left (a gust beside the speed)
  needsKey?: boolean;
}

// the entities on the device of `id` (not `id` itself, not hidden)
export const deviceSiblings = (reg: Registry, id: string): string[] => {
  const device = reg.entities?.[id]?.device_id;
  if (!device || !reg.entities) return [];
  return Object.values(reg.entities)
    .filter((e) => e.device_id === device && e.entity_id !== id && !e.hidden)
    .map((e) => e.entity_id);
};

// the one entity among `ids` that fits `f`, else null
export const findInput = (reg: Registry, ids: readonly string[], f: Finder): string | null => {
  const dcOf = (id: string) => reg.states[id]?.attributes?.device_class;
  const unitOf = (id: string) => reg.states[id]?.attributes?.unit_of_measurement;
  const inDomain = ids.filter((id) => f.domains.includes(domainOf(id)));
  let found = f.deviceClasses
    ? inDomain.filter((id) => f.deviceClasses?.includes(String(dcOf(id))))
    : inDomain;
  if (!found.length && f.unit) found = inDomain.filter((id) => !dcOf(id) && unitOf(id) === f.unit);
  if (f.translationKey && (found.length > 1 || f.needsKey)) {
    const key = f.translationKey;
    found = found.filter((id) => key.test(reg.entities?.[id]?.translation_key ?? ""));
  }
  return found.length === 1 ? found[0] : null;
};

// a discovery said once per page: what was found, and how to choose another
const told = new Set<string>();
export const logOnce = (msg: string) => {
  if (told.has(msg)) return;
  told.add(msg);
  console.info(msg);
};
