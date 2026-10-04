# Sun Path Card

`custom:sun-path-card-pro` shows today's sun elevation as a curve with the sun's current position, sunrise and sunset, and optionally dawn, solar noon and dusk. Hover or tap the curve for the time and the sun's elevation at that point. It ships with a visual editor.

## Basic

One line is enough. Times are computed locally from the Home Assistant latitude and longitude (NOAA solar position), so the card does not depend on `sun.sun` attributes, which only expose the next events.

::: live

```yaml
type: custom:sun-path-card-pro
```

:::

## Title

`title` adds a header like the other cards', `icon` an icon in front of it. Omit both for the bare curve.

::: live

```yaml
type: custom:sun-path-card-pro
title: Sun today
icon: mdi:weather-sunset
```

:::

## Labels

The five texts default to the [language of your Home Assistant profile](../guide/languages). `labels` overrides any of them by key: `sunrise`, `sunset`, `dawn`, `noon` and `dusk`. Use it for shorter words or a language the cards do not ship.

::: live

```yaml
type: custom:sun-path-card-pro
title: Sun today
labels: { sunrise: Rise, sunset: Set, dawn: Civil dawn, noon: Noon, dusk: Civil dusk }
```

:::

## Colours

`day_color` fills the part of the curve above the horizon that has passed, `night_color` shades the time below the horizon and `sun_color` is the marker. Any [colour value](/guide/colours#colour-values) works.

::: live

```yaml
type: custom:sun-path-card-pro
title: Sun today
day_color: orange
night_color: deep-purple
sun_color: yellow
```

:::

## Without the bottom row

`show_dawn_dusk: false` drops the row with dawn, solar noon and dusk and leaves sunrise and sunset.

::: live

```yaml
type: custom:sun-path-card-pro
title: Sunrise & sunset
show_dawn_dusk: false
```

:::

## Reference

| Option           | Default      | Description                                                                                                                                        |
| ---------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`          |              | Header. Omit for no header.                                                                                                                        |
| `icon`           |              | Header icon.                                                                                                                                       |
| `show_dawn_dusk` | `true`       | Bottom row with dawn, solar noon and dusk.                                                                                                         |
| `show_tooltip`   | `true`       | Time and elevation tooltip when hovering or tapping the curve. `false` disables it.                                                                |
| `day_color`      | `light-blue` | Curve and day wash.                                                                                                                                |
| `night_color`    | `indigo`     | Night wash below the horizon.                                                                                                                      |
| `sun_color`      | `amber`      | Current position marker.                                                                                                                           |
| `labels`         | see below    | Overrides for `sunrise` (Sunrise), `sunset` (Sunset), `dawn` (Dawn), `noon` (Solar noon), `dusk` (Dusk); the defaults follow the profile language. |

The plot is a 24 hour window centred on solar noon; the vertical ticks mark sunrise, solar noon and sunset. Dawn and dusk are civil (sun 6° below the horizon), sunrise and sunset use the standard −0.833° refraction. The default size is 12 columns with `rows: auto`. Like every card, this one also accepts `grid_options`, `visibility`, `layout_options`, `view_layout` and `card_mod`, which are passed through to Home Assistant.
