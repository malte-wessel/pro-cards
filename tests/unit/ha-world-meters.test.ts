// The dev Home Assistant's energy meters (test/ha/custom_components/pro_cards_world/meters.py):
// the statistics its integration imports on every start. Plain Python, no Home Assistant needed.
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// (a contributor without Python skips it; CI's runners have it)
const hasPython = (() => {
  try {
    execFileSync("python3", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

const DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../test/ha/custom_components/pro_cards_world",
);
const HOUR = 3600e3;

interface Row {
  start: number;
  state: number;
  sum: number;
}
// meter_statistics for a world whose readings start at `first`: the meter counts 1.234 kWh an hour
// from a fixed origin, as the docs world's meters count from theirs
const statisticsAt = (first: number, now: number, hours = 48): { hours: Row[]; short: Row } => {
  const origin = Date.UTC(2026, 0, 1);
  const readings = Array.from(
    { length: hours + 1 },
    (_, i) => 1000 + ((first - origin) / HOUR + i) * 1.234,
  );
  const script = `
import json, sys
sys.path.insert(0, sys.argv[1])
from meters import meter_statistics
world = {"first": ${first}, "meters": {}}
hours, short = meter_statistics(world, {"readings": ${JSON.stringify(readings)}}, ${now / 1000})
row = lambda r: {"start": r["start"].timestamp() * 1000, "state": r["state"], "sum": r["sum"]}
print(json.dumps({"hours": [row(r) for r in hours], "short": row(short)}))
`;
  return JSON.parse(execFileSync("python3", ["-I", "-B", "-c", script, DIR], { encoding: "utf8" }));
};

describe.skipIf(!hasPython)("the dev Home Assistant's meter statistics", () => {
  const first = Date.UTC(2026, 5, 1);
  const now = first + 30 * HOUR + 17 * 60e3 + 20e3; // 06:17:20 the day after

  it("keep the sums of the hours imported before when a later start moves the window", () => {
    const before = statisticsAt(first, now);
    // the next start, a day later: world.json written again with its first hour a day later
    const after = statisticsAt(first + 24 * HOUR, now + 24 * HOUR);
    const sumAt = (rows: Row[], t: number) => rows.find((r) => r.start === t)?.sum;
    const shared = after.hours.filter((r) => before.hours.some((b) => b.start === r.start));
    expect(shared.length).toBeGreaterThan(0);
    for (const r of shared) expect(r.sum).toBe(sumAt(before.hours, r.start));
  });

  it("import every hour that ended, and the last five minutes for the recorder to count on from", () => {
    const { hours, short } = statisticsAt(first, now);
    const last = hours[hours.length - 1];
    // 06:00 is the last hour's end
    expect(last.start + HOUR).toBe(first + 30 * HOUR);
    expect(hours).toHaveLength(30);
    // 06:10–06:15: its sum is the meter's reading at 06:15, on from the last hour's, and its state
    // the sensor's, to two decimals unless the meter has its own
    expect(short.start).toBe(first + 30 * HOUR + 10 * 60e3);
    const at615 = Math.round((last.state + 1.234 / 4) * 100) / 100;
    expect(short.state).toBeCloseTo(at615, 9);
    expect(short.sum).toBeCloseTo(at615, 9);
  });
});
