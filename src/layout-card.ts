/*
 * layout-card-pro
 * A container for any cards: a grid (counts or tracks, spans, fixed rows) or masonry, with
 * breakpoints by the view columns the card spans, spacing, a seamless style and per-card
 * placement in each card's `view_layout`. Every child is a Home Assistant <hui-card>, so its own
 * `visibility` works as anywhere else.
 *
 * Config (see docs/cards/layout-card.md):
 *   type: custom:layout-card-pro
 *   layout: grid                  # grid | masonry
 *   columns: 1                    # n | [1fr, 2fr] | [320px, 1fr]
 *   breakpoints:
 *     2: { columns: 2 }           # from 2 view columns on
 *   cards:
 *     - type: custom:tile-card-pro
 *       entity: sensor.outdoor_temperature
 *       view_layout: { span: { 1: 1, 2: 2 } }
 */
import { defineElement, syncKeepHeight, registerCard } from "./shared/card.ts";
import { applyStyle, CardsBase, placeNodes } from "./shared/cards/base.ts";
import type { CardConfigBase } from "./shared/ha.ts";
import { LayoutCardEditor } from "./layout/editor.ts";
import { resolveOptions } from "./layout/breakpoints.ts";
import { CARD_TYPE, normalizeLayoutConfig, type LayoutConfig } from "./layout/config.ts";
import { cardSize, planLayout, type KidState, type Plan } from "./layout/place.ts";
import { fitColumns } from "./layout/units.ts";
import { STYLE } from "./layout/styles.ts";

export class LayoutCard extends CardsBase {
  static cardType = CARD_TYPE;

  _cfg?: LayoutConfig;
  // the columns min_column_width fitted last (kept while the width stays near it, and across a
  // new config: a masonry then keeps its cards where they are)
  _fitted?: number;
  _minProbe?: HTMLElement;

  static getConfigElement() {
    return document.createElement(`${CARD_TYPE}-editor`);
  }
  static getStubConfig() {
    return { layout: "grid", columns: 2, cards: [] };
  }

  setConfig(config: CardConfigBase | null | undefined) {
    const cfg = normalizeLayoutConfig(config);
    syncKeepHeight(this, config);
    this._cfg = cfg;
    this._load();
  }

  _childConfigs() {
    return this._cfg?.children.map((c) => c.config);
  }
  _style() {
    return STYLE;
  }
  _emptyKey() {
    return "layout.empty" as const;
  }

  _arrange(columns: number): boolean[] {
    const cfg = this._cfg!;
    let opts = resolveOptions(cfg, columns);
    const states: KidState[] = this._kids.map((k, i) => ({
      place: cfg.children[i].place,
      visible: this._visible(k),
      size: k.size,
      grid: k.hui.getGridOptions?.(),
    }));
    // as many columns of at least min_column_width as fit, measured before the cards are placed:
    // the layout's padding and gap first (the body's width does not hang on the count), so a
    // masonry deals its cards out once, never into a count it moves them out of again
    const min = opts.min_column_width;
    if (min !== null) {
      const most = opts.columns_set && typeof opts.columns === "number" ? opts.columns : 24;
      const pre = planLayout({ ...opts, columns: 1 }, states, columns);
      this._root!.className = ["root", ...pre.rootClass].join(" ");
      applyStyle(this._root!, pre.root, this._styles);
      applyStyle(this._body!, pre.body, this._styles);
      const n = this._fit(min, most);
      // (no width yet, the card not on the page: a masonry waits to deal its cards until it has
      // one, laid out again before the first paint; a grid moves no card, so 1 will do)
      if (n === null && this._fitted === undefined && opts.layout === "masonry") {
        this._size = 1;
        return states.map((k) => k.visible);
      }
      this._fitted = n ?? this._fitted ?? 1;
      opts = { ...opts, columns: this._fitted };
    }
    const plan = planLayout(opts, states, columns);
    this._apply(plan);
    this._size = cardSize(opts, states, plan);
    return plan.items.map((it) => it.shown);
  }

  // the columns of at least `min` that fit the body's width, its own gap between them (a % gap
  // resolved against that width); null where the body has no width yet
  _fit(min: string, most: number): number | null {
    const body = this._body!;
    let probe = this._minProbe;
    if (!probe || !probe.isConnected) {
      probe = document.createElement("div");
      probe.className = "minw";
      probe.setAttribute("aria-hidden", "true");
      this._root!.appendChild(probe);
      this._minProbe = probe;
    }
    probe.style.width = min;
    const cs = getComputedStyle(body);
    const width =
      body.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
    if (width <= 0) return null;
    const g = cs.columnGap;
    const gap = g.endsWith("%") ? (parseFloat(g) / 100) * width : parseFloat(g) || 0;
    return fitColumns(width, gap, probe.offsetWidth, most, this._fitted);
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
      const layout = it.gridLayout ? "grid" : undefined;
      if (kid.hui.layout !== layout) kid.hui.layout = layout;
    });
  }
}

registerCard(LayoutCard, {
  name: "Layout Card Pro",
  description: "Any cards in a grid or masonry, with breakpoints, spacing and spans",
});

defineElement(`${CARD_TYPE}-editor`, LayoutCardEditor);
