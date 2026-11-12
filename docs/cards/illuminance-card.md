# Illuminance Card Pro

::: warning Deprecated

The illuminance card is deprecated: it still works in 3.0 and goes in 4.0, without a successor. [Moving to 3.0](/guide/migrating#the-illuminance-card) shows the nearest tile.

:::

`custom:illuminance-card-pro` shows an outdoor illuminance sensor on a logarithmic scale that is split into zones: night, twilight, overcast, day and sun. It ships with a visual editor.

## Basic

A sensor that reports lux. The default look is a 24 h colour band: one block per time bucket, its colour blended between the zones' colours.

::: live

```yaml
type: custom:illuminance-card-pro
entity: sensor.illuminance
```

:::

## Name

`name` replaces the entity's friendly name in the header.

::: live

```yaml
type: custom:illuminance-card-pro
entity: sensor.illuminance
name: Outdoor light
```

:::

## Modes

`mode` picks one of three looks. `band` is the default above. `trend` draws the 24 h history as a line on the log scale over the zone bands, with the zone thresholds on the y axis.

::: live

```yaml
type: custom:illuminance-card-pro
entity: sensor.illuminance
name: Outdoor light
mode: trend
```

:::

`arc` is a gauge with the needle on the log scale and fetches no history.

::: live

```yaml
type: custom:illuminance-card-pro
entity: sensor.illuminance
name: Outdoor light
mode: arc
```

:::

## Window and buckets

`hours_to_show` sets the history window for the trend and the band, `bucket_minutes` the width of a band block. The trend's line is averaged so passing clouds do not make it jagged: one point per 12 px of width, or one per `smoothing_minutes` when set. The average is taken on the log scale (100 lx and 10,000 lx average to about 1,000 lx); hovering the trend shows it.

::: live

```yaml
type: custom:illuminance-card-pro
entity: sensor.illuminance
name: Last 12 hours
mode: band
hours_to_show: 12
bucket_minutes: 15
```

:::

## Zones and scale

`zones` takes the five keys `night`, `twilight`, `overcast`, `day` and `sun`. Each accepts a `label` (the default names follow the [language of your Home Assistant profile](/guide/languages)), an upper bound `max` in lux and a `color`; `sun` has no upper bound, so leave its `max` out. `min_lx` and `max_lx` set the ends of the scale (`min_lx` above 0 and below `max_lx`). The trend labels its y axis with the zone thresholds, and its top grows above `max_lx` to a round value when the window's peak is higher.

::: live

```yaml
type: custom:illuminance-card-pro
entity: sensor.illuminance
name: Daylight
min_lx: 1
max_lx: 120000
zones:
  night: { label: Night, max: 5, color: deep-purple }
  twilight: { label: Twilight, max: 200, color: indigo }
  overcast: { label: Overcast, max: 15000, color: blue-grey }
  day: { label: Daylight, max: 40000, color: amber }
  sun: { label: Full sun, color: deep-orange }
```

:::

## Reference

| Option              | Default          | Description                                                                                         |
| ------------------- | ---------------- | --------------------------------------------------------------------------------------------------- |
| `entity`            |                  | Illuminance sensor in lx (required).                                                                |
| `mode`              | `band`           | `arc`, `trend` or `band`.                                                                           |
| `name`              | friendly name    | Header text.                                                                                        |
| `hours_to_show`     | `24`             | Window for trend and band, up to 168; `arc` fetches no history.                                     |
| `bucket_minutes`    | `30`             | Band block size, 5 to 240.                                                                          |
| `smoothing_minutes` |                  | Averaging bucket of the trend line in minutes, at least 5. Without it one point per 12 px of width. |
| `min_lx` / `max_lx` | `0.1` / `100000` | Scale bounds; the trend's top grows above `max_lx` to fit the window's peak.                        |
| `zones`             | see below        | Per key `{ label, max, color }`.                                                                    |

Default zones: `night` < 1 lx (`indigo`), `twilight` < 100 lx (`blue`), `overcast` < 10 000 lx (`blue-grey`), `day` < 30 000 lx (`amber`), `sun` above (`orange`), named Night, Twilight, Overcast, Day and Sun in the profile language.

The card takes 12 columns (at least 6) with `rows: auto`; given more height, the trend fills the card and the arc and the band sit in the middle. Like every card, it also accepts `grid_options`, `visibility`, `layout_options`, `view_layout` and `card_mod`, passed through to Home Assistant. `fill_height: false` keeps the card at its own height beside a taller card; see [Filling the height](/guide/sizing#filling-the-height).
