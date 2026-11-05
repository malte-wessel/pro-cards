# Badges

A [tile](/cards/tile-card) can carry small badges at the end of its first row, centred on its icon. A badge shows another entity, an attribute of the tile's entity, or a value of your own, and takes its own taps. The status can be the first of them, and the icon carries a badge of its own.

## Badges on a tile

`badges` lists the badges in order. A badge is an entity id, or an object with the [badge keys](#badge-keys). Badges are small outline pills by default. A badge without `entity` reads [the tile's entity](#badges-reading-the-tile-s-entity). On a tile without an entity, it needs a `value`.

The badges always show, all of them. The name and the line give way beside them; see [How the badges fit](#how-the-badges-fit).

::: live

```yaml
- type: custom:tile-card-pro
  name: Downstairs
  icon: mdi:home-floor-g
  value: "{{ states('sensor.living_room_temperature') }}"
  unit: °C
  badges:
    - sensor.living_room_humidity
    - entity: binary_sensor.window_kitchen
      rules:
        - { state: "on", color: red, icon: mdi:window-open, value: Open }
        - { state: "off", color: green, icon: mdi:window-closed, value: Closed }
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: sensor.ev_battery
  name: Car
  icon: mdi:car-electric
  kind: none
  status: false
  badges:
    - { icon: { ring: true } }
    - { entity: sensor.ev_range, icon: mdi:map-marker-distance }
  grid_options: { columns: 12 }
```

:::

## Badge keys

A badge is written as the tile is, with the keys of a [poster's badge](/cards/poster-badges#badge-keys): an `icon` place, a `visual` after the value, `rules` and its entity's kind, in a pill that holds the icon, the name, the value, the visual and a switch. The sections below show them on a tile, and the [reference](#reference) lists them all.

### The icon and the visual

`icon` is an icon's name, `{ type: image }` (a picture), `{ type: dot }` (a dot in the badge's colour), `{ ring: true }` (a ring of the value around the icon), or `false`. `visual` draws `bar`, `sparkline` or `trend` after the value; a sparkline looks back 24 hours and a trend one, unless `hours` says another window (`{ type: trend, hours: 6 }`).

`show_name: true` writes the name before the value. `show_value: false` shows the icon alone.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.power_consumption
  name: Home
  badges:
    - { entity: sensor.battery_soc, icon: { name: mdi:home-battery, ring: true } }
    - { entity: sensor.solar_power, visual: sparkline, format: power }
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: sensor.living_room_temperature
  name: Living room
  badges:
    - { entity: sensor.outdoor_temperature, visual: { type: trend, hours: 6 }, icon: mdi:home-export-outline }
    - entity: group.downstairs_lights
      name: Lights
      show_name: true
      value: "{{ expand('group.downstairs_lights') | selectattr('state', 'eq', 'on') | list | count }}"
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: sensor.kitchen_temperature
  name: Kitchen
  badges:
    - { entity: binary_sensor.window_kitchen, icon: { type: dot }, name: Window, show_name: true, show_value: false }
  grid_options: { columns: 12 }
```

:::

### Colours and kinds

A badge takes its entity's kind as the tile does, but only its colours: a battery red when it runs low, air quality by its bands, a light in its own colour, a thermostat warm while it heats. Its value stays the number. `kind: none` leaves it out, and the badge's own `rules` replace the kind's. `color` and `icon` on a badge are defaults: a matching rule's win.

::: live

```yaml
type: custom:tile-card-pro
entity: sensor.living_room_temperature
name: Living room
badges:
  - sensor.smoke_detector_battery
  - sensor.office_co2
  - light.living_room
grid_options: { columns: 12 }
```

:::

### Styles and sizes

`style` sets the pill:

- `outline`: Home Assistant's badge, the default.
- `soft`: a tint of the badge's colour.
- `filled`: the badge's colour.
- `plain`: only the icon and the value; its pill draws nothing, but keeps its padding and shape, so it lines up with the others and its hover is a pill.
- `tag`: an outline in the badge's colour, with the text in that colour.

`size` sets its height: `s` (the default), `m` or `l`. A rule's `style` changes the pill while the rule matches. A badge taller than the name's line reaches above and below it, so it never makes the tile taller.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.kitchen_temperature
  name: Kitchen
  badges:
    - { entity: sensor.kitchen_humidity, style: outline }
    - { entity: light.kitchen, style: soft }
    - { entity: lock.front_door, style: filled }
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: sensor.kitchen_temperature
  name: Kitchen
  badges:
    - { entity: sensor.outdoor_temperature, style: plain }
    - { entity: binary_sensor.window_kitchen, style: tag }
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: sensor.kitchen_temperature
  name: Kitchen
  badges:
    - { entity: sensor.kitchen_humidity, size: s }
    - { entity: sensor.kitchen_humidity, size: m }
    - { entity: sensor.kitchen_humidity, size: l }
  grid_options: { columns: 12 }
```

:::

### Format and staleness

`format` writes the value another way:

- `power` switches between W, kW and MW.
- `duration` writes a time span.
- `relative` writes a date as its time from now.

`stale_after` greys a badge whose entity has not reported for that long, and adds how long ago it did. Give minutes, or a number with `s`, `min`, `h` or `d`.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.washer_status
  name: Laundry
  icon: mdi:washing-machine
  badges:
    - { entity: sensor.washer_power, format: power, icon: mdi:flash }
    - { entity: sensor.washer_remaining, format: duration }
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: sensor.dishwasher_status
  name: Dishes
  icon: mdi:dishwasher
  badges:
    - { entity: sensor.dishwasher_finishes, format: relative, icon: mdi:timer-outline }
    - { entity: sensor.weather_station_battery, stale_after: 2h }
  grid_options: { columns: 12 }
```

:::

### A switch in a badge

`control: toggle` puts a switch at the end of the badge; the badge itself keeps its own action. A switch is the one control a badge holds.

::: live

```yaml
type: custom:tile-card-pro
entity: sensor.kitchen_temperature
name: Kitchen
badges:
  - { entity: switch.coffee_machine, name: Coffee, show_name: true, show_value: false, control: toggle }
  - { entity: light.kitchen, name: Light, show_name: true, show_value: false, control: toggle }
grid_options: { columns: 12 }
```

:::

### Actions and visibility

A badge takes its own taps. `tap_action`, `hold_action` and `double_tap_action` act on the badge's entity ([Actions](/cards/entity-options#actions)): here a tap toggles the light. Without them, a badge with an entity of its own opens that one's more-info.

`visibility` shows a badge only while its conditions hold, here the open windows. A hidden badge takes no room.

::: live

```yaml
type: custom:tile-card-pro
entity: sensor.living_room_temperature
name: Living room
badges:
  - { entity: light.living_room, tap_action: { action: toggle } }
  - entity: binary_sensor.window_kitchen
    name: Kitchen
    show_name: true
    visibility:
      - { condition: state, state: "on" }
  - entity: binary_sensor.window_bedroom
    name: Bedroom
    show_name: true
    visibility:
      - { condition: state, state: "on" }
grid_options: { columns: 12 }
```

:::

## Badges reading the tile's entity

A badge without `entity` reads the tile's entity. `attribute` shows one of its attributes, with its unit. A badge with neither shows the tile's value again, say in a ring.

::: live

```yaml
- type: custom:tile-card-pro
  entity: weather.home
  name: Outside
  badges:
    - { attribute: humidity, icon: mdi:water-percent }
    - { attribute: wind_speed, icon: mdi:weather-windy }
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: sensor.ev_battery
  name: Car
  icon: mdi:car-electric
  badges:
    - { icon: { ring: true } }
    - binary_sensor.ev_plugged
  grid_options: { columns: 12 }
```

:::

## The status badge

The status is on the line after the value. `status_badge: true` makes it a badge instead, before the others: it always comes first. Its look is the tile's: a `tag` in the tile's colour, without an icon or a name. It shows the kind's status, else the matching rule's status, else the entity's state (a vacuum's Cleaning, a lock's Locked), even where that repeats the value: you asked for the badge. A rule's `style` and `pulse` apply to it.

`status` sets its text, on the line or as a badge:

- a text or a template;
- `false` to drop it, on the line and as a badge.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.living_room_co2
  name: CO₂
  status_badge: true
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.living_room_co2
  name: Air
  status: "{{ 'Stuffy' if states('sensor.living_room_co2') | int(0) > 700 else 'Fresh' }}"
  status_badge: true
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.ev_battery
  name: Car
  icon: mdi:car-electric
  rules:
    - { below: 20, color: red, status: Low }
    - { above: 20, color: green, status: Ready }
  status_badge: true
  badges:
    - sensor.ev_range
  grid_options: { columns: 12 }
```

:::

## The icon badge

The icon carries a small badge of its own, as on Home Assistant's tile: what a thermostat or a humidifier is doing (heating, cooling, drying …) in its colour, a person's zone, and an orange mark on an entity that is unavailable. It takes no room, and `icon: false` leaves it out with the icon.

::: live

```yaml
- type: custom:tile-card-pro
  entity: climate.living_room
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: person.malte
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: light.shed
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: person.sam
  grid_options: { columns: 6 }
```

:::

The icon's `badge` decides what it shows (`icon: { badge: … }`, beside the icon's other options): `auto` (the default) is Home Assistant's, `false` none at all, and `{ icon, color }` one of your own. Both take a template, and an icon that renders empty shows no badge, so a template can show it only when something needs a look. Without a colour, the badge takes the tile's. A rule sets it too, while it matches (`rules: [{ above: 1000, icon: { badge: { icon: mdi:window-open-variant } } }]`). Here a warning while the wind blows above 5 km/h (the demo's wind blows at 9), a window to open whatever the air, and a thermostat without its badge:

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.wind_speed
  name: Wind
  icon:
    badge:
      icon: "{{ 'mdi:alert' if states('sensor.wind_speed') | float(0) > 5 else '' }}"
      color: red
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.living_room_co2
  name: CO₂
  icon: { badge: { icon: mdi:window-open-variant } }
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: climate.living_room
  name: Heat
  icon: { badge: false }
  grid_options: { columns: 6 }
```

:::

## How the badges fit

The badges always show, all of them: nothing hides them or moves them elsewhere. The name and the line give way beside them, cut at their end, down to 24 px (40 px beside controls); controls at the end of the line move under it where even that does not fit. Where the badges are wider than that leaves them, the card's edge cuts the last one, as in the second tile below. That is for you to see and change: a shorter `name`, fewer badges, more columns. A badge that only shows sometimes (`visibility`, a status that only a rule gives) takes no room while it is away.

On a vertical tile, the badges are a row of their own at the top right, above the icon, and the tile takes a row more for them.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.living_room_co2
  status_badge: true
  badges:
    - sensor.living_room_temperature
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: sensor.living_room_co2
  status_badge: true
  badges:
    - sensor.living_room_temperature
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.living_room_co2
  name: CO₂
  vertical: true
  status_badge: true
  badges:
    - sensor.living_room_temperature
  grid_options: { columns: 6 }
```

:::

## Reference

### Card options

| Key            | Default    | Description                                                                                                                                                       |
| -------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `badges`       | –          | The badges at the end of the first row, in order, after the status badge.                                                                                         |
| `status`       | the kind's | The status: a text, a template, or `false`. Its look is the tile's: a tag in its colour.                                                                          |
| `status_badge` | `false`    | `true`: the status as the first badge, in place of on the line.                                                                                                   |
| `icon.badge`   | `auto`     | The badge on the icon (`icon: { badge: … }`): `auto` (Home Assistant's), `false`, or `{ icon, color }` of your own, each a text or a template. A rule may set it. |

### Badge keys

A badge is an entity id or an object with a [poster's badge keys](/cards/poster-badges#badge-keys): `entity`, `attribute`, `value`, `icon`, `visual`, `color`, `kind`, `style`, `size`, `show_name`, `show_value`, `format`, `stale_after`, `control`, `rules`, the actions and `visibility`. Without `entity`, a badge reads the tile's.
