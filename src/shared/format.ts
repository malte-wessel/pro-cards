// Locale formatting and text measurement shared by all cards.
import { zonedParts } from "./calendar.ts";
import type { HomeAssistant } from "./ha.ts";

export const langOf = (hass: HomeAssistant | null | undefined) =>
  hass?.locale?.language || navigator.language;

// the time zone the profile picks: the server's when it says so, else the browser's (the `time`
// conditions, the times the cards write, the calendar days)
// the browser's zone, read once: building a formatter for it costs more than every render may
export const LOCAL_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
export const timeZoneOf = (hass: HomeAssistant | null | undefined): string =>
  hass?.locale?.time_zone === "server" && hass.config?.time_zone
    ? hass.config.time_zone
    : LOCAL_ZONE;

// The profile's number format as the locales whose separators it means (Home Assistant's
// numberFormatToLocale): `system` the browser's, `none` no grouping; `language` (or none set) the
// language's own
const NUMBER_LOCALES: Record<string, string[] | undefined> = {
  comma_decimal: ["en-US", "en"],
  decimal_comma: ["de", "es", "it"],
  space_comma: ["fr", "sv", "cs"],
  quote_decimal: ["de-CH"],
  system: undefined,
  none: ["en-US"],
};
const numberLocaleOf = (hass: HomeAssistant | null | undefined) => {
  const nf = hass?.locale?.number_format;
  return nf && nf in NUMBER_LOCALES ? NUMBER_LOCALES[nf] : [langOf(hass)];
};

// The profile's time format as an hour cycle (Home Assistant's useAmPm): `12` or `24` as said,
// `system` the browser's own, `language` (or none set) the language's
let systemCycle: "h12" | "h23" | undefined;
const hourCycleOf = (hass: HomeAssistant | null | undefined): "h12" | "h23" | undefined => {
  const tf = hass?.locale?.time_format;
  if (tf === "12") return "h12";
  if (tf === "24") return "h23";
  if (tf !== "system") return undefined;
  systemCycle ??= /^h1[12]$/.test(
    new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions().hourCycle ?? "",
  )
    ? "h12"
    : "h23";
  return systemCycle;
};

// what the cards' formatting reads from the profile: a new key formats anew
export const formatKeyOf = (hass: HomeAssistant | null | undefined) =>
  [
    langOf(hass),
    hass?.locale?.number_format ?? "",
    hass?.locale?.time_format ?? "",
    timeZoneOf(hass),
  ].join("|");

// The Intl formatters, one per locale and options: building one costs about a hundred times
// what formatting with it does, and the cards format on every render and pointer move. A handful
// of option sets per locale, so the caches stay small.
const numberFormats = new Map<string, Intl.NumberFormat>();
const dateFormats = new Map<string, Intl.DateTimeFormat>();
const cachedNumberFormat = (
  locales: string | string[] | undefined,
  opts: Intl.NumberFormatOptions,
) => {
  const key = `${String(locales ?? "")}|${JSON.stringify(opts)}`;
  let f = numberFormats.get(key);
  if (!f) numberFormats.set(key, (f = new Intl.NumberFormat(locales, opts)));
  return f;
};
// a number formatter with the separators of the profile's number format
export const numberFormat = (
  hass: HomeAssistant | null | undefined,
  opts: Intl.NumberFormatOptions,
) =>
  cachedNumberFormat(
    numberLocaleOf(hass),
    hass?.locale?.number_format === "none" ? { ...opts, useGrouping: false } : opts,
  );
export const dateFormat = (lang: string, opts: Intl.DateTimeFormatOptions) => {
  const key = `${lang}|${JSON.stringify(opts)}`;
  let f = dateFormats.get(key);
  if (!f) {
    try {
      f = new Intl.DateTimeFormat(lang, opts);
    } catch {
      // an unknown zone: the browser's
      f = new Intl.DateTimeFormat(lang, { ...opts, timeZone: undefined });
    }
    dateFormats.set(key, f);
  }
  return f;
};

// A moment in the user's language. A time of day (`hour` in the options) takes the profile's
// time format and zone; a format without one names a calendar day, which the callers build as the
// browser's local midnight (a forecast's day), so it stays in the browser's zone.
export const fmtTime = (
  hass: HomeAssistant | null | undefined,
  t: number | Date,
  opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" },
) => {
  const hc = opts.hour ? hourCycleOf(hass) : undefined;
  const o: Intl.DateTimeFormatOptions = opts.hour
    ? { ...opts, ...(hc && { hourCycle: hc }), timeZone: timeZoneOf(hass) }
    : opts;
  return dateFormat(langOf(hass), o).format(new Date(t));
};

// a number with exactly `dec` decimals in the user's number format
export const fmtNumber = (hass: HomeAssistant | null | undefined, v: number, dec: number) =>
  numberFormat(hass, { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v);

// a span of time in its two largest units, in the language's narrow unit symbols ("1h 12m",
// "1h 12 Min."); `largest` keeps only the largest ("6h", an age)
const DURATION_UNITS: [number, string][] = [
  [86400, "day"],
  [3600, "hour"],
  [60, "minute"],
  [1, "second"],
];
export const fmtDuration = (
  hass: HomeAssistant | null | undefined,
  seconds: number,
  largest = false,
) => {
  const lang = langOf(hass);
  const unit = (v: number, u: string) =>
    // the language's unit symbols (whole numbers: the number format changes nothing here)
    cachedNumberFormat(lang, { style: "unit", unit: u, unitDisplay: "narrow" }).format(v);
  let s = Math.round(Math.abs(seconds));
  const parts = DURATION_UNITS.map(([n, u]): [number, string] => {
    const v = Math.floor(s / n);
    s -= v * n;
    return [v, u];
  });
  const first = parts.findIndex(([v]) => v > 0);
  if (first < 0) return unit(0, "minute");
  return parts
    .slice(first, first + (largest ? 1 : 2))
    .filter(([v], i) => i === 0 || v > 0)
    .map(([v, u]) => unit(v, u))
    .join(" ");
};
const DURATION_UNIT_S: Record<string, number> = { s: 1, min: 60, h: 3600, d: 86400 };
// the seconds of a value in a duration unit (s, min, h, d); null for any other unit
export const durationSeconds = (v: number, unit: string) =>
  unit in DURATION_UNIT_S ? v * DURATION_UNIT_S[unit] : null;

const relativeFormats = new Map<string, Intl.RelativeTimeFormat>();
// a moment as its time from now in the language's words: "in 38 minutes", "1 hour ago", "tomorrow"
export const fmtRelative = (hass: HomeAssistant | null | undefined, t: number, now: number) => {
  const lang = langOf(hass);
  let f = relativeFormats.get(lang);
  if (!f) relativeFormats.set(lang, (f = new Intl.RelativeTimeFormat(lang, { numeric: "auto" })));
  // rounded before the unit is picked: 59.6 minutes is "in 1 hour", not "in 60 minutes"
  const s = (t - now) / 1000,
    sign = s < 0 ? -1 : 1,
    a = Math.abs(s);
  const min = Math.round(a / 60);
  if (min === 0) return f.format(0, "minute");
  if (min < 60) return f.format(sign * min, "minute");
  // days are calendar days in the profile's zone, as "tomorrow" means: 02:00 the day after
  // tomorrow is in 2 days even at 20:00, and a moment later today stays in hours
  const h = Math.round(a / 3600);
  const tz = timeZoneOf(hass);
  const days = Math.round((dayNumber(t, tz) - dayNumber(now, tz)) / 86400e3);
  if (h < 24 || days === 0) return f.format(sign * h, "hour");
  return f.format(days, "day");
};
// the calendar date of an instant in a zone, as the UTC midnight of that date (ms)
const dayNumber = (t: number, tz: string) => {
  const p = zonedParts(t, tz);
  return Date.UTC(p.y, p.m - 1, p.d);
};

const POWER_UNIT_W: Record<string, number> = { mW: 1e-3, W: 1, kW: 1e3, MW: 1e6 };
// a power in the unit that suits it: W below 1 kW, kW below 1 MW, else MW; null for a value
// that is no power (its unit is none of mW, W, kW, MW)
export const fmtPowerAuto = (
  hass: HomeAssistant | null | undefined,
  v: number,
  unit: string,
  decimals: number | null,
) => {
  if (!(unit in POWER_UNIT_W)) return null;
  const w = v * POWER_UNIT_W[unit],
    a = Math.abs(w);
  const [d, u]: [number, string] = a >= 1e6 ? [1e6, "MW"] : a >= 1e3 ? [1e3, "kW"] : [1, "W"];
  // without `decimals`: whole watts, up to two decimals in kW and MW (1.24 kW, 3.4 kW)
  const n =
    decimals === null
      ? numberFormat(hass, { maximumFractionDigits: d === 1 ? 0 : 2 }).format(w / d)
      : fmtNumber(hass, w / d, decimals);
  return `${n} ${u}`;
};

let _measureCtx: CanvasRenderingContext2D | null = null;
// width of `txt` in px when drawn with `font` (canvas measurement, cached context); the font is
// the one the text is styled with (typography.ts textStyle), so it follows the theme
export const textWidth = (txt: string, font: string) => {
  _measureCtx ??= document.createElement("canvas").getContext("2d");
  if (!_measureCtx) return 0;
  _measureCtx.font = font;
  return _measureCtx.measureText(txt).width;
};
