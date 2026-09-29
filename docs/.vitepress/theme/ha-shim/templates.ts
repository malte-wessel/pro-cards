// A small Jinja subset for `{{ ... }}` expressions, enough for typical card templates:
// states('x'), state_attr('x','a'), is_state('x','on'), states.light (iterable), filters
// (float, int, round, replace, upper, lower, list, count, length, select, selectattr, reject,
// rejectattr, map, join, default, abs, max, min, first, last, title, trim), arithmetic,
// comparisons, and/or/not, `a if cond else b`. Unsupported input throws; callers fall back.
import type { HassEntities, HassEntity } from "../../../../src/shared/ha.ts";

export type Filter = (v: unknown, ...args: unknown[]) => unknown;
export type Test = (x: unknown, a?: unknown) => boolean;

const list = (v: unknown): unknown[] =>
  Array.isArray(v) ? v : Array.from((v ?? []) as Iterable<unknown>);
const testOf = (name: unknown): Test => {
  const t = TESTS[String(name ?? "truthy")];
  if (!t) throw new Error(`test ${name}`);
  return t;
};

const FILTERS: Record<string, Filter> = {
  float: (v, d = 0) => {
    const n = parseFloat(String(v));
    return Number.isFinite(n) ? n : d;
  },
  int: (v, d = 0) => {
    const n = parseInt(String(v), 10);
    return Number.isFinite(n) ? n : d;
  },
  round: (v, p = 0) => {
    const m = Math.pow(10, Number(p));
    return Math.round(Number(v) * m) / m;
  },
  replace: (v, a, b) =>
    String(v)
      .split(a as string)
      .join(b as string),
  upper: (v) => String(v).toUpperCase(),
  lower: (v) => String(v).toLowerCase(),
  title: (v) => String(v).replace(/\b\w/g, (c) => c.toUpperCase()),
  capitalize: (v) => {
    const s = String(v);
    return s.charAt(0).toUpperCase() + s.slice(1);
  },
  trim: (v) => String(v).trim(),
  list,
  count: (v) => (Array.isArray(v) ? v.length : String(v).length),
  length: (v) => (Array.isArray(v) ? v.length : String(v).length),
  join: (v, sep = "") => list(v).join(sep as string),
  first: (v) => list(v)[0],
  last: (v) => {
    const l = list(v);
    return l[l.length - 1];
  },
  default: (v, d = "", bool = false) => (v === undefined || v === null || (bool && !v) ? d : v),
  abs: (v) => Math.abs(Number(v)),
  max: (v) => Math.max(...list(v).map(Number)),
  min: (v) => Math.min(...list(v).map(Number)),
  sum: (v) => list(v).reduce<number>((a, b) => a + Number(b), 0),
  string: (v) => String(v),
  select: (v, test, arg) => list(v).filter((x) => testOf(test)(x, arg)),
  reject: (v, test, arg) => list(v).filter((x) => !testOf(test)(x, arg)),
  selectattr: (v, attr, test, arg) => list(v).filter((x) => testOf(test)(attrOf(x, attr), arg)),
  rejectattr: (v, attr, test, arg) => list(v).filter((x) => !testOf(test)(attrOf(x, attr), arg)),
  map: (v, attr) => list(v).map((x) => attrOf(x, attr)),
  sort: (v) => [...list(v)].sort(),
  unique: (v) => [...new Set(list(v))],
  timestamp_custom: (v) => String(v),
  as_timestamp: (v) => new Date(v as string).getTime() / 1000,
};
const TESTS: Record<string, Test> = {
  truthy: (x) => !!x,
  eq: (x, a) => x == a,
  equalto: (x, a) => x == a,
  ne: (x, a) => x != a,
  gt: (x, a) => Number(x) > Number(a),
  ge: (x, a) => Number(x) >= Number(a),
  lt: (x, a) => Number(x) < Number(a),
  le: (x, a) => Number(x) <= Number(a),
  in: (x, a) => list(a).includes(x),
  defined: (x) => x !== undefined,
  none: (x) => x === null || x === undefined,
  is_number: (x) => Number.isFinite(Number(x)) && x !== "" && x !== null,
  number: (x) => Number.isFinite(Number(x)) && x !== "" && x !== null && typeof x !== "boolean",
  string: (x) => typeof x === "string",
  search: (x, a) => new RegExp(a as string).test(String(x)),
  match: (x, a) => new RegExp("^" + String(a)).test(String(x)),
};
const attrOf = (obj: unknown, path: unknown): unknown =>
  String(path)
    .split(".")
    .reduce<unknown>((o, k) => (o == null ? undefined : (o as Record<string, unknown>)[k]), obj);

// ---------- tokenizer ----------

interface Token {
  t: "str" | "num" | "id" | "op";
  v: string | number;
}

const tokenize = (src: string): Token[] => {
  const toks: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === "'" || c === '"') {
      let j = i + 1,
        s = "";
      while (j < src.length && src[j] !== c) {
        if (src[j] === "\\") {
          s += src[j + 1];
          j += 2;
        } else s += src[j++];
      }
      toks.push({ t: "str", v: s });
      i = j + 1;
      continue;
    }
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1]))) {
      const m = src.slice(i).match(/^[0-9]*\.?[0-9]+(e[+-]?[0-9]+)?/i)!;
      toks.push({ t: "num", v: Number(m[0]) });
      i += m[0].length;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      const m = src.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/)!;
      toks.push({ t: "id", v: m[0] });
      i += m[0].length;
      continue;
    }
    const two = src.substr(i, 2);
    if (["==", "!=", "<=", ">=", "//", "**"].includes(two)) {
      toks.push({ t: "op", v: two });
      i += 2;
      continue;
    }
    if ("+-*/%|.,()[]{}:<>~=".includes(c)) {
      toks.push({ t: "op", v: c });
      i++;
      continue;
    }
    throw new Error(`unexpected '${c}'`);
  }
  return toks;
};

// ---------- parser → JS source ----------

const parse = (src: string): string => {
  const toks = tokenize(src);
  let p = 0;
  const peek = (v?: string): Token | null =>
    toks[p] && (v === undefined || toks[p].v === v) ? toks[p] : null;
  const peekOp = (ops: string[]): boolean => {
    const t = peek();
    return !!t && t.t === "op" && ops.includes(String(t.v));
  };
  const isId = (v: string): boolean => !!toks[p] && toks[p].t === "id" && toks[p].v === v;
  const eat = (v?: string): Token => {
    const t = toks[p];
    if (!t || (v !== undefined && t.v !== v)) throw new Error(`expected ${v}`);
    p++;
    return t;
  };

  const ternary = (): string => {
    const a = or();
    if (isId("if")) {
      p++;
      const c = or();
      let b = "undefined";
      if (isId("else")) {
        p++;
        b = ternary();
      }
      return `((${c}) ? (${a}) : (${b}))`;
    }
    return a;
  };
  const or = (): string => {
    let a = and();
    while (isId("or")) {
      p++;
      a = `(${a} || ${and()})`;
    }
    return a;
  };
  const and = (): string => {
    let a = not();
    while (isId("and")) {
      p++;
      a = `(${a} && ${not()})`;
    }
    return a;
  };
  const not = (): string => {
    if (isId("not")) {
      p++;
      return `(!${not()})`;
    }
    return cmp();
  };
  const cmp = (): string => {
    let a = add();
    for (;;) {
      if (peekOp(["==", "!=", "<", "<=", ">", ">="])) {
        const o = eat().v;
        a = `(F.cmp(${a}, "${o}", ${add()}))`;
      } else if (isId("in")) {
        p++;
        a = `(T.in(${a}, ${add()}))`;
      } else if (isId("not") && toks[p + 1] && toks[p + 1].v === "in") {
        p += 2;
        a = `(!T.in(${a}, ${add()}))`;
      } else if (isId("is")) {
        p++;
        let neg = false;
        if (isId("not")) {
          p++;
          neg = true;
        }
        const test = eat().v;
        let arg = "undefined";
        const next = peek();
        if (next && next.v === "(") {
          p++;
          arg = ternary();
          eat(")");
        } else if (next && (next.t === "str" || next.t === "num")) {
          arg = atom();
        }
        a = `(${neg ? "!" : ""}T["${test}"](${a}, ${arg}))`;
      } else return a;
    }
  };
  const add = (): string => {
    let a = mul();
    while (peekOp(["+", "-", "~"])) {
      const o = eat().v;
      const b = mul();
      a =
        o === "~"
          ? `(String(${a}) + String(${b}))`
          : o === "+"
            ? `(F.plus(${a}, ${b}))`
            : `(Number(${a}) - Number(${b}))`;
    }
    return a;
  };
  const mul = (): string => {
    let a = unary();
    while (peekOp(["*", "/", "//", "%"])) {
      const o = eat().v;
      const b = unary();
      a =
        o === "//" ? `Math.floor(Number(${a}) / Number(${b}))` : `(Number(${a}) ${o} Number(${b}))`;
    }
    return a;
  };
  const unary = (): string => {
    if (peek("-")) {
      p++;
      return `(-Number(${unary()}))`;
    }
    if (peek("+")) {
      p++;
      return unary();
    }
    return filtered();
  };
  const filtered = (): string => {
    let a = postfix();
    while (peek("|")) {
      p++;
      const name = eat().v;
      const args = peek("(") ? (p++, argList(")")) : [];
      a = `F.apply("${name}", ${a}${args.length ? ", " + args.join(", ") : ""})`;
    }
    return a;
  };
  const argList = (close: string): string[] => {
    const out: string[] = [];
    while (!peek(close)) {
      if (toks[p] && toks[p].t === "id" && toks[p + 1] && toks[p + 1].v === "=") p += 2;
      out.push(ternary());
      if (peek(",")) p++;
    }
    eat(close);
    return out;
  };
  const postfix = (): string => {
    let a = atom();
    for (;;) {
      if (peek(".")) {
        p++;
        const k = eat().v;
        a = `F.get(${a}, "${k}")`;
      } else if (peek("[")) {
        p++;
        const k = ternary();
        eat("]");
        a = `F.get(${a}, ${k})`;
      } else if (peek("(")) {
        p++;
        const args = argList(")");
        a = `F.call(${a}, [${args.join(", ")}])`;
      } else return a;
    }
  };
  const atom = (): string => {
    const t = toks[p];
    if (!t) throw new Error("unexpected end");
    if (t.t === "num") {
      p++;
      return String(t.v);
    }
    if (t.t === "str") {
      p++;
      return JSON.stringify(t.v);
    }
    if (t.t === "id") {
      p++;
      if (t.v === "True" || t.v === "true") return "true";
      if (t.v === "False" || t.v === "false") return "false";
      if (t.v === "None" || t.v === "none") return "null";
      return `S["${t.v}"]`;
    }
    if (t.v === "(") {
      p++;
      const e = ternary();
      eat(")");
      return `(${e})`;
    }
    if (t.v === "[") {
      p++;
      const items = argList("]");
      return `[${items.join(", ")}]`;
    }
    throw new Error(`unexpected ${t.v}`);
  };
  const js = ternary();
  if (p !== toks.length) throw new Error("trailing input");
  return js;
};

// the JS a template expression compiles to: it reads the scope S and calls the helpers F / tests T
type Compiled = (S: Scope, F: Helpers, T: Record<string, Test>) => unknown;

const compiled = new Map<string, Compiled>();
const compile = (expr: string): Compiled => {
  let fn = compiled.get(expr);
  if (!fn) {
    fn = new Function("S", "F", "T", `return (${parse(expr)});`) as Compiled;
    compiled.set(expr, fn);
  }
  return fn;
};

// ---------- runtime ----------

interface Helpers {
  apply(name: string, v: unknown, ...args: unknown[]): unknown;
  get(o: unknown, k: unknown): unknown;
  call(f: unknown, args: unknown[]): unknown;
  cmp(a: unknown, o: string, b: unknown): boolean;
  plus(a: unknown, b: unknown): string | number;
}

const helpers: Helpers = {
  apply: (name, v, ...args) => {
    const f = FILTERS[name];
    if (!f) throw new Error(`filter ${name}`);
    return f(v, ...args);
  },
  get: (o, k) => {
    if (o == null) return undefined;
    const v = (o as Record<string, unknown>)[k as string];
    return typeof v === "function" ? v.bind(o) : v;
  },
  call: (f, args) => {
    if (typeof f !== "function") throw new Error("not callable");
    return f(...args);
  },
  cmp: (a, o, b) => {
    const na = Number(a),
      nb = Number(b);
    const num =
      a !== "" &&
      b !== "" &&
      Number.isFinite(na) &&
      Number.isFinite(nb) &&
      typeof a !== "boolean" &&
      typeof b !== "boolean";
    const x = num ? na : (a as string | number),
      y = num ? nb : (b as string | number);
    switch (o) {
      case "==":
        return x == y;
      case "!=":
        return x != y;
      case "<":
        return x < y;
      case "<=":
        return x <= y;
      case ">":
        return x > y;
      default:
        return x >= y;
    }
  },
  plus: (a, b) =>
    typeof a === "string" || typeof b === "string" ? String(a) + String(b) : Number(a) + Number(b),
};

// `states.light` is the domain's entities as a list that also exposes them by object id
export type DomainList = HassEntity[] & Record<string, HassEntity>;
// `states` is callable (`states('light.a')`) and indexable by domain (`states.light`)
export type StatesProxy = ((id: string) => string) & Record<string, DomainList>;

export interface Scope {
  states: StatesProxy;
  state_attr(id: string, a: string): unknown;
  is_state(id: string, v: unknown): boolean;
  is_state_attr(id: string, a: string, v: unknown): boolean;
  has_value(id: string): boolean;
  now(): Date;
  utcnow(): Date;
  float: Filter;
  int: Filter;
  max: typeof Math.max;
  min: typeof Math.min;
  abs: typeof Math.abs;
  round: Filter;
}

export const makeScope = (states: HassEntities): Scope => {
  const byDomain = (domain: string) =>
    Object.values(states).filter((s) => s.entity_id.startsWith(domain + "."));
  const statesFn = (id: string) => (states[id] ? states[id].state : "unknown");
  const proxy = new Proxy(statesFn, {
    get(_, key) {
      if (typeof key !== "string") return undefined;
      if (key === "length") return Object.keys(states).length;
      const list = byDomain(key);
      const dom: DomainList = Object.assign(list, {} as Record<string, HassEntity>);
      for (const s of list) dom[s.entity_id.slice(key.length + 1)] = s;
      return dom;
    },
    apply(_, __, args: [string]) {
      return statesFn(...args);
    },
  }) as StatesProxy;
  return {
    states: proxy,
    state_attr: (id, a) => states[id]?.attributes?.[a],
    is_state: (id, v) =>
      Array.isArray(v) ? v.includes(states[id]?.state) : states[id]?.state === v,
    is_state_attr: (id, a, v) => states[id]?.attributes?.[a] == v,
    has_value: (id) => !!states[id] && !["unknown", "unavailable"].includes(states[id].state),
    now: () => new Date(),
    utcnow: () => new Date(),
    float: FILTERS.float,
    int: FILTERS.int,
    max: Math.max,
    min: Math.min,
    abs: Math.abs,
    round: FILTERS.round,
  };
};

const fmt = (v: unknown): string => {
  if (v === undefined || v === null) return "None";
  if (typeof v === "boolean") return v ? "True" : "False";
  if (Array.isArray(v)) return JSON.stringify(v);
  if (typeof v === "object")
    return String((v as { entity_id?: unknown }).entity_id ?? JSON.stringify(v));
  if (typeof v === "number")
    return Number.isInteger(v) ? String(v) : String(Math.round(v * 1e6) / 1e6);
  return String(v);
};

export interface RenderResult {
  ok: boolean;
  result: string;
  error?: string;
}

// Render a template string with the given states. Returns { ok, result }.
export const renderTemplate = (tpl: string, states: HassEntities): RenderResult => {
  try {
    if (/\{%/.test(tpl)) throw new Error("statements are not supported");
    const S = makeScope(states);
    const out = tpl.replace(/\{\{\s*([\s\S]*?)\s*\}\}/g, (_, expr: string) =>
      fmt(compile(expr)(S, helpers, TESTS)),
    );
    return { ok: true, result: out.trim() };
  } catch (err) {
    return { ok: false, result: tpl, error: err instanceof Error ? err.message : String(err) };
  }
};
