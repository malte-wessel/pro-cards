# Heading Card Pro

`custom:heading-card-pro` names a part of a dashboard: a room, a group of devices, the state of the house. Like Home Assistant's own heading it has no card around it. Its badges are written as a [poster's](/cards/poster-badges#badge-reference): an icon place, a visual after the value, rules and their entity's kind, so they draw more than a value: a ring, a dot, a picture, a bar, a sparkline, a trend or a switch. This page starts with a title and adds options one at a time.

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

`badge_style` sets the pill of every badge: `outline` (the default, Home Assistant's badge: the card's background, border and shadow), `soft` (a tint of the badge's colour), `filled`, `tag` (an outline in the badge's colour with the text in that colour, the poster's status pill) or `plain` (the icon and the value alone: its pill draws nothing, but keeps its padding and shape, so it lines up with the others and its hover is a pill). `badge_size` sets their height: `s` (24 px), `m` (30 px, the default) or `l` (36 px). A badge's own `style` and `size` override both.

::: live

```yaml
type: custom:heading-card-pro
title: Styles
badge_size: s
badges:
  - { entity: sensor.kitchen_temperature, style: outline }
  - { entity: light.living_room, style: soft }
  - { entity: lock.front_door, style: filled }
  - { entity: media_player.living_room_speaker, style: plain }
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

## Icons and visuals

A badge's pill holds its icon, its name, its value, its visual and a switch, in that order. `icon` is the icon place: an icon's name, `{ ring: true }` for a ring of the value around the icon (on `min` and `max`, as everywhere), `{ type: dot }` for a dot in the badge's colour, `{ type: image }` for the entity's picture, or `false`. `visual` draws after the value: `bar` a short bar of the value, `sparkline` the history of the last 24 hours, `trend` how much the value changed over the last hour; `{ type: sparkline, hours: 6 }` gives either its own window (`today`: since midnight). `show_name: true` writes the name before the value; `show_value: false` leaves the icon alone. How many of a group's members are on is a template in `value`.

::: live

```yaml
type: custom:heading-card-pro
title: Energy
icon: mdi:flash
badges:
  - { entity: sensor.power_consumption, visual: { type: sparkline, hours: 6 }, format: power }
  - { entity: sensor.battery_soc, icon: { name: mdi:home-battery, ring: true } }
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
  - entity: group.downstairs_lights
    name: Lights
    show_name: true
    value: "{{ expand('group.downstairs_lights') | selectattr('state', 'eq', 'on') | list | count }}"
  - { entity: person.malte, icon: { type: image }, show_name: true, show_value: false }
  - { entity: binary_sensor.window_kitchen, icon: { type: dot }, name: Kitchen window, show_name: true, show_value: false }
```

:::

## A switch in a badge

`control: toggle` puts a switch at the end of the badge; the badge itself keeps its action. It is the only control a badge holds.

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

`rules` work as on the poster: the first match sets `color`, `icon` (a name, or the icon place: `{ type: dot }`) and `value`, the text in place of the value; they win over the badge's own `color` and `icon`. A rule can also change the pill (`style`) and make it pulse (`pulse: true`). Without rules a badge takes its entity's kind's colours: a battery red when it runs low, air quality by its bands, a light in its own colour; `kind: none` leaves them out. `visibility` shows a badge only while its conditions hold, here the open kitchen window.

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
      - { state: "on", color: red, style: filled, value: Open, pulse: true }
```

:::

## Format and staleness

`format` writes the value another way: `power` switches between W, kW and MW, `duration` writes a time span (`1h 12m`), `relative` writes a date as its time from now (`in 38 minutes`). `stale_after` greys a badge whose entity has not reported for that long (a report of an unchanged value counts) and adds how long ago it did; it takes minutes or a number with `s`, `min`, `h` or `d`.

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

`title_tap_action` runs when the title (or its icon) is tapped, for example to open the room's dashboard. `icon_tap_action` gives the icon an action of its own; `icon_tap_action: none` keeps it still under a tappable title. Every badge keeps its entity's `tap_action`, `hold_action` and `double_tap_action`; the card's own set the defaults for all of them. See [Actions](/cards/tile-custom#actions).

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

A badge is a button, as Home Assistant's badges are: one with an action takes a light layer under the pointer and a stronger one while pressed, its switch too. A badge without an action (`tap_action: none` and no hold or double tap) keeps still. `hover: false` turns the layers off, on the card for every badge or on one badge for that one.

::: live

```yaml
type: custom:heading-card-pro
title: Living room
badges:
  - sensor.living_room_temperature
  - { entity: light.living_room, hover: false }
```

:::

## In other cards

The [poster](/cards/poster-badges), the [tile](/cards/tile-badges) and the [tile group](/cards/tile-group-card)'s header take the same badges. The cards with a header from before (the group, sections, weather, wind, rain, power flow and energy flow cards) draw their `header_entities` with their old keys (`visual: ring`, `show_icon`, a rule's `label`: [Entity options](/cards/entity-options)), `plain` and `s` unless a badge says otherwise.

## Reference

### Card options

| Option                                             | Default                         | Description                                                                          |
| -------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------ |
| `style`                                            | `title`                         | `section`, `title`, `subtitle`, `big` or `hero`.                                     |
| `title`                                            |                                 | The heading's text. Template allowed.                                                |
| `subtitle`                                         |                                 | The line under the title. Template allowed.                                          |
| `icon`                                             |                                 | The icon before the title. Template allowed.                                         |
| `color`                                            | secondary text (`big`: primary) | The icon's colour, a theme colour name or any CSS colour. Template allowed.          |
| `title_tap_action`                                 | none                            | Action when the title or its icon is tapped.                                         |
| `icon_tap_action`                                  | the title's                     | Action when the icon is tapped, instead of the title's; `none` keeps the icon still. |
| `align`                                            | `start`                         | `start` or `center`.                                                                 |
| `badges_position`                                  | `end`                           | `end` (below on a card narrower than 300 px), `inline` or `below`.                   |
| `overflow`                                         | `wrap`                          | `wrap` or `scroll`.                                                                  |
| `badge_style`                                      | `outline`                       | The pill of every badge: `outline`, `soft`, `filled`, `tag` or `plain`.              |
| `badge_size`                                       | `m`                             | The size of every badge: `s`, `m` or `l`.                                            |
| `badges`                                           |                                 | Entity ids or badge objects.                                                         |
| `tap_action` / `hold_action` / `double_tap_action` | more-info / more-info / none    | Defaults for every badge, see [Actions](/cards/tile-custom#actions).                 |
| `hover`                                            | on for badges with an action    | `false` turns the hover and press layers off for every badge, see [Hover](#hover).   |

### Badge options

A badge takes a [poster's badge keys](/cards/poster-badges#badge-reference): `entity`, `name`, `attribute`, `value`, `unit`, `decimals`, `prefix`, `suffix`, `min`, `max`, `icon`, `visual`, `color`, `kind`, `show_name`, `show_value`, `format`, `stale_after`, `control`, `rules`, the actions, `hover` and `visibility`. Its `style` and `size` default to the card's `badge_style` and `badge_size`. The card's `hours_to_show`, `bucket_minutes` and `smoothing_minutes` are gone: a badge says its own window (`visual: { type: sparkline, hours }`).

### Grid defaults

Full width, `rows: auto`; at least 3 columns. See [Sizing in sections](/guide/sizing).

### Home Assistant options

Like every card, this one also accepts `grid_options`, `visibility`, `layout_options`, `view_layout` and `card_mod`. They are passed through to Home Assistant; see [Sizing in sections](/guide/sizing) for `grid_options`. The card's own `visibility` hides the whole card; its badges take their own, see [Visibility](/guide/visibility).
