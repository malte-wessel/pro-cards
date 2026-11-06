// Visual editor of the sun azimuth card (ha-form): the title and the view, the house (where its
// front faces, its roof, its sides' names or a shared wall), the 3D view's camera, what is shown
// under the plot and the colours. It writes back only what the form changed: a part as the config
// had it keeps its spelling, a value at its default writes nothing.
import { FormEditorBase, setOrDrop } from "../shared/editor.ts";
import type { HaFormData, HaFormSchema, HomeAssistant } from "../shared/ha.ts";
import { t, type StringKey } from "../shared/i18n.ts";
import { ICONS } from "../shared/kinds/editor-schema.ts";
import {
  DEFAULTS,
  ROOFS,
  SIDE_ANGLE,
  SIDE_ORDER,
  VIEWS,
  defaultSideName,
  type SideKey,
} from "./constants.ts";

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => !!v && typeof v === "object" && !Array.isArray(v);

const SWITCHES = [
  "camera_slider",
  "hover_preview",
  "show_summary",
  "show_sun_times",
  "show_sides",
] as const;
const COLORS = ["sun_color", "night_color", "sky_color"] as const;

export const AZIMUTH_LABELS: Record<string, StringKey> = {
  title: "editor.cards.field.title",
  icon: "editor.cards.field.icon",
  view: "editor.azimuth.field.view",
  front: "editor.azimuth.field.front",
  roof: "editor.azimuth.field.roof",
  camera: "editor.azimuth.field.camera",
  camera_slider: "editor.azimuth.field.camera_slider",
  hover_preview: "editor.azimuth.field.hover_preview",
  show_summary: "editor.azimuth.field.show_summary",
  show_sun_times: "editor.azimuth.field.show_sun_times",
  show_sides: "editor.azimuth.field.show_sides",
  fill_height: "editor.sun.fill_height",
  sun_color: "editor.sun.sun_color",
  night_color: "editor.sun.night_color",
  sky_color: "editor.azimuth.field.sky_color",
  ...Object.fromEntries(
    SIDE_ORDER.flatMap((s) => [
      [`side_${s}`, `editor.azimuth.side.${s}` as StringKey],
      [`wall_${s}`, "editor.azimuth.field.wall" as StringKey],
    ]),
  ),
};

const houseOf = (c: Raw): Raw => (isObj(c.house) ? c.house : {});
const sidesOf = (c: Raw): Raw => (isObj(houseOf(c).sides) ? (houseOf(c).sides as Raw) : {});

export const configToForm = (c: Raw): HaFormData => {
  const house = houseOf(c);
  const sides = sidesOf(c);
  const d: HaFormData = {
    title: typeof c.title === "string" ? c.title : "",
    icon: typeof c.icon === "string" ? c.icon : "",
    view: typeof c.view === "string" ? c.view : DEFAULTS.view,
    front: typeof house.front === "number" ? house.front : DEFAULTS.front,
    roof: typeof house.roof === "string" ? house.roof : DEFAULTS.roof,
    camera: typeof c.camera === "number" ? c.camera : DEFAULTS.camera,
    fill_height: c.fill_height !== false,
  };
  for (const k of SWITCHES) d[k] = typeof c[k] === "boolean" ? c[k] : DEFAULTS[k];
  for (const k of COLORS) d[k] = typeof c[k] === "string" ? c[k] : "";
  for (const s of SIDE_ORDER) {
    d[`side_${s}`] = typeof sides[s] === "string" ? sides[s] : "";
    d[`wall_${s}`] = sides[s] === false;
  }
  return d;
};

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export const formToConfig = (data: HaFormData, prev: Raw): Raw => {
  const c: Raw = { ...prev };
  const was = configToForm(prev);
  const changed = (...ks: string[]) => ks.some((k) => !same(data[k], was[k]));
  for (const k of ["title", "icon"]) if (changed(k)) setOrDrop(c, k, data[k], !data[k]);
  if (changed("view")) setOrDrop(c, "view", data.view, !data.view || data.view === DEFAULTS.view);
  if (changed("camera")) {
    const v = Number(data.camera);
    setOrDrop(c, "camera", v, !Number.isFinite(v) || v === DEFAULTS.camera);
  }
  for (const k of SWITCHES)
    if (changed(k)) setOrDrop(c, k, data[k] === true, (data[k] === true) === DEFAULTS[k]);
  if (changed("fill_height")) setOrDrop(c, "fill_height", false, data.fill_height !== false);
  for (const k of COLORS)
    if (changed(k)) setOrDrop(c, k, data[k], !data[k] || data[k] === DEFAULTS[k]);
  // the house: rewritten only where its fields changed; what it does not show stays
  const sideKeys = SIDE_ORDER.flatMap((s) => [`side_${s}`, `wall_${s}`]);
  if (changed("front", "roof", ...sideKeys)) {
    const house: Raw = { ...houseOf(prev) };
    if (changed("front")) {
      const v = Number(data.front);
      setOrDrop(house, "front", v, !Number.isFinite(v) || v === DEFAULTS.front);
    }
    if (changed("roof"))
      setOrDrop(house, "roof", data.roof, !data.roof || data.roof === DEFAULTS.roof);
    if (changed(...sideKeys)) {
      const sides: Raw = { ...sidesOf(prev) };
      for (const s of SIDE_ORDER) {
        if (!changed(`side_${s}`, `wall_${s}`)) continue;
        // a name typed names the side (a wall that gets sun after all); else a shared wall, or
        // nothing (named by where it faces)
        const name = data[`side_${s}`];
        if (name && changed(`side_${s}`)) sides[s] = name;
        else if (data[`wall_${s}`] === true) sides[s] = false;
        else setOrDrop(sides, s, name, !name);
      }
      setOrDrop(house, "sides", sides, !Object.keys(sides).length);
    }
    setOrDrop(c, "house", house, !Object.keys(house).length);
  }
  return c;
};

const grid = (...schema: HaFormSchema[]): HaFormSchema => ({ name: "", type: "grid", schema });
const section = (title: string, icon: string, schema: HaFormSchema[]): HaFormSchema => ({
  name: "",
  type: "expandable",
  flatten: true,
  title,
  iconPath: icon,
  schema,
});
const select = (name: string, values: readonly string[], label: (v: string) => string) => ({
  name,
  selector: {
    select: { mode: "dropdown", options: values.map((v) => ({ value: v, label: label(v) })) },
  },
});
const bearing = (name: string) => ({
  name,
  selector: { number: { min: 0, max: 359, step: 1, mode: "slider", unit_of_measurement: "°" } },
});
const HOUSE_ICON = "M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z";

export const editorSchema = (hass?: HomeAssistant, data: HaFormData = {}): HaFormSchema[] => {
  const L = (k: string) => t(hass, k as StringKey);
  return [
    grid({ name: "title", selector: { text: {} } }, { name: "icon", selector: { icon: {} } }),
    select("view", VIEWS, (v) => L(`editor.azimuth.view.${v}`)),
    section(L("editor.azimuth.section.house"), HOUSE_ICON, [
      bearing("front"),
      select("roof", ROOFS, (v) => L(`editor.azimuth.roof.${v}`)),
      // each side: its name (where it faces when left empty) beside its shared wall switch (a
      // wall has no name: it is not listed)
      ...SIDE_ORDER.map((s) =>
        grid(
          { name: `side_${s}`, selector: { text: {} } },
          { name: `wall_${s}`, selector: { boolean: {} } },
        ),
      ),
    ]),
    ...(data.view === "dial"
      ? []
      : [
          section(L("editor.azimuth.section.camera"), ICONS.look, [
            bearing("camera"),
            { name: "camera_slider", selector: { boolean: {} } },
          ]),
        ]),
    section(L("editor.card.section.content"), ICONS.content, [
      { name: "show_summary", selector: { boolean: {} } },
      { name: "show_sun_times", selector: { boolean: {} } },
      { name: "show_sides", selector: { boolean: {} } },
      { name: "hover_preview", selector: { boolean: {} } },
    ]),
    section(L("editor.card.section.look"), ICONS.look, [
      grid(
        { name: "sun_color", selector: { ui_color: { default_color: DEFAULTS.sun_color } } },
        { name: "night_color", selector: { ui_color: { default_color: DEFAULTS.night_color } } },
        { name: "sky_color", selector: { ui_color: { default_color: DEFAULTS.sky_color } } },
      ),
    ]),
    section(L("editor.card.section.layout"), ICONS.layout, [
      { name: "fill_height", selector: { boolean: {} } },
    ]),
  ];
};

export class SunAzimuthCardEditor extends FormEditorBase {
  static labels = AZIMUTH_LABELS;
  // a side's name: by default where it faces from the front's bearing
  _helper(sch: HaFormSchema) {
    // (which way the camera turns: the bearing it looks toward)
    if (sch.name === "camera") return t(this._hass, "editor.azimuth.help.camera");
    if (!sch.name.startsWith("side_")) return undefined;
    const front = Number(configToForm(this._config ?? {}).front) || 0;
    const normal = SIDE_ANGLE[sch.name.slice(5) as SideKey] + front;
    return t(this._hass, "editor.default", { value: defaultSideName(this._hass, normal) });
  }
  _toForm(config: Raw) {
    return configToForm(config);
  }
  _fromForm(data: HaFormData, prev: Raw) {
    return formToConfig(data, prev);
  }
  _schema(hass: HomeAssistant, data: HaFormData) {
    return editorSchema(hass, data);
  }
}
