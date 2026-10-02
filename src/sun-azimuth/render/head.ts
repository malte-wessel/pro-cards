// The lead row at the top of the card: the azimuth arrow (dial), the elevation (3D) or the
// compass ring with the day's events beside it (ring).
import { t } from "../../shared/i18n.ts";
import { qs } from "../../shared/util.ts";
import type { SunAzimuthHost } from "../config.ts";
import { isUp, shadowRatio, type SunDay, type SunSample } from "../day.ts";
import { compass, deg, set, status, time } from "./text.ts";

const RAD = Math.PI / 180;
const RING = 36, // the ring's viewBox
  RR = 16; // its radius
const C = 2 * Math.PI * RR;

const icon = (name: string) => `<ha-icon icon="${name}"></ha-icon>`;

// the skeleton of the head for a view; filled by fillHead on every render
export const headHtml = (view: string) => {
  if (view === "ring")
    return `<div class="ringrow">
      <div class="lead ring"><svg viewBox="0 0 ${RING} ${RING}"><circle class="track" cx="18" cy="18" r="${RR}"/><circle class="arc" cx="18" cy="18" r="${RR}" transform="rotate(-90 18 18)"/><circle class="dot" r="2.6"/></svg><div class="in"><div class="az"></div><div class="cp"></div></div></div>
      <div class="lines">
        <div class="top"><div class="lead s32 rise">${icon("mdi:weather-sunset-up")}</div><div class="texts"><div class="primary l1"></div><div class="secondary l1s"></div></div></div>
        <div class="top"><div class="lead s32 now">${icon("mdi:white-balance-sunny")}</div><div class="texts"><div class="primary l2"></div><div class="secondary l2s"></div></div></div>
        <div class="top"><div class="lead s32 set">${icon("mdi:weather-sunset-down")}</div><div class="texts"><div class="primary l3"></div><div class="secondary l3s"></div></div></div>
      </div></div>`;
  const lead =
    view === "3d"
      ? `<div class="lead xl">${icon("mdi:sun-angle")}</div>`
      : `<div class="lead xl"><div class="rot">${icon("mdi:navigation")}</div></div>`;
  return `<div class="top">${lead}<div class="texts"><div class="primary"></div><div class="big"><b></b><span></span></div><div class="secondary"><span class="accent"></span><span class="rest"></span></div></div></div>`;
};

export const fillHead = (card: SunAzimuthHost, head: HTMLElement, day: SunDay, now: SunSample) => {
  const hass = card._hass,
    view = card._config.view;
  // the lead takes the sun's colour while it is up, the night colour below the horizon
  qs(head, ".top, .ringrow").style.setProperty(
    "--c",
    isUp(now) ? "var(--saz-sun)" : "var(--saz-night)",
  );
  if (view === "ring") {
    const arc = qs<SVGCircleElement>(head, ".arc");
    if (day.sunrise && day.sunset) {
      const sweep = ((day.sunset.az - day.sunrise.az + 360) % 360) / 360;
      arc.style.strokeDasharray = `${(sweep * C).toFixed(2)} ${C.toFixed(2)}`;
      arc.style.strokeDashoffset = (-(day.sunrise.az / 360) * C).toFixed(2);
    } else {
      // polar day: the whole ring; polar night: none
      arc.style.strokeDasharray = `${day.noon.el > 0 ? C.toFixed(2) : 0} ${C.toFixed(2)}`;
      arc.style.strokeDashoffset = "0";
    }
    const dot = qs<SVGCircleElement>(head, ".dot");
    dot.setAttribute("cx", (18 + RR * Math.sin(now.az * RAD)).toFixed(2));
    dot.setAttribute("cy", (18 - RR * Math.cos(now.az * RAD)).toFixed(2));
    set(head, ".az", deg(hass, now.az));
    set(head, ".cp", compass(hass, now.az));
    set(head, ".l1", `${t(hass, "sun.label.sunrise")} ${time(hass, day.sunrise?.t)}`);
    set(
      head,
      ".l1s",
      day.sunrise ? `${deg(hass, day.sunrise.az)} · ${compass(hass, day.sunrise.az)}` : "–",
    );
    set(
      head,
      ".l2",
      now.el > 0
        ? `${t(hass, "azimuth.now")} · ${t(hass, "azimuth.high", { value: deg(hass, now.el) })}`
        : `${t(hass, "azimuth.now")} · ${status(hass, day, now, false)}`,
    );
    set(
      head,
      ".l2s",
      t(hass, "azimuth.noon_at", {
        time: time(hass, day.noon.t),
        value: deg(hass, day.noon.el),
        azimuth: deg(hass, day.noon.az),
      }),
    );
    set(head, ".l3", `${t(hass, "sun.label.sunset")} ${time(hass, day.sunset?.t)}`);
    set(
      head,
      ".l3s",
      day.sunset ? `${deg(hass, day.sunset.az)} · ${compass(hass, day.sunset.az)}` : "–",
    );
    return;
  }
  if (view === "3d") {
    set(head, ".primary", t(hass, "azimuth.elevation"));
    set(head, ".big b", deg(hass, now.el));
    set(head, ".big span", `${compass(hass, now.az)} · ${deg(hass, now.az)}`);
    set(head, ".accent", status(hass, day, now, false));
    const ratio = shadowRatio(now.el);
    set(
      head,
      ".rest",
      ratio === null ? "" : ` · ${t(hass, "azimuth.shadow", { ratio: ratio.toFixed(1) })}`,
    );
    return;
  }
  qs(head, ".rot").style.transform = `rotate(${now.az.toFixed(1)}deg)`;
  set(head, ".primary", t(hass, "azimuth.azimuth"));
  set(head, ".big b", deg(hass, now.az));
  set(head, ".big span", compass(hass, now.az));
  set(head, ".accent", status(hass, day, now, true));
  set(head, ".rest", "");
};
