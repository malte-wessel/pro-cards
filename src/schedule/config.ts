// Schedule Card Pro: config types and normalization (pure). A schedule helper's week, the header
// over it the entity cards' (its name, icon and when it changes next).
import {
  normalizeActionDefaults,
  normalizeTitleAction,
  type EntityCardConfig,
  type RawEntityCardBase,
} from "../shared/entity/config.ts";
import { WEEKDAYS, type Weekday } from "../shared/schedule/model.ts";
import { normalizeData } from "../shared/schedule/data.ts";
import type { DataSpec } from "../shared/schedule/text.ts";
import { numOrNull } from "../shared/util.ts";

export const CARD_TYPE = "schedule-card-pro";
// the minutes a block's times snap to
export const SNAPS = [5, 10, 15, 30, 60] as const;

export interface RawScheduleCardConfig extends RawEntityCardBase {
  entity?: unknown;
  name?: unknown;
  color?: unknown;
  data?: unknown;
  edit?: unknown;
  snap?: unknown;
  first_weekday?: unknown;
}

export interface ScheduleCardConfig extends EntityCardConfig {
  entity: string;
  color: string | null;
  data: DataSpec[];
  edit: boolean;
  snap: number;
  // the first day shown, 0 = Monday (null: the profile's)
  firstWeekday: number | null;
}

const err = (msg: string) => new Error(`${CARD_TYPE}: ${msg}`);

export const normalizeScheduleCardConfig = (input: unknown): ScheduleCardConfig => {
  if (!input || typeof input !== "object") throw err("invalid config");
  const raw = input as RawScheduleCardConfig;
  if (typeof raw.entity !== "string" || !raw.entity)
    throw err("entity is required (a schedule helper, schedule.…)");
  if (!raw.entity.startsWith("schedule."))
    throw err(`entity is a schedule helper (schedule.…), not ${raw.entity}`);
  if (raw.name !== undefined && raw.name !== null && typeof raw.name !== "string")
    throw err("name is a text");
  if (raw.edit !== undefined && typeof raw.edit !== "boolean") throw err("edit is true or false");
  const snap = raw.snap === undefined ? 15 : numOrNull(raw.snap);
  if (snap === null || !(SNAPS as readonly number[]).includes(snap))
    throw err(`snap is one of ${SNAPS.join(", ")} (minutes)`);
  let first: number | null = null;
  if (raw.first_weekday !== undefined && raw.first_weekday !== null) {
    first = WEEKDAYS.indexOf(raw.first_weekday as Weekday);
    if (first < 0) throw err(`first_weekday is one of ${WEEKDAYS.join(", ")}`);
  }
  const ctx = { type: CARD_TYPE, ...normalizeActionDefaults(raw) };
  return {
    layout: "schedule",
    title: (raw.name as string | undefined) ?? raw.title ?? null,
    titleTap: normalizeTitleAction(raw),
    icon: raw.icon ?? null,
    hours: 24,
    bucketMin: 60,
    smoothMin: null,
    columns: 1,
    ...ctx,
    entities: [],
    groups: [],
    headerIdxs: [],
    hasHeader: true,
    entity: raw.entity,
    color: typeof raw.color === "string" && raw.color ? raw.color : null,
    data: normalizeData(raw.data, CARD_TYPE),
    edit: raw.edit !== false,
    snap,
    firstWeekday: first,
  };
};
