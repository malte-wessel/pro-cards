// Visual editor of the multi trend card (ha-form): its options, then its entities as a list of
// lines, each in a view of its own (its entity, name, colour, rules and visibility), as the trend
// poster's lines.
import { FormEditorBase, setOrDrop } from "../shared/editor.ts";
import type { HaFormData, HaFormSchema, HomeAssistant } from "../shared/ha.ts";
import { t, type StringKey } from "../shared/i18n.ts";
import { seriesFromForm, seriesToForm } from "../shared/kinds/editor-form.ts";
import { ICONS } from "../shared/kinds/editor-schema.ts";
import type { MultiTrendCardConfig } from "./config.ts";
import { DEFAULT_HOURS } from "../shared/trend/scale.ts";

export const EDITOR_LABELS: Record<string, StringKey> = {
  title: "editor.multi_trend.title",
  icon: "editor.multi_trend.icon",
  color: "editor.multi_trend.color",
  hours: "editor.multi_trend.hours",
  smoothing: "editor.multi_trend.smoothing",
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
    hours: config.hours ?? config.hours_to_show ?? DEFAULT_HOURS,
    smoothing: config.smoothing ?? config.smoothing_minutes,
    layout: config.layout ?? "auto",
    show_legend: config.show_legend ?? true,
    fill_height: config.fill_height ?? true,
    x_axis: !!config.x_axis,
    y_axis: !!config.y_axis,
    entities: seriesToForm(config.entities),
  };
  return data;
};

// flat ha-form data -> card config (keeps unknown keys such as grid_options); the deprecated
// `hours_to_show` and `smoothing_minutes` are written as `hours` and `smoothing`
export const formToConfig = (
  data: HaFormData,
  prev: MultiTrendCardConfig,
): MultiTrendCardConfig => {
  const config: MultiTrendCardConfig = { ...prev };
  delete config.hours_to_show;
  delete config.smoothing_minutes;
  setOrDrop(config, "title", data.title, !data.title);
  setOrDrop(config, "icon", data.icon, !data.icon);
  setOrDrop(config, "color", data.color, !data.color);
  setOrDrop(
    config,
    "hours",
    Number(data.hours),
    !data.hours || Number(data.hours) === DEFAULT_HOURS,
  );
  setOrDrop(
    config,
    "smoothing",
    Number(data.smoothing),
    !data.smoothing || !(Number(data.smoothing) > 0),
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

const section = (title: string, icon: string, schema: HaFormSchema[]): HaFormSchema => ({
  name: "",
  type: "expandable",
  flatten: true,
  title,
  iconPath: icon,
  schema,
});
const grid = (...schema: HaFormSchema[]): HaFormSchema => ({ name: "", type: "grid", schema });
export const editorSchema = (
  hass: HomeAssistant | undefined,
  _data: HaFormData,
): HaFormSchema[] => {
  const L = (k: string) => t(hass, k as StringKey);
  const schema: HaFormSchema[] = [
    grid({ name: "title", selector: { text: {} } }, { name: "icon", selector: { icon: {} } }),
    // its lines (open: what the card is), each in a view of its own
    {
      ...section(L("editor.multi_trend.entities"), ICONS.chart, [
        {
          name: "entities",
          selector: { pro_cards_list: { key: "entities", of: "series", hide_label: true } },
        },
      ]),
      expanded: true,
    } as HaFormSchema,
    section(L("editor.card.section.content"), ICONS.content, [
      grid(
        {
          name: "hours",
          selector: {
            number: { min: 1, max: 168, step: 1, mode: "box", unit_of_measurement: "h" },
          },
        },
        {
          name: "smoothing",
          selector: { number: { min: 5, step: 1, mode: "box", unit_of_measurement: "min" } },
        },
      ),
      grid(
        { name: "show_legend", selector: { boolean: {} } },
        { name: "x_axis", selector: { boolean: {} } },
        { name: "y_axis", selector: { boolean: {} } },
      ),
    ]),
    section(L("editor.card.section.look"), ICONS.look, [
      grid(
        { name: "color", selector: { ui_color: { default_color: "state", include_state: true } } },
        {
          name: "layout",
          selector: { select: { mode: "dropdown", options: layoutOptions(hass) } },
        },
      ),
    ]),
    section(L("editor.card.section.layout"), ICONS.layout, [
      { name: "fill_height", selector: { boolean: {} } },
    ]),
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
