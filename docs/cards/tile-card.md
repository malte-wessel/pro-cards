# Tile Card Pro

`custom:tile-card-pro` draws one entity as a tile: the icon, the name, and one line under it with the value, the status and more. Controls sit at the end of that line.

What fills these parts depends on the entity's **kind**, the same kinds the [poster card](/cards/poster-card) draws, smaller. A fan's blades turn in its icon, a thermostat says it is heating, a wind sensor's line gives the direction and the gusts. The kind is detected from the entity, so most tiles need only `entity:`. Every part also has a key of its own, and a tile needs no entity at all.

::: info Beta
The tile card is new in 3.0 and in beta: its options may still change.
:::

## Anatomy

A tile is half a section wide and one row high in a sections grid, and it grows with what it holds. From left to right:

- the **icon**. It shows the entity's icon or picture, or the kind's own animated icon. It can have actions of its own: a lock is held there.
- the **name**, and the **line** under it: the value, then the status, then what the kind adds. A status that only repeats the value is left out there; as a badge (`status_badge: true`) it always shows.
- your **badges** at the end of the first row, the status first among them with `status_badge: true`. The icon carries Home Assistant's badge: a thermostat heating, a person's zone, an unavailable entity.
- the **controls** the kind brings, at the end of the line. On a narrow tile they move under it; a tile too short for that keeps them beside the name, or leaves them out (a tap opens more-info).
- the **visual**: the kind's below the line (the weather's forecast, the sun's day, a battery's segments), a plot of the value, or behind the texts (a light's glow, a person's photo). A slider below the line where asked for. A glow, a picture behind and a media player's progress take no row of their own.

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
  status_badge: true
  grid_options: { columns: 6 }
```

:::

## How a tile gets its look

A tile's defaults come from its **kind**: what the entity is. The kind is detected from the entity's domain and device class, and `kind` sets it by name. [Kinds](/cards/tile-types) shows every kind on a tile.

Every part has a key of its own: `icon`, `name`, `value`, `status`, `secondary`, `color`, `visual` and `control`. A key sets its part and the kind fills the rest. So a tile can change one detail of its kind, or need no entity at all. Two of them are **places**: `icon` and `visual` each take a thing with its options, `false` for none, or the kind's when left out; see [The places](/cards/tile-custom#the-places). [Custom tiles](/cards/tile-custom) builds tiles from these keys.

The other pages cover the rest:

- [Controls](/cards/tile-controls): the switches and buttons a kind brings or `control` adds.
- [Badges](/cards/tile-badges): the badges beside the name, the status as one, and the badge on the icon.
- [Sizes](/cards/tile-sizes): how a tile fits its size, and what makes it taller.

## A first set of tiles

Six entities and nothing else: a CO₂ sensor with its air quality bands, a light with its switch and glow, a fan turning at its speed, a thermostat with its target, the weather with its next hours and a robot vacuum at work.

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

| Entity card                                            | Tile card                                                                                             |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `visual: ring`                                         | `icon: { ring: true }`                                                                                |
| `visual: icon`                                         | leave it out: the icon is always drawn                                                                |
| `visual: badge`                                        | the status is on the line under the name                                                              |
| `toggle: true`                                         | `control: toggle`                                                                                     |
| `icon_style`, `icon_ring`, `show_entity_picture`       | `icon: { style, ring }`, `icon: { type: image }`                                                      |
| `hours_to_show`, `bucket_minutes`, `smoothing_minutes` | `visual: { hours, bucket, smoothing }`                                                                |
| `color`, `icon` beat the rules                         | a matching rule's `color` and `icon` win over the card's                                              |
| `secondary` replaces the line                          | `secondary` follows the value and the status; `show_value: false` and `status: false` leave those out |
| `control: auto` per domain                             | the kind's controls by default; `control: false` drops them                                           |

The old keys stop the card with an error that names the new one.

## The visual editor

Home Assistant's card editor shows a form for the tile: the entity and its kind at the top, then sections for the content, the icon and the visual, the controls, the other entities the kind reads, the status and the badges, the rules, the interactions and the layout. It offers only what applies to the kind: a light's switch and glow, a wind sensor's animation and its direction and gust sensors. A field left alone keeps the kind's default and writes nothing to the YAML. The rules list shows the kind's own while the card has none; changing one copies them all into the card (their thresholds in the sensor's unit), and **Predefined** goes back to the kind's. Try it in the [Playground](/playground), or with **Edit** under any example.

## Reference

### Card options

| Option                                              | Default                      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entity`                                            | –                            | The entity. Optional: the keys alone can fill a tile ([Custom tiles](/cards/tile-custom)).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `kind`                                              | detected                     | What the entity is, its [kind](/cards/tile-types). `none` turns every default off.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `inputs`                                            | found on the device          | The other entities a kind reads, by their names (`direction`, `gust`, `today` …), each an entity or `false` for none, as on the poster; each [kind](/cards/poster-types) lists its own.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `running_above`, `series`                           | –                            | The [appliance](/cards/poster-types#appliance)'s threshold and the [trend](/cards/poster-types#trend)'s series.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `icon`                                              | the kind's                   | The icon: an icon's name or a template, `{ type: icon \| image \| flow, … }` with its options (`name`, `ring`, `style`, `src`, `variant`), or `false` for none; see [The places](/cards/tile-custom#the-places). A name is a default: a matching rule's icon wins. The object also takes the icon's own actions (`tap_action`, `hold_action`, `double_tap_action`; a lock and an alarm panel are held there by default, what switches is toggled; see [The icon](/cards/tile-custom#the-icon)) and the `badge` on it: `auto` (Home Assistant's), `false`, or `{ icon, color }` of your own, templates allowed; see [Badges](/cards/tile-badges#the-icon-badge). A rule may set the badge, not the actions. |
| `visual`                                            | the kind's                   | Below the line: `sparkline`, `columns`, `strip`, `bar`, `gauge`, `segments`, `sun` (a second row; a weather's `sparkline` is its forecast). Behind the texts: `glow`, `image`, `flow`. By name or `{ type, … }` with its options (`hours`, `bucket`, `smoothing`, `axis`, `src`, `opacity`, `tint`, `blur`, `variant`), or `false` for none; see [The places](/cards/tile-custom#the-places).                                                                                                                                                                                                                                                                                                              |
| `name`, `value`, `secondary`                        | the kind's                   | The texts, templates allowed; see [The line](/cards/tile-custom#the-line).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `color`                                             | the kind's                   | The tile's colour, a template allowed. A default: a matching rule's colour wins.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `attribute`, `unit`, `decimals`, `prefix`, `suffix` | –                            | The value, as on the entity cards.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `min`, `max`                                        | the entity's, else 0 and 100 | The range of a level: a bar, a gauge, segments, a glow, the icon's ring.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `status`                                            | the kind's                   | The status: a text, a template, or `false` for none; see [The line](/cards/tile-custom#the-line). Its look is the tile's: a tag in its colour.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `status_badge`                                      | `false`                      | `true` draws the status as the first badge, in place of on the line; see [Badges](/cards/tile-badges#the-status-badge).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `badges`                                            | –                            | Badges at the end of the first row, always shown: the name and the line give way; see [Badges](/cards/tile-badges).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `show_name`, `show_value`                           | `true`                       | `false` leaves out the name or the value (the icon: `icon: false`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `vertical`                                          | `false`                      | The icon on top, the name and the line centred under it, the controls under them (a third row); see [A vertical tile](/cards/tile-sizes#a-vertical-tile).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `rules`                                             | the kind's                   | Colour, icon, status and the two places by value or state; see [Colour and rules](/cards/tile-custom#colour-and-rules).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `control`                                           | the kind's                   | A control's name as on the [entity cards](/cards/controls), `true`, or `false` for none; or `{ type, position, attribute, step, options, confirm }`: the control (`type`), `end` or `block` (`position`), and its own options. Without `type` the object changes the kind's controls (`control: { step: 1 }`). See [Tile controls](/cards/tile-controls#reference).                                                                                                                                                                                                                                                                                                                                        |
| `tap_action` …                                      | `more-info`                  | `tap_action`, `hold_action`, `double_tap_action`; see [Actions](/cards/tile-custom#actions).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `hover`                                             | `true`                       | Home Assistant's hover and press, as on its tile card: a light layer under a mouse, a ripple from where you press, a ring around the card while it has the keyboard's focus. `false` keeps it still.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

Like every card, this one also accepts `grid_options`, `visibility`, `view_layout` and `card_mod`. A tile takes 6 columns and sizes to its content; see [Tile sizes](/cards/tile-sizes).
