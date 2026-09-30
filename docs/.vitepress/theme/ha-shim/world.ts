// Demo home: a small set of entities with plausible states, deterministic history and a slow drift,
// so every example on the docs site is live without a real Home Assistant.
import type {
  ForecastEntry,
  HassEntity,
  HassEntities,
  WeatherForecastType,
} from "../../../../src/shared/ha.ts";

// an entity of the demo home: its initial state plus how its history and drift are generated
export interface EntityDef {
  id: string;
  state: string;
  attributes: Record<string, unknown>;
  kind: string;
  noise?: number;
  min?: number;
  max?: number;
  decimals?: number;
  duty?: number;
}
export type EntityExtra = Partial<Pick<EntityDef, "noise" | "min" | "max" | "decimals" | "duty">>;

// one compact history row, as `history/history_during_period` returns it
export interface HistoryPoint {
  s: string;
  lu: number;
}
export type HistoryResult = Record<string, HistoryPoint[]>;

export interface World {
  states: HassEntities;
  defs: Record<string, EntityDef>;
  get(id: string): HassEntity | undefined;
  set(id: string, state?: string | number, attributes?: Record<string, unknown>): void;
  subscribe(fn: () => void): () => void;
  history(ids: string[], start: number, end: number): HistoryResult;
  // the forecast of a weather entity (`weather/subscribe_forecast`); null when it has none
  forecast(id: string, type: WeatherForecastType): ForecastEntry[] | null;
  start(): void;
  _timer?: ReturnType<typeof setInterval>;
}

const now = () => Date.now();
const iso = (t: number) => new Date(t).toISOString();

// deterministic pseudo random per entity id
const hash = (s: string) => {
  let h = 2166136261;
  for (const c of s) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// daily shapes: value offset as a function of local hour (0..24), 0 at "current" hour is applied by the caller
const shapes: Record<string, (h: number) => number> = {
  temperature: (h) => Math.sin(((h - 9) / 24) * Math.PI * 2) * 4,
  indoor: (h) => Math.sin(((h - 10) / 24) * Math.PI * 2) * 1.2,
  humidity: (h) => -Math.sin(((h - 9) / 24) * Math.PI * 2) * 12,
  wind: (h) => Math.max(0, Math.sin(((h - 8) / 24) * Math.PI * 2)) * 8,
  pressure: (h) => Math.sin((h / 24) * Math.PI * 4) * 1.5,
  uv: (h) => Math.max(0, Math.sin(((h - 6) / 12) * Math.PI)) * 6,
  co2: (h) => (h > 21 || h < 7 ? 350 : h > 17 ? 200 : 0),
  power: (h) => (h > 6 && h < 9 ? 900 : h > 17 && h < 22 ? 1400 : 0),
  solar: (h) => Math.max(0, Math.sin(((h - 6) / 13) * Math.PI)) * 4.2,
  battery: () => 0,
  flat: () => 0,
};
const E: Record<string, EntityDef> = {}; // entity definitions: id → { state, attributes, kind, noise, min, max, decimals }
const def = (
  id: string,
  state: string | number,
  attributes: Record<string, unknown> = {},
  kind = "flat",
  extra: EntityExtra = {},
) => {
  E[id] = { id, state: String(state), attributes, kind, ...extra };
};

// weather station
def(
  "sensor.outdoor_temperature",
  17.4,
  {
    unit_of_measurement: "°C",
    device_class: "temperature",
    state_class: "measurement",
    friendly_name: "Outdoor temperature",
  },
  "temperature",
  { noise: 0.3, decimals: 1 },
);
def(
  "sensor.outdoor_humidity",
  71,
  { unit_of_measurement: "%", device_class: "humidity", friendly_name: "Outdoor humidity" },
  "humidity",
  { noise: 1, min: 20, max: 100 },
);
def(
  "sensor.dew_point",
  12.1,
  { unit_of_measurement: "°C", device_class: "temperature", friendly_name: "Dew point" },
  "temperature",
  { noise: 0.2, decimals: 1 },
);
def(
  "sensor.wind_speed",
  9.4,
  { unit_of_measurement: "km/h", device_class: "wind_speed", friendly_name: "Wind speed" },
  "wind",
  { noise: 2.5, min: 0, decimals: 1 },
);
def(
  "sensor.wind_gust",
  18.2,
  { unit_of_measurement: "km/h", device_class: "wind_speed", friendly_name: "Wind gust" },
  "wind",
  { noise: 5, min: 0, decimals: 1 },
);
def(
  "sensor.pressure",
  1016.3,
  {
    unit_of_measurement: "hPa",
    device_class: "atmospheric_pressure",
    friendly_name: "Air pressure",
  },
  "pressure",
  { noise: 0.2, decimals: 1 },
);
def("sensor.uv_index", 3.2, { unit_of_measurement: "UV index", friendly_name: "UV index" }, "uv", {
  noise: 0.1,
  min: 0,
  max: 11,
  decimals: 1,
});
def(
  "sensor.rain_rate",
  0,
  {
    unit_of_measurement: "mm/h",
    device_class: "precipitation_intensity",
    friendly_name: "Rain rate",
  },
  "flat",
  { noise: 0, min: 0, decimals: 1 },
);
def(
  "sensor.illuminance",
  24600,
  { unit_of_measurement: "lx", device_class: "illuminance", friendly_name: "Illuminance" },
  "lux",
  { noise: 0, min: 0.1, decimals: 0 },
);
def(
  "sensor.weather_station_battery",
  84,
  { unit_of_measurement: "%", device_class: "battery", friendly_name: "Weather station battery" },
  "battery",
  { noise: 0, min: 0, max: 100, decimals: 0 },
);
def("binary_sensor.rain", "off", { device_class: "moisture", friendly_name: "Rain" }, "binary", {
  duty: 0.2,
});
def("sun.sun", "above_horizon", { friendly_name: "Sun", elevation: 38.2, azimuth: 190.4 });
def("weather.home", "partlycloudy", {
  friendly_name: "Home",
  temperature: 17.4,
  temperature_unit: "°C",
  apparent_temperature: 16.1,
  dew_point: 12.1,
  humidity: 71,
  pressure: 1016.3,
  pressure_unit: "hPa",
  wind_speed: 9.4,
  wind_speed_unit: "km/h",
  wind_bearing: 225,
  wind_gust_speed: 18.2,
  cloud_coverage: 45,
  uv_index: 3.2,
  visibility: 14,
  visibility_unit: "km",
  precipitation_unit: "mm",
  supported_features: 3, // daily + hourly forecasts
  attribution: "Demo data",
});

// rooms
def(
  "sensor.living_room_temperature",
  21.6,
  {
    unit_of_measurement: "°C",
    device_class: "temperature",
    friendly_name: "Living room temperature",
  },
  "indoor",
  { noise: 0.1, decimals: 1 },
);
def(
  "sensor.living_room_humidity",
  48,
  { unit_of_measurement: "%", device_class: "humidity", friendly_name: "Living room humidity" },
  "humidity",
  { noise: 0.5, min: 20, max: 100, decimals: 0 },
);
def(
  "sensor.living_room_co2",
  742,
  { unit_of_measurement: "ppm", device_class: "carbon_dioxide", friendly_name: "Living room CO₂" },
  "co2",
  { noise: 15, min: 400, decimals: 0 },
);
def(
  "sensor.kitchen_temperature",
  22.3,
  { unit_of_measurement: "°C", device_class: "temperature", friendly_name: "Kitchen temperature" },
  "indoor",
  { noise: 0.1, decimals: 1 },
);
def(
  "sensor.kitchen_humidity",
  55,
  { unit_of_measurement: "%", device_class: "humidity", friendly_name: "Kitchen humidity" },
  "humidity",
  { noise: 0.5, min: 20, max: 100, decimals: 0 },
);
def(
  "sensor.bathroom_temperature",
  23.1,
  { unit_of_measurement: "°C", device_class: "temperature", friendly_name: "Bathroom temperature" },
  "indoor",
  { noise: 0.1, decimals: 1 },
);
def(
  "sensor.bathroom_humidity",
  68,
  { unit_of_measurement: "%", device_class: "humidity", friendly_name: "Bathroom humidity" },
  "humidity",
  { noise: 1, min: 20, max: 100, decimals: 0 },
);
def(
  "sensor.bedroom_temperature",
  19.2,
  { unit_of_measurement: "°C", device_class: "temperature", friendly_name: "Bedroom temperature" },
  "indoor",
  { noise: 0.1, decimals: 1 },
);
def(
  "sensor.office_temperature",
  24.8,
  { unit_of_measurement: "°C", device_class: "temperature", friendly_name: "Office temperature" },
  "indoor",
  { noise: 0.1, decimals: 1 },
);
def(
  "sensor.office_co2",
  1180,
  { unit_of_measurement: "ppm", device_class: "carbon_dioxide", friendly_name: "Office CO₂" },
  "co2",
  { noise: 20, min: 400, decimals: 0 },
);
def(
  "sensor.hallway_temperature",
  20.4,
  { unit_of_measurement: "°C", device_class: "temperature", friendly_name: "Hallway temperature" },
  "indoor",
  { noise: 0.1, decimals: 1 },
);

// lights & switches
def("light.living_room", "on", {
  friendly_name: "Living room",
  brightness: 180,
  color_mode: "brightness",
  supported_color_modes: ["brightness"],
});
def("light.kitchen", "off", { friendly_name: "Kitchen", supported_color_modes: ["brightness"] });
def("light.dining_table", "on", {
  friendly_name: "Dining table",
  brightness: 120,
  supported_color_modes: ["brightness"],
});
def("light.bedroom", "off", { friendly_name: "Bedroom", supported_color_modes: ["brightness"] });
def("light.office", "on", {
  friendly_name: "Office",
  brightness: 255,
  supported_color_modes: ["brightness"],
});
def("light.hallway", "off", { friendly_name: "Hallway", supported_color_modes: ["onoff"] });
def("light.desk_lamp", "on", {
  friendly_name: "Desk lamp",
  brightness: 90,
  supported_color_modes: ["brightness"],
});
def("light.garden", "off", { friendly_name: "Garden", supported_color_modes: ["onoff"] });
def("switch.coffee_machine", "off", { friendly_name: "Coffee machine" });
def("switch.garden_pump", "off", { friendly_name: "Garden pump" });

// covers & climate
def("cover.living_room_blinds", "open", {
  friendly_name: "Living room blinds",
  device_class: "shutter",
  current_position: 100,
});
def("cover.bedroom_blinds", "closed", {
  friendly_name: "Bedroom blinds",
  device_class: "shutter",
  current_position: 0,
});
def("cover.office_blinds", "open", {
  friendly_name: "Office blinds",
  device_class: "shutter",
  current_position: 40,
});
def("cover.awning", "open", {
  friendly_name: "Awning",
  device_class: "awning",
  current_position: 65,
});
def("climate.living_room", "heat", {
  friendly_name: "Living room thermostat",
  temperature: 21,
  current_temperature: 21.6,
  hvac_action: "heating",
  hvac_modes: ["off", "heat", "auto"],
  min_temp: 5,
  max_temp: 30,
});
def("climate.bedroom", "off", {
  friendly_name: "Bedroom thermostat",
  temperature: 18,
  current_temperature: 19.2,
  hvac_action: "off",
  hvac_modes: ["off", "heat", "auto"],
  min_temp: 5,
  max_temp: 30,
});

// people & modes
def("person.alex", "home", { friendly_name: "Alex", entity_picture: null });
def("person.sam", "not_home", { friendly_name: "Sam" });
def("person.kim", "home", { friendly_name: "Kim" });
def("input_boolean.night_mode", "off", { friendly_name: "Night mode", icon: "mdi:weather-night" });
def("input_boolean.vacation_mode", "off", { friendly_name: "Vacation mode", icon: "mdi:beach" });
def("input_boolean.guest_mode", "on", { friendly_name: "Guest mode", icon: "mdi:account-group" });
def("input_boolean.away_mode", "off", {
  friendly_name: "Away mode",
  icon: "mdi:home-export-outline",
});

// windows & doors
def(
  "binary_sensor.window_kitchen",
  "on",
  { device_class: "window", friendly_name: "Kitchen window" },
  "binary",
  { duty: 0.3 },
);
def(
  "binary_sensor.window_bedroom",
  "off",
  { device_class: "window", friendly_name: "Bedroom window" },
  "binary",
  { duty: 0.1 },
);
def(
  "binary_sensor.window_office",
  "off",
  { device_class: "window", friendly_name: "Office window" },
  "binary",
  { duty: 0.15 },
);
def(
  "binary_sensor.window_bathroom",
  "on",
  { device_class: "window", friendly_name: "Bathroom window" },
  "binary",
  { duty: 0.4 },
);
def(
  "binary_sensor.door_front",
  "off",
  { device_class: "door", friendly_name: "Front door" },
  "binary",
  { duty: 0.05 },
);
def(
  "binary_sensor.motion_hallway",
  "off",
  { device_class: "motion", friendly_name: "Hallway motion" },
  "binary",
  { duty: 0.2 },
);

// appliances
def("vacuum.robot", "cleaning", {
  friendly_name: "Robot vacuum",
  battery_level: 72,
  status: "Cleaning",
});
def(
  "sensor.robot_battery",
  72,
  { unit_of_measurement: "%", device_class: "battery", friendly_name: "Robot battery" },
  "battery",
  { min: 0, max: 100, decimals: 0 },
);
def(
  "sensor.robot_progress",
  68,
  { unit_of_measurement: "%", friendly_name: "Cleaning progress" },
  "flat",
  { min: 0, max: 100, decimals: 0 },
);
def("sensor.robot_current_room", "Kitchen", { friendly_name: "Current room" });
def("sensor.robot_total_cleanings", 312, { friendly_name: "Total cleanings" });
def(
  "sensor.robot_last_area",
  43.5,
  { unit_of_measurement: "m²", friendly_name: "Last cleaned area" },
  "flat",
  { decimals: 1 },
);
def(
  "sensor.robot_dustbin_remaining",
  35,
  { unit_of_measurement: "%", friendly_name: "Dustbin remaining" },
  "flat",
  { min: 0, max: 100, decimals: 0 },
);
def("sensor.washer_status", "run", {
  friendly_name: "Washing machine",
  progress: 68,
  remaining_minutes: 42,
});
def(
  "sensor.washer_remaining",
  42,
  { unit_of_measurement: "min", device_class: "duration", friendly_name: "Washer remaining" },
  "flat",
  { decimals: 0 },
);
def("sensor.dishwasher_status", "end", { friendly_name: "Dishwasher" });
def("media_player.living_room_tv", "playing", {
  friendly_name: "Living room TV",
  media_title: "Planet Earth III",
  volume_level: 0.35,
});
def("media_player.kitchen_speaker", "idle", {
  friendly_name: "Kitchen speaker",
  volume_level: 0.2,
});

// energy
def(
  "sensor.power_consumption",
  1240,
  { unit_of_measurement: "W", device_class: "power", friendly_name: "Power consumption" },
  "power",
  { noise: 60, min: 80, decimals: 0 },
);
def(
  "sensor.solar_power",
  3.4,
  { unit_of_measurement: "kW", device_class: "power", friendly_name: "Solar power" },
  "solar",
  { noise: 0.2, min: 0, decimals: 1 },
);
def(
  "sensor.energy_today",
  12.8,
  { unit_of_measurement: "kWh", device_class: "energy", friendly_name: "Energy today" },
  "flat",
  { decimals: 1 },
);
def(
  "sensor.range_hood_power",
  0,
  { unit_of_measurement: "W", device_class: "power", friendly_name: "Range hood power" },
  "power",
  { noise: 0, min: 0, decimals: 0 },
);
def(
  "sensor.dining_light_power",
  42,
  { unit_of_measurement: "W", device_class: "power", friendly_name: "Dining light power" },
  "power",
  { noise: 3, min: 0, decimals: 0 },
);
def(
  "sensor.kitchen_window_battery",
  76,
  { unit_of_measurement: "%", device_class: "battery", friendly_name: "Kitchen window battery" },
  "battery",
  { decimals: 0 },
);
def(
  "sensor.motion_hallway_battery",
  18,
  { unit_of_measurement: "%", device_class: "battery", friendly_name: "Hallway motion battery" },
  "battery",
  { decimals: 0 },
);
def(
  "sensor.switch_temperature",
  58,
  {
    unit_of_measurement: "°C",
    device_class: "temperature",
    friendly_name: "Kitchen switch temperature",
  },
  "indoor",
  { noise: 0.5, decimals: 0 },
);

// scenes & scripts
for (const [id, name, icon] of [
  ["scene.movie_night", "Movie night", "mdi:movie-open"],
  ["scene.bright", "Bright", "mdi:white-balance-sunny"],
  ["scene.dimmed", "Dimmed", "mdi:lightbulb-on-50"],
  ["scene.dinner", "Dinner", "mdi:silverware-fork-knife"],
  ["scene.good_night", "Good night", "mdi:weather-night"],
])
  def(id, "2026-09-20T18:12:00+00:00", { friendly_name: name, icon });
def("script.check_windows", "off", {
  friendly_name: "Check windows",
  icon: "mdi:window-open-variant",
});

// ---------- state store ----------

const states: HassEntities = {};
const t0 = now();
for (const e of Object.values(E)) {
  states[e.id] = {
    entity_id: e.id,
    state: e.state,
    attributes: { ...e.attributes },
    last_changed: iso(t0 - 5 * 60e3),
    last_updated: iso(t0 - 60e3),
    context: { id: "demo", user_id: null, parent_id: null },
  };
}

const listeners = new Set<() => void>();
const notify = () => {
  for (const fn of listeners) fn();
};

export const world: World = {
  states,
  defs: E,
  get: (id) => states[id],
  set(id, state, attributes) {
    const st = states[id];
    if (!st) return;
    const next = {
      ...st,
      state: state === undefined ? st.state : String(state),
      attributes: { ...st.attributes, ...(attributes || {}) },
      last_updated: iso(now()),
    };
    if (next.state !== st.state) next.last_changed = next.last_updated;
    states[id] = next;
    notify();
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  // history/history_during_period shape: { id: [{ s, lu }] }
  history(ids, start, end) {
    const out: HistoryResult = {};
    for (const id of ids) out[id] = series(id, start, end);
    return out;
  },
  forecast(id, type) {
    return forecast(id, type);
  },
  start() {
    if (this._timer) return;
    this._timer = setInterval(() => {
      // drift a few numeric sensors so cards visibly update
      const r = Math.random;
      for (const e of Object.values(E)) {
        if (!e.noise || r() > 0.25) continue;
        const st = states[e.id];
        let v = Number(st.state) + (r() - 0.5) * e.noise;
        if (e.min !== undefined) v = Math.max(e.min, v);
        if (e.max !== undefined) v = Math.min(e.max, v);
        states[e.id] = {
          ...st,
          state: v.toFixed(e.decimals ?? 1),
          last_updated: iso(now()),
          last_changed: iso(now()),
        };
      }
      notify();
    }, 5000);
  },
};

// ---------- history ----------

const cache = new Map<string, HistoryPoint[]>();
function series(id: string, start: number, end: number): HistoryPoint[] {
  const e = E[id];
  if (!e) return [];
  const key = `${id}|${Math.floor(start / 600e3)}|${Math.floor(end / 600e3)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rand = rng(hash(id));
  const step = 10 * 60e3;
  const out: HistoryPoint[] = [];
  const st = states[id];
  const hourOf = (t: number) => {
    const d = new Date(t);
    return d.getHours() + d.getMinutes() / 60;
  };
  if (e.kind === "binary" || !Number.isFinite(Number(e.state))) {
    // on/off segments with a duty cycle; the last segment matches the current state
    let cur = rand() < (e.duty ?? 0.2) ? "on" : "off";
    for (let t = start; t < end; t += step) {
      if (rand() < 0.08) cur = cur === "on" ? "off" : "on";
      out.push({ s: cur, lu: t / 1000 });
    }
    if (out.length) out[out.length - 1].s = st.state;
    cache.set(key, out);
    return out;
  }
  const base = Number(st.state);
  const shape = shapes[e.kind] || shapes.flat; // unused for "lux", which has its own curve
  const nowH = hourOf(end);
  let walk = 0;
  for (let t = start; t < end; t += step) {
    const h = hourOf(t);
    let v: number;
    if (e.kind === "lux") {
      // log-scale daylight curve, independent of the current value
      const s = Math.max(0, Math.sin(((h - 5.5) / 14) * Math.PI));
      v = s <= 0 ? 0.4 + rand() * 0.05 : Math.pow(10, 0.5 + s * 4.6) * (0.75 + rand() * 0.5);
    } else if (e.kind === "battery") {
      v = base + ((end - t) / 86400e3) * 1.5;
    } else {
      walk = walk * 0.85 + (rand() - 0.5) * (e.noise ?? 0);
      v = base + shape(h) - shape(nowH) + walk * 3;
    }
    if (e.min !== undefined) v = Math.max(e.min, v);
    if (e.max !== undefined) v = Math.min(e.max, v);
    out.push({ s: v.toFixed(e.decimals ?? 1), lu: t / 1000 });
  }
  cache.set(key, out);
  return out;
}

// ---------- forecast ----------

const HOUR = 3600e3,
  DAY = 86400e3;
const fcCache = new Map<string, ForecastEntry[]>();
// the demo forecast of weather.home: rain this evening (3.6 mm from 20:00), a wet day mid-week,
// otherwise the temperature curve of the outdoor sensor; deterministic for a given hour
function forecast(id: string, type: WeatherForecastType): ForecastEntry[] | null {
  if (id !== "weather.home" || type === "twice_daily") return null;
  const t = now();
  const key = `${type}|${Math.floor(t / HOUR)}`;
  const hit = fcCache.get(key);
  if (hit) return hit;
  const base = Number(states[id].attributes.temperature);
  const nowH = new Date(t).getHours() + new Date(t).getMinutes() / 60;
  const shape = shapes.temperature;
  const out: ForecastEntry[] = [];
  if (type === "hourly") {
    const start = t - (t % HOUR);
    const evening = [0.4, 1.2, 1.4, 0.6, 0.2, 0.1]; // 20:00 … 01:00 tonight
    let eveningIdx = 0;
    for (let i = 0; i < 48; i++) {
      const ts = start + i * HOUR,
        d = new Date(ts),
        h = d.getHours();
      const firstNight = i < 24 + (24 - nowH) && (h >= 20 || (h <= 1 && i > 6));
      let precipitation = 0,
        probability = 5 + (i % 5) * 3;
      if (firstNight && eveningIdx < evening.length) {
        precipitation = evening[eveningIdx++];
        probability = 60 + Math.round(precipitation * 18);
      } else if (i >= 38 && i <= 41) {
        precipitation = 0.3;
        probability = 40;
      }
      const night = h < 6 || h >= 21;
      const condition =
        precipitation > 0
          ? "rainy"
          : night
            ? i % 5 === 0
              ? "cloudy"
              : "clear-night"
            : h >= 11 && h <= 15
              ? "sunny"
              : "partlycloudy";
      const temperature =
        base + shape(h) - shape(nowH) + Math.sin(i / 7) * 0.6 - (i > 30 ? 1.5 : 0);
      out.push({
        datetime: iso(ts),
        condition,
        temperature: Number(temperature.toFixed(1)),
        precipitation,
        precipitation_probability: probability,
        humidity: Math.round(60 + (precipitation > 0 ? 25 : 0) + Math.sin(i / 5) * 8),
        wind_speed: Number((6 + shapes.wind(h) + (precipitation > 0 ? 6 : 0)).toFixed(1)),
        wind_bearing: 225,
        cloud_coverage: condition === "sunny" ? 10 : condition === "cloudy" ? 90 : 45,
      });
    }
  } else {
    const midnight = new Date(new Date(t).toDateString()).getTime();
    const dHi = [0, 2, -3, -5, -1, 3, 4, 2, 0, 1],
      rain = [3.6, 0, 8.2, 12.5, 1.1, 0, 0, 0.5, 0, 2.4],
      prob = [85, 10, 90, 95, 40, 5, 5, 20, 10, 55],
      cond = [
        "partlycloudy",
        "sunny",
        "rainy",
        "pouring",
        "partlycloudy",
        "sunny",
        "sunny",
        "partlycloudy",
        "cloudy",
        "rainy",
      ];
    for (let i = 0; i < 10; i++) {
      const hi = Math.max(base + 1.5, 18 + dHi[i]),
        lo = hi - 8 - (i % 3);
      out.push({
        datetime: iso(midnight + i * DAY + 12 * HOUR),
        condition: cond[i],
        temperature: Number(hi.toFixed(1)),
        templow: Number(lo.toFixed(1)),
        precipitation: rain[i],
        precipitation_probability: prob[i],
        humidity: 55 + Math.round(prob[i] / 4),
        wind_speed: Number((8 + (i % 4) * 3).toFixed(1)),
        wind_bearing: 200 + i * 10,
      });
    }
  }
  fcCache.set(key, out);
  return out;
}
