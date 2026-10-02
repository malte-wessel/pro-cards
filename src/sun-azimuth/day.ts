// The sun's track over a local calendar day, pure: azimuth and elevation per minute, sunrise,
// sunset and solar noon with their bearings.
import { COMPASS } from "../shared/flow/constants.ts";
import type { StringKey } from "../shared/i18n.ts";
import { compassIndex } from "../shared/flow/maths.ts";
import { solarPosition, SUNRISE_ELEV } from "../shared/solar.ts";
import { SAMPLE_MS } from "./constants.ts";

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
}

const RAD = Math.PI / 180;

// the smallest angle between two bearings, 0..180
export const angleDiff = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

// the i18n key of the compass point nearest to a bearing (the wind card's words)
export const compassKey = (az: number) =>
  `wind.dir.${COMPASS[compassIndex(az)].toLowerCase()}` as StringKey;

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

export const sunDay = (dayStart: Date, lat: number, lon: number): SunDay => {
  const start = dayStart.getTime();
  const end = new Date(
    dayStart.getFullYear(),
    dayStart.getMonth(),
    dayStart.getDate() + 1,
  ).getTime();
  const samples: SunSample[] = [];
  for (let t = start; t <= end; t += SAMPLE_MS) samples.push(sunAt(t, lat, lon));
  let noon = samples[0];
  for (const s of samples) if (s.el > noon.el) noon = s;
  const cross = (rising: boolean): SunSample | null => {
    for (let i = 1; i < samples.length; i++) {
      const a = samples[i - 1],
        b = samples[i];
      if (
        rising
          ? a.el < SUNRISE_ELEV && b.el >= SUNRISE_ELEV
          : a.el >= SUNRISE_ELEV && b.el < SUNRISE_ELEV
      )
        return between(a, b, (SUNRISE_ELEV - a.el) / (b.el - a.el));
    }
    return null;
  };
  return { start, end, samples, sunrise: cross(true), sunset: cross(false), noon };
};

// the sun is up (above the refracted horizon)
export const isUp = (s: SunSample) => s.el > SUNRISE_ELEV;

// the length of a shadow for an object of height 1, or null when the sun is down
export const shadowRatio = (el: number) => (el > 0.5 ? 1 / Math.tan(el * RAD) : null);
