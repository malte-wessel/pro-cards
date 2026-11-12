# Themes & colours

Pro Cards follow your Home Assistant theme, so they look at home next to the built-in cards. This guide shows what a theme changes, which colours you can write, and where a card's colour comes from.

## Themes

Any Home Assistant theme restyles the cards with the rest of the dashboard; there is nothing to set per card. Every example here has a theme picker in its top-right corner. This one is pinned to [Graphite](https://github.com/TilmanGriesel/graphite), a theme by Tilman Griesel.

::: live theme=graphite

```yaml
- type: custom:tile-group-card-pro
  title: Living room
  icon: mdi:sofa
  tiles:
    - light.living_room
    - { entity: sensor.living_room_temperature, name: Temperature, decimals: 1, rules: [{ below: 19, color: blue, status: Cold }, { below: 24, color: green, status: Comfortable }, { above: 24, color: orange, status: Warm }] }
    - { entity: sensor.living_room_co2, name: CO₂, visual: strip }
    - { entity: sensor.robot_battery, name: Battery, icon: { ring: true } }
- type: custom:multi-trend-card-pro
  title: Outdoor
  icon: mdi:thermometer
  hours: 12
  x_axis: true
  entities:
    - { entity: sensor.outdoor_temperature, name: Temperature, color: red }
    - { entity: sensor.dew_point, name: Dew point, color: blue }
```

:::

## Dark mode

The cards follow Home Assistant's dark mode and a theme's dark variant on their own. The **auto / light / dark** button beside an example's theme picker shows it in either mode.

## Theme variables

The cards read these theme variables. Set them in a theme (without the leading `--`) and every Pro Card follows, as do the built-in cards that read them.

| Variable                                                                                    | What it changes                                                                                |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `ha-card-background`, `card-background-color`                                               | the card's background                                                                          |
| `ha-card-border-radius`, `ha-card-border-width`, `ha-card-border-color`                     | the card's corners and border                                                                  |
| `ha-card-box-shadow`                                                                        | the card's shadow                                                                              |
| `primary-color`                                                                             | the default colour of a badge, and of an entity in the deprecated cards; the power flow's home |
| `state-icon-color`                                                                          | the default colour of an entity on a tile, a poster and a tile group                           |
| `primary-text-color`, `secondary-text-color`                                                | the text                                                                                       |
| `text-primary-color`                                                                        | the text on a filled button (a pressed control)                                                |
| `divider-color`                                                                             | dividers, grid lines, the power flow's idle links                                              |
| `disabled-color`                                                                            | the grey behind the controls of a tile and a poster; the power flow's idle nodes               |
| `red-color`, `amber-color` … (every [named colour](#colour-values))                         | that colour wherever a card uses it                                                            |
| `state-<domain>-<state>-color`, `state-inactive-color`, `state-unavailable-color`           | an entity's [colour by its state](#where-colour-comes-from)                                    |
| `energy-solar-color`, `energy-grid-consumption-color`, `energy-battery-in-color` …          | the power and energy flow's sources and links, as on the energy panel                          |
| `weather-icon-sun-color`, `-moon-color`, `-cloud-front-color`, `-rain-color`, `-snow-color` | the weather icons, as on the weather forecast card                                             |
| `switch-unchecked-track-color`                                                              | a toggle that is off                                                                           |
| `ha-tile-icon-border-radius`                                                                | the shape behind an icon (round by default; a ring stays round)                                |
| `tile-icon-opacity`, `tile-icon-hover-opacity`                                              | the soft colour behind an icon (`0.2`), and under the pointer (`0.35`)                         |

For example, rounded-square icons with no colour behind them:

```yaml
frontend:
  themes:
    Flat icons:
      ha-tile-icon-border-radius: 10px
      tile-icon-opacity: 0
```

card_mod and UIX still work, but the cards' inner class names can change with any release, so prefer the variables.

## Text size

The text follows Home Assistant's typography variables. A theme with larger text, for a wall tablet or for easier reading, makes every Pro Card's text larger too.

| Variable                                             | What it changes                                                              |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| `ha-font-size-scale`                                 | every text size at once (`1.15` makes everything 15 % larger)                |
| `ha-font-size-xs` … `ha-font-size-5xl`               | one step of the scale (10 to 40 px)                                          |
| `ha-font-weight-normal`, `-medium`                   | the weights                                                                  |
| `ha-font-family-body`                                | the font                                                                     |
| `ha-tile-info-primary-*`, `ha-tile-info-secondary-*` | a tile's name and line: `font-size`, `font-weight`, `line-height`, `color` … |

```yaml
frontend:
  themes:
    Tablet:
      ha-font-size-scale: 1.15
      ha-tile-info-secondary-font-size: 15px
```

The cards make room for it: a tile grows taller, a plot keeps space for its labels. Text inside a drawing, such as a gauge's value, scales with the drawing. **Large text** in the theme picker shows any example at `ha-font-size-scale: 1.25`:

::: live theme=large

```yaml
- type: custom:tile-group-card-pro
  title: Living room
  icon: mdi:sofa
  tiles:
    - light.living_room
    - { entity: sensor.living_room_temperature, name: Temperature, decimals: 1 }
    - { entity: sensor.living_room_co2, name: CO₂, visual: strip }
- type: custom:multi-trend-card-pro
  title: Outdoor
  icon: mdi:thermometer
  hours: 12
  x_axis: true
  y_axis: true
  entities:
    - { entity: sensor.outdoor_temperature, name: Temperature, color: red }
    - { entity: sensor.dew_point, name: Dew point, color: blue }
```

:::

## Colour values

Wherever a card takes a colour, you can write:

- a **name**: `primary`, `accent`, `red`, `pink`, `purple`, `deep-purple`, `indigo`, `blue`, `light-blue`, `cyan`, `teal`, `green`, `light-green`, `lime`, `yellow`, `amber`, `orange`, `deep-orange`, `brown`, `light-grey`, `grey`, `dark-grey`, `blue-grey`, `black`, `white`, and `primary-text`, `secondary-text`, `disabled`;
- a **hex** value such as `#7e57c2`, `rgb()` / `hsl()`, or any other CSS colour such as `tomato`;
- a **CSS variable** such as `var(--my-color)`;
- on a tile, a poster and their badges, a **template** that gives one of these.

A name is the theme's `--<name>-color`, so a theme that changes `amber-color` changes every card that uses `amber`.

::: live

```yaml
type: custom:layout-card-pro
columns: 3
cards:
  - { type: custom:tile-card-pro, entity: sensor.living_room_humidity, name: primary, color: primary, icon: { ring: true } }
  - { type: custom:tile-card-pro, entity: sensor.living_room_humidity, name: teal, color: teal, icon: { ring: true } }
  - { type: custom:tile-card-pro, entity: sensor.living_room_humidity, name: deep-purple, color: deep-purple, icon: { ring: true } }
  - { type: custom:tile-card-pro, entity: sensor.living_room_humidity, name: "#ff5252", color: "#ff5252", icon: { ring: true } }
  - { type: custom:tile-card-pro, entity: sensor.living_room_humidity, name: blue-grey, color: blue-grey, icon: { ring: true } }
  - { type: custom:tile-card-pro, entity: sensor.living_room_humidity, name: amber, color: amber, icon: { ring: true } }
```

:::

## Where colour comes from

On a tile, a poster, a tile group and the badges of every card, an entity's colour is the first of these that has one, as Home Assistant's own tile and badge choose it:

1. the first matching rule's `color` (yours, or the [kind](/cards/kinds)'s own rules, such as a battery's levels);
2. the card's `color`, while the entity is active (on, open, playing, home; a sensor always is). Off or closed it takes the state's colour, as on Home Assistant's tile;
3. the kind's colour: a light in its own colour (a pale one more saturated and white a light grey, so it shows on a card), a thermostat warm while it heats and cool while it cools;
4. Home Assistant's colour for the entity's state, the theme's `state-<domain>-<state>-color`, whatever value the card shows: lights amber when on, a thermostat by its mode, locks green or red, people green at home, media players light blue while playing, batteries red below 30 %, orange below 70 %, green above; an unavailable entity `state-unavailable-color`;
5. while active, Home Assistant's state icon colour (`state-icon-color`, steel blue in the default theme) on a tile, a poster and a tile group, and `primary` on a badge; while not (off, unknown), `state-inactive-color`. A plain sensor takes the state icon colour.

The deprecated cards keep their order: their `color` beats the rules in every state, an off-like word (`idle`, `closed`, `standby` …) is `grey`, and the rest `primary`.

So set `color` for the usual colour and let rules say when it changes. The icon works the same way: the rule's, then the card's, then the entity's own ([Look](/cards/look)). In the deprecated cards and the old `header_entities`, `color` and `icon` beat the rules instead ([Moving to 3.0](/guide/migrating)).

::: live

```yaml
type: custom:layout-card-pro
columns: 3
cards:
  - { type: custom:tile-card-pro, entity: light.living_room, name: Light on, control: false }
  - { type: custom:tile-card-pro, entity: light.kitchen, name: Light off, control: false }
  - { type: custom:tile-card-pro, entity: lock.front_door, name: Front door, control: false }
  - { type: custom:tile-card-pro, entity: person.malte, name: At home }
  - { type: custom:tile-card-pro, entity: person.sam, name: Away }
  - { type: custom:tile-card-pro, entity: media_player.living_room_speaker, name: Playing, control: false }
  - { type: custom:tile-card-pro, entity: sensor.robot_battery, name: Battery, icon: { ring: true } }
  - { type: custom:tile-card-pro, entity: sensor.motion_hallway_battery, name: Low battery, icon: { ring: true } }
  - { type: custom:tile-card-pro, entity: sensor.living_room_temperature, name: Plain sensor }
```

:::

## Tinted cards

`tint_card: true` on a rule washes the card in the rule's colour while it matches; in a tile group, just that tile. Keep it for states that need attention.

::: live

```yaml
type: custom:tile-group-card-pro
title: Batteries
icon: mdi:battery-heart-variant
tiles:
  - entity: sensor.motion_hallway_battery
    name: Hallway motion
    visual: bar
    rules: &batteries
      - { below: 20, color: red, icon: mdi:battery-alert, status: Replace, tint_card: true }
      - { below: 50, color: amber, icon: mdi:battery-50, status: Half }
      - { above: 50, color: green, icon: mdi:battery, status: Good }
  - entity: sensor.kitchen_window_battery
    name: Kitchen window
    visual: bar
    rules: *batteries
```

:::
