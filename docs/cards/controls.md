# Controls

A tile or a poster can carry one control: a switch, a slider, a stepper, speeds, buttons, a select or a button to hold. Most kinds bring the right one on their own, and `control` changes it, adds one to any entity, or draws your own buttons.

A tap on the card still opens more-info. The control takes its own taps, and the icon has [actions of its own](/cards/actions).

## What the kinds bring

Without `control`, a kind draws its own controls. A poster has room for a second one below its value, such as a light's brightness; a tile keeps to one line and leaves it out.

| Kind                   | Tile                              | Poster                               |
| ---------------------- | --------------------------------- | ------------------------------------ |
| `light`                | a switch                          | a switch, brightness below the value |
| `fan`                  | its speeds                        | its speeds                           |
| `climate`              | a stepper for the target          | a stepper for the target             |
| `cover`                | open, stop and close              | open, stop and close                 |
| `media_player`         | previous, play / pause and next   | the same, the volume below the value |
| `vacuum`, `lawn_mower` | start / pause and back to dock    | start / pause and back to dock       |
| `lock`                 | hold the icon to lock or unlock   | hold the icon to lock or unlock      |
| `alarm_control_panel`  | hold the icon to arm or disarm \* | hold the icon to arm or disarm \*    |

\* Unless the panel wants a code. Every other kind (a sensor, the weather, the energy kinds …) has no control until you set one.

::: live

```yaml
- type: custom:tile-card-pro
  entity: light.living_room
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: light.living_room
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: climate.living_room
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: climate.living_room
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: cover.living_room_blinds
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: cover.living_room_blinds
  grid_options: { columns: 6 }
```

:::

## Another control, or none

A control's name shows that control in place of the kind's: a light that only dims takes `control: slider`. `control: false` shows none, for a thermostat you only want to look at.

A card shows the one control you name. `control: slider` on a light shows the slider without the switch. On a tile, a light's icon toggles it by default, so a tap there still switches it.

::: live

```yaml
- type: custom:tile-card-pro
  entity: light.desk_lamp
  control: slider
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: light.desk_lamp
  control: slider
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: climate.living_room
  control: false
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: fan.living_room
  control: toggle
  grid_options: { columns: 6 }
```

:::

## A control on any entity

Any tile or poster takes a control its entity supports, whatever its kind: a slider for a number, a select for an input select, a switch for a switch, a button for a script. `control: auto` picks the domain's own control where the kind has none. The [reference](#control-types) lists every control and what it suits.

::: live

```yaml
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
```

:::

## The control's options

A control with options is an object: its `type` and what it takes. `step` sets the step of a slider or a stepper. On a thermostat or a fan, `attribute` picks what segments and a select change: `hvac_mode`, `preset_mode` or `fan_mode`. `options` limits segments and a select to the ones you list, each with its own `label` and `icon`.

An object without `type` changes the kind's own controls: `control: { step: 1 }` steps a thermostat by whole degrees, `control: { confirm: true }` makes a cover's buttons holds.

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
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: climate.living_room
  name: Living room
  control: { type: segments, attribute: preset_mode }
  grid_options: { columns: 6 }
```

:::

## Where it sits

`position` puts a control in one of two places. On a tile, `end` is at the end of the line and `block` is below it, across the whole tile. On a poster, `end` is beside the value and `block` is under it.

A slider sits at `block`, every other control at `end`. On a narrow card a control at the `end` moves under the line or the value rather than squeeze it.

::: live

```yaml
- type: custom:tile-card-pro
  entity: cover.living_room_blinds
  control: { position: block }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: cover.living_room_blinds
  control: { position: block }
  grid_options: { columns: 6 }
```

:::

## Your own buttons

`control: { type: buttons, options: [ … ] }` draws a row of your own buttons. Each button does one of three things:

- **Runs its `entity`:** a scene or a script turns on, a button is pressed.
- **Switches its `entity`:** a light, a switch or a fan. The button is filled while it is on.
- **Runs its `action`:** any [Home Assistant action](https://www.home-assistant.io/dashboards/actions/), written like `tap_action`. Without a target, the action uses the button's `entity`: a robot's Dock button is `entity: vacuum.robot` with `action: { action: perform-action, perform_action: vacuum.return_to_base }`.

A card of buttons needs no entity: a `name` and an `icon` are enough. A button with `visibility` comes and goes with its conditions; below, Movie shows only while the speaker plays.

::: live

```yaml
- type: custom:tile-card-pro
  name: Evening
  icon: mdi:weather-night
  color: deep-purple
  control:
    type: buttons
    options:
      - { entity: scene.dimmed, icon: mdi:lamp, color: amber }
      - { entity: scene.movie_night, icon: mdi:movie-open, color: deep-purple }
      - { entity: light.living_room, icon: mdi:ceiling-light, color: orange }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: light.living_room
  name: Living room
  control:
    type: buttons
    position: block
    options:
      - { entity: scene.dimmed, label: Dim, color: amber }
      - { entity: light.desk_lamp, label: Desk, color: orange }
      - entity: scene.movie_night
        label: Movie
        color: deep-purple
        visibility:
          - { condition: state, entity: media_player.living_room_speaker, state: playing }
  grid_options: { columns: 6 }
```

:::

## Hold to confirm

Some things should not happen by a stray tap. A hold fills a ring around the button for a second and runs when it is full; letting go earlier cancels. There are three ways to get one:

- `confirm: true` on the control turns a switch or buttons into holds, each button its own.
- `control: hold` is a button to hold for any entity that switches.
- `icon: { hold_action: … }` holds the icon. Locks and alarm panels do this by default, and the icon's label says what holding does ("Hold to unlock").

::: live

```yaml
- type: custom:tile-card-pro
  entity: cover.living_room_blinds
  control: { confirm: true }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: lock.front_door
  grid_options: { columns: 6 }
```

:::

## States

A control shows what you asked for right away, as a ghost: the knob pulses, the fill is translucent, the segment is outlined. It turns solid once the entity's state changes, or after five seconds if the device never answers. An unavailable entity greys its control out. A failed call shows Home Assistant's error toast.

## Keyboard and screen readers

Every control works without a pointer. Tab reaches the card first, then its controls in order. Space or Enter flips a switch; the arrow keys step a slider and move along segments; Home and End jump to the ends. To confirm a hold, keep Space or Enter pressed for a second. A screen reader cannot hold, so it presses twice: the first press arms the button ("Press again to …"), a second press within five seconds runs it.

## Reference

`control` is a control's name, `auto` (the kind's, else the domain's: an input select's select, a script's button), `false` (no control), or an object with the options below. Left out, the card shows the kind's controls.

### Control types

| `control`  | Draws                      | For                                                          |
| ---------- | -------------------------- | ------------------------------------------------------------ |
| `toggle`   | a switch                   | lights, switches, fans, input booleans, media players …      |
| `slider`   | a slider                   | brightness, cover position, volume, fan speed, numbers       |
| `stepper`  | − and + around the value   | thermostats, numbers                                         |
| `segments` | one segment per option     | fan speeds, a thermostat's modes, selects                    |
| `select`   | a dropdown                 | selects, input selects, modes                                |
| `buttons`  | a row of buttons           | covers, media players, robots; or your own                   |
| `button`   | one round button           | scripts, scenes, buttons                                     |
| `hold`     | a button held for a second | locks, alarm panels; any switch that must not go by accident |

### Control options

| Key         | Default                      | Description                                                                                                       |
| ----------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `type`      | the kind's                   | One of the control types. Without it, the other options change the kind's own controls.                           |
| `position`  | the control's own            | `end` (end of the line, beside a poster's value) or `block` (below it). A slider's is `block`, the others' `end`. |
| `step`      | the entity's, else 1         | The step of a slider or a stepper (a thermostat: 0.5).                                                            |
| `attribute` | the shown one, else the mode | `hvac_mode`, `preset_mode` or `fan_mode`: what segments and a select change on a thermostat or fan.               |
| `options`   | the entity's                 | Segments and select: the options, each `{ value, label, icon }`. Buttons: your own buttons (below).               |
| `confirm`   | `false`                      | Turns the switch and the buttons into holds.                                                                      |

### Your own buttons

Each entry of `options` with `type: buttons`. A button needs an `entity` or an `action`.

| Key          | Default           | Description                                                                   |
| ------------ | ----------------- | ----------------------------------------------------------------------------- |
| `entity`     |                   | What the button runs or switches, and the target of its `action`.             |
| `action`     | the entity's own  | A Home Assistant action to run (`perform-action`, `navigate`, `more-info` …). |
| `label`      | none              | Text beside the icon. Without one the button is round.                        |
| `icon`       | the entity's icon | `mdi:` icon.                                                                  |
| `color`      | the card's colour | Colour token, hex or `var()`. A soft tint, filled while its entity is on.     |
| `visibility` | always            | [Conditions](/guide/visibility): the button is drawn only while they hold.    |
