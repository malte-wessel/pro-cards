# Sun Azimuth Card Pro

`custom:sun-azimuth-card-pro` shows where the sun is around your house today: as a sky dial seen from above or as a 3D scene with the house, its shadow and the sky dome. Two sections can be added: a sunrise / noon / sunset row, and the sides of the house with the times the sun shines on each. The position is computed locally from the Home Assistant latitude and longitude (NOAA solar position), so nothing besides the card is needed.

## Sky dial

All the card needs is its type. The default view looks down on the house: the outer ring is the horizon, the centre is straight up. Today's path of the sun is drawn in the sun colour, solid where it has passed and dashed where it is still to come, and the faint arc on the rim is the daylight sector from the sunrise bearing to the sunset bearing. The house in the middle lights up on every side the sun shines on right now, a dashed beam joins the sun to it, and an arc from north round to the sun shows the azimuth with the angle in a chip. The head reads like the other cards' tiles: the direction the sun stands in (South-West), and under it the azimuth and the elevation; the 3D view has the same head.

::: live

```yaml
type: custom:sun-azimuth-card-pro
```

:::

## 3D

`view: 3d` draws the sky as a see-through dome around a small house, seen from slightly above. The sun runs on its daily circle, hidden below the horizon at night; a dashed drop line shows its elevation with the angle in a chip, dotted lines on the ground run from the house to the four compass points and an arc from north to the sun shows its azimuth the same way, and the house casts its shadow on the ground. The walls and roof slopes facing the sun light up, more the more directly it hits them. A pole marks the house's position under the dome; compass points on the far side of the ground are left out so they do not sit in the sky. `camera` is the bearing you look toward: the default 180 stands north of the house looking south, so that today's path lies ahead of you; 90 looks east, 270 west. In a narrow card the dome grows to fill the width; its labels keep their size.

::: live

```yaml
type: custom:sun-azimuth-card-pro
title: Sun
view: 3d
house: { front: 20 }
camera: 150
```

:::

### Roof

`house.roof` gives the house its roof, in the 3D scene and as lines on the dial's footprint: `gable` (the default) has its ridge from the left side to the right, so the eaves run along the front and the back; `gable_front` turns the ridge from the front to the back, with the gable facing the street; `hip` slopes down to all four sides; `flat` is flat. The roof slopes catch the sun like the walls, and the shadow follows the roof's shape.

::: live

```yaml
type: custom:sun-azimuth-card-pro
title: Gable
view: 3d
house: { front: 20, roof: gable }
camera: 150
show_house: false
```

:::

::: live

```yaml
type: custom:sun-azimuth-card-pro
title: Gable to the front
view: 3d
house: { front: 20, roof: gable_front }
camera: 150
show_house: false
```

:::

::: live

```yaml
type: custom:sun-azimuth-card-pro
title: Hip
view: 3d
house: { front: 20, roof: hip }
camera: 150
show_house: false
```

:::

::: live

```yaml
type: custom:sun-azimuth-card-pro
title: Flat
view: 3d
house: { front: 20, roof: flat }
camera: 150
show_house: false
```

:::

### Orbit

`camera_slider: true` puts a slider under the plot to turn around the scene. It changes only what you see: the YAML keeps its `camera`, and the card starts from it again on the next page load.

::: live

```yaml
type: custom:sun-azimuth-card-pro
title: Sun
view: 3d
house: { front: 20 }
camera: 150
camera_slider: true
```

:::

## Sunrise and sunset

`show_events: true` adds a row under the dial or the 3D scene: sunrise and sunset with their bearings, and solar noon with the height the sun reaches.

::: live

```yaml
type: custom:sun-azimuth-card-pro
title: Sun
icon: mdi:sun-compass
house: { front: 20 }
show_events: true
```

:::

## Sides of the house

`house.front` is the bearing the front of the house faces, in degrees clockwise from north: a house whose front looks north-east has `front: 45`. The other sides follow as `right`, `back` and `left`, left and right as you stand in front of the house looking at it. A side you do not name is called by where it really faces (North-East side, South-West side …), in the profile language; `house.sides` gives the sides your own names, which stay as written in every language. A side set to `false` is a wall that never gets sun, like the one a semi-detached or terraced house shares with its neighbour: it is drawn as a plain wall and left out of the footer and the line under the plot.

`show_sides: true` adds a footer that lists the sides with the time the sun shines on them today, a pill for their state (Sun now, from 14:20, Shade or No sun today) and a timeline from just before sunrise to just after sunset. A side may get sun twice a day, for example a north side on a summer morning and evening; both windows are drawn.

Move the pointer along a side's timeline (or tap it on a phone) and the plot above shows the sun at that time: where it stands, which sides it lights, its shadow. A hairline marks the time on every bar and the footer's heading shows it. `hover_preview: false` turns this off.

::: live

```yaml
type: custom:sun-azimuth-card-pro
title: Sun
icon: mdi:sun-compass
house:
  front: 45
  sides: { front: Street, right: Terrace, back: Garden, left: false }
show_events: true
show_sides: true
```

:::

## Less

`show_house: false` drops the line under the dial and the 3D scene naming the sides in the sun and what comes next, leaving just the plot. The card sizes itself to its content; give it `rows` in `grid_options` and it takes that height instead, with the plot shrinking to fit and centred in the room the rest leaves. Two narrow cards side by side, of the same height:

::: live

```yaml
- type: custom:sun-azimuth-card-pro
  view: 3d
  house: { front: 20 }
  show_house: false
  grid_options: { columns: 6, rows: 4 }
- type: custom:sun-azimuth-card-pro
  house: { front: 20 }
  show_house: false
  grid_options: { columns: 6, rows: 4 }
```

:::

## Colours

`sun_color` paints the sun, its path and everything lit by it, `night_color` the sun while it is below the horizon and the sunset marker, `sky_color` the dial's disc and the 3D dome. Any [colour value](/guide/colours#colour-values) works.

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

| Option          | Default      | Description                                                                                                                                                                                                          |
| --------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`         |              | Header. Omit for no header.                                                                                                                                                                                          |
| `icon`          |              | Header icon.                                                                                                                                                                                                         |
| `view`          | `dial`       | `dial` or `3d`.                                                                                                                                                                                                      |
| `house.front`   | `0`          | The bearing the front of the house faces, 0–360 degrees clockwise from north.                                                                                                                                        |
| `house.roof`    | `gable`      | `gable` (ridge from left to right), `gable_front` (the gable faces the front), `hip` or `flat`.                                                                                                                      |
| `house.sides`   |              | Own names for `front`, `right`, `back` and `left` (as you look at the front), or `false` for a wall that never gets sun. Unnamed sides are called by where they face, in the [profile language](../guide/languages). |
| `camera`        | `180`        | 3D view: the bearing you look toward, 0–360.                                                                                                                                                                         |
| `camera_slider` | `false`      | 3D view: a slider under the plot to orbit the scene. The value is not saved.                                                                                                                                         |
| `hover_preview` | `true`       | Hovering or tapping a side's timeline shows the sun at that time in the plot.                                                                                                                                        |
| `show_house`    | `true`       | Dial and 3D: the line naming the sides in the sun and what comes next.                                                                                                                                               |
| `show_events`   | `false`      | Dial and 3D: the sunrise, solar noon and sunset row.                                                                                                                                                                 |
| `show_sides`    | `false`      | The sides of the house footer.                                                                                                                                                                                       |
| `sun_color`     | `amber`      | The sun, its path and what it lights.                                                                                                                                                                                |
| `night_color`   | `indigo`     | The sun below the horizon and the sunset marker.                                                                                                                                                                     |
| `sky_color`     | `light-blue` | The dial's disc and the 3D dome.                                                                                                                                                                                     |

The card follows the local calendar day and refreshes every minute. Sunrise and sunset use the standard −0.833° refraction; a side counts as sunlit while the sun is above the horizon and within 90° of the side's outward normal. The default size is 12 columns with `rows: auto`. Like every card, this one also accepts `grid_options`, `visibility`, `layout_options`, `view_layout` and `card_mod`, which are passed through to Home Assistant.
