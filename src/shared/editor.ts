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
import { langOf } from "./format.ts";
import { t, type StringKey } from "./i18n.ts";

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

// Home Assistant's form draws its schema without keys: a section's panel is reused by its place,
// so a field or a section that comes or goes before it hands the panel's open state to another.
// The sections opened or closed are remembered by their title (`expanded-changed`, which a panel
// sends when it is toggled), every schema says so, and a form whose top level changes its shape is
// drawn anew (a new element: every panel takes `expanded` from the schema).
class Sections {
  open = new Map<string, boolean>();
  shape?: string;
  watch(form: HTMLElement) {
    form.addEventListener("expanded-changed", (ev) => {
      const section = ev
        .composedPath()
        .find((n) => (n as { schema?: HaFormSchema }).schema?.type === "expandable") as
        { schema: HaFormSchema } | undefined;
      const title = section?.schema.title;
      if (title) this.open.set(title, !!(ev as CustomEvent).detail?.expanded);
    });
  }
  apply(schema: HaFormSchema[]): HaFormSchema[] {
    return schema.map((s) =>
      s.type === "expandable" && s.title && this.open.has(s.title)
        ? { ...s, expanded: this.open.get(s.title) }
        : s,
    );
  }
  // whether the top level's shape changed since the last schema (not for the first): its fields
  // and sections by place (a section renamed in its place keeps its panel, rightly)
  reshaped(schema: HaFormSchema[]): boolean {
    const shape = JSON.stringify(schema.map((s) => [s.type ?? "", s.name]));
    const was = this.shape;
    this.shape = shape;
    return was !== undefined && was !== shape;
  }
}
// one open item: its list field's name and index, and what its form keeps (see _subs)
interface SubLevel {
  key: string;
  index: number;
  hint?: Raw;
  draft?: boolean;
  draftItem?: Raw;
}

export abstract class FormEditorBase extends HTMLElement {
  static labels?: Record<string, StringKey>;
  _config?: CardConfigBase;
  _hass?: HomeAssistant;
  _form?: HaFormElement;
  _formKey?: string;

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

  // ---- an item of a list in a view of its own (a badge's form), as Home Assistant's editors open
  // a row: the list field sends EDIT_ITEM with its name and the item's index, a back arrow closes
  // it. Views stack: an item's own list (a badge's rules) opens its items on top, back goes one
  // down. An item is written through the item or the card above it (its list with the item
  // changed), so `_fromForm` writes it back as it writes the list. Each level of the stack:
  // (`hint`: what the item's form chose that its config cannot say yet, kept while it is open)
  // (`draft`: the item is out of the list while its form is open, a new one or one that says
  // nothing any more; `draftItem`: what its form holds meanwhile)
  _subs: SubLevel[] = [];
  get _sub(): SubLevel | undefined {
    return this._subs[this._subs.length - 1];
  }
  _subView?: HTMLElement;
  _subForm?: HaFormElement;
  _subKey?: string;
  _sections = new Sections();
  _subSections = new Sections();
  // the open item's path: the list fields' names from the card down ("badges", "badges/rules")
  _subPath(depth = this._subs.length): string {
    return this._subs
      .slice(0, depth)
      .map((l) => l.key)
      .join("/");
  }
  // the item's form and its labels (a subclass that opens items gives them; `path` says which)
  _subSchema(_hass: HomeAssistant, _path: string, _item: Raw): HaFormSchema[] {
    return [];
  }
  _subLabel(sch: HaFormSchema): string {
    return sch.name;
  }
  _subHelper(_sch: HaFormSchema): string | undefined {
    return undefined;
  }
  _subTitle(path: string, index: number, _item: Raw): string {
    return `${path} ${index + 1}`;
  }
  // the item's form data from the list's item, and back (a subclass adds fields of the form's own,
  // such as a badge's source, and drops them again); `hint` keeps a choice for the item
  _subToForm(_path: string, item: Raw, _hint: Raw): Raw {
    return item;
  }
  _subFromForm(_path: string, data: Raw, _was: Raw, _hint: Raw): Raw {
    return data;
  }
  // a new item's form data (the index right after the list): a draft, added to the list only by
  // its first change, so a new item that is left as it is adds nothing (none: no new items)
  _subNew(_path: string): Raw | undefined {
    return undefined;
  }
  // an item that says nothing (a badge without anything, or one of your own without its text): as
  // Home Assistant's editors take out a row whose entity is cleared, it is out of the list while
  // it says nothing, a draft its form keeps, and goes back to its place once it says something
  _subIsEmpty(_path: string, _item: Raw, _hint: Raw): boolean {
    return false;
  }
  // the form data of every open item, from the card's first level down (undefined: one is gone)
  _subItems(): Raw[] | undefined {
    if (!this._config || !this._subs.length) return undefined;
    let data: Raw = this._toForm(this._config);
    const out: Raw[] = [];
    for (let d = 0; d < this._subs.length; d++) {
      const l = this._subs[d];
      const path = this._subPath(d + 1);
      const list = Array.isArray(data[l.key]) ? (data[l.key] as unknown[]) : [];
      const raw = l.draft ? (l.draftItem ?? this._subNew(path)) : list[l.index];
      if (!raw || typeof raw !== "object") return undefined;
      const item = this._subToForm(path, raw as Raw, (l.hint ??= {}));
      out.push(item);
      data = item;
    }
    return out;
  }
  _subItem(): Raw | undefined {
    return this._subItems()?.at(-1);
  }
  // an item opened: from the card's form, a view of its own; from an open item's form, one on top
  _openSub(key: string, index: number, nested: boolean) {
    if (!nested) this._subs = [];
    const parent = nested ? this._subItem() : this._config ? this._toForm(this._config) : undefined;
    const list = parent?.[key];
    // an index right after the list: a new item, a draft until it says something
    const draft = index >= (Array.isArray(list) ? list.length : 0);
    this._subs.push({ key, index, draft });
    this._subKey = undefined;
    this._render();
  }
  _closeSub() {
    this._subs.pop();
    this._subKey = undefined;
    this._formKey = undefined;
    this._render();
  }
  // the deepest item's form changed: each level puts its item into the list above, the card's
  // form writes the config
  _subChanged(value: Raw) {
    const items = this._subItems();
    if (!items || !this._config) return;
    let child: Raw = value;
    for (let d = this._subs.length - 1; d >= 0; d--) {
      const l = this._subs[d];
      const path = this._subPath(d + 1);
      const hint = (l.hint ??= {});
      // the deepest item from its form, an item above with its list changed (the form's own
      // fields dropped)
      const item = this._subFromForm(path, child, items[d], hint);
      const parent: Raw = d === 0 ? this._toForm(this._config) : items[d - 1];
      const list = Array.isArray(parent[l.key]) ? (parent[l.key] as unknown[]).slice() : [];
      if (this._subIsEmpty(path, item, hint)) {
        // it says nothing: kept in its form, out of the list (written so, if it was in it)
        l.draftItem = item;
        this._subKey = undefined;
        if (l.draft) {
          this._render();
          return;
        }
        l.draft = true;
        list.splice(l.index, 1);
      } else if (l.draft) {
        // it says something: back in its place
        l.draft = false;
        l.draftItem = undefined;
        list.splice(Math.min(l.index, list.length), 0, item);
      } else list[l.index] = item;
      if (d === 0) {
        this._config = this._fromForm({ ...parent, [l.key]: list }, this._config);
        break;
      }
      // the item above, with its list changed: written up the same way
      child = { ...parent, [l.key]: list };
    }
    this._render();
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      }),
    );
  }
  _renderSub(): boolean {
    const items = this._hass ? this._subItems() : undefined;
    if (!this._subs.length || !items || !this._hass) {
      this._subs = [];
      if (this._subView) this._subView.style.display = "none";
      if (this._form) this._form.style.display = "";
      return false;
    }
    const item = items[items.length - 1];
    const level = this._sub!;
    const path = this._subPath();
    if (!this._subView) {
      const v = document.createElement("div");
      v.innerHTML = `<div style="display:flex;align-items:center;gap:8px;margin:0 0 12px">
        <button type="button" class="back" style="width:40px;height:40px;border:0;border-radius:50%;background:none;color:var(--primary-text-color);cursor:pointer;display:grid;place-items:center;padding:0">
          <svg viewBox="0 0 24 24" style="width:24px;height:24px;fill:currentColor"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/></svg>
        </button><span class="title" style="font-size:16px;font-weight:500;color:var(--primary-text-color)"></span></div>`;
      v.querySelector("button")!.addEventListener("click", () => this._closeSub());
      const f = this._makeSubForm();
      v.append(f);
      this.appendChild(v);
      this._subView = v;
      this._subForm = f;
    }
    const back = this._subView.querySelector("button")!;
    back.title = t(this._hass, "editor.list.back");
    back.setAttribute("aria-label", back.title);
    this._subView.querySelector(".title")!.textContent = this._subTitle(path, level.index, item);
    this._subView.style.display = "";
    if (this._form) this._form.style.display = "none";
    const f = this._subForm!;
    f.hass = this._hass;
    const key = JSON.stringify([langOf(this._hass), path, level, item, items.slice(0, -1)]);
    if (key !== this._subKey) {
      this._subKey = key;
      const schema = this._subSchema(this._hass, path, item);
      let form = f;
      if (this._subSections.reshaped(schema)) {
        form = this._makeSubForm();
        f.replaceWith(form);
        this._subForm = form;
        form.hass = this._hass;
      }
      form.data = item;
      form.schema = this._subSections.apply(schema);
    }
    return true;
  }
  _makeSubForm(): HaFormElement {
    const f = document.createElement("ha-form");
    f.computeLabel = (sch) => this._subLabel(sch);
    f.computeHelper = (sch) => this._subHelper(sch);
    f.addEventListener("value-changed", (ev) => {
      ev.stopPropagation();
      this._subChanged(ev.detail.value as Raw);
    });
    this._subSections.watch(f);
    return f;
  }
  _makeForm(): HaFormElement {
    const f = document.createElement("ha-form");
    f.computeLabel = (sch) => this._label(sch);
    f.computeHelper = (sch) => this._helper(sch);
    f.addEventListener("value-changed", (ev) => {
      ev.stopPropagation();
      this._config = this._fromForm(ev.detail.value, this._config ?? {});
      this._render();
      this.dispatchEvent(
        new CustomEvent("config-changed", {
          detail: { config: this._config },
          bubbles: true,
          composed: true,
        }),
      );
    });
    this._sections.watch(f);
    return f;
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      // an item opened in the card's form, or in an open item's form (a badge's rule): on top
      this.addEventListener("pro-cards-edit-item", (ev) => {
        ev.stopPropagation();
        const d = (ev as CustomEvent).detail as { key: string; index: number };
        const nested = !!this._subForm && ev.composedPath().includes(this._subForm);
        this._openSub(d.key, d.index, nested && this._subs.length > 0);
      });
      this._form = this._makeForm();
      this.appendChild(this._form);
    }
    if (this._renderSub()) return;
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
