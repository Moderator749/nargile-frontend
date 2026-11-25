/* The access rules' pure helpers, apart from the API client so `npm test` reads them. */

export interface AccessOption {
  id: number;
  name: string;
  parent_id: number | null;
  is_active: boolean;
}

/** A storefront path as the rules keep it: "/TR/Kampanyalar/" → "/kampanyalar". Mirrors the server's `normalize_route`. */
export function normalizeRoute(raw: string): string {
  const path = raw.split("?")[0].split("#")[0].trim().toLowerCase();
  let parts = path.split("/").filter(Boolean);
  if (parts[0] === "tr" || parts[0] === "en" || parts[0] === "ar") parts = parts.slice(1);
  return "/" + parts.join("/");
}

/** Whether a rule for `rule` covers `path` (itself, or a page under it). */
export function routeCovers(rule: string, path: string): boolean {
  const r = normalizeRoute(rule);
  const p = normalizeRoute(path);
  return r !== "/" && (p === r || p.startsWith(`${r}/`));
}

/** Categories in tree order, each with its depth, for an indented list. */
export function categoryTree(options: AccessOption[]): (AccessOption & { depth: number })[] {
  const children = new Map<number | null, AccessOption[]>();
  for (const o of options) {
    const key = o.parent_id ?? null;
    children.set(key, [...(children.get(key) ?? []), o]);
  }
  const known = new Set(options.map((o) => o.id));
  const out: (AccessOption & { depth: number })[] = [];
  const seen = new Set<number>();
  const walk = (parent: number | null, depth: number) => {
    for (const o of children.get(parent) ?? []) {
      if (seen.has(o.id)) continue;
      seen.add(o.id);
      out.push({ ...o, depth });
      walk(o.id, depth + 1);
    }
  };
  walk(null, 0);
  // An orphan (its parent missing) still gets listed, at the top level.
  for (const o of options) if (!seen.has(o.id) && !known.has(o.parent_id ?? -1)) {
    seen.add(o.id);
    out.push({ ...o, depth: 0 });
    walk(o.id, 1);
  }
  return out;
}

/** The same set, order aside: whether an editor holds unsaved changes. */
export function sameRules(
  a: { category_ids: number[]; brand_ids: number[]; routes: string[] },
  b: { category_ids: number[]; brand_ids: number[]; routes: string[] },
): boolean {
  const key = (r: typeof a) =>
    JSON.stringify([[...r.category_ids].sort((x, y) => x - y), [...r.brand_ids].sort((x, y) => x - y), [...r.routes].sort()]);
  return key(a) === key(b);
}

/** A customer as a picker lists them: the firm's title first, then the name, then the e-mail. */
export function customerLabel(c: { company_title?: string | null; full_name?: string | null; email: string }): string {
  return c.company_title || c.full_name || c.email;
}

// ── Bulk actions ("Tümünü Kısıtla", "Tümünü Kaldır", a column's "Tümü / Temizle") ──

export interface RuleSet {
  category_ids: number[];
  brand_ids: number[];
  routes: string[];
}

/**
 * Every category closed: the top of each branch is enough — a ticked category
 * hides everything under it — so only roots are listed (an orphan, its parent
 * missing, counts as one). Roots the group already closes (`inherited`, on a
 * customer's tab) are left to it.
 */
export function allCategories(options: AccessOption[], inherited: number[] = []): number[] {
  const known = new Set(options.map((o) => o.id));
  return options
    .filter((o) => o.parent_id === null || !known.has(o.parent_id))
    .map((o) => o.id)
    .filter((id) => !inherited.includes(id));
}

/** Every brand closed, but those the group already closes. */
export function allBrands(options: AccessOption[], inherited: number[] = []): number[] {
  return options.map((o) => o.id).filter((id) => !inherited.includes(id));
}

/** The quick-select pages added to what is there (a typed page stays), but those the group already closes. */
export function allRoutes(current: string[], quick: readonly string[], inherited: string[] = []): string[] {
  const out = [...current];
  for (const path of quick) if (!out.includes(path) && !inherited.includes(path)) out.push(path);
  return out;
}

/** "Tümünü Kısıtla": every category, every brand, every quick-select page — the group's own left to it. */
export function restrictAll(
  current: RuleSet,
  categories: AccessOption[],
  brands: AccessOption[],
  quick: readonly string[],
  inherited?: RuleSet,
): RuleSet {
  return {
    category_ids: allCategories(categories, inherited?.category_ids),
    brand_ids: allBrands(brands, inherited?.brand_ids),
    routes: allRoutes(current.routes, quick, inherited?.routes),
  };
}

/** "Tümünü Kaldır": this set emptied. A customer's group rules are not in it, so they stay. */
export const clearAll = (): RuleSet => ({ category_ids: [], brand_ids: [], routes: [] });
