import { describe, expect, it } from "vitest";
import { blockEl, plotEl, plotRows } from "../../../../src/shared/entity/render/blocks.ts";
import { drawPlot, showHover } from "../../../../src/shared/entity/render/plots.ts";
import type { EntityItem, PlotOptions } from "../../../../src/shared/entity/config.ts";
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

// a v3 card's plot (its visual's options in `plot`), RISING's 1 to 3 at a measured 200 × 120; its
// columns stand on the card's edge, COL_BLEED (4 px) above the plot's foot: 116 px to draw in
const scaled = (visual: string, plot: PlotOptions, item: Partial<EntityItem> = {}) => {
  const ctx = ctxOf(visual);
  const ent = { ...ctx.cfg.entities[0], plot, ...item } as EntityItem;
  const el = blockEl(ctx, ent, 0, {} as EntityModel) as HTMLElement & { clientWidth: number };
  Object.defineProperty(el, "clientWidth", { value: 200 });
  Object.defineProperty(el, "clientHeight", { value: 120 });
  drawPlot(ctx, el as Parameters<typeof drawPlot>[1]);
  return el;
};
// a poster's or tile's column is a path (a square foot): its top and height from its points
const cols = (el: HTMLElement) =>
  [...el.querySelectorAll("path.col")].map((c) => {
    const ys = [...c.getAttribute("d")!.matchAll(/,(-?[\d.]+)/g)].map((m) => Number(m[1]));
    const y = Math.min(...ys);
    return { y, h: Math.max(...ys) - y, op: Number(c.getAttribute("opacity")) };
  });
const tallest = (el: HTMLElement) => Math.min(...cols(el).map((c) => c.y));

describe("a plot's scale", () => {
  it("fits its data without limits: the tallest column reaches the top at full brightness", () => {
    const el = scaled("columns", {});
    expect(tallest(el)).toBe(0);
    expect(Math.max(...cols(el).map((c) => c.op))).toBe(1);
  });
  it("draws on the written scale, each column as bright as it is tall", () => {
    const el = scaled("columns", { max: 100 });
    // 3 of 100: the tallest column reaches 3 % of the height
    expect(tallest(el)).toBeCloseTo(116 * 0.97, 0);
    for (const c of cols(el)) expect(c.op).toBeLessThan(0.43);
  });
  it("grows columns from a min above 0", () => {
    const el = scaled("columns", { min: 1, max: 5 });
    // every column stands on the floor (1), the tallest (3) half way up (one at the floor is
    // drawn a pixel tall)
    for (const c of cols(el).filter((c) => c.h > 1)) expect(c.y + c.h).toBeCloseTo(116, 0);
    expect(tallest(el)).toBeCloseTo(58, 0);
  });
  it("takes the card's min and max for a plot of the card's own state", () => {
    expect(tallest(scaled("columns", {}, { max: 10 }))).toBeCloseTo(116 * 0.7, 0);
    // the visual's own limit wins
    expect(tallest(scaled("columns", { max: 100 }, { max: 10 }))).toBeCloseTo(116 * 0.97, 0);
  });
  it("leaves the card's min and max to the card's value for another entity or value", () => {
    expect(tallest(scaled("columns", { src: "sensor.a" }, { max: 10 }))).toBe(0);
    const attr = { max: 10, valueSrc: { kind: "attribute", key: "level" } } as const;
    expect(tallest(scaled("columns", {}, attr))).toBe(0);
  });
});

describe("a plot's axis", () => {
  const labels = (el: HTMLElement) =>
    [...el.querySelectorAll(".label.axis")].map((l) => l.textContent);
  it("writes the scale's range and the window in a row above the drawing", () => {
    const el = scaled("columns", { max: 100, axis: true });
    expect(labels(el)).toEqual(["0–100", "1 h"]);
    // the plot keeps its height; the columns are drawn below the row, the line at its foot
    const svg = el.querySelector("svg")!;
    expect(Number(svg.getAttribute("viewBox")!.split(" ")[3])).toBe(120);
    const band = Number(el.querySelector("line.grid")!.getAttribute("y1"));
    expect(band).toBeGreaterThan(10);
    for (const c of cols(el)) expect(c.y).toBeGreaterThanOrEqual(band - 0.1);
    expect(tallest(scaled("columns", { max: 3, axis: true }))).toBeCloseTo(band, 0);
  });
  it("keeps decimals written on the card on a whole scale", () => {
    const el = scaled("columns", { max: 100, axis: true }, { decimals: 1 });
    expect(labels(el)[0]).toBe("0.0–100.0");
  });
  it("names today's window by its day", () => {
    expect(labels(scaled("sparkline", { hours: "today", axis: true }))[1]).toBe("Today");
  });
  it("stands a poster's or tile's columns on square feet, rounded at the tip alone", () => {
    const d = scaled("columns", { max: 4 }).querySelector("path.col")!.getAttribute("d")!;
    // from the foot's corner straight up, the rounded tip, straight down to the other foot: on
    // the card's edge, COL_BLEED (4 px) above the plot's foot, which the card cuts
    expect(d).toMatch(/^M[\d.]+,116\.0V[\d.]+Q/);
    expect(d).toMatch(/V116\.0Z$/);
  });
  it("draws no row without axis", () => {
    const el = scaled("columns", { max: 100 });
    expect(labels(el)).toEqual([]);
    expect(el.querySelector("line.grid")).toBeNull();
  });
});

// a thermostat's card (its value the current_temperature attribute, a rule on it) whose plot reads
// another entity: sensor.a, a valve in % whose state has one decimal
describe("a plot of another entity", () => {
  const thermostat = (visual: string, plot: PlotOptions) => {
    const ctx = ctxOf(visual, RISING, {
      attribute: "current_temperature",
      rules: [{ above: 0, label: "Warm", color: "amber" }],
    });
    ctx.hass = {
      locale: { language: "en" },
      states: {
        "sensor.a": {
          entity_id: "sensor.a",
          state: "2.0",
          attributes: { unit_of_measurement: "%" },
        },
      },
    } as unknown as HomeAssistant;
    // (the card's own entity has the history where the plot is its own)
    const entity = plot.src ? "climate.x" : "sensor.a";
    const ent = { ...ctx.cfg.entities[0], entity, plot } as EntityItem;
    const el = blockEl(ctx, ent, 0, {} as EntityModel) as Parameters<typeof drawPlot>[1];
    Object.defineProperty(el, "clientWidth", { value: 200 });
    Object.defineProperty(el, "clientHeight", { value: 120 });
    drawPlot(ctx, el);
    return { ctx, el };
  };
  const tipAt = (visual: string, plot: PlotOptions) => {
    const { ctx, el } = thermostat(visual, plot);
    showHover(ctx, el, HOUR * 0.75);
    return el.querySelector(".tip")!.textContent;
  };
  it("writes its values in that entity's unit and precision", () => {
    expect(tipAt("columns", { src: "sensor.a" })).toMatch(/3\.0 %$/);
    expect(tipAt("sparkline", { src: "sensor.a" })).toMatch(/\d\.\d %$/);
  });
  it("names that entity's unit in its axis", () => {
    const { el } = thermostat("columns", { src: "sensor.a", max: 100, axis: true });
    expect(el.querySelector(".label.axis")!.textContent).toBe("0–100 %");
  });
  it("names none of the card's rules, which are written for the card's own value", () => {
    expect(tipAt("columns", { src: "sensor.a" })).not.toContain("Warm");
    // a plot of the card's own value still does
    expect(tipAt("columns", {})).toContain("Warm");
  });
  it("keeps the card's rules on a strip, which colour its blocks", () => {
    const { el } = thermostat("strip", { src: "sensor.a" });
    const fills = [...el.querySelectorAll("svg > rect")].map((r) => r.getAttribute("fill"));
    expect(fills).toContain("var(--amber-color)");
  });
});
