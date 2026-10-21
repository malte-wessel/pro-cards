// Words and numbers of the sun azimuth card in the user's language.
import { fmtNumber, fmtTime, textWidth } from "../../shared/format.ts";
import type { HomeAssistant } from "../../shared/ha.ts";
import { t } from "../../shared/i18n.ts";
import { escapeHtml } from "../../shared/util.ts";
import { CHIP_FONT } from "../constants.ts";
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

// a preview's time in a chip centred on (x, y), kept inside a box `w` wide and below its top
export const timeChip = (label: string, x: number, y: number, w: number) => {
  const half = (Math.ceil(textWidth(label, CHIP_FONT)) + 16) / 2;
  return chipSvg(label, Math.max(half, Math.min(w - half, x)), Math.max(10, y));
};

// a rounded SVG chip with its text, centred on (x, y); the rect is sized by measuring the text
export const chipSvg = (label: string, x: number, y: number) => {
  const w = Math.ceil(textWidth(label, CHIP_FONT)) + 16,
    f = (v: number) => v.toFixed(1);
  return `<g class="chip"><rect x="${f(x - w / 2)}" y="${f(y - 10)}" width="${w}" height="20" rx="10"/><text x="${f(x)}" y="${f(y)}">${escapeHtml(label)}</text></g>`;
};
