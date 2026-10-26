// Locale formatting and text measurement shared by all cards.
import type { HomeAssistant } from "./ha.ts";

export const langOf = (hass: HomeAssistant | null | undefined) =>
  hass?.locale?.language || navigator.language;

// The Intl formatters, one per language and options: building one costs about a hundred times
// what formatting with it does, and the cards format on every render and pointer move. A handful
// of option sets per language, so the caches stay small.
const numberFormats = new Map<string, Intl.NumberFormat>();
const dateFormats = new Map<string, Intl.DateTimeFormat>();
export const numberFormat = (lang: string, opts: Intl.NumberFormatOptions) => {
  const key = `${lang}|${JSON.stringify(opts)}`;
  let f = numberFormats.get(key);
  if (!f) numberFormats.set(key, (f = new Intl.NumberFormat(lang, opts)));
  return f;
};
export const dateFormat = (lang: string, opts: Intl.DateTimeFormatOptions) => {
  const key = `${lang}|${JSON.stringify(opts)}`;
  let f = dateFormats.get(key);
  if (!f) dateFormats.set(key, (f = new Intl.DateTimeFormat(lang, opts)));
  return f;
};

export const fmtTime = (
  hass: HomeAssistant | null | undefined,
  t: number | Date,
  opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" },
) => dateFormat(langOf(hass), opts).format(new Date(t));

// a number with exactly `dec` decimals in the user's locale
export const fmtNumber = (hass: HomeAssistant | null | undefined, v: number, dec: number) =>
  numberFormat(langOf(hass), { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v);

// a span of time as "1 h 12 min", the two largest units (the unit symbols are the same in every
// language); `largest` keeps only the largest ("6 h", an age)
export const fmtDuration = (
  hass: HomeAssistant | null | undefined,
  seconds: number,
  largest = false,
) => {
  const s = Math.round(Math.abs(seconds));
  const parts: [number, string][] = [
    [Math.floor(s / 86400), "d"],
    [Math.floor((s % 86400) / 3600), "h"],
    [Math.floor((s % 3600) / 60), "min"],
    [s % 60, "s"],
  ];
  const first = parts.findIndex(([n]) => n > 0);
  if (first < 0) return `${fmtNumber(hass, 0, 0)} min`;
  return parts
    .slice(first, first + (largest ? 1 : 2))
    .filter(([n], i) => i === 0 || n > 0)
    .map(([n, u]) => `${fmtNumber(hass, n, 0)} ${u}`)
    .join(" ");
};
const DURATION_UNIT_S: Record<string, number> = { s: 1, min: 60, h: 3600, d: 86400 };
// the seconds of a value in a duration unit (s, min, h, d); null for any other unit
export const durationSeconds = (v: number, unit: string) =>
  unit in DURATION_UNIT_S ? v * DURATION_UNIT_S[unit] : null;

const relativeFormats = new Map<string, Intl.RelativeTimeFormat>();
// a moment as its time from now: "in 38 min", "12 min ago", "tomorrow"
export const fmtRelative = (hass: HomeAssistant | null | undefined, t: number, now: number) => {
  const lang = langOf(hass);
  let f = relativeFormats.get(lang);
  if (!f) relativeFormats.set(lang, (f = new Intl.RelativeTimeFormat(lang, { numeric: "auto" })));
  const s = (t - now) / 1000,
    a = Math.abs(s);
  if (a < 60) return f.format(0, "minute");
  if (a < 3600) return f.format(Math.round(s / 60), "minute");
  if (a < 86400) return f.format(Math.round(s / 3600), "hour");
  return f.format(Math.round(s / 86400), "day");
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
      ? numberFormat(langOf(hass), { maximumFractionDigits: d === 1 ? 0 : 2 }).format(w / d)
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
