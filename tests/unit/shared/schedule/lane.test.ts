import { describe, it, expect } from "vitest";
import { aheadAxisHtml, dayAxisHtml, laneHtml, pct } from "../../../../src/shared/schedule/lane.ts";
import type { HomeAssistant } from "../../../../src/shared/ha.ts";

const hass = (time_format: string) =>
  ({ locale: { language: "en", time_format } }) as unknown as HomeAssistant;
const parse = (html: string) => {
  const el = document.createElement("div");
  el.innerHTML = html;
  return el;
};

describe("a schedule's lane", () => {
  it("places a minute as a share of the span", () => {
    expect(pct(360)).toBe("25.000%");
    expect(pct(30, 120)).toBe("25.000%");
  });
  it("draws the blocks, the one that runs outlined, the six-hour lines and the line at now", () => {
    const el = parse(
      laneHtml(
        [
          { from: 360, to: 510 },
          { from: 1020, to: 1350, cur: true },
        ],
        1080,
        true,
      ),
    );
    const blocks = [...el.querySelectorAll<HTMLElement>(".sb")];
    expect(blocks.map((b) => [b.style.left, b.style.width])).toEqual([
      ["25.000%", "10.417%"],
      ["70.833%", "22.917%"],
    ]);
    expect(blocks.map((b) => b.classList.contains("cur"))).toEqual([false, true]);
    expect(el.querySelectorAll(".sgrid")).toHaveLength(3);
    expect(el.querySelector<HTMLElement>(".snow")?.style.left).toBe("75.000%");
  });
  it("leaves out the lines and the line at now when asked", () => {
    const el = parse(laneHtml([{ from: 0, to: 60 }], null, false, 120));
    expect(el.querySelectorAll(".sgrid, .snow")).toHaveLength(0);
    expect(el.querySelector<HTMLElement>(".sb")?.style.width).toBe("50.000%");
  });
  it("labels a day's axis in the profile's time format, the next 24 hours from now", () => {
    const day = (f: string) =>
      [...parse(dayAxisHtml(hass(f))).querySelectorAll(".slbl")].map((l) => l.textContent);
    expect(day("24")).toEqual(["00:00", "06:00", "12:00", "18:00", "24:00"]);
    expect(day("12")[1]).toMatch(/^6\sAM$/);
    const ahead = [...parse(aheadAxisHtml(hass("24"))).querySelectorAll(".slbl")];
    expect(ahead.map((l) => l.textContent)).toEqual(["now", "+6 h", "+12 h", "+18 h", "+24 h"]);
    // the quarters can go on a narrow lane
    expect(ahead.map((l) => l.classList.contains("q"))).toEqual([false, true, false, true, false]);
  });
});
