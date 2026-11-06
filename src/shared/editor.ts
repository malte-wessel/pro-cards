// Base of the visual editors: an ha-form whose data is a flat projection of the card config.
// Subclasses provide:
//   static labels        – { formKey: stringKey } for computeLabel (optional with _label)
//   _toForm(config)      – card config → flat ha-form data
//   _fromForm(data, prev)– flat ha-form data → card config (keeps unknown keys such as grid_options)
//   _schema(hass, data)  – the ha-form schema
//   _label(sch)          – label for a schema entry (default: static labels, then the name)
//   _helper(sch)         – helper text for a schema entry (default: none)
import type {
  CardConfigBase,
  HaFormData,
  HaFormElement,
  HaFormSchema,
  HomeAssistant,
} from "./ha.ts";
import { ItemViews, Sections, type SubLevel, type ViewHooks } from "./editor-views.ts";
import { langOf } from "./format.ts";
import { t, type StringKey } from "./i18n.ts";
import { itemHooks, type ItemType, type RuleReads } from "./kinds/item-views.ts";
import "./kinds/selectors.ts";

// set config[key] = val, or delete the key when the value is empty / the default
export const setOrDrop = (
  config: Record<string, unknown>,
  key: string,
  val: unknown,
  isEmpty: boolean,
) => {
  if (isEmpty) delete config[key];
  else config[key] = val;
};

type Raw = Record<string, unknown>;

export abstract class FormEditorBase extends HTMLElement {
  static labels?: Record<string, StringKey>;
  _config?: CardConfigBase;
  _hass?: HomeAssistant;
  _form?: HaFormElement;
  _formKey?: string;
  _sections = new Sections();

  abstract _toForm(config: CardConfigBase): HaFormData;
  abstract _fromForm(data: HaFormData, prev: CardConfigBase): CardConfigBase;
  abstract _schema(hass: HomeAssistant, data: HaFormData): HaFormSchema[];

  setConfig(config: CardConfigBase) {
    this._config = { ...config };
    this._render();
  }

  // Home Assistant sets hass on every state change: the form only needs the new one, its data
  // and schema follow the config, the language of the labels and what `_schemaInputs` names
  set hass(hass: HomeAssistant) {
    this._hass = hass;
    this._render();
  }
  // what the schema reads from hass besides the language (a subclass that shows friendly names
  // returns them): a change rebuilds the form
  _schemaInputs(_hass: HomeAssistant): unknown {
    return null;
  }

  _label(sch: HaFormSchema): string {
    const key = (this.constructor as typeof FormEditorBase).labels?.[sch.name];
    return key ? t(this._hass, key) : sch.name;
  }

  _helper(_sch: HaFormSchema): string | undefined {
    return undefined;
  }

  // ---- an item of a list in a view of its own (editor-views.ts): the card's form is the level its
  // lists sit in; a subclass that opens items gives their forms through the `_sub*` hooks below
  // (`path` says which: "badges", "badges/rules")
  _views = new ItemViews({
    hass: () => this._hass,
    top: () => (this._config ? this._toForm(this._config) : undefined),
    write: (top) => {
      this._config = this._fromForm(top, this._config ?? {});
      this._render();
      this._send();
    },
    mount: (view) => this.appendChild(view),
    root: (): ParentNode => this,
    showMain: (on) => {
      if (this._form) this._form.style.display = on ? "" : "none";
    },
    render: (closed) => {
      if (closed) this._formKey = undefined;
      this._render();
    },
    hooks: {
      schema: (hass, path, item) => this._subSchema(hass, path, item),
      label: (sch) => this._subLabel(sch),
      helper: (sch) => this._subHelper(sch),
      title: (path, index, item) => this._subTitle(path, index, item),
      toForm: (path, item, hint) => this._subToForm(path, item, hint),
      fromForm: (path, data, was, hint) => this._subFromForm(path, data, was, hint),
      create: (path) => this._subNew(path),
      isEmpty: (path, item, hint) => this._subIsEmpty(path, item, hint),
    } satisfies ViewHooks,
  });
  get _subs(): SubLevel[] {
    return this._views.subs;
  }
  get _sub(): SubLevel | undefined {
    return this._views.sub;
  }
  get _subForm(): HaFormElement | undefined {
    return this._views.form;
  }
  get _subView(): HTMLElement | undefined {
    return this._views.view;
  }
  _subPath(depth?: number): string {
    return this._views.path(depth);
  }
  _subItems(): Raw[] | undefined {
    return this._views.items();
  }
  _subItem(): Raw | undefined {
    return this._views.item();
  }
  _openSub(key: string, index: number, nested: boolean) {
    this._views.open(key, index, nested);
  }
  _closeSub() {
    this._views.close();
  }
  _subChanged(value: Raw) {
    this._views.changed(value);
  }
  // the items it opens (kinds/item-views.ts): badges, rules, trend lines, conditions, a control's
  // options and buttons, and its own types; a badge without an entity reads the card's, the card's
  // own rules read what `_ruleReads` says
  _cardEntity(): string {
    const e = (this._config as Raw | undefined)?.entity;
    return typeof e === "string" ? e : "";
  }
  _ruleReads(_key: string): RuleReads {
    return { entity: this._cardEntity(), unit: "", numeric: false, flavor: "entity" };
  }
  _itemTypes(): Record<string, ItemType | string> {
    return {};
  }
  _items: ViewHooks = ((self: FormEditorBase) =>
    itemHooks({
      hass: () => self._hass,
      path: () => self._subPath(),
      items: () => self._subItems(),
      cardEntity: () => self._cardEntity(),
      rules: (key) => self._ruleReads(key),
      get types() {
        return self._itemTypes();
      },
    }))(this);
  _subSchema(hass: HomeAssistant, path: string, item: Raw): HaFormSchema[] {
    return this._items.schema(hass, path, item);
  }
  _subLabel(sch: HaFormSchema): string {
    return this._items.label(sch);
  }
  _subHelper(sch: HaFormSchema): string | undefined {
    return this._items.helper(sch);
  }
  _subTitle(path: string, index: number, item: Raw): string {
    return this._items.title(path, index, item);
  }
  _subToForm(path: string, item: Raw, hint: Raw): Raw {
    return this._items.toForm(path, item, hint);
  }
  _subFromForm(path: string, data: Raw, was: Raw, hint: Raw): Raw {
    return this._items.fromForm(path, data, was, hint);
  }
  _subNew(path: string): Raw | undefined {
    return this._items.create(path);
  }
  _subIsEmpty(path: string, item: Raw, hint: Raw): boolean {
    return this._items.isEmpty(path, item, hint);
  }

  _send() {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      }),
    );
  }
  _makeForm(): HaFormElement {
    const f = document.createElement("ha-form");
    f.computeLabel = (sch) => this._label(sch);
    f.computeHelper = (sch) => this._helper(sch);
    f.addEventListener("value-changed", (ev) => {
      ev.stopPropagation();
      this._config = this._fromForm(ev.detail.value, this._config ?? {});
      this._render();
      this._send();
    });
    this._sections.watch(f);
    return f;
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._views.listen(this);
      this._form = this._makeForm();
      this.appendChild(this._form);
    }
    if (this._views.render()) return;
    this._form.style.display = "";
    this._form.hass = this._hass;
    // the form's data and schema again only for another config or language: a value change
    // renders here and in the setConfig that follows it, a new schema re-renders every field
    const key = JSON.stringify([langOf(this._hass), this._config, this._schemaInputs(this._hass)]);
    if (key === this._formKey) return;
    this._formKey = key;
    const data = this._toForm(this._config);
    const schema = this._schema(this._hass, data);
    if (this._sections.reshaped(schema)) {
      const form = this._makeForm();
      this._form.replaceWith(form);
      this._form = form;
      form.hass = this._hass;
    }
    this._form.data = data;
    this._form.schema = this._sections.apply(schema);
  }
}
