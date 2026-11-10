// An entity's options in Home Assistant's entity registry, where its favourites live (a light's
// favourite colours, a cover's favourite positions, a timer's presets), as Home Assistant's own
// tile reads them. One fetch per entity for the whole page, shared by every card; fetched again
// when the registry says the entity changed. A user who may not read the registry (or an entity
// without an entry) gets null, and the controls fall back to Home Assistant's defaults.
import type { HomeAssistant } from "./ha.ts";

export type RegistryOptions = Record<string, Record<string, unknown>>;

const got = new Map<string, RegistryOptions | null>();
const asking = new Set<string>();
const listeners = new Set<() => void>();
let watching: HomeAssistant["connection"] | null = null;

const ask = (hass: HomeAssistant, id: string) => {
  if (asking.has(id)) return;
  asking.add(id);
  hass
    .callWS<{ options?: RegistryOptions } | null>({
      type: "config/entity_registry/get",
      entity_id: id,
    })
    .then(
      (e) => (e && typeof e.options === "object" && e.options ? e.options : null),
      () => null,
    )
    .then((o) => {
      asking.delete(id);
      got.set(id, o);
      for (const fn of listeners) fn();
    });
};

// one subscription per connection: an entity whose entry changed is fetched again
const watch = (hass: HomeAssistant) => {
  if (watching === hass.connection || !hass.connection?.subscribeMessage) return;
  watching = hass.connection;
  hass.connection
    .subscribeMessage<{ data?: { action?: string; entity_id?: string } }>(
      (ev) => {
        const id = ev?.data?.entity_id;
        if (id && got.has(id)) ask(hass, id);
      },
      { type: "subscribe_events", event_type: "entity_registry_updated" },
    )
    .catch(() => {
      watching = null;
    });
};

// the entity's registry options: undefined while they are being fetched (the first call starts
// it), null when it has none to read
export const registryOptions = (
  hass: HomeAssistant | undefined,
  id: string | null,
): RegistryOptions | null | undefined => {
  if (!id) return null;
  if (got.has(id)) return got.get(id);
  if (!hass?.callWS) return null;
  watch(hass);
  ask(hass, id);
  return undefined;
};

// called whenever an entity's options arrive (the cards render again); returns the unsubscribe
export const onRegistryOptions = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

// (tests: forget what was fetched)
export const resetRegistryOptions = () => {
  got.clear();
  asking.clear();
  watching = null;
};
