// Stand-ins for Home Assistant's card editor parts, for the container cards' editors on the docs
// site: `hui-card-element-editor` (a card's own editor, its `getConfigElement`, else its YAML, with
// the visual / code toggle) and `hui-card-picker` (the Pro cards, each added with its stub
// config). Their properties and events are Home Assistant's.
import yaml from "js-yaml";

type Raw = Record<string, unknown>;
interface ConfigEditor extends HTMLElement {
  setConfig(c: Raw): void;
  hass?: unknown;
  lovelace?: unknown;
}
interface CardClass {
  getConfigElement?(): HTMLElement | Promise<HTMLElement>;
  getStubConfig?(hass: unknown, entities: string[]): Raw;
}

const STYLE = `
  :host { display: block; }
  textarea { box-sizing: border-box; width: 100%; min-height: 220px; border: 0; border-radius: 4px 4px 0 0;
    padding: 12px; resize: vertical; font-family: var(--ha-font-family-code, ui-monospace, monospace); font-size: 13px;
    color: var(--primary-text-color); outline: 0;
    background: var(--input-fill-color, color-mix(in srgb, var(--primary-text-color) 5%, transparent));
    border-bottom: 1px solid var(--input-idle-line-color, color-mix(in srgb, var(--primary-text-color) 40%, transparent)); }
  textarea:focus { border-bottom: 2px solid var(--primary-color); }
  .bad textarea { border-bottom-color: var(--error-color, #db4437); }
`;

const classOf = (type: unknown): CardClass | undefined => {
  const t = String(type ?? "");
  const tag = t.startsWith("custom:") ? t.slice(7) : `hui-${t}-card`;
  return customElements.get(tag) as CardClass | undefined;
};

export class HuiCardElementEditorShim extends HTMLElement {
  lovelace?: unknown;
  _hass?: unknown;
  _value?: Raw;
  _sent?: Raw;
  _gui = true;
  _editor?: ConfigEditor;
  _editorType?: string;
  _yaml?: HTMLTextAreaElement;

  set hass(h: unknown) {
    this._hass = h;
    if (this._editor) this._editor.hass = h;
  }
  get hass() {
    return this._hass;
  }
  set value(v: Raw | undefined) {
    this._value = v;
    // what this editor sent comes back: it shows that already
    if (v !== this._sent) void this._sync();
  }
  get value() {
    return this._value;
  }

  toggleMode() {
    this._gui = !this._gui;
    this._editor = undefined;
    this._editorType = undefined;
    void this._sync();
  }

  _emit(config: Raw) {
    this._value = this._sent = config;
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config, guiModeAvailable: !!classOf(config.type)?.getConfigElement },
        bubbles: true,
        composed: true,
      }),
    );
  }

  async _sync() {
    const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    const v = this._value ?? {};
    const cls = classOf(v.type);
    const gui = this._gui && !!cls?.getConfigElement;
    this.dispatchEvent(
      new CustomEvent("GUImode-changed", {
        detail: { guiMode: gui, guiModeAvailable: !!cls?.getConfigElement },
        bubbles: true,
        composed: true,
      }),
    );
    if (gui && cls?.getConfigElement) {
      if (!this._editor || this._editorType !== v.type) {
        const ed = (await cls.getConfigElement()) as ConfigEditor;
        ed.addEventListener("config-changed", (ev) => {
          ev.stopPropagation();
          this._emit((ev as CustomEvent).detail.config);
        });
        this._editor = ed;
        this._editorType = String(v.type);
        ed.lovelace = this.lovelace;
        root.replaceChildren(ed);
      }
      this._editor.setConfig(v);
      this._editor.hass = this._hass;
      return;
    }
    // the code editor
    if (!this._yaml) {
      root.innerHTML = `<style>${STYLE}</style><div class="wrap"><textarea spellcheck="false"></textarea></div>`;
      this._yaml = root.querySelector("textarea")!;
      this._yaml.addEventListener("change", () => {
        try {
          const next = yaml.load(this._yaml!.value) as Raw;
          root.querySelector(".wrap")!.classList.remove("bad");
          if (next && typeof next === "object") this._emit(next);
        } catch {
          root.querySelector(".wrap")!.classList.add("bad");
        }
      });
    } else if (!root.contains(this._yaml)) {
      root.innerHTML = `<style>${STYLE}</style>`;
      const wrap = document.createElement("div");
      wrap.className = "wrap";
      wrap.appendChild(this._yaml);
      root.appendChild(wrap);
    }
    this._editor = undefined;
    if (root.activeElement !== this._yaml) this._yaml.value = yaml.dump(v, { lineWidth: -1 });
  }
}

const PICKER_STYLE = `
  :host { display: block; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; padding: 8px 0; }
  button { text-align: left; border: 1px solid var(--divider-color); border-radius: 12px; padding: 12px; cursor: pointer;
    background: var(--card-background-color); color: var(--primary-text-color); font: inherit; }
  button:hover { border-color: var(--primary-color); }
  .name { font-size: 14px; font-weight: var(--ha-font-weight-medium, 500); }
  .desc { font-size: 12px; color: var(--secondary-text-color); margin-top: 4px; line-height: 1.35; }
`;

export class HuiCardPickerShim extends HTMLElement {
  hass?: { states: Record<string, unknown> };
  lovelace?: unknown;
  connectedCallback() {
    const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${PICKER_STYLE}</style><div class="grid"></div>`;
    const grid = root.querySelector(".grid")!;
    const cards =
      (
        window as unknown as {
          customCards?: { type: string; name: string; description?: string }[];
        }
      ).customCards ?? [];
    for (const c of cards) {
      const b = document.createElement("button");
      b.type = "button";
      b.innerHTML = `<div class="name"></div><div class="desc"></div>`;
      b.querySelector(".name")!.textContent = c.name;
      b.querySelector(".desc")!.textContent = c.description ?? "";
      b.addEventListener("click", () => {
        const cls = customElements.get(c.type) as CardClass | undefined;
        const stub = cls?.getStubConfig?.(this.hass, Object.keys(this.hass?.states ?? {})) ?? {};
        this.dispatchEvent(
          new CustomEvent("config-changed", {
            detail: { config: { type: `custom:${c.type}`, ...stub } },
            bubbles: true,
            composed: true,
          }),
        );
      });
      grid.appendChild(b);
    }
  }
}

export const defineEditors = () => {
  if (!customElements.get("hui-card-element-editor"))
    customElements.define("hui-card-element-editor", HuiCardElementEditorShim);
  if (!customElements.get("hui-card-picker"))
    customElements.define("hui-card-picker", HuiCardPickerShim);
};
