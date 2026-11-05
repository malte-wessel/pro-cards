// The weather, power flow and energy flow cards' header: `badges` written as the 3.0 cards' are,
// the old `header_entities` until 4.0 (said once), never both.
import { describe, expect, it, vi } from "vitest";
import { normalizeWeatherCardConfig } from "../../src/weather/config.ts";
import { normalizePowerFlowConfig } from "../../src/power-flow/config.ts";
import { normalizeEnergyFlowConfig } from "../../src/energy-flow/config.ts";

const CARDS = [
  [
    "weather-card-pro",
    (o: Record<string, unknown>) => normalizeWeatherCardConfig({ entity: "weather.home", ...o }),
  ],
  [
    "power-flow-card-pro",
    (o: Record<string, unknown>) =>
      normalizePowerFlowConfig({
        sources: [{ type: "solar", entity: "sensor.solar_power" }],
        ...o,
      }),
  ],
  [
    "energy-flow-card-pro",
    (o: Record<string, unknown>) =>
      normalizeEnergyFlowConfig({
        sources: [{ type: "solar", entity: "sensor.solar_energy" }],
        ...o,
      }),
  ],
] as const;

describe("a header's badges on the weather and the flow cards", () => {
  for (const [type, norm] of CARDS)
    it(`${type}: takes badges as the 3.0 cards write them, header_entities until 4.0`, () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const c = norm({
          title: "Home",
          badges: [
            { entity: "sensor.outdoor_humidity", icon: { ring: true } },
            { entity: "sensor.outdoor_temperature", visual: { type: "sparkline", hours: 48 } },
          ],
        });
        const header = c.headerIdxs.map((i) => c.entities[i]);
        expect(header.map((e) => !!e.pill)).toEqual([true, true]);
        expect(header[0].badge).toEqual({ style: "plain", size: "s" });
        // the window covers what the badges draw
        expect(c.fetchHours).toBe(48);
        // a badge's old keys name the new spelling
        expect(() =>
          norm({ badges: [{ entity: "sensor.outdoor_humidity", visual: "ring" }] }),
        ).toThrow("visual: ring is icon: { ring: true }");
        // the old header still draws, said once per card type
        const old = norm({
          header_entities: [{ entity: "sensor.outdoor_humidity", visual: "ring" }],
        });
        expect(old.headerIdxs.map((i) => old.entities[i].visual)).toEqual(["ring"]);
        norm({ header_entities: ["sensor.outdoor_humidity"] });
        expect(
          warn.mock.calls.filter((m) => String(m[0]).includes("header_entities is deprecated")),
        ).toHaveLength(1);
        // one or the other
        expect(() =>
          norm({
            badges: ["sensor.outdoor_humidity"],
            header_entities: ["sensor.outdoor_humidity"],
          }),
        ).toThrow(`${type}: header_entities is badges: write badges only`);
      } finally {
        warn.mockRestore();
      }
    });
});
