// The "Sides of the house" footer: one row per side with its sun window today on a timeline.
import { t } from "../../shared/i18n.ts";
import type { SunAzimuthHost } from "../config.ts";
import type { SunDay, SunSample } from "../day.ts";
import { timelineSpan, type Side } from "../sides.ts";
import { sideName } from "./events.ts";
import { duration, time } from "./text.ts";

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

export const renderSides = (
  card: SunAzimuthHost,
  host: HTMLElement,
  day: SunDay,
  now: SunSample,
  sides: Side[],
) => {
  const hass = card._hass;
  const span = timelineSpan(day),
    len = span.to - span.from;
  const at = (v: number) => Math.max(0, Math.min(1, (v - span.from) / len));
  const frag = document.createDocumentFragment();
  const head = document.createElement("div");
  head.className = "sechead";
  head.innerHTML = `<div class="key"></div><div class="secondary"></div>`;
  head.children[0].textContent = t(hass, "azimuth.sides");
  head.children[1].textContent = t(hass, "weather.today");
  frag.appendChild(head);
  for (const side of sides) {
    const row = document.createElement("div");
    row.className = `top side${side.litNow ? " lit" : ""}`;
    row.style.setProperty("--c", side.litNow ? "var(--saz-sun)" : "var(--blue-grey-color)");
    const pill = side.litNow
      ? t(hass, "azimuth.pill.sun_now")
      : side.nextFrom !== null
        ? t(hass, "azimuth.pill.from", { time: time(hass, side.nextFrom) })
        : side.windows.length
          ? t(hass, "azimuth.pill.shade")
          : t(hass, "azimuth.pill.no_sun");
    const total = side.windows.reduce((a, w) => a + (w.to - w.from), 0);
    const sub = side.windows.length
      ? t(hass, "azimuth.sun_window", {
          windows: side.windows.map((w) => `${time(hass, w.from)}–${time(hass, w.to)}`).join(" · "),
          duration: duration(total),
        })
      : t(hass, "azimuth.no_sun");
    row.innerHTML = `<div class="lead"><div class="rot"><ha-icon icon="mdi:navigation"></ha-icon></div></div>
      <div class="main"><div class="line"><div class="texts"><div class="primary"></div><div class="secondary"></div></div><div class="pill"></div></div>
      <div class="lbar"><b></b><u class="hair"></u></div></div>`;
    (row.querySelector(".rot") as HTMLElement).style.transform = `rotate(${side.normal}deg)`;
    (row.querySelector(".primary") as HTMLElement).textContent = sideName(card, side);
    (row.querySelector(".secondary") as HTMLElement).textContent = sub;
    const pillEl = row.querySelector(".pill") as HTMLElement;
    pillEl.textContent = pill;
    pillEl.classList.toggle("on", side.litNow);
    const bar = row.querySelector(".lbar") as HTMLElement;
    for (const w of side.windows) {
      const seg = document.createElement("i");
      seg.style.left = pct(at(w.from));
      seg.style.width = pct(at(w.to) - at(w.from));
      bar.insertBefore(seg, bar.firstChild);
    }
    const dot = bar.querySelector("b") as HTMLElement;
    if (now.t >= span.from && now.t <= span.to) dot.style.left = pct(at(now.t));
    else dot.style.display = "none";
    frag.appendChild(row);
  }
  const axis = document.createElement("div");
  axis.className = "axis";
  for (const v of [span.from, span.from + len / 2, span.to]) {
    const s = document.createElement("span");
    s.textContent = time(hass, v);
    axis.appendChild(s);
  }
  frag.appendChild(axis);
  host.replaceChildren(frag);
};
