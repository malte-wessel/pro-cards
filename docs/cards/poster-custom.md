# Custom posters

A poster is a handful of places: an icon at the top, badges in the corner, and at the bottom a name, a large value and a line under it, with a picture, a backdrop and a control around them. A [poster type](/cards/poster-card#poster-types) fills them for an entity; every place also has a key of its own, so a poster can show anything: a value you compute, several entities at once, or nothing but your own buttons. This page builds posters from those keys.

## The places

| Place           | Key              | Takes                                                                  |
| --------------- | ---------------- | ---------------------------------------------------------------------- |
| Lead            | `icon`           | an `mdi:` icon, a template                                             |
| Status          | `status`         | a text, a template, badge keys with `value` for its text, or `false`   |
| Badges          | `badges`         | entities or [badges](#badges) of your own, in order                    |
| Name            | `name`           | a text, a template                                                     |
| Value           | `value`          | a text, a template; with an entity its state or `attribute`            |
| Under the value | `secondary`      | a text, a template                                                     |
| Colour          | `color`, `rules` | a colour token, hex or a template; [rules](#colour-and-rules) by value |
| Picture         | `visual`         | `sparkline`, `columns`, `bar` or `gauge` of the entity's value         |
| Backdrop        | `image`          | a URL, a template or an entity's picture                               |
| Control         | `control`        | any [control](/cards/poster-controls), or your own buttons             |

A poster needs no entity: the keys alone fill it. Without one, a tap does nothing unless `tap_action` says what.

::: live

```yaml
- type: custom:poster-card-pro
  name: Welcome home
  icon: mdi:home-heart
  value: Good evening
  secondary: Three lights are on
  color: amber
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  name: Router
  icon: mdi:router-wireless
  value: Online
  status: OK
  color: green
  tap_action: { action: navigate, navigation_path: /config/network }
  grid_options: { columns: 6 }
```

:::

## Values from templates

Every text takes a [template](https://www.home-assistant.io/docs/configuration/templating/), rendered by Home Assistant and kept up to date: `name`, `value`, `secondary`, `status`, and the `icon` and `color` too. A number from a template is formatted as one (`unit`, `decimals`, `prefix` and `suffix` work on it, as plain text), and a word (`Done`, `Running`) is drawn a little smaller than a number.

::: live

```yaml
- type: custom:poster-card-pro
  name: Lights on
  icon: "{{ 'mdi:lightbulb-group' if states.light | selectattr('state', 'eq', 'on') | list | count > 0 else 'mdi:lightbulb-group-off' }}"
  value: "{{ states.light | selectattr('state', 'eq', 'on') | list | count }}"
  secondary: "of {{ states.light | list | count }} lights"
  color: "{{ 'amber' if states.light | selectattr('state', 'eq', 'on') | list | count > 0 else 'grey' }}"
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  name: Laundry
  icon: mdi:washing-machine
  value: "{{ states('sensor.washer_remaining') }}"
  unit: min
  secondary: "{{ states('sensor.washer_power') | round }} W now"
  status: "{{ 'Running' if states('sensor.washer_remaining') | int(0) > 0 else 'Done' }}"
  color: "{{ 'teal' if states('sensor.washer_remaining') | int(0) > 0 else 'grey' }}"
  tap_action: { action: more-info, entity: sensor.washer_status }
  grid_options: { columns: 6 }
```

:::

## An entity, your own look

With an `entity`, the poster takes its name, icon, state and colour from it, and its poster type adds the rest. Any key replaces one place and keeps the others. `attribute` shows an attribute instead of the state, `control: false` drops a poster type's control and leaves the rest of it (the thermostat below keeps its glow and its status), and `poster: entity` drops the type's own look altogether (its backdrop, status, controls and rules) for a poster that is only what you write:

::: live

```yaml
- type: custom:poster-card-pro
  entity: light.living_room
  poster: entity
  name: Ceiling
  value: "{{ (state_attr('light.living_room', 'brightness') | float(0) / 2.55) | round }}"
  unit: "%"
  secondary: "{{ 'On' if is_state('light.living_room', 'on') else 'Off' }}"
  visual: bar
  min: 0
  max: 100
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: climate.living_room
  name: Target
  attribute: temperature
  unit: °C
  decimals: 1
  secondary: "Now {{ state_attr('climate.living_room', 'current_temperature') }} °C"
  control: false
  grid_options: { columns: 6 }
```

:::

## Colour and rules

`rules` pick the colour, the icon and the status by the value or the entity's state; the first that matches wins. A rule's `label` is the status badge's text, `tint_card: true` washes the whole poster in its colour, `pulse: true` makes the badge pulse and `style` changes the badge's look. Rules you write replace a poster type's own.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.office_co2
  name: Office air
  visual: sparkline
  hours_to_show: 12
  rules:
    - { below: 800, color: green, label: Fresh }
    - { below: 1200, color: amber, label: Stuffy, icon: mdi:window-open-variant }
    - { above: 1200, color: red, label: Open a window, icon: mdi:alert, tint_card: true, pulse: true }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: binary_sensor.door_front
  name: Front door
  rules:
    - { state: "on", color: red, icon: mdi:door-open, label: Open, style: filled }
    - { state: "off", color: green, icon: mdi:door-closed, label: Closed }
  grid_options: { columns: 6 }
```

:::

### Tinted posters

`tint_card: true` on a rule washes the whole poster in that rule's colour while the rule matches: a soft tint of the card, the picture and the backdrop drawn over it, in light and dark themes alike. It is a rule's, so it follows the value: the poster goes back to the card's own background when another rule (or none) matches. `color` alone colours the icon, the value's picture and the badge, never the card, and a kind's own rules never tint; a rule needs a `state`, `below` or `above` to match at all.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.office_co2
  name: Office air
  visual: sparkline
  rules:
    - { below: 800, color: green, label: Fresh }
    - { above: 800, color: red, label: Ventilate, tint_card: true }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: light.living_room
  rules:
    - { state: "on", color: amber, tint_card: true }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: weather.home
  name: Outside
  rules:
    - { state: partlycloudy, color: blue, tint_card: true }
    - { state: sunny, color: amber, tint_card: true }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  name: Front door
  icon: mdi:door
  value: "{{ 'Open' if is_state('binary_sensor.door_front', 'on') else 'Closed' }}"
  rules:
    - { state: Open, color: red, label: Open, tint_card: true, pulse: true }
    - { state: Closed, color: green, label: Closed, tint_card: true }
  grid_options: { columns: 6 }
```

:::

A template value is matched as its text: the last poster's rules read `Open` and `Closed`, no entity needed. The weather poster's rules replace its condition colours, so they name every condition that should keep a colour.

## A picture

`visual` draws the entity's value as a picture. History pictures run along the bottom to the poster's edges, over `hours_to_show` (24 by default); a level reads between `min` and `max` (the entity's own, else 0 and 100):

| `visual`    | Draws                                                                               |
| ----------- | ----------------------------------------------------------------------------------- |
| `sparkline` | a line of its history, filled below, up under the value                             |
| `columns`   | a bar per `bucket_minutes` (60 by default), the last one the value now              |
| `strip`     | a block per bucket, coloured by the [rules](#colour-and-rules) each one matched     |
| `bar`       | a level between `min` and `max` under the value                                     |
| `gauge`     | an arc between `min` and `max` with the value inside it, the name under it, centred |
| `ring`      | a ring around the icon, filled between `min` and `max`                              |
| `icon`      | no picture: the default of an entity without a poster type's own                    |

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.outdoor_temperature
  name: Outside
  visual: sparkline
  hours_to_show: 12
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.power_consumption
  name: House
  icon: mdi:home-lightning-bolt
  visual: columns
  hours_to_show: 12
  bucket_minutes: 30
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.living_room_co2
  name: Air today
  visual: strip
  rules:
    - { below: 800, color: green, label: Fresh }
    - { below: 1200, color: amber, label: Stuffy }
    - { above: 1200, color: red, label: Bad }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.battery_soc
  name: Battery
  poster: entity
  visual: bar
  min: 0
  max: 100
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.living_room_humidity
  name: Humidity
  visual: gauge
  min: 0
  max: 100
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.robot_battery
  name: Robot
  icon: mdi:robot-vacuum
  poster: entity
  visual: ring
  grid_options: { columns: 6 }
```

:::

A [trend](/cards/poster-card#trend) draws several entities' lines on one scale. `trend`, `count` and `dot` are badge pictures: they go on [badges](#badges), not on the poster.

## A backdrop

`image` puts a picture behind the whole poster, under a scrim that keeps the texts readable: a URL (`/local/…` for a file in Home Assistant's `www` folder), a template that renders one, or an entity whose picture it shows (a camera's snapshot, a person's photo, a media player's art). `image: false` drops a poster type's own backdrop.

::: live

```yaml
- type: custom:poster-card-pro
  name: Front door
  icon: mdi:doorbell-video
  image: camera.front_door
  value: "{{ 'Open' if is_state('binary_sensor.door_front', 'on') else 'Closed' }}"
  secondary: "{{ 'Locked' if is_state('lock.front_door', 'locked') else 'Unlocked' }}"
  tap_action: { action: more-info, entity: camera.front_door }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  name: Alex
  icon: mdi:account
  image: "{{ state_attr('person.alex', 'entity_picture') }}"
  value: "{{ 'Home' if is_state('person.alex', 'home') else 'Away' }}"
  grid_options: { columns: 6 }
```

:::

## Badges

The corner holds the status badge and the `badges`, in the order written (`status` in the list places the status badge). A badge is an entity id, or an object with the keys of [header badges](/cards/heading-card#badge-options): its own `value` or `attribute`, `icon`, `name`, `visual` (`ring`, `bar`, `sparkline`, `trend`, `count`, `dot`), `style`, `size`, `format`, `rules`, actions and `visibility`. A badge without `entity` on a poster with one reads the poster's entity; on a poster without one it needs a `value`.

::: live

```yaml
- type: custom:poster-card-pro
  name: Downstairs
  icon: mdi:home-floor-g
  value: "{{ states('sensor.living_room_temperature') }}"
  unit: °C
  status: { value: "{{ 'Lights on' if is_state('light.living_room', 'on') else 'Dark' }}", style: soft }
  badges:
    - sensor.living_room_humidity
    - { entity: sensor.living_room_co2, icon: mdi:molecule-co2 }
    - entity: binary_sensor.window_kitchen
      rules:
        - { state: "on", color: red, icon: mdi:window-open, label: Open }
        - { state: "off", color: green, icon: mdi:window-closed, label: Closed }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.ev_battery
  name: Car
  icon: mdi:car-electric
  poster: entity
  status: false
  badges:
    - { visual: ring, show_icon: false }
    - { entity: sensor.ev_range, icon: mdi:map-marker-distance }
    - { value: "{{ states('number.ev_charge_limit') }} %", icon: mdi:battery-lock, name: Limit }
  grid_options: { columns: 6 }
```

:::

## Controls and buttons

A poster carries one control: the one its entity supports (`toggle`, `slider`, `stepper`, `segments`, `select`, `button`, `hold`), or a row of your own buttons that run scenes, scripts or any action. [Poster controls](/cards/poster-controls) has them all; a poster of buttons needs no entity:

::: live

```yaml
type: custom:poster-card-pro
name: Scenes
icon: mdi:palette
value: Living room
color: deep-purple
control: buttons
control_position: block
control_options:
  - { entity: scene.bright, label: Bright, color: amber }
  - { entity: scene.dinner, label: Dinner, color: orange }
  - { entity: scene.movie_night, label: Movie, color: deep-purple }
  - { entity: scene.good_night, label: Night, color: indigo }
```

:::

## Actions

`tap_action`, `hold_action` and `double_tap_action` take [Home Assistant's actions](https://www.home-assistant.io/dashboards/actions/): `more-info` (of the poster's entity, or the one named), `toggle`, `navigate`, `url`, `perform-action`, `assist`, `none`. With an entity a tap opens its more-info dialog and a hold too; without one both do nothing until told. The control and the badges keep their own taps.

::: live

```yaml
- type: custom:poster-card-pro
  name: Coffee
  icon: mdi:coffee-maker
  value: "{{ 'Brewing' if is_state('switch.coffee_machine', 'on') else 'Off' }}"
  color: "{{ 'brown' if is_state('switch.coffee_machine', 'on') else 'grey' }}"
  tap_action: { action: toggle, entity: switch.coffee_machine }
  hold_action: { action: more-info, entity: switch.coffee_machine }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  name: Doorbell
  icon: mdi:bell-ring
  value: Ring
  color: teal
  tap_action:
    action: perform-action
    perform_action: input_button.press
    target: { entity_id: input_button.ring_doorbell }
  grid_options: { columns: 6 }
```

:::

## Recipes

A house mode with its segments, the windows and the people in the corner:

::: live

```yaml
type: custom:poster-card-pro
entity: input_select.house_mode
name: House
icon: mdi:home-account
control: segments
control_position: block
control_options:
  - { value: Home, icon: mdi:home }
  - { value: Away, icon: mdi:home-export-outline }
  - { value: Night, icon: mdi:weather-night }
  - { value: Guest, icon: mdi:account-multiple }
status: false
badges:
  - person.alex
  - person.sam
  - entity: binary_sensor.window_bedroom
    name: Bedroom
    rules:
      - { state: "on", color: red, icon: mdi:window-open }
      - { state: "off", color: green, icon: mdi:window-closed }
```

:::

Today's energy with what it costs, the hours as columns:

::: live

```yaml
type: custom:poster-card-pro
entity: sensor.energy_today
name: Today
icon: mdi:lightning-bolt
visual: columns
hours_to_show: 24
bucket_minutes: 60
secondary: "{{ (states('sensor.energy_today') | float(0) * states('sensor.electricity_price') | float(0)) | round(2) }} € at {{ states('sensor.electricity_price') }} €/kWh"
status: "{{ 'Cheap' if states('sensor.electricity_price') | float(0) < 0.25 else 'Expensive' }}"
color: "{{ 'green' if states('sensor.electricity_price') | float(0) < 0.25 else 'orange' }}"
```

:::

The rest of the poster card's options, every poster type and its keys are in the [reference](/cards/poster-card#reference).
