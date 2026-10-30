import { afterEach, describe, it, expect, vi } from "vitest";
import { PosterCard } from "../../src/poster-card.ts";
import {
  IMAGE_BLUR,
  normalizePosterConfig,
  parseImage,
  parseImageBlur,
  ruleLookOf,
} from "../../src/poster/config.ts";
import { imageUrl, statusText } from "../../src/poster/render.ts";
import { cssColor } from "../../src/shared/color.ts";
import { placementsOf } from "../../src/shared/entity/control.ts";
import { modelOf } from "../../src/shared/entity/model.ts";
import { BATTERY_RULES, toRule, WIND_RULES } from "../../src/shared/kinds/rules.ts";
import { snapshot, world } from "../../docs/.vitepress/theme/ha-shim/hass.ts";
import type { HassEntity, HomeAssistant } from "../../src/shared/ha.ts";

const T = "poster-card-pro";
const norm = (cfg: Record<string, unknown>, hass?: HomeAssistant) =>
  normalizePosterConfig(cfg, hass);
const kinds = (list: { kind: string; position: string }[]) =>
  list.map((p) => `${p.kind}@${p.position}`);
const st = (id: string, state: string, attributes: Record<string, unknown> = {}) =>
  ({ entity_id: id, state, attributes }) as unknown as HassEntity;
const withStates = (states: Record<string, HassEntity>) =>
  ({ states, locale: { language: "en" } }) as unknown as HomeAssistant;

afterEach(() => vi.restoreAllMocks());

describe("poster-card config", () => {
  it("is registered and checks its config", () => {
    expect(customElements.get(T)).toBe(PosterCard);
    expect(window.customCards?.some((c) => c.type === T)).toBe(true);
    expect(() => norm(null as never)).toThrow(`${T}: invalid config`);
    expect(() => norm({ entity: "light.kitchen", poster: "room" })).toThrow(
      /poster must be one of entity \| battery/,
    );
    expect(() => norm({ entity: "light.kitchen", poster: "wind" })).toThrow(
      `${T}: the wind poster reads a wind_speed sensor or a weather entity`,
    );
  });

  it("is one poster: its item, then the status badge first in the corner", () => {
    const c = norm({ entity: "sensor.living_room_temperature", name: "Living room" });
    expect(c.kind.name).toBe("entity");
    expect(c.entities.map((e) => e.entity)).toEqual([
      "sensor.living_room_temperature",
      "sensor.living_room_temperature",
    ]);
    expect(c.statusIdx).toBe(1);
    expect(c.groups).toEqual([expect.objectContaining({ layout: "poster", idxs: [0] })]);
    expect(c.groups[0].badgeIdxs).toEqual([1]);
    expect(c.entities[1].badge).toEqual({ style: "tag", size: "s" });
  });

  it("takes the kind's item defaults unless the card sets the value", () => {
    const w = norm({ entity: "weather.home" });
    expect(w.kind.name).toBe("weather");
    expect(w.entities[0].valueSrc).toEqual({ kind: "attribute", key: "temperature" });
    expect(w.entities[0].picture).toBe(true);
    expect(
      norm({ entity: "weather.home", attribute: "humidity" }).entities[0].valueSrc,
    ).toMatchObject({ key: "humidity" });
    expect(norm({ entity: "weather.home", value: "{{ 1 }}" }).entities[0].valueSrc.kind).toBe(
      "template",
    );
    expect(norm({ entity: "weather.home", show_entity_picture: false }).entities[0].picture).toBe(
      false,
    );
    expect(norm({ entity: "climate.living_room" }).entities[0].valueSrc).toMatchObject({
      key: "current_temperature",
    });
  });

  it("brings the kind's rules unless the card has its own; the status reads the same", () => {
    const battery = withStates({
      "sensor.phone_battery": st("sensor.phone_battery", "50", { device_class: "battery" }),
    });
    const own = norm({ entity: "sensor.phone_battery" }, battery);
    expect(own.kind.name).toBe("battery");
    expect(own.entities[0].rules).toEqual(BATTERY_RULES.map(toRule));
    expect(own.entities[own.statusIdx!].rules).toBe(own.entities[0].rules);
    const mine = norm(
      { entity: "sensor.phone_battery", rules: [{ below: 50, label: "Charge" }] },
      battery,
    );
    expect(mine.entities[0].rules.map((r) => r.label)).toEqual(["Charge"]);
    expect(norm({ entity: "sensor.phone_battery", rules: [] }, battery).entities[0].rules).toEqual(
      [],
    );
    // the wind rules are written in km/h: the value is converted before they match
    const wind = norm({ entity: "sensor.wind_speed", poster: "wind" });
    expect(wind.entities[0].rules).toEqual(WIND_RULES.map(toRule));
    expect(wind.entities[0].ruleUnit).toBe("km/h");
    expect(wind.entities[wind.statusIdx!].ruleUnit).toBe("km/h");
    expect(
      norm({ entity: "sensor.wind_speed", poster: "wind", rules: [] }).entities[0].ruleUnit,
    ).toBeUndefined();
  });

  it("draws the kind's controls by default; control: false drops them, a name picks another", () => {
    const light = norm({ entity: "light.living_room" });
    expect(kinds(placementsOf(light.entities[0], "poster"))).toEqual([
      "toggle@end",
      "slider@block",
    ]);
    expect(norm({ entity: "light.living_room", control: false }).entities[0].control).toBeNull();
    const named = norm({ entity: "light.living_room", control: "slider" }).entities[0];
    expect(kinds(placementsOf(named, "poster"))).toEqual(["slider@block"]);
  });

  it("holds a lock and an alarm panel on its icon, an alarm panel that wants a code not", () => {
    const toggle = { action: "toggle" };
    const lock = norm({ entity: "lock.front_door" });
    expect(lock.iconActions).toEqual({ tap: null, hold: toggle, dbl: null });
    // the hold is the icon's, not a control
    expect(placementsOf(lock.entities[0], "poster")).toEqual([]);
    const A = "alarm_control_panel.home";
    const free = norm({ entity: A }, withStates({ [A]: st(A, "disarmed") }));
    expect(free.iconActions.hold).toEqual(toggle);
    for (const attrs of [{ code_format: "number" }, { code_arm_required: true }]) {
      const coded = norm({ entity: A }, withStates({ [A]: st(A, "disarmed", attrs) }));
      expect(coded.iconActions).toEqual({ tap: null, hold: null, dbl: null });
      expect(coded.entities[0].control).toBeNull();
    }
    // other posters' icons have no action of their own
    expect(norm({ entity: "switch.coffee_machine" }).iconActions).toEqual({
      tap: null,
      hold: null,
      dbl: null,
    });
  });

  it("takes the icon's actions as written over the type's, none dropping one", () => {
    const c = norm({
      entity: "lock.front_door",
      icon_tap_action: "more-info",
      icon_hold_action: { action: "navigate", navigation_path: "/doors" },
      icon_double_tap_action: { action: "toggle" },
    });
    expect(c.iconActions).toEqual({
      tap: { action: "more-info" },
      hold: { action: "navigate", navigation_path: "/doors" },
      dbl: { action: "toggle" },
    });
    // a written one replaces only its own gesture: the lock keeps its hold beside a tap
    const tap = norm({ entity: "lock.front_door", icon_tap_action: "toggle" });
    expect(tap.iconActions).toEqual({
      tap: { action: "toggle" },
      hold: { action: "toggle" },
      dbl: null,
    });
    expect(
      norm({ entity: "lock.front_door", icon_hold_action: "none" }).iconActions.hold,
    ).toBeNull();
    // an object without an action is more-info, as tap_action
    expect(
      norm({ entity: "switch.coffee_machine", icon_tap_action: { entity: "light.kitchen" } })
        .iconActions.tap,
    ).toEqual({ action: "more-info", entity: "light.kitchen" });
  });

  it("draws visual: glow and none as no picture of the item's own; a light glows by default", () => {
    const H = "sensor.living_room_humidity";
    const glow = norm({ entity: H, visual: "glow" });
    expect(glow.glow).toBe(true);
    expect(glow.entities[0].visual).toBe("icon");
    const none = norm({ entity: H, visual: "none" });
    expect(none.glow).toBe(false);
    expect(none.entities[0].visual).toBe("icon");
    expect(norm({ entity: H, visual: "bar" }).entities[0].visual).toBe("bar");
    expect(norm({ entity: H }).glow).toBe(false);
    // the light's own picture is its glow; another visual replaces it
    expect(norm({ entity: "light.living_room" }).glow).toBe(true);
    for (const visual of ["none", "bar"])
      expect(norm({ entity: "light.living_room", visual }).glow).toBe(false);
  });

  it("draws a ring around the icon with icon_ring", () => {
    const H = "sensor.living_room_humidity";
    expect(norm({ entity: H, icon_ring: true }).entities[0].iconRing).toBe(true);
    expect(norm({ entity: H }).entities[0].iconRing).toBeUndefined();
    // the badges keep their own visual
    const c = norm({ entity: H, icon_ring: true, badges: [{ entity: H, visual: "ring" }] });
    expect(c.entities.at(-1)?.visual).toBe("ring");
    expect(c.entities.at(-1)?.iconRing).toBeUndefined();
  });

  it("names the poster's own keys in place of visual: ring and control_position: lead", () => {
    expect(() => norm({ entity: "sensor.living_room_humidity", visual: "ring" })).toThrow(
      `${T}: visual: ring is icon_ring: true on the poster card`,
    );
    expect(() =>
      norm({ entity: "switch.coffee_machine", control: "toggle", control_position: "lead" }),
    ).toThrow(
      `${T}: the icon's own actions are icon_tap_action / icon_hold_action, not control_position: lead`,
    );
  });

  it("reads inputs set on the card, a weather entity's attributes or found on the device", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const set = norm({
      entity: "sensor.wind_speed",
      poster: "wind",
      direction: "sensor.wind_direction",
      gust: false,
    });
    expect(Object.keys(set.inputs)).toEqual(["direction"]);
    expect(set.entities[set.inputs.direction].entity).toBe("sensor.wind_direction");
    expect(set.kindOpts).toEqual({ direction: "sensor.wind_direction", gust: false });
    // without hass nothing is found yet
    expect(norm({ entity: "sensor.wind_speed", poster: "wind" }).inputs).toEqual({});

    const weather = norm({ entity: "weather.home", poster: "wind" });
    expect(weather.entities[0].valueSrc).toMatchObject({ key: "wind_speed" });
    const gust = weather.entities[weather.inputs.gust];
    expect(gust.valueSrc).toMatchObject({ kind: "attribute", key: "wind_gust_speed" });
    expect(gust.unitAttr).toBe("wind_speed_unit");

    const found = norm({ entity: "sensor.wind_speed" }, snapshot());
    expect(found.kind.name).toBe("wind");
    const ids = Object.fromEntries(
      Object.entries(found.inputs).map(([k, i]) => [k, found.entities[i].entity]),
    );
    expect(ids).toEqual({ direction: "sensor.wind_direction", gust: "sensor.wind_gust" });
    expect(info).toHaveBeenCalledWith(
      `${T}: wind: gust from sensor.wind_gust (same device as sensor.wind_speed); set gust to choose another`,
    );
    // the inputs are read, never drawn
    expect(found.groups[0].idxs).toEqual([0]);
    expect(found.groups[0].badgeIdxs).toEqual([found.statusIdx]);
    // false drops a found one, an id replaces it
    const own = norm(
      { entity: "sensor.wind_speed", gust: false, direction: "sensor.x" },
      snapshot(),
    );
    expect(Object.keys(own.inputs)).toEqual(["direction"]);
    expect(own.entities[own.inputs.direction].entity).toBe("sensor.x");
  });

  it("takes the type's own keys flat on the card, and only the type's", () => {
    const speed = withStates({
      "sensor.wind_speed": st("sensor.wind_speed", "12", { device_class: "wind_speed" }),
    });
    const wind = norm({ entity: "sensor.wind_speed", variant: "lines", today: "sensor.t" }, speed);
    expect(wind.kind.name).toBe("wind");
    expect(wind.kindOpts).toEqual({ variant: "lines" });
    const cover = norm({ entity: "cover.garage_door", variant: "garage" });
    expect(cover.kindOpts).toEqual({ variant: "garage" });
    const pump = norm({
      entity: "sensor.washer_power",
      poster: "appliance",
      variant: "washer",
      running_above: 10,
    });
    expect(pump.kindOpts).toEqual({ variant: "washer", running_above: 10 });
    // the keys never decide the type: a grid's meters on a sensor of no class draw an entity
    const plain = norm({ entity: "sensor.grid_power", import: "sensor.a", export: "sensor.b" });
    expect(plain.kind.name).toBe("entity");
    expect(plain.kindOpts).toEqual({});
    expect(plain.inputs).toEqual({});
  });

  it("turns every default off with poster: entity", () => {
    const own = norm({ entity: "weather.home", poster: "entity" });
    expect(own.kind.name).toBe("entity");
    expect(own.entities[0].valueSrc).toEqual({ kind: "state" });
    expect(own.inputs).toEqual({});
    const light = norm({ entity: "light.kitchen", poster: "entity" });
    expect(light.entities[0].control).toBeFalsy();
  });

  it("takes the status as text, a template, an object or false", () => {
    const E = "sensor.living_room_temperature";
    expect(norm({ entity: E, status: "Cosy" }).statusText).toEqual({ kind: "text", text: "Cosy" });
    expect(norm({ entity: E, status: "{{ 'x' }}" }).statusText).toMatchObject({
      kind: "template",
    });
    const o = norm({ entity: E, status: { value: "Cosy", icon: "mdi:sofa", style: "filled" } });
    expect(o.statusText).toEqual({ kind: "text", text: "Cosy" });
    const badge = o.entities[o.statusIdx!];
    expect(badge.badge?.style).toBe("filled");
    expect(badge.item).toMatchObject({ showIcon: true, showName: false });
    expect(norm({ entity: E }).entities[1].item.showIcon).toBe(false);
    // its own rules, name and icon as written
    const own = norm({
      entity: E,
      rules: [{ below: 30, label: "Poster" }],
      status: { rules: [{ below: 20, label: "Cool" }], show_name: true, show_icon: true },
    });
    const ownBadge = own.entities[own.statusIdx!];
    expect(ownBadge.rules.map((r) => r.label)).toEqual(["Cool"]);
    expect(ownBadge.item).toMatchObject({ showIcon: true, showName: true });
    expect(
      norm({ entity: E, status: { icon: "mdi:sofa", show_icon: false } }).entities[1].item.showIcon,
    ).toBe(false);
    const none = norm({ entity: E, status: false });
    expect(none.statusIdx).toBeNull();
    expect(none.groups[0].badgeIdxs).toEqual([]);
  });

  it("puts the badges in the written order, the status where `status` says", () => {
    const E = "weather.home";
    const first = norm({ entity: E, badges: ["sensor.outdoor_humidity"] });
    expect(first.groups[0].badgeIdxs).toEqual([1, 2]);
    expect(first.entities[2].entity).toBe("sensor.outdoor_humidity");
    expect(first.entities[2].badge).toEqual({ style: "outline", size: "s" });
    const placed = norm({ entity: E, badges: ["sensor.outdoor_humidity", "status"] });
    expect(placed.groups[0].badgeIdxs).toEqual([2, 1]);
    // `status` with the status off places nothing
    expect(
      norm({ entity: E, status: false, badges: ["status", "sensor.outdoor_humidity"] }).groups[0]
        .badgeIdxs,
    ).toEqual([1]);
  });

  it("lets a badge without an entity read the poster's", () => {
    const c = norm({ entity: "weather.home", badges: [{ attribute: "humidity" }, {}] });
    const [humidity, again] = c.groups[0].badgeIdxs!.slice(1).map((i) => c.entities[i]);
    expect(humidity.entity).toBe("weather.home");
    expect(humidity.valueSrc).toMatchObject({ kind: "attribute", key: "humidity" });
    // the weather attribute's own unit
    expect(humidity.unit).toBe("%");
    // nothing named: the poster's value again
    expect(again.entity).toBe("weather.home");
    expect(again.valueSrc).toMatchObject({ kind: "attribute", key: "temperature" });
  });

  it("draws without an entity: its name, no tap, the kinds that read none", () => {
    const c = norm({ name: "Hello", value: "World" });
    expect(c.kind.name).toBe("entity");
    expect(c.tap).toEqual({ action: "none" });
    expect(c.hold).toEqual({ action: "none" });
    expect(norm({ name: "Hello", tap_action: { action: "navigate" } }).tap.action).toBe("navigate");
    expect(norm({ name: "Hello" }).entities[0].valueSrc).toEqual({ kind: "text", text: "" });
    expect(norm({ poster: "sun" }).kind.name).toBe("sun");
    // a grid without an entity opens its import meter; a trend's first series is its entity
    const grid = norm({
      poster: "grid",
      import: "sensor.grid_import",
      export: "sensor.grid_export",
    });
    expect(grid.kind.name).toBe("grid");
    expect(grid.entities[0].entity).toBe("sensor.grid_import");
    const trend = norm({
      poster: "trend",
      series: [{ entity: "sensor.outdoor_temperature", name: "Out" }, "sensor.x"],
    });
    expect(trend.entities[0]).toMatchObject({ entity: "sensor.outdoor_temperature", name: "Out" });
    expect(trend.kind.history?.(trend.kindOpts, trend.entities[0].entity)).toEqual([
      "sensor.outdoor_temperature",
      "sensor.x",
    ]);
    // a series is named by its place in errors
    expect(() =>
      norm({ poster: "trend", series: [{ entity: "sensor.x", visibility: 3 }] }),
    ).toThrow(`${T}: 'series[0].visibility'`);
  });

  it("keeps hours_to_show as written", () => {
    expect(norm({ entity: "weather.home" }).hoursSet).toBeNull();
    expect(norm({ entity: "weather.home", hours_to_show: 24 }).hoursSet).toBe(24);
  });
});

describe("poster-card image and status", () => {
  it("parses the image as a URL, a template or an entity's picture", () => {
    expect(parseImage(false)).toBe(false);
    expect(parseImage(undefined)).toBeNull();
    expect(parseImage("")).toBeNull();
    expect(parseImage(3)).toBeNull();
    expect(parseImage("/local/garden.jpg")).toEqual({ kind: "url", url: "/local/garden.jpg" });
    expect(parseImage("https://x.org/a.png")).toEqual({ kind: "url", url: "https://x.org/a.png" });
    expect(parseImage("camera.garden")).toEqual({
      kind: "entity",
      entity: "camera.garden",
    });
    expect(parseImage("{{ 'a' }}")).toEqual({ kind: "template", template: "{{ 'a' }}" });
    // a file name is a picture, not an entity
    expect(parseImage("garden.jpg")).toEqual({ kind: "url", url: "garden.jpg" });
    expect(parseImage("plan.svg")).toEqual({ kind: "url", url: "plan.svg" });
  });

  it("blurs the image by true, a number of px, or not by false; unset is the type's", () => {
    expect(parseImageBlur(undefined)).toBeNull();
    expect(parseImageBlur(true)).toBe(IMAGE_BLUR);
    expect(parseImageBlur(8)).toBe(8);
    expect(parseImageBlur(0)).toBe(0);
    expect(parseImageBlur(false)).toBe(0);
    expect(() => norm({ entity: "sensor.x", image_blur: "soft" })).toThrow(
      `${T}: image_blur must be true, false or a number of px`,
    );
    expect(() => norm({ entity: "sensor.x", image_blur: -2 })).toThrow(/image_blur/);
    expect(norm({ entity: "sensor.x", image_blur: 6 }).imageBlur).toBe(6);
  });

  it("takes the shade's opacity and tint; a bad opacity names the key", () => {
    const cfg = norm({ entity: "sensor.x", image_opacity: 0.6, image_tint: "blue" });
    expect([cfg.imageOpacity, cfg.imageTint]).toEqual([0.6, "blue"]);
    expect([
      norm({ entity: "sensor.x" }).imageOpacity,
      norm({ entity: "sensor.x" }).imageTint,
    ]).toEqual([null, null]);
    expect(() => norm({ entity: "sensor.x", image_opacity: 2 })).toThrow(
      `${T}: image_opacity must be a number from 0 to 1`,
    );
  });

  it("reads what a rule changes of the icon and the backdrop, only the keys it writes", () => {
    expect(
      ruleLookOf({
        state: "on",
        icon_style: "plain",
        icon_image: "person.malte",
        icon_ring: true,
        image: "camera.garden",
        image_blur: true,
        image_opacity: 0.5,
        image_tint: "amber",
      }),
    ).toEqual({
      iconStyle: "plain",
      iconImage: { kind: "entity", entity: "person.malte" },
      iconRing: true,
      image: { kind: "entity", entity: "camera.garden" },
      imageBlur: IMAGE_BLUR,
      imageOpacity: 0.5,
      imageTint: "amber",
    });
    // false: no picture while it matches
    expect(ruleLookOf({ state: "off", image: false, icon_image: false })).toEqual({
      image: false,
      iconImage: null,
    });
    expect(ruleLookOf({ state: "on", color: "red" })).toEqual({});
    // every rule of the card, by rule
    const cfg = norm({ entity: "sensor.x", rules: [{ above: 5, image: "/local/a.jpg" }] });
    expect(cfg.ruleLooks.get(cfg.entities[0].rules[0])).toEqual({
      image: { kind: "url", url: "/local/a.jpg" },
    });
  });

  it("takes a picture for the icon as a URL, a template or an entity's", () => {
    expect(norm({ icon_image: "/local/a.png" }).iconImage).toEqual({
      kind: "url",
      url: "/local/a.png",
    });
    expect(norm({ icon_image: "person.malte" }).iconImage).toEqual({
      kind: "entity",
      entity: "person.malte",
    });
    expect(norm({ icon_image: "{{ x }}" }).iconImage).toEqual({
      kind: "template",
      template: "{{ x }}",
    });
    expect(norm({ icon_image: false }).iconImage).toBeNull();
    expect(norm({ name: "x" }).iconImage).toBeNull();
  });

  it("shows a person's and a player's picture in the icon unless the card says not", () => {
    for (const entity of ["person.malte", "media_player.tv"]) {
      expect(norm({ entity }).entities[0].picture).toBe(true);
      expect(norm({ entity, show_entity_picture: false }).entities[0].picture).toBe(false);
      expect(norm({ entity }).kind.imageBlur).toBe(true);
    }
    expect(norm({ entity: "sensor.x" }).entities[0].picture).toBe(false);
  });

  it("reads the image now", () => {
    const hass = withStates({
      "camera.garden": st("camera.garden", "idle", { entity_picture: "/api/cam?t=1" }),
    });
    const ctx = { hass, tplResult: new Map<string, unknown>([["{{ 'a' }}", "/local/a.jpg"]]) };
    expect(imageUrl(ctx as never, null)).toBeNull();
    expect(imageUrl(ctx as never, false)).toBeNull();
    expect(imageUrl(ctx as never, { kind: "url", url: "/x.jpg" })).toBe("/x.jpg");
    expect(imageUrl(ctx as never, { kind: "template", template: "{{ 'a' }}" })).toBe(
      "/local/a.jpg",
    );
    expect(imageUrl(ctx as never, { kind: "entity", entity: "camera.garden" })).toBe(
      "/api/cam?t=1",
    );
  });

  it("says the card's status, else the kind's, else the matching rule's label", () => {
    const E = "sensor.x";
    const hass = withStates({ [E]: st(E, "5") });
    const ctx = { hass, tplResult: new Map<string, unknown>([["{{ s }}", "Rendered"]]) };
    const cfg = norm({ entity: E, rules: [{ below: 10, label: "Low" }] });
    const m = modelOf(ctx, cfg.entities[0]);
    expect(statusText(ctx as never, cfg, m, null)).toBe("Low");
    expect(statusText(ctx as never, cfg, m, "Kind's")).toBe("Kind's");
    expect(
      statusText(ctx as never, { ...cfg, statusText: { kind: "text", text: "Own" } }, m, "K"),
    ).toBe("Own");
    expect(
      statusText(
        ctx as never,
        { ...cfg, statusText: { kind: "template", template: "{{ s }}" } },
        m,
        null,
      ),
    ).toBe("Rendered");
  });
});

describe("poster-card element", () => {
  const cards: PosterCard[] = [];
  afterEach(() => {
    for (const c of cards.splice(0)) c.remove();
  });
  const mount = (cfg: Record<string, unknown>) => {
    const el = new PosterCard();
    el.setConfig(cfg);
    document.body.appendChild(el);
    cards.push(el);
    return el;
  };

  it("is half a section wide and three rows high, and that at least", () => {
    const el = mount({ entity: "sensor.living_room_temperature" });
    expect(el.getGridOptions()).toEqual({ columns: 6, rows: 3, min_columns: 6, min_rows: 3 });
    expect(el.getCardSize()).toBe(3);
    el.setConfig({ entity: "climate.living_room" });
    expect(el.getGridOptions().min_columns).toBe(6);
  });

  it("resolves its kind again once hass tells the device class and the registry", () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const el = mount({ entity: "sensor.wind_speed" });
    // no hass yet: a sensor of no known class
    expect(el._config?.kind.name).toBe("entity");
    expect(el._config?.inputs).toEqual({});
    const hass = snapshot();
    el.hass = hass;
    expect(el._config?.kind.name).toBe("wind");
    expect(Object.keys(el._config!.inputs).sort()).toEqual(["direction", "gust"]);
    // a new hass with the same registry normalises nothing again
    const before = el._config;
    el.hass = { ...hass };
    expect(el._config).toBe(before);
    const row = el.shadowRoot!.querySelector(".row.poster");
    expect(row).not.toBeNull();
    // a new registry that finds the same inputs normalises nothing again either
    el.hass = { ...hass, entities: { ...hass.entities } };
    expect(el._config).toBe(before);
    // one that finds other inputs does
    const entities = { ...hass.entities };
    delete entities["sensor.wind_gust"];
    el.hass = { ...hass, entities };
    expect(el._config).not.toBe(before);
    expect(Object.keys(el._config!.inputs)).toEqual(["direction"]);
  });

  it("takes hass before its config", () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const el = new PosterCard();
    el.hass = snapshot();
    el.setConfig({ entity: "sensor.wind_speed" });
    document.body.appendChild(el);
    cards.push(el);
    expect(el._config?.kind.name).toBe("wind");
    el.hass = snapshot();
    expect(el.shadowRoot!.querySelector(".row.poster")).not.toBeNull();
  });

  it("warns once about another type's keys, once the type is known", () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = mount({ entity: "sensor.rain_rate", gust: "sensor.wind_gust", variant: "lines" });
    // no state yet: the device class may still make it a wind poster
    expect(warn).not.toHaveBeenCalled();
    const hass = snapshot();
    el.hass = hass;
    expect(el._config?.kind.name).toBe("rain");
    expect(warn).toHaveBeenCalledWith(`${T}: the rain poster reads no gust; left out`);
    el.hass = { ...hass };
    expect(warn).toHaveBeenCalledTimes(1);
    // a written type is known at once; a config with nothing stray says nothing
    el.setConfig({ poster: "sun", today: "sensor.x" });
    expect(warn).toHaveBeenLastCalledWith(`${T}: the sun poster reads no today; left out`);
    el.setConfig({ poster: "sun" });
    expect(warn).toHaveBeenCalledTimes(2);
  });
});

// the poster as the card draws it (happy-dom, the demo home): its skeleton, the badges in its
// corner, the name and the big value, the controls beside the value and its visuals. Fitting the
// value to the card needs a real layout and lives in the integration and visual tests.
describe("poster-card drawing", () => {
  const cards: PosterCard[] = [];
  const saved = new Map<string, HassEntity>();
  afterEach(() => {
    for (const c of cards.splice(0)) c.remove();
    for (const [id, s] of saved) world.states[id] = s;
    saved.clear();
  });
  // a state for this test (put back afterwards); every card gets a fresh hass
  const set = (id: string, state: string | number, attributes: Record<string, unknown> = {}) => {
    if (!saved.has(id)) saved.set(id, world.get(id)!);
    world.set(id, state, attributes);
    for (const c of cards) c.hass = snapshot();
  };
  const draw = (cfg: Record<string, unknown>) => {
    const el = new PosterCard();
    el.setConfig(cfg);
    document.body.appendChild(el);
    el.hass = snapshot();
    cards.push(el);
    return el.shadowRoot as ShadowRoot;
  };
  const q = (r: ParentNode, sel: string) => {
    const el = r.querySelector<HTMLElement>(sel);
    if (!el) throw new Error(`no element for ${sel}`);
    return el;
  };
  // the classes of the poster body's children, in order
  // the body's parts in order, the text block's own spelled out
  const bodyParts = (r: ParentNode) =>
    [...q(r, ".pbody").children].flatMap((c) =>
      c.classList.contains("pmain")
        ? [...q(c, ".ptext").children].map((t) => t.className)
        : [c.className],
    );
  const TEMP = "sensor.living_room_temperature";

  it("has the lead and the corner on top and the body below, no label pill", () => {
    const r = draw({ entity: TEMP });
    const row = q(r, ".body > .row.poster");
    expect(row.querySelector(":scope > .ptop > .plead > .lead")).not.toBeNull();
    expect(row.querySelector(":scope > .ptop > .corner")).not.toBeNull();
    expect(row.querySelector(":scope > .pbody")).not.toBeNull();
    // the status is a badge like the others: no pill of the v2 poster's
    expect(row.querySelector(".plabel")).toBeNull();
    // the action layer stays first
    expect(row.firstElementChild?.classList.contains("hit")).toBe(true);
  });

  it("draws the status and the badges as rows of their own in the corner", () => {
    set("sensor.living_room_humidity", 55);
    set("sensor.living_room_co2", 640);
    const r = draw({
      entity: TEMP,
      badges: [
        "sensor.living_room_humidity",
        { entity: "sensor.living_room_co2", style: "filled" },
      ],
    });
    const kids = [...q(r, ".row.poster .corner").children] as HTMLElement[];
    expect(kids.every((b) => b.classList.contains("row") && b.classList.contains("hval"))).toBe(
      true,
    );
    // the status first, then the badges as written
    expect(kids[0].classList.contains("pstatus")).toBe(true);
    const badges = kids.slice(1);
    expect(badges.map((b) => b.dataset.idx)).toEqual(["2", "3"]);
    expect(badges[0].classList.contains("b-outline")).toBe(true);
    expect(badges[1].classList.contains("b-filled")).toBe(true);
    expect(badges[0].textContent).toContain("55");
    expect(badges[1].textContent).toContain("640");
  });

  it("keeps its badges when the poster is filled again, and fills a badge in place", () => {
    set(TEMP, 21.4);
    set("sensor.living_room_humidity", 55);
    const r = draw({ entity: TEMP, badges: ["sensor.living_room_humidity"] });
    const badge = q(r, ".corner > .row.hval:not(.pstatus)");
    set(TEMP, 23.5);
    expect(q(r, ".pvalue .big b").textContent).toBe("23.5");
    expect(q(r, ".corner > .row.hval:not(.pstatus)")).toBe(badge);
    expect(r.querySelectorAll(".corner > .row.hval:not(.pstatus)")).toHaveLength(1);
    set("sensor.living_room_humidity", 61);
    expect(q(r, ".corner > .row.hval:not(.pstatus)")).toBe(badge);
    expect(badge.textContent).toContain("61");
    expect(q(r, ".pvalue .big b").textContent).toBe("23.5");
  });

  it("shows the name and the big value with its unit", () => {
    set(TEMP, 21.4);
    const r = draw({ entity: TEMP });
    expect(q(r, ".pbody > .pname").textContent).toBe("Living room temperature");
    expect(q(r, ".pvalue > .big > b").textContent).toBe("21.4");
    expect(q(r, ".pvalue > .big > span").textContent).toBe("°C");
    expect(q(r, ".pvalue > .big").classList.contains("word")).toBe(false);
    expect(bodyParts(r)).toEqual(["pname", "pvalue"]);
  });

  it("draws a word smaller than a number", () => {
    const r = draw({ entity: "input_select.house_mode", control: false });
    expect(q(r, ".pvalue > .big").classList.contains("word")).toBe(true);
    expect(q(r, ".pvalue > .big > b").textContent).toBe("Home");
  });

  it("adds the secondary line under the value, the name under it with name_position: below", () => {
    const r = draw({ entity: TEMP, name: "Living room", secondary: "Feels like 20" });
    expect(bodyParts(r)).toEqual(["pname", "pvalue", "secondary"]);
    expect(q(r, ".pname").textContent).toBe("Living room");
    expect(q(r, ".ptext > .secondary").textContent).toBe("Feels like 20");
    expect(bodyParts(draw({ entity: TEMP, name_position: "below" }))).toEqual(["pvalue", "pname"]);
  });

  it("lets a stepper that shows the very same number take the value's place", () => {
    const same = draw({
      entity: "climate.living_room",
      poster: "entity",
      attribute: "temperature",
      control: "stepper",
    });
    expect(same.querySelector(".pvalue .big")).toBeNull();
    expect(same.querySelector(".pmain > .end > .ctl-stepper")).not.toBeNull();
    // the climate kind's own: the current temperature beside the target's stepper
    const own = draw({ entity: "climate.living_room" });
    expect(q(own, ".pvalue > .big > b").textContent).toBe("21.6");
    expect(own.querySelector(".pmain > .end > .ctl-stepper")).not.toBeNull();
  });

  it("keeps the value beside segments, a select and a button", () => {
    const seg = draw({
      entity: "climate.living_room",
      poster: "entity",
      attribute: "hvac_mode",
      control: "segments",
    });
    expect(seg.querySelector(".pvalue > .big")).not.toBeNull();
    expect(seg.querySelector(".pmain > .end > .ctl-segments")).not.toBeNull();
    const sel = draw({ entity: "input_select.house_mode", control: "auto" });
    expect(q(sel, ".pvalue > .big > b").textContent).toBe("Home");
    expect(sel.querySelector(".pmain > .end > .ctl-select")).not.toBeNull();
    const run = draw({ entity: "script.check_windows", control: "auto" });
    expect(run.querySelector(".pvalue > .big")).not.toBeNull();
    expect(run.querySelector(".pmain > .end > .ctl-chip")).not.toBeNull();
    // no control, no end slot
    expect(draw({ entity: TEMP }).querySelector(".pmain > .end")).toBeNull();
  });

  it("draws a gauge as its picture: the arc first, no big value", () => {
    const H = "sensor.living_room_humidity";
    const r = draw({ entity: H, visual: "gauge" });
    expect(q(r, ".pbody").classList.contains("pgauge")).toBe(true);
    expect(r.querySelector(".pbody .big")).toBeNull();
    expect(bodyParts(r)).toEqual(["gauge", "pname"]);
    // the name stays under the arc
    expect(bodyParts(draw({ entity: H, visual: "gauge", name_position: "below" }))).toEqual([
      "gauge",
      "pname",
    ]);
    // any other visual leaves the body as it is
    const bar = draw({ entity: H, visual: "bar" });
    expect(q(bar, ".pbody").classList.contains("pgauge")).toBe(false);
    expect(bodyParts(bar)).toEqual(["pname", "pvalue", "bar"]);
  });

  it("lights visual: glow from below as strong as its level, the same element at every level", () => {
    const H = "sensor.living_room_humidity";
    set(H, 50);
    const r = draw({ entity: H, visual: "glow", min: 0, max: 100 });
    const glow = q(r, ".body > .pback > .pglow");
    expect(glow.style.opacity).toBe("0.650");
    expect(glow.style.getPropertyValue("--glow")).not.toBe("");
    set(H, 100);
    expect(glow.style.opacity).toBe("1.000");
    set(H, 0);
    expect(glow.style.opacity).toBe("0");
    expect(q(r, ".pback > .pglow")).toBe(glow);
    // the glow is the picture: none along the bottom
    expect(bodyParts(r)).toEqual(["pname", "pvalue"]);
    // without a number: on or off
    set("switch.coffee_machine", "off");
    const sw = draw({ entity: "switch.coffee_machine", visual: "glow" });
    expect(q(sw, ".pglow").style.opacity).toBe("0");
    set("switch.coffee_machine", "on");
    expect(q(sw, ".pglow").style.opacity).toBe("1.000");
  });

  it("glows a light in its colour by its brightness; another visual drops the glow", () => {
    const L = "light.living_room";
    set(L, "on", { brightness: 255, rgb_color: [255, 200, 100] });
    const r = draw({ entity: L });
    const glow = q(r, ".pback > .pglow");
    expect(glow.style.opacity).toBe("1.000");
    // the poster's colour, which fades to a new one (the body's --pc-tint)
    expect(glow.style.getPropertyValue("--glow")).toBe("var(--pc-tint)");
    expect((glow.closest(".body") as HTMLElement).style.getPropertyValue("--pc-tint")).toBe(
      "rgb(255, 200, 100)",
    );
    set(L, "on", { brightness: 0.4 * 255 });
    expect(glow.style.opacity).toBe("0.580");
    set(L, "off");
    expect(glow.style.opacity).toBe("0");
    expect(q(r, ".pback > .pglow")).toBe(glow);
    for (const visual of ["none", "bar"])
      expect(draw({ entity: L, visual }).querySelector(".pglow")).toBeNull();
  });

  it("keeps the glow over a type's drawing, under an image's scrim", () => {
    const r = draw({
      entity: "sensor.living_room_humidity",
      visual: "glow",
      image: "/local/garden.jpg",
    });
    const back = q(r, ".pback");
    expect(back.classList.contains("scrim")).toBe(true);
    expect([...back.children].map((c) => c.tagName.toLowerCase() + "." + c.className)).toEqual([
      "img.",
      "div.pglow",
    ]);
  });

  it("draws icon_ring around the icon", () => {
    const r = draw({ entity: "sensor.living_room_humidity", icon_ring: true });
    expect(q(r, ".plead > .lead").classList.contains("ring")).toBe(true);
    expect(r.querySelector(".plead > .lead svg .track")).not.toBeNull();
    // an animated lead gives way to the ring, the card's or the matching rule's
    const fan = draw({ entity: "fan.living_room", icon_ring: true });
    expect(q(fan, ".plead > .lead").classList.contains("ring")).toBe(true);
    expect(fan.querySelector(".plead > .pfan")).toBeNull();
    set("fan.living_room", "on", { percentage: 66 });
    const ruled = draw({
      entity: "fan.living_room",
      rules: [{ state: "off", icon_ring: true }],
    });
    expect(ruled.querySelector(".plead > .pfan")).not.toBeNull();
    set("fan.living_room", "off", { percentage: 0 });
    expect(ruled.querySelector(".plead > .pfan")).toBeNull();
    expect(q(ruled, ".plead > .lead").classList.contains("ring")).toBe(true);
  });

  it("builds an animated lead again for a new icon or icon style, keeps it otherwise", () => {
    set("fan.living_room", "on", { percentage: 66 });
    const r = draw({
      entity: "fan.living_room",
      rules: [{ state: "off", icon: "mdi:fan-off", icon_style: "plain" }],
    });
    const lead = q(r, ".plead > .pfan");
    expect(lead.classList.contains("plain")).toBe(false);
    set("fan.living_room", "on", { percentage: 33 });
    expect(q(r, ".plead > .pfan")).toBe(lead);
    set("fan.living_room", "off", { percentage: 0 });
    const off = q(r, ".plead > .pfan");
    expect(off).not.toBe(lead);
    expect(off.classList.contains("plain")).toBe(true);
    expect(off.querySelector("ha-icon")?.getAttribute("icon")).toBe("mdi:fan-off");
  });

  it("lets the status badge's own colour win over the type's", () => {
    const r = draw({ entity: "sensor.solar_power", poster: "solar", status: { color: "red" } });
    const status = q(r, ".corner > .row.pstatus");
    expect(status.style.getPropertyValue("--fe-color")).toBe(cssColor("red", ""));
    expect(q(r, ".row.poster").style.getPropertyValue("--fe-color")).toBe("var(--pc-tint)");
  });

  // the card with its calls and actions recorded
  const drawCalls = (cfg: Record<string, unknown>) => {
    const r = draw(cfg);
    const calls: string[] = [];
    const fired: Record<string, unknown>[] = [];
    (r.host as PosterCard).hass = {
      ...snapshot(),
      callService: (d: string, s: string) => {
        calls.push(`${d}.${s}`);
        return Promise.resolve();
      },
    } as unknown as HomeAssistant;
    r.host.addEventListener("hass-action", (e) =>
      fired.push((e as CustomEvent).detail.config as Record<string, unknown>),
    );
    return { r, calls, fired };
  };

  it("holds a lock on its icon, which takes its own gestures", () => {
    vi.useFakeTimers();
    try {
      set("lock.front_door", "locked");
      const { r, calls, fired } = drawCalls({ entity: "lock.front_door" });
      const hold = q(r, ".plead > button.ctl-hold.lead-size");
      expect(hold.getAttribute("aria-label")).toBe("Hold to unlock");
      hold.dispatchEvent(new PointerEvent("pointerdown", { button: 0, bubbles: true }));
      vi.advanceTimersByTime(1100);
      expect(calls).toEqual(["lock.unlock"]);
      expect(fired).toEqual([]);
      // beside a tap action of its own: a press let go early is a tap
      const tap = drawCalls({ entity: "lock.front_door", icon_tap_action: "more-info" });
      const both = q(tap.r, ".plead > button.ctl-hold");
      both.dispatchEvent(new PointerEvent("pointerdown", { button: 0, bubbles: true }));
      vi.advanceTimersByTime(200);
      both.dispatchEvent(new PointerEvent("pointerup", { button: 0, bubbles: true }));
      expect(tap.fired).toEqual([
        { entity: "lock.front_door", tap_action: { action: "more-info" } },
      ]);
      expect(tap.calls).toEqual([]);
      // icon_hold_action: none leaves the plain icon
      expect(
        draw({ entity: "lock.front_door", icon_hold_action: "none" }).querySelector(
          ".plead > .lead:not(.tap)",
        ),
      ).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("makes the icon a switch with icon_tap_action: toggle", () => {
    set("switch.coffee_machine", "off");
    const { r, calls, fired } = drawCalls({
      entity: "switch.coffee_machine",
      icon_tap_action: "toggle",
    });
    const lead = q(r, ".plead > .lead.tap");
    expect(lead.getAttribute("role")).toBe("switch");
    expect(lead.classList.contains("off")).toBe(true);
    lead.click();
    expect(calls).toEqual(["homeassistant.toggle"]);
    expect(fired).toEqual([]);
  });

  it("runs any other icon action through Home Assistant, a double tap on its own", () => {
    vi.useFakeTimers();
    try {
      const { r, calls, fired } = drawCalls({
        entity: "sensor.living_room_humidity",
        icon_tap_action: { action: "navigate", navigation_path: "/climate" },
        icon_double_tap_action: "more-info",
      });
      const lead = q(r, ".plead > .lead.tap.act");
      expect(lead.getAttribute("role")).toBe("button");
      // a single tap waits for a second one
      lead.click();
      expect(fired).toEqual([]);
      vi.advanceTimersByTime(300);
      expect(fired).toEqual([
        {
          entity: "sensor.living_room_humidity",
          tap_action: { action: "navigate", navigation_path: "/climate" },
        },
      ]);
      lead.click();
      lead.click();
      vi.advanceTimersByTime(300);
      expect(fired.slice(1)).toEqual([
        { entity: "sensor.living_room_humidity", double_tap_action: { action: "more-info" } },
      ]);
      // a key runs the tap at once
      lead.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      expect(fired).toHaveLength(3);
      expect(calls).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("closes the body with a plot that names what it draws", () => {
    for (const kind of ["sparkline", "columns", "strip"]) {
      const r = draw({ entity: TEMP, visual: kind });
      const plot = q(r, ".pbody > .plot");
      expect(plot.dataset.kind).toBe(kind);
      expect(q(r, ".pbody").lastElementChild).toBe(plot);
    }
  });
});
