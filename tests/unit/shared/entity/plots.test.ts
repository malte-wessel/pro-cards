import { describe, expect, it } from "vitest";
import { plotEl, plotRows } from "../../../../src/shared/entity/render/blocks.ts";
import { drawPlot } from "../../../../src/shared/entity/render/plots.ts";
import type { EntityModel, RenderCtx } from "../../../../src/shared/entity/model.ts";
import { normalizeEntityCardConfig } from "../../../../src/entity-card.ts";
import type { HassEntity, HomeAssistant } from "../../../../src/shared/ha.ts";
import type { Point } from "../../../../src/shared/history.ts";

// the least a plot needs to draw: one entity's history over an hour
const HOUR = 3600e3;
const RISING = [
  { t: 0, v: 1, s: "1" },
  { t: HOUR / 2, v: 3, s: "3" },
  { t: HOUR, v: 2, s: "2" },
];
const ctxOf = (visual: string, series: Point[] = RISING, item: Record<string, unknown> = {}) =>
  ({
    series: new Map([["sensor.a", series]]),
    fetched: true,
    cfg: {
      ...normalizeEntityCardConfig({ entity: "sensor.a", visual, ...item }),
      hours: 1,
      bucketMin: 10,
    },
    now: HOUR,
    t0: 0,
    tplResult: new Map(),
    plotHandlers: { move: () => {}, up: () => {}, leave: () => {} },
  }) as unknown as RenderCtx;
const plotOf = (
  visual: string,
  size?: { w: number; h: number },
  ctx = ctxOf(visual),
  st?: HassEntity,
) => {
  const plot = plotEl(ctx, ctx.cfg.entities[0], 0, { st } as EntityModel);
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
  it("names what it draws", () => {
    expect(plotOf("sparkline").dataset.kind).toBe("sparkline");
    expect(plotOf("columns").dataset.kind).toBe("columns");
    expect(plotOf("strip").dataset.kind).toBe("strip");
  });
  it("keeps a strip at its height in a taller cell", () => {
    expect(viewH(plotOf("strip", { w: 200, h: 140 }))).toBe(22 + 14);
  });
});

describe("what a plot draws", () => {
  it("keeps columns of a series below zero inside the plot", () => {
    const below = RISING.map((p) => ({ ...p, v: -p.v, s: String(-p.v) }));
    const plot = plotOf("columns", { w: 200, h: 120 }, ctxOf("columns", below));
    const cols = [...plot.querySelectorAll("rect.col")];
    expect(cols.length).toBeGreaterThan(0);
    for (const c of cols) {
      const y = Number(c.getAttribute("y"));
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y + Number(c.getAttribute("height"))).toBeLessThanOrEqual(120.05);
    }
    // they hang from zero at the top
    expect(Math.min(...cols.map((c) => Number(c.getAttribute("y"))))).toBe(0);
  });
  it("colours a strip's past buckets by their own state, not by the state of now", () => {
    const series = [
      { t: 0, v: null, s: "off" },
      { t: HOUR / 2, v: null, s: "on" },
    ];
    const ctx = ctxOf("strip", series, { rules: [{ state: "on", color: "amber" }] });
    const st = { entity_id: "sensor.a", state: "on", attributes: {} } as unknown as HassEntity;
    const fills = [...plotOf("strip", undefined, ctx, st).querySelectorAll("svg > rect")].map((r) =>
      r.getAttribute("fill"),
    );
    expect(fills[0]).not.toBe("var(--amber-color)");
    expect(fills.at(-1)).toBe("var(--amber-color)");
  });
  it("writes the strip's start in the user's language", () => {
    const ctx = ctxOf("strip");
    ctx.hass = { locale: { language: "nl" } } as HomeAssistant;
    const labels = [...plotOf("strip", undefined, ctx).querySelectorAll(".label")];
    expect(labels.map((l) => l.textContent)).toEqual(["−1 u", "nu"]);
  });
});

describe("the share of a taller card a group asks for", () => {
  it("counts each list or hero row with a growing plot", () => {
    expect(plotRows("list", 2, ["sparkline", "icon", "columns", "strip"])).toBe(2);
    expect(plotRows("hero", 2, ["sparkline", "sparkline"])).toBe(2);
  });
  it("counts a grid row once, however many plots sit side by side", () => {
    expect(plotRows("grid", 2, ["sparkline", "sparkline", "icon", "icon"])).toBe(1);
    expect(plotRows("grid", 2, ["sparkline", "icon", "icon", "columns"])).toBe(2);
    expect(plotRows("grid", 3, ["icon", "icon", "icon"])).toBe(0);
  });
  it("leaves out layouts that draw no plots", () => {
    expect(plotRows("row", 2, ["sparkline"])).toBe(0);
    expect(plotRows("table", 2, ["sparkline"])).toBe(0);
  });
});
