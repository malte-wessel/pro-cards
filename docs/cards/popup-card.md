# Pop-up

`custom:popup-card-pro` puts cards in a pop-up that opens with a tap. On a phone it is a sheet from the bottom that you drag down to close; on a wide screen it is a dialog in the middle. While closed it takes no room on the dashboard. Use it for a room's lights and climate behind one tile, or for the controls you need now and then.

The pop-up opens when the address ends in its `hash`. Any card opens it with a navigate action, Home Assistant's own cards too:

```yaml
tap_action:
  action: navigate
  navigation_path: "#living-room"
```

## A room behind a tile

Tap the tile to open the pop-up. Close it with ✕, Esc, a tap beside it, the back button, or, on a phone, by dragging it down.

::: live width=400

```yaml
type: custom:layout-card-pro
cards:
  - type: custom:tile-card-pro
    entity: light.living_room
    name: Living room
    tap_action:
      action: navigate
      navigation_path: "#living-room"
  - type: custom:popup-card-pro
    hash: living-room
    title: Living room
    icon: mdi:sofa
    badges:
      - sensor.living_room_temperature
    cards:
      - type: custom:tile-card-pro
        entity: light.living_room
      - type: custom:tile-card-pro
        entity: fan.living_room
      - type: custom:tile-card-pro
        entity: climate.living_room
        grid_options: { columns: 12 }
      - type: custom:tile-card-pro
        entity: media_player.living_room_speaker
        grid_options: { columns: 12 }
```

:::

Put the pop-up anywhere on the view, at the end of a section, say. It only opens on the view it is on: for a pop-up on every view, put one on each.

## The cards

The cards sit in Home Assistant's section grid, 12 columns wide: each spans what it asks for there, so two tiles share a line and a heading takes all of it. `grid_options` on a card changes it, as in a section. Each card keeps its own `visibility`.

The cards are made with the dashboard, so they open at once, but they only listen to Home Assistant while the pop-up is open.

## The header

`title`, `subtitle`, `icon` and `badges` make the pop-up's header, a [heading](/cards/heading-card) with its badges, as on the heading card. Leave them all out for a pop-up with only the close button above its cards.

## On a phone

Below 600 px wide the pop-up is a sheet from the bottom, as tall as its cards. Drag it up and it grows to the full height, a gap below the top of the screen as Home Assistant's own dialogs leave; drag it down and it goes back to its cards' height. Let go past halfway, or flick it, and it settles at the other height.

Dragged further down, it closes: let go past a third of the way, or flick it down. Else it springs back. In the companion app you feel a tick where letting go would close it.

Drag it by its handle or its header. From the cards, pulling down once they are scrolled to the top drags the sheet too, and so does pushing up while it can still grow. A sideways drag stays with the cards, so sliders keep working, and a card you start a drag on is not tapped.

## Size

`height: full` opens the pop-up at the full height, whatever its cards need; it can still be dragged down to their height. The default, `auto`, opens it as tall as its cards. On a wide screen `full` makes the dialog as tall as it may be.

On a wide screen `width` says how wide the dialog is: `normal` (560 px at most), `wide` (1024 px at most) or `full` (the window's width, less a margin; with `height: full` its height too).

## Opening and closing

Closing the pop-up takes the hash off the address. When a navigate action opened it, closing goes back, as the back button does; a link to the page with the hash (`/dashboard-home/0#living-room`) opens it straight away.

Two pop-ups never show at once: navigating to another one's hash closes the first, and closing that one goes back to the first.

The pop-up's `visibility` decides whether it opens: while its conditions do not hold, its hash opens nothing. So one hash can open a pop-up for the phone and another for the wall tablet (a `screen` condition each), or a pop-up only for some users.

## In edit mode

While you edit the dashboard, the pop-up shows on it as a card, with its header and cards, so you can find it and see your changes. Open shows it as a pop-up. In the card's editor the preview is that card, without Open.

## The visual editor

The editor has the pop-up's hash, width and height, title, subtitle, icon and badges, then a tab per card with the card's own editor, as in Home Assistant's stacks. "+" adds a card.

## Reference

### Card options

| Option     | Default  | Description                                                                                           |
| ---------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `hash`     | –        | Required. Opens the pop-up on `#<hash>`: letters, digits, `-` and `_`.                                |
| `title`    | –        | The header's title. Template allowed.                                                                 |
| `subtitle` | –        | The line under the title. Template allowed.                                                           |
| `icon`     | –        | The icon before the title.                                                                            |
| `badges`   | –        | The header's [badges](/cards/badges), as on the [heading card](/cards/heading-card).                  |
| `width`    | `normal` | On a wide screen: `normal`, `wide` or `full`. A phone always shows the sheet across its width.        |
| `height`   | `auto`   | `auto`: as tall as its cards (a sheet can be dragged up to the full height); `full`: the full height. |
| `cards`    | `[]`     | The cards, in Home Assistant's section grid.                                                          |

### Grid and Home Assistant options

The pop-up takes no room on the dashboard while closed; in edit mode it takes the full width of its section.

| Key            | Default | Description                                                                    |
| -------------- | ------- | ------------------------------------------------------------------------------ |
| `visibility`   | –       | Home Assistant's conditions: while they do not hold, the pop-up does not open. |
| `grid_options` | –       | Its size in edit mode, where it shows as a card: `columns`, `rows`.            |
| `view_layout`  | –       | Placement in a [layout card](/cards/layout-card) or a custom view.             |
| `card_mod`     | –       | Styles for the card-mod plugin.                                                |
| `uix`          | –       | Styles for the UIX plugin.                                                     |
