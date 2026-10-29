// The sun path card's dawn / noon / dusk row under the curve (src/shared/sun/curve.ts).
import { textWidth } from "../shared/format.ts";
import type { PositionedDay } from "../shared/sun/curve.ts";
import { fmtEvent, type SunEvent } from "../shared/sun/events.ts";
import { measure } from "../shared/typography.ts";
import { qs } from "../shared/util.ts";
import type { SunPathHost } from "./config.ts";

// Bottom row: dawn / noon / dusk centred under their x; a label near an edge is shifted inward
// only by the amount that would spill out of the card, so it stays with its position
export const drawEvents = (
  card: SunPathHost,
  day: PositionedDay,
  xOf: (t: number) => number,
  W: number,
) => {
  const events = qs(card._root as HTMLElement, ".events");
  events.textContent = "";
  if (!card._config.show_dawn_dusk) return;
  const items = (
    [
      ["dawn", day.dawn],
      ["noon", day.noon],
      ["dusk", day.dusk],
    ] as [SunEvent, number | null][]
  ).filter((it): it is [SunEvent, number] => it[1] != null);
  const xs = items.map(([, t]) => xOf(t));
  // slot boundaries halfway between neighbours; each label may only use its own slot
  const bounds = [0, ...xs.slice(1).map((x, i) => (xs[i] + x) / 2), W];
  // the labels' fonts as styled (styles.ts), at the theme's text size
  const lblFont = measure(card._textCache, events, ["ev", "lbl"], [12, 18]).font,
    timeFont = measure(card._textCache, events, ["ev", "sm"], [14, 20, 500]).font;
  items.forEach(([key, t], i) => {
    const label = card._label(key),
      time = fmtEvent(card._hass, t);
    const x = xs[i],
      maxW = Math.max(24, Math.floor(bounds[i + 1] - bounds[i] - 8));
    const w = Math.min(
      maxW,
      Math.ceil(Math.max(textWidth(label, lblFont), textWidth(time, timeFont))) + 2,
    );
    const left = Math.min(Math.max(x - w / 2, 0), W - w);
    const el = document.createElement("div");
    el.className = "ev";
    el.style.left = `${left}px`;
    el.style.width = `${w}px`;
    const lbl = document.createElement("div");
    lbl.className = "lbl";
    lbl.textContent = label;
    const val = document.createElement("div");
    val.className = "sm";
    val.textContent = time;
    el.append(lbl, val);
    events.appendChild(el);
  });
};
