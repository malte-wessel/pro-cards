import { describe, it, expect } from "vitest";
import {
  TILE_PRIMARY,
  TILE_SECONDARY,
  font,
  fs,
  fw,
  lh,
  TextCache,
  textStyle,
  themeChanged,
  type,
} from "../../../src/shared/typography.ts";
import type { HomeAssistant } from "../../../src/shared/ha.ts";

describe("typography tokens", () => {
  it("a size on Home Assistant's scale is its token, falling back to the px size", () => {
    expect(fs(10)).toBe("var(--ha-font-size-xs, 10px)");
    expect(fs(12)).toBe("var(--ha-font-size-s, 12px)");
    expect(fs(14)).toBe("var(--ha-font-size-m, 14px)");
    expect(fs(40)).toBe("var(--ha-font-size-5xl, 40px)");
  });
  it("a size between the steps follows the nearest step in proportion", () => {
    expect(fs(13)).toBe("calc(var(--ha-font-size-s, 12px) * 13 / 12)");
    expect(fs(9)).toBe("calc(var(--ha-font-size-xs, 10px) * 9 / 10)");
    expect(fs(22)).toBe("calc(var(--ha-font-size-xl, 20px) * 22 / 20)");
    expect(fs(34)).toBe("calc(var(--ha-font-size-4xl, 32px) * 34 / 32)");
  });
  it("a line height alone grows with its size too", () => {
    expect(lh(10, 12)).toBe("calc(var(--ha-font-size-xs, 10px) * 12 / 10)");
  });
  it("a line height grows with its size and is the px height at the default", () => {
    expect(type(12, 16)).toBe(
      "font-size: var(--ha-font-size-s, 12px); line-height: calc(var(--ha-font-size-s, 12px) * 16 / 12);",
    );
  });
  it("weights and the font shorthand read the theme's tokens", () => {
    expect(fw("medium")).toBe("var(--ha-font-weight-medium, 500)");
    expect(fw("light")).toBe("var(--ha-font-weight-light, 300)");
    expect(font(10, 12)).toBe(
      "font: var(--ha-font-weight-normal, 400) var(--ha-font-size-xs, 10px)/calc(var(--ha-font-size-xs, 10px) * 12 / 10) var(--ha-font-family-body, Roboto, system-ui, sans-serif);",
    );
  });
  it("a tile's lines read Home Assistant's tile variables first", () => {
    for (const p of ["font-size", "font-weight", "line-height", "letter-spacing", "color"]) {
      expect(TILE_PRIMARY).toContain(`var(--ha-tile-info-primary-${p},`);
      expect(TILE_SECONDARY).toContain(`var(--ha-tile-info-secondary-${p},`);
    }
    expect(TILE_SECONDARY).toContain("var(--secondary-text-color)");
  });
});

describe("textStyle", () => {
  it("falls back to the default size where nothing is laid out", () => {
    const el = document.createElement("div");
    expect(textStyle(el, ["label"], [10, 12])).toEqual({
      font: "400 10px Roboto, system-ui, sans-serif",
      size: 10,
      line: 12,
    });
  });
  it("leaves no probe behind", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    textStyle(el, ["plabel", "state"], [14, 17, 500]);
    expect(el.childElementCount).toBe(0);
    el.remove();
  });
});

describe("TextCache", () => {
  it("measures a style once on the page, never before", () => {
    const cache = new TextCache();
    const el = document.createElement("div");
    const off = cache.get(el, ["label"], [10, 12]);
    expect(off.size).toBe(10);
    expect(cache._styles.size).toBe(0); // not kept: measured off the page
    document.body.appendChild(el);
    cache.get(el, ["label"], [10, 12]);
    expect(cache._styles.size).toBe(1);
    expect(cache.get(el, ["label"], [10, 12])).toBe(cache._styles.get("label"));
    cache.clear();
    expect(cache._styles.size).toBe(0);
    el.remove();
  });
});

describe("themeChanged", () => {
  const hass = (themes: object) => ({ themes }) as unknown as HomeAssistant;
  it("is true only for a new themes object", () => {
    const t = { darkMode: false };
    expect(themeChanged(hass(t), hass(t))).toBe(false);
    expect(themeChanged(hass(t), hass({ darkMode: false }))).toBe(true);
    expect(themeChanged(undefined, hass(t))).toBe(false);
  });
});
