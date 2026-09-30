// Visual editor of the sun path card (ha-form).
import { FormEditorBase, setOrDrop } from "../shared/editor.ts";
import type { HaFormData, HaFormSchema } from "../shared/ha.ts";
import type { SunPathCardConfig } from "./config.ts";
import { DEFAULTS, DEFAULT_LABELS, type SunEvent, type SunLabels } from "./constants.ts";

export const EDITOR_LABELS: Record<string, string> = {
  title: "Title",
  show_dawn_dusk: "Show dawn, solar noon and dusk",
  show_tooltip: "Show tooltip on hover",
  day_color: "Day colour",
  night_color: "Night colour",
  sun_color: "Sun colour",
  label_sunrise: "Sunrise label",
  label_sunset: "Sunset label",
  label_dawn: "Dawn label",
  label_noon: "Solar noon label",
  label_dusk: "Dusk label",
};

const SUN_EVENTS = Object.keys(DEFAULT_LABELS) as SunEvent[];
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

export const formToConfig = (data: HaFormData, prev: SunPathCardConfig): SunPathCardConfig => {
  const config: SunPathCardConfig = { ...prev };
  setOrDrop(config, "title", data.title, !data.title);
  setOrDrop(config, "show_dawn_dusk", false, data.show_dawn_dusk !== false);
  setOrDrop(config, "show_tooltip", false, data.show_tooltip !== false);
  for (const k of COLOR_KEYS) setOrDrop(config, k, data[k], !data[k] || data[k] === DEFAULTS[k]);
  const labels: Partial<SunLabels> = {};
  for (const k of SUN_EVENTS) {
    const v = data[`label_${k}`];
    if (v && v !== DEFAULT_LABELS[k]) labels[k] = String(v);
  }
  setOrDrop(config, "labels", labels, Object.keys(labels).length === 0);
  return config;
};

export const EDITOR_SCHEMA: HaFormSchema[] = [
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
    title: "Labels",
    flatten: true,
    schema: [
      {
        name: "",
        type: "grid",
        schema: [
          { name: "label_sunrise", selector: { text: {} } },
          { name: "label_sunset", selector: { text: {} } },
          { name: "label_dawn", selector: { text: {} } },
          { name: "label_noon", selector: { text: {} } },
          { name: "label_dusk", selector: { text: {} } },
        ],
      },
    ],
  },
];

export class SunPathCardEditor extends FormEditorBase {
  static labels = EDITOR_LABELS;
  _helper(sch: HaFormSchema) {
    return sch.name.startsWith("label_")
      ? `Default: ${DEFAULT_LABELS[sch.name.slice(6) as SunEvent]}`
      : undefined;
  }
  _toForm(config: SunPathCardConfig) {
    return configToForm(config);
  }
  _fromForm(data: HaFormData, prev: SunPathCardConfig) {
    return formToConfig(data, prev);
  }
  _schema() {
    return EDITOR_SCHEMA;
  }
}
