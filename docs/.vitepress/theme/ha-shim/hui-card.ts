// Stand-ins for Home Assistant's <hui-card> (the wrapper around each card of a section or a stack,
// which the layout card hosts its cards in) and the heading card, plus window.loadCardHelpers.
// Like the real one, hui-card evaluates the card's `visibility` (with the cards' own condition
// code: template conditions stay false here), hides itself with the hidden attribute and
// display: none, fires card-visibility-changed, removes a hidden card from the page unless it
// sets connectedWhileHidden, and merges the card's grid options with its `grid_options`.
import { configGridOptions } from "../grid.ts";
import type { CardConfigBase, GridOptions, HomeAssistant } from "../../../../src/shared/ha.ts";
import {
  checkVisibility,
  normalizeVisibility,
  visibilityDeps,
  type Visibility,
} from "../../../../src/shared/visibility.ts";
import { VisibilityWatch } from "../../../../src/shared/visibility-watch.ts";

interface Inner extends HTMLElement {
  setConfig?(config: unknown): void;
  hass?: HomeAssistant;
  preview?: boolean;
  layout?: string;
  connectedWhileHidden?: boolean;
  getCardSize?(): number | Promise<number>;
  getGridOptions?(): GridOptions;
}

// a card element from its config: custom:<tag> for the Pro Cards, hui-<type>-card for the core
// cards the shim has (heading)
export const createInner = (cfg: CardConfigBase): Inner => {
  const raw = String(cfg.type || "");
  if (!raw) throw new Error("missing `type`");
  const tag = raw.startsWith("custom:") ? raw.slice(7) : `hui-${raw}-card`;
  if (!customElements.get(tag))
    throw new Error(`unknown card type "${raw}" (only the Pro Cards types and heading work here)`);
  const el = document.createElement(tag) as Inner;
  el.setConfig?.(JSON.parse(JSON.stringify(cfg)));
  return el;
};

export class HuiCardShim extends HTMLElement {
  _config?: CardConfigBase;
  _hass?: HomeAssistant;
  _preview = false;
  _layout?: string;
  _el?: Inner;
  _vis: Visibility = null;
  _visible: boolean | null = null;
  _watch = new VisibilityWatch(() => this._update());

  constructor() {
    super();
    // the card hid or showed itself (a layout whose cards are all hidden): look again
    this.addEventListener("card-visibility-changed", (ev) => {
      if (ev.target === this) return;
      ev.stopPropagation();
      this._update();
    });
  }

  set config(c: CardConfigBase | undefined) {
    this._config = c;
    if (this._el) this.load();
  }
  get config() {
    return this._config;
  }
  set hass(h: HomeAssistant | undefined) {
    this._hass = h;
    if (this._el && h) this._el.hass = h;
    this._update();
  }
  get hass() {
    return this._hass;
  }
  set preview(p: boolean) {
    this._preview = !!p;
    if (this._el) this._el.preview = this._preview;
    this._update();
  }
  get preview() {
    return this._preview;
  }
  set layout(l: string | undefined) {
    this._layout = l;
    if (this._el) this._el.layout = l;
  }
  get layout() {
    return this._layout;
  }

  load() {
    const cfg = this._config || {};
    this._el?.remove();
    this.textContent = "";
    let el: Inner;
    try {
      this._vis = normalizeVisibility(cfg.visibility, {
        type: String(cfg.type),
        label: "visibility",
        entity: null,
      });
      this._watch.set(visibilityDeps([this._vis]));
      el = createInner(cfg);
    } catch (e) {
      console.error(e instanceof Error ? e.message : String(e));
      this._vis = null;
      el = document.createElement("div") as Inner;
      el.className = "hui-error";
      el.textContent = e instanceof Error ? e.message : String(e);
      el.style.cssText =
        "padding:8px 12px;border-radius:8px;color:var(--error-color);border:1px solid var(--error-color)";
    }
    if (this._hass) el.hass = this._hass;
    el.preview = this._preview;
    if (this._layout) el.layout = this._layout;
    this._el = el;
    this._visible = null;
    this._update();
  }

  connectedCallback() {
    this._watch.connect();
    this._update();
  }
  disconnectedCallback() {
    this._watch.disconnect();
  }

  _update() {
    const el = this._el;
    if (!el) return;
    const own =
      !this._vis || !this._hass
        ? true
        : checkVisibility(this._vis, {
            hass: this._hass,
            tpl: () => undefined,
            media: this._watch.media,
            now: Date.now(),
          });
    const visible = this._preview || (own && !el.hidden);
    const keep = visible || !!el.connectedWhileHidden;
    if (keep && el.parentNode !== this) this.appendChild(el);
    if (!keep && el.parentNode === this) el.remove();
    this.toggleAttribute("hidden", !visible);
    this.style.display = visible ? "" : "none";
    this._watch.arm(this._hass);
    if (visible !== this._visible) {
      this._visible = visible;
      this.dispatchEvent(
        new CustomEvent("card-visibility-changed", {
          bubbles: true,
          composed: true,
          detail: { value: visible },
        }),
      );
    }
  }

  getCardSize(): number | Promise<number> {
    return this._el?.getCardSize?.() ?? 1;
  }
  getGridOptions(): GridOptions {
    return { ...(this._el?.getGridOptions?.() || {}), ...configGridOptions(this._config || {}) };
  }
}

// the heading card (`type: heading`) inside a card: its own styles, the docs' CSS does not reach
// into a shadow root
export class HuiHeadingShim extends HTMLElement {
  _cfg: CardConfigBase = {};
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  setConfig(cfg: CardConfigBase) {
    this._cfg = cfg;
    const root = this.shadowRoot as ShadowRoot;
    const sub = cfg.heading_style === "subtitle";
    root.innerHTML = `<style>
      :host { display: block; }
      .h { display: flex; align-items: center; gap: 8px; padding: ${sub ? "0" : "8px 0 0"};
        font: 500 ${sub ? "14px" : "16px"}/24px var(--ha-font-family-body, Roboto, system-ui, sans-serif);
        color: var(${sub ? "--secondary-text-color" : "--primary-text-color"}); }
      ha-icon { --mdc-icon-size: 20px; color: var(--secondary-text-color); line-height: 0; }
    </style><div class="h"></div>`;
    const h = root.querySelector(".h")!;
    if (cfg.icon) {
      const i = document.createElement("ha-icon");
      i.setAttribute("icon", String(cfg.icon));
      h.appendChild(i);
    }
    h.appendChild(document.createTextNode(String(cfg.heading || "")));
  }
  getCardSize() {
    return 1;
  }
  getGridOptions(): GridOptions {
    return { columns: "full", rows: "auto" };
  }
}

export const defineHuiElements = () => {
  if (!customElements.get("hui-heading-card"))
    customElements.define("hui-heading-card", HuiHeadingShim);
  if (!customElements.get("hui-card")) customElements.define("hui-card", HuiCardShim);
  window.loadCardHelpers ??= async () => ({ createCardElement: (c) => createInner(c) });
};
