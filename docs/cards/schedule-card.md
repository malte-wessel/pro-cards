# Schedule

`custom:schedule-card-pro` shows a [schedule helper](https://www.home-assistant.io/integrations/schedule/)'s week: a lane per day with its blocks, a line at now, and when the schedule changes next. Its edit mode changes the week right on the card, with a finger, a mouse or the keyboard.

## The week

`entity` is the schedule. The header names it and says when it changes next; the day of today and the block that runs are marked. A block's tooltip (hover it, or tap it on a phone) gives its times and its data.

::: live

```yaml
type: custom:schedule-card-pro
entity: schedule.heating
color: deep-orange
data:
  - { key: temperature, unit: °C, step: 0.5 }
```

:::

`name`, `icon` and `color` change the header and the blocks' colour (default: the entity's name and icon, and Home Assistant's colour of a schedule that is on). `first_weekday` starts the week on another day; by default it follows your profile.

## Block data

Home Assistant keeps data with every block of a schedule (a temperature, a duration, a scene), set in the helper's settings, and shows it as the entity's attributes while the block runs. `data` names what the card shows: a key, or `{ key, unit, step, min, max, default }`. The first one is the value edit mode changes, by its `step` between `min` and `max`; a new block starts with its `default`.

::: live

```yaml
type: custom:schedule-card-pro
entity: schedule.garden_watering
color: teal
data:
  - { key: duration, unit: min, step: 5, min: 5, max: 60, default: 20 }
```

:::

## Editing on the card

The pencil in the header, or a long press on the week, turns edit mode on. Every change stays on the card until **Done**, which saves the whole week in one go; **Undo** steps back before that. Where the schedule was changed elsewhere meanwhile, Done says so and saves nothing; a second Done saves your week over it.

- **Tap a block** to select it, tap more to change them together; **tap a day's name** to select the whole day. The cross on the count in the header clears the selection.
- **Drag a block** to another time or another day. The copy button in the toolbar copies it there instead.
- **Drag a handle** on a selected block's end to change its start or end.
- **Drag the dot** under a day's selection up or down over other days to copy it to all of them. The copies are selected with it, so the toolbar changes them together.
- **Drag across an empty spot** to draw a new block, and on over other days to draw the same block on each of them; a tap there makes one of an hour. **+** in the header adds an hour to the selected block's day.
- The **toolbar** above the selection changes its value (the first `data`), copies or deletes it.

Times snap to 15 minutes (`snap`: 5, 10, 15, 30 or 60). Blocks that land on each other merge, whether you moved, copied or drew them or dragged an end into the next block, as Home Assistant keeps no overlapping blocks: the merged block keeps the data of the one you moved or copied. While the card edits, the handles and the toolbar float over the week: the card keeps its size.

::: live

```yaml
type: custom:schedule-card-pro
entity: schedule.hallway_lights
color: amber
snap: 30
```

:::

### With the keyboard

In edit mode every block is a button that names its day, its times and its data. **Enter** selects it, **←** and **→** move it by `snap` (with **Shift** its end), **↑** and **↓** move it to the day above or below, a step into the next block joins the two, **Delete** removes it, **Escape** clears the selection.

### Who can edit

Saving uses the helper's own settings, as Home Assistant's helper dialog does: only an **administrator** can, and only a schedule **made in the UI** (one set in YAML has none to save). For anyone else, and for a schedule set in YAML, the card shows the week without the pencil. `edit: false` turns edit mode off for everyone.

::: live

```yaml
type: custom:schedule-card-pro
entity: schedule.office_hours
```

:::

## On a poster or a tile

A poster or a tile of a schedule draws it as the [schedule kind](/cards/kinds#schedule): on or off, when it changes next with its data, how soon on a poster's corner, and the day's lane below the value. `visual: { variant: ahead }` shows the next 24 hours, `edge` a ribbon along the card's bottom edge.

::: live

```yaml
- type: custom:poster-card-pro
  entity: schedule.heating
  color: deep-orange
  data: [{ key: temperature, unit: °C }]
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: schedule.garden_watering
  color: teal
  data: [{ key: duration, unit: min }]
  visual: { variant: ahead }
  grid_options: { columns: 6 }
```

:::

## The visual editor

Home Assistant's card editor has every option: the schedule, its name, icon and colour, the block data (its first key), editing, the minutes times snap to and the week's first day. Try it in the [Playground](/playground), or with **Edit** under any example.

## Reference

### Card options

| Key                | Default               | Description                                                                                                   |
| ------------------ | --------------------- | ------------------------------------------------------------------------------------------------------------- |
| `entity`           | –                     | The schedule helper (`schedule.…`). Required.                                                                 |
| `name`             | the entity's          | The header's title. Template allowed.                                                                         |
| `icon`             | the entity's          | The header's icon.                                                                                            |
| `color`            | a schedule that is on | The blocks' colour: a colour name or any CSS colour.                                                          |
| `data`             | –                     | The block data shown: keys, or `{ key, unit, step, min, max, default }`. Edit mode changes the first one.     |
| `edit`             | `true`                | The pencil and a long press turn edit mode on (administrators, schedules made in the UI); `false`: view only. |
| `snap`             | `15`                  | The minutes times snap to while editing: `5`, `10`, `15`, `30` or `60`.                                       |
| `first_weekday`    | your profile's        | The first day shown: `monday` … `sunday`.                                                                     |
| `title_tap_action` | `none`                | What a tap on the title does.                                                                                 |

### Grid and Home Assistant options

The card takes the full width of a section and sizes its height to its content (`rows: auto`); it goes down to 6 columns, where the days are written with one letter. See [Sizing in sections](/guide/sizing).

The card also takes Home Assistant's `grid_options`, `visibility`, `view_layout`, `card_mod` and `uix`, plus `fill_height`.
