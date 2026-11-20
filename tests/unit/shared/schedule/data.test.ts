// A schedule's block data (`data`): checked with the card's name in its errors, and its first
// entry as the visual editors' fields, written back as the shortest YAML.
import { describe, it, expect } from "vitest";
import { dataFromForm, dataToForm, normalizeData } from "../../../../src/shared/schedule/data.ts";

describe("a schedule's block data", () => {
  it("takes keys alone or with a unit, a step, bounds and a default", () => {
    const [a, b] = normalizeData(
      ["mode", { key: "temperature", unit: "°C", step: "0.5", default: 21 }],
      "x",
    );
    expect(a).toMatchObject({ key: "mode", unit: null, default: null });
    expect(b).toMatchObject({ key: "temperature", unit: "°C", step: 0.5, default: 21 });
    expect(normalizeData(undefined, "x")).toEqual([]);
  });
  it("names the card in its errors", () => {
    expect(() => normalizeData("temperature", "poster-card-pro")).toThrow(
      /^poster-card-pro: data is a list/,
    );
    expect(() => normalizeData([{ unit: "°C" }], "tile-card-pro")).toThrow(
      "tile-card-pro: data[0] needs a key",
    );
    expect(() => normalizeData([{ key: "t", step: 0 }], "x")).toThrow(
      "data[0].step is more than 0",
    );
    expect(() => normalizeData([{ key: "t", colour: "red" }], "x")).toThrow(/not colour/);
  });
  it("shows the first entry as the form's fields, and writes back only what changed", () => {
    const c = { data: [{ key: "temperature", unit: "°C", step: "0.5" }, "mode"] };
    const form = dataToForm(c);
    expect(form).toMatchObject({ data_key: "temperature", data_unit: "°C", data_step: 0.5 });
    // the step written as text that still says 0.5 keeps its spelling; the second entry stays
    expect(dataFromForm(form, c)).toEqual(c.data);
    expect(dataFromForm({ ...form, data_step: 1 }, c)).toEqual([
      { key: "temperature", unit: "°C", step: 1 },
      "mode",
    ]);
    // a key alone is written as the key; no key: the entry goes
    expect(dataFromForm({ data_key: "duration" }, {})).toEqual(["duration"]);
    expect(dataFromForm({ data_key: "" }, { data: ["mode"] })).toBeUndefined();
  });
});
