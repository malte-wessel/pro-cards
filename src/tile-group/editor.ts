// Visual editor of the tile group card: its header and layout (ha-form), its tiles in tabs, each
// in the tile card's own editor (CardsEditorBase): a tile is a tile card's config without its
// type, an entity alone written as its id. "+" adds a tile, not a card of any kind. The header's
// badges stay as written (YAML).
import { CardsEditorBase } from "../shared/cards/editor.ts";
import {
  AS_IS,
  optionsFromForm,
  optionsToForm,
  type Conv,
} from "../shared/cards/editor-options.ts";
import type { CardConfigBase, HaFormData, HaFormSchema, HomeAssistant } from "../shared/ha.ts";
import { hasString, t } from "../shared/i18n.ts";
import { TILE_GROUP_LAYOUTS, TILE_TYPE } from "./config.ts";

export const TILE_GROUP_CONVS: Record<string, Conv> = {
  title: AS_IS,
  icon: AS_IS,
  layout: AS_IS,
  title_tap_action: AS_IS,
};
// what the form shows where the card sets nothing
const DEFAULTS = { layout: "list" };
const TILE = `custom:${TILE_TYPE}`;

const L = (hass: HomeAssistant | undefined, key: string) => {
  const k = `editor.cards.${key}`;
  return hasString(k) ? t(hass, k) : key;
};
const grid = (...schema: HaFormSchema[]): HaFormSchema => ({ name: "", type: "grid", schema });

export const tileGroupSchema = (hass: HomeAssistant | undefined): HaFormSchema[] => [
  grid({ name: "title", selector: { text: {} } }, { name: "icon", selector: { icon: {} } }),
  {
    name: "layout",
    selector: {
      select: {
        mode: "dropdown",
        options: TILE_GROUP_LAYOUTS.map((v) => ({ value: v, label: L(hass, `group_layout.${v}`) })),
      },
    },
  },
  { name: "title_tap_action", selector: { ui_action: { default_action: "none" } } },
];

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
  _optionsSchema(hass: HomeAssistant | undefined) {
    return tileGroupSchema(hass);
  }
  _optionsToForm(config: CardConfigBase) {
    return optionsToForm(config, TILE_GROUP_CONVS, DEFAULTS);
  }
  _optionsFromForm(data: HaFormData, prev: CardConfigBase) {
    return optionsFromForm(data, prev, TILE_GROUP_CONVS, DEFAULTS);
  }
}
