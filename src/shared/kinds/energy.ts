// The kinds of the home's energy, set with `poster` (a grid meter, an inverter and a dishwasher are
// all power sensors): the grid (a power line, its dots flowing in or out), solar (the output,
// today's energy and production), the home battery (the battery kind with its power: + charging),
// the car (its charge and range, what it found on the car's device) and an appliance (running above
// a threshold: for how long, and the energy of this run). W / kW as the power flow card writes
// them, its energy colours.
import { COLORS } from "../flow-tree/constants.ts";
import { setRate } from "../flow/dom.ts";
import { unitOf, type FmtValue } from "../entity/model.ts";
import { leadEl, secondaryEl } from "../entity/render/lead.ts";
import { fmtDuration, fmtNumber } from "../format.ts";
import type { HassEntity, HomeAssistant } from "../ha.ts";
import { t } from "../i18n.ts";
import { powerParts, UNIT_TO_W, wattsOf } from "../power.ts";
import { isNum } from "../util.ts";
import { div, wordValue } from "./dom.ts";
import { BATTERY_RULES } from "./rules.ts";
import { todayOf } from "./sensors.ts";
import type { Kind, KindCtx, Read } from "./types.ts";

// a power sensor, for an input the editor lists
const POWER = [{ domains: ["sensor"], deviceClasses: ["power"] }] as const;
// a power sensor, as the editor offers one (a template's by its unit)
const POWER_OFFERS = { deviceClasses: ["power"], units: ["W", "kW", "MW"] } as const;

// below this a flow counts as none (sensor noise)
const IDLE_W = 10;
const watts = (r: Read | null) => (r ? wattsOf(r.ent, r.m) : null);
const power = (c: KindCtx, w: number | null): FmtValue | null =>
  w === null ? null : powerParts(c.ctx.hass, w);
// an amount of energy: two decimals below 10 kWh, one from there
const fmtKwh = (hass: HomeAssistant | undefined, kwh: number) =>
  `${fmtNumber(hass, kwh, kwh < 10 ? 2 : 1)} kWh`;

// the dots of a line: they flow forward (in) or back (out), faster the more power flows (one
// crossing in 3 s as built, the power scales the playback rate)
const lineEl = (cls: string, n = 6) => {
  const el = div(`pline ${cls}`);
  for (let i = 0; i < n; i++) {
    const dot = document.createElement("i");
    dot.style.setProperty("--p0", String(i / n));
    el.appendChild(dot);
  }
  return el;
};
const flow = (el: Element | null, w: number | null) => {
  if (!(el instanceof HTMLElement)) return;
  const on = w !== null && Math.abs(w) >= IDLE_W;
  el.classList.toggle("idle", !on);
  el.classList.toggle("back", on && (w as number) < 0);
  if (on) setRate(el, 0.5 + Math.min(2.5, Math.abs(w as number) / 2000));
};

// ----- grid: + importing, − exporting -----

const gridW = (c: KindCtx) => {
  const imp = c.input("import"),
    exp = c.input("export");
  if (imp || exp) return (watts(imp) ?? 0) - (watts(exp) ?? 0);
  return watts({ ent: c.ent, m: c.m });
};

export const GRID: Kind = {
  name: "grid",
  reads: ["sensor", "input_number", "number"],
  readsText: "a power sensor (+ importing, − exporting)",
  offers: POWER_OFFERS,
  entityless: true,
  keys: ["import", "export"],
  // without an entity, the import meter is what a tap opens
  main: (entity, _raw, opts) =>
    entity || typeof opts.import !== "string" ? {} : { entity: opts.import },
  inputs: [
    { key: "import", accepts: POWER },
    { key: "export", accepts: POWER },
  ],
  color: (c) => {
    const w = gridW(c);
    return w === null || Math.abs(w) < IDLE_W ? null : w > 0 ? COLORS.gridIn : COLORS.gridOut;
  },
  status: (c) => {
    if (c.m.look.label) return c.m.look.label;
    const w = gridW(c);
    if (w === null || Math.abs(w) < IDLE_W) return null;
    return t(c.ctx.hass, w > 0 ? "kind.grid.importing" : "kind.grid.exporting");
  },
  slots: (c) => {
    const v = power(c, gridW(c));
    return {
      lead: leadEl(
        c.ctx,
        c.ent,
        { ...c.m, look: { ...c.m.look, icon: c.m.look.icon ?? "mdi:transmission-tower" } },
        c.leadSize,
      ),
      ...(v ? { value: v, word: false } : {}),
    };
  },
  // its power line behind the card, the flow running in its direction
  visual: { type: "line" },
  tileVisual: false,
  draws: ["line"],
  backdrop: {
    key: (c) => (c.place.visual && c.place.visual.type === "line" ? "grid" : ""),
    build: () => lineEl("grid"),
    update: (el, c) => flow(el, gridW(c)),
  },
};

// ----- solar: the output, today's energy and production -----

export const SOLAR: Kind = {
  name: "solar",
  reads: ["sensor", "input_number", "number"],
  readsText: "a power sensor",
  offers: POWER_OFFERS,
  keys: ["today"],
  // today's production below the texts
  visual: { type: "sparkline", hours: "today" },
  inputs: [
    {
      key: "today",
      find: {
        domains: ["sensor"],
        deviceClasses: ["energy"],
        translationKey: /today|daily|(?<!yester)day/i,
        needsKey: true,
      },
    },
  ],
  history: (_opts, entity) => (entity ? [entity] : []),
  color: () => COLORS.solar,
  slots: (c) => {
    const w = watts({ ent: c.ent, m: c.m });
    const v = power(c, w);
    const today = c.input("today");
    return {
      lead: leadEl(
        c.ctx,
        c.ent,
        { ...c.m, look: { ...c.m.look, icon: c.m.look.icon ?? "mdi:solar-power-variant" } },
        c.leadSize,
      ),
      ...(v ? { value: v, word: false } : {}),
      ...(today
        ? {
            secondary: today.m.model.avail
              ? secondaryEl([{ text: t(c.ctx.hass, "kind.solar.today", { v: today.m.fmt.text }) }])
              : null,
          }
        : {}),
    };
  },
  extra: (c) => [c.ctx.fetched, todayOf(c).length],
};

// ----- battery: its charge as a strip; with its power a home battery (+ charging) -----

const batteryW = (c: KindCtx) => {
  const pw = c.input("power"),
    ch = c.input("charge"),
    dis = c.input("discharge");
  if (pw) return watts(pw);
  if (ch || dis) return (watts(ch) ?? 0) - (watts(dis) ?? 0);
  return null;
};
const isHome = (c: KindCtx) => !!(c.input("power") || c.input("charge") || c.input("discharge"));
// the charge over ten segments, each 0 to 1: 42 % is four full ones and a fifth a fifth full
export const segments = (pct: number | null, n = 10): number[] => {
  const f = (Math.max(0, Math.min(100, pct ?? 0)) / 100) * n;
  return Array.from({ length: n }, (_, i) => Math.max(0, Math.min(1, f - i)));
};
// the strip of segments with a battery's tip; the first one not full pulses while power flows
export const stripEl = (pct: number | null, flowing: boolean) => {
  const el = div("pstrip");
  el.classList.toggle("flow", flowing);
  const fills = segments(pct);
  const part = fills.findIndex((f) => f < 1);
  fills.forEach((f, i) => {
    const seg = document.createElement("i");
    seg.style.setProperty("--f", String(Math.round(f * 1000) / 1000));
    if (i === part) seg.className = "part";
    el.appendChild(seg);
  });
  el.appendChild(document.createElement("b")).className = "tip";
  return el;
};

export const BATTERY: Kind = {
  name: "battery",
  deviceClasses: ["battery"],
  reads: ["sensor", "input_number", "number"],
  readsText: "a battery sensor (%)",
  fills: ["secondary"],
  offers: { deviceClasses: ["battery"], units: ["%"] },
  keys: ["power", "charge", "discharge"],
  rules: BATTERY_RULES,
  // its charge as segments below the texts, the one charging pulsing
  visual: { type: "segments" },
  draws: ["segments"],
  inputs: [
    { key: "power", find: { domains: ["sensor"], deviceClasses: ["power"] } },
    { key: "charge", accepts: POWER },
    { key: "discharge", accepts: POWER },
  ],
  status: (c) => {
    if (c.m.look.label || !isHome(c)) return c.m.look.label;
    const w = batteryW(c);
    if (w === null || Math.abs(w) < IDLE_W) return null;
    return t(c.ctx.hass, w > 0 ? "kind.battery.charging" : "kind.battery.discharging");
  },
  color: (c) => {
    const w = isHome(c) ? batteryW(c) : null;
    return w === null || Math.abs(w) < IDLE_W ? null : w > 0 ? COLORS.battIn : COLORS.battOut;
  },
  slots: (c) => {
    if (!isHome(c)) return { picture: stripEl(c.m.model.num, false) };
    const w = batteryW(c);
    const v = power(c, w);
    return {
      secondary: v ? secondaryEl([{ text: v.text }]) : null,
      picture: stripEl(c.m.model.num, w !== null && Math.abs(w) >= IDLE_W),
    };
  },
};

// ----- car: its charge and range, charging, plugged in, away -----

const isOn = (r: Read | null) => {
  if (!r?.m.st) return false;
  if (r.m.model.num !== null && r.ent.entity?.startsWith("sensor.")) return r.m.model.num > 0;
  return r.m.st.state === "on";
};
export const CAR: Kind = {
  name: "car",
  reads: ["sensor", "input_number", "number"],
  readsText: "the car's battery (%)",
  fills: ["secondary"],
  offers: { deviceClasses: ["battery"], units: ["%"] },
  keys: ["range", "charging", "plugged", "location"],
  rules: BATTERY_RULES,
  inputs: [
    { key: "range", find: { domains: ["sensor"], deviceClasses: ["distance"] } },
    { key: "plugged", find: { domains: ["binary_sensor"], deviceClasses: ["plug"] } },
    {
      key: "charging",
      find: { domains: ["binary_sensor"], deviceClasses: ["battery_charging"] },
      // or a wallbox's power: charging above 0
      accepts: [
        { domains: ["binary_sensor"], deviceClasses: ["battery_charging"] },
        { domains: ["sensor"], deviceClasses: ["power"] },
      ],
    },
    { key: "location", find: { domains: ["device_tracker"] } },
  ],
  status: (c) => {
    if (c.m.look.label) return c.m.look.label;
    if (isOn(c.input("charging"))) return t(c.ctx.hass, "kind.battery.charging");
    if (isOn(c.input("plugged"))) return t(c.ctx.hass, "kind.car.plugged");
    const loc = c.input("location");
    if (loc?.m.st && loc.m.st.state !== "home")
      return c.ctx.hass?.formatEntityState?.(loc.m.st) ?? loc.m.st.state;
    return null;
  },
  slots: (c) => {
    const range = c.input("range");
    return {
      lead: leadEl(
        c.ctx,
        c.ent,
        { ...c.m, look: { ...c.m.look, icon: c.m.look.icon ?? "mdi:car-electric" } },
        c.leadSize,
      ),
      ...(range
        ? { secondary: range.m.model.avail ? secondaryEl([{ text: range.m.fmt.text }]) : null }
        : {}),
    };
  },
};

// ----- appliance: running above a threshold, for how long, the energy of this run -----

const APPLIANCE_STYLES = ["pump", "washer", "dryer", "dishwasher", "heat_pump"] as const;
const ICONS: Record<(typeof APPLIANCE_STYLES)[number], string> = {
  pump: "mdi:pump",
  washer: "mdi:washing-machine",
  dryer: "mdi:tumble-dryer",
  dishwasher: "mdi:dishwasher",
  heat_pump: "mdi:heat-pump",
};
const thresholdOf = (c: KindCtx) =>
  isNum(c.opts.running_above) ? Number(c.opts.running_above) : 5;
type ApplianceStyle = (typeof APPLIANCE_STYLES)[number];
// this run: since the history last fell to the threshold (`whole`: it never did, the run started
// before the window), and its energy (W over time)
const runOf = (c: KindCtx, st: HassEntity | undefined) => {
  const w = watts({ ent: c.ent, m: c.m });
  const limit = thresholdOf(c);
  if (w === null || w <= limit) return null;
  const scale = UNIT_TO_W[unitOf(c.ent, st)] ?? 1;
  const pts = (c.ent.entity ? (c.ctx.series.get(c.ent.entity) ?? []) : []).filter(
    (p) => p.v !== null,
  );
  let i = pts.length - 1;
  while (i >= 0 && (pts[i].v as number) * scale > limit) i--;
  const run = pts.slice(i + 1);
  const start = run[0]?.t ?? c.ctx.now;
  let wh = 0;
  for (let k = 0; k < run.length; k++) {
    const next = run[k + 1]?.t ?? c.ctx.now;
    wh += ((run[k].v as number) * scale * (next - run[k].t)) / 3600e3;
  }
  return { since: (c.ctx.now - start) / 1000, kwh: wh / 1000, whole: i < 0 && run.length > 0 };
};

// an appliance kind: the generic one (a plug), or a device of its own (a washer's drum, a pump's
// impeller)
// what an appliance reports beside its power, found on its device: the time left (a duration, or
// the time it finishes) and its phase (an enum's or a select's state: Washing, Rinsing …), its status
const REMAINING = { domains: ["sensor"], deviceClasses: ["duration", "timestamp"] } as const;
const STATUS_OF = {
  domains: ["sensor"],
  deviceClasses: ["enum"],
  translationKey: /status|state|operation|program|phase/i,
  needsKey: true,
} as const;
// the seconds left: a duration in its unit, or until a timestamp (none: not running down)
const secondsLeft = (r: Read | null): number | null => {
  const st = r?.m.st;
  if (!st) return null;
  if (st.attributes.device_class === "timestamp") {
    const at = Date.parse(st.state);
    return Number.isFinite(at) ? Math.max(0, (at - Date.now()) / 1000) : null;
  }
  if (!isNum(st.state)) return null;
  const unit = String(st.attributes.unit_of_measurement ?? "min");
  const per = { s: 1, min: 60, h: 3600, d: 86400 }[unit] ?? 60;
  return Number(st.state) * per;
};

const applianceKind = (name: string, style: ApplianceStyle | null): Kind => ({
  name,
  reads: ["sensor", "input_number", "number"],
  readsText: "a power sensor",
  offers: POWER_OFFERS,
  keys: ["running_above", "remaining", "phase"],
  fills: ["value", "secondary"],
  iconName: style ? ICONS[style] : "mdi:power-plug",
  inputs: [
    {
      key: "remaining",
      find: REMAINING,
      accepts: [{ ...REMAINING, units: ["s", "min", "h", "d"] }],
    },
    {
      key: "phase",
      find: STATUS_OF,
      accepts: [{ domains: ["sensor", "select", "input_select"] }],
    },
  ],
  history: (_opts, entity) => (entity ? [entity] : []),
  timed: true,
  // its phase where it reports one (Washing, Rinsing …), else whether it runs
  status: (c) => {
    if (c.m.look.label) return c.m.look.label;
    const own = c.input("phase")?.m.st;
    if (own && own.state !== "unavailable" && own.state !== "unknown")
      return c.ctx.hass?.formatEntityState?.(own) ?? own.state;
    const w = watts({ ent: c.ent, m: c.m });
    return w !== null && w > thresholdOf(c) ? t(c.ctx.hass, "kind.appliance.running") : null;
  },
  slots: (c) => {
    const run = runOf(c, c.m.st);
    // the time it has left, while running down: in place of how long it has run
    const left = secondsLeft(c.input("remaining"));
    // (also for a run longer than the history: the device knows how long it has left)
    if (left !== null && left > 0 && run) {
      const kwh = fmtKwh(c.ctx.hass, run.kwh);
      return {
        value: wordValue(
          t(c.ctx.hass, "kind.appliance.left", {
            d: fmtDuration(c.ctx.hass, Math.max(60, left), true),
          }),
        ),
        word: false,
        secondary:
          run.kwh > 0
            ? secondaryEl([{ text: t(c.ctx.hass, "kind.appliance.this_run", { v: kwh }) }])
            : null,
      };
    }
    if (!run) {
      return { value: wordValue(t(c.ctx.hass, "control.off")), word: true, secondary: null };
    }
    const kwh = fmtKwh(c.ctx.hass, run.kwh);
    // a run longer than the history has no length to tell: its power, and the window's energy
    if (run.whole)
      return {
        value: power(c, watts({ ent: c.ent, m: c.m })),
        word: false,
        secondary: secondaryEl([
          {
            text: t(c.ctx.hass, "kind.appliance.last_hours", {
              v: kwh,
              h: String(Math.round(run.since / 3600)),
            }),
          },
        ]),
      };
    const d = fmtDuration(c.ctx.hass, Math.max(60, run.since), true);
    return {
      value: wordValue(d),
      word: false,
      secondary:
        run.kwh > 0
          ? secondaryEl([{ text: t(c.ctx.hass, "kind.appliance.this_run", { v: kwh }) }])
          : null,
    };
  },
  lead: {
    key: () => style ?? "power",
    build: (c) => {
      const icon = c.m.look.icon ?? (style ? ICONS[style] : "mdi:power-plug");
      const el = leadEl(
        c.ctx,
        c.ent,
        { ...c.m, look: { ...c.m.look, icon, picture: null } },
        c.leadSize,
      );
      // a pump's impeller and a heat pump's fan turn; a drum shakes
      el.classList.add(style === "pump" || style === "heat_pump" ? "pfan" : "probot");
      return el;
    },
    update: (el, c) => {
      const w = watts({ ent: c.ent, m: c.m });
      const on = w !== null && w > thresholdOf(c);
      el.classList.toggle("spin", on && el.classList.contains("pfan"));
      el.classList.toggle("working", on && el.classList.contains("probot"));
    },
  },
  extra: (c) => [c.ctx.fetched, Math.floor(c.ctx.now / 60e3)],
});
export const APPLIANCE = applianceKind("appliance", null);
export const APPLIANCE_KINDS = Object.fromEntries(
  APPLIANCE_STYLES.map((s) => [s, applianceKind(s, s)]),
);
