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
];

export class PopupCardEditor extends CardsEditorBase {
  _optionsSchema(hass: HomeAssistant | undefined) {
    return popupSchema(hass);
  }
  _optionsToForm(config: CardConfigBase) {
    return { ...optionsToForm(config, POPUP_CONVS, DEFAULTS), badges: badgesToForm(config.badges) };
  }
  _optionsFromForm(data: HaFormData, prev: CardConfigBase) {
    const next = optionsFromForm(data, prev, POPUP_CONVS, DEFAULTS) as Record<string, unknown>;
    // the badges: rewritten only when the list changed, a badge left as it was keeps its spelling
    if (JSON.stringify(data.badges ?? []) !== JSON.stringify(badgesToForm(prev.badges))) {
      const badges = badgesFromForm(data.badges, prev.badges);
      if (badges.length) next.badges = badges;
      else delete next.badges;
    }
    return next as CardConfigBase;
  }
}
