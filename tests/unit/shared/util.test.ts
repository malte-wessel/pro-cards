import { describe, it, expect } from "vitest";
import {
  isNum,
  isTemplate,
  numOrNull,
  decimalsOf,
  oneOf,
  qs,
  escapeHtml,
} from "../../../src/shared/util.ts";
import { cssColor } from "../../../src/shared/color.ts";

describe("small helpers", () => {
  it("isNum / isTemplate / cssColor", () => {
    expect(["12", 3, "-1.5", "1e3"].map(isNum)).toEqual([true, true, true, true]);
    expect(["", "unknown", "unavailable", null, undefined, "abc", {}].map(isNum)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
    expect(isTemplate("{{ x }}")).toBe(true);
    expect(isTemplate("{% x %}")).toBe(true);
    expect(isTemplate("x")).toBe(false);
    expect(isTemplate(5)).toBe(false);
    expect(cssColor("primary")).toBe("var(--primary-color)");
    expect(cssColor("amber")).toBe("var(--amber-color)");
    expect(cssColor("#fff")).toBe("#fff");
    expect(cssColor("rgb(1,2,3)")).toBe("rgb(1,2,3)");
    expect(cssColor(null, "fb")).toBe("fb");
  });
  it("numOrNull / decimalsOf", () => {
    expect([numOrNull("1.5"), numOrNull(""), numOrNull("x"), numOrNull(null)]).toEqual([
      1.5,
      null,
      null,
      null,
    ]);
    expect([decimalsOf("21.55"), decimalsOf("3"), decimalsOf("1.2345"), decimalsOf(null)]).toEqual([
      2, 0, 2, 0,
    ]);
  });
  it("oneOf narrows to the listed literals", () => {
    const list = ["a", "b"] as const;
    expect(oneOf(list, "a")).toBe(true);
    expect(oneOf(list, "c")).toBe(false);
    expect(oneOf(list, 1)).toBe(false);
    expect(oneOf(list, undefined)).toBe(false);
  });
  it("qs returns the first matching element", () => {
    const root = document.createElement("div");
    root.innerHTML = '<span class="x">1</span><span class="x">2</span>';
    expect(qs(root, ".x").textContent).toBe("1");
    expect(qs(root, ".missing")).toBe(null);
  });
  it("escapeHtml keeps text text, in a node and in a quoted attribute", () => {
    expect(escapeHtml(`a < b & "c" > 'd'`)).toBe("a &lt; b &amp; &quot;c&quot; &gt; &#39;d&#39;");
    expect(escapeHtml("21 °C")).toBe("21 °C");
  });
});

describe("numbers", () => {
  it("reads numbers and numeric strings, never booleans or blanks", () => {
    expect([1, "2", " 3 ", "-1.5", "1e3"].map(numOrNull)).toEqual([1, 2, 3, -1.5, 1000]);
    expect([true, false, " ", "", NaN, Infinity, [], "on"].map(numOrNull)).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
    expect([true, false, " "].map(isNum)).toEqual([false, false, false]);
  });
});
