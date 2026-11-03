// The Playground's YAML against the cards' JSON Schemas (pure): what the schema allows where the
// cursor is (the keys of the object it is in, the values a key takes: an enum, true / false, the
// demo home's entities), and the schema's errors with their place in the text. The YAML is read
// by its lines (block style, as the examples write it; a flow `{ … }` is one line): a path is the
// keys and list indexes from the document's top to a value, a list of cards starting with an index.
export type Path = (string | number)[];
type Schema = Record<string, unknown>;

const BASE = "https://malte-wessel.github.io/pro-cards/schema/";
const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

// ----- the schemas, by their $id, and the schema a $ref points to -----

export interface Schemas {
  byId: Map<string, Schema>;
}
export const schemasOf = (files: readonly Schema[]): Schemas => ({
  byId: new Map(files.map((f) => [String(f.$id), f])),
});
// a schema with the $id it lives in (a $ref is relative to it)
interface At {
  schema: Schema;
  base: string;
}
const pointer = (root: Schema, ptr: string): Schema | undefined => {
  let cur: unknown = root;
  for (const part of ptr.split("/").filter(Boolean)) {
    const k = decodeURIComponent(part).replace(/~1/g, "/").replace(/~0/g, "~");
    cur = isObj(cur) || Array.isArray(cur) ? (cur as Record<string, unknown>)[k] : undefined;
  }
  return isObj(cur) ? cur : undefined;
};
const follow = (s: Schemas, at: At): At | undefined => {
  const ref = at.schema.$ref;
  if (typeof ref !== "string") return at;
  const [file, ptr = ""] = ref.split("#");
  const id = file ? new URL(file, at.base).href : at.base;
  const root = s.byId.get(id);
  const schema = root && pointer(root, ptr);
  return schema ? { schema, base: id } : undefined;
};
// an entity id (defs.schema.json's entityId): the demo home's entities fit it
const ENTITY_PATTERN = "^[a-z_]+\\.[a-z0-9_]+$";

// what a value must match all at once: its $ref followed, allOf flattened, the branches of a
// oneOf / anyOf that fit its type, an if / then by the `if`'s consts (a card's `type`)
const expand = (s: Schemas, at: At, value: unknown, out: At[] = [], depth = 0): At[] => {
  if (depth > 24) return out;
  const f = follow(s, at);
  if (!f) return out;
  out.push(f);
  const { schema, base } = f;
  // a $ref to a $ref (a tile's `entity` to the entity cards' to the entity id): followed on
  if (typeof schema.$ref === "string") return expand(s, f, value, out, depth + 1);
  const sub = (x: unknown) =>
    isObj(x) ? expand(s, { schema: x, base }, value, out, depth + 1) : out;
  for (const x of (schema.allOf as unknown[]) ?? []) sub(x);
  for (const k of ["oneOf", "anyOf"] as const)
    for (const x of (schema[k] as unknown[]) ?? [])
      if (fits(s, { schema: x as Schema, base }, value)) sub(x);
  if (isObj(schema.if)) sub(matchesIf(schema.if, value) ? schema.then : schema.else);
  return out;
};
// a branch of a oneOf / anyOf for this value: of its type (an object for an object …), not known
// otherwise
const typeOf = (v: unknown) =>
  v === null ? "null" : Array.isArray(v) ? "array" : typeof v === "number" ? "number" : typeof v;
const fits = (s: Schemas, at: At, value: unknown) => {
  const f = follow(s, at);
  if (!f || value === undefined) return true;
  const t = f.schema.type;
  if (t === undefined) return true;
  const types = Array.isArray(t) ? t : [t];
  const vt = typeOf(value);
  return types.includes(vt) || (vt === "number" && types.includes("integer"));
};
// an `if` of consts (`{ properties: { type: { const: … } } }`) against the value: true where every
// const it names is the value's
const matchesIf = (cond: Schema, value: unknown): boolean => {
  const props = isObj(cond.properties) ? cond.properties : {};
  if (!isObj(value)) return false;
  return Object.entries(props).every(([k, p]) => {
    if (!isObj(p)) return true;
    if ("const" in p) return value[k] === p.const;
    if (Array.isArray(p.enum)) return p.enum.includes(value[k]);
    return true;
  });
};

// the schemas the value at `path` follows (none known: [])
export const schemasAt = (s: Schemas, doc: unknown, path: Path): At[] => {
  // a list of cards: the path starts with the card's index
  const list = Array.isArray(doc);
  const card = list ? doc[Number(path[0])] : doc;
  const rest = list ? path.slice(1) : path;
  const type =
    isObj(card) && typeof card.type === "string" ? card.type.replace(/^custom:/, "") : "";
  const root = s.byId.get(`${BASE}${type}.schema.json`);
  if (!root) return [];
  let here: At[] = expand(s, { schema: root, base: `${BASE}${type}.schema.json` }, card);
  let value: unknown = card;
  for (const seg of rest) {
    const next: At[] = [];
    const child =
      isObj(value) || Array.isArray(value) ? (value as Record<string, unknown>)[seg] : undefined;
    for (const { schema, base } of here) {
      const add = (x: unknown) => {
        if (isObj(x)) expand(s, { schema: x, base }, child, next);
      };
      if (typeof seg === "number") {
        const prefix = schema.prefixItems as unknown[] | undefined;
        add(prefix?.[seg] ?? schema.items);
      } else {
        const props = isObj(schema.properties) ? schema.properties : {};
        if (seg in props) add(props[seg]);
        else {
          let matched = false;
          if (isObj(schema.patternProperties))
            for (const [re, x] of Object.entries(schema.patternProperties))
              if (new RegExp(re).test(seg)) {
                add(x);
                matched = true;
              }
          if (!matched) add(schema.additionalProperties);
        }
      }
    }
    here = next;
    value = child;
  }
  return here;
};

// ----- what fits where the cursor is -----

export interface Suggestion {
  label: string;
  detail?: string;
}
// the keys the object at `path` takes, less those it has
export const keysAt = (s: Schemas, doc: unknown, path: Path, has: readonly string[]) => {
  const out = new Map<string, Suggestion>();
  for (const { schema } of schemasAt(s, doc, path))
    if (isObj(schema.properties))
      for (const [k, p] of Object.entries(schema.properties)) {
        if (has.includes(k) || out.has(k) || (isObj(p) && p.not !== undefined)) continue;
        const d = isObj(p) && typeof p.description === "string" ? p.description : undefined;
        out.set(k, { label: k, ...(d ? { detail: d } : {}) });
      }
  return [...out.values()];
};
// the values the key at `path` takes: its enum or const, true and false, an entity of `entities`
export const valuesAt = (s: Schemas, doc: unknown, path: Path, entities: readonly string[]) => {
  const out = new Set<string>();
  let entity = false;
  for (const { schema } of schemasAt(s, doc, path)) {
    if (Array.isArray(schema.enum)) for (const v of schema.enum) out.add(String(v));
    if ("const" in schema) out.add(String(schema.const));
    if (schema.type === "boolean") ["true", "false"].forEach((v) => out.add(v));
    if (schema.pattern === ENTITY_PATTERN) entity = true;
  }
  if (entity) for (const e of entities) out.add(e);
  return [...out].map((label) => ({ label }));
};

// ----- the text: where a path is, and the path where the cursor is -----

interface Line {
  from: number;
  text: string;
}
const linesOf = (text: string): Line[] => {
  const out: Line[] = [];
  let from = 0;
  for (const t of text.split("\n")) {
    out.push({ from, text: t });
    from += t.length + 1;
  }
  return out;
};
// a line's indent, the columns of its list marks ("- - "), its key (`key:`) and that key's column
const KEY = /^([A-Za-z0-9_$][\w$-]*|"[^"]*"|'[^']*')\s*:(?:\s|$)/;
const parse = (t: string) => {
  const indent = t.length - t.trimStart().length;
  let col = indent;
  let rest = t.slice(indent);
  const dashes: number[] = [];
  while (/^-(\s|$)/.test(rest)) {
    const m = /^-\s*/.exec(rest)![0];
    dashes.push(col);
    col += m.length;
    rest = rest.slice(m.length);
  }
  const k = KEY.exec(rest);
  return {
    indent,
    dashes,
    key: k ? k[1].replace(/^["']|["']$/g, "") : null,
    keyCol: col,
    blank: !rest.trim() || rest.startsWith("#"),
  };
};

// the path of every key and list item written, by its line and column
interface Entry {
  path: Path;
  line: number;
  col: number;
  item: boolean;
}
const entriesOf = (lines: readonly Line[]): Entry[] => {
  const out: Entry[] = [];
  // the keys and items open above, the deepest last; the document below them all
  const stack: Entry[] = [{ path: [], line: -1, col: -1, item: false }];
  // where an entry at `col` goes: a sibling of the one at its column, or the first child of the
  // one left of it (a list may start at its key's own column)
  const place = (col: number, item: boolean): Path => {
    for (;;) {
      const top = stack[stack.length - 1];
      if (top.col > col) {
        stack.pop();
        continue;
      }
      if (top.col === col) {
        if (item && top.item) {
          stack.pop();
          const last = top.path[top.path.length - 1] as number;
          return [...top.path.slice(0, -1), last + 1];
        }
        if (item) return [...top.path, 0];
        stack.pop();
        if (top.item) continue;
        return [...top.path.slice(0, -1)];
      }
      return item ? [...top.path, 0] : [...top.path];
    }
  };
  lines.forEach((l, line) => {
    const p = parse(l.text);
    if (p.blank && !p.dashes.length) return;
    for (const col of p.dashes) {
      const path = place(col, true);
      const e = { path, line, col, item: true };
      out.push(e);
      stack.push(e);
    }
    if (p.key === null) return;
    const path = [...place(p.keyCol, false), p.key];
    const e = { path, line, col: p.keyCol, item: false };
    out.push(e);
    stack.push(e);
  });
  return out;
};

const same = (a: Path, b: Path) => a.length === b.length && a.every((x, i) => x === b[i]);
// where the value at `path` is written: its key's line (the nearest written parent where the path
// goes on inside a flow `{ … }`, at the key named there), as offsets
export const rangeOf = (text: string, path: Path): { from: number; to: number } => {
  const lines = linesOf(text);
  const entries = entriesOf(lines);
  for (let n = path.length; n >= 0; n--) {
    const e = entries.find((x) => same(x.path, path.slice(0, n)));
    if (!e) continue;
    const l = lines[e.line];
    const key = path[n];
    if (n < path.length && typeof key === "string") {
      const i = l.text.indexOf(`${key}:`, e.col);
      if (i >= 0) return { from: l.from + i, to: l.from + i + key.length };
    }
    return { from: l.from + e.col, to: l.from + l.text.length };
  }
  return { from: 0, to: lines[0]?.text.length ?? 0 };
};

// what the cursor is on: a key being written (the path of the object it goes in, the keys that
// object has), or a key's value (the path of that key); null inside a flow `{ … }` or a string
export type Spot =
  | { kind: "key"; path: Path; has: string[]; from: number }
  | { kind: "value"; path: Path; from: number }
  | null;
const CURSOR = "__cursor__";
export const spotAt = (text: string, offset: number): Spot => {
  const lines = linesOf(text);
  const n = text.slice(0, offset).split("\n").length - 1;
  const before = text.slice(lines[n].from, offset);
  // the document as it would read with this line written as a key (or this key's value) at the
  // cursor: its entries say where that key is
  const as = (line: string) =>
    entriesOf(
      linesOf(
        [
          ...lines.slice(0, n).map((l) => l.text),
          line,
          ...lines.slice(n + 1).map((l) => l.text),
        ].join("\n"),
      ),
    );
  const value = /^(\s*(?:-\s+)*)([\w$-]+)\s*:\s+([^\s{["']*)$/.exec(before);
  if (value) {
    const e = as(`${value[1]}${value[2]}: x`)
      .filter((x) => x.line === n && !x.item)
      .pop();
    return e ? { kind: "value", path: e.path, from: offset - value[3].length } : null;
  }
  const word = /^(\s*(?:-\s*)*)([\w$-]*)$/.exec(before);
  if (!word) return null;
  const all = as(`${word[1]}${CURSOR}: x`);
  const e = all.find((x) => x.line === n && !x.item);
  if (!e) return null;
  const path = e.path.slice(0, -1);
  const has = all
    .filter(
      (x) =>
        !x.item && x !== e && x.path.length === e.path.length && same(x.path.slice(0, -1), path),
    )
    .map((x) => String(x.path[x.path.length - 1]));
  return { kind: "key", path, has, from: offset - word[2].length };
};

// ----- the schema's errors, where they are -----

export interface SchemaError {
  path: Path;
  message: string;
}
interface AjvError {
  instancePath: string;
  keyword: string;
  message?: string;
  params: Record<string, unknown>;
}
const COMPOSITE = new Set(["oneOf", "anyOf", "allOf", "if", "not"]);
// a validator's errors for one card, as paths and short messages: an unknown key at that key,
// a missing one at its object; one message per place
export const errorsOf = (errors: readonly AjvError[] | null | undefined, at: Path = []) => {
  const out: SchemaError[] = [];
  const seen = new Set<string>();
  for (const e of errors ?? []) {
    if (COMPOSITE.has(e.keyword)) continue;
    const path: Path = [
      ...at,
      ...e.instancePath
        .split("/")
        .slice(1)
        .map((x) => x.replace(/~1/g, "/").replace(/~0/g, "~"))
        .map((x) => (/^\d+$/.test(x) ? Number(x) : x)),
    ];
    let message = e.message ?? e.keyword;
    const extra = e.params.additionalProperty ?? e.params.unevaluatedProperty;
    if (typeof extra === "string") {
      path.push(extra);
      message = `unknown key "${extra}"`;
    } else if (e.keyword === "required") message = `needs "${String(e.params.missingProperty)}"`;
    else if (e.keyword === "enum" && Array.isArray(e.params.allowedValues))
      message = `must be one of ${e.params.allowedValues.join(", ")}`;
    const k = `${path.join("/")} ${message}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ path, message });
  }
  return out;
};
