---
outline: [2, 2]
---

# Tile sizes

How a [tile](/cards/tile-card) fits its size, then the tiles whose size matters most at three widths in one section: the whole section (12 columns), half of it (6, the default) and a quarter (3).

## How a tile fits its size

A tile takes half a section (six columns), and its height follows its content (`rows: auto`): one 56 px row for the icon, the name and the line, more for what sits below the line.

- **Below the line** go a picture (`visual`, `show_picture`) and a control at `block` (a slider). A tile with a plot or a picture asks the grid for two rows at least.
- **At the end of the line** go the type's controls. On a narrow tile they move under the line rather than squeeze the name, and the tile grows by their height. A tile with a control on its line asks the grid for more columns: four for a switch or a hold, six for anything wider (a stepper, speeds, buttons).
- **The line** is cut at its end where it is too long, and the name above it too.

`grid_options` sets another size. Beside a taller card, or given more rows than its content needs, the tile stretches to the row's height and centres its content; `fill_height: false` keeps its own height, see [Filling the height](/guide/sizing#filling-the-height). A card around it, such as a swipe card or a stack, may give it less than it asks for.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.outdoor_temperature
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.outdoor_temperature
  visual: sparkline
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: light.living_room
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: light.living_room
  fill_height: false
  grid_options: { columns: 6, rows: 2 }
```

:::

## Entity

A plain tile fits a quarter of a section; its name and line are cut there. A plot asks for two rows.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.outdoor_temperature
  name: Outside
  visual: sparkline
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: sensor.outdoor_temperature
  name: Outside
  visual: sparkline
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.outdoor_temperature
  name: Outside
  visual: sparkline
  grid_options: { columns: 3 }
- type: custom:tile-card-pro
  entity: sensor.outdoor_temperature
  name: Outside
  grid_options: { columns: 3 }
```

:::

## Light

The switch keeps to the line at half a section. At four columns, the least a tile with a switch asks for, it moves under the line.

::: live

```yaml
- type: custom:tile-card-pro
  entity: light.living_room
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: light.living_room
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: light.living_room
  grid_options: { columns: 4 }
```

:::

## Climate

The stepper keeps to the line on a whole section, and moves under it on a narrow half.

::: live

```yaml
- type: custom:tile-card-pro
  entity: climate.living_room
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: climate.living_room
  grid_options: { columns: 6 }
```

:::

## Fan

Its speeds keep to the line on a whole section, and move under it on a narrow half.

::: live

```yaml
- type: custom:tile-card-pro
  entity: fan.living_room
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: fan.living_room
  grid_options: { columns: 6 }
```

:::

## Cover

Open, stop and close keep to the line on a whole section, and move under it on a narrow half.

::: live

```yaml
- type: custom:tile-card-pro
  entity: cover.living_room_blinds
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: cover.living_room_blinds
  grid_options: { columns: 6 }
```

:::

## Media player

The progress along the bottom edge takes no room of its own.

::: live

```yaml
- type: custom:tile-card-pro
  entity: media_player.living_room_speaker
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: media_player.living_room_speaker
  grid_options: { columns: 6 }
```

:::

## Vacuum

Its two buttons keep to the line, and the name and the line give way to them on a narrow half.

::: live

```yaml
- type: custom:tile-card-pro
  entity: vacuum.robot
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: vacuum.robot
  grid_options: { columns: 6 }
```

:::

## Weather

With `show_picture`, the next hours take a second row; the curve runs as wide as the tile.

::: live

```yaml
- type: custom:tile-card-pro
  entity: weather.home
  show_picture: true
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: weather.home
  show_picture: true
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: weather.home
  show_picture: true
  grid_options: { columns: 3 }
```

:::

## Trend

A trend's lines are its picture, so its tile takes two rows by default.

::: live

```yaml
- type: custom:tile-card-pro
  poster: trend
  name: Temperatures
  series: [sensor.living_room_temperature, sensor.outdoor_temperature]
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  poster: trend
  name: Temperatures
  series: [sensor.living_room_temperature, sensor.outdoor_temperature]
  grid_options: { columns: 6 }
```

:::
