// The demo home's registries, as the frontend keeps them in `hass.entities`, `hass.devices` and
// `hass.areas`: which device and area each entity belongs to, the integrations' own names for some
// entities (translation keys), and the areas with their temperature and humidity sensors. Built
// once over the world's entities, so their identity stays the same across hass snapshots (a card
// looks again only when a registry changes).
import type {
  AreaRegistryEntry,
  DeviceRegistryEntry,
  EntityRegistryEntry,
} from "../../../../src/shared/ha.ts";
import { world } from "./world.ts";

const area = (
  area_id: string,
  name: string,
  icon: string,
  temperature: string | null = null,
  humidity: string | null = null,
): AreaRegistryEntry => ({
  area_id,
  name,
  icon,
  picture: null,
  temperature_entity_id: temperature,
  humidity_entity_id: humidity,
});

export const AREAS: Record<string, AreaRegistryEntry> = Object.fromEntries(
  [
    area(
      "living_room",
      "Living room",
      "mdi:sofa",
      "sensor.living_room_temperature",
      "sensor.living_room_humidity",
    ),
    area("kitchen", "Kitchen", "mdi:countertop"),
    area("bedroom", "Bedroom", "mdi:bed"),
    area("office", "Office", "mdi:desk"),
    area("bathroom", "Bathroom", "mdi:shower"),
    area("hallway", "Hallway", "mdi:door"),
    area("garage", "Garage", "mdi:garage"),
    area("garden", "Garden", "mdi:flower", "sensor.outdoor_temperature", "sensor.outdoor_humidity"),
    area("shed", "Shed", "mdi:home-roof"),
  ].map((a) => [a.area_id, a]),
);

// the devices: their area and the entities on them (an entity's id names the rest)
const DEVICE_TABLE: [string, string, string | null, RegExp][] = [
  [
    "weather_station",
    "Weather station",
    "garden",
    /^sensor\.(wind_|outdoor_|dew_point|uv_index|rain_rate$|weather_station_)/,
  ],
  ["rain_gauge", "Rain gauge", "garden", /^(sensor\.rain_(rate_roof|today)|binary_sensor\.rain)$/],
  ["robot_vacuum", "Robot vacuum", "hallway", /^(vacuum\.robot|sensor\.robot_)/],
  [
    "ev",
    "Car",
    "garage",
    /^(sensor\.ev_(battery|range)|binary_sensor\.ev_|number\.ev_|device_tracker\.ev$)/,
  ],
  ["wallbox", "Wallbox", "garage", /^sensor\.ev_charger_/],
  ["inverter", "Solar inverter", "garage", /^sensor\.(solar_|energy_today$)/],
  ["home_battery", "Home battery", "garage", /^sensor\.battery_/],
  ["balcony", "Balcony power station", "living_room", /^sensor\.balcony_/],
  ["grid_meter", "Grid meter", "hallway", /^(sensor\.grid_|binary_sensor\.grid_)/],
  ["washer", "Washing machine", "bathroom", /^sensor\.washer_/],
  ["dishwasher", "Dishwasher", "kitchen", /^sensor\.dishwasher_/],
  ["heat_pump", "Heat pump", "garage", /^sensor\.heat_pump_/],
];
// rooms by the start of an id (an entity without a device of its own)
const ROOMS = [
  "living_room",
  "kitchen",
  "bedroom",
  "office",
  "bathroom",
  "hallway",
  "garden",
  "shed",
];
const roomOf = (id: string): string | null => {
  const obj = id.split(".")[1] ?? "";
  if (obj === "garage_door" || obj === "garage_side_door") return "garage";
  if (obj === "desk_lamp") return "office";
  if (obj === "dining_table") return "living_room";
  if (obj === "front_door") return "hallway";
  return ROOMS.find((r) => obj === r || obj.startsWith(`${r}_`)) ?? null;
};
// the integrations' own names for entities discovery tells apart by them
const TRANSLATION_KEYS: Record<string, string> = {
  "sensor.wind_gust": "wind_gust",
  "sensor.rain_today": "precipitation_today",
  "sensor.energy_today": "energy_today",
};

export const DEVICES: Record<string, DeviceRegistryEntry> = Object.fromEntries(
  DEVICE_TABLE.map(([id, name, a]) => [id, { id, name, area_id: a, name_by_user: null }]),
);

export const ENTITIES: Record<string, EntityRegistryEntry> = Object.fromEntries(
  Object.keys(world.states).map((id) => {
    const device = DEVICE_TABLE.find(([, , , re]) => re.test(id))?.[0] ?? null;
    const entry: EntityRegistryEntry = {
      entity_id: id,
      device_id: device,
      // an entity on a device takes the device's area; one without, the room its id names
      area_id: device ? null : roomOf(id),
      translation_key: TRANSLATION_KEYS[id] ?? null,
      platform: "demo",
    };
    return [id, entry];
  }),
);
