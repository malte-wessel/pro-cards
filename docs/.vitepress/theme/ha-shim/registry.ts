// The demo home's entity registry, as the frontend keeps it in `hass.entities`: the device each
// entity belongs to (the poster card's types find their inputs among a device's other entities) and
// the integrations' own names for some entities (translation keys). Built once over the world's
// entities, so its identity stays the same across hass snapshots (a card looks again only when the
// registry changes).
import type { EntityRegistryEntry } from "../../../../src/shared/ha.ts";
import { world } from "./world.ts";

// the devices, by the entities on them (an entity's id names its device)
const DEVICE_TABLE: [string, RegExp][] = [
  ["weather_station", /^sensor\.(wind_|outdoor_|dew_point|uv_index|rain_rate$|weather_station_)/],
  ["rain_gauge", /^(sensor\.rain_(rate_roof|today)|binary_sensor\.rain)$/],
  ["robot_vacuum", /^(vacuum\.robot|sensor\.robot_)/],
  ["ev", /^(sensor\.ev_(battery|range)|binary_sensor\.ev_|number\.ev_|device_tracker\.ev$)/],
  ["wallbox", /^sensor\.ev_charger_/],
  ["van", /^(sensor\.van_|device_tracker\.van$)/],
  ["inverter", /^sensor\.(solar_|energy_today$)/],
  ["home_battery", /^sensor\.battery_/],
  ["balcony", /^sensor\.balcony_/],
  ["grid_meter", /^(sensor\.grid_|binary_sensor\.grid_)/],
  ["washer", /^sensor\.washer_/],
  ["dishwasher", /^sensor\.dishwasher_/],
  ["heat_pump", /^sensor\.heat_pump_/],
];
// the integrations' own names for entities discovery tells apart by them
const TRANSLATION_KEYS: Record<string, string> = {
  "sensor.wind_gust": "wind_gust",
  "sensor.rain_today": "precipitation_today",
  "sensor.energy_today": "energy_today",
};

export const ENTITIES: Record<string, EntityRegistryEntry> = Object.fromEntries(
  Object.keys(world.states).map((id) => {
    const entry: EntityRegistryEntry = {
      entity_id: id,
      device_id: DEVICE_TABLE.find(([, re]) => re.test(id))?.[0] ?? null,
      translation_key: TRANSLATION_KEYS[id] ?? null,
    };
    return [id, entry];
  }),
);
