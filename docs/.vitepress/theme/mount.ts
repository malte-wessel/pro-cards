// Mounts card configs into an HA-like grid container. Shared by LiveCard and DashboardGrid.
import { cellSize } from "./grid.ts";
import type { CardConfigBase, GridOptions, HomeAssistant } from "../../../src/shared/ha.ts";

type HassModule = typeof import("./ha-shim/hass.ts");

// a mounted Pro Cards element: what the grid reads from it and hands to it
export interface CardElement extends HTMLElement {
  setConfig(config: unknown): void;
  hass: HomeAssistant;
  getGridOptions?(): GridOptions;
}
export interface MountHandle {
  els: CardElement[];
  dispose: () => void;
}

let ready: Promise<HassModule> | null = null;
export const loadRuntime = (): Promise<HassModule> => {
  if (!ready) {
    ready = Promise.all([
      import("./ha-shim/elements.ts"),
      import("./ha-shim/hass.ts"),
      import("../../../src/index.ts"),
    ]).then(([els, hass]) => {
      els.defineElements();
      return hass;
    });
  }
  return ready;
};

// a Pro card (with or without custom:), or a core card the shim has as hui-<type>-card
export const createCard = (cfg: CardConfigBase): CardElement => {
  const raw = String(cfg.type || "").replace(/^custom:/, "");
  if (!raw) throw new Error("missing `type`");
  const type = customElements.get(raw) ? raw : `hui-${raw}-card`;
  if (!customElements.get(type))
    throw new Error(`unknown card type "${cfg.type}" (only the Pro Cards types work here)`);
  const el = document.createElement(type) as CardElement;
  el.setConfig(JSON.parse(JSON.stringify(cfg)));
  return el;
};

// container: element with class ha-grid; cards: array of configs (heading cards supported)
export const mountGrid = async (
  container: HTMLElement,
  cards: unknown[],
  { fullWidth = false }: { fullWidth?: boolean } = {},
): Promise<MountHandle> => {
  const hass = await loadRuntime();
  container.textContent = "";
  const els: CardElement[] = [];
  for (const raw of cards) {
    if (!raw || typeof raw !== "object") continue;
    const cfg = raw as CardConfigBase;
    if (cfg.type === "heading") {
      const h = document.createElement("div");
      h.className = "ha-heading" + (cfg.heading_style === "subtitle" ? " subtitle" : "");
      if (cfg.icon) {
        const i = document.createElement("ha-icon");
        i.setAttribute("icon", String(cfg.icon));
        h.appendChild(i);
      }
      h.appendChild(document.createTextNode(String(cfg.heading || "")));
      container.appendChild(h);
      continue;
    }
    const cell = document.createElement("div");
    cell.className = "cell";
    const el = createCard(cfg);
    el.hass = hass.snapshot();
    const { columns, rows } = cellSize(el.getGridOptions?.(), cfg);
    cell.style.gridColumn = `span ${fullWidth ? 12 : columns}`;
    cell.dataset.cols = String(fullWidth ? 12 : columns);
    if (rows !== "auto") {
      cell.style.gridRow = `span ${rows}`;
      cell.style.setProperty("--rows", String(rows));
      cell.classList.add("fixed");
    }
    cell.appendChild(el);
    container.appendChild(cell);
    els.push(el);
  }
  const off = hass.subscribe(() => {
    const h = hass.snapshot();
    for (const el of els) el.hass = h;
  });
  return { els, dispose: off };
};
