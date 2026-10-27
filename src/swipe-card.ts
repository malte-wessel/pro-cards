/*
 * swipe-card-pro
 * Any cards side by side in a strip you swipe through, snapping to each card; a fraction of a
 * card per page lets the next one peek in, dots below show the page; `unfold` makes them a plain
 * grid instead. Like the layout card's, its options change at breakpoints by the view columns the
 * card spans. Every child is a Home Assistant <hui-card>, so its own `visibility` works as
 * anywhere else.
 *
 * Config (see docs/cards/swipe-card.md):
 *   type: custom:swipe-card-pro
 *   per_page: 1.15                  # a fraction lets the next card peek in
 *   gap: 8
 *   snap: start                     # start | center | free
 *   indicator: dots                 # dots | none
 *   breakpoints:
 *     2: { per_page: 2.2 }          # from 2 view columns on
 *     3: { unfold: 4 }              # a grid of 4 from 3 view columns on
 *   cards:
 *     - type: custom:entity-card-pro
 *       entity: sensor.outdoor_temperature
 */
import { registerCard, syncKeepHeight } from "./shared/card.ts";
import { applyStyle, CardsBase, placeNodes, type Style } from "./shared/cards/base.ts";
import { resolveAt } from "./shared/cards/breakpoints.ts";
import { themeGap } from "./shared/cards/units.ts";
import { depsChanged } from "./shared/deps.ts";
import { langOf } from "./shared/format.ts";
import type { CardConfigBase } from "./shared/ha.ts";
import { t } from "./shared/i18n.ts";
import {
  CARD_TYPE,
  normalizeSwipeConfig,
  type SwipeConfig,
  type SwipeOptions,
} from "./swipe/config.ts";
import { STYLE } from "./swipe/styles.ts";
import { nearest, sizeOf, slideWidth, stopsOf } from "./swipe/track.ts";

const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
// the room above and below the cards inside the scrolling strip (which clips both ways): their
// shadows, focus rings and hover layers fit into it; a negative margin of the same keeps the
// strip where it would be without it
const BLEED = "8px";

export class SwipeCard extends CardsBase {
  static cardType = CARD_TYPE;

  _cfg?: SwipeConfig;
  _dots?: HTMLElement;
  _strip = false; // the cards are in the strip now (not unfolded)
  _opts?: SwipeOptions; // the options at the view columns the card spans now
  _stops: number[] = []; // the scroll position of each page, from the strip's start
  _rtl = false; // the strip scrolls from the right (scrollLeft from 0 down)
  // what the stops were measured for (_updateDots)
  _measured = new WeakMap<object, readonly unknown[]>();
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
    const o = resolveAt(this._cfg!.base, this._cfg!.breakpoints, columns);
    this._opts = o;
    const root = this._root!;
    const body = this._body!;
    const shown = this._kids.map((k) => this._visible(k));
    const count = shown.filter(Boolean).length;
    const gap = o.gap ?? themeGap("column");
    const unfold = o.unfold !== null;
    this._strip = !unfold;

    root.className = ["root", unfold ? "unfold" : "strip", unfold ? "" : o.snap]
      .filter(Boolean)
      .join(" ");
    const [top, right, bottom, left] = o.padding ?? ["0px", "0px", "0px", "0px"];
    const style: Style = {
      "align-items": o.height === "equal" ? "stretch" : "start",
      padding: `${top} ${right} ${bottom} ${left}`,
    };
    if (unfold) {
      style.display = "grid";
      style["grid-template-columns"] = `repeat(${o.unfold}, minmax(0, 1fr))`;
      style["row-gap"] = o.gap ?? themeGap("row");
      style["column-gap"] = gap;
    } else {
      style["--sw-slide"] = slideWidth(o.per_page, count, gap);
      style["column-gap"] = gap;
      style.padding = `calc(${top} + ${BLEED}) ${right} calc(${bottom} + ${BLEED}) ${left}`;
      style["margin-block"] = `calc(-1 * ${BLEED})`;
      // a card snaps to where the padding ends, not to the strip's edge
      style["scroll-padding-left"] = left;
      style["scroll-padding-right"] = right;
    }
    applyStyle(body, style, this._styles);

    placeNodes(
      body,
      this._kids.map((k) => k.item),
    );
    this._kids.forEach((k, i) => k.item.classList.toggle("off", !shown[i]));

    const sizes = this._kids.filter((_, i) => shown[i]).map((k) => (k.size > 0 ? k.size : 1));
    this._size = sizes.length ? sizeOf(sizes, o.unfold ?? sizes.length) : 1;
    this._updateDots(columns);
    return shown;
  }

  // The stops of the strip, its dots (one per stop; none for a single page, unfolded cards or
  // indicator: none) and its focus (only a strip that scrolls takes it, so the arrow keys scroll
  // it). Measured again only when what they follow changed: the strip's width, the cards shown,
  // the config and the view columns (its breakpoints), the theme (its gap), the language (the
  // labels, the direction); a strip measured while hidden, at no width, measured nothing and is
  // measured the next time.
  _updateDots(columns: number) {
    const o = this._opts!;
    const body = this._body!;
    const shown = this._kids.filter((k) => !k.item.classList.contains("off")).map((k) => k.item);
    const deps = [
      this._cfg,
      columns,
      this._strip,
      this._width,
      this._hass?.themes,
      langOf(this._hass),
      ...shown,
    ];
    if (!depsChanged(this._measured, this, deps)) return this._markPage();

    let stops: number[] = [];
    if (this._strip) {
      const cs = getComputedStyle(body);
      this._rtl = cs.direction === "rtl";
      // each card's distance from the strip's start edge, wherever it is scrolled: offsets are
      // from the strip's left padding edge (it is their offsetParent), and unlike a bounding box
      // they ignore transforms (a dialog that opens by scaling up)
      const slides = shown.map((item) => ({
        start: this._rtl ? body.clientWidth - item.offsetLeft - item.offsetWidth : item.offsetLeft,
        width: item.offsetWidth,
      }));
      const padLeft = Number.parseFloat(cs.paddingLeft) || 0;
      const padRight = Number.parseFloat(cs.paddingRight) || 0;
      stops = stopsOf(
        slides,
        body.clientWidth,
        body.scrollWidth - body.clientWidth,
        o.snap,
        this._rtl ? padRight : padLeft,
        this._rtl ? padLeft : padRight,
      );
      if (!body.clientWidth) this._measured.delete(this);
    }
    this._stops = stops;

    if (stops.length > 1) {
      body.tabIndex = 0;
      body.setAttribute("role", "region");
      body.setAttribute("aria-label", t(this._hass, "swipe.cards"));
    } else {
      body.removeAttribute("tabindex");
      body.removeAttribute("role");
      body.removeAttribute("aria-label");
    }

    const dots = this._dots!;
    const n = o.indicator === "dots" && stops.length > 1 ? stops.length : 0;
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
    const page = nearest(this._stops, Math.abs(this._body!.scrollLeft));
    [...dots.children].forEach((dot, i) => {
      dot.classList.toggle("on", i === page);
      if (i === page) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
  }

  _go(page: number) {
    const at = this._stops[page];
    if (at === undefined) return;
    this._body!.scrollTo({
      left: this._rtl ? -at : at,
      behavior: reducedMotion() ? "auto" : "smooth",
    });
  }
}

registerCard(SwipeCard, {
  name: "Swipe Card Pro",
  description: "Any cards side by side in a strip you swipe through, with dots",
});
