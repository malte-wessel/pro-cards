export const PRESETS: Record<string, string> = {
  "Tile Card Pro": `type: custom:tile-card-pro
entity: light.living_room
`,
  "Poster Card Pro": `type: custom:poster-card-pro
entity: sensor.wind_speed
name: Wind
visual: { type: flow, variant: lines }
`,
  "Layout Card Pro": `type: custom:layout-card-pro
columns: 2
cards:
  - type: custom:poster-card-pro
    entity: weather.home
    name: Outside
  - type: custom:poster-card-pro
    entity: climate.living_room
  - type: custom:tile-card-pro
    entity: light.kitchen
    view_layout: { span: 2 }
`,
  "Swipe Card Pro": `type: custom:swipe-card-pro
per_page: 1.5
cards:
  - type: custom:poster-card-pro
    entity: light.living_room
  - type: custom:poster-card-pro
    entity: fan.living_room
  - type: custom:poster-card-pro
    entity: media_player.living_room_speaker
`,
  "Tile with rules": `type: custom:tile-card-pro
entity: sensor.living_room_temperature
name: Living room
decimals: 1
visual: { type: sparkline, hours: 12 }
rules:
  - { below: 19, color: blue, icon: mdi:snowflake, status: Too cold }
  - { below: 24, color: green, icon: mdi:thermometer, status: Comfortable }
  - { above: 24, color: orange, icon: mdi:sun-thermometer, status: Warm, tint_card: true }
`,
  "Poster over a tile group": `type: custom:layout-card-pro
card_style: seamless
cards:
  - type: custom:poster-card-pro
    entity: sensor.outdoor_temperature
    name: Weather station
    decimals: 1
    visual: { type: sparkline, hours: 24 }
    rules:
      - { below: 0, color: indigo, icon: mdi:snowflake, status: Frost, tint_card: true }
      - { below: 16, color: blue, icon: mdi:thermometer-low, status: Cool }
      - { below: 26, color: green, icon: mdi:thermometer, status: Pleasant }
      - { above: 26, color: orange, icon: mdi:thermometer-high, status: Hot }
  - type: custom:tile-group-card-pro
    tiles:
      - { entity: sensor.outdoor_humidity, name: Humidity }
      - { entity: sensor.wind_speed, name: Wind }
      - entity: sensor.uv_index
        name: UV index
        visual: bar
        min: 0
        max: 11
        rules:
          - { below: 3, color: green, status: Low }
          - { below: 6, color: amber, status: Moderate }
          - { below: 8, color: orange, status: High }
          - { above: 8, color: red, status: Very high }
`,
  "Tile group with controls": `type: custom:tile-group-card-pro
title: Living room
icon: mdi:sofa
badges:
  - sensor.living_room_temperature
tiles:
  - light.living_room
  - { entity: light.dining_table, control: slider }
  - cover.living_room_blinds
  - media_player.living_room_speaker
`,
  "Tile group as a table": `type: custom:tile-group-card-pro
layout: table
title: Washing machine
icon: mdi:washing-machine
tiles:
  - entity: sensor.washer_status
    name: Status
    show_value: false
    rules:
      - { state: run, color: green, status: Running }
      - { state: end, color: teal, status: Done }
  - { entity: sensor.washer_remaining, name: Remaining }
  - { entity: sensor.washer_power, name: Power, visual: sparkline }
  - { entity: switch.coffee_machine, name: Coffee machine }
`,
  "Posters with gauges": `type: custom:layout-card-pro
columns: 2
cards:
  - { type: custom:poster-card-pro, entity: sensor.living_room_co2, name: Living room, visual: gauge }
  - { type: custom:poster-card-pro, entity: sensor.office_co2, name: Office, visual: gauge }
  - { type: custom:poster-card-pro, entity: sensor.bathroom_humidity, name: Bathroom, visual: gauge, min: 0, max: 100 }
  - { type: custom:poster-card-pro, entity: sensor.solar_power, kind: solar, name: Solar, visual: columns }
`,
  "Template value": `type: custom:tile-card-pro
entity: light.living_room
name: Lights on
icon: mdi:lightbulb-group
color: amber
control: false
value: "{{ states.light | selectattr('state', 'eq', 'on') | list | count }} of {{ states.light | list | count }}"
`,
  "Heading card": `type: custom:heading-card-pro
title: Living room
icon: mdi:sofa
badges:
  - sensor.living_room_temperature
  - { entity: sensor.power_consumption, visual: sparkline, format: power }
  - { entity: light.living_room, control: toggle }
`,
  "Multi trend card": `type: custom:multi-trend-card-pro
title: Temperature & dew point
icon: mdi:thermometer
hours: 12
x_axis: true
y_axis: true
entities:
  - { entity: sensor.outdoor_temperature, name: Temperature, color: red }
  - { entity: sensor.dew_point, name: Dew point, color: blue }
`,
  "Sun path card": `type: custom:sun-path-card-pro
title: Sun today
show_dawn_dusk: true
labels: { sunrise: Sunrise, sunset: Sunset, dawn: Dawn, noon: Solar noon, dusk: Dusk }
`,
  "Sun azimuth card": `type: custom:sun-azimuth-card-pro
title: Sun
house: { front: 20, sides: { front: Street, back: Garden } }
show_sun_times: true
show_sides: true
`,
  "Weather card": `type: custom:weather-card-pro
entity: weather.home
title: Home
temperature_rules:
  - { below: 12, color: blue, status: Cool }
  - { below: 20, color: green, status: Mild }
  - { above: 20, color: amber, status: Warm }
sections:
  - { type: hero }
  - { type: trend, mode: hourly, hours: 12 }
  - { type: forecast, mode: daily, days: 7 }
`,
  "Rain poster": `type: custom:poster-card-pro
entity: sensor.rain_rate_roof
name: Rain
visual: { type: flow, variant: drops }
inputs: { wind: sensor.wind_speed, direction: sensor.wind_direction }
`,
  "Power flow card": `type: custom:power-flow-card-pro
title: Energy
icon: mdi:lightning-bolt
home: sensor.power_consumption
sources:
  - { type: solar, entity: sensor.solar_power }
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
  - { type: grid, power: sensor.grid_power, price: sensor.electricity_price }
consumers:
  - { entity: sensor.heat_pump_power, name: Heat pump, icon: mdi:heat-pump }
  - { entity: sensor.washer_power, name: Washer, icon: mdi:washing-machine }
  - { entity: sensor.office_power, name: Office, icon: mdi:monitor }
`,
  "Energy flow card": `type: custom:energy-flow-card-pro
title: Today
icon: mdi:calendar-today
period: today
home: sensor.home_energy
sources:
  - { type: solar, entity: sensor.solar_energy }
  - { type: battery, charge: sensor.battery_charge_energy, discharge: sensor.battery_discharge_energy, soc: sensor.battery_soc }
  - { type: grid, import: sensor.grid_import_energy, export: sensor.grid_export_energy }
consumers:
  - { entity: sensor.heat_pump_energy, name: Heat pump, icon: mdi:heat-pump }
  - { entity: sensor.washer_energy, name: Washer, icon: mdi:washing-machine }
  - { entity: sensor.office_energy, name: Office, icon: mdi:monitor }
`,
  "Wind poster": `type: custom:poster-card-pro
entity: sensor.wind_speed
name: Wind
visual: { type: flow, variant: swoosh }
`,
};
