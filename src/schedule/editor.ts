// Visual editor of the schedule card (ha-form): the schedule and its header, the block data it
// shows and edits (the first `data` entry as fields; more entries stay as written), editing on or
// off, the minutes blocks snap to and the week's first day. It writes back only what the form
// changed: a field as the config had it keeps its spelling, a select at its default writes nothing.
import { FormEditorBase, setOrDrop } from "../shared/editor.ts";
import type { HaFormData, HaFormSchema, HomeAssistant } from "../shared/ha.ts";
import { t, type StringKey } from "../shared/i18n.ts";
import { ICONS } from "../shared/kinds/editor-schema.ts";
import { DATA_FIELDS, dataFromForm, dataToForm } from "../shared/schedule/data.ts";
import { WEEKDAYS } from "../shared/schedule/model.ts";
import { dayNames } from "../shared/schedule/text.ts";
import { numOrNull } from "../shared/util.ts";
import { SNAPS } from "./config.ts";

type Raw = Record<string, unknown>;

export const SCHEDULE_LABELS: Record<string, StringKey> = {
  entity: "editor.card.field.entity",
  name: "editor.card.field.name",
  icon: "editor.cards.field.icon",
  color: "editor.card.field.color",
  data_key: "editor.schedule.field.data_key",
  data_unit: "editor.schedule.field.data_unit",
  data_step: "editor.schedule.field.data_step",
  data_min: "editor.schedule.field.data_min",
  data_max: "editor.schedule.field.data_max",
  data_default: "editor.schedule.field.data_default",
  edit: "editor.schedule.field.edit",
  snap: "editor.schedule.field.snap",
  first_weekday: "editor.schedule.field.first_weekday",
  title_tap_action: "editor.cards.field.title_tap_action",
};

const TEXTS = ["entity", "name", "icon", "color"] as const;
// the profile's first day: the select's default
const PROFILE = "profile";

export const configToForm = (c: Raw): HaFormData => {
  const d: HaFormData = {};
  for (const k of TEXTS) d[k] = typeof c[k] === "string" ? c[k] : "";
  Object.assign(d, dataToForm(c));
  d.edit = c.edit !== false;
  d.snap = String(numOrNull(c.snap) ?? 15);
  d.first_weekday = typeof c.first_weekday === "string" ? c.first_weekday : PROFILE;
  if (c.title_tap_action !== undefined && c.title_tap_action !== null)
    d.title_tap_action = c.title_tap_action;
  return d;
};

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const empty = (v: unknown) =>
  v === undefined || v === null || v === "" || (typeof v === "object" && !Object.keys(v).length);

export const formToConfig = (data: HaFormData, prev: Raw): Raw => {
  const c: Raw = { ...prev };
  const was = configToForm(prev);
  const changed = (k: string) => !same(data[k], was[k]);
  for (const k of TEXTS) if (changed(k)) setOrDrop(c, k, data[k], empty(data[k]));
  if (changed("edit")) setOrDrop(c, "edit", false, data.edit !== false);
  if (changed("snap")) setOrDrop(c, "snap", Number(data.snap), Number(data.snap) === 15);
  if (changed("first_weekday"))
    setOrDrop(
      c,
      "first_weekday",
      data.first_weekday,
      empty(data.first_weekday) || data.first_weekday === PROFILE,
    );
  if (changed("title_tap_action"))
    setOrDrop(c, "title_tap_action", data.title_tap_action, empty(data.title_tap_action));
  // the first data entry (more stay as written)
  if (DATA_FIELDS.some((k) => changed(`data_${k}`))) {
    const list = dataFromForm(data, prev);
    setOrDrop(c, "data", list, !list);
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
const num = (name: string, step: number | "any" = "any"): HaFormSchema => ({
  name,
  selector: { number: { mode: "box", step } },
});

export const editorSchema = (hass?: HomeAssistant): HaFormSchema[] => {
  const L = (k: string) => t(hass, k as StringKey);
  const days = dayNames(hass, "long");
  return [
    { name: "entity", required: true, selector: { entity: { domain: "schedule" } } },
    section(L("editor.card.section.look"), ICONS.look, [
      grid({ name: "name", selector: { text: {} } }, { name: "icon", selector: { icon: {} } }),
      { name: "color", selector: { ui_color: {} } },
    ]),
    section(L("editor.schedule.section.data"), ICONS.badges, [
      grid(
        { name: "data_key", selector: { text: {} } },
        { name: "data_unit", selector: { text: {} } },
      ),
      grid(num("data_step"), num("data_default")),
      grid(num("data_min"), num("data_max")),
    ]),
    section(L("editor.schedule.section.editing"), ICONS.layout, [
      { name: "edit", selector: { boolean: {} } },
      grid(
        {
          name: "snap",
          required: true,
          selector: {
            select: {
              mode: "dropdown",
              options: SNAPS.map((m) => ({
                value: String(m),
                label: t(hass, "editor.schedule.snap", { n: m }),
              })),
            },
          },
        },
        {
          name: "first_weekday",
          required: true,
          selector: {
            select: {
              mode: "dropdown",
              options: [
                { value: PROFILE, label: L("editor.schedule.first_weekday.profile") },
                ...WEEKDAYS.map((d, i) => ({ value: d, label: days[i] })),
              ],
            },
          },
        },
      ),
    ]),
    section(L("editor.card.section.actions"), ICONS.actions, [
      { name: "title_tap_action", selector: { ui_action: { default_action: "none" } } },
    ]),
  ];
};

export class ScheduleCardEditor extends FormEditorBase {
  static labels = SCHEDULE_LABELS;
  _helper(sch: HaFormSchema) {
    if (sch.name === "data_key") return t(this._hass, "editor.schedule.help.data_key");
    if (sch.name === "edit") return t(this._hass, "editor.schedule.help.edit");
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
