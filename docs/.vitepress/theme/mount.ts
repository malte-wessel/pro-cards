// Mounts card configs into an HA-like grid container. Shared by LiveCard and DashboardGrid.
import { configGridOptions } from "../../../src/shared/grid.ts";
import type { CardConfigBase, GridOptions, HomeAssistant } from "../../../src/shared/ha.ts";

type HassModule = typeof import("./ha-shim/hass.ts");

// a mounted Pro Cards element: what the grid reads from it and hands to it
export interface CardElement extends HTMLElement {
  setConfig(config: unknown): void;
  hass: HomeAssistant;
  layout?: string;
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

// like Home Assistant (computeCardGridSize): the columns stay within the card's min / max
const clampColumns = (g: GridOptions) => {
  let c = Number(g.columns) || 12;
  if (typeof g.min_columns === "number") c = Math.max(c, g.min_columns);
  if (typeof g.max_columns === "number") c = Math.min(c, g.max_columns);
  return Math.min(12, Math.max(1, c));
};
// the rows too: a number within min / max, anything else "auto"
const clampRows = (g: GridOptions) => {
  if (typeof g.rows !== "number") return "auto";
  let r = g.rows;
  if (typeof g.min_rows === "number") r = Math.max(r, g.min_rows);
  if (typeof g.max_rows === "number") r = Math.min(r, g.max_rows);
  return Math.max(1, r);
};
const rowsOf = (el: CardElement, cfg: CardConfigBase) => {
  const g: GridOptions = { ...(el.getGridOptions?.() || {}), ...configGridOptions(cfg) };
  return { columns: clampColumns(g), rows: clampRows(g) };
};

export const createCard = (cfg: CardConfigBase): CardElement => {
  const type = String(cfg.type || "").replace(/^custom:/, "");
  if (!type) throw new Error("missing `type`");
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
    // as in Home Assistant's sections grid: the card learns it sits in one
    el.layout = "grid";
    const { columns, rows } = rowsOf(el, cfg);
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
