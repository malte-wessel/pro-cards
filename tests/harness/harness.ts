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
  theme?: string;
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
  { type: "more-info"; entityId: string } | { type: "location-changed"; path: string };
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
  root: HTMLElement;
  card(i?: number): CardElement;
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

// wrap callService so tests can assert on it while the shim still applies the effect
const baseSnapshot = hassMod.snapshot;
const snapshot = (): HomeAssistant => {
  const h: HomeAssistant = baseSnapshot();
  const orig = h.callService;
  h.callService = (d: string, s: string, data?: Record<string, unknown>, target?: unknown) => {
    calls.push({ domain: d, service: s, data: data || {}, target: target || null });
    return orig(d, s, data, target);
  };
  return h;
};

// the shim plays Home Assistant's part for hass-action (dialogs, services, more-info popup)
hassMod.setActionHass(snapshot);
hassMod.setMoreInfo((entityId: string) => events.push({ type: "more-info", entityId }));
hassMod.wire();
document.addEventListener("hass-action", (ev) => actions.push((ev as CustomEvent).detail));
window.addEventListener("location-changed", () =>
  events.push({ type: "location-changed", path: location.pathname }),
);

const gridOf = (el: CardElement, cfg: CardConfigBase) => {
  const g: GridOptions = { ...(el.getGridOptions?.() || {}), ...(cfg.grid_options || {}) };
  return {
    columns: Math.min(12, Math.max(1, Number(g.columns) || 12)),
    rows: g.rows === "auto" || g.rows === undefined ? "auto" : Number(g.rows) || 1,
  };
};

const mount = (cfgOrList: CardConfigBase | CardConfigBase[], opts: MountOptions = {}) => {
  unsub?.();
  root.textContent = "";
  root.classList.toggle("dark", opts.theme === "dark");
  root.classList.toggle("light", opts.theme === "light");
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
  unsub = world.subscribe(() => {
    const h = snapshot();
    for (const el of els) el.hass = h;
  });
  return els.length;
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
  root,
  card: (i = 0) => root.querySelectorAll(".cell > *")[i] as CardElement,
  reset: () => {
    calls.length = 0;
    events.length = 0;
    actions.length = 0;
  },
};
window.__pcReady = true;
