import { describe, it, expect } from "vitest";
import { defineHuiElements } from "../../docs/.vitepress/theme/ha-shim/hui-card.ts";
import { snapshot } from "../../docs/.vitepress/theme/ha-shim/hass.ts";
import { SwipeCard } from "../../src/swipe-card.ts";
import "../../src/entity-card.ts";
import { normalizeSwipeConfig } from "../../src/swipe/config.ts";
import { nearest, sizeOf, slideWidth, stopsOf } from "../../src/swipe/track.ts";
import type { HuiCardElement } from "../../src/shared/ha.ts";

defineHuiElements();

const cfg = (raw: Record<string, unknown>) =>
  normalizeSwipeConfig({ type: "custom:swipe-card-pro", ...raw });
// the card lays itself out again in the frame after it was connected (its section's columns)
const frame = () => new Promise((r) => requestAnimationFrame(r));
const tile = (entity: string, extra: Record<string, unknown> = {}) => ({
  type: "custom:entity-card-pro",
  entity,
  ...extra,
});

describe("swipe-card config", () => {
  it("fills in the defaults", () => {
    expect(cfg({})).toEqual({
      per_page: 1.15,
      gap: null,
      padding: null,
      snap: "start",
      height: "equal",
      indicator: "dots",
      unfold: null,
      cards: [],
    });
  });
  it("reads every option", () => {
    const c = cfg({
      per_page: 2.5,
      gap: 12,
      padding: [0, 16],
      snap: "center",
      height: "auto",
      indicator: "none",
      unfold: { from: 2, columns: 4 },
      cards: [tile("light.kitchen")],
    });
    expect(c.per_page).toBe(2.5);
    expect(c.gap).toBe("12px");
    expect(c.padding).toEqual(["0px", "16px", "0px", "16px"]);
    expect(c.snap).toBe("center");
    expect(c.height).toBe("auto");
    expect(c.indicator).toBe("none");
    expect(c.unfold).toEqual({ from: 2, columns: 4 });
    expect(c.cards).toHaveLength(1);
  });
  it("names the card and the option in its errors", () => {
    expect(() => normalizeSwipeConfig(null)).toThrow("swipe-card-pro: the config must be");
    expect(() => cfg({ cards: {} })).toThrow("'cards' must be a list");
    expect(() => cfg({ cards: [{}] })).toThrow("cards[0] must be a card config with a 'type'");
    expect(() => cfg({ per_page: 0.5 })).toThrow("'per_page' must be a number from 1 to 12");
    expect(() => cfg({ per_page: "2" })).toThrow("'per_page'");
    expect(() => cfg({ gap: "wide" })).toThrow("swipe-card-pro: 'gap' must be a length");
    expect(() => cfg({ snap: "end" })).toThrow("'snap' must be one of start, center, free");
    expect(() => cfg({ indicator: "bar" })).toThrow("'indicator' must be one of dots, none");
    expect(() => cfg({ unfold: 2 })).toThrow("'unfold' must be { from");
    expect(() => cfg({ unfold: { from: 2 } })).toThrow("'unfold.columns' must be a whole number");
    expect(() => cfg({ unfold: { from: 13, columns: 2 } })).toThrow("'unfold.from'");
    expect(() => cfg({ unfold: { from: 2, columns: 2, at: 1 } })).toThrow(
      "'unfold.at' is not an option",
    );
  });
});

describe("swipe-card track", () => {
  it("sizes a card so per_page of them fit across, the gaps between whole ones included", () => {
    expect(slideWidth(1, 4, "8px")).toBe("calc(100% / 1)");
    expect(slideWidth(1.15, 4, "8px")).toBe("calc((100% - 1 * 8px) / 1.15)");
    expect(slideWidth(2, 4, "8px")).toBe("calc((100% - 1 * 8px) / 2)");
    expect(slideWidth(2.5, 6, "8px")).toBe("calc((100% - 2 * 8px) / 2.5)");
  });
  it("never puts more on a page than there are cards: fewer cards fill the strip", () => {
    expect(slideWidth(1.15, 1, "8px")).toBe("calc(100% / 1)");
    expect(slideWidth(3, 2, "8px")).toBe("calc((100% - 1 * 8px) / 2)");
    expect(slideWidth(2, 0, "8px")).toBe("calc(100% / 1)");
  });
  // four cards of 100 px, 10 px apart, in a strip that shows 150 px of 430 (scrolls 280)
  const slides = [0, 110, 220, 330].map((start) => ({ start, width: 100 }));
  it("stops at each card's start, the last cards sharing the end", () => {
    expect(stopsOf(slides, 150, 280, "start", 0, 0)).toEqual([0, 110, 220, 280]);
    // a strip that shows more than one card: the last two share the end
    expect(stopsOf(slides, 250, 180, "start", 0, 0)).toEqual([0, 110, 180]);
    // nothing to scroll: one stop
    expect(stopsOf(slides.slice(0, 1), 150, 0, "start", 0, 0)).toEqual([0]);
  });
  it("stops where the padding ends, the strip's scroll padding", () => {
    const padded = slides.map((s) => ({ ...s, start: s.start + 16 }));
    expect(stopsOf(padded, 150, 312, "start", 16, 16)).toEqual([0, 110, 220, 312]);
  });
  it("centres a card for snap: center, the first and last as far as the strip scrolls", () => {
    expect(stopsOf(slides, 150, 280, "center", 0, 0)).toEqual([0, 85, 195, 280]);
  });
  it("finds the stop nearest to the scroll position", () => {
    const stops = [0, 110, 220, 280];
    expect(nearest(stops, 0)).toBe(0);
    expect(nearest(stops, 54)).toBe(0);
    expect(nearest(stops, 56)).toBe(1);
    expect(nearest(stops, 279)).toBe(3);
    expect(nearest([], 10)).toBe(0);
  });
  it("sizes the card by its tallest card per row", () => {
    expect(sizeOf([2, 4, 3], 3)).toBe(4);
    expect(sizeOf([2, 4, 3, 1], 2)).toBe(7);
    expect(sizeOf([], 2)).toBe(1);
  });
});

describe("swipe-card-pro element", () => {
  const make = (raw: Record<string, unknown>, columnSpan?: number) => {
    const el = document.createElement("swipe-card-pro") as SwipeCard;
    if (columnSpan) el.style.setProperty("--column-span", String(columnSpan));
    el.setConfig({ type: "custom:swipe-card-pro", ...raw });
    el.hass = snapshot();
    document.body.appendChild(el);
    return el;
  };
  const huis = (el: SwipeCard) => [...el.shadowRoot!.querySelectorAll<HuiCardElement>("hui-card")];
  const root = (el: SwipeCard) => el.shadowRoot!.querySelector<HTMLElement>(".root")!;
  const body = (el: SwipeCard) => el.shadowRoot!.querySelector<HTMLElement>(".body")!;

  it("is registered and sizes itself like a section card", () => {
    expect(customElements.get("swipe-card-pro")).toBe(SwipeCard);
    expect(window.customCards?.some((c) => c.type === "swipe-card-pro")).toBe(true);
    expect(SwipeCard.getStubConfig()).toEqual({ per_page: 1.15, cards: [] });
    const el = make({ cards: [] });
    expect(el.getGridOptions()).toEqual({ columns: "full", rows: "auto" });
    expect(el.connectedWhileHidden).toBe(true);
    el.layout = "panel";
    expect(el.hasAttribute("panel")).toBe(true);
    expect(() => el.setConfig({ type: "custom:swipe-card-pro", per_page: 0 })).toThrow(
      "swipe-card-pro:",
    );
    el.remove();
  });
  it("hosts each card in a hui-card and keeps it through hass and config changes", () => {
    const el = make({ cards: [tile("light.kitchen"), tile("light.living_room")] });
    const before = huis(el);
    expect(before).toHaveLength(2);
    expect(before[0].firstElementChild?.localName).toBe("entity-card-pro");
    el.hass = snapshot();
    el.setConfig({
      type: "custom:swipe-card-pro",
      per_page: 2,
      cards: [tile("light.kitchen"), tile("light.living_room")],
    });
    expect(huis(el)).toEqual(before);
    el.remove();
  });
  it("lays the cards out in a strip that snaps, with the slide width and the gap", () => {
    const el = make({
      per_page: 2.5,
      gap: 12,
      padding: [0, 16],
      snap: "center",
      height: "auto",
      cards: [tile("light.kitchen"), tile("light.living_room"), tile("light.office")],
    });
    expect(root(el).className).toBe("root strip center");
    const b = body(el);
    expect(b.style.getPropertyValue("--sw-slide")).toBe("calc((100% - 2 * 12px) / 2.5)");
    expect(b.style.getPropertyValue("column-gap")).toBe("12px");
    expect(b.style.getPropertyValue("scroll-padding-inline")).toBe("16px 16px");
    expect(b.style.getPropertyValue("align-items")).toBe("start");
    // focusable and named, so the arrow keys scroll it
    expect(b.tabIndex).toBe(0);
    expect(b.getAttribute("role")).toBe("region");
    expect(b.getAttribute("aria-label")).toBe("Cards");
    el.remove();
  });
  it("unfolds into a grid from the view columns in unfold.from", async () => {
    const raw = {
      unfold: { from: 2, columns: 3 },
      cards: [tile("light.kitchen"), tile("light.living_room")],
    };
    const narrow = make(raw, 1);
    await frame();
    expect(root(narrow).className).toBe("root strip start");
    narrow.remove();
    const wide = make(raw, 2);
    await frame();
    expect(root(wide).className).toBe("root unfold");
    const b = body(wide);
    expect(b.style.getPropertyValue("grid-template-columns")).toBe("repeat(3, minmax(0, 1fr))");
    expect(b.hasAttribute("tabindex")).toBe(false);
    expect(b.hasAttribute("role")).toBe(false);
    expect(wide.shadowRoot!.querySelector<HTMLElement>(".dots")!.hidden).toBe(true);
    wide.remove();
  });
  it("drops a hidden card, and hides itself when all are hidden", () => {
    const hidden = [{ condition: "state", entity: "light.kitchen", state: "nope" }];
    const el = make({ cards: [tile("light.kitchen", { visibility: hidden })] });
    const [hui] = huis(el);
    expect(hui.hidden).toBe(true);
    expect(hui.parentElement!.classList.contains("off")).toBe(true);
    expect(el.hasAttribute("hidden")).toBe(true);
    // the editor shows it anyway
    el.preview = true;
    expect(el.hasAttribute("hidden")).toBe(false);
    el.remove();
  });
  it("says what to do when it has no cards in the editor", () => {
    const el = make({ cards: [] });
    el.preview = true;
    const note = el.shadowRoot!.querySelector<HTMLElement>(".note")!;
    expect(note.hidden).toBe(false);
    expect(note.textContent).toBe("Add cards to swipe through");
    el.remove();
  });
});
