# Controls

A tile or a poster can carry a control: a switch, a slider, a stepper, speeds, buttons, a select or a button to hold. Most kinds bring the right one on their own; `control` changes it, adds one to any entity, or draws your own buttons.

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

\* Unless the panel wants a code. A fan with more than six speeds gets a slider in place of its speeds. Every other kind (a sensor, the weather, the energy kinds …) has no control until you set one.

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

A control's name shows that control alone in place of the kind's: a light that only dims takes `control: slider`, which shows the slider without the switch (on a tile, the light's icon still switches it). `control: false` shows none, for a thermostat you only want to look at.

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

`type` says how a control is drawn, `attribute` what it sets, by Home Assistant's name for it: a light's slider sets its `brightness`, or its `color_temp_kelvin`, `hue` or `saturation`. Left out, a control sets the mode the card shows (on a thermostat card showing `attribute: preset_mode`, segments set the preset), else what its type sets by default: on a light, a slider sets the brightness, buttons the favourite colours, a select the effect. An `attribute` the entity's domain cannot set is a config error. The [reference](#what-each-entity-sets) lists every one.

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

A thermostat's segments or select set its `hvac_mode`, `preset_mode`, `fan_mode`, `swing_mode` or `swing_horizontal_mode`, a stepper its `temperature` or `humidity`. A thermostat holding a range (`heat_cool`) gets a stepper for its low and one for its high target, as Home Assistant's own. A humidifier takes a switch, its target `humidity` and its `mode`; a water heater its `temperature` and its `operation_mode`. A fan's switch sets its power, or its `oscillating`; segments its speed, its `preset_mode` or its `direction`.

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

A speaker's select sets its `source` or `sound_mode`, its stepper the volume by 5 %. A robot's select sets its `fan_speed`. A domain's buttons are named in `options`, in your order: a robot's `start_pause`, `stop`, `clean_spot`, `locate` and `dock`, a lock's `lock`, `unlock` and `open_door` (always held for a second). A domain's buttons leave out what the entity says it does not support: a garage door that only opens and closes has no stop, a TV without tracks no previous or next. A switch on a lock locks and unlocks it. An alarm panel's segments arm it in the modes it supports and disarm it. A lock or a panel that wants a code opens Home Assistant's dialog for it instead, from a switch or a hold too.

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

A counter steps by its own step, or takes buttons (`decrement`, `reset`, `increment`). A timer's buttons are `start`, `pause` and `cancel` (`finish` when you name it), or its presets with `attribute: presets`. An update's are `skip` and `install`. A date, a date and time or an input date takes `control: date`: a chip with the day that opens a calendar.

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

A light's favourite colours, a cover's or a valve's favourite positions and a timer's presets are those you set in Home Assistant, in the entity's more-info dialog, as for Home Assistant's own tile. Without any, a cover offers 0, 25, 75 and 100 %, and a light four whites across its range plus four colours where it takes colours; a timer without presets shows none. `options` sets your own in the card instead.

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
- **Runs its `tap_action`:** any [Home Assistant action](https://www.home-assistant.io/dashboards/actions/). Without a target, the action uses the button's `entity`: a robot's Dock button is `entity: vacuum.robot` with `tap_action: { action: perform-action, perform_action: vacuum.return_to_base }`.

An entity a button can neither run nor switch (a sensor, a window) opens its dialog. A card of buttons needs no entity: a `name` and an `icon` are enough. A button takes its entity's colour (a light amber, a fan cyan, a cover purple) unless it names one. `show_name: true` writes its name beside the icon. A button with `visibility` comes and goes with its conditions; below, Movie shows only while the speaker plays.

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
      - { entity: scene.dimmed, name: Dim, show_name: true, color: amber }
      - { entity: light.desk_lamp, name: Desk, show_name: true, color: orange }
      - entity: scene.movie_night
        name: Movie
        show_name: true
        color: deep-purple
        visibility:
          - { condition: state, entity: media_player.living_room_speaker, state: playing }
  grid_options: { columns: 6 }
```

:::

## Buttons that show state

A button shows its entity as a badge does: filled while the entity is active, with its name, its value and rules of its own. A room's poster can carry its lights, its blinds, its windows and its heating in one row.

### What fills a button

A button fills in Home Assistant's colour for its entity while the entity is active:

| Entity                          | Filled while                                          |
| ------------------------------- | ----------------------------------------------------- |
| a light, a switch, a fan …      | it is on                                              |
| a cover, a valve                | it is open                                            |
| a lock                          | it is unlocked                                        |
| a binary sensor                 | it is on: a window open, motion seen, smoke detected  |
| a person, a tracker             | they are not away: home or in a zone                  |
| a thermostat                    | it heats, cools or dries (`hvac_action`), not by mode |
| a humidifier                    | it humidifies or dries, else while it is on           |
| a scene, a script, a button     | never: it flashes when pressed                        |
| a sensor, a number, the weather | never on its own: a rule can fill it                  |

A thermostat in `heat` all winter stays grey while the room is warm enough, and fills while it heats.

::: live

```yaml
type: custom:poster-card-pro
entity: sensor.living_room_temperature
name: Living room
icon: mdi:sofa-outline
visual: false
control:
  type: buttons
  position: block
  options:
    - entity: light.living_room
    - entity: cover.living_room_blinds
    - entity: binary_sensor.window_kitchen
    - entity: binary_sensor.door_front
    - entity: person.malte
    - entity: climate.living_room
    - entity: climate.bedroom
    - entity: sensor.washer_power
grid_options: { columns: 6 }
```

:::

### Names and values

`show_name: true` writes the button's name beside its icon, `show_value: true` its value after it: the state, or the `attribute` it names, as Home Assistant writes it (a position's %, a thermostat's °C). A `value` of your own, a text or a template, shows without `show_value`. `unit`, `decimals`, `prefix` and `suffix` work as on the card.

::: live

```yaml
type: custom:poster-card-pro
entity: sensor.living_room_temperature
name: Living room
icon: mdi:sofa-outline
visual: false
control:
  type: buttons
  position: block
  options:
    - entity: cover.living_room_blinds
      attribute: current_position
      show_value: true
    - entity: climate.living_room
      attribute: current_temperature
      show_value: true
    - entity: binary_sensor.window_kitchen
      name: Window
      show_name: true
      show_value: true
    - entity: sensor.washer_power
      show_value: true
grid_options: { columns: 6 }
```

:::

### Rules

A button's `rules` work as a badge's: `state`, `above` or `below`, the first match wins, and its `icon` and `color` win over the button's. A rule's `value` is the text while it matches, also on a button that shows no value. `active: true` fills the button while the rule matches, `active: false` keeps it grey; a grey button takes the rule's colour on its icon. `pulse: true` draws a ring around it.

::: live

```yaml
type: custom:poster-card-pro
entity: sensor.living_room_temperature
name: Living room
icon: mdi:sofa-outline
visual: false
control:
  type: buttons
  position: block
  options:
    - entity: binary_sensor.window_kitchen
      rules:
        - { state: "on", icon: mdi:window-open-variant, color: red }
    - entity: sensor.washer_power
      icon: mdi:washing-machine-off
      rules:
        - above: 5
          icon: mdi:washing-machine
          value: Running
          color: teal
          active: true
    # motion only colours the icon: a busy hallway does not fill the row
    - entity: binary_sensor.motion_hallway
      icon: mdi:motion-sensor-off
      rules:
        - { state: "on", icon: mdi:motion-sensor, color: amber, active: false }
grid_options: { columns: 6 }
```

:::

### A rule's own attribute

A rule reads the button's value unless it names an `attribute` of its own. A thermostat's button can show the room's temperature and swap its icon by what the thermostat does. The poster's and the tile's own rules and a badge's take `attribute` too. It reads the entity as it is now, so a plot's past values never match it.

::: live

```yaml
type: custom:poster-card-pro
entity: sensor.living_room_temperature
name: Living room
icon: mdi:sofa-outline
visual: false
control:
  type: buttons
  position: block
  options:
    - entity: climate.living_room
      attribute: current_temperature
      show_value: true
      rules:
        - { attribute: hvac_action, state: heating, icon: mdi:fire }
        - { attribute: hvac_action, state: cooling, icon: mdi:snowflake }
    - entity: climate.office
      attribute: current_temperature
      show_value: true
      rules:
        - { attribute: hvac_action, state: heating, icon: mdi:fire }
        - { attribute: hvac_action, state: cooling, icon: mdi:snowflake }
grid_options: { columns: 6 }
```

:::

### Only what needs attention

On a room's card most things are fine most of the time. `visibility` shows a button only while it has something to say: a condition without an `entity` reads the button's own, and `attribute` reads one of its attributes. Below, the door shows only while it is open and the thermostat only while it heats.

::: live

```yaml
type: custom:poster-card-pro
entity: sensor.living_room_temperature
name: Living room
icon: mdi:sofa-outline
visual: false
control:
  type: buttons
  position: block
  options:
    - entity: light.living_room
    - entity: binary_sensor.door_front
      visibility:
        - { condition: state, state: "on" }
    - entity: climate.living_room
      visibility:
        - { condition: state, attribute: hvac_action, state: heating }
grid_options: { columns: 6 }
```

:::

## Filled or tinted

Controls are rounded squares of one height, as Home Assistant's tile features; the switch is a button with the power icon, and a slider is a bar filled to the value.

At rest a control is grey; a slider's bar is its colour at 20 % behind the fill. What is on or chosen is filled in its colour with a white icon: a switch that is on, your own buttons while their entity is on, a player's play button, the chosen segment. `variant: tinted` draws it in its colour at 20 % with the icon in its colour instead. A button (Run), which has no on, rests filled or tinted. Without `type` the variant changes the kind's own controls: `control: { variant: tinted }` on a light tints its switch.

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

- `confirm: true` on the control turns a switch, a Run button or buttons into holds, each button its own.
- `control: hold` is a button to hold, for any entity that switches or runs.
- `icon: { hold_action: … }` holds the icon ([the icon's actions](/cards/actions#the-icon-s-own-actions)). Locks and alarm panels do this by default.

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
| `confirm`   | `false`                        | Turns a switch, a Run button or buttons into holds.                                                                                                 |
| `variant`   | `fill`                         | `fill` or `tinted`: how a switch, a button, buttons and segments show what is on or chosen.                                                         |

### What each entity sets

The first is what a control of its type sets unless `attribute` names another.

| Entity                         | `attribute`                                                                                              | Types                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| light                          | `brightness`, `color_temp_kelvin`, `hue`, `saturation`, `favorite_colors`, `effect`                      | slider, stepper; buttons (favourite colours), select (effects)   |
| fan                            | `percentage`, `preset_mode`, `oscillating`, `direction`                                                  | slider, stepper, segments, select; toggle (oscillating)          |
| climate                        | `temperature`, `hvac_mode`, `preset_mode`, `fan_mode`, `swing_mode`, `swing_horizontal_mode`, `humidity` | stepper, slider; segments, select                                |
| humidifier                     | `humidity`, `mode`                                                                                       | slider, stepper; segments, select; toggle (power)                |
| water_heater                   | `temperature`, `operation_mode`                                                                          | stepper, slider; segments, select                                |
| cover                          | `current_position`, `current_tilt_position`                                                              | slider, stepper, buttons; segments (favourite positions)         |
| valve                          | `current_position`                                                                                       | slider, stepper; segments (favourite positions); buttons, toggle |
| media_player                   | `volume_level`, `source`, `sound_mode`                                                                   | slider, stepper (5 %); select, segments                          |
| vacuum                         | `fan_speed`                                                                                              | select, segments                                                 |
| alarm_control_panel            | its mode                                                                                                 | segments, select                                                 |
| number, input_number           | its value                                                                                                | slider, stepper                                                  |
| select, input_select           | its option                                                                                               | select, segments                                                 |
| counter, timer                 | its value; a timer's `presets`                                                                           | stepper (a counter); buttons, select (a timer's presets)         |
| date, datetime, input_datetime | its day                                                                                                  | date                                                             |

### A domain's buttons

`options` of `type: buttons` naming them, in your order. Left out, those not marked "also" (a cover with `attribute: current_tilt_position`: its tilt buttons).

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

Each entry of `options` with `type: buttons`. A button needs an `entity` or a `tap_action`.

| Key                | Default           | Description                                                                                                                         |
| ------------------ | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `entity`           |                   | What the button shows and runs or switches, and the target of its `tap_action`.                                                     |
| `tap_action`       | the entity's own  | A Home Assistant action to run (`perform-action`, `navigate`, `more-info` …).                                                       |
| `name`             | the entity's name | Its name, written beside the icon with `show_name: true`. Template allowed.                                                         |
| `show_name`        | `false`           | Write the name beside the icon.                                                                                                     |
| `attribute`        | –                 | Shows this attribute in place of the state.                                                                                         |
| `value`            | the state         | A text or a template of your own; it shows without `show_value`.                                                                    |
| `show_value`       | `false`           | Write the value after the name.                                                                                                     |
| `unit`, `decimals` | the entity's      | The value's unit and decimal places.                                                                                                |
| `prefix`, `suffix` | –                 | Text before and after the value.                                                                                                    |
| `icon`             | the entity's icon | `mdi:` icon; a matching rule's wins.                                                                                                |
| `color`            | its entity's      | Colour token, hex, `var()` or a template: the fill while it is filled (else the card's); a matching rule's wins.                    |
| `rules`            | –                 | `state`, `above` or `below`, and an optional `attribute`, setting `icon`, `color`, `value`, `active` and `pulse`. First match wins. |
| `visibility`       | always            | [Conditions](/guide/visibility): the button is drawn only while they hold.                                                          |

`label` and `action` (3.0) are read until 4.0: `label: Dim` is `name: Dim` with `show_name: true`, `action` is `tap_action`.
