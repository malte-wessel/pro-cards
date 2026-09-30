# Languages

The cards show their own words in the language of your Home Assistant profile (**Settings → Profile → Language**). Nothing to configure: the cards read the frontend language that Home Assistant hands to every card, and they switch at once when you change it. Numbers and times were always formatted for that language; this page is about the words.

## What is translated

- The default labels of the sun path card (Sunrise, Sunset, Dawn, Solar noon, Dusk) and the word in its tooltip (elevation).
- The default zone names of the illuminance card (Night, Twilight, Overcast, Day, Sun), the `Max` of its header line and the `LUX` under the gauge value.
- The axis word `now`, the placeholders `no data` and `loading …`, the tooltip marker `Peak` of the columns visual, the `unavailable` label and the `… not found` message of a missing entity.
- Every label, option and helper of the three visual editors.

Everything you write yourself stays as written: `title`, `name`, rule `label`, `labels` of the sun path card and `zones` of the illuminance card override the defaults in any language. Units (`h`, `min`, `lx`, `°`) and the entries in the card picker are the same in every language, as are the messages for an invalid configuration.

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

A language the cards do not ship shows English. A regional variant such as `de-AT` or `pt-BR` uses the base language.

## Adding a language

Translations are plain TypeScript files in `src/i18n/`, one per language, keyed like the English source `src/i18n/en.ts`. To add one:

1. Copy `src/i18n/de.ts` to `src/i18n/<code>.ts` and translate the values. Keep the `{placeholders}`. A key you leave out shows the English text, so a partial file is fine.
2. Register it in `src/shared/i18n.ts`: add the file to `LANGUAGES` under its language code (lower case, as in `hass.locale.language`).
3. Run `npm run check`; the i18n unit test verifies that every key exists in the English table and that no value is empty.

The docs examples on this site render in English.
