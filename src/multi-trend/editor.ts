// Visual editor of the multi trend card (ha-form).
import { FormEditorBase, setOrDrop } from "../shared/editor.ts";
import type { HaFormData, HaFormSchema, HomeAssistant } from "../shared/ha.ts";
import { t, type StringKey } from "../shared/i18n.ts";
import type { MultiTrendCardConfig, MultiTrendEntity } from "./config.ts";
import { DEFAULT_HOURS } from "../shared/trend/scale.ts";

const MAX_EDIT_ENTITIES = 8;
export const EDITOR_LABELS: Record<string, StringKey> = {
  title: "editor.multi_trend.title",
  icon: "editor.multi_trend.icon",
  color: "editor.multi_trend.color",
  hours_to_show: "editor.multi_trend.hours_to_show",
  layout: "editor.multi_trend.layout",
  show_legend: "editor.multi_trend.show_legend",
  x_axis: "editor.multi_trend.x_axis",
  y_axis: "editor.multi_trend.y_axis",
  entities: "editor.multi_trend.entities",
  name: "editor.multi_trend.name",
  ecolor: "editor.multi_trend.ecolor",
};
export const layoutOptions = (hass?: HomeAssistant) => [
  { value: "auto", label: t(hass, "editor.multi_trend.layout.auto") },
  { value: "overlay", label: t(hass, "editor.multi_trend.layout.overlay") },
  { value: "lanes", label: t(hass, "editor.multi_trend.layout.lanes") },
];

// card config -> flat ha-form data
export const configToForm = (config: MultiTrendCardConfig): HaFormData => {
  const entities: string[] = [];
  const data: HaFormData = {
    title: config.title ?? "",
    icon: config.icon ?? "",
    color: config.color ?? "",
    hours_to_show: config.hours_to_show ?? DEFAULT_HOURS,
    layout: config.layout ?? "auto",
    show_legend: config.show_legend ?? true,
    x_axis: !!config.x_axis,
    y_axis: !!config.y_axis,
    entities,
  };
  (config.entities || []).forEach((e) => {
    const o = typeof e === "string" ? { entity: e } : e;
    entities.push(o.entity);
    data[`ent__${o.entity}__name`] = o.name ?? "";
    data[`ent__${o.entity}__color`] = o.color ?? "";
  });
  return data;
};

// flat ha-form data -> card config (keeps unknown keys such as grid_options)
export const formToConfig = (
  data: HaFormData,
  prev: MultiTrendCardConfig,
): MultiTrendCardConfig => {
  const config: MultiTrendCardConfig = { ...prev };
  setOrDrop(config, "title", data.title, !data.title);
  setOrDrop(config, "icon", data.icon, !data.icon);
  setOrDrop(config, "color", data.color, !data.color);
  setOrDrop(
    config,
    "hours_to_show",
    Number(data.hours_to_show),
    !data.hours_to_show || Number(data.hours_to_show) === DEFAULT_HOURS,
  );
  setOrDrop(config, "layout", data.layout, !data.layout || data.layout === "auto");
  setOrDrop(config, "show_legend", !!data.show_legend, data.show_legend !== false);
  setOrDrop(config, "x_axis", true, !data.x_axis);
  setOrDrop(config, "y_axis", true, !data.y_axis);
  config.entities = entityIds(data).map((id) => {
    const o: MultiTrendEntity = { entity: id };
    const name = data[`ent__${id}__name`],
      color = data[`ent__${id}__color`];
    if (name) o.name = String(name);
    if (color) o.color = String(color);
    return o;
  });
  return config;
};

// the entity ids the form holds
const entityIds = (data: HaFormData): string[] =>
  Array.isArray(data.entities) ? data.entities.map(String) : [];

export const editorSchema = (hass: HomeAssistant | undefined, data: HaFormData): HaFormSchema[] => {
  const schema: HaFormSchema[] = [
    { name: "title", selector: { text: {} } },
    {
      name: "",
      type: "grid",
      schema: [
        { name: "icon", selector: { icon: {} } },
        { name: "color", selector: { ui_color: { default_color: "state", include_state: true } } },
      ],
    },
    {
      name: "",
      type: "grid",
      schema: [
        {
          name: "hours_to_show",
          selector: {
            number: { min: 1, max: 168, step: 1, mode: "box", unit_of_measurement: "h" },
          },
        },
        {
          name: "layout",
          selector: { select: { mode: "dropdown", options: layoutOptions(hass) } },
        },
      ],
    },
    {
      name: "",
      type: "grid",
      schema: [
        { name: "show_legend", selector: { boolean: {} } },
        { name: "x_axis", selector: { boolean: {} } },
        { name: "y_axis", selector: { boolean: {} } },
      ],
    },
    {
      name: "entities",
      selector: {
        entity: { multiple: true, filter: [{ domain: ["sensor", "number", "input_number"] }] },
      },
    },
  ];
  entityIds(data)
    .slice(0, MAX_EDIT_ENTITIES)
    .forEach((id) => {
      const st = hass?.states?.[id];
      schema.push({
        name: "",
        type: "expandable",
        iconPath: "",
        flatten: true,
        title: st?.attributes.friendly_name || id,
        schema: [
          {
            name: "",
            type: "grid",
            schema: [
              { name: `ent__${id}__name`, selector: { text: {} } },
              { name: `ent__${id}__color`, selector: { ui_color: { default_color: "state" } } },
            ],
          },
        ],
      });
    });
  return schema;
};

export class MultiTrendCardEditor extends FormEditorBase {
  static labels = EDITOR_LABELS;
  _label(sch: HaFormSchema) {
    const m = sch.name.match(/^ent__.+__(name|color)$/);
    if (m) return t(this._hass, EDITOR_LABELS[m[1] === "color" ? "ecolor" : "name"]);
    return super._label(sch);
  }
  _toForm(config: MultiTrendCardConfig) {
    return configToForm(config);
  }
  _fromForm(data: HaFormData, prev: MultiTrendCardConfig) {
    return formToConfig(data, prev);
  }
  _schema(hass: HomeAssistant, data: HaFormData) {
    return editorSchema(hass, data);
  }
}
