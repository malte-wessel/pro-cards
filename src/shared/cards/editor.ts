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
import { ItemViews, Sections, type ViewHooks } from "../editor-views.ts";
import { langOf } from "../format.ts";
import { ICONS as SECTION_ICONS } from "../kinds/editor-schema.ts";
import { itemHooks, type ItemType, type RuleReads } from "../kinds/item-views.ts";
import "../kinds/selectors.ts";
import { hasString, t, type StringKey } from "../i18n.ts";

type Raw = Record<string, unknown>;

// Home Assistant's editor of one card and its card picker (frontend-internal, loaded with the
// card editor dialog; the docs have stand-ins of the same shape)
export interface CardElementEditor extends HTMLElement {
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
  back: "M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z",
  forward: "M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z",
};

const STYLE = `
  :host { display: block; }
  [hidden] { display: none !important; }
  .cards { margin-top: 24px; }
  .bar { display: flex; align-items: center; gap: 4px; border-bottom: 1px solid var(--divider-color); }
  .tabs { position: relative; display: flex; flex: 1; min-width: 0; overflow-x: auto; scrollbar-width: none; }
  .tabs::-webkit-scrollbar { display: none; }
  .icon.scroll { width: 32px; }
  .icon.scroll[disabled] { visibility: hidden; }
  :host(:dir(rtl)) .icon.scroll svg { transform: scaleX(-1); }
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
  .icon[hidden] { display: none; }
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

// a breakpoint of a container card's options in a view of its own: from how many view columns, then
// the options it changes (the card's own fields, two by two), the rest (a `null`, another key) as
// its YAML; a draft until it says from where
export const breakpointType = (
  hass: () => HomeAssistant | undefined,
  fields: Record<string, HaFormSchema["selector"]>,
): ItemType => {
  const L = (k: string, vars?: Record<string, string>) => {
    const key = `editor.cards.${k}`;
    return hasString(key) ? t(hass(), key as StringKey, vars) : k;
  };
  return {
    schema: (h) => {
      const names = Object.keys(fields);
      const rows: HaFormSchema[] = [];
      for (let i = 0; i < names.length; i += 2)
        rows.push({
          name: "",
          type: "grid",
          schema: names.slice(i, i + 2).map((n) => ({ name: n, selector: fields[n] })),
        });
      return [
        { name: "at", required: true, selector: { number: { min: 2, max: 12, mode: "box" } } },
        ...rows,
        {
          name: "",
          type: "expandable",
          flatten: true,
          title: t(h, "editor.card.section.advanced"),
          iconPath: SECTION_ICONS.code,
          expanded: false,
          schema: [{ name: "more", selector: { object: {} } }],
        },
      ];
    },
    create: () => ({}),
    isEmpty: (item) => typeof item.at !== "number",
    label: (name) => L(`field.${name}`),
    helper: (name) => (name === "at" ? L("help.breakpoints") : undefined),
    title: (index, item) =>
      typeof item.at === "number"
        ? L("breakpoint_title", { n: String(item.at) })
        : `${L("field.breakpoints")} ${index + 1}`,
  };
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
  // the tab bar's chevrons shown by where it is scrolled; the selection last scrolled into view
  _scrolled?: () => void;
  _revealed?: string;
  _sections = new Sections();

  // ---- an item of a list in the options in a view of its own (editor-views.ts): a badge, a rule,
  // a consumer, a breakpoint …; the view takes the options' and the cards' place while it is open.
  // A card says what its badges without an entity read, what its own rules read, and its own item
  // types (item-views.ts)
  _cardEntity(): string {
    const e = (this._config as Record<string, unknown> | undefined)?.entity;
    return typeof e === "string" ? e : "";
  }
  _ruleReads(_key: string): RuleReads {
    return { entity: this._cardEntity(), unit: "", numeric: false, flavor: "entity" };
  }
  _itemTypes(): Record<string, ItemType | string> {
    return {};
  }
  _items: ViewHooks = ((self: CardsEditorBase) =>
    itemHooks({
      hass: () => self._hass,
      path: () => self._views.path(),
      items: () => self._views.items(),
      cardEntity: () => self._cardEntity(),
      rules: (key) => self._ruleReads(key),
      get types() {
        return self._itemTypes();
      },
    }))(this);
  _views = new ItemViews({
    hass: () => this._hass,
    top: () =>
      this._config ? (this._optionsToForm(this._config) as Record<string, unknown>) : undefined,
    write: (top) => this._writeOptions(top as HaFormData),
    mount: (view) => this.shadowRoot!.querySelector(".options")!.after(view),
    root: (): ParentNode => this.shadowRoot ?? this,
    showMain: (on) => {
      for (const el of this.shadowRoot?.querySelectorAll<HTMLElement>(".options, .cards") ?? [])
        el.style.display = on ? "" : "none";
    },
    render: (closed) => {
      if (closed) this._formKey = undefined;
      this._render();
    },
    hooks: {
      schema: (hass, path, item) => this._items.schema(hass, path, item),
      label: (sch) => this._items.label(sch),
      helper: (sch) => this._items.helper(sch),
      title: (path, index, item) => this._items.title(path, index, item),
      toForm: (path, item, hint) => this._items.toForm(path, item, hint),
      fromForm: (path, data, was, hint) => this._items.fromForm(path, data, was, hint),
      create: (path) => this._items.create(path),
      isEmpty: (path, item, hint) => this._items.isEmpty(path, item, hint),
    },
  });

  abstract _optionsSchema(hass: HomeAssistant | undefined, data: HaFormData): HaFormSchema[];
  abstract _optionsToForm(config: CardConfigBase): HaFormData;
  // the options written onto `prev`, its `cards` with them: the card may change those too (a tile
  // group's tiles cut to another layout)
  abstract _optionsFromForm(data: HaFormData, prev: CardConfigBase): CardConfigBase;
  _writeOptions(data: HaFormData) {
    const next = this._optionsFromForm(data, this._config as CardConfigBase);
    this._emit({ ...next, cards: Array.isArray(next.cards) ? next.cards : this._cards });
  }
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

  // the card's list of cards as it writes it (a tile group's `tiles`), each card as its own
  // editor takes it and back (a tile with its `type`), and the card "+" adds (none: the picker)
  _listKey = "cards";
  _toCard(item: unknown): CardConfigBase {
    return item as CardConfigBase;
  }
  _fromCard(card: CardConfigBase): unknown {
    return card;
  }
  _newCard(): CardConfigBase | null {
    return null;
  }
  // what the selected card's editor reads of this card (a tile group's layout): another builds it
  // anew
  _childContext(): string {
    return "";
  }
  _childCtx?: string;
  // a card's name for its tab
  _cardName(card: CardConfigBase): string {
    return cardName(card);
  }
  // the editor of the card at `at`: Home Assistant's card editor, or one of the card's own (a
  // weather section's form); either sends config-changed with the card and takes `value`
  _childEditor(at: number): CardElementEditor {
    return this._cardEditor(at);
  }
  // an empty list is left out of the config, not written as [] (a weather card without sections)
  _dropEmptyList = false;
  // the children have a code view of their own (a weather section's form has none: the card's
  // YAML is it), so the tools offer it
  _childCode = true;

  setConfig(config: CardConfigBase) {
    // kept as `cards` (each as its editor takes it), written back under the card's own key
    const { [this._listKey]: list, ...rest } = config as Record<string, unknown>;
    this._written = Array.isArray(list) ? list : [];
    this._keys = Object.keys(config);
    const cards = this._written.map((x) => this._toCard(x));
    this._config = { ...(rest as CardConfigBase), cards };
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
    this._views.setHass(hass);
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

  // the list as the card wrote it: a card left as it was keeps its spelling (a tile as
  // `{ entity }` stays so), wherever it moved to
  _written: unknown[] = [];
  // the config's keys in the order it wrote them
  _keys: string[] = [];
  _emit(config: CardConfigBase) {
    this._config = config;
    const { cards, ...rest } = config;
    const pool = this._written.map((x) => ({ x, as: JSON.stringify(this._toCard(x)) }));
    const list = ((cards as CardConfigBase[] | undefined) ?? []).map((c) => {
      const as = JSON.stringify(c);
      const i = pool.findIndex((p) => p.as === as);
      return i >= 0 ? pool.splice(i, 1)[0].x : this._fromCard(c);
    });
    this._written = list;
    // the list where the card wrote it (a power flow's sources before its consumers), else last
    const all: Record<string, unknown> = { ...rest, [this._listKey]: list };
    if (!list.length && this._dropEmptyList) delete all[this._listKey];
    const order = [...this._keys.filter((k) => k in all), ...Object.keys(all)];
    const written = Object.fromEntries(
      [...new Set(order)].map((k) => [k, all[k]]),
    ) as CardConfigBase;
    this._keys = Object.keys(written);
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: written },
        bubbles: true,
        composed: true,
      }),
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
    this._buildScroll(root.querySelector(".bar")!);
    this._form = this._makeForm();
    root.querySelector(".options")!.appendChild(this._form);
    this._views.listen(root);
    this._built = true;
    void loadHuiEditors().then(() => {
      this._childFor = undefined;
      this._render();
    });
  }

  // more tabs than the bar's width: a chevron at each end (as Home Assistant's tab group), and the
  // wheel scrolls them sideways; a mouse has no other way to them (the scrollbar is hidden). The
  // keyboard moves between the tabs with the arrows, so the chevrons are not in its way.
  _buildScroll(bar: HTMLElement) {
    const tabs = bar.querySelector<HTMLElement>(".tabs")!;
    // the way to the end: in right-to-left the scroll position runs from 0 down
    const way = () => (getComputedStyle(tabs).direction === "rtl" ? -1 : 1);
    const chevron = (path: string, to: 1 | -1) => {
      const b = this._icon(path, "", () =>
        tabs.scrollBy({ left: to * way() * tabs.clientWidth * 0.8, behavior: "smooth" }),
      );
      b.classList.add("scroll");
      b.removeAttribute("title");
      b.removeAttribute("aria-label");
      b.setAttribute("aria-hidden", "true");
      b.tabIndex = -1;
      b.hidden = true;
      return b;
    };
    const back = chevron(ICONS.back, -1);
    const forward = chevron(ICONS.forward, 1);
    tabs.before(back);
    tabs.after(forward);
    // (both shown while the tabs overflow, the one at its end keeping its room unseen, as Web
    // Awesome's: the bar's width changes only with the overflow, never with where it is scrolled;
    // once shown they go only when the tabs fit beside them, so they fit without them too)
    this._scrolled = () => {
      const over = tabs.scrollWidth > tabs.clientWidth + 1;
      if (back.hidden ? over : tabs.scrollWidth <= tabs.clientWidth) {
        back.hidden = forward.hidden = !back.hidden;
      }
      const at = Math.abs(tabs.scrollLeft);
      back.toggleAttribute("disabled", at < 1);
      forward.toggleAttribute("disabled", at + tabs.clientWidth >= tabs.scrollWidth - 1);
    };
    tabs.addEventListener("scroll", () => this._scrolled?.(), { passive: true });
    if (typeof ResizeObserver !== "undefined")
      new ResizeObserver(() => this._scrolled?.()).observe(tabs);
    // a vertical wheel scrolls the tabs while they can go that way, else the page as ever
    tabs.addEventListener(
      "wheel",
      (ev) => {
        if (Math.abs(ev.deltaY) <= Math.abs(ev.deltaX)) return;
        const at = Math.abs(tabs.scrollLeft);
        const end = tabs.scrollWidth - tabs.clientWidth;
        if (ev.deltaY < 0 ? at < 1 : at >= end - 1) return;
        ev.preventDefault();
        tabs.scrollLeft += ev.deltaY * way();
      },
      { passive: false },
    );
  }

  // the selected tab scrolled into the bar's view, once per selection (a new hass leaves the bar
  // where the user scrolled it)
  _reveal(tabs: HTMLElement, tab: HTMLElement | undefined, key: string) {
    if (key === this._revealed) return this._scrolled?.();
    this._revealed = key;
    if (tab && tabs.clientWidth) {
      const start = tab.offsetLeft;
      const end = start + tab.offsetWidth;
      // (an offset is where the tab sits with the bar unscrolled, as the scroll position counts:
      // in right-to-left both run below 0)
      const left = tabs.scrollLeft;
      if (start < left) tabs.scrollLeft += start - left;
      else if (end > left + tabs.clientWidth) tabs.scrollLeft += end - left - tabs.clientWidth;
    }
    this._scrolled?.();
  }

  // the options' form (its sections remembered by their title)
  _makeForm(): HaFormElement {
    const f = document.createElement("ha-form");
    f.computeLabel = (s) => this._label(s);
    f.computeHelper = (s) => this._helper(s);
    f.addEventListener("value-changed", (ev) => {
      ev.stopPropagation();
      this._writeOptions(ev.detail.value);
    });
    this._sections.watch(f);
    return f;
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
    // an item of the options open: its view alone
    if (this._views.render()) return;

    // the card's options: rebuilt only for another config or language (a new form where its top
    // level changes its shape, its sections as they were left)
    let form = this._form!;
    form.hass = this._hass;
    const key = JSON.stringify([langOf(this._hass), { ...this._config, cards: undefined }]);
    if (key !== this._formKey) {
      this._formKey = key;
      const data = this._optionsToForm(this._config);
      const schema = this._optionsSchema(this._hass, data);
      if (this._sections.reshaped(schema)) {
        const next = this._makeForm();
        form.replaceWith(next);
        this._form = form = next;
        form.hass = this._hass;
      }
      form.data = data;
      form.schema = this._sections.apply(schema);
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
      b.append(this._cardName(c));
    });
    for (const b of kept.slice(cards.length)) b.remove();
    this._reveal(
      tabs as HTMLElement,
      tabs.children[this._selected] as HTMLElement | undefined,
      `${this._selected}/${cards.length}`,
    );
    const bar = root.querySelector(".bar")!;
    let add = bar.querySelector<HTMLElement>(".icon.add");
    if (!add) {
      add = this._icon(ICONS.plus, this._t("add"), () => this._add());
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
      mode.hidden = !this._childCode;
      mode.querySelector("path")!.setAttribute("d", this._guiMode ? ICONS.code : ICONS.form);
      set(left, this._t("move_left"), i === 0);
      set(right, this._t("move_right"), i === cards.length - 1);
      set(copy, this._t("duplicate"));
      set(del, this._t("delete"));
    }

    // the selected card's editor, or the picker
    const host = root.querySelector(".child")!;
    if (this._childFor !== i || !this._child || this._childCtx !== this._childContext()) {
      this._childFor = i;
      this._childCtx = this._childContext();
      this._child = card ? this._childEditor(i) : this._newCard() ? this._none() : this._picker();
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

  // no card, where "+" adds one of the card's own (a tile group without tiles)
  _none(): CardPicker {
    const p = document.createElement("div") as unknown as CardPicker;
    (p as unknown as HTMLElement).className = "empty";
    (p as unknown as HTMLElement).textContent = this._t("none_yet");
    return p;
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

  // "+": the card's own new card added and opened, else the picker
  _add() {
    const card = this._newCard();
    if (card) this._setCards([...this._cards, card], this._cards.length);
    else this._select(this._cards.length);
  }
  _select(i: number) {
    // "+" reached by the keyboard adds as a click does, where the card has its own new card
    if (i === this._cards.length && this._newCard()) return this._add();
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
