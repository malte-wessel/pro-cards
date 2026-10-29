// The weather kind: a weather entity. The condition's picture (Home Assistant's weather pictures,
// or mdi icons with `show_entity_picture: false`), the condition as the status unless a matching
// rule has a label, the temperature large with today's high and low under it, and the next hours
// of the hourly forecast (`hours_to_show`, 12 by default) as the curve along the bottom.
import { plotEl } from "../entity/render/blocks.ts";
import { leadEl, secondaryEl } from "../entity/render/lead.ts";
import { fmtNumber } from "../format.ts";
import { conditionIcon, conditionText, isNight } from "../weather/conditions.ts";
import {
  dailyTypeOf,
  daysOf,
  hoursOf,
  isTodayEntry,
  supportsForecast,
} from "../weather/forecast.ts";
import { conditionEl } from "../weather/icon.ts";
import { WEATHER_RULES } from "./rules.ts";
import type { Kind, KindCtx } from "./types.ts";

const HOURS = 12;

// today's high and low from the daily forecast
const hiLo = (c: KindCtx): string | null => {
  const type = dailyTypeOf(c.m.st);
  if (!type) return null;
  const today = daysOf(c.host.forecast(type), type, 2).find((d) => isTodayEntry(d.t, c.ctx.now));
  if (!today || today.hi === null || today.lo === null) return null;
  return `${fmtNumber(c.ctx.hass, today.hi, 0)}° / ${fmtNumber(c.ctx.hass, today.lo, 0)}°`;
};

// the next hours' temperatures, from the start of the current hour
const hours = (c: KindCtx) => {
  if (!supportsForecast(c.m.st, "hourly")) return [];
  return hoursOf(c.host.forecast("hourly"), c.ctx.now, c.hours ?? HOURS).flatMap((h) =>
    h.hi === null ? [] : [{ t: h.t, v: h.hi, s: String(h.hi) }],
  );
};

// the condition's lead: its picture alone, or its mdi icon (a rule's icon wins) in the circle
const lead = (c: KindCtx) => {
  const state = c.m.st?.state;
  const night = isNight(c.ctx.hass);
  const icon = c.m.look.icon ?? conditionIcon(state, night);
  const el = leadEl(c.ctx, c.ent, { ...c.m, look: { ...c.m.look, icon, picture: null } }, 40);
  if (c.ent.picture && c.m.model.avail && !c.m.look.icon) {
    const pic = conditionEl({ base: "hass", map: {} }, state, night, null);
    if (pic.tagName !== "HA-ICON") {
      el.classList.add("picture");
      el.querySelector(".shape")?.replaceChildren(pic);
    }
  }
  return el;
};

export const WEATHER: Kind = {
  name: "weather",
  domains: ["weather"],
  reads: ["weather"],
  readsText: "a weather entity",
  keys: [],
  rules: WEATHER_RULES,
  // the temperature (its unit is the entity's temperature_unit); Home Assistant's pictures unless
  // the card says show_entity_picture: false
  main: (_entity, raw) => ({
    attribute: "temperature",
    ...(raw.show_entity_picture === undefined ? { show_entity_picture: true } : {}),
  }),
  watch: ["sun.sun"],
  forecast: ["hourly", "daily", "twice_daily"],
  status: (c) =>
    c.m.look.label ?? (c.m.st ? conditionText(c.ctx.hass, c.m.st.state) || null : null),
  slots: (c) => {
    const h = hours(c),
      hl = hiLo(c);
    // the curve is there from the start: it fills in once the forecast has arrived
    const t0 = h[0]?.t ?? c.ctx.now;
    const picture = supportsForecast(c.m.st, "hourly")
      ? plotEl(c.ctx, c.ent, 0, c.m, {
          kind: "sparkline",
          series: h,
          window: { t0, t1: h.length > 1 ? h[h.length - 1].t : t0 + (c.hours ?? HOURS) * 3600e3 },
          loaded: c.host.forecast("hourly") !== undefined,
        })
      : null;
    return { lead: lead(c), secondary: hl ? secondaryEl([{ text: hl }]) : null, picture };
  },
  extra: (c) => [
    c.host.forecast("hourly"),
    c.host.forecast("daily"),
    c.host.forecast("twice_daily"),
    Math.floor(c.ctx.now / 3600e3),
    isNight(c.ctx.hass),
  ],
};
