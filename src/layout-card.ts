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
 *     - type: custom:entity-card-pro
 *       entity: sensor.outdoor_temperature
 *       view_layout: { span: { 1: 1, 2: 2 } }
 */
import { syncKeepHeight, registerCard } from "./shared/card.ts";
import { applyStyle, CardsBase, placeNodes } from "./shared/cards/base.ts";
import type { CardConfigBase } from "./shared/ha.ts";
import { resolveOptions } from "./layout/breakpoints.ts";
import { CARD_TYPE, normalizeLayoutConfig, type LayoutConfig } from "./layout/config.ts";
import { cardSize, planLayout, type KidState, type Plan } from "./layout/place.ts";
import { STYLE } from "./layout/styles.ts";

export class LayoutCard extends CardsBase {
  static cardType = CARD_TYPE;

  _cfg?: LayoutConfig;

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
    const opts = resolveOptions(cfg, columns);
    const states: KidState[] = this._kids.map((k, i) => ({
      place: cfg.children[i].place,
      visible: this._visible(k),
      size: k.size,
      grid: k.hui.getGridOptions?.(),
    }));
    const plan = planLayout(opts, states, columns);
    this._apply(plan);
    this._size = cardSize(opts, states, plan);
    return plan.items.map((it) => it.shown);
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
