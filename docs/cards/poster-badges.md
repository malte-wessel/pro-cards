# Badges

The top right of a [poster](/cards/poster-card) is its corner: a column of small badges, the first of them the poster's own status. A badge shows another entity beside the poster's subject, an attribute of the poster's entity, or a value of your own, and takes its own taps. This page shows what a badge can be, the status badge and how the corner fits the poster.

## Badges in the corner

`badges` lists the corner's badges in the order written, under the status badge. A badge is an entity id, or an object with the keys of [header badges](/cards/heading-card#badge-options): `entity`, its own `value` or `attribute`, `icon`, `name`, `rules`, the [badge keys](#badge-keys) below, actions and `visibility`. They are outline pills, small, unless a `style` or `size` says otherwise. A badge without `entity` on a poster with one reads [the poster's entity](#badges-reading-the-poster-s-entity); on a poster without one it needs a `value`.

::: live

```yaml
- type: custom:poster-card-pro
  name: Downstairs
  icon: mdi:home-floor-g
  value: "{{ states('sensor.living_room_temperature') }}"
  unit: °C
  status: { value: "{{ 'Lights on' if is_state('light.living_room', 'on') else 'Dark' }}", style: soft }
  badges:
    - sensor.living_room_humidity
    - { entity: sensor.living_room_co2, icon: mdi:molecule-co2 }
    - entity: binary_sensor.window_kitchen
      rules:
        - { state: "on", color: red, icon: mdi:window-open, label: Open }
        - { state: "off", color: green, icon: mdi:window-closed, label: Closed }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.ev_battery
  name: Car
  icon: mdi:car-electric
  poster: entity
  status: false
  badges:
    - { visual: ring, show_icon: false }
    - { entity: sensor.ev_range, icon: mdi:map-marker-distance }
    - { value: "{{ states('number.ev_charge_limit') }} %", icon: mdi:battery-lock, name: Limit }
  grid_options: { columns: 6 }
```

:::

## Badge keys

A badge in the corner takes the keys of a header badge, as on the [heading card](/cards/heading-card#badges). The sections below show each on a poster.

### Visuals

`visual` changes what a badge draws: `ring` puts a progress ring around the icon and `bar` a short bar before the value (both on `min` and `max`), `sparkline` draws the history in the icon's place, `trend` adds how much the value changed over `trend_hours`, `count` shows how many members of a group are on and `dot` is a coloured dot instead of the icon. `show_name: true` writes the name before the value; `show_value: false` leaves the icon alone.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.power_consumption
  name: Home
  badges:
    - { entity: sensor.battery_soc, visual: ring, icon: mdi:home-battery }
    - { entity: sensor.ev_battery, visual: bar, icon: mdi:car-electric }
    - { entity: sensor.solar_power, visual: sparkline, format: power }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.living_room_temperature
  name: Living room
  badges:
    - { entity: sensor.outdoor_temperature, visual: trend, icon: mdi:home-export-outline }
    - { entity: group.downstairs_lights, visual: count, name: Lights, show_name: true }
    - { entity: binary_sensor.window_kitchen, visual: dot, name: Window, show_name: true, show_value: false }
  grid_options: { columns: 6 }
```

:::

### Styles and sizes

`style` sets the pill: `outline` (the default, Home Assistant's badge), `soft` (a tint of the badge's colour), `filled`, `plain` (no pill, the icon and the value alone) or `tag` (an outline in the badge's colour with the text in small capitals, the status badge's pill). `size` sets its height: `s` (the default in the corner), `m` or `l`. A rule's `style` changes the pill while it matches.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.kitchen_temperature
  name: Kitchen
  badges:
    - { entity: sensor.kitchen_humidity, style: outline }
    - { entity: light.kitchen, style: soft }
    - { entity: lock.front_door, style: filled }
    - { entity: sensor.outdoor_temperature, style: plain }
    - { entity: binary_sensor.window_kitchen, style: tag }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.kitchen_temperature
  name: Kitchen
  status: false
  badges:
    - { entity: sensor.kitchen_humidity, size: s }
    - { entity: sensor.kitchen_humidity, size: m }
    - { entity: sensor.kitchen_humidity, size: l }
  grid_options: { columns: 6 }
```

:::

### Format and staleness

`format` writes the value another way: `power` switches between W, kW and MW, `duration` writes a time span, `relative` a date as its time from now. `stale_after` greys a badge whose entity has not reported for that long and adds how long ago it did: minutes, or a number with `s`, `min`, `h` or `d`.

::: live

```yaml
type: custom:poster-card-pro
entity: sensor.washer_status
name: Laundry
icon: mdi:washing-machine
badges:
  - { entity: sensor.washer_power, format: power, icon: mdi:flash }
  - { entity: sensor.washer_remaining, format: duration }
  - { entity: sensor.dishwasher_finishes, format: relative, icon: mdi:dishwasher }
  - { entity: sensor.weather_station_battery, stale_after: 2h }
```

:::

### A switch in a badge

`control: toggle` puts a switch into the badge, the only control a badge holds; the badge itself keeps its action.

::: live

```yaml
type: custom:poster-card-pro
entity: sensor.kitchen_temperature
name: Kitchen
badges:
  - { entity: switch.coffee_machine, name: Coffee, show_name: true, show_value: false, control: toggle }
  - { entity: light.kitchen, name: Light, show_name: true, show_value: false, control: toggle }
```

:::

### Actions and visibility

A badge takes its own taps: `tap_action`, `hold_action` and `double_tap_action` on the badge act on its entity ([Actions](/cards/entity-options#actions)), here a toggle of the light. A badge without them takes the poster's, more-info by default. `visibility` shows a badge only while its conditions hold, here the open windows; a hidden badge takes no room.

::: live

```yaml
type: custom:poster-card-pro
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
```

:::

## Badges reading the poster's entity

A badge without `entity` reads the poster's own: `attribute` shows one of its attributes (a weather attribute keeps its unit), and a badge with neither shows the poster's value again, say as a ring.

::: live

```yaml
- type: custom:poster-card-pro
  entity: weather.home
  attribute: temperature
  name: Outside
  icon: mdi:thermometer
  badges:
    - { attribute: humidity, icon: mdi:water-percent }
    - { attribute: wind_speed, icon: mdi:weather-windy }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.ev_battery
  name: Car
  icon: mdi:car-electric
  badges:
    - { visual: ring, show_icon: false }
    - binary_sensor.ev_plugged
    - sensor.ev_range
  grid_options: { columns: 6 }
```

:::

## The status badge

The poster's own label is a badge too: the **status badge**, first in the corner. It is a `tag` (an outline in the poster's colour with its text in small capitals, without an icon) and says the poster type's status, else the matching rule's label; with nothing to say it takes no room. The poster's rules set its `style` and make it `pulse`.

`status` gives it a text (a template allowed), an object of badge keys (with `value` for its text), or `false` to drop it. `status` in `badges` places it elsewhere:

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.ev_battery
  name: Car
  icon: mdi:car-electric
  rules:
    - { below: 20, color: red, label: Low }
    - { above: 20, color: green, label: Ready }
  status: { style: soft, icon: mdi:battery }
  badges:
    - entity: binary_sensor.ev_plugged
      rules:
        - { state: "on", color: green, icon: mdi:power-plug, label: Plugged in }
        - { state: "off", color: grey, icon: mdi:power-plug-off, label: Unplugged }
    - sensor.ev_range
    - status
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.dishwasher_status
  name: Dishwasher
  icon: mdi:dishwasher
  value: "{{ states('sensor.dishwasher_status') | replace('end', 'Done') | replace('run', 'Running') }}"
  status: false
  badges:
    - { entity: sensor.dishwasher_finishes, format: relative, icon: mdi:timer-outline }
  grid_options: { columns: 6 }
```

:::

## How the corner behaves

The corner floats over the poster's top right: the badges take no height from the name, the value or the picture, so adding one never moves the texts. Many badges reach down over the right of the picture, as on the power poster. Where the poster has controls on the value's line, the corner stops above them: on a short card the badges that do not fit there are cut off and the controls keep their room, as on the light two rows high.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.power_consumption
  name: Power
  visual: sparkline
  badges:
    - sensor.solar_power
    - sensor.battery_power
    - sensor.grid_power
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: light.living_room
  status: false
  badges:
    - sensor.living_room_temperature
    - sensor.living_room_humidity
    - sensor.living_room_co2
    - sensor.living_room_pm25
  grid_options: { columns: 6, rows: 2 }
```

:::

## Reference

### Badge keys

A badge is an entity id, `status` (the status badge's place), or an object with these keys and the [entity options](/cards/entity-options#entity-options) (`name`, `icon`, `color`, `unit`, `decimals`, `prefix`, `suffix`, `min`, `max`, `show_entity_picture`, `hover` …); the [heading card's badge options](/cards/heading-card#badge-options) have the full list.

| Key                                      | Default             | Description                                                                                         |
| ---------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------- |
| `entity`                                 | the poster's        | The entity; without one the badge reads the poster's entity, or needs a `value`.                    |
| `attribute`, `value`                     | the poster's value  | An attribute of the entity, or a text or a template of your own.                                    |
| `visual`                                 | `icon`              | `icon`, `ring`, `bar`, `sparkline`, `trend`, `count` or `dot`.                                      |
| `style`                                  | `outline`           | `outline`, `soft`, `filled`, `plain` or `tag`.                                                      |
| `size`                                   | `s`                 | `s`, `m` or `l`.                                                                                    |
| `show_name` / `show_value` / `show_icon` | false / true / true | What the badge shows.                                                                               |
| `format`                                 | `auto`              | `auto`, `power`, `duration` or `relative`.                                                          |
| `stale_after`                            | –                   | Grey with its age when the entity has not reported for this long: minutes, or `90s`, `30min`, `2h`. |
| `trend_hours`                            | `1`                 | `trend`: the hours the change is measured over.                                                     |
| `control`                                | –                   | `toggle`: a switch in the badge.                                                                    |
| `rules`                                  | –                   | Colour, icon and label by value or state; a rule's `style` changes the pill, `pulse: true` pulses.  |
| `tap_action` …                           | the poster's        | `tap_action`, `hold_action`, `double_tap_action`, on the badge's own entity.                        |
| `visibility`                             | –                   | Conditions; a hidden badge takes no room.                                                           |

On the poster, `status` sets the status badge: a text or a template, an object of these keys with `value` for its text, or `false`.
