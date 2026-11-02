// Config of the poster card (pure): the raw YAML shape and the normalised one. The card is one
// entity (or none) drawn the way its kind says (src/shared/kinds/config.ts), its icon and its
// visual as its places say (src/shared/kinds/places.ts); its items are the poster itself, the
// status badge (a badge like the others, drawn as a tag) and the badges in its corner.
import type { ValueSrc } from "../shared/entity/config.ts";
import type { HomeAssistant } from "../shared/ha.ts";
import {
  isObj,
  kindConfigOf,
  normalizeCorner,
  normalizeKindItem,
  type KindConfig,
  type RawKindCardConfig,
} from "../shared/kinds/config.ts";
import { CARD_TYPE } from "./constants.ts";

export interface RawPosterCardConfig extends RawKindCardConfig {
  status?: unknown;
  badges?: unknown;
}

export interface PosterConfig extends KindConfig {
  // the status badge's item (null: `status: false`) and its text as written (null: the kind's,
  // else the matching rule's label)
  statusIdx: number | null;
  statusText: ValueSrc | null;
}

export const normalizePosterConfig = (input: unknown, hass?: HomeAssistant): PosterConfig => {
  if (!isObj(input)) throw new Error(`${CARD_TYPE}: invalid config`);
  if ((input as { status_badge?: unknown }).status_badge !== undefined)
    throw new Error(
      `${CARD_TYPE}: a poster's status is always the badge in its corner: leave out status_badge`,
    );
  const k = normalizeKindItem(input as RawPosterCardConfig, hass, CARD_TYPE, "poster card");
  // a poster's icon has no badge (its corner has the badges): a tile's has
  for (const p of [k.places, ...k.rulePlaces.values()])
    if (p.icon && p.icon.badge !== undefined)
      throw new Error(`${CARD_TYPE}: a poster's icon has no badge (its corner has the badges)`);

  const { ctx, entities } = k;
  const { statusIdx, statusText, corner } = normalizeCorner(k, CARD_TYPE, "a poster's corner");

  return {
    layout: "poster",
    title: null,
    titleTap: null,
    icon: null,
    columns: 1,
    ...ctx,
    type: CARD_TYPE,
    entities,
    groups: [
      {
        layout: "poster",
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
  };
};
