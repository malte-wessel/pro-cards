// The heading card: its config, its title and icon as buttons, and its visual editor (happy-dom).
// The badges' look is covered by the visual cases (hc-*), their normalisation in
// shared/entity/config.test.ts, their dialog in shared/kinds/editor-form.test.ts.
import { afterEach, describe, expect, it } from "vitest";
import { HeadingCard } from "../../src/heading-card.ts";
import { normalizeHeadingCardConfig } from "../../src/heading/config.ts";
import type { HaFormSchema, HassEntity, HomeAssistant } from "../../src/shared/ha.ts";
import {
  configToForm,
  editorSchema,
  formToConfig,
  HEADING_LABELS,
} from "../../src/heading/editor.ts";
import { hasString } from "../../src/shared/i18n.ts";
import { docExamples, withNested } from "./docs-examples.ts";

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
  it("defaults to a title with outline badges of size m", () => {
    const c = normalizeHeadingCardConfig({ title: "Living room", badges: ["sensor.temp"] });
    expect(c).toMatchObject({
      layout: "heading",
      style: "title",
      align: "start",
      badgesPosition: "end",
      overflow: "wrap",
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
      badge_position: "below",
      overflow: "scroll",
      badge_style: "soft",
      badge_size: "l",
      badges: ["sensor.temp"],
    });
    expect(c).toMatchObject({ style: "hero", align: "center", badgesPosition: "below" });
    expect(c).toMatchObject({ overflow: "scroll" });
    expect(c.entities[0].badge).toEqual({ style: "soft", size: "l" });
    const d = normalizeHeadingCardConfig({ style: "x", badge_position: "x", badge_style: "x" });
    expect(d).toMatchObject({ style: "title", badgesPosition: "end", entities: [] });
  });
  it("fetches the longest window its badges draw, each badge its own", () => {
    const window = (badges: unknown[]) => normalizeHeadingCardConfig({ badges }).hours;
    expect(window(["sensor.temp"])).toBe(1);
    expect(window([{ entity: "sensor.temp", visual: "sparkline" }])).toBe(24);
    expect(window([{ entity: "sensor.temp", visual: { type: "trend", hours: 3 } }])).toBe(3);
    expect(
      window([
        { entity: "sensor.temp", visual: { type: "sparkline", hours: 48 } },
        { entity: "sensor.temp", visual: "trend" },
      ]),
    ).toBe(48);
    // the card's window is gone: a badge says its own
    for (const k of ["hours_to_show", "bucket_minutes", "smoothing_minutes"])
      expect(() => normalizeHeadingCardConfig({ [k]: 6 })).toThrow(
        `heading-card-pro: ${k} is gone: a badge draws its own window (visual: { type: sparkline, hours })`,
      );
  });
  it("keeps the icon's tap_action: none apart from unset", () => {
    expect(normalizeHeadingCardConfig({}).iconTap).toBeNull();
    const icon = (tap_action: unknown) => ({ icon: { name: "mdi:sofa", tap_action } });
    expect(normalizeHeadingCardConfig(icon("none")).iconTap).toEqual({ action: "none" });
    expect(normalizeHeadingCardConfig(icon(NAV)).iconTap).toEqual(NAV);
    expect(normalizeHeadingCardConfig(icon(NAV)).icon).toBe("mdi:sofa");
    expect(normalizeHeadingCardConfig({ icon: "mdi:sofa" }).icon).toBe("mdi:sofa");
  });
  it("names the new spelling of the 3.0 betas' keys", () => {
    expect(() => normalizeHeadingCardConfig({ badges_position: "below" })).toThrow(
      "heading-card-pro: badges_position is badge_position",
    );
    expect(() => normalizeHeadingCardConfig({ icon_tap_action: "none" })).toThrow(
      "heading-card-pro: icon_tap_action is icon: { name, tap_action }",
    );
    expect(() => normalizeHeadingCardConfig({ icon: { name: "mdi:x", ring: true } })).toThrow(
      "heading-card-pro: icon takes name and tap_action, not ring",
    );
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
    const b = mount({ title_tap_action: NAV, icon: { name: "mdi:sofa", tap_action: "more-info" } });
    b.icon.click();
    expect(b.fired).toHaveLength(1);
    expect(b.icon.getAttribute("role")).toBe("button");
    expect(b.icon.getAttribute("aria-label")).toBe("Living room");
  });
  it("an icon tap_action: none keeps the icon still under a tappable title", () => {
    const { icon, fired, header } = mount({
      title_tap_action: NAV,
      icon: { name: "mdi:sofa", tap_action: "none" },
    });
    icon.click();
    expect(fired).toHaveLength(0);
    expect(icon.hasAttribute("role")).toBe(false);
    (header.querySelector(".title") as HTMLElement).click();
    expect(fired).toHaveLength(1);
  });
  it("keeps no room for the title when there is neither a title nor a subtitle", () => {
    const htx = (cfg: Record<string, unknown>) =>
      mount(cfg).header.querySelector(".htx") as HTMLElement;
    expect(htx({ title: "", badges: ["sensor.temp"] }).hidden).toBe(true);
    expect(htx({ title: "Living room" }).hidden).toBe(false);
    expect(htx({ title: "", subtitle: "3 lights on" }).hidden).toBe(false);
  });
  it("shows a subtitle, and nothing for an empty one", () => {
    const { header } = mount({ subtitle: "3 lights on" });
    expect(header.querySelector(".subtitle")?.textContent).toBe("3 lights on");
    const empty = mount({});
    expect((empty.header.querySelector(".subtitle") as HTMLElement).hidden).toBe(true);
  });
});

describe("heading-card-pro editor", () => {
  const T = "custom:heading-card-pro";

  it("is the card's config element", () => {
    expect(HeadingCard.getConfigElement().tagName).toBe("HEADING-CARD-PRO-EDITOR");
  });

  it("writes every docs example back as it was", () => {
    let n = 0;
    for (const { file, cfg } of docExamples())
      for (const c of withNested(cfg)) {
        const card = c as Record<string, unknown>;
        if (card?.type !== T) continue;
        expect(formToConfig(configToForm(card), card), file).toEqual(card);
        n++;
      }
    expect(n).toBeGreaterThan(3);
  });

  it("writes nothing for a select left at its default, and the choice otherwise", () => {
    const card = { type: T, title: "Office" };
    const form = configToForm(card);
    expect(form).toMatchObject({ style: "title", align: "start", badge_size: "m", hover: true });
    expect(formToConfig({ ...form, style: "big", badge_position: "below" }, card)).toEqual({
      ...card,
      style: "big",
      badge_position: "below",
    });
    // back to the defaults: the keys go; a turned-off hover is the only boolean written
    const big = { ...card, style: "big", overflow: "scroll" };
    expect(formToConfig({ ...configToForm(big), style: "title", overflow: "wrap" }, big)).toEqual(
      card,
    );
    expect(formToConfig({ ...form, hover: false }, card)).toEqual({ ...card, hover: false });
  });

  it("writes the icon's own tap into the icon, a name alone where it has none", () => {
    const card = { type: T, title: "Office", icon: "mdi:desk" };
    const form = configToForm(card);
    expect(form).toMatchObject({ icon: "mdi:desk" });
    const tapped = formToConfig({ ...form, icon_tap_action: { action: "none" } }, card);
    expect(tapped).toEqual({ ...card, icon: { name: "mdi:desk", tap_action: { action: "none" } } });
    expect(configToForm(tapped)).toMatchObject({
      icon: "mdi:desk",
      icon_tap_action: { action: "none" },
    });
    // the tap cleared: the name alone again
    expect(formToConfig({ ...configToForm(tapped), icon_tap_action: undefined }, tapped)).toEqual(
      card,
    );
  });

  it("keeps what it does not show and what it was not asked to change", () => {
    const card = {
      type: T,
      title: "Office",
      align: "start",
      badges: [{ entity: "sensor.office_co2", visual: { type: "sparkline", hours: 6 } }],
      grid_options: { columns: 6 },
      visibility: [{ condition: "screen", media_query: "(min-width: 0px)" }],
    };
    // the subtitle typed: the written default and the badge's own spelling stay
    expect(formToConfig({ ...configToForm(card), subtitle: "Upstairs" }, card)).toEqual({
      ...card,
      subtitle: "Upstairs",
    });
    // cleared texts and actions go
    const full = { ...card, icon: "mdi:desk", title_tap_action: { action: "none" } };
    const cleared = { ...configToForm(full), icon: "", title_tap_action: undefined };
    expect(formToConfig(cleared, full)).toEqual(card);
  });

  it("edits the badges in the badge list, a badge left alone as written", () => {
    const card = {
      type: T,
      title: "Office",
      badges: ["sensor.office_temperature", { entity: "sensor.office_co2", visual: "sparkline" }],
    };
    const form = configToForm(card);
    const badges = form.badges as Record<string, unknown>[];
    expect(
      formToConfig({ ...form, badges: [badges[1], { entity: "sensor.battery_soc" }] }, card),
    ).toEqual({
      ...card,
      badges: [{ entity: "sensor.office_co2", visual: "sparkline" }, "sensor.battery_soc"],
    });
    expect(formToConfig({ ...form, badges: [] }, card)).toEqual({ type: T, title: "Office" });
  });

  it("labels every field it draws, in its own words", () => {
    const names = (s: HaFormSchema[]): string[] =>
      s.flatMap((x) => (x.schema ? names(x.schema as HaFormSchema[]) : [x.name]));
    for (const name of names(editorSchema())) {
      expect(HEADING_LABELS[name], name).toBeDefined();
      expect(hasString(HEADING_LABELS[name]), name).toBe(true);
    }
  });
});
