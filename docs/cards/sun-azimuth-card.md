# Sun azimuth

`custom:sun-azimuth-card-pro` shows where the sun is around your house today: which walls are in the sun now, which come next, and when each one gets sun. It needs no sensors: the sun's position comes from the location set in Home Assistant.

All the card needs is its type: today's sun over a house whose front faces north.

::: live

```yaml
type: custom:sun-azimuth-card-pro
```

:::

## Set it up

1. **Where your front faces.** Stand with your back to your front door, read your phone's compass and put the degrees into `house.front`: `0` north, `90` east, `180` south, `270` west. Use true north if your compass offers it, or estimate the angle on a map.
2. **The sides and the roof.** The sides are `front`, `right`, `back` and `left`, as you look at the front. Name them in `house.sides`; unnamed sides are called by where they face, and `false` marks a wall shared with a neighbour, which never gets sun. `house.roof` sets [the roof](#the-roof).
3. **The camera.** `camera` is the direction you look in: from the street it is `front` + 180, from the garden behind the house it is `front`.
4. **What to show.** `show_sun_times: true` adds sunrise, noon and sunset, `show_sides: true` the hours of sun on each side, and `show_summary: false` leaves just the picture.

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

The default view: the house under a see-through sky dome. The sun runs along today's path, solid where it has been and dashed where it is still to come. Chips show its height above the ground and its compass direction. The walls and roof slopes facing the sun light up, the brighter the more directly it hits them, and the house casts its shadow.

`camera_slider: true` adds a slider to turn around the house. It only changes the view: the card starts from `camera` again the next time it loads, so turn the house until it looks right and copy the slider's angle into `camera`.

::: live

```yaml
type: custom:sun-azimuth-card-pro
title: Sun
house: { front: 20 }
camera: 150
camera_slider: true
```

:::

## The roof

`house.roof` is `gable` (the ridge runs from left to right), `gable_front` (the gable faces the front), `hip` or `flat`. Roof slopes catch the sun like walls, and the shadow follows the roof.

::: live

```yaml
- type: custom:sun-azimuth-card-pro
  title: Gable to the front
  house: { front: 20, roof: gable_front }
  camera: 150
  show_summary: false
  grid_options: { columns: 6 }
- type: custom:sun-azimuth-card-pro
  title: Hip
  house: { front: 20, roof: hip }
  camera: 150
  show_summary: false
  grid_options: { columns: 6 }
```

:::

## The sky dial

`view: dial` looks down on the house from above. The outer ring is the horizon and the centre is straight up, so the higher the sun, the closer it is to the middle. A pale arc runs around the ring from where the sun rises to where it sets, and the walls in the sun light up.

::: live

```yaml
type: custom:sun-azimuth-card-pro
view: dial
house:
  front: 20
  sides: { front: Street, back: Garden }
show_sun_times: true
```

:::

## Sunrise, sunset and the sides

`show_sun_times: true` adds a row under the picture: sunrise and sunset with the direction they happen in, and solar noon with the height the sun reaches.

`show_sides: true` lists the sides, each with the hours it gets sun today on a timeline and its state: Sun now, from 14:20, Shade or No sun today. Move the pointer along a timeline or the sun's path, or tap it, and the picture shows the sun at that time. `hover_preview: false` turns that off.

## Colours

`sun_color` paints the sun, its path and everything it lights. `night_color` paints the sun below the horizon, and `sky_color` tints the dome and the dial. Any [colour value](/guide/colours#colour-values) works.

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

## The visual editor

Home Assistant's card editor shows a form for the sun azimuth card: the title, the icon and the view, then **House** (where the front faces, the roof, and each side's name or a shared wall; an empty name shows the direction the side faces), **3D view** (the camera and its slider; not for the dial), **Content** (what is shown under the picture, and the hover preview), the colours and `fill_height`. A value left at its default writes nothing. Try it in the [Playground](/playground), or with **Edit** under any example.

## Reference

| Key              | Default      | Description                                                                                                                                 |
| ---------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`          | –            | The header's text. Leave it out for no header.                                                                                              |
| `icon`           | –            | The header's icon.                                                                                                                          |
| `view`           | `3d`         | `3d` or `dial`.                                                                                                                             |
| `house.front`    | `0`          | Where your front faces, 0 to 360 degrees from north.                                                                                        |
| `house.roof`     | `gable`      | `gable`, `gable_front`, `hip` or `flat`.                                                                                                    |
| `house.sides`    | –            | Your names for `front`, `right`, `back` and `left`, or `false` for a wall that never gets sun. Unnamed sides are called by where they face. |
| `camera`         | `180`        | 3D: the direction you look in, 0 to 360 degrees.                                                                                            |
| `camera_slider`  | `false`      | 3D: a slider to turn around the house. Not saved.                                                                                           |
| `hover_preview`  | `true`       | Hovering or tapping a timeline or the sun's path shows the sun at that time.                                                                |
| `show_summary`   | `true`       | The line under the picture: the sides in the sun and what comes next.                                                                       |
| `show_sun_times` | `false`      | Sunrise, solar noon and sunset under the picture.                                                                                           |
| `show_sides`     | `false`      | The sides with their hours of sun today.                                                                                                    |
| `sun_color`      | `amber`      | The sun, its path and what it lights.                                                                                                       |
| `night_color`    | `indigo`     | The sun below the horizon, and the sunset on the dial.                                                                                      |
| `sky_color`      | `light-blue` | The dome and the dial.                                                                                                                      |

The card shows today and refreshes every minute; after sunset it names tomorrow's sunrise. Directions are from true north.

The card takes 12 columns (at least 6) and sizes its height to its content. With `rows` in `grid_options` it takes a fixed height and the picture fits into it, so two cards side by side can match. It also takes Home Assistant's `grid_options`, `visibility`, `view_layout`, `layout_options` and `card_mod`, and `fill_height: false` keeps its own height beside a taller card ([Filling the height](/guide/sizing#filling-the-height)).
