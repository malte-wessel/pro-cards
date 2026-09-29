import { test, expect, mount } from "../e2e/util.ts";

// All snapshots: frozen clock (21 June 2026, 12:00 Europe/Berlin), 400 px section column, light and dark.
const EC = "custom:entity-card",
  EGC = "custom:entity-group-card",
  ESC = "custom:entity-sections-card";
const rules = [
  { below: 16, color: "blue", icon: "mdi:snowflake", label: "Cold" },
  { below: 24, color: "green", icon: "mdi:thermometer", label: "Comfortable" },
  { above: 24, color: "orange", icon: "mdi:sun-thermometer", label: "Warm", tint_card: true },
];

const CASES = {
  "ec-visuals": [
    {
      type: EC,
      entity: "sensor.office_temperature",
      name: "Icon",
      decimals: 1,
      rules,
      grid_options: { columns: 6 },
    },
    {
      type: EC,
      entity: "sensor.robot_battery",
      name: "Ring",
      visual: "ring",
      rules: [
        { below: 20, color: "red" },
        { above: 20, color: "green" },
      ],
      grid_options: { columns: 6 },
    },
    {
      type: EC,
      entity: "sensor.power_consumption",
      name: "Gauge",
      visual: "gauge",
      min: 0,
      max: 3000,
      decimals: 0,
      rules: [
        { below: 500, color: "green" },
        { below: 1500, color: "amber" },
        { above: 1500, color: "red" },
      ],
      grid_options: { columns: 6 },
    },
    {
      type: EC,
      entity: "sensor.bathroom_humidity",
      name: "Bar",
      visual: "bar",
      decimals: 0,
      rules: [
        { below: 60, color: "green", label: "OK" },
        { above: 60, color: "amber", label: "Humid" },
      ],
      grid_options: { columns: 6 },
    },
    {
      type: EC,
      entity: "sensor.dew_point",
      name: "Sparkline",
      visual: "sparkline",
      hours_to_show: 12,
      decimals: 1,
      color: "purple",
      grid_options: { columns: 6 },
    },
    {
      type: EC,
      entity: "sensor.wind_gust",
      name: "Columns",
      visual: "columns",
      hours_to_show: 12,
      bucket_minutes: 30,
      decimals: 1,
      color: "teal",
      grid_options: { columns: 6 },
    },
    {
      type: EC,
      entity: "person.alex",
      name: "Badge",
      visual: "badge",
      rules: [
        { state: "home", color: "green", label: "Home" },
        { state: "not_home", color: "grey", label: "Away" },
      ],
      grid_options: { columns: 6 },
    },
    {
      type: EC,
      entity: "binary_sensor.rain",
      name: "Strip",
      visual: "strip",
      hours_to_show: 24,
      bucket_minutes: 30,
      rules: [
        { state: "on", color: "blue", label: "Rain" },
        { state: "off", color: "grey", label: "No rain" },
      ],
      grid_options: { columns: 6 },
    },
  ],
  "ec-tile-toggle": {
    type: EC,
    entity: "light.living_room",
    toggle: true,
    rules: [
      { state: "on", color: "amber", label: "On" },
      { state: "off", color: "grey", label: "Off" },
    ],
  },
  "egc-list": {
    type: EGC,
    layout: "list",
    title: "Living room",
    icon: "mdi:sofa",
    entities: [
      {
        entity: "light.living_room",
        toggle: true,
        rules: [
          { state: "on", color: "amber", label: "On" },
          { state: "off", color: "grey", label: "Off" },
        ],
      },
      { entity: "sensor.living_room_temperature", name: "Temperature", decimals: 1, rules },
      {
        entity: "sensor.living_room_co2",
        name: "CO₂",
        visual: "strip",
        rules: [
          { below: 800, color: "green" },
          { below: 1200, color: "amber" },
          { above: 1200, color: "red" },
        ],
      },
      {
        entity: "cover.living_room_blinds",
        name: "Blinds",
        attribute: "current_position",
        unit: "%",
        visual: "bar",
        icon: "mdi:window-shutter",
      },
      {
        entity: "media_player.living_room_tv",
        name: "TV",
        visual: "badge",
        rules: [{ state: "playing", color: "green", icon: "mdi:play-circle", label: "Playing" }],
      },
    ],
  },
  "egc-grid": {
    type: EGC,
    layout: "grid",
    title: "Air quality",
    icon: "mdi:air-filter",
    columns: 2,
    entities: [
      {
        entity: "sensor.living_room_co2",
        name: "Living room",
        visual: "gauge",
        min: 400,
        max: 2000,
        rules: [
          { below: 800, color: "green" },
          { below: 1200, color: "amber" },
          { above: 1200, color: "red" },
        ],
      },
      {
        entity: "sensor.office_co2",
        name: "Office",
        visual: "gauge",
        min: 400,
        max: 2000,
        rules: [
          { below: 800, color: "green" },
          { below: 1200, color: "amber" },
          { above: 1200, color: "red" },
        ],
      },
      {
        entity: "sensor.bathroom_humidity",
        name: "Bathroom",
        visual: "ring",
        rules: [
          { below: 60, color: "green" },
          { above: 60, color: "red" },
        ],
      },
      { entity: "sensor.solar_power", name: "Solar", visual: "columns" },
    ],
  },
  "egc-hero": {
    type: EGC,
    layout: "hero",
    title: "Weather station",
    icon: "mdi:weather-partly-cloudy",
    hours_to_show: 24,
    entities: [
      {
        entity: "sensor.outdoor_temperature",
        name: "Temperature",
        visual: "sparkline",
        decimals: 1,
        rules: [
          { below: 16, color: "blue", label: "Cool" },
          { below: 26, color: "green", label: "Pleasant" },
          { above: 26, color: "orange", label: "Hot", tint_card: true },
        ],
      },
      { entity: "sensor.outdoor_humidity", name: "Humidity", visual: "badge" },
      { entity: "sensor.wind_speed", name: "Wind", visual: "badge" },
      { entity: "sensor.pressure", name: "Pressure", visual: "badge", decimals: 0 },
      {
        entity: "sensor.uv_index",
        name: "UV index",
        visual: "bar",
        min: 0,
        max: 11,
        rules: [
          { below: 3, color: "green", label: "Low" },
          { below: 6, color: "amber", label: "Moderate" },
          { above: 6, color: "red", label: "High" },
        ],
      },
    ],
  },
  "esc-room-card": {
    type: ESC,
    title: "Living room",
    icon: "mdi:sofa",
    header_entities: [
      {
        entity: "sensor.living_room_temperature",
        decimals: 1,
        rules: [
          { below: 19, color: "blue" },
          { below: 25, color: "green" },
          { above: 25, color: "orange" },
        ],
      },
      { entity: "sensor.living_room_humidity", decimals: 0, show_icon: false },
    ],
    sections: [
      {
        layout: "row",
        align: "space-between",
        entities: [
          { entity: "light.living_room", name: "Light" },
          { entity: "light.dining_table", name: "Dining" },
          {
            entity: "cover.living_room_blinds",
            name: "Blinds",
            rules: [
              { state: "open", color: "green", icon: "mdi:window-shutter-open", label: "Open" },
              { state: "closed", color: "grey", icon: "mdi:window-shutter", label: "Closed" },
            ],
          },
          { entity: "media_player.living_room_tv", name: "TV", icon: "mdi:television" },
          { entity: "vacuum.robot", name: "Robot" },
        ],
      },
      {
        layout: "row",
        show_name: false,
        align: "end",
        entities: ["switch.coffee_machine", "switch.garden_pump"],
      },
    ],
  },
  "esc-device-card": {
    type: ESC,
    title: "Robot vacuum",
    icon: "mdi:robot-vacuum",
    sections: [
      {
        layout: "table",
        entities: [
          { entity: "vacuum.robot", name: "Status", attribute: "status" },
          { entity: "sensor.robot_battery", name: "Battery" },
          { entity: "sensor.robot_current_room", name: "Room" },
          { entity: "sensor.robot_last_area", name: "Last area" },
          { entity: "sensor.robot_total_cleanings", name: "Cleanings" },
        ],
      },
      {
        layout: "row",
        divider: true,
        show_name: false,
        align: "space-between",
        entities: [
          {
            entity: "sensor.robot_battery",
            rules: [
              { below: 20, color: "red", icon: "mdi:battery-alert" },
              { above: 20, color: "green", icon: "mdi:battery" },
            ],
          },
          { entity: "sensor.robot_dustbin_remaining", icon: "mdi:delete-outline" },
          {
            entity: "vacuum.robot",
            icon: "mdi:play",
            tap_action: {
              action: "perform-action",
              perform_action: "vacuum.start",
              target: { entity_id: "vacuum.robot" },
            },
          },
          {
            entity: "vacuum.robot",
            icon: "mdi:home",
            tap_action: {
              action: "perform-action",
              perform_action: "vacuum.return_to_base",
              target: { entity_id: "vacuum.robot" },
            },
          },
        ],
      },
    ],
  },
  "egc-row-column": [
    {
      type: EGC,
      layout: "row",
      title: "Climate",
      icon: "mdi:home-thermometer",
      show_name: false,
      show_value: true,
      entities: [
        { entity: "sensor.kitchen_temperature", decimals: 1 },
        { entity: "sensor.kitchen_humidity", decimals: 0 },
      ],
      grid_options: { columns: 6 },
    },
    {
      type: EGC,
      layout: "column",
      title: "Bedroom",
      icon: "mdi:bed",
      show_name: false,
      entities: [
        { entity: "light.bedroom", tap_action: { action: "toggle" } },
        { entity: "cover.bedroom_blinds", icon: "mdi:window-shutter" },
        { entity: "climate.bedroom", icon: "mdi:thermostat" },
      ],
      grid_options: { columns: 6 },
    },
  ],
  "ec-tinted": [
    {
      type: EC,
      entity: "sensor.switch_temperature",
      name: "Kitchen switch",
      visual: "ring",
      min: 20,
      max: 90,
      decimals: 0,
      rules: [
        { below: 50, color: "green", label: "Normal" },
        {
          above: 50,
          color: "amber",
          icon: "mdi:thermometer-alert",
          label: "Warm",
          tint_card: true,
        },
      ],
      grid_options: { columns: 6 },
    },
    {
      type: EC,
      entity: "sensor.motion_hallway_battery",
      name: "Hallway motion",
      visual: "bar",
      decimals: 0,
      rules: [
        { below: 20, color: "red", icon: "mdi:battery-alert", label: "Empty", tint_card: true },
        { above: 20, color: "green" },
      ],
      grid_options: { columns: 6 },
    },
    {
      type: EC,
      entity: "sensor.does_not_exist",
      name: "Missing entity",
      grid_options: { columns: 6 },
    },
    {
      type: EC,
      entity: "sensor.energy_today",
      name: "Long name that will be truncated with an ellipsis",
      suffix: " today",
      grid_options: { columns: 6 },
    },
  ],
  "mtc-overlay": {
    type: "custom:multi-trend-card",
    title: "Temperature & dew point",
    icon: "mdi:thermometer",
    hours_to_show: 12,
    entities: [
      { entity: "sensor.outdoor_temperature", name: "Temperature", color: "red" },
      { entity: "sensor.dew_point", name: "Dew point", color: "blue" },
    ],
  },
  "mtc-lanes-axes": {
    type: "custom:multi-trend-card",
    title: "Wind & pressure",
    icon: "mdi:weather-windy",
    color: "teal",
    hours_to_show: 24,
    x_axis: true,
    y_axis: true,
    entities: [
      { entity: "sensor.wind_speed", name: "Speed", color: "teal" },
      { entity: "sensor.pressure", name: "Pressure", color: "purple" },
    ],
  },
  "spc-default": {
    type: "custom:sun-path-card",
    title: "Sun today",
    labels: {
      sunrise: "Sunrise",
      sunset: "Sunset",
      dawn: "Dawn",
      noon: "Solar noon",
      dusk: "Dusk",
    },
  },
  "spc-custom": {
    type: "custom:sun-path-card",
    show_dawn_dusk: false,
    day_color: "orange",
    night_color: "deep-purple",
    sun_color: "yellow",
    labels: { sunrise: "Rise", sunset: "Set" },
  },
  "ilc-arc": {
    type: "custom:illuminance-card",
    entity: "sensor.illuminance",
    mode: "arc",
    name: "Outdoor light",
    zones: {
      night: { label: "Night" },
      twilight: { label: "Twilight" },
      overcast: { label: "Overcast" },
      day: { label: "Day" },
      sun: { label: "Sun" },
    },
  },
  "ilc-trend": {
    type: "custom:illuminance-card",
    entity: "sensor.illuminance",
    mode: "trend",
    name: "Outdoor light",
    zones: {
      night: { label: "Night" },
      twilight: { label: "Twilight" },
      overcast: { label: "Overcast" },
      day: { label: "Day" },
      sun: { label: "Sun" },
    },
  },
  "ilc-band": {
    type: "custom:illuminance-card",
    entity: "sensor.illuminance",
    mode: "band",
    name: "Outdoor light",
    hours_to_show: 24,
    bucket_minutes: 30,
    zones: {
      night: { label: "Night" },
      twilight: { label: "Twilight" },
      overcast: { label: "Overcast" },
      day: { label: "Day" },
      sun: { label: "Sun" },
    },
  },
};

for (const [name, cfg] of Object.entries(CASES)) {
  for (const theme of ["light", "dark"]) {
    test(`${name} (${theme})`, async ({ page }) => {
      await mount(page, cfg, { theme });
      // fonts + icons settled: every ha-icon has a path, then one more frame
      await page.waitForFunction(() =>
        [...document.querySelectorAll("*")].every(
          (e) =>
            !e.shadowRoot ||
            [...e.shadowRoot.querySelectorAll("ha-icon")].every(
              (i) => (i.shadowRoot?.querySelector("path")?.getAttribute("d") || "").length > 5,
            ),
        ),
      );
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(150);
      await expect(page.locator("#root")).toHaveScreenshot(`${name}-${theme}.png`);
    });
  }
}
