export const PRESETS: Record<string, string> = {
  "Tile with rules": `type: custom:entity-card
entity: sensor.living_room_temperature
name: Living room
decimals: 1
rules:
  - { below: 19, color: blue, icon: mdi:snowflake, label: Too cold }
  - { below: 24, color: green, icon: mdi:thermometer, label: Comfortable }
  - { above: 24, color: orange, icon: mdi:sun-thermometer, label: Warm, tint_card: true }
`,
  "Hero with sparkline": `type: custom:entity-group-card
title: Weather station
icon: mdi:weather-partly-cloudy
layout: hero
hours_to_show: 24
entities:
  - entity: sensor.outdoor_temperature
    name: Temperature
    decimals: 1
    visual: sparkline
    rules:
      - { below: 0, color: indigo, icon: mdi:snowflake, label: Frost, tint_card: true }
      - { below: 16, color: blue, icon: mdi:thermometer-low, label: Cool }
      - { below: 26, color: green, icon: mdi:thermometer, label: Pleasant }
      - { above: 26, color: orange, icon: mdi:thermometer-high, label: Hot, tint_card: true }
  - { entity: sensor.outdoor_humidity, name: Humidity, visual: badge }
  - { entity: sensor.wind_speed, name: Wind, visual: badge }
  - { entity: sensor.pressure, name: Pressure, decimals: 0, visual: badge }
  - entity: sensor.uv_index
    name: UV index
    visual: bar
    min: 0
    max: 11
    rules:
      - { below: 3, color: green, label: Low }
      - { below: 6, color: amber, label: Moderate }
      - { below: 8, color: orange, label: High }
      - { above: 8, color: red, label: Very high }
`,
  "List with toggles": `type: custom:entity-group-card
title: Living room
icon: mdi:sofa
entities:
  - entity: light.living_room
    rules:
      - { state: "on", color: amber, label: "On" }
      - { state: "off", color: grey, label: "Off" }
    toggle: true
  - entity: light.dining_table
    rules:
      - { state: "on", color: amber, label: "On" }
      - { state: "off", color: grey, label: "Off" }
    toggle: true
  - entity: cover.living_room_blinds
    icon: mdi:window-shutter
    attribute: current_position
    unit: "%"
    visual: bar
  - entity: media_player.living_room_tv
    visual: badge
    rules:
      - { state: playing, color: green, icon: mdi:play-circle, label: Playing }
      - { state: idle, color: grey, label: Idle }
`,
  "Grid with gauges": `type: custom:entity-group-card
title: Air quality
icon: mdi:air-filter
layout: grid
columns: 2
entities:
  - entity: sensor.living_room_co2
    name: Living room
    visual: gauge
    min: 400
    max: 2000
    rules:
      - { below: 800, color: green }
      - { below: 1200, color: amber }
      - { above: 1200, color: red }
  - entity: sensor.office_co2
    name: Office
    visual: gauge
    min: 400
    max: 2000
    rules:
      - { below: 800, color: green }
      - { below: 1200, color: amber }
      - { above: 1200, color: red }
  - entity: sensor.bathroom_humidity
    name: Bathroom
    visual: ring
    rules:
      - { below: 60, color: green }
      - { above: 60, color: red }
  - { entity: sensor.solar_power, name: Solar today, visual: columns }
`,
  "Template value": `type: custom:entity-card
entity: light.living_room
name: Lights on
icon: mdi:lightbulb-group
color: amber
value: "{{ states.light | selectattr('state', 'eq', 'on') | list | count }} of {{ states.light | list | count }}"
`,
  "Multi trend card": `type: custom:multi-trend-card
title: Temperature & dew point
icon: mdi:thermometer
hours_to_show: 12
x_axis: true
y_axis: true
entities:
  - { entity: sensor.outdoor_temperature, name: Temperature, color: red }
  - { entity: sensor.dew_point, name: Dew point, color: blue }
`,
  "Sun path card": `type: custom:sun-path-card
title: Sun today
show_dawn_dusk: true
labels: { sunrise: Sunrise, sunset: Sunset, dawn: Dawn, noon: Solar noon, dusk: Dusk }
`,
  "Illuminance card": `type: custom:illuminance-card
entity: sensor.illuminance
mode: trend
name: Outdoor light
zones: { night: { label: Night }, twilight: { label: Twilight }, overcast: { label: Overcast }, day: { label: Day }, sun: { label: Sun } }
`,
  "Weather card": `type: custom:weather-card
entity: weather.home
title: Home
temperature_rules:
  - { below: 12, color: blue, label: Cool }
  - { below: 20, color: green, label: Mild }
  - { above: 20, color: amber, label: Warm }
sections:
  - { type: hero }
  - { type: row, entities: [humidity, wind_speed, pressure] }
  - { type: trend, mode: hourly, hours: 12 }
  - { type: forecast, mode: daily, days: 7 }
`,
  "Wind card": `type: custom:wind-card
entity: sensor.wind_speed
direction: sensor.wind_direction
gust: sensor.wind_gust
title: Wind
layout: hero
rules:
  - { below: 5, color: blue-grey, label: Calm }
  - { below: 20, color: teal, label: Light breeze }
  - { below: 35, color: amber, label: Fresh }
  - { below: 50, color: orange, label: Strong }
  - { above: 50, color: red, label: Storm, tint_card: true }
`,
};
