/*
 * entity-card – one entity as a tile.
 *
 *   type: custom:entity-card
 *   entity: sensor.living_room_temperature
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
 *   hours_to_show: 24 / bucket_minutes: 60 # history window and bucket size for sparkline / columns / strip
 */
import { registerCard } from "./shared/card.ts";
import type { GridOptions, HomeAssistant } from "./shared/ha.ts";
import { EntityCardBase } from "./shared/entity/base.ts";
import { BLOCK_VISUALS, ITEM_DEFAULTS } from "./shared/entity/constants.ts";
import {
  normalizeActionDefaults,
  normalizeEntity,
  normalizeHistoryOptions,
  type EntityCardConfig,
  type RawEntity,
  type RawEntityCardBase,
} from "./shared/entity/config.ts";
import { STYLE_ENTITY_CARD } from "./shared/entity/render/styles.ts";
import { isNum } from "./shared/util.ts";

const CARD_TYPE = "entity-card";

// the raw config: the card itself is one entity, so it takes every entity key
export interface RawEntityCardConfig extends RawEntityCardBase, RawEntity {}

export const normalizeEntityCardConfig = (input: unknown): EntityCardConfig => {
  if (!input || typeof input !== "object") throw new Error(`${CARD_TYPE}: invalid config`);
  const raw = input as RawEntityCardConfig;
  if (!raw.entity && raw.value === undefined)
    throw new Error(`${CARD_TYPE}: 'entity' or 'value' is required`);
  const ctx = { type: CARD_TYPE, ...normalizeActionDefaults(raw) };
  const ent = normalizeEntity(raw, ctx, "the card", ITEM_DEFAULTS.other);
  return {
    layout: "tile",
    title: null,
    icon: null,
    ...normalizeHistoryOptions(raw),
    columns: 1,
    ...ctx,
    entities: [ent],
    groups: [
      { layout: "tile", idxs: [0], align: "start", columns: 1, divider: false, hasIcon: false },
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
    if (!cfg) return { columns: 6, rows: 1 };
    // plain tile = exactly one 56 px row; tiles with a block visual size to their content
    if (!BLOCK_VISUALS.has(cfg.entities[0].visual))
      return { columns: 6, rows: 1, min_columns: 3, min_rows: 1, max_rows: 1 };
    return { columns: 6, rows: "auto", min_columns: 3, min_rows: 1 };
  }
}

registerCard(EntityCard, {
  name: "Entity Card",
  description:
    "One entity as a tile with icon, ring, gauge, bar, sparkline, columns, badge or status strip",
});
