// Colour helpers: HA colour tokens as CSS, plus hex resolution and blending for gradients.
import type { HassEntity } from "./ha.ts";

type Color = string | null | undefined;

// colours from the config, rendered templates and the theme land in SVG markup and style
// attributes, so only plain colour tokens pass: a name, a hex, rgb() / hsl() / var() of numbers,
// commas, slashes and spaces. Never a quote, an angle bracket, `;`, `:` or url(); anything else is no colour
const SAFE_COLOR = /^[a-z0-9#(),./%\s_-]+$/i;
const HEX = /^#[0-9a-f]{3,8}$/i;
export const safeColor = (c: unknown): string | null =>
  typeof c === "string" && SAFE_COLOR.test(c) && !/url\(/i.test(c) ? c : null;

// Home Assistant's colour names (computeCssColor): each its theme variable; any other colour is
// CSS as written (a hex, rgb(), var(), a CSS name such as tomato)
const THEME_COLORS = new Set([
  "primary",
  "accent",
  "red",
  "pink",
  "purple",
  "deep-purple",
  "indigo",
  "blue",
  "light-blue",
  "cyan",
  "teal",
  "green",
  "light-green",
  "lime",
  "yellow",
  "amber",
  "orange",
  "deep-orange",
  "brown",
  "light-grey",
  "grey",
  "dark-grey",
  "blue-grey",
  "black",
  "white",
  "primary-text",
  "secondary-text",
  "disabled",
]);
// a config colour (HA colour name, hex, rgb()/hsl()/var(), a CSS name) as a CSS value; an unsafe
// one is none
export function cssColor(c: Color, fallback: string): string;
export function cssColor(c: Color): string | undefined;
export function cssColor(c: Color, fallback?: string) {
  if (!c || !safeColor(c)) return fallback;
  if (THEME_COLORS.has(c)) return `var(--${c}-color)`;
  return c;
}

// fallback hex for token names when the theme does not define them (HA default theme values)
export const TOKEN_HEX: Record<string, string> = {
  red: "#f44336",
  pink: "#e91e63",
  purple: "#926bc7",
  "deep-purple": "#6e41ab",
  indigo: "#3f51b5",
  blue: "#2196f3",
  "light-blue": "#03a9f4",
  cyan: "#00bcd4",
  teal: "#009688",
  green: "#4caf50",
  "light-green": "#8bc34a",
  lime: "#cddc39",
  yellow: "#ffeb3b",
  amber: "#ffc107",
  orange: "#ff9800",
  "deep-orange": "#ff6f22",
  brown: "#795548",
  "light-grey": "#bdbdbd",
  grey: "#9e9e9e",
  "dark-grey": "#606060",
  "blue-grey": "#607d8b",
  black: "#000000",
  white: "#ffffff",
  primary: "#009ac7",
  accent: "#ff9800",
};

export const rgbToHex = (r: number, g: number, b: number) =>
  "#" +
  [r, g, b]
    .map((v) =>
      Math.round(Math.max(0, Math.min(255, v)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");

// a light's colour as Home Assistant's tile draws it: its rgb_color with the saturation raised to
// at least 40 % so a pale colour reads, and white a light grey (#e1e1e1) so it shows on a card
export const lightColorHex = (rgb: readonly number[]): string => {
  const [r, g, b] = rgb;
  const v = Math.max(r, g, b);
  const c = v - Math.min(r, g, b);
  const h0 = c && (v === r ? (g - b) / c : v === g ? 2 + (b - r) / c : 4 + (r - g) / c);
  const h = 60 * (h0 < 0 ? h0 + 6 : h0);
  let s = v && c / v;
  let val = v;
  if (s < 0.4) {
    if (s < 0.1) val = 225;
    else s = 0.4;
  }
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return val - val * s * Math.max(Math.min(k, 4 - k, 1), 0);
  };
  return rgbToHex(f(5), f(3), f(1));
};

// #rgb, #rgba, #rrggbb or #rrggbbaa as red, green, blue (the alpha is dropped: blends are opaque)
// a colour temperature as the light it gives, Tanner Helland's blackbody fit (as Home Assistant's
// temperature2rgb): warm orange at 2000 K, white near 6500 K, blue beyond
export const kelvinToRgb = (kelvin: number): [number, number, number] => {
  const t = kelvin / 100;
  const c = (v: number) => Math.round(Math.min(255, Math.max(0, v)));
  const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
  const g =
    t <= 66
      ? 99.4708025861 * Math.log(t) - 161.1195681661
      : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  return [c(r), c(g), c(b)];
};
// the stops of a slider's track (`linear-gradient(to right, …)`): a colour temperature's range in
// eleven steps, the hues around the circle, a hue from white to its fullest
export const kelvinGradient = (min: number, max: number) =>
  Array.from({ length: 11 }, (_, i) => {
    const [r, g, b] = kelvinToRgb(min + ((max - min) * i) / 10);
    return `rgb(${r} ${g} ${b}) ${i * 10}%`;
  }).join(", ");
export const hueGradient = () =>
  Array.from(
    { length: 7 },
    (_, i) => `hsl(${i * 60} 100% 50%) ${((i * 100) / 6).toFixed(1)}%`,
  ).join(", ");
export const saturationGradient = (hue: number | null) =>
  hue === null
    ? "hsl(0 0% 100%) 0%, hsl(0 0% 60%) 100%"
    : `hsl(${Math.round(hue)} 0% 100%) 0%, hsl(${Math.round(hue)} 100% 50%) 100%`;
// a hue and saturation at full brightness, as Home Assistant shows a light's hs colour
export const hsToRgb = (h: number, sPct: number): [number, number, number] => {
  const s = Math.max(0, Math.min(1, sPct / 100));
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return Math.round(255 * (1 - s * Math.max(0, Math.min(k, 4 - k, 1))));
  };
  return [f(5), f(3), f(1)];
};
export const hexToRgb = (hex: string): [number, number, number] => {
  let h = hex.replace("#", "");
  if (h.length === 3 || h.length === 4)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const mixHex = (a: string, b: string, f: number) => {
  const A = hexToRgb(a),
    B = hexToRgb(b);
  return rgbToHex(A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, A[2] + (B[2] - A[2]) * f);
};

// resolve a colour (token name, hex, rgb()) to a hex string for blending; reads the live theme when possible
export const resolveHex = (c: Color, el?: Element | null): string => {
  if (!c || !safeColor(c)) return "#888888";
  if (c.startsWith("#")) return HEX.test(c) ? c : "#888888";
  const m = c.match(/^rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (m) return rgbToHex(+m[1], +m[2], +m[3]);
  const varName =
    c === "primary" ? "--primary-color" : c === "accent" ? "--accent-color" : `--${c}-color`;
  const live = el ? getComputedStyle(el).getPropertyValue(varName).trim() : "";
  if (HEX.test(live))
    return live.length === 4
      ? "#" +
          live
            .slice(1)
            .split("")
            .map((x) => x + x)
            .join("")
      : live;
  const m2 = live.match(/^rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (m2) return rgbToHex(+m2[1], +m2[2], +m2[3]);
  return TOKEN_HEX[c] || "#888888";
};

// ---------- Home Assistant state colours ----------
// Ported from the Home Assistant frontend (src/common/entity/state_active.ts and state_color.ts,
// Apache-2.0) so entities default to the same colours as HA's own cards.

const STATE_COLORED_DOMAIN = new Set([
  "alarm_control_panel",
  "alert",
  "automation",
  "binary_sensor",
  "calendar",
  "camera",
  "climate",
  "cover",
  "device_tracker",
  "fan",
  "group",
  "humidifier",
  "input_boolean",
  "lawn_mower",
  "light",
  "lock",
  "media_player",
  "person",
  "plant",
  "remote",
  "schedule",
  "script",
  "siren",
  "sun",
  "switch",
  "timer",
  "update",
  "vacuum",
  "valve",
  "water_heater",
  "weather",
]);
// (Home Assistant's: their state is when they last ran, so they are active unless unavailable)
const TIMESTAMP_STATE_DOMAINS = new Set([
  "ai_task",
  "button",
  "conversation",
  "event",
  "image",
  "infrared",
  "input_button",
  "notify",
  "radio_frequency",
  "scene",
  "stt",
  "tag",
  "tts",
  "wake_word",
  "datetime",
]);

export const domainOf = (entityId: string | null | undefined) =>
  String(entityId || "").split(".")[0];

// whether HA considers the entity "active" in `state` (default: its current state)
export const stateActive = (st: HassEntity | undefined, state?: string): boolean => {
  const domain = domainOf(st?.entity_id);
  const s: string = state !== undefined ? state : (st?.state ?? "");
  if (TIMESTAMP_STATE_DOMAINS.has(domain)) return s !== "unavailable";
  if (s === "unavailable" || s === "unknown") return false;
  if (s === "off" && domain !== "alert") return false;
  switch (domain) {
    case "alarm_control_panel":
      return s !== "disarmed";
    case "alert":
      return s !== "idle";
    case "cover":
      return s !== "closed";
    case "device_tracker":
    case "person":
      return s !== "not_home";
    case "lawn_mower":
      return !["docked", "paused", "idle"].includes(s);
    case "lock":
      return s !== "locked";
    case "media_player":
      return s !== "standby";
    case "vacuum":
      return !["idle", "docked", "paused"].includes(s);
    case "valve":
      return s !== "closed";
    case "plant":
      return s === "problem";
    case "group":
      return ["on", "home", "open", "locked", "problem"].includes(s);
    case "timer":
      return s === "active";
    case "camera":
      return ["streaming", "recording"].includes(s);
    default:
      return true;
  }
};

const slug = (s: unknown) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_");
const batteryProperty = (state: string) => {
  const v = Number(state);
  if (!Number.isFinite(v)) return null;
  return v >= 70
    ? "--state-sensor-battery-high-color"
    : v >= 30
      ? "--state-sensor-battery-medium-color"
      : "--state-sensor-battery-low-color";
};

// the theme properties HA tries for an entity in `state`, most specific first; null when the
// domain has no state colour (plain sensors keep the card default)
export const stateColorProperties = (
  st: HassEntity | undefined,
  state?: string,
): string[] | null => {
  if (!st?.entity_id) return null;
  const domain = domainOf(st.entity_id);
  const s = state !== undefined ? state : st.state;
  const dc = st.attributes?.device_class;
  if (domain === "sensor" && dc === "battery") {
    const p = batteryProperty(s);
    return p ? [p] : null;
  }
  // an old-style group takes its members' domain where they share one (a group of covers purple)
  const members = domain === "group" ? st.attributes?.entity_id : null;
  const domains = Array.isArray(members) ? [...new Set(members.map((m) => domainOf(m)))] : [];
  const own = domains.length === 1 && STATE_COLORED_DOMAIN.has(domains[0]) ? domains[0] : domain;
  if (!STATE_COLORED_DOMAIN.has(own)) return null;
  return domainProps(own, dc, s, stateActive(st, s));
};
const domainProps = (domain: string, dc: unknown, s: string, isActive: boolean): string[] => {
  const active = isActive ? "active" : "inactive";
  const props: string[] = [];
  // the attribute is the integration's string: slugged like the state, it stays a property name
  if (dc) props.push(`--state-${domain}-${slug(dc)}-${slug(s)}-color`);
  props.push(
    `--state-${domain}-${slug(s)}-color`,
    `--state-${domain}-${active}-color`,
    `--state-${active}-color`,
  );
  return props;
};

// the colour an entity takes while it is active (on, open, playing), whatever its state now: a
// button that switches it shows it while on and while it turns on; null for a domain HA does not
// colour
export const activeColorCss = (st: HassEntity | undefined): string | null => {
  const domain = domainOf(st?.entity_id);
  if (!STATE_COLORED_DOMAIN.has(domain)) return null;
  return st && stateActive(st)
    ? stateColorCss(st)
    : `var(--state-${domain}-active-color, var(--state-active-color))`;
};

// HA's colour for an entity in `state` as a CSS value (nested var() fallbacks), or null
export const stateColorCss = (st: HassEntity | undefined, state?: string): string | null => {
  const s = state !== undefined ? state : st?.state;
  if (s === "unavailable") return "var(--state-unavailable-color)";
  const props = stateColorProperties(st, s);
  if (!props) return null;
  return props.reduceRight((inner, p) => (inner ? `var(${p}, ${inner})` : `var(${p})`), "");
};
