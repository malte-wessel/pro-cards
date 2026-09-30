# Illuminance Card

`custom:illuminance-card` shows an outdoor illuminance sensor on a logarithmic scale that is split into zones: night, twilight, overcast, day and sun. It ships with a visual editor.

## Basic

Two lines: the type and a sensor that reports lux. The default look is a 24 h colour band: one block per time bucket, blended between the zone colours on the log scale.

::: live

```yaml
type: custom:illuminance-card
entity: sensor.illuminance
```

:::

## Name

`name` replaces the entity's friendly name in the header.

::: live

```yaml
type: custom:illuminance-card
entity: sensor.illuminance
name: Outdoor light
```

:::

## Modes

`mode` picks one of three looks. `band` is the default above. `trend` draws the 24 h history as a line on the log scale over the zone bands, with the zone thresholds on the y axis.

::: live

```yaml
type: custom:illuminance-card
entity: sensor.illuminance
name: Outdoor light
mode: trend
```

:::

`arc` is a gauge with the needle on the log scale and fetches no history.

::: live

```yaml
type: custom:illuminance-card
entity: sensor.illuminance
name: Outdoor light
mode: arc
```

:::

## Window and buckets

`hours_to_show` sets the history window for the trend and the band, `bucket_minutes` the width of a band block.

::: live

```yaml
type: custom:illuminance-card
entity: sensor.illuminance
name: Last 12 hours
mode: band
hours_to_show: 12
bucket_minutes: 15
```

:::

## Zones and scale

`zones` takes the five fixed keys `night`, `twilight`, `overcast`, `day` and `sun`. Every zone accepts a `label` (your own wording; the default names follow the [language of your Home Assistant profile](../guide/languages)), an upper bound `max` in lux and a `color`. The last zone (`sun`) has no upper bound, so its `max` is ignored; other keys than the five are ignored too. `min_lx` and `max_lx` set the ends of the scale; the trend labels its y axis with the zone thresholds, and when the window's peak is higher than `max_lx` the top grows to the next round value (1, 2 or 5 times a power of ten) so the peak is never cut off.

::: live

```yaml
type: custom:illuminance-card
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

| Option              | Default          | Description                                                                  |
| ------------------- | ---------------- | ---------------------------------------------------------------------------- |
| `entity`            |                  | Illuminance sensor in lx (required).                                         |
| `mode`              | `band`           | `arc`, `trend` or `band`.                                                    |
| `name`              | friendly name    | Header text.                                                                 |
| `hours_to_show`     | `24`             | Window for trend and band, up to 168; `arc` fetches no history.              |
| `bucket_minutes`    | `30`             | Band block size, 5 to 240.                                                   |
| `min_lx` / `max_lx` | `0.1` / `100000` | Scale bounds; the trend's top grows above `max_lx` to fit the window's peak. |
| `zones`             | see below        | Per key `{ label, max, color }`.                                             |

Default zones: `night` < 1 lx (`indigo`), `twilight` < 100 lx (`blue`), `overcast` < 10 000 lx (`blue-grey`), `day` < 30 000 lx (`amber`), `sun` above (`orange`), with the labels Night, Twilight, Overcast, Day and Sun in the profile language. The default size is 12 columns with `rows: auto`. Like every card, this one also accepts `grid_options`, `visibility`, `layout_options`, `view_layout` and `card_mod`, which are passed through to Home Assistant.
