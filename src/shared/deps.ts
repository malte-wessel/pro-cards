// Whether what a piece of the card is drawn from changed since it was last drawn: the renderers
// skip a row, a plot or a section whose inputs are the same, so a state change redraws only what
// it touches. A WeakMap per use: an element that is gone takes its entry with it.

// whether `deps` differ (Object.is, element by element) from the ones last stored for `key`;
// stores them
export const depsChanged = (
  store: WeakMap<object, readonly unknown[]>,
  key: object,
  deps: readonly unknown[],
): boolean => {
  const prev = store.get(key);
  store.set(key, deps);
  if (!prev || prev.length !== deps.length) return true;
  for (let i = 0; i < deps.length; i++) if (!Object.is(prev[i], deps[i])) return true;
  return false;
};
