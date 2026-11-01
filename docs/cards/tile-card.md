# Tile Card Pro

`custom:tile-card-pro` draws one entity as a tile: the icon, the name, and one line under it with the value, the status and more. Controls sit at the end of that line.

What fills these places depends on the entity's **poster type**, the same types the [poster card](/cards/poster-card) draws, smaller. A fan's blades turn in its icon, a thermostat says it is heating, a wind sensor's line gives the direction and the gusts. The type is detected from the entity, so most tiles need only `entity:`. Every place also has a key of its own, and a tile needs no entity at all.

::: info Beta
The tile card is new in 3.0 and in beta: its options may still change.
:::

## Anatomy

A tile is half a section wide and one row high in a sections grid, and it grows with what it holds. From left to right:

- the **icon**. It shows the entity's icon or picture, or the poster type's own animated icon. It can have actions of its own: a lock is held there.
- the **name**, and the **line** under it: the value, then the status, then what the type adds. A status that only repeats the value is left out.
- the **controls** the type brings, at the end of the line. On a narrow tile they move under it; a tile too short for that keeps them beside the name, or leaves them out (a tap opens more-info).
- below the line, only where asked for: the type's **picture**, a plot of the value, or a slider. A light's glow and a media player's progress take no row of their own.

`vertical: true` stacks them instead: the icon on top, the name and the line centred under it; see [A vertical tile](/cards/tile-sizes#a-vertical-tile).

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

## How a tile gets its look

A tile's defaults come from its **poster type**: what the entity is. The type is detected from the entity's domain and device class, and `poster` sets it by name. [Tile types](/cards/tile-types) shows every type on a tile.

Every place has a key of its own: `icon`, `name`, `value`, `status`, `secondary`, `color`, `visual` and `control`. A key sets its place and the type fills the rest. So a tile can change one detail of its type, or need no entity at all. [Custom tiles](/cards/tile-custom) builds tiles from these keys.

The other pages cover the rest:

- [Controls](/cards/tile-controls): the switches and buttons a type brings or `control` adds.
- [Sizes](/cards/tile-sizes): how a tile fits its size, and what makes it taller.

## A first set of tiles

Six entities and nothing else: a CO₂ sensor with its air quality bands, a light with its switch and glow, a fan turning at its speed, a thermostat with its target, the weather and a robot vacuum at work.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.living_room_co2
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: light.living_room
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: fan.living_room
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: climate.living_room
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: weather.home
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: vacuum.robot
  grid_options: { columns: 6 }
```

:::

## An unavailable entity

While its entity is unavailable, a tile draws a dash for the value, its status says unavailable and its controls are greyed out. An entity that does not exist draws the same, its line naming the missing entity.

::: live

```yaml
- type: custom:tile-card-pro
  entity: light.shed
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: climate.shed
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: lock.shed
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: cover.shed_door
  grid_options: { columns: 6 }
```

:::

## From the entity card

The tile card takes over the [entity card](/cards/entity-card)'s tile. Most of its keys are the same; these change:

| Entity card                   | Tile card                                                                                             |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- |
| `visual: ring`                | `icon_ring: true`                                                                                     |
| `visual: icon`                | leave it out: the icon is always drawn                                                                |
| `visual: badge`               | the status is on the line under the name                                                              |
| `toggle: true`                | `control: toggle`                                                                                     |
| `secondary` replaces the line | `secondary` follows the value and the status; `show_value: false` and `status: false` leave those out |
| `control: auto` per domain    | the poster type's controls by default; `control: false` drops them                                    |

The old keys stop the card with an error that names the new one.

## Reference

### Card options

| Option                                                 | Default                    | Description                                                                                                                                                                                          |
| ------------------------------------------------------ | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entity`                                               | –                          | The entity. Optional: the keys alone can fill a tile ([Custom tiles](/cards/tile-custom)).                                                                                                           |
| `poster`                                               | detected                   | The [poster type](/cards/tile-types). `entity` turns every default off.                                                                                                                              |
| `variant`, `direction`, `gust`, `today` …              | the type's                 | The type's own keys, as on the poster; each [poster type](/cards/poster-types) lists its own.                                                                                                        |
| `running_above`, `series`                              | –                          | The [appliance](/cards/poster-types#appliance)'s threshold and the [trend](/cards/poster-types#trend)'s series.                                                                                      |
| `name`, `icon`, `value`, `secondary`, `color`          | the type's                 | The places, templates allowed; see [The places](/cards/tile-custom#the-places).                                                                                                                      |
| `attribute`, `unit`, `decimals`, `prefix`, `suffix`    | –                          | The value, as on the entity cards.                                                                                                                                                                   |
| `status`                                               | the type's                 | The status on the line: a text, a template or `false`; see [The line](/cards/tile-custom#the-line).                                                                                                  |
| `show_name`, `show_icon`, `show_value`                 | `true`                     | `false` leaves out the name, the icon (a type's animated one too) or the value.                                                                                                                      |
| `icon_style`                                           | `circle`                   | `plain` drops the circle behind the icon; see [The icon](/cards/tile-custom#the-icon).                                                                                                               |
| `show_entity_picture`                                  | `false`                    | The entity's picture in the icon's place (the weather's, a person's and a media player's by default).                                                                                                |
| `icon_image`                                           | –                          | A picture in the icon: a URL, a template or an entity's picture; see [The icon](/cards/tile-custom#the-icon).                                                                                        |
| `icon_ring`                                            | `false`                    | A ring of the value around the icon, filled between `min` and `max`.                                                                                                                                 |
| `icon_tap_action` …                                    | –                          | `icon_tap_action`, `icon_hold_action`, `icon_double_tap_action`: the icon's own actions. A lock and an alarm panel are held there by default.                                                        |
| `vertical`                                             | `false`                    | The icon on top, the name and the line centred under it, the controls under them (a third row); see [A vertical tile](/cards/tile-sizes#a-vertical-tile).                                            |
| `show_picture`                                         | `false`                    | The type's picture below the line (a trend's: `true`); see [A second row](/cards/tile-custom#a-second-row).                                                                                          |
| `visual`                                               | the type's                 | `sparkline`, `columns`, `strip`, `bar` or `gauge` below the line, `glow` (a light's default) or `none`.                                                                                              |
| `rules`                                                | the type's                 | Colour, icon, label and the icon's keys by value or state; see [Colour and rules](/cards/tile-custom#colour-and-rules).                                                                              |
| `control`                                              | the type's                 | A control as on the [entity cards](/cards/controls), or `false`; see [Tile controls](/cards/tile-controls).                                                                                          |
| `control_position`                                     | the control's own          | `end` or `block`; see [Where it sits](/cards/tile-controls#where-it-sits).                                                                                                                           |
| `control_step`, `control_options` …                    | –                          | `control_step`, `control_attribute`, `control_options`, `control_confirm`: the control's own keys, as on the [entity cards](/cards/controls).                                                        |
| `hours_to_show`, `bucket_minutes`, `smoothing_minutes` | the type's, `60`, by width | The picture's window and buckets, as on the [poster](/cards/poster-card#reference).                                                                                                                  |
| `tap_action` …                                         | `more-info`                | `tap_action`, `hold_action`, `double_tap_action`; see [Actions](/cards/tile-custom#actions).                                                                                                         |
| `hover`                                                | `true`                     | Home Assistant's hover and press, as on its tile card: a light layer under a mouse, a ripple from where you press, a ring around the card while it has the keyboard's focus. `false` keeps it still. |

Like every card, this one also accepts `grid_options`, `visibility`, `view_layout` and `card_mod`. A tile takes 6 columns and sizes to its content; see [Tile sizes](/cards/tile-sizes).
