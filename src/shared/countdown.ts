// What runs down: a timer's time left, or the time until a moment ahead. Its parts are pure; the
// page clock writes what runs down (a text, a bar's width) every second where it is shown, without
// rendering the card: a row is filled when its inputs change, the clock keeps it current between.
import type { HassEntity } from "./ha.ts";

// Home Assistant's text of a time span ("0:45:00", "1 day, 2:00:00"), in seconds
export const parseHms = (v: unknown): number | null => {
  if (typeof v === "number") return Number.isFinite(v) && v >= 0 ? v : null;
  if (typeof v !== "string") return null;
  const m = /^\s*(?:(\d+)\s+days?,\s*)?(\d+):(\d{1,2}):(\d{1,2}(?:\.\d+)?)\s*$/.exec(v);
  if (!m) return null;
  return Number(m[1] ?? 0) * 86400 + Number(m[2]) * 3600 + Number(m[3]) * 60 + Number(m[4]);
};

// a span as a clock: 5:00, 1:30:00 (hours as many as there are); a part of a second counts as a
// whole one, so a countdown shows 0:01 through its last second and 0:00 when it ends
export const clockText = (s: number) => {
  const t = Math.max(0, Math.ceil(s - 1e-3));
  const h = Math.floor(t / 3600),
    m = Math.floor((t % 3600) / 60),
    sec = t % 60;
  const two = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${two(m)}:${two(sec)}` : `${m}:${two(sec)}`;
};

// a time left: until `ends` while it runs (ms), else `left` (seconds) standing still; `total` the
// whole span it runs down from (a timer's duration), where it has one
export interface Countdown {
  ends: number | null;
  left: number;
  total: number | null;
}
// the seconds left at `now`
export const leftAt = (cd: Countdown, now: number) =>
  cd.ends === null ? cd.left : Math.max(0, (cd.ends - now) / 1000);
// the share of the whole still left (null without a whole)
export const shareLeft = (cd: Countdown, now: number) =>
  cd.total ? Math.min(1, Math.max(0, leftAt(cd, now) / cd.total)) : null;

// a timer's time left: running until `finishes_at` (else its `remaining` from its last change),
// paused at its `remaining`; idle (or not known) none
export const timerClock = (st: HassEntity | undefined, now: number): Countdown | null => {
  if (!st) return null;
  const a = st.attributes;
  const total = parseHms(a.duration) || null;
  if (st.state === "active") {
    let ends = Date.parse(String(a.finishes_at ?? ""));
    if (!Number.isFinite(ends)) {
      const rem = parseHms(a.remaining),
        at = Date.parse(st.last_changed);
      if (rem === null || !Number.isFinite(at)) return null;
      ends = at + rem * 1000;
    }
    return { ends, left: Math.max(0, (ends - now) / 1000), total };
  }
  if (st.state === "paused") {
    const rem = parseHms(a.remaining);
    return rem === null ? null : { ends: null, left: rem, total };
  }
  return null;
};

// the time until a moment ahead (an ISO date, a timestamp sensor's state); a moment passed stands
// at zero; null for anything that is no date
export const momentAhead = (raw: unknown, now: number): Countdown | null => {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(raw)) return null;
  const t = Date.parse(raw);
  if (!Number.isFinite(t)) return null;
  return t > now
    ? { ends: t, left: (t - now) / 1000, total: null }
    : { ends: null, left: 0, total: null };
};

// ----- the page clock -----

// what an element shows of the seconds left: its text, or (a bar) its width
type Write = (left: number) => string;
interface Live {
  ends: number;
  write: Write;
  prop: "text" | "width";
}
const live = new Map<HTMLElement, Live>();
let timer: ReturnType<typeof setTimeout> | undefined;
let dueAt = Infinity;
// a text that grew as it ran down (1h → 59m 59s) tells its card, which fits its value again (the
// poster's value, a table's row): composed, so it reaches the card's host from its shadow root
export const LIVE_GREW = "pro-cards-live-grew";

const put = (el: HTMLElement, l: Pick<Live, "write" | "prop">, left: number, tell = false) => {
  const v = l.write(left);
  if (l.prop === "width") {
    if (el.style.width !== v) el.style.width = v;
    return;
  }
  const was = el.textContent ?? "";
  if (was === v) return;
  el.textContent = v;
  if (tell && v.length > was.length)
    el.dispatchEvent(new Event(LIVE_GREW, { bubbles: true, composed: true }));
};
// once a second, in step with the next whole second any of them reaches (a text changes there);
// elements no longer on the page are dropped (a card coming back fills its rows again)
const tick = () => {
  timer = undefined;
  dueAt = Infinity;
  const now = Date.now();
  for (const [el, l] of live) {
    if (!el.isConnected) {
      live.delete(el);
      continue;
    }
    put(el, l, Math.max(0, (l.ends - now) / 1000), true);
    if (l.ends <= now) live.delete(el);
  }
  schedule(now);
};
// (an element added whose next second comes sooner than the tick asked for moves the tick up)
const schedule = (now: number) => {
  if (!live.size) return;
  let wait = 1000;
  for (const l of live.values()) wait = Math.min(wait, ((l.ends - now) % 1000) + 1);
  wait = Math.max(16, wait);
  if (timer !== undefined && dueAt <= now + wait) return;
  clearTimeout(timer);
  dueAt = now + wait;
  timer = setTimeout(tick, wait);
};

const run = (el: HTMLElement, cd: Countdown, write: Write, prop: Live["prop"]) => {
  const now = Date.now();
  put(el, { write, prop }, leftAt(cd, now));
  if (cd.ends === null || cd.ends <= now) {
    live.delete(el);
    return;
  }
  live.set(el, { ends: cd.ends, write, prop });
  schedule(now);
};
// the element's text for the time left now, kept current while it runs
export const liveText = (el: HTMLElement, cd: Countdown, write: Write) =>
  run(el, cd, write, "text");
// the element's width for the share of the whole left now, kept current while it runs
export const liveWidth = (el: HTMLElement, cd: Countdown) => {
  const total = cd.total;
  if (!total) return;
  run(el, cd, (left) => `${((Math.min(total, left) / total) * 100).toFixed(2)}%`, "width");
};
