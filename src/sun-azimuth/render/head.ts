// The lead row at the top of the card, drawn like the other cards' tile heads and the same in
// both views: the sun-angle icon, the direction the sun stands in and its angles below.
import { qs } from "../../shared/util.ts";
import type { SunAzimuthHost } from "../config.ts";
import { isUp, type SunDay, type SunSample } from "../day.ts";
import { deg, direction, set, status } from "./text.ts";

// the skeleton of the head; filled by fillHead on every render
export const headHtml = () =>
  `<div class="top"><div class="lead"><ha-icon icon="mdi:sun-angle"></ha-icon></div><div class="texts"><div class="primary"></div><div class="secondary"></div></div></div>`;

export const fillHead = (card: SunAzimuthHost, head: HTMLElement, day: SunDay, now: SunSample) => {
  const hass = card._hass;
  // the lead takes the sun's colour while it is up, the night colour below the horizon
  qs(head, ".top").style.setProperty("--c", isUp(now) ? "var(--saz-sun)" : "var(--saz-night)");
  // "South-West", then "192° · Elevation 62°"
  set(head, ".primary", direction(hass, now.az));
  set(head, ".secondary", `${deg(hass, now.az)} · ${status(hass, day, now)}`);
};
