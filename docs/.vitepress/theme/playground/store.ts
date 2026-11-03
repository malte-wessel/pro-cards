// The Playground's memory: the card being edited (the draft, kept as you type), the cards saved
// under a name, both in the browser's localStorage, and share links that carry a card in the URL
// (`#c=`: the YAML deflated, base64url). Every storage access survives a browser that refuses it.
import { decodeEdit } from "../editable.ts";

export interface Draft {
  name: string;
  yaml: string;
  // the saved card it was opened from (none: not saved)
  id?: string;
}
export interface Saved extends Draft {
  id: string;
  updated: number;
}

const DRAFT = "pro-cards:playground:draft";
const SAVED = "pro-cards:playground:saved";
// a store that is there, or none (a private window, blocked site data)
const storage = (): Storage | null => {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
};
const read = <T>(key: string, valid: (v: unknown) => v is T): T | null => {
  try {
    const raw = storage()?.getItem(key);
    const v: unknown = raw ? JSON.parse(raw) : null;
    return valid(v) ? v : null;
  } catch {
    return null;
  }
};
const write = (key: string, v: unknown) => {
  try {
    storage()?.setItem(key, JSON.stringify(v));
  } catch {
    // full or refused: the Playground keeps working, unsaved
  }
};

const isDraft = (v: unknown): v is Draft =>
  !!v && typeof v === "object" && typeof (v as Draft).yaml === "string";
const isSaved = (v: unknown): v is Saved =>
  isDraft(v) && typeof (v as Saved).id === "string" && typeof (v as Saved).name === "string";

export const loadDraft = (): Draft | null => {
  const d = read(DRAFT, isDraft);
  if (!d) return null;
  return {
    name: typeof d.name === "string" ? d.name : "",
    yaml: d.yaml,
    ...(typeof d.id === "string" ? { id: d.id } : {}),
  };
};
export const saveDraft = (d: Draft) => write(DRAFT, d);

export const listSaved = (): Saved[] => {
  const list = read(SAVED, (v): v is unknown[] => Array.isArray(v)) ?? [];
  return list.filter(isSaved).sort((a, b) => b.updated - a.updated);
};
// a card saved: the saved card it came from updated (its new name too), else a new one
export const putSaved = (d: Draft, now = Date.now()): Saved => {
  const list = listSaved();
  const old = d.id ? list.find((s) => s.id === d.id) : undefined;
  const entry: Saved = {
    id: old?.id ?? `s${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name: d.name,
    yaml: d.yaml,
    updated: now,
  };
  write(SAVED, [entry, ...list.filter((s) => s.id !== entry.id)]);
  return entry;
};
export const renameSaved = (id: string, name: string) =>
  write(
    SAVED,
    listSaved().map((s) => (s.id === id ? { ...s, name } : s)),
  );
export const deleteSaved = (id: string) =>
  write(
    SAVED,
    listSaved().filter((s) => s.id !== id),
  );

// a card that would be lost if another replaced it: text that is not an example (`known`) and not
// as it was saved
export const isUnsaved = (d: Draft, known: readonly string[]): boolean => {
  const yaml = d.yaml.trim();
  if (!yaml || known.some((k) => k.trim() === yaml)) return false;
  const was = d.id ? listSaved().find((s) => s.id === d.id) : undefined;
  return !was || was.yaml.trim() !== yaml;
};
// such a card kept among the saved ones before another replaces it: its name marked, the saved
// card it came from left as it was
export const keepUnsaved = (d: Draft, fallback: string, now = Date.now()): Saved =>
  putSaved({ name: `${d.name.trim() || fallback} (unsaved)`, yaml: d.yaml }, now);

// ----- share links -----

const toB64url = (bytes: Uint8Array) => {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const fromB64url = (s: string) => {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
};
const through = async (bytes: Uint8Array, stream: CompressionStream | DecompressionStream) => {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
};

// a card as the hash of a share link: its name and YAML, deflated
export const encodeShare = async (d: Draft): Promise<string> => {
  const json = new TextEncoder().encode(JSON.stringify({ n: d.name, y: d.yaml }));
  return `#c=${toB64url(await through(json, new CompressionStream("deflate-raw")))}`;
};
// the card a hash carries: a share link's, or an example's Edit link (`#edit=`, plain base64)
export const decodeShare = async (hash: string): Promise<Draft | null> => {
  const m = /^#c=([A-Za-z0-9_-]+)$/.exec(hash);
  if (m) {
    try {
      const json = new TextDecoder().decode(
        await through(fromB64url(m[1]), new DecompressionStream("deflate-raw")),
      );
      const v = JSON.parse(json) as { n?: unknown; y?: unknown };
      return typeof v.y === "string"
        ? { name: typeof v.n === "string" ? v.n : "", yaml: v.y }
        : null;
    } catch {
      return null;
    }
  }
  const yaml = decodeEdit(hash);
  return yaml === null ? null : { name: "", yaml };
};

// ----- the entities a config names -----

// every string that is an entity id of `known`, in the order the config names them (a layout's
// cards, badges, inputs, series, buttons …)
export const entitiesOf = (cfg: unknown, known: (id: string) => boolean): string[] => {
  const out = new Set<string>();
  const walk = (v: unknown) => {
    if (typeof v === "string") {
      if (/^[a-z_]+\.[a-z0-9_]+$/.test(v) && known(v)) out.add(v);
    } else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(cfg);
  return [...out];
};
