/*
 * entity-sections-card-pro – several groups under one header.
 *
 *   type: custom:entity-sections-card-pro
 *   title: Living room / icon: mdi:sofa     # header (template allowed)
 *   header_entities: [...]                 # compact icon + value items on the title line
 *   hours_to_show: 24 / bucket_minutes: 60
 *   tap_action / hold_action / double_tap_action   # defaults for every entity
 *   align / columns / show_name / show_value / show_icon / name_position   # defaults for every section
 *   sections:                              # each section is an entity-group-card-pro config
 *     - layout: table                      # list | grid | hero | row | column | table
 *       divider: false                     # line above the section (never the first)
 *       entities: [...]
 */
import { registerCard } from "./shared/card.ts";
import type { GridOptions, HomeAssistant } from "./shared/ha.ts";
import { t } from "./shared/i18n.ts";
import { EntityCardBase } from "./shared/entity/base.ts";
import { DEFAULTS } from "./shared/entity/constants.ts";
import {
  normalizeTitleAction,
  clampColumns,
  normalizeActionDefaults,
  normalizeGroup,
  normalizeHeaderEntities,
  normalizeHistoryOptions,
  type EntityCardConfig,
  type EntityItem,
  type Group,
  type RawEntityCardBase,
} from "./shared/entity/config.ts";
import { STYLE_GROUP_CARD } from "./shared/entity/render/styles.ts";

const CARD_TYPE = "entity-sections-card-pro";

// the raw config: the card keys plus a list of groups
export interface RawEntitySectionsCardConfig extends RawEntityCardBase {
  sections?: unknown;
}

export const normalizeEntitySectionsCardConfig = (input: unknown): EntityCardConfig => {
  if (!input || typeof input !== "object") throw new Error(`${CARD_TYPE}: invalid config`);
  const raw = input as RawEntitySectionsCardConfig;
  if (!Array.isArray(raw.sections) || raw.sections.length === 0)
    throw new Error(`${CARD_TYPE}: 'sections' must be a non-empty list`);
  const ctx = {
    type: CARD_TYPE,
    ...normalizeActionDefaults(raw),
    columns: clampColumns(raw.columns, DEFAULTS.columns),
  };
  const entities: EntityItem[] = [],
    groups: Group[] = [];
  raw.sections.forEach((sec: unknown, i: number) => {
    const r = normalizeGroup(sec, ctx, raw, `sections[${i}]`, entities.length);
    entities.push(...r.entities);
    groups.push(r.group);
  });
  const header = normalizeHeaderEntities(raw.header_entities, ctx);
  return {
    layout: "sections",
    title: raw.title ?? null,
    titleTap: normalizeTitleAction(raw),
    icon: raw.icon ?? null,
    ...normalizeHistoryOptions(raw),
    ...ctx,
    entities: [...entities, ...header],
    groups,
    headerIdxs: header.map((_, i) => entities.length + i),
    hasHeader: true,
  };
};

export class EntitySectionsCard extends EntityCardBase {
  static cardType = CARD_TYPE;
  static getStubConfig(hass: HomeAssistant | undefined, entities?: string[]) {
    return {
      title: t(hass, "sections.stub_title"),
      sections: [{ layout: "row", entities: (entities || []).slice(0, 3) }],
    };
  }
  _normalize(raw: unknown) {
    return normalizeEntitySectionsCardConfig(raw);
  }
  _styles() {
    return STYLE_GROUP_CARD;
  }
  getGridOptions(): GridOptions {
    const cfg = this._config;
    if (!cfg) return { columns: 12, rows: "auto" };
    const hero = cfg.groups.some((g) => g.layout === "hero");
    return { columns: 12, rows: "auto", min_columns: 6, min_rows: hero ? 3 : 2 };
  }
}

registerCard(EntitySectionsCard, {
  name: "Entity Sections Card Pro",
  description: "Several groups of entities, each with its own layout, in one card",
});
