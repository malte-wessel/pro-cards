# Look & themes

Pro Cards follow the Home Assistant design. Card background, corner radius, typography, dividers, icon sizes and the named colours all come from the active theme, so the cards sit next to the built-in tile cards without looking foreign. Dark mode applies automatically.

That also makes the look customizable without touching a single card: a theme that redefines `--primary-color`, `--ha-card-background`, `--ha-card-border-radius`, `--amber-color` or the `--state-<domain>-<state>-color` tokens restyles every Pro Card together with the rest of the dashboard. Per card you adjust colours, icons, labels and visuals in YAML, as the card pages show; the theme decides how those colours look.

## Themes

A Home Assistant theme is a YAML map of CSS variables. Home Assistant loads the files from `frontend: themes: !include_dir_merge_named themes` in `configuration.yaml`, each user picks a theme in their profile, and a theme with a `modes:` section provides separate `light:` and `dark:` values. Every card on the dashboard reads the same variables, and so do Pro Cards.

**Try it on this site.** Every example has a theme picker in its top-right corner. Pick **Graphite** to see the cards under a different theme: the choice applies to every example on every page and is remembered. The **auto / light / dark** button next to it switches only that example between the light and dark variant. The example below is pinned to Graphite.

::: live theme=graphite

```yaml
- type: custom:entity-group-card
  title: Living room
  icon: mdi:sofa
  grid_options: { columns: 6 }
  entities:
    - { entity: light.living_room, toggle: true, rules: [{ state: "on", color: amber, label: On }, { state: "off", color: grey, label: Off }] }
    - { entity: sensor.living_room_temperature, name: Temperature, decimals: 1, rules: [{ below: 19, color: blue, label: Cold }, { below: 24, color: green, label: Comfortable }, { above: 24, color: orange, label: Warm }] }
    - { entity: sensor.living_room_co2, name: CO₂, visual: strip, rules: [{ below: 800, color: green }, { below: 1200, color: amber }, { above: 1200, color: red }] }
    - { entity: sensor.robot_battery, name: Battery, visual: ring }
- type: custom:multi-trend-card
  title: Outdoor
  icon: mdi:thermometer
  hours_to_show: 12
  grid_options: { columns: 6 }
  entities:
    - { entity: sensor.outdoor_temperature, name: Temperature, color: red }
    - { entity: sensor.dew_point, name: Dew point, color: blue }
```

:::

[Graphite](https://github.com/TilmanGriesel/graphite) is a theme by Tilman Griesel (MIT). The docs site carries a reduced copy of its light and dark tokens; install the real theme through HACS to use it in Home Assistant.

## Tokens the cards read

A theme only needs to set the variables it wants to change; everything else keeps Home Assistant's default. These are the ones Pro Cards use:

| Purpose  | Variables                                                                                                                                                                        |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Surface  | `ha-card-background` (falls back to `card-background-color`), `ha-card-border-radius`, `ha-card-border-width`, `ha-card-border-color`, `ha-card-box-shadow`                      |
| Text     | `primary-text-color`, `secondary-text-color`, `disabled-text-color`                                                                                                              |
| Lines    | `divider-color`                                                                                                                                                                  |
| Colours  | `primary-color`, `accent-color`, `state-icon-color`, the named `<name>-color` tokens (`amber-color`, `blue-color`, …), `state-<domain>-<state>-color`, `state-unavailable-color` |
| Controls | `switch-unchecked-track-color` for the toggle in entity rows                                                                                                                     |
| Sun path | `light-blue-color` (day), `indigo-color` (night) and `amber-color` (sun) are the defaults of `day_color`, `night_color` and `sun_color`                                          |

The gradients, soft backgrounds and card tints are computed from these colours at render time, so they follow the theme too.

## Write your own theme

A small theme that rounds the cards more, gives them a shadow and swaps the blue accent for a green one, in `themes/mine.yaml`:

```yaml
Mine:
  primary-color: "#2e7d32"
  accent-color: "#43a047"
  ha-card-border-radius: 20px
  ha-card-border-width: 0
  ha-card-box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12)
  amber-color: "#f4b400"
  modes:
    light:
      card-background-color: "#ffffff"
    dark:
      card-background-color: "#1e2126"
```

Because the built-in tile, entity and graph cards read the same variables, the dashboard changes as one. Restart Home Assistant (or call `frontend.reload_themes`) and pick the theme in your profile.

## Per-card tweaks

Global changes belong in a theme; per card, use the card's own options: `color`, the rule colours and `tint_card`. If a single card still needs something a theme cannot express, [card-mod](https://github.com/thomasloven/lovelace-card-mod) can set the same variables on that card only:

```yaml
type: custom:entity-card
entity: sensor.outdoor_temperature
card_mod:
  style: |
    ha-card { --ha-card-border-radius: 4px; --primary-color: var(--deep-purple-color); }
```

## Colour values

Wherever a card accepts a colour you can use:

- a **named token**: `primary`, `accent`, `red`, `pink`, `purple`, `deep-purple`, `indigo`, `blue`, `light-blue`, `cyan`, `teal`, `green`, `light-green`, `lime`, `yellow`, `amber`, `orange`, `deep-orange`, `brown`, `grey`, `blue-grey`, `black`, `white`
- a **hex** value such as `#7e57c2`
- an **rgb()** / **hsl()** value
- any **CSS variable** such as `var(--my-color)`

Named tokens resolve to the theme's `--<name>-color`, so a theme that redefines `--amber-color` changes every card that uses `amber`.

::: live

```yaml
type: custom:entity-group-card
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
type: custom:entity-group-card
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
type: custom:entity-group-card
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
