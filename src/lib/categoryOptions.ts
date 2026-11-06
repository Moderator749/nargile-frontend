/*
 * A category picker's lines, narrowed by what was typed without losing the
 * tree: a category that matches comes with the groups above it, so "fol"
 * reads "Nargile Malzemeleri › Sarf Malzemeleri › Folyolar" as three indented
 * lines, not one loose "Folyolar". Free of React and of other modules (the
 * folding comes in as `fold`), so `npm test` reads it as it is.
 */

/** One line of the picker, in the menu's order (see `flattenTree`). */
export interface CategoryOption {
  id: number;
  name: string;
  /** 0 for a top category, 1 below it, 2 below that. */
  depth: number;
  /** The ids above it, top first. */
  ancestorIds: number[];
  /** Off = hidden from the storefront; still a category products can be in. */
  active: boolean;
}

export interface CategoryLine {
  option: CategoryOption;
  /**
   * "match": its own name has what was typed; "below": a group above it
   * does (typing a group brings its shelves); "context": only shown so a
   * match below it keeps its place in the tree.
   */
  kind: "match" | "below" | "context";
  /** Where in the name the typed text is, for marking it; null when it is not in the name. */
  mark: [start: number, end: number] | null;
}

/**
 * The lines for `query`: every option when it is empty; otherwise each that
 * matches by its own name or a group's above it, plus the groups above every
 * such one, in the tree's order. `fold` is the search folding (foldSearch:
 * Turkish letters to ASCII, lowercased; one character for one, so a position
 * in the folded name is the same position in the name).
 */
export function narrowCategories(
  options: readonly CategoryOption[],
  query: string,
  fold: (text: string) => string,
): CategoryLine[] {
  const q = fold(query.trim());
  if (!q) return options.map((option) => ({ option, kind: "match", mark: null }));
  const byId = new Map(options.map((o) => [o.id, o]));
  const at = new Map(options.map((o) => [o.id, fold(o.name).indexOf(q)]));
  const kindOf = new Map<number, CategoryLine["kind"]>();
  for (const o of options) {
    if ((at.get(o.id) ?? -1) >= 0) kindOf.set(o.id, "match");
    else if (o.ancestorIds.some((a) => (at.get(a) ?? -1) >= 0)) kindOf.set(o.id, "below");
  }
  for (const [id] of [...kindOf]) {
    for (const a of byId.get(id)?.ancestorIds ?? []) if (!kindOf.has(a)) kindOf.set(a, "context");
  }
  return options
    .filter((o) => kindOf.has(o.id))
    .map((option) => {
      const start = at.get(option.id) ?? -1;
      return { option, kind: kindOf.get(option.id)!, mark: start >= 0 ? [start, start + q.length] : null };
    });
}
