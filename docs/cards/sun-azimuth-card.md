# Sun Azimuth Card Pro

`custom:sun-azimuth-card-pro` shows where the sun is around your house today: as a sky dial seen from above, as a 3D scene with the house, its shadow and the sky dome, or as a compass ring. Below, the sides of the house list when the sun shines on them. The position is computed locally from the Home Assistant latitude and longitude (NOAA solar position), so nothing besides the card is needed.

## Sky dial

The default view looks down on the house: the outer ring is the horizon, the centre is straight up. Today's path of the sun is drawn in the sun colour, solid where it has passed and dashed where it is still to come, and the faint arc on the rim is the daylight sector from the sunrise bearing to the sunset bearing. The house in the middle lights up on every side the sun shines on right now, a dashed beam joins the sun to it, and an arc from north round to the sun shows the azimuth with the angle in a chip. The head shows the azimuth as an arrow, with the elevation and whether the sun is rising or sinking.

::: live

```yaml
type: custom:sun-azimuth-card-pro
title: Sun
icon: mdi:sun-compass
house: { rotation: 20 }
```

:::

## 3D

`view: 3d` draws the sky as a see-through dome around a small house, seen from slightly above. The sun runs on its daily circle, hidden below the horizon at night; a dashed drop line shows its elevation with the angle in a chip, dotted lines on the ground run from the house to the four compass points and an arc from north to the sun shows its azimuth the same way, and the house casts its shadow on the ground. The walls and roof edges facing the sun light up, more the more directly it hits them. A pole marks the house's position under the dome; the back-most compass point is left out so it does not sit in the sky. `camera` is the bearing you look toward: the default 180 stands north of the house looking south, so that today's path lies ahead of you; 90 looks east, 270 west.

::: live

```yaml
type: custom:sun-azimuth-card-pro
title: Sun
view: 3d
house: { rotation: 20 }
camera: 150
```

:::

### Orbit

`camera_slider: true` puts a slider under the plot to turn around the scene. It changes only what you see: the YAML keeps its `camera`, and the card starts from it again on the next page load.

::: live

```yaml
type: custom:sun-azimuth-card-pro
title: Sun
view: 3d
house: { rotation: 20 }
camera: 150
camera_slider: true
show_sides: false
```

:::

## Compass ring

`view: ring` is the compact one: a ring whose arc is the daylight sector from sunrise to sunset and whose dot is the sun now, with the azimuth inside. Beside it sunrise, now and sunset with their bearings and the height of the sun at solar noon.

::: live

```yaml
type: custom:sun-azimuth-card-pro
title: Sun
view: ring
house: { rotation: 20 }
```

:::

## Sides of the house

`house.rotation` turns the house: it is the bearing the north side's outward normal points to, in degrees clockwise from north (a house whose front looks north-east has `rotation: 45`). The footer lists the four sides with the time the sun shines on them today, a pill for their state (Sun now, from 14:20, Shade or No sun today) and a timeline from just before sunrise to just after sunset. A side may get sun twice a day, for example the north side on a summer morning and evening; both windows are drawn. `house.sides` gives the sides your own names, which stay as written in every language.

Move the pointer along a side's timeline (or tap it on a phone) and the plot above shows the sun at that time: where it stands, which sides it lights, its shadow. A hairline marks the time on every bar and the footer's heading shows it. `hover_preview: false` turns this off.

::: live

```yaml
type: custom:sun-azimuth-card-pro
title: Sun
house:
  rotation: 45
  sides: { north: Street, east: Driveway, south: Garden, west: Terrace }
```

:::

## Less

`show_sides: false` drops the footer, `show_events: false` the sunrise / noon / sunset row and `show_house: false` the line naming the sides in the sun (the last two are part of the dial and 3D views; the ring shows the events beside the ring). Two narrow cards side by side:

::: live

```yaml
- type: custom:sun-azimuth-card-pro
  view: 3d
  house: { rotation: 20 }
  show_sides: false
  show_house: false
  grid_options: { columns: 6 }
- type: custom:sun-azimuth-card-pro
  view: ring
  house: { rotation: 20 }
  show_sides: false
  grid_options: { columns: 6 }
```

:::

## Colours

`sun_color` paints the sun, its path and everything lit by it, `night_color` the sun while it is below the horizon and the sunset marker, `sky_color` the dial's disc and the 3D dome. Any [colour value](/guide/colours#colour-values) works.

::: live

```yaml
type: custom:sun-azimuth-card-pro
title: Sun
house: { rotation: 20 }
show_sides: false
sun_color: orange
night_color: deep-purple
sky_color: teal
```

:::

## Reference

| Option           | Default      | Description                                                                                                        |
| ---------------- | ------------ | ------------------------------------------------------------------------------------------------------------------ |
| `title`          |              | Header. Omit for no header.                                                                                        |
| `icon`           |              | Header icon.                                                                                                       |
| `view`           | `dial`       | `dial`, `3d` or `ring`.                                                                                            |
| `house.rotation` | `0`          | Bearing of the north side's outward normal, 0–360 degrees clockwise from north.                                    |
| `house.sides`    |              | Own names for `north`, `east`, `south` and `west`; the defaults follow the [profile language](../guide/languages). |
| `camera`         | `180`        | 3D view: the bearing you look toward, 0–360.                                                                       |
| `camera_slider`  | `false`      | 3D view: a slider under the plot to orbit the scene. The value is not saved.                                       |
| `hover_preview`  | `true`       | Hovering or tapping a side's timeline shows the sun at that time in the plot.                                      |
| `show_house`     | `true`       | Dial and 3D: the line naming the sides in the sun and what comes next.                                             |
| `show_events`    | `true`       | Dial and 3D: the sunrise, solar noon and sunset row.                                                               |
| `show_sides`     | `true`       | The sides of the house footer.                                                                                     |
| `sun_color`      | `amber`      | The sun, its path and what it lights.                                                                              |
| `night_color`    | `indigo`     | The sun below the horizon and the sunset marker.                                                                   |
| `sky_color`      | `light-blue` | The dial's disc and the 3D dome.                                                                                   |

The card follows the local calendar day and refreshes every minute. Sunrise and sunset use the standard −0.833° refraction; a side counts as sunlit while the sun is above the horizon and within 90° of the side's outward normal. The default size is 12 columns with `rows: auto`. Like every card, this one also accepts `grid_options`, `visibility`, `layout_options`, `view_layout` and `card_mod`, which are passed through to Home Assistant.
