// Icons sit centred in the box the card draws them in. Home Assistant's icon (ha-svg-icon) is
// inline-flex and aligned to the middle of the text line: wherever a card leaves a line box
// around it, the icon drops by a pixel or two. The harness builds icons as Home Assistant does,
// so this measures what a dashboard shows; a pixel diff would let a 2 px drop pass.
import { test, expect, mount } from "./util";

const G = "custom:entity-group-card-pro";

// every card kind, and every place an icon sits: leads, title icons, header items, custom round
// buttons and chips, the built-in buttons, row-item Run and hold buttons, chips of the flow cards
const CARDS = [
  {
    type: "custom:entity-card-pro",
    entity: "light.desk_lamp",
    control: "buttons",
    control_options: [{ entity: "scene.bright" }],
  },
  {
    type: G,
    title: "Living room",
    icon: "mdi:sofa",
    header_entities: [{ entity: "sensor.living_room_temperature" }],
    entities: [
      {
        name: "Scenes",
        icon: "mdi:palette",
        control: "buttons",
        control_options: [
          { entity: "scene.bright", icon: "mdi:white-balance-sunny", color: "amber" },
          { entity: "light.desk_lamp", color: "orange" },
          { icon: "mdi:cog", action: "none" },
        ],
      },
      {
        name: "Chips",
        control: "buttons",
        control_position: "block",
        control_options: [{ entity: "scene.bright", label: "Bright", color: "amber" }],
      },
      { entity: "cover.garage_door", control: "buttons", control_confirm: true },
    ],
  },
  {
    type: G,
    layout: "row",
    entities: [
      { entity: "scene.bright", control: "button" },
      { entity: "lock.front_door", control: "hold", control_position: "lead" },
      { entity: "light.desk_lamp", control: "toggle" },
    ],
  },
  {
    type: "custom:entity-sections-card-pro",
    title: "Office",
    icon: "mdi:desk",
    sections: [{ layout: "grid", entities: ["light.desk_lamp", "sensor.living_room_temperature"] }],
  },
  {
    type: "custom:rain-card-pro",
    entity: "sensor.rain_rate_roof",
    today: "sensor.rain_today",
    title: "Rain",
    header_entities: [{ entity: "sensor.rain_today", icon: "mdi:cup-water" }],
    layout: "hero",
  },
  {
    type: "custom:wind-card-pro",
    entity: "sensor.wind_speed",
    direction: "sensor.wind_direction",
    lead: "arrow",
    title: "Wind",
    header_entities: [{ entity: "sensor.wind_gust", icon: "mdi:weather-windy" }],
  },
  // the hero draws the flow band with its direction chip
  {
    type: "custom:wind-card-pro",
    entity: "sensor.wind_speed",
    direction: "sensor.wind_direction",
    layout: "hero",
  },
  {
    type: "custom:weather-card-pro",
    entity: "weather.home",
    title: "Weather",
    sections: [{ type: "hero" }, { type: "forecast", mode: "daily", days: 3, icons: "mdi" }],
  },
  {
    type: "custom:power-flow-card-pro",
    title: "Energy",
    icon: "mdi:lightning-bolt",
    home: "sensor.power_consumption",
    sources: [
      { type: "solar", entity: "sensor.solar_power" },
      { type: "grid", power: "sensor.grid_power" },
    ],
    consumers: [{ entity: "sensor.heat_pump_power", name: "Heat pump", icon: "mdi:heat-pump" }],
  },
  { type: "custom:sun-path-card-pro", title: "Sun today", icon: "mdi:weather-sunny" },
  { type: "custom:illuminance-card-pro", entity: "sensor.illuminance", title: "Light" },
  {
    type: "custom:multi-trend-card-pro",
    title: "Outside",
    icon: "mdi:thermometer",
    entities: ["sensor.outdoor_temperature", "sensor.dew_point"],
  },
];

test("every icon sits centred in the box the card draws it in", async ({ page }) => {
  await mount(page, CARDS);
  const report = await page.evaluate(() => {
    const out: { card: string; where: string; dx: number; dy: number }[] = [];
    for (const card of document.querySelectorAll<HTMLElement>("#root .cell > *")) {
      const root = card.shadowRoot as ShadowRoot;
      const icons: Element[] = [];
      const walk = (n: ParentNode) =>
        n.querySelectorAll("*").forEach((e) => {
          if (e.tagName === "HA-SVG-ICON") icons.push(e);
          if (e.shadowRoot) walk(e.shadowRoot);
        });
      walk(root);
      for (const svg of icons) {
        // the icon element the card itself created (ha-icon or ha-state-icon)
        let host = svg;
        while (host.getRootNode() !== root) host = (host.getRootNode() as ShadowRoot).host;
        const s = svg.getBoundingClientRect(),
          h = host.getBoundingClientRect();
        if (!s.width || !h.width) continue;
        const parent = host.parentElement as HTMLElement;
        out.push({
          card: card.tagName.toLowerCase(),
          where: `${[host.tagName.toLowerCase(), ...host.classList].join(".")} in ${parent.tagName.toLowerCase()}.${[...parent.classList].join(".")}`,
          dx: s.left + s.width / 2 - (h.left + h.width / 2),
          dy: s.top + s.height / 2 - (h.top + h.height / 2),
        });
      }
    }
    return out;
  });
  // the cards drew icons in every place listed above: none may silently drop out of the check
  const has = (card: string, where: string) =>
    report.some((r) => r.card === card && r.where.startsWith(where));
  for (const [card, where] of [
    ["entity-card-pro", "ha-state-icon in button.round"],
    ["entity-group-card-pro", "ha-icon in div.header"],
    ["entity-group-card-pro", "ha-state-icon in div.row.hval"],
    ["entity-group-card-pro", "ha-state-icon in button.round"],
    ["entity-group-card-pro", "ha-state-icon in button.chip"],
    ["entity-group-card-pro", "ha-icon in button.round.hold"],
    ["entity-group-card-pro", "ha-state-icon in button.ctl.ctl-chip.round"],
    ["entity-group-card-pro", "ha-icon in button.ctl.ctl-hold"],
    ["entity-sections-card-pro", "ha-icon in div.header"],
    ["rain-card-pro", "ha-icon in div.chip"],
    ["wind-card-pro", "ha-icon.arrow in div.chip"],
    ["wind-card-pro", "ha-icon.arrow in div.shape"],
    ["weather-card-pro", "ha-icon in div.ficon"],
    ["power-flow-card-pro", "ha-icon in div.header"],
    ["sun-path-card-pro", "ha-icon in div.header"],
    ["illuminance-card-pro", "ha-icon in div.shape"],
    ["multi-trend-card-pro", "ha-icon in div.shape"],
  ])
    expect(has(card, where), `${card}: ${where}`).toBe(true);
  const off = report.filter((r) => Math.abs(r.dx) > 0.5 || Math.abs(r.dy) > 0.5);
  expect(off).toEqual([]);
});
