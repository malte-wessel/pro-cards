// Visual editor of the multi trend card (ha-form): its options, then its entities as a list of
// lines, each in a view of its own (its entity, name, colour, rules and visibility), as the trend
// poster's lines.
import { FormEditorBase, setOrDrop } from "../shared/editor.ts";
import type { HaFormData, HaFormSchema, HomeAssistant } from "../shared/ha.ts";
import { t, type StringKey } from "../shared/i18n.ts";
import { seriesFromForm, seriesToForm } from "../shared/kinds/editor-form.ts";
import type { MultiTrendCardConfig } from "./config.ts";
import { DEFAULT_HOURS } from "../shared/trend/scale.ts";

export const EDITOR_LABELS: Record<string, StringKey> = {
  title: "editor.multi_trend.title",
  icon: "editor.multi_trend.icon",
  color: "editor.multi_trend.color",
  hours_to_show: "editor.multi_trend.hours_to_show",
  smoothing_minutes: "editor.multi_trend.smoothing_minutes",
  layout: "editor.multi_trend.layout",
  show_legend: "editor.multi_trend.show_legend",
  fill_height: "editor.multi_trend.fill_height",
  x_axis: "editor.multi_trend.x_axis",
  y_axis: "editor.multi_trend.y_axis",
  entities: "editor.multi_trend.entities",
};
export const layoutOptions = (hass?: HomeAssistant) => [
  { value: "auto", label: t(hass, "editor.multi_trend.layout.auto") },
  { value: "overlay", label: t(hass, "editor.multi_trend.layout.overlay") },
  { value: "lanes", label: t(hass, "editor.multi_trend.layout.lanes") },
];

// card config -> flat ha-form data
export const configToForm = (config: MultiTrendCardConfig): HaFormData => {
  const data: HaFormData = {
    title: config.title ?? "",
    icon: config.icon ?? "",
    color: config.color ?? "",
    hours_to_show: config.hours_to_show ?? DEFAULT_HOURS,
    smoothing_minutes: config.smoothing_minutes,
    layout: config.layout ?? "auto",
    show_legend: config.show_legend ?? true,
    fill_height: config.fill_height ?? true,
    x_axis: !!config.x_axis,
    y_axis: !!config.y_axis,
    entities: seriesToForm(config.entities),
  };
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
  setOrDrop(
    config,
    "smoothing_minutes",
    Number(data.smoothing_minutes),
    !data.smoothing_minutes || !(Number(data.smoothing_minutes) > 0),
  );
  setOrDrop(config, "layout", data.layout, !data.layout || data.layout === "auto");
  setOrDrop(config, "show_legend", !!data.show_legend, data.show_legend !== false);
  setOrDrop(config, "fill_height", false, data.fill_height !== false);
  setOrDrop(config, "x_axis", true, !data.x_axis);
  setOrDrop(config, "y_axis", true, !data.y_axis);
  // the lines: as written while they are as the form had them, else from the form (each its id
  // alone where it says nothing else)
  if (JSON.stringify(data.entities ?? []) !== JSON.stringify(seriesToForm(prev.entities)))
    config.entities = seriesFromForm(data.entities) as MultiTrendCardConfig["entities"];
  return config;
};

export const editorSchema = (
  hass: HomeAssistant | undefined,
  _data: HaFormData,
): HaFormSchema[] => {
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
          name: "smoothing_minutes",
          selector: {
            number: { min: 5, step: 1, mode: "box", unit_of_measurement: "min" },
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
        { name: "fill_height", selector: { boolean: {} } },
      ],
    },
    { name: "entities", selector: { pro_cards_list: { key: "entities", of: "series" } } },
  ];
  return schema;
};

export class MultiTrendCardEditor extends FormEditorBase {
  static labels = EDITOR_LABELS;
  // its entities are trend lines (item-views.ts)
  _itemTypes() {
    return { entities: "series" };
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
