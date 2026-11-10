// Builds the `hass` object the cards expect, backed by the demo world, and wires the
// document-level events HA would normally handle (actions, more-info, navigation, toasts).
import { SONGS, world } from "./world.ts";
import { hsToRgb, kelvinToRgb } from "../../../../src/shared/color.ts";
import { ENTITIES } from "./registry.ts";
import { renderTemplate } from "./templates.ts";
import type {
  ActionConfig,
  ActionKind,
  ForecastMessage,
  HassEntity,
  HomeAssistant,
} from "../../../../src/shared/ha.ts";
import type { MessageBase } from "home-assistant-js-websocket";

// the `config` of a `hass-action` event: the entity plus the action for each gesture
export interface HassActionConfig {
  entity?: string | null;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}
export interface HassActionDetail {
  config?: HassActionConfig;
  action: ActionKind;
}
// what a `render_template` subscription pushes to its callback
export interface TemplateResult {
  result: string;
  listeners: Record<string, never>;
}
// the demo's hass object: HA's interface plus the frontend fields the cards may read
export interface HassSnapshot extends HomeAssistant {
  locale: {
    language: string;
    number_format: string;
    time_format: string;
    time_zone: "local" | "server";
  };
  language: string;
  user: { id: string; name: string; is_admin: boolean };
  themes: { darkMode: boolean };
  formatEntityState: (st: HassEntity, state?: string) => string;
}

declare global {
  interface DocumentEventMap {
    "hass-action": CustomEvent<HassActionDetail>;
    "hass-more-info": CustomEvent<{ entityId?: string }>;
  }
}

const LAT = 51.23,
  LON = 6.78; // Düsseldorf-ish, used by the sun path card
// the id of the demo's logged-in user (Malte); person.malte names it in `user_id`
export const DEMO_USER = "demo-malte";
let toastEl: (HTMLDivElement & { _t?: ReturnType<typeof setTimeout> }) | null = null,
  popEl: HTMLDivElement | null = null;

export const toast = (msg: string) => {
  if (typeof document === "undefined") return;
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.className = "ha-toast";
    document.body.appendChild(toastEl);
  }
  const el = toastEl;
  el.textContent = msg;
  el.classList.add("on");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("on"), 2600);
};

const moreInfo = (entityId: string) => {
  const st = world.get(entityId);
  if (!popEl) {
    const el = document.createElement("div");
    el.className = "ha-more-info";
    el.innerHTML = `<div class="box"><div class="head"><b></b><button aria-label="Close">✕</button></div><div class="state"></div><pre></pre></div>`;
    el.addEventListener("click", (ev) => {
      if (ev.target === el || (ev.target as Element).tagName === "BUTTON")
        el.classList.remove("on");
    });
    document.body.appendChild(el);
    popEl = el;
  }
  popEl.querySelector("b")!.textContent = st?.attributes?.friendly_name || entityId;
  popEl.querySelector(".state")!.textContent = st
    ? `${entityId} · ${st.state}`
    : `${entityId} does not exist in the demo`;
  popEl.querySelector("pre")!.textContent = st ? JSON.stringify(st.attributes, null, 2) : "";
  popEl.classList.add("on");
};

// a binary sensor's on and off as Home Assistant words them for its device class
const BINARY_WORDS: Record<string, [on: string, off: string]> = {
  door: ["Open", "Closed"],
  window: ["Open", "Closed"],
  garage_door: ["Open", "Closed"],
  opening: ["Open", "Closed"],
  motion: ["Detected", "Clear"],
  occupancy: ["Detected", "Clear"],
  presence: ["Home", "Away"],
  moisture: ["Wet", "Dry"],
  smoke: ["Detected", "Clear"],
  gas: ["Detected", "Clear"],
  carbon_monoxide: ["Detected", "Clear"],
  safety: ["Unsafe", "Safe"],
  problem: ["Problem", "OK"],
  tamper: ["Tampering detected", "Clear"],
  plug: ["Plugged in", "Unplugged"],
  battery_charging: ["Charging", "Not charging"],
};
const formatEntityState = (st: HassEntity, state?: string): string => {
  const v = state ?? st.state;
  const words = st.entity_id.startsWith("binary_sensor.")
    ? BINARY_WORDS[st.attributes?.device_class as string]
    : undefined;
  if (words && (v === "on" || v === "off")) return words[v === "on" ? 0 : 1];
  const unit = st.attributes?.unit_of_measurement;
  const n = Number(v);
  if (v !== "" && Number.isFinite(n)) {
    const dec = (String(v).split(".")[1] || "").length;
    const txt = new Intl.NumberFormat("en", {
      minimumFractionDigits: Math.min(dec, 2),
      maximumFractionDigits: Math.min(dec, 2),
    }).format(n);
    return unit ? `${txt} ${unit}` : txt;
  }
  const map: Record<string, string> = {
    on: "On",
    off: "Off",
    home: "Home",
    not_home: "Away",
    open: "Open",
    closed: "Closed",
    opening: "Opening",
    closing: "Closing",
    unavailable: "Unavailable",
    unknown: "Unknown",
    heat: "Heat",
    cool: "Cool",
    auto: "Auto",
    playing: "Playing",
    paused: "Paused",
    locked: "Locked",
    unlocked: "Unlocked",
    locking: "Locking",
    unlocking: "Unlocking",
    idle: "Idle",
    standby: "Standby",
    docked: "Docked",
    cleaning: "Cleaning",
    returning: "Returning",
    above_horizon: "Above horizon",
    below_horizon: "Below horizon",
  };
  if (st.entity_id.startsWith("binary_sensor.")) {
    const dc: string | undefined = st.attributes?.device_class;
    const binary: Record<string, [string, string]> = {
      window: ["Open", "Closed"],
      door: ["Open", "Closed"],
      motion: ["Detected", "Clear"],
      moisture: ["Wet", "Dry"],
      occupancy: ["Detected", "Clear"],
      presence: ["Home", "Away"],
    };
    const bin = binary[String(dc)];
    if (bin) return v === "on" ? bin[0] : bin[1];
  }
  if (st.entity_id.startsWith("scene.") && /^\d{4}-/.test(v)) return "Scene";
  return map[v] || v.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
};

// the target of a service call as the cards pass it (`target: { entity_id }` from the YAML)
export interface ServiceTarget {
  entity_id?: string | string[];
}

// the demo's state machine for service calls: what a real Home Assistant would make the device do
const COVER_OPEN = (pos: number) => (pos <= 0 ? "closed" : "open");
// what the demo's entity registry keeps as an entity's options: its favourites
const REGISTRY_OPTIONS: Record<string, Record<string, Record<string, unknown>>> = {
  "timer.laundry": { timer: { presets: [600, 1800, 2700] } },
  "cover.living_room_blinds": { cover: { favorite_positions: [0, 30, 70, 100] } },
};
// a player's position where it stops or starts again: what it played meanwhile counts
const played = (st: HassEntity) => {
  const pos = Number(st.attributes.media_position),
    at = Date.parse(String(st.attributes.media_position_updated_at));
  if (!Number.isFinite(pos) || !Number.isFinite(at)) return {};
  const now = Date.now();
  const p = st.state === "playing" ? pos + (now - at) / 1000 : pos;
  return { media_position: Math.round(p), media_position_updated_at: new Date(now).toISOString() };
};
// a cover travels as a real one does: opening or closing while it moves, a few percent closer
// every tick (a whole run in about 6 s), held where it is when stopped; one without a position is
// on its way for as long and then arrives
const TRAVEL_TICK_MS = 250;
const TRAVEL_STEP = 4;
const travels = new Map<string, ReturnType<typeof setTimeout>>();
const stopTravel = (id: string) => {
  clearTimeout(travels.get(id));
  travels.delete(id);
};
const travel = (id: string, target: number) => {
  stopTravel(id);
  const st = world.get(id);
  if (!st) return;
  const start = Number(st.attributes.current_position);
  const way = (up: boolean) => (up ? "opening" : "closing");
  if (!Number.isFinite(start)) {
    if (st.state === COVER_OPEN(target)) return;
    world.set(id, way(target > 0));
    travels.set(
      id,
      setTimeout(
        () => {
          travels.delete(id);
          world.set(id, COVER_OPEN(target));
        },
        (100 / TRAVEL_STEP) * TRAVEL_TICK_MS,
      ),
    );
    return;
  }
  if (start === target) {
    world.set(id, COVER_OPEN(target), { current_position: target });
    return;
  }
  const up = target > start;
  let pos = start;
  world.set(id, way(up));
  const step = () => {
    pos = up ? Math.min(target, pos + TRAVEL_STEP) : Math.max(target, pos - TRAVEL_STEP);
    if (pos === target) {
      travels.delete(id);
      world.set(id, COVER_OPEN(pos), { current_position: pos });
    } else {
      world.set(id, way(up), { current_position: pos });
      travels.set(id, setTimeout(step, TRAVEL_TICK_MS));
    }
  };
  travels.set(id, setTimeout(step, TRAVEL_TICK_MS));
};
const setTimeoutState = (id: string, state: string, attrs: Record<string, unknown>, ms: number) =>
  setTimeout(() => world.set(id, state, attrs), ms);
// devices that take a moment to answer, so a control's pending ghost can be seen (the controls
// page's States example); everything else answers at once
const SLOW = new Set(["light.attic"]);
const SLOW_MS = 900;
const callService = async (
  domain: string,
  service: string,
  data: Record<string, unknown> = {},
  target?: ServiceTarget,
) => {
  const ids = ([] as string[]).concat(
    (data.entity_id || target?.entity_id || []) as string | string[],
  );
  if (ids.length && ids.every((id) => SLOW.has(id)))
    await new Promise((resolve) => setTimeout(resolve, SLOW_MS));
  const num = (k: string) => (typeof data[k] === "number" ? (data[k] as number) : Number(data[k]));
  const each = (fn: (id: string, st: HassEntity) => void) =>
    ids.forEach((id) => {
      const st = world.get(id);
      if (st) fn(id, st);
    });
  const onOff = (id: string, st: HassEntity, on: boolean) => {
    const d = id.split(".")[0];
    if (d === "cover") travel(id, on ? 100 : 0);
    else if (d === "lock") lock(id, !on);
    else if (d === "media_player") world.set(id, on ? "playing" : "off");
    else if (d === "fan")
      world.set(
        id,
        on ? "on" : "off",
        on && st.attributes.percentage === 0 ? { percentage: 100 } : {},
      );
    else if (
      d === "light" &&
      on &&
      st.attributes.supported_color_modes &&
      !st.attributes.brightness
    )
      world.set(id, "on", { brightness: 255 });
    else world.set(id, on ? "on" : "off");
  };
  const isOn = (st: HassEntity) =>
    !["off", "closed", "locked", "idle", "standby"].includes(st.state);
  // locks take a moment, like a real one
  const lock = (id: string, locked: boolean) => {
    setTimeoutState(id, locked ? "locking" : "unlocking", {}, 250);
    setTimeoutState(id, locked ? "locked" : "unlocked", {}, 950);
  };
  const toastCall = () =>
    toast(`Service called: ${domain}.${service} ${JSON.stringify({ ...data, ...(target || {}) })}`);
  switch (`${domain}.${service}`) {
    case "homeassistant.toggle":
    case "light.toggle":
    case "switch.toggle":
    case "input_boolean.toggle":
    case "fan.toggle":
    case "cover.toggle":
    case "media_player.toggle":
      each((id, st) => onOff(id, st, !isOn(st)));
      break;
    case "homeassistant.turn_on":
    case "switch.turn_on":
    case "input_boolean.turn_on":
    case "media_player.turn_on":
      each((id, st) => onOff(id, st, true));
      break;
    case "homeassistant.turn_off":
    case "light.turn_off":
    case "switch.turn_off":
    case "input_boolean.turn_off":
    case "fan.turn_off":
    case "media_player.turn_off":
      each((id, st) => onOff(id, st, false));
      break;
    case "light.turn_on":
      each((id, st) => {
        const pct = num("brightness_pct");
        // its colour: a temperature, a hue and saturation or an RGB colour, an effect
        const colour: Record<string, unknown> = {};
        const k = num("color_temp_kelvin");
        if (Number.isFinite(k))
          Object.assign(colour, {
            color_mode: "color_temp",
            color_temp_kelvin: Math.round(k),
            rgb_color: kelvinToRgb(k),
          });
        const hs = data.hs_color;
        if (Array.isArray(hs))
          Object.assign(colour, {
            color_mode: "hs",
            hs_color: hs,
            rgb_color: hsToRgb(Number(hs[0]), Number(hs[1])),
            color_temp_kelvin: null,
          });
        if (Array.isArray(data.rgb_color))
          Object.assign(colour, {
            color_mode: "rgb",
            rgb_color: data.rgb_color,
            color_temp_kelvin: null,
          });
        if (typeof data.effect === "string") colour.effect = data.effect;
        if (Number.isFinite(pct))
          world.set(id, "on", { brightness: Math.round(pct * 2.55), ...colour });
        else if (Object.keys(colour).length)
          world.set(id, "on", {
            ...colour,
            ...(st.attributes.brightness ? {} : { brightness: 255 }),
          });
        else onOff(id, st, true);
      });
      break;
    case "fan.turn_on":
      each((id) => {
        const pct = num("percentage");
        world.set(id, "on", Number.isFinite(pct) ? { percentage: pct } : {});
      });
      break;
    case "fan.set_percentage":
      each((id) => {
        const pct = num("percentage");
        world.set(id, pct > 0 ? "on" : "off", { percentage: pct });
      });
      break;
    case "fan.set_preset_mode":
      each((id) => world.set(id, "on", { preset_mode: data.preset_mode }));
      break;
    case "fan.oscillate":
      each((id) => world.set(id, undefined, { oscillating: data.oscillating === true }));
      break;
    case "fan.set_direction":
      each((id) => world.set(id, undefined, { direction: data.direction }));
      break;
    // a cover's slats, a valve as a cover (they travel at once)
    case "cover.set_cover_tilt_position":
      each((id) => world.set(id, undefined, { current_tilt_position: num("tilt_position") }));
      break;
    case "cover.open_cover_tilt":
    case "cover.close_cover_tilt":
      each((id) =>
        world.set(id, undefined, {
          current_tilt_position: service === "open_cover_tilt" ? 100 : 0,
        }),
      );
      break;
    case "cover.stop_cover_tilt":
    case "valve.stop_valve":
      break;
    case "valve.open_valve":
    case "valve.close_valve":
    case "valve.toggle":
      each((id, st) => {
        const open = service === "toggle" ? st.state === "closed" : service === "open_valve";
        world.set(id, open ? "open" : "closed", { current_position: open ? 100 : 0 });
      });
      break;
    case "valve.set_valve_position":
      each((id) => {
        const pos = num("position");
        world.set(id, pos > 0 ? "open" : "closed", { current_position: pos });
      });
      break;
    case "humidifier.set_humidity":
    case "climate.set_humidity":
      each((id) => world.set(id, undefined, { humidity: num("humidity") }));
      break;
    case "humidifier.set_mode":
      each((id) => world.set(id, undefined, { mode: data.mode }));
      break;
    case "humidifier.toggle":
    case "humidifier.turn_on":
    case "humidifier.turn_off":
      each((id, st) =>
        world.set(id, service === "toggle" ? (st.state === "on" ? "off" : "on") : service.slice(5)),
      );
      break;
    case "water_heater.set_temperature":
      each((id) => world.set(id, undefined, { temperature: num("temperature") }));
      break;
    case "water_heater.set_operation_mode":
      each((id) =>
        world.set(id, String(data.operation_mode), { operation_mode: data.operation_mode }),
      );
      break;
    case "climate.set_swing_mode":
      each((id) => world.set(id, undefined, { swing_mode: data.swing_mode }));
      break;
    case "climate.set_swing_horizontal_mode":
      each((id) => world.set(id, undefined, { swing_horizontal_mode: data.swing_horizontal_mode }));
      break;
    case "media_player.select_source":
      each((id) => world.set(id, undefined, { source: data.source }));
      break;
    case "media_player.select_sound_mode":
      each((id) => world.set(id, undefined, { sound_mode: data.sound_mode }));
      break;
    case "vacuum.set_fan_speed":
      each((id) => world.set(id, undefined, { fan_speed: data.fan_speed }));
      break;
    case "vacuum.stop":
      each((id) => world.set(id, "idle", { status: "Idle" }));
      break;
    case "vacuum.locate":
      toast(`Locating: ${ids.join(", ")}`);
      break;
    case "vacuum.clean_spot":
      each((id) => world.set(id, "cleaning", { status: "Spot cleaning" }));
      break;
    case "lock.open":
      each((id) => {
        world.set(id, "open");
        setTimeoutState(id, "unlocked", {}, 2000);
      });
      break;
    // a counter counts by its step, held within its bounds
    case "counter.increment":
    case "counter.decrement":
    case "counter.reset":
      each((id, st) => {
        const a = st.attributes;
        const step = Number(a.step ?? 1);
        const v =
          service === "reset"
            ? Number(a.initial ?? 0)
            : Number(st.state) + (service === "increment" ? step : -step);
        const lo =
          Number.isFinite(Number(a.minimum)) && a.minimum !== null ? Number(a.minimum) : -Infinity;
        const hi =
          Number.isFinite(Number(a.maximum)) && a.maximum !== null ? Number(a.maximum) : Infinity;
        world.set(id, Math.min(hi, Math.max(lo, v)));
      });
      break;
    // a timer runs for its duration (or the one given), pauses, and is cancelled or finished
    case "timer.start":
      each((id, st) => {
        const secs = num("duration");
        const dur = Number.isFinite(secs)
          ? new Date(secs * 1000).toISOString().slice(11, 19).replace(/^0/, "")
          : st.attributes.duration;
        world.set(id, "active", {
          duration: dur,
          remaining: dur,
          finishes_at: new Date(
            Date.now() + (Number.isFinite(secs) ? secs * 1000 : 0),
          ).toISOString(),
        });
      });
      break;
    case "timer.pause":
      each((id) => world.set(id, "paused"));
      break;
    case "timer.cancel":
    case "timer.finish":
      each((id) => world.set(id, "idle", { finishes_at: null }));
      break;
    // an update installs for a moment, then is current; a skipped one is current as well
    case "update.install":
      each((id, st) => {
        world.set(id, "on", { in_progress: true });
        setTimeoutState(
          id,
          "off",
          { in_progress: false, installed_version: st.attributes.latest_version },
          2000,
        );
      });
      break;
    case "update.skip":
      each((id, st) => world.set(id, "off", { skipped_version: st.attributes.latest_version }));
      break;
    case "date.set_value":
    case "input_datetime.set_datetime":
      each((id) => world.set(id, String(data.date)));
      break;
    case "datetime.set_value":
      each((id) => world.set(id, String(data.datetime)));
      break;
    case "cover.open_cover":
      each((id) => travel(id, 100));
      break;
    case "cover.close_cover":
      each((id) => travel(id, 0));
      break;
    // stopped where it is: a cover with a position is open unless it is down; one without is open
    case "cover.stop_cover":
      each((id, st) => {
        if (!travels.has(id)) return;
        stopTravel(id);
        const pos = Number(st.attributes.current_position);
        world.set(id, Number.isFinite(pos) ? COVER_OPEN(pos) : "open");
      });
      break;
    // the robots: they start, pause and go back to their dock (a moment later they are there)
    case "vacuum.start":
      each((id) => world.set(id, "cleaning", { status: "Cleaning" }));
      break;
    case "vacuum.pause":
      each((id) => world.set(id, "paused"));
      break;
    case "vacuum.return_to_base":
      each((id) => {
        world.set(id, "returning", { status: "Returning" });
        setTimeoutState(id, "docked", { status: "Docked" }, 2500);
      });
      break;
    case "lawn_mower.start_mowing":
      each((id) => world.set(id, "mowing"));
      break;
    case "lawn_mower.pause":
      each((id) => world.set(id, "paused"));
      break;
    case "lawn_mower.dock":
      each((id) => {
        world.set(id, "returning");
        setTimeoutState(id, "docked", {}, 2500);
      });
      break;
    case "cover.set_cover_position":
      each((id) => travel(id, num("position")));
      break;
    case "climate.set_temperature":
      each((id) => world.set(id, undefined, { temperature: num("temperature") }));
      break;
    case "climate.set_hvac_mode":
      each((id) => {
        const mode = String(data.hvac_mode);
        world.set(id, mode, {
          hvac_action: mode === "off" ? "off" : mode === "cool" ? "cooling" : "heating",
        });
      });
      break;
    case "climate.set_preset_mode":
      each((id) => world.set(id, undefined, { preset_mode: data.preset_mode }));
      break;
    case "climate.set_fan_mode":
      each((id) => world.set(id, undefined, { fan_mode: data.fan_mode }));
      break;
    case "media_player.volume_set":
      each((id) => world.set(id, undefined, { volume_level: num("volume_level") }));
      break;
    case "media_player.media_play_pause":
      each((id, st) => world.set(id, st.state === "playing" ? "paused" : "playing", played(st)));
      break;
    case "media_player.media_play":
      each((id) => world.set(id, "playing"));
      break;
    case "media_player.media_pause":
      each((id) => world.set(id, "paused"));
      break;
    case "media_player.media_next_track":
    case "media_player.media_previous_track":
      // the next song (title, artist, cover) from its start
      each((id, st) => {
        const i = SONGS.findIndex((x) => x.media_title === st.attributes.media_title);
        const n = SONGS.length;
        const next = (i + (service.endsWith("next_track") ? 1 : n - 1) + n) % n;
        world.set(id, "playing", {
          ...SONGS[next],
          media_position: 0,
          media_position_updated_at: new Date().toISOString(),
        });
      });
      break;
    case "lock.lock":
      each((id) => lock(id, true));
      break;
    case "lock.unlock":
      each((id) => lock(id, false));
      break;
    // an alarm arms after a short countdown and disarms at once
    case "alarm_control_panel.alarm_arm_away":
    case "alarm_control_panel.alarm_arm_home":
    case "alarm_control_panel.alarm_arm_night":
    case "alarm_control_panel.alarm_arm_vacation":
    case "alarm_control_panel.alarm_arm_custom_bypass":
      each((id) => {
        world.set(id, "arming");
        setTimeout(() => world.set(id, `armed_${service.slice("alarm_arm_".length)}`), 1200);
      });
      break;
    case "alarm_control_panel.alarm_disarm":
      each((id) => world.set(id, "disarmed"));
      break;
    case "number.set_value":
    case "input_number.set_value":
      each((id) => world.set(id, num("value")));
      break;
    case "select.select_option":
    case "input_select.select_option":
      each((id) => world.set(id, String(data.option)));
      break;
    case "button.press":
    case "input_button.press":
      each((id) => world.set(id, new Date().toISOString()));
      toast(`Button pressed: ${ids.join(", ")}`);
      break;
    case "scene.turn_on":
    case "hue.activate_scene":
      each((id) => world.set(id, new Date().toISOString()));
      toast(`Scene activated: ${ids.join(", ") || data.scene || "?"}`);
      break;
    case "script.turn_on":
      each((id) => {
        world.set(id, "on");
        setTimeoutState(id, "off", { last_triggered: new Date().toISOString() }, 1500);
      });
      toast(`Script started: ${ids.join(", ")}`);
      break;
    default:
      if (domain === "script") toast(`Script started: ${domain}.${service}`);
      else toastCall();
  }
};

// The hass object the action handler calls services on and the more-info opener; the test
// harness swaps in a recording hass and a recorder instead of the popup.
let actionHass: () => HomeAssistant = () => snapshot();
let openMoreInfo: (id: string) => void = (id) => moreInfo(id);
export const setActionHass = (fn: () => HomeAssistant) => {
  actionHass = fn;
};
export const setMoreInfo = (fn: (id: string) => void) => {
  openMoreInfo = fn;
};

// What HA's frontend does with a `hass-action` event (handleAction), reduced to the demo:
// confirmation as a browser dialog, more-info as the popup, services against the world.
const handleAction = (node: EventTarget | null, config: HassActionConfig, kind: ActionKind) => {
  const a = config[`${kind}_action`];
  if (!a || a.action === "none") return;
  if (a.confirmation) {
    const txt =
      typeof a.confirmation === "object" ? (a.confirmation as { text?: string }).text : null;
    if (!window.confirm(txt || "Are you sure you want to perform this action?")) return;
  }
  const hass = actionHass();
  const entityId = a.entity || config.entity;
  switch (a.action) {
    case "more-info":
      if (entityId) openMoreInfo(entityId);
      break;
    case "toggle":
      if (entityId) hass.callService("homeassistant", "toggle", { entity_id: entityId });
      break;
    case "navigate":
      if (a.navigation_path) {
        history.pushState(null, "", String(a.navigation_path));
        window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
      }
      break;
    case "url":
      if (a.url_path) window.open(String(a.url_path), "_blank", "noopener");
      break;
    case "perform-action":
    case "call-service": {
      const svc = a.perform_action || a.service;
      if (!svc) return;
      const [d, s] = String(svc).split(".", 2);
      hass.callService(d, s, (a.data || a.service_data || {}) as Record<string, unknown>, a.target);
      break;
    }
    case "assist":
      toast("Assist would open here");
      break;
    case "fire-dom-event":
      toast("DOM event fired (browser_mod and friends listen for it)");
      break;
    default:
      toast(`Unknown action: ${a.action}`);
  }
};

let wired = false;
// installs the document-level handlers once (also exported for the test harness)
export const wire = () => {
  if (wired || typeof document === "undefined") return;
  wired = true;
  document.addEventListener("hass-action", (ev) => {
    if (ev.detail?.config) handleAction(ev.target, ev.detail.config, ev.detail.action);
  });
  document.addEventListener("hass-more-info", (ev) => {
    if (ev.detail?.entityId) openMoreInfo(ev.detail.entityId);
  });
  document.addEventListener("location-changed", () =>
    toast(`Navigated to ${location.pathname.replace(/^.*\/pro-cards/, "")}`),
  );
  world.start();
};

// the site's mode: VitePress's `dark` class on <html>
const isDark = () =>
  typeof document !== "undefined" && document.documentElement.classList.contains("dark");

// Home Assistant hands a new `themes` only when the theme changes, and the cards measure their
// text again then: here when the site's mode or an example's theme (its data-theme) changes
let themesVersion = 0,
  themesKey = "",
  themes = { darkMode: false };
const themesNow = () => {
  const key = `${isDark()}:${themesVersion}`;
  if (key !== themesKey) {
    themesKey = key;
    themes = { darkMode: isDark() };
  }
  return themes;
};

// the websocket connection: one object for the page's life, as Home Assistant keeps one (a new
// object tells the cards the connection was replaced, and they subscribe everything again)
const connection = {
  subscribeMessage: async <Result>(cb: (result: Result) => void, msg: MessageBase) => {
    if (msg.type === "weather/subscribe_forecast") {
      if (!world.get(msg.entity_id)) throw new Error(`unknown entity ${msg.entity_id}`);
      // Home Assistant sends a forecast when it changed, not on every state change
      let last = "";
      const push = () => {
        const res: ForecastMessage = {
          type: msg.forecast_type,
          forecast: world.forecast(msg.entity_id, msg.forecast_type),
        };
        const json = JSON.stringify(res.forecast);
        if (json === last) return;
        last = json;
        cb(res as Result);
      };
      push();
      const off = world.subscribe(push);
      return async () => {
        off();
      };
    }
    // events (the entity registry's changes): the demo's registry never changes
    if (msg.type === "subscribe_events") return async () => {};
    if (msg.type !== "render_template") throw new Error("unsupported");
    const push = () => {
      const r = renderTemplate(msg.template, world.states);
      const res: TemplateResult = { result: r.ok ? r.result : msg.template, listeners: {} };
      cb(res as Result);
    };
    push();
    const off = world.subscribe(push);
    return async () => {
      off();
    };
  },
};

// A fresh hass object (new identity so cards detect the change) over the shared demo world.
export const snapshot = (): HassSnapshot => ({
  states: { ...world.states },
  locale: { language: "en-GB", number_format: "language", time_format: "24", time_zone: "server" },
  language: "en-GB",
  // the dashboard's path: the energy cards share their period per dashboard
  panelUrl: "docs",
  // the demo's logged-in user is Malte (person.malte carries the id, for `location` conditions)
  user: { id: DEMO_USER, name: "Malte", is_admin: true },
  config: {
    latitude: LAT,
    longitude: LON,
    time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    unit_system: { temperature: "°C", length: "km" },
    version: "2026.9.3",
  },
  themes: themesNow(),
  formatEntityState,
  // the registry keeps its identity: a card looks into it again only when it changes
  entities: ENTITIES,
  callService,
  // HA's callWS / subscribeMessage are generic in the caller's result type, so the shim asserts
  // its concrete answers to it (history rows here, template results below)
  callWS: async <T>(msg: MessageBase): Promise<T> => {
    // an entity's registry options: the demo's favourites (a timer's presets)
    if (msg.type === "config/entity_registry/get") {
      const options = REGISTRY_OPTIONS[String(msg.entity_id)];
      return { entity_id: msg.entity_id, options: options ?? {} } as T;
    }
    if (msg.type === "history/history_during_period") {
      return world.history(
        msg.entity_ids || [],
        new Date(msg.start_time).getTime(),
        new Date(msg.end_time).getTime(),
      ) as T;
    }
    if (msg.type === "recorder/statistics_during_period") {
      return world.statistics(
        msg.statistic_ids || [],
        new Date(msg.start_time).getTime(),
        msg.end_time ? new Date(msg.end_time).getTime() : Date.now(),
        msg.period,
        msg.types || ["change", "state", "sum"],
        msg.units?.energy,
      ) as T;
    }
    if (msg.type === "recorder/get_statistics_metadata")
      return world.statisticsMetadata(msg.statistic_ids || []) as T;
    throw new Error(`unsupported ws ${msg.type}`);
  },
  connection,
});

// a change of the world, or of the site's mode: Home Assistant hands the cards a fresh hass when
// the user switches between light and dark, so the shim does too
export const subscribe = (fn: () => void) => {
  wire();
  const off = world.subscribe(fn);
  if (typeof MutationObserver === "undefined") return off;
  let dark = isDark();
  const mode = new MutationObserver(() => {
    if (isDark() === dark) return;
    dark = isDark();
    fn();
  });
  mode.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  // an example switched to another theme (the theme picker): its text may have another size
  const skin = new MutationObserver(() => {
    themesVersion++;
    fn();
  });
  skin.observe(document.body, { attributes: true, attributeFilter: ["data-theme"], subtree: true });
  return () => {
    off();
    mode.disconnect();
    skin.disconnect();
  };
};
export { world };
