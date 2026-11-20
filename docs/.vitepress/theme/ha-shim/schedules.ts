// The demo home's schedule helpers: their weeks as Home Assistant keeps them, their state and
// `next_event` as Home Assistant computes them from the week (on while a block runs, its data as
// attributes), and the helpers' own list and update, so the schedule card saves in the docs.
// `schedule.office_hours` is set in YAML: it is in no list, so it is shown, never edited.
import {
  nextChange,
  parseWeek,
  toHaWeek,
  weekPos,
  currentBlock,
  type HaWeek,
} from "../../../../src/shared/schedule/model.ts";

const H = (from: string, to: string, data?: Record<string, unknown>) => ({
  from: `${from}:00`,
  to: `${to}:00`,
  ...(data ? { data } : {}),
});
const warm = (t = 21) => ({ temperature: t });
const workday = [H("06:00", "08:30", warm()), H("17:00", "22:30", warm())];

export const SCHEDULE_WEEKS: Record<string, HaWeek> = {
  "schedule.heating": {
    monday: workday,
    tuesday: workday,
    wednesday: [
      H("06:00", "08:30", warm()),
      H("12:00", "13:30", warm()),
      H("17:00", "22:30", warm()),
    ],
    thursday: [H("06:00", "08:30", warm(20.5)), H("17:00", "22:30", warm())],
    friday: [H("06:00", "08:30", warm()), H("17:00", "23:30", warm())],
    saturday: [H("08:00", "12:00", warm()), H("14:00", "23:00", warm(21.5))],
    sunday: [H("08:00", "12:00", warm()), H("14:00", "22:30", warm(21.5))],
  },
  "schedule.hallway_lights": Object.fromEntries(
    ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((d) => [
      d,
      [H("06:30", "07:30"), H("17:00", "23:30")],
    ]),
  ),
  "schedule.garden_watering": {
    monday: [H("06:00", "06:20", { duration: 20 }), H("20:30", "20:50", { duration: 20 })],
    wednesday: [H("06:00", "06:20", { duration: 20 }), H("20:30", "20:50", { duration: 20 })],
    friday: [H("06:00", "06:20", { duration: 20 }), H("20:30", "20:50", { duration: 20 })],
    sunday: [H("06:00", "06:30", { duration: 30 })],
  },
  "schedule.office_hours": Object.fromEntries(
    ["monday", "tuesday", "wednesday", "thursday", "friday"].map((d) => [d, [H("08:00", "17:00")]]),
  ),
};

export const SCHEDULE_ATTRS: Record<string, Record<string, unknown>> = {
  "schedule.heating": { friendly_name: "Heating", icon: "mdi:radiator" },
  "schedule.hallway_lights": { friendly_name: "Hallway lights", icon: "mdi:lightbulb-auto" },
  "schedule.garden_watering": { friendly_name: "Garden watering", icon: "mdi:sprinkler-variant" },
  "schedule.office_hours": { friendly_name: "Office hours", icon: "mdi:briefcase-clock" },
};
// the helpers made in the UI (the list `schedule/list` answers): their item ids
const ITEMS: Record<string, string> = {
  "schedule.heating": "heating",
  "schedule.hallway_lights": "hallway_lights",
  "schedule.garden_watering": "garden_watering",
};
export const scheduleUniqueId = (entity: string) =>
  ITEMS[entity] ?? entity.slice(entity.indexOf(".") + 1);

const zone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

// the state and attributes Home Assistant gives the helper at `t`
export const scheduleState = (id: string, t: number) => {
  const week = parseWeek(SCHEDULE_WEEKS[id]);
  const pos = weekPos(t, zone());
  const cur = currentBlock(week, pos);
  const c = nextChange(week, pos);
  return {
    state: cur ? "on" : "off",
    attributes: {
      ...SCHEDULE_ATTRS[id],
      // (a helper made in the UI; one set in YAML is not)
      editable: id in ITEMS,
      next_event: c ? new Date(Math.round((t + c.in * 60e3) / 60e3) * 60e3).toISOString() : null,
      ...(cur?.data ?? {}),
    },
  };
};

// `schedule/list`: the helpers made in the UI
export const scheduleList = () =>
  Object.entries(ITEMS).map(([entity, id]) => ({
    id,
    name: SCHEDULE_ATTRS[entity].friendly_name,
    icon: SCHEDULE_ATTRS[entity].icon,
    ...toHaWeek(parseWeek(SCHEDULE_WEEKS[entity])),
  }));

// `schedule/update`: the item's week replaced (the entity changes with it); throws where Home
// Assistant would (an unknown item, blocks that overlap)
export const updateSchedule = (msg: Record<string, unknown>): string => {
  const entity = Object.keys(ITEMS).find((e) => ITEMS[e] === msg.schedule_id);
  if (!entity) throw new Error(`Unable to find schedule_id ${String(msg.schedule_id)}`);
  const week: HaWeek = {};
  for (const d of [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ] as const) {
    const blocks = (msg[d] as HaWeek[typeof d]) ?? [];
    const parsed = parseWeek({ [d]: blocks });
    const day =
      parsed[
        ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].indexOf(d)
      ];
    if (day.length !== blocks.length) throw new Error(`Invalid time range in ${d}`);
    for (let i = 1; i < day.length; i++)
      if (day[i].from < day[i - 1].to) throw new Error(`Overlapping times found in ${d}`);
    week[d] = blocks;
  }
  SCHEDULE_WEEKS[entity] = week;
  return entity;
};
