# Visibility

Home Assistant shows or hides a whole card with `visibility`. The cards take the same key on their parts: a tile in a tile group, a badge, a button, a section of the weather card, a node of the power flow, a series of the multi trend card. A part with `visibility` is drawn only while every one of its conditions holds. The conditions are Home Assistant's, so a condition copied from its card editor works here as well.

Switch the guests on and off (a tap on their icon): the bedroom's tiles come and go.

::: live

```yaml
type: custom:tile-group-card-pro
title: Guest room
icon: mdi:bed
tiles:
  - entity: input_boolean.guest_mode
    name: Guests
  - entity: light.bedroom
    visibility:
      - { condition: state, entity: input_boolean.guest_mode, state: "on" }
  - entity: climate.bedroom
    visibility:
      - { condition: state, entity: input_boolean.guest_mode, state: "on" }
```

:::

## Where it goes

| Card                                                                                                        | Parts with `visibility`                                                                                     |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [Tile group](/cards/tile-group-card)                                                                        | every tile, every badge in the header                                                                       |
| [Tile](/cards/tile-card), [poster](/cards/poster-card)                                                      | every [badge](/cards/poster-badges), every one of [your own buttons](/cards/tile-controls#your-own-buttons) |
| [Heading](/cards/heading-card)                                                                              | every badge                                                                                                 |
| [Layout](/cards/layout-card), [swipe](/cards/swipe-card)                                                    | every card inside: its own `visibility`, as Home Assistant evaluates it                                     |
| [Weather](/cards/weather-card)                                                                              | every section (any type), the entities of a section, header entities                                        |
| [Power flow](/cards/power-flow-card#visibility)                                                             | sources, consumers, rooms and their devices, header entities; also `hide_consumers_below`                   |
| [Multi trend](/cards/multi-trend-card)                                                                      | every series                                                                                                |
| The deprecated [entity cards](/cards/entity-group-card), [wind](/cards/wind-card), [rain](/cards/rain-card) | every entity, header entity, section and button                                                             |

`visibility` on the card itself stays Home Assistant's: it hides the whole card (with conditions the cards do not know, like `view_columns`) and the cards never read it as their own.

## A condition's entity

A `state` or `numeric_state` condition without `entity` reads the part's own entity: a tile its entity, a badge its entity, a button its entity (else its tile's), a weather section the weather entity, a power flow node its sensor. A room of the power flow has no entity of its own; its conditions name one.

Lights that are on, each with its own condition: switch one off and it goes, switch it on again with the buttons above.

::: live

```yaml
type: custom:tile-group-card-pro
title: Lights on
icon: mdi:lightbulb-on
tiles:
  - name: Switch
    icon: mdi:gesture-tap-button
    control:
      type: buttons
      options:
        - { entity: light.living_room, icon: mdi:sofa }
        - { entity: light.office, icon: mdi:desk }
        - { entity: light.desk_lamp, icon: mdi:desk-lamp }
        - { entity: light.dining_table, icon: mdi:table-chair }
  - entity: light.living_room
    visibility: [{ condition: state, state: "on" }]
  - entity: light.office
    visibility: [{ condition: state, state: "on" }]
  - entity: light.desk_lamp
    visibility: [{ condition: state, state: "on" }]
  - entity: light.dining_table
    visibility: [{ condition: state, state: "on" }]
```

:::

## Conditions

| Condition       | Keys                                          | Holds while                                                                                                                                     |
| --------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `state`         | `entity`, `attribute`, `state` or `state_not` | the state (or the attribute) is one of `state`, or none of `state_not`; a list is any of them                                                   |
| `numeric_state` | `entity`, `attribute`, `above`, `below`       | the number is strictly above `above` and strictly below `below`; a bound may be an entity id                                                    |
| `screen`        | `media_query`                                 | the media query matches the browser window, e.g. `"(min-width: 768px)"`                                                                         |
| `user`          | `users`                                       | the logged-in user is one of these user ids                                                                                                     |
| `location`      | `locations`                                   | the logged-in user's person is in one of these zones (`home`, `not_home`, a zone's name)                                                        |
| `time`          | `after`, `before`, `weekdays`                 | the time of day is in the window (both ends included; `before` earlier than `after` runs over midnight), on the weekdays listed (`mon` … `sun`) |
| `template`      | `value_template`                              | the template renders true (`true`, `yes`, `on`, `enable`, `1` or a number other than 0)                                                         |
| `and`           | `conditions`                                  | all of them hold                                                                                                                                |
| `or`            | `conditions`                                  | one of them holds                                                                                                                               |
| `not`           | `conditions`                                  | not all of them hold                                                                                                                            |

A list of conditions holds when all of them do. `enabled: false` switches a condition off; `entity_id` works for `entity` (one id, or a list that must all match). A missing entity reads as `unknown`, a state that is not a number never matches `numeric_state`, and a template counts as false until Home Assistant has rendered it, so nothing flashes up while the dashboard loads.

Two differences from the cards' own [rules](/cards/tile-custom#colour-and-rules) are Home Assistant's: `numeric_state` compares strictly (`above: 20` does not hold at 20, a rule's `above: 20` does), and `not` is true when any one of its conditions fails.

## What moves up

A hidden part takes no room, and the card is laid out without it:

- a hidden tile leaves its group, a hidden badge its row, a hidden card its layout card or swipe card;
- a power flow room whose devices are all hidden goes with them;
- a hidden tile never tints the card;
- a header without title, icon or a shown badge goes, and a card with nothing left shows nothing: a tile group whose tiles are all hidden, a layout card whose cards are. In a sections view it keeps its place in the grid (Home Assistant sizes the cell); the card's own `visibility` removes it from the grid.

The parts of a room follow the window here: the sensors only on a wide screen, the speaker while the music is on.

::: live

```yaml
type: custom:layout-card-pro
card_style: seamless
cards:
  - type: custom:tile-group-card-pro
    title: Living room
    icon: mdi:sofa
    layout: row
    tiles: [light.living_room, cover.living_room_blinds, climate.living_room]
  - type: custom:tile-group-card-pro
    visibility: [{ condition: screen, media_query: "(min-width: 900px)" }]
    tiles: [sensor.living_room_temperature, sensor.living_room_humidity]
  - type: custom:tile-card-pro
    entity: media_player.living_room_speaker
    visibility: [{ condition: state, entity: media_player.living_room_speaker, state_not: "off" }]
```

:::

## Buttons

Each of [your own buttons](/cards/tile-controls#your-own-buttons) takes conditions too; the others keep their place. One button switches the lights on, the other one off, whichever fits now:

::: live

```yaml
type: custom:tile-card-pro
name: Living room
icon: mdi:sofa
control:
  type: buttons
  options:
    - entity: light.living_room
      label: Lights on
      icon: mdi:lightbulb-on
      visibility: [{ condition: state, state: "off" }]
    - entity: light.living_room
      label: Lights off
      icon: mdi:lightbulb-off
      visibility: [{ condition: state, state: "on" }]
    - { entity: cover.living_room_blinds, label: Blinds }
```

:::

## Weather sections

Any section of the [weather card](/cards/weather-card) takes conditions; without an entity they read the weather entity. The hourly trend shows on wide screens only, the details while it is not sunny:

::: live

```yaml
type: custom:weather-card-pro
entity: weather.home
sections:
  - type: hero
  - type: row
    divider: true
    visibility: [{ condition: state, state_not: sunny }]
    entities: [humidity, wind_speed, pressure]
  - type: trend
    mode: hourly
    divider: true
    visibility: [{ condition: screen, media_query: "(min-width: 700px)" }]
```

:::

## Power flow

The [power flow card](/cards/power-flow-card#visibility) hides sources, consumers, rooms and devices; `hide_consumers_below` hides the consumers that draw almost nothing. What a hidden consumer draws counts in **Other**, so the numbers still add up. The tree is drawn without the hidden nodes and its height follows: the card grows and shrinks with them.

## Multi trend series

A series of the [multi trend card](/cards/multi-trend-card) with conditions leaves the plot, the legend and the header values while they fail; the others keep their colours. The history of every series is kept, so a series that comes back has its line at once.

::: live

```yaml
type: custom:multi-trend-card-pro
title: Temperatures
entities:
  - { entity: sensor.living_room_temperature, name: Living room }
  - entity: sensor.bedroom_temperature
    name: Bedroom
    visibility: [{ condition: state, entity: input_boolean.guest_mode, state: "on" }]
  - { entity: sensor.outdoor_temperature, name: Outside }
```

:::

## In the examples

The examples on this site log in as Malte (user id `demo-malte`, `person.malte`), so `user` and `location` conditions work with those. Templates evaluate <code v-pre>{{ }}</code> expressions only; Home Assistant itself renders <code v-pre>{% %}</code> blocks too.
