// What the kinds build their parts and values from: a div, the SVG namespace, an attribute as text,
// a percentage and a word as the large value.
import type { FmtValue } from "../entity/model.ts";
import { fmtNumber } from "../format.ts";
import type { HassEntity, HomeAssistant } from "../ha.ts";

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
