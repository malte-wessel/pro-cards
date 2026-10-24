// The numbers of the power flow (pure): every node's watts from its entity models, the allocation
// of the flows between the sources, the home and the consumers (the order Home Assistant's energy
// dashboard uses: solar covers the home first, then the battery, then the grid; surplus solar
// charges the battery before it is exported; a battery fed by its own panels, `charge_from:
// solar`, is charged before solar covers the home), the summary state and the W / kW formatting.
import { unitOf, type EntityModel } from "../shared/entity/model.ts";
import { fmtNumber } from "../shared/format.ts";
import type { HomeAssistant } from "../shared/ha.ts";
import type { EntityItem } from "../shared/entity/config.ts";
import { twoValued } from "../shared/flow-tree/config.ts";
import { COLORS } from "../shared/flow-tree/constants.ts";
import { isActive } from "../shared/flow-tree/flow.ts";
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
import type { PowerFlowConfig } from "./config.ts";
import { DEFAULT_UNITS, type Units } from "./constants.ts";

const UNIT_TO_W: Record<string, number> = { W: 1, kW: 1000, MW: 1e6, mW: 1e-3 };

// the model's value in watts, null when unavailable
export const wattsOf = (ent: EntityItem, m: EntityModel | undefined): number | null => {
  if (!m || m.model.num === null) return null;
  return m.model.num * (UNIT_TO_W[unitOf(ent, m.st)] ?? 1);
};

export type PowerNow = FlowNow;

export const powerNow = (cfg: PowerFlowConfig, models: EntityModel[]): PowerNow => {
  const entities = cfg.entities;
  const w = (idx: number | null) => (idx === null ? null : wattsOf(entities[idx], models[idx]));
  let offline = false,
    price: PowerNow["price"] = null;
  const none = {
    soc: null,
    generator: false,
    lowCarbon: null,
    charge: 0,
    discharge: 0,
    import: 0,
    export: 0,
  };
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
      const gross = twoValued(s);
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
      if (g > 0) return { kind: "grid", w: g, avail: true, ...none, generator: true, import: g };
    }
    // a two-way grid keeps both gross flows while it is up; down it carries nothing either way
    const gross = twoValued(s) && !down;
    return {
      kind: "grid",
      w: v,
      avail: v !== null,
      ...none,
      lowCarbon,
      import: gross ? Math.max(0, a ?? 0) : Math.max(0, v ?? 0),
      export: gross ? Math.max(0, b ?? 0) : Math.max(0, -(v ?? 0)),
    };
  });
  const leaves = leafValues(cfg, w);
  const homeW = cfg.homeEntity ? w(cfg.homeIdx) : null;
  return {
    sources,
    leaves,
    homeW: homeW === null ? null : Math.max(0, homeW),
    offline,
    price,
  };
};

// `hidden`: the nodes not drawn (hiddenNodes, consumerFlows)
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
  // a grid that runs both ways (`both_ways`) imports and exports its gross flows, every other
  // grid one sign of its net
  const twoWay = cfg.sources.map(
    (c, i) => c.kind === "grid" && twoValued(c) && !now.offline && !src[i].generator,
  );
  const importing = gridW.map((g, i) => (twoWay[i] ? src[i].import : Math.max(0, g))),
    exporting = gridW.map((g, i) => (twoWay[i] ? src[i].export : Math.max(0, -g)));
  const S = solar.reduce((a, b) => a + b, 0),
    G = gridW.reduce((a, b) => a + b, 0),
    D = discharging.reduce((a, b) => a + b, 0),
    C = charging.reduce((a, b) => a + b, 0),
    B = D - C;
  // the batteries the panels feed (`charge_from: solar`) take their solar before the home does
  const solarFed = cfg.sources.map((s) => s.kind === "battery" && s.chargeFrom === "solar");
  const C0 = charging.reduce((a, c, i) => a + (solarFed[i] ? c : 0), 0);
  // whether panel i may charge battery j: a battery that names its panels takes none of the others
  const feeds = cfg.sources.map((s) => (s.kind === "battery" ? s.panels : null));
  const canFeed = (i: number, j: number) => !feeds[j] || feeds[j].includes(cfg.sources[i].id);

  // panel by panel, what each panel gives: home[i], batt[i][j], export[i] (the export a two-way
  // grid reports first, then what is left over). Each step takes from the panels pro rata to
  // what each has left; a remainder below EPS (rounding) is nothing
  const EPS = 1e-9;
  const zeros = () => src.map(() => 0);
  const toHome = zeros(),
    toBatt = src.map(zeros),
    toGridRes = zeros(),
    toGridRest = zeros();
  const left = solar.slice();
  const tidy = () => left.forEach((w, i) => (left[i] = w > EPS ? w : 0));
  const leftSum = () => left.reduce((a, w) => a + w, 0);
  const take = (total: number, into: number[]) => {
    const sum = leftSum();
    left.forEach((w, i) => {
      const x = sum > 0 ? (total * w) / sum : 0;
      into[i] += x;
      left[i] -= x;
    });
    tidy();
  };
  // the solar-fed batteries take their charge from their own panels, those with the fewest
  // panels first: a panel goes to the battery that has no other before one that has. Batteries
  // with as many panels ask together, each its panels pro rata to the power they have left
  // (a panel asked for more serves every ask in proportion), and ask again while a battery
  // still takes more and one of its panels has power left
  const panelsOf = src.map((_, j) => src.map((_, i) => isSolar[i] && canFeed(i, j)));
  const fed = src.map((_, j) => j).filter((j) => isCharging[j] && solarFed[j]);
  const count = (j: number) => panelsOf[j].filter(Boolean).length;
  const need = charging.slice();
  for (const n of [...new Set(fed.map(count))].sort((a, b) => a - b)) {
    const group = fed.filter((j) => count(j) === n);
    // every round fills the group or spends a panel
    for (let round = 0; round <= src.length; round++) {
      const asks = src.map(zeros);
      let asked = false;
      for (const j of group) {
        const own = left.reduce((a, w, i) => a + (panelsOf[j][i] ? w : 0), 0);
        if (need[j] <= EPS || own <= 0) continue;
        left.forEach((w, i) => {
          if (!panelsOf[j][i] || w <= 0) return;
          asks[i][j] = (need[j] * w) / own;
          asked = true;
        });
      }
      if (!asked) break;
      asks.forEach((row, i) => {
        const want = row.reduce((a, b) => a + b, 0);
        const k = want > 0 ? Math.min(1, left[i] / want) : 0;
        row.forEach((a, j) => {
          toBatt[i][j] += a * k;
          need[j] -= a * k;
          left[i] -= a * k;
        });
      });
      tidy();
    }
  }
  const sB0 = toBatt.reduce((a, row) => a + row.reduce((x, y) => x + y, 0), 0);
  // the export a two-way grid reports: from the panels' rest first, then from the batteries;
  // resB is what it takes from each battery's discharge
  const E = exporting.reduce((a, e, j) => a + (twoWay[j] ? e : 0), 0);
  const sGx = Math.min(E, leftSum());
  take(sGx, toGridRes);
  const resB = shares(discharging, Math.min(E - sGx, D), isDischarging);
  const bGx = resB.reduce((a, b) => a + b, 0);
  // the home: what the sources give it (the reported export no source covers was never the
  // home's), solar first, then the batteries, then the grid
  const H = now.homeW ?? Math.max(0, S + B + G + (E - sGx - bGx));
  const sH = Math.min(leftSum(), H);
  take(sH, toHome);
  let rest = H - sH;
  const bH = Math.max(0, Math.min(D - bGx, rest));
  rest -= bH;
  const gH = gridAvail && rest > EPS ? rest : 0;
  // charging: solar surplus first, then other batteries' surplus, then the grid
  const sB1 = Math.min(leftSum(), C - C0);
  const surplus = zeros();
  take(sB1, surplus);
  const others = shares(
    charging,
    sB1,
    isCharging.map((c, j) => c && !solarFed[j]),
  );
  surplus.forEach((x, i) =>
    others.forEach((w, j) => (toBatt[i][j] += sB1 > 0 ? (x * w) / sB1 : 0)),
  );
  if (!now.offline) left.forEach((w, i) => (toGridRest[i] = w));
  const sG = sGx + toGridRest.reduce((a, b) => a + b, 0);
  const solarIn = src.map((_, j) => toBatt.reduce((a, row) => a + row[j], 0));
  const sB = sB0 + sB1;

  const edges: EdgeFlow[] = [];
  const ids = src.map((_, i) => `s${i}`);
  const z = (w: number) => (Math.abs(w) < EPS ? 0 : w);
  const push = (from: string, to: string, w: number, kind: EdgeKind) =>
    edges.push({ from, to, w: z(w), kind });
  // the export of a source over the grids: the reported part to the two-way grids, the rest pro
  // rata to what each grid exports
  const toGrids = (res: number, other: number) => {
    const a = shares(exporting, res, twoWay),
      b = shares(exporting, other, isGrid);
    return b.map((w, j) => w + a[j]);
  };
  // a battery that names its panels has no link from the others
  src.forEach((s, i) => {
    if (s.kind !== "solar") return;
    push(ids[i], "home", toHome[i], "solar");
    toBatt[i].forEach((w, j) => {
      if (isBatt[j] && canFeed(i, j)) push(ids[i], ids[j], w, "battIn");
    });
    toGrids(toGridRes[i], toGridRest[i]).forEach((w, j) => {
      if (isGrid[j]) push(ids[i], ids[j], w, "gridOut");
    });
  });
  // the charge solar did not cover comes from other batteries and the grid, pro rata to what is
  // left: the discharge the home did not take is split over the batteries still charging, each
  // giver over the others (never itself); what finds no room is exported, the rest comes from
  // the grid. Nothing depends on the order the batteries are written in.
  const remaining = charging.map((c, j) => Math.max(0, c - solarIn[j]));
  const free = discharging.map((d, i) => d - resB[i]);
  const dis = shares(free, bH, isDischarging);
  const give = free.map((d, i) => Math.max(0, d - dis[i]));
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
  const bG = bExp.reduce((a, b, i) => a + b + resB[i], 0);
  const grid = gH + gB - sG - bG;
  const imp = shares(importing, gH, isGrid),
    gCh = shares(importing, gB, isGrid);
  let gHClean = 0,
    gHGen = 0;
  src.forEach((s, i) => {
    if (s.kind === "battery") {
      push(ids[i], "home", dis[i], "battOut");
      battIn[i].forEach((w, j) => {
        if (isBatt[j] && j !== i) push(ids[i], ids[j], w, "battIn");
      });
      toGrids(resB[i], bExp[i]).forEach((w, j) => {
        if (isGrid[j]) push(ids[i], ids[j], w, "gridOut");
      });
    } else if (s.kind === "grid") {
      push(ids[i], "home", imp[i], s.generator ? "generator" : "gridIn");
      // a grid on its generator: its power is the generator's, not the grid mix its fossil
      // sensor describes
      if (s.generator) gHGen += imp[i];
      else if (s.lowCarbon !== null) gHClean += imp[i] * s.lowCarbon;
      shares(remaining, gCh[i], isCharging).forEach((w, j) => {
        if (isBatt[j]) push(ids[i], ids[j], w, "battIn");
      });
    }
  });

  const { leafW, groupW } = consumerFlows(cfg, now, H, hidden, push);

  return {
    S,
    H,
    B,
    sH: z(sH),
    bH: z(bH),
    gH,
    gHClean,
    gHGen,
    sB: z(sB),
    dB: z(dB),
    gB: z(gB),
    sG: z(sG),
    bG: z(bG),
    grid: z(grid),
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
  const on = (w: number) => isActive(w, cfg.idleBelow);
  if (now.offline) {
    const onGenerator = on(f.gH) && now.sources.some((s) => s.generator);
    if (onGenerator)
      return { key: "power.state.generator", color: COLORS.generator, w: null, tint: true };
    const key = on(f.bH)
      ? "power.state.offline_battery"
      : on(f.sH)
        ? "power.state.offline_solar"
        : "power.state.offline";
    return { key, color: COLORS.offline, w: null, tint: true };
  }
  const expensive =
    cfg.expensiveAbove !== null &&
    now.price !== null &&
    now.price.num >= cfg.expensiveAbove &&
    on(f.gH);
  if (expensive)
    return { key: "power.state.expensive", color: COLORS.offline, w: null, tint: true };
  // a grid that runs both ways may export while the home imports: the larger names the state
  const twoWay = cfg.sources.some((s) => s.kind === "grid" && twoValued(s));
  if (on(f.sG + f.bG) && (!twoWay || f.sG + f.bG >= f.gH))
    return { key: "power.state.exporting", color: COLORS.gridOut, w: f.sG + f.bG, tint: false };
  if (on(f.bH) && f.bH >= f.gH)
    return { key: "power.state.battery", color: COLORS.battOut, w: null, tint: false };
  if (on(f.gH)) return { key: "power.state.importing", color: COLORS.gridIn, w: f.gH, tint: false };
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
