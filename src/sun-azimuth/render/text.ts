// Words and numbers of the sun azimuth card in the user's language.
import { fmtNumber, fmtTime, textWidth } from "../../shared/format.ts";
import type { HomeAssistant } from "../../shared/ha.ts";
import { t } from "../../shared/i18n.ts";
import { CHIP_FONT } from "../constants.ts";
import { compassKey, isUp, type SunDay, type SunSample } from "../day.ts";

type Hass = HomeAssistant | undefined;

export const deg = (hass: Hass, v: number) => `${fmtNumber(hass, v, 0)}°`;
export const time = (hass: Hass, v: number | null | undefined) =>
  v == null ? "–" : fmtTime(hass, v);
export const compass = (hass: Hass, az: number) => t(hass, compassKey(az));
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

// "rising" / "sinking", by the time relative to solar noon
export const trend = (hass: Hass, day: SunDay, now: SunSample) =>
  t(hass, now.t < day.noon.t ? "azimuth.rising" : "azimuth.sinking");

// the status line: elevation and trend while the sun is up, otherwise where it stands
export const status = (hass: Hass, day: SunDay, now: SunSample, withElevation: boolean) => {
  if (now.el > 0)
    return withElevation
      ? t(hass, "azimuth.elevation_status", {
          value: deg(hass, now.el),
          trend: trend(hass, day, now),
        })
      : trend(hass, day, now);
  if (isUp(now)) return t(hass, "azimuth.on_horizon");
  const below = t(hass, "azimuth.below_horizon");
  return day.sunrise
    ? `${below} · ${t(hass, "azimuth.rises", { time: time(hass, day.sunrise.t) })}`
    : below;
};

// a rounded SVG chip with its text, centred on (x, y); the rect is sized by measuring the text
export const chipSvg = (label: string, x: number, y: number) => {
  const w = Math.ceil(textWidth(label, CHIP_FONT)) + 16,
    f = (v: number) => v.toFixed(1);
  return `<g class="chip"><rect x="${f(x - w / 2)}" y="${f(y - 10)}" width="${w}" height="20" rx="10"/><text x="${f(x)}" y="${f(y)}">${label}</text></g>`;
};
