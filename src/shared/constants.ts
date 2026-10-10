// Constants shared by all cards.

export const REFRESH_MS = 5 * 60 * 1000;
export const AXIS_FONT = "10px Roboto, system-ui, sans-serif";

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
