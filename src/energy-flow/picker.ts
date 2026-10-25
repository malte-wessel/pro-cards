// The period picker in the energy flow card's header: ‹ steps back, › forward (not past the
// running period), and the button between them names the period shown and opens the calendar
// (src/shared/datepicker.ts) to pick another period or any range of days. The button keeps one
// width whatever it names (a long range is cut, its tooltip says it all), so nothing in the
// header moves when the period changes.
import { qs } from "../shared/util.ts";

export interface PickerHandlers {
  step: (dir: -1 | 1) => void;
  open: (button: HTMLElement) => void;
}
export interface PickerState {
  label: string; // the period shown: "Today", "Thu, 22 Oct", "March 2026"
  canNext: boolean;
  texts: { prev: string; next: string; choose: string };
}

const iconEl = (icon: string) => {
  const i = document.createElement("ha-icon");
  i.setAttribute("icon", icon);
  return i;
};
const roundEl = (cls: string, icon: string) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = `round ${cls}`;
  b.appendChild(iconEl(icon));
  return b;
};

export const buildPicker = (on: PickerHandlers): HTMLElement => {
  const el = document.createElement("div");
  el.className = "ppicker";
  const prev = roundEl("prev", "mdi:chevron-left"),
    next = roundEl("next", "mdi:chevron-right");
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "pchip";
  chip.setAttribute("aria-haspopup", "dialog");
  chip.setAttribute("aria-expanded", "false");
  const text = document.createElement("span");
  text.className = "ptext";
  chip.append(text);
  el.append(prev, chip, next);
  prev.addEventListener("click", () => on.step(-1));
  next.addEventListener("click", () => on.step(1));
  chip.addEventListener("click", () => on.open(chip));
  return el;
};

export const updatePicker = (el: HTMLElement, st: PickerState) => {
  const chip = qs(el, ".pchip");
  qs(chip, ".ptext").textContent = st.label;
  chip.setAttribute("aria-label", `${st.texts.choose}: ${st.label}`);
  chip.title = st.label;
  const prev = qs<HTMLButtonElement>(el, ".prev"),
    next = qs<HTMLButtonElement>(el, ".next");
  prev.setAttribute("aria-label", st.texts.prev);
  prev.title = st.texts.prev;
  next.setAttribute("aria-label", st.texts.next);
  next.title = st.texts.next;
  next.disabled = !st.canNext;
};
