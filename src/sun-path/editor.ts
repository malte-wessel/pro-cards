// Visual editor of the sun path card (ha-form).
import { FormEditorBase, setOrDrop } from "../shared/editor.ts";
import type { HaFormData, HaFormSchema, HomeAssistant } from "../shared/ha.ts";
import { t, type StringKey } from "../shared/i18n.ts";
import type { SunPathCardConfig } from "./config.ts";
import { DEFAULTS, defaultLabel, SUN_EVENTS, type SunEvent, type SunLabels } from "./constants.ts";

export const EDITOR_LABELS: Record<string, StringKey> = {
  title: "editor.sun.title",
  show_dawn_dusk: "editor.sun.show_dawn_dusk",
  show_tooltip: "editor.sun.show_tooltip",
  day_color: "editor.sun.day_color",
  night_color: "editor.sun.night_color",
  sun_color: "editor.sun.sun_color",
  label_sunrise: "editor.sun.label_sunrise",
  label_sunset: "editor.sun.label_sunset",
  label_dawn: "editor.sun.label_dawn",
  label_noon: "editor.sun.label_noon",
  label_dusk: "editor.sun.label_dusk",
};

const COLOR_KEYS = ["day_color", "night_color", "sun_color"] as const;

export const configToForm = (config: SunPathCardConfig): HaFormData => {
  const data: HaFormData = {
    title: config.title ?? "",
    show_dawn_dusk: config.show_dawn_dusk ?? DEFAULTS.show_dawn_dusk,
    show_tooltip: config.show_tooltip ?? DEFAULTS.show_tooltip,
    day_color: config.day_color ?? "",
    night_color: config.night_color ?? "",
    sun_color: config.sun_color ?? "",
  };
  for (const k of SUN_EVENTS) data[`label_${k}`] = config.labels?.[k] ?? "";
  return data;
};

// a label equal to its default in the user's language is not an override
export const formToConfig = (
  data: HaFormData,
  prev: SunPathCardConfig,
  hass?: HomeAssistant,
): SunPathCardConfig => {
  const config: SunPathCardConfig = { ...prev };
  setOrDrop(config, "title", data.title, !data.title);
  setOrDrop(config, "show_dawn_dusk", false, data.show_dawn_dusk !== false);
  setOrDrop(config, "show_tooltip", false, data.show_tooltip !== false);
  for (const k of COLOR_KEYS) setOrDrop(config, k, data[k], !data[k] || data[k] === DEFAULTS[k]);
  const labels: Partial<SunLabels> = {};
  for (const k of SUN_EVENTS) {
    const v = data[`label_${k}`];
    if (v && v !== defaultLabel(hass, k)) labels[k] = String(v);
  }
  setOrDrop(config, "labels", labels, Object.keys(labels).length === 0);
  return config;
};

export const editorSchema = (hass?: HomeAssistant): HaFormSchema[] => [
  { name: "title", selector: { text: {} } },
  { name: "show_dawn_dusk", selector: { boolean: {} } },
  { name: "show_tooltip", selector: { boolean: {} } },
  {
    name: "",
    type: "grid",
    schema: [
      { name: "day_color", selector: { ui_color: { default_color: "light-blue" } } },
      { name: "night_color", selector: { ui_color: { default_color: "indigo" } } },
      { name: "sun_color", selector: { ui_color: { default_color: "amber" } } },
    ],
  },
  {
    name: "",
    type: "expandable",
    title: t(hass, "editor.sun.section_labels"),
    flatten: true,
    schema: [
      {
        name: "",
        type: "grid",
        schema: SUN_EVENTS.map((k) => ({ name: `label_${k}`, selector: { text: {} } })),
      },
    ],
  },
];

export class SunPathCardEditor extends FormEditorBase {
  static labels = EDITOR_LABELS;
  _helper(sch: HaFormSchema) {
    return sch.name.startsWith("label_")
      ? t(this._hass, "editor.default", {
          value: defaultLabel(this._hass, sch.name.slice(6) as SunEvent),
        })
      : undefined;
  }
  _toForm(config: SunPathCardConfig) {
    return configToForm(config);
  }
  _fromForm(data: HaFormData, prev: SunPathCardConfig) {
    return formToConfig(data, prev, this._hass);
  }
  _schema(hass: HomeAssistant) {
    return editorSchema(hass);
  }
}
