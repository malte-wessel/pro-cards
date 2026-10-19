import { describe, expect, it } from "vitest";
import { plotEl } from "../../../../src/shared/entity/render/blocks.ts";
import { drawPlot } from "../../../../src/shared/entity/render/plots.ts";
import type { EntityModel, RenderCtx } from "../../../../src/shared/entity/model.ts";
import { normalizeEntityCardConfig } from "../../../../src/entity-card.ts";

// the least a plot needs to draw: one entity's history over an hour
const HOUR = 3600e3;
const ctxOf = (visual: string): RenderCtx =>
  ({
    series: new Map([
      [
        "sensor.a",
        [
          { t: 0, v: 1 },
          { t: HOUR / 2, v: 3 },
          { t: HOUR, v: 2 },
        ],
      ],
    ]),
    fetched: true,
    cfg: { ...normalizeEntityCardConfig({ entity: "sensor.a", visual }), hours: 1, bucketMin: 10 },
    now: HOUR,
    t0: 0,
    plotHandlers: { move: () => {}, up: () => {}, leave: () => {} },
  }) as unknown as RenderCtx;
const plotOf = (visual: string, size?: { w: number; h: number }) => {
  const ctx = ctxOf(visual);
  const plot = plotEl(ctx, ctx.cfg.entities[0], 0, { st: undefined } as EntityModel);
  Object.defineProperty(plot, "clientWidth", { value: size?.w ?? 200 });
  if (size) Object.defineProperty(plot, "clientHeight", { value: size.h });
  drawPlot(ctx, plot);
  return plot;
};
const viewH = (plot: HTMLElement) =>
  Number(plot.querySelector("svg")!.getAttribute("viewBox")!.split(" ")[3]);

describe("history plots in a cell with fixed rows", () => {
  it("sparkline and columns grow, a strip keeps its height", () => {
    expect(plotOf("sparkline").classList.contains("grow")).toBe(true);
    expect(plotOf("columns").classList.contains("grow")).toBe(true);
    expect(plotOf("strip").classList.contains("grow")).toBe(false);
  });
  it("draws at its own height while nothing stretches it", () => {
    expect(viewH(plotOf("sparkline"))).toBe(56);
    expect(viewH(plotOf("strip"))).toBe(22 + 14);
  });
  it("draws a sparkline at the measured height instead of stretching it", () => {
    const plot = plotOf("sparkline", { w: 200, h: 140 });
    expect(viewH(plot)).toBe(140);
    // the area closes at the bottom and the hover hair runs the whole height
    expect(plot.querySelector(".area")!.getAttribute("d")).toContain(",140 ");
    expect(plot.querySelector(".hair")!.getAttribute("y2")).toBe("140");
  });
  it("draws columns at the measured height, the tallest reaching the top", () => {
    const plot = plotOf("columns", { w: 200, h: 120 });
    expect(viewH(plot)).toBe(120);
    const cols = [...plot.querySelectorAll("rect.col")];
    const top = Math.min(...cols.map((c) => Number(c.getAttribute("y"))));
    const bottom = Math.max(
      ...cols.map((c) => Number(c.getAttribute("y")) + Number(c.getAttribute("height"))),
    );
    expect(top).toBe(0);
    expect(bottom).toBeCloseTo(120, 0);
  });
  it("keeps a strip at its height in a taller cell", () => {
    expect(viewH(plotOf("strip", { w: 200, h: 140 }))).toBe(22 + 14);
  });
});
