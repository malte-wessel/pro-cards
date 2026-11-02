# Tile controls

A tile can carry one control: a switch, a slider, a stepper, speeds, buttons, a select or a button to hold. Every [kind](/cards/tile-types) takes `control`, as the [poster](/cards/poster-controls) does: a control's name as on the [entity cards](/cards/controls), or the control with its options (`control: { type: slider, step: 5 }`). A control needs an entity that supports it, and your own `buttons` can run any action. Kinds for a domain (light, cover, media player …) bring their own controls: a light's tile has a switch without any config.

A tap on the tile opens more-info. The control takes its own taps, and the icon has [actions of its own](#the-icon). This page covers what each kind brings, every control, where it sits, your own buttons and holds. The [overview](/cards/tile-card) explains the tile around them.

## What the kinds bring

Without `control` (or with `control: auto`), a domain kind draws its own controls at the end of the line. A poster's controls below its value (a light's brightness, a player's volume) would make a tile taller: on a tile they are asked for with `control: slider`.

| Kind                   | Controls                                                      |
| ---------------------- | ------------------------------------------------------------- |
| `light`                | a switch                                                      |
| `fan`                  | its speeds                                                    |
| `climate`              | a stepper for the target temperature                          |
| `lock`                 | hold the icon to lock or unlock (`icon: { hold_action }`)     |
| `alarm_control_panel`  | hold the icon to arm or disarm, unless the panel wants a code |
| `media_player`         | previous, play / pause and next                               |
| `cover`                | open, stop and close                                          |
| `vacuum`, `lawn_mower` | start / pause and back to the dock                            |

Every other kind (a sensor, the weather, the wind, the energy kinds …) has no control unless you set one.

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
  status_badge: true
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: climate.living_room
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: cover.office_blinds
  status_badge: true
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: vacuum.robot
  grid_options: { columns: 12 }
```

:::

## Another control, or none

`control` with a name shows that control in place of the kind's. `control: false` (or `none`) shows none. A light that only dims, a fan that only switches, a thermostat to look at:

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

A card names one control: `control: slider` on a light shows the slider alone, without the switch. To switch it too, tap the icon: a light's icon toggles it by default (`icon: { tap_action: { action: toggle } }` on other kinds).

## A control on any tile

Every tile takes a control its entity supports, whatever its kind. The names:

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

## The control's options

A control with options is an object: its `type` (the name above) and what it takes. On a thermostat or a fan, `attribute` picks what segments and a select change: `hvac_mode`, `preset_mode` or `fan_mode`. By default it is the attribute the tile shows, else the main mode. `options` limits segments and selects to the options listed, each with its own `label` and `icon`:

::: live

```yaml
- type: custom:tile-card-pro
  entity: input_select.house_mode
  name: House
  icon: mdi:home-account
  control:
    type: segments
    position: block
    options:
      - { value: Home, icon: mdi:home }
      - { value: Away, icon: mdi:home-export-outline }
      - { value: Night, icon: mdi:weather-night }
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: climate.bedroom
  name: Bedroom
  control: { type: segments, attribute: hvac_mode, position: block }
  grid_options: { columns: 12 }
```

:::

## Where it sits

A control has two places on a tile, set with its `position`:

| `position` | Place                                 | The default of                                 |
| ---------- | ------------------------------------- | ---------------------------------------------- |
| `end`      | at the end of the line                | switch, stepper, speeds, buttons, select, hold |
| `block`    | below the line, across the whole tile | slider                                         |

On a narrow tile, a control at the `end` moves under the line rather than squeezing the name. A tile too short for that (a fixed row) keeps it on the line beside the name; where even that does not fit, the control is left out and a tap opens more-info. A tile with a control on its line asks the sections grid for more columns: four for a switch or a hold, six for anything wider. See [Tile sizes](/cards/tile-sizes).

::: live

```yaml
- type: custom:tile-card-pro
  entity: cover.garage_door
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: cover.garage_door
  control: { position: block }
  grid_options: { columns: 12 }
```

:::

## Your own buttons

`control: { type: buttons, options: [ … ] }` draws your own buttons. Each button runs its `entity` (a scene, a script, a button), switches it (a light, a switch, a fan; filled while it is on) or runs its `action`. A tile of buttons needs no entity. The keys of a button are on [Your own buttons](/cards/poster-controls#your-own-buttons).

::: live

```yaml
- type: custom:tile-card-pro
  name: Evening
  icon: mdi:weather-night
  value: Living room
  color: deep-purple
  control:
    type: buttons
    options:
      - { entity: scene.dimmed, icon: mdi:lamp, color: amber }
      - { entity: scene.movie_night, icon: mdi:movie-open, color: deep-purple }
      - { entity: light.living_room, icon: mdi:ceiling-light, color: orange }
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  name: Scenes
  icon: mdi:palette
  control:
    type: buttons
    position: block
    options:
      - { entity: scene.bright, label: Bright, color: amber }
      - { entity: scene.dinner, label: Dinner, color: orange }
      - { entity: scene.good_night, label: Night, color: indigo }
  grid_options: { columns: 6 }
```

:::

A button with `visibility` comes and goes with its conditions. Here the dock button shows only while the robot is out:

::: live

```yaml
type: custom:tile-card-pro
entity: vacuum.robot
name: Robot
control:
  type: buttons
  position: block
  options:
    - entity: vacuum.robot
      label: Clean
      icon: mdi:play
      action: { action: perform-action, perform_action: vacuum.start }
    - entity: vacuum.robot
      label: Dock
      icon: mdi:home-import-outline
      action: { action: perform-action, perform_action: vacuum.return_to_base }
      visibility:
        - { condition: state, entity: vacuum.robot, state_not: docked }
grid_options: { columns: 6 }
```

:::

## Hold to confirm

Some things should not happen by a stray tap. A hold fills a ring around the button for a second and runs when it is full. Letting go earlier cancels.

- `confirm: true` on the control turns a switch or buttons into holds, each button its own: `control: { confirm: true }` makes holds of the kind's own controls.
- `control: hold` is a button to hold for any entity that switches.
- `icon: { hold_action }` holds the icon. Locks and alarm panels do this by default, unless the panel wants a code.

::: live

```yaml
- type: custom:tile-card-pro
  entity: cover.garage_door
  control: { confirm: true }
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: switch.garden_pump
  icon:
    name: mdi:water-pump
    hold_action: { action: toggle }
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

The icon has its own actions, as on Home Assistant's tile card: `tap_action`, `hold_action` and `double_tap_action` in the icon's object (`icon: { name: mdi:coffee-maker, tap_action: { action: toggle } }`). [The icon](/cards/tile-custom#the-icon) on Custom tiles explains them, with examples.

## Reference

`control` is a control's name, `auto` (the kind's, else the domain's: an `input_select`'s select, a `script`'s button), `false` (no control), or an object:

| Key         | Default                      | Description                                                                                                                                 |
| ----------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`      | the kind's                   | `toggle`, `slider`, `stepper`, `segments`, `select`, `buttons`, `button` or `hold`. Without it, the options change the kind's own controls. |
| `position`  | the control's own            | `end` or `block`.                                                                                                                           |
| `attribute` | the shown one, else the mode | `hvac_mode`, `preset_mode` or `fan_mode`: what segments and a select change on a thermostat or fan.                                         |
| `step`      | the entity's, else 1         | The step of a slider or a stepper (a thermostat: 0.5).                                                                                      |
| `options`   | the entity's                 | Segments and select: the options (`value`, `label`, `icon`). Buttons: [your own buttons](#your-own-buttons).                                |
| `confirm`   | `false`                      | Turns the switch and the buttons into holds.                                                                                                |

An object without `type` changes the kind's own controls: `control: { position: block }` puts a cover's buttons below the line, `control: { confirm: true }` makes them holds, `control: { step: 1 }` steps a thermostat by whole degrees.

What a control does, how it shows a call on its way and what it does when one fails is the same on every card: see [Controls](/cards/controls).
