/*
 * entity-group-card – many entities in one layout.
 *
 *   type: custom:entity-group-card
 *   title: Rooms / icon: mdi:home          # header (template allowed)
 *   layout: list                           # list | grid | hero | row | column | table
 *   columns: 2                             # grid: cells per row
 *   align: start | center | end | stretch | space-between   # row / column / table
 *   show_name / show_value / show_icon / name_position       # item options for row / column / table (card → entity)
 *   header_entities: [...]                 # compact icon + value items on the title line
 *   hours_to_show: 24 / bucket_minutes: 60 # history window for sparkline / columns / strip
 *   tap_action / hold_action / double_tap_action   # defaults for every entity
 *   entities:                              # entity ids or entity objects (see entity-card for the keys)
 *     - sensor.wohnzimmer_temperatur
 *     - { entity: light.wohnzimmer, toggle: true, rules: [{ state: "on", color: amber }] }
 *
 * hero: the first entity is the lead with a big value, the rest are list rows.
 */
import { registerCard } from "./shared/card.ts";
import type { GridOptions, HomeAssistant } from "./shared/ha.ts";
import { t } from "./shared/i18n.ts";
import { EntityCardBase } from "./shared/entity/base.ts";
import { DEFAULTS } from "./shared/entity/constants.ts";
import {
  clampColumns,
  normalizeActionDefaults,
  normalizeGroup,
  normalizeHeaderEntities,
  normalizeHistoryOptions,
  type EntityCardConfig,
  type RawEntityCardBase,
  type RawGroup,
} from "./shared/entity/config.ts";
import { STYLE_GROUP_CARD } from "./shared/entity/render/styles.ts";

const CARD_TYPE = "entity-group-card";

// the raw config: one group (layout, entities, item options) plus the card keys
export interface RawEntityGroupCardConfig extends RawEntityCardBase, RawGroup {}

export const normalizeEntityGroupCardConfig = (input: unknown): EntityCardConfig => {
  if (!input || typeof input !== "object") throw new Error(`${CARD_TYPE}: invalid config`);
  const raw = input as RawEntityGroupCardConfig;
  const ctx = {
    type: CARD_TYPE,
    ...normalizeActionDefaults(raw),
    columns: clampColumns(raw.columns, DEFAULTS.columns),
  };
  const { group, entities } = normalizeGroup(raw, ctx, raw, "entities", 0);
  const header = normalizeHeaderEntities(raw.header_entities, ctx);
  return {
    layout: group.layout,
    title: raw.title ?? null,
    icon: raw.icon ?? null,
    ...normalizeHistoryOptions(raw),
    ...ctx,
    entities: [...entities, ...header],
    groups: [group],
    headerIdxs: header.map((_, i) => entities.length + i),
    hasHeader: true,
  };
};

export class EntityGroupCard extends EntityCardBase {
  static cardType = CARD_TYPE;
  static getStubConfig(hass: HomeAssistant | undefined, entities?: string[]) {
    return { title: t(hass, "group.stub_title"), entities: (entities || []).slice(0, 3) };
  }
  _normalize(raw: unknown) {
    return normalizeEntityGroupCardConfig(raw);
  }
  _styles() {
    return STYLE_GROUP_CARD;
  }
  getGridOptions(): GridOptions {
    const cfg = this._config;
    if (!cfg) return { columns: 12, rows: "auto" };
    return { columns: 12, rows: "auto", min_columns: 6, min_rows: cfg.layout === "hero" ? 3 : 2 };
  }
}

registerCard(EntityGroupCard, {
  name: "Entity Group Card",
  description: "Several entities as a list, grid, hero, row, column or table",
});
