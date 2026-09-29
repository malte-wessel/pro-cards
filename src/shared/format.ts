// Locale formatting and text measurement shared by all cards.
import { AXIS_FONT } from "./constants.ts";
import type { HomeAssistant } from "./ha.ts";

export const langOf = (hass: HomeAssistant | null | undefined) =>
  hass?.locale?.language || navigator.language;

export const fmtTime = (
  hass: HomeAssistant | null | undefined,
  t: number | Date,
  opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" },
) => new Intl.DateTimeFormat(langOf(hass), opts).format(new Date(t));

// a number with exactly `dec` decimals in the user's locale
export const fmtNumber = (hass: HomeAssistant | null | undefined, v: number, dec: number) =>
  new Intl.NumberFormat(langOf(hass), {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  }).format(v);

let _measureCtx: CanvasRenderingContext2D | null = null;
// width of `txt` in px when drawn with `font` (canvas measurement, cached context)
export const textWidth = (txt: string, font: string = AXIS_FONT) => {
  _measureCtx ??= document.createElement("canvas").getContext("2d");
  if (!_measureCtx) return 0;
  _measureCtx.font = font;
  return _measureCtx.measureText(txt).width;
};
