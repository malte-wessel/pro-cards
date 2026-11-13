// The kinds of the home's sensors and plugs, detected by their device class: a door or a window
// (when it was open), motion (when there was some, a glow on a tile while there is), a safety
// sensor (a leak, smoke: a red pulse from the edges while it alerts), a temperature, humidity or
// light level (its line, today's low and high), and a plug (its toggle, its power).
import { fmtNumber, type FmtValue } from "../entity/model.ts";
import { secondaryEl } from "../entity/render/lead.ts";
import type { Point } from "../history.ts";
import { powerParts, wattsOf } from "../power.ts";
import { timeZoneOf } from "../format.ts";
import { t } from "../i18n.ts";
import { startOfDay } from "../util.ts";
import { alertGlow, sinceEl } from "./dom.ts";
import { place } from "./domains.ts";
import { ILLUMINANCE_RULES, attention } from "./rules.ts";
import type { Kind, KindCtx } from "./types.ts";

// ----- shared -----

// the points of the card's entity since midnight
export const todayOf = (c: KindCtx): Point[] => {
  const id = c.ent.entity;
  const t0 = startOfDay(c.ctx.now, timeZoneOf(c.ctx.hass));
  return (id ? (c.ctx.series.get(id) ?? []) : []).filter((p) => p.t >= t0);
};
// the lowest and the highest of the points' values (null: none), the value now among them
export const extentOf = (
  pts: readonly { v: number | null }[],
  now: number | null = null,
): { lo: number; hi: number } | null => {
  let lo = Infinity,
    hi = -Infinity;
  for (const v of [...pts.map((p) => p.v), now]) {
    if (v === null || !Number.isFinite(v)) continue;
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  }
  return lo <= hi ? { lo, hi } : null;
};

// ----- a binary sensor: its state as Home Assistant words it, for how long -----

const binary = (
  name: string,
  deviceClasses: readonly string[],
  readsText: string,
): Pick<
  Kind,
  "name" | "deviceClasses" | "reads" | "readsText" | "offers" | "keys" | "fills" | "timed" | "extra"
> => ({
  name,
  deviceClasses,
  reads: ["binary_sensor"],
  readsText,
  offers: { deviceClasses, units: [] },
  keys: [],
  fills: ["secondary"],
  timed: true,
  extra: (c) => [Math.floor(c.ctx.now / 60e3)],
});

// a door, a window, a garage door: when it was open below the texts
export const OPENING: Kind = {
  ...binary(
    "opening",
    ["door", "window", "garage_door", "opening"],
    "a door, window or opening sensor",
  ),
  visual: { type: "strip", variant: "edge" },
  tileVisual: false,
  slots: (c) => ({ secondary: sinceEl(c) }),
};

// motion, occupancy, presence: when there was motion; a tile glows while there is
export const MOTION: Kind = {
  ...binary(
    "motion",
    ["motion", "occupancy", "presence"],
    "a motion, occupancy or presence sensor",
  ),
  visual: { type: "strip", variant: "edge" },
  tileVisual: { type: "glow" },
  slots: (c) => ({ secondary: sinceEl(c) }),
};

// a leak, smoke, gas, a problem: red and pulsing from the edges while it alerts, for how long
export const SAFETY: Kind = {
  ...binary(
    "safety",
    ["moisture", "smoke", "gas", "carbon_monoxide", "safety", "problem", "tamper"],
    "a leak, smoke, gas, safety or problem sensor",
  ),
  rules: attention("on"),
  visual: { type: "glow" },
  glow: alertGlow((c) => c.m.st?.state === "on"),
  slots: (c) => ({ secondary: c.m.st?.state === "on" ? sinceEl(c) : null }),
};

// ----- a measurement: its line, today's low and high -----

const measure = (name: string, unit: readonly string[], readsText: string): Kind => ({
  name,
  deviceClasses: [name],
  reads: ["sensor", "input_number", "number"],
  readsText,
  offers: { deviceClasses: [name], units: unit },
  keys: [],
  // its line below the texts (a tile stays as it is; the line fetches its own history)
  visual: { type: "sparkline" },
  tileVisual: false,
});
// today's low and high under a poster's value ("Today 19.1–21.6 °C"), written as the value is; a
// tile's one line keeps to the value and the status
const lowHigh = (c: KindCtx) => {
  if (c.card !== "poster" || !c.m.model.avail) return null;
  const e = extentOf(todayOf(c), c.m.model.num);
  if (!e) return null;
  const n = (v: number, unit: boolean) => fmtNumber(c.ctx, c.ent, v, c.m.st, unit);
  // (a dash with room around it below zero: "-3.2 – -1.0 °C", not "-3.2–-1.0 °C")
  const range = `${n(e.lo, false)}${e.lo < 0 ? " – " : "–"}${n(e.hi, true)}`;
  return secondaryEl([{ text: t(c.ctx.hass, "kind.today_range", { range }) }]);
};
const daily = (name: string, unit: readonly string[], readsText: string): Kind => ({
  ...measure(name, unit, readsText),
  fills: ["secondary"],
  // a poster's day back, so today's low and high are there whatever window its line draws (or
  // without a line); a tile fetches nothing for them
  history: (_opts, entity, card) => (card === "poster" && entity ? [entity] : []),
  historyHours: 24,
  slots: (c) => ({ secondary: lowHigh(c) }),
  extra: (c) => [c.ctx.fetched, todayOf(c).length],
});

export const TEMPERATURE = daily("temperature", ["°C", "°F", "K"], "a temperature sensor");
export const HUMIDITY = daily("humidity", ["%"], "a humidity sensor (%)");
// the light level: dark, dim or bright as its word and icon (no colours)
export const ILLUMINANCE: Kind = {
  ...measure("illuminance", ["lx"], "an illuminance sensor (lx)"),
  rules: ILLUMINANCE_RULES,
};

// ----- a plug: its toggle, its power as the value and its history -----

const plugW = (c: KindCtx) => {
  const p = c.input("power");
  return p ? wattsOf(p.ent, p.m) : null;
};
export const PLUG: Kind = {
  name: "plug",
  deviceClasses: ["outlet"],
  reads: ["switch"],
  readsText: "a switch",
  // a switch that names no device class is a plug too, where the card says so
  offers: { deviceClasses: ["outlet"], units: [] },
  keys: ["power"],
  controls: [place("toggle", "end")],
  inputs: [{ key: "power", find: { domains: ["sensor"], deviceClasses: ["power"] } }],
  // its power's history as columns below the texts, where it has one
  visual: { type: "columns" },
  visualInput: "power",
  tileVisual: false,
  slots: (c) => {
    const w = c.m.st?.state === "on" ? plugW(c) : null;
    const v: FmtValue | null = w === null ? null : powerParts(c.ctx.hass, w);
    return v ? { value: v, word: false } : {};
  },
};
