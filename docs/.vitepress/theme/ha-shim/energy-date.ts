// A stand-in for Home Assistant's energy date picker card (`type: energy-date-selection`). Like the
// real one it makes the dashboard's energy collection on the connection when it first gets hass
// (`_energy_<panelUrl>`, or `_<collection_key>`) and moves its period: setPeriod, then refresh,
// and every subscriber hears of it. A day ends at its last instant, as Home Assistant's do. The
// buttons step by the kind of period shown and switch between day, week, month and year.
import type { CardConfigBase, GridOptions, HomeAssistant } from "../../../../src/shared/ha.ts";
import {
  fmtDays,
  fmtRange,
  kindOfRange,
  rangeAt,
  type PeriodKind,
} from "../../../../src/shared/calendar.ts";
import { timeZoneOf } from "../../../../src/shared/visibility.ts";

interface Period {
  start: Date;
  end?: Date;
}
export interface ShimEnergyCollection extends Period {
  setPeriod(start: Date, end?: Date): void;
  refresh(): void;
  subscribe(cb: (data: Period) => void): () => void;
}

// a collection as Home Assistant's: subscribers hear of the period after each refresh (later, as
// the real one answers after its fetch) and once when they subscribe
export const makeEnergyCollection = (start: Date, end: Date): ShimEnergyCollection => {
  const subs = new Set<(data: Period) => void>();
  const c: ShimEnergyCollection = {
    start,
    end,
    setPeriod(s, e) {
      c.start = s;
      c.end = e;
    },
    refresh() {
      const data = { start: c.start, end: c.end };
      setTimeout(() => subs.forEach((cb) => cb(data)), 0);
    },
    subscribe(cb) {
      subs.add(cb);
      setTimeout(() => subs.has(cb) && cb({ start: c.start, end: c.end }), 0);
      return () => subs.delete(cb);
    },
  };
  return c;
};

const KINDS: PeriodKind[] = ["day", "week", "month", "year"];
const LETTERS: Record<PeriodKind, string> = { day: "D", week: "W", month: "M", year: "Y" };

export class HuiEnergyDateSelectionShim extends HTMLElement {
  _cfg: CardConfigBase = {};
  _hass?: HomeAssistant;
  _coll?: ShimEnergyCollection;
  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `<style>
      :host { display: block; }
      .row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        font: 400 14px/20px var(--ha-font-family-body, Roboto, system-ui, sans-serif);
        color: var(--primary-text-color); }
      .label { flex: 1 1 auto; min-width: 0; font-weight: 500; }
      button { font: inherit; color: inherit; background: none; cursor: pointer; padding: 4px 10px;
        border: 1px solid var(--divider-color, rgba(127, 127, 127, 0.3)); border-radius: 16px; }
      button.on { background: var(--primary-color); color: var(--text-primary-color, #fff);
        border-color: var(--primary-color); }
    </style><div class="row"><button class="prev" aria-label="Previous">‹</button>
      <span class="label"></span><button class="next" aria-label="Next">›</button>
      <button class="today">Today</button><span class="kinds"></span></div>`;
    const q = (s: string) => root.querySelector(s) as HTMLElement;
    q(".prev").addEventListener("click", () => this._step(-1));
    q(".next").addEventListener("click", () => this._step(1));
    q(".today").addEventListener("click", () => this._go(this._kind(), Date.now()));
    for (const k of KINDS) {
      const b = document.createElement("button");
      b.dataset.kind = k;
      b.textContent = LETTERS[k];
      b.addEventListener("click", () => this._go(k, this._coll?.start.getTime() ?? Date.now()));
      q(".kinds").appendChild(b);
    }
  }
  setConfig(cfg: CardConfigBase) {
    this._cfg = cfg;
  }
  set hass(h: HomeAssistant) {
    this._hass = h;
    if (!this._coll) {
      const conn = h.connection as unknown as Record<string, ShimEnergyCollection | undefined>;
      const key = this._cfg.collection_key
        ? `_${String(this._cfg.collection_key)}`
        : `_energy_${h.panelUrl ?? ""}`;
      if (!conn[key]) {
        const r = rangeAt("day", Date.now(), Date.now(), timeZoneOf(h));
        conn[key] = makeEnergyCollection(new Date(r.start), new Date(r.end - 1));
      }
      this._coll = conn[key];
      this._coll?.subscribe(() => this._paint());
    }
    this._paint();
  }
  get hass(): HomeAssistant | undefined {
    return this._hass;
  }
  _tz() {
    return this._hass ? timeZoneOf(this._hass) : "UTC";
  }
  // the kind of the period shown (a run of days counts as days)
  _kind(): PeriodKind {
    const c = this._coll;
    if (!c) return "day";
    const end = (c.end?.getTime() ?? c.start.getTime()) + 1;
    return kindOfRange(c.start.getTime(), end, Date.now(), this._tz()) ?? "day";
  }
  _go(kind: PeriodKind, t: number) {
    const c = this._coll;
    if (!c) return;
    const r = rangeAt(kind, t, Date.now(), this._tz());
    c.setPeriod(new Date(r.start), new Date(r.end - 1));
    c.refresh();
    this._paint();
  }
  _step(dir: -1 | 1) {
    const c = this._coll;
    if (!c) return;
    this._go(this._kind(), dir < 0 ? c.start.getTime() - 1 : (c.end?.getTime() ?? 0) + 1);
  }
  _paint() {
    const c = this._coll,
      root = this.shadowRoot;
    if (!c || !root) return;
    const tz = this._tz(),
      now = Date.now(),
      lang = this._hass?.locale?.language ?? "en";
    const start = c.start.getTime(),
      end = (c.end?.getTime() ?? start) + 1;
    const kind = kindOfRange(start, end, now, tz);
    const r = rangeAt(kind ?? "day", start, now, tz);
    (root.querySelector(".label") as HTMLElement).textContent = kind
      ? fmtRange(kind, r, tz, lang)
      : fmtDays(start, end, now, tz, lang);
    (root.querySelector(".next") as HTMLButtonElement).disabled = end > now;
    root
      .querySelectorAll<HTMLElement>("[data-kind]")
      .forEach((b) => b.classList.toggle("on", b.dataset.kind === kind));
  }
  getCardSize() {
    return 1;
  }
  getGridOptions(): GridOptions {
    return { columns: "full", rows: "auto" };
  }
}
