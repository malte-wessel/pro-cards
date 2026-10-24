# Look & themes

Pro Cards follow the Home Assistant design. Card background, corner radius, typography, dividers, icon sizes and the named colours all come from the active theme, so the cards sit next to the built-in tile cards without looking foreign. Dark mode applies automatically.

## Themes

Any Home Assistant theme restyles Pro Cards together with the rest of the dashboard: the cards read the same variables as the built-in cards, so there is nothing to configure per card. Per card you adjust colours, icons, labels and visuals in YAML, as the card pages show.

Try it on this site: every example has a theme picker in its top-right corner, and the **auto / light / dark** button next to it switches that example between the light and dark variant. The example below is pinned to [Graphite](https://github.com/TilmanGriesel/graphite), a theme by Tilman Griesel.

::: live theme=graphite

```yaml
- type: custom:entity-group-card-pro
  title: Living room
  icon: mdi:sofa
  entities:
    - { entity: light.living_room, control: toggle, rules: [{ state: "on", color: amber, label: On }, { state: "off", color: grey, label: Off }] }
    - { entity: sensor.living_room_temperature, name: Temperature, decimals: 1, rules: [{ below: 19, color: blue, label: Cold }, { below: 24, color: green, label: Comfortable }, { above: 24, color: orange, label: Warm }] }
    - { entity: sensor.living_room_co2, name: CO₂, visual: strip, rules: [{ below: 800, color: green }, { below: 1200, color: amber }, { above: 1200, color: red }] }
    - { entity: sensor.robot_battery, name: Battery, visual: ring }
- type: custom:multi-trend-card-pro
  title: Outdoor
  icon: mdi:thermometer
  hours_to_show: 12
  x_axis: true
  entities:
    - { entity: sensor.outdoor_temperature, name: Temperature, color: red }
    - { entity: sensor.dew_point, name: Dew point, color: blue }
```

:::

## Theme variables

These are the variables of a Home Assistant theme the cards read. Set them in a theme (without the leading `--`, as Home Assistant's themes do) and every Pro Card follows, together with the built-in cards that read them too.

**Card**

| Variable                                       | What it changes                                                                      |
| ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `ha-card-background`, `card-background-color`  | the card's background (also behind the power flow's nodes and the flow cards' icons) |
| `ha-card-border-radius`                        | the card's corners                                                                   |
| `ha-card-border-width`, `ha-card-border-color` | the card's border                                                                    |
| `ha-card-box-shadow`                           | the card's shadow                                                                    |

**Colours**

| Variable                                                                                                                                                            | What it changes                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `primary-color`                                                                                                                                                     | the default colour of an entity, the power flow's home and summary                 |
| `primary-text-color`, `secondary-text-color`                                                                                                                        | the text                                                                           |
| `text-primary-color`                                                                                                                                                | the text on a filled button (a pressed control)                                    |
| `divider-color`                                                                                                                                                     | dividers, grid lines, tooltips' borders, the power flow's idle links               |
| `disabled-color`                                                                                                                                                    | the power flow's idle nodes                                                        |
| `red-color`, `amber-color`, … (every [named token](#colour-values))                                                                                                 | the colour of that name wherever a card uses it                                    |
| `state-<domain>-<state>-color`, `state-icon-color`, `state-unavailable-color`                                                                                       | the [colour of an entity by its state](#where-colour-comes-from), as on tile cards |
| `energy-solar-color`, `energy-grid-consumption-color`, `energy-grid-return-color`, `energy-battery-in-color`, `energy-battery-out-color`, `energy-non-fossil-color` | the power flow's sources and links, as on the energy dashboard                     |
| `weather-icon-sun-color`, `-moon-color`, `-cloud-front-color`, `-cloud-back-color`, `-rain-color`, `-snow-color`, `-snow-stroke-color`                              | the weather card's condition icons, as on the weather forecast card                |
| `switch-unchecked-track-color`                                                                                                                                      | a toggle that is off                                                               |

**Icons**

| Variable                     | What it changes                                                                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `ha-tile-icon-border-radius` | the shape behind an icon, as on Home Assistant's tile card (round by default; a ring and the power flow's nodes stay round)                   |
| `tile-icon-opacity`          | how strong the soft colour behind an icon is (`0.2` by default; `0` leaves the icon alone on the card)                                        |
| `tile-icon-hover-opacity`    | the same under the pointer, on an icon with its own action of an entity with [`hover: true`](/cards/entity-options#hover) (`0.35` by default) |

For example, a theme with rounded-square icons on a transparent background:

```yaml
frontend:
  themes:
    Flat icons:
      ha-tile-icon-border-radius: 10px
      tile-icon-opacity: 0
```

Home Assistant's own tile card keeps its icon background at 20 %: it sets `tile-icon-opacity` on the icon itself, so only the shape follows a theme there.

**Text**: the typography variables, see [Text size](#text-size) below.

card_mod and UIX can still style the cards, but the class names inside them are not a stable interface and can change with any release. Prefer the variables above where they cover what you want.

## Text size

The text follows Home Assistant's typography variables, the same ones the built-in cards read. A theme that changes them changes the Pro Cards with the rest of the dashboard, with no card_mod and no per-card option:

| Variable                                             | What it changes                                                                                                                                                |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ha-font-size-scale`                                 | every text size at once (`1.15` makes everything 15 % larger)                                                                                                  |
| `ha-font-size-xs` … `ha-font-size-5xl`               | one step of the scale (10, 12, 14, 16, 20, 24, 28, 32 and 40 px by default)                                                                                    |
| `ha-font-weight-normal`, `-medium`                   | the weights                                                                                                                                                    |
| `ha-font-family-body`                                | the font                                                                                                                                                       |
| `ha-tile-info-primary-*`, `ha-tile-info-secondary-*` | the name and the secondary line of tiles and list rows, as on Home Assistant's tile card: `font-size`, `font-weight`, `line-height`, `letter-spacing`, `color` |

For example, a theme that makes all text a little larger and the secondary line of tiles clearly larger:

```yaml
frontend:
  themes:
    Tablet:
      ha-font-size-scale: 1.15
      ha-tile-info-secondary-font-size: 15px
```

Whatever sits around the text grows with it: axis labels keep their room, the power flow's labels their place beside the nodes, a tile its two lines (so a tile with larger text can be taller than one row). Text inside a drawing that scales as a whole, such as the gauge's value, the illuminance arc and the value in an icon's circle, keeps its proportion to the drawing.

Pick **Large text** in an example's theme picker to see any example at `ha-font-size-scale: 1.25`, or look at this one:

::: live theme=large

```yaml
- type: custom:entity-group-card-pro
  title: Living room
  icon: mdi:sofa
  entities:
    - { entity: light.living_room, control: toggle }
    - { entity: sensor.living_room_temperature, name: Temperature, decimals: 1 }
    - { entity: sensor.living_room_co2, name: CO₂, visual: strip }
- type: custom:multi-trend-card-pro
  title: Outdoor
  icon: mdi:thermometer
  hours_to_show: 12
  x_axis: true
  y_axis: true
  entities:
    - { entity: sensor.outdoor_temperature, name: Temperature, color: red }
    - { entity: sensor.dew_point, name: Dew point, color: blue }
```

:::

## Colour values

Wherever a card accepts a colour you can use:

- a **named token**: `primary`, `accent`, `red`, `pink`, `purple`, `deep-purple`, `indigo`, `blue`, `light-blue`, `cyan`, `teal`, `green`, `light-green`, `lime`, `yellow`, `amber`, `orange`, `deep-orange`, `brown`, `grey`, `blue-grey`, `black`, `white`
- a **hex** value such as `#7e57c2`
- an **rgb()** / **hsl()** value
- any **CSS variable** such as `var(--my-color)`

Named tokens resolve to the theme's `--<name>-color`, so a theme that redefines `--amber-color` changes every card that uses `amber`.

::: live

```yaml
type: custom:entity-group-card-pro
title: The same sensor in six colours
layout: grid
columns: 3
entities:
  - { entity: sensor.outdoor_humidity, name: primary, color: primary, visual: ring }
  - { entity: sensor.outdoor_humidity, name: teal, color: teal, visual: ring }
  - { entity: sensor.outdoor_humidity, name: deep-purple, color: deep-purple, visual: ring }
  - { entity: sensor.outdoor_humidity, name: "#ff5252", color: "#ff5252", visual: ring }
  - { entity: sensor.outdoor_humidity, name: blue-grey, color: blue-grey, visual: ring }
  - { entity: sensor.outdoor_humidity, name: amber, color: amber, visual: ring }
```

:::

## Where colour comes from

For the entity cards the colour of an entity is decided in this order:

1. the entity's explicit `color` (a template is allowed)
2. the first matching `rules` entry that sets `color` (rules are tried in the order written)
3. Home Assistant's own state colour for the entity's domain and state: lights and switches amber when on, locks green when locked and red when unlocked, people green at home, covers purple while open, media players light blue while playing, batteries green / orange / red by level, and grey for inactive states. These are the theme's `--state-<domain>-<state>-color` tokens, so a theme that recolours HA's tile cards recolours these cards too.
4. `grey` for off-like states of other domains (`off`, `closed`, `idle`, `standby`, `docked`, `not_home`, `disarmed`, `clear`), otherwise `primary`. Plain sensors have no state colour and stay `primary`.

So set `color` only when the colour should never change; leave it out to let the rules or the state drive it. The same order applies to the icon: explicit `icon`, then the matching entry, then the entity's own icon. Labels come from the matching entry only.

::: live

```yaml
type: custom:entity-group-card-pro
title: Coloured like Home Assistant
layout: grid
columns: 3
entities:
  - { entity: light.living_room, name: Light on }
  - { entity: light.kitchen, name: Light off }
  - { entity: cover.living_room_blinds, name: Blinds open }
  - { entity: person.alex, name: At home }
  - { entity: person.sam, name: Away }
  - { entity: media_player.living_room_tv, name: Playing }
  - { entity: sensor.robot_battery, name: Battery, visual: ring }
  - { entity: sensor.kitchen_window_battery, name: Low battery, visual: ring }
  - { entity: sensor.outdoor_temperature, name: Plain sensor }
```

:::

## Card tint

`tint_card: true` on a rule washes the whole card in that entry's colour while it matches. Use it for the states that deserve attention, not for the normal case.

::: live

```yaml
type: custom:entity-group-card-pro
title: Batteries
icon: mdi:battery-heart-variant
entities:
  - entity: sensor.motion_hallway_battery
    name: Hallway motion
    visual: bar
    rules:
      - { below: 20, color: red, icon: mdi:battery-alert, label: Replace, tint_card: true }
      - { below: 50, color: amber, icon: mdi:battery-50, label: Half }
      - { above: 50, color: green, icon: mdi:battery, label: Good }
  - entity: sensor.kitchen_window_battery
    name: Kitchen window
    visual: bar
    rules:
      - { below: 20, color: red, icon: mdi:battery-alert, label: Replace, tint_card: true }
      - { below: 50, color: amber, icon: mdi:battery-50, label: Half }
      - { above: 50, color: green, icon: mdi:battery, label: Good }
```

:::
