// The house line (which sides the sun is on, what comes next) and the sunrise / noon / sunset row.
import { t } from "../../shared/i18n.ts";
import type { SunAzimuthHost } from "../config.ts";
import { defaultSideName } from "../constants.ts";
import type { SunDay, SunSample } from "../day.ts";
import { litSides, nextSide, type Side } from "../sides.ts";
import { compass, deg, set, time } from "./text.ts";

const icon = (name: string) => `<ha-icon icon="${name}"></ha-icon>`;

export const houseHtml = () =>
  `<div class="top house"><div class="lead s36">${icon("mdi:home-outline")}</div><div class="texts"><div class="primary"></div><div class="secondary"></div></div></div>`;

export const eventsHtml = () =>
  `<div class="items">
    <div class="item"><div class="ribody"><div class="lead s36 rise">${icon("mdi:weather-sunset-up")}</div><div class="v rise"></div></div><div class="n rise"></div></div>
    <div class="item"><div class="ribody"><div class="lead s36 noon">${icon("mdi:white-balance-sunny")}</div><div class="v noon"></div></div><div class="n noon"></div></div>
    <div class="item"><div class="ribody"><div class="lead s36 set">${icon("mdi:weather-sunset-down")}</div><div class="v set"></div></div><div class="n set"></div></div>
  </div>`;

export const sideName = (card: SunAzimuthHost, side: Side) =>
  card._config.sides[side.key] || defaultSideName(card._hass, side.key);

export const fillHouse = (
  card: SunAzimuthHost,
  el: HTMLElement,
  day: SunDay,
  now: SunSample,
  sides: Side[],
) => {
  const hass = card._hass;
  const lit = litSides(sides);
  el.style.setProperty("--c", lit.length ? "var(--saz-sun)" : "var(--saz-night)");
  set(
    el,
    ".primary",
    lit.length
      ? t(hass, "azimuth.sun_on", { sides: lit.map((s) => sideName(card, s)).join(" + ") })
      : t(hass, "azimuth.sun_on_none"),
  );
  const next = nextSide(sides);
  let secondary: string;
  if (next)
    secondary = t(hass, "azimuth.next_side", {
      side: sideName(card, next),
      time: time(hass, next.nextFrom),
    });
  else if (day.sunset && now.t < day.sunset.t)
    secondary = t(hass, "azimuth.next_sunset", { time: time(hass, day.sunset.t) });
  else
    secondary = day.sunrise
      ? t(hass, "azimuth.next_sunrise", { time: time(hass, day.sunrise.t) })
      : "";
  set(el, ".secondary", secondary);
};

export const fillEvents = (card: SunAzimuthHost, el: HTMLElement, day: SunDay) => {
  const hass = card._hass;
  set(el, ".v.rise", time(hass, day.sunrise?.t));
  set(
    el,
    ".n.rise",
    day.sunrise ? `${deg(hass, day.sunrise.az)} ${compass(hass, day.sunrise.az)}` : "–",
  );
  set(el, ".v.noon", time(hass, day.noon.t));
  set(el, ".n.noon", t(hass, "azimuth.noon_high", { value: deg(hass, day.noon.el) }));
  set(el, ".v.set", time(hass, day.sunset?.t));
  set(
    el,
    ".n.set",
    day.sunset ? `${deg(hass, day.sunset.az)} ${compass(hass, day.sunset.az)}` : "–",
  );
};
