// The visual editor of the container cards (layout, swipe), as Home Assistant's stack card editor:
// the card's own options in an ha-form, then a tab per card with the card's own editor
// (Home Assistant's `hui-card-element-editor`: our tile's and poster's editor for those, its own
// for its cards, YAML else) and the picker (`hui-card-picker`) behind the "+". A card may add a
// form of its own for the selected card (the layout card's placement). The card supplies the
// options' form (`_optionsSchema`, `_optionsToForm`, `_optionsFromForm`).
import type {
  CardConfigBase,
  HaFormData,
  HaFormElement,
  HaFormSchema,
  HomeAssistant,
} from "../ha.ts";
import { langOf } from "../format.ts";
import { hasString, t, type StringKey } from "../i18n.ts";

type Raw = Record<string, unknown>;

// Home Assistant's editor of one card and its card picker (frontend-internal, loaded with the
// card editor dialog; the docs have stand-ins of the same shape)
interface CardElementEditor extends HTMLElement {
  hass?: HomeAssistant;
  value?: CardConfigBase;
  lovelace?: unknown;
  toggleMode?(): void;
}
interface CardPicker extends HTMLElement {
  hass?: HomeAssistant;
  lovelace?: unknown;
}

// the toolbar's icons (Material Design Icons)
const ICONS = {
  left: "M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z",
  right: "M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z",
  copy: "M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z",
  delete: "M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z",
  code: "M14.6,16.6L19.2,12L14.6,7.4L16,6L22,12L16,18L14.6,16.6M9.4,16.6L4.8,12L9.4,7.4L8,6L2,12L8,18L9.4,16.6Z",
  form: "M3,3H21V5H3V3M3,7H15V9H3V7M3,11H21V13H3V11M3,15H15V17H3V15M3,19H21V21H3V19Z",
  plus: "M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z",
};

const STYLE = `
  :host { display: block; }
  [hidden] { display: none !important; }
  .cards { margin-top: 24px; }
  .bar { display: flex; align-items: center; gap: 4px; border-bottom: 1px solid var(--divider-color); }
  .tabs { display: flex; flex: 1; min-width: 0; overflow-x: auto; scrollbar-width: none; }
  .tab { flex: none; padding: 12px 14px; border: 0; background: none; cursor: pointer; font: inherit;
    font-size: var(--ha-font-size-m, 14px); color: var(--secondary-text-color);
    border-bottom: 2px solid transparent; margin-bottom: -1px; white-space: nowrap; }
  .tab:hover { color: var(--primary-text-color); }
  .tab[aria-selected="true"] { color: var(--primary-color); border-bottom-color: var(--primary-color); }
  .tab .n { font-weight: var(--ha-font-weight-medium, 500); margin-right: 6px; }
  .icon { flex: none; width: 40px; height: 40px; display: grid; place-items: center; border: 0;
    border-radius: 50%; background: none; color: var(--secondary-text-color); cursor: pointer; padding: 0; }
  .icon:hover:not([disabled]) { background: var(--secondary-background-color); color: var(--primary-text-color); }
  .icon[disabled] { opacity: 0.4; cursor: default; }
  .icon svg { width: 24px; height: 24px; fill: currentColor; }
  .tools { display: flex; align-items: center; justify-content: flex-end; gap: 2px; padding: 4px 0; }
  .child { padding-top: 8px; }
  .place { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--divider-color); }
  .place h3 { margin: 0 0 8px; font-size: var(--ha-font-size-m, 14px); font-weight: var(--ha-font-weight-medium, 500); }
  .empty { padding: 24px 0; color: var(--secondary-text-color); text-align: center; }
`;

// a card's short name for its tab: its type without `custom:` and `-card-pro` (a tile, an
// entities card)
export const cardName = (c: CardConfigBase | undefined): string => {
  const type = String(c?.type ?? "");
  const ty = type
    .replace(/^custom:/, "")
    .replace(/-card(-pro)?$/, "")
    .replace(/-/g, " ");
  const name = ty ? ty[0].toUpperCase() + ty.slice(1) : "?";
  // ours beside Home Assistant's of the same name (its tile, our tile)
  return type.endsWith("-card-pro") ? `${name} Pro` : name;
};

// makes Home Assistant load its card editor and picker where they are not yet (a stack card's
// editor imports both)
const loadHuiEditors = async () => {
  if (customElements.get("hui-card-picker") && customElements.get("hui-card-element-editor"))
    return;
  const load = (window as unknown as { loadCardHelpers?: () => Promise<unknown> }).loadCardHelpers;
  if (!load) return;
  try {
    const helpers = (await load()) as {
      createCardElement(c: Raw): { constructor: { getConfigElement?(): Promise<unknown> } };
    };
    const stack = helpers.createCardElement({ type: "vertical-stack", cards: [] });
    await stack.constructor.getConfigElement?.();
  } catch {
    // the stand-ins of the docs, or a frontend without them: nothing to load
  }
};

export abstract class CardsEditorBase extends HTMLElement {
  _config?: CardConfigBase;
  _hass?: HomeAssistant;
  _lovelace?: unknown;
  _selected = 0;
  // the selected card's editor is visual (else its YAML)
  _guiMode = true;
  _guiAvailable = true;
  _form?: HaFormElement;
  _formKey?: string;
  _placeForm?: HaFormElement;
  _child?: CardElementEditor | CardPicker;
  _childFor?: number;
  _built = false;

  abstract _optionsSchema(hass: HomeAssistant | undefined, data: HaFormData): HaFormSchema[];
  abstract _optionsToForm(config: CardConfigBase): HaFormData;
  abstract _optionsFromForm(data: HaFormData, prev: CardConfigBase): CardConfigBase;
  // the form of the selected card's place in this card (null: none)
  _placeSchema(_card: CardConfigBase): HaFormSchema[] | null {
    return null;
  }
  _placeToForm(_card: CardConfigBase): HaFormData {
    return {};
  }
  _placeFromForm(_data: HaFormData, card: CardConfigBase): CardConfigBase {
    return card;
  }

  setConfig(config: CardConfigBase) {
    this._config = { ...config, cards: Array.isArray(config.cards) ? config.cards : [] };
    this._render();
  }
  // a new hass (any state in the home changed) goes to the forms and the card's editor: the tabs
  // and tools are drawn again only for another config, selection or language, so a focus, a hover
  // or a click on them survives it
  set hass(hass: HomeAssistant) {
    const lang = this._hass ? langOf(this._hass) : null;
    this._hass = hass;
    if (!this._built || lang !== langOf(hass)) {
      this._render();
      return;
    }
    this._form!.hass = hass;
    if (this._placeForm) this._placeForm.hass = hass;
    if (this._child) this._child.hass = hass;
  }
  set lovelace(lovelace: unknown) {
    this._lovelace = lovelace;
    if (this._child) (this._child as CardElementEditor).lovelace = lovelace;
  }

  get _cards(): CardConfigBase[] {
    return ((this._config?.cards as CardConfigBase[] | undefined) ?? []).slice();
  }
  _t(key: string, vars?: Record<string, string>): string {
    const k = `editor.cards.${key}`;
    return hasString(k) ? t(this._hass, k, vars) : key;
  }

  _emit(config: CardConfigBase) {
    this._config = config;
    this.dispatchEvent(
      new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }),
    );
    this._render();
  }
  _setCards(cards: CardConfigBase[], select?: number) {
    if (select !== undefined) {
      this._selected = select;
      this._guiMode = true;
    }
    this._emit({ ...(this._config as CardConfigBase), cards });
  }

  _build() {
    const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${STYLE}</style><div class="options"></div>
      <div class="cards"><div class="bar" role="tablist"><div class="tabs" role="presentation"></div></div>
      <div class="tools"></div><div class="child" id="card" role="tabpanel"></div><div class="place" hidden></div></div>`;
    // the tabs by the keyboard: the arrows to the one before or after, Home and End to the ends
    root.querySelector(".bar")!.addEventListener("keydown", (ev) => {
      const key = (ev as KeyboardEvent).key;
      const last = this._cards.length;
      const to =
        key === "ArrowLeft"
          ? this._selected - 1
          : key === "ArrowRight"
            ? this._selected + 1
            : key === "Home"
              ? 0
              : key === "End"
                ? last
                : null;
      if (to === null || to < 0 || to > last) return;
      ev.preventDefault();
      this._select(to);
      root.querySelectorAll<HTMLElement>(".tab, .icon.add")[to]?.focus();
    });
    this._form = document.createElement("ha-form");
    this._form.computeLabel = (s) => this._label(s);
    this._form.computeHelper = (s) => this._helper(s);
    this._form.addEventListener("value-changed", (ev) => {
      ev.stopPropagation();
      const next = this._optionsFromForm(ev.detail.value, this._config as CardConfigBase);
      this._emit({ ...next, cards: this._cards });
    });
    root.querySelector(".options")!.appendChild(this._form);
    this._built = true;
    void loadHuiEditors().then(() => {
      this._childFor = undefined;
      this._render();
    });
  }

  // a tab of the bar (a card's, or "+" for the picker): only the selected one is in the tab order
  _tab(b: HTMLElement, selected: boolean) {
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", String(selected));
    b.setAttribute("aria-controls", "card");
    b.tabIndex = selected ? 0 : -1;
  }

  _label(s: HaFormSchema): string {
    return this._t(`field.${s.name}`);
  }
  _helper(s: HaFormSchema): string | undefined {
    const k = `editor.cards.help.${s.name}`;
    return hasString(k) ? t(this._hass, k as StringKey) : undefined;
  }

  _render() {
    if (!this._config || !this._hass) return;
    if (!this._built) this._build();
    const root = this.shadowRoot!;
    const cards = this._cards;
    // fewer cards than the selected tab: the last card (the picker when there is none)
    if (this._selected > cards.length) this._selected = Math.max(0, cards.length - 1);

    // the card's options: rebuilt only for another config or language
    const form = this._form!;
    form.hass = this._hass;
    const key = JSON.stringify([langOf(this._hass), { ...this._config, cards: undefined }]);
    if (key !== this._formKey) {
      this._formKey = key;
      const data = this._optionsToForm(this._config);
      form.data = data;
      form.schema = this._optionsSchema(this._hass, data);
    }

    // the tabs: one per card, then "+"
    // (kept and updated in place, so the focus stays on the one that has it)
    const tabs = root.querySelector(".tabs")!;
    const kept = [...tabs.children] as HTMLElement[];
    cards.forEach((c, i) => {
      let b = kept[i];
      if (!b) tabs.appendChild((b = this._button("tab", () => this._select(i))));
      this._tab(b, i === this._selected);
      b.innerHTML = `<span class="n">${i + 1}</span>`;
      b.append(cardName(c));
    });
    for (const b of kept.slice(cards.length)) b.remove();
    const bar = root.querySelector(".bar")!;
    let add = bar.querySelector<HTMLElement>(".icon.add");
    if (!add) {
      add = this._icon(ICONS.plus, this._t("add"), () => this._select(this._cards.length));
      add.classList.add("add");
      bar.appendChild(add);
    }
    add.title = this._t("add");
    add.setAttribute("aria-label", this._t("add"));
    this._tab(add, this._selected === cards.length);

    // the selected card's tools
    const tools = root.querySelector(".tools") as HTMLElement;
    const i = this._selected;
    const card = cards[i];
    tools.hidden = !card;
    if (card) {
      // (built once and updated in place: a focused tool keeps the focus, Move right pressed again)
      if (!tools.children.length)
        tools.append(
          this._icon(ICONS.code, "", () =>
            (this._child as CardElementEditor | undefined)?.toggleMode?.(),
          ),
          this._icon(ICONS.left, "", () => this._move(-1)),
          this._icon(ICONS.right, "", () => this._move(1)),
          this._icon(ICONS.copy, "", () => this._duplicate()),
          this._icon(ICONS.delete, "", () => this._delete()),
        );
      const [mode, left, right, copy, del] = [...tools.children] as HTMLElement[];
      const set = (b: HTMLElement, label: string, disabled = false) => {
        b.title = label;
        b.setAttribute("aria-label", label);
        b.toggleAttribute("disabled", disabled);
      };
      set(mode, this._t(this._guiMode ? "show_code" : "show_visual"), !this._guiAvailable);
      mode.querySelector("path")!.setAttribute("d", this._guiMode ? ICONS.code : ICONS.form);
      set(left, this._t("move_left"), i === 0);
      set(right, this._t("move_right"), i === cards.length - 1);
      set(copy, this._t("duplicate"));
      set(del, this._t("delete"));
    }

    // the selected card's editor, or the picker
    const host = root.querySelector(".child")!;
    if (this._childFor !== i || !this._child) {
      this._childFor = i;
      this._child = card ? this._cardEditor(i) : this._picker();
      host.replaceChildren(this._child);
    }
    this._child.hass = this._hass;
    if (card && (this._child as CardElementEditor).value !== card)
      (this._child as CardElementEditor).value = card;

    // the selected card's place in this card
    const place = root.querySelector(".place") as HTMLElement;
    const schema = card ? this._placeSchema(card) : null;
    place.hidden = !schema;
    if (schema && card) {
      if (!this._placeForm) {
        this._placeForm = document.createElement("ha-form");
        this._placeForm.computeLabel = (s) => this._label(s);
        this._placeForm.computeHelper = (s) => this._helper(s);
        this._placeForm.addEventListener("value-changed", (ev) => {
          ev.stopPropagation();
          const all = this._cards;
          const at = this._selected;
          all[at] = this._placeFromForm(ev.detail.value, all[at]);
          this._setCards(all);
        });
        const h = document.createElement("h3");
        place.replaceChildren(h, this._placeForm);
      }
      place.querySelector("h3")!.textContent = this._t("placement");
      this._placeForm.hass = this._hass;
      this._placeForm.data = this._placeToForm(card);
      this._placeForm.schema = schema;
    }
  }

  // the editor of the card at `at` (replaced when another card is selected)
  _cardEditor(at: number): CardElementEditor {
    const tag = customElements.get("hui-card-element-editor") ? "hui-card-element-editor" : "div";
    const ed = document.createElement(tag) as CardElementEditor;
    ed.lovelace = this._lovelace;
    ed.addEventListener("config-changed", (ev) => {
      ev.stopPropagation();
      const d = (ev as CustomEvent).detail as {
        config?: CardConfigBase;
        guiModeAvailable?: boolean;
      };
      if (d.guiModeAvailable !== undefined) this._guiAvailable = d.guiModeAvailable;
      if (!d.config) return;
      // an editor that reports what it was given (one settling as it opens) changes nothing
      if (JSON.stringify(d.config) === JSON.stringify(this._cards[at])) return;
      const all = this._cards;
      all[at] = d.config;
      // the editor already shows this config: keep it, so its own state (a dialog, a focus) stays
      ed.value = d.config;
      this._setCards(all);
    });
    ed.addEventListener("GUImode-changed", (ev) => {
      ev.stopPropagation();
      const d = (ev as CustomEvent).detail as { guiMode: boolean; guiModeAvailable: boolean };
      this._guiMode = d.guiMode;
      this._guiAvailable = d.guiModeAvailable;
      this._render();
    });
    return ed;
  }

  _picker(): CardPicker {
    const tag = customElements.get("hui-card-picker") ? "hui-card-picker" : "div";
    const p = document.createElement(tag) as CardPicker;
    if (tag === "div") {
      p.className = "empty";
      p.textContent = this._t("no_picker");
    }
    p.lovelace = this._lovelace;
    p.addEventListener("config-changed", (ev) => {
      ev.stopPropagation();
      const config = (ev as CustomEvent).detail?.config as CardConfigBase | undefined;
      if (!config) return;
      const all = this._cards;
      all.push(config);
      this._childFor = undefined;
      this._setCards(all, all.length - 1);
    });
    return p;
  }

  _select(i: number) {
    if (i === this._selected) return;
    this._selected = i;
    this._guiMode = true;
    this._guiAvailable = true;
    this._render();
  }
  _move(by: number) {
    const all = this._cards;
    const from = this._selected;
    const to = from + by;
    if (to < 0 || to >= all.length) return;
    const [c] = all.splice(from, 1);
    all.splice(to, 0, c);
    this._childFor = undefined;
    this._setCards(all, to);
  }
  _duplicate() {
    const all = this._cards;
    const c = structuredClone(all[this._selected]);
    all.splice(this._selected + 1, 0, c);
    this._childFor = undefined;
    this._setCards(all, this._selected + 1);
  }
  _delete() {
    const all = this._cards;
    all.splice(this._selected, 1);
    this._childFor = undefined;
    this._setCards(all, Math.max(0, this._selected - 1));
  }

  _button(cls: string, onClick: () => void): HTMLButtonElement {
    const b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    b.addEventListener("click", onClick);
    return b;
  }
  _icon(path: string, label: string, onClick: () => void, disabled = false): HTMLButtonElement {
    const b = this._button("icon", onClick);
    b.title = label;
    b.setAttribute("aria-label", label);
    b.toggleAttribute("disabled", disabled);
    b.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
    return b;
  }
}
