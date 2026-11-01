// Config of the tile card (pure): the raw YAML shape and the normalised one. The card is one
// entity (or none) as a tile, filled the way its poster type (its kind) says
// (src/shared/kinds/config.ts): the icon, the name, one line under it, controls at its end. What
// needs a second row is asked for: a slider below, the type's picture.
import { normalizeHistoryOptions, normalizeValue, type ValueSrc } from "../shared/entity/config.ts";
import { domainOf } from "../shared/color.ts";
import type { HomeAssistant } from "../shared/ha.ts";
import {
  isObj,
  kindConfigOf,
  normalizeKindItem,
  type KindConfig,
  type RawKindCardConfig,
} from "../shared/kinds/config.ts";
import { CARD_TYPE } from "./constants.ts";

export interface RawTileCardConfig extends RawKindCardConfig {
  status?: unknown;
  show_picture?: unknown;
  vertical?: unknown;
}

export interface TileConfig extends KindConfig {
  // the status on the line, as written (null: the kind's, else the matching rule's label); false:
  // none
  statusText: ValueSrc | null;
  showStatus: boolean;
  // the type's picture below the line (a second row)
  showPicture: boolean;
  // `visual: glow`: the tile lit from below in its colour, as strong as its level (a light's)
  glow: boolean;
  // the icon on top, the name and the line centred under it, the controls under them
  vertical: boolean;
}

// the domains whose icon toggles them by default, as on Home Assistant's tile (its DOMAINS_TOGGLE),
// and those it presses (a toggle runs them: actionServiceFor)
const ICON_TOGGLES: ReadonlySet<string> = new Set([
  "fan",
  "input_boolean",
  "light",
  "switch",
  "group",
  "automation",
  "humidifier",
  "valve",
  "button",
  "input_button",
  "scene",
]);

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
  if (
    written.status !== undefined &&
    written.status !== false &&
    typeof written.status !== "string"
  )
    throw new Error(`${CARD_TYPE}: status takes a text, a template or false on the tile card`);
  const k = normalizeKindItem(
    written,
    hass,
    CARD_TYPE,
    "tile card",
    written.visual === "none" || written.visual === "glow" ? { visual: "icon" } : {},
  );
  const main = k.entities[0];
  // the icon toggles what switches and presses what runs, unless the card or the type says else
  if (
    written.icon_tap_action === undefined &&
    !k.iconActions.tap &&
    k.entity &&
    ICON_TOGGLES.has(domainOf(k.entity))
  )
    k.iconActions.tap = { action: "toggle" };
  // a kind's controls below the line need a second row: only those at the end of the line are
  // drawn unless the card names them (`control: slider`)
  if (main.control?.defaults) {
    const end = main.control.defaults.filter((p) => p.position === "end");
    main.control = end.length ? { ...main.control, defaults: end } : null;
  }
  return {
    layout: "tile",
    title: null,
    titleTap: null,
    icon: null,
    ...normalizeHistoryOptions(k.raw),
    columns: 1,
    ...k.ctx,
    type: CARD_TYPE,
    entities: k.entities,
    groups: [
      {
        layout: "tile",
        idxs: [0],
        align: "start",
        columns: 1,
        divider: false,
        visibility: null,
      },
    ],
    headerIdxs: [],
    hasHeader: false,
    ...kindConfigOf(k, main.rules),
    statusText: typeof written.status === "string" ? normalizeValue(written.status) : null,
    showStatus: written.status !== false,
    // a trend is its lines: without them it is a value alone
    showPicture:
      typeof written.show_picture === "boolean" ? written.show_picture : k.kind.name === "trend",
    glow: k.raw.visual === "glow",
    vertical: written.vertical === true,
  };
};
