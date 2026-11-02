# Custom posters

A poster has a few parts: an icon at the top, badges in the corner, and a name, a large value and a line under it at the bottom. A visual and a control go around them. The entity's [kind](/cards/poster-types) fills these parts. Every part also has a key of its own, so a poster can show anything: a value you compute, several entities, or only your own buttons. This page builds posters from those keys. The [overview](/cards/poster-card) shows how a poster is laid out.

## The parts

| Part            | Key              | Takes                                                                                                          | Default                                                 |
| --------------- | ---------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Icon            | `icon`           | an icon's name, a template, or a [place's thing](#the-places): a picture, a ring, [its own actions](#the-icon) | the entity's icon, or the kind's                        |
| Status          | `status`         | a text, a template, or `false` (always the first badge, a tag in the poster's colour)                          | the kind's status, else the matching rule's label       |
| Badges          | `badges`         | entities or [badges](/cards/poster-badges) of your own, in order                                               | none                                                    |
| Name            | `name`           | a text, a template                                                                                             | the friendly name                                       |
| Value           | `value`          | a text, a template; `attribute` shows an attribute                                                             | the entity's state                                      |
| Under the value | `secondary`      | a text, a template                                                                                             | the kind's line                                         |
| Colour          | `color`, `rules` | a colour token, hex or a template; [rules](#colour-and-rules) by value                                         | the matching rule's, else Home Assistant's state colour |
| Visual          | `visual`         | a [place's thing](#the-places): a plot, a bar, a glow, a picture behind                                        | the kind's                                              |
| Control         | `control`        | any [control](/cards/poster-controls) by its name or `{ type, …options }`, or your own buttons                 | the kind's                                              |

A poster needs no entity: the keys alone can fill it. Without an entity, a tap does nothing until you set `tap_action`; a badge with an entity of its own still opens it.

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

With an `entity`, the poster takes its name, icon, state and colour from it, and its kind adds the rest. A key you set changes its own place and leaves the others as they are:

- `attribute` shows an attribute of the entity in place of its state.
- `control: false` drops the kind's control and keeps the rest. The thermostat below keeps its tint and its status.
- `kind: entity` drops the kind's visual, status, controls and rules. The poster shows only what you write.

::: live

```yaml
- type: custom:poster-card-pro
  entity: light.living_room
  kind: entity
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
- the two places: `icon` and `visual` ([by rule](#by-rule)).

On a poster, a rule's `color` and `icon` win over the card's: `color` and `icon` on the card are its defaults, which a matching rule changes. (On the entity cards it is the other way round: a fixed `color` or `icon` beats the rules.)

A kind brings its own rules (the [predefined sets](/cards/poster-types#predefined-rules)). Your `rules` take their place as a whole, and `rules: []` drops them.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.office_co2
  name: Office air
  visual: { type: sparkline, hours: 12 }
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

`tint_card: true` on a rule washes the whole poster in the rule's colour while the rule matches. The card and its visual take a soft tint, in light and dark themes. When another rule or none matches, the poster goes back to its own background. `color` alone colours the icon, the visual and the badge, not the card.

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

## The places

Two places say what a poster draws besides its texts:

- `icon`: the icon at the top left;
- `visual`: what fills the poster behind the texts (a glow, a picture, the wind's field, a cover's drawing) or below them (a plot of the history, a bar, a gauge, the sun's day).

Each place takes one **thing**:

- its name: `visual: sparkline`;
- the thing with its options: `visual: { type: sparkline, hours: 12 }`;
- `false` for nothing: `visual: false` draws no visual, `icon: false` no icon;
- left out: the [kind's default](#the-kinds-defaults).

`icon` written as a text is always the icon's name, `icon: mdi:sofa`, and a name makes the place an icon: on a person it shows in place of the photo. Its other things take the object: `icon: { type: image }`.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.power_consumption
  name: House
  icon: mdi:home-lightning-bolt
  visual: { type: columns, hours: 12, bucket: 30 }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: light.living_room
  icon: { type: icon, ring: true }
  visual: false
  grid_options: { columns: 6 }
```

:::

### The things

| Place    | Thing          | Options                                       | Draws                                                                                                                        | Kinds              |
| -------- | -------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `icon`   | `icon`         | `name`, `ring`, `style`                       | an icon, the entity's unless `name` says another                                                                             | every kind         |
| `icon`   | `image`        | `src`, `ring`, `style`                        | a picture in the icon, the entity's unless `src` says another                                                                | every kind         |
| `icon`   | `flow`         | `style`                                       | the animation in the icon                                                                                                    | wind, rain         |
| `visual` | `glow`         | –                                             | the poster lit from below in its colour, as strong as its level                                                              | every kind         |
| `visual` | `image`        | `src`, `opacity`, `tint`, `blur`              | a [picture behind](#a-picture-behind) the whole poster                                                                       | every kind         |
| `visual` | `flow`         | `style`                                       | the animation behind the whole poster                                                                                        | wind, rain         |
| `visual` | `cover`        | –                                             | the cover's drawing                                                                                                          | the covers         |
| `visual` | `path`         | –                                             | the robot's path                                                                                                             | vacuum, lawn mower |
| `visual` | `line`         | –                                             | the power line                                                                                                               | grid               |
| `visual` | `sparkline`    | `hours`, `bucket`, `smoothing`, `axis`, `src` | a line of the history, filled below; a trend's: its series, a weather's: the hours ahead (unless `src` names another entity) | every kind         |
| `visual` | `columns`      | `hours`, `bucket`, `axis`, `src`              | a bar per bucket, the last one the value now                                                                                 | every kind         |
| `visual` | `strip`        | `hours`, `bucket`, `src`                      | a block per bucket, coloured by the rule each one matched                                                                    | every kind         |
| `visual` | `bar`, `gauge` | –                                             | the value between `min` and `max`, as a bar or an arc                                                                        | every kind         |
| `visual` | `segments`     | –                                             | ten segments, filled to the value                                                                                            | every kind         |
| `visual` | `sun`          | `hours`                                       | the sun's day, with the sun where it is now                                                                                  | sun                |

A thing that only some kinds draw is left out on another kind, with a warning in the browser's console; the kind's own visual stays.

| Option      | Takes                                                                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`      | an `mdi:` icon, or a template that renders one                                                                                                                                              |
| `ring`      | `true`: a ring of the value around the icon, filled between `min` and `max` (the entity's own, else 0 and 100)                                                                              |
| `style`     | an icon or an image: `circle` (the default) or `plain`, without the circle. A flow: the wind's `dots`, `lines`, `swoosh` or `vectors`, the rain's `drops`, `ripples` or `fill`              |
| `src`       | a picture: a URL (`/local/…` for a file in Home Assistant's `www` folder), a template that renders one, or an entity whose picture it shows. A plot: another entity, whose history it draws |
| `opacity`   | how much of the picture shows through its shade, from `0` to `1` (`0.3`)                                                                                                                    |
| `tint`      | a colour mixed into the shade: a theme colour name, a hex or a `var()`                                                                                                                      |
| `blur`      | blurs the picture: a number of px, `true` for 20, `false` for a sharp picture                                                                                                               |
| `hours`     | the window in hours, or `today` (since midnight). 24 by default; the forecast looks 12 ahead, a trend 6 back                                                                                |
| `bucket`    | a bucket's minutes, a column or a block of the strip (`60`)                                                                                                                                 |
| `smoothing` | the sparkline's averaging in minutes (by default one point per 12 px)                                                                                                                       |
| `axis`      | `true`: the plot's axes                                                                                                                                                                     |

### The kinds' defaults

A place left out draws the kind's default. The same on a [tile](/cards/tile-custom#the-places), except that a tile draws no cover, path or line.

| Kind                                                                                   | `icon`                           | `visual`                                                |
| -------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------- |
| [light](/cards/poster-types#light)                                                     |                                  | `glow`: the light's colour, as strong as its brightness |
| [climate](/cards/poster-types#climate)                                                 |                                  | `glow`: warm while heating, cool while cooling          |
| [alarm_control_panel](/cards/poster-types#alarm)                                       |                                  | `glow`: a red pulse while triggered                     |
| [wind](/cards/poster-types#wind)                                                       | `{ type: flow, style: dots }`    |                                                         |
| [rain](/cards/poster-types#rain)                                                       | `{ type: flow, style: drops }`   |                                                         |
| [person](/cards/poster-types#person), [media_player](/cards/poster-types#media-player) | `{ type: image }`                | `{ type: image, blur: 20 }`                             |
| [the covers](/cards/poster-types#cover)                                                |                                  | `cover`                                                 |
| [vacuum, lawn_mower](/cards/poster-types#vacuum-and-lawn-mower)                        |                                  | `path`                                                  |
| [grid](/cards/poster-types#grid)                                                       |                                  | `line`                                                  |
| [solar](/cards/poster-types#solar)                                                     |                                  | `{ type: sparkline, hours: today }`                     |
| [battery](/cards/poster-types#battery)                                                 |                                  | `segments`                                              |
| [sun](/cards/poster-types#sun)                                                         |                                  | `sun`                                                   |
| [weather](/cards/poster-types#weather)                                                 | `{ type: image }`: the condition | `sparkline`: the hours ahead                            |
| [trend](/cards/poster-types#trend)                                                     |                                  | `sparkline`: its series                                 |

Every other kind draws the entity's icon and no visual.

### Changing a default

An object without `type` keeps the thing and changes its options (with a `name` it is an icon): `visual: { hours: 24 }` makes the weather's forecast look a day ahead, `visual: { blur: false }` shows a person's photo sharp, `icon: { ring: true }` puts a ring around whatever the icon is. An object with the default's own `type` merges the same way; another `type` replaces it.

::: live

```yaml
- type: custom:poster-card-pro
  entity: weather.home
  name: Outside
  icon: { type: icon }
  visual: { hours: 24 }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: person.malte
  visual: { blur: false, opacity: 0.6 }
  grid_options: { columns: 6 }
```

:::

### One place for the animation

The wind's and the rain's animation is drawn in one place: by default the icon. `visual: { type: flow }` makes it fill the whole poster, and the icon becomes the wind's arrow (the rain's icon). Writing a flow in both places is a config error.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.wind_speed
  name: Wind
  icon: { type: flow, style: vectors }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.wind_speed
  name: Wind
  visual: { type: flow, style: swoosh }
  grid_options: { columns: 6 }
```

:::

### By rule

A rule takes `icon` and `visual` too, read as the card's and drawn over them while it matches: an object without `type` changes options only, a `type` draws another thing, `false` empties the place. A rule sets no window: `hours`, `bucket`, `smoothing` and a plot's `src` stay the card's.

What a place draws comes from, each over the one before: the kind's default, the card's, the first matching rule's.

Switch the pump on: the garden camera fades in behind it (`opacity` from `0` to `0.6`). The garden light shows the camera dimmed in indigo while it is off, and clearer, with a ring around its icon, while it is on.

::: live

```yaml
- type: custom:poster-card-pro
  entity: switch.garden_pump
  icon: mdi:water-pump
  control: toggle
  visual: { type: image, src: camera.garden, opacity: 0 }
  rules:
    - { state: "on", color: blue, label: Watering, visual: { opacity: 0.6 } }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: light.garden
  visual: { type: image, src: camera.garden }
  rules:
    - { state: "off", visual: { opacity: 0.2, tint: indigo }, icon: { style: plain } }
    - { state: "on", visual: { opacity: 0.6 }, icon: { ring: true } }
  grid_options: { columns: 6 }
```

:::

## A visual

`visual` draws the entity's value along the bottom of the poster, or lights it from below.

- A history covers `hours` (24 by default); `today` starts at midnight.
- A level reads between `min` and `max`: the entity's own, else 0 and 100.

| `visual`    | Draws                                                                           |
| ----------- | ------------------------------------------------------------------------------- |
| `sparkline` | a line of its history, filled below                                             |
| `columns`   | a bar per `bucket` (60 minutes by default), the last one the value now          |
| `strip`     | a block per bucket, coloured by the [rules](#colour-and-rules) each one matched |
| `bar`       | a level between `min` and `max` under the value                                 |
| `gauge`     | an arc between `min` and `max` with the value inside it, centred                |
| `segments`  | ten segments under the value, filled to its level                               |
| `glow`      | the poster lit from below in its colour, as strong as the value's level         |
| `false`     | nothing, not even the kind's                                                    |

A plot's `src` draws another entity's history under this one's value.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.outdoor_temperature
  name: Outside
  visual: { type: sparkline, hours: 12 }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.power_consumption
  name: House
  icon: mdi:home-lightning-bolt
  visual: { type: columns, hours: 12, bucket: 30 }
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
  kind: entity
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

It is the [light](/cards/poster-types#light)'s visual by default, and any poster can use it. On a light, `visual: bar` draws a bar in its place, `visual: false` nothing.

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

For several entities' lines on one scale, see the [trend](/cards/poster-types#trend) kind.

## The icon

The icon at the top left shows the entity's icon, or the kind's own: the padlock, the fan, the animated wind. `icon` sets [its thing](#the-places):

- a text is an `mdi:` icon, or a template that renders one: `icon: mdi:sofa`. It takes the place of a kind's picture or animated icon too.
- `icon: { style: plain }` draws the icon without its circle.
- `icon: { ring: true }` puts a ring of the value around the icon, filled between `min` and `max` (the entity's own, else 0 and 100).
- `icon: { type: image }` shows the entity's picture where it has one. The weather, a person and a media player do this by default; `icon: { type: icon }` draws their icon.
- `icon: { type: image, src: … }` shows a picture of your own: a URL, a template that renders one, or an entity, whose picture it shows.

The options combine: `icon: { name: mdi:robot-vacuum, ring: true }`.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.robot_progress
  name: Cleaning
  icon: { name: mdi:robot-vacuum, ring: true }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.living_room_humidity
  name: Humidity
  icon: { style: plain, ring: true }
  visual: sparkline
  grid_options: { columns: 6 }
```

:::

A picture in the icon needs no entity of the poster's own:

::: live

```yaml
- type: custom:poster-card-pro
  name: Malte
  icon: { type: image, src: person.malte }
  value: "{{ 'Home' if is_state('person.malte', 'home') else 'Away' }}"
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  name: Now playing
  icon: { type: image, src: "{{ state_attr('media_player.living_room_speaker', 'entity_picture') }}" }
  value: "{{ state_attr('media_player.living_room_speaker', 'media_title') }}"
  grid_options: { columns: 6 }
```

:::

The icon takes [actions](#actions) of its own, as on Home Assistant's tile card: `tap_action`, `hold_action` and `double_tap_action` in the icon's object, beside its `name` (`icon: { name: mdi:coffee-maker, tap_action: { action: toggle } }`), or alone to keep the kind's icon (`icon: { tap_action: … }`). A rule changes the icon's look, never what a tap on it does. An icon without actions of its own is part of the poster: a tap there runs the poster's `tap_action`. On the icon, `toggle` locks or unlocks a lock, arms or disarms an alarm panel and switches anything else. A hold runs after a second, so it [confirms](/cards/poster-controls#hold-to-confirm): locks and alarm panels hold their icon by default.

::: live

```yaml
- type: custom:poster-card-pro
  entity: switch.coffee_machine
  name: Coffee
  icon: { name: mdi:coffee-maker, tap_action: { action: toggle } }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: switch.garden_pump
  icon:
    name: mdi:water-pump
    hold_action: { action: toggle }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.living_room_temperature
  name: Living room
  icon:
    tap_action: { action: navigate, navigation_path: /config }
    double_tap_action: { action: more-info, entity: climate.living_room }
  grid_options: { columns: 6 }
```

:::

## A picture behind

`visual: { type: image }` puts a picture behind the whole poster, under a shade that keeps the text readable. Its `src` takes:

- a URL (`/local/…` for a file in Home Assistant's `www` folder);
- a template that renders one;
- an entity, whose picture it shows: a camera's snapshot, a person's photo, a media player's art.

Without `src` it shows the poster's own entity's picture. A person poster has their photo behind it already; `visual: false` drops it, and `visual: { type: image, src: person.malte }` puts it behind any other poster.

`blur` blurs the picture: `true` for 20 px, or a number of pixels. A person's photo and a media player's art are blurred by default; `blur: false` shows them sharp.

A shade of the card's own surface lies over the picture, so the text reads on it. `opacity` sets how much of the picture shows through, from `0` to `1` (`0.3` by default). `tint` mixes a colour into the shade (half and half with the card's surface, so the text still reads): a theme colour name, a hex or a `var()`.

::: live

```yaml
- type: custom:poster-card-pro
  name: Garden
  icon: mdi:cctv
  visual: { type: image, src: camera.garden, opacity: 0.7 }
  value: Clear
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  name: Garden
  icon: mdi:cctv
  visual: { type: image, src: camera.garden, tint: deep-purple }
  value: Night
  grid_options: { columns: 6 }
```

:::

::: live

```yaml
- type: custom:poster-card-pro
  name: Garden
  icon: mdi:cctv
  visual: { type: image, src: camera.garden }
  value: "{{ 'Light on' if is_state('light.garden', 'on') else 'Light off' }}"
  secondary: "{{ 'Pump running' if is_state('switch.garden_pump', 'on') else 'Pump off' }}"
  tap_action: { action: more-info, entity: camera.garden }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  name: Malte
  icon: mdi:account
  visual: { type: image, src: "{{ state_attr('person.malte', 'entity_picture') }}", blur: 8 }
  value: "{{ 'Home' if is_state('person.malte', 'home') else 'Away' }}"
  grid_options: { columns: 6 }
```

:::

A camera's snapshot behind a light, in place of its glow: see the garden, then switch its light.

::: live

```yaml
type: custom:poster-card-pro
entity: light.garden
visual: { type: image, src: camera.garden }
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
control:
  type: segments
  position: block
  options:
    - { value: Home, icon: mdi:home }
    - { value: Away, icon: mdi:home-export-outline }
    - { value: Night, icon: mdi:weather-night }
    - { value: Guest, icon: mdi:account-multiple }
status: false
badges:
  - person.malte
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
visual: { type: columns, hours: 24, bucket: 60 }
secondary: "{{ (states('sensor.energy_today') | float(0) * states('sensor.electricity_price') | float(0)) | round(2) }} € at {{ states('sensor.electricity_price') }} €/kWh"
status: "{{ 'Cheap' if states('sensor.electricity_price') | float(0) < 0.25 else 'Expensive' }}"
color: "{{ 'green' if states('sensor.electricity_price') | float(0) < 0.25 else 'orange' }}"
```

:::

The poster card's options are in the [reference](/cards/poster-card#reference), every kind and its keys on [Kinds](/cards/poster-types).
