// Test harness: mounts card configs into #root over the docs' HA shim and records side effects.
import { defineElements } from "../../docs/.vitepress/theme/ha-shim/elements.ts";
import * as hassMod from "../../docs/.vitepress/theme/ha-shim/hass.ts";
import { world as shimWorld } from "../../docs/.vitepress/theme/ha-shim/world.ts";
import type {
  CardConfigBase,
  GridOptions,
  HassEntity,
  HomeAssistant,
} from "../../src/shared/ha.ts";
import "../../src/index.ts";
import "../../docs/.vitepress/theme/ha.css";

// ----- the API the harness exposes on `window.pc` (tests drive it through page.evaluate) -----

export interface MountOptions {
  theme?: string; // light | dark (the mode)
  skin?: string; // a Home Assistant theme from ha.css, e.g. "graphite"; default when empty
  width?: number | string;
  fullWidth?: boolean;
}
export interface ServiceCall {
  domain: string;
  service: string;
  data: Record<string, unknown>;
  target: unknown;
}
export type HarnessEvent =
  | { type: "more-info"; entityId: string }
  | { type: "location-changed"; path: string }
  | { type: "notification"; message: string }
  | { type: "haptic"; kind: string };
// the slice of the docs shim's demo world the tests touch
export interface ShimWorld {
  states: Record<string, HassEntity>;
  get(id: string): HassEntity | undefined;
  set(id: string, state?: string, attributes?: Record<string, unknown>): void;
  subscribe(fn: () => void): () => void;
  history(ids: string[], start: number, end: number): Record<string, { s: string; lu: number }[]>;
}
// what every mounted card element offers
export interface CardElement extends HTMLElement {
  setConfig(config: unknown): void;
  hass: HomeAssistant;
  getGridOptions(): GridOptions;
  getCardSize(): number;
  _render(): void;
}
export interface PcApi {
  mount(cfgOrList: CardConfigBase | CardConfigBase[], opts?: MountOptions): number;
  settled(): Promise<boolean>;
  world: ShimWorld;
  hass: typeof hassMod;
  calls: ServiceCall[];
  events: HarnessEvent[];
  actions: unknown[];
  snapshot(): HomeAssistant;
  // the frontend language the mounted cards see (hass.locale.language), default en-GB
  setLanguage(language: string): void;
  root: HTMLElement;
  card(i?: number): CardElement;
  // every service call rejects (the shim does nothing) while on
  failCalls(on: boolean): void;
  // service calls are recorded but their effect waits for release()
  holdCalls(on: boolean): void;
  release(): void;
  reset(): void;
}

declare global {
  interface Window {
    pc: PcApi;
    __pcReady?: boolean;
  }
}

defineElements();

const world = shimWorld as unknown as ShimWorld;
const root = document.getElementById("root")!;
const calls: ServiceCall[] = [];
const events: HarnessEvent[] = [];
const actions: unknown[] = [];
let unsub: (() => void) | null = null;
let language = "en-GB";
let mounted: CardElement[] = [];
let failing = false,
  holding = false;
let held: (() => void)[] = [];

// wrap callService so tests can assert on it while the shim still applies the effect
const baseSnapshot = hassMod.snapshot;
const snapshot = (): HomeAssistant => {
  const h: HomeAssistant = baseSnapshot();
  h.locale = { language };
  const orig = h.callService;
  h.callService = (d: string, s: string, data?: Record<string, unknown>, target?: unknown) => {
    calls.push({ domain: d, service: s, data: data || {}, target: target || null });
    if (failing) return Promise.reject(new Error("boom"));
    if (holding)
      return new Promise<void>((resolve) => {
        held.push(() => {
          orig(d, s, data, target);
          resolve();
        });
      });
    return orig(d, s, data, target);
  };
  return h;
};

// the shim plays Home Assistant's part for hass-action (dialogs, services, more-info popup)
hassMod.setActionHass(snapshot);
hassMod.setMoreInfo((entityId: string) => events.push({ type: "more-info", entityId }));
hassMod.wire();
document.addEventListener("hass-action", (ev) => actions.push((ev as CustomEvent).detail));
document.addEventListener("hass-notification", (ev) =>
  events.push({ type: "notification", message: String((ev as CustomEvent).detail?.message) }),
);
document.addEventListener("haptic", (ev) =>
  events.push({ type: "haptic", kind: String((ev as CustomEvent).detail) }),
);
window.addEventListener("location-changed", () =>
  events.push({ type: "location-changed", path: location.pathname }),
);

// like Home Assistant (computeCardGridSize): the columns stay within the card's min / max
const clampColumns = (g: GridOptions) => {
  let c = Number(g.columns) || 12;
  if (typeof g.min_columns === "number") c = Math.max(c, g.min_columns);
  if (typeof g.max_columns === "number") c = Math.min(c, g.max_columns);
  return Math.min(12, Math.max(1, c));
};
const gridOf = (el: CardElement, cfg: CardConfigBase) => {
  const g: GridOptions = { ...(el.getGridOptions?.() || {}), ...(cfg.grid_options || {}) };
  return {
    columns: clampColumns(g),
    rows: g.rows === "auto" || g.rows === undefined ? "auto" : Number(g.rows) || 1,
  };
};

const mount = (cfgOrList: CardConfigBase | CardConfigBase[], opts: MountOptions = {}) => {
  unsub?.();
  root.textContent = "";
  root.classList.toggle("dark", opts.theme === "dark");
  root.classList.toggle("light", opts.theme === "light");
  if (opts.skin) root.dataset.theme = opts.skin;
  else delete root.dataset.theme;
  root.style.width = opts.width
    ? typeof opts.width === "number"
      ? `${opts.width}px`
      : opts.width
    : "400px";
  const cfgs = Array.isArray(cfgOrList) ? cfgOrList : [cfgOrList];
  const els: CardElement[] = [];
  for (const cfg of cfgs) {
    const type = String(cfg.type || "").replace(/^custom:/, "");
    const el = document.createElement(type) as CardElement;
    el.setConfig(JSON.parse(JSON.stringify(cfg)));
    el.hass = snapshot();
    const cell = document.createElement("div");
    cell.className = "cell";
    const g = gridOf(el, cfg);
    cell.style.gridColumn = `span ${opts.fullWidth === false ? g.columns : Array.isArray(cfgOrList) ? g.columns : 12}`;
    if (g.rows !== "auto") {
      cell.style.gridRow = `span ${g.rows}`;
      cell.classList.add("fixed");
    }
    cell.appendChild(el);
    root.appendChild(cell);
    els.push(el);
  }
  mounted = els;
  unsub = world.subscribe(() => {
    const h = snapshot();
    for (const el of els) el.hass = h;
  });
  return els.length;
};

const setLanguage = (lang: string) => {
  language = lang;
  const h = snapshot();
  for (const el of mounted) el.hass = h;
};

// wait until every mounted card has rendered its ha-card and, for history visuals, finished fetching
const settled = async () => {
  const els = [...root.querySelectorAll(".cell > *")];
  for (let i = 0; i < 50; i++) {
    if (els.every((el) => el.shadowRoot?.querySelector("ha-card"))) break;
    await new Promise((r) => setTimeout(r, 20));
  }
  await new Promise((r) => setTimeout(r, 120));
  return true;
};

window.pc = {
  mount,
  settled,
  world,
  hass: hassMod,
  calls,
  events,
  actions,
  snapshot,
  setLanguage,
  root,
  card: (i = 0) => root.querySelectorAll(".cell > *")[i] as CardElement,
  failCalls: (on) => {
    failing = on;
  },
  holdCalls: (on) => {
    holding = on;
  },
  release: () => {
    const fns = held;
    held = [];
    fns.forEach((fn) => fn());
  },
  reset: () => {
    calls.length = 0;
    events.length = 0;
    actions.length = 0;
    mounted = [];
    failing = holding = false;
    held = [];
  },
};
window.__pcReady = true;
