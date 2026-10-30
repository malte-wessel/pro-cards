// The sun kind: computed from Home Assistant's location (sun.sun is detected, and is the more-info
// target; `poster: sun` needs no entity). The sun or the moon, how soon the next sunrise or sunset
// comes as the status, that event large with its time, and the day's curve along the bottom, its
// tooltip under the pointer. Amber by day, indigo by night, unless `color` says otherwise.
import { cssColor } from "../color.ts";
import { leadEl } from "../entity/render/lead.ts";
import { fmtRelative } from "../format.ts";
import { SUNRISE_ELEV, solarDay, solarDayAround, solarElevation, type SolarDay } from "../solar.ts";
import {
  CURVE_BOTTOM,
  CURVE_TOP,
  drawCurve,
  showHover,
  timeAt,
  type PositionedDay,
  type SunCurveHost,
} from "../sun/curve.ts";
import { defaultLabel, fmtEvent, nextEvent } from "../sun/events.ts";
import { div, wordValue } from "./dom.ts";
import type { Kind, KindCtx } from "./types.ts";

const CURVE_H = 72;
// how far the sun's curve reaches up behind the time above it, in px, besides its headroom
const SUN_BLEED = 10;
// the next day of a day, kept per curve host
const nextDays = new WeakMap<SunCurveHost, { after: PositionedDay; day: SolarDay }>();

// today's solar day at the home's position, kept on the host while it lasts
const dayOf = (c: KindCtx): PositionedDay | null => {
  const lat = c.ctx.hass?.config?.latitude,
    lon = c.ctx.hass?.config?.longitude;
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  const host = c.host.sun,
    t = c.ctx.now,
    d = host._day;
  if (d && d.lat === lat && d.lon === lon && t >= d.start && t < d.end) return d;
  return (host._day = solarDayAround(new Date(t), (start) => ({
    ...solarDay(start, lat, lon),
    lat,
    lon,
  })));
};
const nextDay = (host: SunCurveHost, day: PositionedDay): SolarDay => {
  const kept = nextDays.get(host);
  if (kept?.after === day) return kept.day;
  const noon = new Date(day.noon);
  const start = new Date(noon.getFullYear(), noon.getMonth(), noon.getDate() + 1);
  const next = solarDay(start, day.lat, day.lon);
  nextDays.set(host, { after: day, day: next });
  return next;
};
const eventOf = (c: KindCtx) => {
  const day = dayOf(c);
  return day ? nextEvent(day, () => nextDay(c.host.sun, day), c.ctx.now) : null;
};
const isUp = (c: KindCtx) => {
  const day = dayOf(c);
  return !!day && solarElevation(new Date(c.ctx.now), day.lat, day.lon) > SUNRISE_ELEV;
};

export const SUN: Kind = {
  name: "sun",
  ids: ["sun.sun"],
  reads: ["sun"],
  readsText: "sun.sun, or no entity",
  entityless: true,
  keys: [],
  timed: true,
  color: (c) => (isUp(c) ? "amber" : "indigo"),
  status: (c) => {
    const ev = eventOf(c);
    return ev ? fmtRelative(c.ctx.hass, ev.t, c.ctx.now) : null;
  },
  slots: (c) => {
    const ev = eventOf(c);
    const icon = isUp(c) ? "mdi:white-balance-sunny" : "mdi:weather-night";
    const plot = div("pcurve psun");
    plot.innerHTML = `<svg></svg><div class="tip"></div>`;
    const sun = c.host.sun;
    c.host.hover(
      plot,
      (ev) => {
        const day = sun._day;
        if (!day) return null;
        const rect = plot.getBoundingClientRect();
        return timeAt(day, ev.clientX - rect.left, sun._plotW || rect.width);
      },
      (t) => showHover(sun, plot, t),
    );
    return {
      lead: leadEl(c.ctx, c.ent, { ...c.m, look: { ...c.m.look, icon, picture: null } }, 40),
      name: ev ? defaultLabel(c.ctx.hass, ev.key) : undefined,
      value: ev ? wordValue(fmtEvent(c.ctx.hass, ev.t)) : null,
      word: false,
      picture: plot,
    };
  },
  // the curve follows the minute and the plot's size
  live: (c, row) => {
    const plot = row.querySelector<HTMLElement>(":scope > .pbody > .psun");
    const day = dayOf(c);
    if (!plot || !day) return;
    const w = plot.clientWidth,
      h = plot.clientHeight;
    const day0 = cssColor(c.ent.color ? c.m.look.color : "light-blue", "var(--light-blue-color)");
    const key = `${w}x${h}|${Math.floor(c.ctx.now / 60e3)}|${day0}`;
    if (plot.dataset.key === key) return;
    plot.dataset.key = key;
    const look = {
      day: day0,
      night: "var(--indigo-color)",
      sun: "var(--amber-color)",
      tooltip: true,
    };
    const draw = () => drawCurve(c.host.sun, plot, day, new Date(c.ctx.now), look, CURVE_H);
    // the plot starts behind the texts: by SUN_BLEED, and by the empty band the curve keeps above
    // a low sun's peak, so the peak sits as close under the time in December as in June. Found
    // from the height without a lift, so it settles at once
    const { headroom } = draw();
    const lift = parseFloat(plot.style.getPropertyValue("--psun-lift")) || 0;
    const room = plot.clientHeight - lift - CURVE_TOP - CURVE_BOTTOM;
    const band = headroom < 1 ? (headroom * (room + SUN_BLEED)) / (1 - headroom) : 0;
    const next = Math.max(0, Math.round(SUN_BLEED + band));
    if (next !== lift) {
      plot.style.setProperty("--psun-lift", `${next}px`);
      draw();
      plot.dataset.key = `${plot.clientWidth}x${plot.clientHeight}|${Math.floor(c.ctx.now / 60e3)}|${day0}`;
    }
    if (c.host.hoverT !== null) showHover(c.host.sun, plot, c.host.hoverT);
  },
  extra: (c) => [Math.floor(c.ctx.now / 60e3)],
};
