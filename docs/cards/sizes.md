# Sizes

A tile and a poster pick a sensible size on their own in a sections view. This page shows that size, what makes a card larger, and how to set another.

## A tile

A tile is half a section wide (six columns) and one row high. It grows with what it holds: a plot below the line, a slider or a control that moves under the name on a narrow tile makes it taller. A tile with a plot asks for two rows at least.

A tile can also be narrower. A plain one goes down to a quarter of a section; a switch on its line needs four columns, a wider control (a stepper, speeds, buttons) six.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.living_room_temperature
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.living_room_temperature
  visual: sparkline
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: light.desk_lamp
  control: slider
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: climate.living_room
  grid_options: { columns: 6 }
```

:::

## A vertical tile

`vertical: true` puts the icon on top, with the name and the line centred under it, as Home Assistant's own tile does. A vertical tile is a quarter of a section wide and two rows high. A control under the name adds a row, and so do a plot and badges. A stepper, a select, buttons or speeds need half a section across.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.living_room_temperature
  vertical: true
  grid_options: { columns: 3 }
- type: custom:tile-card-pro
  entity: light.living_room
  vertical: true
  grid_options: { columns: 3 }
- type: custom:tile-card-pro
  entity: climate.living_room
  vertical: true
  grid_options: { columns: 6 }
```

:::

## A poster

A poster is half a section wide and three rows high, and that is also the least it takes in a sections grid: an entity in less room is what a tile is for. Its content sits at the bottom of the card, with the icon and the badges at the top. More rows give the visual more room.

Where the content needs more room than the card has, the value is drawn smaller and a slider may be left out (more-info still has it).

::: live

```yaml
- type: custom:poster-card-pro
  entity: weather.home
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: weather.home
  grid_options: { columns: 6, rows: 4 }
- type: custom:poster-card-pro
  entity: weather.home
  grid_options: { columns: 12, rows: 4 }
```

:::

## Setting a size

Home Assistant's `grid_options` sets a card's size in a sections view: `columns` (a section has 12, so six is half of it) and `rows` (56 px each, plus the gaps). The dashboard editor's layout tab writes the same keys.

`rows: auto` makes a card as tall as its content. That is a tile's default; on a poster it shows everything the poster holds, such as a player's volume that three rows leave out. Beside a taller card in the same row, a card stretches to the row's height: a tile centres its content in the extra room, a poster keeps it at the bottom. `fill_height: false` keeps the card's own height instead.

::: live

```yaml
- type: custom:poster-card-pro
  entity: media_player.living_room_speaker
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: media_player.living_room_speaker
  grid_options: { columns: 6, rows: auto }
```

:::

## Inside other cards

The least sizes above bind only the sections grid. A card around a tile or a poster, such as a [layout card](/cards/layout-card), a [swipe card](/cards/swipe-card) or a stack, may give it less. The card then fits its content into that room as well as it can.

[Sizing in sections](/guide/sizing) explains the sections grid in general: columns in spanned sections, rows, filling the height, and masonry views.

## Reference

| Card          | Default size      | Least in a sections grid                                                                                     |
| ------------- | ----------------- | ------------------------------------------------------------------------------------------------------------ |
| Tile          | 6 columns, `auto` | 3 columns, 1 row; 4 columns with a switch or hold on the line, 6 with a wider control; 2 rows with a plot    |
| Vertical tile | its least, `auto` | 3 columns (6 with a stepper, select, buttons or speeds), 2 rows; one more each for a control, a plot, badges |
| Poster        | 6 columns, 3 rows | 6 columns, 3 rows                                                                                            |

| Key                    | Default    | Description                                                  |
| ---------------------- | ---------- | ------------------------------------------------------------ |
| `grid_options.columns` | the card's | Width in columns, 12 per section.                            |
| `grid_options.rows`    | the card's | Height in rows, or `auto` to follow the content.             |
| `vertical`             | `false`    | Tile only: the icon on top, the texts centred under it.      |
| `fill_height`          | `true`     | `false` keeps the card's own height where the row is taller. |
