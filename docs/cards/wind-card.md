# Wind Card

`custom:wind-card` shows the wind: its speed, where it comes from and how hard it gusts, with an animated wind field whose particles travel where the wind blows. The speed sets their pace, the gusts raise the waves and send streaks across, and your `rules` colour them, label the value and may tint the card. Without options it is a tile like the [entity card](/cards/entity-card); `visual: flow` makes the whole tile the field, `layout: hero` adds the big value and a flow band. YAML only.

## Tile

The speed sensor alone makes a tile: the name, the speed and, with a `direction` sensor, the compass point. The round lead shows a small version of the animation in the wind's direction.

::: live

```yaml
type: custom:wind-card
entity: sensor.wind_speed
direction: sensor.wind_direction
```

:::

`direction` may report degrees or a compass point (`N`, `NNE` … `NNW`). Without it the card shows no direction, and the field flows to the right.

## From a weather entity

A weather entity brings speed, direction and gusts in one: the card reads `wind_speed`, `wind_bearing` and `wind_gust_speed`. A `direction` or `gust` sensor next to it overrides the attribute.

::: live

```yaml
type: custom:wind-card
entity: weather.home
```

:::

## Flow tile

`visual: flow` turns the tile into the animated field with the arrow and the texts on top. A full-width tile shows the name, the rule label with the gusts and the big value; a half-width tile keeps to the name and "speed · direction".

::: live

```yaml
type: custom:wind-card
entity: sensor.wind_speed
direction: sensor.wind_direction
gust: sensor.wind_gust
visual: flow
rules:
  - { below: 20, color: teal, label: Light breeze }
  - { above: 20, color: amber, label: Fresh }
```

:::

`flow.style` picks the animation: `dots` (packets of three dots on wave lanes, the default), `lines` (streamlines like a wind map), `swoosh` (curly strokes drawing themselves, like the wind icon come alive) or `vectors` (small arrows turning with their lanes).

::: live

```yaml
- type: custom:wind-card
  entity: sensor.wind_speed
  direction: sensor.wind_direction
  gust: sensor.wind_gust
  visual: flow
  rules:
    - { below: 20, color: teal, label: Light breeze }
    - { above: 20, color: amber, label: Fresh }
- type: custom:wind-card
  entity: sensor.wind_speed
  direction: sensor.wind_direction
  gust: sensor.wind_gust
  visual: flow
  flow: { style: lines }
  rules:
    - { below: 20, color: teal, label: Light breeze }
    - { above: 20, color: amber, label: Fresh }
- type: custom:wind-card
  entity: sensor.wind_speed
  direction: sensor.wind_direction
  gust: sensor.wind_gust
  visual: flow
  flow: { style: swoosh }
  rules:
    - { below: 20, color: teal, label: Light breeze }
    - { above: 20, color: amber, label: Fresh }
- type: custom:wind-card
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

`layout: hero` shows the big value with the label, the direction and the gusts on the second line, then the flow band with a chip that names the direction. `flow.height` sets the band's height (40 to 400 px, default 120). `title`, `icon` and `header_entities` add a header like every entity card.

::: live

```yaml
type: custom:wind-card
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

`rules` work on the speed like the [entity rules](/cards/entity-options#rules): `below` / `above` thresholds in the sensor's unit, first match wins. The matching rule's `color` paints the particles, the lead, the label and the chip's arrow; its `label` is the pill of the tile and the accent of the second line; `tint_card: true` tints the whole card. A fixed `color` overrides the rules. Without any rule the field takes the primary colour.

::: live

```yaml
- type: custom:wind-card
  entity: sensor.wind_speed
  direction: sensor.wind_direction
  visual: flow
  name: Calm
  rules:
    - { above: 0, color: blue-grey, label: Calm }
- type: custom:wind-card
  entity: sensor.wind_gust
  direction: sensor.wind_direction
  visual: flow
  name: Storm
  rules:
    - { above: 0, color: red, label: Storm, tint_card: true }
```

:::

## Lead, density and motion

`lead: arrow` puts the direction arrow in the round lead instead of the animation (the flow tile always shows the arrow). `flow.density` sets how many particles cross the field: `sparse`, `normal` or `dense`. Speeds in m/s, mph, kn and ft/s drive the animation the same way as km/h; the value is shown as the sensor reports it.

The animation is CSS only, keeps flowing through sensor updates (a new speed changes its pace, a new direction turns the field smoothly, only a real change in the gusts redraws the waves) and pauses when your system asks for reduced motion (`prefers-reduced-motion`), leaving a still field. A `dense` field on a wide card is the heaviest choice; `sparse` suits dashboards with many wind cards.

::: live

```yaml
- type: custom:wind-card
  entity: sensor.wind_speed
  direction: sensor.wind_direction
  lead: arrow
- type: custom:wind-card
  entity: sensor.wind_speed
  direction: sensor.wind_direction
  gust: sensor.wind_gust
  visual: flow
  flow: { style: vectors, density: sparse }
```

:::

## Reference

### Card options

| Option              | Default                   | Description                                                                                                                              |
| ------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `entity`            | required                  | The wind speed sensor (`sensor.*`), or a weather entity (`weather.*`) whose `wind_speed`, `wind_bearing` and `wind_gust_speed` are read. |
| `direction`         | –                         | Direction sensor: degrees or a compass point in English (`N`, `NNE` …). Overrides the weather entity's bearing.                          |
| `gust`              | –                         | Gust speed sensor. Overrides the weather entity's gusts.                                                                                 |
| `name`, `secondary` | friendly name / see above | The first line and the line under it; templates allowed. `secondary` replaces the generated line.                                        |
| `color`             | –                         | Fixed colour; overrides the rules.                                                                                                       |
| `decimals`          | sensor                    | Decimals of the speed.                                                                                                                   |
| `rules`             | –                         | `[{ below, above, color, label, tint_card }]` on the speed; first match wins.                                                            |
| `layout`            | `tile`                    | `tile` or `hero`.                                                                                                                        |
| `visual`            | `icon`                    | Tile only: `flow` makes the whole tile the animated field.                                                                               |
| `lead`              | `animated`                | The round lead: `animated` (the flow style, small) or `arrow`.                                                                           |
| `flow`              | see below                 | The animation options.                                                                                                                   |
| `title`, `icon`     | –                         | Header, templates allowed. `header_entities` as in the [group card](/cards/entity-group-card#header-entities).                           |
| `tap_action` …      | `more-info`               | `tap_action`, `hold_action`, `double_tap_action` on the lead row.                                                                        |

### Flow options

| Option    | Default  | Description                                                                            |
| --------- | -------- | -------------------------------------------------------------------------------------- |
| `style`   | `dots`   | `dots`, `lines`, `swoosh` or `vectors`.                                                |
| `density` | `normal` | `sparse`, `normal` or `dense`: the lanes and particles of the field.                   |
| `height`  | `120`    | Height of the hero's flow band in px (40 to 400). The flow tile's band fills the tile. |

The tile takes half a section (6 columns) and one row, two with a header; the hero takes the full width and sizes to its content. The card renders the current states only; direction strings are read in English as Home Assistant's integrations report them.
