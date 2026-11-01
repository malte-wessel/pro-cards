# Custom tiles

A tile has a few places: the icon, the name, the line under it and the controls at its end, with a picture or a slider below where asked for. A [poster type](/cards/tile-types) fills these places for an entity. Every place also has a key of its own, so a tile can show anything: a value you compute, another entity's picture, or only your own buttons. This page builds tiles from those keys. The [overview](/cards/tile-card) shows how a tile is laid out.

## The places

| Place    | Key                            | Takes                                                                                  | Default                                                 |
| -------- | ------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Icon     | `icon`                         | an `mdi:` icon, a template; `icon_image`, `icon_ring` and its own [actions](#the-icon) | the entity's icon or picture, the type's own            |
| Name     | `name`                         | a text, a template                                                                     | the friendly name                                       |
| The line | `value`, `status`, `secondary` | a text or a template each; see [The line](#the-line)                                   | the state, the type's status, the type's line           |
| Colour   | `color`, `rules`               | a colour token, hex or a template; [rules](#colour-and-rules) by value                 | the matching rule's, else Home Assistant's state colour |
| Picture  | `visual`, `show_picture`       | a [picture](#a-second-row) of the value, or the type's own, below the line             | none; a light's glow                                    |
| Control  | `control`                      | any [control](/cards/tile-controls), or your own buttons                               | the type's                                              |

A tile needs no entity: the keys alone can fill it. Without an entity, a tap does nothing until you set `tap_action`.

::: live

```yaml
- type: custom:tile-card-pro
  name: Welcome home
  icon: mdi:home-heart
  value: Good evening
  secondary: Three lights are on
  color: amber
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  name: Router
  icon: mdi:router-wireless
  value: Online
  color: green
  tap_action: { action: navigate, navigation_path: /config/network }
  grid_options: { columns: 6 }
```

:::

## The line

The line under the name joins its parts with a dot, and is cut at the end where it is too long:

- the **value**: the type's (a thermostat's temperature, a media player's title), else the state. `value` and `attribute` set it; `unit`, `decimals`, `prefix` and `suffix` format a number.
- the **status**: the type's, else the matching rule's label. `status` sets it (a text or a template), `false` leaves it out. A status that only repeats the value is left out: a vacuum's Cleaning shows once. `status_badge: true` makes it a badge instead, shown even where it repeats the value; see [Badges](/cards/tile-badges).
- the **secondary**: what the type adds (the direction and gusts, the artist and the album). `secondary` sets it.

`show_value: false` leaves the value out, `show_name: false` the name above it.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.living_room_temperature
  name: Living room
  secondary: "Humidity {{ states('sensor.living_room_humidity') }} %"
  rules:
    - { below: 19, color: blue, label: Cold }
    - { below: 24, color: green, label: Comfortable }
    - { above: 24, color: orange, label: Warm }
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.living_room_co2
  status: "{{ 'Open a window' if states('sensor.living_room_co2') | int(0) > 700 else 'Fresh' }}"
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: climate.living_room
  status: false
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.wind_speed
  name: Wind
  show_value: false
  grid_options: { columns: 6 }
```

:::

## Status and badges

The status is on the line; `status_badge: true` makes it a badge at the end of the first row, centred on the icon. `badges` adds badges of your own there, and `icon_badge` decides the badge on the icon. [Badges](/cards/tile-badges) shows them all.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.living_room_co2
  name: CO₂
  status_badge: true
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.living_room_co2
  badges:
    - sensor.living_room_temperature
    - status
  grid_options: { columns: 12 }
```

:::

## Values from templates

`name`, `value`, `secondary`, `status`, `icon` and `color` take a [template](https://www.home-assistant.io/docs/configuration/templating/). Home Assistant renders it and keeps it up to date. A number from a template is formatted as a number: `unit`, `decimals`, `prefix` and `suffix` work on it.

::: live

```yaml
- type: custom:tile-card-pro
  name: Lights on
  icon: "{{ 'mdi:lightbulb-group' if states.light | selectattr('state', 'eq', 'on') | list | count > 0 else 'mdi:lightbulb-group-off' }}"
  value: "{{ states.light | selectattr('state', 'eq', 'on') | list | count }}"
  secondary: "of {{ states.light | list | count }} lights"
  color: "{{ 'amber' if states.light | selectattr('state', 'eq', 'on') | list | count > 0 else 'grey' }}"
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  name: Laundry
  icon: mdi:washing-machine
  value: "{{ states('sensor.washer_remaining') }}"
  unit: min
  status: "{{ 'Running' if states('sensor.washer_remaining') | int(0) > 0 else 'Done' }}"
  color: "{{ 'teal' if states('sensor.washer_remaining') | int(0) > 0 else 'grey' }}"
  tap_action: { action: more-info, entity: sensor.washer_status }
  grid_options: { columns: 6 }
```

:::

## An entity, your own look

With an `entity`, the tile takes its name, icon, state and colour from it, and its poster type adds the rest. A key you set changes its own place and leaves the others as they are:

- `attribute` shows an attribute of the entity in place of its state.
- `control: false` drops the poster type's control and keeps the rest. The thermostat below keeps its status.
- `poster: entity` drops the type's status, controls, rules and animated icon. The tile shows only what you write.

::: live

```yaml
- type: custom:tile-card-pro
  entity: light.living_room
  poster: entity
  name: Ceiling
  value: "{{ (state_attr('light.living_room', 'brightness') | float(0) / 2.55) | round }}"
  unit: "%"
  visual: bar
  min: 0
  max: 100
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: climate.living_room
  name: Target
  attribute: temperature
  unit: °C
  decimals: 1
  secondary: "now {{ state_attr('climate.living_room', 'current_temperature') }} °C"
  control: false
  grid_options: { columns: 6 }
```

:::

## Colour and rules

`rules` pick the colour, the icon and the status by the value or the entity's state, as on every Pro card ([rules](/cards/entity-options#rules)). They match in the order written, and the first match wins.

- `below` and `above` compare the value as a number.
- `state` matches the value **or** the entity's state, so `{ state: playing }` works on a media player that shows its title.

On a tile, a rule can also set:

- `label`: the status on the line.
- `tint_card: true`: the whole tile in the rule's colour ([tinted tiles](#tinted-tiles)).
- the icon: `icon_style`, `icon_image` and `icon_ring` ([below](#the-icon-by-rule)).

A poster type brings its own rules (the [predefined sets](/cards/poster-types#predefined-rules)). Your `rules` take their place as a whole, and `rules: []` drops them.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.office_co2
  name: Office air
  rules:
    - { below: 800, color: green, label: Fresh }
    - { below: 1200, color: amber, label: Stuffy, icon: mdi:window-open-variant }
    - { above: 1200, color: red, label: Open a window, icon: mdi:alert }
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: binary_sensor.door_front
  name: Front door
  rules:
    - { state: "on", color: red, icon: mdi:door-open, label: Open }
    - { state: "off", color: green, icon: mdi:door-closed, label: Closed }
  grid_options: { columns: 6 }
```

:::

### Tinted tiles

`tint_card: true` on a rule washes the whole tile in the rule's colour while the rule matches. When another rule or none matches, the tile goes back to its own background. `color` alone colours the icon, not the card.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.office_co2
  name: Office air
  rules:
    - { below: 800, color: green, label: Fresh }
    - { above: 800, color: red, label: Ventilate, tint_card: true }
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  name: Front door
  icon: mdi:door
  value: "{{ 'Open' if is_state('binary_sensor.door_front', 'on') else 'Closed' }}"
  rules:
    - { state: Open, color: red, tint_card: true }
    - { state: Closed, color: green }
  grid_options: { columns: 6 }
```

:::

Rules match a template value by its text: the last tile's rules read `Open` and `Closed` and need no entity.

### The icon by rule

A rule can change the icon with the keys the card has for it. A key the rule writes wins over the card's while the rule matches; a key it leaves out stays the card's. `icon_image: false` drops the icon's picture.

::: live

```yaml
type: custom:tile-card-pro
entity: light.garden
rules:
  - { state: "off", icon_style: plain }
  - { state: "on", icon_ring: true }
```

:::

## A second row

A tile keeps to one row unless it is asked for more:

- `show_picture: true` draws the type's picture below the line: the weather's next hours, the sun's day, the solar production, a trend's lines (on by default).
- `visual` draws the entity's value below the line, as on the poster: `sparkline`, `columns` or `strip` from its history over `hours_to_show`; `bar` or `gauge` between `min` and `max`.
- `control: slider` (or another control `control_position: block`) adds a control there; see [Tile controls](/cards/tile-controls#where-it-sits).

A plot or a curve runs to the tile's left, right and bottom edges, as on a poster; a strip keeps the tile's padding.

::: live

```yaml
- type: custom:tile-card-pro
  entity: weather.home
  show_picture: true
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sun.sun
  show_picture: true
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.power_consumption
  name: House
  icon: mdi:home-lightning-bolt
  visual: columns
  hours_to_show: 12
  bucket_minutes: 30
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.living_room_co2
  name: Air today
  visual: strip
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.outdoor_temperature
  name: Outside
  visual: sparkline
  hours_to_show: 12
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.living_room_humidity
  name: Humidity
  visual: bar
  grid_options: { columns: 6 }
```

:::

`glow` takes no row: it lights the tile from its bottom edge in its colour, as strong as the value's level between `min` and `max`, a light's brightness, or on and off. It is the light's default, and any tile can use it; `visual: none` drops it.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.living_room_humidity
  name: Humidity
  visual: glow
  min: 0
  max: 100
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
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

## The icon

The icon shows the entity's icon, or the poster type's own: the padlock, the fan, the animated wind.

- `icon` sets an `mdi:` icon, or a template that renders one. It takes the place of a type's animated icon too.
- `icon_style: plain` draws the icon without its circle.
- `show_entity_picture: true` shows the entity's picture where it has one. The weather, a person and a media player do this by default.
- `icon_ring: true` puts a ring of the value around the icon, filled between `min` and `max` (the entity's own, else 0 and 100).
- `icon_image` shows a picture of your own: a URL, a template that renders one, or an entity, whose picture it shows. While it has no picture, the tile shows `icon`.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.robot_progress
  name: Cleaning
  icon: mdi:robot-vacuum
  icon_ring: true
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.living_room_humidity
  name: Humidity
  icon_style: plain
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  name: Malte
  icon: mdi:account
  icon_image: person.malte
  value: "{{ 'Home' if is_state('person.malte', 'home') else 'Away' }}"
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  name: Now playing
  icon: mdi:speaker
  icon_image: "{{ state_attr('media_player.living_room_speaker', 'entity_picture') }}"
  value: "{{ state_attr('media_player.living_room_speaker', 'media_title') }}"
  grid_options: { columns: 6 }
```

:::

The icon takes actions of its own, as on Home Assistant's tile card: `icon_tap_action`, `icon_hold_action` and `icon_double_tap_action`. As there, the icon toggles what switches (a light, a switch, a fan, an input boolean, a group, an automation, a humidifier, a valve) and presses what runs (a button, a scene) by default; `icon_tap_action: none` makes it part of the tile again. An icon without actions of its own is part of the tile: a tap there runs the tile's `tap_action`. A fan's blades keep turning with the toggle on them. On the icon, `toggle` locks or unlocks a lock, arms or disarms an alarm panel and switches anything else. A hold runs after a second, so it [confirms](/cards/tile-controls#hold-to-confirm): locks and alarm panels hold their icon by default.

::: live

```yaml
- type: custom:tile-card-pro
  entity: switch.coffee_machine
  name: Coffee
  icon: mdi:coffee-maker
  icon_tap_action: { action: toggle }
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: switch.garden_pump
  icon: mdi:water-pump
  icon_hold_action: { action: toggle }
  grid_options: { columns: 6 }
```

:::

## Controls and buttons

A tile carries one control. It can be one its entity supports (`toggle`, `slider`, `stepper`, `segments`, `select`, `button`, `hold`). It can also be a row of your own buttons that run scenes, scripts or any action. [Tile controls](/cards/tile-controls) has them all. A tile of buttons needs no entity:

::: live

```yaml
type: custom:tile-card-pro
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

`tap_action`, `hold_action` and `double_tap_action` take [Home Assistant's actions](https://www.home-assistant.io/dashboards/actions/): `more-info`, `toggle`, `navigate`, `url`, `perform-action`, `assist` and `none`. With an entity, a tap or a hold opens its more-info dialog. Without one, both do nothing until you set them. A tap anywhere on the tile runs it, also in its padding; the controls keep their own taps, and the icon has [actions of its own](#the-icon). The tile answers the pointer as Home Assistant's does: a light layer in its colour under a mouse, a ripple from where you press, its border and a ring in its colour while it has the keyboard's focus. `hover: false` keeps it still.

::: live

```yaml
- type: custom:tile-card-pro
  name: Coffee
  icon: mdi:coffee-maker
  value: "{{ 'Brewing' if is_state('switch.coffee_machine', 'on') else 'Off' }}"
  color: "{{ 'brown' if is_state('switch.coffee_machine', 'on') else 'grey' }}"
  tap_action: { action: toggle, entity: switch.coffee_machine }
  hold_action: { action: more-info, entity: switch.coffee_machine }
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
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

A house mode with its segments below the line:

::: live

```yaml
type: custom:tile-card-pro
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
```

:::

Today's energy with what it costs, the hours as columns:

::: live

```yaml
type: custom:tile-card-pro
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

The tile card's options are in the [reference](/cards/tile-card#reference), every poster type on a tile on [Tile types](/cards/tile-types).
