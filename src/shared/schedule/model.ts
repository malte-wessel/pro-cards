// A schedule helper's week (pure): its blocks per weekday as Home Assistant's
// `schedule.get_schedule` answers them and `schedule/update` takes them, in minutes of the day;
// where the week stands at an instant, the block that runs, the next change, the blocks of a
// window (a day, or the next 24 hours across midnight). A schedule runs on the server's clock:
// its times are the server's wall clock, whatever zone the profile shows other times in.
import { zonedParts } from "../calendar.ts";

export const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
export type Weekday = (typeof WEEKDAYS)[number];
export const DAY_MIN = 1440;
export const WEEK_MIN = 7 * DAY_MIN;

// one block: from and to in minutes of its day (to up to 1440, the end of the day), the data Home
// Assistant keeps with it (its attributes while it runs)
export interface Block {
  from: number;
  to: number;
  data: Record<string, unknown> | null;
}
// seven days of blocks, Monday first, each sorted and without overlaps
export type Week = readonly (readonly Block[])[];

// a block as Home Assistant writes it
export interface HaBlock {
  from: string;
  to: string;
  data?: Record<string, unknown> | null;
}
export type HaWeek = Partial<Record<Weekday, HaBlock[]>>;

// "06:30:00" (or "06:30") → 390; the end of the day → 1440, written "24:00:00" and read back from
// Home Assistant as "23:59:59.999999"; anything else → null. Whole minutes: a schedule's blocks
// are minutes apart
export const parseClock = (s: unknown): number | null => {
  if (typeof s !== "string") return null;
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/.exec(s);
  if (!m) return null;
  const h = Number(m[1]),
    mi = Number(m[2]),
    sec = Number(m[3] ?? 0);
  if (h > 24 || mi > 59 || sec > 59) return null;
  if (h === 23 && mi === 59 && sec === 59) return DAY_MIN;
  const v = h * 60 + mi;
  return v > DAY_MIN ? null : v;
};
// 390 → "06:30:00"; the end of the day is "24:00:00"
export const clockOf = (min: number) => {
  const m = Math.round(min);
  const h = Math.floor(m / 60),
    mi = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}:00`;
};

const dataOf = (d: unknown): Record<string, unknown> | null =>
  d && typeof d === "object" && !Array.isArray(d) && Object.keys(d).length
    ? (d as Record<string, unknown>)
    : null;

// Home Assistant's week → ours: unreadable blocks are left out, each day sorted
export const parseWeek = (raw: unknown): Week => {
  const src = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return WEEKDAYS.map((d) => {
    const list = Array.isArray(src[d]) ? (src[d] as unknown[]) : [];
    const out: Block[] = [];
    for (const b of list) {
      if (!b || typeof b !== "object") continue;
      const o = b as Record<string, unknown>;
      const from = parseClock(o.from),
        to = parseClock(o.to);
      if (from === null || to === null || to <= from) continue;
      out.push({ from, to, data: dataOf(o.data) });
    }
    return out.sort((a, b) => a.from - b.from);
  });
};

// ours → Home Assistant's, every day named (an empty day clears it)
export const toHaWeek = (week: Week): Record<Weekday, HaBlock[]> =>
  Object.fromEntries(
    WEEKDAYS.map((d, i) => [
      d,
      (week[i] ?? []).map((b) => ({
        from: clockOf(b.from),
        to: clockOf(b.to),
        ...(b.data ? { data: b.data } : {}),
      })),
    ]),
  ) as Record<Weekday, HaBlock[]>;

// the week starting on another day (0 = Monday … 6 = Sunday) and back
export const rotate = <T>(days: readonly T[], first: number): T[] =>
  days.map((_, i) => days[(i + first) % 7]);
export const unrotate = <T>(days: readonly T[], first: number): T[] =>
  days.map((_, i) => days[(i - first + 7) % 7]);

// where the week stands at an instant on the server's clock: the day (0 = Monday) and the minute
export interface WeekPos {
  day: number;
  min: number;
}
export const weekPos = (t: number, tz: string): WeekPos => {
  const p = zonedParts(t, tz);
  return { day: p.wd < 0 ? 0 : p.wd, min: p.h * 60 + p.mi + p.s / 60 };
};

// the week's blocks on one line of minutes from Monday 00:00, blocks that touch and hold the same
// data (also across midnight, and Sunday into Monday) as one run: where the data changes, the
// schedule changes
interface Run {
  from: number;
  to: number;
  block: Block;
  day: number;
}
const sameData = (a: Block, b: Block) => JSON.stringify(a.data) === JSON.stringify(b.data);
const runsOf = (week: Week): Run[] => {
  const runs: Run[] = [];
  week.forEach((day, d) =>
    day.forEach((b) => {
      const from = d * DAY_MIN + b.from,
        to = d * DAY_MIN + b.to;
      const last = runs[runs.length - 1];
      if (last && from <= last.to && sameData(last.block, b)) last.to = Math.max(last.to, to);
      else runs.push({ from, to, block: b, day: d });
    }),
  );
  // Sunday's last run reaching Monday 00:00 goes on into Monday's first
  if (
    runs.length > 1 &&
    runs[runs.length - 1].to >= WEEK_MIN &&
    runs[0].from === 0 &&
    sameData(runs[runs.length - 1].block, runs[0].block)
  ) {
    const last = runs.pop() as Run;
    runs[0] = { ...runs[0], from: last.from - WEEK_MIN };
  }
  return runs;
};

// the block that runs at a position (null: none)
export const currentBlock = (week: Week, at: WeekPos): Block | null =>
  (week[at.day] ?? []).find((b) => b.from <= at.min && at.min < b.to) ?? null;

// The next change from a position: whether the schedule is on, and when it turns (minutes from
// now; the day and minute it turns at). A schedule on all week, or never, has none.
export interface Change {
  on: boolean;
  in: number;
  day: number;
  min: number;
}
export const nextChange = (week: Week, at: WeekPos): Change | null => {
  const runs = runsOf(week);
  if (!runs.length) return null;
  const p = at.day * DAY_MIN + at.min;
  const whole = runs.length === 1 && runs[0].to - runs[0].from >= WEEK_MIN;
  if (whole) return null;
  const turn = (to: number, on: boolean): Change => {
    let t = to;
    while (t <= p) t += WEEK_MIN;
    const w = ((t % WEEK_MIN) + WEEK_MIN) % WEEK_MIN;
    const day = Math.floor(w / DAY_MIN),
      min = w % DAY_MIN;
    // (it runs until the end of a day, 24:00, not until the next day's 00:00)
    return on && min === 0
      ? { on, in: t - p, day: (day + 6) % 7, min: DAY_MIN }
      : { on, in: t - p, day, min };
  };
  for (const r of runs) {
    // (a run that wrapped from Sunday starts before Monday 00:00)
    const inside = (p >= r.from && p < r.to) || (p >= r.from + WEEK_MIN && p < r.to + WEEK_MIN);
    if (inside) return turn(r.to, true);
  }
  const ahead = runs.find((r) => r.from > p);
  return turn(ahead ? ahead.from : runs[0].from, false);
};

// a block placed in a window of minutes (0 at the window's start), cut to it
export interface Placed {
  from: number;
  to: number;
  block: Block;
  day: number;
}
// a day's blocks in its own minutes
export const dayWindow = (week: Week, day: number): Placed[] =>
  (week[day] ?? []).map((b) => ({ from: b.from, to: b.to, block: b, day }));
// the blocks of the `span` minutes from a position, in minutes from it (across midnight and the
// week's turn)
export const aheadWindow = (week: Week, at: WeekPos, span = DAY_MIN): Placed[] => {
  const out: Placed[] = [];
  for (let k = 0; k <= Math.ceil(span / DAY_MIN); k++) {
    const day = (at.day + k) % 7;
    for (const b of week[day] ?? []) {
      const from = k * DAY_MIN + b.from - at.min,
        to = k * DAY_MIN + b.to - at.min;
      if (to <= 0 || from >= span) continue;
      out.push({ from: Math.max(0, from), to: Math.min(span, to), block: b, day });
    }
  }
  return out;
};

// a block's value for a data key (a number where it is one), null without one
export const dataValue = (b: Block | null | undefined, key: string): unknown =>
  b?.data && key in b.data ? b.data[key] : null;

// whether two weeks hold the same blocks
export const sameWeek = (a: Week, b: Week) =>
  JSON.stringify(toHaWeek(a)) === JSON.stringify(toHaWeek(b));
