# Controls

The [entity card](/cards/entity-card), the [entity group card](/cards/entity-group-card) and the [entity sections card](/cards/entity-sections-card) can do more than show an entity: one key, `control`, adds a switch, a slider, a stepper, mode segments, buttons or a hold-to-confirm button to it. Every control is built from the library the cards already draw, so it looks like the display it replaces and takes the entity's colour and rules. The examples on this page are live: tap, drag and hold them.

## One key

`control: auto` draws what the entity's domain calls for; a name picks a control. Nothing else changes: the name, the value, the rules and the actions stay as they are.

::: live

```yaml
type: custom:entity-group-card-pro
title: Living room
icon: mdi:sofa
entities:
  - { entity: light.living_room, name: Ceiling, control: auto }
  - { entity: light.desk_lamp, name: Desk lamp, control: auto }
  - { entity: climate.living_room, name: Radiator, control: auto }
  - { entity: cover.living_room_blinds, name: Blinds, control: auto }
  - { entity: media_player.living_room_tv, name: TV, control: auto }
  - { entity: input_select.house_mode, control: auto }
  - { entity: script.check_windows, name: Night routine, control: auto }
```

:::

| Option              | Default                           | Description                                                                                                                                                                                          |
| ------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control`           |                                   | `auto` (or `true`) picks the domain default; `toggle`, `slider`, `stepper`, `segments`, `buttons`, `button`, `select` or `hold` pick one; `none` draws nothing.                                      |
| `control_position`  | per control                       | `end` puts the control on the line, `block` under it, `lead` makes the icon the control (toggle, button, hold); a table field or ring has no icon, the control goes to the end.                      |
| `control_attribute` | the shown mode, else the main one | What segments or a select set on a thermostat or fan: `hvac_mode`, `preset_mode` or `fan_mode`.                                                                                                      |
| `control_step`      | entity step, else 1 (climate 0.5) | Step of a slider or stepper.                                                                                                                                                                         |
| `control_options`   | the entity's modes or options     | Options of segments and select: values, or `{ value, label, icon }`. With `control: buttons`, your own buttons: `{ entity, icon, label, color, action }`, see [Your own buttons](#your-own-buttons). |
| `control_confirm`   | `false`                           | The primary control becomes hold to confirm; every button of a group holds on its own.                                                                                                               |

`toggle: true` from earlier versions still works and means `control: toggle`.

### Domain defaults

What `control: auto` draws, and the service each control calls:

| Domain                                      | Controls                                                              | Services                                                                     |
| ------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `light`                                     | toggle, brightness slider under the line (not for on/off lights)      | `homeassistant.toggle`, `light.turn_on` with `brightness_pct`                |
| `switch`, `input_boolean`                   | toggle                                                                | `homeassistant.toggle`                                                       |
| `fan`                                       | toggle and speed segments (from `percentage_step`)                    | `fan.set_percentage`, `fan.turn_off`                                         |
| `cover`                                     | open / stop / close buttons, position slider (when it has a position) | `cover.open_cover`, `stop_cover`, `close_cover`, `set_cover_position`        |
| `climate`                                   | target temperature stepper; with `attribute: hvac_mode` mode segments | `climate.set_temperature`, `set_hvac_mode`, `set_preset_mode`                |
| `lock`                                      | hold to lock / unlock                                                 | `lock.lock`, `lock.unlock`                                                   |
| `script`, `scene`, `button`, `input_button` | Run chip (a round button in row items)                                | `script.turn_on`, `scene.turn_on`, `button.press`, `input_button.press`      |
| `input_select`, `select`                    | select                                                                | `select_option`                                                              |
| `input_number`, `number`                    | slider under the line; a stepper where there is no room               | `set_value`                                                                  |
| `media_player`                              | previous / play-pause / next, volume slider                           | `media_previous_track`, `media_play_pause`, `media_next_track`, `volume_set` |

Other domains get no control from `auto`; a named control on them needs a domain the table lists for that control, otherwise the card logs a warning and the control does nothing.

## The controls

### Toggle and lead tap

The library switch, 48 × 28, a smaller one in grid cells, column items and tables. With `control_position: lead` the icon itself is the switch: filled when on, grey when off.

::: live

```yaml
- type: custom:entity-card-pro
  entity: light.kitchen
  control: toggle
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: light.hallway
  name: Hallway · tap the icon
  control: toggle
  control_position: lead
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: input_boolean.night_mode
  rules:
    - { state: "on", color: indigo, icon: mdi:weather-night, label: Active }
    - { state: "off", color: grey, icon: mdi:weather-sunny, label: Inactive }
  control: toggle
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: switch.garden_pump
  control: toggle
  control_confirm: true
  grid_options: { columns: 6 }
```

:::

The last tile sets `control_confirm: true`: the switch becomes a hold-to-confirm button.

### Slider

The 8 px bar with a knob. Drag it, or focus it and use the arrow keys; a bubble shows the value while dragging. Under the line (`block`, the default in tiles, lists, grid cells and hero leads) it replaces a `visual: bar`; on the line (`end`) it is a short 6 px slider. The fill takes the entity colour, so rules colour the slider too. Brightness, position, volume and fan speed are always 0 to 100 %; `min` and `max` scale the visuals only, and bound the slider of a number or a thermostat.

::: live

```yaml
- type: custom:entity-card-pro
  entity: light.dining_table
  value: "{{ (state_attr('light.dining_table', 'brightness') | float(0) / 2.55) | round }}"
  unit: "%"
  control: slider
  color: amber
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: cover.office_blinds
  attribute: current_position
  unit: "%"
  control: slider
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: input_number.target_humidity
  control: slider
  rules:
    - { below: 45, color: amber, label: Dry }
    - { below: 60, color: green, label: Comfort }
    - { above: 60, color: blue, label: Humid }
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: media_player.kitchen_speaker
  control: slider
  control_position: end
  grid_options: { columns: 6 }
```

:::

### Stepper

`−` value `+` for setpoints and numbers. The step comes from the entity (`target_temp_step`, `step`) or `control_step` and counts from the minimum, as Home Assistant counts it (min 1, step 2: 1, 3, 5 …); the buttons stop at the entity's bounds.

::: live

```yaml
type: custom:entity-group-card-pro
title: Setpoints
icon: mdi:thermostat
entities:
  - { entity: climate.living_room, name: Living room, attribute: current_temperature, secondary: "now", control: stepper }
  - { entity: climate.bedroom, name: Bedroom, control: stepper, control_step: 1 }
  - { entity: input_number.heating_boost, control: stepper }
  - { entity: number.ev_charge_limit, control: stepper }
```

:::

### Segments

Modes, presets and speeds as a pill group; the active one is filled. Options come from the entity (`hvac_modes`, `preset_modes`, fan speeds from `percentage_step`) or from `control_options`, where every entry may carry a `label` and an `icon`. On a thermostat or fan, `control_attribute` says which mode the segments set; without it they follow the shown `attribute` when it is a mode, else the HVAC mode or the fan speed. The last row shows the current temperature and still switches the HVAC mode. A fan with more than six speeds gets a slider instead of segments.

::: live

```yaml
type: custom:entity-group-card-pro
title: Modes
icon: mdi:tune
entities:
  - { entity: climate.living_room, name: Heating, attribute: hvac_mode, control: segments }
  - entity: climate.bedroom
    name: Preset
    attribute: preset_mode
    control: segments
    control_options:
      - { value: eco, label: Eco, icon: mdi:leaf }
      - { value: comfort, label: Comfort, icon: mdi:sofa }
      - { value: boost, label: Boost, icon: mdi:fire }
  - { entity: fan.living_room, name: Fan speed, control: segments }
  - { entity: climate.living_room, name: Now, attribute: current_temperature, control: segments, control_attribute: hvac_mode }
```

:::

### Buttons

Round icon buttons: open / stop / close for covers, previous / play-pause / next for media players.

::: live

```yaml
type: custom:entity-group-card-pro
title: Buttons
icon: mdi:gesture-tap-button
entities:
  - { entity: cover.bedroom_blinds, name: Bedroom blinds, control: buttons }
  - { entity: cover.garage_door, control: buttons }
  - { entity: media_player.living_room_tv, name: TV, attribute: media_title, control: buttons }
```

:::

#### Your own buttons

With `control: buttons`, `control_options` replaces the domain's buttons with a list of your own, for the scenes of a room, a few scripts or the lights next to it. A button runs its `entity` (scenes and scripts turn on, buttons press) or switches it (a light, a switch, a fan: the button is filled while it is on); an `action` (any [Home Assistant action](https://www.home-assistant.io/dashboards/actions/), the shape of `tap_action`) runs instead; the button's `entity` is the entity of `more-info` and `toggle`, and the target of a `perform-action` that names nothing to act on itself (no `target`, and no `entity_id`, `device_id`, `area_id`, `floor_id` or `label_id` in its `data`). Every button takes its own `color` (default: the row's colour) and `icon` (default: the entity's icon); with a `label` it is a chip with text, without one a round icon button. A row of buttons needs no entity of its own: a `name` and an `icon` are enough.

::: live

```yaml
type: custom:entity-group-card-pro
title: Living room
icon: mdi:sofa
entities:
  - name: Scenes
    icon: mdi:palette
    control: buttons
    control_options:
      - { entity: scene.bright, color: amber }
      - { entity: scene.dinner, color: orange }
      - { entity: scene.movie_night, color: deep-purple }
      - { entity: scene.good_night, color: indigo }
  - entity: light.living_room
    name: Lights
    control: buttons
    control_options:
      - { entity: light.living_room, label: Ceiling, color: amber }
      - { entity: light.desk_lamp, label: Desk, color: orange }
      - { entity: switch.coffee_machine, label: Coffee, icon: mdi:coffee, color: brown }
  - name: Routines
    icon: mdi:script-text-outline
    control_position: block
    control: buttons
    control_options:
      - { entity: script.check_windows, label: Windows, color: teal }
      - { entity: scene.dimmed, label: Dimmed, color: deep-orange }
      - { icon: mdi:cog, label: Settings, action: { action: navigate, navigation_path: /config } }
```

:::

| Key      | Default           | Description                                                                                                                                            |
| -------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `entity` |                   | What the button runs or switches; the entity of `action` (the target of a `perform-action` without one). Each button needs an `entity` or an `action`. |
| `action` | the entity's own  | A Home Assistant action, run instead of the entity's service (`perform-action`, `navigate`, `more-info` …).                                            |
| `color`  | the row's colour  | Colour token, hex or `var()`; the button is a soft tint of it, filled while its entity is on (a lock unlocked, a cover open).                          |
| `icon`   | the entity's icon | `mdi:` icon.                                                                                                                                           |
| `label`  | none (icon only)  | Text beside the icon; the name a screen reader reads is the label, else the entity's name.                                                             |

An entity with nothing to run or switch (a sensor) opens its more-info dialog. `control_confirm: true` makes every button a hold of its own: round buttons fill their ring, chips fill from the left. `control_position: block` puts the buttons under the line, where many of them wrap. Row items and the header draw no buttons: there an item needs an `entity` or a `value` of its own.

### Button

A Run chip for scripts, scenes and buttons; it says Done for a moment after the call. In a row layout it is a round button in place of the icon.

::: live

```yaml
- type: custom:entity-group-card-pro
  title: Actions
  icon: mdi:play-circle-outline
  entities:
    - { entity: script.check_windows, control: button }
    - { entity: scene.movie_night, control: button, color: deep-purple }
    - { entity: input_button.ring_doorbell, control: button }
  grid_options: { columns: 6 }
- type: custom:entity-group-card-pro
  title: Scenes
  icon: mdi:palette
  layout: row
  entities:
    - { entity: scene.bright, control: button, color: amber }
    - { entity: scene.dinner, control: button, color: orange }
    - { entity: scene.good_night, control: button, color: indigo }
    - { entity: script.check_windows, name: Windows, control: button, color: teal }
  grid_options: { columns: 6 }
```

:::

### Select

A menu for `input_select` and `select` entities, or any `options` list on a domain with a select service.

::: live

```yaml
type: custom:entity-group-card-pro
title: Helpers
icon: mdi:format-list-bulleted
layout: table
entities:
  - { entity: input_select.house_mode, control: select }
  - { entity: select.thermostat_schedule, control: select }
```

:::

### Hold to confirm

Press and hold for a second; a ring fills around the button and the service runs when it is full. Letting go earlier cancels. The default for locks; `control_confirm: true` turns any toggle or button into one, and gives every button of a group (the garage door's open, stop and close) a hold of its own. `control: hold` on a light, switch, fan or media player toggles it; other domains have nothing to hold and grey the button out.

::: live

```yaml
- type: custom:entity-card-pro
  entity: lock.front_door
  control: hold
  grid_options: { columns: 6 }
- type: custom:entity-card-pro
  entity: cover.garage_door
  control: buttons
  control_confirm: true
  grid_options: { columns: 6 }
```

:::

## Where a control sits

Controls use the slots the entities already have. In tiles, lists and hero leads the `end` slot is where the toggle used to be and the `block` slot is under the line. Grid cells put small controls next to the icon and sliders under the value. Row items draw only lead controls (tap the icon, a round button, a hold button); column items and table fields put small controls on the right, and keep only the primary control of `control: auto` (a cover's buttons, a light's switch).

When a card gets narrow, a control on the line wraps under the name instead of squeezing it away, and in a narrow column a wide control goes under the name. A tile with a control sizes to its content, and asks the sections grid for room: at least 4 columns for a switch or hold button on its line, 6 for anything wider. Segments shrink to their icons and, as a last resort, scroll sideways, so no option is ever cut off.

### Grid

::: live

```yaml
type: custom:entity-group-card-pro
title: Grid
icon: mdi:home
layout: grid
columns: 2
entities:
  - entity: light.living_room
    name: Sofa lamp
    value: "{{ (state_attr('light.living_room', 'brightness') | float(0) / 2.55) | round }}"
    unit: "%"
    control: auto
  - { entity: climate.bedroom, name: Bedroom, control: stepper }
  - { entity: cover.living_room_blinds, name: Blinds, attribute: current_position, unit: "%", control: auto }
  - { entity: fan.living_room, name: Ceiling fan, attribute: percentage, unit: "%", control: segments }
  - { entity: media_player.kitchen_speaker, name: Speaker, attribute: media_title, control: auto }
  - { entity: lock.front_door, control: hold }
```

:::

### Row and column

::: live

```yaml
- type: custom:entity-group-card-pro
  title: Row · tap the icons
  icon: mdi:lightbulb-group
  layout: row
  entities:
    - { entity: light.living_room, name: Ceiling, control: toggle }
    - { entity: light.desk_lamp, name: Desk, control: toggle }
    - { entity: light.kitchen, name: Kitchen, control: toggle }
    - { entity: light.garden, name: Garden, control: toggle }
    - { entity: switch.coffee_machine, name: Coffee, control: toggle }
  grid_options: { columns: 6 }
- type: custom:entity-group-card-pro
  title: Column
  icon: mdi:view-sequential
  layout: column
  entities:
    - { entity: light.office, name: Office, control: toggle }
    - { entity: fan.bedroom, name: Fan, control: toggle }
    - { entity: climate.living_room, name: Radiator, control: stepper }
    - { entity: cover.awning, name: Awning, attribute: current_position, unit: "%", control: buttons }
  grid_options: { columns: 6 }
```

:::

### Table

::: live

```yaml
type: custom:entity-group-card-pro
title: Settings
icon: mdi:tune
layout: table
show_icon: true
entities:
  - { entity: climate.living_room, name: Target, control: stepper }
  - { entity: fan.living_room, name: Ventilation, control: segments }
  - { entity: input_select.house_mode, name: Mode, control: select }
  - { entity: light.desk_lamp, name: Night light, show_value: false, control: slider }
  - { entity: switch.garden_pump, name: Pump, control: toggle }
  - { entity: input_number.heating_boost, name: Boost, control: stepper }
  - { entity: cover.garage_door, name: Garage, control: hold }
```

:::

### A room

Sections combine them: a hero lead with a switch and a brightness slider, a grid of controls, scenes in a row and settings in a table.

::: live

```yaml
type: custom:entity-sections-card-pro
title: Living room
icon: mdi:sofa
header_entities:
  - { entity: sensor.living_room_temperature, decimals: 1 }
  - { entity: sensor.living_room_humidity, decimals: 0 }
sections:
  - layout: hero
    entities:
      - entity: light.living_room
        name: Lights
        value: "{{ (state_attr('light.living_room', 'brightness') | float(0) / 2.55) | round }}"
        unit: "%"
        control: auto
  - layout: grid
    divider: true
    entities:
      - { entity: climate.living_room, name: Climate, control: stepper }
      - { entity: cover.living_room_blinds, name: Blinds, attribute: current_position, unit: "%", control: auto }
  - layout: row
    divider: true
    entities:
      - { entity: scene.movie_night, name: Movie, control: button, color: deep-purple }
      - { entity: scene.bright, name: Bright, control: button, color: amber }
      - { entity: scene.good_night, name: Night, control: button, color: indigo }
      - { entity: media_player.living_room_tv, name: TV, control: toggle }
  - layout: table
    divider: true
    entities:
      - { entity: fan.living_room, name: Ventilation, control: segments }
      - { entity: input_select.house_mode, name: Mode, control: select }
```

:::

## States

A control shows what it asked for right away, as a ghost: the knob pulses, the fill is translucent, the segment is outlined, until the entity's state changes (or five seconds pass, when the device never answers). An unavailable entity greys its control out. The demo's attic light and lock take a moment to answer, so their ghosts are easy to see; the rest of the demo home answers at once.

::: live

```yaml
type: custom:entity-group-card-pro
title: States
icon: mdi:gesture-tap-hold
entities:
  - { entity: light.attic, name: Pending · tap or drag, control: auto }
  - { entity: lock.garage_side_door, name: Pending · hold to lock, control: hold }
  - { entity: switch.shed_heater, name: Unavailable · offline, control: toggle }
```

:::

## Keyboard and screen readers

Every control works without a pointer. Tab reaches the row's own action first (a button behind the content, named after the entity), then the row's controls in order; the focus stays where it is while the card updates.

- **Switch and lead tap**: a switch (`role="switch"`), Space or Enter flips it.
- **Slider**: the arrow keys step, PageUp and PageDown jump ten steps, Home and End go to the ends; the call follows a short pause.
- **Segments**: a radio group with one tab stop; the arrow keys move along the segments and choose, Home and End jump to the ends.
- **Stepper, buttons, Run**: plain buttons.
- **Select**: the browser's own menu.
- **Hold to confirm**: keep Space or Enter pressed for a second. A screen reader cannot hold, so it presses twice: the first press arms the button ("Press again to …"), a second press within five seconds runs it.

A failed service call shows Home Assistant's toast with the error and fires the failure haptic.

Controls never ask for confirmation through Home Assistant's dialog; `control_confirm: true` is their way of asking. `tap_action`, `hold_action` and `double_tap_action` on the row keep working next to a control: the control swallows its own gestures, the rest of the row runs the actions.
