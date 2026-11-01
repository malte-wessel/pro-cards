// The badge on a tile's icon (pure), as Home Assistant's tile draws it: what a thermostat or a
// humidifier is doing, a person's zone, an entity that is unavailable; nothing for the rest. Its
// colour is the state colour of what it says (a heating thermostat's heat colour).
import { domainOf, stateColorCss } from "../shared/color.ts";
import type { HassEntity, HomeAssistant } from "../shared/ha.ts";

export interface IconBadge {
  icon: string;
  color: string;
  // what it says, for a screen reader (null: the icon says it)
  label: string | null;
}

// a thermostat's action: its icon and the mode whose colour it takes (Home Assistant's
// CLIMATE_HVAC_ACTION_TO_MODE and the hvac_action icons)
const CLIMATE: Record<string, [string, string]> = {
  heating: ["mdi:fire", "heat"],
  preheating: ["mdi:heat-wave", "heat"],
  defrosting: ["mdi:snowflake-melt", "heat"],
  cooling: ["mdi:snowflake", "cool"],
  drying: ["mdi:water-percent", "dry"],
  fan: ["mdi:fan", "fan_only"],
  idle: ["mdi:clock-outline", "off"],
};
// a humidifier's action (HUMIDIFIER_ACTION_MODE and the action icons)
const HUMIDIFIER: Record<string, [string, string]> = {
  humidifying: ["mdi:arrow-up-bold", "on"],
  drying: ["mdi:arrow-down-bold", "on"],
  idle: ["mdi:clock-outline", "off"],
};

// the zone a person or tracker is in, by its state (the zone's name; zone.home is `home`)
const zoneOf = (st: HassEntity, hass: HomeAssistant | undefined) => {
  if (st.state === "home" || st.state === "not_home" || !hass) return undefined;
  const inZones = Array.isArray(st.attributes.in_zones) ? (st.attributes.in_zones as string[]) : [];
  const ids = [...inZones, ...Object.keys(hass.states).filter((id) => id.startsWith("zone."))];
  return ids
    .map((id) => hass.states[id])
    .find(
      (z) =>
        z &&
        st.state ===
          (z.entity_id === "zone.home" ? "home" : String(z.attributes.friendly_name ?? "")),
    );
};

const action = (
  hass: HomeAssistant | undefined,
  st: HassEntity,
  attr: string,
  map: Record<string, [string, string]>,
): IconBadge | null => {
  const a = st.attributes[attr];
  if (typeof a !== "string" || !map[a]) return null;
  const [icon, mode] = map[a];
  return {
    icon,
    color: stateColorCss(st, mode) ?? "var(--primary-color)",
    label: hass?.formatEntityAttributeValue?.(st, attr) ?? a,
  };
};

export const iconBadgeOf = (
  hass: HomeAssistant | undefined,
  st: HassEntity | undefined,
): IconBadge | null => {
  if (!st || st.state === "unknown") return null;
  if (st.state === "unavailable")
    return { icon: "mdi:exclamation-thick", color: "var(--orange-color)", label: null };
  switch (domainOf(st.entity_id)) {
    case "climate":
      return action(hass, st, "hvac_action", CLIMATE);
    case "humidifier":
      return action(hass, st, "action", HUMIDIFIER);
    case "person":
    case "device_tracker": {
      const zone = zoneOf(st, hass);
      const icon =
        typeof zone?.attributes.icon === "string"
          ? zone.attributes.icon
          : st.state === "not_home"
            ? "mdi:home-export-outline"
            : "mdi:home";
      return { icon, color: stateColorCss(st) ?? "var(--primary-color)", label: null };
    }
    default:
      return null;
  }
};
