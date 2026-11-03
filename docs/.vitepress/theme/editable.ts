// The cards the docs' Playground edits visually, and the link that opens an example there
// (`/playground#edit=<base64 YAML>`).
import yaml from "js-yaml";
import type { CardConfigBase } from "../../../src/shared/ha.ts";

export const EDITABLE = new Set([
  "custom:tile-card-pro",
  "custom:poster-card-pro",
  "custom:layout-card-pro",
  "custom:swipe-card-pro",
]);
export const isEditable = (c: unknown) =>
  !!c && typeof c === "object" && EDITABLE.has(String((c as CardConfigBase).type));

// the YAML as a URL-safe base64 of its UTF-8, and back
export const encodeEdit = (text: string) =>
  encodeURIComponent(btoa(unescape(encodeURIComponent(text))));
export const decodeEdit = (hash: string): string | null => {
  const m = /^#edit=(.+)$/.exec(hash);
  if (!m) return null;
  try {
    return decodeURIComponent(escape(atob(decodeURIComponent(m[1]))));
  } catch {
    return null;
  }
};

// whether an example holds a card the Playground edits, top level or in a list
export const hasEditable = (doc: unknown) => (Array.isArray(doc) ? doc : [doc]).some(isEditable);

export const dumpYaml = (doc: unknown) => yaml.dump(doc, { lineWidth: -1, noRefs: true });
