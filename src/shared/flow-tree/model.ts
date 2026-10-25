// The numbers every flow tree shares (pure): what a card measures (FlowNow), what its allocation
// gives (Flows), the consumers' share of the home, the thresholds' memory and the colours. The
// cards compute the sources' flows themselves: the power card for the moment, the energy card for
// a period.
import { unitOf } from "../entity/model.ts";
import { fmtNumber } from "../format.ts";
import type { HomeAssistant } from "../ha.ts";
import { COLORS, IDLE_W } from "./constants.ts";
import { leavesOf, type FlowTreeConfig } from "./config.ts";
import { isActive } from "./flow.ts";

export interface SourceNow {
  kind: "solar" | "battery" | "grid";
  w: number | null; // solar ≥ 0; battery + = discharging; grid + = import (the generator while offline)
  // a battery's gross flows (≥ 0): one sign of `w`, except a battery that runs two ways at once
  // (twoValued: a solar-fed pair fills while it feeds the home)
  charge: number;
  discharge: number;
  // a grid's gross flows (≥ 0): one sign of `w`, except a grid that runs two ways at once
  // (twoValued: a meter that does not net its phases)
  import: number;
  export: number;
  soc: number | null;
  avail: boolean;
  generator: boolean; // a grid that runs on its generator during an outage
  lowCarbon: number | null; // a grid's low-carbon share of its power, 0 … 1
}
export interface FlowNow {
  sources: SourceNow[];
  leaves: Map<string, number | null>; // consumer id → value, negative when the consumer produces
  homeW: number | null; // the home sensor, null when computed
  offline: boolean;
  price: { num: number; text: string } | null;
}

// `hide_below`: whether a consumer of `w` is shown, given whether it was (undefined: not decided
// yet). It hides below `x` and comes back only clearly above it (20 %, at least `gap`: 2 W), so a
// device idling around the threshold does not blink; a producer counts by its size, unavailable as 0
export const thresholdShown = (
  prev: boolean | undefined,
  w: number | null,
  x: number,
  gap = 2,
): boolean => {
  const a = Math.abs(w ?? 0);
  if (prev === false) return a >= Math.max(x * 1.2, x + gap);
  return a >= x;
};

// whether a node with two flows at once (twoValued) shows both values, given whether it did: from
// the idle threshold on, and once below it again only clearly above it, so the label (and the
// columns it moves) does not flicker
export const bothFlows = (prev: boolean | undefined, a: number, b: number, idle: number, gap = 2) =>
  Math.min(a, b) > 0 && thresholdShown(prev, Math.min(a, b), idle, gap);

export type EdgeKind = "solar" | "battIn" | "battOut" | "gridIn" | "gridOut" | "generator" | "home";
export interface EdgeFlow {
  from: string; // node id: s<i> (source), home, g<i> (group), c<i> / c<i>.<j> / other
  to: string;
  w: number; // negative on a consumer link whose device produces
  kind: EdgeKind;
}
// What the allocation gives: the flows between the nodes (`edges`) and the totals the card draws
// (H, sH, bH, gH, the ring's gHClean / gHGen, sG, bG, the leaf and group values). S, B, sB, dB, gB
// and grid are no drawn quantity: the unit tests check through them that the allocation adds up
// (what goes in comes out), so they stay.
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
  leafW: Map<string, number>; // consumer id → value (signed), "other" included
  groupW: Map<string, number>;
}

// splits `total` over the parts pro rata; when every eligible part is 0 the eligible ones share
// it equally (the others get nothing)
export const shares = (parts: number[], total: number, eligible: boolean[]) => {
  const sum = parts.reduce((a, b, i) => a + (eligible[i] ? b : 0), 0);
  const n = eligible.filter(Boolean).length;
  return parts.map((p, i) => (!eligible[i] ? 0 : sum > 0 ? (total * p) / sum : n ? total / n : 0));
};

// The consumers' links, after the sources' (`edges` grows): leaves take their value, a group the
// sum of its items, "other" the rest of what the home takes (a producing consumer feeds the home
// and counts for nothing here). `hidden`: the nodes not drawn (hiddenNodes); a hidden consumer or
// room counts in the other node, so the shown numbers still add up to the home (a room keeps its
// hidden devices in its total).
export const consumerFlows = (
  cfg: FlowTreeConfig,
  now: FlowNow,
  H: number,
  hidden: ReadonlySet<string>,
  push: (from: string, to: string, w: number, kind: EdgeKind) => void,
) => {
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
  return { leafW, groupW };
};

// every consumer's value from the sensors (inverted where asked), for FlowNow.leaves
export const leafValues = (cfg: FlowTreeConfig, value: (idx: number) => number | null) => {
  const leaves = new Map<string, number | null>();
  for (const leaf of leavesOf(cfg))
    if (leaf.kind === "item") {
      const v = value(leaf.idx);
      leaves.set(leaf.id, v === null ? null : leaf.invert ? -v : v);
    }
  return leaves;
};

// the colour of a source node for its current flow
export const sourceColor = (s: SourceNow, offline: boolean, idle: number = IDLE_W): string => {
  const w = s.w ?? 0,
    on = isActive(w, idle);
  if (s.kind === "grid" && offline)
    return s.generator && on && w > 0 ? COLORS.generator : COLORS.offline;
  if (s.w === null || !on) return COLORS.idle;
  if (s.kind === "solar") return w > 0 ? COLORS.solar : COLORS.idle;
  if (s.kind === "battery") return w > 0 ? COLORS.battOut : COLORS.battIn;
  return w > 0 ? COLORS.gridIn : COLORS.gridOut;
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

// ----- the tree's unit -----

// the items whose values the tree adds up: the home's sensor, the sources' and the consumers'
export const treeIdxs = (cfg: FlowTreeConfig): number[] => {
  const idxs = cfg.homeEntity ? [cfg.homeIdx] : [];
  for (const s of cfg.sources) {
    idxs.push(s.idx);
    if (s.kind !== "solar" && s.secondIdx !== null) idxs.push(s.secondIdx);
  }
  for (const leaf of leavesOf(cfg)) if (leaf.kind === "item") idxs.push(leaf.idx);
  return idxs;
};

// The unit a tree counts in when it is not the card's own kind (`own`: W and kW for the power
// card, kWh and its kin for the energy card): the unit of its first sensor, the home's or else
// the first source's, shown as written (a heat flow in its own unit, water in L/min); null: the
// card's own. `stray` hears of each sensor whose unit differs from the tree's.
export const treeUnit = (
  cfg: FlowTreeConfig,
  hass: HomeAssistant,
  own: (unit: string) => boolean,
  stray: (entity: string) => void,
): string | null => {
  const unit = (idx: number) => {
    const ent = cfg.entities[idx];
    return unitOf(ent, ent.entity ? hass.states[ent.entity] : undefined);
  };
  const idxs = treeIdxs(cfg);
  const first = idxs.map(unit).find((u) => u !== "") ?? "";
  const foreign = first !== "" && !own(first) ? first : null;
  for (const idx of idxs) {
    const u = unit(idx),
      id = cfg.entities[idx].entity;
    if (id && u !== "" && (foreign === null ? !own(u) : u !== foreign)) stray(id);
  }
  return foreign;
};

// a value in a unit of its own, as written: "12.5 L/min"
export const fmtIn = (
  hass: HomeAssistant | undefined,
  v: number | null,
  unit: string,
  dec: number,
): string =>
  v === null || !Number.isFinite(v) ? "–" : `${fmtNumber(hass, Math.abs(v), dec)} ${unit}`;

// links that move by their share of the largest flow (a unit the bounds know nothing of)
export const shareOfMax = (f: Flows) => {
  const ref = Math.max(f.H, ...f.edges.map((e) => Math.abs(e.w)));
  return (w: number) => (ref > 0 ? (1000 * w) / ref : 0);
};
