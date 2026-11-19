// The schedule card's edits (pure): blocks with ids, so a selection follows them; every operation
// returns a new set of days (an undo is the days before), never one with blocks that overlap or
// leave their day. The days are in the order the card shows them; a move by days stays within
// them. Blocks that land on each other merge (Home Assistant takes no overlap).
import { DAY_MIN, type Block } from "./model.ts";

export interface EBlock extends Block {
  id: number;
}
export type EDays = readonly (readonly EBlock[])[];
export type Edge = "from" | "to";

let nextId = 1;
export const newId = () => nextId++;
// the days with an id on every block
export const withIds = (days: readonly (readonly Block[])[]): EDays =>
  days.map((d) => d.map((b) => ({ ...b, id: newId() })));
export const withoutIds = (days: EDays): Block[][] =>
  days.map((d) => d.map(({ from, to, data }) => ({ from, to, data })));

// to the nearest step
export const snapMin = (m: number, step: number) => Math.round(m / step) * step;

const sorted = (d: EBlock[]) => d.sort((a, b) => a.from - b.from);

// blocks that overlap merged into one; touching blocks stay two. The merged block keeps the data
// of the block that came (`came`: moved, copied), else the earlier one's
export const merge = (d: readonly EBlock[], came: readonly number[] = []): EBlock[] => {
  const out: EBlock[] = [];
  for (const b of [...d].sort((x, y) => x.from - y.from)) {
    const last = out[out.length - 1];
    if (last && b.from < last.to) {
      const data = came.includes(b.id) && !came.includes(last.id) ? b.data : last.data;
      out[out.length - 1] = { ...last, to: Math.max(last.to, b.to), data };
    } else out.push({ ...b });
  }
  return out;
};

// the chosen blocks' start or end moved by d minutes
const shifted = (days: EDays, ids: readonly number[], edge: Edge, d: number): EBlock[][] =>
  days.map((day) =>
    sorted(
      day.map((b) =>
        ids.includes(b.id)
          ? {
              ...b,
              from: edge === "from" ? b.from + d : b.from,
              to: edge === "to" ? b.to + d : b.to,
            }
          : b,
      ),
    ),
  );

// The chosen blocks moved (or copied) by dd days and dm minutes, the minutes held so every block
// stays in its day; blocks that land on others merge with them. Null where a block would leave
// the days shown. The result names the moved blocks (the copies, for a copy).
export const relocate = (
  days: EDays,
  ids: readonly number[],
  dd: number,
  dm: number,
  copy: boolean,
): { days: EBlock[][]; ids: number[]; dm: number } | null => {
  const picked: { d: number; b: EBlock }[] = [];
  days.forEach((day, d) => day.forEach((b) => ids.includes(b.id) && picked.push({ d, b })));
  if (!picked.length || picked.some((p) => p.d + dd < 0 || p.d + dd >= days.length)) return null;
  const lo = Math.max(...picked.map((p) => -p.b.from)),
    hi = Math.min(...picked.map((p) => DAY_MIN - p.b.to));
  const m = Math.max(lo, Math.min(hi, dm));
  const out = days.map((day) => (copy ? [...day] : day.filter((b) => !ids.includes(b.id))));
  const landed: { d: number; from: number }[] = [];
  const came: number[] = [];
  for (const p of picked) {
    const nb = { ...p.b, id: copy ? newId() : p.b.id, from: p.b.from + m, to: p.b.to + m };
    landed.push({ d: p.d + dd, from: nb.from });
    came.push(nb.id);
    out[p.d + dd].push(nb);
  }
  const merged = out.map((day) => merge(day, came));
  return { days: merged, ids: landedIds(merged, landed), dm: m };
};
// the blocks that hold what landed (a block merged into another goes by the one it joined)
const landedIds = (days: EDays, landed: { d: number; from: number }[]) => [
  ...new Set(
    landed.flatMap(({ d, from }) => {
      const b = days[d].find((x) => x.from <= from && from < x.to);
      return b ? [b.id] : [];
    }),
  ),
];

// The chosen blocks' start or end moved by d minutes, held so each stays in its day and a step
// long (one shorter already only grows); blocks they reach into merge with them. The result names
// the blocks that hold them now, and the minutes they moved.
export const resize = (
  days: EDays,
  ids: readonly number[],
  edge: Edge,
  d: number,
  step: number,
): { days: EBlock[][]; ids: number[]; d: number } => {
  const picked = days.flat().filter((b) => ids.includes(b.id));
  const room = (b: EBlock) => Math.max(0, b.to - b.from - step);
  const lo = Math.max(...picked.map((b) => (edge === "to" ? -room(b) : -b.from))),
    hi = Math.min(...picked.map((b) => (edge === "to" ? DAY_MIN - b.to : room(b))));
  const m = picked.length ? Math.max(lo, Math.min(hi, d)) : 0;
  const landed: { d: number; from: number }[] = [];
  const out = shifted(days, ids, edge, m).map((day, i) => {
    for (const b of day) if (ids.includes(b.id)) landed.push({ d: i, from: b.from });
    return merge(day, ids);
  });
  return { days: out, ids: landedIds(out, landed), d: m };
};

// copies of the blocks of one day onto other days (merging where they land); the copies' ids
export const fillDays = (
  days: EDays,
  blocks: readonly EBlock[],
  targets: readonly number[],
): { days: EBlock[][]; ids: number[] } => {
  const landed: { d: number; from: number }[] = [];
  const out = days.map((day, d) => {
    if (!targets.includes(d)) return [...day];
    const copies = blocks.map((b) => ({ ...b, id: newId() }));
    landed.push(...copies.map((b) => ({ d, from: b.from })));
    return merge(
      [...day, ...copies],
      copies.map((b) => b.id),
    );
  });
  return { days: out, ids: landedIds(out, landed) };
};

// where a block drawn from minute m0 of a day may reach: from the end of the block before to the
// start of the block after (null: m0 is inside a block)
export const drawBounds = (
  day: readonly EBlock[],
  m0: number,
): { lo: number; hi: number } | null => {
  if (day.some((b) => b.from <= m0 && m0 < b.to)) return null;
  const lo = day.filter((b) => b.to <= m0).reduce((a, b) => Math.max(a, b.to), 0);
  const hi = day.filter((b) => b.from >= m0).reduce((a, b) => Math.min(a, b.from), DAY_MIN);
  return { lo, hi };
};
// the block a drag from m0 to m draws within its bounds (at least a step), null where none fits;
// a tap (m === m0) draws an hour around it
export const drawn = (
  bounds: { lo: number; hi: number },
  m0: number,
  m: number | null,
  step: number,
): { from: number; to: number } | null => {
  const { lo, hi } = bounds;
  let from: number, to: number;
  if (m === null) {
    from = Math.max(lo, Math.min(DAY_MIN - 60, snapMin(m0 - 30, step)));
    to = Math.min(hi, from + 60);
  } else {
    const a = snapMin(m0, step),
      b = snapMin(m, step);
    from = Math.max(lo, Math.min(a, b));
    to = Math.min(hi, Math.max(a, b));
    if (to - from < step) to = Math.min(hi, from + step);
  }
  return to - from >= step ? { from, to } : null;
};

// a new block on a day (where drawBounds allowed it)
export const addBlock = (
  days: EDays,
  d: number,
  from: number,
  to: number,
  data: Record<string, unknown> | null,
): { days: EBlock[][]; id: number } => {
  const id = newId();
  return {
    days: days.map((day, i) => (i === d ? sorted([...day, { id, from, to, data }]) : [...day])),
    id,
  };
};

export const removeBlocks = (days: EDays, ids: readonly number[]): EBlock[][] =>
  days.map((d) => d.filter((b) => !ids.includes(b.id)));

// a data key set on the chosen blocks (null: removed); other keys stay as they are
export const setData = (
  days: EDays,
  ids: readonly number[],
  key: string,
  value: unknown,
): EBlock[][] =>
  days.map((d) =>
    d.map((b) => {
      if (!ids.includes(b.id)) return b;
      const data = { ...(b.data ?? {}) };
      if (value === null) delete data[key];
      else data[key] = value;
      return { ...b, data: Object.keys(data).length ? data : null };
    }),
  );

// where a block is: its day and itself
export const findBlock = (days: EDays, id: number): { d: number; b: EBlock } | null => {
  for (let d = 0; d < days.length; d++) {
    const b = days[d].find((x) => x.id === id);
    if (b) return { d, b };
  }
  return null;
};

// a list of days as the language's short names, runs of three or more as a range ("Mon–Wed, Fri")
export const daysText = (list: readonly number[], names: readonly string[]) => {
  const u = [...new Set(list)].sort((a, b) => a - b);
  const parts: string[] = [];
  let i = 0;
  while (i < u.length) {
    let j = i;
    while (j + 1 < u.length && u[j + 1] === u[j] + 1) j++;
    parts.push(
      j - i >= 2
        ? `${names[u[i]]}–${names[u[j]]}`
        : u
            .slice(i, j + 1)
            .map((x) => names[x])
            .join(", "),
    );
    i = j + 1;
  }
  return parts.join(", ");
};
