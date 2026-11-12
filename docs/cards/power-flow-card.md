# Power flow

`custom:power-flow-card-pro` shows where your electricity comes from and where it goes right now: solar, battery and grid on the left, the home in the middle, rooms and devices on the right, joined by lines that carry the power as moving dots. For the energy of a day or a month, use the [energy flow card](/cards/energy-flow-card).

## Sources and home

`sources` lists solar arrays, batteries and grid connections; `home` is the home's consumption. Every sensor reports W or kW. A battery's `power` is positive while it discharges, a grid's `power` positive while it imports; `invert: true` flips a sensor with the opposite sign. Integrations that report two sensors name them as a pair instead: `charge` / `discharge` for a battery, `import` / `export` for the grid.

`soc` draws the battery's charge as a ring on its node, and `peak` (W) draws a solar array's production against the panels' peak. The home's ring shows the mix it runs on. Without `home` the card adds the sources up.

::: live

```yaml
type: custom:power-flow-card-pro
home: sensor.power_consumption
sources:
  - { type: solar, entity: sensor.solar_power, peak: 8000 }
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
  - { type: grid, power: sensor.grid_power }
```

:::

Solar covers the home first, then charges the battery, and the rest is exported; the battery and then the grid cover what is left. The line above the tree names the state (**Exporting**, **On battery**, **Importing** or **Balanced**) and how self-sufficient the home is right now.

A grid meter that counts every phase on its own can import and export at the same time. `both_ways: true` on an `import` / `export` pair tells the card so: the grid node then shows both values, in and out.

## A battery fed by its panels

A plug-in battery (a balcony system, a DC-coupled hybrid) is charged by its panels, not by the grid. `charge_from: solar` tells the card so: solar charges that battery before it covers the home. With a `charge` / `discharge` pair the card draws both flows at once, the panels into the battery and the battery into the home, and the node shows both values.

With several arrays, `charge_from` can name the entity of the solar source that feeds the battery, or a list of them. Here the roof covers the home while the balcony panels fill their own battery:

::: live

```yaml
type: custom:power-flow-card-pro
sources:
  - { type: solar, entity: sensor.solar_power, name: Roof }
  - { type: solar, entity: sensor.balcony_solar_power, name: Balcony }
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
  - type: battery
    name: Balcony battery
    charge: sensor.balcony_battery_charge_power
    discharge: sensor.balcony_battery_discharge_power
    soc: sensor.balcony_battery_soc
    charge_from: sensor.balcony_solar_power
  - { type: grid, power: sensor.grid_power }
```

:::

## Consumers

`consumers` lists the devices the home feeds, each with a power sensor and an optional `name`, `icon` and `secondary` line. An **Other** node takes what the home uses beyond them: `other: false` leaves it out, `other: { name, icon }` renames it. `consumer_style: list` draws the consumers as rows with a bar.

A device that produces, such as a car giving power back, reports a negative value: its link runs back to the home in the solar colour.

::: live

```yaml
type: custom:power-flow-card-pro
title: Power
icon: mdi:lightning-bolt
home: sensor.power_consumption
sources:
  - { type: solar, entity: sensor.solar_power }
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
  - { type: grid, power: sensor.grid_power }
consumers:
  - { entity: sensor.heat_pump_power, name: Heat pump, icon: mdi:heat-pump, secondary: floor heating }
  - { entity: sensor.ev_charger_power, name: EV, icon: mdi:car-electric }
  - { entity: sensor.washer_power, name: Washer, icon: mdi:washing-machine }
  - { entity: sensor.dining_light_power, name: Lights, icon: mdi:lightbulb }
```

:::

## Rooms

A consumer with a `group` name and its own `entities` is a room: the home feeds the room, the room feeds its devices. Rooms and single devices mix freely.

::: live

```yaml
type: custom:power-flow-card-pro
home: sensor.power_consumption
sources:
  - { type: solar, entity: sensor.solar_power }
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
  - { type: grid, power: sensor.grid_power }
consumers:
  - group: Laundry
    icon: mdi:washing-machine
    entities:
      - { entity: sensor.washer_power, name: Washer, icon: mdi:washing-machine }
      - { entity: sensor.dryer_power, name: Dryer, icon: mdi:tumble-dryer }
  - group: Kitchen
    icon: mdi:silverware-fork-knife
    entities:
      - { entity: sensor.range_hood_power, name: Range hood, icon: mdi:stove }
      - { entity: sensor.dining_light_power, name: Lights, icon: mdi:lightbulb }
  - { entity: sensor.heat_pump_power, name: Heat pump, icon: mdi:heat-pump }
```

:::

## Direction and node sizes

`direction: down` turns the tree for tall places: sources across the top, the home in the middle, consumers along the bottom.

`icon_size` sets the diameter of a node's circle in pixels (16 to 96), on a source, the home, a consumer, a room, a device or `other`; the icon grows with it.

::: live

```yaml
type: custom:power-flow-card-pro
direction: down
home: { entity: sensor.power_consumption, icon_size: 56 }
sources:
  - { type: solar, entity: sensor.solar_power, icon_size: 52 }
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
  - { type: grid, power: sensor.grid_power }
consumers:
  - { entity: sensor.heat_pump_power, name: Heat pump, icon: mdi:heat-pump }
  - { entity: sensor.washer_power, name: Washer, icon: mdi:washing-machine }
  - { entity: sensor.office_power, name: Office, icon: mdi:monitor }
```

:::

## Motion, idle links and units

`flow_style` sets how the power moves: `dots` (the default), `lines`, `arrows`, or `none` for still lines in their colour. The more power a link carries, the more and faster its dots, from slowest at `animation.slow_below` to fastest at `animation.fast_above` (0 and 3600 W). Lower `fast_above` in a flat that rarely draws a kilowatt, raise it for a workshop.

A link carrying less than `idle_below` (20 W) counts as idle, so standby noise never makes the flow blink. Idle links are dashed tracks; `idle_links: hidden` leaves them out, `faint` draws them as faint lines.

Values show in W below `kw_above` (1000 W) and in kW from there on, whatever unit the sensors report. `decimals` sets the decimals of both units, or `{ w, kw }` each.

::: live

```yaml
type: custom:power-flow-card-pro
home: sensor.power_consumption
flow_style: arrows
idle_links: faint
animation: { fast_above: 1500 }
kw_above: 0
decimals: { kw: 1 }
sources:
  - { type: solar, entity: sensor.solar_power }
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
  - { type: grid, power: sensor.grid_power }
```

:::

## States, rules and the grid

On a grid source, `price` and the card's `expensive_above` add an **Expensive** state while importing at or above that price. `offline` names an entity that is `on` while the grid is down (`{ entity, state }` for another state): the grid node turns red, the card tints and the line says what keeps the home running. A `generator` sensor takes the grid's place during an outage. `fossil` (the [CO2 Signal](https://www.home-assistant.io/integrations/co2signal/) percentage) or `non_fossil` splits the grid's share of the home ring into low-carbon and fossil.

`rules` on the card match the home's power in watts: the first matching rule's `label` becomes a pill on the summary line, its `color` paints the home node and `tint_card: true` tints the card. A source or a consumer takes `rules` of its own on its sensor's value, for its node's colour and icon.

::: live

```yaml
type: custom:power-flow-card-pro
home: sensor.power_consumption
expensive_above: 0.35
sources:
  - { type: solar, entity: sensor.solar_power }
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
  - type: grid
    power: sensor.grid_power
    price: sensor.electricity_price
    offline: binary_sensor.grid_outage
    generator: sensor.generator_power
    fossil: sensor.grid_fossil_percentage
rules:
  - { below: 500, color: green, label: Quiet }
  - { below: 3000, color: primary, label: Normal }
  - { above: 3000, color: red, label: Heavy load, tint_card: true }
```

:::

## Beyond electricity

The tree works for any flow. When the first sensor reports a unit other than power, such as a water flow in L/min, the card shows every value in that unit and leaves the state and self-sufficiency out of the summary. `idle_below` (then 0 unless given), `hide_consumers_below` and the rules read that unit too. Every sensor of the tree should report the same unit.

::: live

```yaml
type: custom:power-flow-card-pro
title: Water
icon: mdi:water
decimals: 1
sources:
  - { type: grid, power: sensor.water_flow, name: Mains, icon: mdi:water-pump }
consumers:
  - { entity: sensor.bathroom_water_flow, name: Bathroom, icon: mdi:shower }
  - { entity: sensor.kitchen_water_flow, name: Kitchen, icon: mdi:faucet }
  - { entity: sensor.garden_water_flow, name: Garden, icon: mdi:sprinkler-variant }
other: { name: Rest of the house, icon: mdi:home-outline }
```

:::

## Visibility

A source, consumer, room or device with [`visibility`](/guide/visibility) is drawn only while its conditions hold; a condition without `entity` reads the node's own sensor. `hide_consumers_below` hides the consumers that draw less than that many watts and shows them again once they draw clearly more. A room's or a device's `hide_below` overrides it, and `0` never hides.

What a hidden consumer draws counts in **Other**, so the numbers still add up. The card's height follows the nodes it shows.

::: live

```yaml
type: custom:power-flow-card-pro
home: sensor.power_consumption
hide_consumers_below: 20
sources:
  - type: solar
    entity: sensor.solar_power
    visibility: [{ condition: state, entity: sun.sun, state: above_horizon }]
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
  - { type: grid, power: sensor.grid_power }
consumers:
  - { entity: sensor.heat_pump_power, name: Heat pump, icon: mdi:heat-pump }
  - entity: sensor.ev_charger_power
    name: EV
    icon: mdi:car-electric
    visibility: [{ condition: state, entity: binary_sensor.ev_plugged, state: "on" }]
  - { entity: sensor.washer_power, name: Washer, icon: mdi:washing-machine }
  - { entity: sensor.office_power, name: Office, icon: mdi:monitor, hide_below: 0 }
```

:::

## Header

`title` and `icon` head the card, and `title_tap_action` runs when you tap them. `badges` sit at the end of the title line, small and plain unless a badge sets its `style` or `size`; they take the [badge keys](/cards/badges#badge-keys). Here the price with its last 12 hours and the battery's charge as a ring:

::: live

```yaml
type: custom:power-flow-card-pro
title: Power
icon: mdi:flash
badges:
  - { entity: sensor.electricity_price, visual: { type: sparkline, hours: 12 } }
  - { entity: sensor.battery_soc, icon: { ring: true } }
home: sensor.power_consumption
sources:
  - { type: solar, entity: sensor.solar_power }
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
  - { type: grid, power: sensor.grid_power }
```

:::

## Actions and hover

A tap on a node opens its entity's more-info dialog. `tap_action`, `hold_action` and `double_tap_action` on the card set the default for every node, and a source, the home or a consumer sets its own. `hover: true` brightens a node's circle under the pointer, as Home Assistant's tile does; see [Actions & hover](/cards/actions).

## Card size

The card takes the full width of a section and is as tall as its tree. With a fixed number of `rows` in `grid_options`, the tree fills the cell: more room spreads it out, less room scales it down. `fill_height: false` keeps the card at its own height in a stretched row; see [Filling the height](/guide/sizing#filling-the-height).

## The visual editor

Home Assistant's card editor shows the title and icon, then the card's options in sections: the home, the sources and the consumers (each in a view of its own), Appearance, the values (thresholds, the price for **Expensive**, the animation's range), the badges, the home's rules (in W) and the title's tap action. A source is measured by one signed sensor or by a pair; a grid also takes its price, outage, generator and fuel mix. A room's devices stay in YAML. A value left at its default writes nothing, and what the form does not show stays in the YAML as written. Try it in the [Playground](/playground), or with **Edit** under any example.

## Reference

### Card options

| Option                 | Default                               | Description                                                                                                     |
| ---------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `sources`              | required                              | Solar, battery and grid entries ([below](#sources)), in drawing order.                                          |
| `home`                 | sum of the sources                    | The home's consumption sensor, or an object ([below](#home-consumers-and-rooms)).                               |
| `consumers`            | –                                     | Devices and rooms, in drawing order: an entity id, `{ entity, … }` or `{ group, entities, … }`.                 |
| `consumer_style`       | `nodes`                               | `nodes`, or `list` for rows with a bar (with `direction: right`).                                               |
| `other`                | `true` with consumers                 | The **Other** node; `false` leaves it out, `{ name, icon, icon_size }` styles it.                               |
| `direction`            | `right`                               | `right` (sources → home → consumers) or `down`.                                                                 |
| `flow_style`           | `dots`                                | `dots`, `lines`, `arrows`, or `none` (no motion).                                                               |
| `idle_links`           | `dashed`                              | Links that carry nothing: `dashed`, `hidden` or `faint`.                                                        |
| `idle_below`           | `20`                                  | Watts below which a link is idle and names no state; `0`: anything above nothing flows.                         |
| `animation`            | `{ slow_below: 0, fast_above: 3600 }` | The watts between which the flow goes from slowest to fastest.                                                  |
| `kw_above`             | `1000`                                | Watts from which values show in kW; `0`: always kW.                                                             |
| `decimals`             | `{ w: 0, kw: 2 }`                     | Decimals of the values: one number for both units, or `{ w, kw }`.                                              |
| `expensive_above`      | –                                     | Price (in the price sensor's unit) at or above which importing shows **Expensive** and tints the card.          |
| `hide_consumers_below` | –                                     | Hides a consumer while it draws less than this many watts; its watts count in **Other**.                        |
| `rules`                | –                                     | `{ below, above, color, label, tint_card }` on the home's power in W; the first match wins.                     |
| `title`, `icon`        | –                                     | The header. Templates allowed.                                                                                  |
| `title_tap_action`     | none                                  | What a tap on the title or its icon does.                                                                       |
| `badges`               | –                                     | Badges at the end of the title line: entity ids or [badge keys](/cards/badges#badge-keys).                      |
| `header_entities`      | –                                     | The old header badges; go in 4.0, use `badges` ([Moving to 3.0](/guide/migrating)).                             |
| `hours_to_show` …      | `24`                                  | `hours_to_show`, `bucket_minutes`, `smoothing_minutes`: the history window of the old `header_entities`' plots. |
| `tap_action` …         | `more-info`                           | `tap_action`, `hold_action` (`more-info`) and `double_tap_action` (`none`): the default for every node.         |
| `hover`                | `false`                               | Home Assistant's hover effect on every node; a source, the home or a consumer sets its own.                     |

### Sources

| Option                 | Applies to    | Description                                                                                                          |
| ---------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------- |
| `type`                 | all           | `solar`, `battery` or `grid`.                                                                                        |
| `entity`               | solar         | The production sensor.                                                                                               |
| `peak`                 | solar         | The panels' peak power in W: a ring shows the production against it.                                                 |
| `power`                | battery, grid | One signed sensor: a battery positive while discharging, a grid positive while importing.                            |
| `invert`               | battery, grid | `true` flips the sign of `power`.                                                                                    |
| `charge`, `discharge`  | battery       | Two sensors in place of `power`.                                                                                     |
| `soc`                  | battery       | The state of charge in %, drawn as the node's ring.                                                                  |
| `charge_from`          | battery       | `any` (default); `solar`: the panels feed it, not the grid; or the entity of a solar source (or a list): only those. |
| `import`, `export`     | grid          | Two sensors in place of `power`; `export` is optional.                                                               |
| `both_ways`            | grid          | `true`: the `import` / `export` meter may do both at once, and the node shows both values. Default `false`.          |
| `price`                | grid          | The price sensor, for the **Expensive** state.                                                                       |
| `offline`              | grid          | An entity that is `on` while the grid is down, or `{ entity, state }`.                                               |
| `generator`            | grid          | A generator's power: takes the grid's place while it is offline.                                                     |
| `fossil`, `non_fossil` | grid          | The grid's fossil (or low-carbon) percentage: splits the grid's share of the home ring.                              |
| `name`, `icon`         | all           | The node's name (default Solar, Battery, Grid) and icon.                                                             |
| `color`                | all           | A fixed colour for the node, over the flow colour and the rules.                                                     |
| `rules`                | all           | Colour and icon of the node by the sensor's value; the first match wins.                                             |
| `secondary`            | all           | A line under the name. Template allowed.                                                                             |
| `decimals`             | all           | Decimals of the node's value, 0 to 3.                                                                                |
| `icon_size`            | all           | The circle's diameter in px, 16 to 96 (solar and grid 44, battery 40).                                               |
| `visibility`           | all           | Draws the node only while the [conditions](/guide/visibility) hold.                                                  |
| `hover`                | all           | Its own hover effect.                                                                                                |

### Home, consumers and rooms

The home and every consumer take `entity`, `name`, `icon`, `color`, `secondary`, `rules` (colour and icon by the value), `decimals`, `tap_action`, `hold_action`, `double_tap_action` and `hover`, as a source does.

| Option       | Applies to           | Description                                                                                |
| ------------ | -------------------- | ------------------------------------------------------------------------------------------ |
| `icon_size`  | home, consumer, room | The circle's diameter in px, 16 to 96 (home 46, consumer and room 32, a room's device 24). |
| `invert`     | home, consumer       | `true` flips the sensor's sign; a consumer's negative value is power it produces.          |
| `hide_below` | consumer, room       | This node's `hide_consumers_below` (a room's for its devices); `0` never hides.            |
| `visibility` | consumer, room       | Draws the node only while the [conditions](/guide/visibility) hold.                        |
| `group`      | room                 | The room's name.                                                                           |
| `entities`   | room                 | The room's devices: entity ids or consumers.                                               |
| `icon`       | room                 | The room's icon.                                                                           |

### Grid and Home Assistant options

The card takes 12 columns and sizes its height to its tree (`rows: auto`); it can shrink to 6 columns and 3 rows.

| Key            | Default | Description                                                        |
| -------------- | ------- | ------------------------------------------------------------------ |
| `grid_options` | –       | Home Assistant's size in a sections view: `columns`, `rows`.       |
| `fill_height`  | `true`  | Fills the height the card is given; `false` keeps its own height.  |
| `visibility`   | –       | Home Assistant's conditions that show or hide the whole card.      |
| `view_layout`  | –       | Placement in a [layout card](/cards/layout-card) or a custom view. |
| `card_mod`     | –       | Styles for the card-mod plugin.                                    |
