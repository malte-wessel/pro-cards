import { describe, it, expect } from "vitest";
import { undoStack } from "../../docs/.vitepress/theme/playground/undo.ts";

describe("the Playground's undo and redo", () => {
  it("go back and forth through the changes", () => {
    const u = undoStack("a");
    expect(u.canUndo()).toBe(false);
    u.record("b");
    u.record("c");
    expect(u.undo()).toBe("b");
    expect(u.undo()).toBe("a");
    expect(u.undo()).toBeNull();
    expect(u.redo()).toBe("b");
    expect(u.redo()).toBe("c");
    expect(u.redo()).toBeNull();
  });

  it("take back what was typed since the last pause, as one step", () => {
    const u = undoStack("a");
    u.record("ab", true, 0);
    u.record("abc", true, 300);
    u.record("abcd", true, 600);
    // a pause, then more
    u.record("abcde", true, 2000);
    expect(u.undo()).toBe("abcd");
    expect(u.undo()).toBe("a");
    // a visual edit is a step of its own, typed right after it or not
    const v = undoStack("x");
    v.record("xy", true, 0);
    v.record("xy!", false, 100);
    v.record("xy!z", true, 200);
    expect(v.undo()).toBe("xy!");
    expect(v.undo()).toBe("xy");
  });

  it("drop what could be redone when something changes after an undo", () => {
    const u = undoStack("a");
    u.record("b");
    u.record("c");
    u.undo();
    u.record("d");
    expect(u.canRedo()).toBe(false);
    expect(u.undo()).toBe("b");
    // typing right after an undo starts a step of its own
    const v = undoStack("a");
    v.record("ab", true, 0);
    v.undo();
    v.record("ax", true, 100);
    expect(v.undo()).toBe("a");
  });

  it("carry more than the text where asked, a change counted by its key", () => {
    const u = undoStack({ text: "a", name: "A" }, { key: (v) => v.text });
    u.record({ text: "a", name: "renamed" });
    expect(u.canUndo()).toBe(false);
    u.record({ text: "b", name: "B" });
    expect(u.undo()).toEqual({ text: "a", name: "A" });
  });

  it("record nothing for the same text, keep a limit, and start again", () => {
    const u = undoStack("a", { limit: 3 });
    u.record("a");
    expect(u.canUndo()).toBe(false);
    for (const t of ["b", "c", "d", "e"]) u.record(t);
    expect(u.undo()).toBe("d");
    expect(u.undo()).toBe("c");
    expect(u.undo()).toBeNull();
    u.reset("z");
    expect(u.canUndo()).toBe(false);
    expect(u.canRedo()).toBe(false);
  });
});
