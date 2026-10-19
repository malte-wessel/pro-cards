# Sun Azimuth Card Pro

`custom:sun-azimuth-card-pro` shows where the sun is around your house today: which walls get sun right now, which come next, and when each one is in the sun. It needs no sensors. The sun's position is computed from the location set in Home Assistant.

## Examples

All the card needs is its type: today's sun over a house whose front faces north.

::: live

```yaml
type: custom:sun-azimuth-card-pro
```

:::

Your own house: where its front faces, the names of its sides and the angle you look from. [Set it up](#set-it-up) shows how to find these.

::: live

```yaml
type: custom:sun-azimuth-card-pro
title: Sun
house:
  front: 20
  sides: { front: Street, back: Garden }
camera: 200
```

:::

The same house seen from above, with sunrise, noon and sunset:

::: live

```yaml
type: custom:sun-azimuth-card-pro
title: Sun
view: dial
house:
  front: 20
  sides: { front: Street, back: Garden }
show_sun_times: true
```

:::

## Set it up

1. **Where your front faces.** Stand with your back to your front door, read the degrees on your phone's compass and put them into `house.front`: `0` north, `90` east, `180` south, `270` west. Turn on true north if your compass offers it, as the sun is measured from true north. No compass? Estimate the angle on a map with north up.
2. **The sides and the roof.** The sides are `front`, `right`, `back` and `left`, as you look at the front. Name them in `house.sides`; unnamed ones are called by where they face, and `false` marks a wall shared with a neighbour, which never gets sun. `house.roof` is `gable`, `gable_front`, `hip` or `flat` (see [Roof](#roof)).
3. **The camera.** `camera` is the direction you look in: from the street it is `front` + 180, from the garden behind the house it is `front`. Or switch `camera_slider: true` on, turn the house until it looks right, and write the angle from the slider's bubble into `camera`.
4. **What to show.** `show_sun_times: true` adds sunrise, noon and sunset, `show_sides: true` the hours of sun on each side, and `show_summary: false` leaves just the picture. `grid_options` sizes the card (see [Less](#less)).

Put together, for a house whose front looks a little east of north-north-east:

::: live

```yaml
type: custom:sun-azimuth-card-pro
title: Sun
icon: mdi:sun-compass
house:
  front: 20
  roof: gable
  sides: { front: Street, right: Terrace, back: Garden, left: false }
camera: 200
show_sun_times: true
show_sides: true
```

:::

## The 3D scene

The default view. The house stands under a see-through sky dome, seen from slightly above.

- The sun runs along today's path: solid where it has been, dashed where it is still to come. At night it is below the horizon.
- A dashed line drops from the sun to the ground, with its height (elevation) in a chip. An arc on the ground from north to the sun shows its compass direction (azimuth) the same way.
- The walls and roof slopes facing the sun light up: the more directly it hits them, the brighter. The house casts its shadow on the ground.
- The head above the picture names the direction the sun is in (South-west), with its azimuth and elevation below.

In a narrow card the dome grows to fill the width; the labels keep their size.

::: live

```yaml
type: custom:sun-azimuth-card-pro
title: Sun
house: { front: 20 }
camera: 150
```

:::

### Roof

The four roofs of `house.roof`. Roof slopes catch the sun like walls, and the shadow follows the roof. In the dial the roof shows as lines on the house.

::: live

```yaml
type: custom:sun-azimuth-card-pro
title: Gable
house: { front: 20, roof: gable }
camera: 150
show_summary: false
```

:::

::: live

```yaml
type: custom:sun-azimuth-card-pro
title: Gable to the front
house: { front: 20, roof: gable_front }
camera: 150
show_summary: false
```

:::

::: live

```yaml
type: custom:sun-azimuth-card-pro
title: Hip
house: { front: 20, roof: hip }
camera: 150
show_summary: false
```

:::

::: live

```yaml
type: custom:sun-azimuth-card-pro
title: Flat
house: { front: 20, roof: flat }
camera: 150
show_summary: false
```

:::

### Orbit

`camera_slider: true` puts a slider under the picture to turn around the house. It only changes what you see: the card starts from `camera` again the next time it loads.

::: live

```yaml
type: custom:sun-azimuth-card-pro
title: Sun
house: { front: 20 }
camera: 150
camera_slider: true
```

:::

## The sky dial

`view: dial` looks down on the house from above. The outer ring is the horizon and the centre is straight up, so the higher the sun, the closer it is to the middle.

- Today's path is solid where the sun has been and dashed where it is still to come.
- The pale arc around the ring runs from where the sun rises to where it sets.
- The walls in the sun light up, and a dashed beam joins the sun to the house.

::: live

```yaml
type: custom:sun-azimuth-card-pro
view: dial
house: { front: 20 }
```

:::

## Sunrise and sunset

`show_sun_times: true` adds a row under the picture: sunrise and sunset with the direction they happen in, and solar noon with the height the sun reaches.

::: live

```yaml
type: custom:sun-azimuth-card-pro
title: Sun
icon: mdi:sun-compass
house: { front: 20 }
show_sun_times: true
```

:::

## Sides of the house

`show_sides: true` adds a list of the sides. Each one shows the hours it gets sun today on a timeline, and a pill with its state: Sun now, from 14:20, Shade or No sun today. A side can get sun twice a day, for example a north side on a summer morning and evening; both are drawn.

Move the pointer along a timeline (or tap it on a phone) and the picture shows the sun at that time: where it is, which walls it lights, the shadow. Following the sun's path in the picture does the same, with the time in a chip above the sun. `hover_preview: false` turns both off.

::: live

```yaml
type: custom:sun-azimuth-card-pro
title: Sun
icon: mdi:sun-compass
house:
  front: 45
  sides: { front: Street, right: Terrace, back: Garden, left: false }
show_sun_times: true
show_sides: true
```

:::

## Less

`show_summary: false` leaves just the picture. With `rows` in `grid_options` the card takes a fixed height and the picture fits into it, so two cards side by side can be the same height:

::: live

```yaml
- type: custom:sun-azimuth-card-pro
  house: { front: 20 }
  show_summary: false
  grid_options: { columns: 6, rows: 4 }
- type: custom:sun-azimuth-card-pro
  view: dial
  house: { front: 20 }
  show_summary: false
  grid_options: { columns: 6, rows: 4 }
```

:::

## Colours

`sun_color` paints the sun, its path and everything it lights. `night_color` paints the sun while it is below the horizon, and the sunset marker on the dial. `sky_color` tints the dome and the dial. Any [colour value](/guide/colours#colour-values) works.

::: live

```yaml
type: custom:sun-azimuth-card-pro
title: Sun
house: { front: 20 }
sun_color: orange
night_color: deep-purple
sky_color: teal
```

:::

## Reference

| Option           | Default      | Description                                                                                                                                                                                                           |
| ---------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`          |              | Header. Omit for no header.                                                                                                                                                                                           |
| `icon`           |              | Header icon.                                                                                                                                                                                                          |
| `view`           | `3d`         | `3d` or `dial`.                                                                                                                                                                                                       |
| `house.front`    | `0`          | The direction your front door looks to, 0–360 degrees from north (90 east, 180 south, 270 west).                                                                                                                      |
| `house.roof`     | `gable`      | `gable` (ridge from left to right), `gable_front` (the gable faces the front), `hip` or `flat`.                                                                                                                       |
| `house.sides`    |              | Your names for `front`, `right`, `back` and `left` (as you look at the front), or `false` for a wall that never gets sun. Unnamed sides are called by where they face, in the [profile language](../guide/languages). |
| `camera`         | `180`        | 3D: the direction you look in, 0–360 degrees.                                                                                                                                                                         |
| `camera_slider`  | `false`      | 3D: a slider under the picture to turn around the house. Never saved.                                                                                                                                                 |
| `hover_preview`  | `true`       | Hovering or tapping a timeline or the sun's path shows the sun at that time.                                                                                                                                          |
| `show_summary`   | `true`       | The line under the picture: the sides in the sun and what comes next.                                                                                                                                                 |
| `show_sun_times` | `false`      | Sunrise, solar noon and sunset under the picture.                                                                                                                                                                     |
| `show_sides`     | `false`      | The list of sides with their hours of sun today.                                                                                                                                                                      |
| `sun_color`      | `amber`      | The sun, its path and what it lights.                                                                                                                                                                                 |
| `night_color`    | `indigo`     | The sun below the horizon and the sunset marker.                                                                                                                                                                      |
| `sky_color`      | `light-blue` | The dome and the dial.                                                                                                                                                                                                |

The card follows the local calendar day and refreshes every minute. Directions are measured from true north. Sunrise and sunset use the standard −0.833° refraction, and a side counts as sunlit while the sun is above the horizon and less than 90° away from the direction the side faces. The default size is 12 columns with `rows: auto`. Like every card, this one also accepts `grid_options`, `visibility`, `layout_options`, `view_layout` and `card_mod`, which are passed through to Home Assistant.
