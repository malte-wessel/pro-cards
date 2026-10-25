// The numbers of the energy flow (pure): every meter's period as buckets of kWh (the compiled
// statistics and the live tail), the allocation of each bucket between the sources, the home and
// the consumers, the summary and the kWh / MWh formatting.
//
// The allocation is Home Assistant's energy dashboard rule for a bucket of time, summed over the
// buckets (an hour of today, a day of the month): what the grid imported beyond the home charged
// the batteries; solar charged the batteries, then covered the export, the batteries covered the
// rest of it; the grid charged what the batteries still took; the home took what was left of
// solar, then of the batteries, then the grid. A battery fed by its panels (`charge_from`) takes
// only theirs and never the grid's.
import { fmtNumber } from "../shared/format.ts";
import type { HomeAssistant } from "../shared/ha.ts";
import { t } from "../shared/i18n.ts";
import { liveTail, type MeterPeriod } from "../shared/statistics.ts";
import { COLORS } from "../shared/flow-tree/constants.ts";
import { isActive, type Motion } from "../shared/flow-tree/flow.ts";
import {
  consumerFlows,
  leafValues,
  shares,
  type EdgeFlow,
  type EdgeKind,
  type FlowNow,
  type Flows,
  type SourceNow,
} from "../shared/flow-tree/model.ts";
import type { Summary } from "../shared/flow-tree/render/summary.ts";
import type { EnergyFlowConfig } from "./config.ts";
import { DEFAULT_UNITS, SHARE_ANIMATION, type EnergyUnits } from "./constants.ts";

// A meter's period as buckets (bucket start → kWh): its compiled rows, and what it counted since
// its last compiled reading in the bucket that holds `now` (the running day of a month, or the
// hour after the last compiled one). Null: nothing known (not fetched, no statistics).
export const periodSeries = (
  mp: MeterPeriod | undefined,
  cur: number | null,
  now: number,
  start: number,
): Map<number, number> | null => {
  if (!mp) return null;
  const out = new Map<number, number>();
  for (const r of mp.rows) out.set(r.start, (out.get(r.start) ?? 0) + r.change);
  const tail = liveTail(mp.base, cur);
  if (tail > 0) {
    const last = mp.rows[mp.rows.length - 1];
    const key = last && last.end > now ? last.start : (last?.end ?? start);
    out.set(key, (out.get(key) ?? 0) + tail);
  }
  return out;
};

export const sumOf = (series: Map<number, number> | null) =>
  series === null ? null : [...series.values()].reduce((a, b) => a + b, 0);

// What the meters say for the whole period, as the tree reads it (FlowNow): a battery's charge and
// discharge, a grid's import and export, their nets as `w`. `amount`: an item's kWh in the period.
export const energyNow = (
  cfg: EnergyFlowConfig,
  amount: (idx: number) => number | null,
  soc: (idx: number) => number | null,
): FlowNow => {
  const none = {
    soc: null,
    generator: false,
    lowCarbon: null,
    charge: 0,
    discharge: 0,
    import: 0,
    export: 0,
  };
  const pos = (v: number | null) => Math.max(0, v ?? 0);
  const sources = cfg.sources.map((s): SourceNow => {
    const a = amount(s.idx),
      b = s.kind === "solar" || s.secondIdx === null ? null : amount(s.secondIdx);
    if (s.kind === "solar")
      return { kind: "solar", w: a === null ? null : pos(a), avail: a !== null, ...none };
    const avail = a !== null || b !== null;
    if (s.kind === "battery")
      return {
        kind: "battery",
        w: avail ? pos(b) - pos(a) : null,
        avail,
        ...none,
        soc: s.socIdx === null ? null : soc(s.socIdx),
        charge: pos(a),
        discharge: pos(b),
      };
    return {
      kind: "grid",
      w: avail ? pos(a) - pos(b) : null,
      avail,
      ...none,
      import: pos(a),
      export: pos(b),
    };
  });
  const homeW = cfg.homeEntity ? amount(cfg.homeIdx) : null;
  return {
    sources,
    leaves: leafValues(cfg, amount),
    homeW: homeW === null ? null : Math.max(0, homeW),
    offline: false,
    price: null,
  };
};

// one bucket: per source its meters (solar: a = production; battery: a = charge, b = discharge;
// grid: a = import, b = export), and the home meter's (null: computed)
export interface EnergyIn {
  src: { a: number; b: number }[];
  home: number | null;
}
// The period's buckets from every meter's series (item index → bucket start → kWh), in time order.
// A source counts 0 in a bucket it has nothing for. The home's meter counts where it has the
// bucket; elsewhere – and without long-term statistics, or as a fixed value – the bucket's home is
// computed from the sources (null), never 0.
export const bucketsOf = (
  cfg: EnergyFlowConfig,
  series: ReadonlyMap<number, Map<number, number> | null>,
): EnergyIn[] => {
  const keys = [...new Set([...series.values()].flatMap((s) => (s ? [...s.keys()] : [])))].sort(
    (a, b) => a - b,
  );
  const at = (idx: number | null, key: number) =>
    idx === null ? 0 : (series.get(idx)?.get(key) ?? 0);
  const home = cfg.homeEntity && cfg.entities[cfg.homeIdx].entity ? series.get(cfg.homeIdx) : null;
  return keys.map((key) => ({
    src: cfg.sources.map((s) => ({
      a: at(s.idx, key),
      b: s.kind === "solar" ? 0 : at(s.secondIdx, key),
    })),
    home: home ? (home.get(key) ?? null) : null,
  }));
};

// what a bucket gives: per source what went to the home, to each battery, to each grid
interface Split {
  U: number; // the home
  toHome: number[];
  toBatt: number[][]; // [from][battery]
  toGrid: number[][]; // [from][grid]
}

const EPS = 1e-9;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

// moves `total` from the givers to the takers, pro rata to what each has left, into m[from][to]
const move = (
  total: number,
  from: number[],
  fromOk: boolean[],
  to: number[],
  toOk: boolean[],
  m: number[][],
) => {
  if (total <= EPS) return;
  const give = shares(from, total, fromOk),
    take = shares(to, total, toOk);
  give.forEach((g, i) => {
    if (g <= 0) return;
    take.forEach((k, j) => (m[i][j] += (g * k) / total));
    from[i] -= g;
  });
  take.forEach((k, j) => (to[j] -= k));
};

export const allocateBucket = (cfg: EnergyFlowConfig, b: EnergyIn): Split => {
  const src = cfg.sources;
  const n = src.length;
  const zeros = () => src.map(() => 0);
  const isSolar = src.map((s) => s.kind === "solar"),
    isBatt = src.map((s) => s.kind === "battery"),
    isGrid = src.map((s) => s.kind === "grid");
  const pos = (v: number) => Math.max(0, v);
  // what each source has left to give or take
  const sol = src.map((_, i) => (isSolar[i] ? pos(b.src[i].a) : 0)),
    chg = src.map((_, i) => (isBatt[i] ? pos(b.src[i].a) : 0)),
    dis = src.map((_, i) => (isBatt[i] ? pos(b.src[i].b) : 0)),
    imp = src.map((_, i) => (isGrid[i] ? pos(b.src[i].a) : 0)),
    exp = src.map((_, i) => (isGrid[i] ? pos(b.src[i].b) : 0));
  const U = b.home ?? pos(sum(sol) + sum(dis) + sum(imp) - sum(chg) - sum(exp));
  const toHome = zeros(),
    toBatt = Array.from({ length: n }, zeros),
    toGrid = Array.from({ length: n }, zeros);
  // a battery its panels feed takes theirs only; a panel listed by none feeds every other battery
  const solarOnly = src.map((s) => s.kind === "battery" && s.chargeFrom === "solar");
  const feeds = src.map((s) => (s.kind === "battery" ? s.panels : null));
  const canFeed = (i: number, j: number) => !feeds[j] || feeds[j].includes(src[i].id);
  const gridCharged = src.map((_, j) => isBatt[j] && !solarOnly[j]);
  const charging = () => chg.map((c, j) => gridCharged[j] && c > EPS);
  // 1. what the grid imported beyond the home charged the batteries
  const g0 = Math.min(Math.max(0, sum(imp) - U), sum(chg.filter((_, j) => gridCharged[j])));
  move(g0, imp, isGrid, chg, charging(), toBatt);
  // 2. solar charged the batteries: those its panels feed first, then the others
  for (const pass of [true, false])
    src.forEach((_, j) => {
      if (!isBatt[j] || solarOnly[j] !== pass || chg[j] <= EPS) return;
      const ok = sol.map((w, i) => isSolar[i] && canFeed(i, j) && w > EPS);
      const take = Math.min(chg[j], sum(sol.filter((_, i) => ok[i])));
      const only = src.map((_, k) => k === j);
      move(take, sol, ok, chg, only, toBatt);
    });
  // 3. solar covered the export, 4. the batteries covered the rest of it
  move(Math.min(sum(sol), sum(exp)), sol, isSolar, exp, isGrid, toGrid);
  move(Math.min(sum(dis), sum(exp)), dis, isBatt, exp, isGrid, toGrid);
  // 5. the grid charged what the batteries still took
  move(
    Math.min(sum(imp), sum(chg.filter((_, j) => gridCharged[j]))),
    imp,
    isGrid,
    chg,
    charging(),
    toBatt,
  );
  // 6. the home: solar, then the batteries, then the grid (what no meter explains is the grid's)
  const sH = Math.min(sum(sol), U);
  shares(sol, sH, isSolar).forEach((w, i) => (toHome[i] += w));
  const bH = Math.min(sum(dis), U - sH);
  shares(dis, bH, isBatt).forEach((w, i) => (toHome[i] += w));
  const gH = Math.max(0, U - sH - bH);
  shares(imp, gH, isGrid).forEach((w, i) => (toHome[i] += w));
  return { U, toHome, toBatt, toGrid };
};

// the buckets' splits summed, as the tree's flows; `hidden`: the nodes not drawn (consumerFlows)
export const allocate = (
  cfg: EnergyFlowConfig,
  now: FlowNow,
  buckets: EnergyIn[],
  hidden: ReadonlySet<string> = new Set(),
): Flows => {
  const src = cfg.sources;
  const n = src.length;
  const zeros = () => src.map(() => 0);
  const toHome = zeros(),
    toBatt = Array.from({ length: n }, zeros),
    toGrid = Array.from({ length: n }, zeros);
  let H = 0;
  for (const b of buckets) {
    const s = allocateBucket(cfg, b);
    H += s.U;
    s.toHome.forEach((w, i) => (toHome[i] += w));
    s.toBatt.forEach((row, i) => row.forEach((w, j) => (toBatt[i][j] += w)));
    s.toGrid.forEach((row, i) => row.forEach((w, j) => (toGrid[i][j] += w)));
  }
  const isBatt = src.map((s) => s.kind === "battery"),
    isGrid = src.map((s) => s.kind === "grid");
  const feeds = src.map((s) => (s.kind === "battery" ? s.panels : null));
  const canFeed = (i: number, j: number) => !feeds[j] || feeds[j].includes(src[i].id);
  const of = (kind: SourceNow["kind"], xs: number[]) =>
    xs.reduce((a, w, i) => a + (src[i].kind === kind ? w : 0), 0);
  const rows = (kind: SourceNow["kind"], m: number[][]) =>
    m.reduce((a, row, i) => a + (src[i].kind === kind ? sum(row) : 0), 0);

  const edges: EdgeFlow[] = [];
  const z = (w: number) => (Math.abs(w) < EPS ? 0 : w);
  const push = (from: string, to: string, w: number, kind: EdgeKind) =>
    edges.push({ from, to, w: z(w), kind });
  // the panels first, then the batteries and grids, each in the order written: the links' ids
  // (their flows' indices) are the same for one config whatever the values
  src.forEach((s, i) => {
    if (s.kind !== "solar") return;
    push(s.id, "home", toHome[i], "solar");
    src.forEach((b, j) => {
      if (isBatt[j] && canFeed(i, j)) push(s.id, b.id, toBatt[i][j], "battIn");
    });
    src.forEach((g, k) => {
      if (isGrid[k]) push(s.id, g.id, toGrid[i][k], "gridOut");
    });
  });
  src.forEach((s, i) => {
    if (s.kind === "battery") {
      push(s.id, "home", toHome[i], "battOut");
      src.forEach((g, k) => {
        if (isGrid[k]) push(s.id, g.id, toGrid[i][k], "gridOut");
      });
    } else if (s.kind === "grid") {
      push(s.id, "home", toHome[i], "gridIn");
      src.forEach((b, j) => {
        if (isBatt[j]) push(s.id, b.id, toBatt[i][j], "battIn");
      });
    }
  });
  const { leafW, groupW } = consumerFlows(cfg, now, H, hidden, push);

  const S = now.sources.reduce((a, s) => a + (s.kind === "solar" ? (s.w ?? 0) : 0), 0);
  const C = now.sources.reduce((a, s) => a + s.charge, 0),
    D = now.sources.reduce((a, s) => a + s.discharge, 0);
  const sH = of("solar", toHome),
    bH = of("battery", toHome),
    gH = of("grid", toHome);
  const sB = rows("solar", toBatt),
    gB = rows("grid", toBatt),
    sG = rows("solar", toGrid),
    bG = rows("battery", toGrid);
  return {
    S,
    H,
    B: D - C,
    sH: z(sH),
    bH: z(bH),
    gH: z(gH),
    gHClean: 0,
    gHGen: 0,
    sB: z(sB),
    dB: 0,
    gB: z(gB),
    sG: z(sG),
    bG: z(bG),
    grid: z(gH + gB - sG - bG),
    // what the grid did not cover: without a grid there is nothing to be self-sufficient of
    selfSufficiency:
      H > 0 && cfg.sources.some((s) => s.kind === "grid") ? Math.max(0, H - gH) / H : null,
    edges,
    leafW,
    groupW,
  };
};

// "12.4 kWh" or "1.23 MWh" (magnitudes); an entity's own decimals win over the card's
export const fmtEnergy = (
  hass: HomeAssistant | undefined,
  kwh: number | null,
  units: EnergyUnits = DEFAULT_UNITS,
  dec: number | null = null,
): string => {
  if (kwh === null || !Number.isFinite(kwh)) return "–";
  const v = Math.abs(kwh);
  if (v >= units.mwhAbove) return `${fmtNumber(hass, v / 1000, dec ?? units.decMwh)} MWh`;
  return `${fmtNumber(hass, v, dec ?? units.decKwh)} kWh`;
};

// The period in the colour of what covered most of the home (solar, the batteries, the grid),
// then what the grids imported and exported (where they have meters for it); never a tint
export const energySummary = (
  hass: HomeAssistant | undefined,
  cfg: EnergyFlowConfig,
  now: FlowNow,
  f: Flows,
  // the period's name, first and in the state colour (null: the title names it)
  period: string | null = null,
  // how an amount reads (default: kWh / MWh)
  fmt: (v: number) => string = (v) => fmtEnergy(hass, v, cfg.units),
): Summary => {
  const on = (w: number) => isActive(w, cfg.idleBelow);
  const top = Math.max(f.sH, f.bH, f.gH);
  const color = !on(top)
    ? COLORS.idle
    : top === f.sH
      ? COLORS.solar
      : top === f.bH
        ? COLORS.battOut
        : COLORS.gridIn;
  const parts: Summary["parts"] = period === null ? [] : [{ text: period, accent: true }];
  const grids = cfg.sources.flatMap((s, i) =>
    s.kind === "grid" ? [[s, now.sources[i]] as const] : [],
  );
  const imported = grids.reduce((a, [, n]) => a + n.import, 0),
    exported = grids.reduce((a, [, n]) => a + n.export, 0);
  if (grids.length && on(imported))
    parts.push({ text: t(hass, "energy.imported", { v: fmt(imported) }), accent: false });
  if (grids.some(([s]) => s.secondIdx !== null) && on(exported))
    parts.push({ text: t(hass, "energy.exported", { v: fmt(exported) }), accent: false });
  return { parts, color, tint: false };
};

// the links move by their share of the home (‰), so the busiest is the one that carried most
export const shareMotion = (f: Flows): Motion => {
  const ref = f.H > 0 ? f.H : Math.max(0, ...f.edges.map((e) => Math.abs(e.w)));
  return { of: (w) => (ref > 0 ? (1000 * w) / ref : 0), a: SHARE_ANIMATION };
};
