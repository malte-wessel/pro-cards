// The numbers of the power flow (pure): every node's watts from its entity models, the allocation
// of the flows between the sources, the home and the consumers (the order Home Assistant's energy
// dashboard uses: solar covers the home first, then the battery, then the grid; surplus solar
// charges the battery before it is exported), the summary state and the W / kW formatting.
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
  const none = { soc: null, generator: false, lowCarbon: null };
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
      return { kind: "battery", w: v, avail: v !== null, ...none, soc };
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
    // during an outage a generator takes the grid's place: its power feeds the home
    if (down && s.generatorIdx !== null) {
      const g = w(s.generatorIdx);
      return { kind: "grid", w: Math.max(0, g ?? 0), avail: g !== null, ...none, generator: true };
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

export type EdgeKind = "solar" | "battIn" | "battOut" | "gridIn" | "gridOut" | "generator" | "home";
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
  gB: number;
  sG: number;
  bG: number;
  grid: number; // + import, − export
  selfSufficiency: number | null;
  edges: EdgeFlow[];
  leafW: Map<string, number>; // consumer id → watts (signed), "other" included
  groupW: Map<string, number>;
}

// splits `total` over the parts pro rata (equal shares when every part is 0)
const shares = (parts: number[], total: number) => {
  const sum = parts.reduce((a, b) => a + b, 0);
  return parts.map((p) => (sum > 0 ? (total * p) / sum : parts.length ? total / parts.length : 0));
};

export const allocate = (cfg: PowerFlowConfig, now: PowerNow): Flows => {
  const src = now.sources;
  const solar = src.map((s) => (s.kind === "solar" ? (s.w ?? 0) : 0));
  const batt = src.map((s) => (s.kind === "battery" ? (s.w ?? 0) : 0));
  // an offline grid carries nothing, unless its generator runs
  const gridW = src.map((s) =>
    s.kind === "grid" && (!now.offline || s.generator) ? (s.w ?? 0) : 0,
  );
  const gridAvail = !now.offline || src.some((s) => s.generator);
  const S = solar.reduce((a, b) => a + b, 0),
    B = batt.reduce((a, b) => a + b, 0),
    G = gridW.reduce((a, b) => a + b, 0);
  const H = now.homeW ?? Math.max(0, S + B + G);
  const sH = Math.min(S, H);
  let rest = H - sH;
  const bH = B > 0 ? Math.min(B, rest) : 0;
  rest -= bH;
  const gH = gridAvail ? Math.max(0, rest) : 0;
  const sB = B < 0 ? Math.min(S - sH, -B) : 0;
  const gB = now.offline ? 0 : B < 0 ? -B - sB : 0;
  const sG = now.offline ? 0 : Math.max(0, S - sH - sB);
  const bG = now.offline ? 0 : B > 0 ? B - bH : 0;
  const grid = gH + gB - sG - bG;

  const edges: EdgeFlow[] = [];
  const ids = src.map((_, i) => `s${i}`);
  const charging = batt.map((b) => Math.max(0, -b)),
    discharging = batt.map((b) => Math.max(0, b));
  const importing = gridW.map((g) => Math.max(0, g)),
    exporting = gridW.map((g) => Math.max(0, -g));
  const push = (from: string, to: string, w: number, kind: EdgeKind) =>
    edges.push({ from, to, w, kind });
  const solarShare = shares(solar, 1);
  src.forEach((s, i) => {
    if (s.kind !== "solar") return;
    push(ids[i], "home", sH * solarShare[i], "solar");
    shares(charging, sB * solarShare[i]).forEach((w, j) => {
      if (src[j].kind === "battery") push(ids[i], ids[j], w, "battIn");
    });
    shares(exporting, sG * solarShare[i]).forEach((w, j) => {
      if (src[j].kind === "grid") push(ids[i], ids[j], w, "gridOut");
    });
  });
  const dis = shares(discharging, bH),
    bExp = shares(discharging, bG);
  const imp = shares(importing, gH),
    gCh = shares(importing, gB);
  let gHClean = 0,
    gHGen = 0;
  src.forEach((s, i) => {
    if (s.kind === "battery") {
      push(ids[i], "home", dis[i], "battOut");
      shares(exporting, bExp[i]).forEach((w, j) => {
        if (src[j].kind === "grid") push(ids[i], ids[j], w, "gridOut");
      });
    } else if (s.kind === "grid") {
      push(ids[i], "home", imp[i], s.generator ? "generator" : "gridIn");
      if (s.lowCarbon !== null) gHClean += imp[i] * s.lowCarbon;
      if (s.generator) gHGen += imp[i];
      shares(charging, gCh[i]).forEach((w, j) => {
        if (src[j].kind === "battery") push(ids[i], ids[j], w, "battIn");
      });
    }
  });

  // the consumers: leaves take their watts, a group the sum of its items, "other" the rest of
  // what the home draws (a producing consumer feeds the home and counts for nothing here)
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
        used += Math.max(0, w);
        push(c.id, it.id, w, "home");
      }
      groupW.set(c.id, sum);
      push("home", c.id, sum, "home");
    } else if (c.kind === "item") {
      const w = now.leaves.get(c.id) ?? 0;
      leafW.set(c.id, w);
      used += Math.max(0, w);
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
    return onGenerator
      ? { key: "power.state.generator", color: COLORS.generator, w: null, tint: true }
      : { key: "power.state.offline", color: COLORS.offline, w: null, tint: true };
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
    case "battIn":
      return COLORS.battIn;
    case "battOut":
      return COLORS.battOut;
    case "gridIn":
      return COLORS.gridIn;
    case "gridOut":
      return COLORS.gridOut;
    case "generator":
      return COLORS.generator;
    default:
      return w < 0 ? COLORS.solar : COLORS.home;
  }
};
