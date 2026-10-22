// Words and numbers of the sun azimuth card in the user's language.
import { fmtNumber, fmtTime, textWidth } from "../../shared/format.ts";
import type { HomeAssistant } from "../../shared/ha.ts";
import { t } from "../../shared/i18n.ts";
import { escapeHtml } from "../../shared/util.ts";
import { SUN_TEXT, type SunText } from "../constants.ts";
import {
  compassKey,
  directionKey,
  isUp,
  upcomingSunrise,
  type SunDay,
  type SunSample,
} from "../day.ts";

type Hass = HomeAssistant | undefined;

export const deg = (hass: Hass, v: number) => `${fmtNumber(hass, v, 0)}°`;
export const time = (hass: Hass, v: number | null | undefined) =>
  v == null ? "–" : fmtTime(hass, v);
export const compass = (hass: Hass, az: number) => t(hass, compassKey(az));
// the direction written out, eight points: "South-West"
export const direction = (hass: Hass, az: number) => t(hass, directionKey(az));
// "4 h 28 min" (units are the same in every language)
export const duration = (ms: number) => {
  const m = Math.round(ms / 60000),
    h = Math.floor(m / 60);
  return h ? `${h} h ${m % 60} min` : `${m} min`;
};
// an element's text in one go; the markup is the card's own, the texts are set as text nodes
export const set = (root: ParentNode, sel: string, text: string) => {
  const el = root.querySelector<HTMLElement>(sel);
  if (el) el.textContent = text;
};

// the head's status: the elevation while the sun is up, otherwise where it stands
export const status = (hass: Hass, day: SunDay, now: SunSample) => {
  if (now.el > 0) return t(hass, "azimuth.elevation", { value: deg(hass, now.el) });
  if (isUp(now)) return t(hass, "azimuth.on_horizon");
  // this morning's sunrise before it, tomorrow's once the sun has set
  const below = t(hass, "azimuth.below_horizon"),
    rise = upcomingSunrise(day, now.t);
  return rise ? `${below} · ${t(hass, "azimuth.rises", { time: time(hass, rise.t) })}` : below;
};

// a chip's width for its text, in the theme's chip font
export const chipWidth = (label: string, tx: SunText = SUN_TEXT) =>
  Math.ceil(textWidth(label, tx.chipFont)) + 16;

// a preview's time in a chip whose foot is `y`: above (x, y), kept inside a box `w` wide and below
// its top
export const timeChip = (
  label: string,
  x: number,
  y: number,
  w: number,
  tx: SunText = SUN_TEXT,
) => {
  const half = chipWidth(label, tx) / 2,
    hh = tx.chipH / 2;
  return chipSvg(label, Math.max(half, Math.min(w - half, x)), Math.max(hh, y - 4 - hh), tx);
};

// a rounded SVG chip with its text, centred on (x, y); the rect is sized by measuring the text
export const chipSvg = (label: string, x: number, y: number, tx: SunText = SUN_TEXT) => {
  const w = chipWidth(label, tx),
    h = tx.chipH,
    f = (v: number) => v.toFixed(1);
  return `<g class="chip"><rect x="${f(x - w / 2)}" y="${f(y - h / 2)}" width="${w}" height="${h}" rx="${h / 2}"/><text x="${f(x)}" y="${f(y)}">${escapeHtml(label)}</text></g>`;
};
