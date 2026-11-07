// What the kinds build their parts and values from: a div, the SVG namespace, an attribute as text,
// a percentage and a word as the large value, for how long a state has lasted, an alert's glow.
import type { FmtValue } from "../entity/model.ts";
import { secondaryEl } from "../entity/render/lead.ts";
import { fmtDuration, fmtNumber } from "../format.ts";
import type { HassEntity, HomeAssistant } from "../ha.ts";
import { t } from "../i18n.ts";
import type { Kind, KindCtx } from "./types.ts";

export const SVG = "http://www.w3.org/2000/svg";

export const div = (cls: string) => {
  const d = document.createElement("div");
  d.className = cls;
  return d;
};

// a kind's part in the row it fills: in a poster's body, or right in a tile's row
export const partOf = <T extends HTMLElement = HTMLElement>(row: HTMLElement, sel: string) =>
  row.querySelector<T>(`:scope > .pbody > ${sel}, :scope > ${sel}`);

// a text attribute, null when missing or empty
export const str = (st: HassEntity | undefined, key: string) => {
  const v = st?.attributes?.[key];
  return typeof v === "string" && v ? v : null;
};

// a percentage, whole
export const pctValue = (hass: HomeAssistant | undefined, p: number): FmtValue => {
  const n = fmtNumber(hass, p, 0);
  return { text: `${n} %`, num: n, unit: "%" };
};

// a text without a unit (a word, a time, a title)
export const wordValue = (text: string): FmtValue => ({ text, num: text, unit: "" });

// for how long the state has lasted ("for 5 min"), a minute at least
export const sinceEl = (c: KindCtx): HTMLElement | null => {
  const st = c.m.st;
  const since = st ? (c.ctx.now - new Date(st.last_changed).getTime()) / 1000 : NaN;
  if (!Number.isFinite(since)) return null;
  const d = fmtDuration(c.ctx.hass, Math.max(60, since), true);
  return secondaryEl([{ text: t(c.ctx.hass, "kind.since", { t: d }) }]);
};
// its glow: a red pulse from the edges while `on` says so (an alarm triggered, smoke)
export const alertGlow = (on: (c: KindCtx) => boolean): NonNullable<Kind["glow"]> => ({
  key: () => "alarm",
  build: () => div("palarm"),
  update: (el, c) => el.classList.toggle("on", on(c)),
});
