# Poster

`custom:poster-card-pro` draws one entity as a poster: its value large, with room for a picture, a plot or an animation. Use it for the few things that deserve the space; the [tile](/cards/tile-card) draws the same entities smaller.

::: info Beta
The poster card is new in 3.0 and in beta: its options may still change.
:::

## The parts

A poster is half a section wide and three rows high. Its content sits at the bottom of whatever height it gets:

- the **icon** at the top left: the entity's icon or picture, or the kind's own drawing.
- the **badges** at the top right. The first is the **status badge**: the kind's status or the matching rule's.
- the **name** in small capitals, the large **value**, and a line under it with what the kind adds.
- the **controls** beside the value, or under it on a narrow card: a light's switch and dimmer, a thermostat's stepper.
- the **visual**: along the bottom (a plot of the last hours, the forecast, a battery's segments) or behind it all (a light's glow, a picture, the wind's animation).

What fills these parts comes from the entity's [kind](/cards/kinds): what the entity is. The kind is detected from the entity, so most posters need only `entity`.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.power_consumption
  name: Power
  visual: { type: sparkline, hours: 12 }
  rules:
    - { below: 1000, color: green, status: Low }
    - { below: 3000, color: amber, status: Normal }
    - { above: 3000, color: red, status: High }
  badges:
    - sensor.solar_power
    - sensor.battery_power
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: light.living_room
  grid_options: { columns: 6 }
```

:::

## A first set of posters

Six entities, nothing but `entity` and a name here and there. The thermostat brings its stepper, the speaker its cover art and buttons, the weather its forecast, the wind an animated field, the robot its path and the CO₂ sensor its air quality bands.

::: live

```yaml
- type: custom:poster-card-pro
  entity: climate.living_room
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: media_player.living_room_speaker
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: weather.home
  name: Outside
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.wind_speed
  name: Wind
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: vacuum.robot
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.living_room_co2
  grid_options: { columns: 6 }
```

:::

## Changing one thing

Every part has a key of its own: `name`, `icon`, `color`, `value`, `status`, `visual`, `control` and more. A key sets its part and the kind fills the rest, so you change one detail and keep everything else.

`rules` change the look by the value: the first matching rule sets the colour, the icon or the status. A rule's colour and icon win over the card's `color` and `icon`, which are only defaults. [Look](/cards/look) covers the icon, the visual, colours and rules in full.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.living_room_temperature
  name: Living room
  rules:
    - { below: 19, color: blue, status: Cold }
    - { below: 24, color: green, status: Comfortable }
    - { above: 24, color: orange, status: Warm }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.living_room_humidity
  name: Humidity
  icon: mdi:water-percent
  color: teal
  visual: { type: sparkline, hours: 6 }
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
```

:::

## The visual editor

Home Assistant's card editor shows a form for the poster. It starts with what the poster shows: the entity as it is, texts of your own (no entity), or a kind; under it the entity, offering only those that fit the kind, and the other entities the kind reads. A kind the entity does not fit waits for one that does: the YAML stays as it was until you pick one. Then come the name, the value, the appearance (the colour, the icon and the visual), the controls, the status and the badges, the rules and the interactions. It offers only what applies, and a field left alone keeps the kind's default and writes nothing to the YAML. The badges and the rules are lists: a row each, saying what it shows or when it matches, and its form in a view of its own (a back arrow returns). A badge's form starts the same way, with what it shows (the entity as it is, a text of your own, or a kind whose colours it takes; an empty entity reads the poster's), then its name, value, appearance, visual, switch, actions and its own rules, each rule opening on top of the badge. Try it in the [Playground](/playground), or with **Edit** under any example.

Coming from the entity card? [Moving to 3.0](/guide/migrating) maps its keys to the poster's.

## Reference

### Entity and kind

| Key             | Default             | Description                                                                                                                                      |
| --------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `entity`        | –                   | The entity. Optional: the keys alone can fill a poster.                                                                                          |
| `kind`          | detected            | What the entity is; see [Kinds](/cards/kinds). `none` turns every default off.                                                                   |
| `inputs`        | found on the device | The other entities a kind reads, by name (`direction`, `gust`, `today` …), each an entity or `false` for none; [Kinds](/cards/kinds) lists them. |
| `running_above` | –                   | An appliance's power (W) above which it runs.                                                                                                    |
| `series`        | –                   | A trend's series: entity ids, or objects with `entity`, `name`, `color`, `rules`, `visibility`.                                                  |

### Texts and value

| Key                       | Default                      | Description                                                                                             |
| ------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| `name`                    | the friendly name            | The name above the value. Template allowed.                                                             |
| `value`                   | the kind's, else the state   | A text or a template in place of the state.                                                             |
| `attribute`               | –                            | Shows this attribute in place of the state.                                                             |
| `unit`                    | the entity's                 | The value's unit.                                                                                       |
| `decimals`                | –                            | Decimals of a number, 0 to 3.                                                                           |
| `prefix`, `suffix`        | –                            | Text before and after the value.                                                                        |
| `min`, `max`              | the entity's, else 0 and 100 | The range of a bar, a gauge, segments, a glow or the icon's ring.                                       |
| `secondary`               | the kind's                   | The line under the value. Template allowed.                                                             |
| `status`                  | the rule's, else the kind's  | The status badge, first in the corner: a text, a template, or `false` for none. It wins over the rules. |
| `show_name`, `show_value` | `true`                       | `false` leaves out the name or the value.                                                               |

### Look

| Key      | Default    | Description                                                                                                                                                                                                                                        |
| -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `icon`   | the kind's | An icon's name or a template; `{ type: icon \| image \| flow, … }` with its options and its own actions; or `false` for none. See [Look](/cards/look).                                                                                             |
| `visual` | the kind's | Along the bottom: `sparkline`, `columns`, `strip`, `bar`, `gauge`, `segments`, `sun`. Behind it all: `glow`, `image`, `flow`, and a kind's `cover`, `path` or `line`. A name, `{ type, … }` with its options, or `false`; see [Look](/cards/look). |
| `color`  | the kind's | The poster's colour: a colour name, a hex or a template. A matching rule's colour wins.                                                                                                                                                            |
| `rules`  | the kind's | Colour, icon, status, tint and the visual by value or state; the first match wins. Yours replace the kind's, `[]` drops them. See [Look](/cards/look).                                                                                             |

### Controls, badges and actions

| Key                 | Default     | Description                                                                                                                                                                                 |
| ------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control`           | the kind's  | `auto`, a control's name (`toggle`, `slider`, `stepper`, `segments`, `buttons`, `button`, `select`, `hold`), `false` for none, or `{ type, position, … }`; see [Controls](/cards/controls). |
| `badges`            | –           | Badges in the corner after the status: entity ids or badges of your own; see [Badges](/cards/badges).                                                                                       |
| `tap_action`        | `more-info` | What a tap on the poster does; see [Actions & hover](/cards/actions).                                                                                                                       |
| `hold_action`       | `more-info` | What a hold does.                                                                                                                                                                           |
| `double_tap_action` | `none`      | What a double tap does.                                                                                                                                                                     |
| `hover`             | `true`      | Home Assistant's hover and press effects; `false` keeps the poster still.                                                                                                                   |

### Grid and Home Assistant options

A poster takes 6 columns and 3 rows by default, and that at least: for less room, use a tile. Its content sits at the bottom of the height it gets. See [Sizes](/cards/sizes).

| Key            | Default | Description                                                                |
| -------------- | ------- | -------------------------------------------------------------------------- |
| `grid_options` | –       | Home Assistant's size in a sections view: `columns`, `rows`.               |
| `fill_height`  | `true`  | Fills the height the card is given; `false` keeps the poster's own height. |
| `visibility`   | –       | Home Assistant's conditions that show or hide the whole card.              |
| `view_layout`  | –       | Placement in a [layout card](/cards/layout-card) or a custom view.         |
| `card_mod`     | –       | Styles for the card-mod plugin.                                            |
