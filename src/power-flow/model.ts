// The numbers of the power flow (pure): every node's watts from its entity models, the allocation
// of the flows between the sources, the home and the consumers (the order Home Assistant's energy
// dashboard uses: solar covers the home first, then the battery, then the grid; surplus solar
// charges the battery before it is exported; a battery fed by its own panels, `charge_from:
// solar`, is charged before solar covers the home), the summary state and the W / kW formatting.
import { unitOf, type EntityModel } from "../shared/entity/model.ts";
import { fmtNumber } from "../shared/format.ts";
import type { HomeAssistant } from "../shared/ha.ts";
import type { EntityItem } from "../shared/entity/config.ts";
import { COLORS, DEFAULT_UNITS, IDLE_W, type Units } from "./constants.ts";
import { leavesOf, type PowerFlowConfig } from "./config.ts";

const UNIT_TO_W: Record<string, number> = { W: 1, kW: 1000, MW: 1e6, mW: 1e-3 };

// the model's value in watts, null when unavailable
export const wattsOf = (ent: EntityItem, m: EntityModel | undefined): number | null => {
  if (!m || m.model.num === null) return null;
  return m.model.num * (UNIT_TO_W[unitOf(ent, m.st)] ?? 1);
};

export interface SourceNow {
  kind: "solar" | "battery" | "grid";
  w: number | null; // solar ≥ 0; battery + = discharging; grid + = import (the generator while offline)
  // a battery's gross flows (W, ≥ 0): one sign of `w`, except a solar-fed battery given as a
  // charge / discharge pair, which may do both at once (the panels fill it while it feeds the home)
  charge: number;
  discharge: number;
  soc: number | null;
  avail: boolean;
  generator: boolean; // a grid that runs on its generator during an outage
  lowCarbon: number | null; // a grid's low-carbon share of its power, 0 … 1
}
export interface PowerNow {
  sources: SourceNow[];
  leaves: Map<string, number | null>; // consumer id → watts, negative when the consumer produces
  homeW: number | null; // the home sensor, null when computed
  offline: boolean;
  price: { num: number; text: string } | null;
}

export const powerNow = (
  cfg: PowerFlowConfig,
  models: EntityModel[],
  entities: EntityItem[] = cfg.entities,
): PowerNow => {
  const w = (idx: number | null) => (idx === null ? null : wattsOf(entities[idx], models[idx]));
  let offline = false,
    price: PowerNow["price"] = null;
  const none = { soc: null, generator: false, lowCarbon: null, charge: 0, discharge: 0 };
  const sources = cfg.sources.map((s): SourceNow => {
    if (s.kind === "solar") {
      const v = w(s.idx);
      return { kind: "solar", w: v === null ? null : Math.max(0, v), avail: v !== null, ...none };
    }
    const a = w(s.idx),
      b = w(s.secondIdx);
    let v: number | null;
    if (s.secondIdx === null) v = a === null ? null : s.invert ? -a : a;
    else if (s.kind === "battery") v = a === null && b === null ? null : (b ?? 0) - (a ?? 0);
    else v = a === null && b === null ? null : (a ?? 0) - (b ?? 0);
    if (s.kind === "battery") {
      const soc = s.socIdx === null ? null : (models[s.socIdx]?.model.num ?? null);
      // a pair on a solar-fed battery keeps both gross flows; every other battery one sign of the net
      const gross = s.secondIdx !== null && s.chargeFrom === "solar";
      const charge = gross ? Math.max(0, a ?? 0) : Math.max(0, -(v ?? 0)),
        discharge = gross ? Math.max(0, b ?? 0) : Math.max(0, v ?? 0);
      return { kind: "battery", w: v, avail: v !== null, ...none, soc, charge, discharge };
    }
    const down = s.offlineIdx !== null && models[s.offlineIdx]?.model.raw === s.offlineState;
    if (down) offline = true;
    if (!price && s.priceIdx !== null) {
      const pm = models[s.priceIdx];
      if (pm && pm.model.num !== null) price = { num: pm.model.num, text: pm.fmt.text };
    }
    let lowCarbon: number | null = null;
    if (s.fossilIdx !== null) {
      const p = models[s.fossilIdx]?.model.num ?? null;
      if (p !== null) {
        const share = Math.max(0, Math.min(1, p / 100));
        lowCarbon = s.fossilKind === "fossil" ? 1 - share : share;
      }
    }
    // during an outage a running generator takes the grid's place: its power feeds the home
    if (down && s.generatorIdx !== null) {
      const g = Math.max(0, w(s.generatorIdx) ?? 0);
      if (g > 0) return { kind: "grid", w: g, avail: true, ...none, generator: true };
    }
    return { kind: "grid", w: v, avail: v !== null, ...none, lowCarbon };
  });
  const leaves = new Map<string, number | null>();
  for (const leaf of leavesOf(cfg))
    if (leaf.kind === "item") {
      const v = w(leaf.idx);
      leaves.set(leaf.id, v === null ? null : leaf.invert ? -v : v);
    }
  const homeW = cfg.homeEntity ? w(cfg.homeIdx) : null;
  return {
    sources,
    leaves,
    homeW: homeW === null ? null : Math.max(0, homeW),
    offline,
    price,
  };
};

// `hide_below`: whether a consumer of `w` watts is shown, given whether it was (undefined: not
// decided yet). It hides below `x` and comes back only clearly above it (20 %, at least 2 W), so a
// device idling around the threshold does not blink; a producer counts by its size, unavailable as 0
export const thresholdShown = (prev: boolean | undefined, w: number | null, x: number): boolean => {
  const a = Math.abs(w ?? 0);
  if (prev === false) return a >= Math.max(x * 1.2, x + 2);
  return a >= x;
};

// a link is coloured by where its power comes from
export type EdgeKind = "solar" | "battOut" | "gridIn" | "generator" | "home";
export interface EdgeFlow {
  from: string; // node id: s<i> (source), home, g<i> (group), c<i> / c<i>.<j> / other
  to: string;
  w: number; // negative on a consumer link whose device produces
  kind: EdgeKind;
}
export interface Flows {
  S: number;
  H: number;
  B: number;
  sH: number;
  bH: number;
  gH: number;
  gHClean: number; // the low-carbon part of gH (grids without a fossil sensor count as unknown)
  gHGen: number; // the part of gH a generator supplies
  sB: number;
  dB: number; // discharge of one battery charging another
  gB: number;
  sG: number;
  bG: number;
  grid: number; // + import, − export
  selfSufficiency: number | null;
  edges: EdgeFlow[];
  leafW: Map<string, number>; // consumer id → watts (signed), "other" included
  groupW: Map<string, number>;
}

// splits `total` over the parts pro rata; when every eligible part is 0 the eligible ones share
// it equally (the others get nothing)
const shares = (parts: number[], total: number, eligible: boolean[]) => {
  const sum = parts.reduce((a, b, i) => a + (eligible[i] ? b : 0), 0);
  const n = eligible.filter(Boolean).length;
  return parts.map((p, i) => (!eligible[i] ? 0 : sum > 0 ? (total * p) / sum : n ? total / n : 0));
};

// `hidden`: the nodes not drawn (hiddenNodes); a hidden consumer or room counts in the other node,
// so the shown numbers still add up to the home (a room keeps its hidden devices in its total)
export const allocate = (
  cfg: PowerFlowConfig,
  now: PowerNow,
  hidden: ReadonlySet<string> = new Set(),
): Flows => {
  const src = now.sources;
  const isSolar = src.map((s) => s.kind === "solar"),
    isBatt = src.map((s) => s.kind === "battery"),
    isGrid = src.map((s) => s.kind === "grid");
  const solar = src.map((s) => (s.kind === "solar" ? (s.w ?? 0) : 0));
  // an offline grid carries nothing, unless its generator runs
  const gridW = src.map((s) =>
    s.kind === "grid" && (!now.offline || s.generator) ? (s.w ?? 0) : 0,
  );
  const gridAvail = !now.offline || src.some((s) => s.generator);
  // batteries charge and discharge separately: one may feed another, and a solar-fed one given
  // as a pair may do both at once
  const charging = src.map((s) => (s.kind === "battery" ? s.charge : 0)),
    discharging = src.map((s) => (s.kind === "battery" ? s.discharge : 0));
  const isCharging = charging.map((c, i) => isBatt[i] && c > 0),
    isDischarging = discharging.map((d, i) => isBatt[i] && d > 0);
  const importing = gridW.map((g) => Math.max(0, g)),
    exporting = gridW.map((g) => Math.max(0, -g));
  const S = solar.reduce((a, b) => a + b, 0),
    G = gridW.reduce((a, b) => a + b, 0),
    D = discharging.reduce((a, b) => a + b, 0),
    C = charging.reduce((a, b) => a + b, 0),
    B = D - C;
  const H = now.homeW ?? Math.max(0, S + B + G);
  // the batteries the panels feed (`charge_from: solar`) take their solar before the home does
  const solarFed = cfg.sources.map((s) => s.kind === "battery" && s.chargeFrom === "solar");
  const C0 = charging.reduce((a, c, i) => a + (solarFed[i] ? c : 0), 0);
  const sB0 = Math.min(S, C0);
  // the home: solar first, then the batteries, then the grid
  const sH = Math.min(S - sB0, H);
  let rest = H - sH;
  const bH = Math.min(D, rest);
  rest -= bH;
  const gH = gridAvail ? Math.max(0, rest) : 0;
  // charging: solar surplus first, then other batteries' surplus, then the grid
  const sB1 = Math.min(S - sB0 - sH, C - C0);
  const sB = sB0 + sB1;
  const sG = now.offline ? 0 : Math.max(0, S - sH - sB);

  const edges: EdgeFlow[] = [];
  const ids = src.map((_, i) => `s${i}`);
  const push = (from: string, to: string, w: number, kind: EdgeKind) =>
    edges.push({ from, to, w, kind });
  const solarShare = shares(solar, 1, isSolar);
  // what solar puts into each battery: the solar-fed ones first, then the others from the surplus
  const fedIn = shares(
      charging,
      sB0,
      isCharging.map((c, j) => c && solarFed[j]),
    ),
    restIn = shares(
      charging,
      sB1,
      isCharging.map((c, j) => c && !solarFed[j]),
    );
  const solarIn = fedIn.map((w, j) => w + restIn[j]);
  src.forEach((s, i) => {
    if (s.kind !== "solar") return;
    push(ids[i], "home", sH * solarShare[i], "solar");
    solarIn.forEach((w, j) => {
      if (isBatt[j]) push(ids[i], ids[j], w * solarShare[i], "solar");
    });
    shares(exporting, sG * solarShare[i], isGrid).forEach((w, j) => {
      if (isGrid[j]) push(ids[i], ids[j], w, "solar");
    });
  });
  // the charge solar did not cover comes from other batteries and the grid, pro rata to what is
  // left: the discharge the home did not take is split over the batteries still charging, each
  // giver over the others (never itself); what finds no room is exported, the rest comes from
  // the grid. Nothing depends on the order the batteries are written in.
  const remaining = charging.map((c, j) => Math.max(0, c - solarIn[j]));
  const dis = shares(discharging, bH, isDischarging);
  const give = discharging.map((d, i) => Math.max(0, d - dis[i]));
  const sumOf = (xs: number[], on: boolean[]) => xs.reduce((a, x, j) => a + (on[j] ? x : 0), 0);
  const bCh = shares(
    give,
    Math.min(sumOf(give, isDischarging), sumOf(remaining, isCharging)),
    isDischarging,
  );
  // battery i → battery j (every pair, so the drawn links never come and go with the values)
  const battIn = src.map((_, i) => {
    const others = isCharging.map((c, j) => c && j !== i);
    return shares(remaining, Math.min(bCh[i], sumOf(remaining, others)), others);
  });
  // a battery offered more than its room (a giver that is itself charging skews the shares)
  // takes its room pro rata from the givers; their rest is exported
  remaining.forEach((r, j) => {
    const offered = battIn.reduce((a, row) => a + row[j], 0);
    if (offered > r) battIn.forEach((row) => (row[j] *= r / offered));
  });
  const given = battIn.map((row) => row.reduce((a, b) => a + b, 0));
  const dB = given.reduce((a, b) => a + b, 0);
  const bExp = give.map((g, i) => (now.offline ? 0 : Math.max(0, g - given[i])));
  battIn.forEach((row) => row.forEach((w, j) => (remaining[j] -= w)));
  const gB = now.offline ? 0 : remaining.reduce((a, b) => a + b, 0);
  const bG = bExp.reduce((a, b) => a + b, 0);
  const grid = gH + gB - sG - bG;
  const imp = shares(importing, gH, isGrid),
    gCh = shares(importing, gB, isGrid);
  let gHClean = 0,
    gHGen = 0;
  src.forEach((s, i) => {
    if (s.kind === "battery") {
      push(ids[i], "home", dis[i], "battOut");
      battIn[i].forEach((w, j) => {
        if (isBatt[j] && j !== i) push(ids[i], ids[j], w, "battOut");
      });
      shares(exporting, bExp[i], isGrid).forEach((w, j) => {
        if (isGrid[j]) push(ids[i], ids[j], w, "battOut");
      });
    } else if (s.kind === "grid") {
      push(ids[i], "home", imp[i], s.generator ? "generator" : "gridIn");
      if (s.lowCarbon !== null) gHClean += imp[i] * s.lowCarbon;
      if (s.generator) gHGen += imp[i];
      shares(remaining, gCh[i], isCharging).forEach((w, j) => {
        if (isBatt[j]) push(ids[i], ids[j], w, s.generator ? "generator" : "gridIn");
      });
    }
  });

  // the consumers: leaves take their watts, a group the sum of its items, "other" the rest of
  // what the home draws (a producing consumer feeds the home and counts for nothing here, a
  // hidden one counts there)
  const leafW = new Map<string, number>(),
    groupW = new Map<string, number>();
  let used = 0;
  for (const c of cfg.consumers) {
    if (c.kind === "group") {
      let sum = 0;
      for (const it of c.items) {
        const w = now.leaves.get(it.id) ?? 0;
        leafW.set(it.id, w);
        sum += w;
        if (!hidden.has(c.id)) used += Math.max(0, w);
        push(c.id, it.id, w, "home");
      }
      groupW.set(c.id, sum);
      push("home", c.id, sum, "home");
    } else if (c.kind === "item") {
      const w = now.leaves.get(c.id) ?? 0;
      leafW.set(c.id, w);
      if (!hidden.has(c.id)) used += Math.max(0, w);
      push("home", c.id, w, "home");
    }
  }
  for (const c of cfg.consumers)
    if (c.kind === "other") {
      const w = Math.max(0, H - used);
      leafW.set(c.id, w);
      push("home", c.id, w, "home");
    }

  return {
    S,
    H,
    B,
    sH,
    bH,
    gH,
    gHClean,
    gHGen,
    sB,
    dB,
    gB,
    sG,
    bG,
    grid,
    selfSufficiency: H > 0 ? (H - gH) / H : null,
    edges,
    leafW,
    groupW,
  };
};

export type StateKey =
  | "power.state.offline"
  | "power.state.offline_battery"
  | "power.state.offline_solar"
  | "power.state.generator"
  | "power.state.expensive"
  | "power.state.exporting"
  | "power.state.battery"
  | "power.state.importing"
  | "power.state.balanced";
export interface SummaryState {
  key: StateKey;
  color: string;
  w: number | null; // the watts the state names (export / import)
  tint: boolean;
}

export const summaryState = (cfg: PowerFlowConfig, now: PowerNow, f: Flows): SummaryState => {
  if (now.offline) {
    const onGenerator = f.gH > IDLE_W && now.sources.some((s) => s.generator);
    if (onGenerator)
      return { key: "power.state.generator", color: COLORS.generator, w: null, tint: true };
    const key =
      f.bH > IDLE_W
        ? "power.state.offline_battery"
        : f.sH > IDLE_W
          ? "power.state.offline_solar"
          : "power.state.offline";
    return { key, color: COLORS.offline, w: null, tint: true };
  }
  const expensive =
    cfg.expensiveAbove !== null &&
    now.price !== null &&
    now.price.num >= cfg.expensiveAbove &&
    f.gH > IDLE_W;
  if (expensive)
    return { key: "power.state.expensive", color: COLORS.offline, w: null, tint: true };
  if (f.sG + f.bG > IDLE_W)
    return { key: "power.state.exporting", color: COLORS.gridOut, w: f.sG + f.bG, tint: false };
  if (f.bH > IDLE_W && f.bH >= f.gH)
    return { key: "power.state.battery", color: COLORS.battOut, w: null, tint: false };
  if (f.gH > IDLE_W)
    return { key: "power.state.importing", color: COLORS.gridIn, w: f.gH, tint: false };
  return { key: "power.state.balanced", color: COLORS.balanced, w: null, tint: false };
};

// "850 W" or "1.23 kW" (magnitudes; the direction is told by colour and motion); an entity's own
// decimals win over the card's
export const fmtPower = (
  hass: HomeAssistant | undefined,
  w: number | null,
  units: Units = DEFAULT_UNITS,
  dec: number | null = null,
): string => {
  if (w === null || !Number.isFinite(w)) return "–";
  const v = Math.abs(w);
  if (units.kwAbove <= 0 || v >= units.kwAbove)
    return `${fmtNumber(hass, v / 1000, dec ?? units.decKw)} kW`;
  return `${fmtNumber(hass, v, dec ?? units.decW)} W`;
};

// the colour of a source node for its current flow
export const sourceColor = (s: SourceNow, offline: boolean): string => {
  if (s.kind === "grid" && offline)
    return s.generator && (s.w ?? 0) > IDLE_W ? COLORS.generator : COLORS.offline;
  if (s.w === null) return COLORS.idle;
  if (s.kind === "solar") return s.w > IDLE_W ? COLORS.solar : COLORS.idle;
  if (s.kind === "battery")
    return s.w > IDLE_W ? COLORS.battOut : s.w < -IDLE_W ? COLORS.battIn : COLORS.idle;
  return s.w > IDLE_W ? COLORS.gridIn : s.w < -IDLE_W ? COLORS.gridOut : COLORS.idle;
};
// the colour of a link; a consumer link running backwards carries what the device produces
export const edgeColor = (kind: EdgeKind, w = 0): string => {
  switch (kind) {
    case "solar":
      return COLORS.solar;
    case "battOut":
      return COLORS.battOut;
    case "gridIn":
      return COLORS.gridIn;
    case "generator":
      return COLORS.generator;
    default:
      return w < 0 ? COLORS.solar : COLORS.home;
  }
};
