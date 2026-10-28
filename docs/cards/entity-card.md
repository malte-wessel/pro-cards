# Entity Card Pro

`custom:entity-card-pro` shows one entity as a tile: icon, name and value in one row of the sections grid, or with a gauge, bar or graph below. The entity keys sit directly on the card; the [entity options](/cards/entity-options) explain every one of them. This page builds a tile up option by option.

## Basic

Two lines. The tile takes the entity's icon, friendly name and formatted state, and colours the icon like Home Assistant does (lights amber when on, people green at home, plain sensors in the primary colour).

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

`rules` pick colour, icon and label by value (`below` / `above`) or by `state`. The first rule that matches wins. The label sits next to the value (in the compact items of the group card it stands in for the value, see [Rules](/cards/entity-options#rules)).

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

`control: auto` adds the control the entity's domain calls for: a light gets a switch and a brightness slider, a cover its buttons and a position slider, a thermostat a stepper. `control: toggle` and the other names pick one; see [Controls](/cards/controls). `grid_options` here sizes the tiles to half a section, see [Sizing in sections](/guide/sizing).

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

All eight side by side. The history visuals (`sparkline`, `columns`, `strip`) read the recorder history for the card's `hours_to_show`, in buckets of `bucket_minutes` for columns and strip.

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
  entity: person.alex
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

Each visual, the options it reads and the layouts it is drawn in are explained one by one under [Visuals](/cards/entity-options#visuals) on the entity options page, including the [history window](/cards/entity-options#history-window) that `hours_to_show` and `bucket_minutes` set for the sparkline, columns and strip.

## Card tint

`tint_card: true` on a rule washes the whole card in that rule's colour while it matches. Use it for the states that deserve attention, not for the normal case. See [Rules](/cards/entity-options#rules) for the details.

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

## Poster

`layout: poster` turns the tile into a poster: the icon at the top left, the matching rule's label as a pill at the top right, and at the bottom the name in small capitals and the value, large. Controls work as on the tile: a switch, buttons or a stepper sit on the value's line, a slider runs along the bottom. A `sparkline` or `columns` plot fills the room below the value, out to the card's edges. A poster is three rows high in a sections grid (two at least), and its content stays at the bottom of whatever height it gets.

::: live

```yaml
- type: custom:entity-card-pro
  entity: sensor.power_consumption
  name: Power
  layout: poster
  visual: sparkline
  hours_to_show: 12
  rules:
    - { below: 1000, color: green, icon: mdi:flash-outline, label: Low }
    - { below: 3000, color: amber, icon: mdi:flash, label: Normal }
    - { above: 3000, color: red, icon: mdi:flash-alert, label: High }
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: light.living_room
  name: Living room
  layout: poster
  value: "{{ (state_attr('light.living_room', 'brightness') | float(0) / 2.55) | round }}"
  unit: "%"
  control: auto
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: climate.living_room
  name: Thermostat
  layout: poster
  attribute: current_temperature
  unit: °C
  decimals: 1
  control: stepper
  color: deep-orange
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: vacuum.robot
  name: Robot
  layout: poster
  control: buttons
  control_options:
    - icon: mdi:play
      action: { action: perform-action, perform_action: vacuum.start, target: { entity_id: vacuum.robot } }
    - icon: mdi:home-import-outline
      action: { action: perform-action, perform_action: vacuum.return_to_base, target: { entity_id: vacuum.robot } }
  rules:
    - { state: cleaning, color: teal }
    - { state: docked, color: grey }
  grid_options: { columns: 6 }
```

:::

### Badges

`badges` adds pills to the poster's corner, under the rule's label: the battery, the place, the temperature, any entity. They are [header entities](/cards/heading-card#badge-options) and take the same keys: `visual`, `style`, `size`, `format`, `stale_after`, a switch with `control: toggle`, their own actions and `visibility`. On a poster they are outline pills unless a `style` says otherwise. A badge hidden by its `visibility` leaves no gap.

::: live

```yaml
- type: custom:entity-card-pro
  entity: sensor.ev_battery
  name: Car
  icon: mdi:car-electric
  layout: poster
  rules:
    - { below: 20, color: red, label: Low }
    - { above: 20, color: green }
  badges:
    - entity: binary_sensor.ev_plugged
      rules:
        - { state: "on", color: green, icon: mdi:power-plug, label: Plugged in }
        - { state: "off", color: grey, icon: mdi:power-plug-off, label: Unplugged }
    - sensor.ev_range
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: sensor.robot_progress
  name: Cleaning
  icon: mdi:robot-vacuum
  layout: poster
  visual: bar
  badges:
    - { entity: sensor.robot_battery, visual: ring }
    - sensor.robot_current_room
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

`hover: true` shows what a click will do, as Home Assistant's tile does: the whole tile takes a light layer in its colour under the pointer, and a stronger one while pressed. An icon that is a switch (`control_position: lead`) brightens its circle instead and grows a little when pressed, and every [control](/cards/controls) answers on its own: the tile's layer gives way to it. Touch screens show only the press. See [Hover](/cards/entity-options#hover) for the details and the theme variable.

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

## More examples

One card type, many tiles. Rules colour a battery ring, an attribute drives a bar, a person becomes a badge, and prefix and suffix turn a number into a sentence.

::: live

```yaml
- type: custom:entity-card-pro
  entity: sensor.kitchen_window_battery
  name: Window sensor
  visual: ring
  rules:
    - { below: 20, color: red, label: Replace }
    - { below: 50, color: amber }
    - { above: 50, color: green }
  grid_options: { columns: 6 }
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
  entity: person.kim
  visual: badge
  rules:
    - { state: home, color: green, icon: mdi:home-account, label: Home }
    - { state: not_home, color: grey, icon: mdi:account-arrow-right, label: Away }
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: sensor.energy_today
  name: Energy
  icon: mdi:lightning-bolt
  color: green
  decimals: 1
  suffix: " so far today"
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: sun.sun
  name: Sun
  visual: badge
  rules:
    - { state: above_horizon, color: amber, icon: mdi:white-balance-sunny, label: Up }
    - { state: below_horizon, color: indigo, icon: mdi:weather-night, label: Down }
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
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

## Reference

All [entity options](/cards/entity-options#entity-options) plus:

| Option                                             | Default                      | Description                                                                                               |
| -------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------- |
| `layout`                                           | `tile`                       | `tile` or `poster`, see [Poster](#poster).                                                                |
| `badges`                                           |                              | Poster: pills in its corner, [header entities](/cards/heading-card#badge-options), see [Badges](#badges). |
| `toggle`                                           | `false`                      | Switch on the right that calls `homeassistant.toggle`.                                                    |
| `secondary`                                        |                              | Line under the name instead of the value and label. Template allowed.                                     |
| `hours_to_show`                                    | `24`                         | History window for `sparkline`, `columns` and `strip`, at least 1.                                        |
| `bucket_minutes`                                   | `60`                         | Bucket size for `columns` and `strip`, at least 5.                                                        |
| `smoothing_minutes`                                |                              | Averaging bucket of `sparkline` in minutes, at least 5 (default: one point per 12 px of width).           |
| `tap_action` / `hold_action` / `double_tap_action` | more-info / more-info / none | See [Actions](/cards/entity-options#actions).                                                             |
| `hover`                                            | `false`                      | Hover and press layers on the tile, its icon and its controls, see [Hover](#hover).                       |

### Grid defaults

6 columns, `rows: auto`: one row for a plain tile, more for the block visuals (`gauge`, `bar`, `sparkline`, `columns`, `strip`), at least 2 rows with a `sparkline` or `columns`. Given more height (fixed rows, a taller card beside it), a `sparkline` or `columns` plot fills the card, a `gauge` centres in the room under the icon and name, and any other tile centres its content, see [Filling the height](/guide/sizing#filling-the-height). A poster is 6 columns and 3 rows (at least 2), its content at the bottom.

### Home Assistant options

Like every card, this one also accepts `grid_options`, `visibility`, `layout_options`, `view_layout` and `card_mod`. They are passed through to Home Assistant; see [Sizing in sections](/guide/sizing) for `grid_options`. `fill_height: false` keeps the card at its own height beside a taller card; see [Filling the height](/guide/sizing#filling-the-height). `hover: true` shows Home Assistant's hover and press layers on what a click runs, for every entity or, set on an entity, for that one; see [Hover](#hover).
