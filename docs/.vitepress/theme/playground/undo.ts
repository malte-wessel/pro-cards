// The Playground's undo and redo (pure): the card's YAML as it was after each change. A visual
// edit, an example opened or the grid size set is one step; typing in the YAML is one step while
// it goes on (keys less than `mergeMs` apart), so an undo takes back what was typed since the
// last pause. A change after an undo drops what could have been redone. Kept in memory only. A
// step may carry more than the text (the card's name with it): `key` says what counts as a change.
export interface UndoStack<T> {
  // the card now, after a change: `typing` when it was typed in the YAML
  record(value: T, typing?: boolean, now?: number): void;
  // the card to go back or forward to, or null where there is none
  undo(): T | null;
  redo(): T | null;
  canUndo(): boolean;
  canRedo(): boolean;
  // a history that starts at this card (the one the page opened with)
  reset(value: T): void;
}

export const undoStack = <T = string>(
  first: T,
  {
    limit = 100,
    mergeMs = 800,
    key = (v: T) => v as unknown,
  }: { limit?: number; mergeMs?: number; key?: (v: T) => unknown } = {},
): UndoStack<T> => {
  let entries = [first];
  let at = 0;
  // the last change: typed, and when (a key soon after it joins its step)
  let lastTyped = false;
  let lastAt = -Infinity;
  return {
    record(value, typing = false, now = Date.now()) {
      if (key(value) === key(entries[at])) return;
      entries = entries.slice(0, at + 1);
      if (typing && lastTyped && at > 0 && now - lastAt < mergeMs) entries[at] = value;
      else {
        entries.push(value);
        if (entries.length > limit) entries = entries.slice(entries.length - limit);
        at = entries.length - 1;
      }
      lastTyped = typing;
      lastAt = now;
    },
    undo() {
      if (at === 0) return null;
      lastTyped = false;
      return entries[--at];
    },
    redo() {
      if (at === entries.length - 1) return null;
      lastTyped = false;
      return entries[++at];
    },
    canUndo: () => at > 0,
    canRedo: () => at < entries.length - 1,
    reset(value) {
      entries = [value];
      at = 0;
      lastTyped = false;
    },
  };
};
