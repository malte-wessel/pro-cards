# Badges

A badge is a small pill that shows one more value on a card: another entity, an attribute, or a text of your own. It takes its own colour from the entity's kind, can draw a ring, a bar or a sparkline, and takes its own taps.

## Where badges sit

`badges` lists the badges in order. Each one is an entity id, or an object with the [badge keys](#badge-keys). On a [poster](/cards/poster-card) they are a column in the top right corner, floating over the picture. On a [tile](/cards/tile-card) they sit at the end of the first row, beside the name and centred on the icon (on a vertical tile, in a row above the icon); the name gives way, the badges always show in full.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.living_room_temperature
  name: Living room
  badges:
    - sensor.living_room_humidity
    - sensor.living_room_co2
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.living_room_temperature
  name: Living room
  badges:
    - sensor.living_room_humidity
    - sensor.living_room_co2
  grid_options: { columns: 6 }
```

:::

The same badges, written the same way, go in more places:

- the header of a [tile group](/cards/tile-group-card);
- the [heading card](/cards/heading-card), on its title line;
- the header of the [weather](/cards/weather-card), [power flow](/cards/power-flow-card) and [energy flow](/cards/energy-flow-card) cards.

On a tile and a poster a badge is an outline pill by default. In a header it is plain and small, so it reads as part of the title line. The heading card has its own defaults for all its badges (`badge_style`, `badge_size`). A badge's own `style` and `size` always win.

## What a badge shows

A badge's pill holds, in this order, its icon, its name, its value, a visual and a switch. Most badges need only the first and the value.

### The icon

`icon` is the badge's icon place:

- an icon's name (`mdi:…`, or a template);
- `{ type: image }`: the entity's picture, or `src` for another (an image URL, a template or an entity);
- `{ type: dot }`: a dot in the badge's colour;
- `{ ring: true }`: a ring of the value around the icon or the picture, from `min` to `max`;
- `false`: no icon.

`show_name: true` writes the name before the value. `show_value: false` shows the icon alone.

### The visual after the value

`visual` draws something small after the value:

- `bar`: the value as a short bar, from `min` to `max`;
- `sparkline`: the history of the last 24 hours;
- `trend`: how much the value changed over the last hour.

`{ type: sparkline, hours: 6 }` gives a sparkline or a trend its own window; `hours: today` starts at midnight.

### Format and staleness

`format` writes the value another way: `power` switches between W, kW and MW, `duration` writes a time span (1h 12m), and `relative` writes a date as its time from now (in 38 minutes). `stale_after` greys a badge whose entity has not reported for that long and adds how long ago it did. It takes minutes, or a number with `s`, `min`, `h` or `d`.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.washer_status
  name: Laundry
  icon: mdi:washing-machine
  badges:
    - { entity: sensor.washer_power, format: power, icon: mdi:flash }
    - { entity: sensor.washer_remaining, format: duration }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.power_consumption
  name: Home
  badges:
    - { entity: sensor.phone_battery, icon: { name: mdi:cellphone, ring: true } }
    - { entity: person.malte, icon: { type: image }, show_name: true }
    - { entity: sensor.wind_speed, visual: { type: sparkline, hours: 12 } }
    - { entity: sensor.living_room_temperature, visual: trend, icon: false }
    - { entity: sensor.weather_station_battery, stale_after: 2h }
  grid_options: { columns: 6 }
```

:::

## Colour, rules and style

### The entity's kind

A badge takes its entity's [kind](/cards/kinds), but only its colours: a battery red when it runs low, carbon dioxide by its bands, a light in its own colour, a thermostat warm while it heats. A kind that calls for attention makes the badge pulse, such as a jammed lock or hazardous air. The value stays the value; the kind's words belong to the card's status. The kind's thresholds read the entity's state: a badge showing an `attribute` or a `value` of its own takes only the kind's colour.

`kind` names a kind for an entity the card cannot tell, such as `kind: battery` on a sensor without a device class. `kind: none` leaves the kind out; Home Assistant's own state colour stays.

### Rules

`rules` work as on the card itself: the first rule that matches its `state`, `above` or `below` wins, on the badge's value or on an `attribute` the rule names (a thermostat's `hvac_action` beside its temperature). A rule sets the badge's `color` and `icon`, and `value` writes a text in place of the value. It can also change the pill (`style`) and make it pulse (`pulse: true`). The badge's own `color` and `icon` are defaults: a matching rule's win. A badge with rules takes none of its kind's.

### Styles and sizes

`style` sets the pill: `outline` (Home Assistant's badge), `soft` (a tint of the badge's colour), `filled` (the badge's colour), `plain` (only the icon and the value) or `tag` (an outline and text in the badge's colour). `size` sets its height: `s`, `m` or `l`.

::: live

```yaml
type: custom:poster-card-pro
entity: light.living_room
name: Ceiling
badges:
  - sensor.phone_battery
  - { entity: sensor.living_room_co2, kind: none }
  - entity: binary_sensor.window_kitchen
    name: Kitchen
    show_name: true
    rules:
      - { state: "on", color: red, icon: mdi:window-open, value: Open, pulse: true }
      - { state: "off", color: green, icon: mdi:window-closed, value: Closed }
  - { entity: lock.front_door, style: filled }
  - { entity: sensor.living_room_humidity, style: soft, size: m }
grid_options: { columns: 6 }
```

:::

## Switches, taps and visibility

`control: toggle` puts a switch at the end of a badge: a round button with the power icon, grey while off and filled in the badge's colour while on. It is the one control a badge holds; the badge itself keeps its own tap.

A badge takes its own taps. `tap_action`, `hold_action` and `double_tap_action` act on the badge's entity, as described in [Actions & hover](/cards/actions). Without them a badge takes the card's actions on its own entity: more-info by default.

`visibility` shows a badge only while its conditions hold, written as in [Visibility](/guide/visibility). A hidden badge takes no room.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.living_room_temperature
  name: Living room
  badges:
    - { entity: light.desk_lamp, name: Desk, show_name: true, show_value: false, control: toggle }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
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
  grid_options: { columns: 6 }
```

:::

## Badges reading the card's own entity

On a tile and a poster, a badge without `entity` reads the card's entity. `attribute` shows one of its attributes, with its unit. A badge with neither shows the card's value again, for example in a ring. On a card without an entity, a badge needs an `entity` or a `value`.

::: live

```yaml
- type: custom:tile-card-pro
  entity: weather.home
  name: Outside
  badges:
    - { attribute: humidity, icon: mdi:water-percent }
    - { attribute: wind_speed, icon: mdi:weather-windy }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.phone_battery
  name: Phone
  icon: mdi:cellphone
  status: false
  badges:
    - { icon: { ring: true } }
    - { entity: person.malte, icon: { type: image } }
  grid_options: { columns: 6 }
```

:::

## The status badge

A card's status (Heating, Low, Locked …) can be a badge too. On a poster it always is: the first badge in the corner, before yours. On a tile the status sits on the line after the value; `status_badge: true` makes it the first badge instead. Either way it looks like the card: a `tag` in the card's colour, without an icon or a name. A rule's `style` and `pulse` apply to it.

`status` sets its text (a text or a template), and `status: false` drops it.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.living_room_co2
  name: Air
  status: "{{ 'Stuffy' if states('sensor.living_room_co2') | int(0) > 700 else 'Fresh' }}"
  status_badge: true
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.living_room_co2
  name: Air
  status: "{{ 'Stuffy' if states('sensor.living_room_co2') | int(0) > 700 else 'Fresh' }}"
  badges:
    - sensor.living_room_temperature
  grid_options: { columns: 6 }
```

:::

## The tile's icon badge

A tile's icon carries a small badge of its own, as on Home Assistant's tile: what a thermostat or a humidifier is doing (in its colour), a person's zone, an orange mark when the entity is unavailable. It takes no room. `icon: { badge: false }` turns it off, and `icon: { badge: { icon, color } }` sets one of your own; both take a template, and an icon that renders empty shows nothing. A rule can set it too while it matches.

::: live

```yaml
- type: custom:tile-card-pro
  entity: climate.living_room
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.living_room_co2
  name: CO₂
  icon: { badge: { icon: mdi:window-open-variant, color: orange } }
  grid_options: { columns: 6 }
```

:::

## Reference

### Badge keys

A badge is an entity id, or an object with these keys. Every key is optional.

| Key                | Default                    | Description                                                                                                                                                       |
| ------------------ | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entity`           | the card's (tile, poster)  | The entity it shows. In a header, a badge needs an `entity` or a `value`.                                                                                         |
| `attribute`        | –                          | One of the entity's attributes in place of its state.                                                                                                             |
| `value`            | the entity's state         | A text or a template of your own.                                                                                                                                 |
| `name`             | the entity's name          | The name, shown with `show_name: true`.                                                                                                                           |
| `unit`             | the entity's unit          | The unit after the value.                                                                                                                                         |
| `decimals`         | the entity's               | Decimal places of the value.                                                                                                                                      |
| `prefix`, `suffix` | –                          | Text before and after the value.                                                                                                                                  |
| `min`, `max`       | the entity's, else 0 / 100 | The range of a ring and a bar.                                                                                                                                    |
| `show_name`        | `false`                    | Write the name before the value.                                                                                                                                  |
| `show_value`       | `true`                     | `false`: the icon alone.                                                                                                                                          |
| `icon`             | the entity's icon          | An icon's name, `{ type: icon \| image \| dot, name, ring, src }`, or `false`.                                                                                    |
| `visual`           | –                          | After the value: `bar`, `sparkline` or `trend`; `{ type, hours }` for another window (`hours` a number or `today`).                                               |
| `color`            | the kind's                 | The badge's colour; a matching rule's wins. A template is allowed.                                                                                                |
| `kind`             | the entity's               | The kind whose colours it takes; `none` for none.                                                                                                                 |
| `rules`            | the kind's                 | `state`, `above` or `below`, and an optional `attribute`, setting `color`, `icon`, `value` (a text in place of the value), `style` and `pulse`. First match wins. |
| `style`            | see below                  | `outline`, `soft`, `filled`, `plain` or `tag`.                                                                                                                    |
| `size`             | see below                  | `s`, `m` or `l` (24, 30 or 36 px high).                                                                                                                           |
| `format`           | `auto`                     | `auto`, `power` (W / kW / MW), `duration` or `relative`.                                                                                                          |
| `stale_after`      | –                          | Grey, with its age, when the entity has not reported for this long: minutes, or `90s`, `30min`, `2h`, `1d`.                                                       |
| `control`          | –                          | `toggle`: a switch at the badge's end, a round power button.                                                                                                      |
| `tap_action` …     | the card's                 | `tap_action`, `hold_action`, `double_tap_action`, on the badge's own entity.                                                                                      |
| `hover`            | the card's                 | Show Home Assistant's hover and press layers on the badge.                                                                                                        |
| `visibility`       | –                          | Conditions; a hidden badge takes no room.                                                                                                                         |

### Defaults by place

| Where                                                 | `style`                   | `size`             |
| ----------------------------------------------------- | ------------------------- | ------------------ |
| Poster, tile                                          | `outline`                 | `s`                |
| Headers: tile group, weather, power flow, energy flow | `plain`                   | `s`                |
| Heading card                                          | `badge_style` (`outline`) | `badge_size` (`m`) |
| The status badge (poster, tile)                       | `tag`                     | `s`                |

### Card options

| Key            | Card         | Default    | Description                                                                                             |
| -------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------------- |
| `badges`       | all above    | –          | The badges, in order (on a poster and a tile after the status badge).                                   |
| `status`       | tile, poster | the kind's | The status: a text, a template, or `false`.                                                             |
| `status_badge` | tile         | `false`    | `true`: the status as the first badge, in place of on the line. A poster's status is always a badge.    |
| `icon.badge`   | tile         | `auto`     | The badge on the icon: `auto` (Home Assistant's), `false`, or `{ icon, color }`. A rule may set it too. |

Old badge keys (`visual: ring`, `show_icon`, a rule's `label` …) give an error naming the key to use; see [Moving to 3.0](/guide/migrating).
