// Visual editor of the pop-up card: its hash, its header (title, subtitle, icon, the badges as the
// poster's and tile's badge list), its width (ha-form), its cards in tabs with their own editors
// (CardsEditorBase).
import { CardsEditorBase } from "../shared/cards/editor.ts";
import {
  AS_IS,
  optionsFromForm,
  optionsToForm,
  type Conv,
} from "../shared/cards/editor-options.ts";
import type { CardConfigBase, HaFormData, HaFormSchema, HomeAssistant } from "../shared/ha.ts";
import { hasString, t } from "../shared/i18n.ts";
import { badgesFromForm, badgesToForm } from "../shared/kinds/editor-form.ts";
import { ICONS } from "../shared/kinds/editor-schema.ts";
import { HEIGHTS, WIDTHS } from "./config.ts";

export const POPUP_CONVS: Record<string, Conv> = {
  hash: AS_IS,
  title: AS_IS,
  subtitle: AS_IS,
  icon: AS_IS,
  width: AS_IS,
  height: AS_IS,
};
// what the form shows where the card sets nothing
const DEFAULTS = { width: "normal", height: "auto" };

const L = (hass: HomeAssistant | undefined, key: string) => {
  const k = `editor.cards.${key}`;
  return hasString(k) ? t(hass, k) : key;
};
const grid = (...schema: HaFormSchema[]): HaFormSchema => ({ name: "", type: "grid", schema });

export const popupSchema = (hass: HomeAssistant | undefined): HaFormSchema[] => [
  { name: "hash", required: true, selector: { text: {} } },
  grid(
    {
      name: "width",
      selector: {
        select: {
          mode: "dropdown",
          options: WIDTHS.map((v) => ({ value: v, label: L(hass, `width.${v}`) })),
        },
      },
    },
    {
      name: "height",
      selector: {
        select: {
          mode: "dropdown",
          options: HEIGHTS.map((v) => ({ value: v, label: L(hass, `popup_height.${v}`) })),
        },
      },
    },
  ),
  grid({ name: "title", selector: { text: {} } }, { name: "subtitle", selector: { text: {} } }),
  { name: "icon", selector: { icon: {} } },
  {
    name: "",
    type: "expandable",
    flatten: true,
    title: t(hass, "editor.card.field.badges"),
    iconPath: ICONS.badges,
    schema: [{ name: "badges", selector: { pro_cards_badges: { entity: "", hide_label: true } } }],
  },
  {
    name: "",
    type: "expandable",
    flatten: true,
    title: L(hass, "section_source"),
    iconPath: ICONS.layout,
    schema: [
      grid(
        { name: "section_dashboard", selector: { text: {} } },
        { name: "section_view", selector: { text: {} } },
      ),
      { name: "section_title", selector: { text: {} } },
    ],
  },
];

type Raw = Record<string, unknown>;
const SECTION_FIELDS = {
  section_dashboard: "dashboard",
  section_view: "view",
  section_title: "title",
};

// `section: { dashboard, view, title }` as the form's three text fields, and back: a section left
// as it was keeps its spelling (its index too, which only YAML writes), a view of digits is its
// number, and no field filled leaves it out
export const sectionToForm = (section: unknown): Record<string, string> => {
  const s = (section && typeof section === "object" ? section : {}) as Raw;
  return Object.fromEntries(
    Object.entries(SECTION_FIELDS).map(([f, k]) => [
      f,
      s[k] === undefined || s[k] === null ? "" : String(s[k]),
    ]),
  );
};
export const sectionFromForm = (data: HaFormData, prev: unknown): unknown => {
  const now = Object.fromEntries(
    Object.keys(SECTION_FIELDS).map((f) => [f, String(data[f] ?? "").trim()]),
  );
  if (JSON.stringify(now) === JSON.stringify(sectionToForm(prev))) return prev;
  const out: Raw = {};
  for (const [f, k] of Object.entries(SECTION_FIELDS)) {
    const v = now[f];
    if (v) out[k] = k === "view" && /^\d+$/.test(v) ? Number(v) : v;
  }
  const was = (prev && typeof prev === "object" ? prev : {}) as Raw;
  if (!out.title && was.index !== undefined) out.index = was.index;
  return Object.keys(out).length ? out : undefined;
};

export class PopupCardEditor extends CardsEditorBase {
  _optionsSchema(hass: HomeAssistant | undefined) {
    return popupSchema(hass);
  }
  _optionsToForm(config: CardConfigBase) {
    return {
      ...optionsToForm(config, POPUP_CONVS, DEFAULTS),
      badges: badgesToForm(config.badges),
      ...sectionToForm(config.section),
    };
  }
  _optionsFromForm(data: HaFormData, prev: CardConfigBase) {
    const next = optionsFromForm(data, prev, POPUP_CONVS, DEFAULTS) as Record<string, unknown>;
    // the badges: rewritten only when the list changed, a badge left as it was keeps its spelling
    if (JSON.stringify(data.badges ?? []) !== JSON.stringify(badgesToForm(prev.badges))) {
      const badges = badgesFromForm(data.badges, prev.badges);
      if (badges.length) next.badges = badges;
      else delete next.badges;
    }
    const section = sectionFromForm(data, prev.section);
    if (section === undefined) delete next.section;
    else next.section = section;
    return next as CardConfigBase;
  }
}
