// Visual editor of the swipe card: its options and breakpoints (ha-form), its cards in tabs with
// their own editors (CardsEditorBase).
import { CardsEditorBase, breakpointType } from "../shared/cards/editor.ts";
import {
  AS_IS,
  LENGTHS,
  optionsFromForm,
  optionsToForm,
  type Conv,
} from "../shared/cards/editor-options.ts";
import type { CardConfigBase, HaFormData, HaFormSchema, HomeAssistant } from "../shared/ha.ts";
import { hasString, t } from "../shared/i18n.ts";
import { ICONS } from "../shared/kinds/editor-schema.ts";
import { HEIGHTS, INDICATORS, MAX_PER_PAGE, SNAPS } from "./config.ts";

// unfold: a grid of this many columns; 0 is the strip (false, which a breakpoint needs)
const UNFOLD: Conv = {
  toForm: (v) => (v === false ? 0 : v),
  fromForm: (v) => (v === 0 ? false : v === "" || v === null ? undefined : v),
};
export const SWIPE_CONVS: Record<string, Conv> = {
  per_page: AS_IS,
  gap: LENGTHS,
  snap: AS_IS,
  height: AS_IS,
  indicator: AS_IS,
  unfold: UNFOLD,
};

// what the form shows where the card sets nothing
const DEFAULTS = { snap: "start", height: "equal", indicator: "dots" };

const L = (hass: HomeAssistant | undefined, key: string) => {
  const k = `editor.cards.${key}`;
  return hasString(k) ? t(hass, k) : key;
};
const select = (hass: HomeAssistant | undefined, of: string, values: readonly string[]) => ({
  select: {
    mode: "dropdown",
    options: values.map((v) => ({ value: v, label: L(hass, `${of}.${v}`) })),
  },
});
const grid = (...schema: HaFormSchema[]): HaFormSchema => ({ name: "", type: "grid", schema });
const section = (title: string, icon: string, schema: HaFormSchema[]): HaFormSchema => ({
  name: "",
  type: "expandable",
  flatten: true,
  title,
  iconPath: icon,
  schema,
});

// the options a level takes (the card's, or a breakpoint's)
export const swipeFields = (
  hass: HomeAssistant | undefined,
): Record<string, HaFormSchema["selector"]> => ({
  per_page: { number: { min: 1, max: MAX_PER_PAGE, step: 0.05, mode: "box" } },
  gap: { text: {} },
  snap: select(hass, "snap", SNAPS),
  height: select(hass, "height", HEIGHTS),
  indicator: select(hass, "indicator", INDICATORS),
  unfold: { number: { min: 0, max: 12, mode: "box" } },
});

export const swipeSchema = (hass: HomeAssistant | undefined): HaFormSchema[] => {
  const fields = swipeFields(hass);
  return [
    grid({ name: "per_page", selector: fields.per_page }, { name: "gap", selector: fields.gap }),
    grid({ name: "snap", selector: fields.snap }, { name: "height", selector: fields.height }),
    grid(
      { name: "indicator", selector: fields.indicator },
      { name: "unfold", selector: fields.unfold },
    ),
    // (its own section: a row a breakpoint)
    section(L(hass, "field.breakpoints"), ICONS.layout, [
      {
        name: "breakpoints",
        selector: { pro_cards_list: { key: "breakpoints", of: "breakpoint", hide_label: true } },
      },
    ]),
  ];
};

export class SwipeCardEditor extends CardsEditorBase {
  // a breakpoint in a view of its own: the card's options at that width
  _itemTypes() {
    return { breakpoints: breakpointType(() => this._hass, swipeFields(this._hass)) };
  }
  _optionsSchema(hass: HomeAssistant | undefined) {
    return swipeSchema(hass);
  }
  _optionsToForm(config: CardConfigBase) {
    return optionsToForm(config, SWIPE_CONVS, DEFAULTS);
  }
  _optionsFromForm(data: HaFormData, prev: CardConfigBase) {
    return optionsFromForm(data, prev, SWIPE_CONVS, DEFAULTS);
  }
}
