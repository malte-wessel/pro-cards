# Wind Card Pro

::: warning Deprecated

The wind card is deprecated: it still works in 3.0 and goes in 4.0. Use a poster or a tile of the [wind kind](/cards/kinds#wind); [Moving to 3.0](/guide/migrating#the-wind-and-rain-cards) says what changes.

:::

`custom:wind-card-pro` shows the wind's speed, where it comes from and how hard it gusts, with an animated wind field whose particles travel where the wind blows. The speed sets their pace, the gusts raise the waves, and your `rules` colour them. Without options it is a tile; `visual: flow` makes the whole tile the field, `layout: hero` adds the big value and a flow band. YAML only.

## Tile

The speed sensor alone makes a tile: the name, the speed and, with a `direction` sensor, the compass point. The round lead shows a small version of the animation in the wind's direction.

::: live

```yaml
type: custom:wind-card-pro
entity: sensor.wind_speed
direction: sensor.wind_direction
```

:::

`direction` may report degrees or a compass point (`N`, `NNE` … `NNW`). Without it the card shows no direction, and the field flows to the right.

## From a weather entity

A weather entity brings speed, direction and gusts in one: the card reads `wind_speed`, `wind_bearing` and `wind_gust_speed`. A `direction` or `gust` sensor next to it overrides the attribute.

::: live

```yaml
type: custom:wind-card-pro
entity: weather.home
```

:::

## Flow tile

`visual: flow` turns the tile into the animated field with the arrow and the texts on top. A wide tile shows the name, the rule label with the gusts and the big value; a narrow one the name and "speed · direction".

::: live

```yaml
type: custom:wind-card-pro
entity: sensor.wind_speed
direction: sensor.wind_direction
gust: sensor.wind_gust
visual: flow
rules:
  - { below: 20, color: teal, label: Light breeze }
  - { above: 20, color: amber, label: Fresh }
```

:::

`flow.style` picks the animation: `dots` (the default), `lines` (streamlines like a wind map), `swoosh` (curly strokes) or `vectors` (small arrows).

::: live

```yaml
- type: custom:wind-card-pro
  entity: sensor.wind_speed
  direction: sensor.wind_direction
  gust: sensor.wind_gust
  visual: flow
  rules:
    - { below: 20, color: teal, label: Light breeze }
    - { above: 20, color: amber, label: Fresh }
- type: custom:wind-card-pro
  entity: sensor.wind_speed
  direction: sensor.wind_direction
  gust: sensor.wind_gust
  visual: flow
  flow: { style: lines }
  rules:
    - { below: 20, color: teal, label: Light breeze }
    - { above: 20, color: amber, label: Fresh }
- type: custom:wind-card-pro
  entity: sensor.wind_speed
  direction: sensor.wind_direction
  gust: sensor.wind_gust
  visual: flow
  flow: { style: swoosh }
  rules:
    - { below: 20, color: teal, label: Light breeze }
    - { above: 20, color: amber, label: Fresh }
- type: custom:wind-card-pro
  entity: sensor.wind_speed
  direction: sensor.wind_direction
  gust: sensor.wind_gust
  visual: flow
  flow: { style: vectors }
  rules:
    - { below: 20, color: teal, label: Light breeze }
    - { above: 20, color: amber, label: Fresh }
```

:::

## Hero

`layout: hero` shows the big value with the label, the direction and the gusts, then the flow band with a chip that names the direction. `flow.height` sets the band's height (40 to 400 px, default 120); given more height, the band fills the card ([Filling the height](/guide/sizing#filling-the-height)). `title`, `icon` and `header_entities` add a header.

::: live

```yaml
type: custom:wind-card-pro
entity: sensor.wind_speed
direction: sensor.wind_direction
gust: sensor.wind_gust
title: Wind
header_entities:
  - { entity: sensor.wind_gust, icon: mdi:weather-windy, color: orange }
layout: hero
flow: { style: swoosh, height: 140 }
rules:
  - { below: 5, color: blue-grey, label: Calm }
  - { below: 20, color: teal, label: Light breeze }
  - { below: 35, color: amber, label: Fresh }
  - { below: 50, color: orange, label: Strong }
  - { above: 50, color: red, label: Storm, tint_card: true }
```

:::

## Rules and colours

`rules` work on the speed like the [entity rules](/cards/entity-options#rules): `below` / `above` in the sensor's unit, first match wins. The rule's `color` paints the particles, the lead and the label; its `label` is the tile's pill and the accent of the second line; `tint_card: true` tints the whole card. A fixed `color` overrides the rules; without either the field is in the primary colour.

::: live

```yaml
- type: custom:wind-card-pro
  entity: sensor.wind_speed
  direction: sensor.wind_direction
  visual: flow
  name: Calm
  rules:
    - { above: 0, color: blue-grey, label: Calm }
- type: custom:wind-card-pro
  entity: sensor.wind_gust
  direction: sensor.wind_direction
  visual: flow
  name: Storm
  rules:
    - { above: 0, color: red, label: Storm, tint_card: true }
```

:::

## Lead, density and motion

`lead: arrow` puts the direction arrow in the round lead instead of the animation (a flow tile always shows the arrow). `flow.density` sets how many particles cross the field: `sparse`, `normal` or `dense`; `sparse` suits dashboards with many wind cards. Speeds in km/h, m/s, mph, kn, ft/s or Beaufort all drive the animation alike; the value is shown as the sensor reports it.

The animation keeps flowing through sensor updates and pauses, leaving a still field, when your system asks for reduced motion.

::: live

```yaml
- type: custom:wind-card-pro
  entity: sensor.wind_speed
  direction: sensor.wind_direction
  lead: arrow
- type: custom:wind-card-pro
  entity: sensor.wind_speed
  direction: sensor.wind_direction
  gust: sensor.wind_gust
  visual: flow
  flow: { style: vectors, density: sparse }
```

:::

## Hover

`hover: true` shows what a click will do, as Home Assistant's tile does: a light layer over the tile under the pointer, a stronger one while pressed; header entities do too, a hero keeps still. See [Hover](/cards/entity-options#hover).

::: live

```yaml
- type: custom:wind-card-pro
  entity: sensor.wind_speed
  direction: sensor.wind_direction
  hover: true
  grid_options: { columns: 6 }
- type: custom:wind-card-pro
  entity: sensor.wind_speed
  direction: sensor.wind_direction
  visual: flow
  hover: true
  grid_options: { columns: 6 }
```

:::

## Reference

### Card options

| Option              | Default                      | Description                                                                                                                                                                                     |
| ------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entity`            | required                     | The wind speed sensor (`sensor.*`), or a weather entity (`weather.*`) whose `wind_speed`, `wind_bearing` and `wind_gust_speed` are read.                                                        |
| `direction`         | –                            | Direction sensor: degrees or a compass point in English (`N`, `NNE` …). Overrides the weather entity's bearing.                                                                                 |
| `gust`              | –                            | Gust speed sensor. Overrides the weather entity's gusts.                                                                                                                                        |
| `name`, `secondary` | friendly name / see above    | The first line and the line under it; templates allowed. `secondary` replaces the generated line.                                                                                               |
| `color`             | –                            | Fixed colour; overrides the rules.                                                                                                                                                              |
| `decimals`          | sensor                       | Decimals of the speed.                                                                                                                                                                          |
| `rules`             | –                            | `[{ below, above, color, label, tint_card }]` on the speed; first match wins.                                                                                                                   |
| `layout`            | `tile`                       | `tile` or `hero`.                                                                                                                                                                               |
| `visual`            | `icon`                       | Tile: `flow` makes the whole tile the animated field.                                                                                                                                           |
| `lead`              | `animated`                   | The round lead: `animated` (the flow style, small) or `arrow`.                                                                                                                                  |
| `icon_style`        | `circle`                     | `plain` draws the arrow lead (`lead: arrow`) without its circle; the animated lead keeps it.                                                                                                    |
| `flow`              | see below                    | The animation options.                                                                                                                                                                          |
| `title`, `icon`     | –                            | Header, templates allowed. `header_entities` as in the [group card](/cards/entity-group-card#header-entities).                                                                                  |
| `title_tap_action`  | none                         | Action when the title or its icon is tapped, e.g. `{ action: navigate, navigation_path: /dashboard-rooms/kitchen }` to open the room's dashboard; see [Actions](/cards/entity-options#actions). |
| `tap_action` …      | more-info / more-info / none | `tap_action`, `hold_action`, `double_tap_action` on the lead row.                                                                                                                               |
| `hover`             | `false`                      | Home Assistant's hover and press layers on the tile; see [Hover](#hover).                                                                                                                       |

### Flow options

| Option    | Default  | Description                                                                            |
| --------- | -------- | -------------------------------------------------------------------------------------- |
| `style`   | `dots`   | `dots`, `lines`, `swoosh` or `vectors`.                                                |
| `density` | `normal` | `sparse`, `normal` or `dense`: the lanes and particles of the field.                   |
| `height`  | `120`    | Height of the hero's flow band in px (40 to 400). The flow tile's band fills the tile. |

The tile takes 6 columns, the hero 12; both size to their content (a tile at least one row, two with a header). The card shows the current states only.
