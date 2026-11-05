// A v3 badge as the heading card draws it (happy-dom): its parts in the pill's order, icon, name,
// value, visual, switch, whatever it draws.
import { afterEach, describe, expect, it } from "vitest";
import { HeadingCard } from "../../../../src/heading-card.ts";
import type { HassEntity, HomeAssistant } from "../../../../src/shared/ha.ts";

const STATES: Record<string, [string, Record<string, unknown>]> = {
  "sensor.battery": ["72", { friendly_name: "Battery", unit_of_measurement: "%" }],
  "light.desk": ["on", { friendly_name: "Desk", rgb_color: [255, 120, 0] }],
  "person.malte": ["home", { friendly_name: "Malte", entity_picture: "/local/malte.jpg" }],
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
    formatEntityState: (st: HassEntity) =>
      st.attributes.unit_of_measurement
        ? `${st.state} ${st.attributes.unit_of_measurement}`
        : st.state,
  }) as unknown as HomeAssistant;

const cards: HeadingCard[] = [];
afterEach(() => {
  for (const c of cards.splice(0)) c.remove();
});
const badges = (list: unknown[]) => {
  const el = new HeadingCard();
  el.setConfig({ title: "Home", badges: list });
  document.body.appendChild(el);
  el.hass = hass();
  cards.push(el);
  return [...(el.shadowRoot as ShadowRoot).querySelectorAll<HTMLElement>(".row.hval")];
};
// what a pill holds, in order
const parts = (row: HTMLElement) =>
  [...row.children]
    .filter((c) => !c.classList.contains("hit"))
    .map((c) =>
      c instanceof HTMLImageElement
        ? "picture"
        : c.tagName === "SPAN"
          ? c.className.split(" ")[0]
          : c.tagName.toLowerCase().startsWith("ha-")
            ? "icon"
            : c.className || c.tagName.toLowerCase(),
    );

describe("a v3 badge's pill", () => {
  it("holds the icon, the name, the value, the visual and the switch in that order", () => {
    const [bar, spark, trend, sw] = badges([
      { entity: "sensor.battery", visual: "bar", show_name: true },
      { entity: "sensor.battery", visual: "sparkline" },
      { entity: "sensor.battery", visual: "trend" },
      { entity: "light.desk", control: "toggle", show_name: true },
    ]);
    expect(parts(bar)).toEqual(["icon", "secondary", "state", "bbar"]);
    expect(parts(spark)).toEqual(["icon", "state", "bspark"]);
    // no history yet: no trend to draw
    expect(parts(trend)).toEqual(["icon", "state"]);
    expect(parts(sw).slice(0, 3)).toEqual(["icon", "secondary", "state"]);
    expect(sw.querySelector(".toggle")).not.toBeNull();
  });

  it("draws its icon place: a ring, a dot, a picture or nothing", () => {
    const [ring, dot, picture, none] = badges([
      { entity: "sensor.battery", icon: { ring: true } },
      { entity: "sensor.battery", icon: { type: "dot" } },
      { entity: "person.malte", icon: { type: "image" } },
      { entity: "sensor.battery", icon: false },
    ]);
    expect(parts(ring)).toEqual(["bring", "state"]);
    expect(ring.querySelector(".bring svg")).not.toBeNull();
    expect(parts(dot)).toEqual(["bdot", "state"]);
    expect(parts(picture)).toEqual(["picture", "state"]);
    expect(parts(none)).toEqual(["state"]);
  });

  it("takes a light's own colour", () => {
    const [desk] = badges(["light.desk"]);
    expect(desk.style.getPropertyValue("--fe-color")).toContain("255, 120, 0");
  });
});
