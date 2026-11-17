// The demo home's entity registry, as the frontend keeps it in `hass.entities`: the device each
// entity belongs to (the poster card's types find their inputs among a device's other entities) and
// the integrations' own names for some entities (translation keys). Built once over the world's
// entities, so its identity stays the same across hass snapshots (a card looks again only when the
// registry changes).
import type { EntityRegistryEntry, HassEntity } from "../../../../src/shared/ha.ts";
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
  ["coffee_plug", /^(switch\.coffee_machine|sensor\.coffee_machine_power)$/],
];
// the integrations' own names for entities discovery tells apart by them
const TRANSLATION_KEYS: Record<string, string> = {
  "sensor.wind_gust": "wind_gust",
  "sensor.rain_today": "precipitation_today",
  "sensor.energy_today": "energy_today",
};

// the floors and areas, an entity's area by the room its id names (living_room, kitchen …)
export const FLOORS: Record<string, { name: string }> = {
  ground: { name: "Ground floor" },
  upstairs: { name: "Upstairs" },
  outside: { name: "Outside" },
};
export const AREAS: Record<string, { name: string; floor_id: string }> = {
  living_room: { name: "Living room", floor_id: "ground" },
  kitchen: { name: "Kitchen", floor_id: "ground" },
  dining: { name: "Dining room", floor_id: "ground" },
  hallway: { name: "Hallway", floor_id: "ground" },
  office: { name: "Office", floor_id: "upstairs" },
  bedroom: { name: "Bedroom", floor_id: "upstairs" },
  bathroom: { name: "Bathroom", floor_id: "upstairs" },
  attic: { name: "Attic", floor_id: "upstairs" },
  garden: { name: "Garden", floor_id: "outside" },
  garage: { name: "Garage", floor_id: "outside" },
};
const areaOf = (id: string) => Object.keys(AREAS).find((a) => id.includes(a)) ?? null;
// the devices' names (and the area a device stands in)
export const DEVICES: Record<string, { name: string; name_by_user: null; area_id: string | null }> =
  Object.fromEntries(
    (
      [
        ["weather_station", "Weather station", "garden"],
        ["rain_gauge", "Rain gauge", "garden"],
        ["robot_vacuum", "Robot vacuum", "living_room"],
        ["ev", "Car", "garage"],
        ["wallbox", "Wallbox", "garage"],
        ["van", "Van", null],
        ["inverter", "Inverter", "attic"],
        ["home_battery", "Home battery", "garage"],
        ["balcony", "Balcony solar", null],
        ["grid_meter", "Grid meter", "hallway"],
        ["washer", "Washer", "bathroom"],
        ["dishwasher", "Dishwasher", "kitchen"],
        ["heat_pump", "Heat pump", "garden"],
        ["coffee_plug", "Coffee machine", "kitchen"],
      ] as const
    ).map(([id, name, area]) => [id, { name, name_by_user: null, area_id: area }]),
  );

export const ENTITIES: Record<string, EntityRegistryEntry> = Object.fromEntries(
  Object.keys(world.states).map((id) => {
    const entry: EntityRegistryEntry = {
      entity_id: id,
      device_id: DEVICE_TABLE.find(([, re]) => re.test(id))?.[0] ?? null,
      translation_key: TRANSLATION_KEYS[id] ?? null,
      name: null,
      area_id: areaOf(id),
    };
    return [id, entry];
  }),
);

type NamePart = { type: string; text?: string };
// an entity's name from its parts, as Home Assistant's `hass.formatEntityName` composes it: a
// text as it is, none the friendly name, parts by the registries (an entity on a device names
// itself without the device's name: "Washer power" is "power" beside "Washer"), joined by a space
export const formatEntityName = (
  st: HassEntity,
  name?: string | NamePart | NamePart[],
  options?: { separator?: string },
): string => {
  const friendly = String(st.attributes.friendly_name ?? st.entity_id);
  if (typeof name === "string") return name;
  if (!name) return friendly;
  const entry = ENTITIES[st.entity_id];
  const device = entry?.device_id ? DEVICES[entry.device_id] : undefined;
  const areaId = entry?.area_id ?? device?.area_id ?? null;
  const area = areaId ? AREAS[areaId] : undefined;
  const rest =
    device && friendly.toLowerCase().startsWith(device.name.toLowerCase() + " ")
      ? friendly.slice(device.name.length + 1)
      : device && friendly.toLowerCase() === device.name.toLowerCase()
        ? ""
        : friendly;
  // (its own name as an integration gives it: "Finishes")
  const own = rest.charAt(0).toUpperCase() + rest.slice(1);
  const items = Array.isArray(name) ? name : [name];
  const part = (p: NamePart): string | undefined => {
    switch (p.type) {
      case "text":
        return p.text;
      case "entity":
        return own || (items.some((i) => i.type === "device") ? undefined : device?.name);
      case "device":
        return device?.name;
      case "area":
        return area?.name;
      case "floor":
        return area ? FLOORS[area.floor_id]?.name : undefined;
      default:
        return undefined;
    }
  };
  return items
    .map(part)
    .filter((n): n is string => !!n)
    .join(options?.separator ?? " ");
};
