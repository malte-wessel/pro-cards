// Constants of the flow tree (the power and energy flow cards): the option enums, the energy
// colours (Home Assistant's energy dashboard tokens with their default values) and the geometry of
// the tree, in design pixels.
import type { TextStyle } from "../typography.ts";

export const DIRECTIONS = ["right", "down"] as const;
export type Direction = (typeof DIRECTIONS)[number];
// none: the active links are drawn in their colour, without motion
export const FLOW_STYLES = ["dots", "lines", "arrows", "none"] as const;
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
  lane: 8, // distance between the lanes into the home (and out of it, where they fit)
  lineW: 2, // a link's track: lanes squeezed closer keep the gap below between two tracks
  minGap: 2, // … between two lanes; a fan of lanes that needs a smaller one merges into a trunk
  radius: 12, // corner radius of every line
  srcPitch: 52, // least distance between two sources (the label slots usually ask for more)
  srcMargin: 42, // first / last source centre from the edge, across
  consumerPitch: 52, // flat consumer nodes
  itemPitch: 44, // devices inside a group
  groupGap: 22, // between two consumer blocks when groups exist
  consumerMargin: 30, // first / last consumer centre from the edge, across
  rowH: 36, // a list row
  minAcross: 190, // least diagram extent across the flow
  columnPitch: 142, // direction: down – distance between the columns along the flow
  downMargin: 70, // direction: down – first / last source centre from the edge
  srcValueW: 60, // direction: down – the room a source's value is given when its labels' place is chosen
  srcArrowW: 16, // … and the arrow after each value of a source that shows two
  labelGap: 6,
  summaryH: 40, // the summary line above the diagram (grid rows estimate)
} as const;
// the sources' and the home's own circles (px): an icon_size replaces them, a ring scales from them
export const NODE_D = {
  solar: GEOM.dSolar,
  battery: GEOM.dBattery,
  grid: GEOM.dGrid,
  home: GEOM.dHome,
} as const;

// a label's lines (styles: `.plabel`): the value over the name (and a secondary line like the
// name), smaller for a device. These are the default size; the card reads the theme's
// (render/tree.ts labelLines), so a label's height and width follow the theme's text
export interface LabelLines {
  value: TextStyle;
  name: TextStyle;
  smallValue: TextStyle;
  smallName: TextStyle;
}
const FAMILY = "Roboto, system-ui, sans-serif";
export const LABEL_LINES: LabelLines = {
  value: { font: `500 14px ${FAMILY}`, size: 14, line: 17 },
  name: { font: `400 12px ${FAMILY}`, size: 12, line: 15 },
  smallValue: { font: `500 12px ${FAMILY}`, size: 12, line: 15 },
  smallName: { font: `400 11px ${FAMILY}`, size: 11, line: 13 },
};
