// The cards' own strings in the user's language. Home Assistant tells the language through
// hass.locale.language; a language the bundle lacks, or a key a language lacks, shows English.
// Adding a language: one file in src/i18n/ and one entry in LANGUAGES.
import de from "../i18n/de.ts";
import en, { type StringKey, type Translation } from "../i18n/en.ts";
import { langOf } from "./format.ts";
import type { HomeAssistant } from "./ha.ts";

export type { StringKey, Translation };

export const LANGUAGES: Record<string, Translation> = { en, de };

// the table of a language tag: the full tag ("pt-br"), then its base language ("pt"), then English
export const stringsFor = (hass: HomeAssistant | null | undefined): Translation => {
  const tag = langOf(hass).toLowerCase();
  return LANGUAGES[tag] ?? LANGUAGES[tag.split("-")[0]] ?? en;
};

// the text of `key` for the user's language, with `{name}` placeholders filled from `vars`
export const t = (
  hass: HomeAssistant | null | undefined,
  key: StringKey,
  vars?: Record<string, string | number>,
): string => {
  let s: string = stringsFor(hass)[key] ?? en[key];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
};
