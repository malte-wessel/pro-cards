// Visual editor of the tile group card: its header and layout (ha-form), its tiles in tabs, each
// in the tile card's own editor (CardsEditorBase): a tile is a tile card's config without its
// type, an entity alone written as its id. "+" adds a tile, not a card of any kind. The header's
// badges are the poster's and tile's badge list (a view per badge, on top of the options).
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
import { ALIGNS } from "../shared/entity/constants.ts";
import { TILE_GROUP_LAYOUTS, TILE_GROUP_OVERFLOWS, TILE_TYPE } from "./config.ts";

export const TILE_GROUP_CONVS: Record<string, Conv> = {
  title: AS_IS,
  icon: AS_IS,
  layout: AS_IS,
  vertical_align: AS_IS,
  overflow: AS_IS,
  align: AS_IS,
  columns: AS_IS,
  padding: AS_IS,
  indent: AS_IS,
  title_tap_action: AS_IS,
};
// what the form shows where the card sets nothing
const DEFAULTS = {
  layout: "list",
  vertical_align: "top",
  overflow: "wrap",
  align: "stretch",
  padding: true,
  indent: false,
};
// the row's own keys, which no other layout takes, and the one a row on one line does not
const ROW_KEYS = ["overflow", "align", "columns"];
const TILE = `custom:${TILE_TYPE}`;

const L = (hass: HomeAssistant | undefined, key: string) => {
  const k = `editor.cards.${key}`;
  return hasString(k) ? t(hass, k) : key;
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

const select = (name: string, options: { value: string; label: string }[]): HaFormSchema => ({
  name,
  selector: { select: { mode: "dropdown", options } },
});
// the header, then the layout: a row's own options (where its tiles go when they do not fit,
// where they sit, the most on a line while they wrap), a list's (what is below a tile's line
// beside the icon), where the tiles sit in a taller card, and the space around them; the badges;
// the title's tap
export const tileGroupSchema = (
  hass: HomeAssistant | undefined,
  data: HaFormData = {},
): HaFormSchema[] => [
  grid({ name: "title", selector: { text: {} } }, { name: "icon", selector: { icon: {} } }),
  section(t(hass, "editor.card.section.layout"), ICONS.layout, [
    select(
      "layout",
      TILE_GROUP_LAYOUTS.map((v) => ({ value: v, label: L(hass, `group_layout.${v}`) })),
    ),
    ...(data.layout === "row"
      ? [
          select(
            "overflow",
            TILE_GROUP_OVERFLOWS.map((v) => ({ value: v, label: L(hass, `overflow.${v}`) })),
          ),
          select(
            "align",
            ALIGNS.map((v) => ({ value: v, label: L(hass, `row_align.${v}`) })),
          ),
          ...(data.overflow === "wrap" || !data.overflow
            ? [{ name: "columns", selector: { number: { mode: "box", min: 1, max: 12, step: 1 } } }]
            : []),
        ]
      : []),
    ...((data.layout ?? "list") === "list" ? [{ name: "indent", selector: { boolean: {} } }] : []),
    // where the tiles sit in a taller card (the layout card's words for its own alignment)
    {
      name: "vertical_align",
      selector: {
        select: {
          mode: "dropdown",
          options: (
            [
              ["top", "start"],
              ["center", "center"],
              ["bottom", "end"],
              ["stretch", "stretch"],
            ] as const
          ).map(([value, word]) => ({ value, label: L(hass, `align.${word}`) })),
        },
      },
    },
    { name: "padding", selector: { boolean: {} } },
  ]),
  section(t(hass, "editor.card.field.badges"), ICONS.badges, [
    { name: "badges", selector: { pro_cards_badges: { entity: "", hide_label: true } } },
  ]),
  section(t(hass, "editor.card.section.actions"), ICONS.actions, [
    { name: "title_tap_action", selector: { ui_action: { default_action: "none" } } },
  ]),
];

// a tile cut to what the layout draws, as the editor switches it: no tile in a group takes
// `vertical`; a table's row draws no icon, secondary or badges, and after its value a badge's
// visual or a control; a tile no badge's trend
const ROW_VISUALS = ["bar", "sparkline", "trend"];
const visualType = (v: unknown) =>
  typeof v === "string"
    ? v
    : v && typeof v === "object"
      ? (v as { type?: unknown }).type
      : undefined;
export const fitLayout = (card: CardConfigBase, layout: string): CardConfigBase => {
  const c = { ...card } as Record<string, unknown>;
  delete c.vertical;
  const v = c.visual;
  if (layout === "table") {
    for (const k of ["icon", "secondary", "badges", "status_badge"]) delete c[k];
    if (v !== undefined && v !== false && !ROW_VISUALS.includes(String(visualType(v))))
      delete c.visual;
    else if (v !== undefined && v !== false) {
      // a badge's visual takes its window alone, and no control beside it
      const hours = v && typeof v === "object" ? (v as { hours?: unknown }).hours : undefined;
      c.visual = hours === undefined ? visualType(v) : { type: visualType(v), hours };
      if (c.control !== false) delete c.control;
    }
  } else if (visualType(v) === "trend") delete c.visual;
  return c as CardConfigBase;
};

// a tile as the group writes it ⇄ as the tile card's editor takes it
export const tileToCard = (tile: unknown): CardConfigBase =>
  typeof tile === "string"
    ? ({ type: TILE, entity: tile } as CardConfigBase)
    : ({ type: TILE, ...(tile && typeof tile === "object" ? tile : {}) } as CardConfigBase);
export const cardToTile = (card: CardConfigBase): unknown => {
  const { type: _type, ...tile } = card as Record<string, unknown>;
  void _type;
  const keys = Object.keys(tile);
  return keys.length === 1 && keys[0] === "entity" && typeof tile.entity === "string"
    ? tile.entity
    : tile;
};

export class TileGroupCardEditor extends CardsEditorBase {
  _listKey = "tiles";
  _toCard(tile: unknown) {
    return tileToCard(tile);
  }
  _fromCard(card: CardConfigBase) {
    return cardToTile(card);
  }
  // "+": a tile, its entity picked in its own editor
  _newCard() {
    return { type: TILE } as CardConfigBase;
  }
  // a tile's tab: its name, else its entity's
  _cardName(card: CardConfigBase) {
    const c = card as { name?: unknown; entity?: unknown };
    if (typeof c.name === "string" && c.name) return c.name;
    const entity = typeof c.entity === "string" ? c.entity : "";
    const name = entity ? this._hass?.states[entity]?.attributes.friendly_name : undefined;
    return typeof name === "string" && name ? name : entity || L(this._hass, "tile");
  }
  // the layout the tiles' editors read (a table's tiles are edited as rows, no tile in a group
  // takes `vertical`): a new one builds the selected tile's editor anew
  get tileGroupLayout(): string {
    const layout = (this._config as { layout?: unknown } | undefined)?.layout;
    return typeof layout === "string" ? layout : "list";
  }
  _childContext() {
    return this.tileGroupLayout;
  }
  _optionsSchema(hass: HomeAssistant | undefined, data: HaFormData) {
    return tileGroupSchema(hass, data);
  }
  // (`columns` is the most tiles on a line here, not the layout card's tracks)
  _helper(s: HaFormSchema): string | undefined {
    return s.name === "columns" ? L(this._hass, "help.row_columns") : super._helper(s);
  }
  _optionsToForm(config: CardConfigBase) {
    return {
      ...optionsToForm(config, TILE_GROUP_CONVS, DEFAULTS),
      badges: badgesToForm(config.badges),
    };
  }
  // another layout: each tile cut to what it draws
  _optionsFromForm(data: HaFormData, prev: CardConfigBase) {
    const next = optionsFromForm(data, prev, TILE_GROUP_CONVS, DEFAULTS);
    // the header's badges: rewritten only when the list changed, a badge left as it was keeps
    // its spelling (outside the convs, which do not see what was written)
    if (JSON.stringify(data.badges ?? []) !== JSON.stringify(badgesToForm(prev.badges))) {
      const badges = badgesFromForm(data.badges, prev.badges);
      if (badges.length) (next as Record<string, unknown>).badges = badges;
      else delete (next as Record<string, unknown>).badges;
    }
    const layout = (c: CardConfigBase) => (c as { layout?: string }).layout ?? "list";
    // a row's own keys go with the row; a row on one line has no most on a line
    const own = next as Record<string, unknown>;
    if (layout(next) !== "row") for (const k of ROW_KEYS) delete own[k];
    else if (own.overflow === "shrink" || own.overflow === "scroll") delete own.columns;
    // and the list's goes with the list
    if (layout(next) !== "list") delete own.indent;
    if (layout(next) === layout(prev) || !Array.isArray(next.cards)) return next;
    return {
      ...next,
      cards: (next.cards as CardConfigBase[]).map((c) => fitLayout(c, layout(next))),
    };
  }
}
