# Tile controls

A tile can carry one control: a switch, a slider, a stepper, speeds, buttons, a select or a button to hold. Every [poster type](/cards/tile-types) takes `control`, the same key as on the [poster](/cards/poster-controls) and the [entity cards](/cards/controls). A control needs an entity that supports it, and your own `buttons` can run any action. Poster types for a domain (light, cover, media player …) bring their own controls: a light's tile has a switch without any config.

A tap on the tile opens more-info. The control takes its own taps, and the icon has [actions of its own](#the-icon). This page covers what each poster type brings, every control, where it sits, your own buttons and holds. The [overview](/cards/tile-card) explains the tile around them.

## What the poster types bring

Without `control` (or with `control: auto`), a domain poster type draws its own controls at the end of the line. A poster's controls below its value (a light's brightness, a player's volume) would make a tile taller: on a tile they are asked for with `control: slider`.

| Poster type            | Controls                                                      |
| ---------------------- | ------------------------------------------------------------- |
| `light`                | a switch                                                      |
| `fan`                  | its speeds                                                    |
| `climate`              | a stepper for the target temperature                          |
| `lock`                 | hold the icon to lock or unlock (`icon_hold_action`)          |
| `alarm_control_panel`  | hold the icon to arm or disarm, unless the panel wants a code |
| `media_player`         | previous, play / pause and next                               |
| `cover`                | open, stop and close                                          |
| `vacuum`, `lawn_mower` | start / pause and back to the dock                            |

Every other poster type (a sensor, the weather, the wind, the energy types …) has no control unless you set one.

::: live

```yaml
- type: custom:tile-card-pro
  entity: light.living_room
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: lock.front_door
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: fan.living_room
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: climate.living_room
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: cover.office_blinds
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: vacuum.robot
  grid_options: { columns: 12 }
```

:::

## Another control, or none

`control` with a name shows that control in place of the poster type's. `control: false` (or `none`) shows none. A light that only dims, a fan that only switches, a thermostat to look at:

::: live

```yaml
- type: custom:tile-card-pro
  entity: light.desk_lamp
  control: slider
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: fan.bedroom
  control: toggle
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: climate.living_room
  control: false
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: cover.living_room_blinds
  control: slider
  grid_options: { columns: 6 }
```

:::

A card names one control: `control: slider` on a light shows the slider alone, without the switch. To switch it too, tap the icon (`icon_tap_action: { action: toggle }`).

## A control on any tile

Every tile takes a control its entity supports, whatever its poster type. The names:

| `control`  | Draws                      | For                                                             |
| ---------- | -------------------------- | --------------------------------------------------------------- |
| `toggle`   | a switch                   | lights, switches, fans, input booleans, media players …         |
| `slider`   | a slider                   | brightness, cover position, volume, fan speed, numbers          |
| `stepper`  | − and + around the value   | thermostats, numbers                                            |
| `segments` | one segment per option     | fan speeds, a thermostat's modes, selects                       |
| `select`   | a dropdown                 | selects, input selects, modes                                   |
| `buttons`  | a row of buttons           | covers, media players, robots; or [your own](#your-own-buttons) |
| `button`   | one round button           | scripts, scenes, buttons                                        |
| `hold`     | a button held for a second | locks, alarm panels; any switch that should not go by accident  |

::: live

```yaml
- type: custom:tile-card-pro
  entity: input_number.heating_boost
  name: Boost
  control: slider
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: input_select.house_mode
  name: House
  icon: mdi:home-account
  control: select
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: switch.coffee_machine
  icon: mdi:coffee-maker
  control: toggle
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: script.check_windows
  name: Windows
  value: Check
  control: button
  grid_options: { columns: 6 }
```

:::

On a thermostat or a fan, `control_attribute` picks what segments and a select change: `hvac_mode`, `preset_mode` or `fan_mode`. `control_options` limits segments and selects to the options listed, each with its own `label` and `icon`. See [A control on any poster](/cards/poster-controls#a-control-on-any-poster).

## Where it sits

A control has two places on a tile, set with `control_position`:

| `control_position` | Place                                 | The default of                                 |
| ------------------ | ------------------------------------- | ---------------------------------------------- |
| `end`              | at the end of the line                | switch, stepper, speeds, buttons, select, hold |
| `block`            | below the line, across the whole tile | slider                                         |

On a narrow tile, a control at the `end` moves under the line rather than squeezing the name. A tile with a control on its line asks the sections grid for more columns: four for a switch or a hold, six for anything wider. See [Tile sizes](/cards/tile-sizes).

::: live

```yaml
- type: custom:tile-card-pro
  entity: cover.garage_door
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: cover.garage_door
  control_position: block
  grid_options: { columns: 12 }
```

:::

## Your own buttons

`control: buttons` with `control_options` draws your own buttons. Each button runs its `entity` (a scene, a script, a button), switches it (a light, a switch, a fan; filled while it is on) or runs its `action`. A tile of buttons needs no entity. The keys of a button are on [Your own buttons](/cards/poster-controls#your-own-buttons).

::: live

```yaml
- type: custom:tile-card-pro
  name: Evening
  icon: mdi:weather-night
  value: Living room
  color: deep-purple
  control: buttons
  control_options:
    - { entity: scene.dimmed, icon: mdi:lamp, color: amber }
    - { entity: scene.movie_night, icon: mdi:movie-open, color: deep-purple }
    - { entity: light.living_room, icon: mdi:ceiling-light, color: orange }
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  name: Scenes
  icon: mdi:palette
  control: buttons
  control_position: block
  control_options:
    - { entity: scene.bright, label: Bright, color: amber }
    - { entity: scene.dinner, label: Dinner, color: orange }
    - { entity: scene.good_night, label: Night, color: indigo }
  grid_options: { columns: 6 }
```

:::

## Hold to confirm

Some things should not happen by a stray tap. A hold fills a ring around the button for a second and runs when it is full. Letting go earlier cancels.

- `control_confirm: true` turns a switch or buttons into holds, each button its own.
- `control: hold` is a button to hold for any entity that switches.
- `icon_hold_action` holds the icon. Locks and alarm panels do this by default, unless the panel wants a code.

::: live

```yaml
- type: custom:tile-card-pro
  entity: cover.garage_door
  control_confirm: true
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: switch.garden_pump
  icon: mdi:water-pump
  icon_hold_action: { action: toggle }
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: switch.garden_pump
  icon: mdi:water-pump
  control: hold
  grid_options: { columns: 6 }
```

:::

A held icon shows the entity as it is, and its label says what holding does ("Hold to unlock"). With a screen reader, one click arms a hold and a second click within five seconds runs it.

## The icon

The icon has its own actions, as on Home Assistant's tile card: `icon_tap_action`, `icon_hold_action` and `icon_double_tap_action`. [The icon](/cards/tile-custom#the-icon) on Custom tiles explains them, with examples.

## Reference

| Key                 | Default                      | Description                                                                                                                        |
| ------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `control`           | `auto`                       | `auto` (the poster type's), `toggle`, `slider`, `stepper`, `segments`, `select`, `buttons`, `button`, `hold`, or `false` / `none`. |
| `control_position`  | the control's own            | `end` or `block`.                                                                                                                  |
| `control_attribute` | the shown one, else the mode | `hvac_mode`, `preset_mode` or `fan_mode`: what segments and a select change on a thermostat or fan.                                |
| `control_options`   | the entity's                 | Segments and select: the options (`value`, `label`, `icon`). Buttons: [your own buttons](#your-own-buttons).                       |
| `control_confirm`   | `false`                      | Turns the switch and the buttons into holds.                                                                                       |

What a control does, how it shows a call on its way and what it does when one fails is the same on every card: see [Controls](/cards/controls).
