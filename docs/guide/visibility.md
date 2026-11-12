# Visibility

Home Assistant shows or hides a whole card with `visibility`. The cards take the same key on their parts, such as a tile in a tile group or a badge. A part is drawn only while all its conditions hold. The conditions are Home Assistant's, so a condition copied from its card editor works here too.

Tap the Guests icon to switch guest mode on and off: the bedroom's tiles come and go.

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

| Card                                                     | Parts with `visibility`                                                   |
| -------------------------------------------------------- | ------------------------------------------------------------------------- |
| [Tile group](/cards/tile-group-card)                     | every tile, every badge in the header                                     |
| [Tile](/cards/tile-card), [poster](/cards/poster-card)   | every [badge](/cards/badges), each of [your own buttons](/cards/controls) |
| [Heading](/cards/heading-card)                           | every badge                                                               |
| [Layout](/cards/layout-card), [swipe](/cards/swipe-card) | every card inside, by its own `visibility`                                |
| [Weather](/cards/weather-card)                           | every section, the entities of a section, the header's badges             |
| [Power flow](/cards/power-flow-card)                     | sources, consumers, rooms and their devices, the header's badges          |
| [Multi trend](/cards/multi-trend-card)                   | every series                                                              |

`visibility` on the card itself stays Home Assistant's: it hides the whole card, also with conditions the cards do not know, such as `view_columns`. The [deprecated cards](/guide/migrating) take it on their entities, sections and buttons too.

## A condition's entity

A `state` or `numeric_state` condition without `entity` reads the part's own entity: a tile's, a badge's, a button's (else its tile's). A weather section reads the weather entity, a power flow node its sensor. A power flow room has no entity of its own, so its conditions name one.

Here each light shows only while it is on. Switch them with the buttons in the first tile.

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

A list of conditions holds when all of them do. `enabled: false` switches a condition off. A missing entity reads as `unknown`. A template counts as false until Home Assistant has rendered it, so nothing flashes up while the dashboard loads.

Unlike the cards' own [rules](/cards/look), `numeric_state` compares strictly: `above: 20` does not hold at 20.

## What moves up

A hidden part takes no room; the card is laid out without it. A hidden tile leaves its group, a hidden badge its row, a hidden card its layout or swipe card. A header with no title, icon or shown badge goes. A card with nothing left shows nothing, but in a sections view it keeps its place in the grid; only the card's own `visibility` removes it from there.

Here the room's sensors show only on a wide screen, the speaker only while it is not off.

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

The [power flow card](/cards/power-flow-card) draws its tree without the hidden nodes, and its height follows. A room whose devices are all hidden goes too. A hidden consumer's power counts in **Other**, so the numbers still add up. A hidden series of the [multi trend card](/cards/multi-trend-card) leaves the plot, the legend and the header; the others keep their colours.

## Weather sections

Any section of the [weather card](/cards/weather-card) takes conditions. Here the hourly forecast shows while it is not sunny, the hourly trend on wide screens only.

::: live

```yaml
type: custom:weather-card-pro
entity: weather.home
sections:
  - type: hero
  - type: forecast
    mode: hourly
    layout: horizontal
    hours: 6
    divider: true
    visibility: [{ condition: state, state_not: sunny }]
  - type: trend
    mode: hourly
    divider: true
    visibility: [{ condition: screen, media_query: "(min-width: 700px)" }]
```

:::

## In the examples

The examples on this site log in as Malte (user id `demo-malte`, `person.malte`), so `user` and `location` conditions work with those. Templates here evaluate <code v-pre>{{ }}</code> expressions only; Home Assistant itself renders <code v-pre>{% %}</code> blocks too.
