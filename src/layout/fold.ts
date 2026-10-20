// Layout Card Pro: which cards fold into the "+N more" row (pure).
import type { Priority } from "./config.ts";

// With more than `max` cards shown, the surplus folds: low-priority cards first, then normal ones,
// each from the end; high-priority cards never fold. Returns per card whether it folds.
export const foldPlan = (
  items: { priority: Priority; shown: boolean }[],
  max: number | null,
): boolean[] => {
  const folded = items.map(() => false);
  if (max === null) return folded;
  let surplus = items.filter((i) => i.shown).length - max;
  for (const prio of ["low", "normal"] as const)
    for (let i = items.length - 1; i >= 0 && surplus > 0; i--)
      if (items[i].shown && items[i].priority === prio) {
        folded[i] = true;
        surplus--;
      }
  return folded;
};
