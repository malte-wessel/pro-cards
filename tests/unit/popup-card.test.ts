import { describe, it, expect } from "vitest";
import { defineHuiElements } from "../../docs/.vitepress/theme/ha-shim/hui-card.ts";
import { snapshot } from "../../docs/.vitepress/theme/ha-shim/hass.ts";
import { PopupCard } from "../../src/popup-card.ts";
import { PopupCardEditor } from "../../src/popup/editor.ts";
import "../../src/tile-card.ts";
import "../../src/heading-card.ts";
import { normalizePopupConfig, parseHash } from "../../src/popup/config.ts";
import {
  closeDuration,
  MIN_STEP,
  poseOf,
  rubber,
  settleAt,
  shouldClose,
  speedOf,
  takesMove,
} from "../../src/popup/gesture.ts";
import { cellOf, spanOf } from "../../src/popup/place.ts";
import { ROW_HEIGHT } from "../../src/shared/cards/units.ts";
import type { HuiCardElement } from "../../src/shared/ha.ts";

defineHuiElements();

const cfg = (raw: Record<string, unknown>) =>
  normalizePopupConfig({ type: "custom:popup-card-pro", hash: "kitchen", ...raw });
const tile = (entity: string, extra: Record<string, unknown> = {}) => ({
  type: "custom:tile-card-pro",
  entity,
  ...extra,
});

describe("popup-card config", () => {
  it("fills in the defaults: no header without a title, subtitle, icon or badges", () => {
    expect(cfg({})).toEqual({
      hash: "kitchen",
      width: "normal",
      height: "auto",
      header: null,
      cards: [],
      visibility: null,
    });
  });
  it("makes the header a heading card of the title, subtitle, icon and badges", () => {
    const c = cfg({
      title: "Kitchen",
      subtitle: "Ground floor",
      icon: "mdi:countertops",
      badges: ["sensor.kitchen_temperature"],
      width: "wide",
      height: "full",
      cards: [tile("light.kitchen")],
    });
    expect(c.header).toEqual({
      type: "custom:heading-card-pro",
      style: "title",
      title: "Kitchen",
      subtitle: "Ground floor",
      icon: "mdi:countertops",
      badges: ["sensor.kitchen_temperature"],
    });
    expect(c.width).toBe("wide");
    expect(c.height).toBe("full");
    expect(c.cards).toHaveLength(1);
  });
  it("reads its visibility, which decides whether it opens", () => {
    const vis = [{ condition: "state", entity: "light.kitchen", state: "on" }];
    expect(cfg({ visibility: vis }).visibility).toHaveLength(1);
  });
  it("takes the hash with or without its #", () => {
    expect(parseHash("#living-room")).toBe("living-room");
    expect(parseHash("living_room2")).toBe("living_room2");
  });
  it("names the card and the option in its errors", () => {
    const bad = (raw: Record<string, unknown>) => () =>
      normalizePopupConfig({ type: "custom:popup-card-pro", ...raw });
    expect(bad({})).toThrow("popup-card-pro: 'hash' is required");
    expect(bad({ hash: "living room" })).toThrow("'hash' may hold letters, digits, - and _");
    expect(bad({ hash: "a", width: "huge" })).toThrow("'width' must be one of normal, wide, full");
    expect(bad({ hash: "a", height: "half" })).toThrow("'height' must be one of auto, full");
    expect(bad({ hash: "a", title: 3 })).toThrow("'title' must be text");
    expect(bad({ hash: "a", badges: "sensor.x" })).toThrow("'badges' must be a list");
    expect(bad({ hash: "a", cards: [{ entity: "light.kitchen" }] })).toThrow(
      "cards[0] must be a card config with a 'type'",
    );
  });
});

describe("popup-card place", () => {
  it("spans the columns a card asks for, all twelve for full or none", () => {
    expect(spanOf({ columns: 6 })).toBe(6);
    expect(spanOf({ columns: "full" })).toBe(12);
    expect(spanOf(undefined)).toBe(12);
    expect(spanOf({ columns: 20 })).toBe(12);
    expect(spanOf({ columns: 0 })).toBe(1);
  });
  it("gives a card with rows that many rows and their gaps, and fills them", () => {
    expect(cellOf({ columns: 6, rows: "auto" }, "8px")).toEqual({
      style: { "grid-column": "span 6" },
      gridLayout: false,
    });
    expect(cellOf({ columns: 12, rows: 2 }, "8px")).toEqual({
      style: {
        "grid-column": "span 12",
        "grid-row": "span 2",
        height: `calc(2 * ${ROW_HEIGHT} + 1 * 8px)`,
      },
      gridLayout: true,
    });
  });
});

describe("popup-card gesture", () => {
  it("stretches a little beyond the full height, never far", () => {
    expect(rubber(0)).toBe(0);
    expect(rubber(100)).toBeGreaterThan(20);
    expect(rubber(10000)).toBeLessThanOrEqual(48);
  });
  it("grows from its content's height to the full height, and moves down below it", () => {
    // content 300 px, full 800 px
    expect(poseOf(300, 300, 800)).toEqual({ height: 300, shift: 0 });
    expect(poseOf(500, 300, 800)).toEqual({ height: 500, shift: 0 });
    expect(poseOf(200, 300, 800)).toEqual({ height: 300, shift: 100 });
    const beyond = poseOf(900, 300, 800);
    expect(beyond.height).toBeGreaterThan(800);
    expect(beyond.height).toBeLessThan(848);
  });
  it("settles at the height nearer to where its speed carries it", () => {
    expect(settleAt(600, 0, 300, 800)).toBe("full");
    expect(settleAt(500, 0, 300, 800)).toBe("content");
    // a flick up from just above the content's height, a flick down from just below the full one
    expect(settleAt(350, -1.5, 300, 800)).toBe("full");
    expect(settleAt(750, 1.5, 300, 800)).toBe("content");
    // from the full height a flick down never closes it at once
    expect(settleAt(760, 3, 300, 800)).toBe("content");
  });
  it("closes past a third of its content's height or on a flick down, never on a flick up", () => {
    expect(settleAt(250, 0, 300, 800)).toBe("content");
    expect(settleAt(150, 0, 300, 800)).toBe("closed");
    expect(settleAt(280, 0.8, 300, 800)).toBe("closed");
    expect(settleAt(150, -0.5, 300, 800)).toBe("content");
    expect(shouldClose(100, 300, 0)).toBe(true);
    expect(shouldClose(50, 300, 0.6)).toBe(true);
    expect(shouldClose(200, 300, -0.4)).toBe(false);
  });
  it("has one height when its content nearly fills the full one", () => {
    expect(settleAt(800, -2, 800 - MIN_STEP + 1, 800)).toBe("content");
  });
  it("takes a vertical move from the handle, a pull down at the top, a push up while it grows", () => {
    // (dx, dy, onHandle, atTop, canGrow)
    expect(takesMove(0, 20, true, false, false)).toBe(true);
    expect(takesMove(0, -20, true, false, false)).toBe(true);
    expect(takesMove(0, 20, false, true, false)).toBe(true);
    expect(takesMove(0, 20, false, false, false)).toBe(false);
    expect(takesMove(0, -20, false, true, true)).toBe(true);
    expect(takesMove(0, -20, false, true, false)).toBe(false);
    // a sideways move stays with the cards (a slider, a swipe card)
    expect(takesMove(20, 10, true, true, true)).toBe(false);
  });
  it("measures the speed over the samples and closes at the finger's pace", () => {
    expect(speedOf([{ y: 0, t: 0 }])).toBe(0);
    expect(
      speedOf([
        { y: 0, t: 0 },
        { y: 50, t: 100 },
      ]),
    ).toBe(0.5);
    expect(closeDuration(300, 300, 0)).toBe(300);
    expect(closeDuration(300, 300, 10)).toBe(140);
    expect(closeDuration(1000, 300, 0)).toBe(320);
  });
});

describe("popup-card-pro element", () => {
  const make = (raw: Record<string, unknown>) => {
    const el = document.createElement("popup-card-pro") as PopupCard;
    el.setConfig({ type: "custom:popup-card-pro", hash: "kitchen", ...raw });
    el.hass = snapshot();
    document.body.appendChild(el);
    return el;
  };
  const sheet = (el: PopupCard) => el.shadowRoot!.querySelector<HTMLElement>(".inline .sheet");

  it("is registered and takes the whole width of its section", () => {
    expect(customElements.get("popup-card-pro")).toBe(PopupCard);
    expect(window.customCards?.some((c) => c.type === "popup-card-pro")).toBe(true);
    expect(PopupCard.getStubConfig()).toEqual({ hash: "popup", title: "Pop-up", cards: [] });
    const de = { ...snapshot(), locale: { ...snapshot().locale, language: "de" } };
    expect(PopupCard.getStubConfig(de).title).toBe("Pop-up");
    const ru = { ...snapshot(), locale: { ...snapshot().locale, language: "ru" } };
    expect(PopupCard.getStubConfig(ru).title).toBe("Всплывающее окно");
    const el = make({ cards: [] });
    expect(el.getGridOptions()).toEqual({ columns: "full", rows: "auto" });
    expect(el.connectedWhileHidden).toBe(true);
    expect(() => el.setConfig({ type: "custom:popup-card-pro" })).toThrow("popup-card-pro:");
    el.remove();
  });
  it("takes no room on the dashboard while closed, its cards off the page", () => {
    const el = make({ cards: [tile("light.kitchen")] });
    expect(el.hasAttribute("hidden")).toBe(true);
    expect(sheet(el)).toBeNull();
    expect(document.querySelector(".pro-cards-popup")).toBeNull();
    el.remove();
  });
  it("shows inline in the editor's preview: the header, Open and its cards in the grid", () => {
    const el = make({
      title: "Kitchen",
      cards: [tile("light.kitchen"), tile("light.living_room")],
    });
    el.preview = true;
    expect(el.hasAttribute("hidden")).toBe(false);
    const s = sheet(el)!;
    expect(s).not.toBeNull();
    expect(s.getAttribute("aria-label")).toBe("Kitchen");
    // a part of the card here, a dialog only while open
    expect(s.hasAttribute("role")).toBe(false);
    expect(s.querySelector<HTMLElement>(".open")!.hidden).toBe(false);
    expect(s.querySelector<HTMLElement>(".open")!.textContent).toBe("Open");
    expect(s.querySelector<HTMLElement>(".x")!.hidden).toBe(true);
    const head = s.querySelector<HuiCardElement>(".heading hui-card")!;
    expect(head.firstElementChild?.localName).toBe("heading-card-pro");
    const items = [...s.querySelectorAll<HTMLElement>(".body > .item")];
    expect(items).toHaveLength(2);
    // a tile asks for half the section's twelve columns
    expect(items[0].style.getPropertyValue("grid-column")).toBe("span 6");
    el.preview = false;
    expect(el.hasAttribute("hidden")).toBe(true);
    expect(sheet(el)).toBeNull();
    el.remove();
  });
  it("says what to do when it has no cards in the editor", () => {
    const el = make({ cards: [] });
    el.preview = true;
    const note = el.shadowRoot!.querySelector<HTMLElement>(".note")!;
    expect(note.hidden).toBe(false);
    expect(note.textContent).toBe("Add cards to the pop-up");
    el.remove();
  });
  it("names a dialog without a title, or with a template for one, a pop-up", () => {
    const el = make({ title: "{{ states('sensor.kitchen_temperature') }}", cards: [] });
    el.preview = true;
    expect(sheet(el)!.getAttribute("aria-label")).toBe("Pop-up");
    el.remove();
  });
  it("offers no Open inside Home Assistant's card editor dialog, whose preview it is", () => {
    const dialog = document.createElement("hui-dialog-edit-card");
    document.body.appendChild(dialog);
    const el = document.createElement("popup-card-pro") as PopupCard;
    el.setConfig({ type: "custom:popup-card-pro", hash: "kitchen", cards: [] });
    el.hass = snapshot();
    el.preview = true;
    dialog.appendChild(el);
    expect(sheet(el)!.querySelector<HTMLElement>(".open")!.hidden).toBe(true);
    dialog.remove();
  });
});

describe("popup-card editor", () => {
  const editor = () => document.createElement("popup-card-pro-editor") as PopupCardEditor;
  it("writes back only what the form changed, the badges as written", () => {
    const prev = {
      type: "custom:popup-card-pro",
      hash: "kitchen",
      badges: ["sensor.kitchen_temperature", { entity: "light.kitchen", color: "amber" }],
      cards: [],
    };
    const ed = editor();
    const data = { ...ed._optionsToForm(prev), title: "Kitchen" };
    expect(ed._optionsFromForm(data, prev)).toEqual({ ...prev, title: "Kitchen" });
    // a default chosen in the form writes nothing
    expect(ed._optionsFromForm({ ...ed._optionsToForm(prev), height: "auto" }, prev)).toEqual(prev);
    expect(ed._optionsFromForm({ ...ed._optionsToForm(prev), badges: [] }, prev)).toEqual({
      type: "custom:popup-card-pro",
      hash: "kitchen",
      cards: [],
    });
  });
});
