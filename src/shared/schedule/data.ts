// The block data a schedule's cards show (pure): `data` as written, a key or { key, unit, step,
// min, max, default }; the schedule card edits the first one.
import { numOrNull } from "../util.ts";
import type { DataSpec } from "./text.ts";

const spec = (o: { [K in keyof DataSpec]?: DataSpec[K] | null } & { key: string }): DataSpec => ({
  key: o.key,
  unit: o.unit ?? null,
  step: o.step ?? 1,
  min: o.min ?? null,
  max: o.max ?? null,
  default: o.default ?? null,
});

// `type` names the card in its errors
export const normalizeData = (raw: unknown, type: string): DataSpec[] => {
  const err = (msg: string) => new Error(`${type}: ${msg}`);
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw))
    throw err("data is a list of the block data to show, such as [temperature]");
  return raw.map((d, i) => {
    if (typeof d === "string" && d) return spec({ key: d });
    if (!d || typeof d !== "object" || Array.isArray(d))
      throw err(`data[${i}] is a key, or { key, unit, step, min, max, default }`);
    const o = d as Record<string, unknown>;
    for (const k of Object.keys(o))
      if (!["key", "unit", "step", "min", "max", "default"].includes(k))
        throw err(`data[${i}] takes key, unit, step, min, max and default, not ${k}`);
    if (typeof o.key !== "string" || !o.key) throw err(`data[${i}] needs a key`);
    const num = (k: string) => {
      if (o[k] === undefined || o[k] === null) return null;
      const v = numOrNull(o[k]);
      if (v === null) throw err(`data[${i}].${k} is a number`);
      return v;
    };
    const step = num("step");
    if (step !== null && step <= 0) throw err(`data[${i}].step is more than 0`);
    if (o.unit !== undefined && o.unit !== null && typeof o.unit !== "string")
      throw err(`data[${i}].unit is a text`);
    return spec({
      key: o.key,
      unit: (o.unit as string | undefined) ?? null,
      step,
      min: num("min"),
      max: num("max"),
      default: num("default"),
    });
  });
};

// ----- the visual editors: the first entry as fields (`data_key`, `data_unit` …); more entries
// stay as written -----

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => !!v && typeof v === "object" && !Array.isArray(v);
const empty = (v: unknown) => v === undefined || v === null || v === "";

// the form's fields of the first entry, as many as an editor shows
export const DATA_FIELDS = ["key", "unit", "step", "min", "max", "default"] as const;
export type DataField = (typeof DATA_FIELDS)[number];

const firstData = (c: Raw): Raw => {
  const d = Array.isArray(c.data) ? c.data[0] : undefined;
  return typeof d === "string" ? { key: d } : isObj(d) ? d : {};
};
export const dataToForm = (c: Raw, fields: readonly DataField[] = DATA_FIELDS): Raw => {
  const first = firstData(c),
    d: Raw = {};
  for (const k of fields)
    if (k === "key" || k === "unit") d[`data_${k}`] = typeof first[k] === "string" ? first[k] : "";
    else if (typeof first[k] === "number") d[`data_${k}`] = first[k];
  return d;
};
// `data` with the form's first entry (a key alone where it has nothing else; none without a key),
// undefined for none at all
export const dataFromForm = (
  form: Raw,
  prev: Raw,
  fields: readonly DataField[] = DATA_FIELDS,
): unknown[] | undefined => {
  const rest = Array.isArray(prev.data) ? prev.data.slice(1) : [];
  const entry: Raw = { ...firstData(prev) };
  for (const k of fields) {
    const v = form[`data_${k}`];
    if (empty(v)) delete entry[k];
    else entry[k] = v;
  }
  const one = Object.keys(entry).length === 1 ? entry.key : entry;
  const list = empty(entry.key) ? rest : [one, ...rest];
  return list.length ? list : undefined;
};
