/*
 * layout-card-pro
 * A container for any cards: a grid (counts, tracks or as many columns as fit, spans, fixed rows),
 * a stack (down or across) or masonry, with named breakpoints that measure the card itself (or the
 * window), media rules, spacing and density, a seamless style, per-card placement in each card's
 * `view_layout`, and low-priority cards folding into a "+N more" row. Every child is a Home
 * Assistant <hui-card>, so its own `visibility` works as anywhere else.
 *
 * Config (see docs/cards/layout-card.md):
 *   type: custom:layout-card-pro
 *   layout: grid                  # grid | stack | masonry
 *   columns: 1                    # n | [1fr, 2fr] | [320px, 1fr]
 *   breakpoints:
 *     tablet: { columns: 2 }      # defaults: tablet 600, desktop 1024, wide 1440
 *   cards:
 *     - type: custom:entity-card-pro
 *       entity: sensor.outdoor_temperature
 *       view_layout: { span: { phone: 1, tablet: 2 }, priority: high }
 */
import { fireEvent, registerCard, syncKeepHeight } from "./shared/card.ts";
import { langOf } from "./shared/format.ts";
import type { CardConfigBase, GridOptions, HomeAssistant, HuiCardElement } from "./shared/ha.ts";
import { t } from "./shared/i18n.ts";
import { qs } from "./shared/util.ts";
import { VisibilityWatch } from "./shared/visibility-watch.ts";
import { activeBreakpoint, resolveOptions, watchedQueries } from "./layout/breakpoints.ts";
import { childKey, createHuiCard, ensureHuiCard, reconcile } from "./layout/children.ts";
import { CARD_TYPE, normalizeLayoutConfig, type LayoutConfig } from "./layout/config.ts";
import { cardSize, planLayout, type KidState, type Plan, type Style } from "./layout/place.ts";
import { STYLE } from "./layout/styles.ts";
import { autoFitCount, toPx, trackCount } from "./layout/units.ts";

interface Kid {
  key: string;
  hui: HuiCardElement;
  item: HTMLElement;
  size: number;
}

// sets the properties of `next` that differ from the last ones and removes the ones that went
const applyStyle = (el: HTMLElement, next: Style, last: WeakMap<HTMLElement, Style>) => {
  const prev = last.get(el) || {};
  for (const k of Object.keys(prev)) if (!(k in next)) el.style.removeProperty(k);
  for (const [k, v] of Object.entries(next)) if (prev[k] !== v) el.style.setProperty(k, v);
  last.set(el, next);
};

// puts `nodes` into `parent` in that order, moving only the ones out of place: a node that moves
// is disconnected and connected again, and its card opens its subscriptions anew
const placeNodes = (parent: HTMLElement, nodes: HTMLElement[]) => {
  nodes.forEach((n, i) => {
    const at = parent.children[i];
    if (at !== n) parent.insertBefore(n, at ?? null);
  });
};

export class LayoutCard extends HTMLElement {
  static cardType = CARD_TYPE;

  // Home Assistant removes a hidden card from the page unless it asks to stay: the conditions of
  // the cards inside must keep running while all of them are hidden
  connectedWhileHidden = true;
  _cfg?: LayoutConfig;
  _hass?: HomeAssistant;
  _preview = false;
  _layout?: string;
  _kids: Kid[] = [];
  _root?: HTMLElement;
  _body?: HTMLElement;
  _fold?: HTMLButtonElement;
  _note?: HTMLElement;
  _width = 0;
  _active?: string;
  _cols: number | null = null;
  _expanded = false;
  _selfHidden = false;
  _ready = false;
  _failed = false;
  _size = 1;
  _sizes: Promise<unknown> = Promise.resolve();
  _frame = 0;
  _ro?: ResizeObserver;
  _styles = new WeakMap<HTMLElement, Style>();
  _watch = new VisibilityWatch(() => this._schedule());

  static getStubConfig() {
    return { layout: "grid", columns: 2, cards: [] };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config: CardConfigBase | null | undefined) {
    const cfg = normalizeLayoutConfig(config);
    syncKeepHeight(this, config);
    this._cfg = cfg;
    this._watch.set({ media: new Set(watchedQueries(cfg)), times: [] });
    if (!this._root) this._buildDom();
    if (this._ready || customElements.get("hui-card")) {
      this._ready = true;
      this._sync();
      return;
    }
    ensureHuiCard().then((ok) => {
      this._ready = ok;
      this._failed = !ok;
      if (ok) this._sync();
      else {
        console.error(`${CARD_TYPE}: Home Assistant's <hui-card> did not load, no cards to show`);
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

  // the dashboard editor's preview: every card shows, the ones the layout's breakpoints or fold
  // would hide are faded (hui-card shows the ones its visibility hides)
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
    this._ro = new ResizeObserver((entries) => {
      const w = entries[entries.length - 1].contentRect.width;
      if (w > 0 && Math.round(w) !== Math.round(this._width)) {
        this._width = w;
        this._schedule();
      }
    });
    this._ro.observe(this);
    this._watch.connect();
    this._schedule();
  }

  disconnectedCallback() {
    this._ro?.disconnect();
    this._watch.disconnect();
    cancelAnimationFrame(this._frame);
    this._frame = 0;
  }

  async getCardSize(): Promise<number> {
    await this._sizes;
    this._relayout();
    return this._size;
  }
  // the whole width of the section, whatever its column_span; rows "auto": the sections grid
  // sizes the layout to its cards
  getGridOptions(): GridOptions {
    return { columns: "full", rows: "auto" };
  }

  _buildDom() {
    const root = this.shadowRoot as ShadowRoot;
    // only our own nodes: card-mod and UIX put their styles into the same shadow root
    for (const el of [...root.children]) if (el.matches("style[data-pro], .root")) el.remove();
    const style = document.createElement("style");
    style.dataset.pro = "";
    style.textContent = STYLE;
    root.prepend(style);
    const wrap = document.createElement("div");
    wrap.className = "root";
    wrap.innerHTML = `<div class="body"></div><button class="fold" type="button" hidden><span></span><ha-icon></ha-icon></button><div class="note" hidden></div>`;
    root.appendChild(wrap);
    this._root = wrap;
    this._body = wrap.querySelector<HTMLElement>(".body")!;
    this._fold = wrap.querySelector<HTMLButtonElement>(".fold")!;
    this._note = wrap.querySelector<HTMLElement>(".note")!;
    this._fold.addEventListener("click", () => {
      this._expanded = !this._expanded;
      this._relayout();
    });
    // a child shows or hides: hui-card fires this after changing its hidden state; it is ours to
    // act on, the dashboard must not read it as the layout's own
    wrap.addEventListener("card-visibility-changed", (ev) => {
      if (ev.target === this) return;
      ev.stopPropagation();
      this._relayout();
    });
    // a card defined late (a custom card loaded after the dashboard) replaced its error card
    wrap.addEventListener("card-updated", (ev) => {
      const kid = this._kids.find((k) => k.hui === ev.target);
      if (kid) this._measure([kid]);
      this._schedule();
    });
  }

  // makes the children match the config: the same config keeps its hui-card wherever it moved
  _sync() {
    const cfg = this._cfg;
    if (!cfg || !this._body) return;
    const next = cfg.children.map((c) => childKey(c.config));
    const old = this._kids;
    const map = reconcile(
      old.map((k) => k.key),
      next,
    );
    const used = new Set<number>();
    const fresh: Kid[] = [];
    this._kids = cfg.children.map((c, i) => {
      const j = map[i];
      if (j !== null) {
        used.add(j);
        const kid = old[j];
        if (kid.key !== next[i]) {
          kid.key = next[i];
          kid.hui.config = c.config;
          fresh.push(kid);
        }
        return kid;
      }
      const item = document.createElement("div");
      item.className = "item";
      const hui = createHuiCard(c.config, this._hass, this._preview);
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

  _plan(): { plan: Plan; states: KidState[]; opts: ReturnType<typeof resolveOptions> } | null {
    const cfg = this._cfg;
    if (!cfg) return null;
    const width = cfg.container ? this._width : window.innerWidth;
    const active = activeBreakpoint(width, cfg.breakpoints, this._active);
    this._active = active;
    const opts = resolveOptions(cfg, {
      active,
      media: this._watch.media,
      coarse: this._watch.media("(pointer: coarse)"),
    });
    const states: KidState[] = this._kids.map((k, i) => ({
      place: cfg.children[i].place,
      visible: !(k.hui.hidden || k.hui.style.display === "none"),
      size: k.size,
      grid: k.hui.getGridOptions?.(),
    }));
    const plan = planLayout(opts, states, {
      active,
      order: cfg.order,
      preview: this._preview,
      expanded: this._expanded,
      width: this._body?.clientWidth || width,
      cols: this._cols,
    });
    return { plan, states, opts };
  }

  _relayout() {
    if (!this._body || !this._root) return;
    let p = this._plan();
    if (!p) return;
    this._apply(p.plan);
    // as many columns as fit: spans and start columns are clamped to the columns there are,
    // counted from the width and the gap as laid out (the count follows the width only)
    if (p.opts.layout === "grid" && p.opts.min_column_width) {
      const cs = getComputedStyle(this._body);
      const minPx = toPx(p.opts.min_column_width);
      const n =
        minPx !== null
          ? autoFitCount(
              this._body.clientWidth,
              minPx,
              parseFloat(cs.columnGap) || 0,
              p.opts.max_columns,
            )
          : trackCount(cs.gridTemplateColumns);
      if (n !== this._cols) {
        this._cols = n;
        p = this._plan()!;
        this._apply(p.plan);
      }
    }
    this._size = cardSize(p.opts, p.states, p.plan);
    this._note!.hidden = !(this._failed || (this._preview && !this._kids.length));
    this._note!.textContent = this._failed
      ? t(this._hass, "layout.unavailable")
      : t(this._hass, "layout.empty");
    // every card hidden: the layout hides too (it leaves no gap in the section)
    const hide =
      !this._preview &&
      this._kids.length > 0 &&
      !p.plan.items.some((it) => it.shown) &&
      !p.plan.folded;
    if (hide !== this._selfHidden) {
      this._selfHidden = hide;
      this.toggleAttribute("hidden", hide);
      fireEvent(this, "card-visibility-changed", { value: !hide });
    }
  }

  _apply(plan: Plan) {
    const root = this._root!;
    const body = this._body!;
    root.className = ["root", ...plan.rootClass].join(" ");
    applyStyle(root, plan.root, this._styles);
    applyStyle(body, plan.body, this._styles);
    const items = this._kids.map((k) => k.item);
    if (plan.columns) {
      // masonry: one column element per column, the cards dealt out in placement order
      const cols = [...body.children].filter((c) => c.classList.contains("col")) as HTMLElement[];
      while (cols.length < plan.columns) {
        const c = document.createElement("div");
        c.className = "col";
        cols.push(c);
      }
      const per: HTMLElement[][] = cols.map(() => []);
      for (const i of plan.sequence) {
        const it = plan.items[i];
        // a hidden card stays in the column it was in (no move, no reconnect)
        const where =
          it.column >= 0 ? it.column : cols.findIndex((c) => c === items[i].parentElement);
        per[Math.min(plan.columns - 1, Math.max(0, where))].push(items[i]);
      }
      placeNodes(body, cols.slice(0, plan.columns));
      cols.slice(plan.columns).forEach((c) => c.remove());
      cols.slice(0, plan.columns).forEach((c, i) => placeNodes(c, per[i]));
    } else {
      placeNodes(body, items);
      for (const c of [...body.children]) if (c.classList.contains("col")) c.remove();
    }
    plan.items.forEach((it, i) => {
      const kid = this._kids[i];
      applyStyle(kid.item, it.style, this._styles);
      kid.item.classList.toggle("off", !it.shown);
      kid.item.classList.toggle("ghost", it.ghost);
      const layout = it.gridLayout ? "grid" : undefined;
      if (kid.hui.layout !== layout) kid.hui.layout = layout;
    });
    const fold = this._fold!;
    fold.hidden = !plan.folded;
    if (plan.folded) {
      const label = plan.foldLabel;
      const n = String(plan.folded);
      qs(fold, "span").textContent = this._expanded
        ? t(this._hass, "layout.less")
        : label
          ? label.replace("{count}", n)
          : t(this._hass, "layout.more", { count: n });
      qs(fold, "ha-icon").setAttribute(
        "icon",
        this._expanded ? "mdi:chevron-up" : "mdi:chevron-down",
      );
      fold.setAttribute("aria-expanded", String(this._expanded));
    } else this._expanded = false;
  }
}

registerCard(LayoutCard, {
  name: "Layout Card Pro",
  description:
    "Any cards in a grid, a stack or masonry, with breakpoints, spacing, spans and priority folding",
});
