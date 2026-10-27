// The common element of the container cards (layout, swipe): its cards are Home Assistant
// <hui-card>s, kept through config changes, measured, and hidden with their own `visibility`; the
// container hides itself when every card is hidden. The card supplies its child configs, its
// styles and `_arrange`, which places the cards for the view columns the card spans.
import { fireEvent } from "../card.ts";
import { langOf } from "../format.ts";
import type { CardConfigBase, GridOptions, HomeAssistant, HuiCardElement } from "../ha.ts";
import { t, type StringKey } from "../i18n.ts";
import { childKey, createHuiCard, ensureHuiCard, reconcile } from "./children.ts";
import { activeColumns } from "./view-columns.ts";

export interface Kid {
  key: string;
  hui: HuiCardElement;
  item: HTMLElement;
  size: number;
}
export type Style = Record<string, string>;

// sets the properties of `next` that differ from the last ones and removes the ones that went
export const applyStyle = (el: HTMLElement, next: Style, last: WeakMap<HTMLElement, Style>) => {
  const prev = last.get(el) || {};
  for (const k of Object.keys(prev)) if (!(k in next)) el.style.removeProperty(k);
  for (const [k, v] of Object.entries(next)) if (prev[k] !== v) el.style.setProperty(k, v);
  last.set(el, next);
};

// puts `nodes` into `parent` in that order, moving only the ones out of place: a node that moves
// is disconnected and connected again, and its card opens its subscriptions anew
export const placeNodes = (parent: HTMLElement, nodes: HTMLElement[]) => {
  nodes.forEach((n, i) => {
    const at = parent.children[i];
    if (at !== n) parent.insertBefore(n, at ?? null);
  });
};

export abstract class CardsBase extends HTMLElement {
  static cardType = "";

  // Home Assistant removes a hidden card from the page unless it asks to stay: the conditions of
  // the cards inside must keep running while all of them are hidden
  connectedWhileHidden = true;
  _hass?: HomeAssistant;
  _preview = false;
  _layout?: string;
  _kids: Kid[] = [];
  _root?: HTMLElement;
  _body?: HTMLElement;
  _note?: HTMLElement;
  _width = 0;
  _wasHidden = false; // the probe had no width since the last layout (see connectedCallback)
  _columns?: number; // the view columns the card spans now
  _selfHidden = false;
  _ready = false;
  _failed = false;
  _size = 1;
  _sizes: Promise<unknown> = Promise.resolve();
  _frame = 0;
  _ro?: ResizeObserver;
  // the element the observer watches: as wide as the card, never any height (see connectedCallback)
  _probe?: HTMLElement;
  _styles = new WeakMap<HTMLElement, Style>();

  // the child cards' configs, undefined before setConfig
  abstract _childConfigs(): CardConfigBase[] | undefined;
  abstract _style(): string;
  // the note of an empty card in the editor's preview
  abstract _emptyKey(): StringKey;
  // places the cards for the view columns the card spans, sets _size; returns which are shown
  abstract _arrange(columns: number): boolean[];
  // the card's own nodes besides the body (wrap holds the probe, the body and the note)
  _buildExtra(_wrap: HTMLElement) {}

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  // after setConfig: the children follow the new configs once hui-card is there
  _load() {
    if (!this._root) this._buildDom();
    if (this._ready || customElements.get("hui-card")) {
      // hui-card came after all (a late frontend): the note that it did not goes
      this._ready = true;
      this._failed = false;
      this._sync();
      return;
    }
    ensureHuiCard().then((ok) => {
      this._ready = ok;
      this._failed = !ok;
      if (ok) this._sync();
      else {
        const type = (this.constructor as typeof CardsBase).cardType;
        console.error(`${type}: Home Assistant's <hui-card> did not load, no cards to show`);
        this._relayout();
      }
    });
  }

  set hass(hass: HomeAssistant) {
    const lang = langOf(this._hass) !== langOf(hass);
    this._hass = hass;
    for (const k of this._kids) k.hui.hass = hass;
    if (lang) this._relayout();
  }
  get hass(): HomeAssistant | undefined {
    return this._hass;
  }

  // the dashboard editor's preview: hui-card shows every card, the container does not hide itself
  set preview(v: boolean) {
    if (this._preview === !!v) return;
    this._preview = !!v;
    for (const k of this._kids) k.hui.preview = this._preview;
    this._relayout();
  }
  get preview(): boolean {
    return this._preview;
  }

  // where Home Assistant puts the card: "grid" in a section, "panel" as a panel view's only card,
  // which takes the card's border away; the cards inside get theirs back, as in HA's stacks
  set layout(v: string | undefined) {
    this._layout = v;
    this.toggleAttribute("panel", v === "panel");
  }
  get layout(): string | undefined {
    return this._layout;
  }

  connectedCallback() {
    // laid out at once, not in the next frame: the browser lays the page out again before it
    // paints, so the first frame already shows the columns of the real width (setConfig ran with
    // none), and a container inside, deeper in the tree, is observed and laid out in the same
    // frame. The observer watches a probe of no height across the card, not the host: a relayout
    // changes the host's height, which the browser would report as a size change it could not
    // deliver ("ResizeObserver loop completed with undelivered notifications"). The width is read
    // live, not from the notification: a container inside another one is notified in the same
    // pass, after its parent laid out, with the size it had before that. offsetWidth is the
    // layout width: a dialog that opens by scaling up must not count as a narrower card (and no
    // observation follows when its transform ends)
    // A card hidden (display: none: Home Assistant's visibility, or every card inside hidden)
    // has no width: it keeps the one it had, so that a relayout while hidden still sees its
    // columns, and it is laid out again when it shows, at whatever width, since what it measured
    // while hidden (the swipe card's dots) was nothing.
    this._ro = new ResizeObserver(() => {
      const w = this._probe?.offsetWidth ?? 0;
      if (w <= 0) {
        this._wasHidden = true;
        return;
      }
      if (this._wasHidden || Math.round(w) !== Math.round(this._width)) {
        this._wasHidden = false;
        this._width = w;
        this._relayout();
      }
    });
    if (this._probe) this._ro.observe(this._probe);
    this._schedule();
  }

  disconnectedCallback() {
    this._ro?.disconnect();
    cancelAnimationFrame(this._frame);
    this._frame = 0;
  }

  async getCardSize(): Promise<number> {
    await this._sizes;
    this._relayout();
    return this._size;
  }
  // the whole width of the section, whatever its column_span; rows "auto": the sections grid
  // sizes the card to its cards
  getGridOptions(): GridOptions {
    return { columns: "full", rows: "auto" };
  }

  _buildDom() {
    const root = this.shadowRoot as ShadowRoot;
    // only our own nodes: card-mod and UIX put their styles into the same shadow root
    for (const el of [...root.children]) if (el.matches("style[data-pro], .root")) el.remove();
    const style = document.createElement("style");
    style.dataset.pro = "";
    style.textContent = this._style();
    root.prepend(style);
    const wrap = document.createElement("div");
    wrap.className = "root";
    wrap.innerHTML = `<div class="probe"></div><div class="body"></div><div class="note" hidden></div>`;
    root.appendChild(wrap);
    this._root = wrap;
    if (this._probe) this._ro?.unobserve(this._probe);
    this._probe = wrap.querySelector<HTMLElement>(".probe")!;
    this._ro?.observe(this._probe);
    this._body = wrap.querySelector<HTMLElement>(".body")!;
    this._note = wrap.querySelector<HTMLElement>(".note")!;
    // a child shows or hides: hui-card fires this after changing its hidden state; it is ours to
    // act on, the dashboard must not read it as the container's own
    wrap.addEventListener("card-visibility-changed", (ev) => {
      ev.stopPropagation();
      this._relayout();
    });
    // a card defined late (a custom card loaded after the dashboard) replaced its error card
    wrap.addEventListener("card-updated", (ev) => {
      const kid = this._kids.find((k) => k.hui === ev.target);
      if (kid) this._measure([kid]);
      this._schedule();
    });
    this._buildExtra(wrap);
  }

  // makes the children match the config: the same config keeps its hui-card wherever it moved
  _sync() {
    const configs = this._childConfigs();
    if (!configs || !this._body) return;
    const next = configs.map((c) => childKey(c));
    const old = this._kids;
    const map = reconcile(
      old.map((k) => k.key),
      next,
    );
    const used = new Set<number>();
    const fresh: Kid[] = [];
    this._kids = configs.map((c, i) => {
      const j = map[i];
      if (j !== null) {
        used.add(j);
        const kid = old[j];
        if (kid.key !== next[i]) {
          kid.key = next[i];
          kid.hui.config = c;
          fresh.push(kid);
        }
        return kid;
      }
      const item = document.createElement("div");
      item.className = "item";
      const hui = createHuiCard(c, this._hass, this._preview);
      item.appendChild(hui);
      const kid = { key: next[i], hui, item, size: 1 };
      fresh.push(kid);
      return kid;
    });
    old.forEach((k, j) => {
      if (!used.has(j)) k.item.remove();
    });
    this._measure(fresh);
    this._relayout();
  }

  // the cards' own sizes (getCardSize may be async, a lazy core card answers once loaded)
  _measure(kids: Kid[]) {
    if (!kids.length) return;
    const all = kids.map(async (kid) => {
      try {
        const n = Number(await kid.hui.getCardSize?.());
        if (Number.isFinite(n) && n > 0 && n !== kid.size) {
          kid.size = n;
          this._schedule();
        }
      } catch {
        // a card that can not tell its size counts as 1
      }
    });
    this._sizes = Promise.all([this._sizes, ...all]);
  }

  _schedule() {
    if (this._frame) return;
    this._frame = requestAnimationFrame(() => {
      this._frame = 0;
      this._relayout();
    });
  }

  // Home Assistant's verdict on a card: its `visibility`, or a card that hides itself
  _visible(kid: Kid): boolean {
    return !(kid.hui.hidden || kid.hui.style.display === "none");
  }

  // the view columns: Home Assistant's --column-span of the section (a container card resets it
  // for the containers inside it), else counted from the width with the theme's section columns
  _viewColumns(): number {
    const cs = getComputedStyle(this);
    const px = (name: string) => Number.parseFloat(cs.getPropertyValue(name)) || undefined;
    const columns = activeColumns(
      cs.getPropertyValue("--column-span"),
      this._width,
      this._columns,
      px("--ha-view-sections-column-max-width"),
      px("--ha-view-sections-column-gap"),
    );
    this._columns = columns;
    return columns;
  }

  _relayout() {
    if (!this._body || !this._root || !this._childConfigs()) return;
    const shown = this._arrange(this._viewColumns());
    this._note!.hidden = !(this._failed || (this._preview && !this._kids.length));
    this._note!.textContent = this._failed
      ? t(this._hass, "layout.unavailable")
      : t(this._hass, this._emptyKey());
    // every card hidden: the container hides too (it leaves no gap in the section)
    const hide = !this._preview && this._kids.length > 0 && !shown.some(Boolean);
    if (hide !== this._selfHidden) {
      this._selfHidden = hide;
      this.toggleAttribute("hidden", hide);
      fireEvent(this, "card-visibility-changed", { value: !hide });
    }
  }
}
