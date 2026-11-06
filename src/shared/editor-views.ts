// An item of a list in a view of its own (a badge's form), as Home Assistant's editors open a row:
// the list field sends EDIT_ITEM with its name and the item's index, a back arrow closes it. Views
// stack: an item's own list (a badge's rules) opens its items on top, back goes one down. An item is
// written through the item or the level above it (its list with the item changed), so the host
// writes it back as it writes the list. Both editor bases host it (`FormEditorBase`: the card's
// form; `CardsEditorBase`: the options above the cards), through `ViewHost`.
//
// Each level of the stack: (`hint`: what the item's form chose that its config cannot say yet,
// kept while it is open) (`draft`: the item is out of the list while its form is open, a new one or
// one that says nothing any more; `draftItem`: what its form holds meanwhile)
import type { HaFormElement, HaFormSchema, HomeAssistant } from "./ha.ts";
import { langOf } from "./format.ts";
import { t } from "./i18n.ts";

type Raw = Record<string, unknown>;
export const EDIT_ITEM = "pro-cards-edit-item";

// Home Assistant's form draws its schema without keys: a section's panel is reused by its place,
// so a field or a section that comes or goes before it hands the panel's open state to another.
// The sections opened or closed are remembered by their title (`expanded-changed`, which a panel
// sends when it is toggled), every schema says so, and a form whose top level changes its shape is
// drawn anew (a new element: every panel takes `expanded` from the schema).
export class Sections {
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

// one open item: its list field's name and index, and what its form keeps
export interface SubLevel {
  key: string;
  index: number;
  hint?: Raw;
  draft?: boolean;
  draftItem?: Raw;
}

// what an item's view needs from the editor, by the item's path ("badges", "badges/rules")
export interface ViewHooks {
  // its form, labels, helpers and title
  schema(hass: HomeAssistant, path: string, item: Raw): HaFormSchema[];
  label(sch: HaFormSchema): string;
  helper(sch: HaFormSchema): string | undefined;
  title(path: string, index: number, item: Raw): string;
  // its form data from the list's item, and back (fields of the form's own added, dropped again);
  // `hint` keeps a choice for the item while it is open
  toForm(path: string, item: Raw, hint: Raw): Raw;
  fromForm(path: string, data: Raw, was: Raw, hint: Raw): Raw;
  // a new item's form data (none: no new items), and an item that says nothing (out of its list
  // while it says nothing, a draft its form keeps, back in its place once it says something)
  create(path: string): Raw | undefined;
  isEmpty(path: string, item: Raw, hint: Raw): boolean;
}

export interface ViewHost {
  hass(): HomeAssistant | undefined;
  // the form data the lists sit in (the card's), and that data with a list changed: written to
  // the config and sent
  top(): Raw | undefined;
  write(top: Raw): void;
  // where the view goes, and the editor's own content shown or hidden while a view is open
  mount(view: HTMLElement): void;
  showMain(on: boolean): void;
  // the editor drawn again (an item opened or closed: `closed` when one closed)
  render(closed?: boolean): void;
  hooks: ViewHooks;
}

export class ItemViews {
  subs: SubLevel[] = [];
  view?: HTMLElement;
  form?: HaFormElement;
  key?: string;
  sections = new Sections();
  host: ViewHost;
  constructor(host: ViewHost) {
    this.host = host;
  }

  // an item opened in the editor's own form, or in an open item's form (a badge's rule): on top
  listen(target: EventTarget) {
    target.addEventListener(EDIT_ITEM, (ev) => {
      ev.stopPropagation();
      const d = (ev as CustomEvent).detail as { key: string; index: number };
      const nested = !!this.form && ev.composedPath().includes(this.form);
      this.open(d.key, d.index, nested && this.subs.length > 0);
    });
  }
  get sub(): SubLevel | undefined {
    return this.subs[this.subs.length - 1];
  }
  // the open item's path: the list fields' names from the card down ("badges", "badges/rules")
  path(depth = this.subs.length): string {
    return this.subs
      .slice(0, depth)
      .map((l) => l.key)
      .join("/");
  }
  // the form data of every open item, from the card's first level down (undefined: one is gone)
  items(): Raw[] | undefined {
    const top = this.host.top();
    if (!top || !this.subs.length) return undefined;
    let data: Raw = top;
    const out: Raw[] = [];
    for (let d = 0; d < this.subs.length; d++) {
      const l = this.subs[d];
      const path = this.path(d + 1);
      const list = Array.isArray(data[l.key]) ? (data[l.key] as unknown[]) : [];
      const raw = l.draft ? (l.draftItem ?? this.host.hooks.create(path)) : list[l.index];
      if (!raw || typeof raw !== "object") return undefined;
      const item = this.host.hooks.toForm(path, raw as Raw, (l.hint ??= {}));
      out.push(item);
      data = item;
    }
    return out;
  }
  item(): Raw | undefined {
    return this.items()?.at(-1);
  }
  // an item opened: from the editor's form, a view of its own; from an open item's form, on top
  open(key: string, index: number, nested: boolean) {
    if (!nested) this.subs = [];
    const parent = nested ? this.item() : this.host.top();
    const list = parent?.[key];
    // an index right after the list: a new item, a draft until it says something
    const draft = index >= (Array.isArray(list) ? list.length : 0);
    this.subs.push({ key, index, draft });
    this.key = undefined;
    this.host.render();
  }
  close() {
    this.subs.pop();
    this.key = undefined;
    this.host.render(true);
  }
  // the deepest item's form changed: each level puts its item into the list above, the host writes
  // its own level
  changed(value: Raw) {
    const items = this.items();
    const top = this.host.top();
    if (!items || !top) return;
    const hooks = this.host.hooks;
    let child: Raw = value;
    for (let d = this.subs.length - 1; d >= 0; d--) {
      const l = this.subs[d];
      const path = this.path(d + 1);
      const hint = (l.hint ??= {});
      // the deepest item from its form, an item above with its list changed (the form's own
      // fields dropped)
      const item = hooks.fromForm(path, child, items[d], hint);
      const parent: Raw = d === 0 ? top : items[d - 1];
      const list = Array.isArray(parent[l.key]) ? (parent[l.key] as unknown[]).slice() : [];
      if (hooks.isEmpty(path, item, hint)) {
        // it says nothing: kept in its form, out of the list (written so, if it was in it)
        l.draftItem = item;
        this.key = undefined;
        if (l.draft) {
          this.host.render();
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
        this.host.write({ ...parent, [l.key]: list });
        return;
      }
      // the item above, with its list changed: written up the same way
      child = { ...parent, [l.key]: list };
    }
  }
  // the open item's view drawn (true), or none open (false: the host draws its own form)
  render(): boolean {
    const hass = this.host.hass();
    const items = hass ? this.items() : undefined;
    if (!this.subs.length || !items || !hass) {
      this.subs = [];
      if (this.view) this.view.style.display = "none";
      this.host.showMain(true);
      return false;
    }
    const item = items[items.length - 1];
    const level = this.sub!;
    const path = this.path();
    if (!this.view) {
      const v = document.createElement("div");
      v.className = "item-view";
      v.innerHTML = `<div style="display:flex;align-items:center;gap:8px;margin:0 0 12px">
        <button type="button" class="back" style="width:40px;height:40px;border:0;border-radius:50%;background:none;color:var(--primary-text-color);cursor:pointer;display:grid;place-items:center;padding:0">
          <svg viewBox="0 0 24 24" style="width:24px;height:24px;fill:currentColor"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/></svg>
        </button><span class="title" style="font-size:16px;font-weight:500;color:var(--primary-text-color)"></span></div>`;
      v.querySelector("button")!.addEventListener("click", () => this.close());
      const f = this.makeForm();
      v.append(f);
      this.host.mount(v);
      this.view = v;
      this.form = f;
    }
    const back = this.view.querySelector("button")!;
    back.title = t(hass, "editor.list.back");
    back.setAttribute("aria-label", back.title);
    this.view.querySelector(".title")!.textContent = this.host.hooks.title(path, level.index, item);
    this.view.style.display = "";
    this.host.showMain(false);
    const f = this.form!;
    f.hass = hass;
    const key = JSON.stringify([langOf(hass), path, level, item, items.slice(0, -1)]);
    if (key !== this.key) {
      this.key = key;
      const schema = this.host.hooks.schema(hass, path, item);
      let form = f;
      if (this.sections.reshaped(schema)) {
        form = this.makeForm();
        f.replaceWith(form);
        this.form = form;
        form.hass = hass;
      }
      form.data = item;
      form.schema = this.sections.apply(schema);
    }
    return true;
  }
  // a new hass for the open view's form (the host's own form takes it as before)
  setHass(hass: HomeAssistant) {
    if (this.form) this.form.hass = hass;
  }
  makeForm(): HaFormElement {
    const f = document.createElement("ha-form");
    f.computeLabel = (sch) => this.host.hooks.label(sch);
    f.computeHelper = (sch) => this.host.hooks.helper(sch);
    f.addEventListener("value-changed", (ev) => {
      ev.stopPropagation();
      this.changed(ev.detail.value as Raw);
    });
    this.sections.watch(f);
    return f;
  }
}
