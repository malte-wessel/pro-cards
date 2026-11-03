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
const words = (v: unknown) => (typeof v === "string" ? v.trim().split(/\s+/).filter(Boolean) : []);
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
    if (isObj(o)) for (const [k, v] of Object.entries(o)) if (!(k in convs)) more[k] = v;
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
    for (const item of Array.isArray(data.breakpoints) ? (data.breakpoints as Raw[]) : []) {
      const at = Number(item.at);
      if (!Number.isInteger(at) || at < 2) continue;
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
