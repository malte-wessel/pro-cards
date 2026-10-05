// Builds the `hass` object the cards expect, backed by the demo world, and wires the
// document-level events HA would normally handle (actions, more-info, navigation, toasts).
import { world } from "./world.ts";
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
  locale: { language: string; number_format: string; time_format: string };
  language: string;
  themes: { darkMode: boolean };
  formatEntityState: (st: HassEntity) => string;
}

declare global {
  interface DocumentEventMap {
    "hass-action": CustomEvent<HassActionDetail>;
    "hass-more-info": CustomEvent<{ entityId?: string }>;
  }
}

const LAT = 51.23,
  LON = 6.78; // Düsseldorf-ish, used by the sun path card
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

const formatEntityState = (st: HassEntity): string => {
  const v = st.state;
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
const TRACKS = ["Planet Earth III", "Radio Eins", "Morning Mix", "Jazz Hour"];
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
    if (d === "cover") world.set(id, on ? "open" : "closed", { current_position: on ? 100 : 0 });
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
        if (Number.isFinite(pct)) world.set(id, "on", { brightness: Math.round(pct * 2.55) });
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
    case "cover.open_cover":
      each((id) => world.set(id, "open", { current_position: 100 }));
      break;
    case "cover.close_cover":
      each((id) => world.set(id, "closed", { current_position: 0 }));
      break;
    case "cover.stop_cover":
      toast(`Cover stopped: ${ids.join(", ")}`);
      break;
    case "cover.set_cover_position":
      each((id) => {
        const pos = num("position");
        world.set(id, COVER_OPEN(pos), { current_position: pos });
      });
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
      each((id, st) => world.set(id, st.state === "playing" ? "paused" : "playing"));
      break;
    case "media_player.media_play":
      each((id) => world.set(id, "playing"));
      break;
    case "media_player.media_pause":
      each((id) => world.set(id, "paused"));
      break;
    case "media_player.media_next_track":
    case "media_player.media_previous_track":
      each((id, st) => {
        const i = TRACKS.indexOf(String(st.attributes.media_title));
        const n = TRACKS.length;
        const next = (i + (service.endsWith("next_track") ? 1 : n - 1) + n) % n;
        world.set(id, "playing", { media_title: TRACKS[next] });
      });
      break;
    case "lock.lock":
      each((id) => lock(id, true));
      break;
    case "lock.unlock":
      each((id) => lock(id, false));
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

// A fresh hass object (new identity so cards detect the change) over the shared demo world.
export const snapshot = (): HassSnapshot => ({
  states: { ...world.states },
  locale: { language: "en-GB", number_format: "language", time_format: "24" },
  language: "en-GB",
  config: {
    latitude: LAT,
    longitude: LON,
    time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    unit_system: { temperature: "°C", length: "km" },
    version: "2026.9.3",
  },
  themes: {
    darkMode:
      typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  },
  formatEntityState,
  callService,
  // HA's callWS / subscribeMessage are generic in the caller's result type, so the shim asserts
  // its concrete answers to it (history rows here, template results below)
  callWS: async <T>(msg: MessageBase): Promise<T> => {
    if (msg.type === "history/history_during_period") {
      return world.history(
        msg.entity_ids || [],
        new Date(msg.start_time).getTime(),
        new Date(msg.end_time).getTime(),
      ) as T;
    }
    throw new Error(`unsupported ws ${msg.type}`);
  },
  connection: {
    subscribeMessage: async <Result>(cb: (result: Result) => void, msg: MessageBase) => {
      if (msg.type === "weather/subscribe_forecast") {
        if (!world.get(msg.entity_id)) throw new Error(`unknown entity ${msg.entity_id}`);
        const push = () => {
          const res: ForecastMessage = {
            type: msg.forecast_type,
            forecast: world.forecast(msg.entity_id, msg.forecast_type),
          };
          cb(res as Result);
        };
        push();
        const off = world.subscribe(push);
        return async () => {
          off();
        };
      }
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
  },
});

export const subscribe = (fn: () => void) => {
  wire();
  return world.subscribe(fn);
};
export { world };
