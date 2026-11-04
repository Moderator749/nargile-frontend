/**
 * The category hierarchy, three levels at most — Ana grup > Alt kategori >
 * Alt-alt kategori, as the backend enforces (app.services.categories) — kept
 * free of React and icons so it can be tested on its own. Generic, so the
 * storefront's categories and the panel's (with their counts) both fit.
 */

export const MAX_CATEGORY_DEPTH = 3;

export interface TreeCategory {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  sort_order?: number;
  product_count?: number;
}

export type TreeNode<T> = T & { children: TreeNode<T>[] };

const bySortThenName = (a: TreeCategory, b: TreeCategory) =>
  (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, "tr");

/** The tree: top-level groups, each with its subcategories (and theirs), in menu order. */
export function categoryTree<T extends TreeCategory>(categories: readonly T[]): TreeNode<T>[] {
  const children = new Map<number, T[]>();
  for (const c of categories) {
    if (c.parent_id !== null) children.set(c.parent_id, [...(children.get(c.parent_id) ?? []), c]);
  }
  // `seen`: a loop in the data (never written by the panel) ends rather than recursing for ever.
  const build = (c: T, seen: ReadonlySet<number>): TreeNode<T> => ({
    ...c,
    children: (children.get(c.id) ?? [])
      .filter((x) => !seen.has(x.id))
      .sort(bySortThenName)
      .map((x) => build(x, new Set([...seen, x.id]))),
  });
  return categories
    .filter((c) => c.parent_id === null)
    .sort(bySortThenName)
    .map((c) => build(c, new Set([c.id])));
}

export interface FlatCategory<T> {
  category: TreeNode<T>;
  /** 0 for a group, 1 for its subcategory, 2 below that. */
  depth: number;
}

/** The tree as one list in menu order, each with its depth: what a <select> or an indented list shows. */
export function flattenTree<T>(tree: readonly TreeNode<T>[], depth = 0): FlatCategory<T>[] {
  return tree.flatMap((category) => [{ category, depth }, ...flattenTree(category.children, depth + 1)]);
}

/** The categories above this one, the group first: what a breadcrumb walks. */
export function ancestorsOf<T extends TreeCategory>(category: TreeCategory | null | undefined, categories: readonly T[]): T[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const out: T[] = [];
  const seen = new Set<number>(category ? [category.id] : []);
  for (let up = category?.parent_id ?? null; up !== null && !seen.has(up); ) {
    const parent = byId.get(up);
    if (!parent) break;
    out.unshift(parent);
    seen.add(up);
    up = parent.parent_id;
  }
  return out;
}

/** The top-level group a category belongs to (itself, when it is one). */
export const rootOf = <T extends TreeCategory>(category: T, categories: readonly T[]): T =>
  ancestorsOf(category, categories)[0] ?? category;

/** This category's id and every id below it. */
export function subtreeIds(id: number, categories: readonly TreeCategory[]): number[] {
  const out = [id];
  for (let i = 0; i < out.length; i++) {
    for (const c of categories) if (c.parent_id === out[i] && !out.includes(c.id)) out.push(c.id);
  }
  return out;
}

/** "Nargile Takımları › Oduman Nargile › Oduman Lüleler". */
export const pathOf = (category: TreeCategory, categories: readonly TreeCategory[]) =>
  [...ancestorsOf(category, categories), category].map((c) => c.name).join(" › ");

/** Levels from this category down to its deepest descendant: 1 for a leaf. */
function heightOf(id: number, categories: readonly TreeCategory[], seen: ReadonlySet<number> = new Set()): number {
  const below = categories
    .filter((c) => c.parent_id === id && !seen.has(c.id))
    .map((c) => heightOf(c.id, categories, new Set([...seen, id])));
  return 1 + Math.max(0, ...below);
}

/**
 * Whether `categoryId` (null: a new one) may go under `parentId`: never under
 * itself or its own branch, and never deeper than three levels, counting what
 * it brings along — the backend's rule, so the form offers only what it takes.
 */
export function canPlaceUnder(categoryId: number | null, parentId: number, categories: readonly TreeCategory[]): boolean {
  const parent = categories.find((c) => c.id === parentId);
  if (!parent) return false;
  const above = ancestorsOf(parent, categories);
  if (categoryId !== null && (parentId === categoryId || above.some((c) => c.id === categoryId))) return false;
  const brought = categoryId === null ? 1 : heightOf(categoryId, categories);
  return above.length + 1 + brought <= MAX_CATEGORY_DEPTH;
}

/** A group and the subcategories of it that list something, for the row under a category's heading. */
export interface CategoryFamily<T extends TreeCategory = TreeCategory> {
  group: T;
  members: T[];
}

/**
 * The row of chips under a category's heading. A category whose own
 * subcategories list something leads on to them, "Tümü" being itself
 * ("Oduman Nargile" → its bowls, its hoses); one without leads on to its
 * neighbours, "Tümü" being its parent. Null when there is neither.
 */
export function categoryFamily<T extends TreeCategory>(category: T, categories: readonly T[]): CategoryFamily<T> | null {
  const stockedUnder = (id: number) =>
    categories.filter((c) => c.parent_id === id && (c.product_count ?? 0) > 0).sort(bySortThenName);
  const own = stockedUnder(category.id);
  if (own.length > 0) return { group: category, members: own };
  const parent = category.parent_id !== null ? categories.find((c) => c.id === category.parent_id) : undefined;
  if (!parent) return null;
  const members = stockedUnder(parent.id);
  return members.length > 0 ? { group: parent, members } : null;
}
