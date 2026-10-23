/**
 * An order the user arranged (kept in their browser) applied to today's
 * list: what is no longer on the list is dropped, what repeats counts once,
 * and an item the list has gained since it was saved takes its default
 * place — straight before the item it comes before by default, or last when
 * nothing follows it — so a saved order never hides or breaks anything.
 *
 * No path aliases here: `npm test` imports this file as it is.
 */
export function applySavedOrder<T extends string>(defaults: readonly T[], saved: readonly string[] | null | undefined): T[] {
  const known = new Set<string>(defaults);
  const order = [...new Set(saved ?? [])].filter((id): id is T => known.has(id));
  defaults.forEach((id, i) => {
    if (order.includes(id)) return;
    const next = defaults.slice(i + 1).find((later) => order.includes(later));
    order.splice(next ? order.indexOf(next) : order.length, 0, id);
  });
  return order;
}

/** Whether an order is the default one, item for item. */
export const isDefaultOrder = (defaults: readonly string[], order: readonly string[]) =>
  defaults.length === order.length && defaults.every((id, i) => order[i] === id);
