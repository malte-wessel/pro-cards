# Custom posters

A poster has a few places: an icon at the top, badges in the corner, and a name, a large value and a line under it at the bottom. A picture, a backdrop and a control go around them. A [poster type](/cards/poster-types) fills these places for an entity. Every place also has a key of its own, so a poster can show anything: a value you compute, several entities, or only your own buttons. This page builds posters from those keys. The [overview](/cards/poster-card) shows how a poster is laid out.

## The places

| Place           | Key              | Takes                                                                           | Default                                                 |
| --------------- | ---------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Icon            | `icon`           | an `mdi:` icon, a template; `icon_ring` and the icon's own [actions](#the-icon) | the entity's icon or picture, the type's drawing        |
| Status          | `status`         | a text, a template, badge keys with `value` for its text, or `false`            | the type's status, else the matching rule's label       |
| Badges          | `badges`         | entities or [badges](/cards/poster-badges) of your own, in order                | none                                                    |
| Name            | `name`           | a text, a template                                                              | the friendly name                                       |
| Value           | `value`          | a text, a template; `attribute` shows an attribute                              | the entity's state                                      |
| Under the value | `secondary`      | a text, a template                                                              | the type's line                                         |
| Colour          | `color`, `rules` | a colour token, hex or a template; [rules](#colour-and-rules) by value          | the matching rule's, else Home Assistant's state colour |
| Picture         | `visual`         | a [picture](#a-picture) of the entity's value                                   | the type's drawing                                      |
| Backdrop        | `image`          | a URL, a template or an entity's picture                                        | the type's backdrop                                     |
| Control         | `control`        | any [control](/cards/poster-controls), or your own buttons                      | the type's                                              |

A poster needs no entity: the keys alone can fill it. Without an entity, a tap does nothing until you set `tap_action`.

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

`name`, `value`, `secondary`, `status`, `icon` and `color` take a [template](https://www.home-assistant.io/docs/configuration/templating/). Home Assistant renders it and keeps it up to date. A number from a template is formatted as a number: `unit`, `decimals`, `prefix` and `suffix` work on it. A word such as `Done` is drawn a little smaller than a number.

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

With an `entity`, the poster takes its name, icon, state and colour from it, and its poster type adds the rest. A key you set changes its own place and leaves the others as they are:

- `attribute` shows an attribute of the entity in place of its state.
- `control: false` drops the poster type's control and keeps the rest. The thermostat below keeps its tint and its status.
- `poster: entity` drops the type's backdrop, status, controls and rules. The poster shows only what you write.

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

`rules` pick the colour, the icon and the status by the value or the entity's state, as on every Pro card ([rules](/cards/entity-options#rules)). They match in the order written, and the first match wins.

- `below` and `above` compare the value as a number.
- `state` matches the value **or** the entity's state, so `{ state: playing }` works on a media player that shows its title.

On a poster, a rule can also set:

- `label`: the status badge's text.
- `tint_card: true`: the whole poster in the rule's colour ([tinted posters](#tinted-posters)).
- `pulse: true`: the badge pulses.
- `style`: the badge's look.

A poster type brings its own rules (the [predefined sets](/cards/poster-types#predefined-rules)). Your `rules` take their place as a whole, and `rules: []` drops them.

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

`tint_card: true` on a rule washes the whole poster in the rule's colour while the rule matches. The card, its picture and its backdrop take a soft tint, in light and dark themes. When another rule or none matches, the poster goes back to its own background. `color` alone colours the icon, the picture and the badge, not the card.

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

Rules match a template value by its text: the last poster's rules read `Open` and `Closed` and need no entity. On the weather poster, your rules take the place of the condition colours. Name every condition that should keep a colour.

## A picture

`visual` draws the entity's value as a picture.

- A history runs along the bottom of the poster and covers `hours_to_show` (24 by default).
- A level reads between `min` and `max`: the entity's own, else 0 and 100.

| `visual`    | Draws                                                                           |
| ----------- | ------------------------------------------------------------------------------- |
| `sparkline` | a line of its history, filled below                                             |
| `columns`   | a bar per `bucket_minutes` (60 by default), the last one the value now          |
| `strip`     | a block per bucket, coloured by the [rules](#colour-and-rules) each one matched |
| `bar`       | a level between `min` and `max` under the value                                 |
| `gauge`     | an arc between `min` and `max` with the value inside it, centred                |
| `glow`      | the poster lit from below in its colour, as strong as the value's level         |
| `none`      | no picture: the default where the poster type draws none                        |

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
```

:::

`glow` lights the poster from below in its colour. How strongly depends on the entity:

- a number: its level between `min` and `max`;
- a light: its brightness;
- anything that switches: lit while on, dark while off.

It is the [light](/cards/poster-types#light)'s picture by default, and any poster can use it. On a light, `visual: bar` or `visual: none` draws another picture.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.living_room_humidity
  name: Humidity
  visual: glow
  min: 0
  max: 100
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: switch.coffee_machine
  name: Coffee
  icon: mdi:coffee-maker
  color: brown
  visual: glow
  control: toggle
  grid_options: { columns: 6 }
```

:::

The coffee machine is off: switch it on and it glows.

For several entities' lines on one scale, see the [trend](/cards/poster-types#trend) poster type.

## The icon

The icon at the top left shows the entity's icon, or the poster type's own drawing: the padlock, the fan, the animated wind.

- `icon` sets an `mdi:` icon, or a template that renders one.
- `icon_style: plain` draws the icon without its circle.
- `show_entity_picture: true` shows the entity's picture where it has one. The weather poster does this by default.
- `icon_ring: true` puts a ring of the value around the icon, filled between `min` and `max` (the entity's own, else 0 and 100).

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.robot_progress
  name: Cleaning
  icon: mdi:robot-vacuum
  icon_ring: true
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.living_room_humidity
  name: Humidity
  icon_style: plain
  icon_ring: true
  visual: sparkline
  grid_options: { columns: 6 }
```

:::

The icon takes [actions](#actions) of its own, as on Home Assistant's tile card: `icon_tap_action`, `icon_hold_action` and `icon_double_tap_action`. An icon without actions of its own is part of the poster: a tap there runs the poster's `tap_action`. On the icon, `toggle` locks or unlocks a lock, arms or disarms an alarm panel and switches anything else. A hold runs after a second, so it [confirms](/cards/poster-controls#hold-to-confirm): locks and alarm panels hold their icon by default.

::: live

```yaml
- type: custom:poster-card-pro
  entity: switch.coffee_machine
  name: Coffee
  icon: mdi:coffee-maker
  icon_tap_action: { action: toggle }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: switch.garden_pump
  icon: mdi:water-pump
  icon_hold_action: { action: toggle }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.living_room_temperature
  name: Living room
  icon_tap_action: { action: navigate, navigation_path: /config }
  icon_double_tap_action: { action: more-info, entity: climate.living_room }
  grid_options: { columns: 6 }
```

:::

## A backdrop

`image` puts a picture behind the whole poster, under a shade that keeps the text readable. It takes:

- a URL (`/local/…` for a file in Home Assistant's `www` folder);
- a template that renders one;
- an entity, whose picture it shows: a camera's snapshot, a person's photo, a media player's art.

`image: false` drops a poster type's own backdrop. A person poster has their photo behind it already. `image: person.alex` puts it behind any other poster.

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

A camera's snapshot behind a lock: see who is at the door, then hold the padlock to unlock it.

::: live

```yaml
type: custom:poster-card-pro
entity: lock.front_door
image: camera.front_door
```

:::

## Badges

The corner holds the status badge, then your `badges` in the order written. A badge is an entity id, or a badge of your own with its value, icon, rules and picture. [Badges](/cards/poster-badges) has every key, with examples.

## Controls and buttons

A poster carries one control. It can be one its entity supports (`toggle`, `slider`, `stepper`, `segments`, `select`, `button`, `hold`). It can also be a row of your own buttons that run scenes, scripts or any action. [Poster controls](/cards/poster-controls) has them all. A poster of buttons needs no entity:

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

`tap_action`, `hold_action` and `double_tap_action` take [Home Assistant's actions](https://www.home-assistant.io/dashboards/actions/): `more-info`, `toggle`, `navigate`, `url`, `perform-action`, `assist` and `none`. With an entity, a tap or a hold opens its more-info dialog. Without one, both do nothing until you set them. The control and the badges keep their own taps, and the icon has [actions of its own](#the-icon).

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

The poster card's options are in the [reference](/cards/poster-card#reference), every poster type and its keys on [Poster types](/cards/poster-types).
