import { SimilarProducts } from "@/components/product/SimilarProducts";
import { getPublicProducts } from "@/lib/server/catalog";
import { ALTERNATIVES_MIN, PREFERRED_SHELVES, needsAlternatives, pickAlternatives } from "@/lib/stockAlternatives";
import type { CatalogProduct, Category } from "@/types";

/**
 * The alternatives for `category`'s page, or [] when it has enough to sell or
 * too little to offer. Server-side, from the same cached listings as the
 * shelves themselves.
 */
async function loadAlternatives(
  category: Category,
  categories: Category[],
  products: CatalogProduct[] | null,
): Promise<{ products: CatalogProduct[]; more: Category | null }> {
  const none = { products: [], more: null };
  if (!products || !needsAlternatives(products)) return none;
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const parent = categories.find((c) => c.id === category.parent_id) ?? null;
  const shelves = [
    ...(PREFERRED_SHELVES[category.slug] ?? []).map((slug) => bySlug.get(slug)).filter((c): c is Category => !!c),
    ...(parent ? [parent] : []),
  ];
  if (shelves.length === 0) return none;
  const pools = await Promise.all(shelves.map((c) => getPublicProducts(c.slug)));
  const picked = pickAlternatives(products, pools.map((p) => p ?? []));
  return picked.length >= ALTERNATIVES_MIN ? { products: picked, more: shelves[0] } : none;
}

/**
 * "Stokta Benzer Alternatifler" under a shelf that is in effect sold out (see
 * lib/stockAlternatives): the same cards as "Benzer Ürünler", re-priced for a
 * signed-in viewer, with a link to the shelf they mostly come from. Renders
 * nothing on every other shelf.
 */
export async function InStockAlternatives({
  category,
  categories,
  products,
}: {
  category: Category;
  categories: Category[];
  products: CatalogProduct[] | null;
}) {
  const { products: picked, more } = await loadAlternatives(category, categories, products);
  if (picked.length === 0 || !more) return null;
  return (
    <SimilarProducts
      id="in-stock-alternatives-heading"
      titleKey="inStockAlternatives"
      listName={`Kategori: ${category.slug} stokta alternatifler`}
      products={picked}
      categories={categories}
      category={more}
    />
  );
}
