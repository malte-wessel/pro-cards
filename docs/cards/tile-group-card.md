# Tile group

`custom:tile-group-card-pro` puts several [tiles](/cards/tile-card) on one card, under a header with a title, an icon and badges. Use it for a room or any set of entities that belong together.

::: info Beta
The tile group card is new in 3.0 and in beta: its options may still change.
:::

## Tiles and header

`tiles` lists the tiles, one under the other. Each one is an entity id or a tile of its own. `title` and `icon` head the card, and `badges` sit at the end of the title line, plain and small; they take the [badge keys](/cards/badges#badge-keys). `title_tap_action` makes the title a button, for example to open the room's dashboard.

::: live

```yaml
type: custom:tile-group-card-pro
title: Living room
icon: mdi:sofa
title_tap_action: { action: navigate, navigation_path: /dashboard-rooms/living-room }
badges:
  - sensor.living_room_temperature
  - sensor.living_room_humidity
tiles:
  - light.living_room
  - climate.living_room
  - cover.living_room_blinds
  - media_player.living_room_speaker
```

:::

## Tiles of their own

A tile in the list takes the [tile card's keys](/cards/tile-card) without `type`, `grid_options` and `vertical`: its kind, visual, controls, status and badges. The group sets nothing on its tiles, so a tile looks the same in a group as on its own. To share a setting, write it on each tile; a YAML anchor writes it once (`visual: &day { … }`, then `visual: *day`).

::: live

```yaml
type: custom:tile-group-card-pro
title: Living room
icon: mdi:sofa
tiles:
  - { entity: light.desk_lamp, control: slider }
  - entity: sensor.living_room_temperature
    visual: &day { type: sparkline, hours: 12 }
  - entity: sensor.living_room_co2
    visual: *day
    status_badge: true
  - entity: fan.living_room
    badges:
      - sensor.living_room_humidity
```

:::

## Row

`layout: row` draws vertical tiles side by side: the icon on top, the name and the line under it, the controls below. The layout decides this for every tile, so a tile in a group takes no `vertical`. The tiles share the width in equal columns and wrap onto a new line when the card is too narrow.

::: live

```yaml
type: custom:tile-group-card-pro
layout: row
title: Lights
icon: mdi:lightbulb-group
tiles:
  - light.living_room
  - light.desk_lamp
  - light.kitchen
  - light.bedroom
```

:::

## Table

`layout: table` draws each tile as one line: the name at the start, the value at the end with its status, and after them one thing: a control or a visual. A row has no icon, no `secondary` and no badges.

The control is the tile's own (a light's switch, a thermostat's stepper, the blinds' buttons) or the one it names. Where a tile would use its icon as the control (a switch, a lock), the row draws a switch or a hold in its place. The visual is a [badge's](/cards/badges): `bar`, `sparkline` or `trend`. A row with a visual draws no control.

::: live

```yaml
type: custom:tile-group-card-pro
layout: table
title: Living room
icon: mdi:sofa
tiles:
  - { entity: light.living_room, name: Ceiling }
  - { entity: light.desk_lamp, name: Desk lamp, control: slider }
  - { entity: climate.living_room, name: Thermostat }
  - { entity: cover.living_room_blinds, name: Blinds }
  - { entity: input_boolean.night_mode, name: Night mode }
  - { entity: sensor.living_room_temperature, name: Temperature, visual: sparkline }
```

:::

## Visibility

A tile's `visibility` shows it only while its [conditions](/guide/visibility) hold; the other tiles close up. When every tile is hidden and the header is empty, the card takes no room.

::: live

```yaml
type: custom:tile-group-card-pro
title: Kitchen
icon: mdi:silverware-fork-knife
tiles:
  - light.kitchen
  - entity: switch.coffee_machine
    visibility:
      - { condition: state, entity: light.kitchen, state: "on" }
  - binary_sensor.window_kitchen
```

:::

## Recipes

### Who is home

People in a row: their picture as the icon, the zone they are in on its badge, and Home or Away under the name.

::: live

```yaml
type: custom:tile-group-card-pro
layout: row
title: Family
icon: mdi:home-account
tiles:
  - person.malte
  - person.sam
  - person.kim
```

:::

### Scenes

A row of scenes, each run by a tap on its tile. `show_value: false` leaves out the scene's state, which says nothing useful.

::: live

```yaml
type: custom:tile-group-card-pro
layout: row
title: Scenes
icon: mdi:palette
tiles:
  - { entity: scene.bright, tap_action: toggle, show_value: false }
  - { entity: scene.dinner, tap_action: toggle, show_value: false }
  - { entity: scene.movie_night, tap_action: toggle, show_value: false }
  - { entity: scene.good_night, tap_action: toggle, show_value: false }
```

:::

### Washing machine

A table of one appliance: rules turn the status sensor into words, the power gets a sparkline.

::: live

```yaml
type: custom:tile-group-card-pro
layout: table
title: Washing machine
icon: mdi:washing-machine
tiles:
  - entity: sensor.washer_status
    name: Status
    show_value: false
    rules:
      - { state: run, color: green, status: Running }
      - { state: pause, color: amber, status: Paused }
      - { state: end, color: teal, status: Done }
  - { entity: sensor.washer_remaining, name: Remaining }
  - { entity: sensor.washer_power, name: Power, visual: sparkline }
```

:::

## The visual editor

Home Assistant's card editor shows the group's title, icon, layout and title tap, then one tab per tile. A tile is edited in the tile card's own form, without `vertical`; in a table, as a row. **+** adds a tile, and the buttons over a tile move, duplicate or delete it. The header's badges stay in the YAML. Try it in the [Playground](/playground), or with **Edit** under any example.

## Reference

### Card options

| Key                | Default | Description                                                                                                                               |
| ------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `tiles`            | –       | Required. Entity ids or tiles: the [tile card's keys](/cards/tile-card) without `type`, `grid_options` and `vertical`, plus `visibility`. |
| `layout`           | `list`  | `list`: one under the other. `row`: vertical tiles side by side, wrapping when narrow. `table`: one line each.                            |
| `title`            | –       | The header's text. Template allowed.                                                                                                      |
| `icon`             | –       | The header's icon. Template allowed.                                                                                                      |
| `title_tap_action` | `none`  | What a tap on the title or its icon does; see [Actions & hover](/cards/actions).                                                          |
| `badges`           | –       | Badges at the end of the title line, plain and small unless they set `style` or `size`; see [Badge keys](/cards/badges#badge-keys).       |

Any other key on the card is an error: settings go on each tile.

### Table rows

A row in a table takes a tile's keys except `icon`, `secondary`, `badges` and `status_badge`. Its `visual` is a badge's: `bar` (the value from `min` to `max`), `sparkline` or `trend`, as a name or `{ type, hours }`. A row draws either a control or a visual, not both.

### Grid and Home Assistant options

The card sizes its height to its content (`rows: auto`). A `list` and a `table` take 6 columns, a `row` 12; none goes below 6. See [Sizing in sections](/guide/sizing).

The card also takes Home Assistant's `grid_options`, `visibility`, `view_layout` and `card_mod`, plus `fill_height` (`false` keeps the card's own height). The card's `visibility` hides the whole card; a tile's hides that tile.
