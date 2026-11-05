// Visual editor of the heading card (ha-form): the title with its icon, subtitle, style and
// colour, the badges in the poster's and tile's badge list (a dialog per badge), then where the
// badges sit and how they look, and the actions. It writes back only what the form changed: a
// field as the config had it keeps its spelling, a select at its default writes nothing.
import { FormEditorBase, setOrDrop } from "../shared/editor.ts";
import { BADGE_SIZES, BADGE_STYLES } from "../shared/entity/constants.ts";
import type { HaFormData, HaFormSchema, HomeAssistant } from "../shared/ha.ts";
import { t, type StringKey } from "../shared/i18n.ts";
import { badgesFromForm, badgesToForm } from "../shared/kinds/editor-form.ts";
import { badgesField, ICONS } from "../shared/kinds/editor-schema.ts";
import { BADGE_POSITIONS, HEADING_ALIGNS, HEADING_STYLES, OVERFLOWS } from "./config.ts";

type Raw = Record<string, unknown>;

export const HEADING_LABELS: Record<string, StringKey> = {
  title: "editor.cards.field.title",
  icon: "editor.cards.field.icon",
  subtitle: "editor.heading.field.subtitle",
  style: "editor.heading.field.style",
  color: "editor.card.field.color",
  badges: "editor.card.field.badges",
  align: "editor.heading.field.align",
  badges_position: "editor.heading.field.badges_position",
  overflow: "editor.heading.field.overflow",
  badge_style: "editor.heading.field.badge_style",
  badge_size: "editor.heading.field.badge_size",
  title_tap_action: "editor.cards.field.title_tap_action",
  icon_tap_action: "editor.card.field.icon_tap_action",
  tap_action: "editor.heading.field.tap_action",
  hold_action: "editor.heading.field.hold_action",
  double_tap_action: "editor.heading.field.double_tap_action",
  hover: "editor.heading.field.hover",
};

// the selects' defaults: one left there writes nothing
const DEFAULTS: Raw = {
  style: "title",
  align: "start",
  badges_position: "end",
  overflow: "wrap",
  badge_style: "outline",
  badge_size: "m",
};
const TEXTS = ["title", "icon", "subtitle", "color"] as const;
const ACTIONS = [
  "title_tap_action",
  "icon_tap_action",
  "tap_action",
  "hold_action",
  "double_tap_action",
] as const;

export const configToForm = (c: Raw): HaFormData => {
  const d: HaFormData = {};
  for (const k of TEXTS) d[k] = typeof c[k] === "string" ? c[k] : "";
  for (const [k, v] of Object.entries(DEFAULTS)) d[k] = typeof c[k] === "string" ? c[k] : v;
  for (const k of ACTIONS) if (c[k] !== undefined && c[k] !== null) d[k] = c[k];
  d.hover = c.hover !== false;
  d.badges = badgesToForm(c.badges);
  return d;
};

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const empty = (v: unknown) =>
  v === undefined || v === null || v === "" || (typeof v === "object" && !Object.keys(v).length);

export const formToConfig = (data: HaFormData, prev: Raw): Raw => {
  const c: Raw = { ...prev };
  const was = configToForm(prev);
  // a field as the config had it stays as written
  const changed = (k: string) => !same(data[k], was[k]);
  for (const k of TEXTS) if (changed(k)) setOrDrop(c, k, data[k], empty(data[k]));
  for (const [k, v] of Object.entries(DEFAULTS))
    if (changed(k)) setOrDrop(c, k, data[k], empty(data[k]) || data[k] === v);
  for (const k of ACTIONS) if (changed(k)) setOrDrop(c, k, data[k], empty(data[k]));
  if (changed("hover")) setOrDrop(c, "hover", false, data.hover !== false);
  if (changed("badges")) {
    const badges = badgesFromForm(data.badges, prev.badges);
    setOrDrop(c, "badges", badges, !badges.length);
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
const select = (
  name: string,
  values: readonly string[],
  label: (v: string) => string,
): HaFormSchema => ({
  name,
  selector: {
    select: { mode: "dropdown", options: values.map((v) => ({ value: v, label: label(v) })) },
  },
});
export const editorSchema = (hass?: HomeAssistant): HaFormSchema[] => {
  const L = (k: string) => t(hass, k as StringKey);
  return [
    grid({ name: "title", selector: { text: {} } }, { name: "icon", selector: { icon: {} } }),
    { name: "subtitle", selector: { text: {} } },
    grid(
      select("style", HEADING_STYLES, (v) => L(`editor.heading.style.${v}`)),
      { name: "color", selector: { ui_color: {} } },
    ),
    badgesField(hass),
    section(L("editor.card.section.layout"), ICONS.layout, [
      grid(
        select("align", HEADING_ALIGNS, (v) => L(`editor.heading.align.${v}`)),
        select("badges_position", BADGE_POSITIONS, (v) => L(`editor.heading.badges_position.${v}`)),
      ),
      select("overflow", OVERFLOWS, (v) => L(`editor.heading.overflow.${v}`)),
      grid(
        select("badge_style", BADGE_STYLES, (v) => L(`editor.card.badge_style.${v}`)),
        select("badge_size", BADGE_SIZES, (v) => L(`editor.card.badge_size.${v}`)),
      ),
    ]),
    section(L("editor.card.section.actions"), ICONS.actions, [
      { name: "title_tap_action", selector: { ui_action: { default_action: "none" } } },
      { name: "icon_tap_action", selector: { ui_action: {} } },
      { name: "tap_action", selector: { ui_action: {} } },
      { name: "hold_action", selector: { ui_action: {} } },
      { name: "double_tap_action", selector: { ui_action: {} } },
      { name: "hover", selector: { boolean: {} } },
    ]),
  ];
};

export class HeadingCardEditor extends FormEditorBase {
  static labels = HEADING_LABELS;
  _helper(sch: HaFormSchema) {
    if (sch.name === "icon_tap_action") return t(this._hass, "editor.heading.help.icon_tap_action");
    if (sch.name === "badge_style" || sch.name === "badge_size")
      return t(this._hass, "editor.heading.help.badge_look");
    return undefined;
  }
  _toForm(config: Raw) {
    return configToForm(config);
  }
  _fromForm(data: HaFormData, prev: Raw) {
    return formToConfig(data, prev);
  }
  _schema(hass: HomeAssistant) {
    return editorSchema(hass);
  }
}
