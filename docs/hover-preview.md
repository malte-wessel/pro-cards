---
pageClass: wide
---

<!-- Temporary page to review `hover: true` across the cards; remove before the release. -->

# Hover preview

Every card on this page sets `hover: true`. Hover a row, a tile, a cell, an icon, a control or a header to see the layer; press to see the pressed state. The examples are taken from the card pages; only `hover: true` is added.

## Side by side

The same tiles without and with `hover`.

::: live

```yaml
- type: custom:entity-card-pro
  entity: light.kitchen
  name: Without hover
  control: toggle
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: light.kitchen
  name: With hover
  control: toggle
  hover: true
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: light.hallway
  name: Lead · without hover
  control: toggle
  control_position: lead
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: light.hallway
  name: Lead · with hover
  control: toggle
  control_position: lead
  hover: true
  grid_options: { columns: 6 }
```

:::

## Per entity

`hover` on the card is the default for its entities; an entity's own `hover` wins.

::: live

```yaml
- type: custom:entity-group-card-pro
  title: Living room · all but the thermostat
  icon: mdi:sofa
  hover: true
  entities:
    - { entity: light.living_room, control: auto }
    - { entity: cover.living_room_blinds, control: auto }
    - { entity: climate.living_room, control: auto, hover: false }
- type: custom:entity-group-card-pro
  title: Kitchen · the lights only
  icon: mdi:silverware-fork-knife
  layout: row
  entities:
    - { entity: light.kitchen, name: Light, tap_action: { action: toggle }, hover: true }
    - { entity: light.dining_table, name: Dining, tap_action: { action: toggle }, hover: true }
    - { entity: fan.living_room, name: Fan, tap_action: { action: toggle } }
- type: custom:entity-sections-card-pro
  title: Sections · only the second
  icon: mdi:view-split-horizontal
  sections:
    - layout: grid
      entities: [light.office, light.desk_lamp]
    - layout: grid
      hover: true
      entities: [light.bedroom, light.attic]
```

:::

## Controls

From [Controls](/cards/controls). Every control: hover a button, a segment, a chip, the switch, the select or the slider; hold buttons and lead toggles too. Over a control the row keeps still.

::: live

```yaml
type: custom:entity-group-card-pro
hover: true
title: Living room
icon: mdi:sofa
entities:
  - { entity: light.living_room, name: Ceiling, control: auto }
  - { entity: light.desk_lamp, name: Desk lamp, control: auto }
  - { entity: climate.living_room, name: Radiator, control: auto }
  - { entity: cover.living_room_blinds, name: Blinds, control: auto }
  - { entity: media_player.living_room_tv, name: TV, control: auto }
  - { entity: input_select.house_mode, control: auto }
  - { entity: script.check_windows, name: Night routine, control: auto }
```

:::

::: live

```yaml
- type: custom:entity-card-pro
  hover: true
  entity: light.kitchen
  control: toggle
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  hover: true
  entity: light.hallway
  name: Hallway · tap the icon
  control: toggle
  control_position: lead
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  hover: true
  entity: input_boolean.night_mode
  rules:
    - { state: "on", color: indigo, icon: mdi:weather-night, label: Active }
    - { state: "off", color: grey, icon: mdi:weather-sunny, label: Inactive }
  control: toggle
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  hover: true
  entity: switch.garden_pump
  control: toggle
  control_confirm: true
  grid_options: { columns: 6 }
```

:::

::: live

```yaml
- type: custom:entity-card-pro
  hover: true
  entity: light.dining_table
  value: "{{ (state_attr('light.dining_table', 'brightness') | float(0) / 2.55) | round }}"
  unit: "%"
  control: slider
  color: amber
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  hover: true
  entity: cover.office_blinds
  attribute: current_position
  unit: "%"
  control: slider
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  hover: true
  entity: input_number.target_humidity
  control: slider
  rules:
    - { below: 45, color: amber, label: Dry }
    - { below: 60, color: green, label: Comfort }
    - { above: 60, color: blue, label: Humid }
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  hover: true
  entity: media_player.kitchen_speaker
  control: slider
  control_position: end
  grid_options: { columns: 6 }
```

:::

::: live

```yaml
type: custom:entity-group-card-pro
hover: true
title: Setpoints
icon: mdi:thermostat
entities:
  - { entity: climate.living_room, name: Living room, attribute: current_temperature, secondary: "now", control: stepper }
  - { entity: climate.bedroom, name: Bedroom, control: stepper, control_step: 1 }
  - { entity: input_number.heating_boost, control: stepper }
  - { entity: number.ev_charge_limit, control: stepper }
```

:::

::: live

```yaml
type: custom:entity-group-card-pro
hover: true
title: Modes
icon: mdi:tune
entities:
  - { entity: climate.living_room, name: Heating, attribute: hvac_mode, control: segments }
  - entity: climate.bedroom
    name: Preset
    attribute: preset_mode
    control: segments
    control_options:
      - { value: eco, label: Eco, icon: mdi:leaf }
      - { value: comfort, label: Comfort, icon: mdi:sofa }
      - { value: boost, label: Boost, icon: mdi:fire }
  - { entity: fan.living_room, name: Fan speed, control: segments }
  - { entity: climate.living_room, name: Now, attribute: current_temperature, control: segments, control_attribute: hvac_mode }
```

:::

::: live

```yaml
type: custom:entity-group-card-pro
hover: true
title: Buttons
icon: mdi:gesture-tap-button
entities:
  - { entity: cover.bedroom_blinds, name: Bedroom blinds, control: buttons }
  - { entity: cover.garage_door, control: buttons }
  - { entity: media_player.living_room_tv, name: TV, attribute: media_title, control: buttons }
```

:::

::: live

```yaml
type: custom:entity-group-card-pro
hover: true
title: Living room
icon: mdi:sofa
entities:
  - name: Scenes
    icon: mdi:palette
    control: buttons
    control_options:
      - { entity: scene.bright, color: amber }
      - { entity: scene.dinner, color: orange }
      - { entity: scene.movie_night, color: deep-purple }
      - { entity: scene.good_night, color: indigo }
  - entity: light.living_room
    name: Lights
    control: buttons
    control_options:
      - { entity: light.living_room, label: Ceiling, color: amber }
      - { entity: light.desk_lamp, label: Desk, color: orange }
      - { entity: switch.coffee_machine, label: Coffee, icon: mdi:coffee, color: brown }
  - name: Routines
    icon: mdi:script-text-outline
    control_position: block
    control: buttons
    control_options:
      - { entity: script.check_windows, label: Windows, color: teal }
      - { entity: scene.dimmed, label: Dimmed, color: deep-orange }
      - { icon: mdi:cog, label: Settings, action: { action: navigate, navigation_path: /config } }
```

:::

::: live

```yaml
- type: custom:entity-group-card-pro
  hover: true
  title: Actions
  icon: mdi:play-circle-outline
  entities:
    - { entity: script.check_windows, control: button }
    - { entity: scene.movie_night, control: button, color: deep-purple }
    - { entity: input_button.ring_doorbell, control: button }
  grid_options: { columns: 6 }
- type: custom:entity-group-card-pro
  hover: true
  title: Scenes
  icon: mdi:palette
  layout: row
  entities:
    - { entity: scene.bright, control: button, color: amber }
    - { entity: scene.dinner, control: button, color: orange }
    - { entity: scene.good_night, control: button, color: indigo }
    - { entity: script.check_windows, name: Windows, control: button, color: teal }
  grid_options: { columns: 6 }
```

:::

::: live

```yaml
type: custom:entity-group-card-pro
hover: true
title: Helpers
icon: mdi:format-list-bulleted
layout: table
entities:
  - { entity: input_select.house_mode, control: select }
  - { entity: select.thermostat_schedule, control: select }
```

:::

::: live

```yaml
- type: custom:entity-card-pro
  hover: true
  entity: lock.front_door
  control: hold
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  hover: true
  entity: cover.garage_door
  control: buttons
  control_confirm: true
  grid_options: { columns: 6 }
```

:::

::: live

```yaml
type: custom:entity-group-card-pro
hover: true
title: Grid
icon: mdi:home
layout: grid
columns: 2
entities:
  - entity: light.living_room
    name: Sofa lamp
    value: "{{ (state_attr('light.living_room', 'brightness') | float(0) / 2.55) | round }}"
    unit: "%"
    control: auto
  - { entity: climate.bedroom, name: Bedroom, control: stepper }
  - { entity: cover.living_room_blinds, name: Blinds, attribute: current_position, unit: "%", control: auto }
  - { entity: fan.living_room, name: Ceiling fan, attribute: percentage, unit: "%", control: segments }
  - { entity: media_player.kitchen_speaker, name: Speaker, attribute: media_title, control: auto }
  - { entity: lock.front_door, control: hold }
```

:::

::: live

```yaml
- type: custom:entity-group-card-pro
  hover: true
  title: Row · tap the icons
  icon: mdi:lightbulb-group
  layout: row
  entities:
    - { entity: light.living_room, name: Ceiling, control: toggle }
    - { entity: light.desk_lamp, name: Desk, control: toggle }
    - { entity: light.kitchen, name: Kitchen, control: toggle }
    - { entity: light.garden, name: Garden, control: toggle }
    - { entity: switch.coffee_machine, name: Coffee, control: toggle }
  grid_options: { columns: 6 }
- type: custom:entity-group-card-pro
  hover: true
  title: Column
  icon: mdi:view-sequential
  layout: column
  entities:
    - { entity: light.office, name: Office, control: toggle }
    - { entity: fan.bedroom, name: Fan, control: toggle }
    - { entity: climate.living_room, name: Radiator, control: stepper }
    - { entity: cover.awning, name: Awning, attribute: current_position, unit: "%", control: buttons }
  grid_options: { columns: 6 }
```

:::

::: live

```yaml
type: custom:entity-group-card-pro
hover: true
title: Settings
icon: mdi:tune
layout: table
show_icon: true
entities:
  - { entity: climate.living_room, name: Target, control: stepper }
  - { entity: fan.living_room, name: Ventilation, control: segments }
  - { entity: input_select.house_mode, name: Mode, control: select }
  - { entity: light.desk_lamp, name: Night light, show_value: false, control: slider }
  - { entity: switch.garden_pump, name: Pump, control: toggle }
  - { entity: input_number.heating_boost, name: Boost, control: stepper }
  - { entity: cover.garage_door, name: Garage, control: hold }
```

:::

::: live

```yaml
type: custom:entity-sections-card-pro
hover: true
title: Living room
icon: mdi:sofa
header_entities:
  - { entity: sensor.living_room_temperature, decimals: 1 }
  - { entity: sensor.living_room_humidity, decimals: 0 }
sections:
  - layout: hero
    entities:
      - entity: light.living_room
        name: Lights
        value: "{{ (state_attr('light.living_room', 'brightness') | float(0) / 2.55) | round }}"
        unit: "%"
        control: auto
  - layout: grid
    divider: true
    entities:
      - { entity: climate.living_room, name: Climate, control: stepper }
      - { entity: cover.living_room_blinds, name: Blinds, attribute: current_position, unit: "%", control: auto }
  - layout: row
    divider: true
    entities:
      - { entity: scene.movie_night, name: Movie, control: button, color: deep-purple }
      - { entity: scene.bright, name: Bright, control: button, color: amber }
      - { entity: scene.good_night, name: Night, control: button, color: indigo }
      - { entity: media_player.living_room_tv, name: TV, control: toggle }
  - layout: table
    divider: true
    entities:
      - { entity: fan.living_room, name: Ventilation, control: segments }
      - { entity: input_select.house_mode, name: Mode, control: select }
```

:::

::: live

```yaml
type: custom:entity-group-card-pro
hover: true
title: States
icon: mdi:gesture-tap-hold
entities:
  - { entity: light.attic, name: Pending · tap or drag, control: auto }
  - { entity: lock.garage_side_door, name: Pending · hold to lock, control: hold }
  - { entity: switch.shed_heater, name: Unavailable · offline, control: toggle }
```

:::

## Entity card

From [Entity card](/cards/entity-card). Tiles reach the card's edges; the icon of a lead toggle brightens and grows when pressed.

::: live

```yaml
type: custom:entity-card-pro
hover: true
entity: vacuum.robot
name: Robot vacuum
rules:
  - { state: docked, color: green, label: Docked }
  - { state: cleaning, color: blue, label: Cleaning }
  - { state: returning, color: teal, label: Returning }
  - { state: paused, color: amber, label: Paused }
  - { state: error, color: red, label: Error }
```

:::

::: live

```yaml
- type: custom:entity-card-pro
  hover: true
  entity: light.living_room
  rules:
    - { state: "on", color: amber, label: "On" }
    - { state: "off", color: grey, label: "Off" }
  control: auto
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  hover: true
  entity: switch.coffee_machine
  control: toggle
  grid_options: { columns: 6 }
```

:::

::: live

```yaml
type: custom:entity-card-pro
hover: true
entity: sensor.robot_battery
name: Robot battery
visual: ring
rules:
  - { below: 20, color: red, label: Replace }
  - { below: 50, color: amber }
  - { above: 50, color: green }
```

:::

::: live

```yaml
- type: custom:entity-card-pro
  hover: true
  entity: sensor.switch_temperature
  name: Kitchen switch
  decimals: 0
  visual: ring
  min: 20
  max: 90
  rules:
    - { below: 50, color: green, icon: mdi:chip, label: Normal }
    - { below: 70, color: amber, icon: mdi:thermometer-alert, label: Warm, tint_card: true }
    - { above: 70, color: red, icon: mdi:fire-alert, label: Hot, tint_card: true }
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  hover: true
  entity: sensor.motion_hallway_battery
  name: Hallway motion
  decimals: 0
  visual: bar
  rules:
    - { below: 20, color: red, icon: mdi:battery-alert, label: Empty, tint_card: true }
    - { below: 50, color: amber, icon: mdi:battery-50, label: Half }
    - { above: 50, color: green, icon: mdi:battery, label: Full }
  grid_options: { columns: 6 }
```

:::

::: live

```yaml
- type: custom:entity-card-pro
  hover: true
  entity: light.living_room
  name: Brightness
  icon: mdi:brightness-6
  color: amber
  attribute: brightness
  unit: ""
  visual: bar
  min: 0
  max: 255
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  hover: true
  entity: cover.office_blinds
  name: Blind position
  icon: mdi:window-shutter
  attribute: current_position
  unit: "%"
  visual: ring
  rules:
    - { below: 30, color: grey }
    - { above: 30, color: amber }
  grid_options: { columns: 6 }
```

:::

::: live

```yaml
- type: custom:entity-card-pro
  hover: true
  entity: scene.movie_night
  name: Movie night
  value: Activate
  icon: mdi:movie-open
  color: deep-purple
  tap_action: { action: perform-action, perform_action: scene.turn_on, target: { entity_id: scene.movie_night } }
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  hover: true
  entity: light.living_room
  name: Sofa lamp
  rules:
    - { state: "on", color: amber, label: "On" }
    - { state: "off", color: grey, label: "Off" }
  tap_action: { action: toggle }
  hold_action: { action: more-info }
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  hover: true
  entity: sensor.energy_today
  name: Energy dashboard
  icon: mdi:open-in-app
  color: teal
  value: Open
  tap_action: { action: navigate, navigation_path: /energy }
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  hover: true
  entity: script.check_windows
  name: Check windows
  icon: mdi:play-circle-outline
  color: blue
  value: Run
  tap_action:
    action: perform-action
    perform_action: script.turn_on
    target: { entity_id: script.check_windows }
    confirmation: { text: Run the window check now? }
  grid_options: { columns: 6 }
```

:::

::: live

```yaml
- type: custom:entity-card-pro
  hover: true
  entity: sensor.kitchen_window_battery
  name: Window sensor
  visual: ring
  rules:
    - { below: 20, color: red, label: Replace }
    - { below: 50, color: amber }
    - { above: 50, color: green }
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  hover: true
  entity: light.living_room
  name: Brightness
  icon: mdi:brightness-6
  color: amber
  attribute: brightness
  unit: ""
  visual: bar
  min: 0
  max: 255
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  hover: true
  entity: person.kim
  visual: badge
  rules:
    - { state: home, color: green, icon: mdi:home-account, label: Home }
    - { state: not_home, color: grey, icon: mdi:account-arrow-right, label: Away }
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  hover: true
  entity: sensor.energy_today
  name: Energy
  icon: mdi:lightning-bolt
  color: green
  decimals: 1
  suffix: " so far today"
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  hover: true
  entity: sun.sun
  name: Sun
  visual: badge
  rules:
    - { state: above_horizon, color: amber, icon: mdi:white-balance-sunny, label: Up }
    - { state: below_horizon, color: indigo, icon: mdi:weather-night, label: Down }
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  hover: true
  entity: sensor.washer_status
  name: Washer
  secondary: "{{ states('sensor.washer_remaining') }} min left"
  visual: badge
  rules:
    - { state: run, color: green, icon: mdi:washing-machine, label: Running }
    - { state: end, color: teal, icon: mdi:washing-machine-alert, label: Done, tint_card: true }
    - { state: power_off, color: grey, icon: mdi:washing-machine-off, label: "Off" }
  grid_options: { columns: 6 }
```

:::

## Entity pictures

From [entity pictures](/cards/entity-options). A picture in place of the icon.

::: live

```yaml
- type: custom:entity-card-pro
  hover: true
  entity: person.alex
  show_entity_picture: true
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  hover: true
  entity: person.sam
  show_entity_picture: true
  grid_options: { columns: 6 }
- type: custom:entity-group-card-pro
  hover: true
  title: People
  layout: row
  entities:
    - { entity: person.alex, show_entity_picture: true }
    - { entity: person.sam, show_entity_picture: true }
    - { entity: person.kim, show_entity_picture: true }
```

:::

## Entity group card

From [Entity group card](/cards/entity-group-card). List rows, grid cells, heroes, row and column items, table fields, header entities and a tappable title (not covered yet).

::: live

```yaml
type: custom:entity-group-card-pro
hover: true
title: Windows & doors
icon: mdi:window-open-variant
entities:
  - entity: binary_sensor.window_kitchen
    name: Kitchen
    rules:
      - { state: "on", color: red, icon: mdi:window-open, label: Open }
      - { state: "off", color: green, icon: mdi:window-closed, label: Closed }
  - entity: binary_sensor.window_bedroom
    name: Bedroom
    rules:
      - { state: "on", color: red, icon: mdi:window-open, label: Open }
      - { state: "off", color: green, icon: mdi:window-closed, label: Closed }
  - entity: binary_sensor.door_front
    name: Front door
    rules:
      - { state: "on", color: red, icon: mdi:door-open, label: Open }
      - { state: "off", color: green, icon: mdi:door-closed, label: Closed }
```

:::

::: live

```yaml
type: custom:entity-group-card-pro
hover: true
title: Kitchen climate
icon: mdi:home-thermometer
layout: grid
columns: 2
entities:
  - entity: sensor.kitchen_temperature
    name: Temperature
    decimals: 1
    rules:
      - { below: 19, color: blue }
      - { below: 24, color: green }
      - { above: 24, color: orange }
  - entity: sensor.kitchen_humidity
    name: Humidity
    visual: ring
    rules:
      - { below: 40, color: amber }
      - { below: 60, color: green }
      - { above: 60, color: blue }
  - { entity: sensor.dining_light_power, name: Dining light, visual: columns }
  - entity: sensor.kitchen_window_battery
    name: Window sensor
    visual: gauge
    min: 0
    max: 100
    rules:
      - { below: 20, color: red }
      - { below: 50, color: amber }
      - { above: 50, color: green }
```

:::

::: live

```yaml
type: custom:entity-group-card-pro
hover: true
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
```

:::

::: live

```yaml
type: custom:entity-group-card-pro
hover: true
title: Kitchen
icon: mdi:silverware-fork-knife
layout: row
entities:
  - { entity: light.kitchen, name: Light, tap_action: { action: toggle } }
  - { entity: light.dining_table, name: Dining, tap_action: { action: toggle } }
  - { entity: switch.coffee_machine, name: Coffee, icon: mdi:coffee-maker, tap_action: { action: toggle } }
  - { entity: media_player.kitchen_speaker, name: Speaker, icon: mdi:speaker }
  - entity: binary_sensor.window_kitchen
    name: Window
    rules:
      - { state: "on", color: red, icon: mdi:window-open, label: Open }
      - { state: "off", color: green, icon: mdi:window-closed, label: Closed }
```

:::

::: live

```yaml
- type: custom:entity-group-card-pro
  hover: true
  title: Lights
  icon: mdi:lightbulb-group
  layout: row
  show_name: false
  entities:
    - { entity: light.living_room, control: toggle, rules: [{ state: "on", color: amber }, { state: "off", color: grey }] }
    - { entity: light.dining_table, control: toggle, rules: [{ state: "on", color: amber }, { state: "off", color: grey }] }
    - { entity: light.kitchen, control: toggle, rules: [{ state: "on", color: amber }, { state: "off", color: grey }] }
    - { entity: light.hallway, control: toggle, rules: [{ state: "on", color: amber }, { state: "off", color: grey }] }
    - { entity: light.office, control: toggle, rules: [{ state: "on", color: amber }, { state: "off", color: grey }] }
    - { entity: light.desk_lamp, control: toggle, rules: [{ state: "on", color: amber }, { state: "off", color: grey }] }
    - { entity: light.bedroom, control: toggle, rules: [{ state: "on", color: amber }, { state: "off", color: grey }] }
    - { entity: light.garden, control: toggle, rules: [{ state: "on", color: amber }, { state: "off", color: grey }] }
- type: custom:entity-group-card-pro
  hover: true
  title: Outdoors
  icon: mdi:weather-partly-cloudy
  layout: row
  align: center
  show_name: false
  entities:
    - { entity: sensor.outdoor_temperature, decimals: 1, rules: [{ below: 5, color: blue }, { below: 25, color: green }, { above: 25, color: orange }] }
    - { entity: sensor.outdoor_humidity, decimals: 0 }
    - { entity: sensor.wind_speed, decimals: 0, rules: [{ below: 20, color: teal }, { above: 20, color: amber }] }
    - { entity: sensor.uv_index, decimals: 0, icon: mdi:sun-wireless, rules: [{ below: 3, color: green }, { below: 6, color: amber }, { above: 6, color: red }] }
```

:::

::: live

```yaml
type: custom:entity-group-card-pro
hover: true
title: Bedroom
icon: mdi:bed
layout: column
show_name: false
entities:
  - { entity: light.bedroom, tap_action: { action: toggle } }
  - { entity: cover.bedroom_blinds, icon: mdi:window-shutter }
  - { entity: climate.bedroom, icon: mdi:thermostat }
grid_options: { columns: 6 }
```

:::

::: live

```yaml
type: custom:entity-group-card-pro
hover: true
title: Washing machine
icon: mdi:washing-machine
layout: table
entities:
  - entity: sensor.washer_status
    name: Status
    visual: badge
    rules:
      - { state: run, color: green, label: Running }
      - { state: pause, color: amber, label: Paused }
      - { state: end, color: teal, label: Done }
      - { state: power_off, color: grey, label: "Off" }
  - { entity: sensor.washer_status, name: Progress, attribute: progress, unit: "%" }
  - { entity: sensor.washer_remaining, name: Remaining }
  - { entity: sensor.power_consumption, name: Power, decimals: 0 }
```

:::

::: live

```yaml
type: custom:entity-group-card-pro
hover: true
title: Robot vacuum
icon: mdi:robot-vacuum
header_entities:
  - { entity: vacuum.robot, visual: badge, rules: [{ state: cleaning, color: blue, label: Cleaning }, { state: docked, color: green, label: Docked }, { state: returning, color: teal, label: Returning }] }
  - { entity: sensor.robot_battery, decimals: 0, rules: [{ below: 20, color: red }, { above: 20, color: green }] }
  - { entity: sensor.robot_dustbin_remaining, visual: badge, show_value: false, icon: mdi:delete-variant, rules: [{ below: 20, color: red }, { above: 20, color: grey }] }
entities:
  - { entity: sensor.robot_current_room, name: Current room, icon: mdi:map-marker }
  - { entity: sensor.robot_progress, name: Progress, visual: bar, color: blue, decimals: 0 }
  - { entity: sensor.robot_dustbin_remaining, name: Dustbin, visual: bar, decimals: 0, rules: [{ below: 20, color: red, label: Empty soon }, { above: 20, color: grey }] }
```

:::

::: live

```yaml
type: custom:entity-group-card-pro
hover: true
title: Kitchen
icon: mdi:silverware-fork-knife
title_tap_action: { action: navigate, navigation_path: /dashboard-rooms/kitchen }
header_entities:
  - { entity: sensor.kitchen_temperature, decimals: 1 }
entities:
  - { entity: light.kitchen, control: toggle }
  - { entity: sensor.kitchen_humidity, decimals: 0 }
```

:::

## Entity sections card

From [Entity sections card](/cards/entity-sections-card).

::: live

```yaml
type: custom:entity-sections-card-pro
hover: true
title: Living room
icon: mdi:sofa
header_entities:
  - { entity: sensor.living_room_temperature, decimals: 1 }
  - { entity: sensor.living_room_humidity, decimals: 0 }
sections:
  - layout: row
    show_name: false
    entities:
      - { entity: sensor.living_room_co2, decimals: 0 }
      - { entity: climate.living_room, icon: mdi:thermostat, attribute: temperature, unit: °C }
  - layout: row
    show_name: false
    entities:
      - { entity: light.living_room, tap_action: { action: toggle } }
      - { entity: cover.living_room_blinds, icon: mdi:window-shutter }
      - { entity: media_player.living_room_tv, icon: mdi:television }
      - { entity: vacuum.robot }
```

:::

::: live

```yaml
type: custom:entity-sections-card-pro
hover: true
title: Robot vacuum
icon: mdi:robot-vacuum
sections:
  - layout: table
    entities:
      - { entity: vacuum.robot, name: Status, attribute: status }
      - { entity: sensor.robot_battery, name: Battery }
      - { entity: sensor.robot_current_room, name: Room }
      - { entity: sensor.robot_last_area, name: Last area }
  - divider: true
    layout: row
    show_name: false
    entities:
      - entity: sensor.robot_battery
        rules:
          - { below: 20, color: red, icon: mdi:battery-alert }
          - { above: 20, color: green, icon: mdi:battery }
      - { entity: sensor.robot_dustbin_remaining, icon: mdi:delete-outline }
      - entity: vacuum.robot
        icon: mdi:play
        tap_action: { action: perform-action, perform_action: vacuum.start, target: { entity_id: vacuum.robot } }
      - entity: vacuum.robot
        icon: mdi:home
        tap_action:
          action: perform-action
          perform_action: vacuum.return_to_base
          target: { entity_id: vacuum.robot }
```

:::

::: live

```yaml
type: custom:entity-sections-card-pro
hover: true
title: Kitchen
icon: mdi:silverware-fork-knife
header_entities:
  - { entity: sensor.kitchen_temperature, decimals: 1 }
  - { entity: sensor.kitchen_humidity, decimals: 0 }
sections:
  - layout: table
    entities:
      - { entity: sensor.dishwasher_status, name: Dishwasher, visual: badge, rules: [{ state: run, color: green, label: Running }, { state: end, color: teal, label: Done }, { state: "off", color: grey, label: "Off" }] }
      - { entity: switch.coffee_machine, name: Coffee machine, control: toggle, show_value: false }
      - { entity: sensor.range_hood_power, name: Range hood, decimals: 0 }
  - layout: row
    divider: true
    entities:
      - { entity: light.kitchen, name: Light, control: toggle, rules: [{ state: "on", color: amber }, { state: "off", color: grey }] }
      - { entity: light.dining_table, name: Dining, control: toggle, rules: [{ state: "on", color: amber }, { state: "off", color: grey }] }
      - { entity: media_player.kitchen_speaker, name: Speaker, icon: mdi:speaker, rules: [{ state: playing, color: green }, { state: idle, color: grey }] }
      - { entity: binary_sensor.window_kitchen, name: Window, rules: [{ state: "on", color: red, icon: mdi:window-open }, { state: "off", color: green, icon: mdi:window-closed }] }
```

:::

::: live

```yaml
type: custom:entity-sections-card-pro
hover: true
title: Modes & scenes
icon: mdi:palette
show_name: true
sections:
  - layout: row
    entities:
      - { entity: input_boolean.night_mode, name: Night, control: toggle, rules: [{ state: "on", color: indigo }, { state: "off", color: grey }] }
      - { entity: input_boolean.guest_mode, name: Guests, control: toggle, rules: [{ state: "on", color: pink }, { state: "off", color: grey }] }
      - { entity: input_boolean.away_mode, name: Away, control: toggle, rules: [{ state: "on", color: blue }, { state: "off", color: grey }] }
      - { entity: input_boolean.vacation_mode, name: Vacation, control: toggle, rules: [{ state: "on", color: teal, tint_card: true }, { state: "off", color: grey }] }
  - layout: row
    divider: true
    name_position: below
    entities:
      - { entity: scene.bright, name: Bright, icon: mdi:white-balance-sunny, color: amber, control: button }
      - { entity: scene.dimmed, name: Dimmed, icon: mdi:lightbulb-on-50, color: orange, control: button }
      - { entity: scene.dinner, name: Dinner, icon: mdi:silverware-fork-knife, color: deep-orange, control: button }
      - { entity: scene.movie_night, name: Movie, icon: mdi:movie-open, color: deep-purple, control: button }
      - { entity: scene.good_night, name: Night, icon: mdi:weather-night, color: indigo, control: button }
```

:::

## Power flow card

From [Power flow card](/cards/power-flow-card). Each node's circle brightens; header entities take the layer.

::: live

```yaml
type: custom:power-flow-card-pro
hover: true
sources:
  - { type: solar, entity: sensor.solar_power, name: Roof }
  - { type: solar, entity: sensor.balcony_solar_power, name: Balcony }
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
  - type: battery
    name: Balcony battery
    charge: sensor.balcony_battery_charge_power
    discharge: sensor.balcony_battery_discharge_power
    soc: sensor.balcony_battery_soc
    charge_from: sensor.balcony_solar_power
  - { type: grid, power: sensor.grid_power }
```

:::

::: live

```yaml
type: custom:power-flow-card-pro
hover: true
sources:
  - { type: solar, entity: sensor.solar_power }
  - type: grid
    import: sensor.grid_import_power
    export: sensor.grid_export_power
    both_ways: true
```

:::

::: live

```yaml
type: custom:power-flow-card-pro
hover: true
title: Energy
icon: mdi:lightning-bolt
home: sensor.power_consumption
sources:
  - { type: solar, entity: sensor.solar_power }
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
  - { type: grid, power: sensor.grid_power }
consumers:
  - { entity: sensor.heat_pump_power, name: Heat pump, icon: mdi:heat-pump, secondary: floor heating }
  - { entity: sensor.ev_charger_power, name: EV, icon: mdi:car-electric }
  - { entity: sensor.washer_power, name: Washer, icon: mdi:washing-machine }
  - { entity: sensor.dining_light_power, name: Lights, icon: mdi:lightbulb }
```

:::

::: live

```yaml
type: custom:power-flow-card-pro
hover: true
home: sensor.power_consumption
sources:
  - { type: solar, entity: sensor.solar_power }
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
  - { type: grid, power: sensor.grid_power }
consumers:
  - group: Heating
    icon: mdi:radiator
    entities:
      - { entity: sensor.heat_pump_power, name: Heat pump, icon: mdi:heat-pump }
  - group: Laundry
    icon: mdi:washing-machine
    entities:
      - { entity: sensor.washer_power, name: Washer, icon: mdi:washing-machine }
      - { entity: sensor.dryer_power, name: Dryer, icon: mdi:tumble-dryer }
  - group: Kitchen
    icon: mdi:silverware-fork-knife
    entities:
      - { entity: sensor.range_hood_power, name: Range hood, icon: mdi:stove }
      - { entity: sensor.dining_light_power, name: Lights, icon: mdi:lightbulb }
  - { entity: sensor.office_power, name: Office, icon: mdi:monitor }
```

:::

::: live

```yaml
type: custom:power-flow-card-pro
hover: true
title: Energy
icon: mdi:lightning-bolt
home: sensor.power_consumption
hide_consumers_below: 20
sources:
  - type: solar
    entity: sensor.solar_power
    visibility: [{ condition: state, entity: sun.sun, state: above_horizon }]
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
  - { type: grid, power: sensor.grid_power }
consumers:
  - { entity: sensor.heat_pump_power, name: Heat pump, icon: mdi:heat-pump }
  - entity: sensor.ev_charger_power
    name: EV
    icon: mdi:car-electric
    visibility: [{ condition: state, entity: binary_sensor.ev_plugged, state: "on" }]
  - { entity: sensor.washer_power, name: Washer, icon: mdi:washing-machine }
  - { entity: sensor.office_power, name: Office, icon: mdi:monitor, hide_below: 0 }
```

:::

## Weather card

From [Weather card](/cards/weather-card).

::: live

```yaml
type: custom:weather-card-pro
hover: true
entity: weather.home
```

:::

::: live

```yaml
type: custom:weather-card-pro
hover: true
entity: weather.home
sections:
  - type: hero
  - type: trend
    mode: hourly
    hours: 12
    show:
      - temperature
      - precipitation
      - { quantity: wind, name: Breeze, color: teal }
    y_axis: true
  - type: trend
    mode: daily
    days: 7
    divider: true
    show: [temperature, precipitation]
```

:::

::: live

```yaml
type: custom:weather-card-pro
hover: true
entity: weather.home
title: Home
header_entities:
  - { entity: sun.sun, attribute: elevation, icon: mdi:weather-sunset-down, color: amber }
secondary: "feels like {{ state_attr('weather.home', 'apparent_temperature') }}°"
temperature_rules:
  - { below: 12, color: blue, label: Cool }
  - { below: 20, color: green, label: Mild }
  - { above: 20, color: amber, label: Warm }
sections:
  - type: hero
  - type: row
    entities: [humidity, wind_speed, pressure]
  - type: trend
    mode: hourly
    hours: 12
  - type: forecast
    mode: daily
    days: 7
  - type: row
    title: Garden station
    divider: true
    entities:
      - { entity: sensor.outdoor_temperature, visual: ring, min: -10, max: 40 }
      - { entity: sensor.outdoor_humidity, visual: ring }
      - { entity: sensor.wind_gust, name: Gusts }
```

:::

## Wind card

From [Wind card](/cards/wind-card).

::: live

```yaml
type: custom:wind-card-pro
hover: true
entity: sensor.wind_speed
direction: sensor.wind_direction
```

:::

::: live

```yaml
- type: custom:wind-card-pro
  hover: true
  entity: sensor.wind_speed
  direction: sensor.wind_direction
  gust: sensor.wind_gust
  visual: flow
  rules:
    - { below: 20, color: teal, label: Light breeze }
    - { above: 20, color: amber, label: Fresh }
- type: custom:wind-card-pro
  hover: true
  entity: sensor.wind_speed
  direction: sensor.wind_direction
  gust: sensor.wind_gust
  visual: flow
  flow: { style: lines }
  rules:
    - { below: 20, color: teal, label: Light breeze }
    - { above: 20, color: amber, label: Fresh }
- type: custom:wind-card-pro
  hover: true
  entity: sensor.wind_speed
  direction: sensor.wind_direction
  gust: sensor.wind_gust
  visual: flow
  flow: { style: swoosh }
  rules:
    - { below: 20, color: teal, label: Light breeze }
    - { above: 20, color: amber, label: Fresh }
- type: custom:wind-card-pro
  hover: true
  entity: sensor.wind_speed
  direction: sensor.wind_direction
  gust: sensor.wind_gust
  visual: flow
  flow: { style: vectors }
  rules:
    - { below: 20, color: teal, label: Light breeze }
    - { above: 20, color: amber, label: Fresh }
```

:::

::: live

```yaml
type: custom:wind-card-pro
hover: true
entity: sensor.wind_speed
direction: sensor.wind_direction
gust: sensor.wind_gust
title: Wind
header_entities:
  - { entity: sensor.wind_gust, icon: mdi:weather-windy, color: orange }
layout: hero
flow: { style: swoosh, height: 140 }
rules:
  - { below: 5, color: blue-grey, label: Calm }
  - { below: 20, color: teal, label: Light breeze }
  - { below: 35, color: amber, label: Fresh }
  - { below: 50, color: orange, label: Strong }
  - { above: 50, color: red, label: Storm, tint_card: true }
```

:::

## Rain card

From [Rain card](/cards/rain-card).

::: live

```yaml
type: custom:rain-card-pro
hover: true
entity: sensor.rain_rate_roof
today: sensor.rain_today
```

:::

::: live

```yaml
- type: custom:rain-card-pro
  hover: true
  entity: sensor.rain_rate_roof
  today: sensor.rain_today
  wind: sensor.wind_speed
  direction: sensor.wind_direction
  visual: flow
  rules:
    - { below: 2.5, color: light-blue, label: Light rain }
    - { above: 2.5, color: blue, label: Moderate rain }
- type: custom:rain-card-pro
  hover: true
  entity: sensor.rain_rate_roof
  today: sensor.rain_today
  visual: flow
  flow: { style: ripples }
  grid_options: { columns: 6 }
  rules:
    - { below: 2.5, color: light-blue, label: Light rain }
    - { above: 2.5, color: blue, label: Moderate rain }
- type: custom:rain-card-pro
  hover: true
  entity: sensor.rain_rate_roof
  today: sensor.rain_today
  visual: flow
  flow: { style: fill }
  grid_options: { columns: 6 }
  rules:
    - { below: 2.5, color: light-blue, label: Light rain }
    - { above: 2.5, color: blue, label: Moderate rain }
```

:::

::: live

```yaml
type: custom:rain-card-pro
hover: true
entity: sensor.rain_rate_roof
today: sensor.rain_today
title: Rain
header_entities:
  - { entity: sensor.rain_today, icon: mdi:cup-water, color: blue }
layout: hero
flow: { style: fill, height: 140 }
rules:
  - { below: 0.1, color: blue-grey, label: Dry }
  - { below: 2.5, color: light-blue, label: Light rain }
  - { below: 7.6, color: blue, label: Moderate rain }
  - { below: 50, color: indigo, label: Heavy rain }
  - { above: 50, color: deep-purple, label: Violent rain, tint_card: true }
```

:::
