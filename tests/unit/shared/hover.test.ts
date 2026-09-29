import { describe, it, expect } from "vitest";
import { nearestPoint, placeTip, hideHover } from "../../../src/shared/hover.ts";

describe("hover helpers", () => {
  const pts = [
    { t: 0, v: 1 },
    { t: 10, v: 2 },
    { t: 30, v: 3 },
  ];
  it("finds the nearest point by time", () => {
    expect(nearestPoint(pts, -5)).toBe(pts[0]);
    expect(nearestPoint(pts, 4)).toBe(pts[0]);
    expect(nearestPoint(pts, 6)).toBe(pts[1]);
    expect(nearestPoint(pts, 21)).toBe(pts[2]);
    expect(nearestPoint(pts, 99)).toBe(pts[2]);
    expect(nearestPoint([], 1)).toBe(null);
    expect(nearestPoint(null, 1)).toBe(null);
  });
  it("places the tooltip beside the crosshair, flipped near the right edge", () => {
    const plot = { clientWidth: 200 } as HTMLElement;
    const tip = { offsetWidth: 50, style: {} as CSSStyleDeclaration } as HTMLElement;
    placeTip(plot, tip, 20);
    expect(tip.style.left).toBe("30px");
    placeTip(plot, tip, 180);
    expect(tip.style.left).toBe("120px");
    placeTip(plot, tip, 0, 40); // never left of the gutter
    expect(tip.style.left).toBe("44px");
  });
  it("hides every open hover layer and tooltip", () => {
    const root = document.createElement("div");
    root.innerHTML = `<g class="hover on"></g><div class="tip on"></div><div class="tip"></div>`;
    hideHover(root);
    expect(root.querySelectorAll(".on").length).toBe(0);
    hideHover(null);
  });
});
