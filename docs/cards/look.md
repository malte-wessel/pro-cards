# Look

A tile and a poster draw their entity the way its [kind](/cards/kinds) says. Every part of that look also has a key of its own: the texts, the colour, the icon and the visual. This page shows how to change each of them, on a tile and a poster side by side.

## The texts

Both cards show a name and a value. The tile puts the value on the line under the name; the poster draws it large at the bottom.

- `name`: the entity's friendly name by default.
- `value`: the entity's state, or what its kind shows (a thermostat's temperature, a media player's title). `attribute` shows an attribute instead. `unit`, `decimals`, `prefix` and `suffix` format a number.
- `status`: a word from the kind or from the matching rule, such as Cleaning or Good. On a tile it follows the value on the line; on a poster it is the first badge in the corner. A text of your own replaces it, `false` leaves it out. `status_badge: true` makes a tile's status a badge instead.
- `secondary`: the line the kind adds, such as the artist and the album, or the wind's direction and gusts. A text of your own replaces it.

`show_name: false` hides the name, `show_value: false` the value.

::: live

```yaml
- type: custom:tile-card-pro
  entity: climate.living_room
  name: Target
  attribute: temperature
  unit: °C
  decimals: 1
  status: false
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: climate.living_room
  name: Target
  attribute: temperature
  unit: °C
  decimals: 1
  status: false
  grid_options: { columns: 6 }
```

:::

## Values from templates

`name`, `value`, `status`, `secondary`, `icon` and `color` also take a [template](https://www.home-assistant.io/docs/configuration/templating/). Home Assistant renders it and keeps it up to date. A number from a template is still a number: `unit`, `decimals`, `prefix` and `suffix` work on it. A card does not even need an entity: the keys alone can fill it.

::: live

```yaml
- type: custom:tile-card-pro
  name: Laundry
  icon: mdi:washing-machine
  value: "{{ states('sensor.washer_remaining') }}"
  unit: min
  secondary: "{{ states('sensor.washer_power') | round }} W now"
  status: "{{ 'Running' if states('sensor.washer_remaining') | int(0) > 0 else 'Done' }}"
  color: "{{ 'teal' if states('sensor.washer_remaining') | int(0) > 0 else 'grey' }}"
  tap_action: { action: more-info, entity: sensor.washer_status }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  name: Laundry
  icon: mdi:washing-machine
  value: "{{ states('sensor.washer_remaining') }}"
  unit: min
  secondary: "{{ states('sensor.washer_power') | round }} W now"
  status: "{{ 'Running' if states('sensor.washer_remaining') | int(0) > 0 else 'Done' }}"
  color: "{{ 'teal' if states('sensor.washer_remaining') | int(0) > 0 else 'grey' }}"
  tap_action: { action: more-info, entity: sensor.washer_status }
  grid_options: { columns: 6 }
```

:::

## Colour

The card's colour paints its icon, its visual and its status. It comes from the first of these that has one:

1. the matching [rule](#rules)'s `color`;
2. the card's `color`, while the entity is active (an entity that is off takes Home Assistant's colour for off);
3. the kind's own colour: a light in its own colour, a thermostat warm while heating and cool while cooling;
4. Home Assistant's colour for the entity's state.

`color` takes a theme colour name (`amber`, `teal`, `deep-purple` …), a hex, `rgb()`, `var(--…)` or a template. It is a default: a matching rule's colour wins over it. To colour the whole card, use a rule with [`tint_card`](#rules). [Colours](/guide/colours) lists the names.

## Rules

`rules` change the look by the value or the entity's state. They match in the order written, and the first match wins.

- `state` matches the value or the entity's state. Quote `"on"` and `"off"`.
- `below` matches a value under the number, `above` a value at or over it.
- `attribute` makes the rule read that attribute of the entity in place of the value: `{ attribute: hvac_action, state: heating, … }` on a thermostat that shows its temperature. It reads the entity as it is now, so a plot's past values never match it.

A matching rule can set:

- `color` and `icon`: they win over the card's own `color` and `icon`;
- `status`: the status text (quote a word such as `"Off"` or `"No"`);
- `tint_card: true`: the whole card washed in the rule's colour;
- `pulse: true`: the status badge pulses;
- `visual`, and an icon as a [place](#by-rule).

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.living_room_co2
  name: Air
  rules:
    - { below: 600, color: green, status: Fresh }
    - { below: 1000, color: amber, status: Stuffy, icon: mdi:window-open-variant, tint_card: true }
    - { above: 1000, color: red, status: Open a window, icon: mdi:alert, tint_card: true, pulse: true }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.living_room_co2
  name: Air
  visual: { type: sparkline, hours: 12 }
  rules:
    - { below: 600, color: green, status: Fresh }
    - { below: 1000, color: amber, status: Stuffy, icon: mdi:window-open-variant, tint_card: true }
    - { above: 1000, color: red, status: Open a window, icon: mdi:alert, tint_card: true, pulse: true }
  grid_options: { columns: 6 }
```

:::

Many kinds bring rules of their own: CO₂ from Good to Bad, a battery Low and Critical, the weather a colour per condition. Your `rules` replace them as a whole, and `rules: []` drops them. [Kinds](/cards/kinds) lists each kind's rules.

Rules also match a template's value by its text, so `{ state: Open, color: red }` works on a card without an entity.

A rule with an `attribute` reads that attribute of the entity in place of the value. Below, the thermostat shows its temperature and turns red with a status of its own while it heats:

::: live

```yaml
type: custom:tile-card-pro
entity: climate.living_room
rules:
  - { attribute: hvac_action, state: heating, color: red, status: Warming up }
grid_options: { columns: 6 }
```

:::

## The places

Besides its texts, a card draws two **places**:

- `icon`: the icon (on the poster at the top left);
- `visual`: what fills the card behind the texts, such as a glow or a picture, or what sits below them, such as a plot of the history or a bar.

Each place draws one **thing**. You write it in one of four ways:

- its name: `visual: sparkline`;
- the thing with its options: `visual: { type: sparkline, hours: 12 }`;
- `false` for nothing: `visual: false`, `icon: false`;
- left out: the kind's default, such as a light's glow or a person's photo.

`icon` written as a text is always an icon's name, `icon: mdi:sofa`. Its other things take the object form: `icon: { type: image }`.

The **icon** draws one of these:

- `icon`: an icon, the entity's unless `name` gives another;
- `image`: a picture in the icon's circle;
- `flow`: the wind's or the rain's animation.

An `icon` or an `image` takes `ring: true`, a ring of the value around it. Every icon takes `style: plain`, the icon without its circle.

The **visual** draws one of these:

- behind the texts: `glow` (the card lit from below in its colour), `image` (a [picture](#a-picture-behind)), `flow` (the wind's or the rain's animation);
- below the texts: `sparkline`, `columns` and `strip` (the history), `bar`, `gauge` and `segments` (the value between `min` and `max`), `sun` (the sun's day);
- a kind's own drawing: `cover` (a cover's shutter, blind, garage …), `path` (a robot's path), `line` (the grid's power line). A tile draws these only where you name them.

On a tile, a visual below the texts adds a second row.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.living_room_temperature
  name: Living room
  visual: { type: sparkline, hours: 12 }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.living_room_temperature
  name: Living room
  visual: { type: sparkline, hours: 12 }
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.phone_battery
  icon: { ring: true }
  visual: false
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.phone_battery
  icon: { ring: true }
  visual: gauge
  grid_options: { columns: 6 }
```

:::

### Changing the kind's default

An object without `type` keeps the thing the kind draws and changes only its options. `visual: { hours: 24 }` makes the weather's forecast look a day ahead. `visual: { blur: false }` shows a person's photo sharp. `icon: { ring: true }` puts a ring around whatever the icon is. An object with another `type` replaces the thing.

::: live

```yaml
- type: custom:tile-card-pro
  entity: weather.home
  visual: { hours: 24 }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: weather.home
  visual: { hours: 24 }
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: person.malte
  visual: { blur: false }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: person.malte
  visual: { blur: false }
  grid_options: { columns: 6 }
```

:::

Options a thing cannot use are caught: with a written `kind` the card shows an error, otherwise the browser's console warns once.

### By rule

A rule takes `icon` and `visual` too, drawn over the card's while it matches. As on the card, an object without `type` changes options only, a `type` draws another thing and `false` empties the place. A rule never changes a plot's window: `hours`, `bucket`, `smoothing` and a plot's `src` stay the card's.

Each place is resolved in layers: the kind's default, then the card's, then the first matching rule's.

The living room fan glows in teal while it runs; switch it off and its icon loses its circle.

::: live

```yaml
- type: custom:tile-card-pro
  entity: fan.living_room
  rules:
    - { state: "on", color: teal, visual: glow }
    - { state: "off", icon: { style: plain } }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: fan.living_room
  rules:
    - { state: "on", color: teal, visual: glow }
    - { state: "off", icon: { style: plain } }
  grid_options: { columns: 6 }
```

:::

## A picture behind

`visual: { type: image }` puts a picture behind the whole card, under a shade that keeps the text readable. Without `src` it shows the card's own entity's picture. `src` takes a URL (`/local/…` for a file in Home Assistant's `www` folder), a template that renders one, or an entity whose picture it shows: a camera's snapshot, a person's photo, a media player's art.

- `opacity`: how much of the picture shows through the shade, from `0` to `1` (`0.3` by default).
- `tint`: a colour mixed into the shade.
- `blur`: a number of pixels, `true` for 20, `false` for a sharp picture. A person's photo and a media player's art are blurred by default.

::: live

```yaml
- type: custom:tile-card-pro
  name: Garden
  icon: mdi:cctv
  visual: { type: image, src: camera.garden, opacity: 0.6 }
  value: "{{ 'Light on' if is_state('light.garden', 'on') else 'Light off' }}"
  tap_action: { action: more-info, entity: camera.garden }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  name: Garden
  icon: mdi:cctv
  visual: { type: image, src: camera.garden, opacity: 0.6, tint: indigo }
  value: "{{ 'Light on' if is_state('light.garden', 'on') else 'Light off' }}"
  tap_action: { action: more-info, entity: camera.garden }
  grid_options: { columns: 6 }
```

:::

## One place for the animation

The wind's and the rain's animation is drawn in one place: by default in the icon. `visual: { type: flow }` lets it fill the whole card instead, and the icon becomes the wind's arrow or the rain's icon. A flow's `variant` picks the drawing: `dots`, `lines`, `swoosh` or `vectors` for the wind, `drops`, `ripples` or `fill` for the rain.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.wind_speed
  name: Wind
  visual: { type: flow, variant: lines }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.rain_rate_roof
  name: Rain
  visual: { type: flow, variant: ripples }
  grid_options: { columns: 6 }
```

:::

## Recipes

### An entity, your own look

With an `entity`, the card takes the name, the icon, the state and the colour from it, and the kind adds the rest. `kind: none` turns the kind off: no status, controls, rules or visual of the kind's, only what you write. Here the ceiling light shows its brightness as a bar instead of its glow.

::: live

```yaml
- type: custom:tile-card-pro
  entity: light.living_room
  kind: none
  name: Ceiling
  value: "{{ (state_attr('light.living_room', 'brightness') | float(0) / 2.55) | round }}"
  unit: "%"
  visual: bar
  min: 0
  max: 100
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: light.living_room
  kind: none
  name: Ceiling
  value: "{{ (state_attr('light.living_room', 'brightness') | float(0) / 2.55) | round }}"
  unit: "%"
  secondary: "{{ 'On' if is_state('light.living_room', 'on') else 'Off' }}"
  visual: bar
  min: 0
  max: 100
  grid_options: { columns: 6 }
```

:::

### A card without an entity

A card needs no entity: templates fill it. This one counts the lights that are on. Without an entity a tap does nothing until you give it a [`tap_action`](/cards/actions).

::: live

```yaml
- type: custom:tile-card-pro
  name: Lights on
  icon: "{{ 'mdi:lightbulb-group' if states.light | selectattr('state', 'eq', 'on') | list | count > 0 else 'mdi:lightbulb-group-off' }}"
  value: "{{ states.light | selectattr('state', 'eq', 'on') | list | count }}"
  secondary: "of {{ states.light | list | count }} lights"
  color: "{{ 'amber' if states.light | selectattr('state', 'eq', 'on') | list | count > 0 else 'grey' }}"
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  name: Lights on
  icon: "{{ 'mdi:lightbulb-group' if states.light | selectattr('state', 'eq', 'on') | list | count > 0 else 'mdi:lightbulb-group-off' }}"
  value: "{{ states.light | selectattr('state', 'eq', 'on') | list | count }}"
  secondary: "of {{ states.light | list | count }} lights"
  color: "{{ 'amber' if states.light | selectattr('state', 'eq', 'on') | list | count > 0 else 'grey' }}"
  grid_options: { columns: 6 }
```

:::

## Reference

### Texts and colour

| Key            | Default                              | What it does                                                               |
| -------------- | ------------------------------------ | -------------------------------------------------------------------------- |
| `name`         | the friendly name                    | The name. Text or template.                                                |
| `value`        | the state, or the kind's value       | The value. Text or template.                                               |
| `attribute`    | –                                    | Shows this attribute of the entity in place of its state.                  |
| `unit`         | the entity's unit                    | The unit after a number.                                                   |
| `decimals`     | Home Assistant's                     | Decimal places of a number, `0` to `3`.                                    |
| `prefix`       | –                                    | A text before the value.                                                   |
| `suffix`       | –                                    | A text after the value.                                                    |
| `status`       | the rule's, else the kind's          | The status. Text or template; `false` for none.                            |
| `status_badge` | `false`                              | Tile only: the status as the first badge instead of on the line.           |
| `secondary`    | the kind's line                      | The extra line. Text or template.                                          |
| `show_name`    | `true`                               | `false` hides the name.                                                    |
| `show_value`   | `true`                               | `false` hides the value.                                                   |
| `color`        | the kind's, else Home Assistant's    | The card's colour: a theme colour name, hex, `rgb()`, `var()` or template. |
| `min`, `max`   | the entity's own, else `0` and `100` | The range of a ring, a bar, a gauge, segments and a glow.                  |
| `rules`        | the kind's                           | Look by value or state; first match wins. `[]` drops the kind's.           |
| `kind`         | detected from the entity             | The kind; `none` draws only what you write. See [Kinds](/cards/kinds).     |

### Rule keys

| Key         | What it does                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------------- |
| `state`     | Matches the value or the entity's state. Quote `"on"` and `"off"`.                                        |
| `below`     | Matches a value under this number.                                                                        |
| `above`     | Matches a value at or over this number.                                                                   |
| `attribute` | Reads this attribute of the entity in place of the value (the entity of now, never a plot's past values). |
| `color`     | The card's colour while the rule matches. Wins over `color`.                                              |
| `icon`      | An icon's name, or the icon place's thing or options (no actions). Wins over `icon`.                      |
| `visual`    | The visual place's thing or options, or `false`. No `hours`, `bucket`, `smoothing`, or a plot's `src`.    |
| `status`    | The status text while the rule matches.                                                                   |
| `tint_card` | `true`: the whole card in the rule's colour.                                                              |
| `pulse`     | `true`: the status badge pulses.                                                                          |
| `style`     | The status badge's look: `outline`, `soft`, `filled`, `plain` or `tag`.                                   |

A rule needs at least one of `state`, `below` and `above`.

### Icon things

| Thing   | Options                        | Draws                                                                            |
| ------- | ------------------------------ | -------------------------------------------------------------------------------- |
| `icon`  | `name`, `ring`, `style`        | An icon: the entity's, or `name` (an `mdi:` icon or a template).                 |
| `image` | `src`, `name`, `ring`, `style` | A picture in the icon: the entity's, or `src`. `name` shows while there is none. |
| `flow`  | `variant`, `style`             | The wind's or the rain's animation. Wind and rain kinds only.                    |

| Option    | What it does                                                                  |
| --------- | ----------------------------------------------------------------------------- |
| `ring`    | `true`: a ring of the value around the icon, filled between `min` and `max`.  |
| `style`   | `circle` (default) or `plain`, without the circle.                            |
| `src`     | A URL, a template that renders one, or an entity whose picture it shows.      |
| `variant` | Wind: `dots`, `lines`, `swoosh`, `vectors`. Rain: `drops`, `ripples`, `fill`. |

The icon also takes its own `tap_action`, `hold_action` and `double_tap_action` (see [Actions & hover](/cards/actions)), and on a tile a `badge` (see [Badges](/cards/badges)).

### Visual things

| Thing       | Options                                       | Draws                                                                       |
| ----------- | --------------------------------------------- | --------------------------------------------------------------------------- |
| `glow`      | –                                             | The card lit from below in its colour, as strong as the value's level.      |
| `image`     | `src`, `opacity`, `tint`, `blur`              | A picture behind the whole card.                                            |
| `flow`      | `variant`                                     | The wind's or the rain's animation behind the card. Wind and rain only.     |
| `cover`     | `variant`                                     | A cover's drawing. Cover only.                                              |
| `path`      | –                                             | A robot's path. Vacuum and lawn mower only.                                 |
| `line`      | –                                             | The power line. Grid only.                                                  |
| `sparkline` | `hours`, `bucket`, `smoothing`, `axis`, `src` | A line of the history. A weather's: the hours ahead; a trend's: its series. |
| `columns`   | `hours`, `bucket`, `axis`, `src`              | A bar per bucket.                                                           |
| `strip`     | `hours`, `bucket`, `src`, `variant`           | A block per bucket, coloured by the rule each one matched.                  |
| `bar`       | –                                             | The value between `min` and `max` as a bar.                                 |
| `gauge`     | –                                             | The value between `min` and `max` as an arc.                                |
| `segments`  | –                                             | Ten segments, filled to the value.                                          |
| `sun`       | –                                             | The sun's day, with the sun where it is now. Sun only.                      |

| Option      | What it does                                                                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src`       | `image`: a URL, a template that renders one, or an entity whose picture it shows. A plot: another entity's history.                                                                              |
| `opacity`   | How much of the picture shows through its shade, `0` to `1`. Default `0.3`.                                                                                                                      |
| `tint`      | A colour mixed into the shade.                                                                                                                                                                   |
| `blur`      | Blurs the picture: a number of px, `true` for 20, `false` for none.                                                                                                                              |
| `variant`   | Flow: as for the icon. Cover: `shutter`, `blind`, `curtain`, `garage`, `gate`, `awning`, `window`. Strip: `timeline` (below the texts, with its times) or `edge` (along the card's bottom edge). |
| `hours`     | The window in hours, or `today` (since midnight). Default 24; a weather's forecast 12 ahead, a trend 6 back, solar `today`.                                                                      |
| `bucket`    | A bucket's minutes, at least 5: a column or a block of the strip. Default 60.                                                                                                                    |
| `smoothing` | The sparkline's averaging in minutes, at least 5. Default: by the plot's width.                                                                                                                  |
| `axis`      | `true`: the plot's axes.                                                                                                                                                                         |
