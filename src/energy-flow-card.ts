/*
 * energy-flow-card-pro – where a home's energy came from and where it went over a period (today,
 * yesterday, this week, month or year), as the power flow card's tree: sources (solar, battery,
 * grid) → home → rooms → consumers, from energy meters and their long-term statistics.
 *
 *   type: custom:energy-flow-card-pro
 *   period: today                          # today | yesterday | week | month | year
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
import { periodRange, type PeriodRange } from "./shared/calendar.ts";
import { registerCard } from "./shared/card.ts";
import { resolveLook } from "./shared/entity/look.ts";
import { tplGetter, unitOf, type EntityModel, type RenderCtx } from "./shared/entity/model.ts";
import { FlowTreeCardBase } from "./shared/flow-tree/base.ts";
import type { FlowNow, Flows } from "./shared/flow-tree/model.ts";
import { selfSufficiencyPart, type Summary } from "./shared/flow-tree/render/summary.ts";
import type { HomeAssistant } from "./shared/ha.ts";
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
import { CARD_TYPE, GAP_KWH } from "./energy-flow/constants.ts";
import {
  allocate,
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

  setConfig(config: unknown) {
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

  // ----- the statistics -----
  _setHass(hass: HomeAssistant) {
    const prev = this._hass;
    super._setHass(hass);
    // a new connection (Home Assistant restarted): the statistics may have moved on
    if (prev && prev.connection !== hass.connection) this._stats.invalidate();
    this._fetchStats();
  }
  _tick() {
    // newly compiled hours: the live tail moves into its buckets
    this._stats.invalidate();
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
    const r =
      old && now < old.next && old.key.endsWith(`:${tz}`) ? old : periodRange(cfg.period, now, tz);
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
        if (settling && short) this._stats.later();
      },
      () => this._render(),
    );
  }

  // ----- the numbers -----
  _measure(ctx: RenderCtx, cfg: EnergyFlowConfig, models: EntityModel[]) {
    const hass = ctx.hass as HomeAssistant;
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
      series.set(idx, periodSeries(mp, this._reading(idx, hass), now, r?.start ?? now));
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
    // the buckets every meter knows of, in time order
    const keys = [...new Set([...series.values()].flatMap((s) => (s ? [...s.keys()] : [])))].sort(
      (a, b) => a - b,
    );
    const at = (idx: number | null, key: number) =>
      idx === null ? 0 : (series.get(idx)?.get(key) ?? 0);
    this._buckets = keys.map((key) => ({
      src: cfg.sources.map((s) => ({
        a: at(s.idx, key),
        b: s.kind === "solar" ? 0 : at(s.secondIdx, key),
      })),
      home: cfg.homeEntity ? at(cfg.homeIdx, key) : null,
    }));
    const flowNow = energyNow(cfg, amount, (idx) => models[idx]?.model.num ?? null);
    return { now: flowNow, models: looked };
  }
  _allocate(cfg: EnergyFlowConfig, now: FlowNow, hidden: ReadonlySet<string>) {
    return allocate(cfg, now, this._buckets, hidden);
  }
  _summary(ctx: RenderCtx, cfg: EnergyFlowConfig, now: FlowNow, flows: Flows): Summary {
    const s = energySummary(ctx.hass, cfg, now, flows);
    return { ...s, parts: [...s.parts, ...selfSufficiencyPart(ctx.hass, flows)] };
  }
  _fmt(ctx: RenderCtx, cfg: EnergyFlowConfig) {
    return (v: number | null, dec: number | null = null) => fmtEnergy(ctx.hass, v, cfg.units, dec);
  }
  _motion(_cfg: EnergyFlowConfig, flows: Flows) {
    return shareMotion(flows);
  }
  _gap() {
    return GAP_KWH;
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
