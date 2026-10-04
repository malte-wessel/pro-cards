import { test, expect, mount, events, card, setState, setLanguage } from "./util.ts";
import type { PowerFlowCard } from "../../src/power-flow-card.ts";
import type { Locator, Page } from "@playwright/test";

const T = "custom:power-flow-card-pro";
const SOLAR = "sensor.solar_power", // kW in the demo world
  BATT = "sensor.battery_power",
  SOC = "sensor.battery_soc",
  GRID = "sensor.grid_power",
  HOME = "sensor.power_consumption",
  OUTAGE = "binary_sensor.grid_outage";
const SRC = [
  { type: "solar", entity: SOLAR },
  { type: "battery", power: BATT, soc: SOC },
  {
    type: "grid",
    power: GRID,
    price: "sensor.electricity_price",
    offline: OUTAGE,
    generator: "sensor.generator_power",
    fossil: "sensor.grid_fossil_percentage",
  },
];
const CONS = [
  { entity: "sensor.heat_pump_power", name: "Heat pump", icon: "mdi:heat-pump" },
  { entity: "sensor.ev_charger_power", name: "EV", icon: "mdi:car-electric" },
  { entity: "sensor.washer_power", name: "Washer", icon: "mdi:washing-machine" },
];
const cssVar = (loc: Locator, name: string) =>
  loc.evaluate((e, n) => e.style.getPropertyValue(n).trim(), name);
// the demo world drifts its sensors: pin a noon with solar covering the home and charging the battery
const pin = async (page: Page, states: Record<string, string> = {}) => {
  const all = {
    [SOLAR]: "3.4",
    [BATT]: "-1200",
    [SOC]: "64",
    [GRID]: "-960",
    [HOME]: "1240",
    [OUTAGE]: "off",
    "sensor.generator_power": "0",
    "sensor.electricity_price": "0.28",
    "sensor.grid_fossil_percentage": "38",
    "sensor.heat_pump_power": "430",
    "sensor.ev_charger_power": "-1500",
    "sensor.washer_power": "290",
    ...states,
  };
  for (const [id, s] of Object.entries(all)) await setState(page, id, s);
};
const summary = (c: Locator) => c.locator(".psummary .secondary");
const label = (c: Locator, node: string) => c.locator(`.plabel[data-node="${node}"]`);
const link = (c: Locator, i: number) => c.locator(`path.link[data-edge="e${i}"]`);

test.describe("power flow card", () => {
  test("summary, nodes, labels and the state names", async ({ page }) => {
    await mount(page, { type: T, sources: SRC, home: HOME, expensive_above: 0.35 });
    await pin(page);
    const c = card(page);
    await expect(c.locator(".psummary .primary")).toHaveText("Home · 1.24 kW");
    await expect(summary(c)).toHaveText("Exporting 960 W · self-sufficient 100 %");
    await expect(summary(c).locator(".accent")).toHaveText("Exporting 960 W");
    expect(await cssVar(c.locator(".psummary"), "--fe-color")).toContain("--energy-grid-return");
    await expect(c.locator(".pnode")).toHaveCount(4);
    await expect(label(c, "s0")).toHaveText(/3\.40 kW\s*Solar/);
    await expect(label(c, "s1")).toHaveText(/1\.20 kW\s*Battery · 64 %/);
    await expect(label(c, "s2")).toHaveText(/960 W\s*Grid · 62 % low-carbon/);
    await expect(label(c, "home")).toHaveText("1.24 kW");
    // solar → home, solar → battery, solar → grid flow; the other links are idle tracks
    await expect(c.locator(".lane")).toHaveCount(3);
    await expect(c.locator("path.link.active")).toHaveCount(3);
    expect(await cssVar(c.locator(".pnode[data-node='s1']"), "--fe-color")).toContain(
      "--energy-battery-in",
    );
    // the home ring shows the mix: solar only right now
    const arcs = c.locator(".pnode[data-node='home'] path.prog");
    expect(await arcs.evaluateAll((ps) => ps.filter((p) => p.getAttribute("d")).length)).toBe(1);
    expect(
      (await page.evaluate(() => (window.pc.card(0) as unknown as PowerFlowCard).getGridOptions()))
        .rows,
    ).toBe("auto");

    await pin(page, { [SOLAR]: "0", [BATT]: "1600", [GRID]: "50", [HOME]: "1650" });
    await expect(summary(c).locator(".accent")).toHaveText("On battery");
    await pin(page, { [SOLAR]: "0", [BATT]: "0", [GRID]: "2600", [HOME]: "2600" });
    await expect(summary(c).locator(".accent")).toHaveText("Importing 2.60 kW");
    await expect(summary(c)).toHaveText("Importing 2.60 kW · self-sufficient 0 %");
    // the ring now splits the grid share into low-carbon and fossil
    expect(await arcs.evaluateAll((ps) => ps.filter((p) => p.getAttribute("d")).length)).toBe(2);
    await pin(page, {
      [SOLAR]: "0",
      [BATT]: "0",
      [GRID]: "2600",
      [HOME]: "2600",
      "sensor.electricity_price": "0.41",
    });
    await expect(summary(c).locator(".accent")).toHaveText("Expensive · 0.41 €/kWh");
    await expect(c.locator("ha-card")).toHaveClass(/tinted/);
    expect(await cssVar(c.locator("ha-card"), "--fe-tint")).toBe("var(--red-color)");
    await pin(page, { [SOLAR]: "1", [BATT]: "0", [GRID]: "0", [HOME]: "1000" });
    await expect(summary(c).locator(".accent")).toHaveText("Balanced");
    await expect(c.locator("ha-card")).not.toHaveClass(/tinted/);
  });

  test("an outage tints the card; a generator takes the grid's place", async ({ page }) => {
    await mount(page, { type: T, sources: SRC, home: HOME });
    await pin(page, { [SOLAR]: "0.4", [BATT]: "0", [GRID]: "0", [HOME]: "2600", [OUTAGE]: "on" });
    const c = card(page);
    await expect(summary(c).locator(".accent")).toHaveText("Grid offline · on solar");
    await expect(c.locator("ha-card")).toHaveClass(/tinted/);
    await expect(c.locator(".pnode[data-node='s2'] ha-icon")).toHaveAttribute(
      "icon",
      "mdi:transmission-tower-off",
    );
    expect(await cssVar(c.locator(".pnode[data-node='s2']"), "--fe-color")).toContain(
      "--red-color",
    );
    await expect(c.locator(".lane")).toHaveCount(1); // solar → home only
    await setState(page, "sensor.generator_power", "2200");
    await expect(summary(c).locator(".accent")).toHaveText("Grid offline · on generator");
    await expect(c.locator(".pnode[data-node='s2'] ha-icon")).toHaveAttribute("icon", "mdi:engine");
    await expect(label(c, "s2")).toHaveText(/2\.20 kW\s*Generator/);
    expect(await cssVar(c.locator(".pnode[data-node='s2']"), "--fe-color")).toContain(
      "--amber-color",
    );
    await expect(c.locator(".lane")).toHaveCount(2);
    await expect(summary(c)).toHaveText(/self-sufficient 15 %/);
  });

  test("a load change re-times the running flow; switching on or off rebuilds the lane", async ({
    page,
  }) => {
    await mount(page, { type: T, sources: SRC, home: HOME });
    await pin(page);
    const c = card(page);
    const lane = c.locator(".lane").first();
    const first = lane.locator(".pt").first();
    await first.evaluate((e) => ((e as HTMLElement).dataset.mark = "1"));
    const dur = await cssVar(lane, "--dur");
    const built = Number(await lane.getAttribute("data-w"));
    await pin(page, { [SOLAR]: "3.0", [HOME]: "1300" });
    // a little more load: same dots, a new playback rate
    await expect(lane.locator(".pt").first()).toHaveAttribute("data-mark", "1");
    const rate = (22 + 150 * (1300 / 3600)) / (22 + 150 * (built / 3600));
    await expect(lane).toHaveAttribute("data-rate", rate.toFixed(3));
    expect(await first.evaluate((e) => e.getAnimations()[0]?.playbackRate)).toBeCloseTo(rate, 3);
    expect(await cssVar(lane, "--dur")).toBe(dur);
    // the sun goes: the solar links switch off and their lanes go
    await pin(page, { [SOLAR]: "0", [BATT]: "1300", [GRID]: "0", [HOME]: "1300" });
    await expect(c.locator(".lane")).toHaveCount(1);
    await expect(c.locator(".lane").first().locator(".pt").first()).not.toHaveAttribute(
      "data-mark",
      "1",
    );
    await expect(link(c, 0)).not.toHaveClass(/active/);
  });

  test("consumers as nodes, a producing device, rooms and list rows", async ({ page }) => {
    await mount(page, { type: T, sources: SRC, home: HOME, consumers: CONS });
    await pin(page);
    const c = card(page);
    await expect(c.locator(".pnode")).toHaveCount(8); // 3 sources, home, 3 consumers, other
    await expect(label(c, "c0")).toHaveText(/430 W\s*Heat pump/);
    await expect(label(c, "c1")).toHaveText(/1\.50 kW\s*EV/);
    await expect(label(c, "other")).toHaveText(/520 W\s*Other/); // 1240 − 430 − 290; the EV produces
    await expect(c.locator(".lane.back")).toHaveCount(1);
    expect(await cssVar(c.locator(".pnode[data-node='c1']"), "--fe-color")).toContain(
      "--energy-solar",
    );
    await expect(c.locator(".pnode[data-node='c0'] ha-icon")).toHaveAttribute(
      "icon",
      "mdi:heat-pump",
    );

    await mount(page, {
      type: T,
      sources: SRC,
      home: HOME,
      consumers: CONS,
      consumer_style: "list",
    });
    await pin(page);
    const l = card(page);
    await expect(l.locator(".plist")).toHaveCount(4);
    await expect(l.locator(".plist[data-node='c0'] .primary")).toHaveText("Heat pump");
    await expect(l.locator(".plist[data-node='c0'] .state")).toHaveText("430 W");
    await expect(l.locator(".plist[data-node='other'] .state")).toHaveText("520 W");
    const bar = (id: string) =>
      l.locator(`.plist[data-node='${id}'] .bar i`).evaluate((e) => (e as HTMLElement).style.width);
    expect(Number.parseFloat(await bar("c1"))).toBeGreaterThan(Number.parseFloat(await bar("c0")));

    await mount(page, {
      type: T,
      sources: SRC,
      home: HOME,
      consumers: [
        {
          group: "Laundry",
          icon: "mdi:washing-machine",
          entities: [CONS[2], { entity: "sensor.dryer_power", name: "Dryer" }],
        },
        CONS[0],
      ],
    });
    await pin(page);
    const r = card(page);
    await expect(r.locator(".pnode")).toHaveCount(9); // 3 sources, home, room, 2 devices, heat pump, other
    await expect(label(r, "g0")).toHaveText(/290 W\s*Laundry/);
    await expect(r.locator(".plabel[data-node='c0.0']")).toHaveClass(/small/);
    await expect(r.locator(".pnode[data-node='g0'] ha-icon")).toHaveAttribute(
      "icon",
      "mdi:washing-machine",
    );
    // the lone device sits in the room column
    const x = (id: string) =>
      r.locator(`.pnode[data-node='${id}']`).evaluate((e) => (e as HTMLElement).style.left);
    expect(await x("c1")).toBe(await x("g0"));
  });

  test("home rules match watts whatever unit the home sensor reports", async ({ page }) => {
    // the demo solar sensor reports kW: as the home it reads 3.4 kW = 3400 W
    await mount(page, {
      type: T,
      sources: [SRC[2]],
      home: {
        entity: SOLAR,
        rules: [{ below: 500, color: "green", label: "Quiet", tint_card: true }],
      },
    });
    await pin(page, { [GRID]: "3400" });
    const c = card(page);
    await expect(c.locator(".psummary .primary")).toHaveText("Home · 3.40 kW");
    await expect(c.locator("ha-card")).not.toHaveClass(/tinted/);
    await expect(c.locator(".psummary .pill")).toHaveCount(0);
    await pin(page, { [SOLAR]: "0.3", [GRID]: "300" });
    await expect(c.locator(".psummary .pill")).toHaveText("Quiet");
    await expect(c.locator("ha-card")).toHaveClass(/tinted/);
  });

  test("direction, idle links, units, animation bounds and card size", async ({ page }) => {
    await mount(page, { type: T, sources: SRC, home: HOME, consumers: CONS, direction: "down" });
    await pin(page);
    const c = card(page);
    await expect(c.locator(".pdiag")).toHaveCSS("height", "388px"); // sources, home, consumers
    const top = (id: string) =>
      c
        .locator(`.pnode[data-node='${id}']`)
        .evaluate((e) => Number.parseFloat((e as HTMLElement).style.top));
    expect(await top("s0")).toBeLessThan(await top("home"));
    expect(await top("home")).toBeLessThan(await top("c0"));
    expect(
      await page.evaluate(() => (window.pc.card(0) as unknown as PowerFlowCard).getCardSize()),
    ).toBe(Math.ceil((40 + 388 + 36) / 56));

    await mount(page, {
      type: T,
      sources: SRC,
      home: HOME,
      idle_links: "hidden",
      kw_above: 0,
      decimals: { kw: 1 },
      animation: { fast_above: 800 },
    });
    await pin(page);
    const h = card(page);
    await expect(h.locator(".pdiag")).toHaveClass(/idle-hidden/);
    await expect(h.locator("path.link:not(.active)").first()).toBeHidden();
    await expect(h.locator(".psummary .primary")).toHaveText("Home · 1.2 kW");
    await expect(label(h, "s2")).toHaveText(/1\.0 kW/);
    // every active link is at full pace: 800 W and more are the fastest
    for (const lane of await h.locator(".lane").all()) {
      const len = await lane.locator(".pt").count();
      expect(len).toBeGreaterThan(0);
    }
    expect(Number.parseFloat(await cssVar(h.locator(".lane").first(), "--dur"))).toBeLessThan(3);
  });

  test("secondary lines, tap on a node, the profile language and reduced motion", async ({
    page,
  }) => {
    await mount(page, {
      type: T,
      sources: [
        { ...SRC[1], secondary: "{{ states('sensor.battery_temperature') }} °C" },
        SRC[0],
        SRC[2],
      ],
      home: HOME,
      consumers: [{ ...CONS[0], secondary: "floor heating" }],
    });
    await pin(page, { "sensor.battery_temperature": "27.5" });
    const c = card(page);
    await expect(label(c, "s0").locator(".sec2")).toHaveText("27.5 °C");
    await expect(label(c, "c0").locator(".sec2")).toHaveText("floor heating");
    await c.locator(".pnode[data-node='s1']").click();
    expect(await events(page)).toEqual([{ type: "more-info", entityId: SOLAR }]);
    await setLanguage(page, "de");
    await expect(summary(c).locator(".accent")).toHaveText("Einspeisung 960 W");
    await expect(label(c, "s2")).toHaveText(/Netz · 62 % CO₂-arm/);
    await expect(label(c, "other")).toHaveText(/Sonstiges/);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const pt = c.locator(".lane .pt").first();
    expect(await pt.evaluate((e) => getComputedStyle(e).animationPlayState)).toBe("paused");
    // the still frame is populated: the dots sit at their phase along the link
    const spread = await c
      .locator(".lane .pt")
      .evaluateAll((els) => new Set(els.map((e) => getComputedStyle(e).offsetDistance)).size);
    expect(spread).toBeGreaterThan(1);
  });
});
