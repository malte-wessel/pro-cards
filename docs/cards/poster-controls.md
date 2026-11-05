# Poster controls

A poster can carry one control: a switch, a slider, a stepper, speeds, buttons, a select or a button to hold. Every [kind](/cards/poster-types) takes `control`: a control's name (`toggle`, `slider`, `stepper`, `segments`, `buttons`, `button`, `select`, `hold`), or the control with its options (`control: { type: slider, position: block }`). A control needs an entity that supports it, and your own `buttons` can run any action. Kinds for a domain (light, cover, media player …) bring their own controls: a light poster has a switch and a dimmer without any config.

A tap on the poster opens more-info. The control and the [badges](/cards/poster-badges) take their own taps, and the icon has [actions of its own](#the-icon). This page covers what each kind brings, every control, where it sits, your own buttons and holds. The [overview](/cards/poster-card) explains the poster around them.

## What the kinds bring

Without `control` (or with `control: auto`), a domain kind draws its own controls:

| Kind                   | Controls                                                              |
| ---------------------- | --------------------------------------------------------------------- |
| `light`                | a switch beside the value, brightness below it                        |
| `fan`                  | its speeds                                                            |
| `climate`              | a stepper for the target temperature                                  |
| `lock`                 | hold the icon to lock or unlock (`icon: { hold_action }`)             |
| `alarm_control_panel`  | hold the icon to arm or disarm, unless the panel wants a code         |
| `media_player`         | previous, play / pause and next beside the title, the volume below it |
| `cover`                | open, stop and close                                                  |
| `vacuum`, `lawn_mower` | start / pause and back to the dock                                    |

Every other kind (a sensor, the weather, the wind, the energy kinds …) has no control unless you set one.

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

`control` with a name shows that control in place of the kind's. `control: false` (or `none`) shows none. A light that only dims, a fan that only switches, a thermostat to look at:

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

A card names one control. Some kinds draw a pair by default: a light's switch and brightness, a player's transport and volume. `control: slider` on a light shows the slider alone.

## A control on any poster

Every poster takes a control its entity supports, whatever its kind. The names:

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
  control: { type: segments, attribute: hvac_mode }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: script.check_windows
  name: Windows
  value: Check
  control: button
  grid_options: { columns: 6 }
```

:::

## The control's options

A control with options is an object: its `type` (the name above) and what it takes. On a thermostat or a fan, `attribute` picks what segments and a select change: `hvac_mode`, `preset_mode` or `fan_mode`. By default it is the attribute the poster shows, else the main mode. `options` limits segments and selects to the options listed, each with its own `label` and `icon`:

::: live

```yaml
type: custom:poster-card-pro
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
```

:::

## Where it sits

A control has two places on a poster, set with its `position`:

| `position` | Place                                    | The default of                                 |
| ---------- | ---------------------------------------- | ---------------------------------------------- |
| `end`      | at the right, beside the value           | switch, stepper, speeds, buttons, select, hold |
| `block`    | under the value, across the whole poster | slider                                         |

::: live

```yaml
- type: custom:poster-card-pro
  entity: switch.coffee_machine
  icon: mdi:coffee-maker
  control: toggle
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: cover.garage_door
  control: { type: buttons, position: block }
  grid_options: { columns: 6 }
```

:::

On a narrow poster, a control at the `end` moves under the value rather than squeezing it. How a poster makes room for its content is on [Poster sizes](/cards/poster-sizes#how-a-poster-fits-its-size).

## Your own buttons

`control: { type: buttons, options: [ … ] }` draws your own buttons. Each button does one of these:

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
  control:
    type: buttons
    position: block
    options:
      - { entity: scene.dimmed, label: Dim, color: amber }
      - { entity: scene.movie_night, label: Movie, color: deep-purple }
      - { entity: light.living_room, label: Ceiling, color: orange }
  grid_options: { columns: 12 }
- type: custom:poster-card-pro
  entity: vacuum.robot
  name: Robot
  control:
    type: buttons
    options:
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
control:
  type: buttons
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
```

:::

## Hold to confirm

Some things should not happen by a stray tap. A hold fills a ring around the button for a second and runs when it is full. Letting go earlier cancels.

- `confirm: true` on the control turns a switch or buttons into holds, each button its own.
- `control: hold` is a button to hold for any entity that switches.
- `icon: { hold_action }` holds the icon. Locks and alarm panels do this by default, unless the panel wants a code.

::: live

```yaml
- type: custom:poster-card-pro
  entity: cover.garage_door
  control: { type: buttons, confirm: true }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: switch.garden_pump
  icon:
    name: mdi:water-pump
    hold_action: { action: toggle }
  grid_options: { columns: 6 }
```

:::

A held icon shows the entity as it is, and its label says what holding does ("Hold to unlock"). With a screen reader, one click arms a hold and a second click within five seconds runs it.

## The icon

The icon has its own actions, as on Home Assistant's tile card: `tap_action`, `hold_action` and `double_tap_action` in the icon's object (`icon: { name: mdi:coffee-maker, tap_action: { action: toggle } }`). [The icon](/cards/poster-custom#the-icon) on Custom posters explains them, with examples.

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

An object without `type` changes the kind's own controls: `control: { step: 1 }` steps a thermostat by whole degrees, `control: { attribute: preset_mode }` gives it its presets as segments.

## States

A control shows what it asked for right away, as a ghost: the knob pulses, the fill is translucent, the segment is outlined, until the entity's state changes (or five seconds pass, when the device never answers). An unavailable entity greys its control out. The demo's attic light and lock take a moment to answer, so their ghosts are easy to see; the rest of the demo home answers at once.

::: live

```yaml
- type: custom:poster-card-pro
  entity: light.attic
  name: Pending · tap or drag
  grid_options: { columns: 12 }
- type: custom:poster-card-pro
  entity: lock.garage_side_door
  name: Pending · hold to lock
  control: hold
  grid_options: { columns: 12 }
- type: custom:poster-card-pro
  entity: switch.shed_heater
  name: Unavailable · offline
  control: toggle
  grid_options: { columns: 12 }
```

:::

## Keyboard and screen readers

Every control works without a pointer. Tab reaches the card's own action first (a button behind the content, named after the entity), then its controls in order; the focus stays where it is while the card updates.

- **Switch**: a switch (`role="switch"`), Space or Enter flips it.
- **Slider**: the arrow keys step, PageUp and PageDown jump ten steps, Home and End go to the ends; the call follows a short pause.
- **Segments**: a radio group with one tab stop; the arrow keys move along the segments and choose, Home and End jump to the ends.
- **Stepper, buttons, Run**: plain buttons.
- **Select**: the browser's own menu.
- **Hold to confirm**: keep Space or Enter pressed for a second. A screen reader cannot hold, so it presses twice: the first press arms the button ("Press again to …"), a second press within five seconds runs it.

A failed service call shows Home Assistant's toast with the error and fires the failure haptic.
