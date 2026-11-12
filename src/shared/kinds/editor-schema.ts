// The poster's and the tile's editor (pure): the ha-form schema for one card, built from its kind.
// Only what applies shows: the things the kind draws, the options of the thing chosen, the
// kind's inputs, the controls its domain takes. A select's default comes first, named as what it
// is (Glow; the kind as "Wind (detected)"): leaving a field alone is a choice the form shows, and
// writes nothing.
import { TARGETS, attributeChoices, attributeDefault } from "../entity/targets.ts";
import { BUTTONS } from "../entity/control.ts";
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
  BADGE_RULE_KEYS,
  ENTITY_RULE_KEYS,
  BADGE_KINDS,
  DEFAULT,
  DETECTED,
  defaultPosition,
  sameAsOwn,
  visualVariant,
  DOMAIN_CONTROLS,
  DOMAIN_AUTO,
  RULE_KEYS,
  defaultIcon,
  defaultVisual,
  drawnControls,
  ownControls,
  variable,
  withDefaults,
  type CardThing,
  visualOptionsOf,
} from "./editor-form.ts";
import {
  COVER_VARIANTS,
  KIND_THINGS,
  STRIP_VARIANTS,
  type IconThing,
  type VisualThing,
} from "./places.ts";
import { IMAGE_OPACITY } from "./backdrop.ts";
import { canRead, detectKind } from "./detect.ts";
import { KINDS } from "./registry.ts";
import type { InputFilter, Kind } from "./types.ts";
import { SCREENS } from "./item-lists.ts";
import { WEEKDAYS } from "../visibility.ts";

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
  // a tile in a tile group: the group's layout decides its `vertical`
  grouped?: boolean;
}

// the sections' icons (Material Design Icons, as Home Assistant's own editors use)
export const ICONS = {
  value:
    "M4,17V9H2V7H6V17H4M22,15C22,16.11 21.1,17 20,17H16V15H20V13H18V11H20V9H16V7H20A2,2 0 0,1 22,9V10.5A1.5,1.5 0 0,1 20.5,12A1.5,1.5 0 0,1 22,13.5V15M14,15V17H8V13C8,11.89 8.9,11 10,11H12V9H8V7H12A2,2 0 0,1 14,9V11C14,12.11 13.1,13 12,13H10V15H14Z",
  chart:
    "M16,11.78L20.24,4.45L21.97,5.45L16.74,14.5L10.23,10.75L5.46,19H22V21H2V3H4V17.54L9.5,8L16,11.78Z",
  code: "M8,3A2,2 0 0,0 6,5V9A2,2 0 0,1 4,11H3V13H4A2,2 0 0,1 6,15V19A2,2 0 0,0 8,21H10V19H8V14A2,2 0 0,0 6,12A2,2 0 0,0 8,10V5H10V3M16,3A2,2 0 0,1 18,5V9A2,2 0 0,0 20,11H21V13H20A2,2 0 0,0 18,15V19A2,2 0 0,1 16,21H14V19H16V14A2,2 0 0,1 18,12A2,2 0 0,1 16,10V5H14V3H16Z",
  name: "M5,4V7H10.5V19H13.5V7H19V4H5Z",
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
  // the status: a label (mdi:label-outline)
  status:
    "M16,17H5V7H16L19.55,12M17.63,5.84C17.27,5.33 16.67,5 16,5H5A2,2 0 0,0 3,7V17A2,2 0 0,0 5,19H16C16.67,19 17.27,18.66 17.63,18.15L22,12L17.63,5.84Z",
  // (a flow's sources: the lightning bolt)
  source: "M11,15H6L13,1V9H18L11,23V15Z",
  visibility:
    "M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z",
};

// a flow's and a cover's drawings, by kind
const VARIANTS: Partial<Record<string, readonly string[]>> = {
  wind: FLOW_STYLES,
  rain: RAIN_STYLES,
  cover: COVER_VARIANTS,
  strip: STRIP_VARIANTS,
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

const NUMBERS = new Set(["sensor", "number", "input_number"]);
// the entity picker for a kind: the entities that fit it (fitsKind), the one written always (none:
// every entity)
export const entitiesFor = (
  hass: HomeAssistant | undefined,
  kind: string,
  written: string,
): Record<string, unknown> => {
  if (!KINDS[kind] || !hass || kind === "none") return {};
  const fit = Object.keys(hass.states).filter((id) => fitsKind(hass, kind, id));
  if (written && !fit.includes(written)) fit.push(written);
  // (none that fits: none offered, not every entity)
  return { include_entities: fit };
};
// every entity's detected kind, found once per set of states (Home Assistant hands a new object
// for every change, so a form drawn again for the same states looks nothing up)
const detectedOf = new WeakMap<object, Map<string, string>>();
const detectedAs = (hass: HomeAssistant, id: string): string => {
  let d = detectedOf.get(hass.states);
  if (!d) {
    d = new Map();
    for (const [e, st] of Object.entries(hass.states)) d.set(e, detectKind(e, st).name);
    detectedOf.set(hass.states, d);
  }
  return d.get(id) ?? detectKind(id, hass.states[id]).name;
};
// whether an entity fits a kind: any entity fits none (the entity as it is); else one detected as
// it, or one it reads that measures what it does: of another domain the kind names (a weather
// entity's wind, a device tracker's person, a counter's trend); a number of a device class it
// offers (a car its battery, solar, the grid and the appliances a power sensor), or a sensor that
// names no class in a unit it offers (a template's battery in %); for a kind that offers none (a
// trend), a number; a binary sensor of a class it offers, a switch of one or of none (a plug)
export const fitsKind = (hass: HomeAssistant | undefined, kind: string, id: string): boolean => {
  const k = KINDS[kind];
  if (!k || !hass) return false;
  if (kind === "none") return true;
  if (detectedAs(hass, id) === kind) return true;
  if (!canRead(k, id)) return false;
  const domain = domainOf(id);
  const st = hass.states[id];
  const dc = typeof st?.attributes.device_class === "string" ? st.attributes.device_class : "";
  if (!NUMBERS.has(domain)) {
    if (!k.offers || (domain !== "binary_sensor" && domain !== "switch")) return true;
    return dc ? k.offers.deviceClasses.includes(dc) : domain === "switch";
  }
  const unit =
    typeof st?.attributes.unit_of_measurement === "string" ? st.attributes.unit_of_measurement : "";
  if (!k.offers) return isNum(st?.state) || !!unit;
  if (dc) return k.offers.deviceClasses.includes(dc);
  return domain === "sensor" && k.offers.units.includes(unit);
};
// whether an entity is one an input takes: of a filter's domains, and its device classes, or where
// it names none, its units
const takesEntity = (
  hass: HomeAssistant | undefined,
  takes: readonly InputFilter[],
  id: string,
): boolean => {
  const a = hass?.states[id]?.attributes;
  const dc = typeof a?.device_class === "string" ? a.device_class : "";
  const unit = typeof a?.unit_of_measurement === "string" ? a.unit_of_measurement : "";
  return takes.some(
    (f) =>
      f.domains.includes(domainOf(id)) &&
      (!f.deviceClasses ||
        f.deviceClasses.includes(dc) ||
        (!dc && !!unit && !!f.units?.includes(unit))),
  );
};
// an entity picker offering what any of these filters takes (a device class, else a unit where an
// entity names none), the one written always (no hass: no filter)
export const pickerOf = (
  hass: HomeAssistant | undefined,
  takes: readonly InputFilter[],
  written = "",
): Record<string, unknown> => {
  if (!hass) return {};
  const fit = Object.keys(hass.states).filter((id) => takesEntity(hass, takes, id));
  if (written && !fit.includes(written)) fit.push(written);
  return { include_entities: fit };
};
// a label of the editor's own words (a key the schema builds from a value)
// vertical_align's values as the layout card's alignment words
const ALIGN_WORD = { top: "start", center: "center", bottom: "end" } as const;
const L = (hass: HomeAssistant | undefined, key: string, vars?: Record<string, string>) =>
  t(hass, `editor.card.${key}` as StringKey, vars);

export const kindLabel = (hass: HomeAssistant | undefined, name: string) => L(hass, `kind.${name}`);

// one badge's form in the editor's sub-view: only what applies to it, by what it reads and shows
// (a field already filled in stays, so it can be cleared):
// - an entity's badge: the entity (empty: the card's, "None") and an attribute of it; or one of
//   your own: a text or a template (the switch at the top)
// - its kind's colours, for an entity's value (not a text of its own)
// - the icon, its picture's source, and a ring only around a number
// - after the value only for a number, its hours only for a sparkline or a trend
// - a switch only for an entity that switches
// (`cardEntity`: what a badge without an entity reads, the card's own)
export const badgeItemSchema = (
  hass: HomeAssistant | undefined,
  item: Record<string, unknown>,
  cardEntity = "",
) => {
  const f = fieldsOf(hass, BADGE_KEYS, "badge") as Record<string, { selector: unknown }>;
  const field = (name: string, extra: Partial<HaFormSchema> = {}): HaFormSchema =>
    ({ name, selector: f[name].selector as never, ...extra }) as HaFormSchema;
  // (a select at its default says nothing: the detected kind, the icon as an icon)
  const filled = (k: string) =>
    item[k] !== undefined &&
    item[k] !== null &&
    item[k] !== "" &&
    item[k] !== false &&
    !(k === "kind" && item[k] === DETECTED) &&
    !(k === "icon_type" && item[k] === "icon");
  const when = (cond: boolean, k: string) => cond || filled(k);
  const type = typeof item.icon_type === "string" ? item.icon_type : "icon";
  // what it shows: the entity as it is, one of your own (a text or a template), or a kind whose
  // colours it takes (the badges' kinds, and the one its entity is detected as)
  const shows = typeof item.shows === "string" ? item.shows : "none";
  const custom = shows === "custom";
  const own = typeof item.entity === "string" && item.entity ? item.entity : "";
  const reads = custom ? "" : own || cardEntity;
  const st = reads ? hass?.states[reads] : undefined;
  const text = filled("value");
  const attr = typeof item.attribute === "string" ? item.attribute : "";
  const shown = attr ? st?.attributes[attr] : st?.state;
  const numeric = !text && isNum(shown);
  const switches = !!reads && TILE_ICON_TOGGLES.has(domainOf(reads)) && !attr && !text;
  // a date (the time from now is written for it)
  const dated = !text && typeof shown === "string" && /^\d{4}-\d{2}-\d{2}/.test(shown);
  const showsValue = item.show_value !== false;
  // the range of a bar or a ring
  const ranged = item.visual === "bar" || item.icon_ring === true;
  const iconed = type === "icon" || type === "image";
  const plot = item.visual === "sparkline" || item.visual === "trend";
  const T = (k: string) => L(hass, k);
  const sub = (title: string, icon: string, expanded: boolean, schema: HaFormSchema[]) =>
    ({ ...section(title, icon, schema), expanded }) as HaFormSchema;
  const kinds = [
    ...new Set<string>([...BADGE_KINDS, ...(shows !== "none" && !custom ? [shows] : [])]),
  ]
    .map((k) => ({ value: k, label: kindLabel(hass, k) }))
    .sort((a, b) => a.label.localeCompare(b.label));
  // (a badge hides its name unless told)
  const named = item.show_name === true || filled("name");
  const out: (HaFormSchema | false)[] = [
    {
      name: "shows",
      required: true,
      selector: {
        select: {
          mode: "dropdown",
          options: [
            { value: "none", label: L(hass, "shows_entity") },
            { value: "custom", label: L(hass, "shows_custom") },
            ...kinds,
          ],
        },
      },
    } as HaFormSchema,
    // the entity it reads (empty: the card's), of those its kind fits
    ...(custom
      ? []
      : [
          {
            name: "entity",
            // (filtered only by a kind chosen for the badge, not one that follows its entity)
            selector: { entity: entitiesFor(hass, item.chosen === true ? shows : "none", own) },
            default: L(hass, "none"),
          } as HaFormSchema,
        ]),
    // its name: whether it shows, then the name
    // (its name where it names none: its entity's)
    sub(T("field.name"), ICONS.name, true, [
      field("show_name"),
      ...(named
        ? [
            field("name", {
              ...(reads && hass?.states[reads]?.attributes.friendly_name
                ? { default: String(hass.states[reads].attributes.friendly_name) }
                : {}),
            } as Partial<HaFormSchema>),
          ]
        : []),
    ]),
    // how its value is written: whether it shows, then (where it does) its format (for a number
    // or a date), its unit and decimals (for a number), a text before and after it
    // (open for one of your own: its text is what it says)
    sub(T("section.badge_value"), ICONS.value, custom, [
      field("show_value"),
      // what it reads: an attribute of its entity; or a text of your own
      ...(reads
        ? [{ name: "attribute", selector: { attribute: { entity_id: reads } } } as HaFormSchema]
        : []),
      ...(custom || filled("value") ? [field("value")] : []),
      ...(showsValue
        ? [
            ...(when(numeric || dated, "format") ? [field("format")] : []),
            ...(when(numeric, "unit") || filled("decimals")
              ? [grid(field("unit"), field("decimals"))]
              : []),
            grid(field("prefix"), field("suffix")),
          ]
        : []),
    ]),
    // its look: the pill, the colour and the kind's, then the icon (an icon's name only for an
    // icon, a picture's source only for a picture)
    sub(T("section.look"), ICONS.look, false, [
      grid(field("style"), field("size")),
      field("color"),
      grid(field("icon_type"), ...(when(type === "icon", "icon") ? [field("icon")] : [])),
      ...(type === "image" ? [field("icon_src")] : []),
    ]),
    // what a number draws: after it a bar, a sparkline or a trend over its hours, a ring around
    // the icon, and the range a bar or a ring fills
    when(numeric, "visual") &&
      sub(T("section.badge_visual"), ICONS.chart, false, [
        grid(field("visual"), ...(plot ? [field("hours")] : [])),
        ...(when(iconed && numeric, "icon_ring") ? [field("icon_ring")] : []),
        ...(ranged || filled("min") || filled("max") ? [grid(field("min"), field("max"))] : []),
      ]),
    // a switch, for an entity that switches
    when(switches, "control") &&
      sub(T("section.controls"), ICONS.controls, false, [field("control")]),
    // its own taps (by default the card's) and its hover effect
    sub(T("section.actions"), ICONS.actions, false, [
      field("tap_action"),
      field("hold_action"),
      field("double_tap_action"),
      field("hover"),
    ]),
    // its rules: a list, each rule in a view on top of the badge's (they read what it reads)
    sub(T("section.rules"), ICONS.rules, false, [
      {
        name: "rules",
        selector: {
          pro_cards_rules: {
            hide_label: true,
            entity: reads,
            unit:
              !attr && typeof st?.attributes.unit_of_measurement === "string"
                ? st.attributes.unit_of_measurement
                : "",
          },
        },
      } as HaFormSchema,
    ]),
    sub(T("section.advanced"), ICONS.code, false, [{ name: "more", selector: { object: {} } }]),
  ];
  return out.filter((x): x is HaFormSchema => !!x);
};
// one rule's form in the editor's sub-view, in sections: when it matches (above and below in the
// value's unit for a number, the entity's states else; a field filled in stays), what it changes
// (its status, colour and icon), the status's look (its style, the card's tint, a pulse), and what
// else it says as YAML
// (`badge`: a badge's rule, which writes a text in place of the badge's value and sets its pill,
// where a card's sets the status and may tint the card)
export const ruleItemSchema = (
  hass: HomeAssistant | undefined,
  item: Record<string, unknown>,
  ctx: {
    entity: string;
    unit: string;
    numeric: boolean;
    badge?: boolean;
    line?: boolean;
    // an entity layer's rule (the flows'): its status is its `label`
    entityRule?: boolean;
  },
): HaFormSchema[] => {
  const keys = ctx.badge ? BADGE_RULE_KEYS : ctx.entityRule ? ENTITY_RULE_KEYS : RULE_KEYS;
  const f = fieldsOf(hass, keys, "rule", {
    ...(ctx.entity ? { state: { state: { entity_id: ctx.entity } } } : {}),
    ...Object.fromEntries(
      (["above", "below"] as const).map((k) => [
        k,
        { number: { mode: "box", ...(ctx.unit ? { unit_of_measurement: ctx.unit } : {}) } },
      ]),
    ),
  }) as Record<string, { selector: unknown }>;
  const field = (name: string): HaFormSchema => ({ name, selector: f[name].selector as never });
  const has = (k: string) => item[k] !== undefined && item[k] !== null && item[k] !== "";
  const sub = (title: string, icon: string, expanded: boolean, schema: HaFormSchema[]) =>
    ({ ...section(title, icon, schema), expanded }) as HaFormSchema;
  const when = sub(L(hass, "section.rule_when"), ICONS.rules, true, [
    ...(ctx.numeric || has("above") || has("below") ? [grid(field("above"), field("below"))] : []),
    ...(!ctx.numeric || has("state") ? [field("state")] : []),
  ]);
  const advanced = sub(L(hass, "section.advanced"), ICONS.code, false, [
    { name: "more", selector: { object: {} } },
  ]);
  // a trend line's: its colour while it matches
  if (ctx.line)
    return [
      when,
      sub(L(hass, "section.rule_then"), ICONS.content, true, [field("color")]),
      advanced,
    ];
  return [
    when,
    sub(L(hass, "section.rule_then"), ICONS.content, true, [
      field(ctx.badge ? "value" : ctx.entityRule ? "label" : "status"),
      grid(field("color"), field("icon")),
    ]),
    sub(
      L(hass, "section.badge_look"),
      ICONS.look,
      false,
      ctx.badge
        ? [field("style"), field("pulse")]
        : [field("style"), field("tint_card"), field("pulse")],
    ),
    advanced,
  ];
};

// ----- the other lists' items, each in a view of its own -----
const advancedOf = (hass: HomeAssistant | undefined) =>
  ({
    ...section(L(hass, "section.advanced"), ICONS.code, [
      { name: "more", selector: { object: {} } },
    ]),
    expanded: false,
  }) as HaFormSchema;
const field = (name: string, selector: Record<string, unknown>): HaFormSchema => ({
  name,
  selector,
});
// a trend's line: its entity (a number), name and colour; its rules (its colour by its value) and
// when it shows, lists of their own
export const seriesItemSchema = (
  hass: HomeAssistant | undefined,
  item: Record<string, unknown>,
): HaFormSchema[] => {
  const entity = typeof item.entity === "string" ? item.entity : "";
  const unit = entity ? hass?.states[entity]?.attributes.unit_of_measurement : undefined;
  return [
    field("entity", { entity: entitiesFor(hass, "trend", entity) }),
    grid(field("name", { text: {} }), field("color", { ui_color: {} })),
    {
      ...section(L(hass, "section.rules"), ICONS.rules, [
        field("rules", {
          pro_cards_rules: {
            entity,
            unit: typeof unit === "string" ? unit : "",
            hide_label: true,
          },
        }),
      ]),
      expanded: false,
    } as HaFormSchema,
    {
      ...section(L(hass, "section.visibility"), ICONS.visibility, [
        field("visibility", {
          pro_cards_list: { key: "visibility", of: "condition", entity, hide_label: true },
        }),
      ]),
      expanded: false,
    } as HaFormSchema,
    advancedOf(hass),
  ];
};
// a segments' or a select's option: its value, its label and icon
export const optionItemSchema = (hass: HomeAssistant | undefined): HaFormSchema[] => [
  grid(field("value", { text: {} }), field("label", { text: {} })),
  field("icon", { icon: {} }),
  advancedOf(hass),
];
// one of your own buttons: what it shows (an entity, a label, an icon, a colour) and what it does
export const buttonItemSchema = (hass: HomeAssistant | undefined): HaFormSchema[] => [
  field("entity", { entity: {} }),
  grid(field("label", { text: {} }), field("icon", { icon: {} })),
  field("color", { ui_color: {} }),
  field("action", { ui_action: {} }),
  advancedOf(hass),
];
// a visibility condition: its type, then its fields (whose entity, empty: the item's own `host`);
// another type's (user, location, and / or / not) in its YAML
const CONDITIONS = [
  "state",
  "numeric_state",
  "screen",
  "time",
  "template",
  "user",
  "location",
  "and",
  "or",
  "not",
] as const;
export const conditionItemSchema = (
  hass: HomeAssistant | undefined,
  item: Record<string, unknown>,
  host: string,
): HaFormSchema[] => {
  const type = typeof item.condition === "string" ? item.condition : "state";
  const own = typeof item.entity === "string" ? item.entity : "";
  const reads = own || host;
  const entity = (): HaFormSchema[] => [
    { name: "entity", selector: { entity: {} }, ...(host ? { default: host } : {}) },
    ...(reads ? [field("attribute", { attribute: { entity_id: reads } })] : []),
  ];
  const lang = hass?.locale?.language ?? "en";
  const day = new Intl.DateTimeFormat(lang, { weekday: "short" });
  const fields: HaFormSchema[] =
    type === "state"
      ? [
          ...entity(),
          grid(
            field("state", { state: { entity_id: reads } }),
            field("state_not", { state: { entity_id: reads } }),
          ),
        ]
      : type === "numeric_state"
        ? [
            ...entity(),
            grid(
              field("above", { number: { mode: "box" } }),
              field("below", { number: { mode: "box" } }),
            ),
          ]
        : type === "screen"
          ? [
              field("media_query", {
                select: {
                  mode: "dropdown",
                  custom_value: true,
                  options: Object.entries(SCREENS).map(([q, n]) => ({
                    value: q,
                    label: L(hass, `screen.${n}`),
                  })),
                },
              }),
            ]
          : type === "time"
            ? [
                grid(field("after", { time: {} }), field("before", { time: {} })),
                field("weekdays", {
                  select: {
                    multiple: true,
                    // (Sunday the 4th of January 1970: the days in the viewer's language)
                    options: WEEKDAYS.map((d, i) => ({
                      value: d,
                      label: day.format(new Date(Date.UTC(1970, 0, 4 + i, 12))),
                    })),
                  },
                }),
              ]
            : type === "template"
              ? [field("value_template", { template: {} })]
              : [];
  return [
    {
      name: "condition",
      required: true,
      selector: {
        select: {
          mode: "dropdown",
          options: CONDITIONS.map((c) => ({ value: c, label: L(hass, `condition.${c}`) })),
        },
      },
    } as HaFormSchema,
    ...fields,
    advancedOf(hass),
  ];
};
// a rule field's label, as fieldsOf names it
// (an entity layer's `label` is the status the poster's rule writes)
export const ruleFieldLabel = (hass: HomeAssistant | undefined, name: string) =>
  name === "more" ? L(hass, "more") : L(hass, `rule.${name === "label" ? "status" : name}`);

// a badge field's label, as fieldsOf names it
// (what a badge says as the card says it is labelled as the card's field is)
const CARD_WORDS = new Set([
  "shows",
  "show_value",
  "unit",
  "decimals",
  "prefix",
  "suffix",
  "min",
  "max",
  "tap_action",
  "hold_action",
  "double_tap_action",
  "hover",
  "icon_src",
]);
export const badgeFieldLabel = (hass: HomeAssistant | undefined, name: string) =>
  name === "more"
    ? L(hass, "more")
    : CARD_WORDS.has(name)
      ? L(hass, `field.${name}`)
      : L(hass, `badge.${name}`);

// the badges as a list, a view per badge (the heading, the tile group's header, the weather and the
// flow cards; `entity`: what a badge without one reads): its items are badgesToForm's
// (editor-form.ts)
export const badgesField = (entity = ""): HaFormSchema => ({
  name: "badges",
  selector: { pro_cards_badges: { entity } },
});

// the controls the card draws now: the kind's own (a tile's at the line's end), the domain's
// (auto), or the one the form names
const controlsOf = (x: SchemaCtx, data: HaFormData) => {
  const entity = typeof data.entity === "string" && data.entity ? data.entity : null;
  const domain = entity ? domainOf(entity) : null;
  const own = ownControls(x.kind, x.thing, entity);
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
  // what the kind draws in their place: its own (the sun's next event, a washer's time)
  for (const f of kind.fills ?? [])
    out[f] = L(hass, "placeholder.kind", { kind: kindLabel(hass, kind.name) });
  return out;
};

export const editorSchema = (x: SchemaCtx): HaFormSchema[] => {
  const { hass, thing, kind } = x;
  const data = withDefaults(x.data);
  const tr = (key: string, vars?: Record<string, string>) => L(hass, key, vars);
  // a heading between groups of a section's fields (editor-heading.ts), its text its field's label
  const heading = (name: string): HaFormSchema => ({
    name,
    selector: { pro_cards_heading: { text: tr(`field.${name}`) } },
  });
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

  // ----- the top: what it shows, the entity that reads, its name and icon, the colour -----
  // first the two plain ones: an entity as it is (the kind `none`, what a plain sensor is) and
  // Custom (no entity: texts and templates of your own); then every kind by its name (a select
  // field has no group headings); then the entity, of those the kind fits (none for a kind that
  // reads no entity, nor for Custom)
  const shows = typeof data.shows === "string" ? data.shows : "custom";
  const kinds = Object.keys(KINDS)
    .filter((k) => k !== "none")
    .map((k) => opt(k, kindLabel(hass, k)))
    .sort((a, b) => a.label.localeCompare(b.label));
  const reads = shows !== "custom";
  const top: HaFormSchema[] = [
    {
      ...pick("shows", [
        opt("none", tr("shows_entity")),
        opt("custom", tr("shows_custom")),
        ...kinds,
      ]),
      required: true,
    },
    ...(reads
      ? [
          {
            name: "entity",
            selector: { entity: entitiesFor(hass, shows, entity ?? "") },
          } as HaFormSchema,
        ]
      : []),
  ];

  // ----- content: the texts, the value's range -----
  const range = rangeInfo(x);
  // the name: whether it shows, then the name (a name written stays, so it can be cleared)
  const filledIn = (k: string) => data[k] !== undefined && data[k] !== null && data[k] !== "";
  const nameFields: HaFormSchema[] = [
    { name: "show_name", selector: { boolean: {} } },
    ...(data.show_name !== false || filledIn("name") ? [text("name")] : []),
  ];
  // the value: whether it shows; what it reads (the attribute, also what the visual reads); how it
  // is written, only while it shows (a field filled in stays); its range; the line under it
  const valueShown = data.show_value !== false;
  const writes = (k: string) => valueShown || filledIn(k);
  const format: HaFormSchema[] = [
    ...(x.numeric && (writes("unit") || writes("decimals"))
      ? [
          grid(text("unit"), {
            name: "decimals",
            selector: { number: { min: 0, max: 3, step: 1, mode: "box" } },
            ...(shown.decimals !== undefined ? { default: shown.decimals } : {}),
          }),
        ]
      : []),
    // around a value the card shows: an entity's, or one written
    ...((entity || data.value) && (writes("prefix") || writes("suffix"))
      ? [
          grid(
            { name: "prefix", selector: { text: {} } },
            { name: "suffix", selector: { text: {} } },
          ),
        ]
      : []),
  ];
  // what it shows (its attribute, a text of its own, the line under it), then how it is written,
  // then its range where something reads it (what it does on this card, then the pair)
  const valueFields: HaFormSchema[] = [
    { name: "show_value", selector: { boolean: {} } },
    ...(entity
      ? [
          {
            name: "attribute",
            selector: { attribute: { entity_id: entity } },
            ...(shown.attribute !== undefined ? { default: shown.attribute } : {}),
          },
        ]
      : []),
    ...(writes("value") ? [text("value")] : []),
    // (a row has no secondary)
    ...(thing === "row"
      ? []
      : [
          {
            name: "secondary",
            selector: { text: {} },
            ...(shown.secondary !== undefined ? { default: shown.secondary } : {}),
          },
        ]),
    ...(format.length ? [heading("format_heading"), ...format] : []),
    ...(range.shown
      ? [
          heading("range_heading"),
          { name: "range", type: "constant", value: range.uses },
          grid(
            { name: "min", selector: { number: { mode: "box", step: "any" } } },
            { name: "max", selector: { number: { mode: "box", step: "any" } } },
          ),
        ]
      : []),
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
  // (a row draws a badge's: after its value)
  const visualThings = [
    opt(DEFAULT, byDefault ? tr(`visual_thing.${byDefault}`) : tr("none")),
    ...(thing === "row"
      ? BADGE_VISUALS.map((th) => opt(th, L(hass, `badge_visual.${th}`)))
      : VISUAL_ORDER.filter((th) => th !== byDefault && fits(th)).map((th) =>
          opt(th, tr(`visual_thing.${th}`)),
        )),
    ...(byDefault ? [opt("none", tr("none"))] : []),
  ];
  const takes =
    visualThing && visualThing !== "none" ? (visualOptionsOf(thing)[visualThing] ?? []) : [];
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
            { name: "visual_today", selector: { boolean: {} } },
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
            visualThing === "cover" || visualThing === "strip" ? visualThing : kind.name,
            visualVariant(visualThing, kind, thing),
          ),
        ]
      : []),
  ];
  // (a row has no icon)
  // the card's colour first, then the icon's thing, the icon (the entity's own in its place while
  // none is written) and that thing's options, then the visual
  // a tile's badge on its icon, with the icon
  const iconBadge: HaFormSchema[] =
    thing === "tile" && iconThing !== "none"
      ? [
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
      : [];
  const look: HaFormSchema[] = [
    { name: "color", selector: { ui_color: { default_color: "state", include_state: true } } },
    ...(thing === "row"
      ? []
      : [
          heading("icon_heading"),
          pick("icon_thing", iconThings),
          ...(iconThing === "icon" || iconThing === "image"
            ? [
                kind.iconName
                  ? // (the kind's own icon in its place, a washer's)
                    { name: "icon", selector: { icon: { placeholder: kind.iconName } } }
                  : { name: "icon", selector: { icon: {} }, context: { icon_entity: "entity" } },
              ]
            : []),
          ...iconOptions,
          ...iconBadge,
        ]),
    heading("visual_heading"),
    pick("visual_thing", visualThings),
    ...visualOptions,
  ];

  // ----- inputs: the entities the kind reads besides the card's own, its other keys -----
  // a weather entity is its own direction and gusts
  const ownInputs = domain === "weather" ? [] : (kind.inputs ?? []);
  const inputs: HaFormSchema[] = [
    ...ownInputs.map((def) => {
      // what the kind takes there: any of these filters; one by unit (which Home Assistant's
      // filter has not) as the list of those entities, the one written with them
      const takes = def.accepts ?? (def.find ? [def.find] : [{ domains: ["sensor"] }]);
      const written = data[`input_${def.key}`];
      const entity = takes.some((a) => "units" in a && a.units)
        ? {
            include_entities: [
              ...Object.keys(hass?.states ?? {}).filter((id) => takesEntity(hass, takes, id)),
              ...(typeof written === "string" && written ? [written] : []),
            ],
          }
        : {
            filter: takes.map((a) => ({
              domain: [...a.domains],
              ...(a.deviceClasses ? { device_class: [...a.deviceClasses] } : {}),
            })),
          };
      return { name: `input_${def.key}`, selector: { entity } };
    }),
    ...(kind.keys.includes("running_above")
      ? [
          {
            name: "running_above",
            selector: { number: { min: 0, mode: "box", unit_of_measurement: "W" } },
          },
        ]
      : []),
    ...(kind.keys.includes("series")
      ? [{ name: "series", selector: { pro_cards_list: { key: "series", of: "series" } } }]
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

  // what it sets, and the domain's own buttons
  const attrs =
    domain && entity
      ? attributeChoices(domain, drawn, x.hass?.states?.[entity], !!BUTTONS[domain])
      : [];
  // what it sets unless the form names another: the shown mode, else the first (as the card does)
  const byDefaultSets = domain
    ? attributeDefault(domain, drawn, data.attribute, !!BUTTONS[domain])
    : undefined;
  // (buttons that set what it names, a timer's presets, are no buttons of the domain's)
  const setsOptions = !!TARGETS[domain ?? ""]?.find((t) => t.key === data.control_attribute)
    ?.optionButtons;
  const domainButtons = domain ? (BUTTONS[domain] ?? []) : [];
  const ownButtons = Array.isArray(data.control_buttons) && data.control_buttons.length > 0;

  // where they sit: unless told, first; the other place after it
  const byPlace = defaultPosition(type, entity, kind, thing);
  const controlOptions: HaFormSchema[] = drawn.length
    ? [
        // (a row draws them all at its end)
        ...(thing === "row"
          ? []
          : [
              pick("control_position", [
                opt(DEFAULT, tr(`position.${byPlace}_${thing}`)),
                ...(["end", "block"] as const)
                  .filter((p) => p !== byPlace)
                  .map((p) => opt(p, tr(`position.${p}_${thing}`))),
              ]),
            ]),
        ...(drawn.some((c) => c === "slider" || c === "stepper")
          ? [{ name: "control_step", selector: { number: { min: 0, step: 0.1, mode: "box" } } }]
          : []),
        // what it sets, where the domain has more than one thing for it (a light's slider: its
        // brightness, colour temperature, hue or saturation)
        ...(attrs.length > 1 && byDefaultSets
          ? [
              pick("control_attribute", [
                opt(DEFAULT, tr(`attribute.${byDefaultSets}`)),
                ...attrs
                  .filter((a) => a !== byDefaultSets)
                  .map((a) => opt(a, tr(`attribute.${a}`))),
              ]),
            ]
          : []),
        ...(!drawn.includes("buttons") && drawn.some((c) => c === "segments" || c === "select")
          ? [
              {
                name: "control_options",
                selector: { pro_cards_list: { key: "control_options", of: "option" } },
              },
            ]
          : []),
        // the domain's own buttons it shows (a robot's stop and locate), else your own
        ...(drawn.includes("buttons") && domainButtons.length && !ownButtons && !setsOptions
          ? [
              {
                name: "control_button_ids",
                selector: {
                  select: {
                    multiple: true,
                    mode: "list",
                    options: domainButtons.map((b) => ({
                      value: b.id,
                      label: t(x.hass, b.labelKey),
                    })),
                  },
                },
              },
            ]
          : []),
        ...(drawn.includes("buttons") &&
        !(Array.isArray(data.control_button_ids) && data.control_button_ids.length)
          ? [
              {
                name: "control_buttons",
                selector: { pro_cards_list: { key: "control_buttons", of: "button" } },
              },
            ]
          : []),
        ...(variable(drawn, data.control_confirm === true)
          ? [
              pick("control_variant", [
                opt(DEFAULT, tr("look.fill")),
                opt("tinted", tr("look.tinted")),
              ]),
            ]
          : []),
        ...(drawn.some((c) => c === "toggle" || c === "button" || c === "buttons")
          ? [{ name: "control_confirm", selector: { boolean: {} } }]
          : []),
      ]
    : [];
  const hasControls =
    (own.length > 0 || domainControls.length > 0 || type !== DEFAULT) &&
    !(thing === "row" && visualThing && visualThing !== "none");

  // ----- the status and the badges -----
  const status = grid(
    ...(data.hide_status === true ? [] : [{ name: "status", selector: { text: {} } }]),
    { name: "hide_status", selector: { boolean: {} } },
  );
  // the status with the value (a tile can show it as its first badge)
  const statusFields: HaFormSchema[] = [
    status,
    ...(thing === "tile" ? [{ name: "status_badge", selector: { boolean: {} } }] : []),
  ];
  // our own list (badge-list.ts): a row a badge, its form in the editor's sub-view
  const badges: HaFormSchema[] = [
    { name: "badges", selector: { pro_cards_badges: { entity, hide_label: true } } },
  ];

  // ----- rules: the kind's (predefined) while the card has none, else its own -----
  // (they read the value the card shows, in its unit; a state is one of the entity's)
  const rules: HaFormSchema[] = [
    ...(kind.rules?.length
      ? [
          pick("rules_from", [
            opt(DEFAULT, tr("rules_from.kind", { kind: kindLabel(hass, kind.name) })),
            opt("own", tr("rules_from.own")),
          ]),
        ]
      : []),
    // our own list (rule-list.ts): a box a rule, its form in the editor's sub-view
    // (its section's title names it)
    {
      name: "rules",
      selector: { pro_cards_rules: { entity, unit: shown.unit ?? "", hide_label: true } },
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
    { name: "hover", selector: { boolean: {} } },
    ...(iconThing === "none" || thing === "row"
      ? []
      : [
          heading("icon_actions_heading"),
          action("icon_tap_action", iconTap),
          action("icon_hold_action", iconOwn.hold?.action ?? cardAction("hold_action")),
          // (a double tap does nothing unless told: the card's, else none)
          action(
            "icon_double_tap_action",
            data.double_tap_action && typeof data.double_tap_action === "object"
              ? String((data.double_tap_action as { action?: unknown }).action ?? "none")
              : "none",
          ),
        ]),
  ];

  // what the kind reads right under what it shows: its entity, then its other inputs (a wind's
  // direction, a trend's series), before anything that draws them
  return [
    ...top,
    ...inputs,
    // (open: the field changed most)
    { ...section(tr("field.name"), ICONS.name, nameFields), expanded: true } as HaFormSchema,
    section(tr("field.value"), ICONS.value, valueFields),
    // the status: its text (or none), a tile's as its first badge
    section(tr("field.status"), ICONS.status, statusFields),
    section(tr("section.look"), ICONS.look, look),
    // how it sits in its cell (in a tile group its layout decides it; a row has none)
    ...(thing === "poster" || (thing === "tile" && !x.grouped)
      ? [
          section(tr("section.layout"), ICONS.layout, [
            ...(thing === "tile"
              ? [
                  { name: "vertical", selector: { boolean: {} } },
                  // where the content sits in a taller tile (the layout card's words for its own)
                  pick(
                    "vertical_align",
                    (["center", "top", "bottom"] as const).map((v) =>
                      opt(v, t(hass, `editor.cards.align.${ALIGN_WORD[v]}` as StringKey)),
                    ),
                  ),
                ]
              : []),
            { name: "fill_height", selector: { boolean: {} } },
          ]),
        ]
      : []),
    ...(hasControls
      ? [
          section(tr("section.controls"), ICONS.controls, [
            pick("control_type", controlTypes),
            ...controlOptions,
          ]),
        ]
      : []),
    ...(thing === "row" ? [] : [section(tr("field.badges"), ICONS.badges, badges)]),
    section(tr("section.rules"), ICONS.rules, rules),
    section(tr("section.actions"), ICONS.actions, actions),
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
  // a badge's value, range and actions
  show_value: { boolean: {} },
  unit: { text: {} },
  decimals: { number: { mode: "box", min: 0, max: 3, step: 1 } },
  prefix: { text: {} },
  suffix: { text: {} },
  min: { number: { mode: "box" } },
  max: { number: { mode: "box" } },
  tap_action: { ui_action: {} },
  hold_action: { ui_action: {} },
  double_tap_action: { ui_action: {} },
  hover: { boolean: {} },
};
// how a badge's value is written: as the entity formats it, in W / kW / MW, as a duration, or the
// time from now of a date
const BADGE_FORMATS = ["auto", "power", "duration", "relative"] as const;
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
    if (of === "badge" && k === "format")
      selector = {
        select: {
          mode: "dropdown",
          options: BADGE_FORMATS.map((v) => ({ value: v, label: L(hass, `badge_format.${v}`) })),
        },
      };
    // (in a dialog an attribute is typed; the sub-view picks it from the entity's)
    if (of === "badge" && k === "attribute") selector = { text: {} };
    if (of === "badge" && k === "hours")
      selector = { number: { mode: "box", min: 0.5, step: 0.5 } };
    // a picture's source: named as the card's own icon's picture is
    if (of === "badge" && k === "icon_src") {
      out[k] = { selector: { text: {} }, label: L(hass, "field.icon_src") };
      continue;
    }
    out[k] = {
      selector,
      label: of === "badge" ? badgeFieldLabel(hass, k) : L(hass, `${of}.${k}`),
    };
  }
  out.more = { selector: { object: {} }, label: L(hass, "more") };
  return out;
};
