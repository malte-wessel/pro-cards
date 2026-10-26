// The heading card: its config, and its title and icon as buttons (happy-dom). The badges' look is
// covered by the visual cases (hc-*), their normalisation in shared/entity/config.test.ts.
import { afterEach, describe, expect, it } from "vitest";
import { HeadingCard } from "../../src/heading-card.ts";
import { normalizeHeadingCardConfig } from "../../src/heading/config.ts";
import type { HassEntity, HomeAssistant } from "../../src/shared/ha.ts";

const hass = () =>
  ({
    states: {
      "sensor.temp": {
        entity_id: "sensor.temp",
        state: "21.5",
        attributes: { unit_of_measurement: "°C" },
      } as unknown as HassEntity,
    },
    locale: { language: "en" },
    config: { unit_system: { temperature: "°C" } },
  }) as unknown as HomeAssistant;

const NAV = { action: "navigate", navigation_path: "/rooms/living" };

describe("heading-card-pro config", () => {
  it("is registered and offered in the card picker", () => {
    expect(customElements.get("heading-card-pro")).toBe(HeadingCard);
    expect(window.customCards?.some((c) => c.type === "heading-card-pro")).toBe(true);
  });
  it("defaults to a title with outline badges of size m and six hours of history", () => {
    const c = normalizeHeadingCardConfig({ title: "Living room", badges: ["sensor.temp"] });
    expect(c).toMatchObject({
      layout: "heading",
      style: "title",
      align: "start",
      badgesPosition: "end",
      overflow: "wrap",
      hours: 6,
      groups: [],
      headerIdxs: [0],
      hasHeader: true,
      iconTap: null,
    });
    expect(c.entities[0].badge).toEqual({ style: "outline", size: "m" });
  });
  it("reads its options and falls back on unknown values", () => {
    const c = normalizeHeadingCardConfig({
      style: "hero",
      align: "center",
      badges_position: "below",
      overflow: "scroll",
      badge_style: "soft",
      badge_size: "l",
      hours_to_show: 24,
      badges: ["sensor.temp"],
    });
    expect(c).toMatchObject({ style: "hero", align: "center", badgesPosition: "below" });
    expect(c).toMatchObject({ overflow: "scroll", hours: 24 });
    expect(c.entities[0].badge).toEqual({ style: "soft", size: "l" });
    const d = normalizeHeadingCardConfig({ style: "x", badges_position: "x", badge_style: "x" });
    expect(d).toMatchObject({ style: "title", badgesPosition: "end", entities: [] });
  });
  it("keeps icon_tap_action: none apart from unset", () => {
    expect(normalizeHeadingCardConfig({}).iconTap).toBeNull();
    expect(normalizeHeadingCardConfig({ icon_tap_action: "none" }).iconTap).toEqual({
      action: "none",
    });
    expect(normalizeHeadingCardConfig({ icon_tap_action: NAV }).iconTap).toEqual(NAV);
  });
  it("names the error of a badge without an entity or a value", () => {
    expect(() => normalizeHeadingCardConfig({ badges: [{ name: "x" }] })).toThrow(
      /heading-card-pro: badges\[0\] needs 'entity' or 'value'/,
    );
    expect(() => normalizeHeadingCardConfig(null)).toThrow(/heading-card-pro: invalid config/);
  });
});

describe("heading-card-pro title and icon", () => {
  const cards: HeadingCard[] = [];
  afterEach(() => {
    for (const c of cards.splice(0)) c.remove();
  });
  // the card's header and the actions its title and icon fire
  const mount = (cfg: Record<string, unknown>) => {
    const el = new HeadingCard();
    el.setConfig({ title: "Living room", icon: "mdi:sofa", ...cfg });
    document.body.appendChild(el);
    el.hass = hass();
    cards.push(el);
    const fired: unknown[] = [];
    el.addEventListener("hass-action", (ev) => fired.push((ev as CustomEvent).detail));
    const header = (el.shadowRoot as ShadowRoot).querySelector(".header") as HTMLElement;
    return { header, fired, icon: header.querySelector("ha-icon") as HTMLElement };
  };
  it("the icon runs the title's action unless it has its own", () => {
    const a = mount({ title_tap_action: NAV });
    a.icon.click();
    expect(a.fired).toHaveLength(1);
    const b = mount({ title_tap_action: NAV, icon_tap_action: "more-info" });
    b.icon.click();
    expect(b.fired).toHaveLength(1);
    expect(b.icon.getAttribute("role")).toBe("button");
    expect(b.icon.getAttribute("aria-label")).toBe("Living room");
  });
  it("icon_tap_action: none keeps the icon still under a tappable title", () => {
    const { icon, fired, header } = mount({ title_tap_action: NAV, icon_tap_action: "none" });
    icon.click();
    expect(fired).toHaveLength(0);
    expect(icon.hasAttribute("role")).toBe(false);
    (header.querySelector(".title") as HTMLElement).click();
    expect(fired).toHaveLength(1);
  });
  it("shows a subtitle, and nothing for an empty one", () => {
    const { header } = mount({ subtitle: "3 lights on" });
    expect(header.querySelector(".subtitle")?.textContent).toBe("3 lights on");
    const empty = mount({});
    expect((empty.header.querySelector(".subtitle") as HTMLElement).hidden).toBe(true);
  });
});
