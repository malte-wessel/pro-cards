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

- **Select:** click a block to select it, Shift-click (or Ctrl, Cmd) to add more; with a finger, tap blocks to add them. **Click a day's name** to select the whole day. Drag a box from an empty spot to select every block it touches (Shift adds them). A click or tap on an empty spot, or Escape, clears the selection.
- **Drag a block** to another time or another day. Hold **Alt** (Option) while dragging, or turn on the copy button in the toolbar, to copy it there instead.
- **Drag a handle** on a selected block's end to change its start or end; drag on up or down over other days to put the changed block on each of them too.
- **Drag a dot** above or below the selection over other days to copy there: the dot above copies the selected blocks of the selection's first day, the one below those of its last day. Dragged sideways too, it stretches them toward the drag (left: an earlier start, right: a later end), on that day and on the copies. The copies are selected with it, so the toolbar changes them together.
- **Make a block:** double-click an empty spot for an hour there, or double-click and drag to draw it, over other days too for the same block on each. With a finger, hold an empty spot, and drag on to draw. **+** in the header adds an hour to the selected block's day.
- The **toolbar** above the selection changes its value (the first `data`), copies or deletes it.

On a phone the page still scrolls over the week in edit mode: a swipe on an empty spot or a block you have not selected scrolls, a hold takes it (a hold on a block drags it). A selected block drags at once.

Times snap to 15 minutes (`snap`: 5, 10, 15, 30 or 60): a block at 06:20 moves to 06:30, then 06:45. Blocks that land on each other merge, whether you moved, copied or drew them or dragged an end into the next block, as Home Assistant keeps no overlapping blocks: the merged block keeps the data of the one you moved or copied. While the card edits, the handles and the toolbar float over the week: the card keeps its size.

::: live

```yaml
type: custom:schedule-card-pro
entity: schedule.hallway_lights
color: amber
snap: 30
```

:::

### With the keyboard

In edit mode every block is a button that names its day, its times and its data. **Enter** selects it, **←** and **→** move it to the next `snap` time (with **Shift** its end), **Escape** during a drag drops it, **↑** and **↓** move it to the day above or below (with **Alt** copy it there), a step into the next block joins the two, **Delete** removes it (or the selection), **Escape** clears the selection. **Ctrl+Z** (**Cmd+Z** on a Mac) undoes the last change, **Ctrl+A** (**Cmd+A**) selects every block.

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
