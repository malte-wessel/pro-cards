/*
 * swipe-card-pro
 * Any cards side by side in a strip you swipe through, snapping to each card; a fraction of a
 * card per page lets the next one peek in, dots below show the page. From `unfold.from` view
 * columns on the cards are a plain grid instead. Every child is a Home Assistant <hui-card>, so
 * its own `visibility` works as anywhere else.
 *
 * Config (see docs/cards/swipe-card.md):
 *   type: custom:swipe-card-pro
 *   per_page: 1.15                  # a fraction lets the next card peek in
 *   gap: 8
 *   snap: start                     # start | center | free
 *   indicator: dots                 # dots | none
 *   unfold: { from: 2, columns: 3 } # from 2 view columns on: a grid
 *   cards:
 *     - type: custom:entity-card-pro
 *       entity: sensor.outdoor_temperature
 */
import { registerCard, syncKeepHeight } from "./shared/card.ts";
import { applyStyle, CardsBase, placeNodes, type Style } from "./shared/cards/base.ts";
import { themeGap } from "./shared/cards/units.ts";
import type { CardConfigBase } from "./shared/ha.ts";
import { t } from "./shared/i18n.ts";
import { CARD_TYPE, normalizeSwipeConfig, type SwipeConfig } from "./swipe/config.ts";
import { STYLE } from "./swipe/styles.ts";
import { nearest, sizeOf, slideWidth, stopsOf } from "./swipe/track.ts";

const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export class SwipeCard extends CardsBase {
  static cardType = CARD_TYPE;

  _cfg?: SwipeConfig;
  _dots?: HTMLElement;
  _strip = false; // the cards are in the strip now (not unfolded)
  _stops: number[] = []; // the scroll position of each page
  _scrollFrame = 0;

  static getStubConfig() {
    return { per_page: 1.15, cards: [] };
  }

  setConfig(config: CardConfigBase | null | undefined) {
    const cfg = normalizeSwipeConfig(config);
    syncKeepHeight(this, config);
    this._cfg = cfg;
    this._load();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    cancelAnimationFrame(this._scrollFrame);
    this._scrollFrame = 0;
  }

  _childConfigs() {
    return this._cfg?.cards;
  }
  _style() {
    return STYLE;
  }
  _emptyKey() {
    return "swipe.empty" as const;
  }

  _buildExtra(wrap: HTMLElement) {
    const dots = document.createElement("div");
    dots.className = "dots";
    dots.hidden = true;
    wrap.insertBefore(dots, this._note!);
    this._dots = dots;
    dots.addEventListener("click", (ev) => {
      const dot = (ev.target as HTMLElement).closest<HTMLElement>(".dot");
      if (dot) this._go(Number(dot.dataset.i));
    });
    // the current page follows the scroll, once a frame
    this._body!.addEventListener(
      "scroll",
      () => {
        if (this._scrollFrame) return;
        this._scrollFrame = requestAnimationFrame(() => {
          this._scrollFrame = 0;
          this._markPage();
        });
      },
      { passive: true },
    );
  }

  _arrange(columns: number): boolean[] {
    const cfg = this._cfg!;
    const root = this._root!;
    const body = this._body!;
    const shown = this._kids.map((k) => this._visible(k));
    const count = shown.filter(Boolean).length;
    const gap = cfg.gap ?? themeGap("column");
    const unfold = !!cfg.unfold && columns >= cfg.unfold.from;
    this._strip = !unfold;

    root.className = ["root", unfold ? "unfold" : "strip", unfold ? "" : cfg.snap]
      .filter(Boolean)
      .join(" ");
    const style: Style = {
      "align-items": cfg.height === "equal" ? "stretch" : "start",
      padding: cfg.padding ? cfg.padding.join(" ") : "0",
    };
    if (unfold) {
      style.display = "grid";
      style["grid-template-columns"] = `repeat(${cfg.unfold!.columns}, minmax(0, 1fr))`;
      style["row-gap"] = cfg.gap ?? themeGap("row");
      style["column-gap"] = gap;
    } else {
      style["--sw-slide"] = slideWidth(cfg.per_page, count, gap);
      style["column-gap"] = gap;
      // a card snaps to where the padding ends, not to the strip's edge
      if (cfg.padding) style["scroll-padding-inline"] = `${cfg.padding[3]} ${cfg.padding[1]}`;
    }
    applyStyle(body, style, this._styles);
    if (unfold) {
      body.removeAttribute("tabindex");
      body.removeAttribute("role");
      body.removeAttribute("aria-label");
    } else {
      // focusable, so the arrow keys scroll it
      body.tabIndex = 0;
      body.setAttribute("role", "region");
      body.setAttribute("aria-label", t(this._hass, "swipe.cards"));
    }

    placeNodes(
      body,
      this._kids.map((k) => k.item),
    );
    this._kids.forEach((k, i) => k.item.classList.toggle("off", !shown[i]));

    const sizes = this._kids.filter((_, i) => shown[i]).map((k) => (k.size > 0 ? k.size : 1));
    this._size = sizes.length ? sizeOf(sizes, unfold ? cfg.unfold!.columns : sizes.length) : 1;
    this._updateDots();
    return shown;
  }

  // the dots: one per page the strip stops at; none for a single page or unfolded cards
  _updateDots() {
    const cfg = this._cfg!;
    const body = this._body!;
    const dots = this._dots!;
    let stops: number[] = [];
    if (this._strip && cfg.indicator === "dots") {
      const cs = getComputedStyle(body);
      const slides = this._kids
        .filter((k) => !k.item.classList.contains("off"))
        .map((k) => ({ start: k.item.offsetLeft, width: k.item.offsetWidth }));
      stops = stopsOf(
        slides,
        body.clientWidth,
        body.scrollWidth - body.clientWidth,
        cfg.snap,
        Number.parseFloat(cs.paddingLeft) || 0,
        Number.parseFloat(cs.paddingRight) || 0,
      );
    }
    this._stops = stops;
    const n = stops.length > 1 ? stops.length : 0;
    while (dots.children.length > n) dots.lastElementChild!.remove();
    while (dots.children.length < n) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "dot";
      dot.dataset.i = String(dots.children.length);
      dots.appendChild(dot);
    }
    [...dots.children].forEach((dot, i) =>
      dot.setAttribute("aria-label", t(this._hass, "swipe.page", { n: i + 1, total: n })),
    );
    dots.hidden = !n;
    this._markPage();
  }

  // marks the dot of the page the strip shows now
  _markPage() {
    const dots = this._dots;
    if (!dots || dots.hidden) return;
    const page = nearest(this._stops, this._body!.scrollLeft);
    [...dots.children].forEach((dot, i) => {
      dot.classList.toggle("on", i === page);
      if (i === page) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
  }

  _go(page: number) {
    const left = this._stops[page];
    if (left === undefined) return;
    this._body!.scrollTo({ left, behavior: reducedMotion() ? "auto" : "smooth" });
  }
}

registerCard(SwipeCard, {
  name: "Swipe Card Pro",
  description: "Any cards side by side in a strip you swipe through, with dots",
});
