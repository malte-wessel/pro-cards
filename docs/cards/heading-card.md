# Heading

`custom:heading-card-pro` names a part of a dashboard: a room, a group of devices, the state of the house. Like Home Assistant's own heading it has no card around it, and its badges show live values beside the title.

## Title, icon and subtitle

`title` is the heading's text, `icon` puts an icon before it and `subtitle` adds a quieter line under it. `color` colours the icon. All of them take templates.

::: live

```yaml
type: custom:heading-card-pro
title: Living room
subtitle: "{{ states('sensor.living_room_temperature') }} °C · {{ states('sensor.living_room_humidity') }} %"
icon: mdi:sofa
```

:::

## Styles

`style` sets the heading's size: `section` (small capitals and a line, for a part of a view), `title` (the default), `subtitle` (smaller and quieter), `big` (a larger title beside the icon in a circle) or `hero` (a greeting's size).

::: live

```yaml
- type: custom:heading-card-pro
  style: hero
  title: Good afternoon
- type: custom:heading-card-pro
  style: big
  title: Bedroom
  icon: mdi:bed
  color: indigo
- type: custom:heading-card-pro
  title: Living room
  icon: mdi:sofa
- type: custom:heading-card-pro
  style: subtitle
  title: Lights
- type: custom:heading-card-pro
  style: section
  title: Cameras
```

:::

## Badges

`badges` lists entities, drawn as pills at the end of the line. A tap opens the entity's more-info dialog. A badge can also be an object with the [badge keys](/cards/badges#badge-keys): a ring around its icon, a sparkline or trend after the value, a switch, rules, visibility and its own actions. Without rules a badge takes its entity kind's colours: a light in its own colour, a battery red when it runs low.

::: live

```yaml
type: custom:heading-card-pro
title: Living room
icon: mdi:sofa
badges:
  - sensor.living_room_temperature
  - { entity: sensor.living_room_co2, visual: { type: sparkline, hours: 6 } }
  - { entity: sensor.battery_soc, icon: { name: mdi:home-battery, ring: true } }
  - { entity: light.living_room, show_value: false, control: toggle }
  - entity: binary_sensor.window_kitchen
    visibility:
      - { condition: state, state: "on" }
    rules:
      - { state: "on", color: red, style: filled, value: Open }
```

:::

## Badge style and size

`badge_style` sets the pill of every badge: `outline` (the default, as Home Assistant's badges), `soft` (a tint of the badge's colour), `filled`, `tag` (an outline and text in the badge's colour) or `plain` (the icon and value alone). `badge_size` sets their height: `s`, `m` (the default) or `l`. A badge's own `style` and `size` win.

::: live

```yaml
type: custom:heading-card-pro
title: Styles
badge_size: s
badges:
  - { entity: sensor.kitchen_temperature, style: outline }
  - { entity: light.living_room, style: soft }
  - { entity: lock.front_door, style: filled }
  - { entity: sensor.living_room_co2, style: tag }
  - { entity: media_player.living_room_speaker, style: plain }
```

:::

## Position and alignment

`badges_position` places the badges: at the `end` of the line (the default; on a narrow card they move below the title), `inline` right after the title, or `below` on a line of their own. `align: center` centres the title, the subtitle and the badges. More badges than fit wrap onto more lines; `overflow: scroll` keeps them on one line that scrolls.

::: live

```yaml
type: custom:heading-card-pro
align: center
style: big
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

## Actions and hover

`title_tap_action` runs when the title or its icon is tapped, for example to open the room's dashboard. `icon_tap_action` gives the icon an action of its own; `none` keeps the icon still. The card's `tap_action`, `hold_action` and `double_tap_action` are the defaults for every badge, and a badge's own win. A badge with an action shows Home Assistant's hover and press effects; `hover: false` turns them off, on the card or on one badge. See [Actions & hover](/cards/actions).

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

## A greeting

A `hero` heading with templates in the subtitle, for the top of a home dashboard.

::: live

```yaml
type: custom:heading-card-pro
style: hero
title: Good afternoon
subtitle: "{{ states.person | selectattr('state', 'eq', 'home') | list | count }} people home · {{ states.light | selectattr('state', 'eq', 'on') | list | count }} lights on"
badges:
  - sensor.outdoor_temperature
  - { entity: weather.home, show_value: false }
  - { entity: lock.front_door, style: filled }
```

:::

## The visual editor

Home Assistant's card editor shows a form for the heading: the title with its icon, the subtitle, the style and the colour, then the badges as a list, each edited in a dialog with the [badge keys](/cards/badges). **Layout** sets the alignment, where the badges sit, what happens when they do not fit and their style and size; **Interactions** the actions of the title, the icon and the badges. A field left at its default writes nothing, and what the form does not show stays in the YAML as written. Try it in the [Playground](/playground), or with **Edit** under any example.

## Reference

### Card options

| Key                 | Default                         | Description                                                                     |
| ------------------- | ------------------------------- | ------------------------------------------------------------------------------- |
| `title`             | –                               | The heading's text. Template allowed.                                           |
| `subtitle`          | –                               | The line under the title. Template allowed.                                     |
| `icon`              | –                               | The icon before the title. Template allowed.                                    |
| `color`             | secondary text (`big`: primary) | The icon's colour: a colour name or any CSS colour. Template allowed.           |
| `style`             | `title`                         | `section`, `title`, `subtitle`, `big` or `hero`.                                |
| `align`             | `start`                         | `start` or `center`.                                                            |
| `badges`            | –                               | Entity ids or badges with the [badge keys](/cards/badges#badge-keys), in order. |
| `badges_position`   | `end`                           | `end` (below the title on a narrow card), `inline` or `below`.                  |
| `overflow`          | `wrap`                          | Badges that do not fit: `wrap` onto more lines, or `scroll` on one.             |
| `badge_style`       | `outline`                       | The pill of every badge: `outline`, `soft`, `filled`, `tag` or `plain`.         |
| `badge_size`        | `m`                             | The size of every badge: `s`, `m` or `l` (24, 30 or 36 px high).                |
| `title_tap_action`  | `none`                          | What a tap on the title or its icon does.                                       |
| `icon_tap_action`   | the title's                     | What a tap on the icon does; `none` keeps the icon still.                       |
| `tap_action`        | `more-info`                     | The default tap for every badge.                                                |
| `hold_action`       | `more-info`                     | The default hold for every badge.                                               |
| `double_tap_action` | `none`                          | The default double tap for every badge.                                         |
| `hover`             | `true`                          | `false` turns the hover and press effects off for every badge.                  |

### Grid and Home Assistant options

The heading takes the full width and sizes its height to its content (`rows: auto`); it goes down to 3 columns. See [Sizing in sections](/guide/sizing).

The card also takes Home Assistant's `grid_options`, `visibility`, `view_layout` and `card_mod`, plus `fill_height`. The card's `visibility` hides the whole heading; a badge's hides that badge.
