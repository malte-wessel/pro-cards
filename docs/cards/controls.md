# Controls

A tile or a poster can carry one control: a switch, a slider, a stepper, speeds, buttons, a select or a button to hold. Most kinds bring the right one on their own, and `control` changes it, adds one to any entity, or draws your own buttons.

A tap on the card still opens more-info. The control takes its own taps, and the icon has [actions of its own](/cards/actions).

## What the kinds bring

Without `control`, a kind draws its own controls. A poster has room for a second one below its value, such as a light's brightness; a tile keeps to one line and leaves it out.

| Kind                   | Tile                              | Poster                               |
| ---------------------- | --------------------------------- | ------------------------------------ |
| `light`                | a switch                          | a switch, brightness below the value |
| `plug`                 | a switch                          | a switch                             |
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

A control with options is an object: its `type` and what it takes. `step` sets the step of a slider or a stepper. `attribute` picks what it sets ([below](#what-a-control-sets)). `options` limits segments and a select to the ones you list, each with its own `label` and `icon`.

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

## What a control sets

`type` says how a control is drawn, `attribute` what it sets, by Home Assistant's name for it: a light's slider sets its `brightness`, or its `color_temp_kelvin`, `hue` or `saturation`. Left out, a control sets what the card shows where it can (`attribute: current_tilt_position` on the card: the slider tilts), else what its type sets by default: a light's slider its brightness, its buttons its favourite colours, its select its effects. The [reference](#what-each-entity-sets) lists every one.

### A light's colour

`color_temp_kelvin`, `hue` and `saturation` draw the slider as the colours it sets; while the light is off it is faded, and a drag turns it on in that colour. Buttons are the light's favourite colours, each a swatch that sets it; a select sets its effect.

::: live

```yaml
- type: custom:tile-card-pro
  entity: light.reading_lamp
  control: { type: slider, attribute: color_temp_kelvin }
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: light.living_room
  control: { type: slider, attribute: hue }
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: light.reading_lamp
  control: { type: buttons, position: block }
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: light.reading_lamp
  name: Effect
  control: { type: select, attribute: effect }
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: light.living_room
  name: Saturation
  control: { type: slider, attribute: saturation }
  grid_options: { columns: 6 }
```

:::

### Climate and air

A thermostat's segments or select set its `hvac_mode`, `preset_mode`, `fan_mode`, `swing_mode` or `swing_horizontal_mode`, a stepper its `temperature` or `humidity`. A humidifier takes a switch, its target `humidity` and its `mode`; a water heater its `temperature` and its `operation_mode`. A fan's switch sets its power, or its `oscillating`; segments its speed, its `preset_mode` or its `direction`.

::: live

```yaml
- type: custom:tile-card-pro
  entity: climate.living_room
  name: Swing
  control: { type: segments, attribute: swing_mode }
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: humidifier.bedroom
  control: stepper
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: humidifier.bedroom
  name: Mode
  control: { type: select, attribute: mode }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: water_heater.boiler
  control: stepper
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: fan.living_room
  name: Oscillate
  control: { type: toggle, attribute: oscillating }
  grid_options: { columns: 6 }
```

:::

### Covers and valves

A cover's slider and buttons move it, or tilt it with `attribute: current_tilt_position`; its segments are its favourite positions. A valve takes a switch, its buttons (open, stop, close) and a slider where it has a position.

::: live

```yaml
- type: custom:tile-card-pro
  entity: cover.patio_blind
  name: Slats
  control: { type: slider, attribute: current_tilt_position }
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: cover.patio_blind
  name: Tilt
  control: { type: buttons, attribute: current_tilt_position }
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: cover.living_room_blinds
  control: { type: segments, position: block }
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: valve.garden_irrigation
  control: buttons
  grid_options: { columns: 6 }
```

:::

### Media, robots, locks and alarms

A speaker's select sets its `source` or `sound_mode`, its stepper the volume by 5 %. A robot's select sets its `fan_speed`. A domain's buttons are named in `options`, in your order: a robot's `start_pause`, `stop`, `clean_spot`, `locate` and `dock`, a lock's `lock`, `unlock` and `open_door` (always held for a second). An alarm panel's segments arm it in the modes it supports and disarm it. A lock or a panel that wants a code opens Home Assistant's dialog for it instead.

::: live

```yaml
- type: custom:tile-card-pro
  entity: media_player.living_room_speaker
  name: Source
  control: { type: select, attribute: source }
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: vacuum.robot
  name: Suction
  control: { type: select, attribute: fan_speed }
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: vacuum.robot
  control:
    type: buttons
    options:
      - start_pause
      - stop
      - locate
      - dock
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: lock.front_door
  control:
    type: buttons
    options:
      - lock
      - unlock
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: alarm_control_panel.home
  control: { type: segments, position: block }
  grid_options: { columns: 6 }
```

:::

### Helpers, updates and dates

A counter steps by its own step, or takes buttons (`decrement`, `reset`, `increment`). A timer takes `start`, `pause`, `cancel` and `finish`, or its presets as buttons with `attribute: presets`. An update takes `install` and `skip`. A date, a date and time or an input date takes `control: date`: a chip with the day that opens a calendar.

::: live

```yaml
- type: custom:tile-card-pro
  entity: counter.coffee_cups
  control: stepper
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: date.bin_day
  control: date
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: timer.laundry
  control: buttons
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: timer.laundry
  name: Presets
  control: { type: buttons, attribute: presets, position: block }
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: update.router_firmware
  control: buttons
  grid_options: { columns: 6 }
```

:::

### Favourites

A light's favourite colours, a cover's or a valve's favourite positions and a timer's presets are those you set in Home Assistant, in the entity's more-info dialog. The card reads them from Home Assistant's entity registry, as Home Assistant's own tile does. Without any, a cover offers 0, 25, 75 and 100 % and a light four whites across its range and four colours; a timer without presets shows none. `options` sets your own in the card instead.

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
- **Switches its `entity`:** a light, a switch or a fan. The button is grey while it is off and filled in its entity's colour while it is on (tinted with `variant: tinted`).
- **Runs its `action`:** any [Home Assistant action](https://www.home-assistant.io/dashboards/actions/), written like `tap_action`. Without a target, the action uses the button's `entity`: a robot's Dock button is `entity: vacuum.robot` with `action: { action: perform-action, perform_action: vacuum.return_to_base }`.

A card of buttons needs no entity: a `name` and an `icon` are enough. A button takes its entity's colour (a light amber, a fan cyan, a cover purple) unless it names one. A button with `visibility` comes and goes with its conditions; below, Movie shows only while the speaker plays.

::: live

```yaml
- type: custom:tile-card-pro
  name: Living room
  icon: { name: mdi:sofa-outline, style: plain }
  secondary: "{{ states('sensor.living_room_temperature') }} °C · {{ states('sensor.living_room_humidity') }} %"
  control:
    type: buttons
    options:
      - entity: cover.living_room_blinds
      - entity: light.living_room
      - entity: fan.living_room
  grid_options: { columns: 12 }
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

## Filled or tinted

Controls are rounded squares of one height, as Home Assistant's tile features: a switch (a button with the power icon), buttons, a stepper (minus, the value and plus in one bar), segments, a select, a button and a hold. A slider is a bar filled to the value, with a short handle in the fill. A button standing in for the icon keeps the icon's circle.

At rest the switch, buttons, segments, the stepper, the select and the hold are grey; a slider's bar is its colour at 20 % behind the fill. What is on or chosen is filled in its colour with a white icon: a switch that is on, your own buttons while their entity is on, a player's play button, the chosen segment. `variant: tinted` draws it in its colour at 20 % with the icon in its colour instead. A button (Run), which has no on, rests filled or tinted. Without `type` the variant changes the kind's own controls: `control: { variant: tinted }` on a light tints its switch.

::: live

```yaml
- type: custom:tile-card-pro
  entity: light.living_room
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: light.living_room
  control: { variant: tinted }
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: fan.living_room
  control: segments
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: fan.living_room
  control: { type: segments, variant: tinted }
  grid_options: { columns: 6 }
```

:::

## Hold to confirm

Some things should not happen by a stray tap. A hold fills the button from the left for a second (one standing in for the icon: a ring around it) and runs when it is full; letting go earlier cancels. There are three ways to get one:

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

A control shows what you asked for right away, as a ghost: a switch pulses, a slider's fill is translucent, the segment is outlined. It turns solid once the entity's state changes, or after five seconds if the device never answers. An unavailable entity greys its control out. A failed call shows Home Assistant's error toast.

## Keyboard and screen readers

Every control works without a pointer. Tab reaches the card first, then its controls in order. Space or Enter flips a switch; the arrow keys step a slider and move along segments; Home and End jump to the ends. To confirm a hold, keep Space or Enter pressed for a second. A screen reader cannot hold, so it presses twice: the first press arms the button ("Press again to …"), a second press within five seconds runs it.

## Reference

`control` is a control's name, `auto` (the kind's, else the domain's: an input select's select, a script's button), `false` (no control), or an object with the options below. Left out, the card shows the kind's controls.

### Control types

| `control`  | Draws                      | For                                                                                  |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------ |
| `toggle`   | a switch                   | lights, switches, fans, input booleans, media players …                              |
| `slider`   | a slider                   | brightness, cover position, volume, fan speed, numbers                               |
| `stepper`  | − and + around the value   | thermostats, numbers                                                                 |
| `segments` | one segment per option     | fan speeds, a thermostat's modes, selects                                            |
| `select`   | a dropdown                 | selects, input selects, modes                                                        |
| `buttons`  | a row of buttons           | covers, valves, media players, robots, locks, counters, timers, updates; or your own |
| `button`   | one button                 | scripts, scenes, buttons                                                             |
| `hold`     | a button held for a second | locks, alarm panels; any switch that must not go by accident                         |
| `date`     | a chip with the day        | dates, dates and times, input dates                                                  |

### Control options

| Key         | Default                        | Description                                                                                                                                         |
| ----------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`      | the kind's                     | One of the control types. Without it, the other options change the kind's own controls.                                                             |
| `position`  | the control's own              | `end` (end of the line, beside a poster's value) or `block` (below it). A slider's is `block`, the others' `end`.                                   |
| `step`      | the entity's, else 1           | The step of a slider or a stepper (a thermostat: 0.5).                                                                                              |
| `attribute` | the shown one, else the type's | What it sets, by Home Assistant's name ([below](#what-each-entity-sets)).                                                                           |
| `options`   | the entity's                   | Segments and select: the options, each `{ value, label, icon }`. Buttons: the domain's own by name (`[stop, locate]`), or your own buttons (below). |
| `confirm`   | `false`                        | Turns the switch and the buttons into holds.                                                                                                        |
| `variant`   | `fill`                         | `fill` or `tinted`: how a switch, a button, buttons and segments show what is on or chosen.                                                         |

### What each entity sets

The first is what a control of its type sets unless `attribute` names another.

| Entity                         | `attribute`                                                                                              | Types                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| light                          | `brightness`, `color_temp_kelvin`, `hue`, `saturation`, `favorite_colors`, `effect`                      | slider, stepper; buttons (favourite colours), select (effects)   |
| fan                            | `percentage`, `preset_mode`, `oscillating`, `direction`                                                  | slider, segments, select; toggle (oscillating)                   |
| climate                        | `temperature`, `hvac_mode`, `preset_mode`, `fan_mode`, `swing_mode`, `swing_horizontal_mode`, `humidity` | stepper, slider; segments, select                                |
| humidifier                     | `humidity`, `mode`                                                                                       | slider, stepper; segments, select; toggle (power)                |
| water_heater                   | `temperature`, `operation_mode`                                                                          | stepper, slider; segments, select                                |
| cover                          | `current_position`, `current_tilt_position`                                                              | slider, stepper, buttons; segments (favourite positions)         |
| valve                          | `current_position`                                                                                       | slider, stepper; segments (favourite positions); buttons, toggle |
| media_player                   | `volume_level`, `source`, `sound_mode`                                                                   | slider, stepper (5 %); select, segments                          |
| vacuum                         | `fan_speed`                                                                                              | select, segments                                                 |
| alarm_control_panel            | its mode                                                                                                 | segments, select                                                 |
| counter, timer                 | its value; a timer's `presets`                                                                           | stepper (a counter); buttons (a timer's presets)                 |
| date, datetime, input_datetime | its day                                                                                                  | date                                                             |

### A domain's buttons

`options` of `type: buttons` naming them, in your order. Left out, the first ones.

| Entity       | Buttons                                                                  |
| ------------ | ------------------------------------------------------------------------ |
| cover        | `open`, `stop`, `close`; tilting: `tilt_open`, `tilt_stop`, `tilt_close` |
| valve        | `open`, `stop`, `close`                                                  |
| media_player | `previous`, `play_pause`, `next`                                         |
| vacuum       | `start_pause`, `dock`; also `stop`, `clean_spot`, `locate`               |
| lawn_mower   | `start_pause`, `dock`                                                    |
| lock         | `lock`, `unlock`; also `open_door` (always held)                         |
| counter      | `decrement`, `reset`, `increment`                                        |
| timer        | `start`, `pause`, `cancel`; also `finish`                                |
| update       | `skip`, `install`                                                        |

### Your own buttons

Each entry of `options` with `type: buttons`. A button needs an `entity` or an `action`.

| Key          | Default           | Description                                                                      |
| ------------ | ----------------- | -------------------------------------------------------------------------------- |
| `entity`     |                   | What the button runs or switches, and the target of its `action`.                |
| `action`     | the entity's own  | A Home Assistant action to run (`perform-action`, `navigate`, `more-info` …).    |
| `label`      | none              | Text beside the icon. Without one the button holds its icon alone.               |
| `icon`       | the entity's icon | `mdi:` icon.                                                                     |
| `color`      | its entity's      | Colour token, hex or `var()`: the tint while its entity is on (else the card's). |
| `visibility` | always            | [Conditions](/guide/visibility): the button is drawn only while they hold.       |
