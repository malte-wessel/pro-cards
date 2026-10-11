import { describe, expect, it, vi } from "vitest";
import type { HomeAssistant } from "../../../src/shared/ha.ts";
import { TemplateSubscriptions } from "../../../src/shared/templates.ts";

// a connection that remembers each render_template subscription's callback
const fakeConnection = () => {
  const subs = new Map<string, (msg: { result?: unknown }) => void>();
  const unsubscribed: string[] = [];
  const conn = {
    subscribeMessage: async (
      cb: (msg: { result?: unknown }) => void,
      msg: { template: string },
    ) => {
      subs.set(msg.template, cb);
      return () => {
        unsubscribed.push(msg.template);
      };
    },
  } as unknown as HomeAssistant["connection"];
  return { conn, subs, unsubscribed };
};
const flush = () => new Promise((r) => setTimeout(r, 0));

describe("template subscriptions", () => {
  it("subscribes each template once and reports changed results", async () => {
    const { conn, subs } = fakeConnection();
    const onChange = vi.fn();
    const t = new TemplateSubscriptions("test-card", onChange);
    t.sync(conn, new Set(["{{ a }}", "{{ b }}"]));
    t.sync(conn, new Set(["{{ a }}", "{{ b }}"]));
    expect(subs.size).toBe(2);
    expect(t.size).toBe(2);
    subs.get("{{ a }}")!({ result: "1" });
    subs.get("{{ a }}")!({ result: "1" });
    expect(t.results.get("{{ a }}")).toBe("1");
    expect(onChange).toHaveBeenCalledTimes(1);
  });
  it("drops templates no longer wanted, with their results, and keeps the others' results", async () => {
    const { conn, subs, unsubscribed } = fakeConnection();
    const t = new TemplateSubscriptions("test-card", () => {});
    t.sync(conn, new Set(["{{ a }}", "{{ b }}"]));
    await flush();
    subs.get("{{ a }}")!({ result: "1" });
    subs.get("{{ b }}")!({ result: "2" });
    t.sync(conn, new Set(["{{ a }}"]));
    await flush();
    expect(unsubscribed).toEqual(["{{ b }}"]);
    expect(t.results.get("{{ a }}")).toBe("1");
    expect(t.results.has("{{ b }}")).toBe(false);
  });
  it("ends every subscription on clear and subscribes again on the next sync", async () => {
    const { conn, unsubscribed } = fakeConnection();
    const t = new TemplateSubscriptions("test-card", () => {});
    t.sync(conn, new Set(["{{ a }}"]));
    t.clear();
    await flush();
    expect(unsubscribed).toEqual(["{{ a }}"]);
    expect(t.size).toBe(0);
    t.sync(conn, new Set(["{{ a }}"]));
    expect(t.size).toBe(1);
  });
  it("forgets dropped results even without a connection", () => {
    const t = new TemplateSubscriptions("test-card", () => {});
    t.results.set("{{ a }}", "1");
    t.sync(undefined, new Set());
    expect(t.results.size).toBe(0);
  });
});
