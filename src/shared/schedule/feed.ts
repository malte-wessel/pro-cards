// A schedule helper's week, read through Home Assistant's `schedule.get_schedule` (any user may
// call it), one fetch per entity for the whole page, shared by every card that shows it. Fetched
// again when the entity's state changes (a block starts or ends, the schedule was saved), every
// few minutes, and after a card saved it. Saving (admins, and only a schedule made in the UI: one
// set in YAML has no item to update; the entity's `editable` says which) goes through the helper's own `schedule/update`, after
// reading the week and the helper again: a week changed elsewhere since the edit began is not
// overwritten unasked, and the helper's name and icon are the ones it has now.
import type { HomeAssistant, HassEntity } from "../ha.ts";
import { REFRESH_MS } from "../constants.ts";
import { parseWeek, sameWeek, toHaWeek, type Week } from "./model.ts";

interface Entry {
  week: Week | null; // null: none to read (an error, an unknown entity)
  st: HassEntity | undefined; // the state it was fetched for
  at: number;
}
const got = new Map<string, Entry>();
// a fetch in flight per entity, and whether another was asked for meanwhile (it runs after it)
const asking = new Set<string>();
const again = new Set<string>();
// per entity: a save moves it on, and an answer asked for before is dropped
const gen = new Map<string, number>();
const listeners = new Set<(id: string) => void>();
// a fetch that failed is asked again a minute later (the next render after that)
const RETRY_MS = 60e3;

interface ServiceResponse {
  response?: Record<string, unknown>;
}

const fetchWeek = async (hass: HomeAssistant, id: string): Promise<Week | null> => {
  const res = await hass.callWS<ServiceResponse>({
    type: "call_service",
    domain: "schedule",
    service: "get_schedule",
    target: { entity_id: id },
    return_response: true,
  });
  const mine = res?.response?.[id];
  return mine ? parseWeek(mine) : null;
};

// (a listener that throws stops neither the others nor what told them: a save stays saved)
const tell = (id: string) => {
  for (const fn of [...listeners]) {
    try {
      fn(id);
    } catch (err) {
      console.error("pro-cards: a schedule listener failed", err);
    }
  }
};

const ask = (hass: HomeAssistant, id: string) => {
  if (asking.has(id)) {
    again.add(id);
    return;
  }
  asking.add(id);
  const st = hass.states[id];
  const g = gen.get(id) ?? 0;
  fetchWeek(hass, id)
    .then(
      (week) => ({ week, at: Date.now() }),
      (err) => {
        console.warn(`pro-cards: schedule.get_schedule for ${id} failed`, err);
        return { week: got.get(id)?.week ?? null, at: Date.now() - REFRESH_MS + RETRY_MS };
      },
    )
    .then(({ week, at }) => {
      asking.delete(id);
      // (an answer asked for before a save: the week it read is gone)
      if ((gen.get(id) ?? 0) === g) {
        const before = got.get(id)?.week;
        // the same week keeps its identity: what draws it keeps its drawing
        const keep = before && week && sameWeek(before, week) ? before : week;
        got.set(id, { week: keep, st, at });
        if (keep !== before) tell(id);
      }
      if (again.delete(id) || (gen.get(id) ?? 0) !== g) ask(hass, id);
    });
};

// the entity's week: undefined while it is first fetched (the call starts it), null when there is
// none to read; a new state or an old answer fetches again (the answer kept meanwhile)
export const scheduleWeek = (
  hass: HomeAssistant | undefined,
  id: string | null,
): Week | null | undefined => {
  if (!id) return null;
  const e = got.get(id);
  if (hass?.callWS && hass.states[id]) {
    const stale = !e || e.st !== hass.states[id] || Date.now() - e.at > REFRESH_MS;
    if (stale && !asking.has(id)) ask(hass, id);
  }
  return e ? e.week : hass?.states[id] ? undefined : null;
};

// what is known now, asking nothing (a row's input: none yet, then the answer)
export const knownWeek = (id: string | null): Week | null | undefined =>
  id ? got.get(id)?.week : null;

// called with the entity whenever its week arrives or changes; returns the unsubscribe
export const onScheduleWeek = (fn: (id: string) => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

// ----- editing -----

// a schedule helper as `schedule/list` answers it
interface ScheduleItem {
  id: string;
  name: string;
  icon?: string | null;
}
const findItem = async (hass: HomeAssistant, id: string): Promise<ScheduleItem | null> => {
  const [entry, list] = await Promise.all([
    hass.callWS<{ unique_id?: string } | null>({
      type: "config/entity_registry/get",
      entity_id: id,
    }),
    hass.callWS<ScheduleItem[]>({ type: "schedule/list" }),
  ]);
  return (Array.isArray(list) ? list : []).find((i) => i.id === entry?.unique_id) ?? null;
};

// whether the user may edit the schedule: an administrator, and a helper made in the UI (Home
// Assistant says so in the entity's `editable`; one set in YAML has no item to update)
export const scheduleEditable = (hass: HomeAssistant | undefined, id: string | null): boolean =>
  !!id && !!hass?.user?.is_admin && !!hass.callWS && hass.states[id]?.attributes.editable === true;

// why a save did not happen: the schedule is set in YAML, or was changed elsewhere since `start`
// (the week Home Assistant has now in `week`)
export class ScheduleSaveError extends Error {
  readonly reason: "yaml" | "changed";
  readonly week: Week | null;
  constructor(reason: "yaml" | "changed", week: Week | null = null) {
    super(reason === "yaml" ? "the schedule is set in YAML" : "the schedule was changed elsewhere");
    this.reason = reason;
    this.week = week;
  }
}

// Saves the week (rejects with Home Assistant's error, or a ScheduleSaveError). The week and the
// helper are read again first: where the week is no longer `start` (null: overwrite it), nothing is
// saved. The cards showing it get the new week.
export const saveWeek = async (hass: HomeAssistant, id: string, week: Week, start: Week | null) => {
  const [now, item] = await Promise.all([fetchWeek(hass, id), findItem(hass, id)]);
  if (!item) throw new ScheduleSaveError("yaml");
  if (start && now && !sameWeek(now, start)) throw new ScheduleSaveError("changed", now);
  // an answer asked for before is dropped from here on
  gen.set(id, (gen.get(id) ?? 0) + 1);
  await hass.callWS({
    type: "schedule/update",
    schedule_id: item.id,
    name: item.name,
    ...(item.icon ? { icon: item.icon } : {}),
    ...toHaWeek(week),
  });
  got.set(id, { week, st: hass.states[id], at: Date.now() });
  tell(id);
  // and what Home Assistant made of it
  ask(hass, id);
};

// (tests: forget everything)
export const resetSchedules = () => {
  got.clear();
  asking.clear();
  again.clear();
  gen.clear();
};
