// A rule's box in the editor's lists: when it matches and what it changes.
import { describe, it, expect } from "vitest";
import { snapshot } from "../../../../docs/.vitepress/theme/ha-shim/hass.ts";
import { ruleLines } from "../../../../src/shared/kinds/rule-list.ts";

const hass = snapshot();

describe("a rule's box", () => {
  it("names the attribute a rule reads and the state in Home Assistant's words", () => {
    expect(
      ruleLines(hass, { attribute: "hvac_action", state: "heating" }, "climate.living_room", "°C"),
    ).toEqual({ title: "Hvac action: Heating", detail: "" });
    expect(ruleLines(hass, { below: 20 }, "sensor.battery_soc", "%").title).toBe("Below 20 %");
  });
  it("says whether a button's rule fills it or keeps it grey", () => {
    expect(ruleLines(hass, { state: "on", active: "true" }, "", "").detail).toBe("Filled");
    expect(ruleLines(hass, { state: "on", active: false, pulse: true }, "", "").detail).toBe(
      "Pulse · Grey",
    );
  });
});
