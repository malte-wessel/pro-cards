# Multi Trend Card Pro

`custom:multi-trend-card-pro` draws one or more sensors as smooth lines in a tile-style card. Hover or touch the plot for a crosshair that lists every value at that time. It ships with a visual editor.

## Basic

The type and a list of sensors with numeric states. The header takes the first entity's name and icon.

::: live

```yaml
type: custom:multi-trend-card-pro
entities:
  - sensor.outdoor_temperature
```

:::

## Several sensors

Every entity can be an object with a `name` and a `color`. Without a `color` the series take `primary`, `orange`, `green`, `purple`, `cyan` and `pink` in that order. `title` and `icon` set the header.

::: live

```yaml
type: custom:multi-trend-card-pro
title: Temperature & dew point
icon: mdi:thermometer
entities:
  - { entity: sensor.outdoor_temperature, name: Temperature, color: red }
  - { entity: sensor.dew_point, name: Dew point, color: blue }
```

:::

## Time window

`hours_to_show` sets the history window from 1 to 168 hours. The default is 6.

::: live

```yaml
type: custom:multi-trend-card-pro
title: Temperature & dew point
icon: mdi:thermometer
hours_to_show: 24
entities:
  - { entity: sensor.outdoor_temperature, name: Temperature, color: red }
  - { entity: sensor.dew_point, name: Dew point, color: blue }
```

:::

## Overlay or lanes

With `layout: auto` the card overlays all series on one scale when every entity shares a unit, and otherwise gives each entity its own lane. Force either with `overlay` or `lanes`.

::: live

```yaml
type: custom:multi-trend-card-pro
title: Wind
icon: mdi:weather-windy
hours_to_show: 6
layout: lanes
entities:
  - { entity: sensor.wind_speed, name: Speed, color: teal }
  - { entity: sensor.wind_gust, name: Gusts, color: orange }
  - { entity: sensor.pressure, name: Pressure, color: purple }
```

:::

## Axes and legend

`x_axis` adds time labels with vertical gridlines, `y_axis` adds value labels with horizontal gridlines (per lane in the lanes layout). Both are off by default to keep the tile calm. `show_legend` lists the overlaid series under the header; `color` colours the header icon.

::: live

```yaml
type: custom:multi-trend-card-pro
title: Power
icon: mdi:flash
color: amber
hours_to_show: 24
x_axis: true
y_axis: true
show_legend: true
entities:
  - { entity: sensor.power_consumption, name: Consumption, color: red }
  - { entity: sensor.dining_light_power, name: Dining light, color: amber }
```

:::

## Reference

| Option          | Default           | Description                                                                                                                                                                       |
| --------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entities`      |                   | List of entity ids or `{ entity, name, color }` (required, sensors with numeric states). Colours default to `primary`, `orange`, `green`, `purple`, `cyan`, `pink` in that order. |
| `title`         | first entity name | Header text.                                                                                                                                                                      |
| `icon`          | entity icon       | Header icon: `icon`, else the first entity's icon, else by device class.                                                                                                          |
| `color`         | state icon colour | Header icon colour.                                                                                                                                                               |
| `hours_to_show` | `6`               | History window, 1 to 168 hours.                                                                                                                                                   |
| `layout`        | `auto`            | `auto`, `overlay` or `lanes`.                                                                                                                                                     |
| `show_legend`   | `true`            | Legend for overlaid series with two or more entities.                                                                                                                             |
| `x_axis`        | `false`           | Time labels and vertical gridlines.                                                                                                                                               |
| `y_axis`        | `false`           | Value labels and horizontal gridlines.                                                                                                                                            |

Tapping the header opens the more-info dialog of the first entity. The default size is 12 columns × 3 rows; the lanes layout uses 2 rows plus one per entity. `grid_options`, `visibility`, `layout_options`, `view_layout` and `card_mod` are passed through to Home Assistant.
