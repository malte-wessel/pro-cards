/*
 * entity-card-pro – one entity as a tile or a poster.
 *
 *   type: custom:entity-card-pro
 *   entity: sensor.living_room_temperature
 *   layout: tile                           # tile | poster (the icon and pills on top, the big value below)
 *   badges: [...]                          # poster: pills in its corner (header entity keys)
 *   name: Living room                      # default: friendly name; template allowed
 *   secondary: "{{ ... }}"                 # text under the name (default: value · label); template allowed
 *   icon: mdi:thermometer                  # fixed icon (else rule → entity icon)
 *   color: green                           # fixed colour, HA token or hex (else rule → primary)
 *   attribute: humidity                    # show an attribute instead of the state
 *   value: "{{ ... }}"                     # or a template / plain text (entity optional then)
 *   unit: °C / decimals: 1 / prefix: "" / suffix: ""
 *   visual: icon                           # icon | ring | gauge | bar | sparkline | columns | badge | strip
 *   min: 0 / max: 100                      # scale for ring / gauge / bar (else entity min/max, else 0..100)
 *   rules:                                 # first match in this order wins
 *     - { below: 16, color: blue, icon: mdi:snowflake, label: Too cold }
 *     - { above: 28, color: red, icon: mdi:fire, label: Critical, tint_card: true }
 *     - { state: "on", color: amber, label: "On" }
 *   toggle: false                          # switch on the right (homeassistant.toggle)
 *   tap_action / hold_action / double_tap_action   # more-info / more-info / none
 *   hover: false                           # Home Assistant's hover and press layers on the tile, icon and controls
 *   hours_to_show: 24 / bucket_minutes: 60 # history window and bucket size for sparkline / columns / strip
 *   smoothing_minutes: 30                  # sparkline averaging bucket (default: one point per 12 px)
 */
import { registerCard } from "./shared/card.ts";
import type { GridOptions, HomeAssistant } from "./shared/ha.ts";
import { EntityCardBase } from "./shared/entity/base.ts";
import { BLOCK_VISUALS, ITEM_DEFAULTS, POSTER_BADGE } from "./shared/entity/constants.ts";
import { hasTileControl, tileMinColumns } from "./shared/entity/control.ts";
import {
  normalizeActionDefaults,
  normalizeEntity,
  normalizeHeaderEntities,
  normalizeHistoryOptions,
  type EntityCardConfig,
  type RawEntity,
  type RawEntityCardBase,
} from "./shared/entity/config.ts";
import { STYLE_ENTITY_CARD } from "./shared/entity/render/styles.ts";
import { isNum, oneOf } from "./shared/util.ts";

const CARD_TYPE = "entity-card-pro";
const LAYOUTS = ["tile", "poster"] as const;

// the raw config: the card itself is one entity, so it takes every entity key
export interface RawEntityCardConfig extends RawEntityCardBase, RawEntity {
  layout?: unknown;
  badges?: unknown;
}

export const normalizeEntityCardConfig = (input: unknown): EntityCardConfig => {
  if (!input || typeof input !== "object") throw new Error(`${CARD_TYPE}: invalid config`);
  const raw = input as RawEntityCardConfig;
  const ctx = { type: CARD_TYPE, ...normalizeActionDefaults(raw) };
  // a card-level `visibility` is Home Assistant's (it hides the whole card), not the item's
  const item = { ...raw, visibility: undefined };
  const ent = normalizeEntity(item, ctx, "the card", ITEM_DEFAULTS.other, { buttons: true });
  const layout = raw.layout ?? "tile";
  if (!oneOf(LAYOUTS, layout))
    throw new Error(`${CARD_TYPE}: layout must be one of ${LAYOUTS.join(" | ")}`);
  const poster = layout === "poster";
  if (raw.badges !== undefined && !poster)
    console.warn(`${CARD_TYPE}: badges are drawn on a poster only (layout: poster)`);
  const badges = poster
    ? normalizeHeaderEntities(raw.badges, ctx, "badges", POSTER_BADGE, "a poster's corner")
    : [];
  return {
    layout,
    title: null,
    titleTap: null,
    icon: null,
    ...normalizeHistoryOptions(raw),
    columns: 1,
    ...ctx,
    entities: [ent, ...badges],
    groups: [
      {
        layout,
        idxs: [0],
        ...(poster ? { badgeIdxs: badges.map((_, i) => 1 + i) } : {}),
        align: "start",
        columns: 1,
        divider: false,
        visibility: null,
      },
    ],
    headerIdxs: [],
    hasHeader: false,
  };
};

export class EntityCard extends EntityCardBase {
  static cardType = CARD_TYPE;
  static getStubConfig(hass: HomeAssistant | undefined, entities?: string[]) {
    const e =
      (entities || []).find(
        (id) => id.startsWith("sensor.") && hass?.states[id] && isNum(hass.states[id].state),
      ) ||
      (entities || [])[0] ||
      "";
    return { entity: e };
  }
  _normalize(raw: unknown) {
    return normalizeEntityCardConfig(raw);
  }
  _styles() {
    return STYLE_ENTITY_CARD;
  }
  getGridOptions(): GridOptions {
    const cfg = this._config;
    if (!cfg) return { columns: 6, rows: "auto" };
    // every tile sizes to its content, so it stretches with its grid row: a plain tile is exactly
    // one 56 px row; tiles with a block visual or a control are taller (a control wraps under
    // the name when the tile is narrow)
    const ent = cfg.entities[0];
    // a poster has a fixed height, its content anchored to the bottom: three rows, two at least
    if (cfg.layout === "poster")
      return { columns: 6, rows: 3, min_columns: tileMinColumns(ent, "poster"), min_rows: 2 };
    if (!BLOCK_VISUALS.has(ent.visual) && !hasTileControl(ent))
      return { columns: 6, rows: "auto", min_columns: 3, min_rows: 1 };
    // a sparkline or columns plot needs two rows: in one it would have no room at all
    const plot = ent.visual === "sparkline" || ent.visual === "columns";
    return { columns: 6, rows: "auto", min_columns: tileMinColumns(ent), min_rows: plot ? 2 : 1 };
  }
}

registerCard(EntityCard, {
  name: "Entity Card Pro",
  description:
    "One entity as a tile or a poster with icon, ring, gauge, bar, sparkline, columns, badge or status strip",
});
