# Poster controls

A poster can carry one control: a switch, a slider, a stepper, speeds, buttons, a select or a button to hold. The domain poster types bring theirs, so a light poster is a switch and a dimmer without a line of config; any other poster gets one with `control`, the same key and options as on the [entity cards](/cards/controls). A tap on the poster opens more-info; the control and the [badges](/cards/poster-card#badges) take their own taps.

## What the poster types bring

Without `control` (or with `control: auto`), a domain poster type draws its own controls:

| Poster type            | Controls                                                              |
| ---------------------- | --------------------------------------------------------------------- |
| `light`                | a switch beside the value, brightness below it                        |
| `fan`                  | its speeds                                                            |
| `climate`              | a stepper for the target temperature                                  |
| `lock`                 | hold the icon to lock or unlock                                       |
| `alarm_control_panel`  | hold the icon to arm or disarm (none where the panel wants a code)    |
| `media_player`         | previous, play / pause and next beside the title, the volume below it |
| `cover`                | open, stop and close                                                  |
| `vacuum`, `lawn_mower` | start / pause and back to the dock                                    |

Every other poster type (a sensor, the weather, the wind, the energy types …) has no control unless the card asks for one.

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

`control` with a name replaces the poster type's controls with that one; `control: false` (or `none`) drops them. A light that only dims, a fan that only switches, a thermostat to look at:

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

A card names one control. The pairs the poster types draw (a light's switch and its brightness, a player's transport and its volume) are their own defaults: `control: slider` on a light is the slider alone.

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

`control_attribute` picks what segments and a select change on a thermostat or a fan: `hvac_mode`, `preset_mode` or `fan_mode` (by default the attribute the poster shows, else the main mode). `control_options` limits segments and selects to the options listed, with a `label` and an `icon` of their own:

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

A control has three places on a poster, set with `control_position`:

| `control_position` | Place                                                                                              | The default of                           |
| ------------------ | -------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `end`              | beside the value and the line under it, at the right; under them where they do not fit beside them | switch, stepper, speeds, buttons, select |
| `block`            | under the value, the poster's whole width                                                          | slider                                   |
| `lead`             | the icon is the control: a tap switches, a hold confirms                                           | the hold of locks and alarm panels       |

::: live

```yaml
- type: custom:poster-card-pro
  entity: switch.coffee_machine
  icon: mdi:coffee-maker
  control: toggle
  control_position: lead
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: cover.garage_door
  control: buttons
  control_position: block
  grid_options: { columns: 6 }
```

:::

The name runs across the poster on top; the value and the line under it are one block, and a control beside it ends on the baseline of the block's last line, so the value sits where it sits without one. On a narrow poster the control goes under the block (under the line under the value) rather than squeezing the value; the line under the value is cut where a control beside it starts. The place is found once for the card's size: a value that gets wider later (Cleaning, then Returning) is drawn smaller rather than pushing the controls down, and one that gets narrower leaves them where they are. Where the poster is short of room, the value is drawn smaller first; if that is not enough, a slider below the value gives way (its more-info dialog still has it): a media player's volume on a poster of 6 × 3, shown on one of 9 × 4. See [Poster sizes](/cards/poster-sizes).

## Your own buttons

`control: buttons` with `control_options` draws your buttons instead of the domain's. A button runs its `entity` (a scene or a script turns on, a button is pressed) or switches it (a light, a switch, a fan: the button is filled while it is on), or runs its own `action`: any [Home Assistant action](https://www.home-assistant.io/dashboards/actions/), the shape of `tap_action`. A poster of buttons needs no entity: a `name`, an `icon` and a `value` or `status` are enough.

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

A `perform-action` that names no target of its own (no `target`, and no `entity_id`, `device_id`, `area_id`, `floor_id` or `label_id` in its `data`) acts on the button's `entity`: the second button above needs no `target`. A button without an `entity` acts on nothing but what its action names, never on the poster's entity.

| Key          | Default             | Description                                                                                                  |
| ------------ | ------------------- | ------------------------------------------------------------------------------------------------------------ |
| `entity`     |                     | What the button runs or switches, and the target of its `action`. A button needs an `entity` or an `action`. |
| `action`     | the entity's own    | A Home Assistant action, run instead (`perform-action`, `navigate`, `more-info` …).                          |
| `color`      | the poster's colour | Colour token, hex or `var()`; a soft tint, filled while its entity is on.                                    |
| `icon`       | the entity's icon   | `mdi:` icon.                                                                                                 |
| `label`      | none                | Text beside the icon: a chip. Without one it is a round button.                                              |
| `visibility` | always              | [Conditions](/guide/visibility): the button is drawn only while they hold.                                   |

A button with `visibility` comes and goes with its conditions; here the dock button shows only while the robot is out:

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

Some things should not happen by a stray tap. A hold fills a ring around the button for a second and runs when it is full; letting go earlier cancels. Locks and alarm panels hold by default. `control_confirm: true` turns a switch or buttons into holds (every button of a row its own), and `control: hold` holds any entity that switches:

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
  control: hold
  control_position: lead
  grid_options: { columns: 6 }
```

:::

The icon of a held lead shows the entity as it is (a padlock locked while locked); its label says what holding does ("Hold to unlock"). A screen reader's click arms the hold, a second one within five seconds runs it.

## Reference

| Key                 | Default                      | Description                                                                                                                        |
| ------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `control`           | `auto`                       | `auto` (the type's), `toggle`, `slider`, `stepper`, `segments`, `select`, `buttons`, `button`, `hold`; `false` or `none` for none. |
| `control_position`  | the control's own            | `end`, `block` or `lead`.                                                                                                          |
| `control_attribute` | the shown one, else the mode | `hvac_mode`, `preset_mode` or `fan_mode`: what segments and a select change on a thermostat or fan.                                |
| `control_options`   | the entity's                 | Segments and select: the options (`value`, `label`, `icon`). Buttons: [your own buttons](#your-own-buttons).                       |
| `control_confirm`   | `false`                      | Every switch and button a hold.                                                                                                    |

What a control does, how it shows a call on its way and what it does when one fails is the same on every card: see [Controls](/cards/controls).
