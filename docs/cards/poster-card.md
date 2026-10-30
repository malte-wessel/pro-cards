# Poster Card Pro

`custom:poster-card-pro` draws one entity as a poster: the icon at the top left, the badges at the top right, and at the bottom the name in small capitals and the value, large. What fills these places depends on the entity's **poster type**: a CO₂ sensor brings its air quality bands, a wind sensor its animated field, a media player its cover art. The poster type is detected from the entity, so most posters are just `entity:`. Every place can be set with a key of its own, and a poster needs no entity at all.

::: info Beta
The poster card is new in 3.0 and in beta: its options may still change.
:::

## Anatomy

A poster is three rows high in a sections grid (two at least) and keeps its content at the bottom of whatever height it gets. From top to bottom:

- the **lead** at the top left: the icon, the entity's picture or the poster type's own drawing;
- the **badges** at the top right, the first of them the **status badge** (the matching rule's label here);
- the **name**, the large **value** and the line under it, with the controls beside them (under them on a narrow card);
- the **picture** along the bottom: here the last 12 hours as a sparkline;
- behind it all, the **backdrop** (an image, or what the poster type draws there).

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.power_consumption
  name: Power
  visual: sparkline
  hours_to_show: 12
  rules:
    - { below: 1000, color: green, label: Low }
    - { below: 3000, color: amber, label: Normal }
    - { above: 3000, color: red, label: High, style: filled, pulse: true }
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

A poster's defaults come from its **poster type**: what the entity is. The type is detected, first match wins: the domain (`weather.*`, `light.*`, `sun.sun` …), then the device class (`wind_speed`, `battery`, `carbon_dioxide` …), else `entity`, which brings the entity's icon, name and value and nothing more. `poster` names the type instead: one for an entity without a device class (a template sensor), one that is never detected (`grid`, `solar`, `car`, `appliance`, `trend`), or `entity` to switch every default off. A poster has one type; [Poster types](/cards/poster-types) shows each with what it reads, its `variant` values and its own keys.

Every place has a key of its own (`icon`, `name`, `value`, `secondary`, `status`, `color`, `visual`, `image`), the same for every type. A key replaces what the type puts in its place and keeps the rest, so a poster can change one detail of its type, or need no entity at all: [Custom posters](/cards/poster-custom) builds posters from these keys.

The rest has a page of its own: the [controls](/cards/poster-controls) a type brings or `control` adds (a tap on the poster opens more-info, the controls take their own taps), the [badges](/cards/poster-badges) in the corner, and how a poster fits its [size](/cards/poster-sizes).

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
  variant: lines
  grid_options: { columns: 6 }
```

:::

## From the 2.9 betas

The 2.9 betas drew posters with `layout: poster` on the entity, group, sections, wind, rain, weather, sun path and multi trend cards. That layout is gone: those cards are tiles, lists and plots again, and a poster is this card. To move one over, change its type to `custom:poster-card-pro`, drop `layout: poster` and let the poster type bring what you had set by hand (icons, controls, the standard bands); keep `name`, your own rules and the grid options. The keys map like this:

| 2.9 beta                                                                    | Poster card                                                                 |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `custom:entity-card-pro` with `layout: poster`                              | `custom:poster-card-pro`, the same keys                                     |
| a group or sections card's `poster`: the rest as badges                     | `badges`                                                                    |
| the label pill                                                              | the status badge (`status`)                                                 |
| wind and rain cards: `layout: poster`, `direction`, `gust`, `today`, `wind` | the same keys on the poster, found on the device                            |
| wind and rain cards: `visual: flow` with `flow.style`                       | `variant`, the same names (`variant: lines`)                                |
| wind and rain cards: `lead: arrow`, `lead: icon`                            | `icon` replaces the animated lead                                           |
| weather card: `rules` and `temperature_rules`                               | one `rules`: `state` reads the condition, `below` / `above` the temperature |
| weather card: `icons: mdi`                                                  | `show_entity_picture: false`                                                |
| sun path card: `day_color`                                                  | `color`                                                                     |
| sun path card: `labels`                                                     | `name` and `value` templates                                                |
| multi trend card: `layout: poster`, `entities`                              | `poster: trend`, `series`                                                   |

## Reference

### Card options

| Option                                        | Default             | Description                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entity`                                      | –                   | The entity; its domain and device class pick the poster type. Optional: the keys alone fill a poster ([Custom posters](/cards/poster-custom)).                                                                                                                              |
| `poster`                                      | detected            | A poster type's name: forces it, names one never detected, or (`entity`) turns every default off; see [Poster types](/cards/poster-types).                                                                                                                                  |
| `variant`                                     | the type's          | How the poster type draws its subject; see [Options of a poster type](/cards/poster-types#options-of-a-poster-type).                                                                                                                                                        |
| `direction`, `gust`, `today` …                | found on the device | The entities a poster type reads (`direction`, `gust`, `today`, `wind`, `power`, `charge`, `discharge`, `import`, `export`, `range`, `plugged`, `charging`, `location`): an entity id, or `false` for none; see [Discovered inputs](/cards/poster-types#discovered-inputs). |
| `running_above`, `series`                     | –                   | The appliance's threshold and the trend's series; see [Options of a poster type](/cards/poster-types#options-of-a-poster-type).                                                                                                                                             |
| `name`, `icon`, `value`, `secondary`, `color` | the type's          | The places; templates allowed. `attribute`, `unit`, `decimals`, `prefix`, `suffix` as on the entity cards; see [The places](/cards/poster-custom#the-places).                                                                                                               |
| `status`                                      | the type's          | The status badge: a text or a template, an object of badge keys with `value` for its text, or `false`; see [The status badge](/cards/poster-badges#the-status-badge).                                                                                                       |
| `badges`                                      | –                   | The badges in the corner, in order; `status` places the status badge; see [Badges](/cards/poster-badges).                                                                                                                                                                   |
| `visual`                                      | the type's          | The picture: `sparkline`, `columns`, `strip`, `bar`, `gauge`, `ring` (around the icon), `icon` for none; see [A picture](/cards/poster-custom#a-picture).                                                                                                                   |
| `image`                                       | the type's          | The backdrop: a URL, a template or an entity's picture; `false` drops the type's; see [A backdrop](/cards/poster-custom#a-backdrop).                                                                                                                                        |
| `rules`                                       | the type's          | Colour, icon, label, `style`, `pulse`, `tint_card` by value or state; they replace the type's own ([Predefined rules](/cards/poster-types#predefined-rules)); see [Colour and rules](/cards/poster-custom#colour-and-rules).                                                |
| `control`                                     | the type's          | A control as on the [entity cards](/cards/controls); `false` drops the type's; see [Poster controls](/cards/poster-controls).                                                                                                                                               |
| `hours_to_show`                               | `24`                | The picture's window.                                                                                                                                                                                                                                                       |
| `tap_action` …                                | `more-info`         | `tap_action`, `hold_action`, `double_tap_action`; `none` without an entity; see [Actions](/cards/poster-custom#actions).                                                                                                                                                    |
| `hover`                                       | `false`             | Home Assistant's hover and press layers.                                                                                                                                                                                                                                    |

Like every card, this one also accepts `grid_options`, `visibility`, `view_layout` and `card_mod`. A poster takes half a section (6 columns) and three rows by default, two at least; `fill_height: false` keeps it at its own height; see [Poster sizes](/cards/poster-sizes).
