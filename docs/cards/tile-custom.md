# Custom tiles

A tile has a few parts: the icon, the name, the line under it and the controls at its end, with a visual or a slider below where asked for. The entity's [kind](/cards/tile-types) fills these parts. Every part also has a key of its own, so a tile can show anything: a value you compute, another entity's picture, or only your own buttons. This page builds tiles from those keys. The [overview](/cards/tile-card) shows how a tile is laid out.

## The parts

| Part     | Key                            | Takes                                                                                                                     | Default                                                 |
| -------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Icon     | `icon`                         | an icon's name, a template, or a [place's thing](#the-places): a picture, a ring, [its own actions](#the-icon), its badge | the entity's icon, or the kind's                        |
| Name     | `name`                         | a text, a template                                                                                                        | the friendly name                                       |
| The line | `value`, `status`, `secondary` | a text or a template each; see [The line](#the-line)                                                                      | the state, the kind's status, the kind's line           |
| Colour   | `color`, `rules`               | a colour token, hex or a template; [rules](#colour-and-rules) by value                                                    | the matching rule's, else Home Assistant's state colour |
| Visual   | `visual`                       | a [place's thing](#the-places): a plot or a bar [below the line](#a-second-row), a glow or a picture behind               | the kind's                                              |
| Control  | `control`                      | any [control](/cards/tile-controls) by its name or `{ type, …options }`, or your own buttons                              | the kind's                                              |

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

- the **value**: the kind's (a thermostat's temperature, a media player's title), else the state. `value` and `attribute` set it; `unit`, `decimals`, `prefix` and `suffix` format a number.
- the **status**: the kind's, else the matching rule's status. `status` sets it (a text or a template), `false` leaves it out. A status that only repeats the value is left out: a vacuum's Cleaning shows once. `status_badge: true` makes it the first badge instead, shown even where it repeats the value; see [Badges](/cards/tile-badges).
- the **secondary**: what the kind adds (the direction and gusts, the artist and the album). `secondary` sets it.

`show_value: false` leaves the value out, `show_name: false` the name above it.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.living_room_temperature
  name: Living room
  secondary: "Humidity {{ states('sensor.living_room_humidity') }} %"
  rules:
    - { below: 19, color: blue, status: Cold }
    - { below: 24, color: green, status: Comfortable }
    - { above: 24, color: orange, status: Warm }
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

The status is on the line; `status_badge: true` makes it the first badge at the end of the first row, centred on the icon, a tag in the tile's colour. `badges` adds badges of your own there, and the icon's `badge` (`icon: { badge: … }`) decides the badge on the icon. [Badges](/cards/tile-badges) shows them all.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.living_room_co2
  name: CO₂
  status_badge: true
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.living_room_co2
  status_badge: true
  badges:
    - sensor.living_room_temperature
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

With an `entity`, the tile takes its name, icon, state and colour from it, and its kind adds the rest. A key you set changes its own place and leaves the others as they are:

- `attribute` shows an attribute of the entity in place of its state.
- `control: false` drops the kind's control and keeps the rest. The thermostat below keeps its status.
- `kind: none` drops the kind's status, controls, rules, visual and animated icon. The tile shows only what you write.

::: live

```yaml
- type: custom:tile-card-pro
  entity: light.living_room
  kind: none
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

- `status`: the status, on the line or as its badge (a word such as Off or No in quotes: `"Off"`).
- `tint_card: true`: the whole tile in the rule's colour ([tinted tiles](#tinted-tiles)).
- the two places: `icon` and `visual` ([by rule](#by-rule)).

On a tile, a rule's `color` and `icon` win over the card's: `color` and `icon` on the card are its defaults, which a matching rule changes. (On the entity cards it is the other way round: a fixed `color` or `icon` beats the rules.)

A kind brings its own rules (the [predefined sets](/cards/poster-types#predefined-rules)). Your `rules` take their place as a whole, and `rules: []` drops them.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.office_co2
  name: Office air
  rules:
    - { below: 800, color: green, status: Fresh }
    - { below: 1200, color: amber, status: Stuffy, icon: mdi:window-open-variant }
    - { above: 1200, color: red, status: Open a window, icon: mdi:alert }
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: binary_sensor.door_front
  name: Front door
  rules:
    - { state: "on", color: red, icon: mdi:door-open, status: Open }
    - { state: "off", color: green, icon: mdi:door-closed, status: Closed }
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
    - { below: 800, color: green, status: Fresh }
    - { above: 800, color: red, status: Ventilate, tint_card: true }
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

## The places

Two places say what a tile draws besides its texts, as on the [poster](/cards/poster-custom#the-places):

- `icon`: the icon;
- `visual`: what fills the tile behind its texts (a glow, a picture, the wind's field), or [below the line](#a-second-row) in a second row (a plot of the history, a bar, a gauge, the sun's day, the weather's forecast as its sparkline).

Each place takes one **thing**:

- its name: `visual: sparkline`;
- the thing with its options: `visual: { type: sparkline, hours: 12 }`;
- `false` for nothing: `visual: false` draws no visual, `icon: false` no icon;
- left out: the [kind's default](#the-kinds-defaults).

`icon` written as a text is always the icon's name, `icon: mdi:sofa`, and a name makes the place an icon: on a person it shows in place of the photo. Its other things take the object: `icon: { type: image }`.

### The things

| Place    | Thing          | Options                                       | Draws                                                                                                                          | Kinds      |
| -------- | -------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| `icon`   | `icon`         | `name`, `ring`, `style`                       | an icon, the entity's unless `name` says another                                                                               | every kind |
| `icon`   | `image`        | `src`, `ring`, `style`                        | a picture in the icon, the entity's unless `src` says another                                                                  | every kind |
| `icon`   | `flow`         | `variant`, `style`                            | the animation in the icon                                                                                                      | wind, rain |
| `visual` | `glow`         | –                                             | the tile lit from its bottom edge in its colour                                                                                | every kind |
| `visual` | `image`        | `src`, `opacity`, `tint`, `blur`              | a picture behind the whole tile                                                                                                | every kind |
| `visual` | `flow`         | `variant`                                     | the animation behind the whole tile                                                                                            | wind, rain |
| `visual` | `sparkline`    | `hours`, `bucket`, `smoothing`, `axis`, `src` | a line of the history, below the line; a trend's: its series, a weather's: the hours ahead (unless `src` names another entity) | every kind |
| `visual` | `columns`      | `hours`, `bucket`, `axis`, `src`              | a bar per bucket, below the line                                                                                               | every kind |
| `visual` | `strip`        | `hours`, `bucket`, `src`                      | a block per bucket, coloured by the rule each one matched                                                                      | every kind |
| `visual` | `bar`, `gauge` | –                                             | the value between `min` and `max`, below the line                                                                              | every kind |
| `visual` | `segments`     | –                                             | ten segments, filled to the value                                                                                              | every kind |
| `visual` | `sun`          | `hours`                                       | the sun's day, with the sun where it is now                                                                                    | sun        |

A poster's `cover`, `path` and `line` are the cover's, the robots' and the grid's drawings; a tile leaves them out by default, and draws one where it names it (`visual: { type: cover, variant: garage }`). The options are the poster's: see [the things](/cards/poster-custom#the-things). A thing that only some kinds draw is left out on another kind, with a warning in the browser's console (a config error where the `kind` is written).

### The kinds' defaults

A place left out draws the kind's default. Where it is a visual below the line, the tile takes a second row; `visual: false` keeps it to one.

| Kind                                                                               | `icon`                           | `visual`                                       |
| ---------------------------------------------------------------------------------- | -------------------------------- | ---------------------------------------------- |
| [light](/cards/tile-types#light)                                                   |                                  | `glow`: the light's colour and brightness      |
| [climate](/cards/tile-types#climate)                                               |                                  | `glow`: warm while heating, cool while cooling |
| [alarm_control_panel](/cards/tile-types#alarm)                                     |                                  | `glow`: a red pulse while triggered            |
| [wind](/cards/tile-types#wind)                                                     | `{ type: flow, variant: dots }`  |                                                |
| [rain](/cards/tile-types#rain)                                                     | `{ type: flow, variant: drops }` |                                                |
| [person](/cards/tile-types#person), [media_player](/cards/tile-types#media-player) | `{ type: image }`                | `{ type: image, blur: 20 }`: behind the tile   |
| [solar](/cards/tile-types#solar)                                                   |                                  | `{ type: sparkline, hours: today }`            |
| [battery](/cards/tile-types#battery)                                               |                                  | `segments`                                     |
| [sun](/cards/tile-types#sun)                                                       |                                  | `sun`                                          |
| [weather](/cards/tile-types#weather)                                               | `{ type: image }`: the condition | `sparkline`: the hours ahead                   |
| [trend](/cards/tile-types#trend)                                                   |                                  | `sparkline`: its series                        |

Every other kind (the cover, the robots and the grid too) draws the entity's icon and no visual.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.battery_soc
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.battery_soc
  visual: false
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: person.malte
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: person.malte
  icon: mdi:account-heart
  visual: false
  grid_options: { columns: 6 }
```

:::

### Changing a default

An object without `type` keeps the thing and changes its options (with a `name` it is an icon): `visual: { hours: 24 }` makes the weather's forecast look a day ahead, `visual: { blur: false }` shows a person's photo sharp, `icon: { ring: true }` puts a ring around whatever the icon is. An object with the default's own `type` merges the same way; another `type` replaces it. Another thing in the icon keeps what every icon takes, its `ring`, its `style` and its actions and its badge; a thing's own options, an image's `src` or a flow's `variant`, go with it.

Options that would do nothing are caught. Where the config alone decides it, it is an error that names the thing taking them: a written `kind` (`kind: light` with `visual: { hours: 12 }`: the glow takes no hours), a rule over the card's own thing (`visual: sparkline` and a rule's `visual: { opacity: 0.3 }`), or a thing the written kind does not draw. Where the entity decides it (the kind is detected), the browser's console says so once the state is known, and the options are left out.

### One place for the animation

The wind's and the rain's animation is drawn in one place: by default the icon. `visual: { type: flow }` makes it fill the whole tile, and the icon becomes the wind's arrow (the rain's icon). A flow's `variant` picks its drawing: the wind's `dots`, `lines`, `swoosh` or `vectors`, the rain's `drops`, `ripples` or `fill`. Writing a flow in both places is a config error.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.wind_speed
  name: Wind
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.wind_speed
  name: Wind
  visual: { type: flow, variant: lines }
  grid_options: { columns: 6 }
```

:::

### By rule

A rule takes `icon` and `visual` too, read as the card's and drawn over them while it matches: an object without `type` changes options only, a `type` draws another thing, `false` empties the place. A rule sets no window: `hours`, `bucket`, `smoothing` and a plot's `src` stay the card's.

What a place draws comes from, each over the one before: the kind's default, the card's, the first matching rule's.

::: live

```yaml
- type: custom:tile-card-pro
  entity: light.garden
  rules:
    - { state: "off", icon: { style: plain } }
    - { state: "on", icon: { ring: true } }
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: switch.garden_pump
  icon: mdi:water-pump
  visual: { type: image, src: camera.garden, opacity: 0 }
  rules:
    - { state: "on", color: blue, status: Watering, visual: { opacity: 0.6 } }
  grid_options: { columns: 6 }
```

:::

## A second row

A tile keeps to one row unless it is asked for more:

- a kind's visual below the line, by default: the weather's next hours, the sun's day, the solar production, a battery's segments, a trend's lines. `visual: false` leaves it out.
- `visual` draws the entity's value below the line, as on the poster: `sparkline`, `columns` or `strip` from its history over `hours` (24 by default); `bar`, `gauge` or `segments` between `min` and `max`.
- `control: slider` (or another control with `position: block`, `control: { type: buttons, position: block }`) adds a control there; see [Tile controls](/cards/tile-controls#where-it-sits).

A plot or a curve runs to the tile's left, right and bottom edges, as on a poster; a strip keeps the tile's padding.

::: live

```yaml
- type: custom:tile-card-pro
  entity: weather.home
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sun.sun
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.power_consumption
  name: House
  icon: mdi:home-lightning-bolt
  visual: { type: columns, hours: 12, bucket: 30 }
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.living_room_co2
  name: Air today
  visual: strip
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.outdoor_temperature
  name: Outside
  visual: { type: sparkline, hours: 12 }
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.living_room_humidity
  name: Humidity
  visual: bar
  grid_options: { columns: 6 }
```

:::

`glow` takes no row: it lights the tile from its bottom edge in its colour, as strong as the value's level between `min` and `max`, a light's brightness, or on and off. It is the light's default, and any tile can use it; `visual: false` drops it.

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

The icon shows the entity's icon, or the kind's own: the padlock, the fan, the animated wind. `icon` sets [its thing](#the-places):

- a text is an `mdi:` icon, or a template that renders one: `icon: mdi:sofa`. It takes the place of a kind's picture or animated icon too.
- `icon: { style: plain }` draws the icon without its circle.
- `icon: { ring: true }` puts a ring of the value around the icon, filled between `min` and `max` (the entity's own, else 0 and 100).
- `icon: { type: image }` shows the entity's picture where it has one. The weather, a person and a media player do this by default; `icon: { type: icon }` draws their icon.
- `icon: { type: image, src: … }` shows a picture of your own: a URL, a template that renders one, or an entity, whose picture it shows. Its `name` is the icon while there is no picture.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.robot_progress
  name: Cleaning
  icon: { name: mdi:robot-vacuum, ring: true }
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.living_room_humidity
  name: Humidity
  icon: { style: plain }
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  name: Malte
  icon: { type: image, src: person.malte }
  value: "{{ 'Home' if is_state('person.malte', 'home') else 'Away' }}"
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  name: Now playing
  icon:
    type: image
    src: "{{ state_attr('media_player.living_room_speaker', 'entity_picture') }}"
    name: mdi:music
  value: "{{ state_attr('media_player.living_room_speaker', 'media_title') }}"
  grid_options: { columns: 6 }
```

:::

The icon takes actions of its own, as on Home Assistant's tile card: `tap_action`, `hold_action` and `double_tap_action` in the icon's object, beside its `name` (`icon: { name: mdi:coffee-maker, tap_action: { action: toggle } }`), or alone to keep the kind's icon (`icon: { tap_action: … }`). A rule changes the icon's look, never what a tap on it does. As there, the icon toggles what switches (a light, a switch, a fan, an input boolean, a group, an automation, a humidifier, a valve) and presses what runs (a button, a scene) by default; `icon: { tap_action: none }` makes it part of the tile again. An icon without actions of its own is part of the tile: a tap there runs the tile's `tap_action`. A fan's blades keep turning with the toggle on them. On the icon, `toggle` locks or unlocks a lock, arms or disarms an alarm panel and switches anything else. A hold runs after a second, so it [confirms](/cards/tile-controls#hold-to-confirm): locks and alarm panels hold their icon by default.

::: live

```yaml
- type: custom:tile-card-pro
  entity: switch.coffee_machine
  name: Coffee
  icon: { name: mdi:coffee-maker, tap_action: { action: toggle } }
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: switch.garden_pump
  icon:
    name: mdi:water-pump
    hold_action: { action: toggle }
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
control:
  type: buttons
  position: block
  options:
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
control:
  type: segments
  position: block
  options:
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
visual: { type: columns, hours: 24, bucket: 60 }
secondary: "{{ (states('sensor.energy_today') | float(0) * states('sensor.electricity_price') | float(0)) | round(2) }} € at {{ states('sensor.electricity_price') }} €/kWh"
status: "{{ 'Cheap' if states('sensor.electricity_price') | float(0) < 0.25 else 'Expensive' }}"
color: "{{ 'green' if states('sensor.electricity_price') | float(0) < 0.25 else 'orange' }}"
```

:::

The tile card's options are in the [reference](/cards/tile-card#reference), every kind on a tile on [Kinds](/cards/tile-types).
