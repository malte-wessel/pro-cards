// Visual editor of the layout card: its options and breakpoints (ha-form), its cards in tabs with
// their own editors (CardsEditorBase), and the selected card's place in the layout (its
// `view_layout`: span, column, order, align). A place that changes by view columns stays YAML.
import { CardsEditorBase, breakpointType } from "../shared/cards/editor.ts";
import {
  AS_IS,
  LENGTHS,
  ROWS,
  TRACKS,
  optionsFromForm,
  optionsToForm,
  type Conv,
} from "../shared/cards/editor-options.ts";
import type { CardConfigBase, HaFormData, HaFormSchema, HomeAssistant } from "../shared/ha.ts";
import { hasString, t } from "../shared/i18n.ts";
import { ICONS } from "../shared/kinds/editor-schema.ts";
import { CARD_STYLES, ITEM_ALIGNS, LAYOUTS } from "./config.ts";

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => !!v && typeof v === "object" && !Array.isArray(v);

export const LAYOUT_CONVS: Record<string, Conv> = {
  layout: AS_IS,
  columns: TRACKS,
  min_column_width: LENGTHS,
  rows: ROWS,
  align_items: AS_IS,
  gap: LENGTHS,
  card_style: AS_IS,
};

// what the form shows where the card sets nothing
const DEFAULTS = { layout: "grid", card_style: "cards", align_items: "stretch" };

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
export const layoutFields = (
  hass: HomeAssistant | undefined,
): Record<string, HaFormSchema["selector"]> => ({
  layout: select(hass, "layout", LAYOUTS),
  columns: { text: {} },
  min_column_width: { text: {} },
  rows: { text: {} },
  align_items: select(hass, "align", ITEM_ALIGNS),
  gap: { text: {} },
  card_style: select(hass, "card_style", CARD_STYLES),
});

export const layoutSchema = (hass: HomeAssistant | undefined, data: HaFormData): HaFormSchema[] => {
  const fields = layoutFields(hass);
  return [
    grid(
      { name: "layout", selector: fields.layout },
      { name: "card_style", selector: fields.card_style },
    ),
    // (the most columns, and the narrowest one: as many as fit)
    grid(
      { name: "columns", selector: fields.columns },
      { name: "min_column_width", selector: fields.min_column_width },
    ),
    // (a masonry has no rows: the gap alone in its row, so the form keeps its shape)
    grid(
      { name: "gap", selector: fields.gap },
      ...(data.layout === "masonry" ? [] : [{ name: "rows", selector: fields.rows }]),
    ),
    grid({ name: "align_items", selector: fields.align_items }),
    // (its own section: a row a breakpoint)
    section(L(hass, "field.breakpoints"), ICONS.layout, [
      {
        name: "breakpoints",
        selector: { pro_cards_list: { key: "breakpoints", of: "breakpoint", hide_label: true } },
      },
    ]),
  ];
};

// ----- a card's place: its view_layout -----

const PLACE = ["span", "column", "order", "align"] as const;
// view_layout as the form's data: a value that changes by view columns (a map) is left out
export const placeToForm = (card: CardConfigBase): HaFormData => {
  const v = isObj(card.view_layout) ? card.view_layout : {};
  const d: HaFormData = {};
  const span = v.span;
  if (!isObj(span)) {
    const [cols, rows] = Array.isArray(span) ? span : [span, undefined];
    d.span_full = cols === "full";
    d.span_cols = typeof cols === "number" ? cols : undefined;
    d.span_rows = typeof rows === "number" ? rows : undefined;
  }
  for (const k of ["column", "order"] as const) if (typeof v[k] === "number") d[k] = v[k];
  if (typeof v.align === "string") d.align = v.align;
  return d;
};
// the keys of view_layout that change by view columns (YAML only)
export const placeByWidth = (card: CardConfigBase): string[] => {
  const v = isObj(card.view_layout) ? card.view_layout : {};
  return PLACE.filter((k) => isObj(v[k]));
};
export const placeFromForm = (data: HaFormData, card: CardConfigBase): CardConfigBase => {
  const v: Raw = isObj(card.view_layout) ? { ...card.view_layout } : {};
  const byWidth = placeByWidth(card);
  const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : undefined);
  if (!byWidth.includes("span")) {
    const cols = data.span_full === true ? "full" : num(data.span_cols);
    const rows = num(data.span_rows);
    v.span = cols === undefined ? (rows ? [1, rows] : undefined) : rows ? [cols, rows] : cols;
  }
  for (const k of ["column", "order"] as const) if (!byWidth.includes(k)) v[k] = num(data[k]);
  if (!byWidth.includes("align")) v.align = data.align || undefined;
  for (const k of Object.keys(v)) if (v[k] === undefined) delete v[k];
  const out: Raw = { ...card };
  if (Object.keys(v).length) out.view_layout = v;
  else delete out.view_layout;
  return out as CardConfigBase;
};
export const placeSchema = (
  hass: HomeAssistant | undefined,
  card: CardConfigBase,
): HaFormSchema[] => {
  const byWidth = placeByWidth(card);
  const data = placeToForm(card);
  const n = (min: number, max?: number) => ({
    number: { min, ...(max ? { max } : {}), step: 1, mode: "box" },
  });
  return [
    ...(byWidth.includes("span")
      ? []
      : [
          grid(...(data.span_full === true ? [] : [{ name: "span_cols", selector: n(1, 24) }]), {
            name: "span_rows",
            selector: n(1, 12),
          }),
          { name: "span_full", selector: { boolean: {} } },
        ]),
    grid(
      ...(byWidth.includes("column") ? [] : [{ name: "column", selector: n(1, 24) }]),
      ...(byWidth.includes("order")
        ? []
        : [{ name: "order", selector: { number: { step: 1, mode: "box" } } }]),
    ),
    ...(byWidth.includes("align")
      ? []
      : [{ name: "align", selector: select(hass, "align", ITEM_ALIGNS) }]),
    ...(byWidth.length ? [{ name: "by_width", type: "constant", value: byWidth.join(", ") }] : []),
  ];
};

export class LayoutCardEditor extends CardsEditorBase {
  // a breakpoint in a view of its own: the card's options at that width
  _itemTypes() {
    return { breakpoints: breakpointType(() => this._hass, layoutFields(this._hass)) };
  }
  _optionsSchema(hass: HomeAssistant | undefined, data: HaFormData) {
    return layoutSchema(hass, data);
  }
  _optionsToForm(config: CardConfigBase) {
    return optionsToForm(config, LAYOUT_CONVS, DEFAULTS);
  }
  _optionsFromForm(data: HaFormData, prev: CardConfigBase) {
    return optionsFromForm(data, prev, LAYOUT_CONVS, DEFAULTS);
  }
  _placeSchema(card: CardConfigBase) {
    return placeSchema(this._hass, card);
  }
  _placeToForm(card: CardConfigBase) {
    return placeToForm(card);
  }
  _placeFromForm(data: HaFormData, card: CardConfigBase) {
    return placeFromForm(data, card);
  }
}
