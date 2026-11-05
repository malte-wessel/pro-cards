// The poster's and the tile's editor (pure): the ha-form schema for one card, built from its kind.
// Only what applies shows: the things the kind draws, the options of the thing chosen, the
// kind's inputs, the controls its domain takes. A select's default comes first, named as what it
// is (Glow; the kind as "Wind (detected)"): leaving a field alone is a choice the form shows, and
// writes nothing.
import { domainOf } from "../color.ts";
import type { RawEntity } from "../entity/config.ts";
import { BADGE_SIZES, BADGE_STYLES } from "../entity/constants.ts";
import type { HaFormData, HaFormSchema, HassEntity, HomeAssistant } from "../ha.ts";
import { hasString, t, type StringKey } from "../i18n.ts";
import { RAIN_STYLES } from "../rain/constants.ts";
import { isNum } from "../util.ts";
import { FLOW_STYLES } from "../wind/constants.ts";
import { TILE_ICON_TOGGLES } from "./config.ts";
import {
  BADGE_ICONS,
  BADGE_KEYS,
  BADGE_KINDS,
  BUTTON_KEYS,
  DEFAULT,
  DETECTED,
  DEFAULT_ATTRIBUTE,
  defaultPosition,
  sameAsOwn,
  visualVariant,
  DOMAIN_CONTROLS,
  DOMAIN_AUTO,
  OPTION_KEYS,
  RULE_KEYS,
  SERIES_KEYS,
  defaultIcon,
  defaultVisual,
  drawnControls,
  ownControls,
  withDefaults,
  type CardThing,
} from "./editor-form.ts";
import {
  COVER_VARIANTS,
  KIND_THINGS,
  VISUAL_OPTIONS,
  type IconThing,
  type VisualThing,
} from "./places.ts";
import { IMAGE_OPACITY } from "./backdrop.ts";
import { canRead } from "./detect.ts";
import { KINDS } from "./registry.ts";
import type { Kind } from "./types.ts";

// what the schema is built from: the card, its kind now (written, else detected) and the
// detected one, the entity's state
export interface SchemaCtx {
  hass: HomeAssistant | undefined;
  thing: CardThing;
  kind: Kind;
  detected: Kind;
  data: HaFormData;
  // the entity's state is a number (its unit and decimals apply)
  numeric: boolean;
  st: HassEntity | undefined;
}

// the sections' icons (Material Design Icons, as Home Assistant's own editors use)
const ICONS = {
  content:
    "M5,3C3.89,3 3,3.89 3,5V19C3,20.11 3.89,21 5,21H19C20.11,21 21,20.11 21,19V5C21,3.89 20.11,3 19,3H5M5,5H19V19H5V5M7,7V9H17V7H7M7,11V13H17V11H7M7,15V17H14V15H7Z",
  look: "M12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2C17.5,2 22,6 22,11A6,6 0 0,1 16,17H14.2C13.9,17 13.7,17.2 13.7,17.5C13.7,17.6 13.8,17.7 13.8,17.8C14.2,18.3 14.4,18.9 14.4,19.5C14.5,20.9 13.4,22 12,22M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C12.3,20 12.5,19.8 12.5,19.5C12.5,19.3 12.4,19.2 12.4,19.1C12,18.6 11.8,18.1 11.8,17.5C11.8,16.1 12.9,15 14.3,15H16A4,4 0 0,0 20,11C20,7.1 16.4,4 12,4M6.5,10C7.3,10 8,10.7 8,11.5C8,12.3 7.3,13 6.5,13C5.7,13 5,12.3 5,11.5C5,10.7 5.7,10 6.5,10M9.5,6C10.3,6 11,6.7 11,7.5C11,8.3 10.3,9 9.5,9C8.7,9 8,8.3 8,7.5C8,6.7 8.7,6 9.5,6M14.5,6C15.3,6 16,6.7 16,7.5C16,8.3 15.3,9 14.5,9C13.7,9 13,8.3 13,7.5C13,6.7 13.7,6 14.5,6M17.5,10C18.3,10 19,10.7 19,11.5C19,12.3 18.3,13 17.5,13C16.7,13 16,12.3 16,11.5C16,10.7 16.7,10 17.5,10Z",
  inputs:
    "M21.4 7.5C22.2 8.3 22.2 9.6 21.4 10.3L18.6 13.1L10.8 5.3L13.6 2.5C14.4 1.7 15.7 1.7 16.4 2.5L18.2 4.3L21.2 1.3L22.6 2.7L19.6 5.7L21.4 7.5M15.6 13.3L14.2 11.9L11.4 14.7L9.3 12.6L12.1 9.8L10.7 8.4L7.9 11.2L6.4 9.8L3.6 12.6C2.8 13.4 2.8 14.7 3.6 15.4L5.4 17.2L1.4 21.2L2.8 22.6L6.8 18.6L8.6 20.4C9.4 21.2 10.7 21.2 11.4 20.4L14.2 17.6L12.8 16.2L15.6 13.3Z",
  controls:
    "M8 13C6.14 13 4.59 14.28 4.14 16H2V18H4.14C4.59 19.72 6.14 21 8 21S11.41 19.72 11.86 18H22V16H11.86C11.41 14.28 9.86 13 8 13M8 19C6.9 19 6 18.1 6 17C6 15.9 6.9 15 8 15S10 15.9 10 17C10 18.1 9.1 19 8 19M19.86 6C19.41 4.28 17.86 3 16 3S12.59 4.28 12.14 6H2V8H12.14C12.59 9.72 14.14 11 16 11S19.41 9.72 19.86 8H22V6H19.86M16 9C14.9 9 14 8.1 14 7C14 5.9 14.9 5 16 5S18 5.9 18 7C18 8.1 17.1 9 16 9Z",
  badges:
    "M21.41 11.58L12.41 2.58A2 2 0 0 0 11 2H4A2 2 0 0 0 2 4V11A2 2 0 0 0 2.59 12.42L11.59 21.42A2 2 0 0 0 13 22A2 2 0 0 0 14.41 21.41L21.41 14.41A2 2 0 0 0 22 13A2 2 0 0 0 21.41 11.58M13 20L4 11V4H11L20 13M6.5 5A1.5 1.5 0 1 1 5 6.5A1.5 1.5 0 0 1 6.5 5Z",
  rules:
    "M3,5H9V11H3V5M5,7V9H7V7H5M11,7H21V9H11V7M11,15H21V17H11V15M5,20L1.5,16.5L2.91,15.09L5,17.17L9.59,12.59L11,14L5,20Z",
  actions:
    "M10,9A1,1 0 0,1 11,8A1,1 0 0,1 12,9V13.47L13.21,13.6L18.15,15.79C18.68,16.03 19,16.56 19,17.14V21.5C18.97,22.32 18.32,22.97 17.5,23H11C10.62,23 10.26,22.85 10,22.57L5.1,18.37L5.84,17.6C6.03,17.39 6.3,17.28 6.58,17.28H6.8L10,19V9M11,5A4,4 0 0,1 15,9C15,10.5 14.2,11.77 13,12.46V11.24C13.61,10.69 14,9.89 14,9A3,3 0 0,0 11,6A3,3 0 0,0 8,9C8,9.89 8.39,10.69 9,11.24V12.46C7.8,11.77 7,10.5 7,9A4,4 0 0,1 11,5Z",
  layout:
    "M19,5V7H15V5H19M9,5V11H5V5H9M19,13V19H15V13H19M9,17V19H5V17H9M21,3H13V9H21V3M11,3H3V13H11V3M21,11H13V21H21V11M11,15H3V21H11V15Z",
};

// the modes segments and a select set on a climate or a fan
const ATTRIBUTES: Record<string, readonly string[]> = {
  climate: ["hvac_mode", "preset_mode", "fan_mode"],
  fan: ["preset_mode"],
};
// a flow's and a cover's drawings, by kind
const VARIANTS: Partial<Record<string, readonly string[]>> = {
  wind: FLOW_STYLES,
  rain: RAIN_STYLES,
  cover: COVER_VARIANTS,
};

const selectOf = (options: { value: string; label: string }[]) => ({
  select: { mode: "dropdown", options },
});
// a select whose first option names the default (clearing it goes back there)
const pick = (name: string, options: { value: string; label: string }[]): HaFormSchema => ({
  name,
  selector: selectOf(options),
});
const section = (title: string, icon: string, schema: HaFormSchema[]): HaFormSchema => ({
  name: "",
  type: "expandable",
  flatten: true,
  title,
  iconPath: icon,
  schema,
});
const grid = (...schema: HaFormSchema[]): HaFormSchema => ({ name: "", type: "grid", schema });

// a label of the editor's own words (a key the schema builds from a value)
const L = (hass: HomeAssistant | undefined, key: string, vars?: Record<string, string>) =>
  t(hass, `editor.card.${key}` as StringKey, vars);

export const kindLabel = (hass: HomeAssistant | undefined, name: string) => L(hass, `kind.${name}`);

// the controls the card draws now: the kind's own (a tile's at the line's end), the domain's
// (auto), or the one the form names
const controlsOf = (x: SchemaCtx, data: HaFormData) => {
  const entity = typeof data.entity === "string" && data.entity ? data.entity : null;
  const domain = entity ? domainOf(entity) : null;
  const own = ownControls(x.kind, x.thing);
  const auto = domain && !own.length ? (DOMAIN_AUTO[domain] ?? []) : [];
  const domainControls = domain ? (DOMAIN_CONTROLS[domain] ?? []) : [];
  const type = data.control_type as string;
  const drawn = drawnControls(type, entity, x.kind, x.thing);
  return { domain, own, auto, domainControls, type, drawn };
};

// brightness, position, volume and speed are percentages: min and max never limit their controls
const PERCENT_DOMAINS = new Set(["light", "cover", "media_player", "fan"]);
// what reads min and max on this card now (the things that fill by the value, a control's
// limits; none: the range is not shown) and what applies where they are left out
export const rangeInfo = (x: SchemaCtx) => {
  const data = withDefaults(x.data);
  const tr = (key: string, vars?: Record<string, string>) => L(x.hass, key, vars);
  const iconThing = data.icon_thing === DEFAULT ? defaultIcon(x.kind) : data.icon_thing;
  const visual = data.visual_thing === DEFAULT ? defaultVisual(x.kind, x.thing) : data.visual_thing;
  const fills: string[] = [];
  if (visual === "bar" || visual === "gauge" || visual === "segments")
    fills.push(tr(`visual_thing.${visual}`));
  // a light's glow follows its brightness; a thermostat's and an alarm's are their own drawing
  if (visual === "glow" && !x.kind.level && !x.kind.glow) fills.push(tr("visual_thing.glow"));
  if (data.icon_ring === true && iconThing !== "none" && iconThing !== "flow")
    fills.push(tr("range.ring"));
  const { domain, drawn } = controlsOf(x, data);
  const limited =
    domain && !PERCENT_DOMAINS.has(domain)
      ? drawn.filter((c) => c === "slider" || c === "stepper")
      : [];
  const uses = [
    ...(fills.length ? [tr("range.fills", { things: fills.join(", ") })] : []),
    ...(limited.length
      ? [tr("range.limits", { controls: limited.map((c) => tr(`control.${c}`)).join(", ") })]
      : []),
  ];
  // empty: the thermostat's own limits for its stepper, else the entity's range, else 0 to 100
  const attr = (k: string) => {
    const v = Number(x.st?.attributes?.[k]);
    return x.st?.attributes?.[k] !== undefined && Number.isFinite(v) ? v : null;
  };
  const climate = domain === "climate" && limited.length > 0;
  // a thermostat's state has no unit: Home Assistant's temperature unit
  const unit = String(
    x.st?.attributes?.unit_of_measurement ??
      (climate ? (x.hass?.config?.unit_system?.temperature ?? "°C") : ""),
  );
  const min = climate ? (attr("min_temp") ?? 7) : (attr("min") ?? attr("min_value") ?? 0);
  const max = climate ? (attr("max_temp") ?? 35) : (attr("max") ?? attr("max_value") ?? 100);
  return {
    shown: uses.length > 0,
    uses: uses.join(" · "),
    min: `${min}${unit ? ` ${unit}` : ""}`,
    max: `${max}${unit ? ` ${unit}` : ""}`,
    // a range that fills nothing
    inverted: typeof data.min === "number" && typeof data.max === "number" && data.max <= data.min,
  };
};

// what the entity gives where the card writes nothing, as the fields' placeholders: its name, the
// value it shows (the attribute written, else the kind's: a thermostat's temperature), its unit
// and its decimals
export const placeholders = (x: SchemaCtx): Record<string, string> => {
  const { hass, st, kind } = x;
  if (!st) return {};
  const out: Record<string, string> = {};
  const name = st.attributes.friendly_name;
  if (typeof name === "string" && name) out.name = name;
  const written = typeof x.data.attribute === "string" && x.data.attribute ? x.data.attribute : "";
  const own = kind.main?.(st.entity_id, { entity: st.entity_id } as RawEntity, {}).attribute ?? "";
  const attr = written || own;
  // the attribute picker without a pick: the state, or the kind's attribute by its name
  out.attribute = own
    ? (hass?.formatEntityAttributeName?.(st, own) ??
      own.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()))
    : L(hass, "attribute_state");
  const raw = attr ? st.attributes[attr] : st.state;
  if (raw !== undefined && raw !== null && raw !== "")
    out.value = isNum(raw)
      ? String(raw)
      : attr
        ? (hass?.formatEntityAttributeValue?.(st, attr) ?? String(raw))
        : (hass?.formatEntityState?.(st) ?? String(raw));
  const unit = attr
    ? /temperature/.test(attr) && domainOf(st.entity_id) === "climate"
      ? (hass?.config?.unit_system?.temperature ?? "")
      : ""
    : st.attributes.unit_of_measurement;
  if (typeof unit === "string" && unit) out.unit = unit;
  const precision = (hass?.entities?.[st.entity_id] as { display_precision?: unknown } | undefined)
    ?.display_precision;
  if (typeof precision === "number") out.decimals = String(precision);
  return out;
};

export const editorSchema = (x: SchemaCtx): HaFormSchema[] => {
  const { hass, thing, kind } = x;
  const data = withDefaults(x.data);
  const tr = (key: string, vars?: Record<string, string>) => L(hass, key, vars);
  const opt = (value: string, label: string) => ({ value, label });
  const entity = typeof data.entity === "string" && data.entity ? data.entity : null;
  const domain = entity ? domainOf(entity) : null;
  // the places' things now: chosen, else the kind's
  const iconThing = (data.icon_thing === DEFAULT ? defaultIcon(kind) : data.icon_thing) as
    IconThing | "none";
  const byDefault = defaultVisual(kind, thing);
  const visualThing = (data.visual_thing === DEFAULT ? byDefault : data.visual_thing) as
    VisualThing | "none" | null;
  const fits = (th: string) => !KIND_THINGS.includes(th) || !!kind.draws?.includes(th);

  // a text field, what the entity gives there as its placeholder
  const shown = placeholders(x);
  const text = (name: string): HaFormSchema => ({
    name,
    selector: { text: {} },
    ...(shown[name] !== undefined ? { default: shown[name] } : {}),
  });

  // ----- the top: the entity, its kind, its name and icon, the colour -----
  // the kinds that read the entity, the detected one only as detected (the one written too, so the
  // select shows it)
  const kinds = Object.keys(KINDS)
    .filter((k) => k === data.kind || (k !== x.detected.name && canRead(KINDS[k], entity)))
    .map((k) => opt(k, kindLabel(hass, k)))
    .sort((a, b) => a.label.localeCompare(b.label));
  const top: HaFormSchema[] = [
    { name: "entity", selector: { entity: {} } },
    pick("kind", [
      opt(DETECTED, tr("kind_detected", { kind: kindLabel(hass, x.detected.name) })),
      ...kinds,
    ]),
    grid(
      text("name"),
      // the entity's own icon in its place while none is written
      ...(iconThing === "icon" || iconThing === "image"
        ? [{ name: "icon", selector: { icon: {} }, context: { icon_entity: "entity" } }]
        : []),
    ),
    { name: "color", selector: { ui_color: { default_color: "state", include_state: true } } },
  ];

  // ----- content: the texts, the value's range -----
  const range = rangeInfo(x);
  const content: HaFormSchema[] = [
    ...(entity
      ? [
          {
            name: "attribute",
            selector: { attribute: { entity_id: entity } },
            ...(shown.attribute !== undefined ? { default: shown.attribute } : {}),
          },
        ]
      : []),
    grid(text("value"), { name: "secondary", selector: { text: {} } }),
    ...(x.numeric
      ? [
          grid(text("unit"), {
            name: "decimals",
            selector: { number: { min: 0, max: 3, step: 1, mode: "box" } },
            ...(shown.decimals !== undefined ? { default: shown.decimals } : {}),
          }),
        ]
      : []),
    // around a value the card shows: an entity's, or one written
    ...(data.show_value !== false && (entity || data.value)
      ? [
          grid(
            { name: "prefix", selector: { text: {} } },
            { name: "suffix", selector: { text: {} } },
          ),
        ]
      : []),
    // the value's range, where something reads it: what it does on this card, then the pair
    ...(range.shown
      ? [
          { name: "range", type: "constant", value: range.uses },
          grid(
            { name: "min", selector: { number: { mode: "box", step: "any" } } },
            { name: "max", selector: { number: { mode: "box", step: "any" } } },
          ),
        ]
      : []),
    grid(
      { name: "show_name", selector: { boolean: {} } },
      { name: "show_value", selector: { boolean: {} } },
    ),
  ];

  // ----- look: the icon's and the visual's thing, then that thing's options -----
  // the animation is drawn in one place: behind the card, the icon's flow is its still drawing (the
  // wind's arrow, the rain's icon)
  const still = visualThing === "flow";
  const iconLabel = (th: string) =>
    th === "flow" && still && hasString(`editor.card.icon_thing.still.${kind.name}`)
      ? tr(`icon_thing.still.${kind.name}`)
      : tr(`icon_thing.${th}`);
  const iconThings = [
    opt(DEFAULT, iconLabel(defaultIcon(kind))),
    ...(["icon", "image", "flow"] as const)
      .filter((th) => th !== defaultIcon(kind) && fits(th))
      .map((th) => opt(th, iconLabel(th))),
    opt("none", tr("none")),
  ];
  // a drawing's variants, the default first (the kind's, else the device class's)
  const variants = (name: string, of: string, byDefault: string | undefined) =>
    pick(name, [
      opt(DEFAULT, byDefault ? tr(`variant.${byDefault}`) : tr("variant.by_class")),
      ...(VARIANTS[of] ?? []).filter((v) => v !== byDefault).map((v) => opt(v, tr(`variant.${v}`))),
    ]);
  const iconOptions: HaFormSchema[] =
    iconThing === "none"
      ? []
      : [
          ...(iconThing === "image" ? [{ name: "icon_src", selector: { text: {} } }] : []),
          // (the still drawing has no variants)
          ...(iconThing === "flow" && !still
            ? [variants("icon_variant", kind.name, kind.icon?.variant)]
            : []),
          grid(
            ...(iconThing !== "flow" ? [{ name: "icon_ring", selector: { boolean: {} } }] : []),
            pick("icon_style", [
              opt("circle", tr("style.circle")),
              opt("plain", tr("style.plain")),
            ]),
          ),
        ];
  const VISUAL_ORDER: readonly VisualThing[] = [
    "glow",
    "image",
    "sparkline",
    "columns",
    "strip",
    "bar",
    "gauge",
    "segments",
    "flow",
    "sun",
    "cover",
    "path",
    "line",
  ];
  const visualThings = [
    opt(DEFAULT, byDefault ? tr(`visual_thing.${byDefault}`) : tr("none")),
    ...VISUAL_ORDER.filter((th) => th !== byDefault && fits(th)).map((th) =>
      opt(th, tr(`visual_thing.${th}`)),
    ),
    ...(byDefault ? [opt("none", tr("none"))] : []),
  ];
  const takes = visualThing && visualThing !== "none" ? VISUAL_OPTIONS[visualThing] : [];
  const visualOptions: HaFormSchema[] = [
    ...(takes.includes("hours")
      ? [
          grid(
            ...(data.visual_today === true
              ? []
              : [
                  {
                    name: "visual_hours",
                    selector: {
                      number: { min: 0.5, step: 0.5, mode: "box", unit_of_measurement: "h" },
                    },
                  },
                ]),
            ...(visualThing === "sun" ? [] : [{ name: "visual_today", selector: { boolean: {} } }]),
          ),
        ]
      : []),
    ...(takes.includes("bucket")
      ? [
          grid(
            {
              name: "visual_bucket",
              selector: { number: { min: 5, mode: "box", unit_of_measurement: "min" } },
            },
            ...(takes.includes("smoothing")
              ? [
                  {
                    name: "visual_smoothing",
                    selector: { number: { min: 5, mode: "box", unit_of_measurement: "min" } },
                  },
                ]
              : []),
          ),
        ]
      : []),
    ...(takes.includes("axis") ? [{ name: "visual_axis", selector: { boolean: {} } }] : []),
    ...(takes.includes("src") && visualThing !== "image"
      ? [{ name: "visual_src", selector: { entity: {} } }]
      : []),
    ...(visualThing === "image"
      ? [
          { name: "visual_src", selector: { text: {} } },
          {
            name: "visual_opacity",
            selector: { number: { min: 0, max: 1, step: 0.05, mode: "slider" } },
            default: IMAGE_OPACITY,
          },
          grid(
            { name: "visual_tint", selector: { ui_color: {} } },
            {
              name: "visual_blur",
              selector: { number: { min: 0, max: 60, mode: "box", unit_of_measurement: "px" } },
            },
          ),
        ]
      : []),
    ...(takes.includes("variant") && visualThing
      ? [
          variants(
            "visual_variant",
            visualThing === "cover" ? "cover" : kind.name,
            visualVariant(visualThing, kind),
          ),
        ]
      : []),
  ];
  const look: HaFormSchema[] = [
    pick("icon_thing", iconThings),
    ...iconOptions,
    pick("visual_thing", visualThings),
    ...visualOptions,
  ];

  // ----- inputs: the entities the kind reads besides the card's own, its other keys -----
  // a weather entity is its own direction and gusts
  const ownInputs = domain === "weather" ? [] : (kind.inputs ?? []);
  const inputs: HaFormSchema[] = [
    ...ownInputs.map((def) => ({
      name: `input_${def.key}`,
      // what the kind takes there: any of these filters
      selector: {
        entity: {
          filter: (def.accepts ?? (def.find ? [def.find] : [{ domains: ["sensor"] }])).map((a) => ({
            domain: [...a.domains],
            ...(a.deviceClasses ? { device_class: [...a.deviceClasses] } : {}),
          })),
        },
      },
    })),
    ...(kind.keys.includes("running_above")
      ? [
          {
            name: "running_above",
            selector: { number: { min: 0, mode: "box", unit_of_measurement: "W" } },
          },
        ]
      : []),
    ...(kind.keys.includes("series")
      ? [
          {
            name: "series",
            selector: {
              object: {
                multiple: true,
                label_field: "entity",
                fields: fieldsOf(hass, SERIES_KEYS, "series"),
              },
            },
          },
        ]
      : []),
  ];

  // ----- controls: the kind's, none, the domain's, or one named, then its options -----
  const { own, auto, domainControls, type, drawn } = controlsOf(x, data);
  const names = (ks: readonly string[]) => ks.map((k) => tr(`control.${k}`)).join(" + ");
  const controlTypes = [
    opt(DEFAULT, own.length ? names(own.map((c) => c.kind)) : tr("none")),
    ...(own.length ? [opt("none", tr("none"))] : []),
    ...(auto.length ? [opt("auto", tr("control_auto", { controls: names(auto) }))] : []),
    ...[...new Set([...domainControls, "buttons" as const])]
      .filter((c) => !sameAsOwn(c, kind, thing))
      .map((c) => opt(c, tr(`control.${c}`))),
  ];

  // where they sit: unless told, first; the other place after it
  const byPlace = defaultPosition(type, entity, kind, thing);
  const controlOptions: HaFormSchema[] = drawn.length
    ? [
        pick("control_position", [
          opt(DEFAULT, tr(`position.${byPlace}_${thing}`)),
          ...(["end", "block"] as const)
            .filter((p) => p !== byPlace)
            .map((p) => opt(p, tr(`position.${p}_${thing}`))),
        ]),
        ...(drawn.some((c) => c === "slider" || c === "stepper")
          ? [{ name: "control_step", selector: { number: { min: 0, step: 0.1, mode: "box" } } }]
          : []),
        ...(domain && ATTRIBUTES[domain] && drawn.some((c) => c === "segments" || c === "select")
          ? [
              pick("control_attribute", [
                opt(DEFAULT, tr(`attribute.${DEFAULT_ATTRIBUTE[domain]}`)),
                ...ATTRIBUTES[domain]
                  .filter((a) => a !== DEFAULT_ATTRIBUTE[domain])
                  .map((a) => opt(a, tr(`attribute.${a}`))),
              ]),
            ]
          : []),
        ...(!drawn.includes("buttons") && drawn.some((c) => c === "segments" || c === "select")
          ? [
              {
                name: "control_options",
                selector: {
                  object: {
                    multiple: true,
                    label_field: "value",
                    fields: fieldsOf(hass, OPTION_KEYS, "option"),
                  },
                },
              },
            ]
          : []),
        ...(drawn.includes("buttons")
          ? [
              {
                name: "control_buttons",
                selector: {
                  object: {
                    multiple: true,
                    label_field: "label",
                    description_field: "entity",
                    fields: fieldsOf(hass, BUTTON_KEYS, "button"),
                  },
                },
              },
            ]
          : []),
        ...(drawn.some((c) => c === "toggle" || c === "button" || c === "buttons")
          ? [{ name: "control_confirm", selector: { boolean: {} } }]
          : []),
      ]
    : [];
  const hasControls = own.length > 0 || domainControls.length > 0 || type !== DEFAULT;

  // ----- the status and the badges -----
  const badges: HaFormSchema[] = [
    grid(...(data.hide_status === true ? [] : [{ name: "status", selector: { text: {} } }]), {
      name: "hide_status",
      selector: { boolean: {} },
    }),
    ...(thing === "tile"
      ? [
          { name: "status_badge", selector: { boolean: {} } },
          pick("icon_badge", [
            opt("auto", tr("icon_badge.auto")),
            opt("none", tr("none")),
            opt("custom", tr("icon_badge.custom")),
          ]),
          ...(data.icon_badge === "custom"
            ? [
                grid(
                  { name: "icon_badge_icon", selector: { icon: {} } },
                  { name: "icon_badge_color", selector: { ui_color: {} } },
                ),
              ]
            : []),
        ]
      : []),
    {
      name: "badges",
      selector: {
        object: {
          multiple: true,
          label_field: "entity",
          description_field: "name",
          fields: fieldsOf(hass, BADGE_KEYS, "badge"),
        },
      },
    },
  ];

  // ----- rules: the kind's (predefined) while the card has none, else its own -----
  // (they read the value the card shows, in its unit; a state is one of the entity's)
  const ruleFields = fieldsOf(hass, RULE_KEYS, "rule", {
    ...(entity ? { state: { state: { entity_id: entity } } } : {}),
    ...Object.fromEntries(
      (["above", "below"] as const).map((k) => [
        k,
        { number: { mode: "box", ...(shown.unit ? { unit_of_measurement: shown.unit } : {}) } },
      ]),
    ),
  });
  const rules: HaFormSchema[] = [
    ...(kind.rules?.length
      ? [
          pick("rules_from", [
            opt(DEFAULT, tr("rules_from.kind", { kind: kindLabel(hass, kind.name) })),
            opt("own", tr("rules_from.own")),
          ]),
        ]
      : []),
    {
      name: "rules",
      selector: {
        object: {
          multiple: true,
          label_field: "status",
          description_field: "color",
          fields: ruleFields,
        },
      },
    },
  ];

  // ----- taps -----
  const action = (name: string, def: string) => ({
    name,
    selector: { ui_action: { default_action: def } },
  });
  // what the card does unless told, and the icon: the kind's own (a lock is held), a tile's
  // toggle, else the card's (an icon without an action of its own passes the gesture on)
  const cardAction = (k: string) => {
    const a = data[k];
    return a && typeof a === "object" && "action" in a
      ? String((a as { action: unknown }).action)
      : entity
        ? "more-info"
        : "none";
  };
  const iconOwn = kind.iconActions?.(x.st) ?? {};
  const iconTap =
    iconOwn.tap?.action ??
    (thing === "tile" && domain && TILE_ICON_TOGGLES.has(domain)
      ? "toggle"
      : cardAction("tap_action"));
  const actions: HaFormSchema[] = [
    action("tap_action", entity ? "more-info" : "none"),
    action("hold_action", entity ? "more-info" : "none"),
    action("double_tap_action", "none"),
    ...(iconThing === "none"
      ? []
      : [
          action("icon_tap_action", iconTap),
          action("icon_hold_action", iconOwn.hold?.action ?? cardAction("hold_action")),
        ]),
    { name: "hover", selector: { boolean: {} } },
  ];

  return [
    ...top,
    section(tr("section.content"), ICONS.content, content),
    section(tr("section.look"), ICONS.look, look),
    ...(inputs.length ? [section(tr("section.inputs"), ICONS.inputs, inputs)] : []),
    ...(hasControls
      ? [
          section(tr("section.controls"), ICONS.controls, [
            pick("control_type", controlTypes),
            ...controlOptions,
          ]),
        ]
      : []),
    section(tr(`section.badges_${thing}`), ICONS.badges, badges),
    section(tr("section.rules"), ICONS.rules, rules),
    section(tr("section.actions"), ICONS.actions, actions),
    ...(thing === "tile"
      ? [
          section(tr("section.layout"), ICONS.layout, [
            { name: "vertical", selector: { boolean: {} } },
          ]),
        ]
      : []),
  ];
};

// the fields of a list's dialog: each key's selector and label; `more` holds the item's other
// keys as YAML
const FIELD_SELECTORS: Record<string, Record<string, unknown>> = {
  entity: { entity: {} },
  name: { text: {} },
  label: { text: {} },
  value: { text: {} },
  icon: { icon: {} },
  color: { ui_color: {} },
  status: { text: {} },
  state: { text: {} },
  above: { number: { mode: "box" } },
  below: { number: { mode: "box" } },
  tint_card: { boolean: {} },
  pulse: { boolean: {} },
  show_name: { boolean: {} },
  action: { ui_action: {} },
};
const BADGE_VISUALS = ["bar", "sparkline", "trend"] as const;
const fieldsOf = (
  hass: HomeAssistant | undefined,
  keys: readonly string[],
  of: "badge" | "rule" | "series" | "option" | "button",
  // selectors of this form's own (a rule's state picker for its entity)
  own: Record<string, unknown> = {},
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    let selector = own[k] ?? FIELD_SELECTORS[k];
    if (k === "style")
      selector = {
        select: {
          mode: "dropdown",
          options: BADGE_STYLES.map((s) => ({ value: s, label: L(hass, `badge_style.${s}`) })),
        },
      };
    if (k === "size")
      selector = {
        select: {
          mode: "dropdown",
          options: BADGE_SIZES.map((s) => ({ value: s, label: L(hass, `badge_size.${s}`) })),
        },
      };
    if (k === "visual")
      selector = {
        select: {
          mode: "dropdown",
          // what a badge draws after its value (none: left empty)
          options: BADGE_VISUALS.map((v) => ({ value: v, label: L(hass, `badge_visual.${v}`) })),
        },
      };
    // a badge's kind: the entity's (detected), none, or one whose colours it takes; its icon
    // place, its ring, its window and its switch
    if (of === "badge" && k === "kind")
      selector = {
        select: {
          mode: "dropdown",
          options: [
            { value: DETECTED, label: L(hass, "badge_kind.detected") },
            { value: "none", label: L(hass, "none") },
            ...BADGE_KINDS.map((n) => ({ value: n, label: kindLabel(hass, n) })),
          ],
        },
      };
    if (of === "badge" && k === "icon_type")
      selector = {
        select: {
          mode: "dropdown",
          options: BADGE_ICONS.map((t) => ({
            value: t,
            label: L(hass, t === "none" ? "none" : `badge_icon.${t}`),
          })),
        },
      };
    if (of === "badge" && (k === "icon_ring" || k === "control")) selector = { boolean: {} };
    if (of === "badge" && k === "hours") selector = { number: { mode: "box", min: 1, step: 1 } };
    out[k] = { selector, label: L(hass, `${of}.${k}`) };
  }
  out.more = { selector: { object: {} }, label: L(hass, "more") };
  return out;
};
