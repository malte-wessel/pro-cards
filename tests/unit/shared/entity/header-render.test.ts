// Header items as the cards draw them (happy-dom): a badge carries its icon, and a badge with
// nothing to say is the icon in a circle. Centring in Home Assistant's layout is measured in
// tests/e2e/icons.spec.ts.
import { afterEach, describe, expect, it } from "vitest";
import { EntityGroupCard } from "../../../../src/entity-group-card.ts";
import type { HassEntity, HomeAssistant } from "../../../../src/shared/ha.ts";

const STATES: Record<string, [string, Record<string, unknown>]> = {
  "vacuum.robot": ["cleaning", { friendly_name: "Robot" }],
  "sensor.battery": ["72", { friendly_name: "Battery", unit_of_measurement: "%" }],
  "sensor.offline": ["unavailable", { friendly_name: "Offline" }],
  "sensor.temp": ["21.5", { friendly_name: "Temperature", unit_of_measurement: "°C" }],
};
const hass = () =>
  ({
    states: Object.fromEntries(
      Object.entries(STATES).map(([id, [state, attributes]]) => [
        id,
        { entity_id: id, state, attributes } as unknown as HassEntity,
      ]),
    ),
    locale: { language: "en" },
    config: { unit_system: { temperature: "°C" } },
    // as Home Assistant formats a state: with its unit
    formatEntityState: (st: HassEntity) =>
      st.attributes.unit_of_measurement
        ? `${st.state} ${st.attributes.unit_of_measurement}`
        : st.state,
  }) as unknown as HomeAssistant;

const cards: EntityGroupCard[] = [];
afterEach(() => {
  for (const c of cards.splice(0)) c.remove();
});
// the header items of a group card with these header entities
const header = (header_entities: unknown[]) => {
  const el = new EntityGroupCard();
  el.setConfig({ title: "Robot", header_entities, entities: ["sensor.temp"] });
  document.body.appendChild(el);
  el.hass = hass();
  cards.push(el);
  return [...(el.shadowRoot as ShadowRoot).querySelectorAll<HTMLElement>(".header .row.hval")];
};
// what a header item holds, in order: its own icon, the name, the plain value, the badge
const parts = (hv: HTMLElement) =>
  [...hv.children]
    .filter((c) => !c.classList.contains("hit"))
    .map((c) =>
      c.classList.contains("badge")
        ? `badge(${[...c.children].map((x) => (x.tagName === "SPAN" ? x.textContent : "icon")).join(", ")})${c.classList.contains("round") ? ".round" : ""}`
        : c.tagName === "SPAN"
          ? `${c.className}:${c.textContent}`
          : "icon",
    );

describe("header badges", () => {
  it("carry their icon inside the pill, with the rule label or the value", () => {
    const [robot, battery] = header([
      {
        entity: "vacuum.robot",
        visual: "badge",
        rules: [{ state: "cleaning", color: "blue", label: "Cleaning" }],
      },
      { entity: "sensor.battery", visual: "badge" },
    ]);
    expect(parts(robot)).toEqual(["badge(icon, Cleaning)"]);
    expect(parts(battery)).toEqual(["badge(icon, 72 %)"]);
  });
  it("are the icon in a circle with show_value: false or an empty text", () => {
    const [hidden, empty] = header([
      { entity: "vacuum.robot", visual: "badge", show_value: false },
      { entity: "vacuum.robot", visual: "badge", value: "" },
    ]);
    expect(parts(hidden)).toEqual(["badge(icon).round"]);
    expect(parts(empty)).toEqual(["badge(icon).round"]);
  });
  it("keep their text while the entity is unavailable", () => {
    const [offline] = header([{ entity: "sensor.offline", visual: "badge" }]);
    expect(parts(offline)).toEqual(["badge(icon, unavailable)"]);
  });
  it("leave the icon out with show_icon: false, and draw nothing with neither", () => {
    const [text, nothing] = header([
      { entity: "sensor.battery", visual: "badge", show_icon: false },
      { entity: "sensor.battery", visual: "badge", show_icon: false, show_value: false },
    ]);
    expect(parts(text)).toEqual(["badge(72 %)"]);
    expect(parts(nothing)).toEqual([]);
  });
  it("keep the name before the badge", () => {
    const [named] = header([{ entity: "vacuum.robot", visual: "badge", show_name: true }]);
    expect(parts(named)).toEqual(["secondary:Robot", "badge(icon, cleaning)"]);
  });
  it("leave icon items as they were: icon, then the plain value", () => {
    const [temp] = header(["sensor.temp"]);
    expect(parts(temp)).toEqual(["icon", "state:21.5 °C"]);
  });
});
