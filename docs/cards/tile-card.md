# Tile Card Pro

`custom:tile-card-pro` draws one entity as a tile: the icon, the name, and one line under it with the value, the status and more. Controls sit at the end of that line.

It takes the same **poster types** as the [poster card](/cards/poster-card), smaller. A fan's blades turn in its icon, a thermostat says it is heating, a wind sensor's line gives the direction and the gusts. The type is detected from the entity, so most tiles need only `entity:`.

::: info Beta
The tile card is new in 3.0 and in beta: its options may still change.
:::

## Anatomy

A tile is one row of the sections grid, half a section wide. From left to right:

- the **icon**. It shows the entity's icon or picture, or the poster type's own animated icon. It can have actions of its own: a lock is held there.
- the **name**, and the **line** under it: the value, then the status, then what the type adds. A status that only repeats the value is left out.
- the **controls** the type brings, at the end of the line. On a narrow tile they move under it.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.living_room_co2
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: climate.living_room
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: light.desk_lamp
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.wind_speed
  name: Wind
  grid_options: { columns: 6 }
```

:::

## Poster types on a tile

The [poster types](/cards/poster-types) fill a tile as they fill a poster, less what needs a poster's room:

- **The icon:** a fan, a vacuum, a lawn mower and an appliance move while they run; wind and rain animate theirs. A media player shows its cover art, a person their picture.
- **The line:** the type's value, its status (a rule's label, Heating, Cleaning, Exporting) and what it puts under a poster's value (the direction and gusts, today's total, the battery and the room).
- **The controls:** those a type puts beside a poster's value: a cover's buttons, a fan's speeds, a thermostat's stepper, a light's switch, a player's buttons. A slider below the line is asked for; see [A second row](#a-second-row).
- **The edge:** a light glows from the bottom of the tile, as bright as it is, and a media player's progress runs along the bottom edge.
- **Not on a tile:** the backdrop (a cover's window, a robot's path, a wind field) and the badges.

::: live

```yaml
- type: custom:tile-card-pro
  entity: fan.living_room
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: vacuum.robot
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: media_player.living_room_speaker
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: cover.living_room_blinds
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: weather.home
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.grid_power
  poster: grid
  name: Grid
  grid_options: { columns: 6 }
```

:::

## The line

The line under the name joins its parts with a dot, cut at the end where it is too long:

- the **value**: the type's (a thermostat's temperature, a media player's title), else the state. `value`, `attribute`, `unit` and `decimals` set it as on the poster.
- the **status**: the type's, else the matching rule's label. `status` sets it (a text or a template), `false` leaves it out.
- the **secondary**: what the type adds. `secondary` sets it.

`show_value: false` leaves the value out, `show_name: false` the name.

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
```

:::

## A second row

A tile keeps to one row unless it is asked for more:

- `show_picture: true` draws the type's picture below the line: the weather's next hours, the sun's day, the solar production, a trend's lines.
- `visual` draws a picture of the value: `sparkline`, `columns`, `strip`, `bar` or `gauge`. `glow` lights the tile from below, `none` drops a light's glow.
- `control: slider` (or another control that sits below the line) adds it there.

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
  name: Power
  visual: sparkline
  hours_to_show: 12
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: light.living_room
  control: slider
  grid_options: { columns: 6 }
```

:::

`poster: trend` draws its lines unless `show_picture: false`: without them it is a value alone.

## The icon

The icon takes the poster's keys: `icon`, `icon_style: plain`, `show_entity_picture`, `icon_image` (a URL, a template or an entity's picture), `icon_ring` (the value as a ring around it) and the icon's own actions `icon_tap_action`, `icon_hold_action` and `icon_double_tap_action`. A lock and an alarm panel are held on their icon to lock or arm them. See [The icon](/cards/poster-custom#the-icon) on the poster's page.

::: live

```yaml
- type: custom:tile-card-pro
  entity: lock.front_door
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.living_room_humidity
  icon_ring: true
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: light.desk_lamp
  icon_tap_action: { action: toggle }
  control: false
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  name: Malte
  value: "{{ states('person.malte') }}"
  icon_image: person.malte
  grid_options: { columns: 6 }
```

:::

## From the entity card

The tile card takes over the entity card's tile. Most of its keys are the same; these change:

| Entity card                   | Tile card                                                                                             |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- |
| `visual: ring`                | `icon_ring: true`                                                                                     |
| `visual: icon`                | leave it out: the icon is always drawn                                                                |
| `visual: badge`               | the status is on the line under the name                                                              |
| `toggle: true`                | `control: toggle`                                                                                     |
| `secondary` replaces the line | `secondary` follows the value and the status; `show_value: false` and `status: false` leave those out |
| `control: auto` per domain    | the poster type's controls by default; `control: false` drops them                                    |

## Reference

### Card options

| Option                                                 | Default                    | Description                                                                                                                                   |
| ------------------------------------------------------ | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `entity`                                               | –                          | The entity. Optional: `name` and `value` alone fill a tile.                                                                                   |
| `poster`                                               | detected                   | The [poster type](/cards/poster-types). `entity` turns every default off.                                                                     |
| `variant`, `direction`, `gust`, `today` …              | the type's                 | The type's own keys, as on the poster; each [poster type](/cards/poster-types) lists its own.                                                 |
| `name`, `icon`, `value`, `secondary`, `color`          | the type's                 | The places, templates allowed.                                                                                                                |
| `attribute`, `unit`, `decimals`, `prefix`, `suffix`    | –                          | The value, as on the entity cards.                                                                                                            |
| `status`                                               | the type's                 | The status on the line: a text, a template or `false`; see [The line](#the-line).                                                             |
| `show_name`, `show_icon`, `show_value`                 | `true`                     | `false` leaves out the name, the icon (a type's animated one too) or the value.                                                               |
| `icon_style`, `show_entity_picture`, `icon_image`      | –                          | The icon; see [The icon](#the-icon).                                                                                                          |
| `icon_ring`                                            | `false`                    | A ring of the value around the icon, filled between `min` and `max`.                                                                          |
| `icon_tap_action` …                                    | –                          | `icon_tap_action`, `icon_hold_action`, `icon_double_tap_action`: the icon's own actions. A lock and an alarm panel are held there by default. |
| `show_picture`                                         | `false`                    | The type's picture below the line (a trend's: `true`); see [A second row](#a-second-row).                                                     |
| `visual`                                               | the type's                 | `sparkline`, `columns`, `strip`, `bar` or `gauge` below the line, `glow` (a light's default) or `none`.                                       |
| `rules`                                                | the type's                 | Colour, icon, label and the icon's keys by value or state, as on the [poster](/cards/poster-custom#colour-and-rules).                         |
| `control`                                              | the type's                 | A control as on the [entity cards](/cards/controls), or `false`. The type's own sit at the end of the line.                                   |
| `control_position`                                     | the control's own          | `end` or `block` (below the line).                                                                                                            |
| `control_step`, `control_options` …                    | –                          | `control_step`, `control_attribute`, `control_options`, `control_confirm`: the control's own keys, as on the [entity cards](/cards/controls). |
| `hours_to_show`, `bucket_minutes`, `smoothing_minutes` | the type's, `60`, by width | The picture's window and buckets, as on the [poster](/cards/poster-card#reference).                                                           |
| `tap_action` …                                         | `more-info`                | `tap_action`, `hold_action`, `double_tap_action`; without an entity a tap does nothing.                                                       |
| `hover`                                                | `false`                    | Home Assistant's hover and press layers.                                                                                                      |

Like every card, this one also accepts `grid_options`, `visibility`, `view_layout` and `card_mod`. A tile takes 6 columns and sizes to its content: one row, two with a picture or a control below the line.
