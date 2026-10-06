// The shared slider on its own (happy-dom): what it reads out, how the keys move it and when a
// gesture starts and ends. Pointer drags need layout and live in the e2e specs of the cards that
// draw it (controls, sun azimuth).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { slider, type SliderSpec } from "../../../src/shared/slider.ts";
import { snapTo } from "../../../src/shared/util.ts";

const make = (over: Partial<SliderSpec> = {}) => {
  const log: string[] = [];
  const s = slider({
    min: 0,
    max: 359,
    step: 1,
    value: 180,
    label: "Camera",
    text: (v) => `${v}°`,
    onStart: () => log.push("start"),
    onInput: (v) => log.push(`input ${v}`),
    onEnd: (v) => log.push(`end ${v}`),
    ...over,
  });
  document.body.appendChild(s.el);
  return { ...s, log };
};
const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("slider", () => {
  it("is a focusable slider that reads out its value", () => {
    const { el } = make();
    expect(el.classList.contains("ctl-slider")).toBe(true);
    expect(el.getAttribute("role")).toBe("slider");
    expect(el.tabIndex).toBe(0);
    expect(el.getAttribute("aria-label")).toBe("Camera");
    expect(el.getAttribute("aria-valuemin")).toBe("0");
    expect(el.getAttribute("aria-valuemax")).toBe("359");
    expect(el.getAttribute("aria-valuenow")).toBe("180");
    expect(el.getAttribute("aria-valuetext")).toBe("180°");
    expect(el.querySelector<HTMLElement>(".bubble")?.textContent).toBe("180°");
    expect(el.querySelector<HTMLElement>(".knob")?.style.left).toBe("50.1%");
    expect(el.querySelector<HTMLElement>(".fill")?.style.width).toBe("50.1%");
  });
  it("builds into the element it is given", () => {
    const host = document.createElement("div");
    host.className = "ctl sm";
    const { el } = slider({ min: 0, max: 10, step: 1, value: 5, label: "x", text: String }, host);
    expect(el).toBe(host);
    expect(el.className).toBe("ctl sm ctl-slider");
  });
  it("paint draws a value without reporting it", () => {
    const { el, paint, log } = make();
    paint(90);
    expect(el.getAttribute("aria-valuenow")).toBe("90");
    expect(log).toEqual([]);
  });
  it("steps with the keys and ends a burst after a pause", () => {
    const { el, log } = make();
    key(el, "ArrowRight");
    key(el, "ArrowUp");
    key(el, "ArrowLeft");
    key(el, "PageUp");
    expect(el.getAttribute("aria-valuenow")).toBe("191");
    expect(log).toEqual(["start", "input 181", "input 182", "input 181", "input 191"]);
    vi.advanceTimersByTime(249);
    expect(log).not.toContain("end 191");
    vi.advanceTimersByTime(1);
    expect(log.at(-1)).toBe("end 191");
    // a new burst starts again
    key(el, "PageDown");
    expect(log.slice(-2)).toEqual(["start", "input 181"]);
  });
  it("Home and End go to the bounds, and steps stop there", () => {
    const { el } = make();
    key(el, "End");
    key(el, "ArrowRight");
    expect(el.getAttribute("aria-valuenow")).toBe("359");
    key(el, "Home");
    key(el, "PageDown");
    expect(el.getAttribute("aria-valuenow")).toBe("0");
  });
  it("leaves other keys alone", () => {
    const { el, log } = make();
    const ev = new KeyboardEvent("keydown", { key: "a", cancelable: true });
    el.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
    expect(log).toEqual([]);
  });
  it("a disabled slider shows its value and ignores the keys", () => {
    const { el, log } = make({ disabled: true, value: 20 });
    key(el, "ArrowRight");
    expect(el.getAttribute("aria-valuenow")).toBe("20");
    expect(log).toEqual([]);
  });
});

describe("snapTo", () => {
  it("counts steps from the minimum and stays inside the bounds", () => {
    expect(snapTo(6, 1, 9, 2)).toBe(7);
    expect(snapTo(0, 1, 9, 2)).toBe(1);
    expect(snapTo(12, 1, 9, 2)).toBe(9);
    expect(snapTo(0.1 + 0.2, 0, 1, 0.1)).toBe(0.3);
    expect(snapTo(1.23456, 0, 2, 0.0001)).toBe(1.2346);
  });
});
