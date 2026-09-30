// Constants of the power flow card: the option enums, the energy colours (Home Assistant's energy
// dashboard tokens with their default values) and the geometry of the tree, in design pixels.
export const CARD_TYPE = "power-flow-card";

export const DIRECTIONS = ["right", "down"] as const;
export type Direction = (typeof DIRECTIONS)[number];
export const FLOW_STYLES = ["dots", "lines", "arrows"] as const;
export type FlowStyle = (typeof FLOW_STYLES)[number];
export const CONSUMER_STYLES = ["nodes", "list"] as const;
export type ConsumerStyle = (typeof CONSUMER_STYLES)[number];
export const SOURCE_KINDS = ["solar", "battery", "grid"] as const;
export type SourceKind = (typeof SOURCE_KINDS)[number];
export const IDLE_LINKS = ["dashed", "hidden", "faint"] as const;
export type IdleLinks = (typeof IDLE_LINKS)[number];

// a link carrying less than this is idle: a dashed track without motion
export const IDLE_W = 20;

// the loads (W) between which the flow goes from its slowest to its fastest
export interface Animation {
  slowBelow: number;
  fastAbove: number;
}
export const DEFAULT_ANIMATION: Animation = { slowBelow: 0, fastAbove: 3600 };
// W below `kwAbove`, kW from it on (0: always kW), with their decimals
export interface Units {
  kwAbove: number;
  decW: number;
  decKw: number;
}
export const DEFAULT_UNITS: Units = { kwAbove: 1000, decW: 0, decKw: 2 };

export const COLORS = {
  solar: "var(--energy-solar-color, #ff9800)",
  gridIn: "var(--energy-grid-consumption-color, #488fc2)",
  gridOut: "var(--energy-grid-return-color, #8353d1)",
  battOut: "var(--energy-battery-out-color, #4db6ac)",
  battIn: "var(--energy-battery-in-color, #f06292)",
  nonFossil: "var(--energy-non-fossil-color, #0f9d58)",
  generator: "var(--amber-color, #ffc107)",
  home: "var(--primary-color)",
  idle: "var(--disabled-color, #9e9e9e)",
  offline: "var(--red-color, #f44336)",
  balanced: "var(--green-color, #4caf50)",
} as const;

export const ICONS = {
  solar: "mdi:solar-power-variant",
  battery: "mdi:battery",
  grid: "mdi:transmission-tower",
  gridOff: "mdi:transmission-tower-off",
  generator: "mdi:engine",
  home: "mdi:home",
  group: "mdi:home-group",
  consumer: "mdi:flash",
  other: "mdi:dots-horizontal-circle-outline",
} as const;

// the tree's geometry (px): node diameters, the source column, the rails, lanes and pitches
export const GEOM = {
  dSolar: 44,
  dBattery: 40,
  dGrid: 44,
  dHome: 46,
  dConsumer: 32,
  dGroup: 32,
  dDevice: 24,
  srcAlong: 48, // centre of the source column along the flow
  railBattery: 16, // the charging rail (… → battery), along
  railGrid: 6, // the export rail (… → grid), along
  lane: 8, // distance between the lanes into the home
  radius: 12, // corner radius of every line
  srcPitch: 52, // least distance between two sources
  srcMargin: 40, // first / last source centre from the edge, across
  consumerPitch: 50, // flat consumer nodes
  itemPitch: 40, // devices inside a group
  groupGap: 22, // between two consumer blocks when groups exist
  consumerMargin: 30, // first / last consumer centre from the edge, across
  rowH: 36, // a list row
  minAcross: 190, // least diagram extent across the flow
  columnPitch: 142, // direction: down – distance between the columns along the flow
  downMargin: 70, // direction: down – first / last source centre from the edge
  labelH: 32, // a label: value over name
  labelLine: 15, // a label's extra line (secondary)
  labelGap: 6,
  summaryH: 40, // the summary line above the diagram (grid rows estimate)
} as const;

export const FONT_VALUE = "500 14px Roboto, system-ui, sans-serif";
export const FONT_NAME = "12px Roboto, system-ui, sans-serif";
export const FONT_SMALL = "500 12px Roboto, system-ui, sans-serif";
export const FONT_SMALL_NAME = "11px Roboto, system-ui, sans-serif";
