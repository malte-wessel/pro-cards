# Tile

`custom:tile-card-pro` draws one entity as a compact tile: an icon, a name and one line with its value and status. It is the small card for most of a dashboard; the [poster](/cards/poster-card) draws the same entities larger.

::: info Beta
The tile card is new in 3.0 and in beta: its options may still change.
:::

## The parts

A tile is half a section wide and one row high, and it grows with what it holds. From left to right:

- the **icon**: the entity's icon or picture, or the kind's own animated icon (a fan's blades turn).
- the **name**, and the **line** under it: the value, then the status, then what the kind adds (a wind sensor's direction and gusts).
- the **controls** at the end of the line: a light's switch, a thermostat's target. On a narrow tile they move under the line.
- the **visual**: below the line (a plot of the last hours, the forecast, a battery's segments) or behind the texts (a light's glow).

What fills these parts comes from the entity's [kind](/cards/kinds): what the entity is. The kind is detected from the entity, so most tiles need only `entity`.

::: live

```yaml
- type: custom:tile-card-pro
  entity: light.living_room
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.living_room_temperature
  visual: sparkline
  grid_options: { columns: 6 }
```

:::

## A first set of tiles

Eight entities and nothing else. Each tile shows its kind: the CO₂ sensor its air quality, the thermostat its target and a stepper, the fan its speeds, the blinds their buttons, the speaker what is playing, the lock a hold on its icon, the robot what it is doing and the weather its next hours.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.living_room_co2
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: climate.living_room
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: fan.living_room
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: cover.living_room_blinds
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: media_player.living_room_speaker
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: lock.front_door
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: vacuum.robot
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: weather.home
  grid_options: { columns: 6 }
```

:::

## Changing one thing

Every part has a key of its own: `name`, `icon`, `color`, `value`, `status`, `visual`, `control` and more. A key sets its part and the kind fills the rest, so you change one detail and keep everything else.

`rules` change the look by the value: the first matching rule sets the colour, the icon or the status. A rule's colour and icon win over the card's `color` and `icon`, which are only defaults. [Look](/cards/look) covers the icon, the visual, colours and rules in full.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.living_room_temperature
  name: Living room
  rules:
    - { below: 19, color: blue, status: Cold }
    - { below: 24, color: green, status: Comfortable }
    - { above: 24, color: orange, status: Warm }
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.living_room_humidity
  name: Humidity
  icon: mdi:water-percent
  color: teal
  grid_options: { columns: 6 }
```

:::

## A vertical tile

`vertical: true` puts the icon on top, with the name and the line centred under it and the controls under them, as Home Assistant's own tile does. A vertical tile can be as narrow as a quarter of a section; a control takes a row more.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.living_room_humidity
  name: Humidity
  vertical: true
  grid_options: { columns: 4 }
- type: custom:tile-card-pro
  entity: light.living_room
  vertical: true
  grid_options: { columns: 4 }
- type: custom:tile-card-pro
  entity: lock.front_door
  vertical: true
  grid_options: { columns: 4 }
```

:::

## In a taller cell

A tile is as tall as its content, but a fixed row count or a taller card beside it in its row can make it taller. `vertical_align` sets where the content sits then: `center` (the default), `top` or `bottom`. A plot below the line grows into the room instead.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.living_room_temperature
  name: Top
  vertical_align: top
  grid_options: { columns: 4, rows: 2 }
- type: custom:tile-card-pro
  entity: sensor.living_room_temperature
  name: Centre
  grid_options: { columns: 4, rows: 2 }
- type: custom:tile-card-pro
  entity: sensor.living_room_temperature
  name: Bottom
  vertical_align: bottom
  grid_options: { columns: 4, rows: 2 }
```

:::

## An unavailable entity

While its entity is unavailable, a tile draws a dash for the value, its status says Unavailable and its controls are greyed out. An entity that does not exist draws the same, its line naming the missing entity.

::: live

```yaml
- type: custom:tile-card-pro
  entity: light.shed
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: climate.shed
  grid_options: { columns: 6 }
```

:::

## The visual editor

Home Assistant's card editor shows a form for the tile. It starts with what the tile shows: the entity as it is, texts of your own (no entity), or a kind; under it the entity, offering only those that fit the kind, and the other entities the kind reads. A kind the entity does not fit waits for one that does: the YAML stays as it was until you pick one. Then come the name, the value (what it shows, how it is written, its range), the status, the appearance (the colour, then the icon and the visual under headings of their own), the layout (vertical, the alignment, filling the height), the controls, the badges, the rules and the interactions (the card's taps, then the icon's). It offers only what applies, and a field left alone keeps the kind's default and writes nothing to the YAML. The badges, the rules, a trend's lines and a control's options or buttons are lists: a row each, saying what it shows or when it matches, and its form in a view of its own (a back arrow returns). A trend line's form has its own rules (its colour by its value) and conditions for when it shows. A badge's form starts the same way, with what it shows (the entity as it is, a text of your own, or a kind whose colours it takes; an empty entity reads the tile's), then its name, value, appearance, visual, switch, actions and its own rules, each rule opening on top of the badge. Try it in the [Playground](/playground), or with **Edit** under any example.

Coming from the entity card? [Moving to 3.0](/guide/migrating) maps its keys to the tile's.

## Reference

### Entity and kind

| Key             | Default             | Description                                                                                                                                      |
| --------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `entity`        | –                   | The entity. Optional: the keys alone can fill a tile.                                                                                            |
| `kind`          | detected            | What the entity is; see [Kinds](/cards/kinds). `none` turns every default off.                                                                   |
| `inputs`        | found on the device | The other entities a kind reads, by name (`direction`, `gust`, `today` …), each an entity or `false` for none; [Kinds](/cards/kinds) lists them. |
| `running_above` | –                   | An appliance's power (W) above which it runs.                                                                                                    |
| `series`        | –                   | A trend's series: entity ids, or objects with `entity`, `name`, `color`, `rules`, `visibility`.                                                  |

### Texts and value

| Key                       | Default                      | Description                                                                              |
| ------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------- |
| `name`                    | the friendly name            | The name. Template allowed.                                                              |
| `value`                   | the kind's, else the state   | A text or a template in place of the state.                                              |
| `attribute`               | –                            | Shows this attribute in place of the state.                                              |
| `unit`                    | the entity's                 | The value's unit.                                                                        |
| `decimals`                | –                            | Decimals of a number, 0 to 3.                                                            |
| `prefix`, `suffix`        | –                            | Text before and after the value.                                                         |
| `min`, `max`              | the entity's, else 0 and 100 | The range of a bar, a gauge, segments, a glow or the icon's ring.                        |
| `status`                  | the rule's, else the kind's  | The status on the line: a text, a template, or `false` for none. It wins over the rules. |
| `secondary`               | the kind's                   | What follows the value and the status on the line. Template allowed.                     |
| `show_name`, `show_value` | `true`                       | `false` leaves out the name or the value.                                                |

### Look

| Key              | Default    | Description                                                                                                                                                                                                 |
| ---------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `icon`           | the kind's | An icon's name or a template; `{ type: icon \| image \| flow, … }` with its options, its own actions and the `badge` on it; or `false` for none. See [Look](/cards/look) and [Badges](/cards/badges).       |
| `visual`         | the kind's | Below the line: `sparkline`, `columns`, `strip`, `bar`, `gauge`, `segments`, `sun`. Behind the texts: `glow`, `image`, `flow`. A name, `{ type, … }` with its options, or `false`; see [Look](/cards/look). |
| `color`          | the kind's | The tile's colour: a colour name, a hex or a template. A matching rule's colour wins.                                                                                                                       |
| `rules`          | the kind's | Colour, icon, status, tint and the visual by value or state; the first match wins. Yours replace the kind's, `[]` drops them. See [Look](/cards/look).                                                      |
| `vertical_align` | `center`   | Where the content sits in a taller tile: `top`, `center` or `bottom`.                                                                                                                                       |
| `vertical`       | `false`    | The icon on top, the name and the line centred under it.                                                                                                                                                    |

### Controls, badges and actions

| Key                 | Default     | Description                                                                                                                                                                                 |
| ------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control`           | the kind's  | `auto`, a control's name (`toggle`, `slider`, `stepper`, `segments`, `buttons`, `button`, `select`, `hold`), `false` for none, or `{ type, position, … }`; see [Controls](/cards/controls). |
| `badges`            | –           | Badges at the end of the first row: entity ids or badges of your own; see [Badges](/cards/badges).                                                                                          |
| `status_badge`      | `false`     | `true` draws the status as the first badge, in place of on the line.                                                                                                                        |
| `tap_action`        | `more-info` | What a tap on the tile does; see [Actions & hover](/cards/actions).                                                                                                                         |
| `hold_action`       | `more-info` | What a hold does.                                                                                                                                                                           |
| `double_tap_action` | `none`      | What a double tap does.                                                                                                                                                                     |
| `hover`             | `true`      | Home Assistant's hover and press effects; `false` keeps the tile still.                                                                                                                     |

### Grid and Home Assistant options

A tile takes 6 columns and sizes its height to its content (`rows: auto`): one row, or two with a plot below the line. A plain tile can shrink to 3 columns; a vertical one is narrower and taller. See [Sizes](/cards/sizes).

| Key            | Default | Description                                                              |
| -------------- | ------- | ------------------------------------------------------------------------ |
| `grid_options` | –       | Home Assistant's size in a sections view: `columns`, `rows`.             |
| `fill_height`  | `true`  | Fills the height the card is given; `false` keeps the tile's own height. |
| `visibility`   | –       | Home Assistant's conditions that show or hide the whole card.            |
| `view_layout`  | –       | Placement in a [layout card](/cards/layout-card) or a custom view.       |
| `card_mod`     | –       | Styles for the card-mod plugin.                                          |
