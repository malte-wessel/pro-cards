import { describe, it, expect, vi } from "vitest";
import { niceStep, decimalsForStep, DEFAULT_HOURS } from "../../src/shared/trend/scale.ts";
import { configToForm, formToConfig, editorSchema } from "../../src/multi-trend/editor.ts";
import { MultiTrendCard } from "../../src/multi-trend-card.ts";
import { normalizeTrendConfig, type MultiTrendCardConfig } from "../../src/multi-trend/config.ts";
import type { HaFormSchema, HomeAssistant } from "../../src/shared/ha.ts";

describe("multi-trend-card helpers", () => {
  it("picks nice tick steps", () => {
    expect(niceStep(10, 5)).toBe(2);
    expect(niceStep(100, 4)).toBe(25);
    expect(niceStep(1, 4)).toBe(0.25);
    expect(niceStep(7, 2)).toBe(5);
    expect(niceStep(0.03, 3)).toBe(0.01);
  });
  it("counts the decimals a step needs", () => {
    expect(decimalsForStep(1)).toBe(0);
    expect(decimalsForStep(0.5)).toBe(1);
    expect(decimalsForStep(0.25)).toBe(2);
    expect(decimalsForStep(0.001)).toBe(3);
  });
  it("round-trips the editor form", () => {
    const cfg: MultiTrendCardConfig = {
      type: "custom:multi-trend-card-pro",
      title: "T",
      hours: 12,
      smoothing: 30,
      layout: "lanes",
      x_axis: true,
      entities: [{ entity: "sensor.a", name: "A", color: "red" }, { entity: "sensor.b" }],
      grid_options: { columns: 6 },
    };
    const data = configToForm(cfg);
    expect(data).toMatchObject({
      title: "T",
      hours: 12,
      smoothing: 30,
      layout: "lanes",
      x_axis: true,
      y_axis: false,
      show_legend: true,
    });
    // the entities as lines (each in a view of its own)
    expect(data.entities).toEqual([
      { entity: "sensor.a", name: "A", color: "red", rules: [], visibility: [] },
      { entity: "sensor.b", rules: [], visibility: [] },
    ]);
    const back = formToConfig(data, cfg);
    expect(back).toEqual(cfg);
    const defaults = formToConfig(
      configToForm({
        entities: [{ entity: "sensor.a" }],
        hours: DEFAULT_HOURS,
        layout: "auto",
        show_legend: true,
      }),
      {},
    );
    // (an entity with nothing of its own is written as its id)
    expect(defaults).toEqual({ entities: ["sensor.a"] });
    // a cleared smoothing field drops the key
    expect(formToConfig({ ...data, smoothing: undefined }, cfg)).not.toHaveProperty("smoothing");
    // the deprecated spelling is read, and written as the new one
    const old = { entities: ["sensor.a"], hours_to_show: 12, smoothing_minutes: 30 };
    expect(configToForm(old)).toMatchObject({ hours: 12, smoothing: 30 });
    expect(formToConfig(configToForm(old), old)).toEqual({
      entities: ["sensor.a"],
      hours: 12,
      smoothing: 30,
    });
    const schema = editorSchema(
      {
        states: { "sensor.a": { attributes: { friendly_name: "A" } } },
      } as unknown as HomeAssistant,
      data,
    );
    const flat = (xs: HaFormSchema[]): HaFormSchema[] =>
      xs.flatMap((x) => [x, ...flat(x.schema ?? [])]);
    expect(flat(schema).find((s) => s.name === "entities")?.selector).toEqual({
      pro_cards_list: { key: "entities", of: "series", hide_label: true },
    });
    // the lines, what it shows, how it looks, its layout
    expect(schema.filter((s) => s.type === "expandable").map((s) => s.title)).toEqual([
      "Entities",
      "Content",
      "Appearance",
      "Layout",
    ]);
  });
  it("keeps an entity's keys the form does not show, such as visibility and rules", () => {
    const vis = [{ condition: "state", entity: "light.a", state: "on" }];
    const rules = [{ above: 20, color: "red" }];
    const cfg: MultiTrendCardConfig = {
      entities: [{ entity: "sensor.a", name: "A", visibility: vis, rules }, "sensor.b"],
    };
    const data = configToForm(cfg);
    const lines = data.entities as Record<string, unknown>[];
    lines[0] = { ...lines[0], name: "Renamed" };
    expect(formToConfig({ ...data, entities: lines }, cfg).entities).toEqual([
      { entity: "sensor.a", name: "Renamed", rules, visibility: vis },
      // written as its id, it stays one
      "sensor.b",
    ]);
    // a line added in the form is its id
    const added = [{ entity: "sensor.c", rules: [], visibility: [] }, lines[0]];
    expect(formToConfig({ ...data, entities: added }, cfg).entities).toEqual([
      "sensor.c",
      { entity: "sensor.a", name: "Renamed", rules, visibility: vis },
    ]);
  });
  it("registers card and editor and sizes by layout", () => {
    expect(customElements.get("multi-trend-card-pro")).toBe(MultiTrendCard);
    expect(customElements.get("multi-trend-card-pro-editor")).toBeDefined();
    expect(MultiTrendCard.getConfigElement().tagName.toLowerCase()).toBe(
      "multi-trend-card-pro-editor",
    );
    const el = new MultiTrendCard();
    el.setConfig({ entities: ["sensor.a", { entity: "sensor.b" }], layout: "lanes" });
    expect(el.getGridOptions()).toEqual({ columns: 12, rows: "auto", min_columns: 6, min_rows: 2 });
    el.setConfig({ entities: ["sensor.a"], layout: "overlay" });
    expect(el.getGridOptions().rows).toBe("auto");
    expect(() => el.setConfig({ entities: [] })).toThrow();
    expect(() =>
      el.setConfig({ entities: [{ name: "x" }] } as unknown as MultiTrendCardConfig),
    ).toThrow();
    const stub = MultiTrendCard.getStubConfig(
      {
        states: { "sensor.a": { state: "1" }, "sensor.b": { state: "x" } },
      } as unknown as HomeAssistant,
      ["sensor.a", "sensor.b", "light.c"],
    );
    expect(stub.entities).toEqual([{ entity: "sensor.a" }]);
  });
});

describe("multi-trend-card config", () => {
  const T = "multi-trend-card-pro";
  it("reads the window and the averaging from hours and smoothing", () => {
    const c = normalizeTrendConfig({ entities: ["sensor.a"], hours: 12, smoothing: 2 }, T);
    expect(c).toMatchObject({ hours: 12, smoothing: 5, layout: "auto", show_legend: true });
    expect(normalizeTrendConfig({ entities: ["sensor.a"] }, T)).toMatchObject({
      hours: DEFAULT_HOURS,
      smoothing: null,
    });
  });
  it("reads hours_to_show and smoothing_minutes until 4.0, saying so once", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const old = { entities: ["sensor.a"], hours_to_show: 24, smoothing_minutes: 30 };
      const c = normalizeTrendConfig(old, "old-trend-card");
      normalizeTrendConfig(old, "old-trend-card");
      expect(c).toMatchObject({ hours: 24, smoothing: 30 });
      expect(c).not.toHaveProperty("hours_to_show");
      expect(warn).toHaveBeenCalledTimes(2);
      expect(warn.mock.calls[0][0]).toContain("hours_to_show is deprecated and goes in 4.0");
      expect(() =>
        normalizeTrendConfig({ entities: ["sensor.a"], hours: 6, hours_to_show: 24 }, T),
      ).toThrow("hours_to_show is hours: write hours only");
    } finally {
      warn.mockRestore();
    }
  });
  it("needs entities", () => {
    expect(() => normalizeTrendConfig({}, T)).toThrow("'entities' must be a non-empty list");
  });
});

describe("multi-trend-card history", () => {
  const st = (state: string) => ({
    state,
    attributes: {},
    last_changed: "2026-06-21T10:00:00Z",
    last_updated: "2026-06-21T10:00:00Z",
  });
  // a hass whose history requests the test answers by hand
  const hassWith = (calls: { ids: string[]; answer: (r: unknown) => void }[]) =>
    ({
      states: { "sensor.a": st("1"), "sensor.b": st("2") },
      locale: { language: "en" },
      connection: { subscribeMessage: async () => () => {} },
      callWS: (msg: { entity_ids: string[] }) =>
        new Promise((answer) => calls.push({ ids: msg.entity_ids, answer })),
    }) as unknown as HomeAssistant;

  it("drops a history that arrives after the entities changed and fetches the new ones", async () => {
    const calls: { ids: string[]; answer: (r: unknown) => void }[] = [];
    const hass = hassWith(calls);
    const el = new MultiTrendCard();
    el.setConfig({ entities: ["sensor.a"] });
    el.hass = hass;
    expect(calls.map((c) => c.ids)).toEqual([["sensor.a"]]);
    el.setConfig({ entities: ["sensor.a", "sensor.b"] });
    calls[0].answer({ "sensor.a": [{ s: "1", lu: 1 }] });
    await new Promise((r) => setTimeout(r, 0));
    // the old answer is not taken for the new entities: one series per entity, none fetched yet
    expect(el._series.length).toBe(2);
    el.hass = { ...hass };
    expect(calls.map((c) => c.ids)).toEqual([["sensor.a"], ["sensor.a", "sensor.b"]]);
  });
});

describe("trend plot height", async () => {
  const { trendPlotEl, drawTrend } = await import("../../src/shared/trend/plot.ts");
  const spec = (layout: "overlay" | "lanes") => ({
    hass: undefined,
    t0: 0,
    t1: 3600e3,
    layout,
    xAxis: true,
    yAxis: false,
    series: [
      {
        pts: [
          { t: 0, v: 1 },
          { t: 3600e3, v: 2 },
        ],
        color: "red",
        name: "A",
        fmt: String,
      },
    ],
  });
  it("draws the SVG at its natural height when nothing stretches it", () => {
    const plot = trendPlotEl();
    drawTrend(plot, spec("overlay"));
    const h = parseFloat(plot.style.height);
    expect(h).toBeGreaterThan(0);
    expect(plot.querySelector("svg")!.getAttribute("viewBox")).toBe(`0 0 10 ${h}`);
  });
  it("draws the SVG at the measured height instead of stretching it in a taller cell", () => {
    const plot = trendPlotEl();
    Object.defineProperty(plot, "clientHeight", { value: 300 });
    drawTrend(plot, spec("lanes"));
    expect(plot.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 10 300");
    const hair = plot.querySelector(".hair")!;
    expect(hair.getAttribute("y2")).toBe(String(300 - 16));
  });
});

describe("trend scale", async () => {
  const { mkScale } = await import("../../src/shared/trend/scale.ts");
  it("never turns upside down in a lane shorter than its label", () => {
    const s = mkScale(0, 10, 0, 10, 16);
    expect(s.y(10)).toBeLessThanOrEqual(s.y(0));
  });
  it("pads the data's range by a tenth, or as asked: a poster's lines fill their plot", () => {
    const s = mkScale(0, 10, 0, 100, 0);
    expect([s.min, s.max]).toEqual([-1, 11]);
    expect(s.y(11)).toBe(0);
    expect(s.y(-1)).toBe(94);
    const full = mkScale(0, 10, 0, 100, 0, 0, 2);
    expect([full.min, full.max]).toEqual([0, 10]);
    expect(full.y(10)).toBe(0);
    expect(full.y(0)).toBe(98);
  });
});

describe("multi-trend-card editor lines", () => {
  it("opens a line in a view of its own, its title the entity's name", () => {
    const ed = MultiTrendCard.getConfigElement() as HTMLElement & {
      setConfig(c: unknown): void;
      hass: HomeAssistant;
    };
    ed.setConfig({ entities: ["sensor.a"] });
    ed.hass = {
      states: { "sensor.a": { state: "1", attributes: { friendly_name: "Outdoor" } } },
      locale: { language: "en" },
    } as unknown as HomeAssistant;
    const form = ed.querySelector("ha-form") as HTMLElement;
    form.dispatchEvent(
      new CustomEvent("pro-cards-edit-item", {
        detail: { key: "entities", index: 0 },
        bubbles: true,
        composed: true,
      }),
    );
    expect(ed.querySelector(".item-view .title")?.textContent).toBe("Line 1 · Outdoor");
  });
});
