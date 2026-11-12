# Actions & hover

A tap on a tile or a poster opens the entity's more-info dialog, as on Home Assistant's own tile. You can make a tap, a hold or a double tap do anything else, on the whole card and on its icon alone.

## The card's actions

`tap_action`, `hold_action` and `double_tap_action` take [Home Assistant's actions](https://www.home-assistant.io/dashboards/actions/):

- `more-info`: opens the more-info dialog;
- `toggle`: switches the entity;
- `navigate`: opens another dashboard view, given by `navigation_path`;
- `url`: opens `url_path` in a new tab;
- `perform-action`: runs an action, with its `data` and `target`;
- `assist`: opens Assist;
- `none`: does nothing.

With an entity, a tap and a hold open its more-info dialog and a double tap does nothing. Without an entity, a tap and a hold do nothing until you set them. `entity` in an action points `more-info` or `toggle` at another entity than the card shows, and `confirmation: true` asks before the action runs. A bare name is enough where an action needs nothing else: `tap_action: toggle`.

The controls and the badges keep their own taps, and the icon can have [its own actions](#the-icon-s-own-actions).

::: live

```yaml
- type: custom:tile-card-pro
  entity: light.living_room
  name: Ceiling
  tap_action: toggle
  double_tap_action: { action: navigate, navigation_path: /dashboard-weather/overview }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  name: Good night
  icon: mdi:weather-night
  value: All off
  color: indigo
  tap_action:
    action: perform-action
    perform_action: light.turn_off
    target: { entity_id: [light.living_room, light.desk_lamp] }
  hold_action: { action: more-info, entity: light.living_room }
  grid_options: { columns: 6 }
```

:::

## The icon's own actions

The icon takes `tap_action`, `hold_action` and `double_tap_action` of its own, in the icon's object: beside its `name` (`icon: { name: mdi:fan, tap_action: { action: toggle } }`), or alone to keep the kind's icon (`icon: { tap_action: … }`). An icon without actions of its own is part of the card: a tap there runs the card's action.

Some icons have actions by default:

- On a tile, as on Home Assistant's tile, the icon toggles a light, a switch, a fan, an input boolean, a group, an automation, a humidifier and a valve, and presses a button, an input button and a scene. `icon: { tap_action: none }` makes it part of the tile again.
- On both cards, a lock's and an alarm panel's icon is held to lock or unlock, arm or disarm. A ring fills while you hold, so a short tap cannot do it by accident. An alarm panel that needs a code arms in Home Assistant's dialog instead.

On the icon, `toggle` locks or unlocks a lock, arms or disarms an alarm panel and switches anything else. A rule changes the icon's look, never what a tap on it does.

::: live

```yaml
- type: custom:tile-card-pro
  entity: light.desk_lamp
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: lock.front_door
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: fan.living_room
  icon: { tap_action: { action: toggle } }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.living_room_temperature
  name: Living room
  icon:
    tap_action: { action: more-info, entity: climate.living_room }
    hold_action: { action: more-info, entity: sensor.living_room_humidity }
  grid_options: { columns: 6 }
```

:::

## Hover

The cards answer the pointer as Home Assistant's tile does: a light layer in the card's colour under a mouse, a ripple from where you press, and a ring around the card while it has the keyboard's focus. `hover: false` keeps the card still; its actions still run.

## Reference

| Key                           | Default                                                       | What it does                                      |
| ----------------------------- | ------------------------------------------------------------- | ------------------------------------------------- |
| `tap_action`                  | `more-info` (none without entity)                             | Runs on a tap on the card.                        |
| `hold_action`                 | `more-info` (none without entity)                             | Runs when the card is held.                       |
| `double_tap_action`           | `none`                                                        | Runs on a double tap on the card.                 |
| `hover`                       | `true`                                                        | Home Assistant's hover, press and focus feedback. |
| `icon: { tap_action }`        | toggle on a tile's light, switch, fan …; else none            | Runs on a tap on the icon.                        |
| `icon: { hold_action }`       | toggle on a lock and an alarm panel without a code; else none | Runs when the icon is held.                       |
| `icon: { double_tap_action }` | `none`                                                        | Runs on a double tap on the icon.                 |

An action's own keys:

| Key               | What it does                                                                  |
| ----------------- | ----------------------------------------------------------------------------- |
| `action`          | `more-info`, `toggle`, `navigate`, `url`, `perform-action`, `assist`, `none`. |
| `entity`          | The entity for `more-info` and `toggle`, if not the card's.                   |
| `navigation_path` | `navigate`: the view to open.                                                 |
| `url_path`        | `url`: the address to open.                                                   |
| `perform_action`  | `perform-action`: the action to run, such as `light.turn_on`.                 |
| `data`, `target`  | `perform-action`: its data and its target entities, devices or areas.         |
| `confirmation`    | `true`, or `{ text }`: asks before the action runs.                           |
