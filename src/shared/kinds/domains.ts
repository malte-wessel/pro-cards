// The domain kinds of the home's devices that need no drawing of their own beyond a lead or a
// glow: light, fan, climate, lock, alarm panel, person. Each brings its controls (`control: false`
// drops them) and fills its places from the entity's state.
import {
  placementsOf,
  type ControlKind,
  type ControlPosition,
  type Placement,
} from "../entity/control.ts";
import { numAttr as num } from "../entity/look.ts";
import type { FmtValue } from "../entity/model.ts";
import { leadEl, secondaryEl } from "../entity/render/lead.ts";
import { setRate } from "../flow/dom.ts";
import { fmtDuration, fmtNumber } from "../format.ts";
import type { HassEntity } from "../ha.ts";
import { t, type StringKey } from "../i18n.ts";
import { div, pctValue } from "./dom.ts";
import { IMAGE_BLUR } from "./places.ts";
import { attention } from "./rules.ts";
import type { Kind, KindCtx } from "./types.ts";

export const place = (kind: ControlKind, position: ControlPosition): Placement => ({
  kind,
  position,
  small: false,
});
// the state as Home Assistant writes it (On, Locked, Armed away)
export const stateText = (c: KindCtx) => {
  const st = c.m.st;
  if (!st) return null;
  try {
    return c.ctx.hass?.formatEntityState?.(st) ?? st.state;
  } catch {
    return st.state;
  }
};
// a percentage as the large value, "Off" (the state) while off
const percent = (c: KindCtx, p: number | null): FmtValue | null =>
  c.m.st?.state !== "on" || p === null ? null : pctValue(c.ctx.hass, p);

// ----- light: a glow in its colour, as strong as its brightness -----

const brightness = (st: HassEntity | undefined) => {
  const b = num(st, "brightness");
  return st?.state === "on" && b !== null ? Math.round((b / 255) * 100) : null;
};
const rgbOf = (st: HassEntity | undefined) => {
  const c = st?.attributes?.rgb_color;
  return Array.isArray(c) && c.length === 3 && c.every((x) => typeof x === "number")
    ? `rgb(${c.join(", ")})`
    : null;
};
// the light's own colour while it is on
const lightColor = (st: HassEntity | undefined) => (st?.state === "on" ? rgbOf(st) : null);

export const LIGHT: Kind = {
  name: "light",
  domains: ["light"],
  reads: ["light"],
  readsText: "a light",
  keys: [],
  controls: [place("toggle", "end"), place("slider", "block")],
  // lit from below in its colour unless the card draws another visual
  visual: { type: "glow" },
  color: (c) => lightColor(c.m.st),
  stateColor: (st) => lightColor(st),
  status: (c) => c.m.look.label ?? stateText(c),
  slots: (c) => {
    const v = percent(c, brightness(c.m.st));
    return v ? { value: v, word: false } : {};
  },
  // its glow (its default visual) as strong as its brightness, dark while off
  level: (c) => (c.m.st?.state === "on" ? (brightness(c.m.st) ?? 100) / 100 : 0),
  extra: (c) => [String(c.m.st?.attributes?.rgb_color), num(c.m.st, "brightness")],
};

// ----- fan: its blades spinning at its speed -----

const speed = (st: HassEntity | undefined) =>
  st?.state === "on" ? (num(st, "percentage") ?? 100) : null;

export const FAN: Kind = {
  name: "fan",
  domains: ["fan"],
  reads: ["fan"],
  readsText: "a fan",
  keys: [],
  controls: [place("segments", "end")],
  status: (c) => c.m.look.label ?? stateText(c),
  slots: (c) => {
    const v = percent(c, num(c.m.st, "percentage"));
    return v ? { value: v, word: false } : {};
  },
  lead: {
    key: () => "fan",
    build: (c) => {
      const el = leadEl(
        c.ctx,
        c.ent,
        { ...c.m, look: { ...c.m.look, icon: c.m.look.icon ?? "mdi:fan", picture: null } },
        c.leadSize,
      );
      el.classList.add("pfan");
      return el;
    },
    // one turn a second as built; the speed scales the rate (0.4 to 2 turns a second)
    update: (el, c) => {
      const s = speed(c.m.st);
      el.classList.toggle("spin", !!s);
      if (s) setRate(el, 0.4 + (1.6 * s) / 100);
    },
  },
};

// ----- climate: the current temperature, the target, warm or cool -----

const ACTIONS: Record<string, StringKey> = {
  heating: "kind.climate.heating",
  cooling: "kind.climate.cooling",
  idle: "kind.climate.idle",
  off: "control.off",
  drying: "kind.climate.drying",
  fan: "kind.climate.fan",
};
const actionOf = (st: HassEntity | undefined) => {
  const a = st?.attributes?.hvac_action;
  return typeof a === "string" ? a : null;
};
// warm while it heats, cool while it cools
const climateColor = (st: HassEntity | undefined) => {
  const a = actionOf(st);
  if (a === "heating") return "var(--state-climate-heat-color, var(--deep-orange-color))";
  if (a === "cooling") return "var(--state-climate-cool-color, var(--blue-color))";
  return null;
};
const tempUnit = (c: KindCtx) => c.ctx.hass?.config?.unit_system?.temperature ?? "°C";

export const CLIMATE: Kind = {
  name: "climate",
  domains: ["climate"],
  reads: ["climate"],
  readsText: "a climate entity",
  keys: [],
  controls: [place("stepper", "end")],
  main: () => ({ attribute: "current_temperature" }),
  color: (c) => climateColor(c.m.st),
  stateColor: (st) => climateColor(st),
  status: (c) => {
    if (c.m.look.label) return c.m.look.label;
    const a = actionOf(c.m.st);
    return a && ACTIONS[a] ? t(c.ctx.hass, ACTIONS[a]) : stateText(c);
  },
  slots: (c) => {
    const st = c.m.st,
      unit = tempUnit(c);
    const target = num(st, "temperature");
    const value = c.m.fmt.unit ? undefined : { ...c.m.fmt, unit };
    // a stepper shows the target itself
    const stepper = placementsOf(c.ent, "poster").some((p) => p.kind === "stepper");
    return {
      ...(value ? { value } : {}),
      ...(stepper
        ? {}
        : {
            secondary:
              target === null
                ? null
                : secondaryEl([{ text: `→ ${fmtNumber(c.ctx.hass, target, 1)} ${unit}` }]),
          }),
    };
  },
  // its glow: warm while heating, cool while cooling
  visual: { type: "glow" },
  glow: {
    key: () => "climate",
    build: () => div("pclimate"),
    update: (el, c) => {
      const a = actionOf(c.m.st);
      el.classList.toggle("heating", a === "heating");
      el.classList.toggle("cooling", a === "cooling");
    },
  },
};

// ----- lock: the padlock held to lock or unlock (its icon's hold) -----

export const LOCK: Kind = {
  name: "lock",
  domains: ["lock"],
  reads: ["lock"],
  readsText: "a lock",
  keys: [],
  iconActions: () => ({ hold: { action: "toggle" } }),
  rules: attention("jammed"),
};

// ----- alarm panel: its icon held to arm (away) or disarm, red while triggered -----

export const ALARM: Kind = {
  name: "alarm_control_panel",
  domains: ["alarm_control_panel"],
  reads: ["alarm_control_panel"],
  readsText: "an alarm control panel",
  keys: [],
  // a panel that wants a code is armed in Home Assistant's own dialog: no hold on its icon
  iconActions: (st) =>
    st?.attributes?.code_format || st?.attributes?.code_arm_required
      ? {}
      : { hold: { action: "toggle" } },
  rules: attention("triggered"),
  // its glow: a red pulse from the edges while triggered
  visual: { type: "glow" },
  glow: {
    key: () => "alarm",
    build: () => div("palarm"),
    update: (el, c) => el.classList.toggle("on", c.m.st?.state === "triggered"),
  },
};

// ----- person: their photo in the icon and blurred behind the card, the zone, since when -----

export const PERSON: Kind = {
  name: "person",
  domains: ["person"],
  reads: ["person", "device_tracker"],
  readsText: "a person or a device tracker",
  keys: [],
  timed: true,
  // their photo in the icon, and blurred behind the card (the icon shows it sharp)
  icon: { type: "image" },
  visual: { type: "image", blur: IMAGE_BLUR },
  slots: (c) => {
    const st = c.m.st;
    const since = st ? (c.ctx.now - new Date(st.last_changed).getTime()) / 1000 : NaN;
    return {
      secondary: Number.isFinite(since)
        ? secondaryEl([
            {
              text: t(c.ctx.hass, "kind.person.since", {
                t: fmtDuration(c.ctx.hass, Math.max(60, since), true),
              }),
            },
          ])
        : null,
    };
  },
  extra: (c) => [Math.floor(c.ctx.now / 60e3)],
};
