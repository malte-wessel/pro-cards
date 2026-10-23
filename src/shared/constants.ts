// Constants shared by all cards.

export const REFRESH_MS = 5 * 60 * 1000;
// a failed history fetch is tried again after this long (history-feed.ts)
export const RETRY_MS = 60 * 1000;

export const DEVICE_CLASS_ICON: Record<string, string> = {
  temperature: "mdi:thermometer",
  humidity: "mdi:water-percent",
  speed: "mdi:weather-windy",
  wind_speed: "mdi:weather-windy",
  pressure: "mdi:gauge",
  atmospheric_pressure: "mdi:gauge",
  illuminance: "mdi:brightness-5",
  power: "mdi:flash",
  energy: "mdi:lightning-bolt",
  battery: "mdi:battery",
  carbon_dioxide: "mdi:molecule-co2",
  pm25: "mdi:blur",
  pm10: "mdi:blur",
  volatile_organic_compounds: "mdi:air-filter",
  moisture: "mdi:water",
  precipitation: "mdi:weather-rainy",
  precipitation_intensity: "mdi:weather-pouring",
  voltage: "mdi:sine-wave",
  current: "mdi:current-ac",
  duration: "mdi:timer-outline",
  timestamp: "mdi:clock-outline",
  signal_strength: "mdi:wifi",
};

// every card's icons: Home Assistant's ha-svg-icon is inline-flex and aligned to the middle of
// the text line, so an ha-icon / ha-state-icon that inherits a line height lays out a line box
// around it and the icon sits a pixel or two below centre (2 px at Home Assistant's 1.5)
export const STYLE_ICONS = `ha-icon, ha-state-icon { line-height: 0; }`;
// an icon's shape and its soft background, as Home Assistant's tile icon: a theme's
// --ha-tile-icon-border-radius and --tile-icon-opacity (0.2 there) restyle them. `k` scales the
// share for a fainter background (an off toggle's 8 % at the default), which still reaches 0 with it
export const ICON_RADIUS = "var(--ha-tile-icon-border-radius, 50%)";
export const iconBg = (color: string, base = "transparent", k = 1) =>
  `color-mix(in srgb, ${color} calc(var(--tile-icon-opacity, 0.2) * ${100 * k}%), ${base})`;
// every card's host takes the height its container gives, as Home Assistant's own cards do (a cell
// with fixed rows, a grid row stretched by a taller neighbour, a horizontal stack); where that
// height follows the content (masonry, a vertical stack) 100% is the content's height anyway.
// `fill_height: false` (the keep-height attribute, syncKeepHeight in card.ts) keeps the content's
// height instead: not stretched as a flex item (a horizontal stack makes the host one), and at
// most the container's height, ha-card (overflow: hidden) shrinking into a cell that is smaller
export const STYLE_HOST = `
  :host { display: block; min-width: 0; height: 100%; }
  :host([keep-height]) { height: auto; max-height: 100%; align-self: flex-start; display: flex; flex-direction: column; }
`;
