// The slider every card draws: a track with a fill, a round knob and a bubble with the value
// while it is dragged. It takes the pointer (drag or tap on the track) and the keyboard (arrows
// step, PageUp / PageDown jump, Home / End) and reports what it is set to; what the value does is
// the caller's. Colours come from --fe-color (knob ring, fill), --fe-soft (the halo while
// dragging) and --fe-track.
import { clamp01, snapTo } from "./util.ts";

export interface SliderSpec {
  min: number;
  max: number;
  step: number;
  value: number;
  // the accessible name
  label: string;
  // the value as words: the bubble and aria-valuetext
  text: (v: number) => string;
  // drawn but inert (the caller greys it out)
  disabled?: boolean;
  // a gesture starts: a pointer goes down, or the first key of a burst
  onStart?: () => void;
  // every value the gesture passes through
  onInput?: (v: number) => void;
  // the gesture ends: the value it settled on, or null when the pointer was cancelled
  onEnd?: (v: number | null) => void;
}
export interface Slider {
  el: HTMLElement;
  // draws a value without reporting it (the caller's own updates)
  paint: (v: number) => void;
}

// the pause after the last key before a keyboard burst counts as ended
const KEY_SETTLE_MS = 250;

export const slider = (
  spec: SliderSpec,
  el: HTMLElement = document.createElement("div"),
): Slider => {
  const { min, max, step } = spec;
  el.classList.add("ctl-slider");
  el.setAttribute("role", "slider");
  el.tabIndex = 0;
  el.setAttribute("aria-label", spec.label);
  el.setAttribute("aria-valuemin", String(min));
  el.setAttribute("aria-valuemax", String(max));
  el.innerHTML = `<div class="track"><i class="fill"></i><b class="knob"></b><u class="bubble"></u></div>`;
  const track = el.firstElementChild as HTMLElement,
    fill = track.children[0] as HTMLElement,
    knob = track.children[1] as HTMLElement,
    bubble = track.children[2] as HTMLElement;
  const span = max - min || 1;
  const paint = (v: number) => {
    const pct = `${(clamp01((v - min) / span) * 100).toFixed(1)}%`;
    fill.style.width = pct;
    knob.style.left = pct;
    bubble.style.left = pct;
    bubble.textContent = spec.text(v);
    el.setAttribute("aria-valuenow", String(v));
    el.setAttribute("aria-valuetext", bubble.textContent);
  };
  paint(spec.value);
  if (spec.disabled) return { el, paint };

  let v = spec.value;
  const set = (next: number) => {
    v = snapTo(next, min, max, step);
    paint(v);
    spec.onInput?.(v);
  };
  const valueAt = (ev: PointerEvent) => {
    const rect = track.getBoundingClientRect();
    return min + clamp01((ev.clientX - rect.left) / (rect.width || 1)) * span;
  };
  el.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0) return;
    el.setPointerCapture(ev.pointerId);
    spec.onStart?.();
    el.classList.add("dragging");
    set(valueAt(ev));
  });
  el.addEventListener("pointermove", (ev) => {
    if (el.classList.contains("dragging")) set(valueAt(ev));
  });
  const release = (ev: PointerEvent) => {
    if (!el.classList.contains("dragging")) return;
    el.classList.remove("dragging");
    if (el.hasPointerCapture(ev.pointerId)) el.releasePointerCapture(ev.pointerId);
    spec.onEnd?.(ev.type === "pointercancel" ? null : v);
  };
  el.addEventListener("pointerup", release);
  el.addEventListener("pointercancel", release);
  let keyTimer: ReturnType<typeof setTimeout> | undefined;
  el.addEventListener("keydown", (ev) => {
    const big = step * 10;
    let next: number | null = null;
    if (ev.key === "ArrowRight" || ev.key === "ArrowUp") next = v + step;
    else if (ev.key === "ArrowLeft" || ev.key === "ArrowDown") next = v - step;
    else if (ev.key === "PageUp") next = v + big;
    else if (ev.key === "PageDown") next = v - big;
    else if (ev.key === "Home") next = min;
    else if (ev.key === "End") next = max;
    if (next === null) return;
    ev.preventDefault();
    if (keyTimer === undefined) spec.onStart?.();
    set(next);
    clearTimeout(keyTimer);
    keyTimer = setTimeout(() => {
      keyTimer = undefined;
      spec.onEnd?.(v);
    }, KEY_SETTLE_MS);
  });
  return { el, paint };
};

// .sm: the compact size of a slider in a line
export const STYLE_SLIDER = `
  .ctl-slider { display: flex; align-items: center; height: 24px; flex: 1 1 auto; width: 100%; min-width: 0; touch-action: pan-y; cursor: pointer; outline: none; border-radius: 12px; }
  .ctl-slider:focus-visible { box-shadow: 0 0 0 2px var(--fe-color); }
  .ctl-slider .track { position: relative; flex: 1; height: 8px; border-radius: 4px; background: var(--fe-track, color-mix(in srgb, var(--primary-text-color) 8%, transparent)); }
  .ctl-slider.sm .track { height: 6px; }
  .ctl-slider .fill { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 4px; background: var(--fe-color); }
  .ctl-slider .knob { position: absolute; top: 50%; width: 20px; height: 20px; margin: -10px 0 0 -10px; border-radius: 50%; box-sizing: border-box; background: var(--ha-card-background, var(--card-background-color)); box-shadow: 0 1px 3px rgba(0,0,0,.3), inset 0 0 0 2px var(--fe-color); }
  .ctl-slider.sm .knob { width: 16px; height: 16px; margin: -8px 0 0 -8px; }
  .ctl-slider.dragging .knob { width: 24px; height: 24px; margin: -12px 0 0 -12px; box-shadow: 0 1px 3px rgba(0,0,0,.3), inset 0 0 0 2px var(--fe-color), 0 0 0 7px var(--fe-soft, color-mix(in srgb, var(--fe-color) 20%, transparent)); }
  .ctl-slider .bubble { display: none; position: absolute; bottom: 18px; transform: translateX(-50%); padding: 3px 8px; border-radius: 999px; background: var(--primary-text-color); color: var(--ha-card-background, var(--card-background-color)); font-size: 12px; line-height: 14px; font-weight: 500; white-space: nowrap; text-decoration: none; font-variant-numeric: tabular-nums; z-index: 1; pointer-events: none; }
  .ctl-slider.dragging .bubble { display: block; }
`;
