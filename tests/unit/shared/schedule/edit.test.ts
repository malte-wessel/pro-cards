// The schedule card's edits: every one a new week, blocks kept in their day and apart, overlaps
// merged, a selection that follows its blocks.
import { describe, expect, it } from "vitest";
import {
  addBlock,
  daysText,
  drawBounds,
  drawn,
  fillDays,
  fit,
  merge,
  relocate,
  removeBlocks,
  setData,
  valid,
  withIds,
  withoutIds,
  type EDays,
} from "../../../../src/shared/schedule/edit.ts";

const b = (from: number, to: number, data: Record<string, unknown> | null = null) => ({
  from,
  to,
  data,
});
const days = (...d: { from: number; to: number; data: Record<string, unknown> | null }[][]) =>
  withIds([...d, ...Array.from({ length: 7 - d.length }, () => [])]);
const spans = (d: EDays) => d.map((day) => day.map((x) => [x.from, x.to]));
const idAt = (d: EDays, day: number, i: number) => d[day][i].id;

describe("schedule edits", () => {
  it("keeps every block in its day, a step long, apart from the next", () => {
    expect(valid(days([b(0, 60), b(60, 120)]), 15)).toBe(true);
    expect(valid(days([b(0, 70), b(60, 120)]), 15)).toBe(false);
    expect(valid(days([b(1430, 1450)]), 15)).toBe(false);
    // a block changed is a step long at least; one only kept as it was may be shorter
    const short = days([b(0, 10)]);
    expect(valid(short, 15, [idAt(short, 0, 0)])).toBe(false);
    expect(valid(short, 15)).toBe(true);
  });

  it("moves a block though another block of the week is shorter than a step", () => {
    const d = days([b(60, 120)], [b(600, 605)]);
    expect(spans(fit(d, [idAt(d, 0, 0)], "both", 15, 15)!.days)[0]).toEqual([[75, 135]]);
  });

  it("keeps the data of a block moved onto another", () => {
    const d = days([b(360, 480, { temperature: 18 }), b(480, 600, { temperature: 21 })]);
    const r = relocate(d, [idAt(d, 0, 1)], 0, -60, false)!;
    expect(r.days[0].map((x) => [x.from, x.to, x.data])).toEqual([[360, 540, { temperature: 21 }]]);
  });

  it("merges blocks that overlap (the earlier one's data), not those that touch", () => {
    const d = days([b(0, 60, { t: 1 }), b(30, 90, { t: 2 }), b(90, 120)]);
    expect(merge(d[0]).map((x) => [x.from, x.to, x.data])).toEqual([
      [0, 90, { t: 1 }],
      [90, 120, null],
    ]);
  });

  it("moves blocks by the largest step that fits, never past their neighbours", () => {
    const d = days([b(60, 120), b(180, 240)]);
    const id = idAt(d, 0, 0);
    expect(spans(fit(d, [id], "both", 30, 15)!.days)[0]).toEqual([
      [90, 150],
      [180, 240],
    ]);
    // 90 would overlap the next block: it goes as far as it can
    expect(fit(d, [id], "both", 90, 15)!.d).toBe(60);
    // the end alone
    expect(spans(fit(d, [id], "to", 30, 15)!.days)[0][0]).toEqual([60, 150]);
    // nowhere to go
    const full = days([b(0, 1440)]);
    expect(fit(full, [idAt(full, 0, 0)], "both", -15, 15)).toBeNull();
  });

  it("moves blocks to another day, merging where they land, and follows them", () => {
    const d = days([b(360, 510)], [b(400, 600)]);
    const id = idAt(d, 0, 0);
    const r = relocate(d, [id], 1, 0, false)!;
    expect(spans(r.days).slice(0, 2)).toEqual([[], [[360, 600]]]);
    // the moved block joined Tuesday's: the selection is that block
    expect(r.ids).toEqual([r.days[1][0].id]);
    // nothing leaves the week shown
    expect(relocate(d, [id], -1, 0, false)).toBeNull();
    // the minutes are held so the block stays in its day
    expect(relocate(d, [id], 0, 2000, false)!.dm).toBe(1440 - 510);
  });

  it("copies blocks, the originals staying", () => {
    const d = days([b(360, 510)]);
    const r = relocate(d, [idAt(d, 0, 0)], 2, 60, true)!;
    expect(spans(r.days).slice(0, 3)).toEqual([[[360, 510]], [], [[420, 570]]]);
    expect(r.ids).not.toContain(idAt(d, 0, 0));
  });

  it("copies a day's blocks onto other days", () => {
    const d = days([b(60, 120)], [b(100, 200)], []);
    const r = fillDays(d, d[0], [1, 2]);
    expect(spans(r.days).slice(0, 3)).toEqual([[[60, 120]], [[60, 200]], [[60, 120]]]);
    expect(r.ids).toHaveLength(2);
  });

  it("draws a block between its neighbours, an hour for a tap", () => {
    const d = days([b(60, 120), b(600, 700)]);
    expect(drawBounds(d[0], 90)).toBeNull();
    const bounds = drawBounds(d[0], 300)!;
    expect(bounds).toEqual({ lo: 120, hi: 600 });
    expect(drawn(bounds, 300, 400, 15)).toEqual({ from: 300, to: 405 });
    expect(drawn(bounds, 300, 50, 15)).toEqual({ from: 120, to: 300 });
    expect(drawn(bounds, 300, null, 15)).toEqual({ from: 270, to: 330 });
    // no room for even a step
    expect(drawn({ lo: 120, hi: 125 }, 122, null, 15)).toBeNull();
  });

  it("adds, removes and sets data, leaving the days before as they were", () => {
    const d = days([b(60, 120, { temperature: 20, mode: "eco" })]);
    const add = addBlock(d, 3, 600, 660, { temperature: 21 });
    expect(spans(add.days)[3]).toEqual([[600, 660]]);
    expect(spans(d)[3]).toEqual([]);
    const id = idAt(d, 0, 0);
    expect(setData(d, [id], "temperature", 21.5)[0][0].data).toEqual({
      temperature: 21.5,
      mode: "eco",
    });
    expect(setData(d, [id], "mode", null)[0][0].data).toEqual({ temperature: 20 });
    expect(removeBlocks(d, [id])[0]).toEqual([]);
    expect(withoutIds(d)[0]).toEqual([
      { from: 60, to: 120, data: { temperature: 20, mode: "eco" } },
    ]);
  });

  it("names days as ranges", () => {
    const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    expect(daysText([4, 0, 1, 2], names)).toBe("Mon–Wed, Fri");
    expect(daysText([5, 6], names)).toBe("Sat, Sun");
  });
});
