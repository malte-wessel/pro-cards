// A list of a card's items (its badges, its rules) as Home Assistant's list field draws one, as a
// selector field of our own (`selector: { <type>: { … } }`: ha-selector renders the element
// `ha-selector-<type>` by its name). A box an item: an icon, a title and a line of the rest; the
// box opens the item's form in the editor's sub-view (EDIT_ITEM goes up to it with the field's
// name and the item's index), its buttons move or delete it, and "Add" opens a new one's form (a
// draft until it says something). Its value is the items' form data, sent as ha-form's fields
// send theirs (`value-changed`); the field's helper is drawn under it, as a selector draws its own.
import type { HomeAssistant } from "./ha.ts";
import { t, type StringKey } from "./i18n.ts";

type Raw = Record<string, unknown>;
export const EDIT_ITEM = "pro-cards-edit-item";

const PATHS = {
  up: "M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z",
  down: "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",
  edit: "M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z",
  delete: "M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z",
};

const STYLE = `
  :host { display: block; }
  /* a box an item, as Home Assistant's list field draws its items */
  .items { display: flex; flex-direction: column; gap: 8px; }
  .row { display: flex; align-items: center; gap: 4px; padding: 4px; min-height: 44px; box-sizing: border-box;
    border: 1px solid var(--divider-color, rgba(0,0,0,.12)); border-radius: 8px; }
  /* the whole box answers the pointer and the keyboard's focus, its buttons too */
  .row:hover, .row:has(.main:focus-visible) { background: var(--secondary-background-color); }
  .main { flex: 1; min-width: 0; display: flex; align-items: center; gap: 12px; padding: 4px 4px 4px 8px;
    cursor: pointer; outline: none; }
  .icon { flex: none; width: 24px; height: 24px; display: grid; place-items: center; color: var(--state-icon-color, var(--secondary-text-color)); }
  .dot { width: 10px; height: 10px; border-radius: 50%; background: currentColor; }
  .texts { min-width: 0; }
  .title { font-size: 14px; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sum { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sum:empty { display: none; }
  button { flex: none; width: 36px; height: 36px; display: grid; place-items: center; border: 0; border-radius: 50%;
    background: none; color: var(--secondary-text-color); cursor: pointer; padding: 0; }
  button:hover:not([disabled]) { background: var(--divider-color, rgba(0,0,0,.12)); color: var(--primary-text-color); }
  button[disabled] { opacity: .35; cursor: default; }
  svg { width: 22px; height: 22px; fill: currentColor; }
  .label { font-size: 14px; color: var(--primary-text-color); margin: 0 0 4px; }
  .add { margin-top: 8px; }
  button.new { width: auto; height: 36px; padding: 0 16px; border-radius: 18px; font: inherit; font-weight: 500;
    color: var(--primary-color); background: color-mix(in srgb, var(--primary-color) 12%, transparent); }
  button.new:hover { background: color-mix(in srgb, var(--primary-color) 20%, transparent); color: var(--primary-color); }
  .helper { margin: 8px 16px 0; font-size: 12px; line-height: 16px; color: var(--secondary-text-color); }
  .helper:empty { display: none; }
`;

export abstract class ItemListSelector extends HTMLElement {
  _hass?: HomeAssistant;
  _value: Raw[] = [];
  _label = "";
  _helper = "";
  _drawn?: string;
  // the field's name in the card's form (the sub-view opens `key`'s item), its selector's type
  abstract _key: string;
  abstract _type: string;
  // an item's form data from a value as the list holds it
  _toItem(x: unknown): Raw {
    return typeof x === "object" && x ? (x as Raw) : {};
  }
  // an item's box: its title, a line of the rest, its icon; the add button's words
  abstract _lines(item: Raw): { title: string; detail: string };
  abstract _iconOf(item: Raw): HTMLElement;
  abstract _addLabel(): string;
  // the selector's own options (`selector: { <type>: { … } }`)
  selector?: Record<string, Raw | undefined>;
  get _options(): Raw {
    return this.selector?.[this._type] ?? {};
  }

  set hass(h: HomeAssistant) {
    this._hass = h;
    if (!this._drawn) this._draw();
  }
  set value(v: unknown) {
    this._value = Array.isArray(v) ? (v as unknown[]).map((x) => this._toItem(x)) : [];
    this._draw();
  }
  get value() {
    return this._value;
  }
  set label(v: string) {
    this._label = v ?? "";
    this._drawn = undefined;
    this._draw();
  }
  set helper(v: string | undefined) {
    this._helper = v ?? "";
    this._drawn = undefined;
    this._draw();
  }

  _send(list: Raw[]) {
    this._value = list;
    this.dispatchEvent(
      new CustomEvent("value-changed", { detail: { value: list }, bubbles: true, composed: true }),
    );
    this._draw();
  }
  _L(key: string, vars?: Record<string, string>) {
    return t(this._hass, key as StringKey, vars);
  }
  _open(index: number) {
    this.dispatchEvent(
      new CustomEvent(EDIT_ITEM, {
        detail: { key: this._key, index },
        bubbles: true,
        composed: true,
      }),
    );
  }
  _button(path: string, label: string, onClick: () => void, disabled = false) {
    const b = document.createElement("button");
    b.type = "button";
    b.title = label;
    b.setAttribute("aria-label", label);
    b.disabled = disabled;
    b.innerHTML = `<svg viewBox="0 0 24 24"><path d="${path}"/></svg>`;
    b.addEventListener("click", onClick);
    return b;
  }

  _draw() {
    if (!this._hass) return;
    const key = JSON.stringify([this._value, this._hass.locale?.language, this._options]);
    if (key === this._drawn) return;
    this._drawn = key;
    const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${STYLE}</style>`;
    // (no label of its own in a section that already names it: `hide_label`)
    if (this._label && !this._options.hide_label) {
      const l = document.createElement("div");
      l.className = "label";
      l.textContent = this._label;
      root.append(l);
    }
    const list = this._value;
    const items = document.createElement("div");
    items.className = "items";
    root.append(items);
    list.forEach((item, i) => {
      const row = document.createElement("div");
      row.className = "row";
      const main = document.createElement("div");
      main.className = "main";
      main.tabIndex = 0;
      main.setAttribute("role", "button");
      main.addEventListener("click", () => this._open(i));
      main.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this._open(i);
        }
      });
      main.append(this._iconOf(item));
      const { title, detail } = this._lines(item);
      const texts = document.createElement("div");
      texts.className = "texts";
      texts.innerHTML = `<div class="title"></div><div class="sum"></div>`;
      texts.querySelector(".title")!.textContent = title;
      texts.querySelector(".sum")!.textContent = detail;
      main.append(texts);
      const move = (by: number) => {
        const next = list.slice();
        [next[i], next[i + by]] = [next[i + by], next[i]];
        this._send(next);
      };
      row.append(
        main,
        this._button(PATHS.up, this._L("editor.list.up"), () => move(-1), i === 0),
        this._button(PATHS.down, this._L("editor.list.down"), () => move(1), i === list.length - 1),
        this._button(PATHS.edit, this._L("editor.list.edit"), () => this._open(i)),
        this._button(PATHS.delete, this._L("editor.list.delete"), () =>
          this._send(list.filter((_, j) => j !== i)),
        ),
      );
      items.append(row);
    });
    // a new item: its form opens on a draft, added by the first change that says something
    const add = document.createElement("div");
    add.className = "add";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "new";
    button.textContent = this._addLabel();
    button.addEventListener("click", () => this._open(list.length));
    add.append(button);
    const helper = document.createElement("div");
    helper.className = "helper";
    helper.textContent = this._helper;
    root.append(add, helper);
  }
}

// a selector field of ours, defined once (ha-selector draws `ha-selector-<type>`)
export const defineSelector = (type: string, cls: CustomElementConstructor) => {
  if (!customElements.get(`ha-selector-${type}`)) customElements.define(`ha-selector-${type}`, cls);
};
