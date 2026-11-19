/*
 * schedule-card-pro – a schedule helper's week, edited on the card.
 *
 *   type: custom:schedule-card-pro
 *   entity: schedule.heating
 *   name / icon / color                     # the header (defaults: the entity's)
 *   data:                                   # the block data shown; the first is edited
 *     - { key: temperature, unit: °C, step: 0.5, min: 5, max: 30, default: 21 }
 *   edit: true                              # the pencil and a long press (admins, a schedule
 *                                           # made in the UI); false: view only
 *   snap: 15                                # minutes: 5 | 10 | 15 | 30 | 60
 *   first_weekday: monday                   # default: the profile's
 *
 * Edit mode keeps every change on the card until Done, which saves the week in one call
 * (`schedule/update`); Undo steps back before that. A tap selects a block (a day's name selects
 * the day), its handles change its times, a drag moves it (to another day too; the toolbar's toggle
 * copies), the dot under a day's selection copies it to the days it is dragged over, a drag on an
 * empty spot draws a new block (a tap: an hour). Blocks that land on others merge with them. Every
 * block is a button: Enter selects, the arrows move it (Shift: its end), Delete removes it.
 */
import { defineElement, fireEvent, fireHaptic, registerCard } from "./shared/card.ts";
import { cssColor, stateColorCss } from "./shared/color.ts";
import { EntityCardBase } from "./shared/entity/base.ts";
import type { RenderCtx } from "./shared/entity/model.ts";
import { fmtDayMinutes, formatKeyOf, textWidth } from "./shared/format.ts";
import { measure } from "./shared/typography.ts";
import type { GridOptions, HassEntity, HomeAssistant } from "./shared/ha.ts";
import { hideHover } from "./shared/hover.ts";
import { t } from "./shared/i18n.ts";
import {
  addBlock,
  daysText,
  drawBounds,
  drawn,
  fillDays,
  findBlock,
  relocate,
  resize,
  removeBlocks,
  setData,
  snapMin,
  withIds,
  withoutIds,
  type EBlock,
  type EDays,
} from "./shared/schedule/edit.ts";
import {
  knownWeek,
  onScheduleWeek,
  saveWeek,
  ScheduleSaveError,
  scheduleEditable,
  scheduleWeek,
} from "./shared/schedule/feed.ts";
import {
  DAY_MIN,
  dataValue,
  nextChange,
  rotate,
  sameWeek,
  unrotate,
  weekPos,
  type Block,
  type Week,
} from "./shared/schedule/model.ts";
import {
  blockText,
  changeText,
  dayNames,
  firstWeekdayOf,
  rangeText,
  scheduleZone,
  valueText,
} from "./shared/schedule/text.ts";
import { ofDomain } from "./shared/suggest.ts";
import { escapeHtml as esc, qs, stepDecimals } from "./shared/util.ts";
import {
  CARD_TYPE,
  normalizeScheduleCardConfig,
  type ScheduleCardConfig,
} from "./schedule/config.ts";
import { HOLD_MS } from "./shared/entity/constants.ts";
import { ScheduleCardEditor } from "./schedule/editor.ts";
import { weekHtml, type DayNames, type EditView, type Span } from "./schedule/render.ts";
import { STYLE_SCHEDULE_CARD } from "./schedule/styles.ts";

defineElement(`${CARD_TYPE}-editor`, ScheduleCardEditor);

// a pointer that moved less than this is still a tap
const SLOP = 6;
// "Saved" shows this long after Done
const SAVED_MS = 2000;

// what a pointer is doing on the week
type Gesture =
  | {
      type: "press";
      day: number;
      min: number;
      timer: ReturnType<typeof setTimeout>;
      off: () => void;
    }
  | { type: "block"; id: number; day: number; ids: number[] }
  | { type: "size"; edge: "from" | "to"; id: number; day: number; ids: number[] }
  | { type: "fill"; day: number; blocks: EBlock[] }
  | { type: "draw"; day: number; m0: number; lo: number; hi: number };
interface Drag {
  g: Gesture;
  pointer: number;
  x0: number;
  y0: number;
  moved: boolean;
  // the lanes' box and the rows' pitch at its start
  left: number;
  width: number;
  pitch: number;
  // the days before it (an undo goes back to them)
  base: EDays;
  // the snapped place it was last drawn at
  last?: string;
}
interface EditState {
  days: EDays;
  // the weekday the days start on, as edit mode started (the week is saved by it, whatever the
  // profile or the config says by then)
  first: number;
  // the week as edit mode started (unchanged: Done just leaves)
  start: Week;
  hist: EDays[];
  sel: number[];
  copy: boolean;
  saving: boolean;
  ghosts: Span[];
  draft: Span | null;
  bubble: { day: number; at: number; text: string } | null;
}

export class ScheduleCard extends EntityCardBase {
  static cardType = CARD_TYPE;
  declare _config?: ScheduleCardConfig;
  _edit: EditState | null = null;
  _drag: Drag | null = null;
  // a long press entered edit mode: its release selects nothing more
  _pressed = false;
  _saved = 0;
  _savedTimer?: ReturnType<typeof setTimeout>;
  // the tooltip's block (view mode): its day and minute
  _tipAt: { day: number; min: number } | null = null;
  _bodyInputs: unknown[] = [];
  _laneW = 0;
  _unweek?: () => void;
  // the focus to give back after the week is drawn again (a block's id, a day)
  _refocusSel: string | null = null;

  static getConfigElement() {
    return document.createElement(`${CARD_TYPE}-editor`);
  }
  static getStubConfig(hass: HomeAssistant | undefined, entities?: string[]) {
    const all = [...(entities || []), ...Object.keys(hass?.states ?? {})];
    return { entity: all.find((id) => id.startsWith("schedule.")) ?? "" };
  }
  _normalize(raw: unknown) {
    return normalizeScheduleCardConfig(raw);
  }
  _styles() {
    return STYLE_SCHEDULE_CARD;
  }
  getGridOptions(): GridOptions {
    return { columns: 12, rows: "auto", min_columns: 6 };
  }
  getCardSize() {
    return 5;
  }
  setConfig(config: unknown) {
    super.setConfig(config);
    this._edit = null;
    this._endDrag();
    this._bodyInputs = [];
    // the line at now and when it changes next follow the clock
    this._timed = true;
    this._armMinute();
  }
  // a user who becomes (or stops being) an administrator: the pencil comes or goes
  _setHass(hass: HomeAssistant) {
    const was = this._hass?.user?.is_admin;
    super._setHass(hass);
    if (was !== undefined && was !== hass.user?.is_admin) this._render();
  }
  _extraWatchIds(cfg: ScheduleCardConfig) {
    return [cfg.entity];
  }
  _headerExtra() {
    return true;
  }
  _defaultTitle(ctx: RenderCtx) {
    const cfg = this._config as ScheduleCardConfig;
    const st = ctx.hass?.states[cfg.entity];
    return (st?.attributes.friendly_name as string | undefined) ?? cfg.entity;
  }
  connectedCallback() {
    super.connectedCallback();
    this._unweek?.();
    this._unweek = onScheduleWeek((id) => {
      if (id === this._config?.entity) this._render();
    });
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unweek?.();
    this._unweek = undefined;
    this._endDrag();
    clearTimeout(this._savedTimer);
  }

  // ----- DOM -----
  _buildHeader(header: HTMLElement) {
    const next = document.createElement("div");
    next.className = "snext";
    next.innerHTML = `<ha-icon icon="mdi:clock-outline"></ha-icon><span></span>`;
    const ctl = document.createElement("div");
    ctl.className = "sctl";
    header.append(next, ctl);
    ctl.addEventListener("click", (ev) => this._onHeaderClick(ev));
  }
  _buildBody(body: HTMLElement) {
    const wk = document.createElement("div");
    wk.className = "sbox wk";
    wk.addEventListener("pointerdown", (ev) => this._onDown(ev));
    wk.addEventListener("pointermove", (ev) => this._onMove(ev));
    wk.addEventListener("pointerup", (ev) => this._onUp(ev, false));
    wk.addEventListener("pointercancel", (ev) => this._onUp(ev, true));
    wk.addEventListener("pointerleave", (ev) => {
      if (ev.pointerType !== "touch" && !this._drag) this._hideTip();
    });
    wk.addEventListener("click", (ev) => this._onClick(ev));
    wk.addEventListener("keydown", (ev) => this._onKey(ev));
    // a long press on a phone opens no menu over the week
    wk.addEventListener("contextmenu", (ev) => {
      if (this._editable() || this._edit) ev.preventDefault();
    });
    body.appendChild(wk);
    this._bodyInputs = [];
  }

  // ----- what the card shows -----
  // the weekday the week starts on (0 = Monday); while editing, the one the edit began with
  _first() {
    if (this._edit) return this._edit.first;
    const cfg = this._config as ScheduleCardConfig;
    return cfg.firstWeekday ?? firstWeekdayOf(this._hass);
  }
  _names(): DayNames[] {
    const short = dayNames(this._hass, "short"),
      narrow = dayNames(this._hass, "narrow"),
      long = dayNames(this._hass, "long");
    return rotate(
      short.map((s, i) => ({ short: s, narrow: narrow[i], long: long[i] })),
      this._first(),
    );
  }
  // whether the user may edit this schedule now
  _editable(): boolean {
    const cfg = this._config;
    const st = cfg && this._hass?.states[cfg.entity];
    if (!cfg?.edit || !st || st.state === "unavailable") return false;
    return scheduleEditable(this._hass, cfg.entity);
  }
  // the week shown (in the card's order of days): the one edited, else Home Assistant's
  _shownDays(week: Week | null | undefined): readonly (readonly (Block | EBlock)[])[] {
    if (this._edit) return this._edit.days;
    return week ? rotate(week, this._first()) : Array.from({ length: 7 }, () => []);
  }

  _render() {
    super._render();
    const cfg = this._config,
      hass = this._hass,
      card = this._root;
    if (!cfg || !hass || !card) return;
    const st = hass.states[cfg.entity];
    // the card's colour, else Home Assistant's for the schedule while on
    card.style.setProperty(
      "--fe-color",
      cssColor(cfg.color) ??
        stateColorCss(st ?? ({ entity_id: cfg.entity } as HassEntity), "on") ??
        "var(--primary-color)",
    );
    const header = card.querySelector<HTMLElement>(".header");
    if (header && !cfg.icon) {
      const hi = qs(header, "ha-icon");
      hi.setAttribute("icon", (st?.attributes.icon as string | undefined) || "mdi:calendar-clock");
      hi.style.display = "";
    }
    const week = scheduleWeek(hass, cfg.entity);
    // (nothing to edit before the week is read)
    const editable = week ? this._editable() : week === null ? false : undefined;
    const tz = scheduleZone(hass);
    const now = Date.now();
    const pos = weekPos(now, tz);
    const first = this._first();
    const today = (pos.day - first + 7) % 7;
    if (header) this._drawHeader(header, week, editable, pos.day, now);
    const wk = card.querySelector<HTMLElement>(".wk");
    if (!wk) return;
    const lane = wk.querySelector<HTMLElement>(".slane");
    if (lane?.clientWidth) this._laneW = lane.clientWidth;
    // the week is drawn again only when what it shows changed (or a drag moved)
    const inputs = [
      this._laneW,
      week,
      this._edit,
      this._drag?.moved,
      Math.floor(now / 60e3),
      formatKeyOf(hass),
      first,
      editable,
      st?.state,
      this._fillEpoch,
    ];
    if (
      inputs.length === this._bodyInputs.length &&
      inputs.every((v, i) => Object.is(v, this._bodyInputs[i]))
    )
      return;
    this._bodyInputs = inputs;
    wk.classList.toggle("edit", !!this._edit);
    wk.classList.toggle("editable", !!editable);
    const e = this._edit;
    const sel = new Set(e?.sel ?? []);
    let editView: EditView | null = null;
    if (e) {
      const where = e.sel.map((id) => findBlock(e.days, id)).filter((x) => !!x);
      const oneDay = where.length > 0 && where.every((w) => w.d === where[0].d);
      const dragging = !!this._drag?.moved;
      editView = {
        sel,
        ghosts: e.ghosts,
        draft: e.draft,
        bubble: e.bubble,
        fill:
          oneDay && (!dragging || this._drag?.g.type === "fill")
            ? {
                day: where[0].d,
                at:
                  (Math.min(...where.map((w) => w.b.from)) +
                    Math.max(...where.map((w) => w.b.to))) /
                  2,
              }
            : null,
        dragging,
        laneW: this._laneW || 300,
        // a block's text as its style draws it (measured once per theme)
        textW: (text: string) =>
          textWidth(text, measure(this._textCache, wk, ["sb", "st"], [10, 12, 500]).font),
      };
    }
    const focused = this._focusKey();
    wk.innerHTML = weekHtml({
      hass,
      days: this._shownDays(week),
      names: this._names(),
      today,
      now: pos.min,
      specs: cfg.data,
      loading: week === undefined,
      edit: editView,
    });
    this._fitDays(wk);
    if (e && e.sel.length && !this._drag?.moved) this._placeBar(wk, e);
    this._refocusWeek(wk, this._refocusSel ?? focused);
    this._refocusSel = null;
    if (this._tipAt && !e) this._showTip(this._tipAt.day, this._tipAt.min);
  }

  // the days' column as wide as its widest name (a language's three letters may need more than
  // 28 px), never narrower
  _fitDays(wk: HTMLElement) {
    const keys = [...wk.querySelectorAll<HTMLElement>(".key")];
    // (an inline box has no scroll width: its drawn one)
    const w = Math.max(28, ...keys.map((k) => Math.ceil(k.getBoundingClientRect().width)));
    if (wk.style.getPropertyValue("--sdn") !== `${w}px`) wk.style.setProperty("--sdn", `${w}px`);
  }

  // when it changes next (or Saved), and the buttons of the mode
  _drawHeader(
    header: HTMLElement,
    week: Week | null | undefined,
    editable: boolean | undefined,
    today: number,
    now: number,
  ) {
    const cfg = this._config as ScheduleCardConfig,
      hass = this._hass;
    const st = hass?.states[cfg.entity];
    const next = qs(header, ".snext");
    let text = "";
    if (!st || st.state === "unavailable") text = t(hass, "common.unavailable");
    else if (now < this._saved) text = t(hass, "schedule.saved");
    else if (week) {
      const c = nextChange(week, weekPos(now, scheduleZone(hass)));
      if (c) text = changeText(hass, c, today);
    }
    next.hidden = !text || !!this._edit;
    qs(next, "ha-icon").setAttribute("icon", now < this._saved ? "mdi:check" : "mdi:clock-outline");
    const span = qs(next, "span");
    if (span.textContent !== text) span.textContent = text;
    const ctl = qs(header, ".sctl");
    const key = JSON.stringify([
      !!this._edit,
      this._edit?.sel.length,
      this._edit?.hist.length,
      this._edit?.saving,
      this._edit?.copy,
      editable,
      cfg.edit,
      st?.state === "unavailable",
      formatKeyOf(hass),
    ]);
    if (ctl.dataset.key === key) return;
    const keep = this.shadowRoot?.activeElement?.closest?.(".sctl")
      ? (this.shadowRoot.activeElement as HTMLElement).dataset.act
      : null;
    ctl.dataset.key = key;
    const btn = (act: string, icon: string, label: string, cls = "sbtn", extra = "") =>
      `<button class="${cls}" data-act="${act}" aria-label="${label}" title="${label}"${extra}><ha-icon icon="${icon}"></ha-icon></button>`;
    const e = this._edit;
    if (e) {
      ctl.innerHTML =
        (e.sel.length
          ? `<button class="spill" data-act="clear" aria-label="${esc(t(hass, "schedule.clear"))}"><span>${esc(t(hass, "schedule.selected", { n: e.sel.length }))}</span><ha-icon icon="mdi:close"></ha-icon></button>`
          : "") +
        btn("add", "mdi:plus", esc(t(hass, "schedule.add"))) +
        btn(
          "undo",
          "mdi:undo",
          esc(t(hass, "schedule.undo")),
          "sbtn",
          e.hist.length ? "" : " disabled",
        ) +
        `<button class="sbtn done${e.saving ? " saving" : ""}" data-act="done"${e.saving ? " disabled" : ""}>${esc(t(hass, e.saving ? "schedule.saving" : "schedule.done"))}</button>`;
    } else if (editable) ctl.innerHTML = btn("edit", "mdi:pencil", esc(t(hass, "schedule.edit")));
    else if (cfg.edit && editable === false && st && st.state !== "unavailable")
      ctl.innerHTML = `<span class="sbtn icon-only" role="img" aria-label="${esc(t(hass, "schedule.view_only"))}" title="${esc(t(hass, "schedule.view_only"))}"><ha-icon icon="mdi:eye-outline"></ha-icon></span>`;
    else ctl.innerHTML = "";
    if (keep)
      ctl.querySelector<HTMLElement>(`[data-act="${keep}"]`)?.focus({ preventScroll: true });
  }

  // the toolbar above the selection's topmost row, centred on it, kept inside the card (below the
  // selection where the card has no room above it)
  _placeBar(wk: HTMLElement, e: EditState) {
    const hass = this._hass;
    const cfg = this._config as ScheduleCardConfig;
    const spec = cfg.data[0] ?? null;
    const blocks = e.sel.map((id) => findBlock(e.days, id)).filter((x) => !!x);
    if (!blocks.length) return;
    const bar = document.createElement("div");
    bar.className = "sbar";
    bar.setAttribute("role", "toolbar");
    bar.setAttribute("aria-label", t(hass, "schedule.toolbar"));
    let html = "";
    if (spec) {
      const vals = blocks.map((w) => dataValue(w.b, spec.key));
      const same = vals.every((v) => v === vals[0]);
      const text = same && vals[0] !== null ? valueText(hass, vals[0], spec) : "–";
      const name = spec.key.replace(/_/g, " ");
      html += `<div class="sstep"><button class="sbtn" data-act="minus" aria-label="${esc(t(hass, "schedule.lower", { name }))}"><ha-icon icon="mdi:minus"></ha-icon></button><span class="val" aria-live="polite">${esc(text)}</span><button class="sbtn" data-act="plus" aria-label="${esc(t(hass, "schedule.raise", { name }))}"><ha-icon icon="mdi:plus"></ha-icon></button></div>`;
    }
    html += `<button class="sbtn track${e.copy ? " on" : ""}" data-act="copy" aria-pressed="${e.copy}" aria-label="${esc(t(hass, "schedule.copy"))}" title="${esc(t(hass, "schedule.copy"))}"><ha-icon icon="mdi:content-copy"></ha-icon></button>`;
    html += `<button class="sbtn track" data-act="delete" aria-label="${esc(t(hass, "schedule.delete"))}" title="${esc(t(hass, "schedule.delete"))}"><ha-icon icon="mdi:delete-outline"></ha-icon></button>`;
    bar.innerHTML = html;
    wk.appendChild(bar);
    const rows = wk.querySelectorAll<HTMLElement>(".wrow");
    const top = Math.min(...blocks.map((w) => w.d)),
      bottom = Math.max(...blocks.map((w) => w.d));
    const lane = wk.querySelector<HTMLElement>(".slane") as HTMLElement;
    const mid = blocks.reduce((a, w) => a + (w.b.from + w.b.to) / 2, 0) / blocks.length;
    const W = wk.clientWidth,
      bw = bar.offsetWidth,
      bh = bar.offsetHeight;
    const x = lane.offsetLeft + (mid / DAY_MIN) * lane.clientWidth - bw / 2;
    bar.style.left = `${Math.round(Math.max(0, Math.min(W - bw, x)))}px`;
    // above the row, clear of its blocks' rings; below the lowest row where it would cover the
    // header (its Undo and Done)
    const header = this._root?.querySelector<HTMLElement>(".header");
    const wkTop = wk.getBoundingClientRect().top;
    const headerBottom =
      header && !header.hidden ? header.getBoundingClientRect().bottom - wkTop : 0;
    let y = rows[top].offsetTop - bh - 8;
    if (y < headerBottom + 4) y = rows[bottom].offsetTop + rows[bottom].offsetHeight + 12;
    // never past the week's end (the card cuts it there): over the rows between, then
    bar.style.top = `${Math.round(Math.min(y, wk.clientHeight - bh))}px`;
  }

  // ----- the tooltip (view mode) -----
  _showTip(day: number, min: number) {
    const wk = this._root?.querySelector<HTMLElement>(".wk");
    const tip = wk?.querySelector<HTMLElement>(":scope > .tip");
    const lane = wk?.querySelector<HTMLElement>(`.slane[data-day="${day}"]`);
    const cfg = this._config;
    if (!wk || !tip || !lane || !cfg) return;
    const days = this._shownDays(knownWeek(cfg.entity));
    const b = days[day]?.find((x) => x.from <= min && min < x.to);
    if (!b) return this._hideTip();
    this._tipAt = { day, min };
    const name = this._names()[day].short;
    const text = blockText(this._hass, b, cfg.data, name);
    tip.textContent = text;
    tip.classList.add("on");
    const x = lane.offsetLeft + ((b.from + b.to) / 2 / DAY_MIN) * lane.clientWidth;
    const half = tip.offsetWidth / 2;
    tip.style.left = `${Math.round(Math.max(half, Math.min(wk.clientWidth - half, x)))}px`;
    tip.style.top = `${Math.round(lane.parentElement!.offsetTop - tip.offsetHeight - 6)}px`;
  }
  _hideTip() {
    this._tipAt = null;
    hideHover(this._root);
  }
  _hideHover() {
    super._hideHover();
    this._tipAt = null;
  }

  // ----- pointer -----
  // the day and minute under a pointer (the lane it is over, else the nearest row)
  _at(ev: PointerEvent, d?: Drag): { day: number; min: number } {
    const wk = this._root?.querySelector<HTMLElement>(".wk") as HTMLElement;
    const lanes = [...wk.querySelectorAll<HTMLElement>(".slane")];
    const r = lanes[0].getBoundingClientRect();
    const left = d?.left ?? r.left,
      width = d?.width ?? r.width;
    const min = Math.max(0, Math.min(DAY_MIN, ((ev.clientX - left) / (width || 1)) * DAY_MIN));
    let day = 0,
      best = Infinity;
    lanes.forEach((l, i) => {
      const b = l.getBoundingClientRect();
      const dist = Math.abs(ev.clientY - (b.top + b.bottom) / 2);
      if (dist < best) {
        best = dist;
        day = i;
      }
    });
    return { day, min };
  }
  _onDown(ev: PointerEvent) {
    if (ev.button !== 0 || !this._config) return;
    // a second finger while one drags, or anything while the week is saved, does nothing
    if (this._drag && ev.pointerId !== this._drag.pointer) return;
    if (this._edit?.saving) return;
    this._pressed = false;
    const target = ev.target as HTMLElement;
    const wk = ev.currentTarget as HTMLElement;
    wk.classList.toggle("touch", ev.pointerType === "touch");
    const lane = target.closest<HTMLElement>(".slane");
    if (!this._edit) {
      if (!lane) return;
      const at = this._at(ev);
      // a tap shows the block's tooltip (a mouse shows it on hover)
      this._showTip(at.day, at.min);
      if (!this._editable()) return;
      const timer = setTimeout(() => this._longPress(), HOLD_MS);
      // (not captured: the page scrolls under a finger; a release outside the week ends it too)
      const off = () => {
        window.removeEventListener("pointerup", end, true);
        window.removeEventListener("pointercancel", end, true);
      };
      const end = (up: PointerEvent) => {
        if (up.pointerId !== ev.pointerId) return;
        off();
        if (this._drag?.g.type === "press" && this._drag.pointer === up.pointerId) this._endDrag();
      };
      window.addEventListener("pointerup", end, true);
      window.addEventListener("pointercancel", end, true);
      this._startDrag(ev, { type: "press", day: at.day, min: at.min, timer, off }, false);
      return;
    }
    const e = this._edit;
    const act = target.closest<HTMLElement>("[data-act], .sb[data-id]");
    if (!act && !lane) return;
    // (a button keeps the focus it takes; the lane's own drag takes none)
    ev.preventDefault();
    if (act?.dataset.act === "fill") {
      const where = e.sel.map((id) => findBlock(e.days, id)).filter((x) => !!x);
      this._startDrag(ev, { type: "fill", day: where[0].d, blocks: where.map((w) => w.b) });
    } else if (act?.dataset.act === "from" || act?.dataset.act === "to") {
      const id = Number(act.dataset.id);
      const f = findBlock(e.days, id);
      if (f) this._startDrag(ev, { type: "size", edge: act.dataset.act, id, day: f.d, ids: e.sel });
    } else if (act?.classList.contains("sb")) {
      const id = Number(act.dataset.id);
      const f = findBlock(e.days, id);
      act.focus({ preventScroll: true });
      if (f)
        this._startDrag(ev, {
          type: "block",
          id,
          day: f.d,
          ids: e.sel.includes(id) ? e.sel : [id],
        });
    } else if (lane) {
      const at = this._at(ev);
      const day = Number(lane.dataset.day);
      const bounds = drawBounds(e.days[day], at.min);
      if (bounds) this._startDrag(ev, { type: "draw", day, m0: at.min, ...bounds });
    }
  }
  _startDrag(ev: PointerEvent, g: Gesture, capture = true) {
    const wk = ev.currentTarget as HTMLElement;
    const rows = wk.querySelectorAll<HTMLElement>(".wrow");
    const lane = wk.querySelector<HTMLElement>(".slane") as HTMLElement;
    const r = lane.getBoundingClientRect();
    this._endDrag();
    this._drag = {
      g,
      pointer: ev.pointerId,
      x0: ev.clientX,
      y0: ev.clientY,
      moved: false,
      left: r.left,
      width: r.width,
      pitch: rows.length > 1 ? rows[1].offsetTop - rows[0].offsetTop : 28,
      base: this._edit?.days ?? [],
    };
    if (capture)
      try {
        wk.setPointerCapture(ev.pointerId);
      } catch {
        // (a synthetic event)
      }
  }
  _endDrag() {
    const d = this._drag;
    if (d?.g.type === "press") {
      clearTimeout(d.g.timer);
      d.g.off();
    }
    this._drag = null;
  }
  _longPress() {
    const d = this._drag;
    if (!d || d.g.type !== "press" || !this._editable()) return;
    const g = d.g;
    g.off();
    this._drag = null;
    // its release clicks nothing; a pointer released elsewhere clicks nothing at all, so the flag
    // goes with the pointer (after the click its release makes here)
    this._pressed = true;
    const unpress = (up: PointerEvent) => {
      if (up.pointerId !== d.pointer) return;
      window.removeEventListener("pointerup", unpress, true);
      window.removeEventListener("pointercancel", unpress, true);
      setTimeout(() => (this._pressed = false));
    };
    window.addEventListener("pointerup", unpress, true);
    window.addEventListener("pointercancel", unpress, true);
    this._hideTip();
    this._enter();
    const e = this._edit as EditState | null;
    const b = e?.days[g.day].find((x) => x.from <= g.min && g.min < x.to);
    if (e && b) {
      e.sel = [b.id];
      this._refocusSel = `b${b.id}`;
    }
    fireHaptic(this, "medium");
    this._render();
  }
  _onMove(ev: PointerEvent) {
    const d = this._drag;
    if (!d) {
      // a mouse over the week shows the block under it
      if (
        !this._edit &&
        ev.pointerType !== "touch" &&
        (ev.target as HTMLElement).closest(".slane")
      ) {
        const at = this._at(ev);
        this._showTip(at.day, at.min);
      }
      return;
    }
    if (ev.pointerId !== d.pointer) return;
    const dx = ev.clientX - d.x0,
      dy = ev.clientY - d.y0;
    if (!d.moved && Math.abs(dx) < SLOP && Math.abs(dy) < SLOP) return;
    if (d.g.type === "press") {
      // moved before the press was long: a scroll, or the pointer looking around
      this._endDrag();
      return;
    }
    d.moved = true;
    this._hideTip();
    this._dragTo(d, ev);
  }
  // the edit a drag makes so far, shown (not yet in the undo history)
  _dragTo(d: Drag, ev: PointerEvent) {
    const e = this._edit;
    const cfg = this._config;
    if (!e || !cfg) return;
    const step = cfg.snap;
    const dx = ev.clientX - d.x0,
      dy = ev.clientY - d.y0;
    const dm = snapMin((dx / (d.width || 1)) * DAY_MIN, step);
    const dd = Math.round(dy / (d.pitch || 28));
    // the same snapped place as the move before: nothing to draw again
    const place =
      d.g.type === "draw" ? `${snapMin(this._at(ev, d).min, step)}|${dd}` : `${dd}|${dm}|${e.copy}`;
    if (place === d.last) return;
    d.last = place;
    const names = this._names().map((n) => n.short);
    const hass = this._hass;
    const g = d.g;
    if (g.type === "block") {
      // (blocks it lands on merge with it, on its own day as on another)
      const r =
        dd === 0 && dm === 0 && !e.copy
          ? { days: d.base, ids: g.ids, d: 0 }
          : (() => {
              const m = relocate(d.base, g.ids, dd, dm, e.copy);
              return m && { days: m.days, ids: m.ids, d: m.dm };
            })();
      // nowhere to go there: back where it began (never the place of the move before)
      const held = !r;
      const r1 = r || { days: d.base, ids: g.ids, d: 0 };
      const day1 = held ? 0 : dd;
      const b0 = findBlock(d.base, g.id)?.b as EBlock;
      const to = Math.max(0, Math.min(6, g.day + day1));
      e.days = r1.days;
      e.sel = r1.ids;
      e.ghosts = [];
      e.bubble = {
        day: to,
        at: (b0.from + b0.to) / 2 + r1.d,
        text:
          (day1 ? `${names[to]} ` : "") +
          rangeText(hass, b0.from + r1.d, b0.to + r1.d) +
          (e.copy ? ` · ${t(hass, "schedule.copy_short")}` : ""),
      };
    } else if (g.type === "size") {
      // (blocks it reaches into merge with it)
      const r = resize(d.base, g.ids, g.edge, dm, step);
      const b0 = findBlock(d.base, g.id)?.b as EBlock;
      e.days = r.d ? r.days : d.base;
      e.sel = r.d ? r.ids : g.ids;
      const at = (g.edge === "from" ? b0.from : b0.to) + r.d;
      e.bubble = { day: g.day, at, text: fmtDayMinutes(hass, at) };
    } else if (g.type === "fill") {
      const to = Math.max(0, Math.min(6, g.day + dd)),
        lo = Math.min(g.day, to),
        hi = Math.max(g.day, to);
      const ghosts: Span[] = [];
      for (let i = lo; i <= hi; i++)
        if (i !== g.day) for (const b of g.blocks) ghosts.push({ day: i, from: b.from, to: b.to });
      e.ghosts = ghosts;
      e.bubble = ghosts.length
        ? {
            day: to,
            at: (g.blocks[0].from + g.blocks[g.blocks.length - 1].to) / 2,
            text: t(hass, "schedule.copy_to", {
              days: daysText(
                ghosts.map((x) => x.day),
                names,
              ),
            }),
          }
        : null;
    } else if (g.type === "draw") {
      const { min } = this._at(ev, d);
      const r = drawn(g, g.m0, min, step);
      e.draft = r && { day: g.day, ...r };
      // drawn over other days: the same block on each of them
      const to = Math.max(0, Math.min(6, g.day + dd));
      const others: number[] = [];
      for (let i = Math.min(g.day, to); r && i <= Math.max(g.day, to); i++)
        if (i !== g.day) others.push(i);
      e.ghosts = r ? others.map((day) => ({ day, ...r })) : [];
      e.bubble = r && {
        day: to,
        at: (r.from + r.to) / 2,
        text:
          (others.length ? `${daysText([g.day, ...others], names)} ` : "") +
          rangeText(hass, r.from, r.to),
      };
    }
    this._edit = { ...e };
    this._render();
  }
  _onUp(ev: PointerEvent, cancelled: boolean) {
    const d = this._drag;
    if (!d || ev.pointerId !== d.pointer) return;
    this._endDrag();
    const e = this._edit;
    if (d.g.type === "press" || !e) return;
    const clean = { ghosts: [], draft: null, bubble: null };
    if (cancelled) {
      // the edit the drag showed is dropped
      this._edit = { ...e, ...clean, days: d.base };
      this._render();
      return;
    }
    const g = d.g;
    if (g.type === "draw") {
      const cfg = this._config as ScheduleCardConfig;
      const r = d.moved ? e.draft : drawn(g, g.m0, null, cfg.snap);
      if (!r) {
        this._edit = { ...e, ...clean };
        return this._render();
      }
      const made = addBlock(d.base, g.day, r.from, r.to, this._newData(d.base, g.day, r.from));
      // the days it was drawn over get the same block (joining what it lands on there); all of
      // them selected, to be changed together
      const others = d.moved ? [...new Set(e.ghosts.map((x) => x.day))] : [];
      const block = findBlock(made.days, made.id)?.b;
      const all = others.length && block ? fillDays(made.days, [block], others) : null;
      this._commit(
        { ...e, ...clean, days: d.base },
        all ? all.days : made.days,
        all ? [made.id, ...all.ids] : [made.id],
      );
      fireHaptic(this, "selection");
      return;
    }
    if (!d.moved) {
      this._edit = { ...e, ...clean };
      // a tap on a block adds it to the selection, or takes it out
      if (g.type === "block") {
        this._edit.sel = e.sel.includes(g.id) ? e.sel.filter((x) => x !== g.id) : [...e.sel, g.id];
        fireHaptic(this, "selection");
      }
      return this._render();
    }
    if (g.type === "fill") {
      const targets = [...new Set(e.ghosts.map((x) => x.day))];
      if (!targets.length) {
        this._edit = { ...e, ...clean };
        return this._render();
      }
      const r = fillDays(d.base, g.blocks, targets);
      // the copies join the selection: all of them are changed together from here
      this._commit({ ...e, ...clean, days: d.base }, r.days, [...new Set([...e.sel, ...r.ids])]);
      return;
    }
    this._commit({ ...e, ...clean, days: d.base }, e.days, e.sel);
  }
  // the data of a new block: the first key's default, else that of the nearest block that day,
  // else of any block
  _newData(days: EDays, day: number, at: number): Record<string, unknown> | null {
    const spec = (this._config as ScheduleCardConfig).data[0];
    if (spec?.default !== null && spec?.default !== undefined) return { [spec.key]: spec.default };
    const near = [...days[day]].sort((a, b) => Math.abs(a.from - at) - Math.abs(b.from - at))[0];
    return (near ?? days.flat()[0])?.data ?? null;
  }
  _onClick(ev: MouseEvent) {
    // (the release of the long press that turned edit mode on clicks nothing)
    if (this._pressed) {
      this._pressed = false;
      return;
    }
    const btn = (ev.target as HTMLElement).closest<HTMLElement>("button");
    const e = this._edit;
    if (!btn || !e || e.saving) return;
    if (btn.classList.contains("sday")) {
      // a day's name: every block of the day in the selection, or out of it
      const day = Number(btn.dataset.day);
      const ids = e.days[day].map((b) => b.id);
      const all = ids.length > 0 && ids.every((id) => e.sel.includes(id));
      this._edit = {
        ...e,
        sel: all ? e.sel.filter((id) => !ids.includes(id)) : [...new Set([...e.sel, ...ids])],
      };
      this._refocusSel = `d${day}`;
      fireHaptic(this, "selection");
      this._render();
      return;
    }
    const act = btn.dataset.act;
    if (btn.closest(".sbar")) this._toolbar(act);
    // (a block's tap is its pointerup's; Enter on it is a key)
  }
  _toolbar(act: string | undefined) {
    const e = this._edit;
    const cfg = this._config;
    if (!e || !cfg) return;
    if (act === "copy") {
      this._edit = { ...e, copy: !e.copy };
      this._refocusSel = "acopy";
    } else if (act === "delete") {
      this._commit(e, removeBlocks(e.days, e.sel), []);
      return;
    } else if (act === "minus" || act === "plus") {
      const spec = cfg.data[0];
      if (!spec) return;
      const dir = act === "plus" ? 1 : -1;
      const ids = e.sel;
      const cur = ids
        .map((id) => dataValue(findBlock(e.days, id)?.b, spec.key))
        .find((v) => typeof v === "number") as number | undefined;
      let v = (cur ?? spec.default ?? spec.min ?? 0) + (cur === undefined ? 0 : dir * spec.step);
      if (spec.min !== null) v = Math.max(spec.min, v);
      if (spec.max !== null) v = Math.min(spec.max, v);
      // (the value's own decimals stay: 20.5 by a step of 1 is 21.5)
      v = Number(v.toFixed(Math.max(stepDecimals(spec.step), stepDecimals(cur ?? 0))));
      this._refocusSel = `a${act}`;
      this._commit(e, setData(e.days, ids, spec.key, v), ids);
      return;
    }
    this._render();
  }
  // a change made: the days before it go into the undo history
  // (the same days again, a drag back to where it began: nothing to undo)
  _commit(e: EditState, days: EDays, sel: number[]) {
    const same = JSON.stringify(days) === JSON.stringify(e.days);
    this._edit = same ? { ...e, sel } : { ...e, hist: [...e.hist, e.days], days, sel };
    this._render();
  }

  // ----- keyboard -----
  _onKey(ev: KeyboardEvent) {
    const e = this._edit;
    const cfg = this._config;
    if (!e || !cfg || e.saving) return;
    if (ev.key === "Escape") {
      if (e.sel.length) {
        this._edit = { ...e, sel: [] };
        this._render();
      } else if (!e.hist.length) this._leave();
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }
    const btn = (ev.target as HTMLElement).closest<HTMLElement>(".sb[data-id]");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const ids = e.sel.includes(id) ? e.sel : [id];
    const step = cfg.snap;
    const move = (days: EDays | null | undefined, sel = ids) => {
      ev.preventDefault();
      if (!days) return;
      // the focus stays on the block, or on the one it merged into
      const still = days.some((d) => d.some((b) => b.id === id));
      this._refocusSel = `b${still ? id : sel[0]}`;
      this._commit(e, days, sel);
    };
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      this._edit = {
        ...e,
        sel: e.sel.includes(id) ? e.sel.filter((x) => x !== id) : [...e.sel, id],
      };
      this._refocusSel = `b${id}`;
      fireHaptic(this, "selection");
      this._render();
    } else if (ev.key === "Delete" || ev.key === "Backspace") {
      ev.preventDefault();
      this._commit(e, removeBlocks(e.days, ids), []);
      this._root?.querySelector<HTMLElement>(".wk .sday")?.focus({ preventScroll: true });
    } else if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") {
      // Shift: its end, Alt: its start
      const dm = ev.key === "ArrowLeft" ? -step : step;
      const edge = ev.shiftKey ? "to" : ev.altKey ? "from" : "both";
      // (a step into the next block joins it, as a drag does)
      const r =
        edge === "both" ? relocate(e.days, ids, 0, dm, false) : resize(e.days, ids, edge, dm, step);
      move(r?.days, r?.ids);
    } else if (ev.key === "ArrowUp" || ev.key === "ArrowDown") {
      // (the copy toggle copies to the day above or below)
      const r = relocate(e.days, ids, ev.key === "ArrowUp" ? -1 : 1, 0, e.copy);
      move(r?.days, r?.ids);
    }
  }
  // the element the focus is on in the week (to give it back after drawing it again)
  _focusKey(): string | null {
    const a = this.shadowRoot?.activeElement as HTMLElement | null;
    if (!a || !a.closest(".wk")) return null;
    if (a.dataset.id) return `b${a.dataset.id}`;
    if (a.classList.contains("sday")) return `d${a.dataset.day}`;
    if (a.dataset.act) return `a${a.dataset.act}`;
    return null;
  }
  _refocusWeek(wk: HTMLElement, key: string | null) {
    if (!key) return;
    const sel =
      key[0] === "b"
        ? `.sb[data-id="${key.slice(1)}"]`
        : key[0] === "d"
          ? `.sday[data-day="${key.slice(1)}"]`
          : `.sbar [data-act="${key.slice(1)}"]`;
    wk.querySelector<HTMLElement>(sel)?.focus({ preventScroll: true });
  }

  // ----- modes -----
  _onHeaderClick(ev: MouseEvent) {
    const btn = (ev.target as HTMLElement).closest<HTMLButtonElement>("button[data-act]");
    if (!btn || btn.disabled) return;
    const act = btn.dataset.act;
    const e = this._edit;
    if (act === "edit") {
      this._enter();
      this._render();
      // the focus goes to the first block (or the first day)
      const wk = this._root?.querySelector<HTMLElement>(".wk");
      (
        wk?.querySelector<HTMLElement>(".sb[data-id]") ?? wk?.querySelector<HTMLElement>(".sday")
      )?.focus({
        preventScroll: true,
      });
      return;
    }
    if (!e || e.saving) return;
    if (act === "clear") {
      this._edit = { ...e, sel: [] };
      this._render();
      this._root
        ?.querySelector<HTMLElement>('.sctl [data-act="done"]')
        ?.focus({ preventScroll: true });
    } else if (act === "undo" && e.hist.length) {
      const days = e.hist[e.hist.length - 1];
      const ids = new Set(days.flat().map((b) => b.id));
      this._edit = {
        ...e,
        days,
        hist: e.hist.slice(0, -1),
        sel: e.sel.filter((id) => ids.has(id)),
      };
      this._render();
    } else if (act === "add") this._addAtFocus();
    else if (act === "done") this._done();
  }
  // Add: an hour on the day of the focused or selected block (else today), in the first free hour
  // from 08:00 on (then from midnight)
  _addAtFocus() {
    const e = this._edit;
    const cfg = this._config;
    if (!e || !cfg) return;
    const sel = e.sel.length ? findBlock(e.days, e.sel[e.sel.length - 1]) : null;
    const pos = weekPos(Date.now(), scheduleZone(this._hass));
    const day = sel?.d ?? (pos.day - this._first() + 7) % 7;
    const blocks = e.days[day];
    const free = (from: number) => !blocks.some((b) => b.from < from + 60 && from < b.to);
    const starts = [...Array(24).keys()].map((h) => ((h + 8) % 24) * 60);
    const from = starts.find((m) => m + 60 <= DAY_MIN && free(m));
    if (from === undefined) {
      fireHaptic(this, "failure");
      return;
    }
    const made = addBlock(e.days, day, from, from + 60, this._newData(e.days, day, from));
    this._refocusSel = `b${made.id}`;
    this._commit(e, made.days, [made.id]);
  }
  _enter() {
    const cfg = this._config;
    const week = cfg ? knownWeek(cfg.entity) : null;
    if (!cfg || !week) return;
    const first = this._first();
    const days = withIds(rotate(week, first));
    this._hideTip();
    this._edit = {
      days,
      first,
      start: week,
      hist: [],
      sel: [],
      copy: false,
      saving: false,
      ghosts: [],
      draft: null,
      bubble: null,
    };
  }
  _leave() {
    this._edit = null;
    this._endDrag();
    this._render();
    this._root
      ?.querySelector<HTMLElement>('.sctl [data-act="edit"]')
      ?.focus({ preventScroll: true });
  }
  async _done() {
    const e = this._edit;
    const cfg = this._config;
    const hass = this._hass;
    if (!e || !cfg || !hass || e.saving) return;
    const week = unrotate(withoutIds(e.days), e.first);
    if (sameWeek(week, e.start)) return this._leave();
    this._edit = { ...e, saving: true };
    this._render();
    try {
      await saveWeek(hass, cfg.entity, week, e.start);
      fireHaptic(this, "success");
      this._saved = Date.now() + SAVED_MS;
      clearTimeout(this._savedTimer);
      this._savedTimer = setTimeout(() => this._render(), SAVED_MS + 10);
      this._leave();
    } catch (err) {
      console.warn(`${CARD_TYPE}: the schedule was not saved`, err);
      fireHaptic(this, "failure");
      // changed elsewhere: said, and the next Done saves over it; set in YAML: never saved here
      const why =
        err instanceof ScheduleSaveError
          ? t(hass, err.reason === "yaml" ? "schedule.save_yaml" : "schedule.save_changed")
          : err instanceof Error && err.message
            ? err.message
            : typeof (err as { message?: unknown })?.message === "string"
              ? String((err as { message: string }).message)
              : "";
      const message = why
        ? `${t(hass, "schedule.save_failed")}: ${why}`
        : t(hass, "schedule.save_failed");
      fireEvent(this, "hass-notification", { message });
      if (this._edit)
        this._edit = {
          ...this._edit,
          saving: false,
          ...(err instanceof ScheduleSaveError && err.week ? { start: err.week } : {}),
        };
      this._render();
    }
  }
}

registerCard(ScheduleCard, {
  name: "Schedule Card Pro",
  description: "A schedule helper's week: when it runs, and editing its blocks right on the card",
  suggest: ofDomain("schedule"),
});
