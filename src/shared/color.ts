// Colour helpers: HA colour tokens as CSS, plus hex resolution and blending for gradients.
import type { HassEntity } from "./ha.ts";

type Color = string | null | undefined;

// a config colour (HA token name, hex, rgb()/hsl()/var()) as a CSS value
export function cssColor(c: Color, fallback: string): string;
export function cssColor(c: Color): string | undefined;
export function cssColor(c: Color, fallback?: string) {
  if (!c) return fallback;
  if (c === "primary") return "var(--primary-color)";
  if (c === "accent") return "var(--accent-color)";
  if (/^(#|rgb|hsl|var\()/.test(c)) return c;
  return `var(--${c}-color)`;
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
  "deep-orange": "#ff5722",
  brown: "#795548",
  grey: "#9e9e9e",
  "blue-grey": "#607d8b",
  black: "#000000",
  white: "#ffffff",
  primary: "#03a9f4",
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

export const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const n = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16,
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const mixHex = (a: string, b: string, f: number) => {
  const A = hexToRgb(a),
    B = hexToRgb(b);
  return rgbToHex(A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, A[2] + (B[2] - A[2]) * f);
};

// resolve a colour (token name, hex, rgb()) to a hex string for blending; reads the live theme when possible
export const resolveHex = (c: Color, el?: Element | null): string => {
  if (!c) return "#888888";
  if (/^#/.test(c)) return c;
  const m = c.match(/^rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (m) return rgbToHex(+m[1], +m[2], +m[3]);
  const varName =
    c === "primary" ? "--primary-color" : c === "accent" ? "--accent-color" : `--${c}-color`;
  const live = el ? getComputedStyle(el).getPropertyValue(varName).trim() : "";
  if (/^#/.test(live))
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
const TIMESTAMP_STATE_DOMAINS = new Set(["button", "event", "input_button", "scene"]);

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
  if (!STATE_COLORED_DOMAIN.has(domain)) return null;
  const active = stateActive(st, s) ? "active" : "inactive";
  const props: string[] = [];
  if (dc) props.push(`--state-${domain}-${dc}-${slug(s)}-color`);
  props.push(
    `--state-${domain}-${slug(s)}-color`,
    `--state-${domain}-${active}-color`,
    `--state-${active}-color`,
  );
  return props;
};

// HA's colour for an entity in `state` as a CSS value (nested var() fallbacks), or null
export const stateColorCss = (st: HassEntity | undefined, state?: string): string | null => {
  const s = state !== undefined ? state : st?.state;
  if (s === "unavailable") return "var(--state-unavailable-color)";
  const props = stateColorProperties(st, s);
  if (!props) return null;
  return props.reduceRight((inner, p) => (inner ? `var(${p}, ${inner})` : `var(${p})`), "");
};
