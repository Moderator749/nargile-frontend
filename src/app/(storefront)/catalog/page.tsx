import type { Metadata } from "next";

import { CatalogScreen } from "@/components/catalog/CatalogScreen";
import { getBrands, getCategories, getPublicProducts } from "@/lib/server/catalog";
import { pageMetadata } from "@/lib/seo";
import { DEFAULT_DESCRIPTION } from "@/lib/site";

// Re-render the public catalog at most every 5 minutes (matches CATALOG_REVALIDATE).
export const revalidate = 300;

const TITLE = "Endüstriyel Nargile & Toptan Çözümler";

// One canonical for the catalog whatever the query string says: a search
// (?q=…) or a filter is the same page to a crawler, never a page of its own.
export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ title: `Katalog — ${TITLE}`, description: DEFAULT_DESCRIPTION, href: "/catalog" });
}

export default async function CatalogPage() {
  const [categories, products, brands] = await Promise.all([
    getCategories(),
    getPublicProducts(),
    getBrands(),
  ]);

  return (
    <CatalogScreen
      title={TITLE}
      breadcrumbs={[
        { name: "Ana Sayfa", href: "/" },
        { name: "Katalog", href: "/catalog" },
      ]}
      categories={categories ?? []}
      activeCategory={null}
      products={products}
      brands={brands ?? []}
    />
  );
}
