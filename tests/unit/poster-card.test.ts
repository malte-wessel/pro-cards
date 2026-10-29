import { afterEach, describe, it, expect, vi } from "vitest";
import { PosterCard } from "../../src/poster-card.ts";
import { normalizePosterConfig, parseImage } from "../../src/poster/config.ts";
import { imageUrl, statusText } from "../../src/poster/render.ts";
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
    expect(() => norm({ entity: "light.kitchen", kind: "room" })).toThrow(/kind must be one of/);
    expect(() => norm({ entity: "light.kitchen", kind: "wind" })).toThrow(/kind 'wind' reads/);
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
    const wind = norm({ entity: "sensor.wind_speed", kind: "wind" });
    expect(wind.entities[0].rules).toEqual(WIND_RULES.map(toRule));
    expect(wind.entities[0].ruleUnit).toBe("km/h");
    expect(wind.entities[wind.statusIdx!].ruleUnit).toBe("km/h");
    expect(
      norm({ entity: "sensor.wind_speed", kind: "wind", rules: [] }).entities[0].ruleUnit,
    ).toBeUndefined();
  });

  it("draws the kind's controls by default; control: false drops them, a name picks another", () => {
    const light = norm({ entity: "light.living_room" });
    expect(kinds(placementsOf(light.entities[0], "poster"))).toEqual([
      "toggle@end",
      "slider@block",
    ]);
    expect(light.entities[0].toggle).toBe(false);
    expect(norm({ entity: "light.living_room", control: false }).entities[0].control).toBeNull();
    const named = norm({ entity: "light.living_room", control: "slider" }).entities[0];
    expect(kinds(placementsOf(named, "poster"))).toEqual(["slider@block"]);
    expect(kinds(placementsOf(norm({ entity: "lock.front_door" }).entities[0], "poster"))).toEqual([
      "hold@lead",
    ]);
  });

  it("draws no control on an alarm panel that wants a code", () => {
    const A = "alarm_control_panel.home";
    const free = norm({ entity: A }, withStates({ [A]: st(A, "disarmed") }));
    expect(kinds(placementsOf(free.entities[0], "poster"))).toEqual(["hold@lead"]);
    const coded = norm(
      { entity: A },
      withStates({ [A]: st(A, "disarmed", { code_format: "number" }) }),
    );
    expect(coded.entities[0].control).toBeNull();
  });

  it("reads inputs set in kind, a weather entity's attributes or found on the device", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const set = norm({
      entity: "sensor.wind_speed",
      kind: { type: "wind", direction: "sensor.wind_direction", gust: false },
    });
    expect(Object.keys(set.inputs)).toEqual(["direction"]);
    expect(set.entities[set.inputs.direction].entity).toBe("sensor.wind_direction");
    // without hass nothing is found yet
    expect(norm({ entity: "sensor.wind_speed", kind: "wind" }).inputs).toEqual({});

    const weather = norm({ entity: "weather.home", kind: "wind" });
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
      `${T}: wind: gust from sensor.wind_gust (same device as sensor.wind_speed); set kind.gust to choose another`,
    );
    // the inputs are read, never drawn
    expect(found.groups[0].idxs).toEqual([0]);
    expect(found.groups[0].badgeIdxs).toEqual([found.statusIdx]);
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
    expect(norm({ kind: "sun" }).kind.name).toBe("sun");
    // a grid without an entity opens its import meter; a trend's first series is its entity
    const grid = norm({ kind: { import: "sensor.grid_import", export: "sensor.grid_export" } });
    expect(grid.kind.name).toBe("grid");
    expect(grid.entities[0].entity).toBe("sensor.grid_import");
    const trend = norm({
      kind: { type: "trend", entities: [{ entity: "sensor.outdoor_temperature", name: "Out" }] },
    });
    expect(trend.entities[0]).toMatchObject({ entity: "sensor.outdoor_temperature", name: "Out" });
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
    expect(parseImage("camera.front_door")).toEqual({
      kind: "entity",
      entity: "camera.front_door",
    });
    expect(parseImage("{{ 'a' }}")).toEqual({ kind: "template", template: "{{ 'a' }}" });
  });

  it("reads the image now", () => {
    const hass = withStates({
      "camera.front_door": st("camera.front_door", "idle", { entity_picture: "/api/cam?t=1" }),
    });
    const ctx = { hass, tplResult: new Map<string, unknown>([["{{ 'a' }}", "/local/a.jpg"]]) };
    expect(imageUrl(ctx as never, null)).toBeNull();
    expect(imageUrl(ctx as never, false)).toBeNull();
    expect(imageUrl(ctx as never, { kind: "url", url: "/x.jpg" })).toBe("/x.jpg");
    expect(imageUrl(ctx as never, { kind: "template", template: "{{ 'a' }}" })).toBe(
      "/local/a.jpg",
    );
    expect(imageUrl(ctx as never, { kind: "entity", entity: "camera.front_door" })).toBe(
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

  it("is three rows high, two at least, and wider where its line holds controls", () => {
    const el = mount({ entity: "sensor.living_room_temperature" });
    expect(el.getGridOptions()).toEqual({ columns: 6, rows: 3, min_columns: 3, min_rows: 2 });
    expect(el.getCardSize()).toBe(3);
    el.setConfig({ entity: "light.living_room" });
    expect(el.getGridOptions().min_columns).toBe(4);
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
      kind: "entity",
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
      kind: "entity",
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

  it("closes the body with a plot that names what it draws", () => {
    for (const kind of ["sparkline", "columns", "strip"]) {
      const r = draw({ entity: TEMP, visual: kind });
      const plot = q(r, ".pbody > .plot");
      expect(plot.dataset.kind).toBe(kind);
      expect(q(r, ".pbody").lastElementChild).toBe(plot);
    }
  });
});
