# Heading Card Pro

`custom:heading-card-pro` names a part of a dashboard: a room, a group of devices, the state of the house. Like Home Assistant's own heading it has no card around it. Its badges are entities with the same keys, rules and actions as every Pro card, and they can draw more than a value: a ring, a bar, a sparkline, a trend, a count or a switch. This page starts with a title and adds options one at a time.

## Basic

The type and a `title`. `icon` puts an icon before it; both take templates.

::: live

```yaml
type: custom:heading-card-pro
title: Living room
icon: mdi:sofa
```

:::

## Badges

`badges` is a list of entities, drawn as pills at the end of the line. Every badge shows its icon and its value; tapping it opens the more-info dialog.

::: live

```yaml
type: custom:heading-card-pro
title: Living room
icon: mdi:sofa
badges:
  - sensor.living_room_temperature
  - sensor.living_room_humidity
  - light.living_room
```

:::

## Styles

`style` sets the heading's size: `section` (small caps and a line, for a part of a view), `title` (the default), `subtitle` (smaller and quieter), `big` (a larger title beside the icon in a circle) and `hero` (a greeting's size). `subtitle` adds a line under the title, `color` colours the icon.

::: live

```yaml
type: custom:heading-card-pro
style: section
title: Cameras
badges:
  - { entity: binary_sensor.motion_hallway, name: Motion }
```

:::

::: live

```yaml
type: custom:heading-card-pro
style: big
title: Bedroom
subtitle: "{{ states('sensor.bedroom_temperature') }} °C · blinds {{ states('cover.bedroom_blinds') }}"
icon: mdi:bed
color: indigo
badges:
  - { entity: light.bedroom, show_value: false }
```

:::

::: live

```yaml
type: custom:heading-card-pro
style: hero
title: Good afternoon
subtitle: "{{ states.person | selectattr('state', 'eq', 'home') | list | count }} people home · {{ states.light | selectattr('state', 'eq', 'on') | list | count }} lights on"
badges:
  - sensor.outdoor_temperature
  - { entity: lock.front_door, style: filled }
```

:::

## Badge styles and sizes

`badge_style` sets the pill of every badge: `outline` (the default), `soft`, `filled` or `plain` (no pill, the icon and the value alone). `badge_size` sets their height: `s` (24 px), `m` (30 px, the default) or `l` (36 px). A badge's own `style` and `size` override both.

::: live

```yaml
type: custom:heading-card-pro
title: Styles
badge_size: s
badges:
  - { entity: sensor.kitchen_temperature, style: outline }
  - { entity: light.living_room, style: soft }
  - { entity: lock.front_door, style: filled }
  - { entity: media_player.living_room_tv, style: plain }
```

:::

::: live

```yaml
type: custom:heading-card-pro
title: Sizes
badges:
  - { entity: sensor.kitchen_temperature, size: s }
  - { entity: sensor.kitchen_temperature, size: m }
  - { entity: sensor.kitchen_temperature, size: l }
```

:::

## Visuals

`visual` changes what a badge draws. `ring` puts a progress ring around the icon and `bar` a short bar before the value (both on `min` and `max`, as everywhere). `sparkline` draws the history of the last `hours_to_show` (6 by default) in the icon's place. `trend` adds how much the value changed over `trend_hours` (1 by default). `count` shows how many members of a group are on, and `dot` is a coloured dot instead of the icon. `show_name: true` writes the name before the value; `show_value: false` leaves the icon alone.

::: live

```yaml
type: custom:heading-card-pro
title: Energy
icon: mdi:flash
badges:
  - { entity: sensor.power_consumption, visual: sparkline, format: power }
  - { entity: sensor.battery_soc, visual: ring, icon: mdi:home-battery }
  - { entity: sensor.living_room_temperature, visual: trend }
```

:::

::: live

```yaml
type: custom:heading-card-pro
title: Living room
icon: mdi:sofa
badges:
  - { entity: sensor.ev_battery, visual: bar, icon: mdi:car-electric }
  - { entity: light.downstairs, visual: count, name: Lights, show_name: true }
  - { entity: person.alex, show_entity_picture: true, show_name: true, show_value: false }
  - { entity: binary_sensor.window_kitchen, visual: dot, name: Kitchen window, show_name: true, show_value: false }
```

:::

## A switch in a badge

`control: toggle` puts a switch into the badge; the badge itself keeps its action. It is the only control a badge holds.

::: live

```yaml
type: custom:heading-card-pro
title: Lights
icon: mdi:lightbulb-group
badges:
  - { entity: light.living_room, name: Living room, show_name: true, show_value: false, control: toggle }
```

:::

## Rules

`rules` work as on every Pro card: the first match sets `color`, `icon` and `label`. On a badge a rule can also change its pill (`style`) and make it pulse (`pulse: true`); `tint_card` tints the heading. `visibility` shows a badge only while its conditions hold, here the open kitchen window.

::: live

```yaml
type: custom:heading-card-pro
title: Kitchen
icon: mdi:silverware-fork-knife
badges:
  - entity: sensor.kitchen_temperature
    rules:
      - { below: 18, color: blue }
      - { below: 24, color: green }
      - { above: 24, color: orange, style: soft }
  - entity: binary_sensor.window_kitchen
    visibility:
      - { condition: state, state: "on" }
    rules:
      - { state: "on", color: red, style: filled, label: Open, pulse: true, tint_card: true }
```

:::

## Format and staleness

`format` writes the value another way: `power` switches between W, kW and MW, `duration` writes a time span (`1 h 12 min`), `relative` writes a date as its time from now (`in 38 min`). `stale_after` greys a badge whose entity has not reported for that long and adds how long ago it did; it takes minutes or a number with `s`, `min`, `h` or `d`.

::: live

```yaml
type: custom:heading-card-pro
title: Appliances
icon: mdi:washing-machine
badges:
  - { entity: sensor.solar_power, format: power, icon: mdi:solar-power }
  - { entity: sensor.washer_remaining, format: duration }
  - { entity: sensor.dishwasher_finishes, format: relative, icon: mdi:dishwasher }
  - { entity: sensor.weather_station_battery, stale_after: 2h }
```

:::

## Position and alignment

`badges_position` places the badges: at the `end` of the line (the default; on a card narrower than 300 px they move below the title), `inline` right after the title, or `below` on a line of their own. `align: center` centres the title, the subtitle and the badges, for a panel or a wall tablet.

::: live width=280

```yaml
type: custom:heading-card-pro
title: Living room
icon: mdi:sofa
badges:
  - sensor.living_room_temperature
  - sensor.living_room_humidity
  - light.living_room
```

:::

::: live

```yaml
type: custom:heading-card-pro
title: Living room
icon: mdi:sofa
badges_position: below
badges:
  - sensor.living_room_temperature
  - sensor.living_room_humidity
  - sensor.living_room_co2
  - light.living_room
```

:::

::: live

```yaml
type: custom:heading-card-pro
align: center
style: big
title: Living room
subtitle: "{{ states('sensor.living_room_temperature') }} °C"
badges:
  - sensor.living_room_humidity
  - light.living_room
```

:::

## Many badges

More badges than fit wrap onto more lines. `overflow: scroll` keeps them on one line that scrolls and fades at its edges.

::: live

```yaml
type: custom:heading-card-pro
title: House
icon: mdi:home
overflow: scroll
badges:
  - sensor.outdoor_temperature
  - sensor.living_room_temperature
  - sensor.kitchen_temperature
  - sensor.bedroom_temperature
  - sensor.office_temperature
  - sensor.bathroom_temperature
```

:::

## Actions

`title_tap_action` runs when the title (or its icon) is tapped, for example to open the room's dashboard. `icon_tap_action` gives the icon an action of its own. Every badge keeps its entity's `tap_action`, `hold_action` and `double_tap_action`; the card's own set the defaults for all of them. See [Actions](/cards/entity-options#actions).

::: live

```yaml
type: custom:heading-card-pro
title: Office
icon: mdi:desk
title_tap_action: { action: navigate, navigation_path: /dashboard-rooms/office }
icon_tap_action: { action: toggle, entity: light.office }
badges:
  - sensor.office_temperature
  - { entity: sensor.office_co2, tap_action: { action: none } }
```

:::

## Hover

`hover: true` shows Home Assistant's hover and press layers on the badges, set on the card for all of them or on one badge for that one.

::: live

```yaml
type: custom:heading-card-pro
title: Living room
hover: true
badges:
  - sensor.living_room_temperature
  - light.living_room
```

:::

## In other cards

The cards with a header (the group, sections, weather, wind, rain, power flow and energy flow cards) draw their `header_entities` with the same badges. There they are `plain` and `s` unless a badge says otherwise, so headers keep the look they had.

## Reference

### Card options

| Option                                             | Default                         | Description                                                                 |
| -------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------- |
| `style`                                            | `title`                         | `section`, `title`, `subtitle`, `big` or `hero`.                            |
| `title`                                            |                                 | The heading's text. Template allowed.                                       |
| `subtitle`                                         |                                 | The line under the title. Template allowed.                                 |
| `icon`                                             |                                 | The icon before the title. Template allowed.                                |
| `color`                                            | secondary text (`big`: primary) | The icon's colour, a theme colour name or any CSS colour. Template allowed. |
| `title_tap_action`                                 | none                            | Action when the title or its icon is tapped.                                |
| `icon_tap_action`                                  | none                            | Action when the icon is tapped, instead of the title's.                     |
| `align`                                            | `start`                         | `start` or `center`.                                                        |
| `badges_position`                                  | `end`                           | `end` (below on a card narrower than 300 px), `inline` or `below`.          |
| `overflow`                                         | `wrap`                          | `wrap` or `scroll`.                                                         |
| `badge_style`                                      | `outline`                       | The pill of every badge: `outline`, `soft`, `filled` or `plain`.            |
| `badge_size`                                       | `m`                             | The size of every badge: `s`, `m` or `l`.                                   |
| `badges`                                           |                                 | Entity ids or badge objects.                                                |
| `hours_to_show`                                    | `6`                             | History window of `sparkline` and `trend`, at least 1.                      |
| `smoothing_minutes`                                |                                 | Averaging bucket of `sparkline` in minutes, at least 5.                     |
| `tap_action` / `hold_action` / `double_tap_action` | more-info / more-info / none    | Defaults for every badge, see [Actions](/cards/entity-options#actions).     |
| `hover`                                            | `false`                         | Default for every badge, see [Hover](#hover).                               |

### Badge options

A badge takes the [entity options](/cards/entity-options#entity-options) (`entity`, `name`, `icon`, `color`, `attribute`, `value`, `unit`, `decimals`, `prefix`, `suffix`, `min`, `max`, `show_entity_picture`, `rules`, the actions, `hover`, `visibility`) and these:

| Option                                   | Default             | Description                                                                                         |
| ---------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------- |
| `visual`                                 | `icon`              | `icon`, `ring`, `bar`, `sparkline`, `trend`, `count` or `dot`.                                      |
| `style`                                  | `badge_style`       | `outline`, `soft`, `filled` or `plain`.                                                             |
| `size`                                   | `badge_size`        | `s`, `m` or `l`.                                                                                    |
| `show_name` / `show_value` / `show_icon` | false / true / true | What the badge shows.                                                                               |
| `format`                                 | `auto`              | `auto`, `power`, `duration` or `relative`.                                                          |
| `stale_after`                            |                     | Grey with its age when the entity has not reported for this long: minutes, or `90s`, `30min`, `2h`. |
| `trend_hours`                            | `1`                 | `trend`: the hours the change is measured over (at most `hours_to_show`).                           |
| `control`                                |                     | `toggle`: a switch in the badge.                                                                    |

A badge's rules also take `style` (the pill while the rule matches) and `pulse: true` (a ring that pulses around it).

### Grid defaults

Full width, `rows: auto`; at least 3 columns. See [Sizing in sections](/guide/sizing).

### Home Assistant options

Like every card, this one also accepts `grid_options`, `visibility`, `layout_options`, `view_layout` and `card_mod`. They are passed through to Home Assistant; see [Sizing in sections](/guide/sizing) for `grid_options`. The card's own `visibility` hides the whole card; its badges take their own, see [Visibility](/guide/visibility).
