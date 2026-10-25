// A date range picker in the manner of Home Assistant's, without its components (they are the
// frontend's internals, loaded lazily): quick picks (today, yesterday, this week, month and year,
// the last 7 and 30 days) and a month of days on which two clicks pick a range – its first day,
// then its last (the same day twice: that day). The title opens the months of the year and a dozen
// years, to get to a far month quickly. It opens in the browser's top layer (`popover`), so no
// card's `overflow` cuts it, and sits under (or over) the element that opened it. Days are the
// calendar's in the given time zone, weeks start on Monday (as the periods do), nothing after
// today can be picked. The arrow keys move through the cells (Page Up / Down: the page before /
// after), Enter picks, Escape closes.
import { rangeAt, zonedMidnight, zonedParts } from "./calendar.ts";
import { t } from "./i18n.ts";
import type { HomeAssistant } from "./ha.ts";
import { fs, fw } from "./typography.ts";

export interface DatePickerOpts {
  hass: HomeAssistant;
  tz: string;
  lang: string;
  start: number; // the range shown: its first instant …
  end: number; // … and the first instant after it
  // a pick: the first instant of its first day and the first instant after its last day
  onPick: (start: number, end: number) => void;
}

const fmts = new Map<string, Intl.DateTimeFormat>();
const fmt = (lang: string, tz: string, o: Intl.DateTimeFormatOptions) => {
  const key = `${lang}|${tz}|${JSON.stringify(o)}`;
  let f = fmts.get(key);
  if (!f) {
    try {
      f = new Intl.DateTimeFormat(lang, { ...o, timeZone: tz });
    } catch {
      f = new Intl.DateTimeFormat(undefined, o);
    }
    fmts.set(key, f);
  }
  return f;
};

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = "") => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
};
const iconButton = (cls: string, icon: string, label: string) => {
  const b = el("button", `dp-nav ${cls}`);
  b.type = "button";
  b.setAttribute("aria-label", label);
  const i = document.createElement("ha-icon");
  i.setAttribute("icon", icon);
  b.appendChild(i);
  return b;
};

// a cell of a page: its instant, its text, its label for a screen reader
interface Cell {
  t: number;
  text: string;
  label: string;
  dim: boolean; // a day of the month before or after
}
// a page: day (a month's days), month (a year's months), year (a dozen years)
interface Page {
  view: "day" | "month" | "year";
  y: number;
  m: number;
}

const cellsOf = (p: Page, tz: string, lang: string): Cell[] => {
  if (p.view === "day") {
    const first = zonedMidnight(p.y, p.m, 1, tz);
    const wd = zonedParts(first, tz).wd;
    const dayFmt = fmt(lang, tz, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return Array.from({ length: 42 }, (_, i) => {
      const t0 = zonedMidnight(p.y, p.m, 1 - wd + i, tz);
      const parts = zonedParts(t0, tz);
      return { t: t0, text: String(parts.d), label: dayFmt.format(t0), dim: parts.m !== p.m };
    });
  }
  if (p.view === "month") {
    const short = fmt(lang, tz, { month: "short" }),
      long = fmt(lang, tz, { month: "long", year: "numeric" });
    return Array.from({ length: 12 }, (_, k) => {
      const t0 = zonedMidnight(p.y, k + 1, 1, tz);
      return { t: t0, text: short.format(t0), label: long.format(t0), dim: false };
    });
  }
  const base = Math.floor(p.y / 12) * 12;
  return Array.from({ length: 12 }, (_, k) => {
    const t0 = zonedMidnight(base + k, 1, 1, tz);
    return { t: t0, text: String(base + k), label: String(base + k), dim: false };
  });
};

const titleOf = (p: Page, tz: string, lang: string) => {
  if (p.view === "day")
    return fmt(lang, tz, { month: "long", year: "numeric" }).format(zonedMidnight(p.y, p.m, 1, tz));
  if (p.view === "month") return String(p.y);
  const base = Math.floor(p.y / 12) * 12;
  return `${base} – ${base + 11}`;
};

// the page before / after
const shift = (p: Page, dir: number): Page => {
  if (p.view === "day") {
    const k = p.y * 12 + (p.m - 1) + dir;
    return { ...p, y: Math.floor(k / 12), m: (k % 12) + 1 };
  }
  return { ...p, y: p.y + dir * (p.view === "month" ? 1 : 12) };
};

// the cell an instant falls in, on a page of that view
const cellStart = (view: Page["view"], t0: number, tz: string) => {
  const { y, m, d } = zonedParts(t0, tz);
  return view === "day"
    ? zonedMidnight(y, m, d, tz)
    : view === "month"
      ? zonedMidnight(y, m, 1, tz)
      : zonedMidnight(y, 1, 1, tz);
};
// the first instant after the day of `t0`
const dayEnd = (t0: number, tz: string) => {
  const { y, m, d } = zonedParts(t0, tz);
  return zonedMidnight(y, m, d + 1, tz);
};

export const openDatePicker = (
  anchor: HTMLElement,
  host: ShadowRoot | HTMLElement,
  o: DatePickerOpts,
) => {
  host.querySelector(".dp")?.remove();
  const { hass, tz, lang } = o;
  const now = Date.now();
  const shown = { start: o.start, end: Math.min(o.end, dayEnd(now, tz)) };
  // the first day picked, while the last is still to come (null: none yet)
  let first: number | null = null;
  // the day under the pointer or the focus, for the band while the last day is chosen
  let over: number | null = null;
  const startParts = zonedParts(Math.min(shown.start, now), tz);
  let page: Page = { view: "day", y: startParts.y, m: startParts.m };
  // the cell that holds the focus (its start)
  let focusT = cellStart("day", Math.min(shown.start, now), tz);

  const box = el("div", "dp");
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-label", t(hass, "calendar.choose"));
  const supportsPopover = typeof box.showPopover === "function";
  if (supportsPopover) box.setAttribute("popover", "auto");

  // quick picks
  const quick = el("div", "dp-quick");
  const day = (k: number) => {
    const p = zonedParts(now, tz);
    return zonedMidnight(p.y, p.m, p.d + k, tz);
  };
  const period = (k: "week" | "month" | "year") => {
    const r = rangeAt(k, now, now, tz);
    return [r.start, r.end] as const;
  };
  const presets: [string, number, number][] = [
    [t(hass, "energy.period.today"), day(0), day(1)],
    [t(hass, "energy.period.yesterday"), day(-1), day(0)],
    [t(hass, "energy.period.week"), ...period("week")],
    [t(hass, "energy.period.month"), ...period("month")],
    [t(hass, "energy.period.year"), ...period("year")],
    [t(hass, "energy.period.last_7"), day(-6), day(1)],
    [t(hass, "energy.period.last_30"), day(-29), day(1)],
  ];
  for (const [text, a, b] of presets) {
    const btn = el("button", "dp-preset", text);
    btn.type = "button";
    btn.classList.toggle("on", a === shown.start && b === shown.end);
    btn.addEventListener("click", () => pick(a, b));
    quick.appendChild(btn);
  }

  // the calendar
  const head = el("div", "dp-head");
  const prev = iconButton("prev", "mdi:chevron-left", t(hass, "calendar.earlier"));
  const next = iconButton("next", "mdi:chevron-right", t(hass, "calendar.later"));
  // the title opens the months, then the years
  const title = el("button", "dp-title");
  title.type = "button";
  title.setAttribute("aria-live", "polite");
  head.append(prev, title, next);
  const week = el("div", "dp-week");
  const narrow = fmt(lang, "UTC", { weekday: "narrow" });
  // 1 January 2024 was a Monday
  for (let i = 0; i < 7; i++)
    week.appendChild(el("span", "", narrow.format(Date.UTC(2024, 0, 1 + i))));
  const grid = el("div", "dp-grid");
  const hint = el("div", "dp-hint");
  prev.addEventListener("click", () => turn(-1));
  next.addEventListener("click", () => turn(1));
  title.addEventListener("click", () => {
    if (page.view === "year") return;
    page = { ...page, view: page.view === "day" ? "month" : "year" };
    focusT = cellStart(page.view, Math.min(focusT, now), tz);
    draw(false);
  });

  const cal = el("div", "dp-cal");
  cal.append(head, week, grid, hint);
  box.append(quick, cal);
  host.appendChild(box);

  const pick = (a: number, b: number) => {
    o.onPick(a, b);
    close();
  };

  const turn = (dir: number) => {
    page = shift(page, dir);
    const cells = cellsOf(page, tz, lang).filter((c) => !c.dim);
    focusT = Math.min(cells[0].t, cellStart(page.view, now, tz));
    draw(false);
  };

  // the band: the range shown, or – while the last day is chosen – from the first day to the one
  // under the pointer
  const band = () => {
    if (first === null) return shown;
    const to = over ?? first;
    return { start: Math.min(first, to), end: dayEnd(Math.max(first, to), tz) };
  };

  // the band and the focus on the cells drawn (the pointer moving over the days changes only these)
  const paint = () => {
    if (page.view !== "day") return;
    hint.textContent = t(hass, first === null ? "calendar.pick_first" : "calendar.pick_last");
    const r = band();
    const cells = [...grid.querySelectorAll<HTMLButtonElement>(".dp-cell")];
    cells.forEach((b, i) => {
      const t0 = Number(b.dataset.t);
      const end = cells[i + 1] ? Number(cells[i + 1].dataset.t) : dayEnd(t0, tz);
      const inRange = t0 >= r.start && t0 < r.end;
      b.classList.toggle("in", inRange);
      b.classList.toggle("first", inRange && t0 === r.start);
      b.classList.toggle("last", inRange && end >= r.end);
      b.classList.toggle("pending", first !== null && inRange);
      if (inRange) b.setAttribute("aria-pressed", "true");
      else b.removeAttribute("aria-pressed");
      b.tabIndex = t0 === focusT ? 0 : -1;
    });
  };
  // the band follows the day under the pointer (or the focus) while the last day is chosen
  const preview = (t0: number) => {
    if (first === null || over === t0) return;
    over = t0;
    focusT = t0;
    paint();
  };

  const draw = (focus: boolean) => {
    title.textContent = titleOf(page, tz, lang);
    title.disabled = page.view === "year";
    week.hidden = page.view !== "day";
    grid.className = `dp-grid ${page.view}`;
    hint.textContent = "";
    const cells = cellsOf(page, tz, lang);
    const nowCell = cellStart(page.view, now, tz);
    // no page that starts after today
    next.disabled = cellsOf(shift(page, 1), tz, lang).filter((c) => !c.dim)[0].t > nowCell;
    grid.replaceChildren(
      ...cells.map((c, i) => {
        const b = el("button", "dp-cell", c.text);
        b.type = "button";
        b.setAttribute("aria-label", c.label);
        b.dataset.t = String(c.t);
        b.tabIndex = c.t === focusT ? 0 : -1;
        b.classList.toggle("now", c.t === nowCell);
        if (c.t === nowCell) b.setAttribute("aria-current", "date");
        b.disabled = c.t > nowCell;
        if (page.view !== "day") {
          // a month or a year: open its days (or months)
          b.classList.toggle(
            "in",
            c.t <= shown.start && shown.start < (cells[i + 1]?.t ?? Infinity),
          );
          b.addEventListener("click", () => {
            const p = zonedParts(c.t, tz);
            page = { view: page.view === "year" ? "month" : "day", y: p.y, m: p.m };
            focusT = cellStart(page.view, Math.min(c.t, now), tz);
            draw(true);
          });
          return b;
        }
        b.classList.toggle("dim", c.dim);
        b.addEventListener("pointerenter", () => {
          if (!b.disabled) preview(c.t);
        });
        b.addEventListener("focus", () => preview(c.t));
        // the first click: the range's first day; the second: its last
        b.addEventListener("click", () => {
          if (first === null) {
            first = over = focusT = c.t;
            paint();
            return;
          }
          pick(Math.min(first, c.t), dayEnd(Math.max(first, c.t), tz));
        });
        return b;
      }),
    );
    paint();
    if (focus) grid.querySelector<HTMLElement>(`[data-t="${focusT}"]`)?.focus();
  };

  // the arrow keys move through the cells; past a page's edge onto the next page
  grid.addEventListener("keydown", (ev) => {
    const cols = page.view === "day" ? 7 : 3;
    if (ev.key === "PageUp" || ev.key === "PageDown") {
      ev.preventDefault();
      turn(ev.key === "PageUp" ? -1 : 1);
      grid.querySelector<HTMLElement>(`[data-t="${focusT}"]`)?.focus();
      return;
    }
    const step =
      ev.key === "ArrowLeft"
        ? -1
        : ev.key === "ArrowRight"
          ? 1
          : ev.key === "ArrowUp"
            ? -cols
            : ev.key === "ArrowDown"
              ? cols
              : 0;
    if (!step) return;
    ev.preventDefault();
    const { y, m, d } = zonedParts(focusT, tz);
    const to =
      page.view === "day"
        ? zonedMidnight(y, m, d + step, tz)
        : page.view === "month"
          ? zonedMidnight(y, m + step, 1, tz)
          : zonedMidnight(y + step, 1, 1, tz);
    if (to > cellStart(page.view, now, tz)) return;
    // past the page's edge: the page that holds it
    if (!cellsOf(page, tz, lang).some((c) => c.t === to && !c.dim)) {
      const p = zonedParts(to, tz);
      page = { view: page.view, y: p.y, m: p.m };
    }
    focusT = to;
    if (first !== null && page.view === "day") over = to;
    draw(true);
  });

  const outside = (ev: PointerEvent) => {
    if (!ev.composedPath().includes(box) && !ev.composedPath().includes(anchor)) close();
  };
  const onKey = (ev: KeyboardEvent) => {
    if (ev.key === "Escape") close();
  };
  const place = () => {
    const a = anchor.getBoundingClientRect(),
      b = box.getBoundingClientRect();
    const vw = window.innerWidth,
      vh = window.innerHeight;
    const left = Math.max(8, Math.min(a.right - b.width, vw - b.width - 8));
    const below = a.bottom + 6;
    const top =
      below + b.height > vh - 8 && a.top - 6 - b.height > 8 ? a.top - 6 - b.height : below;
    box.style.left = `${left}px`;
    box.style.top = `${Math.max(8, top)}px`;
  };
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    window.removeEventListener("resize", place);
    document.removeEventListener("pointerdown", outside, true);
    box.removeEventListener("keydown", onKey);
    if (supportsPopover && box.matches(":popover-open")) box.hidePopover();
    box.remove();
    anchor.setAttribute("aria-expanded", "false");
    anchor.focus();
  };

  draw(false);
  if (supportsPopover) {
    box.showPopover();
    // light dismiss and Escape close a popover by themselves
    box.addEventListener("toggle", (ev) => {
      if ((ev as ToggleEvent).newState === "closed") close();
    });
  } else {
    box.classList.add("dp-fallback");
    document.addEventListener("pointerdown", outside, true);
    box.addEventListener("keydown", onKey);
  }
  anchor.setAttribute("aria-expanded", "true");
  place();
  window.addEventListener("resize", place);
  grid.querySelector<HTMLElement>(`[data-t="${focusT}"]`)?.focus();
  return close;
};

export const STYLE_DATEPICKER = `
  .dp { position: fixed; margin: 0; inset: auto; box-sizing: border-box; display: flex; gap: 12px; width: min(420px, calc(100vw - 16px)); max-height: calc(100vh - 16px); overflow: auto; padding: 12px; border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color, #e0e0e0)); border-radius: var(--ha-card-border-radius, 12px); background: var(--card-background-color, var(--ha-card-background, #fff)); color: var(--primary-text-color); box-shadow: 0 5px 5px -3px rgba(0,0,0,.2), 0 8px 10px 1px rgba(0,0,0,.14), 0 3px 14px 2px rgba(0,0,0,.12); --dp-c: var(--primary-color); --dp-soft: color-mix(in srgb, var(--dp-c) 18%, transparent); --dp-track: color-mix(in srgb, var(--primary-text-color) 8%, transparent); font-size: ${fs(13)}; }
  .dp.dp-fallback { z-index: 1000; }
  .dp ha-icon { display: inline-flex; line-height: 0; --mdc-icon-size: 20px; }
  .dp button { font: inherit; color: inherit; border: 0; background: none; cursor: pointer; }
  .dp button:disabled { opacity: .3; cursor: default; }
  .dp button:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--dp-c); }
  .dp-quick { display: flex; flex-direction: column; gap: 2px; flex: none; padding-right: 12px; border-right: 1px solid var(--divider-color, rgba(0,0,0,.12)); }
  .dp-preset { text-align: left; padding: 8px 10px; border-radius: 8px; white-space: nowrap; }
  .dp-preset:hover { background: var(--dp-track); }
  .dp-preset.on { background: var(--dp-soft); color: var(--dp-c); font-weight: ${fw("medium")}; }
  .dp-cal { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  .dp-hint { min-height: 1.4em; text-align: center; font-size: ${fs(12)}; color: var(--secondary-text-color); }
  .dp-head { display: flex; align-items: center; gap: 4px; }
  .dp-title { flex: 1; height: 32px; border-radius: 999px; text-align: center; font-weight: ${fw("medium")}; }
  .dp-title:hover:not(:disabled) { background: var(--dp-track); }
  .dp .dp-title:disabled { opacity: 1; }
  .dp-nav { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  .dp-nav:hover:not(:disabled) { background: var(--dp-track); }
  .dp-week, .dp-grid.day { display: grid; grid-template-columns: repeat(7, 1fr); }
  .dp-week span { text-align: center; font-size: ${fs(11)}; color: var(--secondary-text-color); padding-bottom: 2px; }
  .dp-grid.month, .dp-grid.year { display: grid; grid-template-columns: repeat(3, 1fr); row-gap: 6px; }
  .dp-cell { height: 34px; display: flex; align-items: center; justify-content: center; font-variant-numeric: tabular-nums; position: relative; }
  .dp-grid.month .dp-cell, .dp-grid.year .dp-cell { height: 40px; border-radius: 999px; }
  .dp-cell.dim { color: var(--secondary-text-color); }
  .dp-cell:hover:not(:disabled):not(.in) { background: var(--dp-track); border-radius: 999px; }
  .dp-cell.in { background: var(--dp-soft); color: var(--dp-c); font-weight: ${fw("medium")}; }
  .dp-cell.in.pending { background: color-mix(in srgb, var(--dp-c) 10%, transparent); }
  .dp-grid.day .dp-cell.in:not(.first):not(.last) { border-radius: 0; }
  .dp-grid.day .dp-cell.in.first { border-radius: 999px 0 0 999px; }
  .dp-grid.day .dp-cell.in.last { border-radius: 0 999px 999px 0; }
  .dp-grid.day .dp-cell.in.first.last { border-radius: 999px; }
  .dp-grid.day .dp-cell.in:nth-child(7n + 1) { border-top-left-radius: 999px; border-bottom-left-radius: 999px; }
  .dp-grid.day .dp-cell.in:nth-child(7n) { border-top-right-radius: 999px; border-bottom-right-radius: 999px; }
  .dp-cell.now::after { content: ""; position: absolute; inset: 3px; border-radius: 999px; box-shadow: inset 0 0 0 1px var(--dp-c); pointer-events: none; }
  .dp-grid.day .dp-cell.now::after { inset: 2px calc(50% - 15px); }
  @media (max-width: 460px) {
    .dp { flex-direction: column; }
    .dp-quick { flex-direction: row; flex-wrap: wrap; padding: 0 0 8px; border-right: 0; border-bottom: 1px solid var(--divider-color, rgba(0,0,0,.12)); }
  }
`;
