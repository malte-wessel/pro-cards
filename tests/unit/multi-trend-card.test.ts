import { describe, it, expect } from "vitest";
import { niceStep, decimalsForStep, DEFAULT_HOURS } from "../../src/shared/trend/scale.ts";
import { configToForm, formToConfig, editorSchema } from "../../src/multi-trend/editor.ts";
import { MultiTrendCard } from "../../src/multi-trend-card.ts";
import type { MultiTrendCardConfig } from "../../src/multi-trend/config.ts";
import type { HomeAssistant } from "../../src/shared/ha.ts";

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
      type: "custom:multi-trend-card",
      title: "T",
      hours_to_show: 12,
      layout: "lanes",
      x_axis: true,
      entities: [{ entity: "sensor.a", name: "A", color: "red" }, { entity: "sensor.b" }],
      grid_options: { columns: 6 },
    };
    const data = configToForm(cfg);
    expect(data).toMatchObject({
      title: "T",
      hours_to_show: 12,
      layout: "lanes",
      x_axis: true,
      y_axis: false,
      show_legend: true,
      entities: ["sensor.a", "sensor.b"],
    });
    expect(data["ent__sensor.a__name"]).toBe("A");
    const back = formToConfig(data, cfg);
    expect(back).toEqual(cfg);
    const defaults = formToConfig(
      configToForm({
        entities: [{ entity: "sensor.a" }],
        hours_to_show: DEFAULT_HOURS,
        layout: "auto",
        show_legend: true,
      }),
      {},
    );
    expect(defaults).toEqual({ entities: [{ entity: "sensor.a" }] });
    const schema = editorSchema(
      {
        states: { "sensor.a": { attributes: { friendly_name: "A" } } },
      } as unknown as HomeAssistant,
      data,
    );
    expect(schema.some((s) => s.name === "entities")).toBe(true);
    expect(schema.filter((s) => s.type === "expandable").length).toBe(2);
  });
  it("registers card and editor and sizes by layout", () => {
    expect(customElements.get("multi-trend-card")).toBe(MultiTrendCard);
    expect(customElements.get("multi-trend-card-editor")).toBeDefined();
    expect(MultiTrendCard.getConfigElement().tagName.toLowerCase()).toBe("multi-trend-card-editor");
    const el = new MultiTrendCard();
    el.setConfig({ entities: ["sensor.a", { entity: "sensor.b" }], layout: "lanes" });
    expect(el.getGridOptions()).toEqual({ columns: 12, rows: 4, min_columns: 6, min_rows: 2 });
    el.setConfig({ entities: ["sensor.a"], layout: "overlay" });
    expect(el.getGridOptions().rows).toBe(3);
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
