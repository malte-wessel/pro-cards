// The sun's track over a day, pure: azimuth and elevation per minute, sunrise, sunset and solar
// noon with their bearings, and the next morning's sunrise. Built on the shared solar day, a 24 h
// window centred on solar noon, so a sunset after midnight (Iceland in June) is that evening's,
// not the one left over from the night before.
import { COMPASS } from "../shared/flow/constants.ts";
import type { StringKey } from "../shared/i18n.ts";
import { compassIndex } from "../shared/flow/maths.ts";
import { solarDay, solarPosition, SUNRISE_ELEV } from "../shared/solar.ts";
import { pointOf } from "./constants.ts";

export interface SunSample {
  t: number;
  az: number;
  el: number;
}
export interface SunDay {
  start: number;
  end: number;
  samples: SunSample[];
  sunrise: SunSample | null;
  sunset: SunSample | null;
  noon: SunSample;
  // the sunrise after this one (tomorrow morning's), for "rises …" once the sun has set
  nextSunrise: SunSample | null;
}

// the smallest angle between two bearings, 0..180
export const angleDiff = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

// the i18n key of the compass point nearest to a bearing (the wind card's words)
export const compassKey = (az: number) =>
  `wind.dir.${COMPASS[compassIndex(az)].toLowerCase()}` as StringKey;

// the i18n key of the nearest of the eight points written out (North, North-East …), for the head
export const directionKey = (az: number) => `azimuth.dir.${pointOf(az)}` as StringKey;

// azimuth and elevation of the sun at an instant
export const sunAt = (t: number, lat: number, lon: number): SunSample => {
  const p = solarPosition(new Date(t), lat, lon);
  return { t, az: p.azimuth, el: p.elevation };
};

// linear interpolation between two samples, the azimuth the short way round
const between = (a: SunSample, b: SunSample, f: number): SunSample => {
  const d = ((b.az - a.az + 540) % 360) - 180;
  return {
    t: a.t + f * (b.t - a.t),
    az: (((a.az + f * d) % 360) + 360) % 360,
    el: a.el + f * (b.el - a.el),
  };
};

// the solar day around the local calendar day of `dayStart` (noon - 12 h .. noon + 12 h)
export const sunDay = (dayStart: Date, lat: number, lon: number): SunDay => {
  const d = solarDay(dayStart, lat, lon);
  const at = (t: number | null) => (t === null ? null : sunAt(t, lat, lon));
  const sunrise = at(d.sunrise);
  return {
    start: d.start,
    end: d.end,
    samples: d.samples.map((s) => ({ t: s.t, az: s.a, el: s.e })),
    sunrise,
    sunset: at(d.sunset),
    noon: sunAt(d.noon, lat, lon),
    nextSunrise: sunrise && nextRise(sunrise.t, lat, lon),
  };
};

// the sunrise about a day after the one at `t`: a rising crossing of the refracted horizon in a
// window of 20–28 h after it, in 5 minute steps, interpolated
const nextRise = (t: number, lat: number, lon: number): SunSample | null => {
  const STEP = 5 * 60e3;
  let a = sunAt(t + 20 * 3600e3, lat, lon);
  for (let u = a.t + STEP; u <= t + 28 * 3600e3; u += STEP) {
    const b = sunAt(u, lat, lon);
    if (a.el < SUNRISE_ELEV && b.el >= SUNRISE_ELEV)
      return between(a, b, (SUNRISE_ELEV - a.el) / (b.el - a.el));
    a = b;
  }
  return null;
};

// the sunrise still to come at `now`: this day's before it, the next one after it
export const upcomingSunrise = (day: SunDay, now: number): SunSample | null =>
  day.sunrise && now < day.sunrise.t ? day.sunrise : day.nextSunrise;

// the sun is up (above the refracted horizon)
export const isUp = (s: SunSample) => s.el > SUNRISE_ELEV;
