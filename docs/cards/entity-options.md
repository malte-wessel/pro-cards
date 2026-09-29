# Entity options

The [entity card](/cards/entity-card), the [entity group card](/cards/entity-group-card) and the [entity sections card](/cards/entity-sections-card) describe an entity with the same keys. On the entity card they sit directly on the card; in a group or section they are the items of `entities`, either a plain entity id or an object. The first row below is the bare id, the second an object with the options this page explains.

::: live

```yaml
type: custom:entity-group-card
entities:
  - sensor.living_room_temperature
  - entity: light.living_room
    name: Sofa lamp
    rules:
      - { state: "on", color: amber, label: "On" }
      - { state: "off", color: grey, label: "Off" }
```

:::

## Value and attribute

By default the card shows the entity state, formatted with the entity's unit. Two keys change that:

| Key         | Shows                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------- |
| `attribute` | an attribute of the entity, for example `attribute: current_position`                     |
| `value`     | a Jinja template (<code v-pre>{{ … }}</code>) or plain text; an `entity` is then optional |

`unit`, `decimals` (0 to 3), `prefix` and `suffix` apply to whatever is shown. Rules compare against the numeric value, so they also work on attributes and template results.

### Template

Any string containing <code v-pre>{{ }}</code> is rendered by Home Assistant. Templates are supported for `title`, `icon`, `name`, `secondary`, `color` and `value`; a template result that looks like a number gets decimals, unit and rules like a state. `unit`, `prefix`, `suffix` and rule labels are plain text. Home Assistant also renders <code v-pre>{% %}</code> blocks; the examples on this site only evaluate <code v-pre>{{ }}</code> expressions.

::: live

```yaml
type: custom:entity-group-card
title: Computed values
icon: mdi:calculator-variant
layout: grid
columns: 2
entities:
  - entity: sensor.outdoor_temperature
    name: Temperature spread
    icon: mdi:thermometer-lines
    value: "{{ (states('sensor.outdoor_temperature') | float(0) - states('sensor.dew_point') | float(0)) | round(1) }}"
    unit: K
    decimals: 1
    rules:
      - { below: 2, color: blue, label: Fog risk }
      - { below: 6, color: teal, label: Humid }
      - { above: 6, color: green, label: Dry }
  - entity: light.living_room
    name: Lights on
    icon: mdi:lightbulb-group
    color: amber
    value: "{{ states.light | selectattr('state', 'eq', 'on') | list | count }} of {{ states.light | list | count }}"
  - entity: sensor.outdoor_temperature
    name: "{{ 'Warmer outside' if states('sensor.outdoor_temperature') | float(0) > states('sensor.living_room_temperature') | float(0) else 'Warmer inside' }}"
    icon: "{{ 'mdi:home-export-outline' if states('sensor.outdoor_temperature') | float(0) > states('sensor.living_room_temperature') | float(0) else 'mdi:home-import-outline' }}"
    color: "{{ 'orange' if states('sensor.outdoor_temperature') | float(0) > states('sensor.living_room_temperature') | float(0) else 'blue' }}"
    value: "{{ (states('sensor.outdoor_temperature') | float(0) - states('sensor.living_room_temperature') | float(0)) | round(1) }}"
    unit: K
    prefix: "Δ "
  - entity: binary_sensor.window_kitchen
    name: Open windows
    icon: mdi:window-open-variant
    value: "{{ states.binary_sensor | selectattr('attributes.device_class', 'eq', 'window') | selectattr('state', 'eq', 'on') | list | count }}"
    rules:
      - { below: 1, color: green, label: All closed }
      - { above: 1, color: red, label: Airing }
```

:::

### Secondary line

`secondary` adds a line under the name on the entity card and the hero lead. Templates make it a status line.

::: live

```yaml
type: custom:entity-group-card
title: Robot vacuum
icon: mdi:robot-vacuum
layout: hero
entities:
  - entity: sensor.robot_progress
    name: Cleaning progress
    secondary: "{{ states('vacuum.robot') | replace('docked', 'Parked') | replace('cleaning', 'Cleaning') }} · {{ states('sensor.robot_current_room') }} · Battery {{ states('sensor.robot_battery') }} %"
    icon: mdi:robot-vacuum
    color: primary
    unit: "%"
    visual: ring
  - { entity: sensor.robot_total_cleanings, name: Cleanings, visual: badge }
  - { entity: sensor.robot_last_area, name: Last area, visual: badge }
  - entity: sensor.robot_dustbin_remaining
    name: Dustbin
    decimals: 0
    visual: bar
    rules:
      - { below: 40, color: red, label: Empty soon }
      - { above: 40, color: green }
```

:::

### Plain text

Any other string is shown as is. Useful for scene rows where the value is a verb.

::: live

```yaml
type: custom:entity-group-card
title: Scenes
icon: mdi:palette
entities:
  - entity: scene.movie_night
    color: deep-purple
    value: Activate
    tap_action: { action: perform-action, perform_action: scene.turn_on, target: { entity_id: scene.movie_night } }
  - entity: scene.dinner
    color: orange
    value: Activate
    tap_action: { action: perform-action, perform_action: scene.turn_on, target: { entity_id: scene.dinner } }
  - entity: scene.good_night
    color: indigo
    value: Activate
    tap_action: { action: perform-action, perform_action: scene.turn_on, target: { entity_id: scene.good_night } }
```

:::

## Rules

`rules` is a list; the first entry that matches decides colour, icon, label and card tint. Write them in the order they should be tried.

| Matcher | Matches when                                                                   |
| ------- | ------------------------------------------------------------------------------ |
| `below` | the value is numeric and `< below`                                             |
| `above` | the value is numeric and `>= above`                                            |
| `state` | the state (or attribute, or value) text equals `state`; quote `"on"` / `"off"` |

A rule may combine `below` and `above` for a range. Numeric rules never match text, so numeric and state rules can share one list. States that no rule matches keep the entity icon and use `primary`, or `grey` for off-like states (`off`, `closed`, `idle`, `standby`, `docked`, `not_home`, `disarmed`, `clear`). An explicit `color` or `icon` on the entity always wins over the rules.

::: live

```yaml
type: custom:entity-group-card
title: Room temperatures
icon: mdi:thermometer
entities:
  - entity: sensor.living_room_temperature
    name: Living room
    decimals: 1
    rules:
      - { below: 16, color: blue, icon: mdi:snowflake, label: Too cold }
      - { below: 22, color: green, icon: mdi:thermometer, label: Comfort }
      - { below: 24, color: amber, icon: mdi:white-balance-sunny, label: Warm }
      - { above: 24, color: red, icon: mdi:fire, label: Hot, tint_card: true }
  - entity: sensor.bathroom_temperature
    name: Bathroom
    decimals: 1
    rules:
      - { below: 16, color: blue, icon: mdi:snowflake, label: Too cold }
      - { below: 22, color: green, icon: mdi:thermometer, label: Comfort }
      - { below: 24, color: amber, icon: mdi:white-balance-sunny, label: Warm }
      - { above: 24, color: red, icon: mdi:fire, label: Hot, tint_card: true }
  - entity: sensor.office_temperature
    name: Office
    decimals: 1
    rules:
      - { below: 16, color: blue, icon: mdi:snowflake, label: Too cold }
      - { below: 22, color: green, icon: mdi:thermometer, label: Comfort }
      - { below: 24, color: amber, icon: mdi:white-balance-sunny, label: Warm }
      - { above: 24, color: red, icon: mdi:fire, label: Hot, tint_card: true }
  - entity: sensor.bedroom_temperature
    name: Bedroom
    decimals: 1
    rules:
      - { below: 16, color: blue, icon: mdi:snowflake, label: Too cold }
      - { below: 22, color: green, icon: mdi:thermometer, label: Comfort }
      - { below: 24, color: amber, icon: mdi:white-balance-sunny, label: Warm }
      - { above: 24, color: red, icon: mdi:fire, label: Hot, tint_card: true }
```

:::

::: tip YAML anchors
Home Assistant's YAML supports anchors (`&t`) and aliases (`*t`), handy for repeating the same rules across entities.
:::

State rules label text states, on a badge or in the secondary line.

::: live

```yaml
type: custom:entity-group-card
title: Devices & modes
icon: mdi:toggle-switch-outline
entities:
  - entity: sensor.washer_status
    name: Washing machine
    visual: badge
    rules:
      - { state: power_off, color: grey, icon: mdi:washing-machine-off, label: "Off" }
      - { state: initial, color: blue, icon: mdi:washing-machine, label: Ready }
      - { state: run, color: green, icon: mdi:washing-machine, label: Running }
      - { state: pause, color: amber, icon: mdi:pause-circle, label: Paused }
      - { state: end, color: teal, icon: mdi:washing-machine-alert, label: Done, tint_card: true }
  - entity: media_player.living_room_tv
    name: TV
    visual: badge
    rules:
      - { state: playing, color: green, icon: mdi:play-circle, label: Playing }
      - { state: paused, color: amber, icon: mdi:pause-circle, label: Paused }
      - { state: idle, color: grey, icon: mdi:television, label: Idle }
      - { state: "off", color: grey, icon: mdi:television-off, label: "Off" }
  - entity: climate.living_room
    name: Thermostat
    visual: badge
    rules:
      - { state: heat, color: orange, icon: mdi:radiator, label: Heating }
      - { state: "off", color: grey, icon: mdi:radiator-off, label: "Off" }
      - { state: auto, color: green, icon: mdi:calendar-clock, label: Schedule }
  - entity: cover.living_room_blinds
    name: Blinds
    visual: badge
    rules:
      - { state: open, color: amber, icon: mdi:window-shutter-open, label: Open }
      - { state: closed, color: grey, icon: mdi:window-shutter, label: Closed }
      - { state: opening, color: blue, icon: mdi:arrow-up-bold, label: Opening }
      - { state: closing, color: blue, icon: mdi:arrow-down-bold, label: Closing }
  - entity: input_boolean.night_mode
    name: Night mode
    rules:
      - { state: "on", color: indigo, icon: mdi:weather-night, label: Active }
      - { state: "off", color: grey, icon: mdi:weather-sunny, label: Inactive }
    toggle: true
  - entity: input_boolean.vacation_mode
    name: Vacation mode
    rules:
      - { state: "on", color: teal, icon: mdi:beach, label: Active, tint_card: true }
      - { state: "off", color: grey, icon: mdi:home, label: Inactive }
    toggle: true
```

:::

### Card tint

`tint_card: true` on a rule colours the whole card while that rule matches. In a group or sections card the first tinting entity wins.

::: live

```yaml
- type: custom:entity-card
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
- type: custom:entity-card
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

## Visuals

`visual` decides how the entity is drawn. Every visual uses the same value, rules, colour and actions; it only changes the picture. Three of them (`sparkline`, `columns`, `strip`) read the recorder history for the card's [history window](#history-window). The table lists which keys each visual reads; the sections below show them one by one.

| Visual      | Draws                                                              | Options                                    | Drawn in               |
| ----------- | ------------------------------------------------------------------ | ------------------------------------------ | ---------------------- |
| `icon`      | the entity icon in a coloured circle                               |                                            | everywhere             |
| `ring`      | a progress ring around the icon (grid cells: around the value)     | `min` / `max`                              | everywhere but headers |
| `gauge`     | a half-circle gauge with the value inside and `min` / `max` labels | `min` / `max`                              | tile, list, grid, hero |
| `bar`       | a horizontal progress bar under the value                          | `min` / `max`                              | tile, list, grid, hero |
| `sparkline` | a smoothed line of the last `hours_to_show` hours                  | `hours_to_show`                            | tile, list, grid, hero |
| `columns`   | one bar per `bucket_minutes` bucket, peak highlighted              | `hours_to_show`, `bucket_minutes`          | tile, list, grid, hero |
| `badge`     | a coloured pill with the rule label or the value                   | `rules[].label`                            | everywhere             |
| `strip`     | a timeline coloured by the matching rule per bucket                | `hours_to_show`, `bucket_minutes`, `rules` | tile, list, grid, hero |

"Everywhere" includes the compact items of the row, column and table layouts; header entities draw `icon` and `badge` only. See [Visuals in items and headers](#visuals-in-items-and-headers) for what happens to the others there.

### Icon

The default. The icon sits in a soft circle of the entity's colour, the value and the rule label follow. Where the icon and colour come from, in this order: a fixed `icon` / `color` on the entity, the first matching rule, the entity's own icon (or one derived from its `device_class`), and `primary`, or `grey` for off-like states such as `off`, `closed`, `idle` or `not_home`. Use it whenever the value itself is the message and rules only need to flag it.

::: live

```yaml
- type: custom:entity-card
  entity: sensor.office_temperature
  name: Office
  decimals: 1
  rules:
    - { below: 19, color: blue, icon: mdi:snowflake, label: Cold }
    - { below: 24, color: green, icon: mdi:thermometer, label: Comfort }
    - { above: 24, color: orange, icon: mdi:sun-thermometer, label: Warm }
  grid_options: { columns: 6 }
- type: custom:entity-card
  entity: light.kitchen
  name: Kitchen light
  toggle: true
  grid_options: { columns: 6 }
- type: custom:entity-card
  entity: climate.living_room
  name: Thermostat
  attribute: current_temperature
  decimals: 1
  icon: mdi:home-thermometer
  color: deep-orange
  rules:
    - { below: 20, color: blue, label: Cool }
    - { above: 20, color: red, label: Warm }
  grid_options: { columns: 6 }
- type: custom:entity-card
  entity: binary_sensor.door_front
  name: Front door
  rules:
    - { state: "on", color: red, label: Open }
    - { state: "off", color: green, label: Closed }
  grid_options: { columns: 6 }
```

:::

The thermostat tile shows the override: a fixed `icon` or `color` on the entity wins over the rules, which then only contribute the label.

### Ring

A progress ring around the icon. Progress is `(value − min) / (max − min)`; `min` and `max` default to the entity's `min` / `max` (or `min_value` / `max_value`) attributes and otherwise to 0 and 100, so percentage sensors need no configuration. The ring is not drawn when the value is not numeric or `max` is not above `min`; the icon stays. Colour follows the rules like everywhere else.

::: live

```yaml
- type: custom:entity-card
  entity: sensor.robot_battery
  name: Robot battery
  visual: ring
  rules:
    - { below: 20, color: red }
    - { below: 50, color: amber }
    - { above: 50, color: green }
  grid_options: { columns: 6 }
- type: custom:entity-card
  entity: sensor.uv_index
  name: UV index
  visual: ring
  decimals: 1
  min: 0
  max: 11
  rules:
    - { below: 3, color: green, label: Low }
    - { below: 6, color: amber, label: Moderate }
    - { below: 8, color: orange, label: High }
    - { above: 8, color: red, label: Very high }
  grid_options: { columns: 6 }
- type: custom:entity-card
  entity: light.living_room
  name: Brightness
  attribute: brightness
  visual: ring
  color: amber
  min: 0
  max: 255
  grid_options: { columns: 6 }
- type: custom:entity-card
  entity: sensor.robot_current_room
  name: Robot room
  visual: ring
  icon: mdi:robot-vacuum
  grid_options: { columns: 6 }
```

:::

In a `grid` layout the ring grows and the value moves inside it, replacing the icon. Rings also work in row, column and table items, but not in `header_entities`, where they show as a plain icon.

::: live

```yaml
type: custom:entity-group-card
title: Rings in a grid
icon: mdi:battery-charging
layout: grid
columns: 3
header_entities:
  - { entity: sensor.robot_battery, decimals: 0 }
entities:
  - entity: sensor.robot_battery
    name: Robot
    visual: ring
    decimals: 0
    rules:
      - { below: 20, color: red }
      - { above: 20, color: green }
  - entity: sensor.kitchen_window_battery
    name: Kitchen window
    visual: ring
    decimals: 0
    rules:
      - { below: 20, color: red }
      - { above: 20, color: green }
  - entity: sensor.weather_station_battery
    name: Weather station
    visual: ring
    decimals: 0
    rules:
      - { below: 20, color: red }
      - { above: 20, color: green }
```

:::

### Gauge

A half-circle gauge below the name with the formatted value in the arc and `min` and `max` printed as small labels at its ends. Same scale rules as the ring: `min` / `max` from the config, else from the entity attributes, else 0 to 100. The gauge is a block visual: it needs the extra height of a tile, list row, grid cell or hero lead, and the entity card switches to `rows: auto` for it.

::: live

```yaml
- type: custom:entity-card
  entity: sensor.power_consumption
  name: Power
  decimals: 0
  visual: gauge
  min: 0
  max: 3000
  rules:
    - { below: 500, color: green }
    - { below: 1500, color: amber }
    - { above: 1500, color: red }
  grid_options: { columns: 6 }
- type: custom:entity-card
  entity: sensor.uv_index
  name: UV index
  decimals: 1
  visual: gauge
  min: 0
  max: 11
  rules:
    - { below: 3, color: green, label: Low }
    - { below: 6, color: amber, label: Moderate }
    - { below: 8, color: orange, label: High }
    - { above: 8, color: red, label: Very high }
  grid_options: { columns: 6 }
- type: custom:entity-card
  entity: sensor.bathroom_humidity
  name: Humidity
  decimals: 0
  visual: gauge
  rules:
    - { below: 60, color: green }
    - { below: 70, color: amber }
    - { above: 70, color: red }
  grid_options: { columns: 6 }
- type: custom:entity-card
  entity: climate.living_room
  name: Room temperature
  attribute: current_temperature
  decimals: 1
  unit: °C
  visual: gauge
  min: 15
  max: 28
  rules:
    - { below: 19, color: blue }
    - { below: 24, color: green }
    - { above: 24, color: orange }
  grid_options: { columns: 6 }
```

:::

In a grid cell the gauge replaces the big value, since it already shows it.

### Bar

A thin horizontal bar under the value, filled to the same `(value − min) / (max − min)` progress as the ring and gauge. It is the quietest way to show a level; the rule `label`, if any, appears as the secondary line. Like the gauge it is a block visual and needs a tile, list row, grid cell or hero lead.

::: live

```yaml
- type: custom:entity-card
  entity: sensor.bathroom_humidity
  name: Bathroom humidity
  decimals: 0
  visual: bar
  rules:
    - { below: 60, color: green, label: OK }
    - { below: 70, color: amber, label: Humid }
    - { above: 70, color: red, label: Ventilate }
  grid_options: { columns: 6 }
- type: custom:entity-card
  entity: sensor.robot_dustbin_remaining
  name: Dustbin
  decimals: 0
  visual: bar
  rules:
    - { below: 40, color: red, label: Empty soon }
    - { above: 40, color: green, label: Fine }
  grid_options: { columns: 6 }
- type: custom:entity-card
  entity: cover.living_room_blinds
  name: Blinds
  attribute: current_position
  unit: "%"
  visual: bar
  color: amber
  grid_options: { columns: 6 }
- type: custom:entity-card
  entity: sensor.power_consumption
  name: Power
  decimals: 0
  visual: bar
  min: 0
  max: 3000
  rules:
    - { below: 500, color: green }
    - { below: 1500, color: amber }
    - { above: 1500, color: red }
  grid_options: { columns: 6 }
```

:::

### History window

`sparkline`, `columns` and `strip` fetch the recorder history of their entity and redraw it every five minutes. Two card-level keys shape the window; they apply to every history visual on the card (or on all sections of a sections card):

| Option           | Default | Description                                                                                                            |
| ---------------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `hours_to_show`  | `24`    | Length of the window in hours, at least 1. Shown as a small chip in the group header and as the left label of a strip. |
| `bucket_minutes` | `60`    | Bucket size for `columns` and `strip`, at least 5. The number of buckets is `hours_to_show × 60 / bucket_minutes`.     |

Entities without recorder history draw an empty plot. Hovering (or touching) a plot shows the value at that point and the time.

### Sparkline

A smoothed line with a soft area below it and a dot at the last value, for temperatures, prices and anything else that drifts. It reads `hours_to_show` only: the line is sampled to the width of the card, so `bucket_minutes` has no effect, and the vertical scale fits the data (with 10 % padding), so `min` / `max` are ignored too. Colour comes from the current value's rule or the fixed `color`; the whole line takes that colour.

::: live

```yaml
- type: custom:entity-card
  entity: sensor.outdoor_temperature
  name: Last 6 hours
  decimals: 1
  visual: sparkline
  hours_to_show: 6
  grid_options: { columns: 6 }
- type: custom:entity-card
  entity: sensor.outdoor_temperature
  name: Last 2 days
  decimals: 1
  visual: sparkline
  hours_to_show: 48
  color: teal
  grid_options: { columns: 6 }
- type: custom:entity-card
  entity: sensor.dew_point
  name: Dew point
  decimals: 1
  visual: sparkline
  hours_to_show: 12
  rules:
    - { below: 10, color: blue }
    - { below: 16, color: teal }
    - { above: 16, color: orange }
  grid_options: { columns: 6 }
- type: custom:entity-card
  entity: sensor.pressure
  name: Pressure
  decimals: 1
  visual: sparkline
  color: indigo
  hours_to_show: 24
  grid_options: { columns: 6 }
```

:::

### Columns

One bar per bucket, for quantities that come in portions: solar power, energy, rain, wind gusts. Each bar is the mean of its `bucket_minutes` bucket over the last `hours_to_show` hours; the baseline is 0 (or the lowest value if negative), the peak bucket is drawn solid and the others lighter, and hovering a bar shows its value and time. Fine buckets over a short window give a detailed profile; coarse buckets over a long window give a daily pattern.

::: live

```yaml
- type: custom:entity-card
  entity: sensor.solar_power
  name: Solar 6 h / 15 min
  decimals: 1
  visual: columns
  color: amber
  hours_to_show: 6
  bucket_minutes: 15
  grid_options: { columns: 6 }
- type: custom:entity-card
  entity: sensor.solar_power
  name: Solar 24 h / 1 h
  decimals: 1
  visual: columns
  color: amber
  hours_to_show: 24
  bucket_minutes: 60
  grid_options: { columns: 6 }
- type: custom:entity-card
  entity: sensor.wind_gust
  name: Gusts 12 h / 30 min
  decimals: 1
  visual: columns
  color: teal
  hours_to_show: 12
  bucket_minutes: 30
  grid_options: { columns: 6 }
- type: custom:entity-card
  entity: sensor.power_consumption
  name: Power by rule
  decimals: 0
  visual: columns
  hours_to_show: 12
  bucket_minutes: 30
  rules:
    - { below: 500, color: green }
    - { below: 1500, color: amber }
    - { above: 1500, color: red }
  grid_options: { columns: 6 }
```

:::

### Badge

A coloured pill instead of the plain value. The pill shows the matching rule's `label`, or the formatted value when no rule has a label, and takes the rule colour. Because the pill already carries the label, the badge has no secondary line unless you set `secondary`. It is made for states that have names (presence, appliance programs, modes) and works in items and headers too, where `show_value: true` shows the pill.

::: live

```yaml
- type: custom:entity-card
  entity: person.alex
  name: Presence
  visual: badge
  rules:
    - { state: home, color: green, label: Home }
    - { state: not_home, color: grey, label: Away }
  grid_options: { columns: 6 }
- type: custom:entity-card
  entity: sensor.robot_current_room
  name: Robot room
  visual: badge
  icon: mdi:robot-vacuum
  color: primary
  grid_options: { columns: 6 }
- type: custom:entity-card
  entity: sensor.power_consumption
  name: Power
  decimals: 0
  visual: badge
  rules:
    - { below: 500, color: green, label: Low }
    - { below: 1500, color: amber, label: Normal }
    - { above: 1500, color: red, label: High }
  grid_options: { columns: 6 }
- type: custom:entity-card
  entity: sensor.washer_status
  name: Washer
  visual: badge
  secondary: "{{ states('sensor.washer_remaining') }} min left"
  rules:
    - { state: power_off, color: grey, icon: mdi:washing-machine-off, label: "Off" }
    - { state: run, color: green, icon: mdi:washing-machine, label: Running }
    - { state: end, color: teal, icon: mdi:washing-machine-alert, label: Done }
  grid_options: { columns: 6 }
```

:::

Badges in a row layout: `show_value: true` puts the pill next to the icon.

::: live

```yaml
type: custom:entity-group-card
title: Who is home
icon: mdi:account-group
layout: row
align: space-between
show_value: true
entities:
  - entity: person.alex
    visual: badge
    rules:
      - { state: home, color: green, label: Home }
      - { state: not_home, color: grey, label: Away }
  - entity: person.sam
    visual: badge
    rules:
      - { state: home, color: green, label: Home }
      - { state: not_home, color: grey, label: Away }
  - entity: person.kim
    visual: badge
    rules:
      - { state: home, color: green, label: Home }
      - { state: not_home, color: grey, label: Away }
```

:::

### Strip

A timeline of the last `hours_to_show` hours, one block per `bucket_minutes` bucket, each coloured by the rule that bucket matches. On a numeric sensor a bucket is matched by its mean value; on any other entity by the last state in the bucket. `rules` are therefore what gives the strip its colours: a strip without rules is a single-colour bar. The current bucket has an outline, the axis reads `−N h` on the left and `now` on the right, and hovering a block shows its value or state and time.

::: live

```yaml
- type: custom:entity-card
  entity: binary_sensor.rain
  name: Rain 24 h / 30 min
  visual: strip
  hours_to_show: 24
  bucket_minutes: 30
  rules:
    - { state: "on", color: blue, icon: mdi:weather-rainy, label: Rain }
    - { state: "off", color: grey, icon: mdi:weather-cloudy, label: No rain }
  grid_options: { columns: 6 }
- type: custom:entity-card
  entity: binary_sensor.motion_hallway
  name: Motion 12 h / 15 min
  visual: strip
  hours_to_show: 12
  bucket_minutes: 15
  rules:
    - { state: "on", color: amber, icon: mdi:motion-sensor, label: Detected }
    - { state: "off", color: grey, icon: mdi:motion-sensor-off, label: Clear }
  grid_options: { columns: 6 }
```

:::

The same on numeric sensors, colouring every hourly bucket by the range its mean falls in:

::: live

```yaml
type: custom:entity-group-card
title: Last 24 h
icon: mdi:chart-timeline
hours_to_show: 24
bucket_minutes: 60
entities:
  - entity: sensor.outdoor_temperature
    name: Outdoor temperature
    decimals: 1
    visual: strip
    rules:
      - { below: 0, color: indigo }
      - { below: 16, color: blue }
      - { below: 26, color: green }
      - { above: 26, color: orange }
  - entity: sensor.wind_speed
    name: Wind
    decimals: 0
    visual: strip
    rules:
      - { below: 10, color: green }
      - { below: 20, color: amber }
      - { below: 35, color: orange }
      - { above: 35, color: red }
  - entity: sensor.illuminance
    name: Daylight
    decimals: 0
    visual: strip
    rules:
      - { below: 1, color: indigo }
      - { below: 100, color: blue }
      - { below: 10000, color: blue-grey }
      - { below: 30000, color: amber }
      - { above: 30000, color: orange }
```

:::

### Visuals in items and headers

The row, column and table layouts show every entity as a compact item, and `header_entities` sit on the title line. There is no room for a block there, so items draw `icon`, `ring` and `badge` only, and the header line, which is smaller still, draws `icon` and `badge` only. Any other visual on such an entity falls back to `icon` and logs a warning in the browser console. `show_icon`, `show_value` and `show_name` decide what the item shows; see [Item options](#item-options).

## Actions

`tap_action`, `hold_action` and `double_tap_action` accept every Home Assistant action: `more-info` (default for tap and hold), `toggle`, `navigate`, `url`, `perform-action` (also `call-service`), `assist`, `fire-dom-event` and `none`. Set them on the card as defaults or per entity, as an object or as a bare action name (`tap_action: toggle`). The card only detects the gesture; Home Assistant runs the action, so you get its confirmation dialog, haptic feedback in the companion app and any action HA adds later. `confirmation` asks before running; the switch from `toggle: true` never asks and always calls `homeassistant.toggle`.

::: live

```yaml
type: custom:entity-group-card
title: Quick access
icon: mdi:lightning-bolt
tap_action: { action: more-info }
entities:
  - entity: light.office
    name: Office (tap toggles)
    rules:
      - { state: "on", color: amber, label: "On" }
      - { state: "off", color: grey, label: "Off" }
    tap_action: { action: toggle }
    hold_action: { action: more-info }
  - entity: sensor.outdoor_temperature
    name: Open the weather dashboard
    icon: mdi:open-in-app
    color: blue
    tap_action: { action: navigate, navigation_path: /dashboard-weather/overview }
  - entity: script.check_windows
    name: Check windows (script)
    icon: mdi:play-circle-outline
    color: teal
    value: Run
    tap_action:
      action: perform-action
      perform_action: script.check_windows
      confirmation: { text: Run the window check now? }
  - entity: input_boolean.night_mode
    name: Night mode (double tap)
    rules:
      - { state: "on", color: indigo, icon: mdi:weather-night, label: Active }
      - { state: "off", color: grey, icon: mdi:weather-sunny, label: Inactive }
    tap_action: { action: none }
    double_tap_action: { action: toggle }
  - entity: person.sam
    name: Sam (no action)
    rules:
      - { state: home, color: green, label: Home }
      - { state: not_home, color: grey, label: Away }
    tap_action: { action: none }
    hold_action: { action: none }
```

:::

`perform-action` takes `data` and `target` like a Home Assistant action; `url` opens `url_path` in a new tab; `entity` points more-info or toggle at another entity than the row shows.

::: live

```yaml
type: custom:entity-group-card
title: Shortcuts
icon: mdi:gesture-tap
layout: row
align: space-between
entities:
  - entity: light.living_room
    name: Dim
    icon: mdi:brightness-5
    color: amber
    tap_action:
      action: perform-action
      perform_action: light.turn_on
      target: { entity_id: light.living_room }
      data: { brightness_pct: 30 }
  - entity: cover.living_room_blinds
    name: Blinds
    icon: mdi:window-shutter
    tap_action:
      action: perform-action
      perform_action: cover.toggle
      target: { entity_id: cover.living_room_blinds }
  - entity: light.kitchen
    name: All off
    icon: mdi:power
    color: red
    tap_action: { action: toggle, entity: light.living_room, confirmation: true }
  - entity: sensor.outdoor_temperature
    name: Forecast
    icon: mdi:weather-partly-cloudy
    color: blue
    tap_action: { action: url, url_path: https://www.dwd.de }
  - { entity: vacuum.robot, name: Robot, icon: mdi:robot-vacuum, tap_action: more-info, hold_action: none }
```

:::

### Action options

| Field                        | Actions           | Description                                                                                                                                             |
| ---------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action`                     |                   | `more-info`, `toggle`, `navigate`, `url`, `perform-action`, `call-service`, `assist`, `fire-dom-event` or `none`. A bare string sets `action` only.     |
| `entity`                     | more-info, toggle | Act on this entity instead of the row's entity.                                                                                                         |
| `navigation_path`            | navigate          | Dashboard path; `navigation_replace: true` replaces the history entry.                                                                                  |
| `url_path`                   | url               | Opened in a new tab.                                                                                                                                    |
| `perform_action` / `service` | perform-action    | `domain.action`; `service` is the legacy spelling.                                                                                                      |
| `data` / `service_data`      | perform-action    | Action data; `service_data` is the legacy spelling.                                                                                                     |
| `target`                     | perform-action    | `{ entity_id, device_id, area_id }`.                                                                                                                    |
| `pipeline_id`                | assist            | The assist pipeline; `start_listening: true` starts the microphone right away.                                                                          |
| `confirmation`               | all               | `true` or `{ text, title, confirm_text, dismiss_text, exemptions }`; Home Assistant shows its dialog, `exemptions: [{ user }]` skip it for those users. |

`fire-dom-event` passes every other key of the action to the DOM event, which is how [browser_mod](https://github.com/thomasloven/hass-browser_mod) popups are opened: `tap_action: { action: fire-dom-event, browser_mod: { service: browser_mod.popup, data: { … } } }`. The docs demo only shows a toast for `assist` and `fire-dom-event`.

## Item options

Row, column and table layouts and header entities show every entity as a compact item. Four keys decide what an item shows; they cascade from the card to the section to the entity.

| Option          | Row     | Column  | Table   | Header entities | Description                                        |
| --------------- | ------- | ------- | ------- | --------------- | -------------------------------------------------- |
| `show_name`     | `true`  | `true`  | `true`  | `false`         | The name, above or below the icon (table: the key) |
| `show_value`    | `false` | `false` | `true`  | `true`          | The value next to the icon (badge: the pill)       |
| `show_icon`     | `true`  | `true`  | `false` | `true`          | The round icon (table: an icon column)             |
| `name_position` | `below` | `above` |         |                 | `above` or `below` the icon                        |

## Entity options

All keys an entity accepts, grouped by what they do. "Applies to" names the visuals or layouts a key matters for; the rest apply everywhere.

### Identity and value

| Option              | Default       | Applies to      | Description                                                                                     |
| ------------------- | ------------- | --------------- | ----------------------------------------------------------------------------------------------- |
| `entity`            |               | all             | Entity id. Optional when `value` is plain text or a template.                                   |
| `name`              | friendly name | all             | Text or template.                                                                               |
| `secondary`         |               | tile, hero lead | Line under the name instead of the value and label. Template allowed.                           |
| `attribute`         |               | all             | Show this attribute instead of the state.                                                       |
| `value`             |               | all             | A template or plain text instead of the state; see [Value and attribute](#value-and-attribute). |
| `unit`              | entity unit   | all             | Unit text after the value.                                                                      |
| `decimals`          | as reported   | all             | 0 to 3.                                                                                         |
| `prefix` / `suffix` |               | all             | Text around the value.                                                                          |

### Look

| Option   | Default     | Applies to | Description                                                                                                                                                                             |
| -------- | ----------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `visual` | `icon`      | all        | `icon`, `ring`, `gauge`, `bar`, `sparkline`, `columns`, `badge` or `strip`; see [Visuals](#visuals). Block visuals fall back to `icon` in items and headers.                            |
| `icon`   | entity icon | all        | Fixed icon that overrides rule icons. Template allowed.                                                                                                                                 |
| `color`  | HA state    | all        | Fixed colour that overrides rule colours. Without it the entity uses Home Assistant's state colour (see the [colour guide](/guide/colours)), plain sensors `primary`. Template allowed. |
| `rules`  |             | all        | List of `{ state, below, above, color, icon, label, tint_card }`, first match wins; see [Rules](#rules). `below` and `above` may be numeric strings.                                    |

### Scale

| Option        | Default                                       | Applies to       | Description                                                                                                            |
| ------------- | --------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `min` / `max` | entity `min` / `max` attributes, else 0 / 100 | ring, gauge, bar | Bounds of the progress `(value − min) / (max − min)`. Nothing is drawn when the value is not numeric or `max` ≤ `min`. |

### History

These two keys sit on the card, not on the entity, and apply to every history visual on it; see [History window](#history-window).

| Option           | Default | Applies to                | Description                                               |
| ---------------- | ------- | ------------------------- | --------------------------------------------------------- |
| `hours_to_show`  | `24`    | sparkline, columns, strip | Window in hours, at least 1.                              |
| `bucket_minutes` | `60`    | columns, strip            | Bucket size in minutes, at least 5. Sparklines ignore it. |

### Controls

| Option                                             | Default       | Applies to                   | Description                                                  |
| -------------------------------------------------- | ------------- | ---------------------------- | ------------------------------------------------------------ |
| `toggle`                                           | `false`       | tile, list, hero lead, table | Switch on the right that calls `homeassistant.toggle`.       |
| `tap_action` / `hold_action` / `double_tap_action` | card defaults | all                          | Per-entity overrides, see [Action options](#action-options). |

### Items

| Option                                   | Default    | Applies to                 | Description                                                   |
| ---------------------------------------- | ---------- | -------------------------- | ------------------------------------------------------------- |
| `show_name` / `show_value` / `show_icon` | per layout | row, column, table, header | What a compact item shows, see [Item options](#item-options). |
| `name_position`                          | per layout | row, column                | `above` or `below` the icon: row `below`, column `above`.     |

Every card also accepts the Home Assistant keys `grid_options`, `visibility`, `layout_options`, `view_layout` and `card_mod`; see [Sizing in sections](/guide/sizing).
