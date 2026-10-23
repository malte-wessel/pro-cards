import { describe, it, expect } from "vitest";
import { FormEditorBase, setOrDrop } from "../../../src/shared/editor.ts";
import type {
  CardConfigBase,
  HaFormData,
  HaFormSchema,
  HomeAssistant,
} from "../../../src/shared/ha.ts";

class TestEditor extends FormEditorBase {
  static labels = { title: "editor.sun.title" as const };
  _toForm(config: CardConfigBase): HaFormData {
    return { title: config.title ?? "" };
  }
  _fromForm(data: HaFormData, prev: CardConfigBase): CardConfigBase {
    const config = { ...prev };
    setOrDrop(config, "title", data.title, !data.title);
    return config;
  }
  _schema(_hass: HomeAssistant, data: HaFormData): HaFormSchema[] {
    return [{ name: "title", selector: { text: {} } }, { name: data.title ? "x" : "y" }];
  }
  _helper(sch: HaFormSchema) {
    return sch.name === "title" ? "Default: empty" : undefined;
  }
}
customElements.define("test-form-editor", TestEditor);

describe("FormEditorBase", () => {
  it("projects the config into an ha-form and emits config-changed", () => {
    const ed = document.createElement("test-form-editor") as TestEditor;
    ed.setConfig({ type: "custom:x", title: "A", grid_options: { columns: 6 } });
    expect(ed.querySelector("ha-form")).toBe(null); // nothing until hass is set
    const hass = { states: {} } as unknown as HomeAssistant;
    ed.hass = hass;
    const form = ed.querySelector("ha-form")!;
    expect(form.hass).toBe(hass);
    expect(form.data).toEqual({ title: "A" });
    expect(form.schema?.[1].name).toBe("x");
    expect(form.computeLabel?.({ name: "title" })).toBe("Title");
    expect(form.computeLabel?.({ name: "other" })).toBe("other");
    expect(form.computeHelper?.({ name: "title" })).toBe("Default: empty");
    const seen: unknown[] = [];
    ed.addEventListener("config-changed", (ev) =>
      seen.push((ev as CustomEvent<{ config: unknown }>).detail.config),
    );
    form.dispatchEvent(new CustomEvent("value-changed", { detail: { value: { title: "" } } }));
    expect(seen).toEqual([{ type: "custom:x", grid_options: { columns: 6 } }]);
    expect(form.schema?.[1].name).toBe("y");
    expect(ed.querySelectorAll("ha-form").length).toBe(1);
  });
  it("only hands a new hass to the form; data and schema follow the config and the language", () => {
    const ed = document.createElement("test-form-editor") as TestEditor;
    ed.setConfig({ type: "custom:x", title: "A" });
    const hass = (language: string) =>
      ({ states: {}, locale: { language } }) as unknown as HomeAssistant;
    ed.hass = hass("en");
    const form = ed.querySelector("ha-form")!;
    const { data, schema } = form;
    const next = hass("en");
    ed.hass = next;
    expect(form.hass).toBe(next);
    expect(form.data).toBe(data);
    expect(form.schema).toBe(schema);
    // the same config again (HA's setConfig after a change): nothing to redo
    ed.setConfig({ type: "custom:x", title: "A" });
    expect(form.schema).toBe(schema);
    // another config, another language: a new form
    ed.setConfig({ type: "custom:x", title: "B" });
    expect(form.data).toEqual({ title: "B" });
    const schemaB = form.schema;
    ed.hass = hass("de");
    expect(form.schema).not.toBe(schemaB);
  });
  it("setOrDrop sets or deletes a key", () => {
    const c: Record<string, unknown> = { a: 1, b: 2 };
    setOrDrop(c, "a", 5, false);
    setOrDrop(c, "b", 9, true);
    setOrDrop(c, "c", 3, false);
    expect(c).toEqual({ a: 5, c: 3 });
  });
});
