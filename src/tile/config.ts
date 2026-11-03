// Config of the tile card (pure): the raw YAML shape and the normalised one. The card is one
// entity (or none) as a tile, filled the way its kind says (src/shared/kinds/config.ts): the icon,
// the name, one line under it, controls at its end; its icon and its visual as its places say
// (src/shared/kinds/places.ts). A visual below the line (a plot, the sun's day) and a slider below
// take a second row.
import { normalizeValue, type ValueSrc } from "../shared/entity/config.ts";
import { domainOf } from "../shared/color.ts";
import type { HomeAssistant } from "../shared/ha.ts";
import {
  isObj,
  kindConfigOf,
  normalizeCorner,
  normalizeKindItem,
  TILE_ICON_TOGGLES,
  type KindConfig,
  type RawKindCardConfig,
} from "../shared/kinds/config.ts";
import { CARD_TYPE } from "./constants.ts";

export interface RawTileCardConfig extends RawKindCardConfig {
  status?: unknown;
  status_badge?: unknown;
  badges?: unknown;
  vertical?: unknown;
}

export interface TileConfig extends KindConfig {
  // the status's item (null: `status: false`) and its text as written (null: the kind's, else the
  // matching rule's status): on the line after the value, or a badge before the badges where the
  // card says so (`status_badge: true`)
  statusIdx: number | null;
  statusText: ValueSrc | null;
  statusBadge: boolean;
  // the icon on top, the name and the line centred under it, the controls under them
  vertical: boolean;
}

// the badge on the icon (`icon: { badge }`, the card's or a rule's): Home Assistant's (auto), none
// (false), or one of the card's own, its icon and colour each text or a template (an empty icon:
// none; no colour: the tile's)
export type IconBadgeConfig = "auto" | false | { icon: ValueSrc | null; color: ValueSrc | null };
export const parseIconBadge = (v: unknown): IconBadgeConfig => {
  if (v === undefined || v === null || v === true || v === "auto") return "auto";
  if (v === false || v === "none") return false;
  if (isObj(v)) return { icon: normalizeValue(v.icon), color: normalizeValue(v.color) };
  throw new Error(`${CARD_TYPE}: icon: { badge } takes auto, false or { icon, color }`);
};

// the entity card's visuals the tile draws no more, and what takes their place
const GONE: Record<string, string> = {
  icon: "visual: icon is the tile's own: leave it out",
  badge: "visual: badge is gone: the status is on the line under the name",
};

export const normalizeTileConfig = (input: unknown, hass?: HomeAssistant): TileConfig => {
  if (!isObj(input)) throw new Error(`${CARD_TYPE}: invalid config`);
  const written = input as RawTileCardConfig;
  if (written.toggle !== undefined)
    throw new Error(`${CARD_TYPE}: toggle is control: toggle on the tile card`);
  if (typeof written.visual === "string" && GONE[written.visual])
    throw new Error(`${CARD_TYPE}: ${GONE[written.visual]}`);
  const k = normalizeKindItem(written, hass, CARD_TYPE, "tile card");
  const main = k.entities[0];
  // the icon toggles what switches and presses what runs, unless the card or the type says else
  const iconTap = k.places.icon ? k.places.icon.tap_action : undefined;
  if (
    iconTap === undefined &&
    !k.iconActions.tap &&
    k.entity &&
    TILE_ICON_TOGGLES.has(domainOf(k.entity))
  )
    k.iconActions.tap = { action: "toggle" };
  // a kind's controls below the line need a second row: only those at the end of the line are
  // drawn unless the card names them (`control: slider`)
  if (main.control?.defaults) {
    const end = main.control.defaults.filter((p) => p.position === "end");
    main.control = end.length ? { ...main.control, defaults: end } : null;
  }
  // the badges at the end of the first row, and the status among them where the card says so
  const { statusIdx, statusText, corner: all } = normalizeCorner(k, CARD_TYPE, "a tile's badges");
  if (written.status_badge !== undefined && typeof written.status_badge !== "boolean")
    throw new Error(`${CARD_TYPE}: status_badge takes true or false`);
  const statusBadge = written.status_badge === true;
  // the icon's badge, the card's and its rules', checked now
  for (const p of [k.places, ...k.rulePlaces.values()]) if (p.icon) parseIconBadge(p.icon.badge);
  const corner = statusBadge ? all : all.filter((i) => i !== statusIdx);
  return {
    layout: "tile",
    title: null,
    titleTap: null,
    icon: null,
    columns: 1,
    ...k.ctx,
    type: CARD_TYPE,
    entities: k.entities,
    groups: [
      {
        layout: "tile",
        idxs: [0],
        badgeIdxs: corner,
        align: "start",
        columns: 1,
        divider: false,
        visibility: null,
      },
    ],
    headerIdxs: [],
    hasHeader: false,
    ...kindConfigOf(k),
    statusIdx,
    statusText,
    statusBadge,
    vertical: written.vertical === true,
  };
};
