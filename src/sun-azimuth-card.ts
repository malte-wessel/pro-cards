/*
 * sun-azimuth-card
 * Where the sun is around the house: a sky dial seen from above, a 3D scene with the house, its
 * shadow and the sky dome, or a compass ring; below, the sides of the house the sun shines on
 * today. Dependency-free (plain web component, inline SVG). The position is computed locally
 * (NOAA) from hass.config latitude/longitude, like the sun path card.
 *
 * Config:
 *   type: custom:sun-azimuth-card
 *   title: Sun                    # optional; omit → no header
 *   icon: mdi:sun-compass
 *   view: dial                    # dial | 3d | ring
 *   house:
 *     rotation: 20                # degrees clockwise; the north side's outward normal points there
 *     sides: { north: Street }    # own names per side (north, east, south, west)
 *   camera: 180                   # 3d: the bearing the camera looks toward
 *   camera_slider: true           # 3d: a slider under the plot orbits the scene (not saved)
 *   show_house: true              # dial / 3d: which sides are in the sun, what comes next
 *   show_events: true             # dial / 3d: sunrise, noon and sunset
 *   show_sides: true              # the sides of the house footer
 *   sun_color: amber
 *   night_color: indigo
 *   sky_color: light-blue
 */
import { registerCard } from "./shared/card.ts";
import { cssColor } from "./shared/color.ts";
import { langOf } from "./shared/format.ts";
import type { GridOptions, HomeAssistant } from "./shared/ha.ts";
import { t } from "./shared/i18n.ts";
import { numOrNull, oneOf, qs } from "./shared/util.ts";
import type {
  PositionedDay,
  SideNames,
  SunAzimuthCardConfig,
  SunAzimuthConfig,
  SunAzimuthHost,
} from "./sun-azimuth/config.ts";
import { DEFAULTS, SIDES, VIEWS } from "./sun-azimuth/constants.ts";
import { sunAt, sunDay } from "./sun-azimuth/day.ts";
import { renderDial } from "./sun-azimuth/render/dial.ts";
import { eventsHtml, fillEvents, fillHouse, houseHtml } from "./sun-azimuth/render/events.ts";
import { fillHead, headHtml } from "./sun-azimuth/render/head.ts";
import { renderScene } from "./sun-azimuth/render/scene.ts";
import { renderSides } from "./sun-azimuth/render/sides.ts";
import { compass, deg } from "./sun-azimuth/render/text.ts";
import { sidesOf } from "./sun-azimuth/sides.ts";
import { STYLE } from "./sun-azimuth/styles.ts";

const CARD_TYPE = "sun-azimuth-card";

export class SunAzimuthCard extends HTMLElement implements SunAzimuthHost {
  static cardType = CARD_TYPE;

  _config!: SunAzimuthConfig;
  _hass?: HomeAssistant;
  _root?: HTMLElement;
  _uid?: string;
  _day: PositionedDay | null = null;
  // the camera bearing of the 3D view: the config's, turned by the slider while the card lives
  _camera = DEFAULTS.camera;
  _lastMinute?: number;
  _timer?: ReturnType<typeof setInterval>;

  static getStubConfig(hass?: HomeAssistant) {
    return { title: t(hass, "azimuth.stub_title") };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config: SunAzimuthCardConfig | null | undefined) {
    const c = config || {};
    const { view, house, camera, ...rest } = c;
    const sides: SideNames = {};
    for (const k of SIDES) {
      const v = house?.sides?.[k];
      if (typeof v === "string" && v) sides[k] = v;
    }
    this._config = {
      ...DEFAULTS,
      ...rest,
      view: oneOf(VIEWS, view) ? view : DEFAULTS.view,
      rotation: numOrNull(house?.rotation) ?? DEFAULTS.rotation,
      sides,
      camera: numOrNull(camera) ?? DEFAULTS.camera,
      camera_slider: c.camera_slider ?? DEFAULTS.camera_slider,
      show_house: c.show_house ?? DEFAULTS.show_house,
      show_events: c.show_events ?? DEFAULTS.show_events,
      show_sides: c.show_sides ?? DEFAULTS.show_sides,
    };
    this._camera = ((this._config.camera % 360) + 360) % 360;
    this._day = null;
    if (this._root) this._buildDom();
  }

  set hass(hass: HomeAssistant) {
    const prev = this._hass;
    this._hass = hass;
    if (!this._root) this._buildDom();
    const minute = Math.floor(Date.now() / 60000);
    // once a minute, and at once when the language changed (words, times)
    if (minute !== this._lastMinute || langOf(prev) !== langOf(hass)) {
      this._lastMinute = minute;
      this._render();
    }
  }

  connectedCallback() {
    this._timer = setInterval(() => this._render(), 60000);
  }
  disconnectedCallback() {
    clearInterval(this._timer);
  }

  getCardSize() {
    const cfg = this._config;
    const visual = cfg.view === "ring" ? 3 : cfg.view === "3d" ? 6 : 7;
    return (
      (cfg.title || cfg.icon ? 1 : 0) +
      visual +
      (cfg.view === "3d" && cfg.camera_slider ? 1 : 0) +
      (cfg.view !== "ring" && cfg.show_house ? 1 : 0) +
      (cfg.view !== "ring" && cfg.show_events ? 1 : 0) +
      (cfg.show_sides ? 5 : 0)
    );
  }
  // rows "auto": the sections grid sizes the card to its content instead of a fixed row count
  getGridOptions(): GridOptions {
    return { columns: 12, rows: "auto", min_columns: 6 };
  }

  _buildDom() {
    const root = this.shadowRoot as ShadowRoot,
      cfg = this._config;
    root.innerHTML = "";
    const style = document.createElement("style");
    style.textContent = STYLE;
    root.appendChild(style);
    const card = document.createElement("ha-card");
    card.style.setProperty("--saz-sun", cssColor(cfg.sun_color, "var(--amber-color)"));
    card.style.setProperty("--saz-night", cssColor(cfg.night_color, "var(--indigo-color)"));
    card.style.setProperty("--saz-sky", cssColor(cfg.sky_color, "var(--light-blue-color)"));
    const { title, icon } = cfg;
    const dialOr3d = cfg.view !== "ring";
    card.innerHTML = `
      <div class="header"${title || icon ? "" : ' style="display: none"'}>
        <ha-icon${icon ? ` icon="${icon}"` : ' style="display: none"'}></ha-icon>
        <div class="title"></div>
      </div>
      <div class="body">
        <div class="head">${headHtml(cfg.view)}</div>
        ${dialOr3d ? '<div class="visual"></div>' : ""}
        ${cfg.view === "3d" && cfg.camera_slider ? '<div class="control"><div class="row"><input type="range" min="0" max="359" step="1"><span class="cv"></span></div><div class="caxis"><span></span><span></span><span></span><span></span><span></span></div></div>' : ""}
        ${dialOr3d && cfg.show_house ? houseHtml() : ""}
        ${dialOr3d && cfg.show_events ? `<div class="divider"></div>${eventsHtml()}` : ""}
        ${cfg.show_sides ? '<div class="divider"></div><div class="sides"></div>' : ""}
      </div>`;
    qs(card, ".title").textContent = title || "";
    const slider = card.querySelector<HTMLInputElement>(".control input");
    if (slider) {
      slider.value = String(Math.round(this._camera));
      // the slider is the card's own control: the section's drag handles never see it
      const stop = (ev: Event) => ev.stopPropagation();
      slider.addEventListener("pointerdown", stop);
      slider.addEventListener("pointerup", stop);
      slider.addEventListener("input", () => {
        this._camera = Number(slider.value);
        this._renderScene();
      });
    }
    root.appendChild(card);
    this._root = card;
    this._render();
  }

  // the 3D scene alone (the slider turns it; the rest of the card does not depend on the camera)
  _renderScene() {
    const card = this._root,
      day = this._day;
    if (!card || !day || !this._hass) return;
    const now = sunAt(Date.now(), day.lat, day.lon);
    renderScene(
      this,
      qs(card, ".visual"),
      day,
      now,
      sidesOf(day, this._config.rotation, now),
      this._camera,
    );
    this._fillControl();
  }
  _fillControl() {
    const control = this._root?.querySelector<HTMLElement>(".control");
    if (!control) return;
    const hass = this._hass;
    qs(control, "input").setAttribute("aria-label", t(hass, "azimuth.camera"));
    qs(control, ".cv").textContent = deg(hass, this._camera);
    // the compass points under the track: N E S W and N again at the far end
    control.querySelectorAll(".caxis span").forEach((el, i) => {
      el.textContent = compass(hass, (i * 90) % 360);
    });
  }

  // today (the local calendar day) at the home's position, recomputed when either changes
  _dayOf(now: Date, lat: number, lon: number): PositionedDay {
    const tms = now.getTime(),
      d = this._day;
    if (d && d.lat === lat && d.lon === lon && tms >= d.start && tms < d.end) return d;
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    this._day = { ...sunDay(start, lat, lon), lat, lon };
    return this._day;
  }

  _render() {
    if (!this._root || !this._hass) return;
    const lat = this._hass.config?.latitude,
      lon = this._hass.config?.longitude;
    if (typeof lat !== "number" || typeof lon !== "number") return;
    const card = this._root,
      cfg = this._config;
    const nowDate = new Date();
    const day = this._dayOf(nowDate, lat, lon);
    const now = sunAt(nowDate.getTime(), lat, lon);
    const sides = sidesOf(day, cfg.rotation, now);
    fillHead(this, qs(card, ".head"), day, now);
    const visual = card.querySelector<HTMLElement>(".visual");
    if (visual) {
      if (cfg.view === "3d") {
        renderScene(this, visual, day, now, sides, this._camera);
        this._fillControl();
      } else renderDial(this, visual, day, now, sides);
    }
    const house = card.querySelector<HTMLElement>(".top.house");
    if (house) fillHouse(this, house, day, now, sides);
    const items = card.querySelector<HTMLElement>(".items");
    if (items) fillEvents(this, items, day);
    const footer = card.querySelector<HTMLElement>(".sides");
    if (footer) renderSides(this, footer, day, now, sides);
  }
}

registerCard(SunAzimuthCard, {
  name: "Sun Azimuth Card",
  description:
    "Where the sun is around the house: sky dial, 3D scene or compass ring, and the sides it shines on today",
});
