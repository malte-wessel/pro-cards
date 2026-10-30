# Poster controls

A poster can carry one control: a switch, a slider, a stepper, speeds, buttons, a select or a button to hold. Every [poster type](/cards/poster-types) takes `control`, the same key as on the [entity cards](/cards/controls). A control needs an entity that supports it, and your own `buttons` can run any action. Poster types for a domain (light, cover, media player …) bring their own controls: a light poster has a switch and a dimmer without any config.

A tap on the poster opens more-info. The control and the [badges](/cards/poster-badges) take their own taps, and the icon has [actions of its own](#the-icon). This page covers what each poster type brings, every control, where it sits, your own buttons and holds. The [overview](/cards/poster-card) explains the poster around them.

## What the poster types bring

Without `control` (or with `control: auto`), a domain poster type draws its own controls:

| Poster type            | Controls                                                              |
| ---------------------- | --------------------------------------------------------------------- |
| `light`                | a switch beside the value, brightness below it                        |
| `fan`                  | its speeds                                                            |
| `climate`              | a stepper for the target temperature                                  |
| `lock`                 | hold the icon to lock or unlock (`icon_hold_action`)                  |
| `alarm_control_panel`  | hold the icon to arm or disarm, unless the panel wants a code         |
| `media_player`         | previous, play / pause and next beside the title, the volume below it |
| `cover`                | open, stop and close                                                  |
| `vacuum`, `lawn_mower` | start / pause and back to the dock                                    |

Every other poster type (a sensor, the weather, the wind, the energy types …) has no control unless you set one.

::: live

```yaml
- type: custom:poster-card-pro
  entity: light.living_room
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: fan.living_room
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: climate.living_room
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: lock.front_door
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: cover.office_blinds
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: vacuum.robot
  grid_options: { columns: 6 }
```

:::

## Another control, or none

`control` with a name shows that control in place of the poster type's. `control: false` (or `none`) shows none. A light that only dims, a fan that only switches, a thermostat to look at:

::: live

```yaml
- type: custom:poster-card-pro
  entity: light.desk_lamp
  control: slider
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: fan.bedroom
  control: toggle
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: climate.living_room
  control: false
  grid_options: { columns: 6 }
```

:::

A card names one control. Some poster types draw a pair by default: a light's switch and brightness, a player's transport and volume. `control: slider` on a light shows the slider alone.

## A control on any poster

Every poster takes a control its entity supports, whatever its poster type. The names:

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

A stepper beside the value that steps that very number takes the value's place, so the number shows once, between − and +. A thermostat's stepper sets the target and leaves the temperature large.

::: live

```yaml
- type: custom:poster-card-pro
  entity: input_number.heating_boost
  name: Boost
  control: slider
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: input_select.house_mode
  name: House
  icon: mdi:home-account
  control: select
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: climate.bedroom
  name: Bedroom
  control: segments
  control_attribute: hvac_mode
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: script.check_windows
  name: Windows
  value: Check
  control: button
  grid_options: { columns: 6 }
```

:::

On a thermostat or a fan, `control_attribute` picks what segments and a select change: `hvac_mode`, `preset_mode` or `fan_mode`. By default it is the attribute the poster shows, else the main mode. `control_options` limits segments and selects to the options listed, each with its own `label` and `icon`:

::: live

```yaml
type: custom:poster-card-pro
entity: input_select.house_mode
name: House
icon: mdi:home-account
control: segments
control_position: block
control_options:
  - { value: Home, icon: mdi:home }
  - { value: Away, icon: mdi:home-export-outline }
  - { value: Night, icon: mdi:weather-night }
```

:::

## Where it sits

A control has two places on a poster, set with `control_position`:

| `control_position` | Place                                    | The default of                                 |
| ------------------ | ---------------------------------------- | ---------------------------------------------- |
| `end`              | at the right, beside the value           | switch, stepper, speeds, buttons, select, hold |
| `block`            | under the value, across the whole poster | slider                                         |

::: live

```yaml
- type: custom:poster-card-pro
  entity: switch.coffee_machine
  icon: mdi:coffee-maker
  control: toggle
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: cover.garage_door
  control: buttons
  control_position: block
  grid_options: { columns: 6 }
```

:::

On a narrow poster, a control at the `end` moves under the value rather than squeezing it. How a short poster makes room is on [Poster sizes](/cards/poster-sizes#how-a-poster-fits-its-size).

## Your own buttons

`control: buttons` with `control_options` draws your own buttons. Each button does one of these:

- **Runs its `entity`:** a scene or a script turns on, a button is pressed.
- **Switches its `entity`:** a light, a switch or a fan. The button is filled while it is on.
- **Runs its `action`:** any [Home Assistant action](https://www.home-assistant.io/dashboards/actions/), written like `tap_action`.

A poster of buttons needs no entity: a `name`, an `icon` and a `value` or `status` are enough.

::: live

```yaml
- type: custom:poster-card-pro
  name: Evening
  icon: mdi:weather-night
  value: Living room
  status: "{{ 'Lights on' if is_state('light.living_room', 'on') else 'All off' }}"
  color: deep-purple
  control: buttons
  control_position: block
  control_options:
    - { entity: scene.dimmed, label: Dim, color: amber }
    - { entity: scene.movie_night, label: Movie, color: deep-purple }
    - { entity: light.living_room, label: Ceiling, color: orange }
  grid_options: { columns: 12 }
- type: custom:poster-card-pro
  entity: vacuum.robot
  name: Robot
  control: buttons
  control_options:
    - icon: mdi:play
      action:
        action: perform-action
        perform_action: vacuum.start
        target: { entity_id: vacuum.robot }
    - icon: mdi:home-import-outline
      entity: vacuum.robot
      action: { action: perform-action, perform_action: vacuum.return_to_base }
  grid_options: { columns: 6 }
```

:::

Without a target, the action uses the button's `entity`: the second button above needs no `target`. A button without an `entity` acts only on what its action names.

| Key          | Default             | Description                                                                                                  |
| ------------ | ------------------- | ------------------------------------------------------------------------------------------------------------ |
| `entity`     |                     | What the button runs or switches, and the target of its `action`. A button needs an `entity` or an `action`. |
| `action`     | the entity's own    | A Home Assistant action to run (`perform-action`, `navigate`, `more-info` …).                                |
| `color`      | the poster's colour | Colour token, hex or `var()`. A soft tint, filled while its entity is on.                                    |
| `icon`       | the entity's icon   | `mdi:` icon.                                                                                                 |
| `label`      | none                | Text beside the icon. Without one the button is round.                                                       |
| `visibility` | always              | [Conditions](/guide/visibility): the button is drawn only while they hold.                                   |

A button with `visibility` comes and goes with its conditions. Here the dock button shows only while the robot is out:

::: live

```yaml
type: custom:poster-card-pro
entity: vacuum.robot
name: Robot
control: buttons
control_options:
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
```

:::

## Hold to confirm

Some things should not happen by a stray tap. A hold fills a ring around the button for a second and runs when it is full. Letting go earlier cancels.

- `control_confirm: true` turns a switch or buttons into holds, each button its own.
- `control: hold` is a button to hold for any entity that switches.
- `icon_hold_action` holds the icon. Locks and alarm panels do this by default, unless the panel wants a code.

::: live

```yaml
- type: custom:poster-card-pro
  entity: cover.garage_door
  control: buttons
  control_confirm: true
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: switch.garden_pump
  icon: mdi:water-pump
  icon_hold_action: { action: toggle }
  grid_options: { columns: 6 }
```

:::

A held icon shows the entity as it is, and its label says what holding does ("Hold to unlock"). With a screen reader, one click arms a hold and a second click within five seconds runs it.

## The icon

The icon has its own actions, as on Home Assistant's tile card: `icon_tap_action`, `icon_hold_action` and `icon_double_tap_action`. [The icon](/cards/poster-custom#the-icon) on Custom posters explains them, with examples.

## Reference

| Key                 | Default                      | Description                                                                                                                        |
| ------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `control`           | `auto`                       | `auto` (the poster type's), `toggle`, `slider`, `stepper`, `segments`, `select`, `buttons`, `button`, `hold`, or `false` / `none`. |
| `control_position`  | the control's own            | `end` or `block`.                                                                                                                  |
| `control_attribute` | the shown one, else the mode | `hvac_mode`, `preset_mode` or `fan_mode`: what segments and a select change on a thermostat or fan.                                |
| `control_options`   | the entity's                 | Segments and select: the options (`value`, `label`, `icon`). Buttons: [your own buttons](#your-own-buttons).                       |
| `control_confirm`   | `false`                      | Turns the switch and the buttons into holds.                                                                                       |

What a control does, how it shows a call on its way and what it does when one fails is the same on every card: see [Controls](/cards/controls).
