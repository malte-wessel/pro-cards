// The lead row at the top of the card, drawn like the other cards' tile heads: the direction the
// sun stands in with its angles below, behind the azimuth arrow (dial) or the sun angle (3D).
import { qs } from "../../shared/util.ts";
import type { SunAzimuthHost } from "../config.ts";
import { isUp, type SunDay, type SunSample } from "../day.ts";
import { deg, direction, set, status } from "./text.ts";

const icon = (name: string) => `<ha-icon icon="${name}"></ha-icon>`;

// the skeleton of the head for a view; filled by fillHead on every render
export const headHtml = (view: string) => {
  const lead =
    view === "3d"
      ? `<div class="lead">${icon("mdi:sun-angle")}</div>`
      : `<div class="lead"><div class="rot">${icon("mdi:navigation")}</div></div>`;
  return `<div class="top">${lead}<div class="texts"><div class="primary"></div><div class="secondary"></div></div></div>`;
};

export const fillHead = (card: SunAzimuthHost, head: HTMLElement, day: SunDay, now: SunSample) => {
  const hass = card._hass;
  // the lead takes the sun's colour while it is up, the night colour below the horizon
  qs(head, ".top").style.setProperty("--c", isUp(now) ? "var(--saz-sun)" : "var(--saz-night)");
  // "South-West", then "192° · Elevation 62°"
  if (card._config.view !== "3d")
    qs(head, ".rot").style.transform = `rotate(${now.az.toFixed(1)}deg)`;
  set(head, ".primary", direction(hass, now.az));
  set(head, ".secondary", `${deg(hass, now.az)} · ${status(hass, day, now)}`);
};
