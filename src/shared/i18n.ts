// The cards' own strings in the user's language. Home Assistant tells the language through
// hass.locale.language; a language the bundle lacks, or a key a language lacks, shows English.
// Adding a language: one file in src/i18n/ and one entry in LANGUAGES.
import cs from "../i18n/cs.ts";
import de from "../i18n/de.ts";
import en, { type StringKey, type Translation } from "../i18n/en.ts";
import es from "../i18n/es.ts";
import fr from "../i18n/fr.ts";
import it from "../i18n/it.ts";
import nb from "../i18n/nb.ts";
import nl from "../i18n/nl.ts";
import pl from "../i18n/pl.ts";
import pt from "../i18n/pt.ts";
import ru from "../i18n/ru.ts";
import sv from "../i18n/sv.ts";
import { langOf } from "./format.ts";
import type { HomeAssistant } from "./ha.ts";

export type { StringKey, Translation };

export const LANGUAGES: Record<string, Translation> = {
  en,
  cs,
  de,
  es,
  fr,
  it,
  nb,
  nl,
  pl,
  pt,
  ru,
  sv,
};

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
