import { describe, it, expect } from "vitest";
import "../../src/index.ts";
import { snapshot } from "../../docs/.vitepress/theme/ha-shim/hass.ts";
import type { HomeAssistant } from "../../src/shared/ha.ts";
import { makeValidator } from "../../scripts/schema-validator.ts";

const hass = snapshot() as unknown as HomeAssistant;
// the cards Home Assistant's card picker suggests for an entity, as their short names
const suggested = (id: string) =>
  (window.customCards ?? []).flatMap((c) => {
    const s = c.getEntitySuggestion?.(hass, id);
    return s
      ? [
          String(s.config.type)
            .replace(/^custom:/, "")
            .replace(/-card-pro$/, ""),
        ]
      : [];
  });
const suggestion = (type: string, id: string) =>
  window.customCards?.find((c) => c.type === type)?.getEntitySuggestion?.(hass, id);

describe("the card picker's suggestions for an entity", () => {
  it("offer the poster and the tile for an entity with a kind of its own", () => {
    expect(suggested("light.kitchen")).toEqual(["poster", "tile"]);
    expect(suggested("cover.garage_door")).toEqual(["poster", "tile"]);
    expect(suggested("sensor.battery_soc")).toEqual(["poster", "tile", "multi-trend"]);
  });

  it("offer the cards made for an entity's domain", () => {
    expect(suggested("weather.home")).toEqual(["poster", "tile", "weather"]);
    expect(suggested("sun.sun")).toEqual(["poster", "tile", "sun-path", "sun-azimuth"]);
    expect(suggested("sensor.wind_speed")).toEqual(["poster", "tile", "multi-trend"]);
    expect(suggested("sensor.rain_rate")).toEqual(["poster", "tile", "multi-trend"]);
    // the wind, rain and illuminance cards, soon deprecated, leave them to the poster and the tile
    expect(suggested("sensor.illuminance")).toEqual(["multi-trend"]);
  });

  it("offer a numeric sensor only the trend, and nothing for the rest", () => {
    expect(suggested("sensor.kitchen_temperature")).toEqual(["multi-trend"]);
    // a sensor with a word for a state, entities our cards draw as Home Assistant's tile does
    expect(suggested("sensor.dishwasher_status")).toEqual([]);
    expect(suggested("binary_sensor.door_front")).toEqual([]);
    expect(suggested("input_boolean.guest_mode")).toEqual([]);
    expect(suggested("scene.dinner")).toEqual([]);
  });

  it("start from the card's own stub for that entity", () => {
    expect(suggestion("tile-card-pro", "light.kitchen")).toEqual({
      config: { type: "custom:tile-card-pro", entity: "light.kitchen" },
    });
    expect(suggestion("weather-card-pro", "weather.home")?.config).toMatchObject({
      type: "custom:weather-card-pro",
      entity: "weather.home",
      sections: [{ type: "hero" }, { type: "row" }, { type: "forecast" }],
    });
    expect(suggestion("multi-trend-card-pro", "sensor.kitchen_temperature")?.config).toMatchObject({
      entities: [{ entity: "sensor.kitchen_temperature" }],
    });
    // a card that suggests itself for nothing has no suggestion at all
    expect(window.customCards?.find((c) => c.type === "layout-card-pro")?.getEntitySuggestion).toBe(
      undefined,
    );
  });

  it("are valid configs for every entity of the demo home", () => {
    const validate = makeValidator();
    for (const id of Object.keys(hass.states))
      for (const c of window.customCards ?? []) {
        const s = c.getEntitySuggestion?.(hass, id);
        if (s) expect(validate(s.config), `${c.type} for ${id}`).toBeNull();
      }
  });
});
