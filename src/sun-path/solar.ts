// Solar math (NOAA solar position), pure. Times are computed locally from latitude/longitude
// because sun.sun only exposes the *next* events.

const RAD = Math.PI / 180;

// Solar elevation in degrees (no refraction) for a Date at lat/lon
export const solarElevation = (date: Date, lat: number, lon: number): number => {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const T = (jd - 2451545) / 36525;
  const L0 = (((280.46646 + T * (36000.76983 + T * 0.0003032)) % 360) + 360) % 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C =
    Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T) +
    Math.sin(3 * M * RAD) * 0.000289;
  const omega = 125.04 - 1934.136 * T;
  const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(omega * RAD);
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(omega * RAD);
  const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD));
  const y = Math.tan((eps / 2) * RAD) ** 2;
  const eqt =
    (4 / RAD) *
    (y * Math.sin(2 * L0 * RAD) -
      2 * e * Math.sin(M * RAD) +
      4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) -
      0.5 * y * y * Math.sin(4 * L0 * RAD) -
      1.25 * e * e * Math.sin(2 * M * RAD));
  const minutesUTC = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
  let tst = (minutesUTC + eqt + 4 * lon) % 1440;
  if (tst < 0) tst += 1440;
  const ha = tst / 4 < 0 ? tst / 4 + 180 : tst / 4 - 180;
  const cosZ =
    Math.sin(lat * RAD) * Math.sin(decl) +
    Math.cos(lat * RAD) * Math.cos(decl) * Math.cos(ha * RAD);
  return 90 - Math.acos(Math.max(-1, Math.min(1, cosZ))) / RAD;
};

// Today's timeline (local day): minute samples + event times found by threshold crossings
export interface SolarSample {
  t: number;
  e: number;
}
export interface SolarDay {
  start: number;
  end: number;
  samples: SolarSample[];
  sunrise: number | null;
  sunset: number | null;
  dawn: number | null;
  dusk: number | null;
  noon: number;
  maxElev: number;
  minElev: number;
}
export const solarDay = (dayStart: Date, lat: number, lon: number): SolarDay => {
  const end = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate() + 1);
  const t0 = dayStart.getTime(),
    t1 = end.getTime();
  const samples: SolarSample[] = [];
  for (let t = t0; t <= t1; t += 60000)
    samples.push({ t, e: solarElevation(new Date(t), lat, lon) });
  const cross = (thr: number, rising: boolean): number | null => {
    for (let i = 1; i < samples.length; i++) {
      const a = samples[i - 1],
        b = samples[i];
      if (rising ? a.e < thr && b.e >= thr : a.e >= thr && b.e < thr) {
        const f = (thr - a.e) / (b.e - a.e);
        return a.t + f * (b.t - a.t);
      }
    }
    return null;
  };
  let noon = samples[0],
    min = samples[0];
  for (const s of samples) {
    if (s.e > noon.e) noon = s;
    if (s.e < min.e) min = s;
  }
  return {
    start: t0,
    end: t1,
    samples,
    sunrise: cross(-0.833, true),
    sunset: cross(-0.833, false),
    dawn: cross(-6, true),
    dusk: cross(-6, false),
    noon: noon.t,
    maxElev: noon.e,
    minElev: min.e,
  };
};
