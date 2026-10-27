// The container cards (layout, swipe): the checks of their configs (pure). They are made per card,
// so their errors name it.
import type { CardConfigBase } from "../ha.ts";

export const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

export const checks = (card: string) => {
  const err = (msg: string) => new Error(`${card}: ${msg}`);

  const pickOf = <T extends string>(list: readonly T[], v: unknown, at: string): T => {
    if (typeof v === "string" && (list as readonly string[]).includes(v)) return v as T;
    throw err(`'${at}' must be one of ${list.join(", ")}`);
  };
  const int = (v: unknown, at: string, min: number, max = Infinity) => {
    if (typeof v !== "number" || !Number.isInteger(v) || v < min || v > max)
      throw err(
        `'${at}' must be a whole number${max === Infinity ? ` of at least ${min}` : ` from ${min} to ${max}`}`,
      );
    return v;
  };
  // the child cards: a list of configs, each with a type
  const cardList = (v: unknown): CardConfigBase[] => {
    const cards = v ?? [];
    if (!Array.isArray(cards)) throw err("'cards' must be a list of card configs");
    cards.forEach((c, i) => {
      if (!isObj(c) || typeof c.type !== "string" || !c.type)
        throw err(`cards[${i}] must be a card config with a 'type'`);
    });
    return cards as CardConfigBase[];
  };

  return { err, pickOf, int, cardList };
};
