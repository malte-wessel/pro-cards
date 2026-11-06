// A choice of a few options as Home Assistant's segmented switch draws it (its name editor's
// "Composed | Custom"): the field's label on the left, the options side by side on the right, the
// chosen one filled. A selector field of our own (`selector: { pro_cards_toggle: { options } }`:
// ha-selector renders the element `ha-selector-<type>` by its name); it sends `value-changed` as
// ha-form's fields send theirs.
export const TOGGLE = "pro_cards_toggle";

interface ToggleOption {
  value: string;
  label: string;
}

const STYLE = `
  :host { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 40px; }
  .label { font-size: 16px; color: var(--primary-text-color); }
  .group { display: inline-flex; border-radius: 18px; overflow: hidden; flex: none;
    background: color-mix(in srgb, var(--primary-color) 14%, transparent); }
  button { height: 36px; padding: 0 16px; border: 0; margin: 0; font: inherit; font-size: 14px; font-weight: 500;
    background: none; color: var(--primary-color); cursor: pointer; }
  button:hover:not([aria-pressed="true"]) { background: color-mix(in srgb, var(--primary-color) 10%, transparent); }
  button[aria-pressed="true"] { background: var(--primary-color); color: var(--text-primary-color, #fff); cursor: default; }
  button:focus-visible { outline: 2px solid var(--primary-color); outline-offset: -2px; }
`;

export class ToggleSelector extends HTMLElement {
  _value = "";
  _label = "";
  set label(v: string) {
    this._label = v ?? "";
    this._draw();
  }
  _options: ToggleOption[] = [];
  set selector(s: Record<string, { options?: ToggleOption[] } | undefined>) {
    this._options = s?.[TOGGLE]?.options ?? [];
    this._draw();
  }
  set value(v: unknown) {
    this._value = typeof v === "string" ? v : "";
    this._draw();
  }
  get value() {
    return this._value;
  }
  set hass(_h: unknown) {
    this._draw();
  }
  _draw() {
    const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${STYLE}</style><span class="label"></span><span class="group" role="group"></span>`;
    root.querySelector(".label")!.textContent = this._label;
    const group = root.querySelector(".group")!;
    group.setAttribute("aria-label", this._label);
    for (const o of this._options) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = o.label;
      b.setAttribute("aria-pressed", String(o.value === this._value));
      b.addEventListener("click", () => {
        if (o.value === this._value) return;
        this._value = o.value;
        this.dispatchEvent(
          new CustomEvent("value-changed", {
            detail: { value: o.value },
            bubbles: true,
            composed: true,
          }),
        );
        this._draw();
      });
      group.append(b);
    }
  }
}

if (!customElements.get(`ha-selector-${TOGGLE}`))
  customElements.define(`ha-selector-${TOGGLE}`, ToggleSelector);
