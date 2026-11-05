# Sun path

`custom:sun-path-card-pro` draws today's sun as a curve: where it is now, sunrise and sunset, and dawn, solar noon and dusk below. Hover or tap the curve for the time and the sun's height. For the next sunrise or sunset as one large value, use a [poster of the sun kind](/cards/kinds#sun).

## The curve

The card needs only its type. The times are computed from the location set in Home Assistant, so no sensor is needed. Home Assistant's card editor shows a form for every option.

::: live

```yaml
type: custom:sun-path-card-pro
```

:::

## Title and colours

`title` and `icon` add a header. `day_color` colours the curve and the part of the day that has passed, `night_color` the time below the horizon, and `sun_color` the sun. Any [colour value](/guide/colours#colour-values) works.

::: live

```yaml
type: custom:sun-path-card-pro
title: Sun today
icon: mdi:weather-sunset
day_color: orange
night_color: deep-purple
sun_color: yellow
```

:::

## Labels

The five labels follow the [language of your profile](/guide/languages). `labels` replaces any of them: `sunrise`, `sunset`, `dawn`, `noon` and `dusk`. `show_dawn_dusk: false` drops the row with dawn, solar noon and dusk.

::: live

```yaml
type: custom:sun-path-card-pro
title: Sunrise & sunset
labels: { sunrise: Rise, sunset: Set }
show_dawn_dusk: false
```

:::

## Reference

| Key              | Default          | Description                                                                     |
| ---------------- | ---------------- | ------------------------------------------------------------------------------- |
| `title`          | –                | The header's text. Leave it out for no header.                                  |
| `icon`           | –                | The header's icon.                                                              |
| `show_dawn_dusk` | `true`           | The row with dawn, solar noon and dusk.                                         |
| `show_tooltip`   | `true`           | The time and the sun's height when you hover or tap the curve.                  |
| `day_color`      | `light-blue`     | The curve and the day.                                                          |
| `night_color`    | `indigo`         | The time below the horizon.                                                     |
| `sun_color`      | `amber`          | The sun.                                                                        |
| `labels`         | in your language | Your own words for `sunrise`, `sunset`, `dawn`, `noon` (Solar noon) and `dusk`. |

The curve spans 24 hours around solar noon. Dawn and dusk are civil (the sun 6° below the horizon).

The card takes 12 columns (at least 6) and sizes its height to its content; given more height, the curve fills it. It also takes Home Assistant's `grid_options`, `visibility`, `view_layout`, `layout_options` and `card_mod`, and `fill_height: false` keeps its own height beside a taller card ([Filling the height](/guide/sizing#filling-the-height)).
