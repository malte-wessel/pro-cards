// Minimal stand-ins for the Home Assistant elements the cards render into: ha-card, ha-icon, ha-state-icon.
import type { HassEntity, HomeAssistant } from "../../../../src/shared/ha.ts";
import { conditionIcon } from "../../../../src/weather/conditions.ts";

// the `@mdi/js` namespace: `mdiLightbulb` → SVG path, indexed by the PascalCased icon name
// (unknown rather than string because the namespace type also carries a synthetic `default`)
type MdiPaths = Record<string, unknown>;
let mdi: MdiPaths | null = null,
  mdiLoading: Promise<MdiPaths> | null = null;
const loadMdi = () => (mdiLoading ||= import("@mdi/js").then((m) => (mdi = m)));

const iconPath = (name: string | null): string | null => {
  if (!mdi || !name) return null;
  const key =
    "mdi" +
    String(name)
      .replace(/^mdi:/, "")
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join("");
  const path = mdi[key];
  return typeof path === "string" ? path : null;
};

class HaIcon extends HTMLElement {
  _root: ShadowRoot;
  static get observedAttributes() {
    return ["icon"];
  }
  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
    this._root.innerHTML = `<style>:host{display:inline-flex;align-items:center;justify-content:center;width:var(--mdc-icon-size,24px);height:var(--mdc-icon-size,24px);vertical-align:middle}svg{width:100%;height:100%;fill:currentColor;display:block}</style><svg viewBox="0 0 24 24"><path d=""/></svg>`;
  }
  set icon(v: string | null | undefined) {
    if (v) this.setAttribute("icon", v);
    else this.removeAttribute("icon");
  }
  get icon(): string | null | undefined {
    return this.getAttribute("icon");
  }
  attributeChangedCallback() {
    this._draw();
  }
  connectedCallback() {
    this._draw();
  }
  _draw() {
    const set = () => {
      const p = iconPath(this.getAttribute("icon")) || iconPath("mdi:help-circle-outline");
      this._root.querySelector("path")!.setAttribute("d", p || "");
    };
    if (mdi) set();
    else
      loadMdi().then(() => {
        if (this.isConnected) set();
      });
  }
}

const DOMAIN_ICON: Record<string, (s: string) => string> = {
  light: (s) => (s === "on" ? "mdi:lightbulb" : "mdi:lightbulb-outline"),
  switch: (s) => (s === "on" ? "mdi:toggle-switch-variant" : "mdi:toggle-switch-variant-off"),
  person: (s) => (s === "home" ? "mdi:account" : "mdi:account-arrow-right"),
  climate: () => "mdi:thermostat",
  cover: (s) => (s === "closed" ? "mdi:window-shutter" : "mdi:window-shutter-open"),
  vacuum: () => "mdi:robot-vacuum",
  media_player: (s) => (s === "playing" ? "mdi:play" : "mdi:cast"),
  scene: () => "mdi:palette",
  script: () => "mdi:script-text",
  input_boolean: (s) => (s === "on" ? "mdi:check-circle-outline" : "mdi:close-circle-outline"),
  sun: (s) => (s === "above_horizon" ? "mdi:white-balance-sunny" : "mdi:weather-night"),
  weather: (s) => conditionIcon(s),
  sensor: () => "mdi:eye",
  binary_sensor: () => "mdi:radiobox-blank",
};
const DC_ICON: Record<string, string | ((s: string) => string)> = {
  temperature: "mdi:thermometer",
  humidity: "mdi:water-percent",
  wind_speed: "mdi:weather-windy",
  atmospheric_pressure: "mdi:gauge",
  pressure: "mdi:gauge",
  illuminance: "mdi:brightness-5",
  power: "mdi:flash",
  energy: "mdi:lightning-bolt",
  battery: "mdi:battery",
  carbon_dioxide: "mdi:molecule-co2",
  precipitation_intensity: "mdi:weather-pouring",
  duration: "mdi:timer-outline",
  moisture: (s) => (s === "on" ? "mdi:water" : "mdi:water-off"),
  window: (s) => (s === "on" ? "mdi:window-open" : "mdi:window-closed"),
  door: (s) => (s === "on" ? "mdi:door-open" : "mdi:door-closed"),
  motion: (s) => (s === "on" ? "mdi:motion-sensor" : "mdi:motion-sensor-off"),
  occupancy: (s) => (s === "on" ? "mdi:home" : "mdi:home-outline"),
};
export const stateIcon = (st?: HassEntity | null): string => {
  if (!st) return "mdi:help-circle-outline";
  if (st.attributes?.icon) return st.attributes.icon;
  const domain = st.entity_id.split(".")[0];
  const dc: string | undefined = st.attributes?.device_class;
  const byDc = dc ? DC_ICON[dc] : undefined;
  if (byDc) return typeof byDc === "function" ? byDc(st.state) : byDc;
  if (domain === "sensor" && dc === "battery") return "mdi:battery";
  const f = DOMAIN_ICON[domain];
  return f ? f(st.state) : "mdi:bookmark";
};

class HaStateIcon extends HTMLElement {
  _root: ShadowRoot;
  _hass?: HomeAssistant;
  _st?: HassEntity;
  _icon?: string;
  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
    this._root.innerHTML = `<style>:host{display:inline-flex}</style><ha-icon></ha-icon>`;
  }
  set hass(v: HomeAssistant | undefined) {
    this._hass = v;
    this._draw();
  }
  set stateObj(v: HassEntity | undefined) {
    this._st = v;
    this._draw();
  }
  set icon(v: string | undefined) {
    this._icon = v;
    this._draw();
  }
  set stateValue(_v: string | undefined) {
    this._draw();
  }
  _draw() {
    this._root.querySelector("ha-icon")!.setAttribute("icon", this._icon || stateIcon(this._st));
  }
}

class HaCard extends HTMLElement {
  _root: ShadowRoot;
  static get observedAttributes() {
    return ["header"];
  }
  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
    this._root.innerHTML = `<style>
      :host{display:block;position:relative;box-sizing:border-box;background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color,#212121);
        border-radius:var(--ha-card-border-radius,12px);border:var(--ha-card-border-width,1px) solid var(--ha-card-border-color,var(--divider-color,#e0e0e0));box-shadow:var(--ha-card-box-shadow,none);
        transition:all .3s ease-out;font-family:var(--ha-font-family-body,Roboto,system-ui,sans-serif);-webkit-font-smoothing:antialiased}
      :host([raised]){border:none;box-shadow:0 2px 2px 0 rgba(0,0,0,.14),0 1px 5px 0 rgba(0,0,0,.12),0 3px 1px -2px rgba(0,0,0,.2)}
      h1{font-family:inherit;font-size:var(--ha-heading-card-title-font-size,24px);font-weight:var(--ha-heading-card-title-font-weight,400);letter-spacing:-.012em;line-height:48px;
        padding:12px 16px 16px;margin:0;color:var(--ha-card-header-color,var(--primary-text-color));display:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      h1.on{display:block}
    </style><h1 class="card-header"></h1><slot></slot>`;
  }
  attributeChangedCallback() {
    this._hdr();
  }
  connectedCallback() {
    this._hdr();
  }
  set header(v: string | null | undefined) {
    if (v) this.setAttribute("header", v);
    else this.removeAttribute("header");
  }
  get header(): string | null | undefined {
    return this.getAttribute("header");
  }
  _hdr() {
    const h = this._root.querySelector("h1")!;
    const v = this.getAttribute("header");
    h.textContent = v || "";
    h.classList.toggle("on", !!v);
  }
}

export const defineElements = () => {
  if (typeof customElements === "undefined") return;
  if (!customElements.get("ha-icon")) customElements.define("ha-icon", HaIcon);
  if (!customElements.get("ha-state-icon")) customElements.define("ha-state-icon", HaStateIcon);
  if (!customElements.get("ha-card")) customElements.define("ha-card", HaCard);
  loadMdi();
};
