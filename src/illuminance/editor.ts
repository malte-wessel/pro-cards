// Visual editor of the illuminance card (ha-form).
import { FormEditorBase, setOrDrop } from "../shared/editor.ts";
import type { HaFormData, HaFormSchema, HomeAssistant } from "../shared/ha.ts";
import type { IlluminanceCardConfig } from "./config.ts";
import { DEFAULTS } from "./constants.ts";
import { DEFAULT_ZONES, type ZoneOverride, type ZoneOverrides } from "./zones.ts";

export const EDITOR_LABELS: Record<string, string> = {
  entity: "Entity",
  mode: "Mode",
  name: "Name",
  hours_to_show: "Hours to show",
  bucket_minutes: "Bucket size (minutes)",
  min_lx: "Scale from (lx)",
  max_lx: "Scale to (lx)",
};
export const MODE_OPTIONS = [
  { value: "arc", label: "Arc (gauge with zones)" },
  { value: "trend", label: "Trend with zones (24 h)" },
  { value: "band", label: "Band (24 h colour blocks)" },
];

const NUMBER_KEYS = ["hours_to_show", "bucket_minutes", "min_lx", "max_lx"] as const;

export const configToForm = (config: IlluminanceCardConfig): HaFormData => {
  const d: HaFormData = {
    entity: config.entity ?? "",
    mode: config.mode ?? DEFAULTS.mode,
    name: config.name ?? "",
    hours_to_show: config.hours_to_show ?? DEFAULTS.hours_to_show,
    bucket_minutes: config.bucket_minutes ?? DEFAULTS.bucket_minutes,
    min_lx: config.min_lx ?? DEFAULTS.min_lx,
    max_lx: config.max_lx ?? DEFAULTS.max_lx,
  };
  for (const z of DEFAULT_ZONES) {
    const o = config.zones?.[z.key] || {};
    d[`z_${z.key}_label`] = o.label ?? "";
    d[`z_${z.key}_max`] = o.max ?? "";
    d[`z_${z.key}_color`] = o.color ?? "";
  }
  return d;
};

export const formToConfig = (
  data: HaFormData,
  prev: IlluminanceCardConfig,
): IlluminanceCardConfig => {
  const config: IlluminanceCardConfig = { ...prev };
  config.entity = data.entity ? String(data.entity) : "";
  setOrDrop(config, "mode", data.mode, !data.mode || data.mode === DEFAULTS.mode);
  setOrDrop(config, "name", data.name, !data.name);
  for (const k of NUMBER_KEYS) {
    const n = Number(data[k]);
    setOrDrop(
      config,
      k,
      n,
      data[k] === "" ||
        data[k] === null ||
        data[k] === undefined ||
        !Number.isFinite(n) ||
        n === DEFAULTS[k],
    );
  }
  const zones: ZoneOverrides = {};
  for (const z of DEFAULT_ZONES) {
    const o: ZoneOverride = {};
    const l = data[`z_${z.key}_label`],
      m = data[`z_${z.key}_max`],
      c = data[`z_${z.key}_color`];
    if (l && l !== z.label) o.label = String(l);
    if (
      m !== "" &&
      m !== null &&
      m !== undefined &&
      Number.isFinite(Number(m)) &&
      Number(m) !== z.max
    )
      o.max = Number(m);
    if (c && String(c).toLowerCase() !== z.color.toLowerCase()) o.color = String(c);
    if (Object.keys(o).length) zones[z.key] = o;
  }
  setOrDrop(config, "zones", zones, Object.keys(zones).length === 0);
  return config;
};

export const editorSchema = (data: HaFormData): HaFormSchema[] => {
  const s: HaFormSchema[] = [
    {
      name: "entity",
      selector: { entity: { filter: [{ domain: ["sensor", "number", "input_number"] }] } },
    },
    {
      name: "",
      type: "grid",
      schema: [
        { name: "mode", selector: { select: { mode: "dropdown", options: MODE_OPTIONS } } },
        { name: "name", selector: { text: {} } },
      ],
    },
  ];
  if (data.mode !== "arc") {
    s.push({
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
          name: "bucket_minutes",
          selector: {
            number: { min: 5, max: 240, step: 5, mode: "box", unit_of_measurement: "min" },
          },
        },
      ],
    });
  }
  s.push({
    name: "",
    type: "grid",
    schema: [
      {
        name: "min_lx",
        selector: {
          number: { min: 0.01, max: 1000, step: "any", mode: "box", unit_of_measurement: "lx" },
        },
      },
      {
        name: "max_lx",
        selector: {
          number: { min: 1000, max: 200000, step: 1000, mode: "box", unit_of_measurement: "lx" },
        },
      },
    ],
  });
  s.push({
    name: "",
    type: "expandable",
    title: "Zones",
    flatten: true,
    schema: DEFAULT_ZONES.map((z) => ({
      name: "",
      type: "grid",
      column_min_width: "90px",
      schema: [
        { name: `z_${z.key}_label`, selector: { text: {} } },
        ...(z.max === Infinity
          ? []
          : [
              {
                name: `z_${z.key}_max`,
                selector: {
                  number: { min: 0, step: "any", mode: "box", unit_of_measurement: "lx" },
                },
              },
            ]),
        { name: `z_${z.key}_color`, selector: { ui_color: { default_color: z.color } } },
      ],
    })),
  });
  return s;
};

const ZONE_FIELD = /^z_(\w+)_(label|max|color)$/;

export class IlluminanceCardEditor extends FormEditorBase {
  static labels = EDITOR_LABELS;
  _label(sch: HaFormSchema) {
    const m = sch.name.match(ZONE_FIELD);
    const z = m && DEFAULT_ZONES.find((x) => x.key === m[1]);
    if (m && z) {
      return `${z.label}: ${m[2] === "label" ? "label" : m[2] === "max" ? "up to" : "colour"}`;
    }
    return EDITOR_LABELS[sch.name] ?? sch.name;
  }
  _helper(sch: HaFormSchema) {
    const m = sch.name.match(ZONE_FIELD);
    const z = m && DEFAULT_ZONES.find((x) => x.key === m[1]);
    if (!m || !z) return undefined;
    return `Default: ${m[2] === "label" ? z.label : m[2] === "max" ? z.max + " lx" : z.color}`;
  }
  _toForm(config: IlluminanceCardConfig) {
    return configToForm(config);
  }
  _fromForm(data: HaFormData, prev: IlluminanceCardConfig) {
    return formToConfig(data, prev);
  }
  _schema(_hass: HomeAssistant, data: HaFormData) {
    return editorSchema(data);
  }
}
