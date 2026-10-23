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

let _measureCtx: CanvasRenderingContext2D | null = null;
// width of `txt` in px when drawn with `font` (canvas measurement, cached context); the font is
// the one the text is styled with (typography.ts textStyle), so it follows the theme
export const textWidth = (txt: string, font: string) => {
  _measureCtx ??= document.createElement("canvas").getContext("2d");
  if (!_measureCtx) return 0;
  _measureCtx.font = font;
  return _measureCtx.measureText(txt).width;
};
