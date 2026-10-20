// Layout Card Pro: the child cards. Each one is a Home Assistant <hui-card>, as in HA's own
// sections and stacks, so a child gets what it gets there: core cards loaded lazily, an error card
// for a broken config, its `visibility` evaluated (partly on the server) and its grid options.
import type { CardConfigBase, HomeAssistant, HuiCardElement } from "../shared/ha.ts";

const TIMEOUT_MS = 10000;

// hui-card is defined once a dashboard has loaded; creating a stack card through the card helpers
// imports it in any case. Resolves whether it is there.
export const ensureHuiCard = async (): Promise<boolean> => {
  if (customElements.get("hui-card")) return true;
  try {
    const helpers = await window.loadCardHelpers?.();
    helpers?.createCardElement({ type: "vertical-stack", cards: [] });
  } catch {
    // fall through to the wait: something else may still define it
  }
  const timeout = new Promise<false>((r) => setTimeout(() => r(false), TIMEOUT_MS));
  return Promise.race([customElements.whenDefined("hui-card").then(() => true), timeout]);
};

export const createHuiCard = (
  config: CardConfigBase,
  hass: HomeAssistant | undefined,
  preview: boolean,
): HuiCardElement => {
  const el = document.createElement("hui-card");
  if (hass) el.hass = hass;
  el.preview = preview;
  el.config = config;
  el.load();
  return el;
};

// a card config as a stable string, without its view_layout (placement only moves the card)
export const childKey = (cfg: CardConfigBase): string => {
  const sorted = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(sorted)
      : v && typeof v === "object"
        ? Object.fromEntries(
            Object.keys(v as object)
              .sort()
              .map((k) => [k, sorted((v as Record<string, unknown>)[k])]),
          )
        : v;
  const rest = { ...cfg };
  delete rest.view_layout;
  return JSON.stringify(sorted(rest));
};

// Which existing card each new config reuses (its index in `prev`, null: create one): the same
// config first, wherever it was (a reorder keeps the cards), then the card at the same position
// (an edited config goes to the card that had it, hui-card applies it).
export const reconcile = (prev: string[], next: string[]): (number | null)[] => {
  const used = new Set<number>();
  const out: (number | null)[] = next.map((key) => {
    const i = prev.findIndex((k, j) => k === key && !used.has(j));
    if (i < 0) return null;
    used.add(i);
    return i;
  });
  return out.map((v, i) => {
    if (v !== null) return v;
    if (i < prev.length && !used.has(i) && !next.includes(prev[i])) {
      used.add(i);
      return i;
    }
    return null;
  });
};
