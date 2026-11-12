# Entity Card Pro

::: warning Deprecated

The entity card is deprecated: it still works in 3.0 and goes in 4.0. Use a [tile](/cards/tile-card), or a [poster](/cards/poster-card) for one large value; [Moving to 3.0](/guide/migrating#the-entity-card) says what changes.

:::

`custom:entity-card-pro` shows one entity as a tile: icon, name and value in one row, or with a gauge, bar or graph below. The entity keys sit directly on the card; the [entity options](/cards/entity-options) explain every one of them.

## Basic

The tile takes the entity's icon, friendly name and formatted state, and colours the icon as Home Assistant does (plain sensors in the primary colour).

::: live

```yaml
type: custom:entity-card-pro
entity: sensor.living_room_temperature
```

:::

## Name and value

`name` replaces the friendly name, `decimals` rounds the value, `unit` overrides the unit, `prefix` and `suffix` wrap the value in text.

::: live

```yaml
type: custom:entity-card-pro
entity: sensor.living_room_temperature
name: Living room
decimals: 1
suffix: " inside"
```

:::

## Rules

`rules` pick colour, icon and label by value (`below` / `above`) or by `state`; the first rule that matches wins. The label sits next to the value; see [Rules](/cards/entity-options#rules).

::: live

```yaml
type: custom:entity-card-pro
entity: sensor.living_room_temperature
name: Living room
decimals: 1
rules:
  - { below: 19, color: blue, icon: mdi:snowflake, label: Cold }
  - { below: 24, color: green, icon: mdi:thermometer, label: Comfortable }
  - { above: 24, color: orange, icon: mdi:sun-thermometer, label: Warm }
```

:::

State rules work the same way for anything that is not a number.

::: live

```yaml
type: custom:entity-card-pro
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

## Controls

`control: auto` adds the control the entity's domain calls for: a light gets a switch and a brightness slider, a cover its buttons and a position slider, a thermostat a stepper. `control: toggle` and the other names pick one; see [Controls](/cards/entity-controls).

::: live

```yaml
- type: custom:entity-card-pro
  entity: light.living_room
  rules:
    - { state: "on", color: amber, label: "On" }
    - { state: "off", color: grey, label: "Off" }
  control: auto
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: switch.coffee_machine
  control: toggle
  grid_options: { columns: 6 }
```

:::

## Visuals

`visual` changes how the value is drawn: the default `icon`, a `ring` around the icon, a `badge` pill, or a `gauge`, `bar`, `sparkline`, `columns` or `strip` block below the row. `min` and `max` set the range for ring, gauge and bar.

::: live

```yaml
type: custom:entity-card-pro
entity: sensor.robot_battery
name: Robot battery
visual: ring
rules:
  - { below: 20, color: red, label: Replace }
  - { below: 50, color: amber }
  - { above: 50, color: green }
```

:::

All eight side by side. The history visuals (`sparkline`, `columns`, `strip`) show the last `hours_to_show` hours, columns and strip in buckets of `bucket_minutes`.

::: live

```yaml
- type: custom:entity-card-pro
  entity: sensor.office_temperature
  name: Icon
  decimals: 1
  visual: icon
  rules:
    - { below: 19, color: blue, icon: mdi:snowflake }
    - { below: 24, color: green, icon: mdi:thermometer }
    - { above: 24, color: orange, icon: mdi:sun-thermometer }
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: sensor.robot_battery
  name: Ring
  visual: ring
  rules:
    - { below: 20, color: red }
    - { below: 50, color: amber }
    - { above: 50, color: green }
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: sensor.power_consumption
  name: Gauge
  decimals: 0
  visual: gauge
  min: 0
  max: 3000
  rules:
    - { below: 500, color: green }
    - { below: 1500, color: amber }
    - { above: 1500, color: red }
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: sensor.bathroom_humidity
  name: Bar
  decimals: 0
  visual: bar
  rules:
    - { below: 60, color: green, label: OK }
    - { below: 70, color: amber, label: Humid }
    - { above: 70, color: red, label: Ventilate }
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: sensor.dew_point
  name: Sparkline
  color: purple
  decimals: 1
  visual: sparkline
  hours_to_show: 12
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: sensor.wind_gust
  name: Columns
  color: teal
  decimals: 1
  visual: columns
  hours_to_show: 12
  bucket_minutes: 30
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: person.malte
  name: Badge
  visual: badge
  rules:
    - { state: home, color: green, label: Home }
    - { state: not_home, color: grey, label: Away }
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: binary_sensor.rain
  name: Strip
  visual: strip
  rules:
    - { state: "on", color: blue, icon: mdi:weather-rainy, label: Rain }
    - { state: "off", color: grey, icon: mdi:weather-cloudy, label: No rain }
  hours_to_show: 24
  bucket_minutes: 30
  grid_options: { columns: 6 }
```

:::

[Visuals](/cards/entity-options#visuals) on the entity options page explains each visual and its options, and the [history window](/cards/entity-options#history-window).

## Card tint

`tint_card: true` on a rule washes the whole card in that rule's colour while it matches. Use it for the states that deserve attention, not for the normal case.

::: live

```yaml
- type: custom:entity-card-pro
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

## Attribute

`attribute` shows an attribute instead of the state; `unit`, `decimals` and `min` / `max` apply to it like to a state. On a thermostat, `attribute: hvac_mode` shows the HVAC mode, which Home Assistant keeps in the state rather than in an attribute.

::: live

```yaml
- type: custom:entity-card-pro
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

## Text and templates

`value` replaces the state with plain text or a Jinja template. Without an `entity` the tile is a plain text or template card: give it a `name`, `icon` and `color`; there is nothing to open on tap.

::: live

```yaml
- type: custom:entity-card-pro
  name: Bins
  icon: mdi:recycle
  color: green
  value: Paper on Tuesday
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  name: Lights on
  icon: mdi:lightbulb-group
  color: amber
  value: "{{ states.light | selectattr('state', 'eq', 'on') | list | count }} of {{ states.light | list | count }}"
  grid_options: { columns: 6 }
```

:::

### Templates everywhere

`name`, `icon`, `color`, `secondary` and `value` all take templates. This tile compares two sensors and changes its whole look with the result.

::: live

```yaml
type: custom:entity-card-pro
entity: sensor.outdoor_temperature
name: "{{ 'Warmer outside' if states('sensor.outdoor_temperature') | float(0) > states('sensor.living_room_temperature') | float(0) else 'Warmer inside' }}"
secondary: "Outside {{ states('sensor.outdoor_temperature') }} °C · inside {{ states('sensor.living_room_temperature') }} °C"
icon: "{{ 'mdi:home-export-outline' if states('sensor.outdoor_temperature') | float(0) > states('sensor.living_room_temperature') | float(0) else 'mdi:home-import-outline' }}"
color: "{{ 'orange' if states('sensor.outdoor_temperature') | float(0) > states('sensor.living_room_temperature') | float(0) else 'blue' }}"
```

:::

### Counting with templates

A template value that looks like a number gets rules, decimals and a unit like a state. Here the tile counts open windows and lights.

::: live

```yaml
- type: custom:entity-card-pro
  entity: binary_sensor.window_kitchen
  name: Open windows
  icon: mdi:window-open-variant
  value: "{{ states.binary_sensor | selectattr('attributes.device_class', 'eq', 'window') | selectattr('state', 'eq', 'on') | list | count }}"
  rules:
    - { below: 1, color: green, label: All closed }
    - { above: 1, color: red, label: Airing, tint_card: true }
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: light.living_room
  name: Lights on
  icon: mdi:lightbulb-group
  value: "{{ states.light | selectattr('state', 'eq', 'on') | list | count }}"
  suffix: " of 8"
  rules:
    - { below: 1, color: grey, label: All off }
    - { above: 1, color: amber, label: Some on }
  grid_options: { columns: 6 }
```

:::

## Actions

A tile is a button. `tap_action` runs a scene, opens a dashboard or a URL, or toggles; `hold_action` and `double_tap_action` add two more. See [Actions](/cards/entity-options#actions) for every field.

::: live

```yaml
- type: custom:entity-card-pro
  entity: scene.movie_night
  name: Movie night
  value: Activate
  icon: mdi:movie-open
  color: deep-purple
  tap_action: { action: perform-action, perform_action: scene.turn_on, target: { entity_id: scene.movie_night } }
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: light.living_room
  name: Sofa lamp
  rules:
    - { state: "on", color: amber, label: "On" }
    - { state: "off", color: grey, label: "Off" }
  tap_action: { action: toggle }
  hold_action: { action: more-info }
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: sensor.energy_today
  name: Energy dashboard
  icon: mdi:open-in-app
  color: teal
  value: Open
  tap_action: { action: navigate, navigation_path: /energy }
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
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

## Hover

`hover: true` shows what a click will do, as Home Assistant's tile does: a light layer in the tile's colour under the pointer, a stronger one while pressed. An icon that is a switch (`control_position: lead`) and every [control](/cards/entity-controls) answer on their own. Touch screens show only the press. See [Hover](/cards/entity-options#hover).

::: live

```yaml
- type: custom:entity-card-pro
  entity: light.kitchen
  hover: true
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: light.hallway
  name: Hallway · tap the icon
  control: toggle
  control_position: lead
  hover: true
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: cover.living_room_blinds
  control: buttons
  hover: true
- type: custom:entity-card-pro
  entity: light.living_room
  control: slider
  hover: true
```

:::

## Reference

All [entity options](/cards/entity-options#entity-options) plus:

| Option                                             | Default                      | Description                                                                                     |
| -------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------- |
| `toggle`                                           | `false`                      | Deprecated spelling of `control: toggle`.                                                       |
| `secondary`                                        |                              | Line under the name instead of the value and label. Template allowed.                           |
| `hours_to_show`                                    | `24`                         | History window for `sparkline`, `columns` and `strip`, at least 1.                              |
| `bucket_minutes`                                   | `60`                         | Bucket size for `columns` and `strip`, at least 5.                                              |
| `smoothing_minutes`                                |                              | Averaging bucket of `sparkline` in minutes, at least 5 (default: one point per 12 px of width). |
| `tap_action` / `hold_action` / `double_tap_action` | more-info / more-info / none | See [Actions](/cards/entity-options#actions).                                                   |
| `hover`                                            | `false`                      | Hover and press layers on the tile, its icon and its controls, see [Hover](#hover).             |

### Grid defaults

6 columns, `rows: auto`: one row for a plain tile, more for the block visuals (`gauge`, `bar`, `sparkline`, `columns`, `strip`) and controls, at least 2 rows with a `sparkline` or `columns`. Given more height, a `sparkline` or `columns` plot fills the card and other tiles centre their content; see [Filling the height](/guide/sizing#filling-the-height).

### Home Assistant options

Like every card, this one also accepts `grid_options`, `visibility`, `layout_options`, `view_layout` and `card_mod`, passed through to Home Assistant; see [Sizing in sections](/guide/sizing). `fill_height: false` keeps the card at its own height beside a taller card; see [Filling the height](/guide/sizing#filling-the-height).
