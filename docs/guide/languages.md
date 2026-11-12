# Languages

The cards show their own words in the language of your Home Assistant profile (**Settings → Profile → Language**). There is nothing to set up, and they switch at once when you change it.

## Available languages

| Language         | Code |
| ---------------- | ---- |
| English          | `en` |
| Czech            | `cs` |
| German           | `de` |
| Spanish          | `es` |
| French           | `fr` |
| Italian          | `it` |
| Norwegian Bokmål | `nb` |
| Dutch            | `nl` |
| Polish           | `pl` |
| Portuguese       | `pt` |
| Russian          | `ru` |
| Swedish          | `sv` |

Any other language shows English. A regional variant such as `de-AT` or `pt-BR` uses its base language.

## What is translated

Every word the cards bring themselves:

- the [kinds'](/cards/kinds) words on a tile, a poster and a badge: a light's On, a thermostat's Heating, a battery's Low, the air's Good … Hazardous, the wind's Calm … Storm and its compass points, a person's zone;
- the weather card's conditions, attribute names and section titles; the power flow's node names (Home, Solar, Grid …) and states; the sun cards' events and directions;
- the words of the [controls](/cards/controls), and what a screen reader reads out for them;
- placeholders and messages such as `no data`, `loading …` and `unavailable`;
- every label, option and help text of the visual editors.

An entity's value is formatted by Home Assistant, as your profile sets it; the numbers, dates and times the cards work out themselves follow the same language.

## What stays as written

Your own words are never translated: `title`, `name`, a rule's `status`, a badge rule's `value`, and labels you give a card such as the sun path card's `labels`. They replace the defaults in every language.

Units (`h`, `min`, `lx`, `°`), the names in the card picker and the messages for an invalid configuration are the same in every language. A compass point in a direction sensor's state is read in English, as Home Assistant's integrations report it. A card added from the card picker gets its `title` once, in your language at that moment, as plain text in your configuration.

The examples on this site render in English.

## Adding a language

Translations are plain TypeScript files in `src/i18n/`, one per language, keyed like the English source `src/i18n/en.ts`. To add one:

1. Copy `src/i18n/de.ts` to `src/i18n/<code>.ts` and translate every value. Keep the `{placeholders}`.
2. Register it in `src/shared/i18n.ts`: add the file to `LANGUAGES` under its language code (lower case, as in `hass.locale.language`).
3. Run `npm run check`; the i18n unit test checks that the file has every key of the English table, no empty value and every placeholder.
