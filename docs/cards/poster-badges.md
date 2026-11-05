# Badges

The top right of a [poster](/cards/poster-card) is its corner: a column of small badges. A badge shows another entity, an attribute of the poster's entity, or a value of your own. It takes its own taps.

## Badges in the corner

`badges` lists the badges in order, under the [status badge](#the-status-badge). A badge is an entity id, or an object with the [badge keys](#badge-keys). Badges are small outline pills by default. A badge without `entity` reads [the poster's entity](#badges-reading-the-poster-s-entity). On a poster without an entity, it needs a `value`.

::: live

```yaml
- type: custom:poster-card-pro
  name: Downstairs
  icon: mdi:home-floor-g
  value: "{{ states('sensor.living_room_temperature') }}"
  unit: °C
  status: "{{ 'Lights on' if is_state('light.living_room', 'on') else 'Dark' }}"
  badges:
    - sensor.living_room_humidity
    - { entity: sensor.living_room_co2, icon: mdi:molecule-co2 }
    - entity: binary_sensor.window_kitchen
      rules:
        - { state: "on", color: red, icon: mdi:window-open, value: Open }
        - { state: "off", color: green, icon: mdi:window-closed, value: Closed }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.ev_battery
  name: Car
  icon: mdi:car-electric
  kind: none
  status: false
  badges:
    - { icon: { ring: true } }
    - { entity: sensor.ev_range, icon: mdi:map-marker-distance }
    - { value: "{{ states('number.ev_charge_limit') }} %", icon: mdi:battery-lock, name: Limit }
  grid_options: { columns: 6 }
```

:::

## Badge keys

A badge is written as the poster is: an `icon` place, a `visual`, `rules` and its entity's kind. Its pill holds, in this order, the icon, the name, the value, the visual and a switch. The keys are the same on a [tile](/cards/tile-badges), a [tile group](/cards/tile-group-card) and a [heading card](/cards/heading-card#badges). The sections below show them on a poster, and the [reference](#reference) lists them all.

### The icon

`icon` is the badge's icon place:

- an icon's name (`mdi:…`, a template too);
- `{ type: image }`: the entity's picture, or `src` for another (an image URL, a template or an entity);
- `{ type: dot }`: a dot in the badge's colour in the icon's place;
- `{ ring: true }`: a ring of the value around the icon, between `min` and `max` (an image takes a ring too);
- `false`: no icon.

`show_name: true` writes the name before the value. `show_value: false` shows the icon alone.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.power_consumption
  name: Home
  badges:
    - { entity: sensor.battery_soc, icon: { name: mdi:home-battery, ring: true } }
    - { entity: person.malte, icon: { type: image }, show_name: true }
    - { entity: binary_sensor.window_kitchen, icon: { type: dot }, name: Window, show_name: true, show_value: false }
    - { entity: sensor.outdoor_temperature, icon: false }
  grid_options: { columns: 6 }
```

:::

### Visuals

`visual` draws something after the value:

- `bar`: a short bar of the value, between `min` and `max`.
- `sparkline`: the history, over the last 24 hours unless `hours` says another window (`{ type: sparkline, hours: 6 }`, or `today` since midnight).
- `trend`: how much the value changed over the last hour, or over `hours`.

How many of a group's members are on is a template: <code v-pre>value: "{{ expand('group.downstairs_lights') | selectattr('state', 'eq', 'on') | list | count }}"</code>.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.power_consumption
  name: Home
  badges:
    - { entity: sensor.ev_battery, visual: bar, icon: mdi:car-electric }
    - { entity: sensor.solar_power, visual: { type: sparkline, hours: 12 }, format: power }
    - { entity: sensor.outdoor_temperature, visual: { type: trend, hours: 6 }, icon: mdi:home-export-outline }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.living_room_temperature
  name: Living room
  badges:
    - entity: group.downstairs_lights
      name: Lights
      show_name: true
      value: "{{ expand('group.downstairs_lights') | selectattr('state', 'eq', 'on') | list | count }}"
  grid_options: { columns: 6 }
```

:::

### Colours and kinds

A badge takes its entity's [kind](/cards/poster-types) as a poster does, but only its colours: a battery red when it runs low, carbon dioxide, particles and air quality by their bands, the wind and the rain by their speed, a light in its own colour, a thermostat warm while it heats. A kind that calls for attention pulses its badge too (a jammed lock, hazardous air). The value stays the number; the kind's words are the poster's status. A badge that shows an attribute or a value of its own reads no kind's thresholds. `kind` names one for an entity the poster cannot tell (`kind: battery` on a sensor without a device class), `kind: none` leaves it out (Home Assistant's own state colour stays: a low battery is red either way), and the badge's own `rules` replace the kind's.

`color` and `icon` on a badge are defaults, as on the poster: a matching rule's win.

::: live

```yaml
type: custom:poster-card-pro
entity: sensor.living_room_temperature
name: Living room
badges:
  - sensor.smoke_detector_battery
  - sensor.office_co2
  - light.living_room
  - climate.living_room
  - { entity: sensor.office_co2, kind: none }
```

:::

### Styles and sizes

`style` sets the pill:

- `outline`: Home Assistant's badge, the default.
- `soft`: a tint of the badge's colour.
- `filled`: the badge's colour.
- `plain`: only the icon and the value; its pill draws nothing, but keeps its padding and shape, so it lines up with the others and its hover is a pill.
- `tag`: an outline in the badge's colour, with the text in that colour.

`size` sets its height: `s` (the default), `m` or `l`. A rule's `style` changes the pill while the rule matches.

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

`format` writes the value another way:

- `power` switches between W, kW and MW.
- `duration` writes a time span.
- `relative` writes a date as its time from now.

`stale_after` greys a badge whose entity has not reported for that long, and adds how long ago it did. Give minutes, or a number with `s`, `min`, `h` or `d`.

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

`control: toggle` puts a switch at the end of the badge; the badge itself keeps its own action. A switch is the one control a badge holds.

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

A badge takes its own taps. `tap_action`, `hold_action` and `double_tap_action` act on the badge's entity ([Actions](/cards/entity-options#actions)): here a tap toggles the light. Without them, it takes the poster's actions, more-info by default.

`visibility` shows a badge only while its conditions hold, here the open windows. A hidden badge takes no room.

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

A badge without `entity` reads the poster's entity. `attribute` shows one of its attributes, with its unit. A badge with neither shows the poster's value again, say in a ring.

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
    - { icon: { ring: true } }
    - binary_sensor.ev_plugged
    - sensor.ev_range
  grid_options: { columns: 6 }
```

:::

## The status badge

The first badge is always the status badge; your `badges` follow it. It shows the matching rule's status, else the kind's. With nothing to show, it takes no room, nor where it only repeats the value (an Off light says Off once). Its look is the poster's: a `tag` in the poster's colour, without an icon or a name. A rule's `style` and `pulse` apply to it.

`status` sets its text:

- a text or a template;
- `false` to drop it.

A poster takes no `status_badge`: its status is always this badge. On a [tile](/cards/tile-badges#the-status-badge), the status is on the line unless `status_badge: true`.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.ev_battery
  name: Car
  icon: mdi:car-electric
  rules:
    - { below: 20, color: red, status: Low }
    - { above: 20, color: green, status: Ready }
  badges:
    - entity: binary_sensor.ev_plugged
      rules:
        - { state: "on", color: green, icon: mdi:power-plug, value: Plugged in }
        - { state: "off", color: grey, icon: mdi:power-plug-off, value: Unplugged }
    - sensor.ev_range
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

The badges float over the poster, so adding one never moves the texts. The status wraps onto a second line where it has a space and the corner is narrow (Partly / cloudy on a phone); a single word too long for it ends in an ellipsis. The other badges keep one line. Many badges reach down over the visual, and more than the poster has room for reach over the value and the controls too: make the poster larger or drop a badge. A badge that only shows sometimes (`visibility`, a status that only a rule gives) needs that room too.

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
  grid_options: { columns: 6 }
```

:::

## Reference

### Badge reference

A badge is an entity id or an object with these keys. It also takes `name`, `unit`, `decimals`, `prefix`, `suffix`, `min` and `max` as the poster does.

| Key                        | Default            | Description                                                                                                           |
| -------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `entity`                   | the poster's       | The entity. Without one, the badge reads the poster's entity.                                                         |
| `attribute`, `value`       | the poster's value | An attribute of the entity, or a text or a template of your own.                                                      |
| `icon`                     | the entity's icon  | An icon's name, `{ type: icon \| image \| dot, name, ring, src }`, or `false`.                                        |
| `visual`                   | –                  | After the value: `bar`, `sparkline` or `trend`; `{ type, hours }` for a sparkline's or a trend's window.              |
| `color`                    | the kind's         | The badge's colour; a matching rule's wins.                                                                           |
| `kind`                     | the entity's       | The kind whose colours it takes; `none` for none.                                                                     |
| `style`                    | `outline`          | `outline`, `soft`, `filled`, `plain` or `tag`.                                                                        |
| `size`                     | `s`                | `s`, `m` or `l`.                                                                                                      |
| `show_name` / `show_value` | false / true       | What the badge shows besides its icon.                                                                                |
| `format`                   | `auto`             | `auto`, `power`, `duration` or `relative`.                                                                            |
| `stale_after`              | –                  | Grey with its age when the entity has not reported for this long: minutes, or `90s`, `30min`, `2h`.                   |
| `control`                  | –                  | `toggle`: a switch at the badge's end.                                                                                |
| `rules`                    | the kind's         | `state`, `above`, `below`; their `color`, `icon` (a name or the icon place), `value` (the text), `style` and `pulse`. |
| `tap_action` …             | the poster's       | `tap_action`, `hold_action`, `double_tap_action`, on the badge's own entity.                                          |
| `visibility`               | –                  | Conditions; a hidden badge takes no room.                                                                             |

The old keys name their new spelling in an error: `visual: ring` is `icon: { ring: true }`, `visual: dot` is `icon: { type: dot }`, `show_icon: false` is `icon: false`, `show_entity_picture` is `icon: { type: image }`, `trend_hours` is `visual: { type: trend, hours }`, a rule's `label` is its `value`, and `visual: count` is the template above.

The [status badge](#the-status-badge) takes none of them: `status` is its text (a text, a template, or `false`), and its look is the poster's.
