# Poster Card Pro

`custom:poster-card-pro` draws one entity as a poster. The icon sits at the top left and the badges at the top right. At the bottom come the name in small capitals and the value, large.

What fills these parts depends on the entity's **kind**. A CO₂ sensor brings its air quality bands, a wind sensor its animated field, a media player its cover art. The kind is detected from the entity, so most posters need only `entity:`. Every part also has a key of its own, and a poster needs no entity at all.

::: info Beta
The poster card is new in 3.0 and in beta: its options may still change.
:::

## Anatomy

A poster is half a section wide and three rows high in a sections grid, and that at least: less room is what a [tile](/cards/tile-card) is for. Its content sits at the bottom of whatever height it gets. From top to bottom:

- the **icon** at the top left. It shows the entity's icon or picture, or the kind's own drawing. It can have actions of its own: a lock is held there.
- the **badges** at the top right. The first is the **status badge**, here the matching rule's status.
- the **name**, the large **value** and the line under it. The controls sit beside them, or under them on a narrow card.
- the **visual**: along the bottom, here the last 12 hours as a sparkline, or behind it all: a glow, a picture, or what the kind draws there.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.power_consumption
  name: Power
  visual: { type: sparkline, hours: 12 }
  rules:
    - { below: 1000, color: green, status: Low }
    - { below: 3000, color: amber, status: Normal }
    - { above: 3000, color: red, status: High, style: filled, pulse: true }
  badges:
    - sensor.solar_power
    - sensor.battery_power
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.living_room_temperature
  name: Living room
  grid_options: { columns: 6 }
```

:::

## How a poster gets its look

A poster's defaults come from its **kind**: what the entity is. The kind is detected from the entity's domain and device class, and `kind` sets it by name. [Kinds](/cards/poster-types) shows every kind with what it reads and draws.

Every part has a key of its own: `icon`, `name`, `value`, `secondary`, `status`, `color` and `visual`. A key sets its part and the kind fills the rest. So a poster can change one detail of its kind, or need no entity at all. Two of them are **places**: `icon` and `visual` each take a thing (an icon or a picture; a plot, a glow or a picture behind) with its options, `false` for none, or the kind's when left out. [Custom posters](/cards/poster-custom) builds posters from these keys, and [The places](/cards/poster-custom#the-places) has every thing.

The other pages cover the rest:

- [Controls](/cards/poster-controls): the switches and sliders a kind brings or `control` adds.
- [Badges](/cards/poster-badges): the badges in the corner.
- [Sizes](/cards/poster-sizes): how a poster fits its size.

## A first set of posters

Four entities, nothing but `entity` and a key or two: a power sensor with its last hours, a light with its switch and dimmer, the weather with its forecast, and the wind as an animated field.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.power_consumption
  name: Power
  visual: sparkline
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: light.living_room
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: weather.home
  name: Outside
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.wind_speed
  name: Wind
  visual: { type: flow, variant: lines }
  grid_options: { columns: 6 }
```

:::

## An unavailable entity

While its entity is unavailable, a poster draws a dash for the value, its status says Unavailable and its controls are greyed out. An entity that does not exist draws the same, its status naming the missing entity.

::: live

```yaml
- type: custom:poster-card-pro
  entity: light.shed
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: climate.shed
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: cover.shed_door
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: lock.shed
  grid_options: { columns: 6 }
```

:::

## The visual editor

Home Assistant's card editor shows a form for the poster: the entity and its kind at the top, then sections for the content, the icon and the visual, the controls, the other entities the kind reads, the status and the badges (each badge in a dialog: its kind, its icon, what it draws after the value, its switch; its rules stay YAML), the rules and the interactions. It offers only what applies to the kind: a thermostat's stepper and glow, a wind sensor's animation and its direction and gust sensors. A field left alone keeps the kind's default and writes nothing to the YAML. The rules list shows the kind's own while the card has none; changing one copies them all into the card (their thresholds in the sensor's unit), and **Predefined** goes back to the kind's. Try it in the [Playground](/playground), or with **Edit** under any example.

## Reference

### Card options

| Option                                              | Default                      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entity`                                            | –                            | The entity. Optional: the keys alone can fill a poster ([Custom posters](/cards/poster-custom)).                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `kind`                                              | detected                     | What the entity is, its [kind](/cards/poster-types): `battery`, `wind`, `cover`, `washer` … `none` turns every default off.                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `inputs`                                            | found on the device          | The other entities a kind reads, by their names (`direction`, `gust`, `today` …), each an entity or `false` for none; each [kind](/cards/poster-types) lists its own.                                                                                                                                                                                                                                                                                                                                                                                       |
| `running_above`, `series`                           | –                            | The [appliance](/cards/poster-types#appliance)'s threshold and the [trend](/cards/poster-types#trend)'s series.                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `icon`                                              | the kind's                   | The icon: an icon's name or a template, `{ type: icon \| image \| flow, … }` with its options (`name`, `ring`, `style`, `src`, `variant`), or `false` for none; see [The places](/cards/poster-custom#the-places). A name is a default: a matching rule's icon wins. The object also takes the icon's own actions: `tap_action`, `hold_action`, `double_tap_action` (a lock and an alarm panel are held there by default; see [The icon](/cards/poster-custom#the-icon)). A rule may not set them. A poster's icon has no badge: its corner has the badges. |
| `visual`                                            | the kind's                   | Behind the texts or along the bottom: `glow`, `image`, `flow`, `sparkline`, `columns`, `strip`, `bar`, `gauge`, `segments`, `sun`, `cover`, `path` or `line` (a weather's `sparkline` is its forecast), by name or `{ type, … }` with its options (`hours`, `bucket`, `smoothing`, `axis`, `src`, `opacity`, `tint`, `blur`, `variant`), or `false` for none; see [The places](/cards/poster-custom#the-places).                                                                                                                                            |
| `name`, `value`, `secondary`                        | the kind's                   | The texts, templates allowed; see [The parts](/cards/poster-custom#the-parts).                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `color`                                             | the kind's                   | The poster's colour, a template allowed. A default: a matching rule's colour wins.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `attribute`, `unit`, `decimals`, `prefix`, `suffix` | –                            | The value, as on the entity cards.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `min`, `max`                                        | the entity's, else 0 and 100 | The range of a level: a bar, a gauge, segments, a glow, the icon's ring.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `show_name`, `show_value`                           | `true`                       | `false` leaves out the name or the large value (the icon: `icon: false`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `status`                                            | the kind's                   | The status badge, always the first badge in the corner: a text, a template, or `false` for none; see [The status badge](/cards/poster-badges#the-status-badge). Its look is the poster's: a tag in its colour.                                                                                                                                                                                                                                                                                                                                              |
| `badges`                                            | –                            | The badges in the corner; see [Badges](/cards/poster-badges).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `rules`                                             | the kind's                   | Colour, icon, status and the two places by value or state; see [Colour and rules](/cards/poster-custom#colour-and-rules).                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `control`                                           | the kind's                   | A control's name as on the [entity cards](/cards/controls), `true`, or `false` for none; or `{ type, position, attribute, step, options, confirm }`: the control (`type`), `end` or `block` (`position`), and its own options. Without `type` the object changes the kind's controls (`control: { step: 1 }`). See [Poster controls](/cards/poster-controls#reference).                                                                                                                                                                                     |
| `tap_action` …                                      | `more-info`                  | `tap_action`, `hold_action`, `double_tap_action`; see [Actions](/cards/poster-custom#actions).                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `hover`                                             | `true`                       | Home Assistant's hover and press, as on its tile card: a light layer under a mouse, a ripple from where you press, a ring around the card while it has the keyboard's focus. `false` keeps it still.                                                                                                                                                                                                                                                                                                                                                        |

Like every card, this one also accepts `grid_options`, `visibility`, `view_layout` and `card_mod`. A poster takes 6 columns and three rows by default. `fill_height: false` keeps it at its own height; see [Poster sizes](/cards/poster-sizes).
