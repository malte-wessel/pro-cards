import { afterEach, describe, expect, it, vi } from "vitest";
import { rangeAt } from "../../../src/shared/calendar.ts";
import { openDatePicker } from "../../../src/shared/datepicker.ts";
import type { HomeAssistant } from "../../../src/shared/ha.ts";

const HASS = { locale: { language: "en" } } as unknown as HomeAssistant;
const TZ = "Europe/Berlin";

const setup = () => {
  const host = document.createElement("div");
  const anchor = document.createElement("button");
  host.appendChild(anchor);
  document.body.appendChild(host);
  return { host, anchor };
};
const open = (anchor: HTMLElement, host: HTMLElement, start: number, end: number) =>
  openDatePicker(anchor, host, { hass: HASS, tz: TZ, lang: "en", start, end, onPick: vi.fn() });

describe("date picker", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("highlights the quick pick of the period shown, a running one too", () => {
    const { host, anchor } = setup();
    const week = rangeAt("week", Date.now(), Date.now(), TZ);
    open(anchor, host, week.start, week.end);
    expect([...host.querySelectorAll(".dp-preset.on")].map((b) => b.textContent)).toContain(
      "This week",
    );
  });

  it("closes the calendar it replaces, its listeners with it", () => {
    const { host, anchor } = setup();
    const day = rangeAt("day", Date.now(), Date.now(), TZ);
    const close = open(anchor, host, day.start, day.end);
    open(anchor, host, day.start, day.end);
    expect(host.querySelectorAll(".dp")).toHaveLength(1);
    expect(anchor.getAttribute("aria-expanded")).toBe("true");
    // a touch on the new calendar keeps it open: the old one heard nothing of it
    host
      .querySelector(".dp-cell")!
      .dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(host.querySelectorAll(".dp")).toHaveLength(1);
    expect(anchor.getAttribute("aria-expanded")).toBe("true");
    // the old close does nothing more
    close();
    expect(host.querySelectorAll(".dp")).toHaveLength(1);
  });
});
