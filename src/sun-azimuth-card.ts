/*
 * sun-azimuth-card-pro
 * Where the sun is around the house: a sky dial seen from above, a 3D scene with the house, its
 * shadow and the sky dome; below, the sides of the house the sun shines on
 * today. Dependency-free (plain web component, inline SVG). The position is computed locally
 * (NOAA) from hass.config latitude/longitude, like the sun path card.
 *
 * Config:
 *   type: custom:sun-azimuth-card-pro
 *   title: Sun                    # optional; omit → no header
 *   icon: mdi:sun-compass
 *   view: 3d                      # 3d | dial
 *   house:
 *     front: 110                  # the bearing the front faces, degrees clockwise from north
 *     roof: gable                 # 3d / dial: gable (ridge left–right) | gable_front | hip | flat
 *     sides: { front: Street, left: false }   # own names (front, right, back, left); false: a
 *                                 # shared wall, never lit and not listed
 *   camera: 180                   # 3d: the bearing the camera looks toward
 *   camera_slider: true           # 3d: a slider under the plot orbits the scene (not saved)
 *   hover_preview: true           # hovering a timeline or the sun's path shows the sun at that time
 *   show_house: true              # dial / 3d: which sides are in the sun, what comes next
 *   show_events: true             # dial / 3d: sunrise, noon and sunset (off by default)
 *   show_sides: true              # the sides of the house footer (off by default)
 *   sun_color: amber
 *   night_color: indigo
 *   sky_color: light-blue
 */
import { freshShadow, registerCard } from "./shared/card.ts";
import { cssColor } from "./shared/color.ts";
import { fmtTime, langOf } from "./shared/format.ts";
import type { GridOptions, HomeAssistant } from "./shared/ha.ts";
import { t } from "./shared/i18n.ts";
import { slider, type Slider } from "./shared/slider.ts";
import { numOrNull, oneOf, qs } from "./shared/util.ts";
import type {
  PositionedDay,
  SunAzimuthCardConfig,
  SunAzimuthConfig,
  SunAzimuthHost,
} from "./sun-azimuth/config.ts";
import {
  DEFAULTS,
  DIAL,
  ROOFS,
  SCENE,
  SIDES,
  VIEWS,
  type SideKey,
} from "./sun-azimuth/constants.ts";
import { sunAt, sunDay, type SunSample } from "./sun-azimuth/day.ts";
import { renderDial } from "./sun-azimuth/render/dial.ts";
import { eventsHtml, fillEvents, fillHouse, houseHtml } from "./sun-azimuth/render/events.ts";
import { fillHead, headHtml } from "./sun-azimuth/render/head.ts";
import { renderScene } from "./sun-azimuth/render/scene.ts";
import { renderSides } from "./sun-azimuth/render/sides.ts";
import { compass, deg } from "./sun-azimuth/render/text.ts";
import { sidesOf, timelineSpan } from "./sun-azimuth/sides.ts";
import { STYLE } from "./sun-azimuth/styles.ts";
import { nearestOnTrack, type TrackPoint } from "./sun-azimuth/track.ts";

const CARD_TYPE = "sun-azimuth-card-pro";

export class SunAzimuthCard extends HTMLElement implements SunAzimuthHost {
  static cardType = CARD_TYPE;

  _config!: SunAzimuthConfig;
  _hass?: HomeAssistant;
  _root?: HTMLElement;
  _uid?: string;
  _day: PositionedDay | null = null;
  // the camera bearing of the 3D view: the config's, turned by the slider while the card lives
  _camera = DEFAULTS.camera;
  // the time under the pointer on a side's timeline or on the sun's path, previewed in the plot;
  // null = now
  _hoverT: number | null = null;
  // the sun's path in the plot as drawn last, with its times (the path's hover preview)
  _track: TrackPoint[] = [];
  // the path previews when the pointer is this close to it (css px)
  static PATH_REACH = 14;
  _onPath = (ev: PointerEvent) => {
    const visual = ev.currentTarget as HTMLElement,
      svg = visual.querySelector("svg");
    if (!svg || !this._day) return;
    const rect = svg.getBoundingClientRect(),
      s = svg.viewBox.baseVal.width / (rect.width || 1);
    const t = nearestOnTrack(
      this._track,
      (ev.clientX - rect.left) * s,
      (ev.clientY - rect.top) * s,
      SunAzimuthCard.PATH_REACH * s,
    );
    visual.classList.toggle("near", t !== null);
    // off the path the plot shows now again (a preview from a timeline lives in the footer)
    if (t === null) {
      if (this._hoverFrom === "path") this._endHover();
      return;
    }
    this._hoverFrom = "path";
    this._hoverT = t;
    this._previewHover();
  };
  _onPathLeave = (ev: PointerEvent) => {
    (ev.currentTarget as HTMLElement).classList.remove("near");
    if (ev.pointerType !== "touch" && this._hoverFrom === "path") this._endHover();
  };
  _hoverFrom: "path" | "timeline" | null = null;
  _cameraSlider?: Slider;
  _onScrub = (ev: PointerEvent) => {
    const footer = this._root?.querySelector<HTMLElement>(".sides"),
      day = this._day;
    if (!footer || !day) return;
    // only the bar previews: off it (its name, times, pill) the plot shows now again
    const bar = (ev.target as Element).closest(".side .lbar");
    if (!bar) {
      this._endHover();
      return;
    }
    this._hoverFrom = "timeline";
    const rect = bar.getBoundingClientRect(),
      span = timelineSpan(day);
    const f = Math.max(0, Math.min(1, (ev.clientX - rect.left) / (rect.width || 1)));
    this._hoverT = span.from + f * (span.to - span.from);
    this._previewHover();
  };
  _onScrubLeave = (ev: PointerEvent) => {
    if (ev.pointerType === "touch") return; // a tap keeps its preview until the next tap elsewhere
    this._endHover();
  };
  _onDocPointer = (ev: PointerEvent) => {
    if (this._hoverT !== null && !ev.composedPath().includes(this)) this._endHover();
  };
  _lastMinute?: number;
  _timer?: ReturnType<typeof setInterval>;
  // the dial and the 3D scene are drawn in px at the column's width: redrawn when it changes
  _ro?: ResizeObserver;
  _visualWidth = 0;
  _plotHeight = Infinity;

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
    const sides: Partial<Record<SideKey, string>> = {},
      hidden: SideKey[] = [];
    for (const k of SIDES) {
      const v = house?.sides?.[k];
      if (typeof v === "string" && v) sides[k] = v;
      else if (v === false) hidden.push(k);
    }
    this._config = {
      ...DEFAULTS,
      ...rest,
      view: oneOf(VIEWS, view) ? view : DEFAULTS.view,
      front: (((numOrNull(house?.front) ?? DEFAULTS.front) % 360) + 360) % 360,
      roof: oneOf(ROOFS, house?.roof) ? house.roof : DEFAULTS.roof,
      sides,
      hidden,
      camera: numOrNull(camera) ?? DEFAULTS.camera,
      camera_slider: c.camera_slider ?? DEFAULTS.camera_slider,
      hover_preview: c.hover_preview ?? DEFAULTS.hover_preview,
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
    // the pictures' colours follow the theme's mode (styles: ha-card.dark)
    this._root?.classList.toggle("dark", !!hass.themes?.darkMode);
    const minute = Math.floor(Date.now() / 60000);
    // once a minute, and at once when the language changed (words, times)
    if (minute !== this._lastMinute || langOf(prev) !== langOf(hass)) {
      this._lastMinute = minute;
      this._render();
    }
  }

  connectedCallback() {
    this._timer = setInterval(() => this._render(), 60000);
    this._ro = new ResizeObserver(() => {
      const visual = this._root?.querySelector<HTMLElement>(".visual");
      if (
        visual &&
        (visual.clientWidth !== this._visualWidth ||
          this._visualHeight(visual) !== this._plotHeight)
      )
        this._renderPlot();
    });
    this._observe();
    document.addEventListener("pointerdown", this._onDocPointer);
  }
  disconnectedCallback() {
    clearInterval(this._timer);
    this._ro?.disconnect();
    document.removeEventListener("pointerdown", this._onDocPointer);
  }

  getCardSize() {
    const cfg = this._config;
    return (
      (cfg.title || cfg.icon ? 1 : 0) +
      (cfg.view === "3d" ? 6 : 7) +
      (cfg.view === "3d" && cfg.camera_slider ? 1 : 0) +
      (cfg.show_house ? 1 : 0) +
      (cfg.show_events ? 1 : 0) +
      (cfg.show_sides ? 5 : 0)
    );
  }
  // rows "auto": the sections grid sizes the card to its content instead of a fixed row count
  getGridOptions(): GridOptions {
    return { columns: 12, rows: "auto", min_columns: 6 };
  }

  _buildDom() {
    const cfg = this._config;
    const card = freshShadow(this.shadowRoot as ShadowRoot, STYLE);
    card.style.setProperty("--saz-sun", cssColor(cfg.sun_color, "var(--amber-color)"));
    card.style.setProperty("--saz-night", cssColor(cfg.night_color, "var(--indigo-color)"));
    card.style.setProperty("--saz-sky", cssColor(cfg.sky_color, "var(--light-blue-color)"));
    card.classList.toggle("dark", !!this._hass?.themes?.darkMode);
    // a fixed height (grid_options.rows): the plot takes the room the rest leaves and fits into it
    card.classList.toggle("fill", typeof cfg.grid_options?.rows === "number");
    const { title, icon } = cfg;
    card.innerHTML = `
      <div class="header"${title || icon ? "" : ' style="display: none"'}>
        <ha-icon${icon ? ` icon="${icon}"` : ' style="display: none"'}></ha-icon>
        <div class="title"></div>
      </div>
      <div class="body">
        <div class="head">${headHtml()}</div>
        <div class="visual"></div>
        ${cfg.view === "3d" && cfg.camera_slider ? '<div class="control"><div class="cslider"></div><div class="caxis"><span></span><span></span><span></span><span></span><span></span></div></div>' : ""}
        ${cfg.show_house ? houseHtml() : ""}
        ${cfg.show_events ? `<div class="divider"></div>${eventsHtml()}` : ""}
        ${cfg.show_sides ? '<div class="divider"></div><div class="sides"></div>' : ""}
      </div>`;
    qs(card, ".title").textContent = title || "";
    this._cameraSlider = undefined;
    const track = card.querySelector<HTMLElement>(".control .cslider");
    if (track) {
      // the controls' slider, turning the camera instead of calling a service
      this._cameraSlider = slider(
        {
          min: 0,
          max: 359,
          step: 1,
          value: Math.round(this._camera),
          label: t(this._hass, "azimuth.camera"),
          text: (v) => deg(this._hass, v),
          onInput: (v) => {
            this._camera = v;
            this._renderPlot();
          },
        },
        track,
      );
      // the slider is the card's own control: the section's drag handles never see it
      const stop = (ev: Event) => ev.stopPropagation();
      track.addEventListener("pointerdown", stop);
      track.addEventListener("pointerup", stop);
    }
    const footer = card.querySelector<HTMLElement>(".sides");
    if (footer && cfg.hover_preview) {
      footer.classList.add("preview");
      footer.addEventListener("pointermove", this._onScrub);
      footer.addEventListener("pointerdown", this._onScrub);
      footer.addEventListener("pointerleave", this._onScrubLeave);
    }
    const plot = card.querySelector<HTMLElement>(".visual");
    if (plot && cfg.hover_preview) {
      plot.addEventListener("pointermove", this._onPath);
      plot.addEventListener("pointerdown", this._onPath);
      plot.addEventListener("pointerleave", this._onPathLeave);
    }
    this._hoverT = null;
    this._root = card;
    this._observe();
    this._render();
  }
  _observe() {
    this._ro?.disconnect();
    const visual = this._root?.querySelector(".visual");
    if (visual) this._ro?.observe(visual);
  }

  // the plot (dial or 3D scene) at an instant, with the sides as they are then
  _renderVisual(day: PositionedDay, at: SunSample) {
    const card = this._root as HTMLElement,
      visual = card.querySelector<HTMLElement>(".visual");
    if (!visual) return;
    const sides = sidesOf(day, this._config.front, at, this._config.hidden);
    // a preview names its time in a chip above the sun
    const label = this._hoverT !== null ? fmtTime(this._hass, at.t) : undefined;
    // not laid out yet: drawn at a stand-in width, the observer redraws at the real one
    this._visualWidth = visual.clientWidth;
    this._plotHeight = this._visualHeight(visual);
    const width = this._visualWidth || (this._config.view === "3d" ? SCENE.width : DIAL.size);
    if (this._config.view === "3d") {
      this._track = renderScene(
        this,
        visual,
        day,
        at,
        sides,
        this._camera,
        width,
        this._plotHeight,
        label,
      );
      this._fillControl();
    } else
      this._track = renderDial(
        this,
        visual,
        day,
        at,
        sides,
        Math.min(width, this._plotHeight),
        label,
      );
  }
  // the room for the plot in a card of a fixed height; unlimited when the card sizes to its content
  _visualHeight(visual: HTMLElement) {
    return this._root?.classList.contains("fill") && visual.clientHeight
      ? visual.clientHeight
      : Infinity;
  }
  // the hovered time: the sun moves there in the plot, a hair marks it on every bar and the
  // footer's heading shows it
  _previewHover() {
    const card = this._root,
      day = this._day,
      t = this._hoverT;
    if (!card || !day || t === null) return;
    this._renderVisual(day, sunAt(t, day.lat, day.lon));
    // the footer, when shown, marks the time on every bar and names it in its heading
    const footer = card.querySelector<HTMLElement>(".sides");
    if (!footer) return;
    const span = timelineSpan(day);
    footer.classList.add("scrub");
    const left = `${(((t - span.from) / (span.to - span.from)) * 100).toFixed(2)}%`;
    for (const hair of footer.querySelectorAll<HTMLElement>(".lbar .hair")) hair.style.left = left;
    qs(footer, ".sechead .secondary").textContent = fmtTime(this._hass, t);
  }
  _endHover() {
    if (this._hoverT === null) return;
    this._hoverT = null;
    this._hoverFrom = null;
    this._root?.querySelector(".sides")?.classList.remove("scrub");
    this._render();
  }

  // the plot alone: a new width, or the slider turning the 3D scene (the rest of the card depends
  // on neither)
  _renderPlot() {
    const card = this._root,
      day = this._day;
    if (!card || !day || !this._hass) return;
    this._renderVisual(day, sunAt(this._hoverT ?? Date.now(), day.lat, day.lon));
  }
  _fillControl() {
    const control = this._root?.querySelector<HTMLElement>(".control");
    if (!control) return;
    const hass = this._hass;
    qs(control, ".ctl-slider").setAttribute("aria-label", t(hass, "azimuth.camera"));
    // the bearing in the current language
    this._cameraSlider?.paint(this._camera);
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
    const sides = sidesOf(day, cfg.front, now, cfg.hidden);
    fillHead(this, qs(card, ".head"), day, now);
    this._renderVisual(day, now);
    const house = card.querySelector<HTMLElement>(".house");
    if (house) fillHouse(this, house, day, now, sides);
    const items = card.querySelector<HTMLElement>(".items");
    if (items) fillEvents(this, items, day);
    const footer = card.querySelector<HTMLElement>(".sides");
    if (footer) renderSides(this, footer, day, now, sides);
    // a preview survives the per-minute re-render
    if (this._hoverT !== null) this._previewHover();
  }
}

registerCard(SunAzimuthCard, {
  name: "Sun Azimuth Card Pro",
  description:
    "Where the sun is around the house: 3D scene or sky dial, and the sides it shines on today",
});
