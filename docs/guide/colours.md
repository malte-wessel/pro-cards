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
    - { entity: light.living_room, toggle: true, rules: [{ state: "on", color: amber, label: On }, { state: "off", color: grey, label: Off }] }
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
