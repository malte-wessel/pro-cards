import { afterEach, describe, it, expect } from "vitest";
import { niceStep, decimalsForStep, DEFAULT_HOURS } from "../../src/shared/trend/scale.ts";
import {
  configToForm,
  formToConfig,
  editorSchema,
  layoutOptions,
} from "../../src/multi-trend/editor.ts";
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
      type: "custom:multi-trend-card-pro",
      title: "T",
      hours_to_show: 12,
      smoothing_minutes: 30,
      layout: "lanes",
      x_axis: true,
      entities: [{ entity: "sensor.a", name: "A", color: "red" }, { entity: "sensor.b" }],
      grid_options: { columns: 6 },
    };
    const data = configToForm(cfg);
    expect(data).toMatchObject({
      title: "T",
      hours_to_show: 12,
      smoothing_minutes: 30,
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
    // a cleared smoothing field drops the key
    expect(formToConfig({ ...data, smoothing_minutes: undefined }, cfg)).not.toHaveProperty(
      "smoothing_minutes",
    );
    const schema = editorSchema(
      {
        states: { "sensor.a": { attributes: { friendly_name: "A" } } },
      } as unknown as HomeAssistant,
      data,
    );
    expect(schema.some((s) => s.name === "entities")).toBe(true);
    expect(schema.filter((s) => s.type === "expandable").length).toBe(2);
  });
  it("keeps an entity's keys the form does not show, such as visibility and rules", () => {
    const vis = [{ condition: "state", entity: "light.a", state: "on" }];
    const rules = [{ above: 20, color: "red" }];
    const cfg: MultiTrendCardConfig = {
      entities: [{ entity: "sensor.a", name: "A", visibility: vis, rules }, "sensor.b"],
    };
    const data = configToForm(cfg);
    data["ent__sensor.a__name"] = "Renamed";
    expect(formToConfig(data, cfg).entities).toEqual([
      { entity: "sensor.a", name: "Renamed", visibility: vis, rules },
      { entity: "sensor.b" },
    ]);
    // an entity added in the form starts empty; a moved one keeps its keys
    data.entities = ["sensor.c", "sensor.a"];
    expect(formToConfig(data, cfg).entities).toEqual([
      { entity: "sensor.c" },
      { entity: "sensor.a", name: "Renamed", visibility: vis, rules },
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
});

describe("multi-trend-card editor titles", () => {
  it("shows an entity's new name after a rename", () => {
    const ed = MultiTrendCard.getConfigElement() as HTMLElement & {
      setConfig(c: unknown): void;
      hass: HomeAssistant;
    };
    const hass = (name: string) =>
      ({
        states: { "sensor.a": { state: "1", attributes: { friendly_name: name } } },
        locale: { language: "en" },
      }) as unknown as HomeAssistant;
    ed.setConfig({ entities: ["sensor.a"] });
    ed.hass = hass("Outdoor");
    const form = ed.querySelector("ha-form") as unknown as { schema: { title?: string }[] };
    const titles = () => form.schema.map((s) => s.title).filter(Boolean);
    expect(titles()).toEqual(["Outdoor"]);
    const schema = form.schema;
    // another update with the same name: the form stays
    ed.hass = hass("Outdoor");
    expect(form.schema).toBe(schema);
    ed.hass = hass("Garden");
    expect(titles()).toEqual(["Garden"]);
  });
});

describe("multi-trend-card poster", () => {
  const st = (state: string, attributes: Record<string, unknown> = {}) => ({
    state,
    attributes,
    last_changed: "2026-06-21T10:00:00Z",
    last_updated: "2026-06-21T10:00:00Z",
  });
  const hass = () =>
    ({
      states: {
        "sensor.a": st("21.46", { friendly_name: "Living room", unit_of_measurement: "°C" }),
        "sensor.b": st("55", { friendly_name: "Humidity", unit_of_measurement: "%" }),
        "sensor.c": st("unavailable", { friendly_name: "Gone" }),
      },
      locale: { language: "en" },
      connection: { subscribeMessage: async () => () => {} },
      // the history never arrives: the lines are drawn empty
      callWS: () => new Promise(() => {}),
    }) as unknown as HomeAssistant;
  const cards: MultiTrendCard[] = [];
  afterEach(() => {
    for (const c of cards.splice(0)) c.remove();
  });
  const mount = (cfg: Partial<MultiTrendCardConfig>) => {
    const el = new MultiTrendCard();
    el.setConfig({ entities: ["sensor.a", "sensor.b"], layout: "poster", ...cfg });
    document.body.appendChild(el);
    el.hass = hass();
    cards.push(el);
    const fired: unknown[] = [];
    el.addEventListener("hass-action", (ev) => fired.push((ev as CustomEvent).detail));
    return { el, root: el.shadowRoot!.querySelector("ha-card") as HTMLElement, fired };
  };
  it("overlays the lines whatever their units", () => {
    const el = new MultiTrendCard();
    el.setConfig({ entities: ["sensor.a", "sensor.b"], layout: "poster" });
    el.hass = hass();
    expect(el._layout()).toBe("overlay");
  });
  it("is three rows high, two at least", () => {
    const el = new MultiTrendCard();
    el.setConfig({ entities: ["sensor.a", "sensor.b", "sensor.c"], layout: "poster" });
    expect(el.getGridOptions()).toEqual({ columns: 6, rows: 3, min_columns: 3, min_rows: 2 });
    expect(el.getCardSize()).toBe(3);
  });
  it("shows the window on top, the name and the first value large, the plot below, no legend", () => {
    const { root } = mount({ hours_to_show: 12 });
    expect(root.classList.contains("layout-poster")).toBe(true);
    const header = root.querySelector<HTMLElement>(".header.poster")!;
    expect(header.getAttribute("role")).toBe("button");
    expect(header.querySelector(".ptop > .shape > ha-icon")).not.toBeNull();
    expect(header.querySelector(".ptop > .plabel")!.textContent).toBe("12 h");
    expect(header.querySelector(".pbody > .primary")!.textContent).toBe("Living room");
    expect(header.querySelector(".pbody > .big > b")!.textContent).toBe("21.46");
    expect(header.querySelector(".pbody > .big > span")!.textContent).toBe("°C");
    expect(header.querySelector(".pbody > .plot")).not.toBeNull();
    expect(root.querySelector(".legend")).toBeNull();
    expect(root.querySelector(".secondary")).toBeNull();
  });
  it("names the card by its title and shows a state that is no number without a unit", () => {
    const { root } = mount({ title: "Climate", entities: ["sensor.c", "sensor.a"] });
    expect(root.querySelector(".pbody > .primary")!.textContent).toBe("Climate");
    expect(root.querySelector(".big b")!.textContent).toBe("unavailable");
    expect(root.querySelector(".big span")!.textContent).toBe("");
  });
  it("opens the more-info from its texts, not from a click on the plot", () => {
    const { root, fired } = mount({});
    (root.querySelector(".pbody > .plot") as HTMLElement).click();
    (root.querySelector(".pbody > .plot svg") as Element).dispatchEvent(
      new MouseEvent("click", { bubbles: true, composed: true }),
    );
    expect(fired).toEqual([]);
    (root.querySelector(".pbody > .primary") as HTMLElement).click();
    expect(fired).toEqual([
      { config: { entity: "sensor.a", tap_action: { action: "more-info" } }, action: "tap" },
    ]);
    (root.querySelector(".plabel") as HTMLElement).click();
    expect(fired).toHaveLength(2);
  });
  it("is a choice of the editor and survives its round trip", () => {
    expect(layoutOptions().map((o) => o.value)).toEqual(["auto", "overlay", "lanes", "poster"]);
    expect(layoutOptions().every((o) => o.label.length > 0)).toBe(true);
    const cfg: MultiTrendCardConfig = { entities: [{ entity: "sensor.a" }], layout: "poster" };
    const data = configToForm(cfg);
    expect(data.layout).toBe("poster");
    expect(formToConfig(data, cfg)).toEqual(cfg);
  });
});
