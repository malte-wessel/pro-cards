# Tile Group Card Pro

`custom:tile-group-card-pro` puts several tiles on one card, under a header with a title, an icon and badges. The tiles are [tile cards](/cards/tile-card) drawn flat on the group's surface, so everything a tile does works the same in a group: its kind, its visual, its controls, its status and its badges.

::: info Beta
The tile group card is new in 3.0 and in beta: its options may still change.
:::

## Basic

The type and its `tiles`: entity ids, or tiles of their own. Each one becomes a tile, one under the other.

::: live

```yaml
type: custom:tile-group-card-pro
tiles:
  - light.kitchen
  - switch.coffee_machine
  - sensor.kitchen_temperature
```

:::

## Title, icon and badges

`title` and `icon` head the card, as on the entity group card; `title_tap_action` makes the title a button (open the room's dashboard). `badges` sit at the end of the title line: plain and small, as the group card's header entities, unless a badge sets its `style` or `size`. They take the [heading card's badge keys](/cards/heading-card#badge-options).

::: live

```yaml
type: custom:tile-group-card-pro
title: Kitchen
icon: mdi:silverware-fork-knife
badges:
  - sensor.kitchen_temperature
  - sensor.kitchen_humidity
tiles:
  - light.kitchen
  - switch.coffee_machine
  - vacuum.robot
```

:::

## Row

`layout: row` draws vertical tiles side by side: the icon on top, the name and the line under it, the controls under them. The layout decides it for every tile: a tile in a group takes no `vertical`. The tiles share the width in columns alike, as wide as the widest tile needs: a tile with wide controls (a cover's buttons) asks for more. A card too narrow for all of them wraps, and a line that is not full keeps the columns' width.

::: live

```yaml
type: custom:tile-group-card-pro
layout: row
title: Living room
icon: mdi:sofa
badges:
  - sensor.living_room_temperature
tiles:
  - light.living_room
  - light.bedroom
  - lock.front_door
```

:::

## Tiles of their own

A tile in the list takes the [tile card's keys](/cards/tile-card#reference), without `type`, `grid_options` and `vertical`: its kind, its visual, its controls, its status and its badges. The group sets nothing on its tiles but their layout, so a tile looks the same in a group as on its own; what several tiles share is written on each (in YAML, an anchor writes it once: `visual: &spark { … }`, then `visual: *spark`).

::: live

```yaml
type: custom:tile-group-card-pro
title: Living room
icon: mdi:sofa
tiles:
  - entity: light.living_room
    control: slider
  - entity: sensor.living_room_co2
    visual: &day { type: sparkline, hours: 12 }
    status_badge: true
  - entity: sensor.kitchen_humidity
    visual: *day
  - climate.living_room
  - entity: media_player.living_room_speaker
  - entity: sensor.living_room_temperature
    name: Temperature
    badges:
      - sensor.living_room_humidity
```

:::

## Visibility

A tile's `visibility` shows it only while its [conditions](/guide/visibility) hold; the others keep their places. With every tile hidden and nothing in the header, the card takes no room.

::: live

```yaml
type: custom:tile-group-card-pro
title: Kitchen
icon: mdi:silverware-fork-knife
tiles:
  - light.kitchen
  - entity: switch.coffee_machine
    visibility:
      - { condition: state, entity: light.kitchen, state: "on" }
  - binary_sensor.window_kitchen
```

:::

## Examples

### History

Each tile picks its own visual of the last hours below its line: a `sparkline` of the temperature, `columns` of the power, a `strip` of when the motion sensor saw someone, a `bar` of the battery between `min` and `max`. Each one names its window: `hours`, and `bucket`, the time each column and each block of the strip stands for.

::: live

```yaml
type: custom:tile-group-card-pro
title: Last 12 hours
icon: mdi:chart-line
tiles:
  - { entity: sensor.living_room_temperature, name: Temperature, visual: { type: sparkline, hours: 12 } }
  - { entity: sensor.power_consumption, name: Power, visual: { type: columns, hours: 12, bucket: 15 } }
  - { entity: binary_sensor.motion_hallway, name: Hallway motion, visual: { type: strip, hours: 12, bucket: 15 } }
  - { entity: sensor.battery_soc, name: Battery, visual: bar }
```

:::

### Rooms in a row

`visual: sparkline` gives each vertical tile its line, under the name and the value: one temperature per room, side by side.

::: live

```yaml
type: custom:tile-group-card-pro
layout: row
title: Temperatures
icon: mdi:thermometer
tiles:
  - { entity: sensor.living_room_temperature, name: Living room, visual: sparkline }
  - { entity: sensor.bedroom_temperature, name: Bedroom, visual: sparkline }
  - { entity: sensor.office_temperature, name: Office, visual: sparkline }
```

:::

### Gauges

`visual: gauge` draws the value on a dial between `min` and `max` below the line, in the colour of the matching rule (or of the kind's own levels).

::: live

```yaml
type: custom:tile-group-card-pro
layout: row
title: Air
icon: mdi:air-filter
tiles:
  - { entity: sensor.living_room_co2, name: CO₂, visual: gauge, min: 400, max: 2000 }
  - { entity: sensor.living_room_humidity, name: Humidity, visual: gauge }
  - { entity: sensor.living_room_pm25, name: PM2.5, visual: gauge, min: 0, max: 100 }
```

:::

### Batteries

`icon: { ring: true }` on a tile puts the value as a ring around its icon, filled from `min` to `max` (0 to 100 % by default); the battery's rules colour it by the charge. `visual: false` leaves out the batteries' segments, so each tile keeps to one row.

::: live

```yaml
type: custom:tile-group-card-pro
title: Batteries
icon: mdi:battery-heart-variant
tiles:
  - { entity: sensor.phone_battery, name: Phone, icon: { ring: true }, visual: false }
  - { entity: sensor.robot_battery, name: Robot vacuum, icon: { ring: true }, visual: false }
  - { entity: sensor.smoke_detector_battery, name: Smoke detector, icon: { ring: true }, visual: false }
  - { entity: sensor.remote_battery, name: Remote, icon: { ring: true }, visual: false }
```

:::

### The kinds' visuals

A tile draws its kind's visual below its line by default: the sun's day with its position now, today's solar production, the lines of a trend's series.

::: live

```yaml
type: custom:tile-group-card-pro
title: Today
icon: mdi:calendar-today
tiles:
  - sun.sun
  - { entity: sensor.solar_power, kind: solar, name: Solar }
  - kind: trend
    name: Temperatures
    series:
      - { entity: sensor.outdoor_temperature, name: Outside, color: orange }
      - { entity: sensor.dew_point, name: Dew point, color: teal }
```

:::

### Lights

A row of lights, each one switched by a tap on its tile (`tap_action: toggle`); a hold still opens it. The header counts the ones on.

::: live

```yaml
type: custom:tile-group-card-pro
layout: row
title: Lights
icon: mdi:lightbulb-group
badges:
  - { entity: group.downstairs_lights, visual: count }
tiles:
  - { entity: light.living_room, tap_action: toggle }
  - { entity: light.kitchen, tap_action: toggle }
  - { entity: light.dining_table, tap_action: toggle }
  - { entity: light.hallway, tap_action: toggle }
  - { entity: light.desk_lamp, tap_action: toggle }
  - { entity: light.bedroom, tap_action: toggle }
```

:::

### Who is home

People as a row: their picture in the icon, the zone they are in on its badge, and Home or Away under the name.

::: live

```yaml
type: custom:tile-group-card-pro
layout: row
title: Family
icon: mdi:home-account
tiles:
  - person.malte
  - person.sam
  - person.kim
```

:::

### Outside

The kinds do the work: the weather's condition and its next hours, the wind's direction and gusts, the rain's total today, the sun's next event. The header carries the temperature and the humidity.

::: live

```yaml
type: custom:tile-group-card-pro
title: Outside
icon: mdi:tree
badges:
  - sensor.outdoor_temperature
  - sensor.outdoor_humidity
tiles:
  - { entity: weather.home, name: Weather }
  - { entity: sensor.wind_speed, name: Wind }
  - { entity: sensor.rain_rate, name: Rain }
  - sun.sun
  - { entity: sensor.outdoor_aqi, name: Air quality, status_badge: true }
```

:::

### Energy

The energy kinds are named on each tile (`kind`): the solar power and today's production, the grid importing or exporting in its colours, the home battery with its segments, the car's charge and range. The header gives the price and today's use.

::: live

```yaml
type: custom:tile-group-card-pro
title: Energy
icon: mdi:lightning-bolt
badges:
  - sensor.electricity_price
  - sensor.energy_today
tiles:
  - { entity: sensor.solar_power, kind: solar, name: Solar }
  - { entity: sensor.grid_power, kind: grid, name: Grid, status_badge: true }
  - { entity: sensor.battery_soc, name: Battery }
  - { entity: sensor.ev_battery, kind: car, name: EV }
```

:::

### Appliances

Each tile names its appliance as its `kind`, and its icon moves while it runs.

::: live

```yaml
type: custom:tile-group-card-pro
title: Utility room
icon: mdi:washing-machine
tiles:
  - { entity: sensor.washer_power, kind: washer, name: Washer }
  - { entity: sensor.dryer_power, kind: dryer, name: Dryer }
  - { entity: sensor.heat_pump_power, kind: heat_pump, name: Heat pump }
```

:::

### Thermostats

Every thermostat with its stepper at the end of the line, and Home Assistant's badge on its icon while it heats or cools.

::: live

```yaml
type: custom:tile-group-card-pro
title: Heating
icon: mdi:radiator
badges:
  - sensor.outdoor_temperature
tiles:
  - { entity: climate.living_room, name: Living room }
  - { entity: climate.bedroom, name: Bedroom }
  - { entity: climate.office, name: Office }
```

:::

### Scenes

A row of scenes, each one run by a tap on its tile (a scene's toggle turns it on), without their value (`show_value: false`: a scene's state says nothing).

::: live

```yaml
type: custom:tile-group-card-pro
layout: row
title: Scenes
icon: mdi:palette
tiles:
  - { entity: scene.bright, tap_action: toggle, show_value: false }
  - { entity: scene.dimmed, tap_action: toggle, show_value: false }
  - { entity: scene.dinner, tap_action: toggle, show_value: false }
  - { entity: scene.movie_night, tap_action: toggle, show_value: false }
  - { entity: scene.good_night, tap_action: toggle, show_value: false }
```

:::

### Security

The doors' locks (held on their icon to lock or unlock), the alarm and the windows; a window's tile shows only while it is open.

::: live

```yaml
type: custom:tile-group-card-pro
title: Security
icon: mdi:shield-home
badges:
  - binary_sensor.motion_hallway
tiles:
  - lock.front_door
  - lock.back_door
  - alarm_control_panel.home
  - entity: binary_sensor.window_kitchen
    visibility:
      - { condition: state, entity: binary_sensor.window_kitchen, state: "on" }
  - entity: binary_sensor.window_bedroom
    visibility:
      - { condition: state, entity: binary_sensor.window_bedroom, state: "on" }
```

:::

## The visual editor

Home Assistant's card editor shows a form for the group: its title, icon, layout and title tap, and below them its tiles, one tab each. A tile is edited in the tile card's own form, with everything it offers; **+** adds a tile, and the buttons over a tile move, duplicate or delete it. The header's badges stay in the YAML. Try it in the [Playground](/playground), or with **Edit** under any example.

## Reference

### Card options

| Option             | Default | Description                                                                                                                                          |
| ------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tiles`            |         | Entity ids or tiles: the [tile card's keys](/cards/tile-card#reference) without `type`, `grid_options` and `vertical`, plus `visibility` (required). |
| `layout`           | `list`  | `list`: the tiles one under the other. `row`: vertical tiles side by side, wrapping when narrow. The layout decides every tile's `vertical`.         |
| `title`            |         | Header text. Template allowed.                                                                                                                       |
| `icon`             |         | Header icon. Template allowed.                                                                                                                       |
| `title_tap_action` | none    | Action when the title or its icon is tapped; see [Actions](/cards/entity-options#actions).                                                           |
| `badges`           |         | Badges at the end of the title line, plain and small unless they say otherwise; the [heading card's badge keys](/cards/heading-card#badge-options).  |

The group sets nothing on its tiles but their layout: any other key on the card is a config error that names its place (each tile).

### Grid defaults

`rows: auto`; a `list` is 6 columns wide (a tile's width), a `row` 12. The sections grid will not shrink either below 6 columns. See [Sizing in sections](/guide/sizing).

### Home Assistant options

Like every card, this one also accepts `grid_options`, `visibility`, `layout_options`, `view_layout` and `card_mod`. They are passed through to Home Assistant; see [Sizing in sections](/guide/sizing) for `grid_options`. The card's own `visibility` hides the whole card; a tile's hides that tile, see [Visibility](/guide/visibility).
