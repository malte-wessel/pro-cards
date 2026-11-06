// The power flow's and the energy flow's visual editor: the card's own options, the consumers in
// their list and each source's form, written back as the config had them where the form left
// them alone.
import { describe, expect, it } from "vitest";
import { PowerFlowCard } from "../../../src/power-flow-card.ts";
import { EnergyFlowCard } from "../../../src/energy-flow-card.ts";
import {
  FLOW_LABELS,
  flowFromForm,
  flowSchema,
  flowToForm,
  sourceFromForm,
  sourceSchema,
  sourceToForm,
  type FlowCard,
} from "../../../src/shared/flow-tree/editor.ts";
import type { HaFormSchema } from "../../../src/shared/ha.ts";
import { hasString } from "../../../src/shared/i18n.ts";
import { docExamples, withNested } from "../docs-examples.ts";

type Raw = Record<string, unknown>;
const P = "custom:power-flow-card-pro";
const E = "custom:energy-flow-card-pro";

describe("the flow cards' editor", () => {
  it("is each card's config element, the sources in a form of their own", () => {
    expect(PowerFlowCard.getConfigElement().tagName).toBe("POWER-FLOW-CARD-PRO-EDITOR");
    expect(EnergyFlowCard.getConfigElement().tagName).toBe("ENERGY-FLOW-CARD-PRO-EDITOR");
    expect(customElements.get("flow-tree-source-editor")).toBeDefined();
  });

  it("writes every docs example back as it was, the card and each source", () => {
    let n = 0;
    for (const { file, cfg } of docExamples())
      for (const c of withNested(cfg)) {
        const card = c as Raw;
        const kind: FlowCard | null =
          card?.type === P ? "power" : card?.type === E ? "energy" : null;
        if (!kind) continue;
        expect(flowFromForm(flowToForm(card, kind), card, kind), file).toEqual(card);
        for (const s of (card.sources as Raw[]) ?? [])
          expect(sourceFromForm(sourceToForm(s, kind), s, kind), file).toEqual(s);
        n++;
      }
    expect(n).toBeGreaterThan(10);
  });

  it("writes nothing for a value at its default, and the value otherwise", () => {
    const card = { type: P, sources: [] };
    const form = flowToForm(card, "power");
    expect(form).toMatchObject({
      direction: "right",
      flow_style: "dots",
      idle_below: 20,
      kw_above: 1000,
    });
    expect(
      flowFromForm(
        { ...form, flow_style: "arrows", idle_below: 50, fast_above: 5000 },
        card,
        "power",
      ),
    ).toEqual({
      ...card,
      flow_style: "arrows",
      idle_below: 50,
      animation: { fast_above: 5000 },
    });
    const set = { ...card, direction: "down", kw_above: 500 };
    expect(
      flowFromForm(
        { ...flowToForm(set, "power"), direction: "right", kw_above: 1000 },
        set,
        "power",
      ),
    ).toEqual(card);
    // the energy card's defaults are kWh and today
    const energy = { type: E, sources: [] };
    expect(flowToForm(energy, "energy")).toMatchObject({
      idle_below: 0.05,
      period: "today",
      period_picker: true,
    });
    expect(
      flowFromForm({ ...flowToForm(energy, "energy"), period: "month" }, energy, "energy"),
    ).toEqual({
      ...energy,
      period: "month",
    });
  });

  it("writes the home as its entity id alone, else as an object", () => {
    const card = { type: P, home: "sensor.power_consumption", sources: [] };
    const form = flowToForm(card, "power");
    expect(flowFromForm({ ...form, home_name: "House" }, card, "power").home).toEqual({
      entity: "sensor.power_consumption",
      name: "House",
    });
    const named = { ...card, home: { entity: "sensor.power_consumption", name: "House" } };
    expect(
      flowFromForm({ ...flowToForm(named, "power"), home_name: "" }, named, "power").home,
    ).toBe("sensor.power_consumption");
  });

  it("keeps an Other node of the card's own unless it is turned off", () => {
    const card = { type: P, sources: [], other: { name: "Losses" } };
    const form = flowToForm(card, "power");
    expect(form.other).toBe(true);
    expect(flowFromForm({ ...form, title: "Energy" }, card, "power").other).toEqual({
      name: "Losses",
    });
    expect(flowFromForm({ ...form, other: false }, card, "power").other).toBe(false);
  });

  it("edits the consumers in their list, a consumer left alone as written", () => {
    const room = { group: "Kitchen", entities: ["sensor.fridge_power"] };
    const card = { type: P, sources: [], consumers: ["sensor.heat_pump_power", room] };
    const form = flowToForm(card, "power");
    expect((form.consumers as Raw[])[1]).toEqual({
      group: "Kitchen",
      more: { entities: ["sensor.fridge_power"] },
    });
    const added = [...(form.consumers as Raw[]), { entity: "sensor.washer_power", name: "Washer" }];
    expect(flowFromForm({ ...form, consumers: added }, card, "power").consumers).toEqual([
      "sensor.heat_pump_power",
      room,
      { entity: "sensor.washer_power", name: "Washer" },
    ]);
  });

  it("switches how a battery or a grid is measured, dropping the other way's keys", () => {
    const battery = {
      type: "battery",
      power: "sensor.battery_power",
      invert: true,
      soc: "sensor.battery_soc",
    };
    const form = sourceToForm(battery, "power");
    expect(form.measure).toBe("power");
    expect(sourceFromForm({ ...form, measure: "pair" }, battery, "power")).toEqual({
      type: "battery",
      soc: "sensor.battery_soc",
    });
    const grid = { type: "grid", import: "sensor.grid_import", export: "sensor.grid_export" };
    expect(sourceToForm(grid, "power").measure).toBe("pair");
    expect(
      sourceFromForm({ ...sourceToForm(grid, "power"), measure: "power" }, grid, "power"),
    ).toEqual({
      type: "grid",
    });
  });

  it("shows a source without its sensors yet measured the way last chosen", () => {
    const fresh = { type: "battery" };
    expect(sourceToForm(fresh, "power").measure).toBe("power");
    expect(sourceToForm(fresh, "power", "pair").measure).toBe("pair");
    // its sensors decide once it has them
    expect(
      sourceToForm({ type: "battery", power: "sensor.battery_power" }, "power", "pair").measure,
    ).toBe("power");
  });

  it("starts a source of another type from what every source says", () => {
    const s = { type: "solar", entity: "sensor.solar_power", name: "Roof", peak: 8000 };
    expect(sourceFromForm({ ...sourceToForm(s, "power"), type: "battery" }, s, "power")).toEqual({
      type: "battery",
      name: "Roof",
    });
  });

  it("keeps a battery's own charge_from list unless another is picked", () => {
    const s = {
      type: "battery",
      power: "sensor.battery_power",
      charge_from: ["sensor.solar_power"],
    };
    const form = sourceToForm(s, "power");
    expect(form.charge_from).toBe("custom");
    expect(sourceFromForm({ ...form, name: "Garage" }, s, "power").charge_from).toEqual([
      "sensor.solar_power",
    ]);
    expect(sourceFromForm({ ...form, charge_from: "solar" }, s, "power").charge_from).toBe("solar");
    expect(sourceFromForm({ ...form, charge_from: "any" }, s, "power")).not.toHaveProperty(
      "charge_from",
    );
  });

  it("labels every field it draws, in its own words", () => {
    const names = (s: HaFormSchema[]): string[] =>
      s.flatMap((x) => (x.schema ? names(x.schema as HaFormSchema[]) : [x.name]));
    const all: string[] = [];
    for (const card of ["power", "energy"] as const) {
      all.push(...names(flowSchema(undefined, { period: "dashboard" }, card)));
      for (const type of ["solar", "battery", "grid"])
        for (const measure of ["power", "pair"])
          all.push(...names(sourceSchema(undefined, { type, measure }, card)));
    }
    for (const name of new Set(all)) {
      expect(FLOW_LABELS[name], name).toBeDefined();
      expect(hasString(FLOW_LABELS[name]), name).toBe(true);
    }
  });
});
