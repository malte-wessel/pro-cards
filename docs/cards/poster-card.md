# Poster Card Pro

`custom:poster-card-pro` draws one entity as a poster. The icon sits at the top left and the badges at the top right. At the bottom come the name in small capitals and the value, large.

What fills these places depends on the entity's **poster type**. A CO₂ sensor brings its air quality bands, a wind sensor its animated field, a media player its cover art. The type is detected from the entity, so most posters need only `entity:`. Every place also has a key of its own, and a poster needs no entity at all.

::: info Beta
The poster card is new in 3.0 and in beta: its options may still change.
:::

## Anatomy

A poster is half a section wide and three rows high in a sections grid, and that at least: less room is what a [tile](/cards/tile-card) is for. Its content sits at the bottom of whatever height it gets. From top to bottom:

- the **icon** at the top left. It shows the entity's icon or picture, or the poster type's own drawing. It can have actions of its own: a lock is held there.
- the **badges** at the top right. The first is the **status badge**, here the matching rule's label.
- the **name**, the large **value** and the line under it. The controls sit beside them, or under them on a narrow card.
- the **picture** along the bottom, here the last 12 hours as a sparkline.
- the **backdrop** behind it all: an image, or what the poster type draws there.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.power_consumption
  name: Power
  visual: sparkline
  hours_to_show: 12
  rules:
    - { below: 1000, color: green, label: Low }
    - { below: 3000, color: amber, label: Normal }
    - { above: 3000, color: red, label: High, style: filled, pulse: true }
  badges:
    - sensor.solar_power
    - sensor.battery_power
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.living_room_temperature
  name: Living room
  grid_options: { columns: 6 }
```

:::

## How a poster gets its look

A poster's defaults come from its **poster type**: what the entity is. The type is detected from the entity's domain and device class, and `poster` sets it by name. [Poster types](/cards/poster-types) shows every type with what it reads and draws.

Every place has a key of its own: `icon`, `name`, `value`, `secondary`, `status`, `color`, `visual` and `image`. A key sets its place and the type fills the rest. So a poster can change one detail of its type, or need no entity at all. [Custom posters](/cards/poster-custom) builds posters from these keys.

The other pages cover the rest:

- [Controls](/cards/poster-controls): the switches and sliders a type brings or `control` adds.
- [Badges](/cards/poster-badges): the badges in the corner.
- [Sizes](/cards/poster-sizes): how a poster fits its size.

## A first set of posters

Four entities, nothing but `entity` and a key or two: a power sensor with its last hours, a light with its switch and dimmer, the weather with its forecast, and the wind as an animated field.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.power_consumption
  name: Power
  visual: sparkline
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: light.living_room
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: weather.home
  name: Outside
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.wind_speed
  name: Wind
  variant: lines
  grid_options: { columns: 6 }
```

:::

## An unavailable entity

While its entity is unavailable, a poster draws a dash for the value, its status says Unavailable and its controls are greyed out. An entity that does not exist draws the same, its status naming the missing entity.

::: live

```yaml
- type: custom:poster-card-pro
  entity: light.shed
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: climate.shed
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: cover.shed_door
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: lock.shed
  grid_options: { columns: 6 }
```

:::

## Reference

### Card options

| Option                                              | Default             | Description                                                                                                                                   |
| --------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `entity`                                            | –                   | The entity. Optional: the keys alone can fill a poster ([Custom posters](/cards/poster-custom)).                                              |
| `poster`                                            | detected            | The [poster type](/cards/poster-types). `entity` turns every default off.                                                                     |
| `variant`                                           | the type's          | How the type draws its subject; each [poster type](/cards/poster-types) lists its own.                                                        |
| `direction`, `gust`, `today` …                      | found on the device | The other entities a type reads, or `false` for none; each [poster type](/cards/poster-types) lists its own.                                  |
| `running_above`, `series`                           | –                   | The [appliance](/cards/poster-types#appliance)'s threshold and the [trend](/cards/poster-types#trend)'s series.                               |
| `name`, `icon`, `value`, `secondary`, `color`       | the type's          | The places, templates allowed; see [The places](/cards/poster-custom#the-places).                                                             |
| `attribute`, `unit`, `decimals`, `prefix`, `suffix` | –                   | The value, as on the entity cards.                                                                                                            |
| `name_position`                                     | `above`             | `below` puts the name under the value; see [The places](/cards/poster-custom#the-places).                                                     |
| `show_name`, `show_icon`, `show_value`              | `true`              | `false` leaves out the name, the icon (a poster type's animated one too) or the large value.                                                  |
| `icon_style`                                        | `circle`            | `plain` drops the circle behind the icon; see [The icon](/cards/poster-custom#the-icon).                                                      |
| `show_entity_picture`                               | `false`             | The entity's picture in the icon's place (the weather's, a person's and a media player's by default).                                         |
| `icon_image`                                        | –                   | A picture in the icon: a URL, a template or an entity's picture; see [The icon](/cards/poster-custom#the-icon).                               |
| `icon_ring`                                         | `false`             | A ring of the value around the icon, filled between `min` and `max`.                                                                          |
| `icon_tap_action` …                                 | –                   | `icon_tap_action`, `icon_hold_action`, `icon_double_tap_action`: the icon's own actions. A lock and an alarm panel are held there by default. |
| `status`                                            | the type's          | The status badge: a text, a template, badge keys or `false`; see [The status badge](/cards/poster-badges#the-status-badge).                   |
| `badges`                                            | –                   | The badges in the corner; see [Badges](/cards/poster-badges).                                                                                 |
| `visual`                                            | the type's          | The picture: `sparkline`, `columns`, `strip`, `bar`, `gauge`, `glow` or `none`; see [A picture](/cards/poster-custom#a-picture).              |
| `image`                                             | the type's          | The backdrop: a URL, a template or an entity's picture, or `false`; see [A backdrop](/cards/poster-custom#a-backdrop).                        |
| `image_opacity`, `image_tint`                       | `0.3`, the surface  | How much of the backdrop's picture shows through its shade, and the shade's colour; see [A backdrop](/cards/poster-custom#a-backdrop).        |
| `image_blur`                                        | the type's          | Blurs the backdrop: `true` or a number of px, `false` for none. A person's photo and a media player's art are blurred by default.             |
| `rules`                                             | the type's          | Colour, icon, label, the icon's and the backdrop's keys by value or state; see [Colour and rules](/cards/poster-custom#colour-and-rules).     |
| `control`                                           | the type's          | A control as on the [entity cards](/cards/controls), or `false`; see [Poster controls](/cards/poster-controls).                               |
| `control_position`                                  | the control's own   | `end` or `block`; see [Where it sits](/cards/poster-controls#where-it-sits).                                                                  |
| `control_step`, `control_options` …                 | –                   | `control_step`, `control_attribute`, `control_options`, `control_confirm`: the control's own keys, as on the [entity cards](/cards/controls). |
| `hours_to_show`                                     | the type's          | The picture's window in hours: 24, the weather's forecast 12 ahead, a trend's 6. A solar poster always draws today.                           |
| `bucket_minutes`, `smoothing_minutes`               | `60`, by width      | The buckets of `columns` and `strip`, the averaging of `sparkline`, as on the [entity card](/cards/entity-card#reference).                    |
| `tap_action` …                                      | `more-info`         | `tap_action`, `hold_action`, `double_tap_action`; see [Actions](/cards/poster-custom#actions).                                                |
| `hover`                                             | `false`             | Home Assistant's hover and press layers.                                                                                                      |

Like every card, this one also accepts `grid_options`, `visibility`, `view_layout` and `card_mod`. A poster takes 6 columns and three rows by default. `fill_height: false` keeps it at its own height; see [Poster sizes](/cards/poster-sizes).
