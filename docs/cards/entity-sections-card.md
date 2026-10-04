# Entity Sections Card

`custom:entity-sections-card-pro` stacks several groups of entities under one header. Each section is an [entity group](/cards/entity-group-card) body with its own `layout`, so one card can hold a hero on top of a row of controls, or a table over a grid. This page starts with two bare sections and adds options one at a time.

## Basic

The type and a list of `sections`, each with its `entities`. Without a `layout` a section is a list.

::: live

```yaml
type: custom:entity-sections-card-pro
sections:
  - entities: [sensor.living_room_temperature, sensor.living_room_humidity]
  - entities: [light.living_room, cover.living_room_blinds]
```

:::

## Layout per section

`layout` takes the same values as the group card (`list`, `grid`, `hero`, `row`, `column`, `table`). Here the sensors become a row and the controls stay a list; `title` and `icon` add the header.

::: live

```yaml
type: custom:entity-sections-card-pro
title: Living room
icon: mdi:sofa
sections:
  - layout: row
    entities: [sensor.living_room_temperature, sensor.living_room_humidity]
  - entities: [light.living_room, cover.living_room_blinds]
```

:::

## Divider and alignment

`divider: true` draws a line above a section. `align` and `columns` work per section like on the group card.

::: live

```yaml
type: custom:entity-sections-card-pro
title: Living room
icon: mdi:sofa
sections:
  - layout: row
    entities: [sensor.living_room_temperature, sensor.living_room_humidity]
  - layout: row
    divider: true
    align: space-between
    entities: [light.living_room, cover.living_room_blinds, media_player.living_room_tv, vacuum.robot]
```

:::

## Item options

`show_name`, `show_value`, `show_icon` and `name_position` set how row, column and table items look. Put them on the card for every section, on a section for its items, or on an entity; the closer setting wins.

::: live

```yaml
type: custom:entity-sections-card-pro
title: Living room
icon: mdi:sofa
show_name: false
sections:
  - layout: row
    show_value: true
    entities:
      - { entity: sensor.living_room_temperature, decimals: 1 }
      - { entity: sensor.living_room_humidity, decimals: 0 }
  - layout: row
    divider: true
    align: space-between
    entities: [light.living_room, cover.living_room_blinds, media_player.living_room_tv, vacuum.robot]
```

:::

## Header entities

`header_entities` puts compact values on the right of the title line. With the sensors in the header the first section can go, and the controls get icons and actions. Row, column and table sections draw `icon`, `ring` and `badge` only, header entities `icon` and `badge`; see [Visuals in items and headers](/cards/entity-options#visuals-in-items-and-headers).

::: live

```yaml
type: custom:entity-sections-card-pro
title: Living room
icon: mdi:sofa
header_entities:
  - { entity: sensor.living_room_temperature, decimals: 1 }
  - { entity: sensor.living_room_humidity, decimals: 0 }
sections:
  - layout: row
    show_name: false
    show_value: true
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

## Rooms and devices

A device card: a table of facts and a footer with status icons and actions.

::: live

```yaml
type: custom:entity-sections-card-pro
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
    align: space-between
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

Sections can mix any of the layouts, a hero on top of a row for example.

::: live

```yaml
type: custom:entity-sections-card-pro
title: Office
icon: mdi:desk
sections:
  - layout: hero
    entities:
      - entity: sensor.office_temperature
        name: Temperature
        decimals: 1
        visual: sparkline
        rules:
          - { below: 19, color: blue, label: Cool }
          - { below: 25, color: green, label: Pleasant }
          - { above: 25, color: orange, label: Warm }
      - { entity: sensor.office_co2, name: CO₂, decimals: 0, visual: badge }
  - divider: true
    layout: row
    entities:
      - { entity: light.office, name: Light, tap_action: { action: toggle } }
      - { entity: light.desk_lamp, name: Desk, tap_action: { action: toggle } }
      - { entity: cover.office_blinds, name: Blinds, icon: mdi:window-shutter }
```

:::

A kitchen: climate in the header, appliances as a table, lights and windows as a row.

::: live

```yaml
type: custom:entity-sections-card-pro
title: Kitchen
icon: mdi:silverware-fork-knife
header_entities:
  - { entity: sensor.kitchen_temperature, decimals: 1 }
  - { entity: sensor.kitchen_humidity, decimals: 0 }
sections:
  - layout: table
    entities:
      - { entity: sensor.dishwasher_status, name: Dishwasher, visual: badge, rules: [{ state: run, color: green, label: Running }, { state: end, color: teal, label: Done }, { state: "off", color: grey, label: "Off" }] }
      - { entity: switch.coffee_machine, name: Coffee machine, toggle: true, show_value: false }
      - { entity: sensor.range_hood_power, name: Range hood, decimals: 0 }
  - layout: row
    divider: true
    align: space-between
    entities:
      - { entity: light.kitchen, name: Light, tap_action: { action: toggle }, rules: [{ state: "on", color: amber }, { state: "off", color: grey }] }
      - { entity: light.dining_table, name: Dining, tap_action: { action: toggle }, rules: [{ state: "on", color: amber }, { state: "off", color: grey }] }
      - { entity: media_player.kitchen_speaker, name: Speaker, icon: mdi:speaker, rules: [{ state: playing, color: green }, { state: idle, color: grey }] }
      - { entity: binary_sensor.window_kitchen, name: Window, rules: [{ state: "on", color: red, icon: mdi:window-open }, { state: "off", color: green, icon: mdi:window-closed }] }
```

:::

A bathroom: humidity as the hero with its trend, the window as a strip and a right-aligned control.

::: live

```yaml
type: custom:entity-sections-card-pro
title: Bathroom
icon: mdi:shower
hours_to_show: 12
bucket_minutes: 30
sections:
  - layout: hero
    entities:
      - entity: sensor.bathroom_humidity
        name: Humidity
        decimals: 0
        visual: sparkline
        rules:
          - { below: 60, color: green, label: Dry }
          - { below: 70, color: amber, label: Humid }
          - { above: 70, color: red, label: Ventilate, tint_card: true }
      - { entity: sensor.bathroom_temperature, name: Temperature, decimals: 1, color: teal }
  - layout: list
    divider: true
    entities:
      - entity: binary_sensor.window_bathroom
        name: Window
        visual: strip
        rules:
          - { state: "on", color: red, icon: mdi:window-open, label: Open }
          - { state: "off", color: green, icon: mdi:window-closed, label: Closed }
```

:::

## Devices and status

A security overview: doors and windows as a table with icons, presence as a row of badges.

::: live

```yaml
type: custom:entity-sections-card-pro
title: Security
icon: mdi:shield-home
show_icon: true
sections:
  - layout: row
    align: space-between
    show_value: true
    entities:
      - { entity: person.alex, name: Alex, visual: badge, rules: &p [{ state: home, color: green, label: Home }, { state: not_home, color: grey, label: Away }] }
      - { entity: person.sam, name: Sam, visual: badge, rules: *p }
      - { entity: person.kim, name: Kim, visual: badge, rules: *p }
  - layout: table
    divider: true
    entities:
      - { entity: binary_sensor.door_front, name: Front door, visual: badge, rules: [{ state: "on", color: red, icon: mdi:door-open, label: Open }, { state: "off", color: green, icon: mdi:door-closed, label: Closed }] }
      - { entity: binary_sensor.window_kitchen, name: Kitchen window, visual: badge, rules: &w [{ state: "on", color: red, icon: mdi:window-open, label: Open }, { state: "off", color: green, icon: mdi:window-closed, label: Closed }] }
      - { entity: binary_sensor.window_bedroom, name: Bedroom window, visual: badge, rules: *w }
      - { entity: binary_sensor.window_office, name: Office window, visual: badge, rules: *w }
      - { entity: binary_sensor.motion_hallway, name: Hallway motion, visual: badge, rules: [{ state: "on", color: amber, icon: mdi:motion-sensor, label: Detected }, { state: "off", color: grey, icon: mdi:motion-sensor-off, label: Clear }] }
```

:::

Modes and scenes: two rows of icon buttons, one that toggles and one that runs scenes.

::: live

```yaml
type: custom:entity-sections-card-pro
title: Modes & scenes
icon: mdi:palette
show_name: true
sections:
  - layout: row
    align: space-between
    entities:
      - { entity: input_boolean.night_mode, name: Night, tap_action: toggle, rules: [{ state: "on", color: indigo }, { state: "off", color: grey }] }
      - { entity: input_boolean.guest_mode, name: Guests, tap_action: toggle, rules: [{ state: "on", color: pink }, { state: "off", color: grey }] }
      - { entity: input_boolean.away_mode, name: Away, tap_action: toggle, rules: [{ state: "on", color: blue }, { state: "off", color: grey }] }
      - { entity: input_boolean.vacation_mode, name: Vacation, tap_action: toggle, rules: [{ state: "on", color: teal, tint_card: true }, { state: "off", color: grey }] }
  - layout: row
    divider: true
    align: space-between
    name_position: below
    entities:
      - { entity: scene.bright, name: Bright, icon: mdi:white-balance-sunny, color: amber, tap_action: { action: perform-action, perform_action: scene.turn_on, target: { entity_id: scene.bright } } }
      - { entity: scene.dimmed, name: Dimmed, icon: mdi:lightbulb-on-50, color: orange, tap_action: { action: perform-action, perform_action: scene.turn_on, target: { entity_id: scene.dimmed } } }
      - { entity: scene.dinner, name: Dinner, icon: mdi:silverware-fork-knife, color: deep-orange, tap_action: { action: perform-action, perform_action: scene.turn_on, target: { entity_id: scene.dinner } } }
      - { entity: scene.movie_night, name: Movie, icon: mdi:movie-open, color: deep-purple, tap_action: { action: perform-action, perform_action: scene.turn_on, target: { entity_id: scene.movie_night } } }
      - { entity: scene.good_night, name: Night, icon: mdi:weather-night, color: indigo, tap_action: { action: perform-action, perform_action: scene.turn_on, target: { entity_id: scene.good_night } } }
```

:::

Energy: a table of live readings over a grid of charts.

::: live

```yaml
type: custom:entity-sections-card-pro
title: Energy
icon: mdi:lightning-bolt
hours_to_show: 12
header_entities:
  - { entity: sensor.solar_power, decimals: 0, color: amber }
sections:
  - layout: table
    entities:
      - { entity: sensor.power_consumption, name: Consumption, decimals: 0, rules: [{ below: 1500, color: green }, { above: 1500, color: red, label: High }] }
      - { entity: sensor.solar_power, name: Solar, decimals: 0 }
      - { entity: sensor.energy_today, name: Today, decimals: 1 }
  - layout: grid
    divider: true
    columns: 2
    entities:
      - { entity: sensor.solar_power, name: Solar, visual: columns, color: amber, decimals: 0 }
      - { entity: sensor.power_consumption, name: Consumption, visual: sparkline, color: red, decimals: 0 }
```

:::

## Reference

### Card options

| Option                                             | Default                      | Description                                                                                                                                                    |
| -------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sections`                                         |                              | List of sections (required).                                                                                                                                   |
| `title`                                            |                              | Header text. Template allowed.                                                                                                                                 |
| `icon`                                             |                              | Header icon. Template allowed.                                                                                                                                 |
| `header_entities`                                  |                              | Entities shown as icon + value on the right of the title line. Defaults `show_icon: true`, `show_value: true`, `show_name: false`; visuals `icon` and `badge`. |
| `columns`                                          | `2`                          | Default for grid sections.                                                                                                                                     |
| `align`                                            | per layout                   | Default for every section, see the [group card](/cards/entity-group-card#card-options).                                                                        |
| `show_name` / `show_value` / `show_icon`           | per layout                   | Default [item options](/cards/entity-options#item-options) for every section.                                                                                  |
| `name_position`                                    | per layout                   | Default for every section: `below` in rows, `above` in columns.                                                                                                |
| `hours_to_show`                                    | `24`                         | History window for `sparkline`, `columns` and `strip`, at least 1. One window per card.                                                                        |
| `bucket_minutes`                                   | `60`                         | Bucket size for `columns` and `strip`, at least 5.                                                                                                             |
| `tap_action` / `hold_action` / `double_tap_action` | more-info / more-info / none | Defaults for every entity, see [Actions](/cards/entity-options#actions).                                                                                       |

### Section options

| Option                                   | Default        | Description                                                                      |
| ---------------------------------------- | -------------- | -------------------------------------------------------------------------------- |
| `entities`                               |                | Entity ids or [entity objects](/cards/entity-options#entity-options) (required). |
| `layout`                                 | `list`         | `list`, `grid`, `hero`, `row`, `column` or `table`.                              |
| `divider`                                | `false`        | Draws a line above the section (never for the first one).                        |
| `columns`                                | card `columns` | Cells per row in a grid section.                                                 |
| `align`                                  | card `align`   | Overrides the card value for this section.                                       |
| `show_name` / `show_value` / `show_icon` | card values    | Item options for this section; entities can override them again.                 |
| `name_position`                          | card value     |                                                                                  |

### Grid defaults

12 columns, `rows: auto`; at least 6 columns and 2 rows (3 when a section is a hero). See [Sizing in sections](/guide/sizing).

### Home Assistant options

Like every card, this one also accepts `grid_options`, `visibility`, `layout_options`, `view_layout` and `card_mod`. They are passed through to Home Assistant; see [Sizing in sections](/guide/sizing) for `grid_options`.
