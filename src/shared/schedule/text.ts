// What the schedule's cards write: a block's times and data, the weekdays in the user's language,
// when the schedule next changes. Times are the schedule's own (the server's wall clock).
import {
  dateFormat,
  fmtDayMinutes,
  fmtDuration,
  fmtNumber,
  langOf,
  LOCAL_ZONE,
} from "../format.ts";
import type { HomeAssistant } from "../ha.ts";
import { t } from "../i18n.ts";
import { stepDecimals } from "../util.ts";
import { WEEKDAYS, type Block, type Change, type Weekday } from "./model.ts";

// a data key the card shows (and the first one it edits)
export interface DataSpec {
  key: string;
  unit: string | null;
  step: number;
  min: number | null;
  max: number | null;
  default: number | null;
}

// the weekdays in the user's language, Monday first ("short": Mon, "narrow": M, "long": Monday)
export const dayNames = (
  hass: HomeAssistant | null | undefined,
  style: "short" | "narrow" | "long",
): string[] => {
  const f = dateFormat(langOf(hass), { weekday: style, timeZone: "UTC" });
  // 1 January 2024 was a Monday
  return Array.from({ length: 7 }, (_, i) => f.format(new Date(Date.UTC(2024, 0, 1 + i))));
};

export const rangeText = (hass: HomeAssistant | null | undefined, from: number, to: number) =>
  `${fmtDayMinutes(hass, from)} – ${fmtDayMinutes(hass, to)}`;

// a data value as the card writes it: a number with the step's decimals and its unit, else as it is
export const valueText = (
  hass: HomeAssistant | null | undefined,
  v: unknown,
  spec: DataSpec | null,
): string => {
  if (typeof v === "number" && Number.isFinite(v)) {
    // (the step's decimals, never fewer than the value has: 21.5 with a step of 1)
    const n = fmtNumber(hass, v, Math.max(spec ? stepDecimals(spec.step) : 0, stepDecimals(v)));
    return spec?.unit ? `${n} ${spec.unit}` : n;
  }
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? t(hass, "schedule.on") : t(hass, "schedule.off");
  return typeof v === "object" ? JSON.stringify(v) : String(v);
};

// a block's data: the keys the card names, in their order (none named: every key's value)
export const dataText = (
  hass: HomeAssistant | null | undefined,
  b: Block | null | undefined,
  specs: readonly DataSpec[],
): string => {
  if (!b?.data) return "";
  if (specs.length)
    return specs
      .map((s) => valueText(hass, b.data?.[s.key], s))
      .filter(Boolean)
      .join(" · ");
  return Object.values(b.data)
    .map((v) => valueText(hass, v, null))
    .filter(Boolean)
    .join(" · ");
};

// a block as its tooltip says it: "Thu 17:00 – 22:30 · 21 °C" (the day where given)
export const blockText = (
  hass: HomeAssistant | null | undefined,
  b: Block,
  specs: readonly DataSpec[],
  day: string | null,
) =>
  [`${day ? `${day} ` : ""}${rangeText(hass, b.from, b.to)}`, dataText(hass, b, specs)]
    .filter(Boolean)
    .join(" · ");

// when the schedule changes next: "until 22:30" while it runs (with the day where it is not
// today), "from 18:00" later today, "next Fri 06:00" on another day
export const changeText = (hass: HomeAssistant | null | undefined, c: Change, today: number) => {
  const time = fmtDayMinutes(hass, c.min);
  const other = c.day !== today || c.in >= 1440;
  const when = other ? `${dayNames(hass, "short")[c.day]} ${time}` : time;
  if (c.on) return t(hass, "schedule.until", { time: when });
  return t(hass, other ? "schedule.next" : "schedule.from", { time: when });
};

// how soon it changes: "in 1h 29m"
export const soonText = (hass: HomeAssistant | null | undefined, c: Change) =>
  t(hass, "schedule.in", { t: fmtDuration(hass, Math.max(60, Math.round(c.in) * 60)) });

// the zone a schedule runs in: the server's (its times are the server's wall clock)
export const scheduleZone = (hass: HomeAssistant | null | undefined) =>
  hass?.config?.time_zone || LOCAL_ZONE;

// the first day of the week, 0 = Monday: the profile's (a weekday, or the language's), else Monday
export const firstWeekdayOf = (hass: HomeAssistant | null | undefined): number => {
  const named = WEEKDAYS.indexOf(hass?.locale?.first_weekday as Weekday);
  if (named >= 0) return named;
  try {
    const loc = new Intl.Locale(langOf(hass)) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number };
      weekInfo?: { firstDay: number };
    };
    const first = (loc.getWeekInfo?.() ?? loc.weekInfo)?.firstDay;
    if (first && first >= 1 && first <= 7) return first - 1;
  } catch {
    // an unknown language: Monday
  }
  return 0;
};
