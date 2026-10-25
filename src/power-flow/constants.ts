// Constants of the power flow card; the tree's own (enums, colours, geometry) are the flow tree's.
export const CARD_TYPE = "power-flow-card-pro";

// W below `kwAbove`, kW from it on (0: always kW), with their decimals
export interface Units {
  kwAbove: number;
  decW: number;
  decKw: number;
}
export const DEFAULT_UNITS: Units = { kwAbove: 1000, decW: 0, decKw: 2 };
