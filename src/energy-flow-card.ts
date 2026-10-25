/*
 * energy-flow-card-pro – where a home's energy came from and where it went over a period (today,
 * yesterday, this week, month or year), as the power flow card's tree: sources (solar, battery,
 * grid) → home → rooms → consumers, from energy meters and their long-term statistics.
 *
 *   type: custom:energy-flow-card-pro
 *   period: today                          # today | yesterday | week | month | year
 *   period_picker: true                    # the viewer picks another day, week, month or year
 *   sources:                               # required: solar / battery / grid entries (energy meters)
 *     - { type: solar, entity: sensor.solar_energy }
 *     - { type: battery, charge: sensor.battery_in, discharge: sensor.battery_out, soc: sensor.battery_soc }
 *     - { type: grid, import: sensor.grid_import_energy, export: sensor.grid_export_energy }
 *   home: sensor.home_energy               # optional; computed from the sources otherwise
 *   consumers: [ { entity }, { group, icon, entities: [...] } ]   # optional; "other" takes the rest
 *   consumer_style / direction / flow_style / idle_links / other   # as the power flow card
 *   hide_consumers_below: 0.5              # hide consumers below this (kWh); hide_below per room / consumer
 *   rules: [...]                           # on the home's energy in kWh: label, colour, tint_card
 *   title / icon / header_entities / tap_action / hold_action / double_tap_action
 */
import {
  daysRange,
  fmtDays,
  fmtRange,
  kindOf,
  kindOfRange,
  periodRange,
  rangeAt,
  zonedMidnight,
  zonedParts,
  type PeriodKind,
  type PeriodRange,
} from "./shared/calendar.ts";
import { registerCard } from "./shared/card.ts";
import { resolveLook } from "./shared/entity/look.ts";
import { tplGetter, unitOf, type EntityModel, type RenderCtx } from "./shared/entity/model.ts";
import { FlowTreeCardBase } from "./shared/flow-tree/base.ts";
import { fmtIn, treeUnit, type FlowNow, type Flows } from "./shared/flow-tree/model.ts";
import { selfSufficiencyPart, type Summary } from "./shared/flow-tree/render/summary.ts";
import type { HomeAssistant } from "./shared/ha.ts";
import { langOf } from "./shared/format.ts";
import { openDatePicker } from "./shared/datepicker.ts";
import { HistoryFeed } from "./shared/history-feed.ts";
import { t } from "./shared/i18n.ts";
import {
  ENERGY_TO_KWH,
  fetchCounted,
  fetchMeterPeriods,
  type MeterPeriod,
} from "./shared/statistics.ts";
import { timeZoneOf } from "./shared/visibility.ts";
import {
  meterIdsOf,
  meterIdxs,
  normalizeEnergyFlowConfig,
  type EnergyFlowConfig,
} from "./energy-flow/config.ts";
import { CARD_TYPE, GAP_KWH, IDLE_KWH } from "./energy-flow/constants.ts";
import { buildPicker, updatePicker } from "./energy-flow/picker.ts";
import { STYLE_ENERGY_FLOW_CARD } from "./energy-flow/styles.ts";
import {
  allocate,
  bucketsOf,
  energyNow,
  energySummary,
  fmtEnergy,
  periodSeries,
  shareMotion,
  sumOf,
  type EnergyIn,
} from "./energy-flow/model.ts";

// a period that has just begun is read from the meters at its start until its first hour is
// compiled; a closed one fetched within this long of its end may lack its last hour
const SETTLE_MS = 15 * 60e3;
// the rollover timer looks again at least this often (a sleeping tab, a clock change)
const ROLL_MAX_MS = 3600e3;
// a viewer's pick goes back to the configured period after this long without a touch (a wall
// tablet left on last March comes back to today)
const PICK_IDLE_MS = 10 * 60e3;
// what a viewer picked: a period of a kind (`anchor`: the start of a past one, null: the running
// one) or any range of days
type Pick =
  { kind: PeriodKind; anchor: number | null } | { kind: "range"; start: number; end: number };
// the label of a running period of each kind
const CURRENT_KEYS = {
  day: "energy.period.today",
  week: "energy.period.week",
  month: "energy.period.month",
  year: "energy.period.year",
} as const satisfies Record<PeriodKind, string>;

export class EnergyFlowCard extends FlowTreeCardBase<EnergyFlowConfig> {
  static cardType = CARD_TYPE;
  static getStubConfig(hass: HomeAssistant | undefined, entities?: string[]) {
    const states = hass?.states || {};
    const ids = [...(entities || []), ...Object.keys(states)];
    const isMeter = (id: string) =>
      id.startsWith("sensor.") &&
      states[id]?.attributes?.device_class === "energy" &&
      String(states[id]?.attributes?.state_class ?? "").startsWith("total");
    const solar = ids.find((id) => isMeter(id) && /solar|pv/.test(id));
    const grid = ids.find((id) => isMeter(id) && id !== solar && /import|grid|consum/.test(id));
    // always a config the card accepts: a meter, any sensor, or a placeholder
    const any =
      ids.find((id) => isMeter(id) && id !== solar) ||
      ids.find((id) => id.startsWith("sensor.")) ||
      "sensor.grid_import_energy";
    return {
      title: t(hass, "energy.stub_title"),
      sources: [
        ...(solar ? [{ type: "solar", entity: solar }] : []),
        { type: "grid", import: grid ?? any },
      ],
    };
  }

  _stats = new HistoryFeed(CARD_TYPE, "statistics");
  _meters = new Map<string, MeterPeriod>();
  // the meters with long-term statistics (null: not known yet, or the server did not say)
  _counted: Set<string> | null = null;
  _warned = new Set<string>();
  _range?: PeriodRange;
  _rollTimer?: ReturnType<typeof setTimeout>;
  // the period's buckets, from the last _measure for its _allocate
  _buckets: EnergyIn[] = [];
  // the viewer's pick (null: the configured period): a kind of period and the start of a past one,
  // or null for the running one of that kind (it turns with the day); or a range of days that is
  // no such period
  _pick: Pick | null = null;
  _picked = false; // the pick changed: the next _syncPeriod takes its range
  _idleTimer?: ReturnType<typeof setTimeout>;

  setConfig(config: unknown) {
    this._pick = null;
    clearTimeout(this._idleTimer);
    this._stats.reset();
    this._meters = new Map();
    this._counted = null;
    this._range = undefined;
    clearTimeout(this._rollTimer);
    this._rollTimer = undefined;
    super.setConfig(config);
  }
  _normalize(raw: unknown) {
    return normalizeEnergyFlowConfig(raw);
  }
  _styles() {
    return STYLE_ENERGY_FLOW_CARD;
  }

  // ----- the period picker -----
  // always a header: the card's name is the title when the config gives none
  _headerExtra() {
    return true;
  }
  _defaultTitle(ctx: RenderCtx) {
    return t(ctx.hass, "energy.title");
  }
  _buildHeader(header: HTMLElement) {
    if (!this._config?.picker) return;
    header.appendChild(
      buildPicker({ step: (dir) => this._step(dir), open: (chip) => this._openCalendar(chip) }),
    );
  }
  // the kind of period shown (null: a range of days that is none)
  _kind(): PeriodKind | null {
    const p = this._pick;
    return p ? (p.kind === "range" ? null : p.kind) : kindOf(this._config?.period ?? "today");
  }
  // ‹ the period before, › the one after (never past the running one): a day, week, month or
  // year by its kind, any other range by its length
  _step(dir: -1 | 1) {
    const r = this._range,
      hass = this._hass;
    if (!r || !hass || (dir > 0 && r.open)) return;
    const tz = timeZoneOf(hass),
      now = Date.now();
    const kind = this._kind();
    if (kind) {
      const next = rangeAt(kind, dir < 0 ? r.start - 1 : r.end, now, tz);
      this._setPick({ kind, anchor: next.open ? null : next.start });
      return;
    }
    const days = Math.round((r.end - r.start) / 86400e3);
    const { y, m, d } = zonedParts(r.start, tz);
    const start = zonedMidnight(y, m, d + dir * days, tz);
    const today = zonedParts(now, tz);
    const end = Math.min(
      zonedMidnight(y, m, d + dir * days + days, tz),
      zonedMidnight(today.y, today.m, today.d + 1, tz),
    );
    this._pickRange(start, end);
  }
  // the calendar: a quick pick or a range of days
  _openCalendar(chip: HTMLElement) {
    const r = this._range,
      hass = this._hass;
    if (!r || !hass || !this.shadowRoot) return;
    openDatePicker(chip, this.shadowRoot, {
      hass,
      tz: timeZoneOf(hass),
      lang: langOf(hass),
      start: r.start,
      end: r.end,
      onPick: (start, end) => this._pickRange(start, end),
    });
  }
  // a range of days: as the day, week, month or year it is exactly, if it is one
  _pickRange(start: number, end: number) {
    const hass = this._hass;
    if (!hass) return;
    const tz = timeZoneOf(hass),
      now = Date.now();
    const kind = kindOfRange(start, end, now, tz);
    if (kind) this._setPick({ kind, anchor: rangeAt(kind, start, now, tz).open ? null : start });
    else this._setPick({ kind: "range", start, end });
  }
  _setPick(pick: Pick) {
    this._pick = pick;
    this._picked = true;
    clearTimeout(this._idleTimer);
    this._idleTimer = setTimeout(() => {
      this._pick = null;
      this._picked = true;
      this._fetchStats();
      this._render();
    }, PICK_IDLE_MS);
    this._fetchStats();
    this._render();
  }
  // the period shown, by name: the running one, yesterday and the last 7 or 30 days by word, the
  // others by their dates
  _periodLabel(r: PeriodRange, hass: HomeAssistant): string {
    const kind = this._kind(),
      tz = timeZoneOf(hass),
      now = Date.now();
    const today = rangeAt("day", now, now, tz);
    if (!kind) {
      const days = Math.round((r.end - r.start) / 86400e3);
      if (r.end === today.end && (days === 7 || days === 30))
        return t(hass, days === 7 ? "energy.period.last_7" : "energy.period.last_30");
      return fmtDays(r.start, r.end, now, tz, langOf(hass));
    }
    if (r.open) return t(hass, CURRENT_KEYS[kind]);
    if (kind === "day" && today.start === r.end) return t(hass, "energy.period.yesterday");
    return fmtRange(kind, r, tz, langOf(hass));
  }
  _render() {
    super._render();
    const cfg = this._config,
      hass = this._hass,
      r = this._range;
    if (!cfg || !hass || !r) return;
    const label = this._periodLabel(r, hass);
    const el = this._root?.querySelector<HTMLElement>(".ppicker");
    if (!cfg.picker || !el) return;
    updatePicker(el, {
      label,
      canNext: !r.open,
      texts: {
        prev: t(hass, "energy.picker.prev"),
        next: t(hass, "energy.picker.next"),
        choose: t(hass, "calendar.choose"),
      },
    });
  }

  // ----- the statistics -----
  _setHass(hass: HomeAssistant) {
    const prev = this._hass;
    super._setHass(hass);
    // a new connection (Home Assistant restarted): the statistics may have moved on
    if (prev && prev.connection !== hass.connection) this._stats.invalidate();
    this._fetchStats();
  }
  _tick() {
    // newly compiled hours: the live tail moves into its buckets. A period that ended a while ago
    // gets no new hours: it is not fetched again
    const r = this._range;
    if (!r || r.open || Date.now() - r.end < SETTLE_MS) this._stats.invalidate();
    this._fetchStats();
    super._tick();
  }
  connectedCallback() {
    super.connectedCallback();
    this._stats.invalidate();
    this._fetchStats();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this._rollTimer);
    this._rollTimer = undefined;
    // a card that comes back (another view, back again) shows its configured period
    clearTimeout(this._idleTimer);
    if (this._pick) {
      this._pick = null;
      this._picked = true;
    }
  }
  // a meter's live reading in kWh (null: unavailable)
  _reading(idx: number, hass: HomeAssistant): number | null {
    const ent = this._config?.entities[idx];
    const st = ent?.entity ? hass.states[ent.entity] : undefined;
    const n = st ? Number.parseFloat(st.state) : NaN;
    if (!ent || !Number.isFinite(n)) return null;
    return n * (ENERGY_TO_KWH[unitOf(ent, st)] ?? 1);
  }
  // The period now: a new one (the day turned, a new time zone) starts from nothing, or – right
  // at its start – from the meters' readings at that moment, so it is live before its first hour
  // is compiled. The timer renders at the next turn.
  _syncPeriod(now: number): PeriodRange | undefined {
    const cfg = this._config,
      hass = this._hass;
    if (!cfg || !hass) return this._range;
    const tz = timeZoneOf(hass);
    const old = this._range;
    const pick = this._pick;
    const r =
      old && now < old.next && old.key.endsWith(`:${tz}`) && !this._picked
        ? old
        : pick
          ? pick.kind === "range"
            ? daysRange(pick.start, pick.end, now, tz)
            : rangeAt(pick.kind, pick.anchor ?? now, now, tz)
          : periodRange(cfg.period, now, tz);
    this._picked = false;
    // a range that ran into today ends under the same key: its last hours come from the
    // statistics now, not from the live tail
    if (old && r.key === old.key && old.open && !r.open) this._stats.invalidate();
    if (r.key !== old?.key) {
      this._stats.reset();
      const seed = new Map<string, MeterPeriod>();
      if (old?.open && r.open && old.end === r.start && now - r.start < 60e3)
        for (const idx of meterIdxs(cfg)) {
          const id = cfg.entities[idx].entity;
          if (id) seed.set(id, { rows: [], base: this._reading(idx, hass) });
        }
      this._meters = seed;
    }
    this._range = r;
    if (this._rollTimer === undefined && this.isConnected)
      this._rollTimer = setTimeout(
        () => {
          this._rollTimer = undefined;
          this._fetchStats();
          this._render();
        },
        Math.min(r.next - now, ROLL_MAX_MS) + 50,
      );
    return r;
  }
  _fetchStats() {
    const cfg = this._config,
      hass = this._hass;
    if (!cfg || !hass) return;
    const r = this._syncPeriod(Date.now());
    if (!r || !this._stats.due()) return;
    const ids = meterIdsOf(cfg);
    const known = this._counted;
    void this._stats.run(
      async () => {
        const [counted, meters] = await Promise.all([
          known ?? fetchCounted(hass, ids).catch(() => null),
          fetchMeterPeriods(hass, ids, r),
        ]);
        return { counted, meters };
      },
      ({ counted, meters }) => {
        this._counted = counted;
        for (const id of counted ? ids.filter((e) => !counted.has(e)) : [])
          if (!this._warned.has(id)) {
            this._warned.add(id);
            console.warn(
              `${CARD_TYPE}: ${id} has no long-term statistics (does it have a state_class?)`,
            );
          }
        // a reading seeded at the period's start stays until the first hour brings rows
        for (const [id, next] of meters) {
          const prev = this._meters.get(id);
          this._meters.set(id, {
            rows: next.rows,
            base: next.base ?? (next.rows.length ? null : (prev?.base ?? null)),
          });
        }
        // not complete yet (the hours around a turn are compiled a little later): again soon
        const now = Date.now();
        const settling = r.open ? now - r.start < SETTLE_MS : now - r.end < SETTLE_MS;
        const short = ids.some((id) => {
          const m = this._meters.get(id);
          if (!m || (counted && !counted.has(id))) return false;
          return r.open ? m.base === null : (m.rows[m.rows.length - 1]?.end ?? 0) < r.end;
        });
        return !(settling && short);
      },
      () => this._render(),
    );
  }

  // ----- the numbers -----
  _measure(ctx: RenderCtx, cfg: EnergyFlowConfig, models: EntityModel[]) {
    const hass = ctx.hass as HomeAssistant;
    // meters that count no energy (water in m³, …) are shown in their own unit, which the
    // statistics keep
    this._unit = treeUnit(
      cfg,
      hass,
      (u) => u in ENERGY_TO_KWH,
      (id) => {
        if (this._warned.has(id)) return;
        this._warned.add(id);
        console.warn(`${CARD_TYPE}: ${id} does not count in the unit of the tree`);
      },
    );
    const now = Date.now();
    const r = this._syncPeriod(now);
    const series = new Map<number, Map<number, number> | null>();
    for (const idx of meterIdxs(cfg)) {
      const ent = cfg.entities[idx];
      if (!ent.entity) {
        // a fixed `value`: the period's kWh, all of it now
        const v = models[idx]?.model.num ?? null;
        series.set(idx, v === null ? null : new Map([[now, v]]));
        continue;
      }
      const counted = !this._counted || this._counted.has(ent.entity);
      const mp = counted && r ? this._meters.get(ent.entity) : undefined;
      // a closed period counts nothing since its end: no live tail
      const cur = r?.open ? this._reading(idx, hass) : null;
      series.set(idx, periodSeries(mp, cur, now, r?.start ?? now));
    }
    const amount = (idx: number) => sumOf(series.get(idx) ?? null);
    // the rules of the meters read their period, not the meters' lifetime readings
    const looked = models.map((m, idx) => {
      if (!series.has(idx) || idx === cfg.homeIdx) return m;
      const ent = cfg.entities[idx];
      if (!ent.rules?.length) return m;
      const v = amount(idx);
      const num = v === null ? null : Math.round(v * 1000) / 1000;
      const look = resolveLook(
        ent,
        { raw: num === null ? "" : String(num), num, avail: num !== null },
        m.st,
        tplGetter(ctx),
        hass,
      );
      return { ...m, look };
    });
    this._buckets = bucketsOf(cfg, series);
    const flowNow = energyNow(cfg, amount, (idx) => models[idx]?.model.num ?? null);
    return { now: flowNow, models: looked };
  }
  _allocate(cfg: EnergyFlowConfig, now: FlowNow, hidden: ReadonlySet<string>) {
    return allocate(cfg, now, this._buckets, hidden);
  }
  _summary(ctx: RenderCtx, cfg: EnergyFlowConfig, now: FlowNow, flows: Flows): Summary {
    // the picker names the period: the summary does not say it again
    // the period's name goes on the summary line when no picker names it
    const r = this._range;
    const period = !cfg.picker && r && ctx.hass ? this._periodLabel(r, ctx.hass) : null;
    const s = energySummary(ctx.hass, cfg, now, flows, period, this._fmt(ctx, cfg));
    // imported, exported and self-sufficient speak of electricity: not of water or gas
    if (this._unit) return { ...s, parts: s.parts.slice(0, period === null ? 0 : 1) };
    return { ...s, parts: [...s.parts, ...selfSufficiencyPart(ctx.hass, flows)] };
  }
  // kWh and MWh, or the meters' own unit as written (with the kWh decimals)
  _fmt(ctx: RenderCtx, cfg: EnergyFlowConfig) {
    const unit = this._unit;
    return (v: number | null, dec: number | null = null) =>
      unit
        ? fmtIn(ctx.hass, v, unit, dec ?? cfg.units.decKwh)
        : fmtEnergy(ctx.hass, v, cfg.units, dec);
  }
  _motion(_cfg: EnergyFlowConfig, flows: Flows) {
    return shareMotion(flows);
  }
  _gap() {
    return GAP_KWH;
  }
  _idleDefault() {
    return IDLE_KWH;
  }
  _homeValue(h: number) {
    return Math.round(h * 1000) / 1000;
  }
}

registerCard(EnergyFlowCard, {
  name: "Energy Flow Card Pro",
  description:
    "Where the energy came from and where it went today, this week, month or year: solar, battery and grid → home → rooms and devices",
});
