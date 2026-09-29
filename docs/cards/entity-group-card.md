# Entity Group Card

`custom:entity-group-card` shows many entities in one card. Every entity takes the same [entity options](/cards/entity-options) as the entity card; `layout` decides how they are arranged. This page starts with a plain list and adds options one at a time, then walks through the other layouts.

## Basic

The type and a list of entity ids. Each row shows the entity's icon, friendly name and state, coloured like Home Assistant does.

::: live

```yaml
type: custom:entity-group-card
entities:
  - binary_sensor.window_kitchen
  - binary_sensor.window_bedroom
  - binary_sensor.door_front
```

:::

## Title and icon

`title` and `icon` add a header line.

::: live

```yaml
type: custom:entity-group-card
title: Windows & doors
icon: mdi:window-open-variant
entities:
  - binary_sensor.window_kitchen
  - binary_sensor.window_bedroom
  - binary_sensor.door_front
```

:::

## Names and rules

An entity becomes an object as soon as it needs options. `name` shortens the label; `rules` pick colour, icon and label by state or value, first match wins.

::: live

```yaml
type: custom:entity-group-card
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

## Mixed visuals

Every row can have its own `visual` and its own controls: a toggle for the light, a bar for the blind position (an `attribute`), a sparkline for the temperature and a badge for the TV. `hours_to_show` sets one history window for the whole card.

::: live

```yaml
type: custom:entity-group-card
title: Living room
icon: mdi:sofa
hours_to_show: 12
entities:
  - entity: light.living_room
    toggle: true
    rules:
      - { state: "on", color: amber, label: "On" }
      - { state: "off", color: grey, label: "Off" }
  - entity: cover.living_room_blinds
    name: Blinds
    icon: mdi:window-shutter
    attribute: current_position
    unit: "%"
    visual: bar
    tap_action: { action: perform-action, perform_action: cover.toggle, target: { entity_id: cover.living_room_blinds } }
  - entity: sensor.living_room_temperature
    name: Temperature
    decimals: 1
    visual: sparkline
    rules:
      - { below: 19, color: blue, label: Cold }
      - { below: 24, color: green, label: Comfortable }
      - { above: 24, color: orange, label: Warm }
  - entity: media_player.living_room_tv
    name: TV
    visual: badge
    rules:
      - { state: playing, color: green, icon: mdi:play-circle, label: Playing }
      - { state: idle, color: grey, icon: mdi:television, label: Idle }
      - { state: "off", color: grey, icon: mdi:television-off, label: "Off" }
```

:::

Batteries in one list: rings with the same rules (a YAML anchor keeps them in one place), `tint_card` on the empty ones.

::: live

```yaml
type: custom:entity-group-card
title: Batteries
icon: mdi:battery
entities:
  - { entity: sensor.robot_battery, name: Robot vacuum, visual: ring, rules: &b [{ below: 20, color: red, label: Replace, tint_card: true }, { below: 50, color: amber, label: Half }, { above: 50, color: green }] }
  - { entity: sensor.kitchen_window_battery, name: Kitchen window, visual: ring, rules: *b }
  - { entity: sensor.motion_hallway_battery, name: Hallway motion, visual: ring, rules: *b }
  - { entity: sensor.weather_station_battery, name: Weather station, visual: ring, rules: *b }
```

:::

## Grid

`layout` arranges the same entities differently; `list` is the default used so far. The sections from here to [Table](#table) show the other five, the [reference](#layouts) lists them in one table.

Compact cells, `columns` per row. Values scale down to fit the cell.

::: live

```yaml
type: custom:entity-group-card
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

Three columns of badges and rings make a compact status board; a grid of scenes shows text values scaled to fit.

::: live

```yaml
- type: custom:entity-group-card
  title: Status
  icon: mdi:home-analytics
  layout: grid
  columns: 3
  entities:
    - { entity: person.alex, name: Alex, visual: badge, rules: [{ state: home, color: green, label: Home }, { state: not_home, color: grey, label: Away }] }
    - { entity: person.sam, name: Sam, visual: badge, rules: [{ state: home, color: green, label: Home }, { state: not_home, color: grey, label: Away }] }
    - { entity: person.kim, name: Kim, visual: badge, rules: [{ state: home, color: green, label: Home }, { state: not_home, color: grey, label: Away }] }
    - { entity: sensor.robot_battery, name: Robot, visual: ring, rules: [{ below: 20, color: red }, { above: 20, color: green }] }
    - { entity: sensor.robot_dustbin_remaining, name: Dustbin, visual: ring, rules: [{ below: 20, color: red }, { above: 20, color: blue }] }
    - { entity: sensor.washer_status, name: Washer, attribute: progress, unit: "%", visual: ring, min: 0, max: 100, color: green }
- type: custom:entity-group-card
  title: Scenes
  icon: mdi:palette
  layout: grid
  columns: 2
  entities:
    - { entity: scene.bright, value: Bright, icon: mdi:white-balance-sunny, color: amber, tap_action: { action: perform-action, perform_action: scene.turn_on, target: { entity_id: scene.bright } } }
    - { entity: scene.dimmed, value: Dimmed, icon: mdi:lightbulb-on-50, color: orange, tap_action: { action: perform-action, perform_action: scene.turn_on, target: { entity_id: scene.dimmed } } }
    - { entity: scene.dinner, value: Dinner, icon: mdi:silverware-fork-knife, color: deep-orange, tap_action: { action: perform-action, perform_action: scene.turn_on, target: { entity_id: scene.dinner } } }
    - { entity: scene.good_night, value: Good night, icon: mdi:weather-night, color: indigo, tap_action: { action: perform-action, perform_action: scene.turn_on, target: { entity_id: scene.good_night } } }
```

:::

## Hero

The first entity is the lead with a big value and its visual; the rest are list rows. A `badge` shows as a pill in its row.

::: live

```yaml
type: custom:entity-group-card
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

An energy hero: columns for the solar production as the lead, consumption and today's total as rows.

::: live

```yaml
type: custom:entity-group-card
title: Energy
icon: mdi:solar-power
layout: hero
hours_to_show: 12
bucket_minutes: 30
entities:
  - entity: sensor.solar_power
    name: Solar production
    decimals: 0
    visual: columns
    color: amber
  - entity: sensor.power_consumption
    name: Consumption
    decimals: 0
    visual: sparkline
    rules:
      - { below: 500, color: green, label: Low }
      - { below: 1500, color: amber, label: Normal }
      - { above: 1500, color: red, label: High }
  - { entity: sensor.energy_today, name: Today, decimals: 1, color: green }
  - { entity: sensor.dining_light_power, name: Dining light, decimals: 0, visual: badge }
```

:::

## Row

Entities side by side as compact items: a round icon with the name under it, optionally the value next to it. Items wrap when the card is narrow. `align` spreads them (`start`, `center`, `end`, `space-between` or `stretch`). Items draw `icon`, `ring` and `badge`; block visuals fall back to the icon, see [Visuals in items and headers](/cards/entity-options#visuals-in-items-and-headers).

::: live

```yaml
type: custom:entity-group-card
title: Kitchen
icon: mdi:silverware-fork-knife
layout: row
align: space-between
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

`show_value: true` puts the value next to the icon and `show_name: false` drops the label. Gauge, bar and history visuals are not drawn in items; use `icon`, `ring` or `badge`.

::: live

```yaml
type: custom:entity-group-card
title: Living room climate
icon: mdi:sofa
layout: row
show_name: false
show_value: true
entities:
  - { entity: sensor.living_room_temperature, decimals: 1 }
  - { entity: sensor.living_room_humidity, decimals: 0 }
  - { entity: sensor.living_room_co2, decimals: 0 }
```

:::

`name_position: above` puts the name on top of the icon instead of under it, and `align: stretch` gives every item the same share of the width.

::: live

```yaml
type: custom:entity-group-card
title: Garden
icon: mdi:flower
layout: row
align: stretch
name_position: above
entities:
  - entity: light.garden
    name: Lights
    rules:
      - { state: "on", color: amber }
      - { state: "off", color: grey }
    tap_action: { action: toggle }
  - entity: switch.garden_pump
    name: Pump
    icon: mdi:water-pump
    rules:
      - { state: "on", color: blue }
      - { state: "off", color: grey }
    tap_action: { action: toggle }
  - entity: cover.awning
    name: Awning
    icon: mdi:storefront-outline
    rules:
      - { state: open, color: green }
      - { state: closed, color: grey }
  - entity: binary_sensor.rain
    name: Rain
    rules:
      - { state: "on", color: blue, icon: mdi:weather-rainy }
      - { state: "off", color: grey, icon: mdi:weather-cloudy }
```

:::

Icon-only controls with state colours make a compact switchboard; `align: center` and `show_value: true` turn sensors into a readout.

::: live

```yaml
- type: custom:entity-group-card
  title: Lights
  icon: mdi:lightbulb-group
  layout: row
  show_name: false
  align: space-between
  tap_action: { action: toggle }
  entities:
    - { entity: light.living_room, rules: [{ state: "on", color: amber }, { state: "off", color: grey }] }
    - { entity: light.dining_table, rules: [{ state: "on", color: amber }, { state: "off", color: grey }] }
    - { entity: light.kitchen, rules: [{ state: "on", color: amber }, { state: "off", color: grey }] }
    - { entity: light.hallway, rules: [{ state: "on", color: amber }, { state: "off", color: grey }] }
    - { entity: light.office, rules: [{ state: "on", color: amber }, { state: "off", color: grey }] }
    - { entity: light.desk_lamp, rules: [{ state: "on", color: amber }, { state: "off", color: grey }] }
    - { entity: light.bedroom, rules: [{ state: "on", color: amber }, { state: "off", color: grey }] }
    - { entity: light.garden, rules: [{ state: "on", color: amber }, { state: "off", color: grey }] }
- type: custom:entity-group-card
  title: Outdoors
  icon: mdi:weather-partly-cloudy
  layout: row
  align: center
  show_name: false
  show_value: true
  entities:
    - { entity: sensor.outdoor_temperature, decimals: 1, rules: [{ below: 5, color: blue }, { below: 25, color: green }, { above: 25, color: orange }] }
    - { entity: sensor.outdoor_humidity, decimals: 0 }
    - { entity: sensor.wind_speed, decimals: 0, rules: [{ below: 20, color: teal }, { above: 20, color: amber }] }
    - { entity: sensor.uv_index, decimals: 0, icon: mdi:sun-wireless, rules: [{ below: 3, color: green }, { below: 6, color: amber }, { above: 6, color: red }] }
```

:::

## Column

The same items stacked vertically. They hug the right edge by default (`align: end`); `align: start` or `center` moves them. Items draw `icon`, `ring` and `badge`; block visuals fall back to the icon, see [Visuals in items and headers](/cards/entity-options#visuals-in-items-and-headers).

::: live

```yaml
type: custom:entity-group-card
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

With names and `align: start` the column becomes a vertical menu; badges show the state next to the icon.

::: live

```yaml
type: custom:entity-group-card
title: Office
icon: mdi:desk
layout: column
align: start
show_value: true
name_position: below
entities:
  - { entity: light.office, name: Ceiling, visual: badge, tap_action: { action: toggle }, rules: [{ state: "on", color: amber, label: "On" }, { state: "off", color: grey, label: "Off" }] }
  - { entity: light.desk_lamp, name: Desk lamp, visual: badge, tap_action: { action: toggle }, rules: [{ state: "on", color: amber, label: "On" }, { state: "off", color: grey, label: "Off" }] }
  - { entity: cover.office_blinds, name: Blinds, icon: mdi:window-shutter, attribute: current_position, unit: "%" }
grid_options: { columns: 6 }
```

:::

## Table

Key/value rows: the name on the left in small capitals, the value on the right. `show_icon: true` adds an icon column; `align: start` puts the value right after the name, `align: center` in the middle. `toggle: true` puts the switch in the value column. Items draw `icon`, `ring` and `badge`; block visuals fall back to the icon, see [Visuals in items and headers](/cards/entity-options#visuals-in-items-and-headers).

::: live

```yaml
type: custom:entity-group-card
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
type: custom:entity-group-card
title: Kitchen window sensor
icon: mdi:window-closed-variant
layout: table
align: start
show_icon: true
entities:
  - entity: binary_sensor.window_kitchen
    name: Contact
    visual: badge
    rules:
      - { state: "on", color: red, icon: mdi:window-open, label: Open }
      - { state: "off", color: green, icon: mdi:window-closed, label: Closed }
  - entity: sensor.kitchen_window_battery
    name: Battery
    visual: ring
    rules:
      - { below: 20, color: red }
      - { below: 50, color: amber }
      - { above: 50, color: green }
  - { entity: sensor.kitchen_temperature, name: Temperature, decimals: 1 }
  - { entity: light.kitchen, name: Light, toggle: true, show_value: false, show_icon: false }
```

:::

A table of modes with the switch in the value column, and a device sheet where every row shows a different attribute of the same entity.

::: live

```yaml
- type: custom:entity-group-card
  title: Modes
  icon: mdi:toggle-switch-outline
  layout: table
  show_value: false
  entities:
    - { entity: input_boolean.night_mode, name: Night mode, toggle: true }
    - { entity: input_boolean.guest_mode, name: Guest mode, toggle: true }
    - { entity: input_boolean.away_mode, name: Away mode, toggle: true }
    - { entity: input_boolean.vacation_mode, name: Vacation mode, toggle: true }
  grid_options: { columns: 6 }
- type: custom:entity-group-card
  title: Living room TV
  icon: mdi:television
  layout: table
  entities:
    - { entity: media_player.living_room_tv, name: State, visual: badge, rules: [{ state: playing, color: green, label: Playing }, { state: idle, color: grey, label: Idle }, { state: "off", color: grey, label: "Off" }] }
    - { entity: media_player.living_room_tv, name: Playing, attribute: media_title }
    - { entity: media_player.living_room_tv, name: Volume, attribute: volume_level, unit: "" }
    - { entity: sensor.living_room_co2, name: Room air, decimals: 0 }
  grid_options: { columns: 6 }
```

:::

## Header entities

`header_entities` puts compact values on the right of the title line: the icon in the entity's colour and the value. Rules work as everywhere; `show_icon: false` shows the value alone, `show_name: true` adds the name. Visuals are limited to `icon` and `badge` (a pill instead of the value); the others fall back to the icon, see [Visuals in items and headers](/cards/entity-options#visuals-in-items-and-headers).

::: live

```yaml
type: custom:entity-group-card
title: Great room
icon: mdi:sofa
layout: row
align: space-between
header_entities:
  - entity: sensor.living_room_temperature
    decimals: 1
    rules:
      - { below: 19, color: blue }
      - { below: 25, color: green }
      - { above: 25, color: orange }
  - { entity: sensor.living_room_humidity, decimals: 0, show_icon: false }
entities:
  - { entity: light.living_room, name: Light, tap_action: { action: toggle } }
  - entity: cover.living_room_blinds
    name: Blinds
    rules:
      - { state: open, color: green, icon: mdi:window-shutter-open, label: Open }
      - { state: closed, color: grey, icon: mdi:window-shutter, label: Closed }
  - { entity: media_player.living_room_tv, name: TV, icon: mdi:television }
  - entity: scene.movie_night
    name: Movie
    icon: mdi:movie-open
    tap_action: { action: perform-action, perform_action: scene.turn_on, target: { entity_id: scene.movie_night } }
```

:::

The header can carry badges and names too: a status badge next to the title of a device list.

::: live

```yaml
type: custom:entity-group-card
title: Robot vacuum
icon: mdi:robot-vacuum
header_entities:
  - { entity: vacuum.robot, visual: badge, rules: [{ state: cleaning, color: blue, label: Cleaning }, { state: docked, color: green, label: Docked }, { state: returning, color: teal, label: Returning }] }
  - { entity: sensor.robot_battery, decimals: 0, rules: [{ below: 20, color: red }, { above: 20, color: green }] }
entities:
  - { entity: sensor.robot_current_room, name: Current room, icon: mdi:map-marker }
  - { entity: sensor.robot_progress, name: Progress, visual: bar, color: blue, decimals: 0 }
  - { entity: sensor.robot_dustbin_remaining, name: Dustbin, visual: bar, decimals: 0, rules: [{ below: 20, color: red, label: Empty soon }, { above: 20, color: grey }] }
```

:::

## Reference

### Layouts

| `layout`         | Arrangement                                                                            |
| ---------------- | -------------------------------------------------------------------------------------- |
| `list` (default) | One row per entity: icon, name, value, optional toggle; graphs below the name.         |
| `grid`           | Compact cells, `columns` per row, with the value big.                                  |
| `hero`           | The first entity is the lead with a big value and its graph; the rest are list rows.   |
| `row`            | Compact items side by side: a round icon with the name under it, optionally the value. |
| `column`         | The same items stacked vertically, hugging the right edge.                             |
| `table`          | Key/value rows: small-caps name on the left, value on the right.                       |

### Card options

| Option                                             | Default                      | Description                                                                                                                                                                                                                                                                               |
| -------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entities`                                         |                              | List of entity ids or [entity objects](/cards/entity-options#entity-options) (required).                                                                                                                                                                                                  |
| `layout`                                           | `list`                       | `list`, `grid`, `hero`, `row`, `column` or `table`.                                                                                                                                                                                                                                       |
| `title`                                            |                              | Header text. Template allowed.                                                                                                                                                                                                                                                            |
| `icon`                                             |                              | Header icon. Template allowed.                                                                                                                                                                                                                                                            |
| `header_entities`                                  |                              | Entities shown as icon + value on the right of the title line. Defaults `show_icon: true`, `show_value: true`, `show_name: false`; visuals `icon` and `badge`.                                                                                                                            |
| `columns`                                          | `2`                          | Grid: cells per row, 1 to 4 (not the sections grid `grid_options.columns`).                                                                                                                                                                                                               |
| `align`                                            | per layout                   | Row: `start`, `center`, `end`, `space-between` or `stretch` (items share the width). Column: `start`, `center`, `end`. Table: `start`, `center`, `end` for the value. `stretch` and `space-between` act as `end` in columns and tables. Defaults: row `start`, column `end`, table `end`. |
| `show_name` / `show_value` / `show_icon`           | per layout                   | [Item options](/cards/entity-options#item-options) for row, column and table; every entity can override them.                                                                                                                                                                             |
| `name_position`                                    | per layout                   | `above` or `below` the icon in row (default `below`) and column (default `above`) items.                                                                                                                                                                                                  |
| `hours_to_show`                                    | `24`                         | History window for `sparkline`, `columns` and `strip`, at least 1. One window per card.                                                                                                                                                                                                   |
| `bucket_minutes`                                   | `60`                         | Bucket size for `columns` and `strip`, at least 5.                                                                                                                                                                                                                                        |
| `tap_action` / `hold_action` / `double_tap_action` | more-info / more-info / none | Defaults for every entity, see [Actions](/cards/entity-options#actions).                                                                                                                                                                                                                  |

### Grid defaults

12 columns, `rows: auto`; the sections grid will not shrink it below 6 columns and 2 rows (3 for a hero). See [Sizing in sections](/guide/sizing).

### Home Assistant options

Like every card, this one also accepts `grid_options`, `visibility`, `layout_options`, `view_layout` and `card_mod`. They are passed through to Home Assistant; see [Sizing in sections](/guide/sizing) for `grid_options`.
