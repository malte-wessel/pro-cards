import { describe, it, expect } from "vitest";
import { snapshot } from "../../../../docs/.vitepress/theme/ha-shim/hass.ts";
import { parseKind, resolveKind } from "../../../../src/shared/kinds/detect.ts";
import {
  configToForm,
  formToConfig,
  type CardThing,
} from "../../../../src/shared/kinds/editor-form.ts";
import type { CardConfigBase, HaFormSchema } from "../../../../src/shared/ha.ts";
import { editorSchema, rangeInfo } from "../../../../src/shared/kinds/editor-schema.ts";
import { kindsOf } from "../../../../src/shared/kinds/editor.ts";
import { KINDS } from "../../../../src/shared/kinds/registry.ts";
import { hasString } from "../../../../src/shared/i18n.ts";
import { isNum } from "../../../../src/shared/util.ts";
import { docExamples, withNested } from "../../docs-examples.ts";

const hass = snapshot();
const THINGS: Record<string, CardThing> = {
  "custom:poster-card-pro": "poster",
  "custom:tile-card-pro": "tile",
};
const kindOf = (cfg: Record<string, unknown>) => {
  const entity = typeof cfg.entity === "string" ? cfg.entity : null;
  return resolveKind(
    parseKind(cfg.kind, "t"),
    entity,
    entity ? hass.states[entity] : undefined,
    "t",
  );
};

describe("the poster's and the tile's editor", () => {
  it("writes every docs example back as it was", () => {
    let n = 0;
    for (const { file, cfg } of docExamples())
      for (const c of withNested(cfg)) {
        const card = c as Record<string, unknown>;
        const thing = THINGS[String(card?.type)];
        if (!thing) continue;
        const kind = kindOf(card);
        const back = formToConfig(
          configToForm(card as CardConfigBase, kind, thing),
          card as CardConfigBase,
          kind,
          thing,
        );
        expect(back, `${file}: ${JSON.stringify(card)}`).toEqual(card);
        n++;
      }
    expect(n).toBeGreaterThan(100);
  });
});

// every field's name in a schema, and every option's label of its selects and dialogs
const namesOf = (schema: HaFormSchema[]): string[] =>
  schema.flatMap((s) => [...(s.name ? [s.name] : []), ...(s.schema ? namesOf(s.schema) : [])]);
const labelsOf = (schema: HaFormSchema[]): unknown[] =>
  schema.flatMap((s) => {
    const sel = s.selector as
      | {
          select?: { options: { label: unknown }[] };
          object?: {
            fields?: Record<
              string,
              { label: unknown; selector: { select?: { options: { label: unknown }[] } } }
            >;
          };
        }
      | undefined;
    const fields = Object.values(sel?.object?.fields ?? {});
    return [
      ...(sel?.select?.options.map((o) => o.label) ?? []),
      ...fields.flatMap((f) => [
        f.label,
        ...(f.selector.select?.options.map((o) => o.label) ?? []),
      ]),
      ...(s.type === "expandable" ? [s.title] : []),
      ...(s.schema ? labelsOf(s.schema) : []),
    ];
  });
const schemaFor = (thing: CardThing, cfg: Record<string, unknown>) => {
  const { kind, detected } = kindsOf(cfg, hass);
  const data = configToForm(cfg as CardConfigBase, kind, thing);
  const entity = typeof cfg.entity === "string" ? cfg.entity : "";
  const st = hass.states[entity];
  return editorSchema({
    hass,
    thing,
    kind,
    detected,
    data,
    numeric: isNum(st?.state),
    st,
  });
};
const optionsOf = (schema: HaFormSchema[], name: string): string[] => {
  const find = (xs: HaFormSchema[]): HaFormSchema | undefined =>
    xs.flatMap((s) => (s.name === name ? [s] : s.schema ? [find(s.schema)] : [])).find(Boolean);
  const sel = find(schema)?.selector as { select: { options: { value: string }[] } } | undefined;
  return sel?.select.options.map((o) => o.value) ?? [];
};

describe("the poster's and the tile's editor form", () => {
  it("shows what the kind takes", () => {
    const light = schemaFor("tile", { entity: "light.living_room" });
    expect(namesOf(light)).toContain("control_type");
    expect(namesOf(light).some((n) => n.startsWith("input_"))).toBe(false);
    // a light glows by default; it draws no window, no path, no animation
    expect(optionsOf(light, "visual_thing")[0]).toBe("default");
    expect(optionsOf(light, "visual_thing")).not.toContain("cover");
    expect(optionsOf(light, "icon_thing")).not.toContain("flow");

    const wind = schemaFor("poster", { entity: "sensor.wind_speed" });
    expect(namesOf(wind)).toEqual(expect.arrayContaining(["input_direction", "input_gust"]));
    expect(namesOf(wind)).not.toContain("control_type");
    expect(optionsOf(wind, "icon_variant")).toEqual(["default", "lines", "swoosh", "vectors"]);
    expect(optionsOf(wind, "visual_thing")).toContain("flow");

    // a tile draws a cover's window only where it names it
    const cover = schemaFor("tile", { entity: "cover.garage_door" });
    expect(optionsOf(cover, "visual_thing")).toContain("cover");
    expect(optionsOf(cover, "visual_thing")).not.toContain("none");
    const poster = schemaFor("poster", { entity: "cover.garage_door" });
    expect(optionsOf(poster, "visual_thing")).toContain("none");

    // a number's unit and decimals; a word has none
    expect(namesOf(schemaFor("tile", { entity: "sensor.living_room_temperature" }))).toContain(
      "decimals",
    );
    expect(namesOf(schemaFor("tile", { entity: "light.living_room" }))).not.toContain("decimals");
    // the tile's own: its layout, its status badge and the badge on its icon
    expect(namesOf(light)).toEqual(
      expect.arrayContaining(["vertical", "status_badge", "icon_badge"]),
    );
    expect(namesOf(schemaFor("poster", { entity: "light.living_room" }))).not.toContain("vertical");
  });

  it("names every field and option in English", () => {
    for (const thing of ["poster", "tile"] as const)
      for (const kind of Object.keys(KINDS))
        for (const extra of [
          {},
          { icon: { type: "image" }, visual: { type: "image" }, control: "buttons" },
          { visual: "sparkline", control: { type: "segments", attribute: "preset_mode" } },
          { icon: { type: "flow" }, visual: "cover", control: "slider" },
        ]) {
          const schema = schemaFor(thing, { kind, entity: "climate.living_room", ...extra });
          for (const n of namesOf(schema)) {
            const key = n.startsWith("input_")
              ? `editor.card.input.${n.slice(6)}`
              : `editor.card.field.${n}`;
            expect(hasString(key), `${thing} ${kind}: ${key}`).toBe(true);
          }
          for (const l of labelsOf(schema))
            expect(typeof l === "string" && l.length > 0, `${thing} ${kind}: ${String(l)}`).toBe(
              true,
            );
        }
  });
});

describe("the editor's inputs", () => {
  // what an entity picker with these filters lists (any filter matches)
  const listed = (filter: { domain: string[]; device_class?: string[] }[]) =>
    Object.values(hass.states)
      .filter((st) =>
        filter.some(
          (f) =>
            f.domain.includes(st.entity_id.split(".")[0]) &&
            (!f.device_class || f.device_class.includes(String(st.attributes.device_class))),
        ),
      )
      .map((st) => st.entity_id);
  const filterOf = (kind: string, key: string) => {
    const schema = schemaFor("poster", {
      kind,
      entity: kind === "wind" ? "sensor.wind_speed" : undefined,
    });
    const find = (xs: HaFormSchema[]): HaFormSchema | undefined =>
      xs
        .flatMap((s) => (s.name === `input_${key}` ? [s] : s.schema ? [find(s.schema)] : []))
        .find(Boolean);
    return (
      find(schema)!.selector as {
        entity: { filter: { domain: string[]; device_class?: string[] }[] };
      }
    ).entity.filter;
  };

  it("lists the entities each input takes", () => {
    for (const kind of Object.values(KINDS))
      for (const def of kind.inputs ?? [])
        expect(
          listed(filterOf(kind.name, def.key)).length,
          `${kind.name}.${def.key}`,
        ).toBeGreaterThan(0);
    // a direction sensor without a device class; a wallbox's power as charging
    expect(listed(filterOf("wind", "direction"))).toContain("sensor.wind_direction");
    expect(listed(filterOf("car", "charging"))).toEqual(
      expect.arrayContaining(["binary_sensor.ev_charging", "sensor.ev_charger_power"]),
    );
    // a meter's power, not any sensor
    expect(listed(filterOf("grid", "import"))).not.toContain("sensor.outdoor_temperature");
  });
});

describe("the editor's prefix and suffix", () => {
  it("show around a value the card shows", () => {
    const has = (thing: CardThing, cfg: Record<string, unknown>) =>
      namesOf(schemaFor(thing, cfg)).includes("prefix");
    expect(has("tile", { entity: "sensor.living_room_temperature" })).toBe(true);
    expect(has("poster", { entity: "light.living_room" })).toBe(true);
    // no value shown: none around it
    expect(has("tile", { entity: "sensor.living_room_temperature", show_value: false })).toBe(
      false,
    );
    expect(has("poster", { name: "Hello" })).toBe(false);
    expect(has("poster", { name: "Hello", value: "Home" })).toBe(true);
  });
});

describe("the editor's value range", () => {
  const range = (thing: CardThing, cfg: Record<string, unknown>) => {
    const { kind, detected } = kindsOf(cfg, hass);
    const data = configToForm(cfg as CardConfigBase, kind, thing);
    const st = hass.states[String(cfg.entity)];
    return rangeInfo({ hass, thing, kind, detected, data, numeric: isNum(st?.state), st });
  };
  const shows = (thing: CardThing, cfg: Record<string, unknown>) =>
    namesOf(schemaFor(thing, cfg)).includes("min");

  it("shows where something reads it, and says what", () => {
    // a light: its glow follows the brightness, its slider is a percentage
    expect(shows("poster", { entity: "light.living_room" })).toBe(false);
    expect(shows("tile", { entity: "sensor.living_room_temperature" })).toBe(false);
    const gauge = range("tile", { entity: "sensor.living_room_humidity", visual: "gauge" });
    expect(gauge).toMatchObject({
      shown: true,
      uses: "Gauge: filled from “From” to “To”",
      min: "0 %",
      max: "100 %",
    });
    expect(
      range("tile", { entity: "sensor.living_room_humidity", icon: { ring: true } }).uses,
    ).toBe("Icon ring: filled from “From” to “To”");
    // a thermostat's stepper: its own limits where the card sets none
    const climate = range("poster", { entity: "climate.living_room" });
    expect(climate.uses).toBe("Stepper: kept between “From” and “To”");
    expect(climate.min).toMatch(/^\d+(\.\d+)? °C$/);
    expect(shows("poster", { entity: "climate.living_room" })).toBe(true);
  });

  it("warns of a range that fills nothing", () => {
    expect(
      range("tile", { entity: "sensor.living_room_humidity", visual: "bar", min: 50, max: 20 })
        .inverted,
    ).toBe(true);
    expect(
      range("tile", { entity: "sensor.living_room_humidity", visual: "bar", min: 20, max: 50 })
        .inverted,
    ).toBe(false);
  });
});
