// The container cards' editors (pure): their options as the form's data and back. Tracks and
// lengths are text in the form ("1fr 2fr", "8 16"), numbers where they are one; `breakpoints`
// is a list of "from N view columns" items. An option the form leaves as the config had it keeps
// its spelling as written.
import type { CardConfigBase, HaFormData } from "../ha.ts";

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => !!v && typeof v === "object" && !Array.isArray(v);

// how an option shows in the form and goes back: text for tracks and lengths, as is else
export interface Conv {
  toForm(v: unknown): unknown;
  fromForm(v: unknown): unknown;
}
const numeric = (s: string): string | number => (/^-?\d+(\.\d+)?$/.test(s) ? Number(s) : s);
// the text's words, split at the spaces outside parentheses: a CSS function is one word
// ("minmax(200px, 1fr)", "calc(8px + 1vw)")
const words = (v: unknown): string[] => {
  if (typeof v !== "string") return [];
  const out: string[] = [];
  let word = "";
  let depth = 0;
  for (const ch of v) {
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    if (depth === 0 && /\s/.test(ch)) {
      if (word) out.push(word);
      word = "";
    } else word += ch;
  }
  if (word) out.push(word);
  return out;
};
// a count, or column tracks ("1fr 2fr")
export const TRACKS: Conv = {
  toForm: (v) => (Array.isArray(v) ? v.join(" ") : v === undefined ? "" : String(v)),
  fromForm: (v) => {
    const w = words(v);
    if (!w.length) return undefined;
    return w.length === 1 && /^\d+$/.test(w[0]) ? Number(w[0]) : w;
  },
};
// row tracks ("auto 1fr")
export const ROWS: Conv = {
  toForm: (v) => (Array.isArray(v) ? v.join(" ") : v === undefined || v === null ? "" : String(v)),
  fromForm: (v) => (words(v).length ? words(v) : undefined),
};
// a length, or [row, column]
export const LENGTHS: Conv = {
  toForm: (v) => (Array.isArray(v) ? v.join(" ") : v === undefined || v === null ? "" : String(v)),
  fromForm: (v) => {
    const w = words(v).map(numeric);
    return !w.length ? undefined : w.length === 1 ? w[0] : w;
  },
};
const AS_IS: Conv = {
  toForm: (v) => v,
  fromForm: (v) => (v === "" || v === null ? undefined : v),
};

// the options of one level (the card, or a breakpoint) → form data, by `convs`
const levelToForm = (o: Raw, convs: Record<string, Conv>): Raw => {
  const d: Raw = {};
  for (const [k, c] of Object.entries(convs)) d[k] = c.toForm(o[k]);
  return d;
};

export const optionsToForm = (
  config: CardConfigBase,
  convs: Record<string, Conv>,
  defaults: Raw = {},
): HaFormData => {
  const c = config as Raw;
  // the card's own level shows its defaults (a breakpoint's empty field inherits instead)
  const d: HaFormData = { ...defaults, ...levelToForm(c, convs) };
  for (const [k, v] of Object.entries(defaults)) if (d[k] === undefined || d[k] === "") d[k] = v;
  const bps = isObj(c.breakpoints) ? c.breakpoints : {};
  d.breakpoints = Object.entries(bps).map(([at, o]) => {
    const item: Raw = { at: Number(at), ...levelToForm(isObj(o) ? o : {}, convs) };
    const more: Raw = {};
    // keys without a field, and `null` (back to the default here), which no field can say
    if (isObj(o))
      for (const [k, v] of Object.entries(o)) if (!(k in convs) || v === null) more[k] = v;
    if (Object.keys(more).length) item.more = more;
    // a list item has no empty fields
    for (const k of Object.keys(item)) if (item[k] === "" || item[k] === undefined) delete item[k];
    return item;
  });
  return d;
};

export const optionsFromForm = (
  data: HaFormData,
  prev: CardConfigBase,
  convs: Record<string, Conv>,
  defaults: Raw = {},
): CardConfigBase => {
  const c: Raw = { ...prev };
  const before = optionsToForm(prev, convs, defaults);
  const same = (k: string) => JSON.stringify(before[k] ?? "") === JSON.stringify(data[k] ?? "");
  const put = (k: string, v: unknown) => {
    if (v === undefined) delete c[k];
    else c[k] = v;
  };
  for (const [k, conv] of Object.entries(convs))
    if (!same(k)) put(k, data[k] === defaults[k] ? undefined : conv.fromForm(data[k]));
  if (!same("breakpoints")) {
    const out: Raw = {};
    // a breakpoint the form leaves as it showed it keeps its spelling (another one edited)
    const written = isObj((prev as Raw).breakpoints) ? ((prev as Raw).breakpoints as Raw) : {};
    const shown = new Map(
      (before.breakpoints as Raw[]).map((item) => [item.at, JSON.stringify(item)]),
    );
    for (const item of Array.isArray(data.breakpoints) ? (data.breakpoints as Raw[]) : []) {
      const at = Number(item.at);
      if (!Number.isInteger(at) || at < 2) continue;
      if (shown.get(at) === JSON.stringify(item) && String(at) in written) {
        out[at] = written[at];
        continue;
      }
      const o: Raw = isObj(item.more) ? { ...item.more } : {};
      for (const [k, conv] of Object.entries(convs)) {
        const v = conv.fromForm(item[k]);
        if (v !== undefined) o[k] = v;
      }
      out[at] = o;
    }
    put("breakpoints", Object.keys(out).length ? out : undefined);
  }
  return c as CardConfigBase;
};

export { AS_IS };
