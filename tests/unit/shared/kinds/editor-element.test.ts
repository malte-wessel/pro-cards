// The poster's and the tile's editor elements over the docs' stand-in ha-form: the form they
// build, what they send back, how the form follows the entity and the kind, and their helper texts.
import { describe, it, expect, beforeAll } from "vitest";
import { snapshot } from "../../../../docs/.vitepress/theme/ha-shim/hass.ts";
import { kindsOf } from "../../../../src/shared/kinds/editor.ts";
import type {
  CardConfigBase,
  HaFormData,
  HaFormSchema,
  HomeAssistant,
} from "../../../../src/shared/ha.ts";

type Editor = HTMLElement & { setConfig(c: CardConfigBase): void; hass: HomeAssistant };
type Form = HTMLElement & {
  data: HaFormData;
  schema: HaFormSchema[];
  computeLabel(s: HaFormSchema): string;
  computeHelper(s: HaFormSchema): string | undefined;
};

const hass = snapshot();
const tick = () => new Promise((r) => setTimeout(r, 0));

beforeAll(async () => {
  await import("../../../../src/poster-card.ts");
  await import("../../../../src/tile-card.ts");
  const { defineElements } = await import("../../../../docs/.vitepress/theme/ha-shim/elements.ts");
  defineElements();
});

// an editor of the card's own, on the page, with what it sends
const open = (type: "poster" | "tile", config: Record<string, unknown>, withHass = true) => {
  const Card = customElements.get(`${type}-card-pro`) as unknown as {
    getConfigElement(): Editor;
  };
  const ed = Card.getConfigElement();
  const sent: CardConfigBase[] = [];
  ed.addEventListener("config-changed", (e) => sent.push((e as CustomEvent).detail.config));
  ed.setConfig({ type: `custom:${type}-card-pro`, ...config } as CardConfigBase);
  if (withHass) ed.hass = hass;
  document.body.appendChild(ed);
  const form = () => ed.querySelector("ha-form") as Form;
  // the form changed as a user would: the whole data with these fields
  const change = (fields: HaFormData) =>
    form().dispatchEvent(
      new CustomEvent("value-changed", { detail: { value: { ...form().data, ...fields } } }),
    );
  return { ed, sent, form, change };
};
const flat = (schema: HaFormSchema[]): HaFormSchema[] =>
  schema.flatMap((s) => [s, ...(s.schema ? flat(s.schema) : [])]);
const names = (form: Form) => flat(form.schema).flatMap((s) => (s.name ? [s.name] : []));
const helperOf = (form: Form, name: string) =>
  form.computeHelper(flat(form.schema).find((s) => s.name === name)!);

describe("the poster's and the tile's editor element", () => {
  it("is the card's own editor", () => {
    const Poster = customElements.get("poster-card-pro") as unknown as {
      getConfigElement(): HTMLElement;
    };
    const Tile = customElements.get("tile-card-pro") as unknown as {
      getConfigElement(): HTMLElement;
    };
    expect(Poster.getConfigElement().localName).toBe("poster-card-pro-editor");
    expect(Tile.getConfigElement().localName).toBe("tile-card-pro-editor");
  });

  it("builds its form once it has hass", () => {
    const { ed, form } = open("tile", { entity: "light.living_room" }, false);
    expect(form()).toBeNull();
    ed.hass = hass;
    expect(form()).not.toBeNull();
    expect(form().data).toMatchObject({ entity: "light.living_room", kind: "detected" });
    expect(names(form())).toEqual(expect.arrayContaining(["vertical", "status_badge"]));
    ed.remove();
  });

  it("labels the fields in the card's words", () => {
    const { ed, form } = open("poster", { entity: "sensor.wind_speed" });
    const label = (name: string) => form().computeLabel({ name });
    expect(label("entity")).toBe("Entity");
    expect(label("input_gust")).toBe("Gusts");
    expect(label("visual_thing")).toBe("Visual");
    ed.remove();
  });

  it("sends the config the form makes, and keeps what it does not show", () => {
    const grid = { columns: 6, rows: 2 };
    const { ed, sent, change } = open("tile", { entity: "light.living_room", grid_options: grid });
    change({ name: "Sofa", visual_thing: "sparkline", visual_hours: 6 });
    expect(sent.at(-1)).toEqual({
      type: "custom:tile-card-pro",
      entity: "light.living_room",
      grid_options: grid,
      name: "Sofa",
      visual: { type: "sparkline", hours: 6 },
    });
    // the next change starts from that config
    change({ vertical: true });
    expect(sent.at(-1)).toMatchObject({ name: "Sofa", vertical: true });
    expect(sent).toHaveLength(2);
    ed.remove();
  });

  it("writes a config the card takes", () => {
    const { ed, sent, change } = open("poster", { entity: "sensor.wind_speed" });
    change({
      icon_variant: "lines",
      visual_thing: "sparkline",
      input_gust: "sensor.wind_gust",
      badges: [{ entity: "sensor.wind_direction" }],
      rules: [{ above: 30, color: "red" }],
      status: "Breezy",
    });
    const card = document.createElement("poster-card-pro") as Editor;
    expect(() => card.setConfig(sent.at(-1)!)).not.toThrow();
    ed.remove();
  });

  it("builds the form again for another entity or kind", async () => {
    const { ed, form, change } = open("poster", { entity: "light.living_room" });
    expect(names(form())).toContain("control_type");
    expect(names(form())).not.toContain("input_gust");
    change({ entity: "sensor.wind_speed" });
    await tick();
    expect(names(form())).toContain("input_gust");
    expect(names(form())).not.toContain("control_type");
    expect(form().data.kind).toBe("detected");
    change({ kind: "washer" });
    await tick();
    expect(names(form())).toContain("running_above");
    expect(names(form())).not.toContain("input_gust");
    ed.remove();
  });

  it("follows a new config set from outside, as from the YAML", () => {
    const { ed, form } = open("tile", { entity: "light.living_room" });
    ed.setConfig({ type: "custom:tile-card-pro", entity: "fan.living_room", name: "Breeze" });
    expect(form().data).toMatchObject({ entity: "fan.living_room", name: "Breeze" });
    ed.remove();
  });
});

describe("the editor's number fields", () => {
  it("follow the value the card shows, not the state", async () => {
    // a thermostat's state is its mode; it shows its temperature
    const climate = open("poster", { entity: "climate.living_room" });
    await tick();
    expect(names(climate.form())).toEqual(expect.arrayContaining(["unit", "decimals"]));
    const light = open("poster", { entity: "light.living_room" });
    await tick();
    expect(names(light.form())).not.toContain("decimals");
    // an attribute written that is a number
    const lit = open("poster", { entity: "light.living_room", attribute: "brightness" });
    await tick();
    expect(names(lit.form())).toContain("decimals");
    for (const e of [climate, light, lit]) e.ed.remove();
  });
});

describe("the editor's helper texts", () => {
  it("name the inputs found on the device, or say none was", () => {
    const wind = open("poster", { entity: "sensor.wind_speed" });
    expect(helperOf(wind.form(), "input_gust")).toBe("Found on the device: sensor.wind_gust");
    expect(helperOf(wind.form(), "input_direction")).toBe(
      "Found on the device: sensor.wind_direction",
    );
    wind.ed.remove();
    const rain = open("poster", { entity: "sensor.rain_rate" });
    expect(helperOf(rain.form(), "input_today")).toBe("None found on the entity's device");
    rain.ed.remove();
  });

  it("say nothing of an input the card names", () => {
    const { ed, form } = open("poster", {
      entity: "sensor.wind_speed",
      inputs: { gust: "sensor.coast_wind_speed" },
    });
    expect(helperOf(form(), "input_gust")).toBeUndefined();
    expect(helperOf(form(), "input_direction")).toMatch(/^Found on the device/);
    ed.remove();
  });

  it("say what an empty range means, and warn of one that fills nothing", () => {
    const { ed, form, change } = open("tile", {
      entity: "sensor.living_room_humidity",
      visual: "gauge",
    });
    expect(helperOf(form(), "min")).toBe("Empty: 0 %");
    expect(helperOf(form(), "max")).toBe("Empty: 100 %");
    change({ min: 60, max: 20 });
    expect(helperOf(form(), "max")).toBe("Must be above “From”, or nothing fills");
    expect(helperOf(form(), "min")).toBe("Empty: 0 %");
    ed.remove();
  });

  it("explain the fields that need it, and are drawn under them", async () => {
    const { ed, form } = open("poster", { entity: "light.living_room" });
    expect(helperOf(form(), "prefix")).toBe("Before the value, such as ~ or +");
    expect(helperOf(form(), "name")).toBeUndefined();
    await tick();
    const shown = form().shadowRoot!.querySelector('[data-name="prefix"] .helper');
    expect(shown?.textContent).toBe("Before the value, such as ~ or +");
    ed.remove();
  });
});

describe("the kind the editor builds its form for", () => {
  it("is the one picked, else the detected one", () => {
    const of = (d: Record<string, unknown>) => {
      const { kind, detected } = kindsOf(d, hass);
      return [kind.name, detected.name];
    };
    expect(of({ entity: "sensor.wind_speed" })).toEqual(["wind", "wind"]);
    expect(of({ entity: "light.living_room", kind: "wind" })).toEqual(["wind", "light"]);
    expect(of({ entity: "light.living_room", kind: "detected" })).toEqual(["light", "light"]);
    expect(of({ entity: "sensor.outdoor_temperature", kind: "grid" })).toEqual(["grid", "none"]);
    // half made: no entity, or one the home lacks, or a kind that is none
    expect(of({})).toEqual(["none", "none"]);
    expect(of({ entity: "sensor.nowhere" })).toEqual(["none", "none"]);
    expect(of({ entity: "light.kitchen", kind: "nonsense" })).toEqual(["light", "light"]);
  });

  it("is detected by the domain before hass is there, by the state once it is", () => {
    expect(kindsOf({ entity: "light.kitchen" }, undefined).kind.name).toBe("light");
    // a sensor's kind is its device class: none without its state
    expect(kindsOf({ entity: "sensor.wind_speed" }, undefined).kind.name).toBe("none");
    expect(kindsOf({ entity: "sensor.wind_speed", kind: "wind" }, undefined).kind.name).toBe(
      "wind",
    );
  });
});
