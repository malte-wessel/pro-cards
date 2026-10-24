// Constants of the energy flow card; the tree's own (enums, colours, geometry) are the flow tree's.
import type { Animation } from "../shared/flow-tree/constants.ts";

export const CARD_TYPE = "energy-flow-card-pro";

// a link carrying less than this (kWh) in the period is idle: a dashed track without motion
export const IDLE_KWH = 0.05;
// the least step of the thresholds' hysteresis (kWh)
export const GAP_KWH = 0.01;

// kWh below `mwhAbove`, MWh from it on, with their decimals
export interface EnergyUnits {
  mwhAbove: number;
  decKwh: number;
  decMwh: number;
}
export const DEFAULT_UNITS: EnergyUnits = { mwhAbove: 1000, decKwh: 1, decMwh: 2 };

// the links move by their share of the home (‰): slowest at nothing, fastest at all of it
export const SHARE_ANIMATION: Animation = { slowBelow: 0, fastAbove: 1000 };
