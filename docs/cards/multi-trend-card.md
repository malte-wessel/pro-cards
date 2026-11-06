# Multi trend

`custom:multi-trend-card-pro` draws one or more numeric sensors as smooth lines on one card. Hover or touch the plot for a crosshair that lists every value at that time. For the same lines as a tile or a poster, use the [trend kind](/cards/kinds).

## Sensors

`entities` lists the sensors: entity ids, or objects with a `name` and a `color`. Without a colour the series take `primary`, `orange`, `green`, `purple`, `cyan` and `pink` in turn. `title` and `icon` set the header; without them it takes the first entity's name and icon. A tap on the header opens that entity's more-info dialog.

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

## Rules

`rules` colour a series by its current value, as a tile's [rules](/cards/look) do: the first entry whose `state`, `below` or `above` matches colours the whole line. A fixed `color` wins over the rules and may be a template.

::: live

```yaml
type: custom:multi-trend-card-pro
title: Outdoor
icon: mdi:thermometer
entities:
  - entity: sensor.outdoor_temperature
    name: Temperature
    rules:
      - { below: 10, color: blue }
      - { below: 20, color: teal }
      - { above: 20, color: orange }
  - entity: sensor.dew_point
    name: Dew point
    color: "{{ 'purple' if states('sensor.dew_point') | float(0) > 10 else 'grey' }}"
```

:::

## Overlay or lanes

With `layout: auto` the series share one scale when they share a unit; otherwise each gets its own lane. `overlay` or `lanes` forces either. `hours_to_show` sets the window, 6 hours by default.

::: live

```yaml
type: custom:multi-trend-card-pro
title: Wind
icon: mdi:weather-windy
layout: lanes
entities:
  - { entity: sensor.wind_speed, name: Speed, color: teal }
  - { entity: sensor.wind_gust, name: Gusts, color: orange }
  - { entity: sensor.pressure, name: Pressure, color: purple }
```

:::

## Axes and smoothing

`x_axis` adds time labels and `y_axis` value labels, each with gridlines; both are off by default. The lines are averaged so sensor noise does not zigzag; `smoothing_minutes` sets how many minutes each point averages.

::: live

```yaml
type: custom:multi-trend-card-pro
title: Power
icon: mdi:flash
color: amber
hours_to_show: 24
smoothing_minutes: 30
x_axis: true
y_axis: true
entities:
  - { entity: sensor.power_consumption, name: Consumption, color: red }
  - { entity: sensor.dining_light_power, name: Dining light, color: amber }
```

:::

## Reference

| Key                 | Default                 | Description                                                                                                                                  |
| ------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `entities`          | –                       | Required. Entity ids, or `{ entity, name, color, rules, visibility }`. A series with [`visibility`](/guide/visibility) shows while it holds. |
| `title`             | the first entity's name | The header's text.                                                                                                                           |
| `icon`              | the first entity's icon | The header's icon.                                                                                                                           |
| `color`             | the state's icon colour | The header icon's colour.                                                                                                                    |
| `hours_to_show`     | `6`                     | The window, 1 to 168 hours.                                                                                                                  |
| `smoothing_minutes` | one point per 12 px     | Minutes each point averages, at least 5.                                                                                                     |
| `layout`            | `auto`                  | `auto` (overlay when the units match, else lanes), `overlay` or `lanes`.                                                                     |
| `show_legend`       | `true`                  | A legend under the header for two or more overlaid series.                                                                                   |
| `x_axis`            | `false`                 | Time labels and vertical gridlines.                                                                                                          |
| `y_axis`            | `false`                 | Value labels and horizontal gridlines, per lane.                                                                                             |

A series' `rules` are `{ state | below | above, color }`; `below` is exclusive, `above` inclusive.

The card takes 12 columns and is as tall as its plot (`rows: auto`, two rows at least); it fills a taller cell. It also takes Home Assistant's `grid_options`, `visibility`, `view_layout` and `card_mod`, plus `fill_height` (`false` keeps its own height); see [Sizing in sections](/guide/sizing). The card has a visual editor: its options, then its entities as lines, a row each that opens in a view of its own (the entity, its name and colour, its rules and when it shows), as the trend poster's lines.
