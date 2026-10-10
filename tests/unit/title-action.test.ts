// `title_tap_action`: what tapping a card's title does, on every card with the shared header.
import { describe, expect, it } from "vitest";
import { normalizeEntityCardConfig } from "../../src/entity-card.ts";
import { normalizeEntityGroupCardConfig } from "../../src/entity-group-card.ts";
import { normalizeEntitySectionsCardConfig } from "../../src/entity-sections-card.ts";
import { normalizePowerFlowConfig } from "../../src/power-flow/config.ts";
import { normalizeRainCardConfig } from "../../src/rain/config.ts";
import { normalizeTitleAction } from "../../src/shared/entity/config.ts";
import { normalizeWeatherCardConfig } from "../../src/weather/config.ts";
import { normalizeWindCardConfig } from "../../src/wind/config.ts";

const NAV = { action: "navigate", navigation_path: "/rooms/living" };

describe("title_tap_action", () => {
  it("is an action, or null when unset or none", () => {
    expect(normalizeTitleAction({})).toBeNull();
    expect(normalizeTitleAction({ title_tap_action: null })).toBeNull();
    expect(normalizeTitleAction({ title_tap_action: "none" })).toBeNull();
    expect(normalizeTitleAction({ title_tap_action: { action: "none" } })).toBeNull();
    expect(normalizeTitleAction({ title_tap_action: "more-info" })).toEqual({
      action: "more-info",
    });
    expect(normalizeTitleAction({ title_tap_action: NAV })).toEqual(NAV);
  });
  it("reaches the config of every card with a header", () => {
    const withTap = { title: "Home", title_tap_action: NAV };
    const configs = [
      normalizeEntityGroupCardConfig({ ...withTap, entities: ["sensor.a"] }),
      normalizeEntitySectionsCardConfig({ ...withTap, sections: [{ entities: ["sensor.a"] }] }),
      normalizePowerFlowConfig({
        ...withTap,
        home: "sensor.home",
        sources: [{ type: "solar", entity: "sensor.solar" }],
      }),
      normalizeWeatherCardConfig({ ...withTap, entity: "weather.home" }),
      normalizeWindCardConfig({ ...withTap, entity: "sensor.wind" }),
      normalizeRainCardConfig({ ...withTap, entity: "sensor.rain" }),
    ];
    for (const c of configs) expect(c.titleTap).toEqual(NAV);
    // without it the title is plain text; the entity card has no title at all
    expect(normalizeEntityGroupCardConfig({ entities: ["sensor.a"] }).titleTap).toBeNull();
    expect(normalizeEntityCardConfig({ entity: "sensor.a" }).titleTap).toBeNull();
  });
});
