# Entity Sections Card Pro

::: warning Deprecated

The entity sections card is deprecated: it still works in 3.0 and goes in 4.0. Use a [layout card](/cards/layout-card) of a heading and tile groups; [Moving to 3.0](/guide/migrating#the-entity-sections-card) shows how.

:::

`custom:entity-sections-card-pro` stacks several groups of entities under one header. Each section is an [entity group](/cards/entity-group-card) body with its own `layout`, so one card can hold a hero over a row of controls, or a table over a grid.

## Basic

A list of `sections`, each with its `entities`. Without a `layout` a section is a list.

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
    entities: [light.living_room, cover.living_room_blinds, media_player.living_room_speaker, vacuum.robot]
```

:::

## Item options

`show_name`, `show_value` and `show_icon` set how row, column and table items look, `name_position` where a row item's name sits. Put them on the card for every section, on a section for its items, or on an entity; the closer setting wins.

::: live

```yaml
type: custom:entity-sections-card-pro
title: Living room
icon: mdi:sofa
show_name: false
sections:
  - layout: row
    entities:
      - { entity: sensor.living_room_temperature, decimals: 1 }
      - { entity: sensor.living_room_humidity, decimals: 0 }
  - layout: row
    divider: true
    entities: [light.living_room, cover.living_room_blinds, media_player.living_room_speaker, vacuum.robot]
```

:::

## Header entities

`header_entities` puts compact values on the right of the title line, as on the [group card](/cards/entity-group-card#header-entities). Row, column and table sections draw `icon`, `ring` and `badge` only; see [Visuals in items and headers](/cards/entity-options#visuals-in-items-and-headers).

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
    entities:
      - { entity: sensor.living_room_co2, decimals: 0 }
      - { entity: climate.living_room, icon: mdi:thermostat, attribute: temperature, unit: °C }
  - layout: row
    show_name: false
    entities:
      - { entity: light.living_room, tap_action: { action: toggle } }
      - { entity: cover.living_room_blinds, icon: mdi:window-shutter }
      - { entity: media_player.living_room_speaker, icon: mdi:speaker }
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

A bathroom: humidity as the hero with its trend, the window as a strip.

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

A security overview: presence as a row of badges, doors and windows as a table with icons.

::: live

```yaml
type: custom:entity-sections-card-pro
title: Security
icon: mdi:shield-home
show_icon: true
sections:
  - layout: row
    entities:
      - { entity: person.malte, name: Malte, visual: badge, rules: &p [{ state: home, color: green, label: Home }, { state: not_home, color: grey, label: Away }] }
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

## Hover

`hover` cascades as the actions do: on the card for every entity, on a section for its entities, on an entity for that one. It works as on the [group card](/cards/entity-group-card#hover); see [Hover](/cards/entity-options#hover).

::: live

```yaml
type: custom:entity-sections-card-pro
title: Living room
icon: mdi:sofa
sections:
  - layout: grid
    hover: true
    entities:
      - { entity: light.living_room, tap_action: toggle }
      - { entity: light.desk_lamp, tap_action: toggle }
  - entities:
      - { entity: cover.living_room_blinds, control: auto, hover: true }
      - sensor.living_room_temperature
```

:::

## Reference

### Card options

| Option                                             | Default                      | Description                                                                                                                                                                                                                                      |
| -------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sections`                                         |                              | List of sections (required).                                                                                                                                                                                                                     |
| `title`                                            |                              | Header text. Template allowed.                                                                                                                                                                                                                   |
| `title_tap_action`                                 | none                         | Action when the title or its icon is tapped, e.g. `{ action: navigate, navigation_path: /dashboard-rooms/kitchen }` to open the room's dashboard; see [Actions](/cards/entity-options#actions).                                                  |
| `icon`                                             |                              | Header icon. Template allowed.                                                                                                                                                                                                                   |
| `header_entities`                                  |                              | Entities shown as icon + value on the right of the title line. Defaults `show_icon: true`, `show_value: true`, `show_name: false`; badges, plain and small ([Visuals in items and headers](/cards/entity-options#visuals-in-items-and-headers)). |
| `columns`                                          | `2`                          | Default for grid sections.                                                                                                                                                                                                                       |
| `vertical_align`                                   | `top`                        | `top`, `center` or `bottom`: where the sections sit in a card taller than its content; the title stays on top. See the [group card](/cards/entity-group-card#vertical-alignment).                                                                |
| `align`                                            | per layout                   | Default for every section, see the [group card](/cards/entity-group-card#card-options).                                                                                                                                                          |
| `show_name` / `show_value` / `show_icon`           | per layout                   | Default [item options](/cards/entity-options#item-options) for every section.                                                                                                                                                                    |
| `name_position`                                    | `below`                      | Default for every section: `above` or `below` the icon in row items; the other layouts ignore it.                                                                                                                                                |
| `hours_to_show`                                    | `24`                         | History window for `sparkline`, `columns` and `strip`, at least 1. One window per card.                                                                                                                                                          |
| `bucket_minutes`                                   | `60`                         | Bucket size for `columns` and `strip`, at least 5.                                                                                                                                                                                               |
| `smoothing_minutes`                                |                              | Averaging bucket of `sparkline` in minutes, at least 5 (default: one point per 12 px of width).                                                                                                                                                  |
| `tap_action` / `hold_action` / `double_tap_action` | more-info / more-info / none | Defaults for every entity, see [Actions](/cards/entity-options#actions).                                                                                                                                                                         |
| `hover`                                            | `false`                      | Default for every section and entity, see [Hover](#hover).                                                                                                                                                                                       |

### Section options

| Option                                   | Default        | Description                                                                          |
| ---------------------------------------- | -------------- | ------------------------------------------------------------------------------------ |
| `entities`                               |                | Entity ids or [entity objects](/cards/entity-options#entity-options) (required).     |
| `layout`                                 | `list`         | `list`, `grid`, `hero`, `row`, `column` or `table`.                                  |
| `divider`                                | `false`        | Draws a line above the section (never for the first one).                            |
| `columns`                                | card `columns` | Cells per row in a grid section.                                                     |
| `align`                                  | card `align`   | Overrides the card value for this section.                                           |
| `show_name` / `show_value` / `show_icon` | card values    | Item options for this section; entities can override them again.                     |
| `name_position`                          | card value     | Where a row item's name sits; entities can override it again.                        |
| `hover`                                  | card value     | Default for the section's entities; entities can override it again.                  |
| `visibility`                             |                | Drawn only while the [conditions](/guide/visibility) hold (and one entity is shown). |

### Grid defaults

12 columns, `rows: auto`, at least 6 columns and 2 rows (3 when a section is a hero); see [Sizing in sections](/guide/sizing). Given more height, the `sparkline` and `columns` plots share it; without them the sections stay at the top unless `vertical_align` says otherwise.

### Home Assistant options

Like every card, this one also accepts `grid_options`, `visibility`, `layout_options`, `view_layout` and `card_mod`, passed through to Home Assistant; see [Sizing in sections](/guide/sizing). The card's own `visibility` hides the whole card; its entities, header entities and sections take their own, see [Visibility](/guide/visibility). `fill_height: false` keeps the card at its own height beside a taller card; see [Filling the height](/guide/sizing#filling-the-height).
