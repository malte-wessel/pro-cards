# Tile Group Card Pro

`custom:tile-group-card-pro` puts several tiles on one card, under a header with a title, an icon and badges. The tiles are [tile cards](/cards/tile-card) drawn flat on the group's surface, so everything a tile does works the same in a group: its poster type, its controls, its status and its badges.

::: info Beta
The tile group card is new in 3.0 and in beta: its options may still change.
:::

## Basic

The type and a list of entities. Each one becomes a tile, one under the other.

::: live

```yaml
type: custom:tile-group-card-pro
entities:
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
entities:
  - light.kitchen
  - switch.coffee_machine
  - vacuum.robot
```

:::

## Row

`layout: row` draws vertical tiles side by side: the icon on top, the name and the line under it, the controls under them. The tiles share the width in columns alike, as wide as the widest tile needs: a tile with wide controls (a cover's buttons) asks for more. A card too narrow for all of them wraps, and a line that is not full keeps the columns' width.

::: live

```yaml
type: custom:tile-group-card-pro
layout: row
title: Living room
icon: mdi:sofa
badges:
  - sensor.living_room_temperature
entities:
  - light.living_room
  - light.bedroom
  - lock.front_door
```

:::

## Defaults for every tile

Every key the card does not take itself is a default for every tile; a tile's own value wins. The card's own keys are `layout`, `title`, `icon`, `title_tap_action`, `badges` and `entities` (and Home Assistant's), so `icon` and `badges` on the card are the header's.

::: live

```yaml
type: custom:tile-group-card-pro
title: Climate
icon: mdi:home-thermometer
visual: sparkline
hours_to_show: 12
entities:
  - sensor.living_room_temperature
  - { entity: sensor.living_room_co2, status_badge: true }
  - { entity: sensor.kitchen_humidity, visual: none }
```

:::

## Tiles of their own

An entity in the list can be a tile: the [tile card's keys](/cards/tile-card#reference) without `type` and `grid_options`. Its controls, badges and pictures are a tile's.

::: live

```yaml
type: custom:tile-group-card-pro
title: Living room
icon: mdi:sofa
entities:
  - entity: light.living_room
    control: slider
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
entities:
  - light.kitchen
  - entity: switch.coffee_machine
    visibility:
      - { condition: state, entity: light.kitchen, state: "on" }
  - binary_sensor.window_kitchen
```

:::

## Examples

### History

Each tile picks its own picture of the last hours below its line: a `sparkline` of the temperature, `columns` of the power, a `strip` of when the motion sensor saw someone, a `bar` of the battery between `min` and `max`. `hours_to_show` on the card sets the window for all of them, `bucket_minutes` the time each column and each block of the strip stands for.

::: live

```yaml
type: custom:tile-group-card-pro
title: Last 12 hours
icon: mdi:chart-line
hours_to_show: 12
bucket_minutes: 15
entities:
  - { entity: sensor.living_room_temperature, name: Temperature, visual: sparkline }
  - { entity: sensor.power_consumption, name: Power, visual: columns }
  - { entity: binary_sensor.motion_hallway, name: Hallway motion, visual: strip }
  - { entity: sensor.battery_soc, name: Battery, visual: bar }
```

:::

### Rooms in a row

`visual: sparkline` on the card gives every vertical tile its line, under the name and the value: one temperature per room, side by side.

::: live

```yaml
type: custom:tile-group-card-pro
layout: row
title: Temperatures
icon: mdi:thermometer
visual: sparkline
entities:
  - { entity: sensor.living_room_temperature, name: Living room }
  - { entity: sensor.bedroom_temperature, name: Bedroom }
  - { entity: sensor.office_temperature, name: Office }
```

:::

### Gauges

`visual: gauge` draws the value on a dial between `min` and `max` below the line, in the colour of the matching rule (or of the type's own levels).

::: live

```yaml
type: custom:tile-group-card-pro
layout: row
title: Air
icon: mdi:air-filter
visual: gauge
entities:
  - { entity: sensor.living_room_co2, name: CO₂, min: 400, max: 2000 }
  - { entity: sensor.living_room_humidity, name: Humidity }
  - { entity: sensor.living_room_pm25, name: PM2.5, min: 0, max: 100 }
```

:::

### Batteries

`icon_ring: true` puts the value as a ring around every icon, filled from `min` to `max` (0 to 100 % by default); the battery types colour it by their charge.

::: live

```yaml
type: custom:tile-group-card-pro
title: Batteries
icon: mdi:battery-heart-variant
icon_ring: true
entities:
  - { entity: sensor.phone_battery, name: Phone }
  - { entity: sensor.robot_battery, name: Robot vacuum }
  - { entity: sensor.smoke_detector_battery, name: Smoke detector }
  - { entity: sensor.remote_battery, name: Remote }
```

:::

### The types' pictures

`show_picture: true` draws what a poster type draws below its line: the sun's day with its position now, today's solar production, the lines of a trend's series.

::: live

```yaml
type: custom:tile-group-card-pro
title: Today
icon: mdi:calendar-today
show_picture: true
entities:
  - sun.sun
  - { entity: sensor.solar_power, poster: solar, name: Solar }
  - poster: trend
    name: Temperatures
    series:
      - { entity: sensor.outdoor_temperature, name: Outside, color: orange }
      - { entity: sensor.dew_point, name: Dew point, color: teal }
```

:::

### Lights

A row of lights, each one switched by a tap on its tile (`tap_action: toggle` for every tile); a hold still opens it. The header counts the ones on.

::: live

```yaml
type: custom:tile-group-card-pro
layout: row
title: Lights
icon: mdi:lightbulb-group
badges:
  - { entity: group.downstairs_lights, visual: count }
tap_action: toggle
entities:
  - light.living_room
  - light.kitchen
  - light.dining_table
  - light.hallway
  - light.desk_lamp
  - light.bedroom
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
entities:
  - person.malte
  - person.sam
  - person.kim
```

:::

### Outside

The poster types do the work: the weather's condition, the wind's direction and gusts, the rain's total today, the sun's next event. The header carries the temperature and the humidity.

::: live

```yaml
type: custom:tile-group-card-pro
title: Outside
icon: mdi:tree
badges:
  - sensor.outdoor_temperature
  - sensor.outdoor_humidity
entities:
  - { entity: weather.home, name: Weather }
  - { entity: sensor.wind_speed, name: Wind }
  - { entity: sensor.rain_rate, name: Rain }
  - sun.sun
  - { entity: sensor.outdoor_aqi, name: Air quality, status_badge: true }
```

:::

### Energy

The energy types are named on each tile (`poster`): the solar power and today's yield, the grid importing or exporting in its colours, the home battery, the car's charge and range. The header gives the price and today's use.

::: live

```yaml
type: custom:tile-group-card-pro
title: Energy
icon: mdi:lightning-bolt
badges:
  - sensor.electricity_price
  - sensor.energy_today
entities:
  - { entity: sensor.solar_power, poster: solar, name: Solar }
  - { entity: sensor.grid_power, poster: grid, name: Grid, status_badge: true }
  - { entity: sensor.battery_soc, name: Battery }
  - { entity: sensor.ev_battery, poster: car, name: EV }
```

:::

### Appliances

`poster: appliance` on the card makes every tile an appliance; each one names its own `variant`, and its icon moves while it runs.

::: live

```yaml
type: custom:tile-group-card-pro
title: Utility room
icon: mdi:washing-machine
poster: appliance
entities:
  - { entity: sensor.washer_power, variant: washer, name: Washer }
  - { entity: sensor.dryer_power, variant: dryer, name: Dryer }
  - { entity: sensor.heat_pump_power, variant: heat_pump, name: Heat pump }
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
entities:
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
tap_action: toggle
show_value: false
entities:
  - scene.bright
  - scene.dimmed
  - scene.dinner
  - scene.movie_night
  - scene.good_night
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
entities:
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

## Reference

### Card options

| Option             | Default | Description                                                                                                                                         |
| ------------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entities`         |         | Entity ids or tiles: the [tile card's keys](/cards/tile-card#reference) without `type` and `grid_options`, plus `visibility` (required).            |
| `layout`           | `list`  | `list`: the tiles one under the other. `row`: vertical tiles side by side, wrapping when narrow.                                                    |
| `title`            |         | Header text. Template allowed.                                                                                                                      |
| `icon`             |         | Header icon. Template allowed.                                                                                                                      |
| `title_tap_action` | none    | Action when the title or its icon is tapped; see [Actions](/cards/entity-options#actions).                                                          |
| `badges`           |         | Badges at the end of the title line, plain and small unless they say otherwise; the [heading card's badge keys](/cards/heading-card#badge-options). |
| any tile key       |         | A default for every tile (`status_badge`, `tap_action`, `hours_to_show`, `visual` …); a tile's own value wins.                                      |

### Grid defaults

`rows: auto`; a `list` is 6 columns wide (a tile's width), a `row` 12. The sections grid will not shrink either below 6 columns. See [Sizing in sections](/guide/sizing).

### Home Assistant options

Like every card, this one also accepts `grid_options`, `visibility`, `layout_options`, `view_layout` and `card_mod`. They are passed through to Home Assistant; see [Sizing in sections](/guide/sizing) for `grid_options`. The card's own `visibility` hides the whole card; a tile's hides that tile, see [Visibility](/guide/visibility).
