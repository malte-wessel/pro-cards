import { describe, it, expect, vi, afterEach } from "vitest";
import { HistoryFeed } from "../../../src/shared/history-feed.ts";
import { RETRY_MS } from "../../../src/shared/constants.ts";

// a fetch the test resolves or rejects by hand
const deferred = <T>() => {
  let resolve!: (v: T) => void, reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe("history feed", () => {
  afterEach(() => vi.restoreAllMocks());

  it("applies a result and renders once it arrives", async () => {
    const feed = new HistoryFeed("test");
    const d = deferred<number>();
    const applied: number[] = [];
    const done = vi.fn();
    expect(feed.due()).toBe(true);
    const run = feed.run(
      () => d.promise,
      (v) => applied.push(v),
      done,
    );
    expect(feed.due()).toBe(false);
    d.resolve(7);
    await run;
    expect(applied).toEqual([7]);
    expect(done).toHaveBeenCalledTimes(1);
    expect(feed.loaded).toBe(true);
    expect(feed.due()).toBe(false);
  });

  it("drops a result that arrives after a new config", async () => {
    const feed = new HistoryFeed("test");
    const old = deferred<string>(),
      next = deferred<string>();
    const applied: string[] = [];
    const done = vi.fn();
    const first = feed.run(
      () => old.promise,
      (v) => applied.push(v),
      done,
    );
    feed.reset();
    // the new config fetches at once, although the old request is still on its way
    expect(feed.due()).toBe(true);
    const second = feed.run(
      () => next.promise,
      (v) => applied.push(v),
      done,
    );
    old.resolve("old");
    await first;
    expect(applied).toEqual([]);
    expect(done).not.toHaveBeenCalled();
    expect(feed.loaded).toBe(false);
    next.resolve("new");
    await second;
    expect(applied).toEqual(["new"]);
    expect(feed.loaded).toBe(true);
  });

  it("runs one fetch at a time", async () => {
    const feed = new HistoryFeed("test");
    const d = deferred<number>();
    const fetch = vi.fn(() => d.promise);
    const run = feed.run(
      fetch,
      () => {},
      () => {},
    );
    await feed.run(
      fetch,
      () => {},
      () => {},
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    d.resolve(1);
    await run;
  });

  it("tries a failed fetch again only after a while, not on every update", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const feed = new HistoryFeed("test");
    const done = vi.fn();
    await feed.run(
      () => Promise.reject(new Error("recorder down")),
      () => {},
      done,
    );
    expect(done).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(feed.loaded).toBe(false);
    expect(feed.due()).toBe(false);
    expect(feed.due(Date.now() + RETRY_MS)).toBe(true);
    // a new config does not wait for the old one's failure
    feed.reset();
    expect(feed.due()).toBe(true);
  });

  it("ignores the failure of a request an older config made", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const feed = new HistoryFeed("test");
    const d = deferred<number>();
    const run = feed.run(
      () => d.promise,
      () => {},
      () => {},
    );
    feed.reset();
    d.reject(new Error("late"));
    await run;
    expect(console.error).not.toHaveBeenCalled();
    expect(feed.due()).toBe(true);
  });

  it("fetches again on demand while keeping what is loaded", async () => {
    const feed = new HistoryFeed("test", "statistics");
    const applied: number[] = [];
    await feed.run(
      () => Promise.resolve(1),
      (v) => applied.push(v),
      () => {},
    );
    expect(feed.due()).toBe(false);
    // newer data: due at once, the old result stays applied meanwhile
    feed.invalidate();
    expect(feed.due()).toBe(true);
    expect(applied).toEqual([1]);
  });

  it("fetches a result that is not complete yet again after RETRY_MS", async () => {
    const feed = new HistoryFeed("test", "statistics");
    const done = vi.fn();
    const before = Date.now();
    // the hours around a turn are compiled a little later
    await feed.run(
      () => Promise.resolve(1),
      () => false,
      done,
    );
    expect(done).toHaveBeenCalledTimes(1);
    expect(feed.loaded).toBe(false);
    expect(feed.due(before)).toBe(false);
    expect(feed.due(Date.now() + RETRY_MS)).toBe(true);
  });

  it("answers a refresh asked for while a fetch runs with another fetch", async () => {
    const feed = new HistoryFeed("test", "statistics");
    const d = deferred<number>();
    const run = feed.run(
      () => d.promise,
      () => {},
      () => {},
    );
    // a newly compiled hour while the request is on its way
    feed.invalidate();
    d.resolve(1);
    await run;
    expect(feed.loaded).toBe(false);
    expect(feed.due()).toBe(true);
  });

  it("names what failed in the console", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const feed = new HistoryFeed("energy-flow-card-pro", "statistics");
    await feed.run(
      () => Promise.reject(new Error("x")),
      () => {},
      () => {},
    );
    expect(vi.mocked(console.error).mock.calls[0][0]).toBe(
      "energy-flow-card-pro: statistics fetch failed",
    );
  });
});
