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

  test("a label that changes its width moves the links in place, their dots keep running", async ({
    page,
  }) => {
    await mount(page, { type: T, sources: SRC, home: HOME, consumers: CONS }, { width: 440 });
    await pin(page, { "sensor.heat_pump_power": "990" });
    const c = card(page);
    const lanes = c.locator(".lane");
    const count = await lanes.count();
    expect(count).toBeGreaterThan(0);
    // every lane's first dot and every track, marked
    await c
      .locator(".lane > :first-child, path.link")
      .evaluateAll((els) => els.forEach((e) => e.setAttribute("data-mark", "1")));
    const paths = () =>
      c.locator("path.link").evaluateAll((els) => els.map((e) => e.getAttribute("d")));
    const before = await paths();
    // the battery's charge and the heat pump's value grow wider (64 % → 100 %, 990 W → 1.01 kW)
    // without a real change of load
    await pin(page, { [SOC]: "100", "sensor.heat_pump_power": "1010" });
    await expect(label(c, "s1")).toHaveText(/Battery · 100 %/);
    // the tree moved: some link has a new path
    expect(await paths()).not.toEqual(before);
    // the same tracks and the same dots
    await expect(c.locator("path.link:not([data-mark])")).toHaveCount(0);
    await expect(lanes).toHaveCount(count);
    await expect(c.locator(".lane > :first-child[data-mark]")).toHaveCount(count);
    // each lane runs on its track's new path
    const pairs = await c.locator(".lane").evaluateAll((els) =>
      els.map((l) => {
        const lane = l as HTMLElement;
        const root = lane.getRootNode() as ShadowRoot;
        const track = root.querySelector(`path.link[data-edge="${lane.dataset.edge}"]`);
        return [track?.getAttribute("d"), lane.style.getPropertyValue("--p")];
      }),
    );
    for (const [d, p] of pairs) expect(p).toBe(`path('${d}')`);
  });

  test("a value ticking back narrower keeps the tree where its widest put it", async ({ page }) => {
    await mount(page, { type: T, sources: SRC, home: HOME, consumers: CONS }, { width: 440 });
    await pin(page, { [SOC]: "64" });
    const c = card(page);
    const paths = () =>
      c.locator("path.link").evaluateAll((els) => els.map((e) => e.getAttribute("d")));
    // the battery's label widens (64 % → 100 %) and moves the tree …
    await pin(page, { [SOC]: "100" });
    await expect(label(c, "s1")).toHaveText(/Battery · 100 %/);
    const wide = await paths();
    // … and narrows again: the tree stays, so a value ticking about one width moves nothing
    await pin(page, { [SOC]: "64" });
    await expect(label(c, "s1")).toHaveText(/Battery · 64 %/);
    expect(await paths()).toEqual(wide);
  });

  test("lines keep to their tracks when the diagram changes height", async ({ page }) => {
    const shown = [{ condition: "state", entity: "light.kitchen", state: "on" }];
    await mount(page, {
      type: T,
      sources: SRC,
      home: HOME,
      flow_style: "lines",
      // a room's links keep their paths when a consumer beside it goes, the diagram gets shorter
      consumers: [
        { group: "Laundry", entities: ["sensor.washer_power", "sensor.dryer_power"] },
        {
          group: "Garage",
          entities: [
            "sensor.ev_charger_power",
            { entity: "sensor.heat_pump_power", visibility: shown },
          ],
        },
      ],
    });
    await setState(page, "light.kitchen", "on");
    await pin(page, { "sensor.washer_power": "290", "sensor.dryer_power": "640" });
    const c = card(page);
    await expect(c.locator('.pnode[data-node="c1.1"]')).toBeVisible();
    const boxes = () =>
      c.locator(".pdiag").evaluate((d) => ({
        tracks: d.querySelector("svg.ptracks")!.getAttribute("viewBox"),
        lanes: [...d.querySelectorAll(".lane svg")].map((s) => s.getAttribute("viewBox")),
      }));
    const before = await boxes();
    expect(before.lanes.length).toBeGreaterThan(0);
    for (const box of before.lanes) expect(box).toBe(before.tracks);
    // the heat pump goes: the diagram is laid out over fewer nodes
    await setState(page, "light.kitchen", "off");
    await expect(c.locator('.pnode[data-node="c1.1"]')).toBeHidden();
    const after = await boxes();
    expect(after.tracks).not.toBe(before.tracks);
    for (const box of after.lanes) expect(box).toBe(after.tracks);
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

  test("grid and solar rings show the low-carbon share and the peak", async ({ page }) => {
    await mount(page, {
      type: T,
      sources: [{ ...SRC[0], peak: 6800 }, SRC[1], SRC[2]],
      home: HOME,
    });
    await pin(page); // solar 3.4 kW, fossil 38 %
    const c = card(page);
    const arc = (id: string) =>
      c
        .locator(`.pnode[data-node='${id}'] path.prog`)
        .evaluateAll((ps) =>
          ps.filter((p) => p.getAttribute("d")).map((p) => (p as SVGPathElement).style.stroke),
        );
    expect(await arc("s0")).toEqual([expect.stringContaining("--energy-solar")]);
    expect(await arc("s2")).toEqual([expect.stringContaining("--energy-non-fossil")]);
    // half the peak, 62 % low-carbon: the arcs' lengths follow
    const len = (id: string) =>
      c
        .locator(`.pnode[data-node='${id}'] path.prog`)
        .first()
        .evaluate((p) => (p as SVGPathElement).getTotalLength());
    const r = (d: number) => d / 2 - 1.5;
    expect(await len("s0")).toBeCloseTo(2 * Math.PI * r(44) * 0.5, 0);
    expect(await len("s2")).toBeCloseTo(2 * Math.PI * r(44) * 0.62, 0);
    // without the data a node stays a plain circle
    await mount(page, { type: T, sources: [SRC[0], SRC[1], { type: "grid", power: GRID }] });
    await expect(card(page).locator(".pnode[data-node='s0'] .lead.ring")).toHaveCount(0);
    await expect(card(page).locator(".pnode[data-node='s2'] .lead.ring")).toHaveCount(0);
  });

  test("icon_size sets a node's circle; the icon follows it, ring or not", async ({ page }) => {
    await mount(page, {
      type: T,
      sources: [{ ...SRC[0], peak: 6800 }, SRC[1], { type: "grid", power: GRID }],
      home: { entity: HOME, icon_size: 60 },
      consumers: [{ ...CONS[0], icon_size: 48 }, CONS[1]],
    });
    await pin(page);
    const c = card(page);
    const lead = (id: string) => c.locator(`.pnode[data-node='${id}'] .lead`);
    const icon = async (id: string) =>
      (await lead(id).locator(".shape > *").first().boundingBox())!.width;
    expect(await cssVar(lead("home"), "--lead")).toBe("60px");
    expect((await lead("home").boundingBox())!.width).toBe(60);
    expect((await lead("c0").boundingBox())!.width).toBe(48);
    expect((await lead("c1").boundingBox())!.width).toBe(32);
    // 55 % of the circle, 42 % in a ring
    expect(await icon("c1")).toBeCloseTo(32 * 0.55, 0);
    expect(await icon("c0")).toBeCloseTo(48 * 0.55, 0);
    await expect(lead("s0")).toHaveClass(/\bring\b/);
    await expect(lead("s2")).not.toHaveClass(/\bring\b/);
    expect(await icon("s0")).toBeCloseTo(44 * 0.42, 0);
    expect(await icon("home")).toBeCloseTo(60 * 0.42, 0);
    // … and its stroke scales with the node: 3 px on the home's own 46 px
    const sw = await lead("home").locator("circle.track").getAttribute("stroke-width");
    expect(Number(sw)).toBeCloseTo((3 * 60) / 46, 2);
    expect(await icon("s2")).toBeCloseTo(44 * 0.55, 0);
  });

  test("a fixed number of grid rows: the tree fills the card or scales down", async ({ page }) => {
    const cfg = { type: T, sources: SRC, home: HOME, consumers: [CONS[0]], other: false };
    const box = (l: Locator) => l.boundingBox().then((b) => b!);
    // taller than the tree: the diagram reaches the card's bottom padding
    await mount(page, { ...cfg, grid_options: { columns: 12, rows: 8 } });
    await pin(page);
    const c = card(page);
    const [cardBox, diagBox] = [await box(c.locator("ha-card")), await box(c.locator(".pdiag"))];
    expect(cardBox.height).toBe(8 * 56 + 7 * 8);
    expect(cardBox.y + cardBox.height - (diagBox.y + diagBox.height)).toBeLessThanOrEqual(16);
    const viewH = await c
      .locator("svg.ptracks")
      .evaluate((e) => Number(e.getAttribute("viewBox")?.split(" ")[3]));
    expect(viewH).toBe(Math.round(diagBox.height));
    expect(await c.locator(".pscale").evaluate((e) => (e as HTMLElement).style.transform)).toBe("");
    // smaller than the tree: scaled down as a whole, nothing cut off
    await mount(page, { ...cfg, grid_options: { columns: 12, rows: 4 } });
    await pin(page);
    const s = card(page);
    const transform = await s
      .locator(".pscale")
      .evaluate((e) => (e as HTMLElement).style.transform);
    const k = Number(/scale\(([\d.]+)\)/.exec(transform)?.[1]);
    expect(k).toBeGreaterThan(0.3);
    expect(k).toBeLessThan(1);
    const sBox = await box(s.locator("ha-card"));
    for (const id of ["s0", "s2", "c0"]) {
      const n = await box(s.locator(`.pnode[data-node='${id}']`));
      expect(n.y + n.height).toBeLessThanOrEqual(sBox.y + sBox.height);
    }
    // a right-to-left document: the scaled tree stays anchored where the diagram starts
    await page.evaluate(() => (document.documentElement.dir = "rtl"));
    await mount(page, { ...cfg, grid_options: { columns: 12, rows: 4 } });
    await pin(page);
    const r = card(page);
    const [rBox, rDiag] = [await box(r.locator(".pscale")), await box(r.locator(".pdiag"))];
    expect(Math.abs(rBox.x - rDiag.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(rBox.width - rDiag.width)).toBeLessThanOrEqual(1);
    await page.evaluate(() => (document.documentElement.dir = ""));
    // rows: auto (the default): the card is as tall as its tree
    await mount(page, cfg);
    const auto = card(page).locator(".pdiag");
    await expect(auto).toHaveCSS(
      "height",
      await auto.evaluate((e) => (e as HTMLElement).style.getPropertyValue("--diag-h")),
    );
    // rows in the config, but a masonry view or a vertical stack (the height follows the
    // content): the tree keeps its own height and stays visible
    await mount(page, { ...cfg, grid_options: { columns: 12, rows: 6 } }, { layout: null });
    await pin(page);
    const m = card(page);
    const natural = await m
      .locator(".pdiag")
      .evaluate((e) => (e as HTMLElement).style.getPropertyValue("--diag-h"));
    await expect(m.locator(".pdiag")).toHaveCSS("height", natural);
    const mBox = await box(m.locator("ha-card"));
    const grid = await box(m.locator(".pnode[data-node='s2']"));
    expect(grid.y + grid.height).toBeLessThanOrEqual(mBox.y + mBox.height);
  });

  test("idle_below lets a standby load flow", async ({ page }) => {
    const cfg = { type: T, sources: SRC, home: HOME, consumers: CONS };
    await mount(page, cfg);
    await pin(page, { "sensor.washer_power": "3" });
    const c = card(page);
    await expect(label(c, "c2")).toHaveText(/3 W/);
    const idle = await c.locator("path.link.active").count();
    await mount(page, { ...cfg, idle_below: 1 });
    await pin(page, { "sensor.washer_power": "3" });
    await expect(card(page).locator("path.link.active")).toHaveCount(idle + 1);
  });

  test("an idle track never covers an active line it shares a leg with", async ({ page }) => {
    await mount(page, { type: T, sources: SRC, home: HOME, consumers: CONS });
    const c = card(page);
    // the tracks in paint order: every idle one before every active one
    const order = () =>
      c
        .locator("path.link")
        .evaluateAll((ps) => ps.map((p) => (p.classList.contains("active") ? "a" : "i")).join(""));
    const idleFirst = /^i*a+$/;
    // solar exports over the battery's idle export rail, the home feeds one consumer of three
    await pin(page, {
      [BATT]: "0",
      [GRID]: "-2000",
      [HOME]: "1400",
      "sensor.heat_pump_power": "0",
      "sensor.ev_charger_power": "0",
    });
    expect(await order()).toMatch(idleFirst);
    // a cloud: the export stops in the middle of the active tracks, the battery feeds the home
    await pin(page, { [SOLAR]: "0.9", [BATT]: "500", [GRID]: "0", [HOME]: "1400" });
    await expect(link(c, 2)).not.toHaveClass(/active/);
    expect(await order()).toMatch(idleFirst);
  });

  test("labels keep their places when hidden idle links switch on and off", async ({ page }) => {
    // a narrow column of sources: a hidden line used to free the place beside it
    await mount(
      page,
      {
        type: T,
        sources: [SRC[2], SRC[1], SRC[0]],
        home: HOME,
        consumers: CONS,
        direction: "down",
        idle_links: "hidden",
        kw_above: 0,
        decimals: { kw: 1 },
      },
      { width: 520 },
    );
    const c = card(page);
    // every label as wide at night as at noon: the places alone may tell them apart
    const places = () =>
      c
        .locator(".plabel:not([hidden])")
        .evaluateAll((els) =>
          els.map((e) => [
            (e as HTMLElement).dataset.node,
            e.className,
            (e as HTMLElement).style.left,
            (e as HTMLElement).style.right,
            (e as HTMLElement).style.top,
          ]),
        );
    await pin(page, { [SOLAR]: "0", [BATT]: "1300", [GRID]: "0", [HOME]: "1300" });
    await expect(label(c, "s2")).toHaveText(/0\.0 kW/);
    const night = await places();
    await pin(page);
    await expect(label(c, "s2")).toHaveText(/3\.4 kW/);
    expect(await places()).toEqual(night);
  });

  test("a narrow row of consumers keeps its labels below and cuts long names", async ({ page }) => {
    const consumers = [
      { ...CONS[0], name: "Heat pump in the cellar" },
      CONS[1],
      CONS[2],
      { entity: "sensor.dryer_power", name: "Dryer" },
      { entity: "sensor.office_power", name: "Office" },
      { entity: "sensor.dining_light_power", name: "Dining" },
    ];
    await mount(
      page,
      { type: T, sources: SRC, home: HOME, consumers, direction: "down" },
      {
        width: 520,
      },
    );
    await pin(page);
    const c = card(page);
    const ids = ["c0", "c1", "c2", "c3", "c4", "c5", "other"];
    for (const id of ids) {
      const node = await c.locator(`.pnode[data-node='${id}']`).boundingBox();
      const lab = await label(c, id).boundingBox();
      expect(lab!.y).toBeGreaterThan(node!.y + node!.height / 2);
      await expect(label(c, id)).toHaveClass(/\bc\b/);
    }
    const name = label(c, "c0").locator(".name");
    await expect(label(c, "c0")).toHaveClass(/cut/);
    expect(await name.evaluate((e) => e.scrollWidth > e.clientWidth)).toBe(true);
    await expect(label(c, "c0").locator(".state")).toHaveText("430 W");
    // no two labels meet
    const boxes = await Promise.all(ids.map((id) => label(c, id).boundingBox()));
    for (let k = 1; k < boxes.length; k++)
      expect(boxes[k - 1]!.x + boxes[k - 1]!.width).toBeLessThanOrEqual(boxes[k]!.x);
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

test("a solar-fed battery given as a pair charges from its panels and feeds the home at once", async ({
  page,
}) => {
  const B = "sensor.balcony_battery_";
  await mount(page, {
    type: T,
    sources: [
      { type: "solar", entity: "sensor.balcony_solar_power", name: "Balcony" },
      {
        type: "battery",
        charge: `${B}charge_power`,
        discharge: `${B}discharge_power`,
        soc: `${B}soc`,
        charge_from: "solar",
      },
      { type: "grid", power: "sensor.balcony_grid_power" },
    ],
  });
  // the reported case: 374 W from the panels into the battery, 189 W out of it, 70 W imported
  for (const [id, st] of Object.entries({
    "sensor.balcony_solar_power": "374",
    [`${B}charge_power`]: "374",
    [`${B}discharge_power`]: "189",
    [`${B}soc`]: "42",
    "sensor.balcony_grid_power": "70",
  }))
    await setState(page, id, st);
  const c = card(page);
  await expect(label(c, "home")).toHaveText("259 W");
  // the node shows both flows, its colour follows the net value, the links carry both
  await expect(label(c, "s1")).toHaveText(/374 W ↓\s*(?:·\s*)?189 W ↑\s*Battery · 42 %/);
  expect(await cssVar(c.locator(".pnode[data-node='s1']"), "--fe-color")).toContain(
    "--energy-battery-in",
  );
  await expect(c.locator("path.link.active")).toHaveCount(3);
  await expect(link(c, 1)).toHaveClass(/active/); // solar → battery
  await expect(link(c, 3)).toHaveClass(/active/); // battery → home
  await expect(link(c, 5)).toHaveClass(/active/); // grid → home
  await expect(link(c, 0)).not.toHaveClass(/active/); // solar → home stays idle
  await expect(link(c, 6)).not.toHaveClass(/active/); // the grid never charges it
});

test("a node with two flows shows its net value below the idle threshold, both again only clearly above", async ({
  page,
}) => {
  const B = "sensor.balcony_battery_";
  await mount(page, {
    type: T,
    sources: [
      { type: "solar", entity: "sensor.balcony_solar_power" },
      {
        type: "battery",
        charge: `${B}charge_power`,
        discharge: `${B}discharge_power`,
        charge_from: "sensor.balcony_solar_power",
      },
      {
        type: "grid",
        import: "sensor.grid_import_power",
        export: "sensor.grid_export_power",
        both_ways: true,
      },
    ],
  });
  const set = async (states: Record<string, string>) => {
    for (const [id, st] of Object.entries(states)) await setState(page, id, st);
  };
  await set({
    "sensor.balcony_solar_power": "400",
    [`${B}charge_power`]: "400",
    [`${B}discharge_power`]: "250",
    "sensor.grid_import_power": "1200",
    "sensor.grid_export_power": "300",
  });
  const c = card(page);
  // one value over the other: into the node ↓, out of it ↑ (the grid: export, import)
  await expect(label(c, "s2")).toHaveText(/300 W ↓\s*(?:·\s*)?1\.20 kW ↑\s*Grid/);
  await expect(label(c, "s1")).toHaveText(/400 W ↓\s*(?:·\s*)?250 W ↑/);
  // at idle_below (20 W) the two values stay, below it the net value returns
  await set({ [`${B}discharge_power`]: "20" });
  await expect(label(c, "s1")).toHaveText(/400 W ↓\s*(?:·\s*)?20 W ↑/);
  await set({ [`${B}discharge_power`]: "15" });
  await expect(label(c, "s1")).toHaveText(/^385 W/);
  // and the two values come back only clearly above it
  await set({ [`${B}discharge_power`]: "22" });
  await expect(label(c, "s1")).toHaveText(/^378 W/);
  await set({ [`${B}discharge_power`]: "30" });
  await expect(label(c, "s1")).toHaveText(/400 W ↓\s*(?:·\s*)?30 W ↑/);
  // direction: down as well; the second line is kept while the node shows one value
  await mount(page, {
    type: T,
    direction: "down",
    sources: [
      { type: "solar", entity: "sensor.balcony_solar_power" },
      {
        type: "battery",
        charge: `${B}charge_power`,
        discharge: `${B}discharge_power`,
        charge_from: "solar",
      },
    ],
  });
  const d = label(card(page), "s1");
  await expect(d.locator(".state")).toHaveText("400 W ↓");
  await expect(d.locator(".v2")).toHaveText("30 W ↑");
  const h = await d.evaluate((e) => e.getBoundingClientRect().height);
  await set({ [`${B}discharge_power`]: "0" });
  await expect(d.locator(".state")).toHaveText("400 W");
  await expect(d.locator(".v2")).toHaveClass(/blank/);
  expect(await d.evaluate((e) => e.getBoundingClientRect().height)).toBe(h);
  // a grid without both_ways keeps its net value
  await mount(page, {
    type: T,
    sources: [
      { type: "solar", entity: "sensor.balcony_solar_power" },
      { type: "grid", import: "sensor.grid_import_power", export: "sensor.grid_export_power" },
    ],
  });
  await expect(label(card(page), "s1")).toHaveText(/^900 W\s*Grid/);
});

test.describe("power flow card: a still flow, the Other node and a unit of its own", () => {
  test("flow_style none draws the active links in their colour, nothing moving", async ({
    page,
  }) => {
    await mount(page, { type: T, sources: SRC, home: HOME, flow_style: "none" });
    await pin(page);
    const c = card(page);
    await expect(c.locator("path.link.active")).toHaveCount(3);
    await expect(c.locator(".lane")).toHaveCount(0);
    await expect(c.locator(".pdiag")).toHaveClass(/static/);
    // the full colour of the flow, not the faint track the dots run on
    const stroke = await c
      .locator("path.link.active")
      .first()
      .evaluate((p) => getComputedStyle(p).stroke);
    // the solar link in the solar colour itself (the dots' track is a blend of it)
    expect(stroke).toBe("rgb(255, 152, 0)");
  });

  test("the Other node takes a name and an icon of its own", async ({ page }) => {
    await mount(page, {
      type: T,
      sources: SRC,
      home: HOME,
      consumers: CONS,
      other: { name: "Rest of the house", icon: "mdi:home-outline" },
    });
    await pin(page);
    const c = card(page);
    await expect(label(c, "other")).toHaveText(/Rest of the house/);
    await expect(c.locator(".pnode[data-node='other'] ha-icon")).toHaveAttribute(
      "icon",
      "mdi:home-outline",
    );
  });

  test("a tree of water flows reads L/min, without the words of electricity", async ({ page }) => {
    await mount(page, {
      type: T,
      decimals: 1,
      sources: [{ type: "grid", power: "sensor.water_flow", name: "Mains" }],
      consumers: [
        { entity: "sensor.bathroom_water_flow", name: "Bathroom" },
        { entity: "sensor.kitchen_water_flow", name: "Kitchen" },
        { entity: "sensor.garden_water_flow", name: "Garden" },
      ],
    });
    const c = card(page);
    await expect(c.locator(".psummary .primary")).toHaveText("Home · 14.6 L/min");
    await expect(c.locator(".psummary .secondary")).toHaveText("");
    await expect(label(c, "s0")).toHaveText(/14\.6 L\/min\s*Mains/);
    await expect(label(c, "c0")).toHaveText(/8\.2 L\/min\s*Bathroom/);
    await expect(label(c, "other")).toHaveText(/2\.5 L\/min/);
    // without an idle_below every flow that is not nothing moves; the garden takes nothing
    await expect(c.locator(".lane")).toHaveCount(4);
    // a kitchen in W does not belong: the console says so
    const warned = page.waitForEvent("console", (m) =>
      m.text().includes("sensor.kitchen_water_flow"),
    );
    await setState(page, "sensor.kitchen_water_flow", "3.9", { unit_of_measurement: "W" });
    await warned;
  });
});
