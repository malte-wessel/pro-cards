import { test, expect, mount } from "../e2e/util.ts";

// All snapshots: frozen clock (21 June 2026, 12:00 Europe/Berlin), 400 px section column, light and dark.
const EC = "custom:entity-card-pro",
  EGC = "custom:entity-group-card-pro",
  ESC = "custom:entity-sections-card-pro";
const rules = [
  { below: 16, color: "blue", icon: "mdi:snowflake", label: "Cold" },
  { below: 24, color: "green", icon: "mdi:thermometer", label: "Comfortable" },
  { above: 24, color: "orange", icon: "mdi:sun-thermometer", label: "Warm", tint_card: true },
];

const windRules = [
  { below: 5, color: "blue-grey", label: "Calm" },
  { below: 20, color: "teal", label: "Light breeze" },
  { below: 35, color: "amber", label: "Fresh" },
  { above: 35, color: "red", label: "Storm", tint_card: true },
];

const rainRules = [
  { below: 0.1, color: "blue-grey", label: "Dry" },
  { below: 2.5, color: "light-blue", label: "Light rain" },
  { below: 7.6, color: "blue", label: "Moderate rain" },
  { above: 7.6, color: "indigo", label: "Heavy rain", tint_card: true },
];

const PF = "custom:power-flow-card-pro";
const PF_SRC = [
  { type: "solar", entity: "sensor.solar_power" },
  { type: "battery", power: "sensor.battery_power", soc: "sensor.battery_soc" },
  {
    type: "grid",
    power: "sensor.grid_power",
    price: "sensor.electricity_price",
    offline: "binary_sensor.grid_outage",
    fossil: "sensor.grid_fossil_percentage",
  },
];
const PF_CONS = [
  {
    entity: "sensor.heat_pump_power",
    name: "Heat pump",
    icon: "mdi:heat-pump",
    secondary: "floor heating",
  },
  { entity: "sensor.ev_charger_power", name: "EV", icon: "mdi:car-electric" },
  { entity: "sensor.washer_power", name: "Washer", icon: "mdi:washing-machine" },
  { entity: "sensor.office_power", name: "Office", icon: "mdi:monitor" },
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
    type: "custom:multi-trend-card-pro",
    title: "Temperature & dew point",
    icon: "mdi:thermometer",
    hours_to_show: 12,
    entities: [
      { entity: "sensor.outdoor_temperature", name: "Temperature", color: "red" },
      { entity: "sensor.dew_point", name: "Dew point", color: "blue" },
    ],
  },
  "mtc-lanes-axes": {
    type: "custom:multi-trend-card-pro",
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
  "wc-tile": [
    { type: "custom:weather-card-pro", entity: "weather.home", grid_options: { columns: 6 } },
    {
      type: "custom:weather-card-pro",
      entity: "weather.home",
      name: "Garden",
      rules: [{ state: "partlycloudy", color: "amber", label: "Some sun", tint_card: true }],
      grid_options: { columns: 6 },
    },
  ],
  "wc-hero-rows": {
    type: "custom:weather-card-pro",
    entity: "weather.home",
    title: "Home",
    temperature_rules: [
      { below: 12, color: "blue", label: "Cool" },
      { below: 20, color: "green", label: "Mild" },
      { above: 20, color: "amber", label: "Warm" },
    ],
    sections: [
      { type: "hero" },
      {
        type: "row",
        entities: [
          "humidity",
          "wind_speed",
          { entity: "sensor.uv_index", name: "UV", visual: "ring", min: 0, max: 11 },
        ],
      },
      { type: "table", title: "More", entities: ["pressure", "dew_point", "visibility"] },
      { type: "grid", entities: ["humidity", "wind_speed"] },
    ],
  },
  "wc-trend": {
    type: "custom:weather-card-pro",
    entity: "weather.home",
    sections: [
      { type: "hero", name: "Garden" },
      {
        type: "trend",
        mode: "hourly",
        hours: 12,
        show: ["temperature", "precipitation", { quantity: "wind", name: "Breeze", color: "teal" }],
        y_axis: true,
      },
      { type: "trend", mode: "daily", days: 7, show: ["temperature", "precipitation"] },
      {
        type: "trend",
        mode: "hourly",
        hours: 6,
        show: ["temperature"],
        title: "Soon",
        temperature_rules: [{ above: 0, color: "red" }],
      },
    ],
  },
  "wc-forecast": {
    type: "custom:weather-card-pro",
    entity: "weather.home",
    temperature_rules: [
      { below: 12, color: "blue", label: "Cool" },
      { below: 20, color: "green", label: "Mild" },
      { above: 20, color: "amber", label: "Warm" },
    ],
    sections: [
      {
        type: "forecast",
        mode: "daily",
        days: 7,
        show: ["probability", "precipitation"],
        rules: [{ state: "rainy", color: "blue", icon: "mdi:umbrella" }],
      },
      { type: "forecast", mode: "daily", layout: "horizontal", days: 6 },
      { type: "forecast", mode: "hourly", layout: "horizontal", hours: 6 },
      { type: "forecast", mode: "hourly", hours: 4, title: "Soon" },
    ],
  },
  "wc-icons": {
    type: "custom:weather-card-pro",
    entity: "weather.home",
    sections: [
      { type: "hero", icon_size: 72 },
      { type: "forecast", mode: "daily", days: 5, icon_size: 32 },
      {
        type: "forecast",
        mode: "hourly",
        layout: "horizontal",
        hours: 6,
        icon_size: 36,
        icons: { sunny: "mdi:white-balance-sunny", partlycloudy: "mdi:weather-partly-cloudy" },
      },
    ],
  },
  "wic-tile": [
    {
      type: "custom:wind-card-pro",
      entity: "sensor.wind_speed",
      direction: "sensor.wind_direction",
      gust: "sensor.wind_gust",
      rules: windRules,
      grid_options: { columns: 6 },
    },
    {
      type: "custom:wind-card-pro",
      entity: "weather.home",
      title: "Wind",
      lead: "arrow",
      flow: { style: "lines" },
      grid_options: { columns: 6 },
    },
    {
      type: "custom:wind-card-pro",
      entity: "sensor.wind_speed",
      direction: "sensor.wind_direction",
      gust: "sensor.wind_gust",
      visual: "flow",
      rules: windRules,
    },
  ],
  "wic-flow": [
    {
      type: "custom:wind-card-pro",
      entity: "sensor.wind_speed",
      direction: "sensor.wind_direction",
      gust: "sensor.wind_gust",
      visual: "flow",
      rules: windRules,
      grid_options: { columns: 6 },
    },
    {
      type: "custom:wind-card-pro",
      entity: "sensor.wind_speed",
      direction: "sensor.wind_direction",
      gust: "sensor.wind_gust",
      visual: "flow",
      flow: { style: "lines" },
      rules: windRules,
      grid_options: { columns: 6 },
    },
    {
      type: "custom:wind-card-pro",
      entity: "sensor.wind_speed",
      direction: "sensor.wind_direction",
      gust: "sensor.wind_gust",
      visual: "flow",
      flow: { style: "swoosh" },
      rules: windRules,
      grid_options: { columns: 6 },
    },
    {
      type: "custom:wind-card-pro",
      entity: "sensor.wind_gust",
      direction: "sensor.wind_direction",
      visual: "flow",
      flow: { style: "vectors" },
      rules: [{ above: 0, color: "red", label: "Storm", tint_card: true }],
      grid_options: { columns: 6 },
    },
  ],
  "wic-hero": {
    type: "custom:wind-card-pro",
    entity: "sensor.wind_speed",
    direction: "sensor.wind_direction",
    gust: "sensor.wind_gust",
    title: "Wind",
    header_entities: [{ entity: "sensor.wind_gust", icon: "mdi:weather-windy", color: "orange" }],
    layout: "hero",
    flow: { style: "swoosh", height: 140, density: "dense" },
    rules: windRules,
  },
  "rc-tile": [
    {
      type: "custom:rain-card-pro",
      entity: "sensor.rain_rate_roof",
      today: "sensor.rain_today",
      rules: rainRules,
      grid_options: { columns: 6 },
    },
    {
      type: "custom:rain-card-pro",
      entity: "sensor.rain_rate_roof",
      today: "sensor.rain_today",
      title: "Rain",
      lead: "icon",
      flow: { style: "ripples" },
      grid_options: { columns: 6 },
    },
    {
      type: "custom:rain-card-pro",
      entity: "sensor.rain_rate_roof",
      today: "sensor.rain_today",
      wind: "sensor.wind_speed",
      direction: "sensor.wind_direction",
      visual: "flow",
      rules: rainRules,
    },
  ],
  "rc-flow": [
    {
      type: "custom:rain-card-pro",
      entity: "sensor.rain_rate_roof",
      today: "sensor.rain_today",
      wind: "sensor.wind_speed",
      direction: "sensor.wind_direction",
      visual: "flow",
      rules: rainRules,
      grid_options: { columns: 6 },
    },
    {
      type: "custom:rain-card-pro",
      entity: "sensor.rain_rate_roof",
      today: "sensor.rain_today",
      visual: "flow",
      flow: { style: "ripples" },
      rules: rainRules,
      grid_options: { columns: 6 },
    },
    {
      type: "custom:rain-card-pro",
      entity: "sensor.rain_rate_roof",
      today: "sensor.rain_today",
      visual: "flow",
      flow: { style: "fill" },
      rules: rainRules,
      grid_options: { columns: 6 },
    },
    {
      type: "custom:rain-card-pro",
      entity: "sensor.rain_rate",
      today: "sensor.rain_today",
      visual: "flow",
      rules: rainRules,
      grid_options: { columns: 6 },
    },
  ],
  "rc-hero": {
    type: "custom:rain-card-pro",
    entity: "sensor.rain_rate_roof",
    today: "sensor.rain_today",
    wind: "sensor.wind_speed",
    direction: "sensor.wind_direction",
    title: "Rain",
    header_entities: [{ entity: "sensor.rain_today", icon: "mdi:cup-water", color: "blue" }],
    layout: "hero",
    flow: { style: "fill", height: 140 },
    rules: rainRules,
  },
  "wc-everything": {
    type: "custom:weather-card-pro",
    entity: "weather.home",
    title: "Home",
    header_entities: [
      {
        entity: "sun.sun",
        attribute: "elevation",
        icon: "mdi:weather-sunset-down",
        color: "amber",
      },
    ],
    secondary: "feels like {{ state_attr('weather.home', 'apparent_temperature') }}°",
    rules: [{ state: "lightning-rainy", color: "red", label: "Storm warning", tint_card: true }],
    temperature_rules: [
      { below: 5, color: "blue", label: "Cold" },
      { below: 12, color: "cyan", label: "Cool" },
      { below: 20, color: "green", label: "Mild" },
      { above: 20, color: "amber", label: "Warm" },
    ],
    sections: [
      { type: "hero" },
      {
        type: "list",
        entities: [
          "humidity",
          "wind_speed",
          "pressure",
          {
            entity: "sensor.uv_index",
            name: "UV index",
            rules: [{ below: 3, color: "green", label: "Low" }],
          },
        ],
      },
      {
        type: "trend",
        mode: "hourly",
        hours: 12,
        show: ["temperature", "precipitation", "probability", "wind"],
      },
      { type: "forecast", mode: "daily", days: 7 },
      {
        type: "row",
        title: "Garden station",
        entities: [
          { entity: "sensor.outdoor_temperature", visual: "ring", min: -10, max: 40 },
          { entity: "sensor.outdoor_humidity", visual: "ring" },
        ],
      },
    ],
  },
  "spc-default": {
    type: "custom:sun-path-card-pro",
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
    type: "custom:sun-path-card-pro",
    show_dawn_dusk: false,
    day_color: "orange",
    night_color: "deep-purple",
    sun_color: "yellow",
    labels: { sunrise: "Rise", sunset: "Set" },
  },
  "saz-dial": {
    type: "custom:sun-azimuth-card",
    title: "Sun",
    icon: "mdi:sun-compass",
    house: { rotation: 20 },
  },
  "saz-3d": {
    type: "custom:sun-azimuth-card",
    title: "Sun",
    view: "3d",
    house: { rotation: 20, sides: { north: "Street", south: "Garden" } },
    camera: 150,
    camera_slider: true,
  },
  "saz-ring": {
    type: "custom:sun-azimuth-card",
    view: "ring",
    house: { rotation: 45 },
    sun_color: "orange",
    night_color: "deep-purple",
  },
  "saz-less": [
    {
      type: "custom:sun-azimuth-card",
      view: "3d",
      show_sides: false,
      show_house: false,
      grid_options: { columns: 6 },
    },
    {
      type: "custom:sun-azimuth-card",
      view: "ring",
      show_sides: false,
      grid_options: { columns: 6 },
    },
  ],
  "ilc-arc": {
    type: "custom:illuminance-card-pro",
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
    type: "custom:illuminance-card-pro",
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
    type: "custom:illuminance-card-pro",
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
  // power flow card: the demo noon (solar covers the home, charges the battery, exports the rest)
  "pf-compact": {
    type: PF,
    home: "sensor.power_consumption",
    expensive_above: 0.35,
    sources: PF_SRC,
  },
  "pf-consumers": {
    type: PF,
    title: "Energy",
    icon: "mdi:lightning-bolt",
    home: "sensor.power_consumption",
    sources: PF_SRC,
    consumers: PF_CONS,
  },
  // the controls: every kind in a tile, then every layout slot
  "ec-controls": [
    {
      type: EC,
      entity: "light.kitchen",
      control: "toggle",
      rules: [
        { state: "on", label: "On" },
        { state: "off", label: "Off" },
      ],
      grid_options: { columns: 6 },
    },
    { type: EC, entity: "light.living_room", control: "slider", grid_options: { columns: 6 } },
    { type: EC, entity: "climate.living_room", control: "stepper", grid_options: { columns: 6 } },
    {
      type: EC,
      entity: "climate.living_room",
      attribute: "hvac_mode",
      control: "segments",
      grid_options: { columns: 6 },
    },
    { type: EC, entity: "cover.office_blinds", control: "buttons", grid_options: { columns: 6 } },
    { type: EC, entity: "script.check_windows", control: "button", grid_options: { columns: 6 } },
    {
      type: EC,
      entity: "input_select.house_mode",
      control: "select",
      grid_options: { columns: 6 },
    },
    { type: EC, entity: "lock.front_door", control: "hold", grid_options: { columns: 6 } },
    {
      type: EC,
      entity: "light.desk_lamp",
      control: "toggle",
      control_position: "lead",
      grid_options: { columns: 6 },
    },
    {
      type: EC,
      entity: "switch.shed_heater",
      control: "toggle",
      grid_options: { columns: 6 },
    },
    {
      type: EC,
      entity: "cover.garage_door",
      control: "buttons",
      control_confirm: true,
      grid_options: { columns: 6 },
    },
    {
      type: EC,
      entity: "climate.living_room",
      attribute: "current_temperature",
      control: "segments",
      grid_options: { columns: 6 },
    },
  ],
  // every control greyed out while its entity is unavailable, small in a table
  // narrow: tiles a third of a section wide and a list at half width; a control that does not fit
  // beside the name wraps under it instead of spilling past the card
  "ec-controls-narrow": [
    ...[
      { entity: "light.living_room", name: "Living room ceiling light", control: "toggle" },
      { entity: "climate.living_room", control: "stepper" },
      { entity: "climate.living_room", attribute: "hvac_mode", control: "segments" },
      { entity: "cover.office_blinds", control: "buttons" },
      { entity: "input_select.house_mode", control: "select" },
      { entity: "media_player.kitchen_speaker", control: "slider", control_position: "end" },
      { entity: "lock.front_door", control: "hold" },
      { entity: "script.check_windows", control: "button" },
      { entity: "fan.living_room", control: "segments" },
    ].map((e) => ({ type: EC, ...e, grid_options: { columns: 4 } })),
    {
      type: EGC,
      title: "Half width",
      grid_options: { columns: 6 },
      entities: [
        { entity: "light.living_room", control: "auto" },
        { entity: "cover.living_room_blinds", control: "auto" },
        { entity: "climate.living_room", control: "auto" },
        { entity: "media_player.living_room_tv", control: "auto" },
      ],
    },
    {
      type: EGC,
      title: "Column",
      layout: "column",
      grid_options: { columns: 6 },
      entities: [
        { entity: "light.office", control: "toggle" },
        { entity: "cover.office_blinds", name: "Blinds", control: "auto" },
        { entity: "climate.living_room", control: "stepper" },
      ],
    },
  ],
  "egc-controls-unavailable": {
    type: EGC,
    title: "Unavailable",
    entities: [
      { entity: "light.shed", control: "auto" },
      { entity: "switch.shed_heater", control: "auto" },
      { entity: "climate.shed", control: "auto" },
      { entity: "cover.shed_door", control: "buttons" },
      { entity: "lock.shed", control: "auto" },
      { entity: "select.shed_program", control: "auto" },
      {
        entity: "climate.shed",
        name: "Shed modes",
        control: "segments",
        control_attribute: "hvac_mode",
      },
    ],
  },
  "egc-controls": [
    {
      type: EGC,
      title: "List",
      entities: [
        { entity: "light.living_room", control: "auto" },
        { entity: "cover.living_room_blinds", control: "auto" },
        { entity: "climate.living_room", control: "auto" },
        { entity: "lock.front_door", control: "auto" },
        { entity: "input_select.house_mode", control: "auto" },
        { entity: "script.check_windows", control: "auto" },
      ],
    },
    {
      type: EGC,
      title: "Grid",
      layout: "grid",
      columns: 2,
      entities: [
        { entity: "light.office", control: "auto" },
        { entity: "climate.bedroom", control: "stepper" },
        { entity: "fan.living_room", control: "segments" },
        { entity: "media_player.kitchen_speaker", control: "auto" },
      ],
    },
    {
      type: EGC,
      title: "Row",
      layout: "row",
      entities: [
        { entity: "scene.bright", control: "button" },
        { entity: "scene.dinner", control: "button" },
        { entity: "scene.good_night", control: "button" },
        { entity: "light.garden", control: "toggle" },
      ],
    },
    {
      type: EGC,
      title: "Column",
      layout: "column",
      entities: [
        { entity: "light.office", control: "toggle" },
        { entity: "climate.living_room", control: "stepper" },
        { entity: "cover.awning", control: "buttons" },
      ],
    },
    {
      type: EGC,
      title: "Table",
      layout: "table",
      show_icon: true,
      entities: [
        { entity: "climate.living_room", control: "stepper" },
        { entity: "fan.living_room", control: "segments" },
        { entity: "input_select.house_mode", control: "select" },
        { entity: "switch.garden_pump", control: "toggle" },
        { entity: "cover.garage_door", control: "hold" },
      ],
    },
  ],
  "pf-list": {
    type: PF,
    home: "sensor.power_consumption",
    sources: PF_SRC,
    consumers: PF_CONS,
    consumer_style: "list",
  },
  "pf-rooms": {
    type: PF,
    home: "sensor.power_consumption",
    sources: PF_SRC,
    consumers: [
      {
        group: "Laundry",
        icon: "mdi:washing-machine",
        entities: [
          { entity: "sensor.washer_power", name: "Washer", icon: "mdi:washing-machine" },
          { entity: "sensor.dryer_power", name: "Dryer", icon: "mdi:tumble-dryer" },
        ],
      },
      {
        group: "Kitchen",
        icon: "mdi:silverware-fork-knife",
        entities: [
          { entity: "sensor.range_hood_power", name: "Range hood", icon: "mdi:stove" },
          { entity: "sensor.dining_light_power", name: "Lights", icon: "mdi:lightbulb" },
        ],
      },
      { entity: "sensor.heat_pump_power", name: "Heat pump", icon: "mdi:heat-pump" },
    ],
  },
  "pf-down": {
    type: PF,
    home: "sensor.power_consumption",
    sources: PF_SRC,
    consumers: PF_CONS,
    direction: "down",
  },
  "pf-styles": [
    {
      type: PF,
      home: "sensor.power_consumption",
      sources: PF_SRC,
      flow_style: "lines",
      idle_links: "faint",
    },
    {
      type: PF,
      home: "sensor.power_consumption",
      sources: PF_SRC,
      flow_style: "arrows",
      idle_links: "hidden",
    },
  ],
  "pf-edge": [
    {
      // an outage (the demo outage sensor is off, so "off" means offline here) with a generator
      type: PF,
      home: "sensor.power_consumption",
      sources: [
        PF_SRC[0],
        PF_SRC[1],
        {
          type: "grid",
          power: "sensor.grid_power",
          offline: { entity: "binary_sensor.grid_outage", state: "off" },
          generator: "sensor.heat_pump_power",
        },
      ],
    },
    {
      type: PF,
      kw_above: 0,
      decimals: { kw: 1 },
      sources: [
        { type: "solar", entity: "sensor.solar_east", name: "East" },
        { type: "solar", entity: "sensor.solar_west", name: "West" },
        {
          type: "battery",
          power: "sensor.battery_power",
          soc: "sensor.battery_soc",
          secondary: "{{ states('sensor.battery_temperature') }} °C",
        },
        { type: "grid", power: "sensor.grid_power", fossil: "sensor.grid_fossil_percentage" },
      ],
      rules: [{ above: 1000, color: "amber", label: "Busy" }],
    },
  ],
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
